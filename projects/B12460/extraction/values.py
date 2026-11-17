#!/usr/bin/env python3
"""B12460 (SB41 EB, Sydney Gateway SB-1510): extracted values -> one new-description input PER SPAN (ADR-062).

    python3 projects/B12460/extraction/values.py      # -> B12460-S1 .. S4 _description_values.json

SB41 EB has four spans of simply supported Super-T girders (4 per span) on laminated elastomeric bearings at abutment A,
piers 1-3 and abutment B (report: deck continuity only on SB41 WB). Each span is its own description (supports A-P1,
P1-P2, P2-P3, P3-B): exact for the girders as simply supported; the deck joints over the piers are not modelled; the
piers are shared (pier totals are combined in compare_report.py). Survey: SURVEY.md.

Control line MC80 (0117 table): arc R 656.300 (HTP5 CH 425.000 -> HTP6 CH 502.691), tangent (-> HTP7 CH 610.906),
arc R 683.700; MGA zone 56. The table prints the tangent bearing as 64°04'34"; the coordinates in order of increasing
chainage give 244°04'34" (back bearing printed, flagged). Offsets: metres, right of MC80 looking along increasing
chainage (A -> B, towards the west-south-west) positive: right = north. The deck lies from -1.4 to +8.4 (0802 section 5).
Girder 41A-Sk-01 is the left (south) girder next to MC80, 04 the right (north) edge girder: bearing levels fall 3 % to the
north (0601 table 1: 41A-A-01 8.720 .. 41A-A-04 8.505) as the deck does (0803 RL 'B' left 1.0 m is 30 mm above RL 'A').

Bearing centres (all Direct or Calculated from Direct dimensions):
- abutment A: 0301 table 2 B1 .. B4 (EB part of the shared abutment; B5-B13 SB41 WB, B14-B18 SB42); 01 = B4 .. 04 = B1;
- piers 1-3: pier CL datum on MC80 (CH, E, N printed on 0401 / 0403 / 0404) along the pier at 130°03'14", bearing rows 395
  either side of the pier CL, bearings at the dimensions along the pier from the datum (0401 / 0403 / 0404 plans);
- abutment B: 0303 table 3 B34 .. B37 (01 .. 04).
Check printed by this script: chord between bearing centres + (X1 - chord) = X1 for every girder (0710 - 0716 tables), and
the chord directions against the bearing angles 'a' of 0301 / 0303."""
import json, math, os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")))
from pdf2bim.model.loads import _area_centroid
from pdf2bim.geometry.alignment import Alignment

H = os.path.dirname(os.path.abspath(__file__))
P = "SGWS1-JHSW-2000-BR-DRG-41"


def dms(d, m, s):
    return d + m / 60 + s / 3600


def U(b):
    return math.sin(math.radians(b)), math.cos(math.radians(b))


# ---------------- control line MC80 (0117 table) ----------------
HTP5, HC3, HTP6, HTP7, HC4, HTP8 = (425.000, 330962.591, 6244980.901), (330607.970, 6245533.144), (502.691, 330894.889, 6244942.884), \
    (610.906, 330797.563, 6244895.575), (331096.461, 6244280.672), (1077.682, 330476.612, 6244569.174)


def turn(P0, P1, C):
    d = (P1[0] - P0[0], P1[1] - P0[1]); c = (C[0] - P0[0], C[1] - P0[1])
    return "left" if d[0] * c[1] - d[1] * c[0] > 0 else "right"


HROWS = [{"element": "arc", "ch_start": HTP5[0], "length": round(HTP6[0] - HTP5[0], 3), "radius": 656.3, "direction": turn(HTP5[1:], HTP6[1:], HC3),
          "E_start": HTP5[1], "N_start": HTP5[2]},
         {"element": "tangent", "ch_start": HTP6[0], "length": round(HTP7[0] - HTP6[0], 3), "E_start": HTP6[1], "N_start": HTP6[2]},
         {"element": "arc", "ch_start": HTP7[0], "length": round(HTP8[0] - HTP7[0], 3), "radius": 683.7, "direction": turn(HTP6[1:], HTP7[1:], HC4),
          "E_start": HTP7[1], "N_start": HTP7[2]}]
# vertical: 0110 elevation design surface levels on MC80: 10.636 at the end of deck A (CH 456.647) .. 10.088 at the end of deck B
# (CH 534.534), one grade between them; the 0803 RL 'A' (deck concrete top) + 75 checks it within 1 mm from CH 458 to 543
CHA, CHB, RLA, RLB = 456.647, 534.534, 10.636, 10.088
GR = (RLB - RLA) / (CHB - CHA) * 100
V0, V1 = HTP5[0], HTP7[0]
VROWS = [{"ch": V0, "RL": round(RLA + GR / 100 * (V0 - CHA), 4), "grade_out": round(GR, 5)},
         {"ch": V1, "RL": round(RLA + GR / 100 * (V1 - CHA), 4), "grade_in": round(GR, 5)}]
AL = Alignment(HROWS, VROWS)
RLA_TAB = {458.0: 10.552, 483.0: 10.376, 503.0: 10.235, 520.5: 10.112, 543.0: 9.953}   # 0803 tables 5 / 6 RL 'A'
VCHECK = max(abs(AL.vertical.rl(c) - 0.075 - r) for c, r in RLA_TAB.items())


def station(E, N, guess):
    ch, off = AL.station(E, N, guess=guess)[:2]
    return ch, off


def cross(P0, u, guess):
    """Chainage where MC80 crosses the line P0 + t u (secant)."""
    f = lambda ch: (lambda Q: (Q[0] - P0[0]) * u[1] - (Q[1] - P0[1]) * u[0])(AL.point(ch))
    a, b = guess - 1, guess + 1
    for _ in range(60):
        fa, fb = f(a), f(b)
        if fb == fa:
            break
        a, b = b, b - fb * (b - a) / (fb - fa)
        if abs(f(b)) < 1e-10:
            break
    return b


def line_hit(P, d, Q, e):
    den = d[0] * e[1] - d[1] * e[0]
    s = ((Q[0] - P[0]) * e[1] - (Q[1] - P[1]) * e[0]) / den
    return P[0] + s * d[0], P[1] + s * d[1]


# ---------------- bearing centres ----------------
BA = {1: (dms(240, 46, 32.8), 330935.178, 6244964.091, "B4"), 2: (dms(240, 46, 32.8), 330934.119, 6244966.303, "B3"),
      3: (dms(240, 46, 32.8), 330933.090, 6244968.540, "B2"), 4: (dms(240, 46, 32.8), 330932.093, 6244970.804, "B1")}
BB = {1: (dms(244, 4, 23.8), 330867.241, 6244929.189, "B34"), 2: (dms(244, 4, 17.9), 330863.725, 6244930.200, "B35"),
      3: (dms(244, 4, 11.2), 330860.101, 6244931.167, "B36"), 4: (dms(244, 4, 7.9), 330856.359, 6244932.086, "B37")}
