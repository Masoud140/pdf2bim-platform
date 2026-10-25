#!/usr/bin/env python3
"""P4.5 stage 5b tests: prestress-loss inputs from the description — every input has a source, values equal their
sources (description, P1 / P2, standards tables), refusal when inputs are missing (no D-42 proposals accepted), the
comparison with the dashboard's Hog inputs (V5: equal, or a documented difference), and the proof that the remaining
differences are inputs only: with the dashboard's values substituted, the run equals the dashboard's Hog run exactly."""
import json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.design.prestress_inputs import hog_inputs, LOSS_ITEMS
from pdf2bim.design.prestress import run, effective_prestrain
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


def raises(fn, exc, word=None):
    try:
        fn()
    except exc as e:
        return word is None or word in str(e)
    return False


std = Standards()
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
H = hog_inputs(doc, geo, S, "G2", std, allow_proposed=True)
p, src = H["p"], H["source"]
t("every input has a recorded source; nothing missing with the proposals allowed", all(k in src for k in p) and not H["missing"], str([k for k in p if k not in src]))
T = doc["superstructure"]["supert_types"][0]
gg = next(g for g in geo["girders"] if g["id"] == "G2")
t("geometry inputs: L = P1 length end to end; a = (L - bearing chord) / 2; H = P2 depth",
  abs(p["L"] - gg["length_end_to_end"] * 1000) < 1e-9 and abs(p["a"] - (gg["length_end_to_end"] - gg["chord_length_bearings"]) * 500) < 1e-9 and p["H"] == S["girders"]["G2"]["params"]["D"])
tab = std.get("AS5100.5:concrete:table_3_1_2").value
t("moduli and mean strength from Table 3.1.2 (standards entry) at f'cp and f'c", p["Ect"] == 32800 and p["fcmi"] == 43 and p["Ec"] == 34800 and [40, 43, 32800] in tab)
t("strand area and MBL from Table 3.3.1 by diameter; jacking ratio, ages from the description",
  p["Ap"] == 140 and p["mbl"] == 250 and p["ji"] == T["jacking_ratio"]["value"] and p["tau"] == T["age_at_transfer"]["value"] and p["pour"] == T["age_deck_cast"]["value"] - T["age_at_transfer"]["value"])
on = [r["cells"] for r in T["strand_pattern"]["rows"] if r["cells"]["on"]]
t("strand levels and debonding from the strand pattern; bars from the bar table", p["sy"] == [r["y"] for r in on] and len(p["bars"]) == len(T["bars"]["rows"]))
rows = {r["cells"]["item"]: r["cells"]["value"] for r in doc["design"]["prestress_losses"]["rows"] if r["cells"]["item"] != "time"}
t("environment / stage / relaxation inputs from design.prestress_losses (D-42)", all(p[k] == float(rows[k]) for k in LOSS_ITEMS if k != "meth") and p["meth"] == int(rows["meth"]))
t("wet deck load = tD beff gamma + dform; composite properties from the deck width", abs(p["wd"] - (p["dth"] * p["beff"] * p["dgam"] / 1e6 + p["dform"])) < 1e-12 and p["Ac"] > p["A"])
dp = json.load(open(os.path.join(R, "projects/BR13A/history/BR13A.bridge.0.2.r14.json")))   # revision 14: D-42 still proposed
gp = build_geometry(dp, allow_proposed=True); Sp = build_sections(dp, gp, allow_proposed=True)
t("r14: without accepting the proposals the builder refuses, naming the missing design.prestress_losses items",
  raises(lambda: hog_inputs(dp, gp, Sp, "G2", std, allow_proposed=False), MissingInput, "design.prestress_losses"))
D = json.load(open(os.path.join(R, "tests/design/fixtures/br13a_dashboard_hog.json")))
P = D["p"]
same = [k for k in p if k in P and not isinstance(p[k], (list, dict)) and isinstance(P[k], (int, float)) and abs(p[k] - P[k]) <= 1e-9 * max(1, abs(P[k]))]
diff = {k: (p[k], P[k]) for k in p if k in P and not isinstance(p[k], (list, dict)) and isinstance(P[k], (int, float)) and k not in same}
expected = {"L", "a", "A", "yb", "I", "ue", "ueC", "beff", "dbw", "ued", "wd", "Ac", "yc", "Ic", "rho", "dgam", "pour"}
t("V5 vs the dashboard's Hog inputs: every scalar equal except the documented geometry / density / age differences",
  set(diff) <= expected and len(same) >= 40, f"{len(same)} equal; differ: {sorted(diff)}")
t("documented differences are small where they are the same quantity: section A, I, yb, ue within 0.3 %; ueC within 0.1 %; L, a within 0.3 % / 1 %",
  all(abs(diff[k][0] / diff[k][1] - 1) < 0.003 for k in ("A", "I", "yb", "ue")) and abs(diff["ueC"][0] / diff["ueC"][1] - 1) < 1e-3 and abs(diff["L"][0] / diff["L"][1] - 1) < 0.003 and abs(diff["a"][0] / diff["a"][1] - 1) < 0.011,
  "; ".join(f"{k} {a / b - 1:+.2%}" for k, (a, b) in sorted(diff.items())))
q = dict(p)
for k in diff:
    q[k] = P[k]
q["times"] = P["times"]; q["bars"] = P["bars"]
rq = run(q, std); ref = D["runs"]["as_set"]
dh = max(abs(a["hog"][rq["mi"]] - b["hog_mid"]) for a, b in zip(rq["res"], ref["res"]))
dP = max(max(abs(x - y) for x, y in zip(a["Pm"], b["Pm"])) for a, b in zip(rq["res"], ref["res"]))
t("with the dashboard's values substituted for the differing inputs, the run equals the dashboard's Hog run (hog, strand forces; 1e-9)", dh < 1e-9 and dP < 1e-9, f"{dh:.1e} mm, {dP:.1e} kN")
r = run(p, std)
tt, epe = effective_prestrain(r, p)
t("BR13A run from the description: effective prestrain at the last time for every strand, below the jacking strain",
  len(epe) == len(on) and all(0 < e < p["ji"] * p["mbl"] * 1e3 / (p["Ap"] * p["Ep"]) for e in epe), f"mean sigma_pe {sum(epe) / len(epe) * p['Ep']:.0f} MPa at {tt:g} d")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
