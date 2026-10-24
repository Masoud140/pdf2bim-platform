#!/usr/bin/env python3
"""P3c traffic tests: vehicle / UDL / lane-combination algorithm against an independent brute force and closed form on a
simple two-girder deck; BR13A envelope properties; refusals; the dashboard reproduced with its own distribution rule (V5)."""
import copy, itertools, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model.solver import Model
from pdf2bim.model.traffic import Influence, lane_effect, combine_lanes, traffic_envelope
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


# ---------- simple deck: two independent simply supported girders at offsets +-h, nodes every 0.25 m ----------
Lspan, dx = 30.0, 0.25


def deck(h, sup=None):
    m = Model(); nodes = {}; members = []
    n = int(round(Lspan / dx))
    k = 0
    ids = {}
    for g, o in (("G1", -h), ("G2", h)):
        for i in range(n + 1):
            k += 1; ids[(g, i)] = k
            m.node(k, i * dx, o, 0.0)
            nodes[k] = {"role": "girder", "line": g, "ch": i * dx, "o": o}
    e = 0
    for g in ("G1", "G2"):
        for i in range(n):
            e += 1
            m.beam(e, ids[(g, i)], ids[(g, i + 1)], 3e7, 0.2, 1.0, 0.5, 0.5, 1.0)
            members.append({"id": e, "n1": ids[(g, i)], "n2": ids[(g, i + 1)], "role": "girder", "line": g})
        m.fix(ids[(g, 0)], "111100"); m.fix(ids[(g, n if sup is None else int(round(sup / dx)))], "011100")
    for i in range(n + 1):        # very weak cross links: girders practically independent, model not a mechanism
        e += 1
        m.beam(e, ids[("G1", i)], ids[("G2", i)], 3e7, 0.2, 1e-6, 1e-9, 1e-9, 1e-9)
        members.append({"id": e, "n1": ids[("G1", i)], "n2": ids[("G2", i)], "role": "slab", "line": None})
    return {"model": m, "nodes": nodes, "members": members, "bearings": {}}, ids, n


mdl, ids, n = deck(1.0)
inf = Influence(mdl)
grid = inf.c0 + dx * np.arange(int(round((inf.c1 - inf.c0) / dx)) + 1)
mid = n // 2
r_mid = next(i for i, r in enumerate(inf.R) if r["t"] == "M" and r["girder"] == "G1" and r["node"] == ids[("G1", mid)] and r["end"] == 1)
eta = lambda x, x0=Lspan / 2: (x * (Lspan - x0) / Lspan if x <= x0 else x0 * (Lspan - x) / Lspan) if 0 <= x <= Lspan else 0.0
t("influence surface: midspan moment of a girder under a unit load equals the beam influence line (1e-3 kNm per kN; the weak cross links couple ~1e-4)",
  max(abs(inf.IM[r_mid][j] - (eta(mdl["nodes"][k]["ch"]) if mdl["nodes"][k]["line"] == "G1" else 0.0)) for j, k in enumerate(inf.deck)) < 1e-3,
  f"{max(abs(inf.IM[r_mid][j] - (eta(mdl['nodes'][k]['ch']) if mdl['nodes'][k]['line'] == 'G1' else 0.0)) for j, k in enumerate(inf.deck)):.1e}")

# vehicle: brute force over front-axle position, middle gap and direction (independent of the engine's prefix-max method)
veh = {"wheel_kN": 10.0, "track_m": 2.0, "axle_spacing_m": 1.25, "gap_12_m": 3.75, "gap_23_min_m": 6.25, "gap_34_m": 5.0, "udl_kN_per_m": 0.0, "dla": 0.3, "wheel_width_m": 0.4}
pos, neg = lane_effect(inf, grid, dx, veh, -1.6, 3.2, pattern=True, lateral=False)
ax = veh["axle_spacing_m"]


def axles(x0, g23, rev):
    gaps = [veh["gap_12_m"], g23, veh["gap_34_m"]]
    if rev:
        gaps = gaps[::-1]
    xs, x = [], x0
    for gi in range(4):
        xs += [x, x + ax, x + 2 * ax]
        x += 2 * ax + (gaps[gi] if gi < 3 else 0)
    return xs


best = 0.0
for x0 in np.arange(-60, 31, dx):
    for g23 in np.arange(veh["gap_23_min_m"], 60, dx):
        for rev in (False, True):
            v = sum(eta(x) for x in axles(x0, g23, rev)) * veh["wheel_kN"] * (1 + veh["dla"])
            best = max(best, v)
