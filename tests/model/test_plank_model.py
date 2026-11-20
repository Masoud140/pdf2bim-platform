#!/usr/bin/env python3
"""Plank decks, stage 2 (ADR-085): the grillage and the combined actions on a plank deck.  Run: python3 tests/model/test_plank_model.py
Synthetic case: BR13A's description with its four lines switched to 1200 x 700 solid planks with a topping."""
import copy, json, os, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.builder import build_superstructure
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.combinations import combined_actions
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


doc = json.load(open(os.path.join(R, "projects", "BR13A", "BR13A.bridge.0.2.json")))
rec = lambda v: {"value": v, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"value": v, "tag": "Input-user"}}
pd = copy.deepcopy(doc)
pd["superstructure"]["plank_types"] = [{"id": "PK1", "width": rec(1200.0), "depth": rec(700.0), "topping": rec(True), "voids": {"rows": []}}]
pd["superstructure"]["supert_types"] = []
for m in pd["superstructure"]["members"]:
    m["type_ref"] = rec("PK1")
row = copy.deepcopy(pd["materials"]["concrete"]["rows"][0]); row["cells"]["element"] = "Planks"; row["original"]["cells"]["element"] = "Planks"
pd["materials"]["concrete"]["rows"].append(row)
std = Standards()
geo = build_geometry(pd, allow_proposed=True); Sx = build_sections(pd, geo, allow_proposed=True)
B = build_superstructure(pd, geo, Sx, allow_proposed=True)
roles = {x["role"] for x in B["members"]}
t("plank grillage: one line per plank (no web lines, no rigid arms), transverse slab strips between the planks",
  "web" not in roles and "rigid" not in roles and "slab" in roles and "girder" in roles, str(sorted(roles)))
m = B["model"]; r = m.solve()
W = sum(b["w"] * np.linalg.norm(m.nodes[b["n1"]] - m.nodes[b["n2"]]) for b in m.beams.values())
t("plank grillage self weight: bearing reactions = the member weights", abs(sum(v[2] for v in r["reactions"].values()) - W) < 1e-6 * W)
g = [x for x in B["members"] if x["role"] == "girder"][0]
pl = Sx["girders"][g["line"]]["stations"][0]
t("plank member: shear area 5/6 of the plank (shortcut, ADR-085), self weight = plank + its deck strip",
  abs(g["Asz"] - 5 / 6 * 1200 * 700 / 1e6) < 1e-9 and g["w"] > 1200 * 700 / 1e6 * 25)
MI = build_integrated(pd, geo, Sx, std, allow_proposed=True)
CA = combined_actions(pd, geo, Sx, MI, std, allow_proposed=True)
t("combined actions run on the plank deck (traffic, thermal with the plank outline, wind, earthquake, ...)",
  not CA["missing_terms"] and {a for a, _ in CA["not_combined"]} <= {"PED", "FLH", "COLX"}, str(CA["not_combined"]))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
