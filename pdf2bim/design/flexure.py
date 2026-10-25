"""Flexural strength of a composite prestressed section by strain compatibility (P4.5 stage 1). N, mm, MPa.

    from pdf2bim.design.flexure import Section, strips_from_layers, uls_bend
    S = Section(conc=strips_from_layers(layers, dz=2), bars=[...], tend=[...])
    r = uls_bend(S, std)          # dn, kuo, Mu (kN m), phi, phiMu, gamma, alpha2 of the top fibre, steel stresses

Port of the dashboard's section engine (src/dsg_engine.js ulsBend, stripsFromLayers, elastic, fpMattock), generalised
and with every coefficient read from the standards data (code-extracted-UNVERIFIED):
  alpha2, gamma            AS5100.5:stress_block:alpha2 / :gamma  (clamp(a - b f'c, min, max))
  ecu                      AS5100.5:strain:ecu
  phi                      AS5100.5:capacity_factor:phi_bending   (clamp(a - b kuo / c, min, max))
  strand curve             AS5100.5:strand:stress_strain_mattock  (PCI form, not AS 5100.5)
Geometry: y measured DOWN from the section top; sagging + (compression at the top); axial tension +.
Concrete strips {y, h, b, E, fc}; bars {y, A, E, fsy}; tendons {y, A, E, fpb, epe (effective prestrain, tension +),
bil (True: elastic-plastic capped at fpb)}.
Method (as the dashboard): rectangular stress block alpha2 f'c over gamma dn from the top, alpha2 of each strip from
its own f'c, gamma from the TOP strip's f'c (the compression block is normally in the deck); partial strips integrated
exactly; steel strain ecu (y - top - dn) / dn (+ epe for tendons); bars elastic-plastic; a bar in the block gives back
the displaced concrete (alpha2 f'c A); dn by bisection on N = 0 (100 halvings); kuo = dn / (depth of the deepest bar
or tendon below the top); Mu about the top fibre (no axial force).
"""
import math


def strips_from_layers(layers, dz=5.0):
    """Trapezoid layers {h, b1, b2, v1, v2 (void widths), E, fc, grp} from the top -> strips."""
    out, y0 = [], 0.0
    for L in layers:
        n = max(1, math.ceil(L["h"] / dz)); d = L["h"] / n
        for i in range(n):
            t = (i + 0.5) / n
            b = (L["b1"] + (L["b2"] - L["b1"]) * t) - ((L.get("v1") or 0) + ((L.get("v2") or 0) - (L.get("v1") or 0)) * t)
            if b > 0:
                out.append({"y": y0 + (i + 0.5) * d, "h": d, "b": b, "E": L["E"], "fc": L["fc"], "grp": L.get("grp", "")})
        y0 += L["h"]
    return out


def strips_from_polygon(P, H, y_top, E, fc, grp="", dz=5.0):
    """Closed polygon [[x, y]] (y UP from its soffit, height H) placed with its top at depth y_top -> strips."""
    out = []
    n = math.ceil(H / dz); d = H / n
    for i in range(n):
        yu = H - (i + 0.5) * d
        xs = []
        for k in range(len(P)):
            a, b = P[k], P[(k + 1) % len(P)]
            if (a[1] <= yu < b[1]) or (b[1] <= yu < a[1]):
                xs.append(a[0] + (b[0] - a[0]) * (yu - a[1]) / (b[1] - a[1]))
        xs.sort()
        w = sum(xs[j + 1] - xs[j] for j in range(0, len(xs) - 1, 2))
        if w > 0:
            out.append({"y": y_top + (i + 0.5) * d, "h": d, "b": w, "E": E, "fc": fc, "grp": grp})
    return out


class Section:
    def __init__(self, conc, bars=None, tend=None):
        if not conc:
            raise ValueError("section without concrete strips")
        self.conc, self.bars, self.tend = list(conc), list(bars or []), list(tend or [])

    def strip_at(self, y):
        for c in self.conc:
            if abs(c["y"] - y) <= c["h"] / 2:
                return c
        return None


def _clamp(v, a, b):
    return max(a, min(b, v))


