#!/usr/bin/env python3
"""P4.5 stage 2 tests: SLS strain plane (uncracked closed form, cracked rectangle closed form, prestress state) and the
N-M interaction (pure bending = uls_bend, symmetric hogging, tension point, phi rule, axial-force solve), plus the port
against the dashboard's engine on its worked-example section (Node-evaluated, V5)."""
import json, math, os, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.flexure import Section, strips_from_layers, uls_bend, elastic, Coefficients
from pdf2bim.design.sls import solve, stress, prestress_state, response
from pdf2bim.design.nm import at, mu_at_n, nm_curve
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
K = Coefficients(std)
rel = lambda a, b: abs(a - b) / max(abs(b), 1e-12)

# ---- SLS: plain rectangle, uncracked: sigma = N / A + M (y - yc) / I ----
b, h, E = 800.0, 1200.0, 32000.0
P = Section(strips_from_layers([{"h": h, "b1": b, "b2": b, "E": E, "fc": 40}], dz=4))
A, I, yc = b * h, b * h ** 3 / 12, h / 2
N, M = -2.0e6, 900e6
pl = solve(P, N, M, yc)
ok = all(abs(stress(P, pl, y) - (N / A + M * (y - yc) / I)) < 1e-4 for y in (0.0, 300.0, 600.0, 1200.0))
t("SLS uncracked rectangle: sigma(y) = N / A + M (y - yc) / I at the top, inside and the bottom (1e-4 MPa)", ok and pl["converged"])
# ---- SLS: cracked rectangle with one bar layer, N = 0: b x^2 / 2 = n As (d - x); fs = M / (As (d - x / 3)) ----
d, As, Es = 1100.0, 6000.0, 200000.0
Rb = Section(P.conc, bars=[{"y": d, "A": As, "E": Es, "fsy": 500}])
Mc = 1500e6
pc = solve(Rb, 0.0, Mc, 0.0, cracked=True)
n = Es / E
x = (-n * As + math.sqrt((n * As) ** 2 + 2 * b * n * As * d)) / b
fs = Es * (pc["e0"] + pc["k"] * d)
xa = -pc["e0"] / pc["k"]
t("SLS cracked rectangle: neutral axis from b x^2 / 2 = n As (d - x), steel stress M / (As (d - x / 3)) (strip size 4 mm: 0.1 %)",
  rel(xa, x) < 1e-3 and rel(fs, Mc / (As * (d - x / 3))) < 1e-3, f"x {xa:.2f} vs {x:.2f}, fs {fs:.2f} vs {Mc / (As * (d - x / 3)):.2f}")
N0, M0 = response(Rb, pc["e0"], pc["k"], True)
t("SLS solve: residuals within the stated tolerances (|N| < 1e-3 N, |M - Mc| < 0.1 (1 + Mc) N mm)", abs(N0) < 1e-3 and abs(M0 - Mc) < 0.1 * (1 + Mc) and pc["converged"])

# ---- N-M: rectangle with symmetric bars ----
Sym = Section(P.conc, bars=[{"y": 80.0, "A": 4000, "E": Es, "fsy": 500}, {"y": 1120.0, "A": 4000, "E": Es, "fsy": 500}])
u = uls_bend(Sym, std)
r0 = mu_at_n(Sym, std, 0.0, "top", 0.0)
t("N-M at N = 0 (compression at the top, M about the top) = the ULS bending result (dn, Mu; 1e-6)", rel(r0["dn"], u["dn"]) < 1e-6 and rel(r0["M"] / 1e6, u["Mu"]) < 1e-6,
  f"dn {r0['dn']:.3f} vs {u['dn']:.3f}, M {r0['M'] / 1e6:.1f} vs {u['Mu']:.1f}")
rt, rb_ = mu_at_n(Sym, std, 0.0, "top", h / 2), mu_at_n(Sym, std, 0.0, "bot", h / 2)
t("N-M symmetric section: hogging capacity = - sagging capacity about mid-depth (1e-9)", rel(rb_["M"], -rt["M"]) < 1e-9)
C = nm_curve(Sym, std, "top", h / 2)
p0 = C["pts"][0]
t("N-M tension point: every bar at fsy, phi = phi_tension_point; curve has 92 points",
  abs(p0["N"] - 8000 * 500 / 1e3) < 1e-9 and abs(p0["M"]) < 1e-9 and p0["phi"] == std.get("AS5100.5:capacity_factor:phi_tension_point").value and len(C["pts"]) == 92)