t("vehicle: max midspan moment of the wheel line on G1 equals an independent brute force (positions x gaps x directions)",
  abs(pos[r_mid] - best) < 1e-6 * best and neg[r_mid] > -1e-9, f"engine {pos[r_mid]:.4f} vs brute force {best:.4f}")
pos1, neg1 = lane_effect(inf, grid, dx, dict(veh, gap_23_min_m=60.0), -1.6, 3.2, pattern=True, lateral=False)
single = 0.0
for x0 in np.arange(-60, 31, dx):
    single = max(single, sum(eta(x) for x in axles(x0, 60.0, False)[:6]) * veh["wheel_kN"] * 1.3)
t("vehicle: with a 60 m middle gap only two groups fit on the 30 m span (brute force of two groups)", abs(pos1[r_mid] - single) < 1e-6 * single, f"{pos1[r_mid]:.3f} vs {single:.3f}")

# UDL over a lane exactly on the deck width: total midspan moment of both girders = q L^2 / 8, and DLA only when asked
mdl2, ids2, _ = deck(1.6)
inf2 = Influence(mdl2)
grid2 = inf2.c0 + dx * np.arange(int(round((inf2.c1 - inf2.c0) / dx)) + 1)
u = dict(veh, wheel_kN=0.0, udl_kN_per_m=6.0)
p2, n2 = lane_effect(inf2, grid2, dx, u, -1.6, 3.2, pattern=True, lateral=False)
rm = [next(i for i, r in enumerate(inf2.R) if r["t"] == "M" and r["girder"] == g and r["node"] == ids2[(g, n // 2)] and r["end"] == 1) for g in ("G1", "G2")]
Mtot = p2[rm[0]] + p2[rm[1]]
t("lane UDL: midspan moments of both girders sum to q L^2 / 8 (grid sum, 0.5 %)", abs(Mtot / (6.0 * Lspan ** 2 / 8) - 1) < 0.005, f"{Mtot:.2f} vs {6 * Lspan ** 2 / 8:.2f}")
p3, n3 = lane_effect(inf2, grid2, dx, u, -1.6, 3.2, pattern=True, lateral=False, dla_on_udl=True)
t("lane UDL: DLA applied to the UDL only when dla_on_udl=True", abs((p3[rm[0]] + p3[rm[1]]) / (p2[rm[0]] + p2[rm[1]]) - 1.3) < 1e-9)
r_end = next(i for i, r in enumerate(inf2.R) if r["t"] == "M" and r["girder"] == "G1" and r["node"] == ids2[("G1", 1)] and r["end"] == 1)
t("patterned UDL: only adverse parts loaded (sagging and hogging envelopes have no cancelling terms)", p2[rm[0]] >= 0 and n2[rm[0]] <= 0)

# patterned UDL on a span with an overhang (supports at 0 and 20 m, deck 30 m): midspan M influence changes sign
mdl3, ids3, _ = deck(1.6, sup=20.0)
inf3 = Influence(mdl3)
grid3 = inf3.c0 + dx * np.arange(int(round((inf3.c1 - inf3.c0) / dx)) + 1)
rm3 = [next(i for i, r in enumerate(inf3.R) if r["t"] == "M" and r["girder"] == g and r["node"] == ids3[(g, int(round(10.0 / dx)))] and r["end"] == 1) for g in ("G1", "G2")]
pp, pn = lane_effect(inf3, grid3, dx, u, -1.6, 3.2, pattern=True, lateral=False)
up, un = lane_effect(inf3, grid3, dx, u, -1.6, 3.2, pattern=False, lateral=False)
Sp, Sn, Su = pp[rm3].sum(), pn[rm3].sum(), up[rm3].sum() + un[rm3].sum()
q = 6.0
eo = lambda x: (x * 10 / 20 if x <= 10 else 10 * (20 - x) / 20) if x <= 20 else -10 * (x - 20) / 20     # overhang beam, M at 10 m
gs = [eo(x) for x in np.arange(0, 30 + 1e-9, dx)]
ep, en = q * dx * sum(v for v in gs if v > 0), q * dx * sum(v for v in gs if v < 0)
t("patterned UDL on a span with overhang: sagging / hogging envelopes = q x grid sum of the positive / negative influence (1e-6)",
  abs(Sp / ep - 1) < 1e-6 and abs(Sn / en - 1) < 1e-6, f"{Sp:.3f} vs {ep:.3f}, {Sn:.3f} vs {en:.3f}")
t("... and within 3 % of the closed-form areas q 50 / -q 25 (the grid sum counts the free-end point fully)",
  abs(Sp / (q * 50) - 1) < 0.03 and abs(Sn / (-q * 25) - 1) < 0.03)
t("unpatterned UDL (pattern=False): the whole lane loaded, net = q x grid sum of the whole influence (1e-6)", abs(Su / (ep + en) - 1) < 1e-6, f"{Su:.3f} vs {ep + en:.3f}")

# lane combination
e = [(np.array([3.0, 1.0]), np.array([-1.0, 0.0])), (np.array([5.0, 0.0]), np.array([-2.0, -4.0])), (np.array([1.0, 2.0]), np.array([0.0, -1.0]))]
p, q = combine_lanes(e, [1.0, 0.8, 0.4])
t("lane factors: effects ranked per response, largest x 1.0, next x 0.8, next x 0.4",
  np.allclose(p, [5 + 0.8 * 3 + 0.4 * 1, 2 + 0.8 * 1 + 0]) and np.allclose(q, [-2 - 0.8 * 1, -4 - 0.8 * 1]), f"{p}, {q}")
t("lane factors: the last factor repeats for more lanes", np.allclose(combine_lanes(e * 2, [1.0, 0.5])[0][0], 5 + 0.5 * (5 + 3 + 3 + 1 + 1)))

# ---------- BR13A ----------
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
std = Standards()
Ts = traffic_envelope(doc, geo, M, std, allow_proposed=True, layout="sweep")
Tl = traffic_envelope(doc, geo, M, Standards(), allow_proposed=True, layout="left", inf=Ts["influence"])
t("BR13A: 2 lanes of 3.2 m on the 8.4 m carriageway; sweep has 21 positions (0.1 m)", Ts["lanes"] == 2 and len(Ts["layouts"]) == 21, f"{Ts['lanes']}, {len(Ts['layouts'])}")
t("BR13A: the sweep envelope contains the left-packed layout (every response, both signs)",
  all((Ts["env"][mn]["max"] >= Tl["env"][mn]["max"] - 1e-9).all() and (Ts["env"][mn]["min"] <= Tl["env"][mn]["min"] + 1e-9).all() for mn in Ts["models"]))
t("BR13A: results carry the UNVERIFIED standards label and list the traffic entries used",
  Ts["standards_status"].startswith("UNVERIFIED") and {"AS5100.2:traffic:M1600", "AS5100.2:traffic:lane_width", "AS5100.2:traffic:accompanying_lane_factors"} <= {k for k, _ in Ts["standards_used"]})
Rb = [i for i, r in enumerate(Ts["responses"]) if r["t"] == "B"]
t("BR13A: bearing traffic reactions are compressive maxima (max > 0) and M1600 > S1600 at every bearing",
  all(Ts["env"]["M1600"]["max"][i] > Ts["env"]["S1600"]["max"][i] > 0 for i in Rb))
t("BR13A: the result carries the model's provisional inputs (D-39 ... D-41 etc.), so it is labelled provisional",
  {"D-39", "D-40", "D-41"} <= {p.get("decision") for p in Ts["provisional"]})
d2 = copy.deepcopy(doc)
for r in d2["loads"]["traffic_models"]["rows"]:
    r["cells"]["on"] = False
t("no traffic model switched on: refused with the field name", raises(lambda: traffic_envelope(d2, geo, M, Standards(), allow_proposed=True, inf=Ts["influence"]), MissingInput, "traffic_models"))

# ---------- vs the dashboard (recorded comparison, V5) ----------
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.traffic_vs_frozen.json")))
rep = z["engine_check"]["replica"]
t("engine check: with the dashboard's distribution rule the P3c engine reproduces the dashboard (girder M 0.1 %, bearings 1 %)",
  all(abs(b / a - 1) <= 0.001 for mn in rep for a, b in rep[mn]["girders"].values()) and all(abs(b / a - 1) <= 0.01 for mn in rep for a, b in rep[mn]["bearings"].values()))
nol = z["engine_check"]["no_one_node_lines"]["M1600"]["bearings"]; tri = z["modes"]["sweep"]["M1600"]["bearings"]
t("H-5: without the one-node bearing lines the dashboard rule agrees with the P3c triangulation (bearings within 1 %)",
  all(abs(nol[k][1] / tri[k][1] - 1) <= 0.01 for k in nol))
g = z["modes"]["sweep"]["M1600"]["girders"]
t("P3c on the P3b model vs the dashboard (sweep): girder max M within 10 % (recorded run)", all(abs(v[2][0] / v[0][0] - 1) <= 0.10 for v in g.values()),
  ", ".join(f"{k} {100 * (v[2][0] / v[0][0] - 1):+.1f} %" for k, v in g.items()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
