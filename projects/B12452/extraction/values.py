#!/usr/bin/env python3
"""B12452 (SB01, Sydney Gateway SB-1520): extracted values -> new-description input (P8 stage 4b).

    python3 projects/B12452/extraction/values.py      # -> B12452_description_values.json
    python3 tools/new_description.py projects/B12452/extraction/B12452_description_values.json --out projects/B12452/B12452.bridge.0.2.json

Same owner drawing set and report as SB02 (projects/B12453/extraction/values.py; facts and gaps in SURVEY.md).
Control line = the straight BRIDGE SETOUT LINE of SB01 (0703 tables 1 / 2: end A (331496.102, 6245421.481) to end B
(331471.822, 6245398.356), 33.530 long); chainage = distance along it from end A (no local origin; MGA zone 56).
Offsets: metres, right of the setout line looking from A to B (towards the south-west) positive: left = eastern side
(W1, 13.4 m carriageway), right = western side (W3, ~16.6 m). The bearings and piles are dimensioned along the support
lines from the SOP on control lines MC20 / MC30 (0300 A1, 0301 B1, 0200); their MGA coordinates and offsets are Calculated."""
import json, math, os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")))
from pdf2bim.model.loads import _area_centroid

H = os.path.dirname(os.path.abspath(__file__))
P = "SGWS1-JHSW-1000-BR-DRG-"
docs, out = {}, []


def doc(n):
    if n == "RPT":
        docs["RPT-000001"] = {"id": "RPT-000001", "number": "SGWS1-JHSW-1000-BR-RPT-000001", "revision": "E", "kind": "report", "title": "Bridge design report"}
        return "RPT-000001"
    did = "DRG-" + n
    docs[did] = {"id": did, "number": P + "00" + n.zfill(4), "revision": "-", "kind": "drawing"}
    return did


def put(path, value=None, tag="Direct", unit=None, cells=None, sheet=None, view=None, text=None, formula=None, inputs=(), note=None):
    e = {"path": path, "tag": tag}
    if cells is not None:
        e["cells"] = cells
    else:
        e["value"] = value
    if unit:
        e["unit"] = unit
    if tag == "Direct":
        e["source"] = {k: v for k, v in (("doc", doc(sheet)), ("view", view), ("text", text)) if v}
    elif tag == "Calculated":
        e["derivation"] = {"formula": formula, "inputs": list(inputs)}
    elif tag == "Model":
        e["source"] = {"note": note or "platform modelling choice"}
    elif tag == "Standard-verify":
        e["ref"] = value if isinstance(value, str) and value.startswith(("lib:", "std:")) else "lib:supert/T4"
    if tag == "Missing-Flagged":
        e["value"] = None
        e["note"] = note or "not printed on the drawings read"
    elif note:
        e["note"] = note
    out.append(e)


def dms(d, m, s):
    return d + m / 60 + s / 3600


# ---------------- setout line (0703) and support geometry (0300 / 0301 / 0200) ----------------
SA, SB = (331496.102, 6245421.481), (331471.822, 6245398.356)          # 0703 table 1: end of superstructure A / B on the setout line
L = math.dist(SA, SB)
U = ((SB[0] - SA[0]) / L, (SB[1] - SA[1]) / L)


def along(p):
    """(distance along the setout line from end A, offset right +) of an MGA point."""
    dx, dy = p[0] - SA[0], p[1] - SA[1]
    return dx * U[0] + dy * U[1], dx * U[1] - dy * U[0]


SUP = {   # SOP on MC20 / MC30 (MGA), support-line bearing, bearing / pile positions along it from the MC20 SOP (+ = along the bearing)
    "A": {"sheet": "0300", "sop20": (331495.770, 6245421.159), "sop30": (331497.708, 6245418.741), "ch20": 728.383, "ch30": 698.358,
          "brg": dms(141, 16, 46.8), "brg_txt": "141°16'46.8\"", "gap": 3.099, "front": 790, "back": 560, "ends": (-16.950, 3.099 + 11.917),
          "ends_txt": "16950 from the MC20 SOP (west) / 11917 from the MC30 SOP (east), MC20-MC30 3099",
          # bearings 01 (east) .. 14 (west): east of MC30 SOP 10851 / 8521 / 6182 / 3844 / 1505, 834 west of it; 59 west of the MC20 SOP,
          # then 2307 to the next, 4675 / 6984 / 9292 / 11600 / 13909 / 16226 from the MC20 SOP
          "brgs": [3.099 + 10.851, 3.099 + 8.521, 3.099 + 6.182, 3.099 + 3.844, 3.099 + 1.505, 3.099 - 0.834, -0.059, -(0.059 + 2.307),
                   -4.675, -6.984, -9.292, -11.600, -13.909, -16.226],
          "brgs_txt": "0300 plan: 10851 / 8521 / 6182 / 3844 / 1505 east of the MC30 SOP, 834 west of it; 59 west of the MC20 SOP and 2307 on; "
                      "4675 / 6984 / 9292 / 11600 / 13909 / 16226 west of the MC20 SOP; MC20-MC30 SOP 3099",
          "piles": [3.099 + 10.676, 3.099 + 7.776, 3.099 + 4.876, 3.099 + 1.976, 3.099 - 0.924, -0.817, -3.717, -6.617, -9.517, -12.417, -15.317],
          "piles_txt": "0200 pile layout: 10676 / 7776 / 4876 / 1976 east of the MC30 SOP, 924 west of it; 817 / 3717 / 6617 / 9517 / 12417 / 15317 west of the MC20 SOP",
          "toe": -11.5, "rock": -9.2, "dA": {"SLS": 3491, "ULS": 4210, "M": 1771},
          "rl_top": [8.199, 8.110, 8.021, 7.932, 7.843, 7.751, 7.662, 7.573, 7.484, 7.395, 7.306],
          "rl_brg": [9.589, 9.522, 9.449, 9.376, 9.303, 9.229, 9.160, 9.091, 9.020, 8.949, 8.878, 8.807, 8.736, 8.663]},
    "B": {"sheet": "0301", "sop20": (331472.154, 6245398.667), "sop30": (331474.077, 6245396.270), "ch20": 760.996, "ch30": 730.968,
          "brg": dms(141, 16, 42.9), "brg_txt": "321°16'42.9\" (= 141°16'42.9\")", "gap": 3.073, "front": 796, "back": 554, "ends": (-17.054, 3.073 + 12.236),
          "ends_txt": "17054 from the MC20 SOP (west) / 12236 from the MC30 SOP (east), MC20-MC30 3073",
          "brgs": [-(3.073 + 11.192) * -1, 0, 0],   # replaced below
          "piles": [3.073 + 11.017, 3.073 + 8.117, 3.073 + 5.217, 3.073 + 2.317, 3.073 - 0.583, -0.700, -3.600, -6.500, -9.400, -12.300, -15.200],
          "piles_txt": "0200 pile layout: 11017 / 8117 / 5217 / 2317 east of the MC30 SOP, 583 west of it; 700 / 3600 / 6500 / 9400 / 12300 / 15200 west of the MC20 SOP",
          "toe": -14.0, "rock": -9.5, "dA": {"SLS": 2791, "ULS": 4210, "M": 1765},
          "rl_top": [8.350, 8.264, 8.177, 8.091, 8.004, 7.909, 7.822, 7.736, 7.649, 7.562, 7.476],
          "rl_brg": [9.740, 9.675, 9.604, 9.533, 9.463, 9.392, 9.324, 9.324, 9.187, 9.118, 9.049, 8.980, 8.910, 8.839]}}
