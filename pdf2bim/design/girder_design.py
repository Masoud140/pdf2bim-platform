"""Super-T girder ULS flexure along the girder (P4.5 stage 5c). kN, kN m.

    from pdf2bim.design.girder_design import flexure_along
    out = flexure_along(doc, geo, S, CA, std, girder="G2", allow_proposed=False)

For every P2 station of the girder with an open section (solid end zones excluded):
- the design section (pdf2bim.design.stations) with each bonded strand's EFFECTIVE prestrain from the prestress-loss
  analysis at that position and the last reported time (pdf2bim.design.prestress, inputs from
  pdf2bim.design.prestress_inputs); fpb = MBL / area from AS5100.5:strand:table_3_3_1 when materials.strand.fpb is empty;
- the design actions: the ULS sagging maximum and hogging minimum of the composite girder, interpolated linearly
  between the two girder element ends that bracket the station (combined_actions envelopes; the governing row of the
  nearer end is reported);
- phi Mu (pdf2bim.design.flexure.uls_bend) and the utilisation M* / phi Mu (sagging).
NOT included yet (stage 6): staged SLS stresses, cracking moment / minimum strength, hogging capacity, shear and torsion
(fitments missing in the example description), strand development in the transmission zone. Results are INDICATIVE: inputs Assumed,
standards values unverified, strand / bar layout a placeholder (D-1).
"""
import math
import numpy as np
from ..description import MissingInput
from .stations import station_section
from .flexure import uls_bend
from .prestress import run as hog_run, strand_forces_at
from .prestress_inputs import hog_inputs


def _element_ends(CA, mdl, geo, girder):
    """[(distance from girder end A along the chord (m), response index of M (end), (line, eid), end)] for the girder."""
    gg = next(g for g in geo["girders"] if g["id"] == girder)
    E0 = np.array([gg["end_A"]["E"], gg["end_A"]["N"]]); u = np.array(gg["unit_t"])
    m = mdl["model"]
    ix = {n: i for i, n in enumerate(CA["names"])}
    out = []
    for x in mdl["members"]:
        if x["role"] != "girder" or x["line"] != girder:
            continue
        for end, nid in ((1, x["n1"]), (2, x["n2"])):
            d = float((np.asarray(m.nodes[nid][:2]) - E0) @ u)
            out.append((d, ix[("G", (girder, x["id"]), f"M{end}")], (girder, x["id"]), end))
    return out


