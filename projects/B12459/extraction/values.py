#!/usr/bin/env python3
"""B12459 (SB41 WB, Sydney Gateway SB-1510): extracted values -> one new-description input PER SPAN (ADR-062). INDICATIVE.

    python3 projects/B12459/extraction/values.py      # -> B12459-S1 / S2 _description_values.json

SB41 WB has two spans of nine 1515 Super-T girders (41B-S1 / S2, F7-F12) on one bearing row on the pier CL. The girders are
made continuous over the pier with post-installed stress bars (0707 / 0709 notes, report table 4-27): the platform has no
girder continuity, so each span runs simply supported (ADR-062). Sagging is overstated, hogging is absent: the comparison
is indicative only (compare_report.py). Survey: ../../B12460/extraction/SURVEY.md.

Control line MC90 (0117 table): arc R 660.000 (HTP1 CH 625.000 -> HTP2 702.122), tangent (-> HTP3 810.357), arc R 680.000;
MGA zone 56. Offsets: metres, right of MC90 looking along increasing chainage positive (right = north). Deck (0800 section
1, 0801 table 1): 400 | W2 | W1 | MC90 | 1000 | 400, W1 / W2 varying (radial). Girder 41B-Sk-01 is the south (left) girder,
09 the north edge next to MC90: bearing levels rise from 01 to 09 (0601 table 1) and the deck falls 3 % to the south.

Bearing centres: abutment A = 0301 table 2 B5 .. B13 (41B-A-0k = B(14-k)); pier 1 (shared with SB41 EB pier 2) one row on
the pier CL, B1 .. B9 at the dimensions along the pier from the datum on MC90 (0403 plan; 41B-P1-0k = Bk); abutment B = 0303
table 3 B25 .. B33 (41B-B-0k = B(24+k)). The script prints the chord check (chord + (X1 - chord) = X1, 0706 - 0709)."""
import json, math, os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")))
from pdf2bim.model.loads import _area_centroid
from pdf2bim.geometry.alignment import Alignment

H = os.path.dirname(os.path.abspath(__file__))
P = "SGWS1-JHSW-2000-BR-DRG-41"
N = 9


def dms(d, m, s):
    return d + m / 60 + s / 3600


def U(b):
    return math.sin(math.radians(b)), math.cos(math.radians(b))


# ---------------- control line MC90 (0117 table) ----------------
HTP1, HC1, HTP2, HTP3, HC2, HTP4 = (625.000, 330963.743, 6244977.244), (330607.970, 6245533.144), (702.122, 330896.507, 6244939.557), \
    (810.357, 330799.162, 6244892.238), (331096.442, 6244280.663), (1341.650, 330454.698, 6244505.527)


def turn(P0, P1, C):
    d = (P1[0] - P0[0], P1[1] - P0[1]); c = (C[0] - P0[0], C[1] - P0[1])
    return "left" if d[0] * c[1] - d[1] * c[0] > 0 else "right"


HROWS = [{"element": "arc", "ch_start": HTP1[0], "length": round(HTP2[0] - HTP1[0], 3), "radius": 660.0, "direction": turn(HTP1[1:], HTP2[1:], HC1),
          "E_start": HTP1[1], "N_start": HTP1[2]},
         {"element": "tangent", "ch_start": HTP2[0], "length": round(HTP3[0] - HTP2[0], 3), "E_start": HTP2[1], "N_start": HTP2[2]},
         {"element": "arc", "ch_start": HTP3[0], "length": round(HTP4[0] - HTP3[0], 3), "radius": 680.0, "direction": turn(HTP2[1:], HTP3[1:], HC2),
          "E_start": HTP3[1], "N_start": HTP3[2]}]
# vertical: 0801 table 1 RL 'A' (deck concrete top on MC90) is one grade: 10.543 at CH 658.5 .. 10.053 at CH 728.5; design surface = + 75
CHA, CHB, RLA, RLB = 658.5, 728.5, 10.543, 10.053
GR = (RLB - RLA) / (CHB - CHA) * 100
V0, V1 = HTP1[0], HTP3[0]
VROWS = [{"ch": V0, "RL": round(RLA + 0.075 + GR / 100 * (V0 - CHA), 4), "grade_out": round(GR, 5)},
         {"ch": V1, "RL": round(RLA + 0.075 + GR / 100 * (V1 - CHA), 4), "grade_in": round(GR, 5)}]
AL = Alignment(HROWS, VROWS)
# 0801 table 1: CH, W1, W2, RL A (MC90), RL B (left edge of W2), RL C (W1 / W2 break), RL D (right, +1.000)
WT = [(658.5, 8.525, 9.588, 10.543, 9.989, 10.272, 10.573), (661.0, 8.304, 9.337, 10.525, 9.987, 10.264, 10.555), (663.5, 8.144, 9.083, 10.508, 9.984, 10.255, 10.538),
      (666.0, 8.000, 8.868, 10.490, 9.980, 10.245, 10.520), (668.5, 7.866, 8.697, 10.473, 9.975, 10.234, 10.503), (671.0, 7.742, 8.571, 10.455, 9.967, 10.222, 10.485),
      (673.5, 7.628, 8.481, 10.438, 9.958, 10.210, 10.468), (678.5, 7.427, 8.307, 10.403, 9.936, 10.183, 10.433), (681.0, 7.342, 8.224, 10.385, 9.923, 10.168, 10.415),
      (683.5, 7.266, 8.153, 10.368, 9.910, 10.153, 10.398), (686.0, 7.199, 8.096, 10.351, 9.895, 10.137, 10.381), (688.5, 7.142, 8.053, 10.333, 9.879, 10.120, 10.363),
      (691.0, 7.095, 8.022, 10.316, 9.863, 10.102, 10.346), (693.5, 7.057, 8.005, 10.298, 9.846, 10.085, 10.328), (696.0, 7.029, 8.000, 10.281, 9.828, 10.068, 10.311),
      (701.0, 7.001, 8.000, 10.246, 9.793, 10.033, 10.276), (703.5, 7.000, 8.000, 10.228, 9.776, 10.018, 10.258), (706.0, 7.000, 8.000, 10.211, 9.759, 10.001, 10.241),
      (708.5, 7.000, 8.000, 10.193, 9.742, 9.983, 10.223), (711.0, 7.000, 8.000, 10.176, 9.724, 9.966, 10.206), (713.5, 7.000, 8.000, 10.158, 9.708, 9.948, 10.188)]
