#!/usr/bin/env python3
"""B12461 (SB42, Sydney Gateway SB-1510): extracted values -> one new-description input PER SPAN (ADR-062).

    python3 projects/B12461/extraction/values.py      # -> B12461-S1_description_values.json, B12461-S2_description_values.json

SB42 has two spans of simply supported Super-T girders on elastomeric bearings (A, P1, B) with a deck made continuous over
the pier by a link slab with a debonding layer (report §4). The platform model is single-span, so each span is its own
description (supports A-P1 and P1-B): exact for the girders as simply supported, the link slab is not modelled, and the
pier is shared (its two bearing rows are in different descriptions; pier totals are combined in compare_report.py).

Control line MCR0 with its own chainage (0117): compound circular curve R 90 / R 180, then a tangent; MGA zone 56.
Offsets: metres, right of MCR0 looking along increasing chainage (A -> B, towards the west) positive: left = southern
side (footpath), right = northern side. Girder 42-Sk-01 is the left (south, footpath side, inside of the curve, shortest)
girder, 05 the right (north, outside of the curve, longest: F3 / F6).

Bearing centres: abutment A and B from the setout tables (0301 table 2, 0303 table 1: MGA, Direct); pier P1 from the
dimensions along the pier from its datum (0406 plan, Calculated). Cross-checks against the girder lengths (0702 - 0705)
are printed by this script: projecting each abutment bearing along its girder (bearing direction in the setout table)
by the bearing-to-bearing length lands within about 12 mm of the pier bearing from 0406."""
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


# ---------------- control line MCR0 (0117 table + vertical diagram) ----------------
HTP = [(462.023, 331038.708, 6244911.735), (566.445, 330943.161, 6244936.331), (629.612, 330888.120, 6244906.002), (744.975, None, None)]
HROWS = [{"element": "arc", "ch_start": 462.023, "length": round(566.445 - 462.023, 3), "radius": 90.0, "direction": "left", "E_start": 331038.708, "N_start": 6244911.735},
         {"element": "arc", "ch_start": 566.445, "length": round(629.612 - 566.445, 3), "radius": 180.0, "direction": "left", "E_start": 330943.161, "N_start": 6244936.331},
         {"element": "tangent", "ch_start": 629.612, "length": round(744.975 - 629.612, 3), "E_start": 330888.120, "N_start": 6244906.002}]
G1, G2, G3 = 4.35, -2.25, -1.20
IP1, RL1, IP2, RL2 = 571.940, 11.134, 649.618, 9.386
V0, V3 = 462.023, 744.975
VROWS = [{"ch": V0, "RL": round(RL1 - G1 / 100 * (IP1 - V0), 4), "grade_out": G1},
         {"ch": IP1, "RL": RL1, "grade_in": G1, "grade_out": G2, "curve_length": 70.0},
         {"ch": IP2, "RL": RL2, "grade_in": G2, "grade_out": G3, "curve_length": 30.0},
         {"ch": V3, "RL": round(RL2 + G3 / 100 * (V3 - IP2), 4), "grade_in": G3}]
AL = Alignment(HROWS, VROWS)


def station(E, N, guess):
    ch, off = AL.station(E, N, guess=guess)[:2]
    return ch, off


def cross(P0, u, guess):
    """Chainage where MCR0 crosses the line P0 + t u (secant)."""
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
    """Intersection of lines P + s d and Q + t e."""
    den = d[0] * e[1] - d[1] * e[0]
    s = ((Q[0] - P[0]) * e[1] - (Q[1] - P[1]) * e[0]) / den
    return P[0] + s * d[0], P[1] + s * d[1]


# ---------------- bearing centres ----------------
# abutment A: 0301 table 2 (bearing 'alpha' = girder direction A -> P1); B18 is under girder 01 .. B14 under 05
BA = {1: (dms(249, 52, 4.6), 330954.427, 6244934.161, "B18"), 2: (dms(249, 17, 20.8), 330952.842, 6244936.122, "B17"),
      3: (dms(248, 42, 5.9), 330951.306, 6244938.085, "B16"), 4: (dms(248, 6, 33.6), 330949.791, 6244940.088, "B15"),
      5: (dms(247, 30, 57.2), 330948.315, 6244942.110, "B14")}
# abutment B: 0303 table 1, B20 under 01 .. B24 under 05 (alpha = girder direction P1 -> B)
BB = {1: (dms(239, 54, 56.6), 330906.572, 6244912.432, "B20"), 2: (dms(239, 54, 56.8), 330904.274, 6244913.713, "B21"),
      3: (dms(239, 54, 56.6), 330901.977, 6244914.954, "B22"), 4: (dms(239, 54, 56.6), 330899.623, 6244916.183, "B23"),
      5: (dms(239, 54, 56.5), 330897.240, 6244917.384, "B24")}
# pier P1 (0406 plan): datum CH 589.580 (330921.799, 6244927.489), pier bearing 130°03'14"; bearing rows 500 each side of the pier CL
PD, PB = (330921.799, 6244927.489), dms(130, 3, 14)
UP, NP = U(PB), U(PB - 90)                       # along the pier (towards girder 01) / normal towards abutment A
S1P = {1: 6010, 2: 3607, 3: 1236, 4: -1154, 5: -3536}          # B1 .. B5 (span 1 row): 2403, 2371, 1236 | 1154, 2382 from the datum
S2P = {1: 5556, 2: 3153, 3: 787, 4: -1598, 5: -3974}           # B6 .. B10 (span 2 row): 2403, 2366, 787 | 1598, 2376
PIER_TXT = ("0406 plan SB42 pier 1 headstock: datum CH 589.580 (330921.799, 6244927.489), bearing 130°03'14\"; span-1 row B1..B5 at 2403 + 2371 + 1236 | "
            "1154 + 2382, span-2 row B6..B10 at 2403 + 2366 + 787 | 1598 + 2376 along the pier from the datum, rows 500 either side of the pier CL; "
            "B1 / B6 under girders 01 (bearing angle 'A' 29.81° / 19.86°, 0406 table 2, matches the girder directions of 0301 / 0303)")


def pier_pt(k, span):
    s = (S1P if span == 1 else S2P)[k] / 1000
    n = 0.5 if span == 1 else -0.5
    return PD[0] + s * UP[0] + n * NP[0], PD[1] + s * UP[1] + n * NP[1]


# girders (0702 - 0705): type, X1 overall length at the soffit, bearing from the end at (first support, second support)
GIR = {1: {1: ("F2", 30428, 400, 497), 2: ("F1a", 30811, 400, 498), 3: ("F1b", 31229, 400, 499), 4: ("F1c", 31693, 400, 500), 5: ("F3", 32199, 400, 501)},
       2: {1: ("F5", 23156, 501, 485), 2: ("F4a", 23685, 501, 485), 3: ("F4b", 24247, 501, 485), 4: ("F4c", 24857, 501, 485), 5: ("F6", 25509, 501, 485)}}
