#!/usr/bin/env python3
"""P8 stage 4 tests: the unchanged chain on SB01 (B12452, Sydney Gateway): wide divided deck on a straight setout
line, 14 girders, 22 piles. Checked against values printed on the drawings (owner set). Missing inputs: generic
proposals D-1 (ADR-058), PROPOSED."""
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


doc = json.load(open(os.path.join(R, "projects/B12452/B12452.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
t("geometry checks pass (setout line closes, support-line skews consistent)", all(c["pass"] for c in geo["checks"]))
al = geo["_alignment"]
for ch, rl in ((8.0, 11.104), (12.0, 11.129), (20.0, 11.168), (24.0, 11.181), (32.0, 11.195)):   # 0703 table 2 RL 1, not used in the fit
    t(f"deck RL on the setout line at {ch} = printed {rl} within 3 mm", abs(al.vertical.rl(ch) - rl) < 0.003, f"{al.vertical.rl(ch):.4f}")
t("14 girders; bearing-to-bearing 32.641 + 2 x 0.400 = X1 33.441 (0601-0604) within 3 mm",
  len(geo["girders"]) == 14 and all(abs(g["chord_length_bearings"] + 0.8 - 33.441) < 0.003 for g in geo["girders"]))
sop = {"A": (331495.770, 6245421.159, 141 + 16 / 60 + 46.8 / 3600), "B": (331472.154, 6245398.667, 141 + 16 / 60 + 42.9 / 3600)}


def dist_to_line(P, s):
    E0, N0, b = sop[s]; u = (math.sin(math.radians(b)), math.cos(math.radians(b)))
    return abs((P[0] - E0) * u[1] - (P[1] - N0) * u[0])


off = max(dist_to_line((g[f"bearing_{s}"]["E"], g[f"bearing_{s}"]["N"]), s) for g in geo["girders"] for s in "AB")
t("every bearing on its printed support line (SOP on MC20 + bearing, 0300 / 0301) within 1 mm", off < 0.001, f"{off * 1000:.2f} mm")
piles = {p["id"]: (p["E"]["value"], p["N"]["value"]) for s in doc["supports"] for p in s["piles"]}
t("11 piles per abutment; spacing 2.900 along the pile line (0200) except across the control lines",
  len(piles) == 22 and abs(math.dist(piles["A01-01"], piles["A01-02"]) - 2.9) < 1e-3 and abs(math.dist(piles["B01-07"], piles["B01-08"]) - 2.9) < 1e-3)
cw = [(r["cells"]["left"], r["cells"]["right"]) for r in doc["deck"]["carriageways"]["rows"]]
t("two carriageways either side of the median barrier (0701 / 0706 detail B)", len(cw) == 2 and cw[0][1] < cw[1][0] and abs(cw[1][0] - cw[0][1] - 0.652) < 1e-9)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
m = M["model"]
r = m.solve()
W = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for b in m.beams.values())
t("self weight equilibrium", abs(r["applied"][2] + W) / W < 1e-6, f"{W:.1f} kN")
sd = sdl_case(doc, geo, M, allow_proposed=True)
names = {c["name"] for c in sd["components"]}
t("SDL has the two external barriers and the median barrier", sum(n.startswith("barrier") for n in names) == 3, str(sorted(names))[:200])
from pdf2bim.model.traffic import traffic_envelope
T = traffic_envelope(doc, geo, M, Standards(), allow_proposed=True)
t("lanes per carriageway, never across the median: 4 (13.400) + 5 (17.295) = 9 design lanes printed on 0101", T["lanes"] == 9, str(T["lanes"]))
t("HLP400 with 0.5 M1600 alongside switched on from report table 2-7", "HLP" in T["env"] and T.get("hlp_accompany"))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