VCHECK = max(abs(AL.vertical.rl(r[0]) - 0.075 - r[3]) for r in WT)
XF = [((r[6] - r[4]) / (1.0 + r[1] + r[2]) * 100) for r in WT]


def station(E, N_, guess):
    return AL.station(E, N_, guess=guess)[:2]


def cross(P0, u, guess):
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


def line_hit(P_, d, Q, e):
    den = d[0] * e[1] - d[1] * e[0]
    s = ((Q[0] - P_[0]) * e[1] - (Q[1] - P_[1]) * e[0]) / den
    return P_[0] + s * d[0], P_[1] + s * d[1]


# ---------------- bearing centres ----------------
BA = {14 - n: (E, N_, f"B{n}") for n, E, N_ in ((5, 330936.804, 6244960.867), (6, 330937.799, 6244958.981), (7, 330938.826, 6244957.100),
                                               (8, 330939.878, 6244955.234), (9, 330940.957, 6244953.383), (10, 330942.062, 6244951.546),
                                               (11, 330943.192, 6244949.725), (12, 330944.347, 6244947.921), (13, 330945.528, 6244946.133))}
BB = {n - 24: (E, N_, f"B{n}") for n, E, N_ in ((25, 330889.299, 6244921.089), (26, 330887.181, 6244922.003), (27, 330885.053, 6244922.892),
                                               (28, 330882.915, 6244923.756), (29, 330880.764, 6244924.593), (30, 330878.607, 6244925.404),
                                               (31, 330876.438, 6244926.188), (32, 330874.261, 6244926.947), (33, 330872.086, 6244927.674))}
PB = dms(130, 3, 14)
UP = U(PB - 180)                       # along the pier towards the north-west (B9, girder 09)
PDAT = (694.435, 330903.400, 6244942.957)
PPOS = {1: -15835, 2: -13731, 3: -11635, 4: -9547, 5: -7466, 6: -5396, 7: -3334, 8: -1282, 9: 750}
PEND = (-17212, 1833)
SPANS = {1: ("A", "P1"), 2: ("P1", "B")}


def bearing_pt(sid, k):
    if sid == "A":
        return (BA[k][0], BA[k][1]), f"0301 table 2 {BA[k][2]} ({BA[k][0]}, {BA[k][1]})"
    if sid == "B":
        return (BB[k][0], BB[k][1]), f"0303 table 3 {BB[k][2]} ({BB[k][0]}, {BB[k][1]})"
    s = PPOS[k] / 1000
    return (PDAT[1] + s * UP[0], PDAT[2] + s * UP[1]), f"pier 1 (0403 plan) B{k}: {PPOS[k]:+d} along the pier CL from the datum on MC90"


# girders (0706 - 0709): type, X1 overall length at the soffit
GIR = {1: {1: ("F8", 32361, "0707")} | {k: (f"F7{'abcdefg'[k - 2]}", x, "0706") for k, x in zip(range(2, 9), (32941, 33550, 34186, 34851, 35543, 36263, 37011))}
       | {9: ("F9", 37782, "0707")},
       2: {1: ("F11", 28453, "0709")} | {k: (f"F10{'abcdefg'[k - 2]}", x, "0708") for k, x in zip(range(2, 9), (29107, 29784, 30487, 31217, 31969, 32748, 33552))}
       | {9: ("F12", 34368, "0709")}}
CHECK = []
for span, (s1, s2) in SPANS.items():
    for k in range(1, N + 1):
        a, b = bearing_pt(s1, k)[0], bearing_pt(s2, k)[0]
        L = math.hypot(b[0] - a[0], b[1] - a[1]) * 1000
        CHECK.append((span, k, round(L), GIR[span][k][1] - round(L)))
print("girder check (span, girder, chord mm, X1 - chord mm):", CHECK)
print(f"vertical: RL 'A' one grade {GR:.4f} %, max misfit {VCHECK * 1000:.1f} mm; crossfall (D - B) / (1 + W1 + W2): {min(XF):.2f} .. {max(XF):.2f} %")


def end_dist(span, k, chord_mm):
    """X1 - chord is NEGATIVE here (-180 .. -490 mm): the girder ends stop short of the single pier bearing; the cast-in-place
    continuity diaphragm carries them to it. The pier end is modelled 100 mm past the bearing (Model) so the end node stays distinct."""
    X1 = GIR[span][k][1]; rem = X1 - chord_mm
    if span == 1:
        return 400, 100, (f"400 at abutment A (0707 plans F8 / F9: '℄ BEARING 400'); at the pier X1 {X1} - chord {chord_mm:.0f} - 400 = {rem - 400:.0f}: "
                          "the girder end stops short of the pier bearing (continuity diaphragm between); modelled 100 past the bearing (Model)")
    return 100, 400, (f"X1 {X1} - chord {chord_mm:.0f} = {rem:.0f}: the girder end stops short of the pier bearing (continuity diaphragm); pier end modelled "
                      "100 past the bearing (Model); abutment B end taken 400 as abutment A (0709 prints 800 / 595 at 44° to the girder: query)")


EDGE = 0.400
CR_ = 1.000
# barrier: as SB41 EB (1006 section 1 PB polygon read for SB42; WB units not re-read: query)
PRE = [(-436, 0), (-53, 0), (0, -495), (-225, -655), (-225, -810), (-396, -810), (-517, -1705), (-606, -1705)]
STI = [(0, -495), (125, -655), (125, -810), (-225, -810), (-225, -655)]
(aP, cP), (aS, cS) = _area_centroid(PRE), _area_centroid(STI)
BW = round((aP + aS) / 1e6 * 25.0, 2)
BXC = -(aP * cP[0] + aS * cS[0]) / (aP + aS) / 1000
BW_TXT = (f"1006 section 1 (precast PB, edge-mounted) polygon as read for SB42; SB41 WB units not re-read (query); precast {aP / 1e6:.4f} m2 + stitch "
          f"{aS / 1e6:.4f} m2, x 25 kN/m3 (report table 2-4) = {BW:.2f} kN/m; centroid {BXC * 1000:.0f} mm outward of the inside face; rails / screens not included")