# B1 (0301) is drawn looking the other way: + along 321°16'42.9" = west. In the 141° sense (+ = east):
SUP["B"]["brgs"] = [3.073 + 11.192, 3.073 + 8.862, 3.073 + 6.523, 3.073 + 4.185, 3.073 + 1.846, 3.073 - 0.493, 0.255,
                    -2.052, -4.360, -6.668, -8.977, -11.285, -13.594, -15.911]
SUP["B"]["brgs_txt"] = ("0301 plan: 11192 / 8862 / 6523 / 4185 / 1846 east of the MC30 SOP, 493 west of it, then 2325 to the next bearing, 255 east of "
                        "the MC20 SOP; 2052 / 4360 / 6668 / 8977 / 11285 / 13594 / 15911 west of the MC20 SOP; MC20-MC30 SOP 3073")
for s, c in SUP.items():
    c["u"] = (math.sin(math.radians(c["brg"])), math.cos(math.radians(c["brg"])))
    c["at"] = lambda d, c=c: (c["sop20"][0] + d * c["u"][0], c["sop20"][1] + d * c["u"][1])
    s0, o0 = along(c["sop20"])
    t = -o0 / (c["u"][0] * U[1] - c["u"][1] * U[0])          # move along the support line to offset 0 (the setout line)
    c["ch"] = s0 + t * (c["u"][0] * U[0] + c["u"][1] * U[1])
    c["t"] = t                                               # MC20 SOP -> setout-line crossing, along the support line
    c["check_gap"] = math.dist(c["sop20"], c["sop30"])
    assert abs(c["check_gap"] - c["gap"]) < 0.002, (s, c["check_gap"])
GIRDER_GAP = [math.dist(SUP["A"]["at"](SUP["A"]["brgs"][k]), SUP["B"]["at"](SUP["B"]["brgs"][k])) for k in range(14)]
assert all(abs(g + 0.8 - 33.441) < 0.003 for g in GIRDER_GAP), GIRDER_GAP     # bearing-to-bearing + 2 x 400 = X1 33441 (0601-0604)

# ---------------- project ----------------
put("project.name", "Sydney Gateway Stage 1 - three bridges on Airport Drive over Main Road No 183: SB01", sheet="0101", view="title block")
put("project.bridge_id", "B12452", sheet="0101", view="title block", text="SB01 BRIDGE No: B12452")
put("project.client", "Transport for NSW", sheet="0101", view="title block")
put("project.designer", "BG&E Structural for John Holland Seymour Whyte (JHSW)", sheet="0101", view="title block")
put("project.drawing_set", "DS2021/000504", sheet="0101", view="title block")
put("project.status", "Final design documentation", sheet="0101", view="title block")
put("project.datum_horizontal", "MGA zone 56 (GDA94)", sheet="0101", view="title block")
put("project.datum_vertical", "AHD", sheet="0101", view="title block")
put("project.importance_level", tag="Missing-Flagged", note="BEDC-4 'essential for post-earthquake recovery' (0101); no importance level printed")
put("project.design_life", 100, unit="years", sheet="RPT", view="table 2-10", text="primary bridge structural elements 100")
put("project.base_point.rows[0]", tag="Model", cells={"name": "MCT local origin = SB01 setout line end A (0703 table 1)", "E": SA[0], "N": SA[1]},
    note="MIDAS file origin only; the description stays in MGA")

# ---------------- alignment ----------------
put("alignment.control_line", "BRIDGE SETOUT LINE SB01 (straight; on control line MC20)", sheet="0703", view="tables 1 / 2 - bridge setout line - bridge SB01",
    note="report: 'SB01 is setout as a straight bridge' (mid-ordinate 78 mm, accepted departure)")
# the skewed girder ends reach past both deck-end points: start / end at the outermost table 2 points (-1.414 / 34.805), on the same line
P0, P1 = (331497.125, 6245422.456), (331470.898, 6245397.476)
assert all(abs(along(q)[1]) < 0.002 for q in (P0, P1)) and abs(along(P0)[0] + 1.414) < 0.002 and abs(along(P1)[0] - 34.805) < 0.002
# the sills reach ~17 m either side on the skew: the straight line is carried 10 m past both printed end points (same line)
XT = 10.0
Q0 = (P0[0] - XT * U[0], P0[1] - XT * U[1]); Q1 = (P1[0] + XT * U[0], P1[1] + XT * U[1])
HF = ("straight line through the 0703 table 2 points -1.414 (331497.125, 6245422.456) and 34.805 (331470.898, 6245397.476) "
      f"(chord {math.dist(P0, P1):.4f} vs 36.219), carried {XT:g} m past each so the skewed sills stay on the alignment; chainage = distance along "
      "the setout line from end of superstructure A (0.000, 331496.102 6245421.481)")
