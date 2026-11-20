"""Plank design along a plank line (ADR-085 stage 3), reinforced or prestressed. N, mm, MPa; actions kN, kN m.

    from pdf2bim.design.plank_design import plank_section_design, plank_checks
    sec, lv = plank_section_design(doc, S, "P1", allow_proposed)      # flexure.Section, y DOWN from the deck top
    out = plank_checks(doc, geo, S, CA, mdl, std, "P1", allow_proposed)

Section: the plank outline less its voids (strip widths cut at each strip's mid depth) and the topping over the plank's
deck strip (P2 station widths), as strips; bars from plank_types[].bars (y from the plank soffit; a bar above the plank
top is a topping / deck bar, so the hogging steel over an integral support is entered there); materials "Planks" and
"Deck" rows, materials.reinforcement.
Checks at every plank element end (the plank is prismatic, so the section is the same everywhere):
- ULS sagging phi Mu (flexure.uls_bend, compression at the deck top) against the ULS envelope maximum;
- ULS hogging phi Mu (the same routine on the section turned upside down: compression at the plank soffit) against
  the envelope minimum (integral abutments, continuity);
- SLS bar stress on the cracked section (sls.solve, no concrete tension) under the SLS envelope maximum / minimum,
  against AS5100.5:crack_control:table_8_6_2_1 by the bar diameter at the tension face (girder_sls.crack_limits). An RC
  plank has no prestress, so the stress increment above decompression is the stress itself.
- shear and torsion (stage 3b): the general method (shear.shear) with the governing |V*| ULS row at the end and its
  concurrent T*, M*, N* (combinations.concurrent_row); fitments plank_types[].fitments, covers / aggregate / tie legs
  design.girder_options as the Super-T; geometry shear_geometry (rectangle);
- interface shear: the elastic shear flow V* Q / (I b) at the plank / topping interface (demand only).
- prestressed planks (stage 3c-2, strand_pattern given): the Super-T losses analysis on the plank line and the staged
  SLS / ULS check girder_sls.staged at each end (see _prestressed; N* = 0, no free strains: shortcut).
NOT here: the interface shear capacity, RC-plank minimum strength, deck slab transverse design. Standards values code-extracted-unverified.
"""
import math
import numpy as np
from ..description import Reader, MissingInput
from ..model.combinations import concurrent_row
from .flexure import Section, uls_bend, elastic
from .shear import shear as shear_check
from .girder_shear import shear_inputs
from .sls import solve
from .girder_sls import crack_limits
from .girder_design import _element_ends, _hog


def _width_at(P, y):
    xs = []
    for k in range(len(P)):
        a, b = P[k], P[(k + 1) % len(P)]
        if (a[1] <= y < b[1]) or (b[1] <= y < a[1]):
            xs.append(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]))
    xs.sort()
    return sum(xs[j + 1] - xs[j] for j in range(0, len(xs) - 1, 2))


def _conc(rd, doc, word):
    for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete"):
        if word in (r.get("element") or "").lower():
            if r.get("fc") is None or r.get("E") is None:
                raise MissingInput(f"materials.concrete[{r.get('element')}]: fc and E needed")
            return float(r["fc"]), float(r["E"])
    raise MissingInput(f"materials.concrete: no row for the {word}")