PB = dms(130, 3, 14)
UP, NA = U(PB - 180), U(PB - 90)          # along the pier towards girder 04 (north-west) / normal towards abutment A
PIER = {   # datum (CH on MC80, E, N), sheet; bearings along the pier from the datum: row towards A (span k), row towards B (span k+1)
    "P1": ((472.625, 330921.619, 6244956.643), "0401", (-278, 2339, 4964, 7597), (-29, 2619, 5275, 7931),
           "B1 278 before the datum, then 2617 / 2625 / 2633; B5 29 before the datum, then 2648 / 2656 / 2656", (-1848, 8852),
           "10700 headstock / wall: B4 + 1255 to the end, 10700 overall"),
    "P2": ((496.646, 330900.313, 6244945.552), "0403", (-356, 2293, 4949, 7605), (-76, 2602, 5289, 7976),
           "B10 356 before the datum, datum to B11 2293, then 2656 / 2656; B14 76 before the datum, then 2678 / 2687 / 2687", (-2200, 8256),
           "EB part 10456: B13 + 651 to the end"),
    "P3": ((522.396, 330877.167, 6244934.270), "0404", (-428, 2250, 4937, 7624), (-76, 2604, 5291, 7987),
           "B1 428 before the datum, datum to B2 2250, then 2687 / 2687; B5 76 before the datum, then 2604 / 2687 / 2696", (-3838, 9382),
           "pile cap 13220 (the sill element): column CL 582 after the datum, 4420 before it and 6500 + 2300 after (0404 elevation / view 7: 3838 before the datum)")}


def pier_pt(pid, k, towards):
    """Bearing k on pier pid: towards = 'A' (row of the span ending here) or 'B' (row of the span starting here)."""
    (ch, E, N), _, ra, rb, _, _, _ = PIER[pid]
    s = (ra if towards == "A" else rb)[k - 1] / 1000
    n = 0.395 if towards == "A" else -0.395
    return E + s * UP[0] + n * NA[0], N + s * UP[1] + n * NA[1]


SPANS = {1: ("A", "P1"), 2: ("P1", "P2"), 3: ("P2", "P3"), 4: ("P3", "B")}


def bearing_pt(sid, k, span):
    if sid == "A":
        return (BA[k][1], BA[k][2]), f"0301 table 2 {BA[k][3]} ({BA[k][1]}, {BA[k][2]})"
    if sid == "B":
        return (BB[k][1], BB[k][2]), f"0303 table 3 {BB[k][3]} ({BB[k][1]}, {BB[k][2]})"
    towards = "A" if SPANS[span][1] == sid else "B"
    _, sh, ra, rb, txt, _, _ = PIER[sid]
    v = (ra if towards == "A" else rb)[k - 1]
    return pier_pt(sid, k, towards), f"{sid} ({sh} plan) row towards {'A' if towards == 'A' else 'B'}: {v:+d} along the pier from the datum, 395 off its CL"


# girders (0710 - 0716): type, X1 overall length at the soffit
GIR = {1: {1: ("F14", 15803, "0711"), 2: ("F13a", 16884, "0710"), 3: ("F13b", 18007, "0710"), 4: ("F15", 19174, "0711")},
       2: {1: ("F17a", 23991, "0713"), 2: ("F16a", 23991, "0712"), 3: ("F16b", 23991, "0712"), 4: ("F18a", 23991, "0714")},
       3: {1: ("F17b", 25710, "0713"), 2: ("F16c", 25710, "0712"), 3: ("F16d", 25710, "0712"), 4: ("F18b", 25710, "0714")},
       4: {1: ("F20", 11869, "0716"), 2: ("F19a", 13498, "0715"), 3: ("F19b", 15237, "0715"), 4: ("F21", 17094, "0716")}}
CHECK = []
for span, (s1, s2) in SPANS.items():
    for k in range(1, 5):
        a, b = bearing_pt(s1, k, span)[0], bearing_pt(s2, k, span)[0]
        L = math.hypot(b[0] - a[0], b[1] - a[1]) * 1000
        d = math.degrees(math.atan2(b[0] - a[0], b[1] - a[1])) % 360
        CHECK.append((span, k, round(L), GIR[span][k][1] - round(L), round(d, 4)))
print("girder check (span, girder, chord mm, X1 - chord mm, chord bearing °):", CHECK)
print(f"vertical check: design surface - 75 vs 0803 RL 'A' at {len(RLA_TAB)} stations: max {VCHECK * 1000:.1f} mm")


def end_dist(span, k, chord_mm):
    """(e1, e2, text): girder end to bearing centre at the first / second support."""
    X1 = GIR[span][k][1]
    rem = X1 - chord_mm
    if span == 4:
        return 400, rem - 400, f"400 at the P3 end (0716 plan F20, '℄ BEARING 400'); {rem - 400:.0f} at abutment B = X1 {X1} - chord {chord_mm:.0f} - 400"
    if span == 1:
        return rem - 400, 400, f"{rem - 400:.0f} at abutment A = X1 {X1} - chord {chord_mm:.0f} - 400; 400 at the P1 end (as the other pier ends, 0711)"
    return rem / 2, rem / 2, f"(X1 {X1} - chord {chord_mm:.0f}) / 2 = {rem / 2:.0f} at each pier end (0712 - 0714: ends skewed 22°30' / 24°, the printed 400 is not along the girder CL)"


# ---------------- deck (0802 section 5, 0803 tables) ----------------
CL_, CR_, EDGE = -1.000, 8.000, 0.400
# ---------------- barrier (1006 section 1, precast PB units, the same family on SB41 EB: 1000 layout plan PB-13 .. PB-23) ----------------
PRE = [(-436, 0), (-53, 0), (0, -495), (-225, -655), (-225, -810), (-396, -810), (-517, -1705), (-606, -1705)]
STI = [(0, -495), (125, -655), (125, -810), (-225, -810), (-225, -655)]
(aP, cP), (aS, cS) = _area_centroid(PRE), _area_centroid(STI)
BW = round((aP + aS) / 1e6 * 25.0, 2)
BXC = -(aP * cP[0] + aS * cS[0]) / (aP + aS) / 1000
BW_TXT = (f"1006 section 1 (precast PB, edge-mounted) polygon as read for SB42 (B12461 values.py); SB41 EB uses the same PB family (1000 layout plan: "
          f"PB-13, PB-14, PB-21 .. PB-23 along SB41 EB) - the section of these units was not re-read (query); precast {aP / 1e6:.4f} m2 + stitch "
          f"{aS / 1e6:.4f} m2, x 25 kN/m3 (report table 2-4) = {BW:.2f} kN/m; centroid {BXC * 1000:.0f} mm outward of the inside face; rails and screens not included")

# ---------------- bearings, pads, hogs ----------------
BRG_RL = {("A", "B"): {1: 8.720, 2: 8.652, 3: 8.579, 4: 8.505}, ("P1", "A"): {1: 8.611, 2: 8.535, 3: 8.455, 4: 8.372},
          ("P1", "B"): {1: 8.608, 2: 8.531, 3: 8.450, 4: 8.369}, ("P2", "A"): {1: 8.441, 2: 8.365, 3: 8.285, 4: 8.204},
          ("P2", "B"): {1: 8.443, 2: 8.366, 3: 8.285, 4: 8.203}, ("P3", "A"): {1: 8.264, 2: 8.188, 3: 8.107, 4: 8.026},
          ("P3", "B"): {1: 8.265, 2: 8.187, 3: 8.100, 4: 8.008}, ("B", "A"): {1: 8.159, 2: 8.004, 3: 7.818, 4: 7.649}}
