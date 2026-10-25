#!/usr/bin/env python3
"""P4.5 stage 3 shear / torsion tests: coefficients from the standards data (the port-equals-engine grid fails if any
inventoried coefficient differs from the code),
hand checks of the general-method chain on one case, both ex branches and clamps, minimum-steel switch, torsion steel
taken from the shear steel, monotonic behaviour, and the port against the dashboard's engine on a grid of actions and
section variants, plus its V-M curve (Node, V5)."""
import itertools, json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.shear import shear, vm
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
c = std.get("AS5100.5:shear:general_method").value
t("coefficients from the standards data, code-extracted-unverified", std.get("AS5100.5:shear:general_method").status == "code-extracted-unverified")
phi = std.get("AS5100.5:capacity_factor:phi_shear_torsion").value
Q = {"fc": 50.0, "bv": 220.0, "dv": 1700.0, "Pv": 50e3, "Apt": 3000.0, "spo": 1000.0, "Ast": 2000.0, "Es": 2e5, "Ep": 1.95e5, "Ec": 34800.0, "Act": 5e5,
     "fsyf": 500.0, "AsvS": 0.5, "AswS": 0.4, "dg": 20.0, "Ao": 1.5e6, "uh": 6000.0, "Acp": 2.0e6, "uc": 7000.0, "y1": 1500.0, "fsy": 500.0, "fpb": 1830.0}
L = {"V": 1500.0, "T": 400.0, "M": 6000.0, "N": -200.0}
o = shear(Q, L, std)
# hand chain (independent arithmetic of the coded formulas, stated in the standards entry)
V, T, M, N = 1.5e6, 4e8, 6e9, -2e5
Teq = c["torsion_equivalent_shear"] * T * Q["uh"] / (2 * Q["Ao"])
Veff = math.sqrt((V - Q["Pv"]) ** 2 + Teq ** 2)
ex = (M / Q["dv"] + Veff + c["axial_in_ex"] * N - Q["Apt"] * Q["spo"]) / (2 * (Q["Es"] * Q["Ast"] + Q["Ep"] * Q["Apt"]))
ex = min(max(ex, c["ex_min"]), c["ex_max"])
th = c["theta_deg"]["a"] + c["theta_deg"]["b"] * ex
ct = 1 / math.tan(math.radians(th))
kv = c["kv"]["a"] / (1 + c["kv"]["b"] * ex)
AswReq = T / (phi * Q["fsyf"] * 2 * Q["Ao"] * ct)
Vuc = kv * Q["bv"] * Q["dv"] * min(math.sqrt(50), c["sqrt_fc_max"])
Vus = (Q["AsvS"] + 2 * max(0, Q["AswS"] - AswReq)) * Q["fsyf"] * Q["dv"] * ct
t("hand chain: Teq, Veff, ex, theta, kv (min. steel provided), Vuc, Vus (1e-12 relative)",
  all(abs(a / b - 1) < 1e-12 for a, b in ((o["Teq"], Teq), (o["Veff"], Veff), (o["ex"], ex), (o["th"], th), (o["kv"], kv), (o["Vuc"], Vuc), (o["Vus"], Vus))) and o["minV"],
  f"ex {o['ex']:.3e}, theta {o['th']:.2f}, Vuc {o['Vuc'] / 1e3:.0f} kN, Vus {o['Vus'] / 1e3:.0f} kN")
t("utilisations: uV = Veff / (phi (Vuc + Vus)), uCr = Veff / (phi Vu,max), u = max of the four",
  abs(o["uV"] - Veff / (phi * (Vuc + Vus))) < 1e-12 and abs(o["uCr"] - Veff / (phi * c["vu_max"] * 50 * 220 * 1700 * ct / (1 + ct * ct))) < 1e-12
  and o["u"] == max(o["uCr"], o["uV"], o["uT"], o["uL"]))
o2 = shear(Q, {"V": 100.0, "T": 0, "M": 0, "N": -3000.0}, std)
t("ex < 0 branch: concrete tension-side term added to the denominator, then the lower clamp",
  o2["denUsed"] == "2(EsAst + EpApt + EcAct)" and o2["ex"] >= c["ex_min"] and abs(o2["th"] - (c["theta_deg"]["a"] + c["theta_deg"]["b"] * o2["ex"])) < 1e-12)
