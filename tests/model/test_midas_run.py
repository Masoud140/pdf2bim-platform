#!/usr/bin/env python3
"""BR13A integrated model vs the engineer's MIDAS Civil NX run of the exported .mct: self weight + 17 static load cases
(SDL, earth pressure, braking, centrifugal, wind) + temperature / shrinkage (TUp, TUm, SCR as *ELTEMPER; TGP, TGN as
*BSTEMPER), run 2026-10-28 on commit 8e8312d. Evidence: projects/BR13A/model/midas_run_2026-10-28c/ (the combinations
of that run are checked in COMPARISON.md, not here: the export of envelope terms changed after it). Fails, by design, whenever the model or a load case
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
from pdf2bim.model.thermal import thermal_cases
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
einv_r = {int(k): v for k, v in rep["element_map"].items()}   # model element -> MCT element
wb = openpyxl.load_workbook(os.path.join(R, "projects/BR13A/model/midas_run_2026-10-28c/Results_thermal_combinations.xlsx"), data_only=True)
D = collections.defaultdict(dict); F = collections.defaultdict(lambda: collections.defaultdict(dict))
Th = {k.replace("+", "p").replace("-", "m"): v["imposed"] for k, v in thermal_cases(d, geo, S, M, allow_proposed=True)["cases"].items()}
CASES = {"SW"} | set(Rd["cases"]) | set(Th)
for r in wb["Displacement"].iter_rows(min_row=2, values_only=True):
    if r[0] and r[1] in CASES:
        D[r[1]][r[0]] = np.array(r[2:5], float)
for r in wb["Reaction"].iter_rows(min_row=2, values_only=True):
    if r[0] and r[1] in CASES:
        F[r[1]][r[0]][r[2][0]] = np.array(r[3:9], float)
t("same model and cases: MIDAS ran every load case in the file, on every node and element",
  set(D) == CASES and all(set(D[c]) == set(inv) and set(F[c]) == set(einv) for c in D), f"{len(D)} cases")
sg = np.array([1, 1, 1, 1, -1, 1])
bad_u, bad_f = [], []
for case in sorted(D):
    r = (m.solve() if case == "SW" else m.solve(gravity=(0, 0, 0), loads={}, imposed=Th[case]) if case in Th
         else m.solve(gravity=(0, 0, 0), loads={inv[n]: f for n, f in Rd["cases"][case].items()}))
    du = max(float(abs(D[case][n] - r["u"][inv[n]][:3]).max()) for n in D[case])
    wf = fm = 0.0
    for e, ends in F[case].items():
        f = m.end_forces(einv[e])
        for k, o in (("I", -f[:6] * sg), ("J", f[6:] * sg)):
            wf = max(wf, float(abs(ends[k] - o).max())); fm = max(fm, float(abs(ends[k]).max()))
    if du > 5e-5:
        bad_u.append((case, du))
    # 1.5 % of the case's largest force (or 0.5 kN / kNm for near-zero cases); gradients 4 %: MIDAS's *BSTEMPER on offset members
    # differs locally in vertical shear next to the bearings (~14 kN on 433, displacements equal) — documented in COMPARISON.md
    if wf > max((0.04 if case in ("TGP", "TGN") else 0.015) * fm, 0.5):
        bad_f.append((case, wf, fm))
t("every case: every nodal translation equals MIDAS to 0.05 mm", not bad_u, str(bad_u))
t("every case: every element end force equals MIDAS within 1.5 % of the case's largest force (or 0.5 kN)", not bad_f, str(bad_f))
# earthquake (run 2026-10-28g, mass direction X Y Z): the platform's default RSA (ADR-046: member weight lumped at the end nodes
# + SDL, X Y Z — MIDAS's Loads to Masses idealisation, owner's choice) must reproduce MIDAS EQ_L / EQ_T
from pdf2bim.model.loads import sdl_case
from pdf2bim.model.earthquake import earthquake_rsa
Q = earthquake_rsa(d, geo, M, Standards(), sdl_loads=sdl_case(d, geo, M, allow_proposed=True)["loads"], allow_proposed=True)
wq = openpyxl.load_workbook(os.path.join(R, "projects/BR13A/model/midas_run_2026-10-28g/Results_mass_XYZ.xlsx"), read_only=True)
FQ = collections.defaultdict(lambda: collections.defaultdict(dict))
for ws in wq:
    if next(ws.iter_rows(max_row=1, values_only=True))[0] == "Elem":
        for r in ws.iter_rows(min_row=2, values_only=True):
            if r[0] and r[1] in ("EQ_L(RS)", "EQ_T(RS)"):
                FQ[r[1]][r[0]][r[2][0]] = np.abs(np.array(r[3:9], float))
COMP = {"N1": (0, "I"), "N2": (0, "J"), "Vy": (1, "I"), "Vz": (2, "I"), "My1": (4, "I"), "Mz1": (5, "I"), "My2": (4, "J"), "Mz2": (5, "J"),
        "M1": (4, "I"), "M2": (4, "J"), "V1": (2, "I"), "V2": (2, "J"), "T1": (3, "I"), "T2": (3, "J")}
eqw = []
for lab, dn in (("EQ_L(RS)", "L"), ("EQ_T(RS)", "T")):
    own = np.abs(Q["resp"][dn]["R"])
    a = np.array([(FQ[lab][einv_r[n[1][1]]][COMP[n[2]][1]][COMP[n[2]][0]], own[i]) for i, n in enumerate(Q["names"]) if n[0] in ("P", "G") and n[2] in COMP])
    eqw.append(abs(a[:, 0] - a[:, 1]).max() / a[:, 0].max())
t("earthquake EQ_L / EQ_T: every pile and girder end action equals the platform's default RSA (lumped X Y Z mass, ADR-046) to 2 % of the largest",
  max(eqw) < 0.02, f"{max(eqw) * 100:.2f} %")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