GSHEET = {"F1a": "0702", "F1b": "0702", "F1c": "0702", "F2": "0703", "F3": "0703", "F4a": "0704", "F4b": "0704", "F4c": "0704", "F5": "0705", "F6": "0705"}
CHECK = []
for k in range(1, 6):
    for span, ab in ((1, BA), (2, BB)):
        b, E, N, _ = ab[k]
        t, X1, e1, e2 = GIR[span][k]
        L = (X1 - e1 - e2) / 1000
        d = U(b)
        Q = (E + L * d[0], N + L * d[1]) if span == 1 else (E - L * d[0], N - L * d[1])
        Pp = pier_pt(k, span)
        CHECK.append((span, k, t, math.hypot(Q[0] - Pp[0], Q[1] - Pp[1]) * 1000))
print("pier bearing check (abutment bearing + X1 - end distances along the girder vs 0406 dims), mm:",
      ", ".join(f"S{s}-{k:02d} {d:.0f}" for s, k, t, d in CHECK))

# ---------------- deck widths (0805 table: W1 / W2 at 2.5 m along MCR0) ----------------
WT = {557.5: (4.400, None), 560.0: (4.399, 4.400), 562.5: (4.382, 4.400), 565.0: (4.338, 4.400), 567.5: (4.272, 4.397), 570.0: (4.206, 4.366), 572.5: (4.151, 4.307),
      575.0: (4.103, 4.250), 577.5: (4.064, 4.199), 580.0: (4.035, 4.153), 582.5: (4.000, 4.114), 585.0: (4.000, 4.080), 587.5: (4.000, 4.052), 590.0: (4.000, 4.030),
      592.5: (4.000, 4.014), 595.0: (4.000, 4.004), 597.5: (4.000, 4.000), 600.0: (4.000, 4.000), 602.5: (4.000, 4.000), 605.0: (4.000, 4.000), 607.5: (4.000, 4.000),
      610.0: (4.000, 4.000), 612.5: (None, 4.000), 615.0: (None, 4.000)}
FOOT, EDGE = 2.180, 0.400          # 0804 section 11: footpath 2180 ('x') between the left barrier face and the kerb; 400 barrier face to deck edge


def widths(ch0, ch1):
    rows = [(c, w) for c, w in WT.items() if ch0 <= c <= ch1 and w[0] is not None and w[1] is not None]
    # shortcut: the platform takes one deck width per side; the widest station is used (girder outer flanges stay outside the T4 fillet at
    # every end, barrier and lanes slightly outboard = conservative for the edge girders). Upgrade with a per-station deck edge.
    w1 = max(w[0] for _, w in rows)
    w2 = max(w[1] for _, w in rows)
    return round(w1, 3), round(w2, 3), rows


# ---------------- barrier (1006 section 1 for PB-01 .. PB-05, PB-54, PB-55 on sheet 1001) ----------------
# x outward from the inside face (negative = outside), y down from the barrier top (mm); dimensions printed on 1006 section 1 (1:10)
PRE = [(-436, 0), (-53, 0), (0, -495), (-225, -655), (-225, -810), (-396, -810), (-517, -1705), (-606, -1705)]
STI = [(0, -495), (125, -655), (125, -810), (-225, -810), (-225, -655)]
(aP, cP), (aS, cS) = _area_centroid(PRE), _area_centroid(STI)
BW = round((aP + aS) / 1e6 * 25.0, 2)
BXC = -(aP * cP[0] + aS * cS[0]) / (aP + aS) / 1000          # outward from the inside face, m
BW_TXT = (f"1006 section 1 (precast PB, edge-mounted) polygon: top 606 / 170 / 143 / 150 / 90 / 53, 495 + 160 + 155 down to the seat, seat 171 + 225, "
          f"overall 1705; the bottom tip width (89) and the stitch-pour extent (125 from the inside face down to the seat) are read from the 1:10 view; "
          f"precast A = {aP / 1e6:.4f} m2 + stitch A = {aS / 1e6:.4f} m2, x 25 kN/m3 (report table 2-4) = {BW:.2f} kN/m; centroid {BXC * 1000:.0f} mm "
          f"outward of the inside face; twin steel rails and safety / headlight screens not included")

# ---------------- footpath (0804 section 11; 0805 RL table) ----------------
# footpath slab on the deck: RL 'D' at the barrier face, RL 'C' at the carriageway kerb, carriageway 3 % fall; footpath 2 % (0115 section)
FP_TXT = ("raised footpath concrete on the deck slab (0804 section 11, debonded from the deck: 'DEBONDED ZONE BETWEEN FOOTPATH SLAB AND DECK SLAB'); "
          "thickness above the deck surface = RL 'D' - 2 % x 2.180 - RL 'C' + 75 surfacing (0805 table, 2.5 m stations)")


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


# SB42 piles (0201 table 1): id, E, N, toe RL 'A', top RL 'B', ULS, SLS, M ULS, diameter
PILES = {"A": [("A-01", 330956.127, 6244933.480), ("A-02", 330953.908, 6244936.186), ("A-03", 330951.751, 6244938.943), ("A-04", 330949.659, 6244941.748)],
         "P1": [("SB42 P1-01", 330925.090, 6244924.723), ("SB42 P1-02", 330922.411, 6244926.975), ("SB42 P1-03", 330919.732, 6244929.227)],
         "B": [("B-01", 330905.240, 6244912.609), ("B-02", 330900.841, 6244914.987), ("B-03", 330896.382, 6244917.249)]}
PDATA = {"A": dict(toe=-17.2, top=2.1, uls=6606, sls=4686, m=1566, D=900.0, Lf=500), "P1": dict(toe=-13.9, top=1.452, uls=8562, sls=5763, m=4527, D=1200.0, Lf=2000),
         "B": dict(toe=-14.0, top=1.022, uls=5840, sls=4177, m=3652, D=1200.0, Lf=500)}
BRG_RL = {"A": {1: 8.214, 2: 8.321, 3: 8.429, 4: 8.522, 5: 8.607}, "P1-1": {1: 8.542, 2: 8.627, 3: 8.700, 4: 8.761, 5: 8.816},
          "P1-2": {1: 8.550, 2: 8.611, 3: 8.689, 4: 8.745, 5: 8.794}, "B": {1: 8.197, 2: 8.239, 3: 8.299, 4: 8.337, 5: 8.370}}
# 0601 table 1 order: 42-x-01 is the lowest bearing = left (south) of MCR0 on the 3 % fall = girder 42-Sk-01 (left, shortest chord F2 / F5)
BRG_ID = {"A": {k: f"42-A-0{k}" for k in range(1, 6)}, "P1-1": {k: f"42-P1-0{k}" for k in range(1, 6)},
          "P1-2": {k: f"42-P1-{5 + k:02d}" for k in range(1, 6)}, "B": {k: f"42-B-0{k}" for k in range(1, 6)}}