put("alignment.horizontal.rows[0]", tag="Calculated", cells={"element": "tangent", "ch_start": -1.414 - XT, "length": 36.219 + 2 * XT,
    "E_start": round(Q0[0], 4), "N_start": round(Q0[1], 4)}, formula=HF)
put("alignment.horizontal.rows[1]", tag="Calculated", cells={"element": "tangent", "ch_start": 34.805 + XT, "E_start": round(Q1[0], 4), "N_start": round(Q1[1], 4)}, formula=HF)
# vertical: RL 1 (deck surface at the setout line, 0703 table 2) at 4.000 / 16.000 / 28.000 -> one parabola (exact through the three)
X3, R3 = (4.0, 16.0, 28.0), (11.074, 11.151, 11.190)
a2 = (R3[2] - 2 * R3[1] + R3[0]) / (2 * 12.0 ** 2)          # RL = R(16) + b (x - 16) + a2 (x - 16)^2
b1 = (R3[2] - R3[0]) / 24.0
rl = lambda x: R3[1] + b1 * (x - 16) + a2 * (x - 16) ** 2
VF = ("parabola through 0703 table 2 RL 1 (deck surface at the setout line) 11.074 @ 4.000, 11.151 @ 16.000, 11.190 @ 28.000 "
      f"(curvature {2 * a2:.3e} /m); check against the other table 2 points: " +
      ", ".join(f"{x:g}: {rl(x):.3f} vs {r}" for x, r in ((8.0, 11.104), (12.0, 11.129), (20.0, 11.168), (24.0, 11.181), (32.0, 11.195))))
V0, V1 = -1.414 - XT, 34.805 + XT                             # same span as the horizontal rows (outside the deck: extrapolated)
g0, g1 = (b1 + 2 * a2 * (V0 - 16)) * 100, (b1 + 2 * a2 * (V1 - 16)) * 100
put("alignment.vertical.rows[0]", tag="Calculated", cells={"ch": V0, "RL": round(rl(V0), 4), "grade_out": round(g0, 4)}, formula=VF)
put("alignment.vertical.rows[1]", tag="Calculated", cells={"ch": round((V0 + V1) / 2, 4), "RL": round(rl(V0) + g0 / 100 * (V1 - V0) / 2, 4), "grade_in": round(g0, 4),
    "grade_out": round(g1, 4), "curve_length": round(V1 - V0, 4)}, formula=VF + "; one curve over the alignment span, IP at its middle; beyond the deck (-1.414 / 34.805) the parabola is extrapolated (sills only)")
put("alignment.vertical.rows[2]", tag="Calculated", cells={"ch": V1, "RL": round(rl(V1), 4), "grade_in": round(g1, 4)}, formula=VF)
W1, W2, W3 = 13.4, 1.356, 16.591          # 0703 table 2 at 16.000 (mid-length)
EL, ER = -(W1 + W2 + 0.4), W3 + 0.4
put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": 3.0, "right": 3.0, "crown_offset": round(EL, 3)},
    formula="one-way fall to the west (right) across the whole deck (0701 section 1 SB01): 0703 table 2 at 16.000 RL 2 (left barrier face, -14.756) 11.596, "
            "RL 1 (setout line) 11.151, RL 3 (right barrier face, +16.591) 10.651: (11.596 - 10.651) / 31.347 = 3.01 %; crown at the left deck edge",
    inputs=["deck.edge_left"])
for i, s in enumerate("AB"):
    c = SUP[s]
    sk = abs(((math.degrees(math.atan2(U[0], U[1])) - c["brg"]) % 180) - 90)
    put(f"alignment.support_lines.rows[{i}]", tag="Calculated", cells={"support": s, "ch": round(c["ch"], 4), "skew": round(sk, 4), "bearing": round(c["brg"] % 180, 5)},
        formula=f"{c['sheet']} plan: SOP on MC20 CH {c['ch20']} ({c['sop20'][0]}, {c['sop20'][1]}), bearing {c['brg_txt']}; ch = where that line crosses the setout "
                f"line ({c['ch']:.4f} from end A); skew against the straight setout line (bearing {math.degrees(math.atan2(U[0], U[1])):.4f}°, 0703) = {sk:.4f}°. "
                "The 5.433° TYP printed on the plans is against MC20 (curved, R 1800)")

# ---------------- deck ----------------
DW = "0703 table 2 at 16.000 (mid-length): W1 13.400, W2 1356, W3 16591; W2 varies 1206 MIN - 1525 MAX, W3 16548 MIN - 16631 MAX along the span (0701)"
put("deck.carriageway_left", -(W1 + W2), unit="m", tag="Calculated", formula="-(W1 + W2): left barrier inside face; " + DW)
put("deck.carriageway_right", W3, unit="m", tag="Calculated", formula="W3: right barrier inside face; " + DW)
put("deck.edge_left", round(EL, 3), unit="m", tag="Calculated", formula="left barrier face + 400 to the deck edge (0706 detail A)", inputs=["deck.carriageway_left"])
put("deck.edge_right", round(ER, 3), unit="m", tag="Calculated", formula="right barrier face + 400 to the deck edge (0706 detail A)", inputs=["deck.carriageway_right"])
MB = 0.652                                                    # 0706 detail B: median barrier base width
put("deck.carriageways.rows[0]", tag="Calculated", cells={"name": "eastbound (left, W1)", "left": round(-(W1 + W2), 3), "right": round(-W2, 3)},
    formula="left barrier face to the median barrier left face: -(13.400 + W2) to -W2; " + DW + "; the platform takes one width (mid-length)")
