#!/usr/bin/env python3
"""Plank decks, stage 2 (ADR-085): the grillage and the combined actions on a plank deck.  Run: python3 tests/model/test_plank_model.py
Synthetic case: BR13A's description with its four lines switched to 1200 x 700 solid planks with a topping."""
import copy, json, math, os, sys
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

# stage 3a: RC plank checks along a plank line from these combined actions
from pdf2bim.design.plank_design import plank_checks
pd["superstructure"]["plank_types"][0]["bars"] = {"rows": [{"cells": c, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": c, "tag": "Input-user"}}
                                                           for c in ({"y": 60.0, "diameter": 24.0, "number": 6}, {"y": 850.0, "diameter": 16.0, "number": 8})]}
pd["superstructure"]["plank_types"][0]["fitments"] = {"rows": [{"cells": c, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": c, "tag": "Input-user"}}
                                                               for c in ({"from": 0.0, "to": 40.0, "diameter": 12.0, "legs": 2, "spacing": 150.0},)]}
gl0 = [x for x in MI['members'] if x['role'] == 'girder' and x['line'] == g['line']]
PC = plank_checks(pd, geo, Sx, CA, MI, std, g["line"], allow_proposed=True)
gv = PC["governing"]
t("plank checks run at every plank element end: ULS sag / hog, SLS bar stress (cracked)",
  len(PC["rows"]) == 2 * len(gl0) and all(0 <= v < math.inf for v in gv.values()) and gv["u_sag"] > 0 and gv["u_sls_sag"] > 0, str({k: round(v, 3) for k, v in gv.items()}))
sh = [r["shear"] for r in PC["rows"]]
t("plank shear / torsion by the general method at every end (fitments + girder_options), interface shear demand reported",
  all("u" in q for q in sh) and gv["u_shear"] > 0 and gv["tau_interface_kPa"] > 0, str(sh[0]))
print(f"     {g['line']}: phiMu sag {PC['phiMu_sag']:.0f} / hog {PC['phiMu_hog']:.0f} kNm; governing {', '.join(f'{k} {v:.2f}' for k, v in gv.items())}")

# stage 3c-2: the same plank prestressed (20 x 15.2 strands in two rows), losses analysis + staged SLS / ULS
cell = lambda c: {"cells": c, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": c, "tag": "Input-user"}}
T0 = pd["superstructure"]["plank_types"][0]
T0["strand_pattern"] = {"rows": [cell({"y": y, "x": -540.0 + 120.0 * k, "diameter": 15.2, "debond_left": 0.0, "debond_right": 0.0, "on": True}) for y in (60.0, 110.0) for k in range(10)]}
for k_, v_ in (("jacking_ratio", 0.75), ("age_at_transfer", 3.0), ("age_deck_cast", 60.0), ("concrete_transfer", 32.0), ("concrete_28d", 50.0)):
    T0[k_] = rec(v_)
PP = plank_checks(pd, geo, Sx, CA, MI, std, g["line"], allow_proposed=True)
mid = min(PP["rows"], key=lambda r: abs(r["t"] - 0.5))
T0["strand_pattern"]["rows"] = T0["strand_pattern"]["rows"][:10]
P10 = plank_checks(pd, geo, Sx, CA, MI, std, g["line"], allow_proposed=True)
T0["strand_pattern"] = {"rows": [cell({"y": y, "x": -540.0 + 120.0 * k, "diameter": 15.2, "debond_left": 0.0, "debond_right": 0.0, "on": True}) for y in (60.0, 110.0) for k in range(10)]}
m10 = min(P10["rows"], key=lambda r: abs(r["t"] - 0.5))
t("prestressed plank: losses analysis, more strands -> higher decompression moment (Mdec < 0 here: BR13A's 30 m span self weight exceeds the prestress), "
  "minimum strength checked, shear with the strands",
  PP["prestressed"] and mid["sag"]["Mdec"] > m10["sag"]["Mdec"] and isinstance(mid["sag"]["okMin"], bool) and mid["n_strands"] == 20 and "u" in mid["shear"] and PP["hog"]["times"],
  f"Mdec {mid['sag']['Mdec']:.0f}, okMin {mid['sag']['okMin']}, shear {mid['shear'].get('u')}")
t("prestressed plank: phi Mu sagging above the RC plank's (strands added to the same bars)", PP["phiMu_sag"] > PC["phiMu_sag"], f"{PP['phiMu_sag']:.0f} vs {PC['phiMu_sag']:.0f}")
print(f"     prestressed {g['line']}: Mdec {mid['sag']['Mdec']:.0f} kNm, Mal {mid['sag']['Mal']:.0f}, phiMu {mid['sag']['phiMu']:.0f}; hog final {max(PP['hog']['times'][-1]['hog_mm']):.1f} mm")

# stage 2b: integral abutments (both ends cast into the headstock, backfill springs behind)
from pdf2bim.description import MissingInput
from pdf2bim.model.thermal import thermal_cases
ip = copy.deepcopy(pd)
for s_ in ip["supports"]:
    s_["kind"] = rec("integral abutment")
try:
    build_integrated(ip, geo, Sx, std, allow_proposed=True); t("integral abutment without the backfill stiffness refused", False)
except MissingInput as ex:
    t("integral abutment without the backfill stiffness refused", "abutment_spring" in str(ex), str(ex))
gl = [x for x in MI["members"] if x["role"] == "girder" and x["line"] == g["line"]]


def run(kb):
    for s_ in ip["supports"]:
        s_["abutment_spring"] = rec(kb)
    M = build_integrated(ip, geo, Sx, std, allow_proposed=True)
    mm = M["model"]
    sw = mm.solve()
    gn = next(b["girder_node"] for b in M["bearings"].values() if b["girder"] == g["line"] and b["support"] == "A")
    Mend = abs(mm.end_forces(next(x["id"] for x in gl if x["n1"] == gn))[4])
    C = thermal_cases(ip, geo, Sx, M, allow_proposed=True)
    mm.solve(gravity=(0, 0, 0), loads={}, imposed=C["cases"]["TU+"]["imposed"])
    soil = [q for v in M["supports"].values() for q in v["abutment_springs"]]
    H = sum(abs(mm.link_force(q["link"])[0][0]) for q in soil)
    N = abs(mm.end_forces(gl[len(gl) // 2]["id"])[0])
    return {"M": M, "sw": sw, "Mend": Mend, "soil": soil, "H": H, "N": N}


A1 = run(1.0e4)
mm = A1["M"]["model"]
t("integral: plank-to-headstock links fixed in six directions, one backfill spring per sill node",
  not any(L["role"] == "bearing" for L in mm.links.values()) and len(A1["soil"]) == sum(len(v["sill_nodes"]) for v in A1["M"]["supports"].values()))
W1 = sum(b["w"] * np.linalg.norm(mm.nodes[b["n1"]] - mm.nodes[b["n2"]]) for b in mm.beams.values())
t("integral self weight: vertical reactions = the member weights", abs(sum(v[2] for v in A1["sw"]["reactions"].values()) - W1) < 1e-6 * W1)
gnb = next(b["girder_node"] for b in MI["bearings"].values() if b["girder"] == g["line"] and b["support"] == "A")
mb = MI["model"]; mb.solve(); Mend_b = abs(mb.end_forces(next(x["id"] for x in gl if x["n1"] == gnb))[4])
t("integral self weight: the plank end takes a moment (fixed into the headstock); on bearings much less (only the bearing eccentricity)",
  A1["Mend"] > 2 * Mend_b, f"{A1['Mend']:.1f} vs {Mend_b:.1f} kNm")
t("integral TU+: the backfill springs resist the deck expansion", A1["H"] > 1.0, f"{A1['H']:.1f} kN")
A2 = run(1.0e5)
t("integral TU+: stiffer backfill -> more spring force and more plank axial force", A2["H"] > A1["H"] and A2["N"] > A1["N"],
  f"H {A1['H']:.0f} -> {A2['H']:.0f} kN, N {A1['N']:.0f} -> {A2['N']:.0f} kN")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