STRANDS = {1: {"A": 2, "C": 6, "D": 12, "E": 12, "F": 8}, 2: {"A": 2, "C": 4, "D": 12, "E": 12, "F": 8}}
DEB = {1: {"C": {1: 2000, 2: 0, 3: 0}, "D": {1: 0, 2: 4000, 3: 0, 4: 4000, 5: 0, 6: 0}, "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}, "F": {2: 7500, 4: 7500, 5: 0, 6: 0}},
       2: {"C": {1: 2000, 2: 0}, "D": {1: 0, 2: 4000, 3: 0, 4: 4000, 5: 0, 6: 0}, "E": {1: 4000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}, "F": {2: 7500, 4: 7500, 5: 0, 6: 0}}}
HOG = {1: [(44, 55, 59, 62, -20, 68.9), (43, 55, 59, 62, -24, 70.4), (44, 55, 60, 62, -25, 70.9), (44, 56, 60, 63, -27, 72.1), (44, 56, 60, 62, -32, 76.2)],
       2: [(28, 37, 40, 42, -6, 52.7), (29, 38, 41, 43, -7, 55.2), (30, 39, 43, 45, -8, 56.4), (31, 40, 44, 46, -9, 57.7), (32, 42, 45, 47, -10, 59.8)]}
FIT = {1: ("F3", 32.199, 60, 35, "0751 girder type F3: 60 bundles G1 1-N16-BZ-150 from each end, 35 bundles G1 1-N16-BZ-300 between"),
       2: ("F6", 25.509, 45, 28, "0753 girder type F6: 45 bundles G1 1-N16-BZ-150 from each end, 28 bundles at 300 between")}

# 0602 table 2 (SB42): epoxy mortar pad corners a1..a4 (east end: A for span 1, P1 for span 2) and b1..b4 (west end), in the row of the
# measured hog equal to the 30-day hog of 0701 (S1: 55 / 55 / 55 / 56 / 56, S2: 37 / 38 / 39 / 40 / 42: the designer's erection hog)
PAD = {1: {1: ((65, 46, 53, 73), (65, 45, 48, 68), 55), 2: ((69, 46, 52, 76), (68, 44, 47, 71), 55), 3: ((63, 46, 52, 69), (62, 44, 47, 64), 55),
           4: ((63, 46, 51, 68), (62, 44, 46, 64), 56), 5: ((60, 46, 50, 65), (59, 44, 46, 61), 56)},
       2: {1: ((66, 49, 44, 61), (73, 56, 46, 63), 37), 2: ((73, 50, 44, 68), (79, 56, 46, 69), 38), 3: ((67, 50, 44, 62), (73, 56, 46, 63), 39),
           4: ((67, 49, 45, 62), (73, 56, 46, 63), 40), 5: ((64, 50, 44, 59), (70, 56, 46, 60), 42)}}
HAUNCH_TXT = ("haunch = deck concrete top - 200 slab - girder top. Deck concrete top = MCR0 design level (0117) - 75 DWS + 3 % x offset (crown right; checks "
              "0805 RL 'A' within 2 mm). Girder top = bearing top RL 'X' (0601 table 1) + epoxy pad (mean of the 4 corners, 0602 table 2, row of the 30-day "
              "hog of 0701) at each end, straight between the ends, + (30-day hog + deck-slab deflection, 0701) x 4t(1-t), + 1515")


def haunch(span, k):
    """Haunch (mm) at t = 0, 0.25, 0.5, 0.75, 1 along girder k of the span (chord between the bearing centres)."""
    if span == 1:
        Pa, Pb, ra, rb = (BA[k][1], BA[k][2]), pier_pt(k, 1), BRG_RL["A"][k], BRG_RL["P1-1"][k]
    else:
        Pa, Pb, ra, rb = pier_pt(k, 2), (BB[k][1], BB[k][2]), BRG_RL["P1-2"][k], BRG_RL["B"][k]
    a, b, hog = PAD[span][k]
    sa, sb = ra + sum(a) / 4000, rb + sum(b) / 4000
    c = (hog + HOG[span][k - 1][4]) / 1000
    out = []
    for t in (0.0, 0.25, 0.5, 0.75, 1.0):
        P = (Pa[0] + t * (Pb[0] - Pa[0]), Pa[1] + t * (Pb[1] - Pa[1]))
        ch, off = station(P[0], P[1], 575 if span == 1 else 600)
        deck = AL.vertical.rl(ch) - 0.075 + 0.03 * off
        out.append((deck - 0.2 - (sa + t * (sb - sa) + c * 4 * t * (1 - t) + 1.515)) * 1000)
    return out


def build(span):
    out, docs = [], {}
    put = put_factory(out, docs)
    s1, s2 = ("A", "P1") if span == 1 else ("P1", "B")
    pid = f"B12461-S{span}"

    # alignment
    for i, r in enumerate(HROWS):
        put(f"alignment.horizontal.rows[{i}]", sheet="0117", view="MCR0 horizontal alignment table", cells=r,
            text=f"HTP{i + 1} CH {HTP[i][0]} ({HTP[i][1]}, {HTP[i][2]}) -> HTP{i + 2} CH {HTP[i + 1][0]}" + (f"; HCEN R {r['radius']:.3f}, curving left" if r["element"] == "arc" else "; bearing out 51°05'27\""))
    vt = "MCR0 vertical: +4.35 % -> crest L 70 IP 571.940 RL 11.134 -> -2.25 % -> sag L 30 IP 649.618 RL 9.386 -> -1.20 %"
    for i, r in enumerate(VROWS):
        if i in (1, 2):
            put(f"alignment.vertical.rows[{i}]", sheet="0117", view="vertical alignment diagram", cells=r, text=vt)
        else:
            put(f"alignment.vertical.rows[{i}]", tag="Calculated", cells=r, formula=vt + f"; end row at the horizontal table end CH {r['ch']}, RL by the grade")
    put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": 3.0, "right": 3.0, "crown_offset": None},
        formula="one-way 3 % fall to the left (south, kerb) across the carriageway: 0805 table e.g. CH 575.000 RL 'B' (right barrier, +W2 4.250) 10.637, "
                "RL 'C' (kerb, -W1 4.103) 10.387: 0.250 / 8.353 = 2.99 %; crown at the right deck edge (set below)")

    # supports
    sup = {}
    for sid in (s1, s2):
        if sid == "A":
            q1, q5 = BA[1], BA[5]
            u = (q5[1] - q1[1], q5[2] - q1[2]); n = math.hypot(*u); u = (u[0] / n, u[1] / n)
            brg = math.degrees(math.atan2(*u)) % 180
            P0 = (q1[1], q1[2])
            txt = (f"abutment A is curved (R 154.089 on the bearing CL, 0300 plan); the platform takes a straight support line through the end bearings B18 "
                   f"({q1[1]}, {q1[2]}) and B14 ({q5[1]}, {q5[2]}) (0301 table 2), bearing {brg:.4f}°; the middle bearings lie up to "
                   f"{max(abs(((BA[k][1] - P0[0]) * u[1] - (BA[k][2] - P0[1]) * u[0])) for k in range(1, 6)) * 1000:.0f} mm off it (girders keep their true lines)")
        elif sid == "B":
            q1, q5 = BB[1], BB[5]
            u = (q5[1] - q1[1], q5[2] - q1[2]); n = math.hypot(*u); u = (u[0] / n, u[1] / n)
            brg = math.degrees(math.atan2(*u)) % 180
            P0 = (q1[1], q1[2])
            txt = (f"line through bearings B20 ({q1[1]}, {q1[2]}) and B24 ({q5[1]}, {q5[2]}) (0303 table 1), bearing {brg:.4f}°; B21-B23 within "
                   f"{max(abs(((BB[k][1] - P0[0]) * u[1] - (BB[k][2] - P0[1]) * u[0])) for k in range(1, 6)) * 1000:.0f} mm of it")
        else:
            u, brg = UP, PB % 180
            P0 = pier_pt(1, span)
            txt = (f"span-{span} bearing row of pier 1: parallel to the pier CL (bearing 130°03'14\") {'500 towards abutment A' if span == 1 else '500 towards abutment B'}; "
                   + PIER_TXT.split(';')[0])
        guess = {"A": 558.4, "P1": 589.6, "B": 613.4}[sid]
        ch = cross(P0, u, guess)
        sup[sid] = {"P0": P0, "u": U(brg), "brg": brg, "ch": ch}           # the engine's support direction: (sin, cos) of the bearing mod 180
        put(f"alignment.support_lines.rows[{0 if sid == s1 else 1}]", tag="Calculated", cells={"support": sid, "ch": round(ch, 4), "bearing": round(brg, 5)},
            formula=txt + f"; ch = where it crosses MCR0 = {ch:.4f}")

    # deck
    ch0, ch1 = sup[s1]["ch"], sup[s2]["ch"]
    w1, w2, rows = widths(ch0, ch1)
    WTXT = (f"0805 table W1 / W2 (radial): the widest of the {len(rows)} stations CH {rows[0][0]} .. {rows[-1][0]} in span {span}: W1 {w1}, W2 {w2} "
            f"(W1 {min(r[1][0] for r in rows)} .. {max(r[1][0] for r in rows)}, W2 {min(r[1][1] for r in rows)} .. {max(r[1][1] for r in rows)}); "
            "0804 section 11: 400 | footpath 2180 | W1 | MCR0 | W2")
    CL, CR = -(w1 + FOOT), w2
    put("deck.carriageway_left", round(CL, 3), unit="m", tag="Calculated", inputs=[],
        formula="left barrier inside face = -(W1 + 2180): the footpath is behind a kerb only, inside the barriers; the report counts SB42 design lanes on the width "
                "between the external barriers (10180 .. 10980 / 3.2 = 3 lanes, report §2, 0101); " + WTXT)
    put("deck.carriageway_right", round(CR, 3), unit="m", tag="Calculated", formula="right barrier inside face = W2; " + WTXT, inputs=[])
    put("deck.edge_left", round(CL - EDGE, 3), unit="m", tag="Calculated", formula="barrier inside face - 400 (0804 section 11)", inputs=["deck.carriageway_left"])
    put("deck.edge_right", round(CR + EDGE, 3), unit="m", tag="Calculated", formula="barrier inside face + 400 (0804 section 11, symmetric)", inputs=["deck.carriageway_right"])
    out[[i for i, e in enumerate(out) if e["path"] == "alignment.crossfall.rows[0]"][0]]["cells"]["crown_offset"] = round(CR + EDGE, 3)
    put("deck.slab_thickness", 200.0, unit="mm", sheet="0115", view="section 6 bridge SB42", text="200 MIN deck slab (deeper on the crest; up to 335 incl. DWS)")
    put("deck.surfacing_thickness", 75.0, unit="mm", sheet="0804", view="section 42", text="75 THICK BITUMINOUS WEARING SURFACE AND WATERPROOF MEMBRANE")
    put("deck.surfacing_density", 22.0, unit="kN/m3", sheet="RPT", view="table 2-5", text="asphalt surfacing 22 kN/m3")
    put("deck.girders_follow_crossfall", True, sheet="0804", view="section 11", text="girders shown square to the 3 % fall")
    HN = {k: haunch(span, k) for k in range(1, 6)}
    offA = {}
    for k in range(1, 6):
        Pa = (BA[k][1], BA[k][2]) if span == 1 else pier_pt(k, 2)
        offA[k] = station(Pa[0], Pa[1], 575 if span == 1 else 600)[1]
    for k in range(1, 6):
        h = HN[k]
        hm = (h[0] + 4 * h[1] + 2 * h[2] + 4 * h[3] + h[4]) / 12          # Simpson over the 5 stations
        sp = [abs(offA[k] - offA[j]) for j in (k - 1, k + 1) if 1 <= j <= 5]
        bt = sum(sp) / len(sp)
        w = round(hm / 1000 * bt * 25.0, 3)
        put(f"deck.haunch_concrete.rows[{k - 1}]", tag="Calculated", cells={"girder": f"42-S{span}-0{k}", "w": w},
            formula=HAUNCH_TXT + f"; haunch at t = 0 / .25 / .5 / .75 / 1: {' / '.join(f'{x:.0f}' for x in h)} mm, mean {hm:.0f} mm, over the girder spacing "
                    f"{bt:.3f} m x 25 kN/m3 = {w} kN/m. Uncertainty: the hog at the deck pour (0701 gives 30 / 60 / 100 days; +/- about 5 mm)")
    HAUNCH_MID = {k: HN[k][2] for k in range(1, 6)}
    for b, face in (("left", CL), ("right", CR)):
        p = f"deck.barriers[barrier_{b}]"
        put(p + ".side", b, sheet="0804", view="section 11")
        put(p + ".type", "precast edge barrier (PB-01 .. PB-05 / PB-54, PB-55), medium performance, with twin steel rail", sheet="1001", view="barrier schedule",
            text="MEDIUM PERFORMANCE TRAFFIC BARRIER WITH TWIN STEEL RAIL (0115)")
        put(p + ".height", 1255.0, unit="mm", sheet="1006", view="section 1", text="805 + 495 - 45 above the deck surface (rails above not included)",
            note="height above the surfacing scaled from the 495 / 160 / 155 dimensions; used for wind area only")
        put(p + ".weight", BW, unit="kN/m", tag="Calculated", formula=BW_TXT, inputs=[])
        put(p + ".solid", True, sheet="1006", view="section 1", text="solid precast unit")
        put(p + ".offset", round(face - BXC if b == "left" else face + BXC, 4), unit="m", tag="Calculated", inputs=[f"deck.carriageway_{b}"],
            formula=f"inside face {face:+.3f} {'-' if b == 'left' else '+'} centroid {BXC * 1000:.0f} mm outward; " + BW_TXT.split(';')[0])
    # footpath slab: SDL line load (Calculated from 0805 RLs)
    # raised footpath: RL 'D' (footpath top at the barrier face) - RL 'C' (deck concrete top at the kerb) = 0.264 .. 0.271 (0805 table; 'A' is the deck
    # concrete top: design surface 10.595 - 75 DWS = 10.520 vs RL 'A' 10.518 at CH 590); mean depth over 2.180 = (D - C) - 2 % x 1.09 + 3 % x 1.09
    dc = [round(10.651 - 10.387, 3), 0.265, 0.264, 0.271]
    tf = sum(dc) / len(dc) - 0.02 * 1.09 + 0.03 * 1.09
    wf = round(tf * FOOT * 25.0, 2)
    p = "deck.barriers[footpath]"
    put(p + ".side", "left", sheet="0804", view="section 11", text="footpath 2180 ('x') on the left")
    put(p + ".type", "raised footpath concrete (not a barrier), debonded from the deck slab", sheet="0804", view="plan deck concrete",
        text="DEBONDED ZONE BETWEEN FOOTPATH SLAB AND DECK SLAB")
    put(p + ".height", round(tf * 1000, 0), unit="mm", tag="Calculated", formula="mean footpath depth above the deck concrete (see weight)")
    put(p + ".weight", wf, unit="kN/m", tag="Calculated", inputs=[],
        formula=f"{FP_TXT.split(';')[0]}; RL 'D' - RL 'C' = {', '.join(f'{x:.3f}' for x in dc)} along the deck (0805 table); mean depth = {sum(dc) / len(dc):.3f} "
                f"- 2 % x 1.09 (footpath fall) + 3 % x 1.09 (deck fall continued under it) = {tf:.3f} m; x 2.180 x 25 kN/m3 = {wf} kN/m; drainage pits not deducted")
    put(p + ".solid", False, tag="Model", note="footpath slab: not a wind-exposed solid barrier")
    put(p + ".offset", round(CL + FOOT / 2, 4), unit="m", tag="Calculated", inputs=["deck.carriageway_left"], formula="footpath centre: left barrier face + 2180 / 2")

    # superstructure
    put("superstructure.type", "super-t", sheet="0700", view="girder layout plan", text="1515 DEEP SUPER-T (0115)")
    put("superstructure.spans", 1, tag="Model", note=f"span {span} of 2 modelled on its own (ADR-062): girders simply supported, link slab over the pier not modelled")
    offs = {}
    for k in range(1, 6):
        g = f"42-S{span}-0{k}"; p = f"superstructure.members[{g}]"
        t, X1, e1, e2 = GIR[span][k]
        ends = {}
        for sid, which in ((s1, 0), (s2, 1)):
            if sid == "A":
                b, E, N, lab = BA[k]; pt = (E, N); src = f"0301 table 2 {lab} ({E}, {N})"
                gdir = U(b)
            elif sid == "B":
                b, E, N, lab = BB[k]; pt = (E, N); src = f"0303 table 1 {lab} ({E}, {N})"
                gdir = U(b)
            else:
                pt = pier_pt(k, span); src = f"pier 1 row {'B1..B5' if span == 1 else 'B6..B10'}: {(S1P if span == 1 else S2P)[k]:+d} along the pier, 500 off its CL"
                gdir = None
            ends[sid] = (pt, src, gdir)
        # girder line = true chord between the two bearing centres; bearing on the support line = chord x support line (exact for straight rows)
        Pa, Pb = ends[s1][0], ends[s2][0]
        d = (Pb[0] - Pa[0], Pb[1] - Pa[1]); L = math.hypot(*d); d = (d[0] / L, d[1] / L)
        for sid in (s1, s2):
            S = sup[sid]
            hit = line_hit(Pa, d, S["P0"], S["u"])
            ch, off = station(hit[0], hit[1], S["ch"])
            offs[(k, sid)] = off
            shift = math.hypot(hit[0] - ends[sid][0][0], hit[1] - ends[sid][0][1]) * 1000
            put(p + ".line_offset_" + ("A" if sid == s1 else "B"), round(off, 4), unit="m", tag="Calculated",
                formula=f"bearing {ends[sid][1]}; girder chord {s1}-{s2} crossed with the {sid} support line ({shift:.0f} mm from the bearing centre), "
                        f"stationed on MCR0: ch {ch:.3f}, offset right +")
        put(p + ".length", X1 / 1000, unit="m", sheet=GSHEET[t], view=f"plan girder type {t}", text=f"OVERALL LENGTH ALONG CL GIRDER {X1} (MEASURED AT THE SOFFIT)",
            note=f"chord between the bearing centres {L:.3f} m vs X1 - {e1} - {e2} = {(X1 - e1 - e2) / 1000:.3f} m")
        put(p + ".bearing_offset_A", e1, unit="mm", sheet=GSHEET[t], view=f"plan girder type {t}", text=f"CL bearing {e1} from the girder end")
        put(p + ".bearing_offset_B", e2, unit="mm", sheet=GSHEET[t], view=f"plan girder type {t}", text=f"CL bearing {e2} from the girder end")
        put(p + ".straight", True, tag="Model", note="precast girders straight between bearings")
        put(p + ".type_ref", "ST1", tag="Model", note=f"one Super-T type per span (strand schedule 0724 is per span); girder {t}: edge-flange details not distinguished")
    for k in range(1, 6):
        lo = (abs(offs[(k, s1)] - offs[(k - 1, s1)]) if k > 1 else None)
        hi = (abs(offs[(k + 1, s1)] - offs[(k, s1)]) if k < 5 else None)
        if lo and hi:
            put(f"superstructure.members[42-S{span}-0{k}].flange_edges.rows[0]", tag="Calculated", cells={"t": 0.0, "left": round((lo * 1000 - 20) / 2, 1), "right": round((hi * 1000 - 20) / 2, 1)},
                formula="flange tips 'VARIES' (0717): (girder spacing at the first support - 20 NOM gap (0807 typical detail)) / 2 each side")
    put("superstructure.flange_gap", 20.0, unit="mm", sheet="0807", view="typical detail of gap between girders", text="20 NOM. GAP GIRDER FLANGE (TYP)")
    put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="edge girder outer flange tip to deck edge not dimensioned (radial edge 'VARIES', 0703 / 0705)")
    for i, sid in enumerate((s1, s2)):
        put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": sid, "width": 800.0, "depth": 1265.0, "concrete": "deck (40 MPa)"},
            formula="cast-in-place end cross girder; width 800 as the girder end detail (end bearing 400 / 500 from the girder end: not dimensioned for SB42, query); "
                    "depth 1065 (0702 elevation, cast-in-place contact face) + 200 slab", inputs=["deck.slab_thickness"],
            note="cross girder width not dimensioned on the sheets read (query)")
    T = "superstructure.supert_types[ST1]"
    put(T + ".section", "lib:supert/T4", tag="Standard-verify", note="1515 deep Super-T (TfNSW T4 family)")
    put(T + ".depth", 1515, unit="mm", sheet="0722", view="typical Super-T girder section", text="1515")
    for i, (kk, nm, v, un) in enumerate((("D", "Overall depth", 1515, "mm"), ("bw", "Soffit width", 757, "mm"), ("tw", "Web thickness", 100, "mm"),
                                         ("d1", "Void floor fall", 58, "mm"), ("d2", "Bottom flange depth at CL", 265, "mm"), ("ttf", "Top flange thickness", 90, "mm"))):
        put(T + f".shape.rows[{i}]", sheet="0722", view="typical Super-T girder section", text=f"{v}", cells={"key": kk, "name": nm, "value": v, "unit": un})
    put(T + ".shape.rows[6]", tag="Standard-verify", cells={"key": "S", "name": "Web slope (V : H)", "value": 10.556, "unit": ""}, note="10.556 : 1 printed (0722)")
    put(T + ".concrete_28d", 60, unit="MPa", sheet="0700", view="general notes", text="MINIMUM 28 DAY COMPRESSIVE STRENGTH OF CONCRETE SHALL BE 60 MPa FOR GIRDERS F1 TO F12")
    put(T + ".concrete_transfer", 40, unit="MPa", sheet="0700", view="general notes", text="40 MPa AT TRANSFER OF PRESTRESS FOR GIRDERS F1 TO F12")
    for i, e in enumerate("AB"):
        put(T + f".zones.rows[{i}]", tag="Calculated", cells={"from": 0.0, "to": 1.5, "kind": "solid_end_" + e},
            formula="end of the void: 2000 to the first void diaphragm less 500 (0702 - 0705 plan); the solid end block is not dimensioned (query)")
    kmin = min(HAUNCH_MID, key=HAUNCH_MID.get)
    put(T + ".haunch", round(HAUNCH_MID[kmin]), unit="mm", tag="Calculated",
        formula=HAUNCH_TXT + f"; one section type per span: the smallest mid-span haunch (girder 0{kmin}; all girders "
                f"{', '.join(f'0{k} {v:.0f}' for k, v in HAUNCH_MID.items())} mm), conservative for strength")
    X = {kk: 25 + 50 * (6 - kk) for kk in range(1, 7)}           # 0724 strand layout: locations 1-6 at 25 + 5 x 50 each side of the CL
    Y = {"F": 60, "E": 110, "D": 160, "C": 210, "B": 260}
    st = [(1435.0, s * 495.0, 0.0, "A") for s in (-1, 1)]
    for r, locs in DEB[span].items():
        for loc, deb in locs.items():
            st += [(float(Y[r]), s * X[loc], float(deb), r) for s in (-1, 1)]
    want = sum(STRANDS[span].values())
    assert len(st) == want, (len(st), want)
    for i, (y, x, deb, r) in enumerate(sorted(st, key=lambda q: (q[0], q[1]))):
        put(T + f".strand_pattern.rows[{i}]", sheet="0724", view=f"strand debonding schedule for girders 42-S{span}-01 to 42-S{span}-05",
            text="rows F-B at 60 + 4 x 50; locations 1-6 at 25 + 5 x 50 each side; row A loc 7 at ±495, 80 below the top; debonded both ends",
            cells={"y": y, "x": float(x), "diameter": 15.7, "debond_left": deb, "debond_right": deb, "on": True}, note=f"row {r}")
    put(T + ".jacking_ratio", round(209 / 279, 4), tag="Calculated", unit="", formula="force after release of the jack 209 kN / MBL 279 kN (0700 prestressing notes)")
    ft, Lf, ne, nc, ftxt = FIT[span]
    a = (Lf - 2 * ne * 0.15 - nc * 0.3) / 2
    for i, (a_, b_, sp) in enumerate(((a, a + ne * 0.15, 150.0), (a + ne * 0.15, a + ne * 0.15 + nc * 0.3, 300.0), (a + ne * 0.15 + nc * 0.3, Lf - a, 150.0))):
        put(T + f".fitments.rows[{i}]", tag="Calculated", cells={"from": round(a_, 3), "to": round(b_, 3), "diameter": 16.0, "legs": 2, "spacing": sp},
            formula=f"{ftxt}; X1 {Lf}: remainder {a:.3f} m at each end; the critical (edge, longest) girder of the span; other girder types differ by a few bundles")
    for i, face in enumerate(("top", "bot")):
        put(T + f".deck_bars.rows[{i}]", tag="Calculated", cells={"face": face, "diameter": 16.0, "spacing": 150.0, "cover": 61.0},
            formula="N16-S-150 NF / FF longitudinal (0856 deck reinforcement); cover 45 (0801 notes, as SB01) + transverse N16 = 61 (query: SB42 deck cover not read)",
            inputs=["deck.slab_thickness"])
    hg = HOG[span]
    put("custom.girder_hog_table", tag="Direct", sheet="0701", view="calculated hog of girders at bridge SB42", unit="mm",
        value={f"42-S{span}-0{k}": {"transfer": h[0], "30_days": h[1], "60_days": h[2], "100_days": h[3], "deck_slab_deflection": h[4], "mass_t": h[5]} for k, h in enumerate(hg, 1)})
    put("custom.girder_hog_basis", "density 2550 kg/m3; E at transfer 32,800 MPa (F1-F12); elevated temperature curing at 70 °C for 8 hours after casting; girder self weight only",
        sheet="0700", view="prestressing notes")
    put("custom.strand_MBL", 279, unit="kN", sheet="0700", view="prestressing notes"); put("custom.strand_force_after_release", 209, unit="kN", sheet="0700", view="prestressing notes")

    # bearings (0601 table 1, 0603)
    for sid in (s1, s2):
        key = sid if sid != "P1" else f"P1-{span}"
        for k in range(1, 6):
            bid = BRG_ID[key][k]; p = f"bearings.items[{bid}]"
            put(p + ".support", sid, tag="Model", note=f"bearing {bid} on support {sid}")
            put(p + ".member", f"42-S{span}-0{k}", tag="Model", note=f"bearing {bid} under girder 42-S{span}-0{k} (0600 bearing layout plan)")
            put(p + ".type", "elastomeric", sheet="0603", view="laminated elastomeric bearing", text="AS5100.4 PART No AS070910R (70 No REQUIRED)")
            put(p + ".plan_a", 380, unit="mm", sheet="0603", view="plan laminated elastomeric bearing", text="380")
            put(p + ".plan_b", 480, unit="mm", sheet="0603", view="plan laminated elastomeric bearing", text="480")
            put(p + ".bearing_height", 157, unit="mm", sheet="0603", view="elevation", text="157")
            put(p + ".top_rl", BRG_RL[key][k], unit="m", sheet="0601", view="table 1 bridge No B12461 (SB42) bearing levels", text=f"{bid} type A RL 'X' {BRG_RL[key][k]}",
                note="abutment B columns are headed 'PIER 4' in the table (query)" if sid == "B" else None)
            for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
                put(p + "." + f, tag="Missing-Flagged", unit="MPa" if f == "shear_modulus" else "mm", note="catalogue part AS070910R; layers / G not printed")
            put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: mortar pad + epoxy block per measured hog (0602 table 2)")
            put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric; buffer bearings at the abutments (0300) — idealisation for the engineer")
            put(p + ".restraint_transverse", tag="Missing-Flagged", note="lateral restraint blocks (0300 / 0405) — idealisation for the engineer")
    put("custom.bearing_part_no", "AS070910R", sheet="0603", view="plan laminated elastomeric bearing")

    # supports
    for sid in (s1, s2):
        p = f"supports[{sid}]"
        S = sup[sid]
        if sid == "P1":
            put(p + ".kind", "pier", tag="Model",
                note="SB42 pier 1: 1650 thick blade wall 13.7 m long (0405), RL ~1.70 to ~8.4, on 3 Ø1200 bored piles; modelled as a sill at the pile heads (the wall's "
                     "own weight and stiffness are not in the model: pier pile axial is completed in compare_report.py)")
            n = 0.5 if span == 1 else -0.5
            front, back = (825 - 500, -(825 + 500)) if span == 1 else (825 - 500, -(825 + 500))
            put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 1650.0, "depth": 1500.0, "length": 13.7},
                formula="blade wall 1650 thick, 13700 long (0405 / 0406 plan: 7025 + 5025 + 2 x R 825 ends); depth = the bottom wall panel P-01 1500 (0405 elevation): "
                        "the sill element only (the wall above is not modelled)")
            put(p + ".headstock_setout.rows[0]", tag="Calculated", cells={"edge": "front", "value": 325.0}, formula="wall face 825 from the pier CL, bearing row 500 from it: 325 on the span side")
            put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -1325.0}, formula="825 + 500 behind the bearing row")
            sh = ((S["P0"][0] - PD[0] - n * NP[0]) * UP[0] + (S["P0"][1] - PD[1] - n * NP[1]) * UP[1])
            hit = AL.point(S["ch"]); t0 = ((hit[0] - PD[0]) * UP[0] + (hit[1] - PD[1]) * UP[1])
            for j, (edge, v) in enumerate((("start", -5.85), ("end", 7.85))):
                put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round((v - t0) * 1000, 0)},
                    formula=f"wall end {v:+.3f} m from the datum along the pier (0406: 5025 + 825 / 7025 + 825), measured from where the support line crosses MCR0 "
                            f"({t0:+.3f} m from the datum); + = towards girder 01")
        else:
            q = BA if sid == "A" else BB
            put(p + ".kind", "spill-through abutment", tag="Model",
                note=("abutment A: curved headstock on Ø900 column extensions over Ø900 bored piles inside a reinforced soil wall (0300 / 0301 section 1); the SB42 "
                      "part carried by piles A-01 .. A-04") if sid == "A" else "abutment B (0302 / 0303): headstock on bored piles; sheets not fully read")
            if sid == "A":
                put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": 2175.0, "depth": 1200.0, "length": None},
                    formula="0301 section 1: 725 in front of the bearing CL + 550 + 350 + 550 behind = 2175; depth 1200 below the seat (curtain wall above not included)")
                put(p + ".headstock_setout.rows[0]", sheet="0301", view="section 1", text="725 bearing CL to the front face", cells={"edge": "front", "value": 725.0})
                put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -1450.0}, formula="550 + 350 + 550 behind the bearing CL (0301 section 1)")
                # SB42 segment ends: SOP 10 / SOP 11 (0301 table 1, front face corners)
                hit = AL.point(S["ch"])
                ends = sorted(((E - hit[0]) * S["u"][0] + (N - hit[1]) * S["u"][1], lab, E, N) for lab, E, N in (("SOP 11", 330954.946, 6244932.398), ("SOP 10", 330947.060, 6244942.626)))
                for j, (edge, (v, lab, E, N)) in enumerate(zip(("start", "end"), ends)):
                    put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                        formula=f"{lab} ({E}, {N}) (0301 table 1, front-face corner of the SB42 part) projected on the support line from its MCR0 crossing")
            else:
                C0 = (330900.514, 6244915.158)          # CL of abutment B on MCR0 (0302 plan, CH 614.198)
                dB = abs((C0[0] - S["P0"][0]) * S["u"][1] - (C0[1] - S["P0"][1]) * S["u"][0])
                put(p + ".headstock.rows[0]", sheet="0303", view="sections 9 / 10", text="headstock 2100 wide, 1000 deep on Ø1200 columns",
                    cells={"width": 2100.0, "depth": 1000.0, "length": None})
                put(p + ".headstock_setout.rows[0]", tag="Calculated", cells={"edge": "front", "value": round(1050 - dB * 1000, 0)},
                    formula=f"headstock 2100 centred on the CL of abutment B (0303 sections 9 / 10); bearing line B20-B24 {dB * 1000:.0f} mm in front of the CL "
                            f"(CL through CH 614.198 (330900.514, 6244915.158), 0302 plan): 1050 - {dB * 1000:.0f}")
                put(p + ".headstock_setout.rows[1]", tag="Calculated", cells={"edge": "back", "value": -round(1050 + dB * 1000, 0)}, formula=f"1050 + {dB * 1000:.0f} behind the bearing line")
                hit = AL.point(S["ch"])
                ends = sorted(((E - hit[0]) * S["u"][0] + (N - hit[1]) * S["u"][1], lab, E, N) for lab, E, N in (("SOP 1", 330908.044, 6244912.227), ("SOP 2", 330896.579, 6244918.321)))
                for j, (edge, (v, lab, E, N)) in enumerate(zip(("start", "end"), ends)):
                    put(p + f".headstock_setout.rows[{2 + j}]", tag="Calculated", cells={"edge": edge, "value": round(v * 1000, 0)},
                        formula=f"{lab} ({E}, {N}) (0303 table 2, SB42 part of the headstock) projected on the support line from its MCR0 crossing")
        put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "see report §5 / geotechnical interpretive report"}, note="soil springs not in the copy supplied")
        put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="reinforced soil wall; 22 kN/m3 compacted soil (report table 2-4)")
        put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="not given")
        put(p + ".curtain_wall.rows[0]", tag="Missing-Flagged", cells={}, note="not modelled")
        if sid in PILES:
            dd = PDATA[sid]
            for pid_, E, N in PILES[sid]:
                q = p + f".piles[{pid_}]"
                put(q + ".E", E, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} EASTING {E}")
                put(q + ".N", N, unit="m", sheet="0201", view="table 1 pile data", text=f"{pid_} NORTHING {N}")
                put(q + ".diameter", dd["D"], unit="mm", sheet="0201", view="table 1 pile data", text=f"PILE DIAMETER {dd['D']:.0f}")
                put(q + ".rl_top", dd["top"], unit="m", sheet="0201", view="table 1 pile data", text=f"TOP OF PILE RL 'B' {dd['top']}",
                    note={"A": "abutment A: Ø900 column extension from the pile top to the headstock soffit (~RL 7) is not modelled",
                          "B": "abutment B: Ø1200 columns B-C1.. from the pile cap to the headstock (~RL 6.9) are not modelled",
                          "P1": "the blade wall from the pile cap to the bearing seat (~6.7 m) is not modelled"}[sid])
                put(q + ".rl_toe", dd["toe"], unit="m", sheet="0201", view="table 1 pile data", text=f"ANTICIPATED FOUNDING LEVEL RL 'A' {dd['toe']}")
                put(q + ".rl_rock", round(dd["toe"] + dd["Lf"] / 1000, 3), unit="m", tag="Calculated",
                    formula=f"top of the founding material = founding level RL 'A' {dd['toe']} + minimum embedment 'Lf' {dd['Lf']} mm (0201 table 1)")
                put(q + ".design_actions.rows[0]", sheet="0201", view="table 1 pile data", text="DESIGN MAXIMUM AXIAL COMPRESSION LOAD AT TOP OF PILE SLS",
                    cells={"limit_state": "SLS", "N": float(dd["sls"])})
                put(q + ".design_actions.rows[1]", sheet="0201", view="table 1 pile data", text="ULS axial / DESIGN MAXIMUM BENDING MOMENT ULS",
                    cells={"limit_state": "ULS", "N": float(dd["uls"]), "M": float(dd["m"])})

    # materials
    for i, (el, fc, sheet, txt, E_, dens) in enumerate((("Super-T girders", 60.0, "0700", "60 MPa", 36500.0, 26.0), ("deck", 40.0, "0801", "40 MPa", 32800.0, 25.0),
                                                       ("piles", 40.0, "0250", "40 MPa", 32800.0, 25.0), ("abutments", 40.0, "0301", "40 MPa", 32800.0, 25.0))):
        put(f"materials.concrete.rows[{i}]", sheet=sheet, view="general notes",
            text=f"{txt} ({sheet}); E {E_:.0f} (report table 2-1); density {dens} kN/m3 (report table 2-4)", cells={"element": el, "fc": fc, "E": E_, "density": dens},
            note="girder density: report 26.0 kN/m3 vs 0700 hog basis 2550 kg/m3 (query)" if dens == 26.0 else None)
    put("materials.strand.rows[0]", sheet="RPT", view="table 2-3", text="15.7 mm 7 wire ordinary relax 2, A 150, MBL 279 kN, fp 1860, E 195 GPa",
        cells={"type": "15.7 mm 7-wire ordinary, relax 2", "diameter": 15.7, "fpb": 1860.0, "area": 150.0, "Ep": 195000.0})
    put("materials.reinforcement.rows[0]", sheet="RPT", view="table 2-2", text="D500N 500 MPa, E 200,000", cells={"grade": "D500N", "fsy": 500.0, "Es": 200000.0})
    put("custom.sdl_line_loads", tag="Missing-Flagged",
        note="safety / headlight screens (1150 / 1151) and utilities: not quantified yet (the raised footpath is deck.barriers[footpath])")

    # loads
    put("loads.traffic_models.rows[0]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "M1600", "on": True})
    put("loads.traffic_models.rows[1]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "S1600", "on": True})
    put("loads.traffic_models.rows[2]", sheet="RPT", view="§2 road traffic loads", text="HLP400 ... within ±1.0m either side of the centreline of carriageway (SB41 EB and SB42)",
        cells={"model": "HLP400", "on": True})
    put("loads.traffic_models.rows[3]", sheet="RPT", view="§2 road traffic loads", text="the accompanying lane factor taken for both the HLP400 loading and one half of the SM1600 loading has been taken as 1.0",
        cells={"model": "HLP400_with_half_M1600", "on": True})
    put("loads.design_speed", 10, unit="km/h", sheet="0101", view="HLP400 loading", text="HLP400 at 10 km/h",
        note="road design speed not read; 10 km/h is the HLP400 crossing speed (query)")
    for kk, un in (("braking_force", "kN"), ("traffic_surcharge", "kPa"), ("shrinkage_creep_shortening", "1e-6")):
        put("loads." + kk, tag="Missing-Flagged", unit=un, note="AS 5100.2 method stated in the report; value not printed")
    put("loads.wind.rows[0]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (ULS) 48m/s", cells={"item": "V_uls", "value": 48.0, "unit": "m/s"})
    put("loads.wind.rows[1]", sheet="RPT", view="§2 wind loads", text="Regional wind speed (SLS) 37m/s", cells={"item": "V_sls", "value": 37.0, "unit": "m/s"})
    put("loads.wind.rows[2]", sheet="RPT", view="§2 wind loads", text="design speed of 35m/s ... for ULS combination PE + Road traffic load", cells={"item": "V_with_traffic", "value": 35.0, "unit": "m/s"})
    for i, it in enumerate(("air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 3):
        put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 section 17 stated; values not printed")
    for i, (it, v) in enumerate((("kp", "1.7"), ("Z", "0.08"), ("site_class", "De"))):
        put(f"loads.earthquake.rows[{i}]", sheet="0101", view="earthquake loading", text=f"{it} {v} (BEDC-4)", cells={"item": it, "value": v})
    put("loads.earthquake.rows[3]", tag="Missing-Flagged", cells={"item": "Rf"}, note="µ 1.0 longitudinal / 1.5 transverse for SB42 (0101); Rf not printed")
    put("loads.earthquake.rows[4]", tag="Missing-Flagged", cells={"item": "zeta"}, note="not printed")
    put("loads.earthquake.rows[5]", tag="Missing-Flagged", cells={"item": "vertical"}, note="not stated")
    for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
        put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 (report); values not printed")
    for gname in ("gradient_positive", "gradient_negative"):
        for i in range(13):
            put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note="AS 5100.2 differential temperature stated; values not printed")
    put("custom.design_lanes", 3, sheet="RPT", view="§2 road traffic loads", text="Number of design lanes for ... SB42 is 3 lanes")
    put("custom.differential_settlement", 10, unit="mm", sheet="RPT", view="§2 differential settlement", text="differential settlements ... limited to 10 mm")
    put("custom.wind_region", "A2", sheet="RPT", view="§2 wind loads")

    # prestress losses / design options / analysis settings (as SB01 / SB02)
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
    put("design.girder_options.rows[8]", tag="Missing-Flagged", cells={"item": "aggregate_size"},
        note="0700: 'MINIMUM AGGREGATE SIZE IN ACCORDANCE WITH TfNSW SPECIFICATION D&C B80' - no number on the drawings (shear / torsion needs it)")
    for i, (it, v_) in enumerate((("useN", "true"), ("kuoLim", "true"), ("tend", '"sc"'), ("k1p", "0.4"), ("dsh", "true"), ("torsion_tie_legs", "1")), 2):
        put(f"design.girder_options.rows[{i}]", tag="Model", cells={"item": it, "value": v_}, note="design option, as BR13A / B12626 / SB02")
    for i, (it, v, why) in enumerate((("tgt", "2.8", "transverse member spacing target (m)"), ("merge", "0.4", "node merge tolerance (m)"), ("midgap", "1", "mid-gap lines"),
                                      ("model", "2", "integrated model"), ("girder_J_factor", "1.0", "Super-T torsion factor (ADR-041)"),
                                      ("deck_top_reference", "1", "nodes at the deck top (ADR-043)"))):
        put(f"analysis.grillage.rows[{i}]", tag="Model", cells={"item": it, "value": v}, note=why + ", as BR13A")
    for kk, v, un, why in (("bearing_fixed_stiffness", 1e7, "kN/m", "rigid idealisation"), ("pile_toe", "vertical only", None, "as BR13A"),
                           ("column_segment", 1.0, "m", "piles split to about 1 m"), ("soil_factor", 1, None, "sensitivity factor"), ("modes", 30, None, "response spectrum modes")):
        put("analysis." + kk, v, tag="Model", unit=un, note=why)

    fn = os.path.join(H, f"{pid}_description_values.json")
    json.dump({"origin": "owner drawing set SGWS1-JHSW-2000-BR-DRG-COMBINED.pdf (255 sheets) + report RPT-410001 rev D, 2026-11-09",
               "documents": sorted(docs.values(), key=lambda d: d["id"]), "values": out}, open(fn, "w"), indent=1, ensure_ascii=False)
    print(pid, len(out), "values;", "supports", {s: round(c["ch"], 4) for s, c in sup.items()}, "W1/W2", (w1, w2))
    return fn


if __name__ == "__main__":
    print(BW_TXT)
    for s in (1, 2):
        build(s)
