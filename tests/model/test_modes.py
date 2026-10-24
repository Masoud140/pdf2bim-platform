#!/usr/bin/env python3
"""P3b modal tests: closed-form frequencies, lumped mass, effective-mass sums, refusal of mechanisms, the dashboard's own
modal routine reproduced on the same model and mass (V5), and a regression guard P3b vs frozen (V5, not T7)."""
import json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R); sys.path.insert(0, os.path.join(R, "tools"))
from pdf2bim.model.solver import Model
from compare_frozen_integrated import frozen_model

res = []
G = 9.80665


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


E_, I, A, L, w = 3e7, 0.5, 1.0, 30.0, 25.0
mu = w / G


def beam(n, supports):
    m = Model()
    for i in range(n + 1):
        m.node(i, L * i / n, 0, 0)
    for i in range(n):
        m.beam(i + 1, i, i + 1, E_, 0.2, A, I, I, 1.0, None, None, w=w)
    for k, d in supports.items():
        m.fix(n if k == "end" else 0, d)
    return m


r = beam(40, {"start": "111100", "end": "011000"}).modes(4)["modes"]
f1, f2 = math.pi / (2 * L ** 2) * math.sqrt(E_ * I / mu), 4 * math.pi / (2 * L ** 2) * math.sqrt(E_ * I / mu)
t("simply supported beam: f1 and f2 = (n pi)^2 / (2 pi L^2) sqrt(EI / m) within 1e-6", abs(r[0]["f"] / f1 - 1) < 1e-6 and abs(r[2]["f"] / f2 - 1) < 1e-6,
  f"{r[0]['f']:.6f} vs {f1:.6f}; {r[2]['f']:.6f} vs {f2:.6f}")
t("simply supported beam: the two bending planes give equal frequencies (Iy = Iz)", abs(r[0]["f"] / r[1]["f"] - 1) < 1e-9)
rc = beam(40, {"start": "111111"}).modes(2)["modes"]
fc = 1.875104068711961 ** 2 / (2 * math.pi * L ** 2) * math.sqrt(E_ * I / mu)
t("cantilever: f1 = 1.8751^2 / (2 pi L^2) sqrt(EI / m) within 1e-6", abs(rc[0]["f"] / fc - 1) < 1e-6, f"{rc[0]['f']:.6f} vs {fc:.6f}")
m = Model(); m.node(1, 0, 0, 0); m.fix(1, "011111"); m.spring(1, (4.0e4, 0, 0, 0, 0, 0))
r1 = m.modes(1, extra_mass={1: 25.0})["modes"][0]
t("spring + lumped mass: w = sqrt(k / m); effective mass 1 in X", abs(r1["w"] - math.sqrt(4e4 / 25)) < 1e-9 and abs(r1["eff"]["X"] - 1) < 1e-12, f"{r1['w']:.6f}")
m = Model()
for i in range(4):
    m.node(i, 0, 0, 0)
for i in range(1, 4):
    m.fix(i, "011111")
m.fix(0, "111111")
for i in range(1, 4):
    m.link(i, i - 1, i, (1e4 * i, 0, 0, 0, 0, 0), axes=np.eye(3))
rr = m.modes(3, extra_mass={1: 2.0, 2: 3.0, 3: 1.5})["modes"]
t("3-dof chain: effective mass fractions in X sum to 1 over all modes", abs(sum(q["eff"]["X"] for q in rr) - 1) < 1e-9, f"{sum(q['eff']['X'] for q in rr):.12f}")
mm = Model(); mm.node(1, 0, 0, 0); mm.node(2, 5, 0, 0); mm.beam(1, 1, 2, E_, 0.2, A, I, I, 1.0, w=w)
try:
    mm.modes(1); ok = False
except ValueError:
    ok = True
t("unsupported structure: modal analysis refused (mechanism), not solved", ok)

# dashboard's own modal routine on its frozen model, with its mass rule (every member weighted, finding H-3)
F = json.load(open(os.path.join(R, "tests/model/fixtures/br13a_dashboard_selfweight.json")))
FM = json.load(open(os.path.join(R, "tests/model/fixtures/br13a_dashboard_modes.json")))
for e in F["els"]:
    if e["sec"].startswith("TD") or e["sec"].startswith("DUM"):
        e["w"] = 25.5 * e["A"]
mf = frozen_model(F, (0.0, 0.0)).modes(len(FM["modes"]))["modes"]
dT = max(abs(x["T"] / y["T"] - 1) for x, y in zip(mf, FM["modes"]))
de = max(abs(x["eff"]["XYZ"[d]] - y["eff"][d]) for x, y in zip(mf, FM["modes"]) for d in (0, 1))
t("BR13A frozen model: Python periods equal the dashboard's AN.modal to 1e-6 (8 modes, same mass)", dT < 1e-6, f"{dT:.1e}")
t("BR13A frozen model: horizontal effective masses equal the dashboard's to 1e-3", de < 1e-3, f"{de:.1e}")

# regression guard P3b vs frozen (recorded run; V5 only)
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.modes_vs_frozen.json")))
p = z["pairs"]
t("vs frozen: main vertical mode within 3 %, main horizontal modes within 10 % (recorded run, V5 — not T7)",
  abs(p["Z"][0] / p["Z"][2] - 1) <= 0.03 and all(abs(p[d][0] / p[d][2] - 1) <= 0.10 for d in "XY"),
  ", ".join(f"{d} {100 * (p[d][0] / p[d][2] - 1):+.1f} %" for d in "XYZ"))
t("vs frozen: total translational mass within 1 % (same mass rules)", abs(z["mass_t"]["p3b"]["0"] / z["mass_t"]["frozen"]["0"] - 1) <= 0.01)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
