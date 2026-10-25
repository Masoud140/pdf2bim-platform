"""Staged serviceability stresses, cracking moments and minimum strength of a composite Super-T section
(P4.5 stage 6). N, mm, MPa; moments kN m, forces kN (tension +, sagging +).

    from pdf2bim.design.girder_sls import staged, crack_limits
    lim = crack_limits(sec, std)                       # fscr / ftcr / fscrT from AS5100.5:crack_control:table_8_6_2_1
    o = staged(sec, lv, Mnc, Ms, Ns, Mu, Nu, std, **lim)

Port of the dashboard's load-case check dgLC (src/dsg2_ui.js, built into dsg5_ui), SLS and bending parts:
1. Super-T alone: each strand's prestrain is iterated (8 times) so that its stress equals its effective prestress
   t["sp"] (from the losses analysis) under prestress + Mnc (non-composite moment), about the girder centroid;
2. the girder strain state is locked into the composite section (girder strips and bars e0 = -eps_g(y); strand
   prestrain + eps_g(y)); optional free strains (temperature gradient function T(y), deck differential shrinkage sh);
3. at(M): composite strain plane for Ns, Mnc + M about the composite centroid, uncracked or cracked; fibre stresses
   deck top / bottom, girder top / soffit, bar and strand stresses;
4. decompression Mdec (soffit at 0), allowable moment Mal (bar increment below the soffit-side centroid <= fscr,
   strand increment <= ftcr, cracked), top-face decompression MdecT and MalT (bars / strands above the centroid);
5. uncracked check soffit <= k sqrt(f'c) (AS5100.5:crack_control:uncracked_tension_limit); uS = Ms / Mal;
6. cracking moments Mcr (soffit at f'ct.f girder) and McrH (deck top at f'ct.f deck), Muo,min = k Mcr
   (AS5100.5:flexure:minimum_strength_factor, k = 1.2 as coded);
7. ULS: composite section without locked-in strains, strand prestrain = the stage-1 value (sigma_p / Ep + |eps_ce|);
   phi Mu at Nu (bending phi; compression side linear to phi_compression at the balanced load) and Muo at N = 0.
Bisections: 80 halvings on [-3e5, 3e5] kN m as the dashboard. Shear / torsion (dgLC's last part) is NOT here: it needs
the closed-box torsion geometry and the fitments (pdf2bim.design.shear has the method).
lv: {"y_deck_bot", "y_gir_top", "Dtot", "Eg", "Ed", "fcg", "fcd"} — depths from the deck top (no haunch: equal).
"""
import copy, math
from .flexure import Section, elastic, Coefficients
from .sls import solve
from .nm import at as nm_at, mu_at_n


def prof_at(pts, y):
    """Temperature (or any) profile [(depth, value)] sorted by depth, at depth y: linear between points, 0 outside
    (the dashboard's dgProfAt; a repeated depth takes the deeper point's value)."""
    if not pts or y < pts[0][0] or y > pts[-1][0]:
        return 0.0
    for (d0, v0), (d1, v1) in zip(pts, pts[1:]):
        if y <= d1:
            return v1 if d1 == d0 else v0 + (v1 - v0) * (y - d0) / (d1 - d0)
    return 0.0


def crack_limits(sec, std):
    """Table 8.6.2.1 limits as the dashboard sets them (dgCCSync / dgT8621): fscr from the largest girder bar in the
    lower half of the girder, fscrT from the largest bar in the upper half (girder bars and deck bars), ftcr the tendon
    value. Returns {"fscr", "ftcr", "fscrT", "why"}."""
    T = std.get("AS5100.5:crack_control:table_8_6_2_1").value

    def pick(db):
        if not db:
            return T["no_bar"], "no bar near the face: bonded tendons value"
        for d, v in T["bars"]:
            if db <= d:
                return float(v), f"db {db:g} mm"
        return T["larger_bars"], f"db {db:g} mm (above the listed diameters)"
    g = [b for b in sec.bars if b.get("grp") == "girder" and b.get("d")]
    yt = min(c["y"] - c["h"] / 2 for c in sec.conc if c.get("grp") == "girder")
    yb = max(c["y"] + c["h"] / 2 for c in sec.conc if c.get("grp") == "girder")
    mid = (yt + yb) / 2
    dbot = max((b["d"] for b in g if b["y"] > mid), default=None)
    dtop = max([b["d"] for b in g if b["y"] <= mid] + [b["d"] for b in sec.bars if b.get("grp") == "deck" and b.get("d")], default=None)
    f, w1 = pick(dbot); fT, w2 = pick(dtop)
    return {"fscr": f, "ftcr": float(T["tendons"]), "fscrT": fT, "why": {"fscr": w1, "fscrT": w2}}


