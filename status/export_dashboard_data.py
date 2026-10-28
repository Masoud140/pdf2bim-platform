#!/usr/bin/env python3
"""Export the data behind the online progress dashboard (claude.ai artifact "PDF2BIM Platform Progress").

    python3 status/export_dashboard_data.py OUT_DIR

Writes one JSON array of row objects per dataset. Progress rows are curated here from ROADMAP / CURRENT_STATUS /
the MIDAS COMPARISON.md files (update them when a stage changes); bridge geometry is computed from the repository:
BR13A from the platform's integrated model, B12626 from projects/B12626/extraction/B12626_values.json.
"""
import json, math, os, sys
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
put = lambda name, rows: json.dump(rows, open(os.path.join(OUT, name + ".json"), "w"), indent=0, ensure_ascii=False)

# ---------------- progress (curated) ----------------
stages = [
    ("P0", "Architecture, rules, baseline, data format, standards framework", "Done", "awaiting owner review"),
    ("P1", "Geometry engine (alignment, support lines, girders, piles)", "Done", "BR13A geometry accepted for development (ADR-040)"),
    ("P2", "Sections and Super-T product library", "Done", "library values code-extracted, unverified"),
    ("P3", "Model builder, solver, loads, combinations, MIDAS export", "Done", "MIDAS import + results verified 2026-10-28"),
    ("P4", "Structural verification and design checks", "In progress", "fitments and torsion approach wait for the owner"),
    ("P5", "Extraction and decision workflow", "Done", "first pass; visual second pass with P6"),
    ("P6", "Second bridge B12626 from PDFs", "In progress", "chain runs to MIDAS on provisional inputs"),
    ("P7", "Web application and planks", "Not started", ""),
]
put("stages", [{"stage": s, "goal": g, "status": st, "note": n, "order": i} for i, (s, g, st, n) in enumerate(stages)])

M = [  # stage, milestone, status, date, evidence
    ("P0", "P0.1 BR13A regression baseline (953 quantities, two identical runs)", "Done", "2026-10-23", "baseline/BR13A"),
    ("P0", "P0.2 Bridge format 0.2: originals, overrides, hash", "Done", "2026-10-24", "ADR-017, 47 tests"),
    ("P0", "P0.3 Standards data framework (63 entries, none approved)", "Done", "2026-10-24", "ADR-019, 28 tests"),
    ("P1", "Geometry engine from the bridge description", "Done", "2026-10-24", "ADR-020, 36 tests"),
    ("P2", "Super-T sections: open / solid zones, composite, torsion", "Done", "2026-10-24", "ADR-021, 24 tests"),
    ("P3", "Superstructure grillage + Python solver", "Done", "2026-10-24", "ADR-022"),
    ("P3", "Integrated substructure, SDL, modes, MIDAS .mct writer", "Done", "2026-10-24", "ADR-023 / 024"),
    ("P3", "Traffic M1600 / S1600", "Done", "2026-10-24", "ADR-025"),
    ("P3", "Thermal, braking, earth pressure, wind, earthquake", "Done", "2026-10-25", "ADR-026"),
    ("P3", "AS 5100.2 combinations", "Done", "2026-10-25", "ADR-027"),
    ("P3", "MIDAS drawing: circular piles, slab strips, composite girders", "Done", "2026-10-28", "X-3"),
    ("P3", "Deck-top reference with member offsets (solver + MIDAS)", "Done", "2026-10-28", "ADR-043, D-48"),
    ("P3", "Cross girders only between Super-Ts", "Done", "2026-10-28", "ADR-044"),
    ("P3", "MIDAS run: self weight + 17 static cases match", "Done", "2026-10-28", "midas_run_2026-10-28b"),
    ("P3", "MIDAS run: temperature, shrinkage, 171 combination rows match", "Done", "2026-10-28", "midas_run_2026-10-28c / e"),
    ("P3", "MIDAS run: earthquake spectrum cases match (lumped XYZ mass)", "Done", "2026-10-28", "ADR-046, run g"),
    ("P3", "Traffic moving-load export to MIDAS", "Not started", "", "deferred until after P6"),
    ("P4", "Concurrent traffic actions and combinations", "Done", "2026-10-25", "ADR-029 / 030"),
    ("P4", "Signed earthquake and pile resultants", "Done", "2026-10-25", "ADR-031 (method to confirm)"),
    ("P4", "Girder flexure, SLS, losses, minimum strength", "Done", "2026-10-25", "ADR-032 to 035"),
    ("P4", "Shear / torsion at stations, solid-end shear", "Done", "2026-10-26", "ADR-039 / 041"),
    ("P4", "Fitment schedule from drawings", "Waiting on owner", "", "D-45 Assumed"),
    ("P4", "Torsion design approach confirmed", "Waiting on owner", "", "P4-6"),
    ("P5", "Run records, Query Register, takeoff import, decision tool", "Done", "2026-10-25", "ADR-037 / 038"),
    ("P5", "Extraction first pass (text layer)", "Done", "2026-10-25", "P5_METHOD §5"),
    ("P6", "B12626 drawing-set survey (72 sheets)", "Done", "2026-10-28", "SURVEY.md"),
    ("P6", "Stage 2a: alignment, girders, bearing lines, piles", "Done", "2026-10-28", "e58a39f"),
    ("P6", "Stage 2b: flanges, bearings, abutments, barriers, materials, loads", "Done", "2026-10-28", "6c37989"),
    ("P6", "Stage 3a: generic new-description tool; B12626 description (0.2)", "Done", "2026-10-28", "0925c1a, ADR-047"),
    ("P6", "Stage 3b: unchanged chain runs to the MIDAS .mct (provisional D-1); 7 generality gaps fixed", "Done", "2026-10-28", "8781004, P6_SECOND_BRIDGE.md"),
    ("P6", "Traffic and combinations on B12626; compare pile actions with drawing 109035", "Next", "", ""),
    ("P7", "Web application, API, users; precast planks", "Not started", "", ""),
]
put("milestones", [{"id": "M%02d" % i, "stage": s, "milestone": m, "status": st, "date": d, "evidence": e} for i, (s, m, st, d, e) in enumerate(M, 1)])