put("deck.carriageways.rows[1]", tag="Calculated", cells={"name": "westbound (right, W3, with breakdown bay)", "left": round(-(W2 - MB), 3), "right": W3},
    formula="median barrier right face (W2 - 652 base width, 0706 detail B) to the right barrier face W3; " + DW)
put("deck.slab_thickness", 200.0, unit="mm", sheet="0701", view="section 1 bridge SB01", text="MIN. 200 THICK CONCRETE DECK")
put("deck.surfacing_thickness", 75.0, unit="mm", sheet="0701", view="section 1 bridge SB01", text="75 THICK BITUMINOUS WEARING SURFACE AND WATERPROOF MEMBRANE")
put("deck.surfacing_density", 22.0, unit="kN/m3", sheet="RPT", view="table 2-5", text="asphalt surfacing 22 kN/m3")
put("deck.girders_follow_crossfall", True, sheet="0701", view="section 1 bridge SB01", text="girders shown square to the 3% fall")
for i in range(14):
    put(f"deck.haunch_concrete.rows[{i}]", tag="Missing-Flagged", cells={"girder": f"G01-{i + 1:02d}"},
        note="haunch over the girder not dimensioned (deck '200 MIN'); follows from the deck RLs (0703), girder hog at deck pour (0600) and pour age (not printed)")
# external barriers: PB-1 precast + stitch pour, as SB02 (0909 section 1); median: cast-in-place type MCI (0706 detail B, 1:10)
PRE = [(-561, 0), (-441, 0), (-396, 445), (-225, 445), (-225, 600), (0, 760), (-53, 1250), (-436, 1250)]
STI = [(-225, 425), (125, 425), (125, 577), (0, 760), (-225, 600)]
(aP, cP), (aS, cS) = _area_centroid(PRE), _area_centroid(STI)
GC = 25.0
BW = round((aP + aS) / 1e6 * GC, 2)
BXC = -(aP * cP[0] + aS * cS[0]) / (aP + aS) / 1000
BW_TXT = (f"0909 section 1 polygons (as SB02): precast PB-1 A = {aP / 1e6:.4f} m2 + in-situ stitch A = {aS / 1e6:.4f} m2, x 25 kN/m3 (report table 2-4) = "
          f"{BW:.2f} kN/m; centroid {BXC * 1000:.1f} mm outward from the inside face; twin steel rails and safety screens not included")
# median MCI: base 652 (0706 detail B), top 200, 125 + 101 + 200 + 101 + 125; heights 1275 / 1292 above the slab (mean 1283.5);
# vertical toe and slope breaks scaled from the 1:10 detail (not dimensioned): toe 153 high, break at 125 in / 335 high
HM = (1275 + 1292) / 2
MED = [(0, 0), (652, 0), (652, 153), (527, 335), (426, HM), (226, HM), (125, 335), (0, 153)]
aM, cM = _area_centroid(MED)
MW = round(aM / 1e6 * GC, 2)
MW_TXT = (f"0706 detail B (1:10) polygon: base 652, top 200 (125 + 101 + 200 + 101 + 125), height mean of 1275 / 1292 = {HM}; toe 153 high and slope break at "
          f"125 in / 335 high scaled from the detail (not dimensioned); A = {aM / 1e6:.4f} m2 x 25 kN/m3 (report table 2-4) = {MW:.2f} kN/m")
print(BW_TXT); print(MW_TXT)
for b, face in (("left", -(W1 + W2)), ("right", W3)):
    p = f"deck.barriers[barrier_{b}]"
    put(p + ".side", b, sheet="0701", view="section 1 bridge SB01")
    put(p + ".type", "precast concrete parapet PB-1, medium performance level (type MAO), with twin steel rails", sheet="RPT", view="§4.1 barriers",
        text="External barriers ... Medium Performance (Type MAO)")
    put(p + ".height", 1250.0, unit="mm", sheet="0902", view="type PB-1 inside elevation", text="1250 precast unit; rails above not included")
    put(p + ".weight", BW, unit="kN/m", tag="Calculated", formula=BW_TXT, inputs=[])
    put(p + ".solid", True, sheet="0902", view="type PB-1", text="solid precast concrete unit")
    put(p + ".offset", round(face - BXC if b == "left" else face + BXC, 4), unit="m", tag="Calculated", inputs=[f"deck.carriageway_{b}"],
        formula=f"inside face {face:+.3f} {'-' if b == 'left' else '+'} centroid {BXC * 1000:.1f} mm outward; " + BW_TXT.split(';')[0])
p = "deck.barriers[barrier_median]"
put(p + ".side", "median", sheet="0701", view="section 1 bridge SB01", text="median barrier, detail B 0706")
put(p + ".type", "cast-in-place median barrier, medium performance (type MCI)", sheet="RPT", view="§4.1 barriers", text="median barrier on SB01 ... type MCI")
put(p + ".height", HM, unit="mm", tag="Calculated", formula="mean of 1275 / 1292 above the slab (0706 detail B; crossfall)")
put(p + ".weight", MW, unit="kN/m", tag="Calculated", formula=MW_TXT, inputs=[])
put(p + ".solid", True, sheet="0706", view="detail B")
put(p + ".offset", round(-W2 + cM[0] / 1000, 4), unit="m", tag="Calculated", inputs=["deck.carriageways"],
    formula=f"left face -W2 ({-W2}) + centroid {cM[0]:.1f} mm from the left face (detail B polygon); " + DW)