# bearings (0601 table 1): abutments type A, pier type B
BRG_RL = {"A": dict(enumerate((8.205, 8.269, 8.333, 8.397, 8.459, 8.532, 8.597, 8.661, 8.721), 1)),
          "P1": dict(enumerate((8.055, 8.111, 8.163, 8.214, 8.265, 8.316, 8.368, 8.418, 8.465), 1)),
          "B": dict(enumerate((7.898, 7.935, 7.977, 8.017, 8.057, 8.097, 8.135, 8.172, 8.205), 1))}
BTYPE = {"A": ("A", "0603", 380, 480, 157, "AS070910R"), "B": ("A", "0603", 380, 480, 157, "AS070910R"), "P1": ("B", "0604", 450, 600, 153, "AS091208R")}
# 0701 (transfer, 30 d, 60 d, 100 d, deck slab deflection, mass t)
HOG = {1: [(50, 59, 63, 64, -28, 72.4), (50, 60, 63, 64, -29, 72.5), (50, 60, 63, 65, -31, 73.7), (54, 64, 67, 69, -33, 75.1), (54, 64, 67, 68, -37, 76.4),
           (55, 64, 67, 68, -39, 77.6), (58, 68, 70, 71, -42, 79.1), (59, 68, 70, 71, -45, 80.6), (58, 68, 68, 69, -47, 81.5)],
       2: [(38, 48, 51, 53, -17, 67.6), (39, 48, 51, 53, -16, 63.7), (40, 49, 52, 54, -18, 65.1), (44, 53, 57, 58, -20, 66.4), (45, 54, 57, 59, -21, 67.8),
           (49, 58, 61, 63, -24, 69.0), (50, 59, 62, 63, -26, 70.5), (50, 59, 62, 63, -28, 72.0), (51, 60, 63, 64, -33, 76.6)]}
# 0602 table 2 (SB41 WB): epoxy pad corners at the abutment end only ('-' at the pier); (row hog, corners)
PAD = {1: [(59, (82, 65, 65, 82)), (60, (82, 65, 64, 81)), (60, (84, 67, 66, 83)), (64, (82, 65, 64, 81)), (64, (86, 69, 68, 85)), (64, (88, 71, 69, 87)),
           (68, (87, 70, 68, 86)), (68, (90, 73, 71, 89)), (66, (91, 77, 75, 89))],
       2: [(48, (86, 69, 65, 82)), (48, (86, 69, 64, 81)), (49, (87, 70, 65, 82)), (53, (85, 68, 63, 80)), (54, (85, 68, 63, 80)), (58, (84, 67, 62, 79)),
           (59, (85, 68, 63, 80)), (59, (87, 70, 65, 82)), (60, (87, 74, 69, 82))]}
HAUNCH_TXT = ("haunch = deck concrete top - 200 slab - girder top. Deck concrete top = 0801 RL 'A' grade on MC90 + offset x 3 % (falling to the south). "
              "Girder top = bearing RL 'X' (0601 table 1) + epoxy pad (mean of the 4 corners, 0602 table 2) at the abutment end, + 0 at the pier (no pad "
              "listed: '-'), straight between, + (30-day hog + deck-slab deflection, 0701) x 4t(1-t), + 1515")


def deck_top(ch, off):
    return AL.vertical.rl(ch) - 0.075 + 0.03 * off


def haunch(span, k):
    s1, s2 = SPANS[span]
    Pa, Pb = bearing_pt(s1, k)[0], bearing_pt(s2, k)[0]
    _, corners = PAD[span][k - 1]
    pa = sum(corners) / 4000 if s1 == "A" else 0.0
    pb = sum(corners) / 4000 if s2 == "B" else 0.0
    sa, sb = BRG_RL[s1][k] + pa, BRG_RL[s2][k] + pb
    c = (HOG[span][k - 1][1] + HOG[span][k - 1][4]) / 1000
    out = []
    for t in (0.0, 0.25, 0.5, 0.75, 1.0):
        Q = (Pa[0] + t * (Pb[0] - Pa[0]), Pa[1] + t * (Pb[1] - Pa[1]))
        ch, off = station(Q[0], Q[1], 690)
        out.append((deck_top(ch, off) - 0.2 - (sa + t * (sb - sa) + c * 4 * t * (1 - t) + 1.515)) * 1000)
    return out