class Coefficients:
    """The flexure coefficients from the standards data (all unverified)."""

    def __init__(self, std):
        self.al = std.get("AS5100.5:stress_block:alpha2").value
        self.ga = std.get("AS5100.5:stress_block:gamma").value
        self.ecu = std.get("AS5100.5:strain:ecu").value
        self.ph = std.get("AS5100.5:capacity_factor:phi_bending").value
        self.mt = std.get("AS5100.5:strand:stress_strain_mattock").value
        self.status = std.result_status()

    def alpha2(self, fc):
        a = self.al
        return _clamp(a["a"] - a["b"] * fc, a["min"], a["max"])

    def gamma(self, fc):
        g = self.ga
        return _clamp(g["a"] - g["b"] * fc, g["min"], g["max"])

    def phi(self, kuo):
        p = self.ph
        return _clamp(p["a"] - p["b"] * kuo / p["c"], p["min"], p["max"])

    def strand(self, T, e):
        s = abs(e)
        if T.get("bil"):
            f = T["E"] * s
        else:
            A, B, C = self.mt["A"], self.mt["B"], self.mt["C"]
            f = T["E"] * s * (A + (1 - A) / (1 + (B * s) ** C) ** (1 / C))
        f = min(f, T["fpb"])
        return -f if e < 0 else f


def elastic(S, Eref):
    """Uncracked transformed properties (reference modulus Eref): A, centroid depth yc, I about the centroid (mm)."""
    A = Sy = I = 0.0
    for c in S.conc:
        n = c["E"] / Eref; a = c["b"] * c["h"] * n
        A += a; Sy += a * c["y"]; I += a * c["y"] ** 2 + n * c["b"] * c["h"] ** 3 / 12
    for s in S.bars + S.tend:
        c = S.strip_at(s["y"])
        n = s["E"] / Eref - (c["E"] / Eref if c else 0.0); a = s["A"] * n
        A += a; Sy += a * s["y"]; I += a * s["y"] ** 2
    yc = Sy / A
    return {"A": A, "yc": yc, "I": I - A * yc * yc, "Eref": Eref}


def uls_bend(S, std, gamma=None, no_comp_bars=False, iterations=100):
    """Sagging ultimate moment by strain compatibility. Returns dn, kuo, Mu (kN m), phi, phiMu, gamma, C (N), steel."""
    K = Coefficients(std)
    ecu = K.ecu
    top = min(c["y"] - c["h"] / 2 for c in S.conc)
    fc_top = next(c for c in S.conc if c["y"] - c["h"] / 2 <= top + 1e-6)["fc"]
    g = gamma if gamma is not None else K.gamma(fc_top)
    steel = S.bars + S.tend
    if not steel:
        raise ValueError("no bars or tendons: no tension resultant")
    dmax = max(s["y"] for s in steel)

    def forces(dn):
        C = Mc = 0.0
        yb = top + g * dn
        for c in S.conc:
            y1, y2 = c["y"] - c["h"] / 2, c["y"] + c["h"] / 2
            lo, hi = max(y1, top), min(y2, yb)
            if hi > lo:
                f = K.alpha2(c["fc"]) * c["fc"] * c["b"] * (hi - lo)
                C += f; Mc += f * (lo + hi) / 2
        T = Mt = 0.0; det = []
        for b in S.bars:
            if no_comp_bars and b["y"] < dn:
                continue
            e = ecu * (b["y"] - top - dn) / dn
            s = _clamp(b["E"] * e, -b["fsy"], b["fsy"])
            cs = S.strip_at(b["y"]); fcb = cs["fc"] if cs else None
            if b["y"] < yb and s < 0:
                if fcb is None:
                    raise ValueError(f"bar at y = {b['y']} in the compression block but outside every concrete strip")
                s_eff = s + K.alpha2(fcb) * fcb
            else:
                s_eff = s
            f = s_eff * b["A"]; T += f; Mt += f * b["y"]; det.append({"t": "bar", "y": b["y"], "e": e, "s": s})
        for t in S.tend:
            e = t["epe"] + ecu * (t["y"] - top - dn) / dn
            s = K.strand(t, e)
            f = s * t["A"]; T += f; Mt += f * t["y"]; det.append({"t": "tend", "y": t["y"], "e": e, "s": s})
        return {"N": T - C, "M": Mt - Mc, "C": C, "T": T, "det": det}

    lo, hi = 1.0, max(c["y"] + c["h"] / 2 for c in S.conc)
    for _ in range(iterations):
        mid = (lo + hi) / 2
        if forces(mid)["N"] > 0:
            lo = mid
        else:
            hi = mid
    dn = (lo + hi) / 2
    F = forces(dn)
    kuo = dn / (dmax - top)
    Mu = F["M"] / 1e6
    phi = K.phi(kuo)
    return {"dn": dn, "kuo": kuo, "Mu": Mu, "phi": phi, "phiMu": phi * Mu, "gamma": g, "C": F["C"], "N_residual": F["N"], "steel": F["det"],
            "top": top, "d_kuo": dmax - top, "standards_status": K.status}