# ---------------- superstructure ----------------
put("superstructure.type", "super-t", sheet="0600", view="girder layout plan", text="1515 DEEP SUPER-T")
put("superstructure.spans", 1, sheet="0110", view="general arrangement")
X1 = {6: 33.559, 7: 33.559}
for k in range(14):
    g = f"G01-{k + 1:02d}"; p = f"superstructure.members[{g}]"
    for s in "AB":
        c = SUP[s]
        sa, off = along(c["at"](c["brgs"][k]))
        put(p + ".line_offset_" + s, round(off, 4), unit="m", tag="Calculated",
            formula=f"bearing {s}01-{k + 1:02d} at {c['brgs'][k]:+.3f} along {c['brg_txt']} from the MC20 SOP ({c['sop20'][0]}, {c['sop20'][1]}); "
                    f"offset square to the setout line, right +. {c['brgs_txt']}")
    sheet = "0602" if k == 0 else ("0604" if k == 13 else "0601")
    put(p + ".length", X1.get(k + 1, 33.441), unit="m", sheet=sheet, view="table girders dimensions",
        text=f"01-{k + 1:02d} X1 = {int(X1.get(k + 1, 33.441) * 1000)} overall length along girder CL (soffit)",
        note="bearing-to-bearing 32.641 + 2 x 400 = 33.441 for every girder; 01-06 / 01-07 X1 33559 (query: same bearing spacing)" if k + 1 in X1 else None)
    for s in "AB":
        put(p + ".bearing_offset_" + s, 400, unit="mm", sheet="0601", view="plan girder type F1", text="CL bearing 400 from the girder end")
    put(p + ".straight", True, tag="Model", note="precast girders straight between bearings")
    put(p + ".type_ref", "ST1", tag="Model", note="one cross-section and strand layout for all (0606 / 0608); F2 / F4 differ in edge details only")
offs = [along(SUP["A"]["at"](SUP["A"]["brgs"][k]))[1] for k in range(14)]
for k in range(1, 13):
    cells = {"t": 0.0, "left": round((abs(offs[k] - offs[k - 1]) * 1000 - 20) / 2, 1), "right": round((abs(offs[k + 1] - offs[k]) * 1000 - 20) / 2, 1)}
    put(f"superstructure.members[G01-{k + 1:02d}].flange_edges.rows[0]", tag="Calculated", cells=cells,
        formula="flange tips 'VARIES' (0606): (spacing - 20 NOM gap (0701 detail C)) / 2 each side; spacings from the A bearing offsets")
put("superstructure.flange_gap", 20.0, unit="mm", sheet="0701", view="detail C", text="20 NOM GAP")
put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="edge girder outer flange tip to deck edge not dimensioned (0606 'VARIES')")
for i, s in enumerate("AB"):
    put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": s, "width": 800.0, "depth": 1265.0, "concrete": "deck (40 MPa)"},
        formula="width 800 (0706 section 2); depth W = 1065 (0601 table 1 / 0706 '1065 (for bridges SB01 & SB02)') + 200 slab", inputs=["deck.slab_thickness"])
T = "superstructure.supert_types[ST1]"
put(T + ".section", "lib:supert/T4", tag="Standard-verify", note="1515 deep Super-T (TfNSW T4 family), as BR13A / SB02")
put(T + ".depth", 1515, unit="mm", sheet="0606", view="typical Super-T girder section", text="1515")
for i, (k, nm, v, un) in enumerate((("D", "Overall depth", 1515, "mm"), ("bw", "Soffit width", 757, "mm"), ("tw", "Web thickness", 100, "mm"),
                                    ("d1", "Void floor fall", 58, "mm"), ("d2", "Bottom flange depth at CL", 265, "mm"), ("ttf", "Top flange thickness", 90, "mm"))):
    put(T + f".shape.rows[{i}]", sheet="0606", view="typical Super-T girder section", text=f"{v}", cells={"key": k, "name": nm, "value": v, "unit": un})
put(T + ".shape.rows[6]", tag="Standard-verify", cells={"key": "S", "name": "Web slope (V : H)", "value": 10.556, "unit": ""}, note="10.556 : 1 printed (0606)")
put(T + ".concrete_28d", 50, unit="MPa", sheet="0600", view="general notes", text="MINIMUM 28 DAY COMPRESSIVE STRENGTH OF CONCRETE SHALL BE 50 MPa")
put(T + ".concrete_transfer", 40, unit="MPa", sheet="0600", view="general notes", text="MINIMUM COMPRESSIVE STRENGTH OF CONCRETE SHALL BE 40 MPa AT TRANSFER")
for i, e in enumerate("AB"):
    put(T + f".zones.rows[{i}]", sheet="0601", view="plan girder type F1", text="1500 end diaphragm", cells={"from": 0.0, "to": 1.5, "kind": "solid_end_" + e})
put(T + ".haunch", tag="Missing-Flagged", unit="mm", note="girder top to deck soffit not dimensioned (deck '200 MIN', varies)")
X = {k: 25 + 50 * (6 - k) for k in range(1, 7)}
ROWS = {"B": (260, {1: 0}), "C": (210, {1: 8000, 2: 0, 3: 2000, 4: 0, 5: 12000, 6: 0}), "D": (160, {1: 0, 2: 6000, 3: 0, 4: 4000, 5: 0, 6: 0}),
        "E": (110, {1: 2000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}), "F": (60, {2: 2000, 4: 2000, 5: 0, 6: 0})}
st = [(1435.0, s * 495.0, 0.0, "A") for s in (-1, 1)]
for r, (y, locs) in ROWS.items():
    for loc, deb in locs.items():
        st += [(float(y), s * X[loc], float(deb), r) for s in (-1, 1)]
assert len(st) == 48
for i, (y, x, deb, r) in enumerate(sorted(st, key=lambda q: (q[0], q[1]))):
    put(T + f".strand_pattern.rows[{i}]", sheet="0608", view="strand layout + debonding schedule (one schedule for SB01-SB03)",
        text="rows F-B at 60 + 4 x 50; locations 1-6 at 25 + 5 x 50 each side; row A loc 7 at ±495, 80 below the top; debonded both ends",
        cells={"y": y, "x": float(x), "diameter": 15.7, "debond_left": deb, "debond_right": deb, "on": True}, note=f"row {r}")
put(T + ".jacking_ratio", round(209 / 279, 4), tag="Calculated", unit="", formula="force after release of the jack 209 kN / MBL 279 kN (0600 prestressing notes)")
for i, (a_, b_, sp) in enumerate(((1.5, 11.55, 150.0), (11.55, 21.891, 300.0), (21.891, 31.941, 150.0))):
    put(T + f".fitments.rows[{i}]", tag="Calculated", cells={"from": a_, "to": b_, "diameter": 16.0, "legs": 2, "spacing": sp},
        formula="0650 / 0651 (as SB02, girder X1 33.441): 67 bundles N16 at 150 from each end after the 1500 end diaphragm (67 x 0.15 = 10.05), "
                "the centre at 300 (remainder 10.341); 01-06 / 01-07 (33.559) not distinguished")
