#!/usr/bin/env python3
"""P3 solver tests.  Run: python3 tests/model/test_solver.py   (PASS/FAIL per assertion; exit 1 on any failure)
Closed-form beam cases (ANALYSIS_METHOD §5) and the dashboard's integrated BR13A model (V5, same model -> same answer)."""
import json, os, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.model.solver import Model

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


close = lambda a, b, tol=1e-9: abs(a - b) <= tol * max(1.0, abs(b))
E, nu, A, I, J, L, w, n = 30e6, 0.2, 0.3, 0.0025, 0.004, 10.0, 12.0, 10
m = Model()
for i in range(n + 1): m.node(i, i * L / n, 0, 0)
for i in range(n): m.beam(i, i, i + 1, E, nu, A, I, I, J, w=w)
m.fix(0, "111100"); m.fix(n, "011000")
r = m.solve()
t("SS beam, self weight: reactions wL/2", close(r["reactions"][0][2], w * L / 2) and close(r["reactions"][n][2], w * L / 2))
t("SS beam: midspan deflection 5wL⁴/384EI", close(r["u"][n // 2][2], -5 * w * L ** 4 / (384 * E * I)))
t("SS beam: midspan moment wL²/8 (end force of the element starting at midspan)", close(m.end_forces(n // 2)[4], w * L * L / 8, 1e-8))
t("SS beam: equilibrium residual < 1e-9 of the load", np.abs(r["equilibrium_residual"]).max() < 1e-9 * w * L)
m = Model(); P = 10.0
for i in range(n + 1): m.node(i, 0, i * L / n, 0)
for i in range(n): m.beam(i, i, i + 1, E, nu, A, I, I, J)
m.fix(0); m.load(n, (0, 0, -P, 0, 0, 0)); r = m.solve()
t("cantilever (along Y), tip load: PL³/3EI and root moment PL", close(r["u"][n][2], -P * L ** 3 / (3 * E * I)) and close(abs(r["reactions"][0][3]), P * L, 1e-8))
m = Model(); As = 0.25; G = E / (2 * (1 + nu))
for i in range(n + 1): m.node(i, i * L / n, 0, 0)
for i in range(n): m.beam(i, i, i + 1, E, nu, A, I, I, J, Asy=As, Asz=As)
m.fix(0); m.load(n, (0, 0, -P, 0, 0, 0)); r = m.solve()
t("Timoshenko cantilever: PL³/3EI + PL/(G·As)", close(r["u"][n][2], -(P * L ** 3 / (3 * E * I) + P * L / (G * As))))
m = Model(); m.node(1, 0, 0, 0); m.spring(1, (1, 1, 250, 1, 1, 1)); m.load(1, (0, 0, -10, 0, 0, 0)); r = m.solve()
t("ground spring: u = F/k and spring force balances the load", close(r["u"][1][2], -0.04) and np.abs(r["equilibrium_residual"]).max() < 1e-12)
m = Model(); m.node(1, 0, 0, 0); m.node(2, 0, 0, 0); m.link(1, 1, 2, (1e3, 1e3, 500, 1e3, 1e3, 1e3)); m.fix(1); m.fix(2, "110111"); m.load(2, (0, 0, -10, 0, 0, 0)); r = m.solve()
t("zero-length elastic link: u = F/k", close(r["u"][2][2], -0.02))
m = Model(); m.node(1, 0, 0, 0); m.node(2, 1, 0, 0); m.beam(1, 1, 2, E, nu, A, I, I, J)
try:
    m.solve(); ok = False
except ValueError as e:
    ok = "singular" in str(e) or "mechanism" in str(e)
t("unsupported structure is refused (mechanism), not solved", ok)

F = json.load(open(os.path.join(R, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
m = Model()
for nn, x, y, z in F["nodes"]: m.node(nn, x, y, z)
for e in F["els"]: m.beam(e["id"], e["n1"], e["n2"], e["E"], e["nu"], e["A"], e["Iy"], e["Iz"], e["J"], e["Asy"], e["Asz"], w=e["w"])
for l in F["links"]: m.link(l["id"], l["n1"], l["n2"], l["k"], beta=l["beta"], dry=l["dry"], drz=l["drz"])
for s in F["spr"]:
    k = [0] * 6; k[s["k6"]] = s["k"]; m.spring(s["n"], k)
fx = {}
for d in F["fixed_dofs"]: fx.setdefault(F["ids"][d // 6], ["0"] * 6)[d % 6] = "1"
for nn, f in fx.items(): m.fix(nn, "".join(f))
r = m.solve(gravity=F["gravity"])
U = np.array(F["U"]); u = np.concatenate([r["u"][nn] for nn in F["ids"]])
t(f"BR13A integrated model ({len(U)} dof, links, springs): displacements equal the dashboard solver to 1e-8 relative (V5)",
  abs(u - U).max() <= 1e-8 * abs(U).max(), f"{abs(u - U).max():.2e}")
t("BR13A integrated model: equilibrium residual < 1e-6 of the self weight", np.abs(r["equilibrium_residual"]).max() < 1e-6 * abs(r["applied"][2]))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
