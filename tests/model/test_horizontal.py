#!/usr/bin/env python3
"""P3c horizontal load tests: earth pressure / surcharge closed form (force, lever, direction), braking and centrifugal
totals and directions, curvature, equilibrium on the integrated model, refusals, and the dashboard's load totals
reproduced with its retained height (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model.horizontal import horizontal_cases, _curvature, G_ACC
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from standards.accessor import Standards

res = []
cross2 = lambda a, b: a[0] * b[1] - a[1] * b[0]


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
H = horizontal_cases(doc, geo, M, Standards(), allow_proposed=True)
m = M["model"]
al = geo["_alignment"]
gs = {s["id"]: s for s in geo["supports"]}
for sid, g in H["geometry"].items():
    K = 1 - math.sin(math.radians(g["phi_deg"]))
    e = 0.5 * K * g["gamma"] * g["H"] ** 2
    L = H["cases"]["EP"]["loads"]
    sn = M["supports"][sid]["sill_nodes"]
    F = sum((np.asarray(L[k]) for k in sn), np.zeros(6))
    t(f"{sid}: K0 = 1 - sin(phi); EP per metre = 0.5 K gamma H^2", abs(g["K"] - K) < 1e-15 and abs(g["EP_per_m"] - e) < 1e-9, f"{g['EP_per_m']:.3f}")
    t(f"{sid}: EP total on the sill = e x sill length (tributaries sum to the length)", abs(np.hypot(F[0], F[1]) - e * g["sill_length"]) < 1e-6 * e * g["sill_length"])
    other = next(x for k, x in gs.items() if k != sid)
    v = np.array([other["E"] - gs[sid]["E"], other["N"] - gs[sid]["N"]])
    t(f"{sid}: earth pressure pushes toward the span (perpendicular to the line of bearings)", F[:2] @ v > 0 and abs(F[:2] @ np.array([math.sin(math.radians(gs[sid]['bearing'])), math.cos(math.radians(gs[sid]['bearing']))])) < 1e-6 * np.hypot(F[0], F[1]))
    dz = g["H"] / 3 - M["supports"][sid]["sill"]["d"] / 2
    t(f"{sid}: EP moment at the sill nodes = force x (H / 3 - d / 2) (resultant at H / 3 above the soffit)",
      np.allclose(F[3:5], np.cross([0, 0, dz], F[:3])[:2], rtol=1e-9, atol=1e-9), f"dz {dz:.3f} m")
    Lt = H["cases"]["EPT" + sid]["loads"]
    t(f"{sid}: traffic surcharge behind {sid} only on {sid}'s sill; K q H per metre at H / 2", set(Lt) <= set(sn) and abs(g["EPT_per_m"] - K * 10 * g["H"]) < 1e-9)
t("K for Ka: (1 - sin phi) / (1 + sin phi) (backfill K = Ka)", abs(horizontal_cases(
    (lambda d: ([s["backfill"]["rows"][0]["cells"].__setitem__("K", "Ka") for s in d["supports"]], d)[1])(copy.deepcopy(doc)), geo, M, Standards(), allow_proposed=True)["geometry"]["A"]["K"] - (1 - 0.5) / (1 + 0.5)) < 1e-12)
Bp, Bm = H["cases"]["BRKp"]["loads"], H["cases"]["BRKm"]["loads"]
tot = sum((np.asarray(f) for f in Bp.values()), np.zeros(6))
t("braking: forces sum (as magnitudes) to loads.braking_force, shared equally", abs(sum(np.hypot(f[0], f[1]) for f in Bp.values()) - 500) < 1e-9
  and len({round(float(np.hypot(f[0], f[1])), 12) for f in Bp.values()}) == 1)
ok = True
for k, f in Bp.items():
    b = math.radians(al.point(M["nodes"][k]["ch"])[2]); tg = np.array([math.sin(b), math.cos(b)])
    ok &= abs(cross2(tg, f[:2])) < 1e-9 and tg @ f[:2] > 0
t("braking toward B: every force along the local alignment tangent, increasing chainage; BRKm = -BRKp", ok and all(np.allclose(Bm[k], -np.asarray(Bp[k])) for k in Bp))
cen = H["cases"]["CEN"]
Rmin = 1 / max(abs(_curvature(al, c)) for c in np.linspace(min(M["nodes"][k]["ch"] for k in Bp), max(M["nodes"][k]["ch"] for k in Bp), 201))
t("curvature: arc -> its k; spiral linear in s; tangent 0", abs(_curvature(al, 1900.0) - (-0.0025)) < 1e-15 and abs(_curvature(al, 1842.507 + 27.5) - (-0.00125)) < 1e-12 and _curvature(al, 2100.0) == 0.0)
t("centrifugal: F = W V^2 / (g R) with W = 24 wheels of the M1600 entry and the smallest radius under the deck",
  abs(cen["total"] - 1440 * (60 / 3.6) ** 2 / (G_ACC * Rmin)) < 1e-9 and abs(sum(np.hypot(f[0], f[1]) for f in cen["loads"].values()) - cen["total"]) < 1e-9, f"{cen['total']:.3f} kN, R {cen['R']:.1f} m")
ok = True
for k, f in cen["loads"].items():
    b = math.radians(al.point(M["nodes"][k]["ch"])[2]); tg = np.array([math.sin(b), math.cos(b)])
    ok &= cross2(tg, f[:2]) < 0           # left-turn curve: centre on the left, force to the right (cross < 0)
t("centrifugal outward: on this left-hand curve every force points to the right of the direction of travel", ok)
ok = True
for cid, c in H["cases"].items():
    r = m.solve(gravity=(0, 0, 0), loads=c["loads"])
    ok &= np.abs(r["equilibrium_residual"]).max() < 1e-6 * max(1.0, sum(np.hypot(f[0], f[1]) for f in c["loads"].values()))
t("every horizontal case in equilibrium on the integrated model (residual < 1e-6 of the load)", ok)
d2 = copy.deepcopy(doc); d2["supports"][0]["backfill"]["rows"][0]["cells"]["K"] = "Kp"
t("unknown earth-pressure coefficient kind refused", raises(lambda: horizontal_cases(d2, geo, M, Standards(), allow_proposed=True), MissingInput, "K0 / Ka"))
d3 = copy.deepcopy(doc); d3["deck"]["carriageway_left"]["value"] = 20.0; d3["deck"]["carriageway_right"]["value"] = 21.0
t("no deck nodes inside the carriageway: refused", raises(lambda: horizontal_cases(d3, geo, M, Standards(), allow_proposed=True), MissingInput, "carriageway"))
t("results carry the model's provisional list (empty: D-34 ... D-46 accepted, ADR-040) and the UNVERIFIED label (M1600 weight)",
  isinstance(H["provisional"], list) and not [p for p in H["provisional"] if p.get("decision")] and H["standards_status"].startswith("UNVERIFIED"))
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.horizontal_vs_frozen.json")))
t("vs dashboard: with the dashboard's retained height every load total equals the dashboard's (0.3 kN)",
  all(abs(a_ - b_) <= 0.3 for v in z["totals"].values() for a_, b_ in zip(v[1], v[2])))
t("vs dashboard: retained height calculated from the levels within 5 % of the dashboard's built-up height", all(abs(a_ / b_ - 1) < 0.05 for a_, b_ in z["H"].values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
