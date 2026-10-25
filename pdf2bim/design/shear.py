"""Shear and torsion by the general method (P4.5 stage 3). Inputs N, mm, MPa; actions kN, kN m (N tension +).

    from pdf2bim.design.shear import shear, vm
    o = shear(Q, {"V": V, "T": T, "M": M, "N": N}, std)   # utilisations uCr, uV, uT, uL and the intermediate values
    pts = vm(Q, {"T": T, "N": N}, Mmax, std)              # phi Vu(M) for fixed T, N (41 points)

Port of the dashboard's engine (src/dsg_engine2.js shear / vm). Every coefficient from the standards data
(code-extracted-UNVERIFIED): AS5100.5:shear:general_method, AS5100.5:capacity_factor:phi_shear_torsion.
Section data Q: fc, bv, dv, Pv (vertical prestress component, N), Apt, spo (tendon stress at the decompression state),
Ast, Es, Ep, Ec, Act (concrete area on the tension side), fsyf, AsvS (mm2/mm, shear-only legs), AswS (mm2/mm, one leg of
the closed tie per web), dg, Ao, uh, Acp, uc, y1, fsy, fpb, Fpt (optional tendon force capacity at the station).
Method (as coded):
- Teq = k_t T uh / (2 Ao) (torsion as an equivalent shear on the walls); Veff = sqrt(max(V - Pv, 0)^2 + Teq^2);
- ex = (M / dv + Veff + a N - Apt spo) / (2 (Es Ast + Ep Apt)), and with + Ec Act in the denominator if negative,
  clamped to [ex_min, ex_max]; theta = a + b ex (degrees);
- minimum shear steel Asv,min = k sqrt(f'c) bv / fsy.f; kv = a / (1 + b ex) x (Asv >= Asv,min ? 1 : c / (d + kdg dv));
- closed-tie legs needed for torsion are taken out of the shear steel; Vuc = kv bv dv min(sqrt f'c, cap);
  Vus = Asv,net fsy.f dv cot; Vu,max = k f'c bv dv cot / (1 + cot^2); Tus = Asw fsy.f 2 Ao cot;
- longitudinal tension demand vs Ast fsy + tendon force;
- utilisations uCr (crushing), uV, uT, uL; governing u = max.
Deviation from the dashboard (finding H-9): with no closed torsion cell (Ao = 0) and T = 0 the dashboard returns NaN for
the longitudinal and torsion utilisations (0 / 0); here they are 0 (no torsion), and infinite when T > 0."""
import math


def _coef(std):
    return std.get("AS5100.5:shear:general_method").value, std.get("AS5100.5:capacity_factor:phi_shear_torsion").value


