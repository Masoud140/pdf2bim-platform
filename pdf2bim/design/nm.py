"""Ultimate axial force - moment interaction of a section, either face in compression (P4.5 stage 2). N, mm, MPa.

    from pdf2bim.design.nm import at, mu_at_n, nm_curve
    r = at(S, std, dn, face="top", yr=yc)        # N (tension +), M about yr (sagging +), kuo, gamma for a neutral-axis depth
    r = mu_at_n(S, std, N, face, yr)             # the section state with axial force N (None outside the curve)
    C = nm_curve(S, std, face, yr)               # 92 points (tension point first) with phi

Port of the dashboard's engine (src/dsg_engine2.js at / muAtN / nm) with every coefficient from the standards data
(code-extracted-UNVERIFIED): alpha2, gamma, ecu, phi_bending, phi_compression, phi_tension_point, balanced_steel.
face = "top": compression at the top (sagging); "bot": compression at the bottom (hogging); depths z from the
compression face. gamma from the strip nearest the compression face; bars in the block give back the displaced concrete
(where they lie in a strip); tendons by the strand curve with their effective prestrain epe. The tension point carries
every bar at fsy and every tendon at fpb (phi_tension_point). Bending phi from kuo (dmax = deepest steel from the
compression face); compression side: phi_compression at and above the balanced load Nub (dn_b = ecu / (ecu + e_b)
dmax), linear to the bending phi at N = 0."""
from .flexure import Coefficients


def depth(S):
    return max(c["y"] + c["h"] / 2 for c in S.conc)


def at(S, std, dn, face="top", yr=0.0, K=None):
    K = K or Coefficients(std)
    D = depth(S)
    z = (lambda y: y) if face == "top" else (lambda y: D - y)
    if face not in ("top", "bot"):
        raise ValueError(f"face {face!r}: 'top' or 'bot'")
    fcF = min(S.conc, key=lambda c: z(c["y"]))["fc"]
    g = K.gamma(fcF); blk = g * dn
    N = M = 0.0
    for c in S.conc:
        z1, z2 = z(c["y"]) - c["h"] / 2, z(c["y"]) + c["h"] / 2
        hi = min(z2, blk)
        if hi > z1:
            f = -K.alpha2(c["fc"]) * c["fc"] * c["b"] * (hi - z1)
            zm = (z1 + hi) / 2
            ym = zm if face == "top" else D - zm
            N += f; M += f * (ym - yr)
    for b in S.bars:
        e = -K.ecu * (dn - z(b["y"])) / dn
        s = max(-b["fsy"], min(b["fsy"], b["E"] * e))
        if z(b["y"]) < blk:
            cc = S.strip_at(b["y"])
            if cc and s < 0:
                s += K.alpha2(cc["fc"]) * cc["fc"]
        f = s * b["A"]; N += f; M += f * (b["y"] - yr)
    for t in S.tend:
        e = -K.ecu * (dn - z(t["y"])) / dn + t["epe"]
        f = K.strand(t, e) * t["A"]; N += f; M += f * (t["y"] - yr)
    dmax = max(z(s["y"]) for s in S.bars + S.tend)
    return {"N": N, "M": M, "dn": dn, "kuo": dn / dmax, "gamma": g}


def mu_at_n(S, std, Nt, face="top", yr=0.0, iterations=120):
    """Section state at axial force Nt (tension +): geometric bisection on dn in [1, 50 D]; None beyond the tension
    capacity or the squash load (as the dashboard)."""
    K = Coefficients(std)
    D = depth(S)
    lo, hi = 1.0, 50.0 * D
    if at(S, std, lo, face, yr, K)["N"] - Nt < 0 or at(S, std, hi, face, yr, K)["N"] - Nt > 0:
        return None
    for _ in range(iterations):
        mm = (lo * hi) ** 0.5
        if at(S, std, mm, face, yr, K)["N"] - Nt > 0:
            lo = mm
        else:
            hi = mm
    return at(S, std, (lo * hi) ** 0.5, face, yr, K)


def nm_curve(S, std, face="top", yr=0.0, n=90):
    K = Coefficients(std)
    D = depth(S)
    z = (lambda y: y) if face == "top" else (lambda y: D - y)
    dmax = max(z(s["y"]) for s in S.bars + S.tend)
    eb = std.get("AS5100.5:strain:balanced_steel").value
    pc = std.get("AS5100.5:capacity_factor:phi_compression").value
    pt = std.get("AS5100.5:capacity_factor:phi_tension_point").value
    dnb = K.ecu / (K.ecu + eb) * dmax
    Nub = at(S, std, dnb, face, yr, K)["N"]
    pts = []
    for i in range(n + 1):
        dn = dmax * 10 ** (-2.2 + 3.6 * i / n)
        r = at(S, std, dn, face, yr, K)
        if r["N"] >= 0:
            ph = K.phi(r["kuo"])
        else:
            ph = pc if r["N"] <= Nub else pc + (K.phi(r["kuo"]) - pc) * (1 - r["N"] / Nub)
        pts.append({"N": r["N"] / 1e3, "M": r["M"] / 1e6, "phi": ph, "dn": dn})
    Tt = sum(b["fsy"] * b["A"] for b in S.bars) + sum(t["fpb"] * t["A"] for t in S.tend)
    Mt = sum(b["fsy"] * b["A"] * (b["y"] - yr) for b in S.bars) + sum(t["fpb"] * t["A"] * (t["y"] - yr) for t in S.tend)
    pts.insert(0, {"N": Tt / 1e3, "M": Mt / 1e6, "phi": pt, "dn": 0.0})
    return {"pts": pts, "Nub": Nub / 1e3, "standards_status": K.status}