# MIDAS verification (BR13A): worst element-force difference per case, run c table + run g earthquake
mid = [("SW", 0.48), ("SDL", 0.50), ("EP", 0.49), ("EPTA", 0.19), ("EPTB", 0.26), ("BRKp", 0.13), ("BRKm", 0.13), ("CEN", 0.77),
       ("WTp", 0.87), ("WTm", 0.87), ("WTVp", 1.20), ("WTVm", 1.20), ("WVUp", 0.51), ("WVUm", 0.60), ("WVDp", 0.51), ("WVDm", 0.60),
       ("WLp", 0.17), ("WLm", 0.17), ("TUp", 0.98), ("TUm", 0.98), ("SCR", 0.98), ("TGP", 3.40), ("TGN", 3.40)]
grp = lambda c: "Earthquake" if c.startswith("EQ") else "Temperature" if c[0] in "T" or c == "SCR" else "Wind" if c[0] == "W" else "Dead / horizontal"
rows = [{"case": c, "group": grp(c), "diff_pct": p, "run": "2026-10-28c"} for c, p in mid]
rows += [{"case": "EQ_L", "group": "Earthquake", "diff_pct": 0.4, "run": "2026-10-28g"}, {"case": "EQ_T", "group": "Earthquake", "diff_pct": 0.9, "run": "2026-10-28g"}]
put("midas_checks", rows)

open_items = [
    ("B12626", "Median girders: 1160 flanges at 2269 spacing overlap 51 mm; no trimmed flange drawn", "High", "Owner"),
    ("B12626", "RL 9.493 printed as both design surface and top of concrete at the same point", "Medium", "Owner"),
    ("B12626", "Alignment table typos: HTP2 northing, bearing in", "Low", "Owner"),
    ("B12626", "Bearing elastomer layers / shear modulus not printed (catalogue part)", "Medium", "Owner"),
    ("B12626", "Temperature, shrinkage, braking, surcharge not on drawings (design report)", "Medium", "Owner"),
    ("BR13A", "Torsion stiffness / design approach for Super-T shear (u up to 2.8)", "High", "Owner"),
    ("BR13A", "Fitment schedule (D-45 Assumed)", "High", "Owner"),
    ("BR13A", "Spectrum site class Be: MIDAS 'Be' equals platform Ae row", "Medium", "Owner"),
    ("BR13A", "Confirm XYZ Loads-to-Masses token on next MIDAS import", "Low", "Owner"),
    ("Platform", "Standards entries code-extracted, none approved", "High", "Owner / reviewer"),
    ("Platform", "Old dashboard traffic layout understates G3 / G4 and outer bearings (H-4)", "High", "Owner"),
]
put("open_items", [{"id": "Q%02d" % i, "bridge": b, "item": t, "severity": s, "with": w} for i, (b, t, s, w) in enumerate(open_items, 1)])