for i, face in enumerate(("top", "bot")):
    put(T + f".deck_bars.rows[{i}]", tag="Calculated", cells={"face": face, "diameter": 16.0, "spacing": 150.0, "cover": 61.0},
        formula="D2 216-N16-S-150 NF / D3 216-N16-S-150 FF longitudinal (0750 plan bridge SB01); cover 45 to the nearest bar (0750 notes) + transverse N16 = 61",
        inputs=["deck.slab_thickness"])
put("custom.girder_hog_table", tag="Direct", sheet="0600", view="calculated hog of girders",
    value={"girders": "01-01 .. 01-05, 01-08 .. 01-13 (01-06 / 01-07 / 01-14 differ by 1-2 mm)", "transfer": 57, "28_days": 75, "60_days": 79, "100_days": 81,
           "deck_slab_deflection": -29, "mass_t": 61.1}, unit="mm",
    note="01-06: 57 / 76 / 80 / 82, -29, 62.5 t; 01-07..01-13: deflection -28; 01-14: 57 / 74 / 78 / 79, -27, 59.4 t")
put("custom.girder_hog_basis", "density 2550 kg/m3; E at transfer 32,800 MPa; elevated temperature curing at 70 °C for 8 hours after casting; girder self weight only",
    sheet="0600", view="prestressing notes")
put("custom.strand_MBL", 279, unit="kN", sheet="0600", view="prestressing notes"); put("custom.strand_force_after_release", 209, unit="kN", sheet="0600", view="prestressing notes")

# ---------------- bearings (0500 table 1, 0503) ----------------
for s in "AB":
    c = SUP[s]
    for k in range(14):
        bid = f"{s}01-{k + 1:02d}"; p = f"bearings.items[{bid}]"
        put(p + ".support", s, tag="Model", note=f"bearing {bid} on abutment {s}1")
        put(p + ".member", f"G01-{k + 1:02d}", tag="Model", note=f"bearing {bid} under girder 01-{k + 1:02d} (0500 / 0600 numbering: 01 east .. 14 west)")
        put(p + ".type", "elastomeric", sheet="0503", view="laminated elastomeric bearing", text="AS5100.4 PART No AS [50] 070910R (44 No REQUIRED)")
        put(p + ".plan_a", 380, unit="mm", sheet="0503", view="plan laminated elastomeric bearing", text="380 (direction of traffic)")
        put(p + ".plan_b", 480, unit="mm", sheet="0503", view="plan laminated elastomeric bearing", text="480")
        put(p + ".bearing_height", 157, unit="mm", sheet="0503", view="elevation", text="157")
        put(p + ".top_rl", c["rl_brg"][k], unit="m", sheet="0500", view="table 1 bearing data", text=f"{bid} RL 'X' {c['rl_brg'][k]}",
            note="query: B01-07 and B01-08 both 9.324 (the row trend gives about 9.255 for B01-08)" if bid == "B01-08" else None)
        for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
            put(p + "." + f, tag="Missing-Flagged", unit="MPa" if f == "shear_modulus" else "mm", note="catalogue part AS [50] 070910R; layers / G not printed")
        put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: mortar pad + epoxy block per measured hog (0502)")
        put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric; buffer bearings behind the girders (0314) — idealisation for the engineer")
        put(p + ".restraint_transverse", tag="Missing-Flagged", note="two lateral restraint blocks per abutment on SB01 (report §4.1, 0300 / 0301) — idealisation for the engineer")
put("custom.bearing_part_no", "AS [50] 070910R", sheet="0503", view="plan laminated elastomeric bearing")

