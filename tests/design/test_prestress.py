#!/usr/bin/env python3
"""P4.5 stage 5 prestress-loss / camber tests: elastic shortening closed form, time-dependent switches (no shrinkage /
creep / relaxation -> no loss; each alone reduces the force), relaxation against R = k6 k7 k8 Rb, and the port against
the dashboard's Hog engine on the BR13A girder (simplified, simplified without deck, detailed; material functions)."""
import copy, json, math, os, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.design.prestress import run, Models, effective_prestrain
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


std = Standards()
M = Models(std)
D = json.load(open(os.path.join(R, "tests/design/fixtures/br13a_dashboard_hog.json")))
p = D["p"]
t("fixture: the dashboard's Node-evaluated engine equals the browser for the as-set run", D["node_equals_browser"])
ok = all(abs(M.shrink(a, p) - v) < 1e-15 for a, v in zip([10, 30, 100, 1000, 10000], D["mat"]["shrink"])) and \
     all(abs(M.creep(a, p) - v) < 1e-12 for a, v in zip([10, 30, 100, 1000, 10000], D["mat"]["creep"])) and \
     all(abs(M.relax(p, x) - v) < 1e-12 for x, v in zip([0, 1, 10, 100, 1000, 10000], D["mat"]["relax"]))
t("material functions = the dashboard's (shrinkage, creep, relaxation; coefficients from the standards data)", ok)
for key, var in (("simple", dict(meth=0)), ("simple_nodeck", dict(meth=0, fl=dict(p["fl"], dk=0))), ("detailed", dict(meth=1))):
    r = run(dict(p, **var), std); ref = D["runs"][key]
    dh = max(abs(a["hog"][r["mi"]] - b["hog_mid"]) for a, b in zip(r["res"], ref["res"]))
    dP = max((max(abs(x - y) for x, y in zip(a["Pm"], b["Pm"])) if (a["Pm"] and b["Pm"]) else 0.0) for a, b in zip(r["res"], ref["res"]))
    dS = max(max(abs(x - y) for x, y in zip(r["st"][i]["Pr"], s["Pr"])) for i, s in zip(ref["st_index"], ref["st"]))
    t(f"port = dashboard Hog engine, {key}: stations, labels, midspan hog and strand forces at every time, transfer forces (1e-9)",
      r["X"] == ref["X"] and [a["label"] for a in r["res"]] == [b["label"] for b in ref["res"]] and dh < 1e-9 and dP < 1e-9 and dS < 1e-9 and abs(r["P0"] - ref["P0"]) < 1e-12,
      f"hog {dh:.1e} mm, P {dP:.1e} kN")
# closed form: one concentric strand, no self weight, no debonding -> elastic shortening P = P0 / (1 + n Ap / A)
q = dict(p, sy=[p["yb"]], sl=[{"d": 0, "d2": 0}], sx=[0], rho=0.0, wd=0.0, sidl=0.0, deck=0, bars=[], meth=0)
r = run(q, std)
n = q["Ep"] / q["Ect"]
Pexp = r["P0"] / (1 + n * q["Ap"] / q["A"])
mid = r["st"][r["mi"]]
t("elastic shortening, concentric strand: Pr = P0 / (1 + n Ap / A) at midspan (1e-9)", abs(mid["Pr"][0] / Pexp - 1) < 1e-9, f"{mid['Pr'][0]:.4f} vs {Pexp:.4f} kN")
t("transmission: strand force zero at the girder end, full beyond the transmission length lt db", r["st"][0]["Pr"][0] == 0 and abs(r["st"][r["mi"]]["Pr"][0] - Pexp) < 1e-9)
q0 = dict(q, fl=dict(q["fl"], sh=0, cr=0, rl=0))
r0 = run(q0, std)
t("no shrinkage, creep or relaxation: no time-dependent loss (simplified)", all(abs(x["Pm"][0] - Pexp) < 1e-9 for x in r0["res"][1:]))
loss = {}
for k in ("sh", "cr", "rl"):
    fl = dict(q["fl"], sh=0, cr=0, rl=0); fl[k] = 1
    loss[k] = Pexp - run(dict(q, fl=fl), std)["res"][-1]["Pm"][0]
t("each of shrinkage, creep, relaxation alone reduces the force", all(v > 0 for v in loss.values()), str({k: round(v, 2) for k, v in loss.items()}))
# relaxation alone (no shortening): loss = P R / 100, R = k6 k7 k8 Rb from transfer
Rl = loss["rl"]
dR = M.relax(q, q["times"][-1]) - M.relax(q, 0)
t("relaxation alone: loss = P (R(t) - R(0)) / 100 (simplified, 1e-9)", abs(Rl - Pexp * dR / 100) < 1e-9 * Pexp, f"{Rl:.4f} vs {Pexp * dR / 100:.4f}")
rd = run(dict(q, meth=1), std)
t("detailed method on the concentric strand: transfer force = the elastic-shortening closed form with the net section (1e-6)",
  abs(rd["res"][0]["Pm"][0] - rd["P0"] / (1 + n * q["Ap"] / rd["net"]["A"])) < 1e-6 * rd["P0"])
tt, epe = effective_prestrain(run(dict(p), std), p)
t("effective prestrain per strand at the last time = F / (Ap Ep), positive, below the jacking strain", tt == p["times"][-1] and all(0 < e < p["ji"] * p["mbl"] * 1e3 / (p["Ap"] * p["Ep"]) for e in epe))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