BRG_ID = {("A", "B"): "41A-A-0{k}", ("P1", "A"): "41A-P1-0{k}", ("P1", "B"): "41A-P1-0{k4}", ("P2", "A"): "41A-P2-0{k}", ("P2", "B"): "41A-P2-0{k4}",
          ("P3", "A"): "41A-P3-0{k}", ("P3", "B"): "41A-P3-0{k4}", ("B", "A"): "41A-B-0{k}"}
HOG = {1: [(10, 15, 16, 17, -1, 39.8), (12, 17, 18, 19, -2, 41.4), (13, 19, 21, 22, -2, 43.5), (15, 21, 23, 24, -3, 45.9)],
       2: [(27, 37, 40, 42, -8, 56.6), (27, 37, 40, 42, -8, 55.9), (27, 37, 40, 42, -8, 55.9), (27, 37, 40, 42, -8, 56.0)],
       3: [(30, 41, 45, 46, -11, 59.8), (30, 41, 45, 46, -11, 59.6), (30, 41, 45, 46, -11, 59.6), (30, 41, 45, 46, -11, 59.9)],
       4: [(5, 7, 8, 8, 0, 33.3), (7, 10, 11, 12, -1, 36.4), (9, 13, 15, 15, -1, 39.9), (12, 17, 18, 19, -2, 44.2)]}
# 0602 table 2 (SB41 EB): pad corners a1..a4 / b1..b4 in the row of the measured hog equal to the 30-day hog of 0701 ('a' taken at the start
# support of the span, as read for SB42)
PAD = {1: {1: ((83, 97, 96, 81), (88, 102, 97, 83), 15), 2: ((82, 99, 97, 80), (87, 104, 99, 82), 17), 3: ((80, 97, 95, 78), (85, 102, 97, 80), 19),
           4: ((78, 93, 91, 77), (84, 98, 93, 79), 21)},
       2: {1: ((67, 81, 80, 66), (72, 87, 81, 67), 37), 2: ((67, 84, 83, 66), (72, 89, 84, 67), 37), 3: ((67, 84, 83, 66), (72, 89, 84, 67), 37),
           4: ((67, 84, 83, 66), (72, 89, 84, 67), 37)},
       3: {1: ((66, 80, 79, 65), (71, 85, 80, 66), 41), 2: ((66, 83, 82, 65), (71, 88, 83, 66), 41), 3: ((66, 83, 82, 65), (71, 88, 83, 66), 41),
           4: ((66, 83, 82, 65), (71, 88, 83, 66), 41)},
       4: {1: ((91, 109, 106, 88), (97, 115, 109, 91), 7), 2: ((89, 109, 104, 84), (97, 117, 109, 89), 10), 3: ((89, 109, 101, 81), (96, 116, 106, 86), 13),
           4: ((87, 105, 96, 79), (94, 111, 99, 82), 17)}}
HAUNCH_TXT = ("haunch = deck concrete top - 200 slab - girder top. Deck concrete top = MC80 design level (0110 grade) - 75 + offset x 3 % falling to the "
              "north (checks 0803 RL 'A'). Girder top = bearing RL 'X' (0601 table 1) + epoxy pad (mean of the 4 corners, 0602 table 2, row of the "
              "30-day hog of 0701) at each end, straight between the ends, + (30-day hog + deck-slab deflection, 0701) x 4t(1-t), + 1515")


def deck_top(ch, off):
    return AL.vertical.rl(ch) - 0.075 - 0.03 * off           # design level on MC80, 3 % falling to the right (north)


def haunch(span, k):
    s1, s2 = SPANS[span]
    Pa, Pb = bearing_pt(s1, k, span)[0], bearing_pt(s2, k, span)[0]
    ra = BRG_RL.get((s1, "B"), {}).get(k)
    rb = BRG_RL.get((s2, "A"), {}).get(k)
    a, b, hog = PAD[span][k]
    c = (hog + HOG[span][k - 1][4]) / 1000
    out = []
    for t in (0.0, 0.25, 0.5, 0.75, 1.0):
        P = (Pa[0] + t * (Pb[0] - Pa[0]), Pa[1] + t * (Pb[1] - Pa[1]))
        ch, off = station(P[0], P[1], 500)
        sa, sb = ra + sum(a) / 4000, (rb + sum(b) / 4000) if rb is not None else None
        top = sa + t * ((sb if sb is not None else sa) - sa) + c * 4 * t * (1 - t) + 1.515
        out.append((deck_top(ch, off) - 0.2 - top) * 1000)
    return out