pc_ = std.get("AS5100.5:capacity_factor:phi_compression").value
okp = all((q["phi"] == pc_) if q["N"] * 1e3 <= C["Nub"] * 1e3 else True for q in C["pts"][1:])
mid = [q for q in C["pts"][1:] if C["Nub"] < q["N"] < 0]
okp &= all(pc_ - 1e-12 <= q["phi"] <= 0.8 + 1e-12 for q in mid) and len(mid) > 0
t("N-M phi: phi_compression at and above the balanced load, between it and the bending phi below (linear in N)", okp)
Nt = -5.0e6
r5 = mu_at_n(Sym, std, Nt, "top", h / 2)
t("N-M at a given axial force: the state found carries that force (1e-6 relative)", rel(r5["N"], Nt) < 1e-6)
t("N-M beyond the squash load / tension capacity: None", mu_at_n(Sym, std, -1e9, "top", h / 2) is None and mu_at_n(Sym, std, 1e9, "top", h / 2) is None)

# ---- port vs the dashboard engine on its worked-example section ----
js = r"""
const D=require(process.argv[1]+'/src/dsg_engine.js'); global.DSG=D; const D2=require(process.argv[1]+'/src/dsg_engine2.js');
const log=console.log; console.log=()=>{}; const {S,yr}=require(process.argv[1]+'/tests/engine/dsg_test.js'); console.log=log;
// dsg_test has already set the prestress state and t.epe = t.pre
const H=2400, st=(M,cr)=>{ const s=D.solveSLS(S,0,M*1e6,yr,cr); return {top:S.conc[0].E*(s.e0), bot:S.conc[S.conc.length-1].E*(s.e0+s.k*H), e0:s.e0, k:s.k}; };
const nmT=D2.nm(S,'top',yr), nmB=D2.nm(S,'bot',yr), m1=D2.muAtN(S,-3e6,'top',yr);
console.log(JSON.stringify({conc:S.conc,bars:S.bars,tend:S.tend,yr,u:st(15000,false),c:st(15000,true),c2:st(40000,true),nmT,nmB,m1:{N:m1.N,M:m1.M,dn:m1.dn}}));
"""
J = json.loads(subprocess.run(["node", "-e", js, R], capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
SW = Section(J["conc"], J["bars"], [dict(x) for x in J["tend"]])
ok = True
for key, M_, cr in (("u", 15000, False), ("c", 15000, True), ("c2", 40000, True)):
    p = solve(SW, 0.0, M_ * 1e6, J["yr"], cr)
    ok &= abs(SW.conc[0]["E"] * p["e0"] - J[key]["top"]) < 1e-6 and abs(SW.conc[-1]["E"] * (p["e0"] + p["k"] * 2400) - J[key]["bot"]) < 1e-6
t("port = dashboard engine: SLS top / bottom stresses at 15 000 kN m (uncracked, cracked) and 40 000 kN m cracked (1e-6 MPa)", ok)
S2 = Section(J["conc"], J["bars"], [{k: v for k, v in x.items() if k not in ("pre", "epe")} for x in J["tend"]])
ts = prestress_state(S2, J["yr"])
t("prestress state: each tendon at its effective stress at N = M = 0 (solver tolerance: 1e-3 MPa), prestrain = the dashboard's (1e-9)",
  all(abs(a - x["spe"]) < 1e-3 for a, x in zip(ts, S2.tend)) and all(abs(a["pre"] - b["pre"]) < 1e-9 * abs(b["pre"]) for a, b in zip(S2.tend, J["tend"])))
okn = True
for face, key in (("top", "nmT"), ("bot", "nmB")):
    C = nm_curve(SW, std, face, J["yr"])
    okn &= abs(C["Nub"] - J[key]["Nub"]) <= 1e-9 * abs(J[key]["Nub"]) and len(C["pts"]) == len(J[key]["pts"])
    okn &= all(abs(a["N"] - b["N"]) <= 1e-9 * max(abs(b["N"]), 1) and abs(a["M"] - b["M"]) <= 1e-9 * max(abs(b["M"]), 1) and abs(a["phi"] - b["phi"]) < 1e-12 for a, b in zip(C["pts"], J[key]["pts"]))
t("port = dashboard engine: N-M curves, both faces (92 points: N, M, phi; balanced load; 1e-9)", okn)
m1 = mu_at_n(SW, std, -3e6, "top", J["yr"])
t("port = dashboard engine: state at N = -3000 kN (dn, M; 1e-9)", rel(m1["dn"], J["m1"]["dn"]) < 1e-9 and rel(m1["M"], J["m1"]["M"]) < 1e-9)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
