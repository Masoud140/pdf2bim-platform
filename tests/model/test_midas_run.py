#!/usr/bin/env python3
"""BR13A integrated model vs the engineer's MIDAS Civil NX run of the exported .mct (self weight, 2026-10-28).
Evidence: projects/BR13A/model/midas_run_2026-10-28/ (Results_SW.xlsx, analysis.log, COMPARISON.md).
MIDAS My sign is opposite to the solver's local My; every other component compares directly (I end: -f, J end: +f)."""
import collections, json, os, sys
import numpy as np, openpyxl
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.mct import write_mct
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


import pdf2bim.model.builder as B
B.RIGID_ARM_RELEASES = True   # the model MIDAS ran (commit 7645e0c) had the ADR-042 releases; removed later by ADR-045
d = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(d, allow_proposed=True); S = build_sections(d, geo, allow_proposed=True)
M = build_integrated(d, geo, S, Standards(), allow_proposed=True); m = M["model"]; r = m.solve()
txt, rep = write_mct(M, d, title="test")
wb = openpyxl.load_workbook(os.path.join(R, "projects/BR13A/model/midas_run_2026-10-28/Results_SW.xlsx"), data_only=True)
D = {row[0]: np.array(row[2:8], float) for row in wb["Displacement"].iter_rows(min_row=2, values_only=True) if row[0]}
F = collections.defaultdict(dict)
for row in wb["Reaction"].iter_rows(min_row=2, values_only=True):
    if row[0]:
        F[row[0]][row[2][0]] = np.array(row[3:9], float)
inv = {v: k for k, v in rep["node_map"].items()}; einv = {v: k for k, v in rep["element_map"].items()}
t("same model: MIDAS results cover every node and element written", set(D) == set(inv) and set(F) == set(einv), f"{len(D)} nodes, {len(F)} elements")
du = max(abs(D[n][:3] - r["u"][inv[n]][:3]).max() for n in D)
t("every nodal translation equals MIDAS to 0.05 mm", du < 5e-5, f"{du * 1000:.4f} mm")
sg = np.array([1, 1, 1, 1, -1, 1])
worst = 0.0
for e, ends in F.items():
    f = m.end_forces(einv[e])
    for k, o in (("I", -f[:6] * sg), ("J", f[6:] * sg)):
        worst = max(worst, float(abs(ends[k] - o).max()))
mx = max(float(abs(v).max()) for ends in F.values() for v in ends.values())
t("every element end force equals MIDAS within 1 % of the largest force (releases, offsets, links, springs as MIDAS)", worst < 0.01 * mx, f"{worst:.1f} of {mx:.0f}")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
