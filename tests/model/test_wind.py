#!/usr/bin/env python3
"""P3c wind tests: pressure and line loads (closed form), totals, levers, exact vertical resultant, directions, scale
factors, refusals, and the dashboard's totals (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model.wind import wind_cases
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
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


doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
W = wind_cases(doc, geo, S, M, allow_proposed=True)
v, I = W["values"], W["inputs"]
gd = max(G["params"]["D"] + G["haunch"] for G in S["girders"].values()) / 1000
tD = doc["deck"]["slab_thickness"]["value"] / 1000; ts = doc["deck"]["surfacing_thickness"]["value"] / 1000
hb = max(b["height"]["value"] for b in doc["deck"]["barriers"]) / 1000
q = 0.5 * I["air_density"] * I["V_uls"] ** 2 / 1000
t("q = 0.5 rho V^2 (1.2 kg/m3, 45 m/s -> 1.215 kPa)", abs(v["q_kPa"] - q) < 1e-12 and abs(q - 1.215) < 1e-12)
t("exposed depth = girder + haunch + slab + barrier; wT = q Cd d; wL = fraction x wT; wV = q CL b",
  abs(v["exposed_depth"] - (gd + tD + hb)) < 1e-12 and abs(v["wT"] - q * I["Cd"] * (gd + tD + hb)) < 1e-12 and abs(v["wL"] - I["longitudinal_fraction"] * v["wT"]) < 1e-12
  and abs(v["wV"] - q * I["CL"] * v["b"]) < 1e-12)
t("levers above the node level (girder top): superstructure = middle of the exposed depth, vehicles = slab + surfacing + vehicle height",
  abs(v["lever_super"] - ((tD + hb) - gd) / 2) < 1e-12 and abs(v["lever_vehicle"] - (tD + ts + I["vehicle_height"])) < 1e-12)
nodes = M["nodes"]
lines = {}
for k, x in nodes.items():
    if x.get("role") == "girder" and x.get("line") is not None:
        lines.setdefault(x["line"], []).append(x["ch"])
Lbar = np.mean([max(c) - min(c) for c in lines.values()])
F = lambda cid: sum((np.asarray(f) for f in W["cases"][cid]["loads"].values()), np.zeros(6))
swt = sum(np.hypot(f[0], f[1]) for f in W["cases"]["WT+"]["loads"].values())
t("WT+ total (sum of the nodal force magnitudes; they turn with the curve) = wT x mean girder-line length; no vertical component",
  abs(swt - v["wT"] * Lbar) < 1e-6 * swt and abs(F("WT+")[2]) < 1e-12, f"{swt:.3f} vs {v['wT'] * Lbar:.3f}")
ok = all(np.allclose(np.asarray(f)[3:], np.cross([0, 0, v["lever_super"]], np.asarray(f)[:3])) for f in W["cases"]["WT+"]["loads"].values())
t("WT nodal moments = lever x force at every node (resultant at the middle of the exposed depth)", ok)
al = geo["_alignment"]
ok = True
for k, f in W["cases"]["WT+"]["loads"].items():
    b = math.radians(al.point(nodes[k]["ch"])[2]); n = np.array([math.cos(b), -math.sin(b)])
    ok &= abs(np.asarray(f)[:2] @ n - np.hypot(*np.asarray(f)[:2])) < 1e-9
t("WT+ acts toward +offset (normal to the alignment at each node); WT- is its reverse", ok and np.allclose(F("WT-"), -F("WT+")))
for cid in ("WVU+", "WVU-"):
    Fz = F(cid)[2]
    o = sum(np.asarray(f)[2] * nodes[k]["o"] for k, f in W["cases"][cid]["loads"].items()) / Fz
    side = -1 if cid.endswith("+") else 1
    target = (geo["deck"]["edge_left_offset"] + geo["deck"]["edge_right_offset"]) / 2 + side * I["vertical_eccentricity_b"] * v["b"]
    t(f"{cid}: total uplift = wV x mean line length and resultant exactly at the windward eccentricity (1e-9)",
      abs(Fz - v["wV"] * Lbar) < 1e-6 and abs(o - target) < 1e-9, f"{Fz:.3f} kN at {o:.4f} (target {target:.4f})")
t("WVD = -WVU (downward), mirrored cases equal in magnitude", np.allclose(F("WVD+"), -F("WVU+")) and abs(F("WVU+")[2] - F("WVU-")[2]) < 1e-9)
t("SLS and with-traffic scale factors = (V / V_uls)^2", abs(W["scale"]["sls"] - (I["V_sls"] / I["V_uls"]) ** 2) < 1e-15 and abs(W["scale"]["with_traffic"] - (I["V_with_traffic"] / I["V_uls"]) ** 2) < 1e-15)
r = M["model"].solve(gravity=(0, 0, 0), loads=W["cases"]["WVU+"]["loads"])
t("equilibrium on the integrated model (WVU+): bearing forces = -uplift (1e-6 relative)", abs(sum(M["model"].link_force(b["link"])[1][2] for b in M["bearings"].values()) + F("WVU+")[2]) < 1e-6 * F("WVU+")[2])
d2 = copy.deepcopy(doc); d2["loads"]["wind"]["rows"] = [x for x in d2["loads"]["wind"]["rows"] if x["cells"]["item"] != "Cd"]
t("missing wind item refused with its name", raises(lambda: wind_cases(d2, geo, S, M, allow_proposed=True), MissingInput, "Cd"))
t("lever datum other than node / slab_top refused", raises(lambda: wind_cases(doc, geo, S, M, allow_proposed=True, lever_datum="x"), ValueError))
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.wind_vs_frozen.json")))
okh = all(abs(np.hypot(*a_[:2]) - np.hypot(*b_[:2])) < 0.05 for cid, (a_, b_) in z["totals"].items() if not cid.startswith("WV"))
okv = all(abs(abs(a_[2]) / abs(b_[2]) - 1) < 0.01 for cid, (a_, b_) in z["totals"].items() if cid.startswith("WV"))
t("vs dashboard: horizontal totals equal (0.05 kN); vertical totals within 1 % (H-7: the dashboard's are off by ±0.9 %)", okh and okv)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
