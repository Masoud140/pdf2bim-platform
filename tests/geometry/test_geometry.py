#!/usr/bin/env python3
"""P1 geometry tests.  Run: python3 tests/geometry/test_geometry.py   (PASS/FAIL per assertion; exit 1 on any failure)

Expected values in the synthetic cases are computed here by CLOSED-FORM formulas that are independent of the engine
(the engine integrates / iterates numerically). Tolerances: VERIFICATION_STRATEGY §4 T2/T3 (1 mm, 0.001°).
"""
import glob, json, math, os, re, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.geometry.alignment import Alignment, Element, GeometryInputError
from pdf2bim.geometry.bridge import build_geometry

res = []
MM = 0.001


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


def raises(f, exc, text=None):
    try:
        f()
    except exc as e:
        return text is None or text in str(e)
    except Exception:
        return False
    return False


V = lambda x: {"value": x, "tag": "Direct", "status": "accepted"}
ROW = lambda c: {"cells": c, "tag": "Direct", "status": "accepted"}


def desc(hrows, supports, offsets, edges=(-3.0, 3.0), gap=30, setback=0, vrows=None):
    return {"format": "pdf2bim.bridge/0.1",
            "alignment": {"horizontal": {"rows": [ROW(r) for r in hrows]}, "support_lines": {"rows": [ROW(s) for s in supports]},
                          **({"vertical": {"rows": [ROW(r) for r in vrows]}} if vrows else {})},
            "deck": {"edge_left": V(edges[0]), "edge_right": V(edges[1])},
            "superstructure": {"flange_gap": V(gap), "edge_flange_setback": V(setback),
                               "members": [{"id": f"G{i + 1}", "line_offset_A": V(o), "line_offset_B": V(o), "straight": V(True),
                                            "bearing_offset_A": V(500), "bearing_offset_B": V(500)} for i, o in enumerate(offsets)]}}


def close(P, E, N, tol=MM):
    return math.hypot(P["E"] - E, P["N"] - N) <= tol


# ---------------- method §6: library / integrator on known cases ----------------
e = Element("arc", 0, math.pi / 2, 1.0, 1.0, 0)
x, y = e.local(math.pi / 2)
t("known case: quarter arc of unit radius ends at (1, 1)", abs(x - 1) < 1e-12 and abs(y - 1) < 1e-12)
e = Element("spiral", 0, math.pi / 2, 1.0, 1.0, 0)  # constant-curvature 'spiral' must reproduce the arc via the integrator
x, y = e.local(math.pi / 2)
t("known case: numerical integrator reproduces the quarter arc to 1e-12", abs(x - 1) < 1e-12 and abs(y - 1) < 1e-12)
Rr, L = 400.0, 55.0
th = L / (2 * Rr)
xs = L * (1 - th ** 2 / 10 + th ** 4 / 216 - th ** 6 / 9360)
ys = L * (th / 3 - th ** 3 / 42 + th ** 5 / 1320 - th ** 7 / 75600)
x, y = Element("spiral", 0, L, 0.0, 1 / Rr, 0).local(L)
t("known case: entry clothoid (R 400, L 55) equals the Fresnel series to 1e-9 m", abs(x - xs) < 1e-9 and abs(y - ys) < 1e-9, f"{x - xs:.2e} {y - ys:.2e}")
x2, y2 = Element("spiral", 0, L, 1 / Rr, 0.0, 0).local(L)
# exit spiral = entry spiral reversed: end tangent turned by th; check closure of entry+exit symmetric pair
t("known case: exit spiral deflection equals entry spiral deflection (th = L/2R)", abs(Element("spiral", 0, L, 1 / Rr, 0, 0).dtheta(L) - th) < 1e-15)

# ---------------- case 1: straight alignment, square supports ----------------
H = [{"element": "tangent", "ch_start": 0.0, "length": None, "radius": None, "direction": None, "E_start": 1000.0, "N_start": 2000.0}]
# a single open tangent has no second point to fix the bearing -> the engine must refuse
t("refuses: one open-ended tangent (start bearing not fixed by the table)", raises(lambda: Alignment(H), GeometryInputError, "two tabulated points"))
H = [{"element": "tangent", "ch_start": 0.0, "length": 100.0, "radius": None, "direction": None, "E_start": 1000.0, "N_start": 2000.0},
     {"element": "tangent", "ch_start": 100.0, "length": None, "radius": None, "direction": None, "E_start": 1100.0, "N_start": 2000.0}]
