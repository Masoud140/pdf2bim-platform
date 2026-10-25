#!/usr/bin/env python3
"""P4.5 design benchmark: the dashboard's reference example (src/dsg2_ui.js dgBench: 2.4 m composite trough girder,
50 MPa deck, 65 MPa beam, 120 strands) re-run with the Python design modules.

Reference values: the outputs of the reference spreadsheet as recorded in the dashboard (the spreadsheet itself uses a
compiled add-in and is NOT in the repository — provenance to be supplied by the owner, finding E-1). The quantities the
dashboard reports as agreeing are asserted against the spreadsheet with its stated tolerances; the ones it reports as
differing are printed (INFO), not asserted. Separately, every quantity must equal the dashboard's own dgBench result."""
import json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.flexure import Section, strips_from_layers, elastic, Coefficients
from pdf2bim.design.sls import solve
from pdf2bim.design.nm import mu_at_n
from pdf2bim.design.shear import shear
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
K = Coefficients(std)
fct_k = std.get("AS5100.5:concrete:flexural_tensile_strength").value
mins = std.get("AS5100.5:flexure:minimum_strength_factor").value
phiv = std.get("AS5100.5:capacity_factor:phi_shear_torsion").value
L = [{"h": 200, "b1": 4020, "b2": 4020, "E": 34800, "fc": 50}, {"h": 35, "b1": 4020, "b2": 4020, "v1": 1410, "v2": 1410, "E": 37400, "fc": 65},
     {"h": 55, "b1": 4020, "b2": 4020, "v1": 1310, "v2": 1299.2144, "E": 37400, "fc": 65}, {"h": 75, "b1": 2019.067, "b2": 1819.067, "v1": 1299.2144, "v2": 1284.5068, "E": 37400, "fc": 65},
     {"h": 1667, "b1": 1819.067, "b2": 1492.1654, "v1": 1284.5068, "v2": 957.6052, "E": 37400, "fc": 65}, {"h": 58, "b1": 1492.1654, "b2": 1480.7915, "v1": 957.6052, "v2": 0, "E": 37400, "fc": 65},
     {"h": 310, "b1": 1480.7915, "b2": 1420, "E": 37400, "fc": 65}]
bars = [{"y": r[0], "A": math.pi / 4 * r[1] ** 2 * r[2], "E": 200000, "fsy": 500} for r in [[28, 16, 27], [137, 16, 27], [255, 20, 2], [1432, 12, 2], [1632, 12, 2], [1832, 12, 2], [2032, 24, 2], [2092, 28, 2], [2364, 32, 2]]]
tend = [{"y": r[0], "A": 143 * r[1], "E": 195000, "fpb": 1830, "eu": 0.06, "pre": r[2] / 195000, "epe": r[2] / 195000} for r in [[2130, 18, 909], [2180, 26, 907], [2230, 26, 904], [2280, 26, 902], [2230, 24, 900]]]
S = Section(strips_from_layers(L, 2), bars, tend)
yr, H = elastic(S, 37400)["yc"], 2400.0


def run(M, cr):
    p = solve(S, 0.0, M * 1e6, yr, cr)
    return {"top": S.conc[0]["E"] * p["e0"], "bot": S.conc[-1]["E"] * (p["e0"] + p["k"] * H),
            "bars": [b["E"] * (p["e0"] + p["k"] * b["y"]) for b in S.bars], "tend": [x["E"] * (p["e0"] + p["k"] * x["y"] + x["pre"]) for x in S.tend]}


a = run(15000, False)
lo, hi = 0.0, 1e5
for _ in range(60):
    m = (lo + hi) / 2
    lo, hi = (m, hi) if run(m, False)["bot"] < 0 else (lo, m)
Md = lo; b0 = run(Md, False)


def inc(M):
    q = run(M, True)
    db = max(v - b0["bars"][j] for j, v in enumerate(q["bars"]) if S.bars[j]["y"] > yr)
    dt = max(v - b0["tend"][j] for j, v in enumerate(q["tend"]))
    return db, dt


fscr = 200.0     # benchmark input (reference example), not a standards value
lo, hi = Md, 1e5
for _ in range(60):
    m = (lo + hi) / 2
    lo, hi = (m, hi) if max(inc(m)) < fscr else (lo, m)
Ms_allow = lo
u = mu_at_n(S, std, 0.0, "top", yr)
phi = K.phi(u["kuo"])
fctf = fct_k * math.sqrt(65)
l2, h2 = 0.0, 2e5
for _ in range(70):
    m = (l2 + h2) / 2
    l2, h2 = (m, h2) if run(m, False)["bot"] < fctf else (l2, m)
half = H / 2
Ast = sum(b["A"] for b in S.bars if b["y"] > half); Apt = sum(x["A"] for x in S.tend if x["y"] > half)
nf = sum(b["A"] * b["fsy"] for b in S.bars if b["y"] > half) + sum(x["A"] * x["fpb"] for x in S.tend if x["y"] > half)
df = sum(b["A"] * b["fsy"] * b["y"] for b in S.bars if b["y"] > half) + sum(x["A"] * x["fpb"] * x["y"] for x in S.tend if x["y"] > half)
spo = sum(x["A"] * x["E"] * x["pre"] for x in S.tend if x["y"] > half) / Apt
Act = sum(c["b"] * c["h"] for c in S.conc if c["y"] > half)
dv = max(0.72 * H, 0.9 * df / nf)
Q = {"bv": 300, "dv": dv, "fc": 65, "Ec": 37400, "Es": 200000, "Ep": 195000, "Ast": Ast, "Apt": Apt, "spo": spo, "Act": Act, "fsyf": 500, "fsy": 500, "fpb": 1830,
     "AsvS": math.pi / 4 * 400 * 2 / 150, "AswS": math.pi / 4 * 400 / 150, "dg": 14, "Pv": 0, "uh": 7209.8977, "Ao": 3207883.9, "Aoh": 3550460.7, "Acp": 3972772.9, "uc": 8133.6625, "y1": 2292}