# strands (0724): critical group 07-09 of each span; X loc 1-6 at 25 + 50 (6 - loc), rows F-B at 60 + 50 steps, row A loc 7 at ±495
DEB = {1: {"B": {1: 0, 2: 0, 3: 2000}, "C": {1: 2000, 2: 0, 3: 0, 4: 0, 5: 2000, 6: 0}, "D": {1: 0, 2: 4000, 3: 0, 4: 4000, 5: 0, 6: 0},
           "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}, "F": {2: 7500, 4: 7500, 5: 0, 6: 0}},
       2: {"B": {1: 0}, "C": {1: 2000, 2: 0, 3: 0, 4: 0, 5: 2000, 6: 0}, "D": {1: 0, 2: 4000, 3: 0, 4: 4000, 5: 0, 6: 0},
           "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}, "F": {2: 7500, 4: 7500, 5: 0, 6: 0}}}
NSTR = {1: 52, 2: 48}
FIT = {1: ("F9", 37.782, 73, 41, "0755 girder type F9: 73 bundles G1 1-N16-BZ-150 from each end, 41 bundles G1 1-N16-BZ-300 between"),
       2: ("F12", 34.368, 63, 38, "0757 girder type F12: 63 bundles G1 1-N16-BZ-150 from each end, 38 bundles G1 1-N16-BZ-300 between")}

# piles (0201 table 1): stationed below; data per pile
PILES = {"A": [(f"A-0{i}", E, N_, -16.4 if i <= 8 else -18.1, 6606 if i <= 8 else 4931, 4686 if i <= 8 else 3702) for i, E, N_ in
               ((5, 330946.585, 6244946.128), (6, 330944.658, 6244949.051), (7, 330942.799, 6244952.017), (8, 330941.009, 6244955.025),
                (9, 330939.288, 6244958.073))] + [("A-10", 330937.639, 6244961.158, -18.1, 4931, 3702)],
         "P1": [("P2-01", 330915.139, 6244933.088, -14.5, 8765, 6138), ("P2-02", 330912.843, 6244935.019, -14.5, 8765, 6138),
                ("P2-03", 330908.250, 6244938.880, -14.5, 8765, 6138), ("P2-04", 330903.658, 6244942.741, -14.6, 9078, 6223)],
         "B": [(f"B-0{i}", E, N_, -10.8, 7840, 5189) for i, E, N_ in ((5, 330887.292, 6244921.414), (6, 330882.668, 6244923.316),
                                                                     (7, 330877.996, 6244925.096), (8, 330873.472, 6244926.686))]}
PSUP = {"A": dict(top=2.1, D=900.0, Lf=500, m=1566), "P1": dict(top=1.452, D=1200.0, Lf=None, m=2932), "B": dict(top=1.022, D=1200.0, Lf=500, m=3652)}
LF_P = {"P2-01": 2800, "P2-02": 2800, "P2-03": 2800, "P2-04": 2600}
for sid, L_ in PILES.items():
    print("piles", sid, [(p[0], round(station(p[1], p[2], 690)[1], 2)) for p in L_])
print("bearings A", [round(station(*bearing_pt("A", k)[0], 660)[1], 2) for k in range(1, 10)])
print("bearings P1", [round(station(*bearing_pt("P1", k)[0], 694)[1], 2) for k in range(1, 10)])
print("bearings B", [round(station(*bearing_pt("B", k)[0], 725)[1], 2) for k in range(1, 10)])


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
    pid = f"B12459-S{span}"
    G = lambda k: f"41B-S{span}-0{k}"

    put("project.client", "Transport for NSW", sheet="0101", view="title block", text="CLIENT: Transport for NSW")
    names = ("HTP1 -> HTP2", "HTP2 -> HTP3", "HTP3 -> HTP4")
    for i, r in enumerate(HROWS):
        put(f"alignment.horizontal.rows[{i}]", sheet="0117", view="MC90 horizontal alignment table", cells=r,
            text=names[i] + (f"; radius {r['radius']:.3f} (centre {'HCEN-1' if i == 0 else 'HCEN-2'}), turning {r['direction']} (from the centre position)" if r["element"] == "arc"
                             else "; bearing printed 64°04'34\" (the coordinates give 244°04'34\" with increasing chainage: back bearing, as MC80)"))
    for i, r in enumerate(VROWS):
        put(f"alignment.vertical.rows[{i}]", tag="Calculated", cells=r,
            formula=f"0801 table 1 RL 'A' (deck concrete on MC90) is one grade: {RLA} at CH {CHA} to {RLB} at CH {CHB} = {GR:.4f} % (all {len(WT)} stations within "
                    f"{VCHECK * 1000:.1f} mm); design surface = RL 'A' + 75 surfacing; row at CH {r['ch']} by the grade")
    put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": 3.0, "right": 3.0, "crown_offset": round(CR_ + EDGE, 3)},
        formula=f"one-way fall to the left (south): 0801 table 1 (RL 'D' at +1.000 - RL 'B' at -(W1 + W2)) / (1 + W1 + W2) = {min(XF):.2f} .. {max(XF):.2f} % "
                "over CH 658.5 .. 713.5 (e.g. 658.5: (10.573 - 9.989) / 19.113 = 3.06 %; RL 'D' - RL 'A' = 0.030 over 1.000); crown at the right deck edge")

    sup = {}
    for sid in (s1, s2):
        if sid in ("A", "B"):
            q1, q9 = bearing_pt(sid, 1)[0], bearing_pt(sid, N)[0]
            u = (q9[0] - q1[0], q9[1] - q1[1]); n = math.hypot(*u); u = (u[0] / n, u[1] / n)
            brg = math.degrees(math.atan2(*u)) % 180
            P0 = q1
            dev = max(abs((bearing_pt(sid, k)[0][0] - P0[0]) * u[1] - (bearing_pt(sid, k)[0][1] - P0[1]) * u[0]) for k in range(1, N + 1))
            txt = f"line through the end bearings ({ {'A': '0301 table 2 B13 / B5', 'B': '0303 table 3 B25 / B33'}[sid] }), bearing {brg:.4f}°; the others within {dev * 1000:.0f} mm"
        else:
            u, brg = UP, PB % 180
            P0 = bearing_pt(sid, 1)[0]
            txt = f"pier 1 CL (single bearing row): bearing 130°03'14\" through the datum CH {PDAT[0]} ({PDAT[1]}, {PDAT[2]}) (0403)"
        ch = cross(P0, u, station(P0[0], P0[1], 690)[0])
        sup[sid] = {"P0": P0, "u": U(brg), "brg": brg, "ch": ch}
        put(f"alignment.support_lines.rows[{0 if sid == s1 else 1}]", tag="Calculated", cells={"support": sid, "ch": round(ch, 4), "bearing": round(brg, 5)},
            formula=txt + f"; ch = where it crosses MC90 = {ch:.4f}")

    # deck: the widest 0801 W1 / W2 station inside the span
    c0, c1 = sorted((sup[s1]["ch"], sup[s2]["ch"]))
    rows = [r for r in WT if c0 - 3 <= r[0] <= c1] or [WT[0]]
    w = max(rows, key=lambda r: r[1] + r[2])
    CL_ = -(w[1] + w[2])
    WTXT = (f"0801 table 1 W1 / W2 (radial): the widest of the stations CH {rows[0][0]} .. {rows[-1][0]} in span {span} (CH {w[0]}: W1 {w[1]}, W2 {w[2]}); "
            "0800 section 1: 400 | W2 | W1 | MC90 | 1000 | 400. The deck tapers along the span (W1 + W2 "
            f"{min(r[1] + r[2] for r in rows):.3f} .. {max(r[1] + r[2] for r in rows):.3f}): the platform deck is constant width (conservative for deck load)")
    put("deck.carriageway_left", round(CL_, 3), unit="m", tag="Calculated", formula="left barrier inside face = -(W1 + W2); " + WTXT, inputs=[])
    put("deck.carriageway_right", CR_, unit="m", sheet="0800", view="section 1", text="1000 from MC90 to the right barrier face")
    put("deck.edge_left", round(CL_ - EDGE, 3), unit="m", tag="Calculated", formula="barrier face - 400 (0800 section 1)", inputs=["deck.carriageway_left"])
    put("deck.edge_right", CR_ + EDGE, unit="m", tag="Calculated", formula="barrier face + 400 (0800 section 1)", inputs=["deck.carriageway_right"])
    put("deck.slab_thickness", 200.0, unit="mm", sheet="0113", view="section SB41 westbound", text="200 MIN THICK DECK", note="as read for SB41 EB (same typical section sheet)")
    put("deck.surfacing_thickness", 75.0, unit="mm", sheet="0113", view="section SB41", text="75 THICK BITUMINOUS WEARING SURFACE")
    put("deck.surfacing_density", 22.0, unit="kN/m3", sheet="RPT", view="table 2-4", text="asphalt surfacing 22 kN/m3")
    put("deck.girders_follow_crossfall", True, sheet="0800", view="section 1", text="girders shown square to the 3 % fall")
    HN = {k: haunch(span, k) for k in range(1, N + 1)}
    offA = {k: station(*bearing_pt(s1, k)[0], 690)[1] for k in range(1, N + 1)}
    for k in range(1, N + 1):
        h = HN[k]
        hm = (h[0] + 4 * h[1] + 2 * h[2] + 4 * h[3] + h[4]) / 12
        sp = [abs(offA[k] - offA[j]) for j in (k - 1, k + 1) if 1 <= j <= N]
        bt = sum(sp) / len(sp)
        wq = round(max(hm, 0.0) / 1000 * bt * 25.0, 3)
        put(f"deck.haunch_concrete.rows[{k - 1}]", tag="Calculated", cells={"girder": G(k), "w": wq},
            formula=HAUNCH_TXT + f"; haunch at t = 0 / .25 / .5 / .75 / 1: {' / '.join(f'{x:.0f}' for x in h)} mm, mean {hm:.0f} mm (negative taken as 0)"
                    f", over the girder spacing {bt:.3f} m x 25 kN/m3 = {wq} kN/m")
    HM = {k: HN[k][2] for k in HN}
    for b, face in (("left", CL_), ("right", CR_)):
        p = f"deck.barriers[barrier_{b}]"
        put(p + ".side", b, sheet="0800", view="section 1")
        put(p + ".type", "precast edge barrier (PB units), medium performance, with twin steel rail", sheet="1000", view="layout plan", text="PB units along SB41")
        put(p + ".height", 1255.0, unit="mm", sheet="1006", view="section 1", text="805 + 495 - 45 above the deck surface", note="as read for SB42; wind area only")
        put(p + ".weight", BW, unit="kN/m", tag="Calculated", formula=BW_TXT, inputs=[])
        put(p + ".solid", True, sheet="1006", view="section 1", text="solid precast unit")
        put(p + ".offset", round(face - BXC if b == "left" else face + BXC, 4), unit="m", tag="Calculated", inputs=[f"deck.carriageway_{b}"],
            formula=f"inside face {face:+.3f} {'-' if b == 'left' else '+'} centroid {BXC * 1000:.0f} mm outward")

    put("superstructure.type", "super-t", sheet="0700", view="girder layout plan", text="9 No 1515 DEEP SUPER-T (0113)")
    put("superstructure.spans", 1, tag="Model", note=f"span {span} of 2 modelled on its own and SIMPLY SUPPORTED (ADR-062): the drawings make the girders continuous "
                                                      "over the pier with stress bars (0707 / 0709, report table 4-27) - not modelled; results indicative")
    offs = {}
    for k in range(1, N + 1):
        p = f"superstructure.members[{G(k)}]"
        t, X1, sh = GIR[span][k]
        (Pa, sa_), (Pb, sb_) = bearing_pt(s1, k), bearing_pt(s2, k)
        d = (Pb[0] - Pa[0], Pb[1] - Pa[1]); L = math.hypot(*d); d = (d[0] / L, d[1] / L)
        for sid, src in ((s1, sa_), (s2, sb_)):
            S = sup[sid]
            hit = line_hit(Pa, d, S["P0"], S["u"])
            ch, off = station(hit[0], hit[1], S["ch"])
            offs[(k, sid)] = off
            shift = math.hypot(hit[0] - (Pa if sid == s1 else Pb)[0], hit[1] - (Pa if sid == s1 else Pb)[1]) * 1000
            put(p + ".line_offset_" + ("A" if sid == s1 else "B"), round(off, 4), unit="m", tag="Calculated",
                formula=f"bearing {src}; girder chord {s1}-{s2} crossed with the {sid} support line ({shift:.0f} mm from the bearing centre), stationed on MC90: "
                        f"ch {ch:.3f}, offset right +")
        e1, e2, etxt = end_dist(span, k, L * 1000)
        put(p + ".length", X1 / 1000, unit="m", sheet=sh, view=f"girder type {t}", text=f"OVERALL LENGTH ALONG ℄ GIRDER {X1} (MEASURED AT THE SOFFIT)",
            note=f"chord between the bearing centres {L:.3f} m")
        if span == 1:
            put(p + ".bearing_offset_A", e1, unit="mm", sheet="0707", view=f"plan girder type {t}", text="℄ BEARING 400 (abutment A end)")
        else:
            put(p + ".bearing_offset_A", e1, unit="mm", tag="Model", note=etxt)
        put(p + ".bearing_offset_B", e2, unit="mm", tag="Model", note=etxt)
        put(p + ".straight", True, tag="Model", note="precast girders straight between bearings")
        put(p + ".type_ref", "ST1", tag="Model", note=f"one Super-T type per span: strands of the 07-09 group, fitments of the edge girder 09 (critical in the report); girder {t}")
    for k in range(1, N + 1):
        lo = abs(offs[(k, s1)] - offs[(k - 1, s1)]) if k > 1 else None
        hi = abs(offs[(k + 1, s1)] - offs[(k, s1)]) if k < N else None
        if lo and hi:
            put(f"superstructure.members[{G(k)}].flange_edges.rows[0]", tag="Calculated", cells={"t": 0.0, "left": round((lo * 1000 - 20) / 2, 1), "right": round((hi * 1000 - 20) / 2, 1)},
                formula="(girder spacing at the first support - 20 NOM gap (0807 typical detail)) / 2 each side")
    put("superstructure.flange_gap", 20.0, unit="mm", sheet="0807", view="typical detail of gap between girders", text="20 NOM. GAP GIRDER FLANGE (TYP)")
    put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="edge girder outer flange tip to deck edge not dimensioned on the sheets read")
    for i, sid in enumerate((s1, s2)):
        put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": sid, "width": 800.0, "depth": 1265.0, "concrete": "deck (40 MPa)"},
            formula="cast-in-place cross girder over the girder ends: 1065 contact face (0707 elevation) + 200 slab; width 800 not dimensioned (query, as SB42)",
            inputs=["deck.slab_thickness"], note="cross girder width not dimensioned on the sheets read (query)")
    T = "superstructure.supert_types[ST1]"
    put(T + ".section", "lib:supert/T4", tag="Standard-verify", note="1515 deep Super-T (TfNSW T4 family)")
    put(T + ".depth", 1515, unit="mm", sheet="0722", view="typical Super-T girder section", text="1515")
    for i, (kk, nm, v, un) in enumerate((("D", "Overall depth", 1515, "mm"), ("bw", "Soffit width", 757, "mm"), ("tw", "Web thickness", 100, "mm"),
                                         ("d1", "Void floor fall", 58, "mm"), ("d2", "Bottom flange depth at CL", 265, "mm"), ("ttf", "Top flange thickness", 90, "mm"))):
        put(T + f".shape.rows[{i}]", sheet="0722", view="typical Super-T girder section", text=f"{v}", cells={"key": kk, "name": nm, "value": v, "unit": un})
    put(T + ".shape.rows[6]", tag="Standard-verify", cells={"key": "S", "name": "Web slope (V : H)", "value": 10.556, "unit": ""}, note="10.556 : 1 printed (0722)")
    put(T + ".concrete_28d", 50, unit="MPa", sheet="0700", view="general notes", text="MINIMUM 28 DAY COMPRESSIVE STRENGTH OF CONCRETE SHALL BE 50 MPa FOR GIRDERS F1 TO F12")
    put(T + ".concrete_transfer", 40, unit="MPa", sheet="0700", view="general notes", text="40 MPa AT TRANSFER OF PRESTRESS FOR GIRDERS F1 TO F12")
    for i, e in enumerate("AB"):
        put(T + f".zones.rows[{i}]", tag="Calculated", cells={"from": 0.0, "to": 1.5, "kind": "solid_end_" + e},
            formula="end of the void: 2000 to the first void diaphragm less 500 (0707 / 0709 plans); the solid end block is not dimensioned (query, as SB42)")
    kmin = min(HM, key=HM.get)
    put(T + ".haunch", round(max(HM[kmin], 0)), unit="mm", tag="Calculated",
        formula=HAUNCH_TXT + f"; one section type per span: the smallest mid-span haunch (girder 0{kmin}; all girders {', '.join(f'0{k} {v:.0f}' for k, v in HM.items())} mm)")
    X = {kk: 25 + 50 * (6 - kk) for kk in range(1, 7)}
    Y = {"F": 60, "E": 110, "D": 160, "C": 210, "B": 260}
    st = [(1435.0, s * 495.0, 0.0, "A") for s in (-1, 1)]
    for r, locs in DEB[span].items():
        for loc, deb in locs.items():
            st += [(float(Y[r]), s * X[loc], float(deb), r) for s in (-1, 1)]
    assert len(st) == NSTR[span], (len(st), NSTR[span])
    lab = f"41B-S{span}-07 TO 41B-S{span}-09"
    for i, (y, x, deb, r) in enumerate(sorted(st, key=lambda q: (q[0], q[1]))):
        put(T + f".strand_pattern.rows[{i}]", sheet="0724", view=f"strand debonding schedule for girders {lab}",
            text="rows F-B at 60 + 4 x 50; locations 1-6 at 25 + 5 x 50 each side; row A loc 7 at ±495, 80 below the top; debonded both ends",
            cells={"y": y, "x": float(x), "diameter": 15.7, "debond_left": deb, "debond_right": deb, "on": True}, note=f"row {r}")
    put(T + ".jacking_ratio", round(209 / 279, 4), tag="Calculated", unit="", formula="force after release of the jack 209 kN / MBL 279 kN (0700 prestressing notes)")
    ft, Lf, ne, nc, ftxt = FIT[span]
    a = (Lf - 2 * ne * 0.15 - nc * 0.3) / 2
    for i, (a_, b_, sp_) in enumerate(((a, a + ne * 0.15, 150.0), (a + ne * 0.15, a + ne * 0.15 + nc * 0.3, 300.0), (a + ne * 0.15 + nc * 0.3, Lf - a, 150.0))):
        put(T + f".fitments.rows[{i}]", tag="Calculated", cells={"from": round(a_, 3), "to": round(b_, 3), "diameter": 16.0, "legs": 2, "spacing": sp_},
            formula=f"{ftxt}; X1 {Lf}: remainder {a:.3f} m at each end (end zone G19 N16-DZ-100 bundles not counted)")
    for i, face in enumerate(("top", "bot")):
        put(T + f".deck_bars.rows[{i}]", tag="Calculated", cells={"face": face, "diameter": 16.0, "spacing": 150.0, "cover": 61.0},
            formula="as SB42 (N16-S-150 NF / FF longitudinal, cover 45 + transverse N16); SB41 WB deck reinforcement sheets not read (query)", inputs=["deck.slab_thickness"])
    put("custom.girder_hog_table", tag="Direct", sheet="0701", view="calculated hog of girders at bridge SB41 WB", unit="mm",
        value={G(k): {"transfer": h[0], "30_days": h[1], "60_days": h[2], "100_days": h[3], "deck_slab_deflection": h[4], "mass_t": h[5]} for k, h in enumerate(HOG[span], 1)})
    put("custom.strand_MBL", 279, unit="kN", sheet="0700", view="prestressing notes"); put("custom.strand_force_after_release", 209, unit="kN", sheet="0700", view="prestressing notes")
    put("custom.continuity", "girders made continuous over pier 1 with Ø56 VSL CT stress bars (0707 / 0709, 0575); NOT modelled", sheet="0707", view="elevation",
        text="PROVIDE 6 OFF NOM Ø105 ID CORRUGATED GALVANISED METAL DUCT TO FACILITATE Ø56 VSL CT STRESS BAR")

    for sid in (s1, s2):
        bt_, bsh, pa_, pb_, hh, part = BTYPE[sid]
        for k in range(1, N + 1):
            bid = f"41B-{sid}-0{k}"; p = f"bearings.items[{bid}]"
            put(p + ".support", sid, tag="Model", note=f"bearing {bid} on support {sid}" + (" (one bearing per girder line, shared by both spans)" if sid == "P1" else ""))
            put(p + ".member", G(k), tag="Model", note=f"bearing {bid} under girder {G(k)}")
            put(p + ".type", "elastomeric", sheet=bsh, view=f"laminated elastomeric bearing type {bt_}", text=f"AS5100.4 PART No {part}; 0601 table 1 type {bt_}")
            put(p + ".plan_a", pa_, unit="mm", sheet=bsh, view="plan laminated elastomeric bearing", text=str(pa_))
            put(p + ".plan_b", pb_, unit="mm", sheet=bsh, view="plan laminated elastomeric bearing", text=str(pb_))
            put(p + ".bearing_height", hh, unit="mm", sheet=bsh, view="elevation", text=str(hh))
            put(p + ".top_rl", BRG_RL[sid][k], unit="m", sheet="0601", view="table 1 bridge No B12459 (SB41 - westbound) bearing levels", text=f"{bid} type {bt_} RL 'X' {BRG_RL[sid][k]}")
            for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
                put(p + "." + f, tag="Missing-Flagged", unit="MPa" if f == "shear_modulus" else "mm", note=f"catalogue part {part}; layers / G not printed")
            put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: mortar pad + epoxy block (0602 table 2)")
            put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric — idealisation for the engineer")
            put(p + ".restraint_transverse", tag="Missing-Flagged", note="lateral restraint — idealisation for the engineer")

    for sid in (s1, s2):
        p = f"supports[{sid}]"
        S = sup[sid]
        hit = AL.point(S["ch"])
        if sid == "P1":
            put(p + ".kind", "pier", tag="Model", note="pier 1 = SB41 EB pier 2 (shared blade wall, 1650 thick, on Ø1200 piles); WB part modelled as a sill at the pile heads")
            put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 1650.0, "depth": 1500.0, "length": round((PEND[1] - PEND[0]) / 1000, 3)},
                formula=f"wall 1650 thick, pile cap 1500 deep (0400 section 2): the sill element only; WB part {PEND[0]} .. {PEND[1]:+d} along the pier from the datum (0403)")
            put(p + ".headstock_setout.rows[0]", tag="Calculated", cells={"edge": "front", "value": 825.0}, formula="bearing row on the pier CL: half the 1650 wall")
            put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -825.0}, formula="as the front")
            t0 = (hit[0] - PDAT[1]) * UP[0] + (hit[1] - PDAT[2]) * UP[1]
            sg = 1 if UP[0] * S["u"][0] + UP[1] * S["u"][1] > 0 else -1
            ends = sorted(sg * (v / 1000 - t0) for v in PEND)
            for j, (edge, v) in enumerate(zip(("start", "end"), ends)):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                    formula=f"WB pier part ends {PEND[0]:+d} / {PEND[1]:+d} along the pier from the datum (0403), measured from the MC90 crossing ({t0:+.3f} m), "
                            f"in the support-line direction")
        else:
            if sid == "A":
                put(p + ".kind", "spill-through abutment", tag="Model", note="abutment A (shared with SB41 EB and SB42): headstock on Ø900 column extensions over Ø900 piles")
                put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 2175.0, "depth": 1200.0, "length": None},
                    formula="0301 section 1: 725 in front of the bearing CL + 1450 behind; depth 1200 (as SB41 EB)")
                put(p + ".headstock_setout.rows[0]", sheet="0301", view="section 1", text="725 bearing CL to the front face", cells={"edge": "front", "value": 725.0})
                put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -1450.0}, formula="550 + 350 + 550 behind the bearing CL (0301 section 1)")
            else:
                put(p + ".kind", "spill-through abutment", tag="Model", note="abutment B (shared): headstock 2100 x 1000 on Ø1200 columns over Ø1200 piles (0303)")
                put(p + ".headstock.rows[0]", sheet="0303", view="sections 9 / 10", text="headstock 2100 wide, 1000 deep", cells={"width": 2100.0, "depth": 1000.0, "length": None})
                put(p + ".headstock_setout.rows[0]", tag="Model", cells={"edge": "front", "value": 1050.0}, note="headstock taken centred on the bearing line (query, as SB41 EB)")
                put(p + ".headstock_setout.rows[1]", tag="Model", cells={"edge": "back", "value": -1050.0}, note="as the front row")
            ends = sorted((Q[0] - hit[0]) * S["u"][0] + (Q[1] - hit[1]) * S["u"][1] for Q in (bearing_pt(sid, 1)[0], bearing_pt(sid, N)[0]))
            for j, (edge, v) in enumerate(zip(("start", "end"), (ends[0] - 1.0, ends[1] + 1.0))):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Model", cells={"edge": edge, "value": round(v * 1000, 0)},
                    note="WB part of the shared headstock: end bearings + 1.0 m (the SOP corners of the WB part not read: query)")
        put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "see report §5"}, note="soil springs not in the copy supplied")
        put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="22 kN/m3 compacted soil (report table 2-4)")
        put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="not given")
        put(p + ".curtain_wall.rows[0]", tag="Missing-Flagged", cells={}, note="not modelled")
        dd = PSUP[sid]
        for pid_, E, N_, toe, uls, sls in PILES[sid]:
            q = p + f".piles[{pid_}]"
            lf = LF_P.get(pid_, dd["Lf"])
            put(q + ".E", E, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} EASTING {E}")
            put(q + ".N", N_, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} NORTHING {N_}")
            put(q + ".diameter", dd["D"], unit="mm", sheet="0201" if sid == "A" else "0110", view="table 1 pile data" if sid == "A" else "elevation",
                text="PILE DIAMETER 900 (abutment A)" if sid == "A" else "Ø1200 BORED PILES")
            put(q + ".rl_top", dd["top"], unit="m", sheet="0201", view="table 1 pile data", text=f"TOP OF PILE RL 'B' {dd['top']}")
            put(q + ".rl_toe", toe, unit="m", sheet="0201", view="table 1 pile data", text=f"ANTICIPATED FOUNDING LEVEL RL 'A' {toe}")
            put(q + ".rl_rock", round(toe + lf / 1000, 3), unit="m", tag="Calculated", formula=f"founding level RL 'A' {toe} + minimum embedment {lf} mm (0201 table 1)")
            put(q + ".design_actions.rows[0]", sheet="0201", view="table 1 pile data", text="DESIGN MAXIMUM AXIAL COMPRESSION LOAD AT TOP OF PILE SLS",
                cells={"limit_state": "SLS", "N": float(sls)})
            put(q + ".design_actions.rows[1]", sheet="0201", view="table 1 pile data", text="ULS axial / DESIGN MAXIMUM BENDING MOMENT ULS",
                cells={"limit_state": "ULS", "N": float(uls), "M": float(dd["m"])})

    for i, (el, fc, sheet, txt, E_, dens) in enumerate((("Super-T girders", 50.0, "0700", "50 MPa (F1-F12)", 34800.0, 26.0), ("deck", 40.0, "0801", "40 MPa", 32800.0, 25.0),
                                                       ("piles", 40.0, "0250", "40 MPa", 32800.0, 25.0), ("abutments", 40.0, "0301", "40 MPa", 32800.0, 25.0))):
        put(f"materials.concrete.rows[{i}]", sheet=sheet, view="general notes", text=f"{txt} ({sheet}); E {E_:.0f} (report table 2-1); density {dens} kN/m3 (report table 2-4)",
            cells={"element": el, "fc": fc, "E": E_, "density": dens})
    put("materials.strand.rows[0]", sheet="RPT", view="table 2-3", text="15.7 mm 7 wire ordinary relax 2, A 150, MBL 279 kN, fp 1860, E 195 GPa",
        cells={"type": "15.7 mm 7-wire ordinary, relax 2", "diameter": 15.7, "fpb": 1860.0, "area": 150.0, "Ep": 195000.0})
    put("materials.reinforcement.rows[0]", sheet="RPT", view="table 2-2", text="D500N 500 MPa, E 200,000", cells={"grade": "D500N", "fsy": 500.0, "Es": 200000.0})
    put("custom.sdl_line_loads", tag="Missing-Flagged", note="safety / headlight screens and utilities: not quantified")

    put("loads.traffic_models.rows[0]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "M1600", "on": True})
    put("loads.traffic_models.rows[1]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "S1600", "on": True})
    put("loads.traffic_models.rows[2]", sheet="RPT", view="§2 road traffic loads", text="HLP400 ... within ±1.0 m of the centreline of two marked lanes or the carriageway (SB41 WB)",
        cells={"model": "HLP400", "on": True}, note="the platform places HLP400 by its own rule; the two-marked-lanes position is not modelled")
    put("loads.traffic_models.rows[3]", sheet="RPT", view="§2 road traffic loads", text="accompanying lane factor 1.0 for HLP400 with one half of SM1600",
        cells={"model": "HLP400_with_half_M1600", "on": True})
    put("loads.design_speed", 10, unit="km/h", sheet="0101", view="HLP400 loading", text="HLP400 at 10 km/h", note="road design speed not read (query)")
    for kk, un in (("braking_force", "kN"), ("traffic_surcharge", "kPa"), ("shrinkage_creep_shortening", "1e-6")):
        put("loads." + kk, tag="Missing-Flagged", unit=un, note="AS 5100.2 method stated in the report; value not printed")
    put("loads.wind.rows[0]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (ULS) 48m/s", cells={"item": "V_uls", "value": 48.0, "unit": "m/s"})
    put("loads.wind.rows[1]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (SLS) 37m/s", cells={"item": "V_sls", "value": 37.0, "unit": "m/s"})
    put("loads.wind.rows[2]", sheet="RPT", view="§2 wind loads", text="design speed of 35m/s ... with road traffic", cells={"item": "V_with_traffic", "value": 35.0, "unit": "m/s"})
    for i, it in enumerate(("air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 3):
        put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 section 17 stated; values not printed")
    for i, (it, v) in enumerate((("kp", "1.7"), ("Z", "0.08"), ("site_class", "De"))):
        put(f"loads.earthquake.rows[{i}]", sheet="0101", view="earthquake loading", text=f"{it} {v} (BEDC-4)", cells={"item": it, "value": v})
    for i, it in enumerate(("Rf", "zeta", "vertical"), 3):
        put(f"loads.earthquake.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="not printed")
    for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
        put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 (report); values not printed")
    for gname in ("gradient_positive", "gradient_negative"):
        for i in range(13):
            put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note="AS 5100.2 differential temperature stated; values not printed")
    put("custom.design_lanes", 5, sheet="RPT", view="§2 road traffic loads", text="Number of design lanes for bridge SB41 WB is 5 lanes")
    put("custom.differential_settlement", 10, unit="mm", sheet="RPT", view="§2 differential settlement", text="differential settlements ... limited to 10 mm")
    put("custom.wind_region", "A2", sheet="RPT", view="§2 wind loads")

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
        put(f"design.prestress_losses.rows[{i_}]", tag="Model", cells={"item": "time", "value": d_, "unit": "days"}, note="girder age 30 / 100 days (0701) less 1 day")
        i_ += 1
    put("design.girder_options.rows[0]", sheet="0768", view="general notes", text="INTERNAL SURFACE: 30mm, EXTERNAL SURFACE: 35mm", cells={"item": "fitment_cover_side", "value": "35"})
    put("design.girder_options.rows[1]", sheet="0768", view="general notes", text="INTERNAL SURFACE: 30mm", cells={"item": "fitment_cover_top", "value": "30"})
    for i, (it, v_) in enumerate((("useN", "true"), ("kuoLim", "true"), ("tend", '"sc"'), ("k1p", "0.4"), ("dsh", "true"), ("torsion_tie_legs", "1")), 2):
        put(f"design.girder_options.rows[{i}]", tag="Model", cells={"item": it, "value": v_}, note="design option, as SB42")
    put("design.girder_options.rows[8]", tag="Missing-Flagged", cells={"item": "aggregate_size"}, note="0700 refers to TfNSW B80; no number on the drawings")
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
    print(pid, len(out), "values;", "supports", {s: round(c["ch"], 4) for s, c in sup.items()}, "deck W1+W2", round(-CL_, 3), "haunch mid", {k: round(v) for k, v in HM.items()})
    return fn


if __name__ == "__main__":
    for s in (1, 2):
        build(s)