d1 = desc(H, [{"support": "A", "ch": 10.0, "skew": 0, "bearing": 0.0}, {"support": "B", "ch": 40.0, "skew": 0, "bearing": 180.0}], [-1.5, 1.5])
g1 = build_geometry(d1)
G = {g["id"]: g for g in g1["girders"]}
t("case 1 straight/square: bearing points (closed form)", close(G["G1"]["bearing_A"], 1010, 2001.5) and close(G["G1"]["bearing_B"], 1040, 2001.5)
  and close(G["G2"]["bearing_A"], 1010, 1998.5) and close(G["G2"]["bearing_B"], 1040, 1998.5))
t("case 1: chord length 30.000 m; ends extended by the bearing offsets", abs(G["G1"]["chord_length_bearings"] - 30) < 1e-9 and abs(G["G1"]["length_end_to_end"] - 31) < 1e-9)
f = G["G1"]["flange"][5]
t("case 1: flange edges = 1500 (to deck edge) and 1485 (half of 3 m minus gap/2)", abs(f["left"] - 1500) < 1e-3 and abs(f["right"] - 1485) < 1e-3, str(f))

# ---------------- case 2: straight alignment, skewed supports (30 deg) ----------------
sk = 30.0
d2 = desc(H, [{"support": "A", "ch": 10.0, "skew": sk, "bearing": sk}, {"support": "B", "ch": 40.0, "skew": sk, "bearing": sk}], [-1.5, 1.5])
g2 = build_geometry(d2)
G = {g["id"]: g for g in g2["girders"]}
# offset o (right of east = south): N = 2000 - o; on the support line through (Ec, 2000) at bearing 30: E = Ec + (N-2000) tan 30
ok = all(close(G[gid][k], Ec - o * math.tan(math.radians(sk)), 2000 - o) for gid, o in (("G1", -1.5), ("G2", 1.5)) for k, Ec in (("bearing_A", 1010), ("bearing_B", 1040)))
t("case 2 straight/skewed: bearing points (closed form, tan 30°)", ok)
t("case 2: chord length 30 m and chords parallel to the alignment", abs(G["G2"]["chord_length_bearings"] - 30) < 1e-9 and abs(G["G2"]["chord_bearing"] - 90) < 1e-9)
t("case 2: skew consistency check present and passing", all(c["pass"] for c in g2["checks"] if "skew" in c["id"]) and any("skew" in c["id"] for c in g2["checks"]))

# ---------------- case 3: curved alignment (left arc R=100), straight chords, radial (square) supports ----------------
Rc = 100.0
arc_end = lambda s: (-Rc + Rc * math.cos(s / Rc), Rc * math.sin(s / Rc))  # start (0,0) heading north, turning left, centre (-100, 0)
HE = arc_end(60.0)
Hc = [{"element": "arc", "ch_start": 0.0, "length": 60.0, "radius": Rc, "direction": "left", "E_start": 0.0, "N_start": 0.0},
      {"element": "tangent", "ch_start": 60.0, "length": None, "radius": None, "direction": None, "E_start": HE[0], "N_start": HE[1]}]
rad_brg = lambda s: math.degrees(math.atan2(math.cos(s / Rc), math.sin(s / Rc)))  # direction centre -> point
sA, sB, offs = 10.0, 40.0, [-1.5, 1.5]
d3 = desc(Hc, [{"support": "A", "ch": sA, "skew": 0, "bearing": rad_brg(sA)}, {"support": "B", "ch": sB, "skew": 0, "bearing": rad_brg(sB)}], offs)
g3 = build_geometry(d3)
G = {g["id"]: g for g in g3["girders"]}
pt = lambda s, o: (-Rc + (Rc + o) * math.cos(s / Rc), (Rc + o) * math.sin(s / Rc))
ok = all(close(G[gid][k], *pt(s, o)) for gid, o in zip(("G1", "G2"), offs) for k, s in (("bearing_A", sA), ("bearing_B", sB)))
t("case 3 curved/square: bearing points on radius R+o (closed form)", ok)
ok = all(abs(G[gid]["chord_length_bearings"] - 2 * (Rc + o) * math.sin((sB - sA) / (2 * Rc))) < 1e-6 for gid, o in zip(("G1", "G2"), offs))
t("case 3: straight chord length = 2(R+o) sin(Δφ/2) (not the arc length)", ok)
sag = lambda o: (Rc + o) * (1 - math.cos((sB - sA) / (2 * Rc)))
t("case 3: chord sits inside the curve by the sagitta at mid-chord", all(abs((G[gid]["midchord_station"][1] - o) + sag(o)) < MM for gid, o in zip(("G1", "G2"), offs)),
  str([(G[g]["midchord_station"][1], sag(o)) for g, o in zip(("G1", "G2"), offs)]))
