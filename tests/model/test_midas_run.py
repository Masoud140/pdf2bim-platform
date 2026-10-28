#!/usr/bin/env python3
"""BR13A integrated model vs the engineer's MIDAS Civil NX run of the exported .mct: self weight + 17 static load cases
(SDL, earth pressure, braking, centrifugal, wind), run 2026-10-28 on commit 6ef711b (deck-top reference, no rigid-arm
releases). Evidence: projects/BR13A/model/midas_run_2026-10-28b/. Fails, by design, whenever the model or a load case
changes: re-export, re-run MIDAS and replace the evidence.
MIDAS local My = - solver My; every other component compares directly (I end: -f, J end: +f)."""
import collections, json, os, sys
import numpy as np, openpyxl
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.mct import read_mct
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


d = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(d, allow_proposed=True); S = build_sections(d, geo, allow_proposed=True)
M = build_integrated(d, geo, S, Standards(), allow_proposed=True); m = M["model"]
Rd = read_mct(open(os.path.join(R, "projects/BR13A/model/BR13A.integrated.mct")).read())
rep = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.integrated.mct.json")))
inv = {v: int(k) for k, v in rep["node_map"].items()}; einv = {v: int(k) for k, v in rep["element_map"].items()}
wb = openpyxl.load_workbook(os.path.join(R, "projects/BR13A/model/midas_run_2026-10-28b/Results_all_cases.xlsx"), data_only=True)
D = collections.defaultdict(dict); F = collections.defaultdict(lambda: collections.defaultdict(dict))
for r in wb["Displacement"].iter_rows(min_row=2, values_only=True):
    if r[0]:
        D[r[1]][r[0]] = np.array(r[2:5], float)
for r in wb["Reaction"].iter_rows(min_row=2, values_only=True):
    if r[0]:
        F[r[1]][r[0]][r[2][0]] = np.array(r[3:9], float)
t("same model and cases: MIDAS ran every load case in the file, on every node and element",
  set(D) == {"SW"} | set(Rd["cases"]) and all(set(D[c]) == set(inv) and set(F[c]) == set(einv) for c in D), f"{len(D)} cases")
sg = np.array([1, 1, 1, 1, -1, 1])
bad_u, bad_f = [], []
for case in sorted(D):
    r = m.solve() if case == "SW" else m.solve(gravity=(0, 0, 0), loads={inv[n]: f for n, f in Rd["cases"][case].items()})
    du = max(float(abs(D[case][n] - r["u"][inv[n]][:3]).max()) for n in D[case])
    wf = fm = 0.0
    for e, ends in F[case].items():
        f = m.end_forces(einv[e])
        for k, o in (("I", -f[:6] * sg), ("J", f[6:] * sg)):
            wf = max(wf, float(abs(ends[k] - o).max())); fm = max(fm, float(abs(ends[k]).max()))
    if du > 5e-5:
        bad_u.append((case, du))
    if wf > max(0.015 * fm, 0.5):   # 1.5 % of the case's largest force, or 0.5 kN / kNm for the near-zero cases
        bad_f.append((case, wf, fm))
t("every case: every nodal translation equals MIDAS to 0.05 mm", not bad_u, str(bad_u))
t("every case: every element end force equals MIDAS within 1.5 % of the case's largest force (or 0.5 kN)", not bad_f, str(bad_f))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
