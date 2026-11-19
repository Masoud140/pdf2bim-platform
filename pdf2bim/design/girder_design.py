"""Super-T girder ULS flexure along the girder (P4.5 stage 5c). kN, kN m.

    from pdf2bim.design.girder_design import flexure_along
    out = flexure_along(doc, geo, S, CA, std, girder="G2", allow_proposed=False)

For every P2 station of the girder with an open section (solid end zones excluded):
- the design section (pdf2bim.design.stations) with each bonded strand's EFFECTIVE prestrain from the prestress-loss
  analysis at that position and the last reported time (pdf2bim.design.prestress, inputs from
  pdf2bim.design.prestress_inputs); fpb = MBL / area (materials.strand when the drawings give area and fpb, else AS5100.5:strand:table_3_3_1);
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
        notes.append(f"fpb = MBL / area = {fpb_tab:.0f} MPa (MBL: {H['source'].get('mbl')})")
    return {"girder": girder, "rows": rows, "time_days": r["res"][-1]["t"] if time is None else time, "hog_method": r["method"], "hog": _hog(r),
            "notes": notes + ["sagging only; hogging capacity, SLS staged stresses, minimum strength, shear / torsion and strand development not yet checked"],
            "provisional": H["provisional"], "standards_status": std.result_status()}


def _hog(r):
    """Girder hog (mm, + up) along the girder at each reported time of the losses analysis (transfer, erection, deck, final)."""
    return {"x_m": [round(x / 1000, 3) for x in r["X"]], "times": [{"label": q["label"], "t": q["t"], "hog_mm": [round(v, 2) for v in q["hog"]]} for q in r["res"]]}


def _option(doc, item, default):
    for r in ((doc.get("design") or {}).get("girder_options") or {}).get("rows") or []:
        c = r.get("cells") or {}
        if c.get("item") == item:
            v = str(c.get("value")).strip().strip('"').lower()
            return v in ("true", "1", "yes")
    return default


def _custom(doc, key):
    v = (doc.get("custom") or {}).get(key)
    return v.get("value") if isinstance(v, dict) and "value" in v else v


def pier_hog_uls(sec, pre0, extra_bars, sbars, F_kN, Nu, Mu, std, Eref):
    """Hogging ULS capacity of a section over an interior support (ADR-082 stage 4b): the station section with the
    strands at their decompression prestrain (pre0, from staged), the deck reinforcement over the support (extra_bars)
    and the stress bars carrying a tension force F_kN each at ULS (rigid-plastic: the bar strength is not on the
    drawings, so the check reports the force each bar must develop). N, mm; returns kN m."""
    from .flexure import Section, Coefficients, elastic
    from .nm import mu_at_n
    K = Coefficients(std)
    bars = [dict(b, e0=0.0) for b in sec.bars + extra_bars]
    tend = [dict(t, epe=p0) for t, p0 in zip(sec.tend, pre0)] + [dict(b, fpb=F_kN * 1e3 / b["A"], E=1e9, epe=1.0, bil=True) for b in sbars]
    Su = Section([dict(c, e0=0.0) for c in sec.conc], bars, tend)
    yc = elastic(Section(sec.conc, bars, []), Eref)["yc"]
    r = mu_at_n(Su, std, Nu * 1e3, "bot", yc)
    if not r:
        return None
    pb = K.phi(r["kuo"])
    pc = std.get("AS5100.5:capacity_factor:phi_compression").value
    phi = pb if Nu >= 0 else pc     # shortcut: compression N takes phi_compression (no Nub interpolation here), conservative
    return {"Mu_cap": r["M"] / 1e6, "phi": phi, "phiMu": phi * r["M"] / 1e6, "kuo": r["kuo"], "uB": abs(Mu) / abs(phi * r["M"] / 1e6)}


def _pier_inputs(doc, geo, S, girder, rd):
    """Ends of the girder over the stress-bar support, the stress bars and the deck bars over it (custom.stress_bars /
    custom.pier_deck_bars, Direct from the drawings). {} when the description has no stress bars."""
    sb = _custom(doc, "stress_bars")
    if not sb:
        return {}
    sup = {s_["id"]: s_ for s_ in geo["supports"]}
    if sb["support"] not in sup:
        return {}
    gg = next(g for g in geo["girders"] if g["id"] == girder)
    ch = sup[sb["support"]]["ch"]
    # the girder end on that support: the nearer bearing in chainage (skewed supports: bearing chainages differ across the deck)
    ends = [min(("A", "B"), key=lambda e: abs(gg["bearing_" + e]["ch"] - ch))]
    a = math.pi / 4 * float(sb["diameter_mm"]) ** 2
    sbars = [{"lev": float(lv), "A": a} for lv in sb["levels_below_girder_top_mm"] for _ in sb["offsets_from_girder_cl_mm"]]
    if len(sbars) != int(sb["number_per_girder"]):
        raise MissingInput(f"custom.stress_bars: {len(sbars)} bar positions vs number_per_girder {sb['number_per_girder']}")
    db = _custom(doc, "pier_deck_bars")
    bm = rd.rows((doc.get("materials") or {}).get("reinforcement"), "materials.reinforcement")[0]
    return {"ends": ends, "sbars": sbars, "lockoff_kN": float(sb["max_residual_force_after_lockoff_kN"]), "uts_kN": sb.get("ultimate_tensile_strength_kN"),
            "half_length_m": float(sb["length_mm"]) / 2000.0, "deck": db, "fsy": float(bm["fsy"]), "Es": float(bm["Es"])}


def deck_bars(faces, width, tD, Es, fsy):
    """Deck longitudinal bars over a girder's deck strip (width, mm): faces = [{face top|bot, diameters_mm, spacing_mm,
    cover_mm}] -> design-section bars (y down from the deck top) and a one-line description."""
    out, dsc = [], []
    for f in faces:
        n = int(width // float(f["spacing_mm"])) + 1
        for d in f["diameters_mm"]:
            y = float(f["cover_mm"]) + d / 2 if f["face"] == "top" else tD - float(f["cover_mm"]) - d / 2
            out.append({"y": y, "A": n * math.pi / 4 * d * d, "E": Es, "fsy": fsy, "grp": "deck", "d": d, "n": n})
        dsc.append(f"{f['face']} {n} x ({' + '.join('N%g' % d for d in f['diameters_mm'])}) over {width:.0f} mm")
    return out, dsc


def _pier_hog_station(sec, st, lv, Mnc, std, lim, E_s, E_u, lo, hi, w, near, conc_N, interp, pier, S, girder, t):
    """Hogging ULS at the girder end over the stress-bar support: capacity without the stress bars, at the lock-off
    force, and the force each bar must develop at ULS for M* <= phi Mu (bisection)."""
    from .girder_sls import staged
    Ms = interp(E_s, "min", lo, hi, w); Mu = interp(E_u, "min", lo, hi, w)
    gs, gu = E_s["gmin"][near[1]], E_u["gmin"][near[1]]
    Ns, Nu = conc_N(gs, near, "min"), conc_N(gu, near, "min")
    # strand decompression prestrain from the staged analysis; at the very girder end the strands carry no force yet
    pre0 = staged(sec, lv, Mnc, Ms, Ns, Mu, Nu, std, lim["fscr"], lim["ftcr"], lim["fscrT"], why=lim["why"])["tend_pre0"] if sec.tend else []
    row = S["girders"][girder]["stations"]
    sr = min(row, key=lambda r_: abs(r_["t"] - t))
    width = sr["deck_left"] + sr["deck_right"]                     # mm, the girder's deck strip
    tD, yG = lv["y_deck_bot"], lv["y_gir_top"]
    extra, dsc = deck_bars((pier["deck"] or {}).get("faces") or [], width, tD, pier["Es"], pier["fsy"])
    sb = [{"y": yG + q["lev"], "A": q["A"]} for q in pier["sbars"]]
    cap = lambda F: pier_hog_uls(sec, pre0, extra, sb, F, Nu, Mu, std, lv["Eg"])
    c0, cL = cap(0.0), cap(pier["lockoff_kN"])
    Freq = None
    if c0 and c0["uB"] <= 1:
        Freq = 0.0
    else:
        a_, b_ = 0.0, 20000.0
        cb = cap(b_)
        if cb and cb["uB"] <= 1:
            for _ in range(50):
                m_ = (a_ + b_) / 2
                cm = cap(m_)
                if cm and cm["uB"] <= 1:
                    b_ = m_
                else:
                    a_ = m_
            Freq = b_
    uts = pier["uts_kN"]
    return {"Mu": Mu, "Nu": Nu, "row_uls": gu, "deck_bars": "; ".join(dsc) or "none recorded", "n_stress_bars": len(sb),
            "no_bars": c0, "at_lockoff": cL, "F_required_kN": Freq, "lockoff_kN": pier["lockoff_kN"], "uts_kN": uts,
            "ok": None if (Freq is None or uts in (None, "")) else Freq <= float(uts),
            "why": None if uts not in (None, "") else "stress bar ultimate tensile strength not on the drawings (Missing - Flagged): compare F_required with the bar supplier's UTS"}


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
    from .prestress_checks import _development, strand_stress_cap
    dev = _development(p, r, std, None)["strands"]
    Lt = p["lt"] * p["db"]
    out, notes = [], []
    stg_ = CA["primitives"].get("staging")
    stg = {"v": np.asarray(stg_["simply_supported"]) + np.asarray(stg_["continuous"])} if stg_ else None
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
    pier = _pier_inputs(doc, geo, S, girder, rd_) if stg_ else {}
    mem = next(x for x in sup.get("members") or [] if x["id"] == girder)
    T_ = next(x for x in sup.get("supert_types") or [] if x["id"] == rd_.value(mem.get("type_ref"), "type_ref"))
    typ_deck = [q for q in rd_.rows(T_.get("deck_bars"), "deck_bars", required=False) if q.get("diameter") is not None] if pier else []
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
        n_cap = 0
        for td in sec.tend:
            td["sp"] = F[td["k_on"]] * 1e3 / td["A"]
            if td.get("fpb") is None:
                td["fpb"] = fpb_tab
            cap = strand_stress_cap(dev[td["k_on"]], st["x_m"] * 1000.0, td["fpb"], Lt)
            if cap < td["fpb"] and td["sp"] > 0:
                td["fpb"] = max(cap, td["sp"]); n_cap += 1
        sec.tend = [td for td in sec.tend if td["sp"] > 0]
        x0 = st["x_m"]
        lo = max((q for q in ends if q[0] <= x0), key=lambda q: q[0], default=None)
        hi = min((q for q in ends if q[0] >= x0), key=lambda q: q[0], default=None)
        lo, hi = lo or hi, hi or lo
        w = 0.0 if hi[0] == lo[0] else (x0 - lo[0]) / (hi[0] - lo[0])
        near = lo if w < 0.5 else hi
        SM = stage_moments_at(r, x0 * 1000.0)
        Mnc = fS * (SM["Msw"] + SM["Mwet"])
        if stg is not None:   # continuous spans (ADR-082): the staged self weight of the joined model, girder-alone stage
            Mnc = fS * interp(stg, "v", lo, hi, w)
        mt = st["materials"]
        if pier and st["conf"] == "open":   # continuous runs: deck bars act with the girder (typical rows + the long pier bars in reach)
            sr_ = min(S["girders"][girder]["stations"], key=lambda r_: abs(r_["t"] - t))
            fc_ = [{"face": q["face"], "diameters_mm": [float(q["diameter"])], "spacing_mm": float(q["spacing"]), "cover_mm": float(q["cover"])} for q in typ_deck]
            gg_ = next(g_ for g_ in geo["girders"] if g_["id"] == girder)
            xb_ = (gg_["length_end_to_end"] - gg_["chord_length_bearings"]) / 2
            dpier = min(abs(x0 - (xb_ if e_ == "A" else gg_["length_end_to_end"] - xb_)) for e_ in pier["ends"]) if pier["ends"] else 1e9
            lng = (pier["deck"] or {}).get("long_bars") or {}
            if lng and dpier <= float(lng["length_mm"]) / 2000.0:
                fc_ += [{"face": f_, "diameters_mm": [float(lng["diameter_mm"])], "spacing_mm": float(lng["spacing_mm"]), "cover_mm": float(lng["cover_mm"])} for f_ in ("top", "bot")]
            eb_, _ = deck_bars(fc_, sr_["deck_left"] + sr_["deck_right"], S["deck_thickness"], pier["Es"], pier["fsy"])
            sec.bars = sec.bars + eb_
        lv = {"y_deck_bot": S["deck_thickness"], "y_gir_top": st["y_girder_top"], "Dtot": st["Dtot"], "Eg": mt["E_girder"], "Ed": mt["E_deck"], "fcg": mt["fc_girder"], "fcd": mt["fc_deck"]}
        lim = crack_limits(sec, std)
        res = {"t": t, "x_m": x0, "conf": st["conf"], "element": near[2][1], "end": near[3], "n_strands": len(sec.tend), "n_dev_capped": n_cap, "Mnc": Mnc, "limits": lim}
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
            end = "A" if t == 0 else "B" if t == 1 else None
            if pier and end in pier["ends"]:
                gg_ = next(g_ for g_ in geo["girders"] if g_["id"] == girder)
                xb = (gg_["length_end_to_end"] - gg_["chord_length_bearings"]) / 2   # bearing (support CL) from this girder end, m
                xb = xb if end == "A" else gg_["length_end_to_end"] - xb
                d0 = min(abs(q[0] - xb) for q in ends)
                # the model node at the bearing (the hogging peak): of the element ends there, the girder side, not the free end stub
                nb_ = min((q for q in ends if abs(q[0] - xb) <= d0 + 0.3), key=lambda q: E_u["min"][q[1]])
                res["pier_hog"] = _pier_hog_station(sec, st, lv, Mnc, std, lim, E_s, E_u, nb_, nb_, 0.0, nb_, conc_N, interp, pier, S, girder, t)
                res["pier_hog"]["x_m"] = nb_[0]
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
    notes.append(f"fpb = MBL / area = {fpb_tab:.0f} MPa (MBL: {H['source'].get('mbl')})")
    notes.append(("Mnc = self weight of the joined model with its staging (" + stg_["kind"] + ", ADR-082): girder simply supported, deck as staged"
                  if stg_ else "Mnc = simple-span girder self weight + wet deck of the losses analysis") + "; Ms = SLS envelope without DLc")
    notes.append(("deck differential shrinkage free strain %.1f x 1e-6 (losses analysis, detailed method)" % (eps_sh * 1e6)) if dsh else
                 ("deck differential shrinkage not applied (" + ("option dsh off" if not use_dsh else "simplified losses method or no deck stage") + ")"))
    notes.append("temperature-gradient primary strains with the governing SLS row's TGP / TGN factors; the governing row is chosen by the moment alone")
    notes.append("shear / torsion: general method at each open station (closed-box geometry) and solid-end stations (rectangular approx, Assumed, ADR-039); governing |V*| row with concurrent T*, M*, N*; strand development in the end zone not checked" if shear_why is None else "shear / torsion not checked: " + shear_why)
    from .prestress_checks import prestress_checks
    client = rd_.value((doc.get("project") or {}).get("client"), "project.client", required=False)
    pc = prestress_checks(p, r, std, client, [q["x_m"] for q in out if q["conf"] == "open"], aggregate=opts.get("aggregate_size") or None)
    notes.append("prestress checks (transfer stresses, debonding, development length, strand placement cover): see 'prestress'; ULS bending caps strands inside their development length "
                 "(sigma_pe at the transmission length rising linearly to fpb at Lp; 'n_dev_capped' per station)")
    return {"girder": girder, "rows": out, "time_days": r["res"][-1]["t"] if time is None else time, "hog_method": r["method"], "hog": _hog(r), "useN": useN, "dsh": dsh, "prestress": pc,
            "notes": notes, "provisional": H["provisional"], "standards_status": std.result_status()}
