#!/usr/bin/env python3
"""RC plank design (ADR-085 stage 3a) against closed forms.  Run: python3 tests/design/test_plank_design.py
Synthetic plank deck: BR13A's description with its lines switched to 1200 x 700 solid planks with the topping."""
import copy, json, math, os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.plank_design import plank_section_design, bar_stress, _flip
from pdf2bim.design.flexure import uls_bend, Coefficients
from pdf2bim.description import MissingInput
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


rec = lambda v: {"value": v, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"value": v, "tag": "Input-user"}}
tab = lambda rows: {"rows": [{"cells": r, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": r, "tag": "Input-user"}} for r in rows]}
doc = json.load(open(os.path.join(R, "projects", "BR13A", "BR13A.bridge.0.2.json")))
pd = copy.deepcopy(doc)
pd["superstructure"]["plank_types"] = [{"id": "PK1", "width": rec(1200.0), "depth": rec(700.0), "topping": rec(True), "voids": {"rows": []}}]
pd["superstructure"]["supert_types"] = []
for m in pd["superstructure"]["members"]:
    m["type_ref"] = rec("PK1")
row = copy.deepcopy(pd["materials"]["concrete"]["rows"][0]); row["cells"]["element"] = "Planks"; row["original"]["cells"]["element"] = "Planks"
pd["materials"]["concrete"]["rows"].append(row)
std = Standards(); K = Coefficients(std)
geo = build_geometry(pd, allow_proposed=True); Sx = build_sections(pd, geo, allow_proposed=True)
P = next(iter(Sx["girders"]))
try:
    plank_section_design(pd, Sx, P, True); t("plank without bars refused", False)
except MissingInput:
    t("plank without bars refused", True)

fsy, Es = 500.0, 2e5
pd["superstructure"]["plank_types"][0]["bars"] = tab([{"y": 60.0, "diameter": 24.0, "number": 6}])
sec, lv = plank_section_design(pd, Sx, P, True)
H, tD = lv["Dtot"], lv["tD"]
b = next(c["b"] for c in sec.conc if c["grp"] == "deck"); fcd = next(c["fc"] for c in sec.conc if c["grp"] == "deck"); Ed = next(c["E"] for c in sec.conc if c["grp"] == "deck")
As = 6 * math.pi / 4 * 24 ** 2; d = H - 60
a = As * fsy / (K.alpha2(fcd) * fcd * b)
Mu = As * fsy * (d - a / 2) / 1e6
u = uls_bend(sec, std)
t("sagging Mu = As fsy (d - a/2), block in the topping (single bar layer)", a < tD and abs(u["Mu"] - Mu) < 2e-3 * Mu, f"{u['Mu']:.2f} vs {Mu:.2f}")
t("sagging phi from kuo = (a / gamma) / d", abs(u["phi"] - K.phi(a / K.gamma(fcd) / d)) < 2e-3, f"{u['phi']:.4f}")
n = Es / Ed
x = (-n * As + math.sqrt((n * As) ** 2 + 2 * b * n * As * d)) / b
Icr = b * x ** 3 / 3 + n * As * (d - x) ** 2
M = 400.0
fs = n * M * 1e6 * (d - x) / Icr
f_, db = bar_stress(sec, M)
t("SLS cracked bar stress = n M (d - x) / Icr (neutral axis in the topping)", x < tD and abs(f_ - fs) < 2e-3 * fs, f"{f_:.2f} vs {fs:.2f} MPa, x {x:.1f}")

# hogging: topping bars only, compression at the plank soffit (solid 1200 wide)
pd["superstructure"]["plank_types"][0]["bars"] = tab([{"y": 700.0 + tD - 50, "diameter": 16.0, "number": 8}])
sec, lv = plank_section_design(pd, Sx, P, True)
fcp = next(c["fc"] for c in sec.conc if c["grp"] == "girder")
At = 8 * math.pi / 4 * 16 ** 2; dh = H - 50
ah = At * fsy / (K.alpha2(fcp) * fcp * 1200.0)
Muh = At * fsy * (dh - ah / 2) / 1e6
uh = uls_bend(_flip(sec, H), std)
t("hogging Mu = At fsy (d - a/2) on the upside-down section (block in the plank soffit)", abs(uh["Mu"] - Muh) < 2e-3 * Muh, f"{uh['Mu']:.2f} vs {Muh:.2f}")
f_h, _ = bar_stress(sec, -100.0)
t("SLS hogging: the topping bars are the tension bars", f_h > 0)

pd["superstructure"]["plank_types"][0]["strand_pattern"] = tab([{"y": 60.0, "x": 0.0, "diameter": 15.2, "on": True}])
try:
    plank_section_design(pd, Sx, P, True); t("prestressed plank refused (stage 3b)", False)
except MissingInput as ex:
    t("prestressed plank refused (stage 3b)", "3b" in str(ex))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
