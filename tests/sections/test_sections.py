#!/usr/bin/env python3
"""P2 section tests.  Run: python3 tests/sections/test_sections.py   (PASS/FAIL per assertion; exit 1 on any failure)

Benchmarks: hand formulas (polygon), the published Super-T property table (product library, 30 rows), exact torsion
solutions (rectangle series, thick circular tube), the dashboard's secGeom (V5), and the frozen model's composite
sections (V5). Tolerances: VERIFICATION_STRATEGY T5 (0.5 %), T6 (2 %).
"""
import copy, json, math, os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.sections.polygon import props, Part
from pdf2bim.sections.supert import resolve_params, supert_section, library
from pdf2bim.sections.torsion import torsion_J, rect_J_exact
from pdf2bim.description import MissingInput

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


rel = lambda a, b: abs(a - b) / abs(b)

# ---- polygon (hand formulas) ----
r = props([Part([(0, 0), (300, 0), (300, 100), (0, 100)])])
t("polygon: rectangle A, centroid, Ix = bh³/12, Iy = hb³/12 exact", r["A"] == 30000 and r["yc"] == 50 and abs(r["Ix"] - 300 * 100 ** 3 / 12) < 1e-6 and abs(r["Iy"] - 100 * 300 ** 3 / 12) < 1e-6)
T_ = props([Part([(-500, 200), (500, 200), (500, 300), (-500, 300)]), Part([(-50, 0), (50, 0), (50, 200), (-50, 200)])])
A = 1000 * 100 + 100 * 200; yc = (1000 * 100 * 250 + 100 * 200 * 100) / A
Ix = 1000 * 100 ** 3 / 12 + 1000 * 100 * (250 - yc) ** 2 + 100 * 200 ** 3 / 12 + 100 * 200 * (100 - yc) ** 2
t("polygon: T-section by parallel axes, exact", abs(T_["A"] - A) < 1e-9 and abs(T_["yc"] - yc) < 1e-9 and abs(T_["Ix"] - Ix) < 1e-3)
h = props([Part([(0, 0), (100, 0), (100, 100), (0, 100)]), Part([(10, 10), (90, 10), (90, 90), (10, 90)], void=True)])
t("polygon: void subtracted (square tube Ix)", abs(h["Ix"] - (100 ** 4 - 80 ** 4) / 12) < 1e-6)
c = props([Part([(0, 0), (100, 0), (100, 100), (0, 100)]), Part([(0, 100), (100, 100), (100, 200), (0, 200)], n=0.5)])
t("polygon: modular ratio transforms a part (A = 10000 + 0.5·10000)", abs(c["A"] - 15000) < 1e-9 and abs(c["yc"] - (10000 * 50 + 5000 * 150) / 15000) < 1e-9)
t("polygon: orientation independent (clockwise outline)", props([Part([(0, 0), (0, 100), (300, 100), (300, 0)])])["A"] == 30000)

# ---- Super-T outline vs the published property table (product library) ----
L = library()
worst, bad = 0, []
for row in L["published_properties"]:
    p, _ = resolve_params(row["type"])
    s = supert_section(p, row["W"] / 2, row["W"] / 2, "open" if row["flange"] == "Open-flange" else "closed")
    e = max(rel(s["A"], row["A"]), rel(s["yc"], row["yb"]), rel(s["Ix"], row["I"]))
    worst = max(worst, e)
    if e > 0.005:
        bad.append((row["flange"], row["W"], row["type"], round(100 * e, 2)))
t(f"Super-T: all {len(L['published_properties'])} published rows (T1–T5, open/closed, W 1800/2100/2400) within 0.5 % (A, yb, I)", not bad, f"worst {100 * worst:.2f}% {bad[:3]}")
p, _ = resolve_params("T4", {"D": 1515, "d2": 265, "ttf": 90})
s = supert_section(p, 2280.4 / 2, 2280.4 / 2, "open")
t("Super-T: BR13A one definition (T4 + D 1515, d2 265, ttf 90, W 2280.4) equals the dashboard secGeom (V5, to 1e-5)",
  rel(s["A"], 594164.8698358794) < 1e-5 and rel(s["yc"], 723.1131161727037) < 1e-5 and rel(s["Ix"], 181442369484.35114) < 1e-5, f"{s['A']} {s['yc']} {s['Ix']}")
sa = supert_section(p, 1000, 1300, "open")
ss = supert_section(p, 1150, 1150, "open")
t("Super-T: asymmetric flange moves the centroid sideways (xc > 0 when the right tip is wider), same A as symmetric with equal total", sa["xc"] > 0 and abs(sa["A"] - ss["A"]) < 1e-6)
t("Super-T: solid end block area > closed > open", supert_section(p, 1140, 1140, "solid")["A"] > supert_section(p, 1140, 1140, "closed")["A"] > ss["A"])
try:
    supert_section(p, 300, 1140, "open"); ok = False