t("case 3: alignment misclosure at the tabulated end of the arc < 1e-6 m", all(m["dist"] < 1e-6 for m in g3["alignment"]["misclosure"]))

# ---------------- case 4: curved alignment, skewed supports (20 deg from radial) ----------------
skew4 = 20.0
d4 = desc(Hc, [{"support": "A", "ch": sA, "skew": skew4, "bearing": rad_brg(sA) + skew4}, {"support": "B", "ch": sB, "skew": skew4, "bearing": rad_brg(sB) + skew4}], offs)
g4 = build_geometry(d4)
G = {g["id"]: g for g in g4["girders"]}


def circle_line(s, brg, o):
    """Closed form: line through the control-line point at s with bearing brg meets the circle radius R+o (root nearest s)."""
    O = (-Rc, 0.0)
    C = (-Rc + Rc * math.cos(s / Rc), Rc * math.sin(s / Rc))
    u = (math.sin(math.radians(brg)), math.cos(math.radians(brg)))
    w = (C[0] - O[0], C[1] - O[1])
    b = w[0] * u[0] + w[1] * u[1]
    disc = b * b - (Rc ** 2 - (Rc + o) ** 2)
    ts = [-b + math.sqrt(disc), -b - math.sqrt(disc)]
    tt = min(ts, key=abs)
    return C[0] + tt * u[0], C[1] + tt * u[1]


ok = all(close(G[gid][k], *circle_line(s, rad_brg(s) + skew4, o)) for gid, o in zip(("G1", "G2"), offs) for k, s in (("bearing_A", sA), ("bearing_B", sB)))
t("case 4 curved/skewed: bearing points = closed-form line–circle intersection", ok)
t("case 4: skew to the local normal reported as 20° at each support", all(abs(abs(s["skew_to_local_normal"]) - skew4) < 1e-6 for s in g4["supports"]))

# ---------------- vertical ----------------
vr = [{"ch": 0.0, "RL": 100.0, "curve_length": None}, {"ch": 50.0, "RL": 101.0, "curve_length": 40.0}, {"ch": 100.0, "RL": 100.0, "curve_length": None}]
v = Alignment(H, vr).vertical
# crest: g1 = +2 %, g2 = -2 %, curve 30..70; at the VPI the curve is (g1-g2) L / 8 = 0.04*40/8 = 0.2 below the VPI
t("vertical: RL on the grade line outside the curve", abs(v.rl(20) - 100.4) < 1e-9 and abs(v.rl(80) - 100.4) < 1e-9)
t("vertical: parabola mid-ordinate (g1−g2)L/8 at the VPI", abs(v.rl(50) - (101.0 - 0.2)) < 1e-9)
t("vertical: curve tangent to the grades at its ends (continuous)", abs(v.rl(30) - 100.6) < 1e-9 and abs(v.rl(70) - 100.6) < 1e-9)

# ---------------- missing inputs are refused, naming the field ----------------
dm = desc(H, [{"support": "A", "ch": 10.0, "skew": 30}, {"support": "B", "ch": 40.0, "skew": 30}], [-1.5, 1.5])
t("refuses: support line without bearing (skew alone has no sign)", raises(lambda: build_geometry(dm), GeometryInputError, "bearing missing"))
dm = desc(H, [{"support": "A", "ch": 10.0, "bearing": 0}, {"support": "B", "ch": 40.0, "bearing": 0}], [-1.5, 1.5]); dm["superstructure"]["members"][0]["line_offset_A"]["value"] = None
t("refuses: girder line offset missing", raises(lambda: build_geometry(dm), GeometryInputError, "G1].line_offset_A"))
dm = desc(H, [{"support": "A", "ch": 10.0, "bearing": 0}, {"support": "B", "ch": 40.0, "bearing": 0}], [-1.5]); dm["superstructure"]["members"][0]["straight"]["value"] = False
t("refuses: curved girders (only straight chords implemented, ADR-003)", raises(lambda: build_geometry(dm), GeometryInputError, "straight chords"))
bad = [dict(H[0], length=99.0), H[1]]
t("refuses: element chainages that do not chain (ch_start + length ≠ next)", raises(lambda: Alignment(bad), GeometryInputError, "next element starts"))