def plank_section_design(doc, S, plank, allow_proposed=False, dz=2.0):
    rd = Reader(doc, allow_proposed)
    G = S["girders"].get(plank)
    if G is None or G["type"] != "plank":
        raise MissingInput(f"sections: {plank!r} is not a plank line")
    sup = doc.get("superstructure") or {}
    mem = next(m for m in sup.get("members") or [] if m["id"] == plank)
    tref = rd.value(mem.get("type_ref"), f"superstructure.members[{plank}].type_ref")
    T = next(x for x in sup.get("plank_types") or [] if x["id"] == tref)
    tp = f"superstructure.plank_types[{tref}]"
    strands = [r for r in rd.rows(T.get("strand_pattern"), tp + ".strand_pattern", required=False) if r.get("on", True)]
    st = G["stations"][len(G["stations"]) // 2]
    h = G["params"]["depth"]
    tD = S["deck_thickness"] if st["deck"] else 0.0
    fcp, Ep = _conc(rd, doc, "plank")
    conc = []
    if tD:
        fcd, Ed = _conc(rd, doc, "deck")
        n = math.ceil(tD / dz); d = tD / n
        conc += [{"y": (i + 0.5) * d, "h": d, "b": st["deck_left"] + st["deck_right"], "E": Ed, "fc": fcd, "grp": "deck"} for i in range(n)]
    n = math.ceil(h / dz); d = h / n
    for i in range(n):
        yu = h - (i + 0.5) * d                                  # up from the plank soffit
        b = _width_at(st["outline"], yu) - sum(_width_at(v, yu) for v in st["voids"])
        if b > 0:
            conc.append({"y": tD + (i + 0.5) * d, "h": d, "b": b, "E": Ep, "fc": fcp, "grp": "girder"})
    rows = rd.rows(T.get("bars"), tp + ".bars", required=False)
    if not rows and not strands:
        raise MissingInput(f"{tp}.bars: no reinforcement")
    bm = rd.rows((doc.get("materials") or {}).get("reinforcement"), "materials.reinforcement")[0]
    bars = []
    for r in rows:
        y = float(r["y"])
        if not 0 < y < h + tD:
            raise MissingInput(f"{tp}.bars: bar at y {y} mm is outside the plank + topping")
        k = int(r.get("number") or 1)
        bars.append({"y": tD + h - y, "A": k * math.pi / 4 * float(r["diameter"]) ** 2, "E": float(bm["Es"]), "fsy": float(bm["fsy"]),
                     "grp": "girder" if y <= h else "deck", "d": float(r["diameter"]), "n": k})
    return Section(conc, bars), {"Dtot": tD + h, "tD": tD, "h": h, "fcg": fcp, "Eg": Ep, "fcd": fcd if tD else None, "Ed": Ed if tD else None,
                                 "type": T, "tp": tp, "bm": bm, "strands": strands, "provisional": rd.provisional}


def _flip(sec, H):
    c = [dict(q, y=H - q["y"]) for q in sec.conc]
    c.sort(key=lambda q: q["y"])
    return Section(c, [dict(b, y=H - b["y"]) for b in sec.bars])


def bar_stress(sec, M):
    """Largest bar tension (MPa) on the cracked section under M (kN m, sagging +), and the bar diameter there."""
    if abs(M) < 1e-9:
        return 0.0, None
    pl = solve(sec, 0.0, M * 1e6, 0.0, cracked=True)
    if not pl["converged"]:
        raise ValueError(f"cracked section solve did not converge at M = {M:.1f} kN m")
    s = [(b["E"] * (pl["e0"] + pl["k"] * b["y"]), b.get("d")) for b in sec.bars]
    return max(s)


def shear_geometry(sec, lv, cover_side, cover_top, tie_d):
    """Shear / torsion geometry of a plank + topping (rectangle, the plank width): bv = the narrowest plank strip (a
    voided plank: the width less its voids); Acp, uc of the plank-width rectangle over the full depth; closed tie at
    cover + tie_d / 2 from the sides, the soffit and the deck top; Ao = 0.9 Aoh as the Super-T solid ends (Assumed, ADR-039).
    shortcut: voids ignored in Ao / Acp (a voided plank is not a thin-walled cell here), refine for large voids."""
    pl = [c for c in sec.conc if c["grp"] == "girder"]
    b, D = max(c["b"] for c in pl), lv["Dtot"]
    boh = b - 2 * (cover_side + tie_d / 2)
    yoh = D - cover_side - cover_top - tie_d
    if boh <= 0 or yoh <= 0:
        raise MissingInput("plank shear geometry: covers leave no closed tie")
    Aoh = boh * yoh
    return {"bv": min(c["b"] for c in pl), "Ao": 0.9 * Aoh, "Aoh": Aoh, "Acp": b * D, "uc": 2 * (b + D), "uh": 2 * (boh + yoh), "y1": yoh, "b": b}


def interface_shear(sec, V):
    """Elastic shear flow at the plank / topping interface (kPa): tau = V Q / (I b), Q the transformed topping area
    moment about the uncracked centroid, b the plank top width. Demand only (the capacity clause is not in the
    standards data)."""
    Eref = next(c["E"] for c in sec.conc if c["grp"] == "girder")
    el = elastic(sec, Eref)
    deck = [c for c in sec.conc if c["grp"] == "deck"]
    if not deck:
        return None
    Q = sum(c["E"] / Eref * c["b"] * c["h"] * (el["yc"] - c["y"]) for c in deck)
    Q += sum((b["E"] / Eref - c_["E"] / Eref) * b["A"] * (el["yc"] - b["y"]) for b in sec.bars if b["grp"] == "deck" for c_ in [sec.strip_at(b["y"])] if c_)
    bi = min((c for c in sec.conc if c["grp"] == "girder"), key=lambda c: c["y"])["b"]
    return abs(V) * 1e3 * Q / (el["I"] * bi) * 1e3


def _prestressed(doc, geo, S, CA, std, plank, sec, lv, allow_proposed):
    """Prestressed plank (stage 3c-2): the losses analysis of the Super-T (hog_inputs on the plank line), and a function
    x (m) -> the Section with each bonded strand at its effective stress sp there (strands inside their development
    length capped as the Super-T), for girder_sls.staged."""
    from .prestress import run as hog_run, strand_forces_at, stage_moments_at
    from .prestress_inputs import hog_inputs
    from .prestress_checks import _development, strand_stress_cap
    Hi = hog_inputs(doc, geo, S, plank, std, allow_proposed)
    p = Hi["p"]; r = hog_run(p, std)
    dev = _development(p, r, std, None)["strands"]
    Lt, fpb, Ep = p["lt"] * p["db"], p["mbl"] * 1e3 / p["Ap"], p["Ep"]
    L = p["L"]

    def at(x):
        F = strand_forces_at(r, x * 1000.0, None)
        tend = []
        for k, q in enumerate(lv["strands"]):
            xm = x * 1000.0
            if xm < float(q.get("debond_left") or 0) or xm > L - float(q.get("debond_right") or 0):
                continue
            sp = F[k] * 1e3 / p["Ap"]
            if sp <= 0:
                continue
            cap = strand_stress_cap(dev[k], xm, fpb, Lt)
            tend.append({"y": lv["Dtot"] - float(q["y"]), "x": q.get("x"), "k_on": k, "A": p["Ap"], "E": Ep, "sp": sp, "fpb": max(min(cap, fpb), sp)})
        return Section(sec.conc, sec.bars, tend), stage_moments_at(r, x * 1000.0)
    return at, Hi, r


def plank_checks(doc, geo, S, CA, mdl, std, plank, allow_proposed=False):
    sec, lv = plank_section_design(doc, S, plank, allow_proposed)
    H = lv["Dtot"]
    ps = None
    if lv["strands"]:
        from .girder_sls import staged
        from ..model.combinations import combine
        ps, Hi, rr = _prestressed(doc, geo, S, CA, std, plank, sec, lv, allow_proposed)
        if "_sls_nodl" not in CA:   # as the Super-T checks: DLc acts on the plank alone (Mnc), the SLS envelope without it
            P2 = dict(CA["primitives"]["prim"]); P2["DLc"] = {"s": np.zeros_like(np.asarray(CA["primitives"]["prim"]["DLc"]["s"], float))}
            CA["_sls_nodl"] = combine(CA["rows"], P2)["SLS"]
        fS = std.get("AS5100.2:load_factor:DLc").value["sls"]
        lvs = {"y_deck_bot": lv["tD"], "y_gir_top": lv["tD"], "Dtot": H, "Eg": lv["Eg"], "Ed": lv["Ed"] or lv["Eg"], "fcg": lv["fcg"], "fcd": lv["fcd"] or lv["fcg"]}
    sag = uls_bend(sec, std) if not ps else None
    hog = uls_bend(_flip(sec, H), std) if not ps else None
    lim = crack_limits(sec, std)
    ends = _element_ends(CA, mdl, geo, plank)
    Lg = S["girders"][plank]["length_end_to_end"]
    U, Sv = CA["envelopes"]["ULS"], CA["envelopes"]["SLS"]
    # shear / torsion inputs (as the Super-T checks): fitments of the plank type, covers / aggregate in design.girder_options
    rd = Reader(doc, allow_proposed)
    fits = rd.rows(lv["type"].get("fitments"), lv["tp"] + ".fitments", required=False)
    opts = {r_.get("item"): r_.get("value") for r_ in rd.rows((doc.get("design") or {}).get("girder_options"), "design.girder_options", required=False)}
    need = [k for k in ("fitment_cover_side", "fitment_cover_top", "aggregate_size") if opts.get(k) in (None, "")]
    shear_why = (lv["tp"] + ".fitments missing") if not fits else ("design.girder_options missing: " + ", ".join(need)) if need else None
    ix = {n_: k for k, n_ in enumerate(CA["names"])}
    prim, byname = CA["primitives"]["prim"], {q["name"]: q for q in CA["rows"]}
    rows = []
    for d, i, (_, eid), end in sorted(ends):
        Ms, Mh = float(U["max"][i]), float(U["min"][i])
        Ss, Sh = float(Sv["max"][i]), float(Sv["min"][i])
        pre0, sec_x = [], sec
        if ps:
            # shortcut: N* = 0 with the moments and no free strains (gradient / differential shrinkage), refine as the Super-T checks
            sec_x, SM = ps(d)
            Mnc = fS * (SM["Msw"] + SM["Mwet"])
            E0 = CA["_sls_nodl"]
            o_s = staged(sec_x, lvs, Mnc, float(E0["max"][i]), 0.0, Ms, 0.0, std, lim["fscr"], lim["ftcr"], lim["fscrT"], why=lim["why"])
            o_h = staged(sec_x, lvs, Mnc, float(E0["min"][i]), 0.0, Mh, 0.0, std, lim["fscr"], lim["ftcr"], lim["fscrT"], why=lim["why"])
            pre0 = o_s["tend_pre0"]
            keep = ("Mdec", "Mal", "MdecT", "MalT", "uS", "uST", "uncracked", "Mcr", "McrH", "Muo", "Muo_min", "okMin", "phiMu", "uB")
            rows.append({"t": d / Lg, "conf": "open", "x_m": d, "element": eid, "end": end, "M_sag": Ms, "row_sag": U["gmax"][i], "M_hog": Mh, "row_hog": U["gmin"][i],
                         "u_sag": o_s["uB"] if Ms > 0 else 0.0, "u_hog": o_h["uB"] if Mh < 0 else 0.0, "Ms_sls": float(E0["max"][i]), "Mh_sls": float(E0["min"][i]), "Mnc": Mnc,
                         "fs_sag": None, "fs_hog": None, "u_sls_sag": max(o_s["uS"], 0.0), "u_sls_hog": o_h["uST"], "n_strands": len(sec_x.tend)})
            r_ = rows[-1]
            r_["sag"] = {k: o_s.get(k) for k in keep}; r_["hog"] = {k: o_h.get(k) for k in keep}
            r_["sag"].update(uB=r_["u_sag"], uS=r_["u_sls_sag"]); r_["hog"].update(uB=r_["u_hog"], uS=r_["u_sls_hog"])
        else:
            fs_s, _ = bar_stress(sec, max(Ss, 0.0))
            fs_h, _ = bar_stress(sec, min(Sh, 0.0))
            rows.append({"t": d / Lg, "conf": "open", "x_m": d, "element": eid, "end": end, "M_sag": Ms, "row_sag": U["gmax"][i], "M_hog": Mh, "row_hog": U["gmin"][i],
                         "u_sag": max(Ms, 0.0) / sag["phiMu"], "u_hog": max(-Mh, 0.0) / hog["phiMu"],
                         "Ms_sls": Ss, "Mh_sls": Sh, "fs_sag": fs_s, "fs_hog": fs_h,
                         "u_sls_sag": fs_s / lim["fscr"], "u_sls_hog": fs_h / lim["fscrT"]})
            r_ = rows[-1]   # the Super-T row keys the app / reports read (minimum strength not checked: okMin None)
            r_["sag"], r_["hog"] = {"uB": r_["u_sag"], "uS": r_["u_sls_sag"], "okMin": None}, {"uB": r_["u_hog"], "uS": r_["u_sls_hog"]}
        iV = ix[("G", (plank, eid), f"V{end}")]
        which = "max" if abs(U["max"][iV]) >= abs(U["min"][iV]) else "min"
        rowV = U["g" + which][iV]
        cv = np.asarray(concurrent_row(prim, byname[rowV], iV, which)["v"])
        Vs, Ts = float(cv[iV]), float(cv[ix[("G", (plank, eid), f"T{end}")]])
        Mv, Nv = float(cv[ix[("G", (plank, eid), f"M{end}")]]), float(cv[ix[("G", (plank, eid), f"N{end}")]])
        rows[-1].update({"V": Vs, "T": Ts, "M_V": Mv, "N_V": Nv, "row_V": rowV, "tau_interface_kPa": interface_shear(sec_x, Vs)})
        if shear_why:
            rows[-1]["shear"] = {"why": shear_why}
            continue
        fr = [f for f in fits if f.get("from") is not None and f["from"] - 1e-9 <= d <= f["to"] + 1e-9]
        if not fr:
            rows[-1]["shear"] = {"why": f"no fitment row covers x = {d:.2f} m"}
            continue
        f0 = fr[0]
        fit = {"d": float(f0["diameter"]), "legs": int(f0["legs"]), "s": float(f0["spacing"]), "tie_d": float(f0["diameter"]),
               "tie_legs": int(float(opts.get("torsion_tie_legs") or 0)), "tie_s": float(f0["spacing"]), "fsyf": float(lv["bm"]["fsy"]), "dg": float(opts["aggregate_size"])}
        g_ = shear_geometry(sec_x, lv, float(opts["fitment_cover_side"]), float(opts["fitment_cover_top"]), fit["tie_d"])
        Ep_ = sec_x.tend[0]["E"] if sec_x.tend else 0.0
        Q = shear_inputs(sec_x, g_, lv, fit, {"fsy": float(lv["bm"]["fsy"]), "Es": float(lv["bm"]["Es"]), "Ep": Ep_}, pre0, face="top" if Mv >= 0 else "bottom")
        sh = shear_check(Q, {"V": Vs, "T": Ts, "M": Mv, "N": Nv}, std)
        rows[-1]["shear"] = {"fitments": f"N{fit['d']:g} x {fit['legs']} legs @ {fit['s']:g}", "dv": Q["dv"], "bv": Q["bv"], "Ao": Q["Ao"],
                             **{k: sh.get(k) for k in ("ex", "th", "kv", "Vuc", "Vus", "Vumax", "Tcr", "uCr", "uV", "uT", "uL", "u", "minV")}}
    if ps:
        sag = {"phiMu": max((r["sag"]["phiMu"] for r in rows if r["sag"].get("phiMu")), default=None), "kuo": None}
        hog = {"phiMu": min((r["hog"]["phiMu"] for r in rows if r["hog"].get("phiMu") is not None), default=None, key=lambda v: abs(v)), "kuo": None}
    return {"plank": plank, "prestressed": bool(ps), "phiMu_sag": sag["phiMu"], "phiMu_hog": hog["phiMu"], "kuo_sag": sag["kuo"], "kuo_hog": hog["kuo"],
            "fscr": lim["fscr"], "fscrT": lim["fscrT"], "why": lim["why"], "rows": rows,
            "governing": dict({k: max(r[k] for r in rows) for k in ("u_sag", "u_hog", "u_sls_sag", "u_sls_hog")},
                              u_shear=max((r["shear"].get("u", 0.0) for r in rows), default=0.0), tau_interface_kPa=max((r["tau_interface_kPa"] or 0.0) for r in rows)),
            "shear_why": shear_why,
            "notes": (["prestressed plank: losses / camber analysis of the Super-T on the plank line; staged SLS (plank alone under prestress + Mnc, then composite), "
                       "Mdec / Mal (Table 8.6.2.1 increments), cracking moment and minimum strength, ULS bending with strand development caps (girder_sls.staged); "
                       "N* = 0 and no free strains (gradient, differential shrinkage) — shortcut"] if ps else
                      ["RC plank: ULS flexure (strain compatibility), SLS cracked bar stress (Table 8.6.2.1); minimum strength not checked"]) +
                     ["shear / torsion by the general method; interface shear DEMAND only (the capacity clause is not in the standards data)"],
            "hog": _hog(rr) if ps else None, "hog_method": rr["method"] if ps else None,
            "provisional": lv["provisional"], "standards_status": std.result_status()}
