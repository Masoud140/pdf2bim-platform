#!/usr/bin/env python3
"""Plank sections (ADR-085 stage 1): closed-form checks.  Run: python3 tests/sections/test_plank.py"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from pdf2bim.sections.plank import plank_section
from pdf2bim.sections.torsion import rect_J_exact

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


def close(a, b, tol):
    return abs(a - b) <= tol * max(abs(b), 1e-12)


b, h = 1200.0, 700.0
s = plank_section(b, h)
p = s["plank"]
t("solid plank: A = bh, yc = h/2, I = bh^3/12 (exact)", close(p["A"], b * h, 1e-12) and close(p["yc"], h / 2, 1e-12) and close(p["Ix"], b * h ** 3 / 12, 1e-12))
t("solid plank: J (finite differences, 5 mm) within 1 % of the series solution", close(s["J_plank"], rect_J_exact(b, h), 0.01), f"{s['J_plank']:.4g} vs {rect_J_exact(b, h):.4g}")

d, yv = 400.0, 330.0
v = plank_section(b, h, voids=[{"shape": "circle", "x": -300, "y": yv, "size": d}, {"shape": "circle", "x": 300, "y": yv, "size": d}])
Av = b * h - 2 * math.pi * d * d / 4
ycv = (b * h * h / 2 - 2 * math.pi * d * d / 4 * yv) / Av
Iv = b * h ** 3 / 12 + b * h * (h / 2 - ycv) ** 2 - 2 * (math.pi * d ** 4 / 64 + math.pi * d * d / 4 * (yv - ycv) ** 2)
t("voided plank (2 x 400 circles): A, yc, I within 0.2 % of the circle closed forms (72-gon voids)",
  close(v["plank"]["A"], Av, 2e-3) and close(v["plank"]["yc"], ycv, 2e-3) and close(v["plank"]["Ix"], Iv, 2e-3), f"{v['plank']['Ix']:.5g} vs {Iv:.5g}")
t("voids lower J", v["J_plank"] < s["J_plank"])

tD, n = 200.0, 0.9
c = plank_section(b, h, overlay=tD, n_deck=n)["composite"]
A2 = b * h + n * b * tD
yc2 = (b * h * h / 2 + n * b * tD * (h + tD / 2)) / A2
I2 = b * h ** 3 / 12 + b * h * (h / 2 - yc2) ** 2 + n * (b * tD ** 3 / 12 + b * tD * (h + tD / 2 - yc2) ** 2)
t("composite with a 200 overlay (n 0.9): A, yc, I exact", close(c["A"], A2, 1e-12) and close(c["yc"], yc2, 1e-12) and close(c["Ix"], I2, 1e-12))

try:
    plank_section(b, h, voids=[{"shape": "circle", "x": 500, "y": 350, "size": 400}])
    t("a void outside the plank refused", False)
except ValueError:
    t("a void outside the plank refused", True)

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
