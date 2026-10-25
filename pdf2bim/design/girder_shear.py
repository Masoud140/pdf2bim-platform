"""Shear and torsion of a composite Super-T at a design station (P4.5 stage 8). N, mm, MPa; actions kN, kN m.

    from pdf2bim.design.girder_shear import box_params, box_geometry, shear_inputs
    P = box_params(S_girder_params)                     # P2 parameters -> the dashboard's closed-box parameters
    g = box_geometry(P, H, tD, haunch, cover_side, cover_top, tie_d)
    Q = shear_inputs(sec, g, lv, fit, mats, pre0)       # the section data of pdf2bim.design.shear.shear

box_geometry is a port of the dashboard's dgGeo (open section; src/dsg5_ui via the built dashboard): the trough closed
by the deck is a single-cell box. With y up from the girder soffit, outer web line x_o(y) = Bb/2 + y / n, inner web line
between the inner web points at y_B = tb + tt and y_T = D - sd (web thickness twB / twT normal to the web);
Ao = 2 (y_t - y_b) (x_o(y_m) + x_i(y_m)) / 2 with y_b = tb / 2 and y_t = H + haunch + tD / 2 (deck mid-depth);
Acp = 2 (x0 Dc + Dc^2 / (2 n)), uc = 2 x0 + 2 (x0 + Dc / n) + 2 Dc sqrt(1 + 1 / n^2) with Dc = tD + haunch + H (as coded:
the deck and haunch over the girder top width taken as the outer web lines extended);
closed-tie centreline at a = cover_side + d_tie / 2 from the soffit and outer webs and at_ = cover_top + d_tie / 2 from the
deck top: Aoh, uh, y1 = lt - lb; bv = 2 min(twT, twB).

box_params (the mapping of the P2 Super-T parameters onto the dashboard's box parameters) is an INTERPRETATION
(provisional, ADR-039): n = S (web slope 1 : S), Bb = bw, twT = twB = tw, sd = ttf + ifD (inner top fillet),
tb = d2 - d1 (bottom flange at the web), tt = 0 (the inner bottom fillet is not a P2 parameter). The dashboard derives
its parameters from its own 12-point outline instead.
"""
import math


def box_params(p):
    for k in ("D", "bw", "tw", "S", "ttf", "ifD", "d1", "d2"):
        if p.get(k) is None:
            raise ValueError(f"Super-T parameter {k} missing for the torsion box")
    return {"D": float(p["D"]), "n": float(p["S"]), "Bb": float(p["bw"]), "twT": float(p["tw"]), "twB": float(p["tw"]),
            "sd": float(p["ttf"]) + float(p["ifD"]), "tb": float(p["d2"]) - float(p["d1"]), "tt": 0.0}


def box_geometry(P, tD, haunch, cover_side, cover_top, tie_d):
    """Port of dgGeo (open section). P from box_params (H = P["D"], the girder depth)."""
    H = P["D"]; Dc = tD + haunch + H
    sl = 1.0 / P["n"]; cs = math.cos(math.atan(sl)); x0 = P["Bb"] / 2
    xo = lambda y: x0 + sl * y
    yT, yB = H - P["sd"], P["tb"] + P["tt"]
    xiT, xiB = xo(yT) - P["twT"] / cs, xo(yB) - P["twB"] / cs
    xi = lambda y: xiB + (xiT - xiB) * (y - yB) / (yT - yB)
    g = {"sl": sl, "Acp": 2 * (x0 * Dc + sl * Dc * Dc / 2), "uc": 2 * x0 + 2 * (x0 + sl * Dc) + 2 * Dc * math.sqrt(1 + sl * sl), "Pv": 0.0, "tb": P["tb"]}
    g["tw"] = min(P["twT"], P["twB"]); g["bv"] = 2 * g["tw"]
    yb, yt = P["tb"] / 2, H + haunch + tD / 2
    ym = (yb + yt) / 2
    g["Ao"] = 2 * (yt - yb) * (xo(ym) + xi(ym)) / 2
    a, at = cover_side + tie_d / 2, cover_top + tie_d / 2
    lb, lt = a, Dc - at
    xl = lambda y: xo(y) - a / cs
    g["Aoh"] = 2 * (lt - lb) * xl((lb + lt) / 2)
    g["uh"] = 2 * xl(lb) + 2 * xl(lt) + 2 * (lt - lb) * math.sqrt(1 + sl * sl)
    g["y1"] = lt - lb
    g["Dc"] = Dc
    return g


def shear_inputs(sec, g, lv, fit, mats, pre0, face="top"):
    """Section data Q for pdf2bim.design.shear.shear at a station (as the dashboard's dgLC builds it).
    sec: the station Section (y down from the deck top); fit: {"d", "legs", "s", "tie_d", "tie_legs", "tie_s", "fsyf", "dg"};
    mats: {"fsy", "Es", "Ep"}; pre0: each tendon's decompression prestrain (sigma_p / Ep + |eps_ce|, girder_sls)."""
    D = lv["Dtot"]
    z = (lambda y: y) if face == "top" else (lambda y: D - y)
    n = d_ = 0.0
    for b in sec.bars:
        if z(b["y"]) > D / 2:
            n += b["A"] * b["fsy"]; d_ += b["A"] * b["fsy"] * z(b["y"])
    for t in sec.tend:
        if z(t["y"]) > D / 2:
            n += t["A"] * t["fpb"]; d_ += t["A"] * t["fpb"] * z(t["y"])
    dres = d_ / n if n else None
    dv = max(0.72 * D, 0.9 * dres if dres else 0.0)
    Ast = sum(b["A"] for b in sec.bars if z(b["y"]) > D / 2)
    tt = [(t, p) for t, p in zip(sec.tend, pre0) if z(t["y"]) > D / 2]
    Apt = sum(t["A"] for t, _ in tt)
    spo = sum(t["A"] * t["E"] * p for t, p in tt) / Apt if Apt else 0.0
    Fpt = sum(t["A"] * t["fpb"] for t, _ in tt)
    Act = sum(c["b"] * c["h"] for c in sec.conc if z(c["y"]) > D / 2)
    Q = {"bv": g["bv"], "dv": dv, "dres": dres, "fc": lv["fcg"], "Ec": lv["Eg"], "Es": mats["Es"], "Ep": mats["Ep"], "Ast": Ast, "Apt": Apt, "spo": spo, "Act": Act,
         "fsyf": fit["fsyf"], "fsy": mats["fsy"], "fpb": sec.tend[0]["fpb"] if sec.tend else 0.0, "Fpt": Fpt,
         "AsvS": fit["legs"] * math.pi * fit["d"] ** 2 / 4 / fit["s"],
         "AswS": (fit["tie_legs"] * math.pi * fit["tie_d"] ** 2 / 4 / fit["tie_s"]) if fit.get("tie_legs") else 0.0,
         "dg": fit["dg"], "Pv": 0.0, "uh": g["uh"], "Ao": g["Ao"], "Aoh": g["Aoh"], "Acp": g["Acp"], "uc": g["uc"], "y1": g["y1"]}
    return Q