tests = [("test_solver", 13, 13), ("test_builder", 20, 20), ("test_substructure", 39, 39), ("test_mct", 21, 22), ("test_midas_run", 4, 4), ("test_format_0_2", 48, 48),
         ("test_b12626_chain", 10, 10), ("test_new_description", 7, 7), ("test_loads", 25, 25), ("test_combinations", 35, 35)]
put("tests", [{"suite": s, "passed": p, "total": t, "date": "2026-10-28"} for s, p, t in tests])

V = json.load(open(os.path.join(ROOT, "projects/B12626/extraction/B12626_values.json")))
c = Counter((r["path"].split(".")[0].split("[")[0], r["tag"]) for r in V)
put("b12626_tags", [{"group": g, "tag": t, "count": n} for (g, t), n in sorted(c.items())])

# ---------------- B12626 plan + section (drawing values) ----------------
val = {r["path"]: r["value"] for r in V}
E0, N0, E40, N40 = 379693.511, 6369956.998, 379717.771, 6369988.801
L = math.hypot(E40 - E0, N40 - N0); u = ((E40 - E0) / L, (N40 - N0) / L); nR = (u[1], -u[0])
loc = lambda E, N: ((E - E0) * u[0] + (N - N0) * u[1], (E - E0) * nR[0] + (N - N0) * nR[1])   # (deck ch, offset right of setout line)
sop = {"A": (379696.813, 6369961.333), "B": (379713.250, 6369982.879)}
b = math.radians(127 + 20 / 60 + 15 / 3600); dB = (math.sin(b), math.cos(b))
P = []
seg = lambda kind, label, p, q: P.append({"kind": kind, "label": label, "x1": round(p[0], 3), "y1": round(p[1], 3), "x2": round(q[0], 3), "y2": round(q[1], 3)})
at = lambda s, o: loc(sop[s][0] + o * dB[0], sop[s][1] + o * dB[1])
seg("setout", "Deck setout line", (0, 0), (40, 0))
gs = sorted({k.split("[")[1].split("]")[0] for k in val if k.startswith("superstructure.members[")})
offs = {g: val["superstructure.members[%s].line_offset_A" % g] for g in gs}
for g in gs:
    a, bb = at("A", offs[g]), at("B", offs[g])
    d = ((bb[0] - a[0]) / math.dist(a, bb), (bb[1] - a[1]) / math.dist(a, bb))
    seg("girder", g, (a[0] - .4 * d[0], a[1] - .4 * d[1]), (bb[0] + .4 * d[0], bb[1] + .4 * d[1]))
lo, hi = min(offs.values()) - 1.6, max(offs.values()) + 1.6
for s in "AB":
    seg("bearing_line", "Bearing line " + s, at(s, lo), at(s, hi))
oA = at("A", 0)[1]                      # MC10 / SOP offset from the setout line (deck offsets are from MC10)
for side, k in (("left", "deck.edge_left"), ("right", "deck.edge_right")):
    seg("deck_edge", "Deck edge " + side, (5.0, val[k] + oA), (33.0, val[k] + oA))
for s, ch in (("A", 5.0), ("B", 33.0)):   # end of superstructure, deck setout ch (109301)
    seg("deck_end", "End of deck " + s, (ch, val["deck.edge_left"] + oA), (ch, val["deck.edge_right"] + oA))
for k, v in val.items():
    if k.endswith(".E") and ".piles[" in k:
        pid = k.split("piles[")[1].split("]")[0]
        x, y = loc(v, val[k[:-2] + ".N"])
        P.append({"kind": "pile", "label": "Pile " + pid, "x1": round(x, 3), "y1": round(y, 3), "x2": None, "y2": None})
put("b12626_plan", P)

