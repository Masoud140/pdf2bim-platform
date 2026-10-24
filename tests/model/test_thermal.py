#!/usr/bin/env python3
"""P3c imposed-strain tests: exact section integration of gradient profiles (closed form, brute force), imposed strain /
curvature on beams (closed form), BR13A superstructure selection, equilibrium, free-expansion hand check, refusals,
and the dashboard reproduced on its own model (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import MissingInput
from pdf2bim.model.solver import Model
from pdf2bim.model.thermal import free_strain, thermal_cases, superstructure_beams, _band
from pdf2bim.sections.polygon import raw
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


a = 1e-5
rect = [(-500, 0), (500, 0), (500, 1000), (-500, 1000)]
f1 = free_strain([(rect, 3e4)], [(0, 20), (1000, 20)], a, 1000)
t("uniform profile on a rectangle: e0 = alpha dT, phi = 0", abs(f1["e0"] - a * 20) < 1e-15 and abs(f1["phi"]) < 1e-15)
f2 = free_strain([(rect, 3e4)], [(0, 30), (1000, 10)], a, 1000)
t("linear profile over the depth: e0 = alpha x mean, phi = alpha x gradient (20 C per m -> 2e-4 / m)", abs(f2["e0"] - a * 20) < 1e-15 and abs(f2["phi"] - a * 20) < 1e-12, f"{f2['phi']}")
top = [(-500, 800), (500, 800), (500, 1000), (-500, 1000)]; bot = [(-100, 0), (100, 0), (100, 800), (-100, 800)]
f3 = free_strain([(top, 3e4), (bot, 4e4)], [(0, 10), (200, 10), (200.0001, 0), (2000, 0)], a, 1000)
e_hand = (3e4 * 200000 * a * 10) / (3e4 * 200000 + 4e4 * 160000)
t("two materials, slab heated only: e0 = E1 A1 alpha T / (E1 A1 + E2 A2) (1e-6)", abs(f3["e0"] / e_hand - 1) < 1e-6, f"{f3['e0']:.6e} vs {e_hand:.6e}")
tri = [(0, 0), (1000, 0), (0, 1000)]
q = _band(tri, 250, 750)
t("horizontal band of a triangle: area exact (0.5 x (750 + 250) x 500 for the trapezoid)", abs(raw(q)["A"] - 0.5 * (750 + 250) * 500) < 1e-6, f"{raw(q)['A']}")


# imposed strain / curvature on beams (closed form)
def bar(fix2):
    m = Model(); m.node(1, 0, 0, 0); m.node(2, 10, 0, 0); m.beam(1, 1, 2, 2e8, 0.3, 0.01, 1e-4, 1e-4, 1e-4); m.fix(1, "111111"); m.fix(2, fix2)
    return m


u0 = np.zeros(12); u0[6] = 1.2e-5 * 30 * 10
m = bar("111111"); m.solve(gravity=(0, 0, 0), loads={}, imposed={1: u0})
t("fixed-fixed bar heated: compression N = E A alpha dT", abs(m.end_forces(1)[0] - 2e8 * 0.01 * 1.2e-5 * 30) < 1e-6)
m = bar("011111"); r = m.solve(gravity=(0, 0, 0), loads={}, imposed={1: u0})
t("bar free to expand: no force, end movement alpha dT L", abs(m.end_forces(1)[0]) < 1e-9 and abs(r["u"][2][0] - 1.2e-5 * 300) < 1e-12)
phi, Lb = 1e-4, 10.0
uc = np.zeros(12); uc[8] = -phi * Lb * Lb / 2; uc[10] = phi * Lb
m = Model()
for i in range(11):
    m.node(i, i, 0, 0)
for i in range(10):
    m.beam(i + 1, i, i + 1, 2e8, 0.3, 0.01, 1e-4, 1e-4, 1e-4)
m.fix(0, "111100"); m.fix(10, "011000")
uce = np.zeros(12); uce[8] = -phi / 2; uce[10] = phi
r = m.solve(gravity=(0, 0, 0), loads={}, imposed={i + 1: uce for i in range(10)})
t("simply supported beam, imposed curvature (top hotter): no moment, midspan camber phi L^2 / 8 upward",
  max(abs(m.end_forces(i + 1)[4]) for i in range(10)) < 1e-6 and abs(r["u"][5][2] - phi * Lb ** 2 / 8) < 1e-9, f"{r['u'][5][2]:.6e} vs {phi * Lb ** 2 / 8:.6e}")
m2 = Model()
for i in range(11):
    m2.node(i, i, 0, 0)
for i in range(10):
    m2.beam(i + 1, i, i + 1, 2e8, 0.3, 0.01, 1e-4, 1e-4, 1e-4)
m2.fix(0, "111111"); m2.fix(10, "111111")
m2.solve(gravity=(0, 0, 0), loads={}, imposed={i + 1: uce for i in range(10)})
t("fixed-fixed beam, imposed curvature: uniform moment E I phi (sagging sign: top hotter -> restraint moment hogs)",
  all(abs(abs(m2.end_forces(i + 1)[4]) - 2e8 * 1e-4 * phi) < 1e-6 for i in range(10)), f"{m2.end_forces(5)[4]:.4f} vs {2e8 * 1e-4 * phi:.4f}")

# BR13A
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.sections.supert import supert_section
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
C = thermal_cases(doc, geo, S, M, allow_proposed=True)
sup = superstructure_beams(M)
roles = {x["id"]: x["role"] for x in M["members"]}
t("superstructure: every girder member in, no sill / pile / sill-offset member", {i for i, r in roles.items() if r == "girder"} <= sup
  and not any(roles.get(i) in ("sill", "pile", "rigid_sill_pile", "rigid_sill_seat") for i in sup), f"{len(sup)} beams")
t("superstructure: includes the rigid offsets girder -> bearing top (heated with the deck), stops at the bearing links",
  all(i in sup for i, r in roles.items() if r == "rigid_girder_bearing"))
G = S["girders"]["G1"]; p = G["params"]; st = G["stations"][len(G["stations"]) // 2]
gs = supert_section(p, st["w_left"], st["w_right"], "open"); y0 = p["D"] + G["haunch"]; tD = doc["deck"]["slab_thickness"]["value"]
deck = [(-st["deck_left"], y0), (st["deck_right"], y0), (st["deck_right"], y0 + tD), (-st["deck_left"], y0 + tD)]
parts = [(gs["outline"], S["E_girder_MPa"]), (deck, S["E_deck_MPa"])]
prof = C["inputs"]["profiles"]["TGP"]
fs = free_strain(parts, prof, C["inputs"]["temperature"]["alpha"], y0 + tD)
EA = N = 0.0
Tp = lambda d: float(np.interp(d, [x for x, _ in prof], [y for _, y in prof])) if prof[0][0] <= d <= prof[-1][0] else 0.0
for pts, E in parts:
    for y in np.arange(0, y0 + tD, 1.0):
        qq = _band(pts, y, y + 1)
        if len(qq) >= 3:
            Aq = raw(qq)["A"]; EA += E * Aq; N += E * Aq * 1e-5 * Tp(y0 + tD - (y + 0.5))
t("BR13A G1 composite: exact band integration equals a 1 mm brute-force fibre integration (1e-6)", abs(fs["e0"] / (N / EA) - 1) < 1e-6, f"{fs['e0']:.6e} vs {N / EA:.6e}")
ok_eq = True; info = []
for cid, c in C["cases"].items():
    r = M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=c["imposed"])
    toe = sum(r["reactions"][n][2] for n in r["reactions"])
    sx = sum(f[0] for f in r["spring_forces"].values()); sy = sum(f[1] for f in r["spring_forces"].values())
    ok_eq &= abs(toe) < 1e-4 and abs(sx) < 1e-4 and abs(sy) < 1e-4
    info.append(f"{cid} {abs(toe):.1e}")
t("BR13A: every imposed-strain case is self-equilibrated (toe reactions and spring forces sum to zero)", ok_eq, ", ".join(info))
# free expansion hand check: along each girder chord, bearing B moves relative to bearing A by about alpha dT L (B free along)
r = M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=C["cases"]["TU+"]["imposed"])
T = C["inputs"]["temperature"]; dT = T["T_max"] - T["T_set"]
rat = []
for g in geo["girders"]:
    nA = M["bearings"][f"A-{g['id']}"]["girder_node"]; nB = M["bearings"][f"B-{g['id']}"]["girder_node"]
    PA, PB = M["model"].nodes[nA], M["model"].nodes[nB]; d = (PB - PA) / np.linalg.norm(PB - PA)
    du = (r["u"][nB][:3] - r["u"][nA][:3]) @ d
    rat.append(du / (T["alpha"] * dT * float(np.linalg.norm(PB - PA))))
t("TU+: relative movement B - A along each girder chord within 5 % of free expansion alpha dT L", all(abs(x - 1) < 0.05 for x in rat), ", ".join(f"{x:.3f}" for x in rat))
r = M["model"].solve(gravity=(0, 0, 0), loads={}, imposed=C["cases"]["TGP"]["imposed"])
zd = json.load(open(os.path.join(R, "tests/model/fixtures/br13a_dashboard_thermal.json")))["cases"]["TGP"]["zmax"]
mids = []
for g in geo["girders"]:
    mid = ((g["bearing_A"]["E"] + g["bearing_B"]["E"]) / 2, (g["bearing_A"]["N"] + g["bearing_B"]["N"]) / 2)
    k = min((k for k, v in M["nodes"].items() if v["role"] == "girder" and v.get("line") == g["id"]), key=lambda k: math.hypot(M["nodes"][k]["E"] - mid[0], M["nodes"][k]["N"] - mid[1]))
    mids.append(r["u"][k][2] * 1000)
t("TGP (top hotter): every girder cambers UPWARD at midspan, peak within 10 % of the dashboard's (13.9 mm)",
  all(x > 0 for x in mids) and abs(max(mids) / zd - 1) < 0.10, ", ".join(f"{x:.2f}" for x in mids) + f" mm vs {zd:.2f}")
shear_ratio = 0.0
for eid, u0_ in C["cases"]["TGP"]["imposed"].items():
    L_, Rm_, T_, K_, fl_, dofs_ = M["model"]._el[eid]
    f0 = K_ @ u0_
    shear_ratio = max(shear_ratio, max(abs(f0[2]), abs(f0[8])) * L_ / max(abs(f0[4]), abs(f0[10]), 1e-30))
t("TGP imposition is pure bending + axial on every girder element: K u0 has no end shear (|V| L / |M| < 1e-9)", shear_ratio < 1e-9, f"{shear_ratio:.1e}")
d2 = copy.deepcopy(doc); d2["loads"]["temperature"]["rows"] = [x for x in d2["loads"]["temperature"]["rows"] if x["cells"]["item"] != "T_max"]
t("missing T_max is refused with the item name", raises(lambda: thermal_cases(d2, geo, S, M, allow_proposed=True), MissingInput, "T_max"))
d3 = copy.deepcopy(doc); d3["loads"]["gradient_positive"]["rows"] = d3["loads"]["gradient_positive"]["rows"][:1]
t("a gradient profile with one point is refused", raises(lambda: thermal_cases(d3, geo, S, M, allow_proposed=True), MissingInput, "two"))
t("results carry the model's provisional inputs", {"D-39", "D-41"} <= {p.get("decision") for p in C["provisional"]})

# dashboard reproduced on its own model (recorded comparison)
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.thermal_vs_frozen.json")))
dmax = max(max(abs(x - y) for x, y in zip(r_[2], r_[3])) for rows in z["isolation"].values() for r_ in rows)
t("isolation: P3c imposition on the dashboard's frozen model reproduces all five dashboard cases (bearing forces to 1e-5 kN)", dmax < 1e-5, f"{dmax:.1e}")
t("gradient: P3c free strain / curvature of G1 within 10 % of the dashboard's design section (different deck width)",
  all(abs(v[0] / v[2] - 1) < 0.10 and abs(v[1] / v[3] - 1) < 0.10 for v in z["free"].values()))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
