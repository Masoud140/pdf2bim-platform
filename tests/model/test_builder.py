#!/usr/bin/env python3
"""P3 superstructure builder tests (V2 model checks + cross-implementation with the frozen model).
Run: python3 tests/model/test_builder.py   (about 1 min: P2 torsion for every station)"""
import collections, json, math, os, subprocess, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.builder import build_superstructure
from pdf2bim.description import MissingInput

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


d = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(d, allow_proposed=True)
S = build_sections(d, geo, allow_proposed=True)
try:
    build_superstructure(d, geo, S, allow_proposed=False); ok = False
except MissingInput:
    ok = True
t("refuses without proposed values (cross girder D-37 only proposed)", ok)
M = build_superstructure(d, geo, S, allow_proposed=True)
N, E = M["nodes"], M["members"]
used = {m["n1"] for m in E} | {m["n2"] for m in E}
t("V2: no free nodes", all(k in used for k in N))
t("V2: every member has a role and positive section properties", all(m["role"] and m["A"] > 0 and m["Iy"] > 0 and m["Iz"] > 0 and m["J"] > 0 for m in E))
pos = collections.Counter((round(v["E"], 6), round(v["N"], 6)) for v in N.values())
t("V2: no duplicate nodes", max(pos.values()) == 1)
t("V2: no zero-length members", all(math.hypot(N[m["n1"]]["E"] - N[m["n2"]]["E"], N[m["n1"]]["N"] - N[m["n2"]]["N"]) > 1e-4 for m in E))
r = M["model"].solve()
t("V2 / T4: equilibrium residual <= 0.1 % of the self weight", np.abs(r["equilibrium_residual"]).max() <= 1e-3 * abs(r["applied"][2]))
wsum = sum(m["w"] * math.dist((N[m["n1"]]["E"], N[m["n1"]]["N"], N[m["n1"]]["Z"]), (N[m["n2"]]["E"], N[m["n2"]]["N"], N[m["n2"]]["Z"])) for m in E)
t("total weight = Σ w·L over the member list (independent sum)", abs(wsum + r["applied"][2]) < 1e-6 * wsum, f"{wsum:.3f} vs {-r['applied'][2]:.3f}")
t("only girders and cross girders carry weight (deck strips 0: deck is inside the composite girders)", all((m["w"] > 0) == (m["role"] in ("girder", "cross_girder")) for m in E))
t("8 bearings (4 girders x 2 supports), each on its girder's bearing-centre node", len(M["bearings"]) == 8 and all(N[b["node"]].get("special", "").startswith("bearing") for b in M["bearings"].values()))
st = M["settings"]
t("transverse spacing within 1 % of the target (uniform stations between the skewed deck ends)", abs(st["transverse_step"] / st["transverse_spacing_target"] - 1) < 0.01, str(st["transverse_step"]))
gz = [n for n in N.values() if n.get("special") == "zone_boundary"]
t("solid-zone boundaries are nodes on every girder (no mesh quantisation)", len(gz) == 8)
xg = [m for m in E if m["role"] == "cross_girder"]
sup_nodes = {s: {m[k] for m in xg for k in ("n1", "n2") if m["line"] == f"SUP_{s}"} for s in ("A", "B")}
t("cross girders form a continuous line across the deck on each support line", all(len([m for m in xg if m["line"] == f"SUP_{s}"]) == len(sup_nodes[s]) - 1 for s in ("A", "B")))
t("web lines at the dashboard web offset (web centreline at the girder top) 0.4718 m", abs(st["web_offset_m"] - 0.4718) < 1e-4)

# ---- cross-implementation: frozen superstructure, same solver, same bearings ----
out = os.path.join("/tmp", "p3cmp.md")
subprocess.run([sys.executable, os.path.join(R, "tools/compare_frozen_superstructure.py"), os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json"), "--allow-proposed", "--out", out], check=True, capture_output=True)
c = json.load(open(out.replace(".md", ".json")))
t("vs frozen: total self weight within 2 %", abs(c["weight"] / c["frozen_weight"] - 1) < 0.02, f"{c['weight']:.1f} / {c['frozen_weight']:.1f}")
t("vs frozen: every bearing reaction within 15 % (explained model differences)", all(abs(a / b - 1) < 0.15 for _, a, b in c["reactions"]), str([(k, round(a / b - 1, 3)) for k, a, b in c["reactions"]]))
t("vs frozen: midspan deflection of every girder within 5 %", all(abs(a / b - 1) < 0.05 for _, a, b in c["deflection"]))
Rx = {k: (a, b) for k, a, b in c["reactions"]}
t("both models carry the most load at the obtuse corners (A-G1, B-G4): skew behaviour reproduced",
  all(Rx["A-G1"][i] == max(Rx[f"A-G{j}"][i] for j in range(1, 5)) and Rx["B-G4"][i] == max(Rx[f"B-G{j}"][i] for j in range(1, 5)) for i in (0, 1)))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