def flexure_along(doc, geo, S, CA, mdl, std, girder, allow_proposed=False, time=None):
    H = hog_inputs(doc, geo, S, girder, std, allow_proposed)
    p = H["p"]
    r = hog_run(p, std)
    Lm = p["L"] / 1000.0
    ends = _element_ends(CA, mdl, geo, girder)
    E = CA["envelopes"]["ULS"]
    fpb_tab = p["mbl"] * 1e3 / p["Ap"]
    rows, notes = [], []
    for st_row in S["girders"][girder]["stations"]:
        t = st_row["t"]
        st = station_section(doc, geo, S, girder, t, allow_proposed)
        if st["conf"] != "open":
            continue
        sec = st["section"]
        F = strand_forces_at(r, st["x_m"] * 1000.0, time)
        ok = True
        for td in sec.tend:
            Fk = F[td["k_on"]]
            if Fk <= 0:
                ok = False
            td["epe"] = Fk * 1e3 / (td["A"] * td["E"]) if Fk > 0 else 0.0
            if td.get("fpb") is None:
                td["fpb"] = fpb_tab
        sec.tend = [td for td in sec.tend if td["epe"] > 0]          # strands without force here (debonded / not yet transmitted) carry nothing
        u = uls_bend(sec, std)
        x0 = st["x_m"]
        lo = max((q for q in ends if q[0] <= x0), key=lambda q: q[0], default=None)
        hi = min((q for q in ends if q[0] >= x0), key=lambda q: q[0], default=None)
        lo, hi = lo or hi, hi or lo
        w = 0.0 if hi[0] == lo[0] else (x0 - lo[0]) / (hi[0] - lo[0])
        Ms = float((1 - w) * E["max"][lo[1]] + w * E["max"][hi[1]]); Mh = float((1 - w) * E["min"][lo[1]] + w * E["min"][hi[1]])
        near = lo if w < 0.5 else hi
        rows.append({"t": t, "x_m": x0, "element": near[2][1], "end": near[3], "bracket_m": [lo[0], hi[0]], "dist_to_station_m": abs(near[0] - x0),
                     "M_sag": Ms, "row_sag": E["gmax"][near[1]], "M_hog": Mh, "row_hog": E["gmin"][near[1]],
                     "phiMu": u["phiMu"], "Mu": u["Mu"], "phi": u["phi"], "dn": u["dn"], "kuo": u["kuo"], "n_strands": len(sec.tend),
                     "sigma_pe_mean": float(np.mean([td["epe"] * td["E"] for td in sec.tend])) if sec.tend else 0.0,
                     "u_sag": Ms / u["phiMu"] if u["phiMu"] > 0 else math.inf})
    if not rows:
        raise MissingInput(f"girder {girder}: no open-section station")
    if p.get("mbl") and (doc.get("materials") or {}).get("strand"):
        notes.append(f"fpb = MBL / area = {fpb_tab:.0f} MPa from AS5100.5:strand:table_3_3_1 (materials.strand.fpb empty)")
    return {"girder": girder, "rows": rows, "time_days": r["res"][-1]["t"] if time is None else time, "hog_method": r["method"],
            "notes": notes + ["sagging only; hogging capacity, SLS staged stresses, minimum strength, shear / torsion and strand development not yet checked"],
            "provisional": H["provisional"], "standards_status": std.result_status()}


def _option(doc, item, default):
    for r in ((doc.get("design") or {}).get("girder_options") or {}).get("rows") or []:
        c = r.get("cells") or {}
        if c.get("item") == item:
            v = str(c.get("value")).strip().strip('"').lower()
            return v in ("true", "1", "yes")
    return default