# ---------------- supports (0300 A1, 0301 B1, 0200 / 0201 piles, report table 5-3) ----------------
for s, c in SUP.items():
    p = f"supports[{s}]"
    put(p + ".kind", "spill-through abutment", tag="Model",
        note="catalogue class nearest: cast-in-place sill beam on 11 sleeved Ø1050 bored piles inside a reinforced soil wall block (0113 section 1)")
    put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": float(c["front"] + c["back"]), "depth": 1750.0, "length": round(c["ends"][1] - c["ends"][0], 3)},
        formula=f"width {c['back']} + {c['front']} about the bearing line ({c['sheet']} plan); depth 1750 TYPICAL ({c['sheet']} elevation); length {c['ends_txt']}")
    put(p + ".headstock_setout.rows[0]", sheet=c["sheet"], view="plan", text=f"{c['front']} span side of the bearing line", cells={"edge": "front", "value": float(c["front"])})
    put(p + ".headstock_setout.rows[1]", sheet=c["sheet"], view="plan", text=f"{c['back']} curtain-wall side", cells={"edge": "back", "value": -float(c["back"])})
    shift = -c["t"]                                          # measured from where the support line crosses the setout line
    for j, (edge, v) in enumerate((("start", c["ends"][0]), ("end", c["ends"][1]))):
        put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round((v + shift) * 1000, 0)},
            formula=f"sill {'west (right)' if edge == 'start' else 'east (left)'} end {v:+.3f} from the MC20 SOP ({c['ends_txt']}, {c['sheet']} plan), "
                    f"moved {shift:+.4f} to the setout-line crossing; mm along the support line, + = east / left")
    put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "fill / estuarine clay / Botany sand / residual clay / Unit 5-7 rock (report table 5-3)"},
        note="lateral soil moduli in Appendix J (geotechnical design report), not in the copy supplied")
    put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="reinforced soil wall block; unit weight 22 kN/m3 compacted soil (report table 2-4)")
    put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="SB01: Unit 6 Erm 100 MPa, Unit 7 Erm 350 MPa (report table 5-4); subgrade modulus not given")
    put(p + ".curtain_wall.rows[0]", tag="Missing-Flagged", cells={}, note="curtain wall above the seat (0302 / 0303 sections not read)")
    for k, d in enumerate(c["piles"]):
        pid = f"{s}01-{k + 1:02d}"; q = p + f".piles[{pid}]"
        E, N = c["at"](d)
        for kk, v in (("E", E), ("N", N)):
            put(q + "." + kk, round(v, 3), unit="m", tag="Calculated",
                formula=f"MC20 SOP {c['sheet']} ({c['sop20'][0]}, {c['sop20'][1]}) {d:+.3f} along the pile line (bearing {c['brg_txt']}); {c['piles_txt']}")
        put(q + ".diameter", 1050.0, unit="mm", sheet="0200", view="pile layout plan", text="Ø1050 BORED CAST-IN-PLACE PILE")
        put(q + ".rl_top", c["rl_top"][k], unit="m", sheet="0201", view="table 1 pile data", text=f"{pid} TOP OF PILE RL 'B' {c['rl_top'][k]}")
        put(q + ".rl_toe", c["toe"], unit="m", sheet="0201", view="table 1 pile data", text=f"FOUNDING LEVEL RL 'A' {c['toe']}")
        put(q + ".rl_rock", c["rock"], unit="m", sheet="RPT", view="table 5-3 inferred stratigraphy",
            text=f"SB01 abutment {s}: Unit 6 weak rock top RL {c['rock']}", note="table 5-3 row B has one value fewer than its columns: read as SB02 (second-last = Unit 6)" if s == "B" else None)
        put(q + ".design_actions.rows[0]", sheet="0201", view="table 1 pile data", text="design maximum axial compression at top of pile SLS",
            cells={"limit_state": "SLS", "N": float(c["dA"]["SLS"])}, note="report table 5-5 gives SLS 3573 (A) / 3515 (B) kN for socket design (query)")
        put(q + ".design_actions.rows[1]", sheet="0201", view="table 1 pile data", text="ULS axial / design maximum bending moment ULS",
            cells={"limit_state": "ULS", "N": float(c["dA"]["ULS"]), "M": float(c["dA"]["M"])})

# ---------------- materials (as SB02: same notes sheets and report tables) ----------------
for i, (el, fc, sheet, txt, E_, dens) in enumerate((("Super-T girders", 50.0, "0600", "50 MPa", 34800.0, 26.0), ("deck", 40.0, "0700", "40 MPa", 32800.0, 25.0),
                                                   ("piles", 50.0, "0250", "50 MPa", 34800.0, 25.0), ("abutments", 40.0, "0302", "40 MPa", 32800.0, 25.0))):
    put(f"materials.concrete.rows[{i}]", sheet=sheet, view="general notes",
        text=f"{txt} ({sheet}); E {E_:.0f} (report table 2-1); density {dens} kN/m3 (report table 2-4)", cells={"element": el, "fc": fc, "E": E_, "density": dens},
        note="girder density: report 26.0 kN/m3 vs 0600 hog basis 2550 kg/m3 (query)" if dens == 26.0 else None)
put("materials.strand.rows[0]", sheet="RPT", view="table 2-3", text="15.7 mm 7 wire ordinary relax 2, A 150, MBL 279 kN, fpb 1860, E 195 GPa",
    cells={"type": "15.7 mm 7-wire ordinary, relax 2", "diameter": 15.7, "fpb": 1860.0, "area": 150.0, "Ep": 195000.0})
put("materials.reinforcement.rows[0]", sheet="RPT", view="table 2-2", text="D500N 500 MPa, E 200,000", cells={"grade": "D500N", "fsy": 500.0, "Es": 200000.0})
put("custom.sdl_line_loads", "utilities 1 kN/m, safety screens 1 kN/m (safety screens on SB01 only, report §4.4)", sheet="RPT", view="table 2-5")
put("custom.drainage", "Ø225 FRC pipe under the deck along the median, 150 scuppers at 5 m (report §4.4)", sheet="RPT", view="§4.4 drainage")