except ValueError:
    ok = True
t("Super-T: refuses a flange tip inside the outer fillet", ok)
try:
    resolve_params("T9"); ok = False
except KeyError:
    ok = True
t("Super-T: unknown product type refused", ok)

# ---- torsion (exact benchmarks) ----
rect = [(-150, -50), (150, -50), (150, 50), (-150, 50)]
j5, j25 = torsion_J([rect], [], 5.0), torsion_J([rect], [], 2.5)
ex = rect_J_exact(300, 100)
t("torsion: solid rectangle 300x100 within 1 % (h 5) and 0.5 % (h 2.5) of the exact series", rel(j5, ex) < 0.01 and rel(j25, ex) < 0.005, f"{j5 / ex:.4f} {j25 / ex:.4f}")
t("torsion: second-order convergence (Richardson estimate within 0.1 %)", rel((4 * j25 - j5) / 3, ex) < 0.001)
circ = lambda Rr, n=720: [(Rr * math.cos(2 * math.pi * i / n), Rr * math.sin(2 * math.pi * i / n)) for i in range(n)]
ja = torsion_J([circ(50)], [circ(40)], 1.0)
t("torsion: closed cell — thick circular tube within 2 % of π/2(Ro⁴−Ri⁴) (T6)", rel(ja, math.pi / 2 * (50 ** 4 - 40 ** 4)) < 0.02, f"{ja / (math.pi / 2 * (50 ** 4 - 40 ** 4)):.4f}")

# ---- BR13A sections (with the proposed shape / haunch records: D-35 / D-36) ----
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
b = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(b, allow_proposed=True)
try:
    build_sections(b, geo, allow_proposed=False, stations=(0.5,)); ok = False
except MissingInput:
    ok = True
t("BR13A: sections refuse without proposed values (shape / haunch only proposed)", ok)
S = build_sections(b, geo, allow_proposed=True, stations=(0.0, 0.5, 1.0))
t("BR13A: provisional inputs listed (D-35 shape rows, D-36 haunch)", {p["decision"] for p in S["provisional"]} >= {"D-35", "D-36"}, str({p["decision"] for p in S["provisional"]}))
t("BR13A: one definition used — ttf 90 from the drawing, not the library 75", all(g["params"]["ttf"] == 90 for g in S["girders"].values()))
mid = {k: next(r for r in g["stations"] if r["t"] == 0.5) for k, g in S["girders"].items()}
t("BR13A: girder-alone section at G2 midspan equals the dashboard one definition within 0.5 % (W varies 2280 -> 2283)",
  rel(mid["G2"]["girder"]["A"], 594164.87) < 0.005 and rel(mid["G2"]["girder"]["Ix"], 181442369484.35) < 0.005)
snap = {q["id"]: q["value"] for q in json.load(open(os.path.join(R, "baseline/BR13A/snapshot.json")))["quantities"]}
for gid in ("G1", "G2", "G3", "G4"):
    cm = mid[gid]["composite"]
    A_m, I_m, J_m = snap[f"model.section.{gid}-M_composite.A"] * 1e6, snap[f"model.section.{gid}-M_composite.Iy"] * 1e12, snap[f"model.section.{gid}-M_composite.J"] * 1e12
    t(f"BR13A {gid} midspan composite vs the frozen model's {gid}-M_composite (V5): A, I within 1 %, J within 2 %",
      rel(cm["A_transformed"], A_m) < 0.01 and rel(cm["Ix"], I_m) < 0.01 and rel(cm["J_geometric"], J_m) < 0.02,
      f"A {cm['A_transformed']:.0f}/{A_m:.0f} I {cm['Ix']:.4e}/{I_m:.4e} J {cm['J_geometric']:.4e}/{J_m:.4e}")
g4 = S["girders"]["G4"]["stations"]
t("BR13A: edge-girder flare enters the section (G4 composite area at midspan > at the ends by > 5 %)", g4[1]["composite"]["A_transformed"] > 1.05 * g4[0]["composite"]["A_transformed"])
t("BR13A: solid end zones reported missing (not assumed)", any("zones empty" in f for f in S["flags"]))
t("BR13A: closed-cell composite J ≫ girder-alone J (> 20x)", all(r["composite"]["J_geometric"] > 20 * r["girder"]["J"] for g in S["girders"].values() for r in g["stations"]))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