def staged(sec, lv, Mnc, Ms, Ns, Mu, Nu, std, fscr, ftcr, fscrT=None, free=None, nb=80, why=None):
    for t in sec.tend:
        if t.get("sp") is None or t.get("fpb") is None:
            raise ValueError("staged SLS needs every strand's effective prestress sp and fpb")
    K = Coefficients(std)
    tD, tG, Ht = lv["y_deck_bot"], lv["y_gir_top"], lv["Dtot"]
    Eg, Ed = lv["Eg"], lv["Ed"]
    S = Section(copy.deepcopy(sec.conc), copy.deepcopy(sec.bars), copy.deepcopy(sec.tend))
    Sg = Section([c for c in S.conc if c.get("grp") == "girder"], [b for b in S.bars if b.get("grp") == "girder"], S.tend)
    ygr = elastic(Sg, Eg)["yc"]; yc = elastic(S, Eg)["yc"]
    k_u = std.get("AS5100.5:crack_control:uncracked_tension_limit").value
    k_f = std.get("AS5100.5:concrete:flexural_tensile_strength").value
    k_min = std.get("AS5100.5:flexure:minimum_strength_factor").value
    fct25, fctfg, fctfd = k_u * math.sqrt(lv["fcg"]), k_f * math.sqrt(lv["fcg"]), k_f * math.sqrt(lv["fcd"])
    o = {"yc_girder": ygr, "yc": yc, "fct_uncracked": fct25, "fctf_girder": fctfg, "fctf_deck": fctfd, "fscr": fscr, "ftcr": ftcr, "fscrT": fscrT or fscr,
         "limits_why": why, "Mnc": Mnc, "Ms": Ms, "Ns": Ns, "Mu": Mu, "Nu": Nu}
    Nsn = Ns * 1e3
    # stage 1 — girder alone
    for t in Sg.tend:
        t["pre"] = t["sp"] / t["E"]
    for _ in range(8):
        s0 = solve(Sg, 0.0, Mnc * 1e6, ygr, False)
        for t in Sg.tend:
            t["pre"] = t["sp"] / t["E"] - (s0["e0"] + s0["k"] * t["y"])
    for t in Sg.tend:
        t["pre0"] = t["pre"]
    sg = solve(Sg, 0.0, Mnc * 1e6, ygr, False)
    eg = lambda y: sg["e0"] + sg["k"] * y
    o["girder_alone"] = {"top": Eg * eg(tG), "bot": Eg * eg(Ht), "plane": sg,
                         "tend": [t["E"] * (sg["e0"] + sg["k"] * t["y"] + t["pre"]) for t in Sg.tend]}
    # stage 2 — lock the girder state into the composite section
    for c in S.conc:
        c["e0"] = -eg(c["y"]) if c.get("grp") == "girder" else 0.0
    for b in S.bars:
        b["e0"] = -eg(b["y"]) if b.get("grp") == "girder" else 0.0
    for t in S.tend:
        t["pre"] = t["pre"] + eg(t["y"])
    fT = (free or {}).get("T"); fsh = (free or {}).get("sh") or 0.0

    def fr(y, g):
        if not free:
            return 0.0
        return (fT(y) if fT else 0.0) + (fsh if g == "d" else 0.0)
    if free:
        for c in S.conc:
            c["e0"] += (fT(c["y"]) if fT else 0.0) + (fsh if c.get("grp") == "deck" else 0.0)
        for b in S.bars:
            b["e0"] = (b.get("e0") or 0.0) + (fT(b["y"]) if fT else 0.0)
        for t in S.tend:
            t["pre"] -= fT(t["y"]) if fT else 0.0

    def at(M, crack):
        s = solve(S, Nsn, (Mnc + M) * 1e6, yc, crack)
        e0, k = s["e0"], s["k"]
        return {"s": s, "deckTop": Ed * (e0 - fr(0, "d")), "deckBot": Ed * (e0 + k * tD - fr(tD, "d")),
                "girTop": Eg * (e0 + k * tG + eg(tG) - fr(tG, "g")), "girBot": Eg * (e0 + k * Ht + eg(Ht) - fr(Ht, "g")),
                "bars": [b["E"] * (e0 + k * b["y"] - (b.get("e0") or 0.0)) for b in S.bars],
                "tend": [t["E"] * (e0 + k * t["y"] + t["pre"]) for t in S.tend]}

    def bis(lo, hi, go_lo):
        for _ in range(nb):
            m = (lo + hi) / 2
            if go_lo(m):
                lo = m
            else:
                hi = m
        return lo, hi
    o["at"] = at
    o["sv"] = at(Ms, False); o["sc"] = at(Ms, True)
    o["Mdec"] = bis(-3e5, 3e5, lambda m: at(m, False)["girBot"] < 0)[0]
    base = at(o["Mdec"], False)

    def incr(M):
        q = at(M, True)
        mb = max([v - base["bars"][j] for j, v in enumerate(q["bars"]) if S.bars[j]["y"] > yc], default=-1e9)
        mt = max([v - base["tend"][j] for j, v in enumerate(q["tend"])], default=-1e9)
        return {"b": mb, "t": mt, "q": q}
    o["Mal"] = bis(o["Mdec"], o["Mdec"] + 3e5, lambda m: (lambda q: q["b"] < fscr and q["t"] < ftcr)(incr(m)))[0]
    o["qa"] = incr(o["Mal"])
    o["inc"] = incr(Ms) if Ms > o["Mdec"] else {"b": 0.0, "t": 0.0}
    topT = lambda q: max(q["girTop"], q["deckTop"])
    o["MdecT"] = bis(-3e5, 3e5, lambda m: topT(at(m, False)) > 0)[1]
    baseT = at(o["MdecT"], False)

    def incrT(M):
        q = at(M, True)
        mb = max([v - baseT["bars"][j] for j, v in enumerate(q["bars"]) if S.bars[j]["y"] < yc], default=-1e9)
        mt = max([v - baseT["tend"][j] for j, v in enumerate(q["tend"]) if S.tend[j]["y"] < yc], default=-1e9)
        return {"b": mb, "t": mt, "q": q}
    fT8 = fscrT or fscr
    o["MalT"] = bis(o["MdecT"] - 3e5, o["MdecT"], lambda m: not (lambda q: q["b"] < fT8 and q["t"] < ftcr)(incrT(m)))[1]
    o["incT"] = incrT(Ms) if Ms < o["MdecT"] else {"b": 0.0, "t": 0.0}
    o["uST"] = (o["MdecT"] - Ms) / max(1e-9, o["MdecT"] - o["MalT"]) if Ms < o["MdecT"] else 0.0
    o["uncracked"] = o["sv"]["girBot"] <= fct25
    o["uS"] = Ms / o["Mal"]
    o["okS"] = o["uncracked"] or Ms <= o["Mal"]
    e0t, kt = o["sc"]["s"]["e0"] + sg["e0"], o["sc"]["s"]["k"] + sg["k"]
    o["kappa"] = kt; o["dna"] = -e0t / kt if kt != 0 else None
    o["Mcr"] = Mnc + bis(-3e5, 3e5, lambda m: at(m, False)["girBot"] < fctfg)[0]
    o["McrH"] = Mnc + bis(-3e5, 3e5, lambda m: not (at(m, False)["deckTop"] < fctfd))[1]
    # ULS
    Su = Section([dict(c, e0=0.0) for c in S.conc], [dict(b, e0=0.0) for b in S.bars], [dict(t, epe=t["pre0"]) for t in Sg.tend])
    face = "top" if Mu >= 0 else "bot"; o["face"] = face
    r = mu_at_n(Su, std, Nu * 1e3, face, yc); r0 = mu_at_n(Su, std, 0.0, face, yc)
    D = Ht
    dmax = max((z["y"] if face == "top" else D - z["y"]) for z in Su.bars + Su.tend)
    eb = std.get("AS5100.5:strain:balanced_steel").value
    pc = std.get("AS5100.5:capacity_factor:phi_compression").value
    Nub = nm_at(Su, std, K.ecu / (K.ecu + eb) * dmax, face, yc, K)["N"]; o["Nub"] = Nub / 1e3
    if r:
        pb = K.phi(r["kuo"]); N = Nu * 1e3
        o.update(dn=r["dn"], kuo=r["kuo"], gamma=r["gamma"], Mu_cap=r["M"] / 1e6)
        o["phi"] = pb if N >= 0 else (pc if N <= Nub else pc + (pb - pc) * (1 - N / Nub))
        o["phiMu"] = o["phi"] * o["Mu_cap"]; o["uB"] = abs(Mu) / abs(o["phiMu"])
    if r0:
        o["Muo"] = r0["M"] / 1e6; o["kuo0"] = r0["kuo"]
    o["Muo_min"] = k_min * (o["Mcr"] if face == "top" else o["McrH"])
    o["okMin"] = None if "Muo" not in o else (o["Muo"] >= o["Muo_min"] if face == "top" else o["Muo"] <= o["Muo_min"])
    o["standards_status"] = K.status
    return o