# ---------------- loads ----------------
put("loads.traffic_models.rows[0]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "M1600", "on": True})
put("loads.traffic_models.rows[1]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "S1600", "on": True})
put("loads.traffic_models.rows[2]", sheet="RPT", view="table 2-7", text="SB01 | 6 | ± 1 m either side of the centreline of any two marked travel lanes in each direction",
    cells={"model": "HLP400", "on": True}, note="platform: HLP centred on each carriageway ±1 m (marked-lane pairs not tried: shortcut in traffic.py)")
put("loads.traffic_models.rows[3]", sheet="RPT", view="table 2-7", text="0.5x SM1600 on any adjacent unoccupied travel lane, in conjunction with the HLP400 loading",
    cells={"model": "HLP400_with_half_M1600", "on": True})
put("loads.design_speed", 90, unit="km/h", sheet="0101", view="design criteria", text="DESIGN TRAFFIC SPEED: 90 km/h")
for k, un in (("braking_force", "kN"), ("traffic_surcharge", "kPa"), ("shrinkage_creep_shortening", "1e-6")):
    put("loads." + k, tag="Missing-Flagged", unit=un, note="AS 5100.2 method stated in the report; value not printed")
put("loads.wind.rows[0]", sheet="0101", view="wind loading", text="WIND VELOCITY ULS 48 m/s", cells={"item": "V_uls", "value": 48.0, "unit": "m/s"})
put("loads.wind.rows[1]", sheet="0101", view="wind loading", text="WIND VELOCITY SLS 37 m/s", cells={"item": "V_sls", "value": 37.0, "unit": "m/s"})
put("loads.wind.rows[2]", sheet="RPT", view="2.4.6 wind loads", text="design speed 35 m/s for ULS PE + road traffic", cells={"item": "V_with_traffic", "value": 35.0, "unit": "m/s"})
for i, it in enumerate(("air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 3):
    put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 section 17 stated; values not printed")
for i, (it, v) in enumerate((("kp", "1.7"), ("Z", "0.08"), ("site_class", "De"))):
    put(f"loads.earthquake.rows[{i}]", sheet="0101", view="earthquake loading", text=f"{it} {v}", cells={"item": it, "value": v})
put("loads.earthquake.rows[3]", tag="Missing-Flagged", cells={"item": "Rf"}, note="µ 1.0 longitudinal / 1.5 transverse (0101); Rf not printed")
put("loads.earthquake.rows[4]", tag="Missing-Flagged", cells={"item": "zeta"}, note="not printed")
put("loads.earthquake.rows[5]", tag="Missing-Flagged", cells={"item": "vertical"}, note="µ 1.0 vertical listed (report); vertical action not stated as applied")
for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
    put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 (report 2.4.10); values not printed")
for gname in ("gradient_positive", "gradient_negative"):
    for i in range(13):
        put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note="AS 5100.2 differential temperature stated; values not printed")
put("custom.design_lanes", 9, sheet="0101", view="design criteria", text="No OF DESIGN LANES SB01: 9",
    note="the platform counts lanes per carriageway, floor(width / 3.2): 13.400 -> 4, 17.295 -> 5, total 9 = printed")
put("custom.marked_lanes", 6, sheet="RPT", view="table 2-7", text="SB01 | 6")
put("custom.route_factor", 0.3, sheet="0101", view="design criteria", text="ROUTE FACTOR: 0.3")
put("custom.heavy_vehicles_per_lane_day", "SB01-EB 4526, SB01-WB 6628", sheet="0101", view="design criteria")
put("custom.differential_settlement", 11, unit="mm", sheet="0101", view="differential settlement", text="11mm TOTAL BETWEEN ADJACENT SUPPORTS")
put("custom.earthquake_mu_longitudinal", 1.0, sheet="0101", view="earthquake loading"); put("custom.earthquake_mu_transverse", 1.5, sheet="0101", view="earthquake loading")
put("custom.wind_region", "A2", sheet="0101", view="wind loading"); put("custom.wind_terrain", "TC2", sheet="0101", view="wind loading")
put("custom.girder_rating_factors", "G01-01 1.08, G01-02 1.15, 03 1.14, 04 1.14, 05 1.13, 06 1.13, 07 1.12, 08 1.11, 09 1.11, 10 1.10, 11 1.10, 12 1.09, 13 1.09, 14 1.08",
    sheet="RPT", view="table 4-18 girder rating factors")

# ---------------- prestress losses / design options / analysis settings (as SB02) ----------------
i_ = 0
for it, un in (("k4", "-"), ("chi", "-"), ("ts", "days"), ("Rb", "%"), ("k7", "-"), ("Tav", "C"), ("jt", "days"), ("rb", "-"), ("dhard", "days"),
               ("tsd", "days"), ("rd", "-"), ("sidl", "kN/m"), ("sidlA", "days"), ("dform", "kN/m"), ("meth", "-"), ("rlx", "-"), ("relpre", "-"),
               ("emod", "-"), ("Tcur", "C"), ("hcur", "h")):
    if it in ("Tcur", "hcur"):
        put(f"design.prestress_losses.rows[{i_}]", sheet="0600", view="prestressing notes", text="ELEVATED TEMPERATURE CURING AT 70°C FOR 8 HOURS",
            cells={"item": it, "value": 70.0 if it == "Tcur" else 8.0, "unit": un})
    else:
        put(f"design.prestress_losses.rows[{i_}]", tag="Missing-Flagged", cells={"item": it}, note="not printed (0600 gives the hog basis only)")
    i_ += 1
for d_ in (27.0, 99.0):
    put(f"design.prestress_losses.rows[{i_}]", tag="Model", cells={"item": "time", "value": d_, "unit": "days"},
        note="report times = girder age 28 / 100 days (0600 hog table) less a 1-day age at transfer (proposed)")
    i_ += 1
put("design.girder_options.rows[0]", sheet="0655", view="general notes", text="EXTERNAL SURFACE: 35mm", cells={"item": "fitment_cover_side", "value": "35"})
put("design.girder_options.rows[1]", sheet="0655", view="general notes", text="INTERNAL SURFACE: 30mm", cells={"item": "fitment_cover_top", "value": "30"})
for i, (it, v_) in enumerate((("useN", "true"), ("kuoLim", "true"), ("tend", '"sc"'), ("k1p", "0.4"), ("dsh", "true"), ("torsion_tie_legs", "1")), 2):
    put(f"design.girder_options.rows[{i}]", tag="Model", cells={"item": it, "value": v_}, note="design option, as BR13A / B12626 / SB02")
for i, (it, v, why) in enumerate((("tgt", "2.8", "transverse member spacing target (m)"), ("merge", "0.4", "node merge tolerance (m)"), ("midgap", "1", "mid-gap lines"),
                                  ("model", "2", "integrated model"), ("girder_J_factor", "1.0", "Super-T torsion factor (ADR-041)"),
                                  ("deck_top_reference", "1", "nodes at the deck top (ADR-043)"))):
    put(f"analysis.grillage.rows[{i}]", tag="Model", cells={"item": it, "value": v}, note=why + ", as BR13A")
for k, v, un, why in (("bearing_fixed_stiffness", 1e7, "kN/m", "rigid idealisation"), ("pile_toe", "vertical only", None, "as BR13A"),
                      ("column_segment", 1.0, "m", "piles split to about 1 m"), ("soil_factor", 1, None, "sensitivity factor"), ("modes", 30, None, "response spectrum modes")):
    put("analysis." + k, v, tag="Model", unit=un, note=why)

json.dump({"origin": "owner drawing set SGWS1-JHSW-1000-BR-DRG-COMBINED.pdf (143 sheets) + report RPT-000001 rev E, 2026-11-06",
           "documents": sorted(docs.values(), key=lambda d: d["id"]), "values": out},
          open(os.path.join(H, "B12452_description_values.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), "values,", len(docs), "documents;", "support ch", {s: round(c["ch"], 4) for s, c in SUP.items()})