from pdf2bim.sections.supert import resolve_params, outline
p, _ = resolve_params("T3", {"D": 1215})
sec = []
crown, slab = 1.813, 0.2
deck = lambda o: -0.03 * abs(o - crown)             # deck top level relative to the crown (3 % falls)
for g in gs:
    o = offs[g]
    w = [(o + x / 1000, deck(o) - slab - (1215 - y) / 1000) for x, y in outline(p, 1160, 1160, "open")[0]]
    sec.append({"kind": "girder", "label": g, "pts": json.dumps([[round(a, 4), round(c, 4)] for a, c in w])})
el, er = val["deck.edge_left"], val["deck.edge_right"]
top = [(el, deck(el)), (crown, 0.0), (er, deck(er))]
sec.append({"kind": "slab", "label": "Deck slab 200", "pts": json.dumps([[round(a, 4), round(c, 4)] for a, c in top + [(x, y - slab) for x, y in reversed(top)]])})
for nm, o, h in (("Barrier left", val["deck.carriageway_left"], 1.4), ("Barrier right", val["deck.carriageway_right"], 1.4), ("Median barrier", crown, 1.0)):
    sec.append({"kind": "barrier", "label": nm, "pts": json.dumps([[o, round(deck(o), 4)], [o, round(deck(o) + h, 4)]])})
put("b12626_section", sec)

# ---------------- B12626 3D (schematic solids; x = deck ch, y = offset right of the setout line, z = RL AHD) ----------------
F = []
face = lambda grp, label, pts: F.append({"group": grp, "label": label, "pts": json.dumps([[round(a, 3) for a in p] for p in pts])})


def prism(grp, label, sec2d, a, b):
    """Extrude a closed 2D section (local u = across, v = up) from 3D point a to b; u is horizontal and square to a->b."""
    dx, dy = b[0] - a[0], b[1] - a[1]; L_ = math.hypot(dx, dy); ux, uy = dy / L_, -dx / L_      # right of the run direction
    P_ = lambda o, u_, v: (o[0] + u_ * ux, o[1] + u_ * uy, o[2] + v)
    A_ = [P_(a, u_, v) for u_, v in sec2d]; B_ = [P_(b, u_, v) for u_, v in sec2d]
    n = len(sec2d)
    for i in range(n):
        j = (i + 1) % n
        face(grp, label, [A_[i], A_[j], B_[j], B_[i]])
    face(grp, label, A_); face(grp, label, B_[::-1])


rl = {s: {val["bearings.items[%s-%02d].member" % (s, k)]: val["bearings.items[%s-%02d].top_rl" % (s, k)] for k in range(1, 11)} for s in "AB"}
gsec = [(x / 1000, y / 1000) for x, y in outline(p, 1160, 1160, "solid")[0]]   # (u right, v up from the soffit), m
top_at = {}
for g in gs:
    a, bb = at("A", offs[g]), at("B", offs[g])
    d = ((bb[0] - a[0]) / math.dist(a, bb), (bb[1] - a[1]) / math.dist(a, bb))
    zA, zB = rl["A"][g], rl["B"][g]; gr = (zB - zA) / math.dist(a, bb)
    pa = (a[0] - .4 * d[0], a[1] - .4 * d[1], zA - .4 * gr); pb = (bb[0] + .4 * d[0], bb[1] + .4 * d[1], zB + .4 * gr)
    prism("girder", g, [(-u_, v) for u_, v in gsec], pa, pb)          # u flipped: outline x is to the right looking up-chainage
    top_at[g] = (a, bb, zA + 1.215, zB + 1.215)
yc = crown + oA
# crown deck-top RL at each end: mean over girders of girder top + slab, lifted to the crown by the 3 % fall (haunch not modelled)
zc = {s: sum(top_at[g][2 if s == "A" else 3] + slab + 0.03 * abs(offs[g] - crown) for g in gs) / len(gs) for s in "AB"}
yl, yr = val["deck.edge_left"] + oA, val["deck.edge_right"] + oA
zt = lambda x, y: zc["A"] + (zc["B"] - zc["A"]) * (x - 5.4493) / 27.1 - 0.03 * abs(y - yc)
for x0, x1 in ((5.0, 33.0),):
    for ya, yb in ((yl, yc), (yc, yr)):
        top4 = [(x0, ya, zt(x0, ya)), (x1, ya, zt(x1, ya)), (x1, yb, zt(x1, yb)), (x0, yb, zt(x0, yb))]
        bot4 = [(q[0], q[1], q[2] - slab) for q in top4]
        face("slab", "Deck slab", top4); face("slab", "Deck slab", bot4[::-1])
        for i in range(4):
            j = (i + 1) % 4
            face("slab", "Deck slab", [top4[i], top4[j], bot4[j], bot4[i]])