def checks_along(doc, geo, S, CA, mdl, std, girder, allow_proposed=False, time=None, stations=None):
    """P4.5 stage 6: staged SLS stresses, decompression / allowable / cracking moments, minimum strength and ULS bending
    (pdf2bim.design.girder_sls.staged) at every open-section station of the girder.

    Actions per station (kN m, kN), interpolated between the girder element ends bracketing the station:
    - Mnc: girder self weight + wet deck as the simple-span moments of the losses analysis (girder alone on its
      bearings: the loads w = rho A and wd that the losses analysis uses), times the SLS factor of DLc;
    - Ms (sagging max / hogging min) and Ns: the AS 5100.2 SLS envelope with DLc removed (DLc acts on the girder alone,
      above); Ns the concurrent axial force of the governing SLS row at the nearer element end (design option useN);
    - Mu, Nu: the ULS envelope (DLc included: total moment on the composite model) and the concurrent axial force.
    Free strains on the composite section (stage 7; the dashboard's dgFreeFor): the temperature-gradient primary
    strain alpha (f_TGP T_P(y) + f_TGN T_N(y)) with the factors of the governing SLS row (the profiles and alpha of
    loads.gradient_* / loads.temperature, as the thermal cases), and the deck differential shrinkage
    eps = -(sd - sg) / (1 + chi phd) of the losses analysis (detailed method; design option dsh, default on as the
    dashboard). The secondary (restraint) actions of the gradient are in the envelopes already. Results INDICATIVE as
    flexure_along."""
    from .girder_sls import staged, crack_limits, prof_at
    from .prestress import stage_moments_at, differential_shrinkage
    from .girder_shear import box_params, box_geometry, solid_end_geometry, shear_inputs
    from .shear import shear as shear_check
    from ..model.combinations import combine, concurrent_row
    H = hog_inputs(doc, geo, S, girder, std, allow_proposed)
    p = H["p"]
    r = hog_run(p, std)
    ends = _element_ends(CA, mdl, geo, girder)
    prim = CA["primitives"]["prim"]
    rows = CA["rows"]
    if "_sls_nodl" not in CA:
        P2 = dict(prim); P2["DLc"] = {"s": np.zeros_like(np.asarray(prim["DLc"]["s"], float))}
        CA["_sls_nodl"] = combine(rows, P2)["SLS"]
    E_s, E_u = CA["_sls_nodl"], CA["envelopes"]["ULS"]
    fS = std.get("AS5100.2:load_factor:DLc").value["sls"]
    useN = _option(doc, "useN", True)
    ix = {n: i for i, n in enumerate(CA["names"])}
    byname = {q["name"]: q for q in rows}
    fpb_tab = p["mbl"] * 1e3 / p["Ap"]
    out, notes = [], []
    th = CA["primitives"]["cases"]["thermal"]["inputs"]
    alpha, prof = th["temperature"]["alpha"], th["profiles"]
    use_dsh = _option(doc, "dsh", True)
    dsh = differential_shrinkage(r, time) if use_dsh else None
    eps_sh = dsh["eps"] if dsh else 0.0

    def free_for(rowname):
        row = byname.get(rowname)
        fP = sum(f for aid, f in (row or {}).get("t", []) if aid == "TGP")
        fN = sum(f for aid, f in (row or {}).get("t", []) if aid == "TGN")
        T = (lambda y: alpha * (fP * prof_at(prof.get("TGP"), y) + fN * prof_at(prof.get("TGN"), y))) if (fP or fN) else None
        return ({"T": T, "sh": eps_sh} if (T or eps_sh) else None), {"TGP": fP, "TGN": fN}

    # shear / torsion inputs (P4.5 stage 8): fitments along the girder, covers, aggregate, closed-tie legs, steel properties
    sup = doc.get("superstructure") or {}
    rd_ = __import__("pdf2bim.description", fromlist=["Reader"]).Reader(doc, allow_proposed)
    mem = next(x for x in sup.get("members") or [] if x["id"] == girder)
    T_ = next(x for x in sup.get("supert_types") or [] if x["id"] == rd_.value(mem.get("type_ref"), "type_ref"))
    fits = rd_.rows(T_.get("fitments"), "fitments", required=False)
    opts = {}
    for r_ in rd_.rows((doc.get("design") or {}).get("girder_options"), "design.girder_options", required=False):
        opts[r_.get("item")] = r_.get("value")
    bm = rd_.rows((doc.get("materials") or {}).get("reinforcement"), "materials.reinforcement", required=False)
    sm = rd_.rows((doc.get("materials") or {}).get("strand"), "materials.strand", required=False)
    need = [k for k in ("fitment_cover_side", "fitment_cover_top", "aggregate_size") if opts.get(k) in (None, "")]
    shear_why = None
    if not fits:
        shear_why = "fitments missing"
    elif need:
        shear_why = "design.girder_options missing: " + ", ".join(need)
    elif not bm or not sm:
        shear_why = "materials.reinforcement / materials.strand missing"
    Pbox = box_params(S["girders"][girder]["params"]) if shear_why is None else None
    Pbox_solid = S["girders"][girder]["params"] if shear_why is None else None  # for solid_end_geometry (Assumed, ADR-039)

    def interp(E, k, lo, hi, w):
        return float((1 - w) * E[k][lo[1]] + w * E[k][hi[1]])

    def conc_N(rowname, near, which):
        if not useN or rowname is None:
            return 0.0
        iN = ix[("G", near[2], f"N{near[3]}")]
        v = concurrent_row(prim, byname[rowname], near[1], which)["v"]
        return float(np.asarray(v)[iN]) if not np.isscalar(v) else 0.0
    for st_row in S["girders"][girder]["stations"]:
        t = st_row["t"]
        if stations is not None and t not in stations:
            continue
        st = station_section(doc, geo, S, girder, t, allow_proposed)
        if st["conf"] not in ("open", "solid"):
            continue
        sec = st["section"]
        F = strand_forces_at(r, st["x_m"] * 1000.0, time)
        for td in sec.tend:
            td["sp"] = F[td["k_on"]] * 1e3 / td["A"]
            if td.get("fpb") is None:
                td["fpb"] = fpb_tab
        sec.tend = [td for td in sec.tend if td["sp"] > 0]
        x0 = st["x_m"]
        lo = max((q for q in ends if q[0] <= x0), key=lambda q: q[0], default=None)
        hi = min((q for q in ends if q[0] >= x0), key=lambda q: q[0], default=None)
        lo, hi = lo or hi, hi or lo
        w = 0.0 if hi[0] == lo[0] else (x0 - lo[0]) / (hi[0] - lo[0])
        near = lo if w < 0.5 else hi
        SM = stage_moments_at(r, x0 * 1000.0)
        Mnc = fS * (SM["Msw"] + SM["Mwet"])
        mt = st["materials"]
        lv = {"y_deck_bot": S["deck_thickness"], "y_gir_top": st["y_girder_top"], "Dtot": st["Dtot"], "Eg": mt["E_girder"], "Ed": mt["E_deck"], "fcg": mt["fc_girder"], "fcd": mt["fc_deck"]}
        lim = crack_limits(sec, std)
        res = {"t": t, "x_m": x0, "conf": st["conf"], "element": near[2][1], "end": near[3], "n_strands": len(sec.tend), "Mnc": Mnc, "limits": lim}
        if st["conf"] == "open":
            for side, Es_k, Eu_k, which in (("sag", "max", "max", "max"), ("hog", "min", "min", "min")):
                Ms = interp(E_s, Es_k, lo, hi, w); Mu = interp(E_u, Eu_k, lo, hi, w)
                gs = E_s["g" + Es_k][near[1]]; gu = E_u["g" + Eu_k][near[1]]
                Ns = conc_N(gs, near, which); Nu = conc_N(gu, near, which)
                fr, ff = free_for(gs)
                o = staged(sec, lv, Mnc, Ms, Ns, Mu, Nu, std, lim["fscr"], lim["ftcr"], lim["fscrT"], free=fr, why=lim["why"])
                res[side] = {"Ms": Ms, "Ns": Ns, "row_sls": gs, "Mu": Mu, "Nu": Nu, "row_uls": gu, "free": {"gradient_factors": ff, "eps_dsh": eps_sh if fr else 0.0},
                             **{k: o.get(k) for k in ("Mdec", "Mal", "MdecT", "MalT", "uS", "uST", "uncracked", "okS", "Mcr", "McrH", "Muo", "Muo_min", "okMin",
                                                      "phiMu", "phi", "kuo", "uB", "face", "Nub")},
                             "soffit_sls": o["sv"]["girBot"], "deck_top_sls": o["sv"]["deckTop"], "girder_alone": {"top": o["girder_alone"]["top"], "bot": o["girder_alone"]["bot"]},
                             "dsb_at_Ms": o["inc"]["b"], "dsp_at_Ms": o["inc"]["t"], "_pre0": o["tend_pre0"]}
        else:
            # solid end zone: SLS/flexure checks not applicable (strand development, full section not composite in the usual sense)
            res["sag"] = {"_pre0": [td.get("sp", 0.0) / (td["E"] if td["E"] else 1.0) for td in sec.tend]}
            res["hog"] = {}
        # shear and torsion at the station: the governing |V*| row at the nearer element end, concurrent T*, M*, N*
        if shear_why is None:
            fr_ = [f for f in fits if f.get("from") is not None and f["from"] - 1e-9 <= x0 <= f["to"] + 1e-9]
            if not fr_:
                res["shear"] = {"why": f"no fitment row covers x = {x0:.2f} m"}
            else:
                fr0 = fr_[0]
                tl = int(float(opts.get("torsion_tie_legs") or 0))
                fit = {"d": float(fr0["diameter"]), "legs": int(fr0["legs"]), "s": float(fr0["spacing"]), "tie_d": float(fr0["diameter"]), "tie_legs": tl,
                       "tie_s": float(fr0["spacing"]), "fsyf": float(bm[0]["fsy"]), "dg": float(opts["aggregate_size"])}
                if st["conf"] == "solid":
                    # solid end block: use rectangular approximation (Assumed, ADR-039)
                    g_ = solid_end_geometry(Pbox_solid, S["deck_thickness"], st["y_girder_top"] - S["deck_thickness"],
                                            float(opts["fitment_cover_side"]), float(opts["fitment_cover_top"]), fit["tie_d"])
                else:
                    g_ = box_geometry(Pbox, S["deck_thickness"], st["y_girder_top"] - S["deck_thickness"],
                                      float(opts["fitment_cover_side"]), float(opts["fitment_cover_top"]), fit["tie_d"])
                pre0 = res["sag"].pop("_pre0")
                Q = shear_inputs(sec, g_, lv, fit, {"fsy": float(bm[0]["fsy"]), "Es": float(bm[0]["Es"]), "Ep": float(sm[0]["Ep"])}, pre0)
                iV = ix[("G", near[2], f"V{near[3]}")]
                vmax, vmin = E_u["max"][iV], E_u["min"][iV]
                which = "max" if abs(vmax) >= abs(vmin) else "min"
                rowV = E_u["g" + which][iV]
                cv = np.asarray(concurrent_row(prim, byname[rowV], iV, which)["v"])
                Vs = float(cv[iV]); Ts = float(cv[ix[("G", near[2], f"T{near[3]}")]]); Ms_ = float(cv[ix[("G", near[2], f"M{near[3]}")]])
                Ns_ = float(cv[ix[("G", near[2], f"N{near[3]}")]]) if useN else 0.0
                sh = shear_check(Q, {"V": Vs, "T": Ts, "M": Ms_, "N": Ns_}, std)
                geo_note = "solid-end rectangular approx (ADR-039, Assumed)" if st["conf"] == "solid" else "closed-box (ADR-039, provisional)"
                res["shear"] = {"row": rowV, "V": Vs, "T": Ts, "M": Ms_, "N": Ns_, "fitments": f"N{fit['d']:g} x {fit['legs']} legs @ {fit['s']:g}",
                                "dv": Q["dv"], "bv": Q["bv"], "Ao": Q["Ao"], "geo_note": geo_note,
                                **{k: sh.get(k) for k in ("ex", "th", "kv", "Vuc", "Vus", "Vumax", "Tcr", "uCr", "uV", "uT", "uL", "u", "phiVu", "minV")}}
        else:
            res["shear"] = {"why": shear_why}
        for k_ in ("sag", "hog"):
            res[k_].pop("_pre0", None)
        out.append(res)
    if not out:
        raise MissingInput(f"girder {girder}: no open-section or solid-end station")
    notes.append(f"fpb = MBL / area = {fpb_tab:.0f} MPa from AS5100.5:strand:table_3_3_1 where materials.strand.fpb is empty")
    notes.append("Mnc = simple-span girder self weight + wet deck of the losses analysis; Ms = SLS envelope without DLc")
    notes.append(("deck differential shrinkage free strain %.1f x 1e-6 (losses analysis, detailed method)" % (eps_sh * 1e6)) if dsh else
                 ("deck differential shrinkage not applied (" + ("option dsh off" if not use_dsh else "simplified losses method or no deck stage") + ")"))
    notes.append("temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone")
    notes.append("shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked" if shear_why is None else "shear / torsion not checked: " + shear_why)
    return {"girder": girder, "rows": out, "time_days": r["res"][-1]["t"] if time is None else time, "hog_method": r["method"], "useN": useN, "dsh": dsh,
            "notes": notes, "provisional": H["provisional"], "standards_status": std.result_status()}
