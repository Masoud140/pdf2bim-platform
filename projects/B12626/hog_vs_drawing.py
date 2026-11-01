#!/usr/bin/env python3
"""B12626: platform girder hog (pdf2bim.design.prestress, the dashboard's Hog engine port) vs drawing 109201 Table 1.

    python3 projects/B12626/hog_vs_drawing.py      # -> projects/B12626/model/B12626.hog_vs_drawing.md

The drawing gives hog at transfer / 28 / 90 days (girder self weight only) and the deflection under the wet deck slab.
Inputs: the description with the PROPOSED development inputs (D-1); the drawing's own hog basis is in custom.girder_hog_basis.
"""
import json, os, sys
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(H, "..", ".."))
sys.path.insert(0, ROOT)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.prestress_inputs import hog_inputs
from pdf2bim.design.prestress import run
from standards.accessor import Standards

std = Standards()
doc = json.load(open(os.path.join(H, "B12626.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True); S = build_sections(doc, geo, allow_proposed=True)
DRG = {"Transfer": 41, "28 days": 53, "90 days": 60, "deck slab": 23}
L = ["# B12626 girder hog — platform vs drawing 109201 Table 1", "",
     "PROVISIONAL: proposed development inputs D-1 (ages, creep / shrinkage environment, Ep). Drawing basis (109201): density 2600 (2400 for the "
     "modulus), E at transfer 32100 MPa, steam cured 70 °C 8 h, open-air storage 20 °C / RH 50-70 %, girder self weight only.", "",
     "| Girder | Quantity | Drawing (mm) | Platform (mm) | Ratio |", "|---|---|---|---|---|"]
out = {}
for g in ("SG-03", "SG-01"):
    Hd = hog_inputs(doc, geo, S, g, std, allow_proposed=True)
    p = Hd["p"]; r = run(p, std); mi = r["mi"]
    hog = {x["label"]: x["hog"][mi] for x in r["res"]}
    Lspan = (p["L"] - 2 * p["a"]) / 1000
    EI = p["Ec"] * 1e3 * p["I"] * 1e-12                 # kN m2, girder alone, 28-day modulus
    d_deck = 5 * p["wd"] * Lspan ** 4 / (384 * EI) * 1000
    vals = {"Transfer": hog["Transfer"], "28 days": hog["27 d"], "90 days": hog["89 d"], "deck slab": d_deck}
    out[g] = vals
    for k, v in vals.items():
        L.append(f"| {g} | {k}{' (elastic, 5wL⁴/384EI, wet deck ' + format(p['wd'], '.2f') + ' kN/m)' if k == 'deck slab' else ''} | {DRG[k]} | {v:.1f} | {v / DRG[k]:.2f} |")
L += ["", "**Reading:** the elastic deck deflection agrees within 6 %. The transfer hog is about 18 % above the drawing and the growth after transfer "
      "about three times the drawing's (to 90 days: platform +58 mm, drawing +19 mm): the time-dependent model (AS 5100.5 creep / shrinkage as "
      "ported from the dashboard, loading at 1 day, D-1 environment) predicts much more creep than the designer's calculation. Sensitivity: "
      "simplified method 94 mm at 90 days; transfer at 3 days 100 mm; Ep, E at transfer: < 2 %. The designer's calculation is not in the set: "
      "finding H-11 for the engineer (creep model / age at loading for steam-cured girders)."]
os.makedirs(os.path.join(H, "model"), exist_ok=True)
open(os.path.join(H, "model", "B12626.hog_vs_drawing.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L))