# strands (0724): S1 / S4 and S2 / S3 schedules
STRANDS = {1: {"A": 2, "D": 8, "E": 12, "F": 8}, 2: {"A": 2, "C": 4, "D": 12, "E": 12, "F": 8}}
DEB = {1: {"D": {1: 0, 2: 4000, 3: 0, 4: 4000}, "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}, "F": {2: 0, 4: 0, 5: 0, 6: 0}},
       2: {"C": {1: 2000, 2: 0}, "D": {1: 0, 2: 4000, 3: 0, 4: 4000, 5: 0, 6: 0}, "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0},
           "F": {2: 7500, 4: 7500, 5: 0, 6: 0}}}
SCHED = {1: 1, 2: 2, 3: 2, 4: 1}
FIT = {2: ("F18a", 23.991, 40, 26, "0761 girder type F18a: 40 bundles G1 1-N16-BZ-150 from each end, 26 bundles G1 1-N16-BZ-300 between"),
       3: ("F18b", 25.710, 45, 28, "0761 girder type F18b: 45 bundles G1 1-N16-BZ-150 from each end, 28 bundles G1 1-N16-BZ-300 between")}
FIT150 = {1: ("F15", "0759 (F14 / F15)"), 4: ("F21", "0763 (F20 / F21)")}

PILES = {"A": [("A-11", 330936.070, 6244964.259), ("A-12", 330934.354, 6244967.872), ("A-13", 330932.732, 6244971.528)],
         "P1": [("P1-01", 330921.234, 6244956.966), ("P1-02", 330918.173, 6244959.540), ("P1-03", 330915.187, 6244962.050)],
         "P2": [("P2-05", 330899.177, 6244946.507), ("P2-06", 330896.880, 6244948.438)],
         "P3": [("P3-01", 330879.513, 6244932.297), ("P3-02", 330873.568, 6244937.295), ("P3-03", 330870.598, 6244939.792)],
         "B": [("B-09", 330863.044, 6244929.873), ("B-10", 330858.206, 6244931.133)]}
PDATA = {"A": dict(toe=-18.1, top=2.1, uls=4931, sls=3702, m=1566, D=900.0, Lf=500), "P1": dict(toe=-17.0, top=1.654, uls=5322, sls=3641, m=4122, D=1200.0, Lf=500),
         "P2": dict(toe=-14.6, top=1.452, uls=9078, sls=6223, m=2932, D=1200.0, Lf=2600), "P3": dict(toe=-11.6, top=-0.083, uls=5188, sls=3668, m=2762, D=1200.0, Lf=1000),
         "B": dict(toe=-11.6, top=1.022, uls=7840, sls=5189, m=3652, D=1200.0, Lf=1000)}


def put_factory(out, docs):
    def doc(n):
        if n == "RPT":
            docs["RPT-410001"] = {"id": "RPT-410001", "number": "SGWS1-JHSW-2000-BR-RPT-410001", "revision": "D", "kind": "report", "title": "Bridge design report"}
            return "RPT-410001"
        did = "DRG-" + n
        docs[did] = {"id": did, "number": P + n.zfill(4), "revision": "00", "kind": "drawing"}
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
    return put


def build(span):
    out, docs = [], {}
    put = put_factory(out, docs)
    s1, s2 = SPANS[span]
    pid = f"B12460-S{span}"

    put("project.client", "Transport for NSW", sheet="0101", view="title block", text="CLIENT: Transport for NSW")

    # alignment
    names = ("HTP5 -> HTP6", "HTP6 -> HTP7", "HTP7 -> HTP8")
    for i, r in enumerate(HROWS):
        put(f"alignment.horizontal.rows[{i}]", sheet="0117", view="MC80 horizontal alignment table", cells=r,
            text=f"{names[i]}" + (f"; radius {r['radius']:.3f} (centre {'HCEN-3' if i == 0 else 'HCEN-4'}), turning {r['direction']} (from the centre position)" if r["element"] == "arc"
                                   else "; bearing printed 64°04'34\" (the coordinates give 244°04'34\" in the direction of increasing chainage: back bearing, flagged)"))
    for i, r in enumerate(VROWS):
        put(f"alignment.vertical.rows[{i}]", tag="Calculated", cells=r,
            formula=f"one grade through the 0110 elevation design surface levels on MC80: {RLA} at the end of deck A (CH {CHA}) and {RLB} at the end of deck B "
                    f"(CH {CHB}) = {GR:.4f} %; also 10.524 / 10.355 / 10.173 at piers 1-3 (within 2 mm); 0803 RL 'A' (deck concrete top) + 75 agrees within "
                    f"{VCHECK * 1000:.1f} mm from CH 458 to 543; row at CH {r['ch']} by the grade (outside the bridge only to cover the skewed span-4 ends)")
    put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": 3.0, "right": 3.0, "crown_offset": round(CL_ - EDGE, 3)},
        formula="one-way fall to the right (north): 0803 table 5 CH 473.000 RL 'B' (left barrier, -1.000) 10.476, RL 'A' (MC80) 10.446, RL 'C' (right barrier, "
                "+8.000) 10.206: 0.030 / 1.000 = 3.0 %, 0.240 / 8.000 = 3.0 %; crown at the left deck edge")

    # supports
    sup = {}
    for sid in (s1, s2):
        if sid in ("A", "B"):
            q1 = bearing_pt(sid, 1, span)[0]; q4 = bearing_pt(sid, 4, span)[0]
            u = (q4[0] - q1[0], q4[1] - q1[1]); n = math.hypot(*u); u = (u[0] / n, u[1] / n)
            brg = math.degrees(math.atan2(*u)) % 180
            P0 = q1
            dev = max(abs(((bearing_pt(sid, k, span)[0][0] - P0[0]) * u[1] - (bearing_pt(sid, k, span)[0][1] - P0[1]) * u[0])) for k in range(1, 5))
            lab = {"A": "0301 table 2 B4 / B1", "B": "0303 table 3 B34 / B37"}[sid]
            txt = f"line through the end bearings ({lab}), bearing {brg:.4f}°; the middle bearings within {dev * 1000:.0f} mm of it"
        else:
            towards = "A" if s2 == sid else "B"
            u, brg = UP, PB % 180
            P0 = pier_pt(sid, 1, towards)
            txt = (f"bearing row of pier {sid[1]} towards {'abutment A' if towards == 'A' else 'abutment B'}: parallel to the pier CL (130°03'14\", {PIER[sid][1]}), "
                   f"395 from it; datum CH {PIER[sid][0][0]} ({PIER[sid][0][1]}, {PIER[sid][0][2]})")
        guess = {"A": 457.0, "P1": 472.6, "P2": 496.6, "P3": 522.4, "B": 538.0}[sid]
        ch = cross(P0, u, guess)
        sup[sid] = {"P0": P0, "u": U(brg), "brg": brg, "ch": ch}
        put(f"alignment.support_lines.rows[{0 if sid == s1 else 1}]", tag="Calculated", cells={"support": sid, "ch": round(ch, 4), "bearing": round(brg, 5)},
            formula=txt + f"; ch = where it crosses MC80 = {ch:.4f}")

    # deck
    put("deck.carriageway_left", CL_, unit="m", sheet="0802", view="section 5 SB41 eastbound", text="400 | 1000 | MC80 | 8000 | 400 (radial)")
    put("deck.carriageway_right", CR_, unit="m", sheet="0802", view="section 5 SB41 eastbound", text="8000 from MC80 to the right barrier face")
    put("deck.edge_left", CL_ - EDGE, unit="m", tag="Calculated", formula="barrier face - 400 (0802 section 5)", inputs=["deck.carriageway_left"])
    put("deck.edge_right", CR_ + EDGE, unit="m", tag="Calculated", formula="barrier face + 400 (0802 section 5)", inputs=["deck.carriageway_right"])
    put("deck.slab_thickness", 200.0, unit="mm", sheet="0113", view="section SB41 eastbound", text="200 MIN THICK DECK")
    put("deck.surfacing_thickness", 75.0, unit="mm", sheet="0113", view="section SB41 eastbound", text="75 THICK BITUMINOUS WEARING SURFACE")
    put("deck.surfacing_density", 22.0, unit="kN/m3", sheet="RPT", view="table 2-4", text="asphalt surfacing 22 kN/m3")
    put("deck.girders_follow_crossfall", True, sheet="0802", view="section 5", text="girders shown square to the 3 % fall")
    HN = {k: haunch(span, k) for k in range(1, 5)}
    offA = {k: station(*bearing_pt(s1, k, span)[0], 500)[1] for k in range(1, 5)}
    for k in range(1, 5):
        h = HN[k]
        hm = (h[0] + 4 * h[1] + 2 * h[2] + 4 * h[3] + h[4]) / 12 if len(h) == 5 else h[0]
        sp = [abs(offA[k] - offA[j]) for j in (k - 1, k + 1) if 1 <= j <= 4]
        bt = sum(sp) / len(sp)
        w = round(hm / 1000 * bt * 25.0, 3)
        put(f"deck.haunch_concrete.rows[{k - 1}]", tag="Calculated", cells={"girder": f"41A-S{span}-0{k}", "w": w},
            formula=HAUNCH_TXT + (f"; haunch at t = 0 / .25 / .5 / .75 / 1: {' / '.join(f'{x:.0f}' for x in h)} mm, mean {hm:.0f} mm" if len(h) == 5 else
                                  f"; abutment B bearing levels are not in 0601 table 1 (query): haunch at the P3 end only, {h[0]:.0f} mm, used along the girder")
                    + f", over the girder spacing {bt:.3f} m x 25 kN/m3 = {w} kN/m")
    HAUNCH_MID = {k: (HN[k][2] if len(HN[k]) == 5 else HN[k][0]) for k in range(1, 5)}
    for b, face in (("left", CL_), ("right", CR_)):
        p = f"deck.barriers[barrier_{b}]"
        put(p + ".side", b, sheet="0802", view="section 5")
        put(p + ".type", "precast edge barrier (PB units), medium performance, with twin steel rail", sheet="1000", view="layout plan",
            text="PB-13 .. PB-23 along SB41 EAST BOUND")
        put(p + ".height", 1255.0, unit="mm", sheet="1006", view="section 1", text="805 + 495 - 45 above the deck surface (rails above not included)",
            note="as read for SB42; height above the surfacing; used for wind area only")
        put(p + ".weight", BW, unit="kN/m", tag="Calculated", formula=BW_TXT, inputs=[])
        put(p + ".solid", True, sheet="1006", view="section 1", text="solid precast unit")
        put(p + ".offset", round(face - BXC if b == "left" else face + BXC, 4), unit="m", tag="Calculated", inputs=[f"deck.carriageway_{b}"],
            formula=f"inside face {face:+.3f} {'-' if b == 'left' else '+'} centroid {BXC * 1000:.0f} mm outward")

    # superstructure
    put("superstructure.type", "super-t", sheet="0700", view="girder layout plan", text="1515 DEEP SUPER-T (0113)")
    put("superstructure.spans", 1, tag="Model", note=f"span {span} of 4 modelled on its own (ADR-062): girders simply supported, deck joints over the piers not modelled")
    offs = {}
    for k in range(1, 5):
        g = f"41A-S{span}-0{k}"; p = f"superstructure.members[{g}]"
        t, X1, sh = GIR[span][k]
        (Pa, sa_), (Pb, sb_) = bearing_pt(s1, k, span), bearing_pt(s2, k, span)
        d = (Pb[0] - Pa[0], Pb[1] - Pa[1]); L = math.hypot(*d); d = (d[0] / L, d[1] / L)
        for sid, src in ((s1, sa_), (s2, sb_)):
            S = sup[sid]
            hit = line_hit(Pa, d, S["P0"], S["u"])
            ch, off = station(hit[0], hit[1], S["ch"])
            offs[(k, sid)] = off
            shift = math.hypot(hit[0] - (Pa if sid == s1 else Pb)[0], hit[1] - (Pa if sid == s1 else Pb)[1]) * 1000
            put(p + ".line_offset_" + ("A" if sid == s1 else "B"), round(off, 4), unit="m", tag="Calculated",
                formula=f"bearing {src}; girder chord {s1}-{s2} crossed with the {sid} support line ({shift:.0f} mm from the bearing centre), stationed on MC80: "
                        f"ch {ch:.3f}, offset right +")
        e1, e2, etxt = end_dist(span, k, L * 1000)
        put(p + ".length", X1 / 1000, unit="m", sheet=sh, view=f"plan girder type {t}", text=f"OVERALL LENGTH ALONG ℄ GIRDER {X1} (MEASURED AT THE SOFFIT)",
            note=f"chord between the bearing centres {L:.3f} m")
        put(p + ".bearing_offset_A", round(e1), unit="mm", tag="Calculated", formula=etxt, inputs=[p + ".length"])
        put(p + ".bearing_offset_B", round(e2), unit="mm", tag="Calculated", formula=etxt, inputs=[p + ".length"])
        put(p + ".straight", True, tag="Model", note="precast girders straight between bearings")
        put(p + ".type_ref", "ST1", tag="Model", note=f"one Super-T type per span (strand schedule 0724 is per span); girder {t}: edge-flange details not distinguished")
    for k in range(1, 5):
        lo = (abs(offs[(k, s1)] - offs[(k - 1, s1)]) if k > 1 else None)
        hi = (abs(offs[(k + 1, s1)] - offs[(k, s1)]) if k < 4 else None)
        if lo and hi:
            put(f"superstructure.members[41A-S{span}-0{k}].flange_edges.rows[0]", tag="Calculated", cells={"t": 0.0, "left": round((lo * 1000 - 20) / 2, 1), "right": round((hi * 1000 - 20) / 2, 1)},
                formula="(girder spacing at the first support - 20 NOM gap (0807 typical detail)) / 2 each side")
    put("superstructure.flange_gap", 20.0, unit="mm", sheet="0807", view="typical detail of gap between girders", text="20 NOM. GAP GIRDER FLANGE (TYP)")
    put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="edge girder outer flange tip to deck edge not dimensioned on the sheets read")
    for i, sid in enumerate((s1, s2)):
        put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": sid, "width": 800.0, "depth": 1265.0, "concrete": "deck (40 MPa)"},
            formula="cast-in-place cross girder over the girder ends: depth 1065 (girder elevation, cast-in-place contact face, as SB42) + 200 slab; width 800 "
                    "not dimensioned for SB41 EB (query, as SB42)", inputs=["deck.slab_thickness"], note="cross girder width not dimensioned on the sheets read (query)")
    T = "superstructure.supert_types[ST1]"
    put(T + ".section", "lib:supert/T4", tag="Standard-verify", note="1515 deep Super-T (TfNSW T4 family)")
    put(T + ".depth", 1515, unit="mm", sheet="0722", view="typical Super-T girder section", text="1515")
    for i, (kk, nm, v, un) in enumerate((("D", "Overall depth", 1515, "mm"), ("bw", "Soffit width", 757, "mm"), ("tw", "Web thickness", 100, "mm"),
                                         ("d1", "Void floor fall", 58, "mm"), ("d2", "Bottom flange depth at CL", 265, "mm"), ("ttf", "Top flange thickness", 90, "mm"))):
        put(T + f".shape.rows[{i}]", sheet="0722", view="typical Super-T girder section", text=f"{v}", cells={"key": kk, "name": nm, "value": v, "unit": un})
    put(T + ".shape.rows[6]", tag="Standard-verify", cells={"key": "S", "name": "Web slope (V : H)", "value": 10.556, "unit": ""}, note="10.556 : 1 printed (0722)")
    put(T + ".concrete_28d", 50, unit="MPa", sheet="0700", view="general notes", text="MINIMUM 28 DAY COMPRESSIVE STRENGTH OF CONCRETE SHALL BE 50 MPa FOR GIRDERS F13 TO F21")
    put(T + ".concrete_transfer", 35, unit="MPa", sheet="0700", view="general notes", text="35 MPa AT TRANSFER OF PRESTRESS FOR GIRDERS F13 TO F21")
    for i, e in enumerate("AB"):
        put(T + f".zones.rows[{i}]", tag="Calculated", cells={"from": 0.0, "to": 1.5, "kind": "solid_end_" + e},
            formula="end of the void: 2000 to the first void diaphragm less 500 (0711 - 0716 plans); the solid end block is not dimensioned (query, as SB42)")
    kmin = min(HAUNCH_MID, key=HAUNCH_MID.get)
    put(T + ".haunch", round(HAUNCH_MID[kmin]), unit="mm", tag="Calculated",
        formula=HAUNCH_TXT + f"; one section type per span: the smallest mid-span haunch (girder 0{kmin}; all girders "
                f"{', '.join(f'0{k} {v:.0f}' for k, v in HAUNCH_MID.items())} mm), conservative for strength")
    X = {kk: 25 + 50 * (6 - kk) for kk in range(1, 7)}
    Y = {"F": 60, "E": 110, "D": 160, "C": 210, "B": 260}
    sch = SCHED[span]
    st = [(1435.0, s * 495.0, 0.0, "A") for s in (-1, 1)]
    for r, locs in DEB[sch].items():
        for loc, deb in locs.items():
            st += [(float(Y[r]), s * X[loc], float(deb), r) for s in (-1, 1)]
    assert len(st) == sum(STRANDS[sch].values()), (len(st), STRANDS[sch])
    lab = "41A-S1-01 TO 41A-S1-04 AND 41A-S4-01 TO 41A-S4-04" if sch == 1 else "41A-S2-01 TO 41A-S2-04 AND 41A-S3-01 TO 41A-S3-04"
    for i, (y, x, deb, r) in enumerate(sorted(st, key=lambda q: (q[0], q[1]))):
        put(T + f".strand_pattern.rows[{i}]", sheet="0724", view=f"strand debonding schedule for girders {lab}",
            text="rows F-B at 60 + 4 x 50; locations 1-6 at 25 + 5 x 50 each side; row A loc 7 at ±495, 80 below the top; debonded both ends",
            cells={"y": y, "x": float(x), "diameter": 15.7, "debond_left": deb, "debond_right": deb, "on": True}, note=f"row {r}")
    put(T + ".jacking_ratio", round(209 / 279, 4), tag="Calculated", unit="", formula="force after release of the jack 209 kN / MBL 279 kN (0700 prestressing notes)")
    if span in FIT:
        ft, Lf, ne, nc, ftxt = FIT[span]
        a = (Lf - 2 * ne * 0.15 - nc * 0.3) / 2
        for i, (a_, b_, sp_) in enumerate(((a, a + ne * 0.15, 150.0), (a + ne * 0.15, a + ne * 0.15 + nc * 0.3, 300.0), (a + ne * 0.15 + nc * 0.3, Lf - a, 150.0))):
            put(T + f".fitments.rows[{i}]", tag="Calculated", cells={"from": round(a_, 3), "to": round(b_, 3), "diameter": 16.0, "legs": 2, "spacing": sp_},
                formula=f"{ftxt}; X1 {Lf}: remainder {a:.3f} m at each end; the edge girder of the span (report's critical girder 41A-S3-04 is F18b)")
    else:
        ft, sh = FIT150[span]
        Lf = GIR[span][4][1] / 1000
        put(T + ".fitments.rows[0]", tag="Calculated", cells={"from": 0.0, "to": round(Lf, 3), "diameter": 16.0, "legs": 2, "spacing": 150.0},
            formula=f"{sh}: only G1 1-N16-BZ-150 bundles are called up for the short girders (no 300 zone); over the full length X1 {Lf:.3f} of {ft} "
                    "(bundle counts not read)")
    for i, face in enumerate(("top", "bot")):
        put(T + f".deck_bars.rows[{i}]", tag="Calculated", cells={"face": face, "diameter": 16.0, "spacing": 150.0, "cover": 61.0},
            formula="as SB42 (N16-S-150 NF / FF longitudinal, cover 45 + transverse N16); SB41 EB deck reinforcement sheets not read (query)",
            inputs=["deck.slab_thickness"])
    hg = HOG[span]
    put("custom.girder_hog_table", tag="Direct", sheet="0701", view="calculated hog of girders at bridge SB41 EB", unit="mm",
        value={f"41A-S{span}-0{k}": {"transfer": h[0], "30_days": h[1], "60_days": h[2], "100_days": h[3], "deck_slab_deflection": h[4], "mass_t": h[5]} for k, h in enumerate(hg, 1)})
    put("custom.girder_hog_basis", "density 2550 kg/m3; E at transfer 31,100 MPa (F13-F21); elevated temperature curing at 70 °C for 8 hours after casting; girder self weight only",
        sheet="0700", view="prestressing notes")
    put("custom.strand_MBL", 279, unit="kN", sheet="0700", view="prestressing notes"); put("custom.strand_force_after_release", 209, unit="kN", sheet="0700", view="prestressing notes")

    # bearings (0601 table 1, 0603)
    for sid in (s1, s2):
        side = "B" if sid == s1 else "A"           # the row of this span on the support
        for k in range(1, 5):
            bid = BRG_ID[(sid, side)].format(k=k, k4=k + 4); p = f"bearings.items[{bid}]"
            put(p + ".support", sid, tag="Model", note=f"bearing {bid} on support {sid}")
            put(p + ".member", f"41A-S{span}-0{k}", tag="Model", note=f"bearing {bid} under girder 41A-S{span}-0{k} (0600 bearing layout plan)")
            put(p + ".type", "elastomeric", sheet="0603", view="laminated elastomeric bearing type A", text="AS5100.4 PART No AS070910R; all SB41 EB bearings type A (0601 table 1)")
            put(p + ".plan_a", 380, unit="mm", sheet="0603", view="plan laminated elastomeric bearing", text="380")
            put(p + ".plan_b", 480, unit="mm", sheet="0603", view="plan laminated elastomeric bearing", text="480")
            put(p + ".bearing_height", 157, unit="mm", sheet="0603", view="elevation", text="157")
            rl = BRG_RL.get((sid, side), {}).get(k)
            if rl is None:
                put(p + ".top_rl", tag="Missing-Flagged", unit="m", note="not in 0601 table 1")
            else:
                put(p + ".top_rl", rl, unit="m", sheet="0601", view="table 1 bridge No B12460 (SB41 - eastbound) bearing levels", text=f"{bid} type A RL 'X' {rl}")
            for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
                put(p + "." + f, tag="Missing-Flagged", unit="MPa" if f == "shear_modulus" else "mm", note="catalogue part AS070910R; layers / G not printed")
            put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: mortar pad + epoxy block per measured hog (0602 table 2)")
            put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric — idealisation for the engineer")
            put(p + ".restraint_transverse", tag="Missing-Flagged", note="lateral restraint blocks on the headstocks (0401 / 0403 / 0404) — idealisation for the engineer")
    put("custom.bearing_part_no", "AS070910R", sheet="0603", view="plan laminated elastomeric bearing")

    # supports
    for sid in (s1, s2):
        p = f"supports[{sid}]"
        S = sup[sid]
        if sid.startswith("P"):
            (dch, dE, dN), sh, _, _, _, (e0, e1_), ltxt = PIER[sid]
            if sid in ("P1", "P2"):
                put(p + ".kind", "pier", tag="Model",
                    note=f"SB41 EB pier {sid[1]}: 1650 wide blade wall (precast shells, cast-in-place infill) on Ø1200 bored piles; modelled as a sill at the pile heads "
                         "(the wall's own weight and stiffness are not in the model)" + ("; shared with SB41 WB pier 1 (EB part only)" if sid == "P2" else ""))
                put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 1650.0, "depth": 1500.0, "length": round((e1_ - e0) / 1000, 3)},
                    formula=f"wall 1650 thick (0400 section 2); depth = the pile cap 1500 (0400 section 2): the sill element only; length {ltxt}")
            else:
                put(p + ".kind", "pier", tag="Model",
                    note="SB41 EB pier 3: headstock 1650 x 1200 on two Ø1200 columns on a 1800 deep pile cap (0404 elevation); modelled as a sill at the pile heads (the "
                         "columns and headstock above are not in the model)")
                put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 1650.0, "depth": 1800.0, "length": 13.22},
                    formula="pile cap 13220 long, 1800 deep (0404 elevation); width taken as the headstock 1650 (pile cap width not read, query)")
            put(p + ".headstock_setout.rows[0]", tag="Calculated", cells={"edge": "front", "value": 430.0}, formula="face 825 from the pier CL, bearing row 395 from it: 430 on the span side")
            put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -1220.0}, formula="825 + 395 behind the bearing row")
            hit = AL.point(S["ch"]); t0 = ((hit[0] - dE) * UP[0] + (hit[1] - dN) * UP[1])
            sg = 1 if UP[0] * S["u"][0] + UP[1] * S["u"][1] > 0 else -1      # the support line runs along U(bearing mod 180): towards girder 01 here
            ends = sorted(sg * (v - t0) for v in (e0 / 1000, e1_ / 1000))
            for j, (edge, v) in enumerate(zip(("start", "end"), ends)):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                    formula=f"pier ends {e0 / 1000:+.3f} / {e1_ / 1000:+.3f} m from the datum along the pier towards girder 04 ({sh}: {ltxt}), measured from where the "
                            f"support line crosses MC80 ({t0:+.3f} m from the datum), in the support-line direction (bearing {S['brg']:.4f}°)")
        elif sid == "A":
            put(p + ".kind", "spill-through abutment", tag="Model",
                note="abutment A (shared with SB41 WB and SB42): headstock on Ø900 column extensions over Ø900 bored piles inside a reinforced soil wall (0300 / 0301); "
                     "the SB41 EB part carried by piles A-11 .. A-13")
            put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 2175.0, "depth": 1200.0, "length": None},
                formula="0301 section 1: 725 in front of the bearing CL + 550 + 350 + 550 behind = 2175; depth 1200 below the seat (as read for SB42)")
            put(p + ".headstock_setout.rows[0]", sheet="0301", view="section 1", text="725 bearing CL to the front face", cells={"edge": "front", "value": 725.0})
            put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -1450.0}, formula="550 + 350 + 550 behind the bearing CL (0301 section 1)")
            hit = AL.point(S["ch"])
            ends = sorted(((E - hit[0]) * S["u"][0] + (N - hit[1]) * S["u"][1], lab_, E, N) for lab_, E, N in (("SOP 1", 330931.001, 6244971.510), ("SOP 2", 330935.362, 6244962.092)))
            for j, (edge, (v, lab_, E, N)) in enumerate(zip(("start", "end"), ends)):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                    formula=f"{lab_} ({E}, {N}) (0301 table 1, corner of the SB41 EB part) projected on the support line from its MC80 crossing")
        else:
            put(p + ".kind", "spill-through abutment", tag="Model", note="abutment B (shared): headstock 2100 x 1000 on Ø1200 columns over Ø1200 bored piles (0302 / 0303)")
            put(p + ".headstock.rows[0]", sheet="0303", view="sections 9 / 10", text="headstock 2100 wide, 1000 deep on Ø1200 columns", cells={"width": 2100.0, "depth": 1000.0, "length": None})
            put(p + ".headstock_setout.rows[0]", tag="Model", cells={"edge": "front", "value": 1050.0},
                note="headstock taken centred on the SB41 EB bearing line (the abutment B CL for the EB part was not read): query")
            put(p + ".headstock_setout.rows[1]", tag="Model", cells={"edge": "back", "value": -1050.0}, note="as the front row")
            hit = AL.point(S["ch"])
            ends = sorted(((E - hit[0]) * S["u"][0] + (N - hit[1]) * S["u"][1], lab_, E, N) for lab_, E, N in (("SOP 4", 330869.582, 6244929.052), ("SOP 5", 330852.703, 6244933.476)))
            for j, (edge, (v, lab_, E, N)) in enumerate(zip(("start", "end"), ends)):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                    formula=f"{lab_} ({E}, {N}) (0303 table 2, around the SB41 EB part) projected on the support line from its MC80 crossing")
        put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "see report §5 / geotechnical interpretive report"}, note="soil springs not in the copy supplied")
        put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="22 kN/m3 compacted soil (report table 2-4)")
        put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="not given")
        put(p + ".curtain_wall.rows[0]", tag="Missing-Flagged", cells={}, note="not modelled")
        dd = PDATA[sid]
        for pid_, E, N in PILES[sid]:
            q = p + f".piles[{pid_}]"
            put(q + ".E", E, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} EASTING {E}")
            put(q + ".N", N, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} NORTHING {N}")
            if sid == "A":
                put(q + ".diameter", dd["D"], unit="mm", sheet="0201", view="table 1 pile data", text="PILE DIAMETER 900 (abutment A)")
            else:
                put(q + ".diameter", dd["D"], unit="mm", sheet="0110", view="elevation SB41 EB", text="Ø1200 BORED PILES (table 1 diameter cell merged)")
            put(q + ".rl_top", dd["top"], unit="m", sheet="0201", view="table 1 pile data", text=f"TOP OF PILE RL 'B' {dd['top']}")
            put(q + ".rl_toe", dd["toe"], unit="m", sheet="0201", view="table 1 pile data", text=f"ANTICIPATED FOUNDING LEVEL RL 'A' {dd['toe']}")
            put(q + ".rl_rock", round(dd["toe"] + dd["Lf"] / 1000, 3), unit="m", tag="Calculated",
                formula=f"founding level RL 'A' {dd['toe']} + minimum embedment {dd['Lf']} mm (0201 table 1)")
            put(q + ".design_actions.rows[0]", sheet="0201", view="table 1 pile data", text="DESIGN MAXIMUM AXIAL COMPRESSION LOAD AT TOP OF PILE SLS",
                cells={"limit_state": "SLS", "N": float(dd["sls"])})
            put(q + ".design_actions.rows[1]", sheet="0201", view="table 1 pile data", text="ULS axial / DESIGN MAXIMUM BENDING MOMENT ULS",
                cells={"limit_state": "ULS", "N": float(dd["uls"]), "M": float(dd["m"])})

    # materials
    for i, (el, fc, sheet, txt, E_, dens) in enumerate((("Super-T girders", 50.0, "0700", "50 MPa (F13-F21)", 34800.0, 26.0), ("deck", 40.0, "0801", "40 MPa", 32800.0, 25.0),
                                                       ("piles", 40.0, "0250", "40 MPa", 32800.0, 25.0), ("abutments", 40.0, "0301", "40 MPa", 32800.0, 25.0))):
        put(f"materials.concrete.rows[{i}]", sheet=sheet, view="general notes",
            text=f"{txt} ({sheet}); E {E_:.0f} (report table 2-1); density {dens} kN/m3 (report table 2-4)", cells={"element": el, "fc": fc, "E": E_, "density": dens},
            note="girder density: report 26.0 kN/m3 vs 0700 hog basis 2550 kg/m3 (query)" if dens == 26.0 else None)
    put("materials.strand.rows[0]", sheet="RPT", view="table 2-3", text="15.7 mm 7 wire ordinary relax 2, A 150, MBL 279 kN, fp 1860, E 195 GPa",
        cells={"type": "15.7 mm 7-wire ordinary, relax 2", "diameter": 15.7, "fpb": 1860.0, "area": 150.0, "Ep": 195000.0})
    put("materials.reinforcement.rows[0]", sheet="RPT", view="table 2-2", text="D500N 500 MPa, E 200,000", cells={"grade": "D500N", "fsy": 500.0, "Es": 200000.0})
    put("custom.sdl_line_loads", tag="Missing-Flagged", note="safety / headlight screens (1150 / 1160) and utilities: not quantified")

    # loads
    put("loads.traffic_models.rows[0]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "M1600", "on": True})
    put("loads.traffic_models.rows[1]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "S1600", "on": True})
    put("loads.traffic_models.rows[2]", sheet="RPT", view="§2 road traffic loads", text="HLP400 ... within ±1.0m either side of the centreline of carriageway (SB41 EB and SB42)",
        cells={"model": "HLP400", "on": True})
    put("loads.traffic_models.rows[3]", sheet="RPT", view="§2 road traffic loads", text="the accompanying lane factor taken for both the HLP400 loading and one half of the SM1600 loading has been taken as 1.0",
        cells={"model": "HLP400_with_half_M1600", "on": True})
    put("loads.design_speed", 10, unit="km/h", sheet="0101", view="HLP400 loading", text="HLP400 at 10 km/h", note="road design speed not read; 10 km/h is the HLP400 crossing speed (query)")
    for kk, un in (("braking_force", "kN"), ("traffic_surcharge", "kPa"), ("shrinkage_creep_shortening", "1e-6")):
        put("loads." + kk, tag="Missing-Flagged", unit=un, note="AS 5100.2 method stated in the report; value not printed")
    put("loads.wind.rows[0]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (ULS) 48m/s", cells={"item": "V_uls", "value": 48.0, "unit": "m/s"})
    put("loads.wind.rows[1]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (SLS) 37m/s", cells={"item": "V_sls", "value": 37.0, "unit": "m/s"})
    put("loads.wind.rows[2]", sheet="RPT", view="§2 wind loads", text="design speed of 35m/s ... for ULS combination PE + Road traffic load", cells={"item": "V_with_traffic", "value": 35.0, "unit": "m/s"})
    for i, it in enumerate(("air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 3):
        put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 section 17 stated; values not printed")
    for i, (it, v) in enumerate((("kp", "1.7"), ("Z", "0.08"), ("site_class", "De"))):
        put(f"loads.earthquake.rows[{i}]", sheet="0101", view="earthquake loading", text=f"{it} {v} (BEDC-4)", cells={"item": it, "value": v})
    put("loads.earthquake.rows[3]", tag="Missing-Flagged", cells={"item": "Rf"}, note="not printed")
    put("loads.earthquake.rows[4]", tag="Missing-Flagged", cells={"item": "zeta"}, note="not printed")
    put("loads.earthquake.rows[5]", tag="Missing-Flagged", cells={"item": "vertical"}, note="not stated")
    for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
        put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 (report); values not printed")
    for gname in ("gradient_positive", "gradient_negative"):
        for i in range(13):
            put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note="AS 5100.2 differential temperature stated; values not printed")
    put("custom.design_lanes", 2, sheet="RPT", view="§2 road traffic loads", text="Number of design lanes for bridge SB41 EB is 2 lanes")
    put("custom.differential_settlement", 10, unit="mm", sheet="RPT", view="§2 differential settlement", text="differential settlements ... limited to 10 mm")
    put("custom.wind_region", "A2", sheet="RPT", view="§2 wind loads")

    # prestress losses / design options / analysis settings (as SB42)
    i_ = 0
    for it, un in (("k4", "-"), ("chi", "-"), ("ts", "days"), ("Rb", "%"), ("k7", "-"), ("Tav", "C"), ("jt", "days"), ("rb", "-"), ("dhard", "days"),
                   ("tsd", "days"), ("rd", "-"), ("sidl", "kN/m"), ("sidlA", "days"), ("dform", "kN/m"), ("meth", "-"), ("rlx", "-"), ("relpre", "-"),
                   ("emod", "-"), ("Tcur", "C"), ("hcur", "h")):
        if it in ("Tcur", "hcur"):
            put(f"design.prestress_losses.rows[{i_}]", sheet="0700", view="prestressing notes", text="ELEVATED TEMPERATURE CURING AT 70°C FOR 8 HOURS AFTER CASTING",
                cells={"item": it, "value": 70.0 if it == "Tcur" else 8.0, "unit": un})
        else:
            put(f"design.prestress_losses.rows[{i_}]", tag="Missing-Flagged", cells={"item": it}, note="not printed (0700 gives the hog basis only)")
        i_ += 1
    for d_ in (29.0, 99.0):
        put(f"design.prestress_losses.rows[{i_}]", tag="Model", cells={"item": "time", "value": d_, "unit": "days"},
            note="report times = girder age 30 / 100 days (0701 hog table) less a 1-day age at transfer (proposed)")
        i_ += 1
    put("design.girder_options.rows[0]", sheet="0768", view="general notes", text="INTERNAL SURFACE: 30mm, EXTERNAL SURFACE: 35mm", cells={"item": "fitment_cover_side", "value": "35"})
    put("design.girder_options.rows[1]", sheet="0768", view="general notes", text="INTERNAL SURFACE: 30mm", cells={"item": "fitment_cover_top", "value": "30"})
    for i, (it, v_) in enumerate((("useN", "true"), ("kuoLim", "true"), ("tend", '"sc"'), ("k1p", "0.4"), ("dsh", "true"), ("torsion_tie_legs", "1")), 2):
        put(f"design.girder_options.rows[{i}]", tag="Model", cells={"item": it, "value": v_}, note="design option, as SB42")
    put("design.girder_options.rows[8]", tag="Missing-Flagged", cells={"item": "aggregate_size"},
        note="0700: 'MINIMUM AGGREGATE SIZE IN ACCORDANCE WITH TfNSW SPECIFICATION D&C B80' - no number on the drawings (shear / torsion needs it)")
    for i, (it, v, why) in enumerate((("tgt", "2.8", "transverse member spacing target (m)"), ("merge", "0.4", "node merge tolerance (m)"), ("midgap", "1", "mid-gap lines"),
                                      ("model", "2", "integrated model"), ("girder_J_factor", "1.0", "Super-T torsion factor (ADR-041)"),
                                      ("deck_top_reference", "1", "nodes at the deck top (ADR-043)"))):
        put(f"analysis.grillage.rows[{i}]", tag="Model", cells={"item": it, "value": v}, note=why + ", as SB42")
    for kk, v, un, why in (("bearing_fixed_stiffness", 1e7, "kN/m", "rigid idealisation"), ("pile_toe", "vertical only", None, "as SB42"),
                           ("column_segment", 1.0, "m", "piles split to about 1 m"), ("soil_factor", 1, None, "sensitivity factor"), ("modes", 30, None, "response spectrum modes")):
        put("analysis." + kk, v, tag="Model", unit=un, note=why)

    fn = os.path.join(H, f"{pid}_description_values.json")
    json.dump({"origin": "owner drawing set SGWS1-JHSW-2000-BR-DRG-COMBINED.pdf (255 sheets) + report RPT-410001 rev D, 2026-11-17",
               "documents": sorted(docs.values(), key=lambda d: d["id"]), "values": out}, open(fn, "w"), indent=1, ensure_ascii=False)
    print(pid, len(out), "values;", "supports", {s: round(c["ch"], 4) for s, c in sup.items()}, "haunch mid", {k: round(v) for k, v in HAUNCH_MID.items()})
    return fn


if __name__ == "__main__":
    print(BW_TXT)
    for s in (1, 2, 3, 4):
        build(s)