# ---------------- BR13A ----------------
b = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
t("BR13A: without proposed values the engine refuses (support bearing only proposed, D-34)", raises(lambda: build_geometry(b), GeometryInputError, "bearing missing"))
gb = build_geometry(b, allow_proposed=True)
t("BR13A: provisional inputs listed (D-34, both supports)", [p["decision"] for p in gb["provisional"]] == ["D-34", "D-34"])
t("BR13A: alignment misclosure at SC, CS, ST < 5 mm (method §5)", all(c["pass"] for c in gb["checks"] if "misclosure" in c["id"]) and len([c for c in gb["checks"] if "misclosure" in c["id"]]) == 3)
cl = next(s for s in gb["supports"] if s["id"] == "A")
bp = next(r["cells"] for r in b["project"]["base_point"]["rows"])
t("BR13A: control line at support A within 1 mm of the documented MCT base point (independent value)", math.hypot(cl["E"] - bp["E"], cl["N"] - bp["N"]) < MM,
  f"{math.hypot(cl['E'] - bp['E'], cl['N'] - bp['N']) * 1000:.2f} mm")
t("BR13A: support bearing 44.029166° is within 0.01° of 34.5° from the chord normal (skew D-4)", all(c["pass"] for c in gb["checks"] if "skew" in c["id"]))
al = gb["_alignment"]
on_curve = all(abs(al.station(g[k]["E"], g[k]["N"], guess=g[k]["ch"])[1] - g[k]["offset"]) < 1e-6 for g in gb["girders"] for k in ("bearing_A", "bearing_B"))
t("BR13A: every bearing centre lies on its girder line offset (to 1e-6 m)", on_curve)
fx = json.load(open(os.path.join(R, "tests/geometry/fixtures/br13a_dashboard_geometry.json")))
dmax = max(math.hypot(fg[k][0] + bp["E"] - g[q]["E"], fg[k][1] + bp["N"] - g[q]["N"]) for g, fg in zip(gb["girders"], fx["girders"]) for k, q in (("PA", "bearing_A"), ("PB", "bearing_B")))
t("BR13A vs dashboard model: bearing centres within 35 mm (explained difference F-4: frozen mesh nodes are not on the straight support line)", dmax < 0.035, f"{dmax * 1000:.1f} mm")
g2b = gb["girders"][1]; f2 = fx["girders"][1]
t("BR13A vs dashboard model: G2 (closest to the control line) bearing centres within 2 mm", max(math.hypot(f2[k][0] + bp["E"] - g2b[q]["E"], f2[k][1] + bp["N"] - g2b[q]["N"]) for k, q in (("PA", "bearing_A"), ("PB", "bearing_B"))) < 0.002)
t("BR13A: straight chords sit about 0.265 m inside the girder-line curve at midspan (known gap C-2 confirmed)", all(abs(abs(g["midchord_station"][1] - g["bearing_A"]["offset"]) - 0.265) < 0.01 for g in gb["girders"]),
  str([round(g["midchord_station"][1] - g["bearing_A"]["offset"], 4) for g in gb["girders"]]))

gapv = b["superstructure"]["flange_gap"]["value"]
dw = []
for g, wd in zip(gb["girders"], fx["widths"]):
    for f, w in zip(g["flange"], wd):
        p1 = f["left"] + f["right"] + (gapv / 2 if f["left_to"].startswith("G") else 0) + (gapv / 2 if f["right_to"].startswith("G") else 0)
        dw.append(abs(p1 - w["w"]["W"]))
t(f"BR13A vs dashboard gwWidth: deck width per girder at all {len(dw)} stations within 3 mm (independent implementation)", len(dw) == 44 and max(dw) <= 3.0, f"max {max(dw):.2f} mm")
w0, w1 = gb["girders"][1]["flange"][0], gb["girders"][1]["flange"][-1]
t("BR13A: inner girder flange width grows from A to B (non-parallel chords between parallel skew lines on a curve)", w1["width"] - w0["width"] > 100, f"{w0['width']:.0f} -> {w1['width']:.0f}")

# ---------------- generality: no bridge-specific constants in the engine ----------------
src = "".join(open(f).read() for f in glob.glob(os.path.join(R, "pdf2bim", "**", "*.py"), recursive=True))
hits = [k for k in ("BR13A", "1895.3", "1924.21", "300098", "6249478", "44.029", "34.5", "3.1656") if k in src]
t("engine code contains no BR13A constants", not hits, str(hits))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