def shear(Q, L, std, C=None):
    c, phi = C or _coef(std)
    V = abs(L["V"]) * 1e3; T = abs(L.get("T") or 0) * 1e6; M = abs(L.get("M") or 0) * 1e6; N = (L.get("N") or 0) * 1e3
    o = {}
    sf = min(math.sqrt(Q["fc"]), c["sqrt_fc_max"])
    o["Teq"] = c["torsion_equivalent_shear"] * T * Q["uh"] / (2 * Q["Ao"]) if Q["Ao"] > 0 else 0.0
    o["Veff"] = math.hypot(max(V - Q["Pv"], 0.0), o["Teq"])
    o["num"] = M / Q["dv"] + o["Veff"] + c["axial_in_ex"] * N - Q["Apt"] * Q["spo"]
    o["den1"] = 2 * (Q["Es"] * Q["Ast"] + Q["Ep"] * Q["Apt"]); o["ex"] = o["num"] / o["den1"]; o["denUsed"] = "2(EsAst + EpApt)"
    if o["ex"] < 0:
        o["den2"] = 2 * (Q["Es"] * Q["Ast"] + Q["Ep"] * Q["Apt"] + Q["Ec"] * Q["Act"]); o["ex"] = o["num"] / o["den2"]; o["denUsed"] = "2(EsAst + EpApt + EcAct)"
    o["ex"] = max(c["ex_min"], min(c["ex_max"], o["ex"]))
    o["th"] = c["theta_deg"]["a"] + c["theta_deg"]["b"] * o["ex"]
    ct = 1 / math.tan(math.radians(o["th"])); o["cot"] = ct
    o["AsvMin"] = c["asv_min"] * math.sqrt(Q["fc"]) * Q["bv"] / Q["fsyf"]
    o["Asv"] = Q["AsvS"] + 2 * Q["AswS"]
    o["minV"] = o["Asv"] >= o["AsvMin"]
    o["kdg"] = max(c["kdg"]["min"], c["kdg"]["a"] / (c["kdg"]["b"] + Q["dg"]))
    k = c["kv"]
    o["kv"] = k["a"] / (1 + k["b"] * o["ex"]) * (1.0 if o["minV"] else k["c"] / (k["d"] + o["kdg"] * Q["dv"]))
    o["AswReq"] = T / (phi * Q["fsyf"] * 2 * Q["Ao"] * ct) if (T > 0 and Q["Ao"] > 0 and ct > 0) else 0.0
    o["AsvNet"] = Q["AsvS"] + 2 * max(0.0, Q["AswS"] - o["AswReq"])
    o["Vuc"] = o["kv"] * Q["bv"] * Q["dv"] * sf
    o["Vus"] = o["AsvNet"] * Q["fsyf"] * Q["dv"] * ct
    o["Vumax"] = c["vu_max"] * Q["fc"] * Q["bv"] * Q["dv"] * ct / (1 + ct * ct)
    o["Tus"] = Q["AswS"] * Q["fsyf"] * 2 * Q["Ao"] * ct
    o["AswMin"] = c["asw_min"] * Q["y1"] / Q["fsyf"]; o["minT"] = Q["AswS"] >= o["AswMin"]
    o["Tcr"] = c["tcr"] * math.sqrt(Q["fc"]) * Q["Acp"] ** 2 / Q["uc"]
    lt = c["long_tension"]
    tors = 0.0 if T == 0 else (lt["torsion"] * Q["uh"] * T / (2 * Q["Ao"] * phi) if Q["Ao"] > 0 else math.inf)   # dashboard: NaN when Ao = 0 and T = 0 (H-9)
    o["Ftd"] = M / (lt["lever"] * Q["dv"]) + lt["axial"] * N / phi + ct * math.hypot(max(V / phi - Q["Pv"] - lt["vus"] * o["Vus"], 0.0), tors)
    o["Ftp"] = Q["Ast"] * Q["fsy"] + (Q["Fpt"] if Q.get("Fpt") is not None else Q["Apt"] * Q["fpb"])
    o["uCr"] = o["Veff"] / (phi * o["Vumax"])
    o["uV"] = o["Veff"] / (phi * (o["Vuc"] + o["Vus"]))
    o["uT"] = 0.0 if T == 0 else (T / (phi * o["Tus"]) if (Q["AswS"] > 0 and o["Tus"] > 0) else math.inf)
    o["uL"] = o["Ftd"] / o["Ftp"]
    o["u"] = max(o["uCr"], o["uV"], o["uT"], o["uL"]); o["phi"] = phi
    return o


def vm(Q, L, Mmax, std, n=40, iterations=60, V_hi=1e5):
    """phi Vu as a function of M for fixed T, N: per M, bisection on V (kN) where max(uCr, uV, uL) = 1."""
    C = _coef(std)
    out = []
    for i in range(n + 1):
        Mi = Mmax * i / n
        lo, hi = 0.0, V_hi
        for _ in range(iterations):
            v = (lo + hi) / 2
            o = shear(Q, {"V": v, "T": L.get("T"), "M": Mi, "N": L.get("N")}, std, C)
            if max(o["uCr"], o["uV"], o["uL"]) < 1:
                lo = v
            else:
                hi = v
        out.append({"M": Mi, "V": lo})
    return out
