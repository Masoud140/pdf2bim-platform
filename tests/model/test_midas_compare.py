#!/usr/bin/env python3
"""P4.4 agent-part tests: MIDAS result-table reader and comparison (pdf2bim/model/midas_compare.py).

Round trip: the platform's own self-weight results and modes written as MIDAS-style CSV tables, read back and compared
(0 difference, pass); perturbations caught (one reaction +5 %, one member moment +5 %, a period +5 %); MAC pairing
recovers reordered modes with a sign flip; a missing mode is reported unpaired; unknown headers stop the reader with
the headers found; without shapes nothing is paired; totals equal the model weight."""
import copy, json, os, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.mct import write_mct
from pdf2bim.model.midas_compare import platform_tables, write_table, read_table, compare
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
_, rep = write_mct(M, doc)
side = json.loads(json.dumps(rep, default=str))
P = platform_tables(M, side, n_modes=6)
W = sum(b["w"] * float(((M["model"].nodes[b["n2"]] - M["model"].nodes[b["n1"]]) ** 2).sum()) ** 0.5 for b in M["model"].beams.values())
FZ = sum(r["FZ"] for r in P["reactions"])
t("platform tables: total vertical reaction = model self weight (1e-6)", abs(FZ - W) < 1e-6 * W, f"{FZ:.1f} kN")
d = tempfile.mkdtemp()
kinds = ("reactions", "beam_forces", "modes", "mode_shapes")
for k in kinds:
    write_table(P[k], os.path.join(d, k + ".csv"), k)
Mi = {k: read_table(os.path.join(d, k + ".csv"), k, load=None if k in ("modes", "mode_shapes") else "SW") for k in kinds}
C = compare(P, Mi)
t("round trip through MIDAS-style CSV: every reaction, member end force and paired period identical, pass",
  C["pass"] and C["reactions"]["outside_tolerance"] == [] and C["beam_forces"]["outside_tolerance"] == [] and len(C["modes"]["paired"]) == 6
  and max(v["rel"] for v in C["reactions"]["worst"].values()) == 0 and max(q["rel"] for q in C["modes"]["paired"]) == 0,
  f"{C['reactions']['compared']} reaction / {C['beam_forces']['compared']} force values")
X = copy.deepcopy(Mi); j = max(range(len(X["reactions"])), key=lambda i: abs(X["reactions"][i]["FZ"])); X["reactions"][j]["FZ"] *= 1.05
C2 = compare(P, X)
t("a reaction 5 % off is caught (outside the 2 % tolerance), comparison fails", not C2["pass"] and any(b["component"] == "FZ" for b in C2["reactions"]["outside_tolerance"]))
X = copy.deepcopy(Mi); j = max(range(len(X["beam_forces"])), key=lambda i: abs(X["beam_forces"][i]["moment_y"])); X["beam_forces"][j]["moment_y"] *= 1.05
t("a member moment 5 % off is caught", not compare(P, X)["beam_forces"]["pass"])
X = copy.deepcopy(Mi)
perm = {1: 3, 2: 1, 3: 2, 4: 4, 5: 5, 6: 6}
for r in X["modes"]:
    r["mode"] = perm[r["mode"]]
for r in X["mode_shapes"]:
    r["mode"] = perm[r["mode"]]
    if r["mode"] == 1:
        r["UX"], r["UY"], r["UZ"] = -r["UX"], -r["UY"], -r["UZ"]
C3 = compare(P, X)
t("MAC pairing: reordered MIDAS modes (one with flipped sign) are paired to the right platform modes, periods identical",
  C3["modes"]["pass"] and all(q["midas_mode"] == perm[q["platform_mode"]] and q["mac"] > 0.999999 for q in C3["modes"]["paired"]))
X = copy.deepcopy(Mi); X["modes"] = [r for r in X["modes"] if r["mode"] != 2]; X["mode_shapes"] = [r for r in X["mode_shapes"] if r["mode"] != 2]
C4 = compare(P, X)
t("a mode missing in MIDAS is reported unpaired (a finding, not a pass by order)", C4["modes"]["unpaired_platform"] == [2] and len(C4["modes"]["paired"]) == 5)
X = copy.deepcopy(Mi); X["modes"][0]["period"] *= 1.05
t("a paired period 5 % off is outside the 3 % tolerance", not compare(P, X)["modes"]["pass"])
t("without MIDAS mode shapes nothing is paired; periods listed by order only, not assessed",
  (lambda c: c["modes"]["pass"] is None and c["modes"]["paired"] == [] and len(c["modes"]["by_order"]) == 6)(compare(P, {"modes": Mi["modes"]})))
bad = os.path.join(d, "bad.csv")
open(bad, "w").write("Nd,LC,Fx,Fy\n1,SW,0,0\n")
try:
    read_table(bad, "reactions"); ok = False
except ValueError as e:
    ok = "headers in the file" in str(e) and "Nd" in str(e)
t("unknown headers stop the reader, naming the headers found and the unconfirmed column map", ok)
s2 = copy.deepcopy(side); s2["node_map"].pop(next(iter(s2["node_map"])))
try:
    platform_tables(M, s2, n_modes=1); ok = False
except ValueError as e:
    ok = "sidecar" in str(e)
t("numbering guard: a sidecar whose node / element sets differ from the model is refused", ok)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