o = shear(Q, {"V": 4000, "T": 1400, "M": 40, "N": 0}, std)
sv = std.get("AS5100.5:shear:general_method").value
ex_ref = -1.6152e-4
th_ref = sv["theta_deg"]["a"] + sv["theta_deg"]["b"] * ex_ref
kv_ref = sv["kv"]["a"] / (1 + sv["kv"]["b"] * ex_ref)
P = {"top": a["top"], "bot": a["bot"], "Md": Md, "Ms_allow": Ms_allow, "phiMu": phi * u["M"] / 1e6, "Muo": u["M"] / 1e6, "dn": u["dn"], "kuo": u["kuo"], "Muo_min": mins * l2,
     "dv": dv, "ex": o["ex"], "th": o["th"], "kv": o["kv"], "phiVuc": phiv * o["Vuc"] / 1e3, "phiVus": phiv * o["Vus"] / 1e3, "phiVumax": phiv * o["Vumax"] / 1e3,
     "phiTcr": phiv * o["Tcr"] / 1e6, "AsvMin": o["AsvMin"] * 1000, "AswMin": o["AswMin"] * 1000, "uCr": o["uCr"], "uV": o["uV"], "uT": o["uT"], "uL": o["uL"]}

# --- the dashboard's own dgBench (Node) ---
js = r"""
global.DSG=require(process.argv[1]+'/src/dsg_engine.js'); global.DSG2=require(process.argv[1]+'/src/dsg_engine2.js');
global.anFmt=(v,d)=>JSON.stringify(+v); global.dgE=v=>JSON.stringify(+v); global.$=()=>({});
const src=require('fs').readFileSync(process.argv[1]+'/src/dsg2_ui.js','utf8'); const i=src.indexOf('function dgBench()'); const j=src.indexOf('\n}',i)+2;
eval(src.slice(i,j).replace('function dgBench(){','global.dgBench=function(){').replace("$('dg_bm').innerHTML=","return "));
const cells=[...dgBench().matchAll(/<td class="v">([^<]*)<\/td><td class="v">([^<]*)<\/td>/g)].map(m=>[m[1],m[2]]); console.log(JSON.stringify(cells));
"""
cells = json.loads(subprocess.run(["node", "-e", js, R], capture_output=True, text=True, check=True).stdout)
num = lambda s: [float(x) for x in s.replace("&minus;", "-").replace("−", "-").replace(" ", "").split("/")]
ref = lambda s: [float(x) for x in s.replace("&minus;", "-").replace(" ", "").replace(" ", "").split("/")]
keys = [("top", "bot"), ("Md",), ("Ms_allow",), ("phiMu",), ("Muo",), ("dn", "kuo"), ("Muo_min",), ("dv",), ("ex",), ("th", "kv"), None, ("phiVuc", "phiVus"), ("phiVumax",), ("phiTcr",),
        ("AsvMin", "AswMin"), ("uCr", "uV", "uT", "uL")]
dash, spread = {}, {}
for k, (cv, rv) in zip(keys, cells):
    if k is None:
        continue
    for kk, x, y in zip(k, num(cv), ref(rv)):
        dash[kk], spread[kk] = x, y
bad = [k for k in dash if abs(P[k] - dash[k]) > 1e-6 * max(abs(dash[k]), 1e-9)]
t("port = the dashboard's dgBench on every benchmark quantity (SLS, decompression, Ms,allow, Mu, dn, kuo, 1.2 Mcr, dv, ex, theta, kv, shear, torsion, utilisations; 1e-6)", not bad, str(bad))
agree = {"top": 1e-3, "bot": 1e-3, "Md": 1e-3, "Ms_allow": 1e-3, "phiMu": 2e-3, "Muo": 2e-3, "Muo_min": 5e-3}
rows = [(k, P[k], spread[k], P[k] / spread[k] - 1) for k in agree]
t("vs the reference spreadsheet (V4, tolerances as recorded): SLS stresses, decompression, Ms,allow within 0.1 %; phiMu, Muo within 0.2 %; 1.2 Mcr within 0.5 %",
  all(abs(d) <= agree[k] for k, _, _, d in rows), "; ".join(f"{k} {d:+.3%}" for k, _, _, d in rows))
t("vs the reference spreadsheet: minimum shear and torsion reinforcement Asv,min / s, Asw,min / s (to its 0.1 mm2/m)",
  abs(P["AsvMin"] - spread["AsvMin"]) < 0.05 and abs(P["AswMin"] - spread["AswMin"]) < 0.05, f"{P['AsvMin']:.2f} / {P['AswMin']:.2f}")
t("vs the reference spreadsheet: theta and kv from the spreadsheet's own ex (to its 0.01 deg / 1e-4)",
  abs(th_ref - spread["th"]) < 0.005 and abs(kv_ref - spread["kv"]) < 5e-5, f"{th_ref:.3f} / {kv_ref:.5f}")
for k in ("dn", "kuo", "dv", "ex", "th", "kv", "phiVuc", "phiVus", "phiVumax", "phiTcr", "uCr", "uV", "uT", "uL"):
    print(f"INFO differs from the spreadsheet (documented in the dashboard): {k} {P[k]:.5g} vs {spread[k]:.5g} ({P[k] / spread[k] - 1:+.1%})")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
