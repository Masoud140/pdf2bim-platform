#!/usr/bin/env python3
"""P3b load-case tests: SDL discretisation (exact clipping, survey-coordinate precision), statically equivalent
distribution, BR13A totals against independent area / length integrations, equilibrium on the integrated model,
refusals, and a regression guard against the dashboard's SDL case (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model import loads as LM
from pdf2bim.model.loads import sdl_case, Distributor, _area_centroid, _clip, deck_end_lines, _end_chainage
from pdf2bim.model.substructure import build_integrated
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
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


# ---------- geometry helpers (closed form) ----------
E0, N0 = 300098.512, 6249478.408
sq = [(E0, N0), (E0 + 0.2, N0), (E0 + 0.2, N0 + 0.1), (E0, N0 + 0.1)]
A, C = _area_centroid(sq)
naive = abs(sum(sq[i][0] * sq[(i + 1) % 4][1] - sq[(i + 1) % 4][0] * sq[i][1] for i in range(4))) / 2
t("cell area at survey coordinates: 0.2 x 0.1 m = 0.02 m2 to 1e-8 (coordinate representation limit), while the plain shoelace is off by > 1e-6",
  abs(A - 0.02) < 1e-8 and abs(naive - 0.02) > 1e-6, f"{A!r}; plain {naive!r}")
t("cell centroid at survey coordinates exact to 1e-9 m", abs(C[0] - (E0 + 0.1)) < 1e-9 and abs(C[1] - (N0 + 0.05)) < 1e-9)
usq = [(0, 0), (1, 0), (1, 1), (0, 1)]
d1 = (math.sqrt(0.5), math.sqrt(0.5))
A1, C1 = _area_centroid(_clip(usq, (0, 0), d1, -1.0)); A2, C2 = _area_centroid(_clip(usq, (0, 0), d1, 1.0))
t("half-plane clip of a unit square by its diagonal: two halves of 0.5, centroids (1/3, 2/3) and (2/3, 1/3)",
  abs(A1 - 0.5) < 1e-12 and abs(A2 - 0.5) < 1e-12 and {tuple(round(v, 12) for v in C1), tuple(round(v, 12) for v in C2)} == {(round(1 / 3, 12), round(2 / 3, 12)), (round(2 / 3, 12), round(1 / 3, 12))}, f"{C1}, {C2}")
t("clip keeps a cell fully inside unchanged; drops a cell fully outside",
  len(_clip(sq, (E0 - 1, N0), (0, 1.0), 1.0)) == 4 and len(_clip(sq, (E0 - 1, N0), (0, 1.0), -1.0)) == 0)

# ---------- distribution (exact first moments) ----------
nodes = {}
k = 0
for i in range(6):
    for j in range(4):
        k += 1
        nodes[k] = {"role": "girder", "ch": 100 + 2.0 * i + 0.3 * j, "o": -3 + 1.7 * j + 0.1 * i}   # skewed, non-uniform
D = Distributor(nodes)
rng = np.random.default_rng(1)
pts = []
X = lambda i, j: np.array([nodes[4 * i + j + 1]["ch"], nodes[4 * i + j + 1]["o"]])
for _ in range(400):
    i, j = int(rng.integers(0, 5)), int(rng.integers(0, 3))
    a_, b_ = rng.uniform(0, 1, 2)       # bilinear point inside a (convex) grid cell
    P = (1 - a_) * (1 - b_) * X(i, j) + a_ * (1 - b_) * X(i + 1, j) + a_ * b_ * X(i + 1, j + 1) + (1 - a_) * b_ * X(i, j + 1)
    pts.append((P[0], P[1], -rng.uniform(0.1, 2.0)))
for p in pts:
    D.add(*p)
out = D.nodal()
F = sum(p[2] for p in pts); Fn = sum(out.values())
Mc = sum(p[2] * p[0] for p in pts); Mcn = sum(f * nodes[n]["ch"] for n, f in out.items())
Mo = sum(p[2] * p[1] for p in pts); Mon = sum(f * nodes[n]["o"] for n, f in out.items())
t("distribution conserves the force (1e-12 relative)", abs(F - Fn) < 1e-12 * abs(F))
t("distribution conserves both first moments (chainage, offset) to 1e-9 relative", abs(Mc - Mcn) < 1e-9 * abs(Mc) and abs(Mo - Mon) < 1e-9 * abs(Mo), f"{Mc - Mcn:.2e}, {Mo - Mon:.2e}")
t("distribution: no node gets a load of the wrong sign (barycentric weights in 0..1)", all(f <= 1e-12 for f in out.values()))
D2 = Distributor(nodes); D2.add(150.0, 0.0, -1.0)
t("load point far outside the deck nodes is refused (not moved)", raises(D2.nodal, MissingInput, "outside"))

# ---------- BR13A SDL ----------
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
Cs = sdl_case(doc, geo, M, allow_proposed=True)
al = geo["_alignment"]
comp = {c["name"]: c for c in Cs["components"]}
dk = doc["deck"]
cl, cr = dk["carriageway_left"]["value"], dk["carriageway_right"]["value"]
q = dk["surfacing_density"]["value"] * dk["surfacing_thickness"]["value"] / 1000
ends = deck_end_lines(geo)
sA, sB = geo["supports"][0], geo["supports"][-1]
# independent carriageway plan area: boundary polygon (offset curves sampled every 10 mm + the end lines)
bnd = []
for o, rev in ((cr, False), (cl, True)):
    a_, b_ = _end_chainage(al, ends[sA["id"]], o, sA["ch"]), _end_chainage(al, ends[sB["id"]], o, sB["ch"])
    n = int((b_ - a_) / 0.01) + 1
    seg = [al.point(a_ + (b_ - a_) * i / n, o)[:2] for i in range(n + 1)]
    bnd += seg[::-1] if rev else seg
Aind, _ = _area_centroid(bnd)
t("surfacing area = independent boundary-polygon area of the carriageway between the skewed ends (0.01 %)",
  abs(comp["surfacing"]["plan_area_m2"] / Aind - 1) < 1e-4, f"{comp['surfacing']['plan_area_m2']:.4f} vs {Aind:.4f} m2")
t("surfacing total = gamma t x plan area", abs(-comp["surfacing"]["total_kN"] - q * comp["surfacing"]["plan_area_m2"]) < 1e-6)
ok_b = True
for b in dk["barriers"]:
    c = comp[f"barrier {b['id']}"]; o = b["offset"]["value"]
    n = int((c["ch_to"] - c["ch_from"]) / 0.001) + 1
    P = [al.point(c["ch_from"] + (c["ch_to"] - c["ch_from"]) * i / n, o)[:2] for i in range(n + 1)]
    Lind = sum(math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) for i in range(n))
    ok_b &= abs(c["length_m"] / Lind - 1) < 1e-6 and abs(-c["total_kN"] - b["weight"]["value"] * c["length_m"]) < 1e-9
t("barrier total = w x length along its offset curve between the deck ends (independent 1 mm integration, 1e-6)", ok_b)
t("barrier pieces start and end on the deck-end lines",
  all(abs(LM._side(*ends[sA["id"]], al.point(comp[f"barrier {b['id']}"]["ch_from"], b["offset"]["value"])[:2])) < 1e-6 for b in dk["barriers"]))
t("other SDL with no value is reported as not applied (not invented)", [x["path"] for x in Cs["not_applied"]] == ["deck.other_sdl"])
tg = {x["path"]: x["tag"] for x in Cs["inputs"]}
t("load inputs keep their tags (barrier weight Assumed, surfacing density Standard-verify)",
  tg["deck.barriers[barrier_left].weight"] == "Assumed" and tg["deck.surfacing_density"] == "Standard-verify")
tot = sum(c["total_kN"] for c in Cs["components"])
t("nodal loads sum to the component totals", abs(sum(f[2] for f in Cs["loads"].values()) - tot) < 1e-9 * abs(tot))
# resultant position (plan): nodal loads vs the point loads (only the chainage/offset -> plan mapping is nonlinear)
pp = [(al.point(ch, o)[:2], f) for ch, o, f in Cs["point_loads"]]
rp = np.array([sum(f * P[0] for P, f in pp), sum(f * P[1] for P, f in pp)]) / sum(f for _, f in pp)
mn = M["model"].nodes
rn = np.array([sum(f[2] * mn[k][0] for k, f in Cs["loads"].items()), sum(f[2] * mn[k][1] for k, f in Cs["loads"].items())]) / sum(f[2] for f in Cs["loads"].values())
t("plan resultant of the nodal loads within 5 mm of the resultant of the load points", np.hypot(*(rp - rn)) < 0.005, f"{np.hypot(*(rp - rn)) * 1000:.2f} mm")
t("load points moved onto the node hull: at most 1 mm", Cs["snap_max_m"] <= 0.001, f"{Cs['snapped_points']} points, {Cs['snap_max_m'] * 1000:.3f} mm")
r = M["model"].solve(gravity=(0, 0, 0), loads=Cs["loads"])
toes = [p["toe"] for s in M["supports"].values() for p in s["piles"]]
t("SDL on the integrated model: pile-toe reactions = SDL total; residual < 1e-6", abs(sum(r["reactions"][n][2] for n in toes) + tot) < 1e-6 * abs(tot)
  and np.abs(r["equilibrium_residual"]).max() < 1e-6 * abs(tot))
t("SDL on the integrated model: bearing forces = SDL total", abs(sum(M["model"].link_force(b["link"])[1][2] for b in M["bearings"].values()) + tot) < 1e-6 * abs(tot))
t("solving SDL does not apply self weight (gravity off) and leaves the model's own loads untouched", not M["model"].loads and abs(r["applied"][2] - tot) < 1e-9)
d2 = copy.deepcopy(doc); del d2["deck"]["surfacing_thickness"]
t("missing surfacing thickness is refused with the field name", raises(lambda: sdl_case(d2, geo, M, allow_proposed=True), MissingInput, "surfacing_thickness"))
d3 = copy.deepcopy(doc); d3["deck"]["barriers"][0]["offset"]["value"] = -9.0
t("a barrier outside the deck is refused (no grillage there), not silently dropped", raises(lambda: sdl_case(d3, geo, M, allow_proposed=True), MissingInput))

# ---------- regression guard vs the dashboard SDL (V5) ----------
fz = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.sdl_vs_frozen.json")))
t("vs dashboard: SDL total within 0.5 %", abs(fz["total"] / fz["dashboard_total"] - 1) <= 0.005, f"{fz['total']:.1f} vs {fz['dashboard_total']:.1f}")
t("vs dashboard, distribution only (P3b loads on the frozen model): every bearing within 10 %", all(abs(z / y - 1) <= 0.10 for _, x, y, z in fz["bearings"]))
t("vs dashboard: pile toes within 10 %, midspan within 0.6 mm (recorded run)", all(abs(x / y - 1) <= 0.10 for _, x, y in fz["piles"]) and all(abs(x - y) <= 0.6 for _, x, y in fz["deflection"]))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