o3 = shear(Q, {"V": 5000.0, "T": 0, "M": 60000.0, "N": 0}, std)
t("ex upper clamp", o3["ex"] == c["ex_max"])
Qn = dict(Q, AsvS=0.0, AswS=0.0)
o4 = shear(Qn, {"V": 800.0, "T": 0, "M": 3000.0, "N": 0}, std)
kd = max(c["kdg"]["min"], c["kdg"]["a"] / (c["kdg"]["b"] + 20))
t("below minimum shear steel: kv x c / (d + kdg dv); no ties and T > 0 -> uT infinite",
  not o4["minV"] and abs(o4["kv"] - c["kv"]["a"] / (1 + c["kv"]["b"] * o4["ex"]) * c["kv"]["c"] / (c["kv"]["d"] + kd * 1700)) < 1e-15
  and shear(Qn, {"V": 800.0, "T": 10.0, "M": 0, "N": 0}, std)["uT"] == math.inf)
t("torsion steel is taken out of the shear steel: Vus falls as T rises (same V, M, N)",
  shear(Q, dict(L, T=0.0), std)["Vus"] > o["Vus"] > shear(Q, dict(L, T=800.0), std)["Vus"])
t("more stirrups -> lower uV; larger T -> higher uT and Veff", shear(dict(Q, AsvS=1.0), L, std)["uV"] < o["uV"] and shear(Q, dict(L, T=800), std)["uT"] > o["uT"])

o5 = shear(dict(Q, Ao=0.0), {"V": 500.0, "T": 0.0, "M": 1000.0, "N": 0}, std)
o6 = shear(dict(Q, Ao=0.0), {"V": 500.0, "T": 100.0, "M": 1000.0, "N": 0}, std)
t("no torsion cell (Ao = 0): T = 0 -> uT 0 and a finite uL (dashboard: NaN, H-9); T > 0 -> uT and uL infinite",
  o5["uT"] == 0 and math.isfinite(o5["uL"]) and math.isfinite(o5["u"]) and o6["uT"] == math.inf and o6["uL"] == math.inf)

# port vs the dashboard engine
js = r"""
global.DSG=require(process.argv[1]+'/src/dsg_engine.js'); const D2=require(process.argv[1]+'/src/dsg_engine2.js');
const cases=JSON.parse(process.argv[2]); const out=cases.map(([Q,L])=>{ const o=D2.shear(Q,L); const r={}; Object.keys(o).forEach(k=>{ r[k]=(typeof o[k]==='number'&&!isFinite(o[k]))?String(o[k]):o[k]; }); return r; });
const v=D2.vm(cases[0][0],{T:200,N:-100},15000);
console.log(JSON.stringify({out,v}));
"""
variants = [Q, dict(Q, AsvS=0.0, AswS=0.0), dict(Q, Pv=0.0, Fpt=2.0e6), dict(Q, dg=10.0, fc=80.0), dict(Q, AswS=1.2, AsvS=0.1)]
acts = [{"V": v_, "T": t_, "M": m_, "N": n_} for v_, t_, m_, n_ in itertools.product((0.0, 300.0, 2500.0), (0.0, 250.0), (0.0, 8000.0), (-1500.0, 0.0, 400.0))]
cases = [(q, a) for q in variants for a in acts]
J = json.loads(subprocess.run(["node", "-e", js, R, json.dumps(cases)], capture_output=True, text=True, check=True).stdout)
bad = []
for (q, a), ref in zip(cases, J["out"]):
    mine = shear(q, a, std)
    for k_, rv in ref.items():
        mv = mine[k_]
        if isinstance(rv, str):
            ok = str(mv).lower().startswith(rv.lower()[:3]) or (rv == "Infinity" and mv == math.inf)
        elif isinstance(rv, bool):
            ok = mv == rv
        else:
            ok = abs(mv - rv) <= 1e-9 * max(abs(rv), 1.0)
        if not ok:
            bad.append((k_, mv, rv))
t(f"port = dashboard engine: every output of shear() on {len(cases)} cases (5 section variants x 36 action sets; 1e-9)", not bad, str(bad[:3]))
mv = vm(Q, {"T": 200, "N": -100}, 15000, std)
t("port = dashboard engine: V-M curve (41 points, 1e-9)", all(abs(a["V"] - b["V"]) <= 1e-9 * max(b["V"], 1) and a["M"] == b["M"] for a, b in zip(mv, J["v"])) and len(mv) == len(J["v"]))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