for nm, yb_, w_, h_, base in (("Barrier left", val["deck.carriageway_left"] + oA, 0.4, 1.4, -0.2), ("Barrier right", val["deck.carriageway_right"] + oA, 0.4, 1.4, -0.2),
                              ("Median barrier", yc, 0.6, 1.0, 0.0)):
    if "Median" in nm:      # 109303 detail D outline, simplified to base 600 / top 210
        sec_ = [(-0.3, 0), (0.3, 0), (0.105, 1.0), (-0.105, 1.0)]
    else:                   # outer precast unit: schematic block, 400 wide outside the carriageway line, 1400 tall, base 200 below the deck top
        o_ = -w_ if nm.endswith("left") else 0.0
        sec_ = [(o_, base), (o_ + w_, base), (o_ + w_, base + h_), (o_, base + h_)]
    za, zb_ = zt(5.0, yb_), zt(33.0, yb_)
    prism("barrier", nm, [(-u_, v) for u_, v in sec_], (5.0, yb_, za), (33.0, yb_, zb_))
for s in "AB":   # sills: 1350 wide (front 500 / back 850 about the bearing line), depth below the seat; seat = mean RL X - 0.115 bearing
    seat = sum(rl[s].values()) / 10 - 0.115
    dep = val["supports[%s].headstock.depth" % s] / 1000
    xb = at(s, 0)[0]; sgn = 1 if s == "A" else -1
    xf, xk = xb + sgn * 0.5, xb - sgn * 0.85
    box = [(xk, yl), (xf, yl), (xf, yr), (xk, yr)]
    tp = [(x, y, seat) for x, y in box]; bt = [(x, y, seat - dep) for x, y in box]
    face("sill", "Sill " + s, tp); face("sill", "Sill " + s, bt[::-1])
    for i in range(4):
        j = (i + 1) % 4
        face("sill", "Sill " + s, [tp[i], tp[j], bt[j], bt[i]])
for k, v in val.items():
    if k.endswith(".E") and ".piles[" in k:
        base_ = k[:-2]; x, y = loc(v, val[base_ + ".N"]); r_ = val[base_ + ".diameter"] / 2000
        ztop, ztoe = val[base_ + ".rl_top"], val[base_ + ".rl_toe"]
        ring = [(x + r_ * math.cos(t * math.pi / 4), y + r_ * math.sin(t * math.pi / 4)) for t in range(8)]
        for i in range(8):
            j = (i + 1) % 8
            face("pile", "Pile " + base_.split("piles[")[1][:-1], [(*ring[i], ztop), (*ring[j], ztop), (*ring[j], ztoe), (*ring[i], ztoe)])
        face("pile", "Pile", [(*q, ztop) for q in ring])
put("b12626_3d", F)

# ---------------- BR13A integrated model (platform) ----------------
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from standards.accessor import Standards
doc = json.load(open(os.path.join(ROOT, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc); S = build_sections(doc, geo); Mo = build_integrated(doc, geo, S, Standards())
mm = Mo["model"]
import numpy as np
cen = np.mean(np.array(list(mm.nodes.values())), axis=0)
nd = {k: np.asarray(v) - cen for k, v in mm.nodes.items()}
put("br13a_model", [{"element": e, "role": bm["role"], "x1": round(float(nd[bm["n1"]][0]), 3), "y1": round(float(nd[bm["n1"]][1]), 3),
                     "z1": round(float(nd[bm["n1"]][2]), 3), "x2": round(float(nd[bm["n2"]][0]), 3), "y2": round(float(nd[bm["n2"]][1]), 3),
                     "z2": round(float(nd[bm["n2"]][2]), 3)} for e, bm in mm.beams.items()])
print("written to", OUT, sorted(os.listdir(OUT)))
