#!/usr/bin/env python3
"""P8 tests: the unchanged chain on the third bridge, B12453 (SB02, Sydney Gateway), against values printed on the
drawings (owner set, 2026-11-04). Development inputs of decision D-1 are PROPOSED (projects/B12453/dev_inputs.py)."""
import json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.loads import sdl_case
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


doc = json.load(open(os.path.join(R, "projects/B12453/B12453.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
t("MCD0 tangent closes on the printed HTP2 to < 5 mm; skews within 0.01° of the printed 5.433°", all(c["pass"] for c in geo["checks"]),
  str([round(c.get("value_m", c.get("value_deg", 0)), 5) for c in geo["checks"]]))
sop = {"A": (331507.574, 6245406.418), "B": (331484.155, 6245383.682)}          # 0305 / 0306
d_sop = max(math.hypot(s["E"] - sop[s["id"]][0], s["N"] - sop[s["id"]][1]) for s in geo["supports"])
t("support points on MCD0 within 1 mm of the printed SOPs", d_sop < 0.001, f"{d_sop * 1000:.2f} mm")
al = geo["_alignment"]
for ch, rl in ((163.169, 10.551), (196.728, 10.791)):           # 0703 table 4: RL 1 on MCD0 at the ends of the superstructure
    z = al.vertical.rl(ch)
    t(f"vertical curve: RL at ch {ch} = printed {rl} within 5 mm", abs(z - rl) < 0.005, f"{z:.4f}")
t("girder length end to end = 33.441 printed (0601-0603) within 2 mm (chord vs soffit along grade)",
  all(abs(g["length_end_to_end"] - 33.441) < 0.002 for g in geo["girders"]), str([round(g["length_end_to_end"], 4) for g in geo["girders"]]))
t("bearing-to-bearing = SOP chainage difference 32.640 (0305 / 0306) within 1 mm", all(abs(g["chord_length_bearings"] - 32.640) < 0.001 for g in geo["girders"]))
piles = {p["id"]: (p["E"]["value"], p["N"]["value"]) for s in doc["supports"] for p in s["piles"]}
t("pile spacing 2.900 along the pile line (0200: 5411 - 2511, 2511 + 389)", len(piles) == 6 and all(
    abs(math.dist(piles[f"{s}-0{k}"], piles[f"{s}-0{k + 1}"]) - 2.9) < 1e-3 for s in "AB" for k in (1, 2)))
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
m = M["model"]
r = m.solve()
W = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for b in m.beams.values())
t("self weight equilibrium", abs(r["applied"][2] + W) / W < 1e-6, f"{W:.1f} kN")
sd = sdl_case(doc, geo, M, allow_proposed=True)
hand = 22 * 0.075 * 7.0 * 33.559 + 2 * 8.78 * 33.559 + (2.0 / 7.8) * 7.8 * 33.559
t("SDL total vs hand (asphalt 22 x 0.075 x 7.0 m between barriers + 2 PB-1 barriers 8.78 kN/m + 2 kN/m utilities / screens) within 3 %",
  abs(-sd["total_kN"] / hand - 1) < 0.03, f"{-sd['total_kN']:.1f} vs {hand:.1f} kN")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
