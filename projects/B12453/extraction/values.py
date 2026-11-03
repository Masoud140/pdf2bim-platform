#!/usr/bin/env python3
"""B12453 (SB02, Sydney Gateway SB-1520): extracted values -> new-description input (P8 stage 2).

    python3 projects/B12453/extraction/values.py      # -> B12453_description_values.json
    python3 tools/new_description.py projects/B12453/extraction/B12453_description_values.json --out projects/B12453/B12453.bridge.0.2.json

Sources: drawing set SGWS1-JHSW-1000-BR-DRG-0001xx..0019xx (DS2021/000504) and design report SGWS1-JHSW-1000-BR-RPT-000001
rev E (owner files, not in the repository). Drawing values govern where the two differ (queries in SURVEY.md §4 / Q-list
below). Coordinates are MGA zone 56 on control line MCD0 (no local origin). Offsets: metres, right of MCD0 looking up
chainage positive (the deck lies mostly on the LEFT = eastern side). Distances printed along the skewed support line are
converted to offsets square to MCD0 with sin(84.575°) (0305: M° = 84.575°), arithmetic shown in each derivation."""
import json, math, os

H = os.path.dirname(os.path.abspath(__file__))
P = "SGWS1-JHSW-1000-BR-DRG-"
docs, out = {}, []


def doc(n):
    if n == "RPT":
        docs["RPT-000001"] = {"id": "RPT-000001", "number": "SGWS1-JHSW-1000-BR-RPT-000001", "revision": "E", "kind": "report", "title": "Bridge design report"}
        return "RPT-000001"
    did = "DRG-" + n
    docs[did] = {"id": did, "number": P + "000" + n if len(n) == 3 else P + "00" + n, "revision": "-", "kind": "drawing"}
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


SIN = math.sin(math.radians(84.575))

# ---------------- project ----------------
put("project.name", "Sydney Gateway Stage 1 - three bridges on Airport Drive over Main Road No 183: SB02", sheet="0101", view="title block")
put("project.bridge_id", "B12453", sheet="0101", view="title block", text="SB02 BRIDGE No: B12453")
put("project.client", "Transport for NSW", sheet="0101", view="title block")
put("project.designer", "BG&E Structural for John Holland Seymour Whyte (JHSW)", sheet="0101", view="title block")
put("project.drawing_set", "DS2021/000504", sheet="0101", view="title block")
put("project.revision", "E (0101); sheets B-E", sheet="0101", view="title block")
put("project.status", "Final design documentation", sheet="0101", view="title block")
put("project.datum_horizontal", "MGA zone 56 (GDA94)", sheet="0101", view="title block")
put("project.datum_vertical", "AHD", sheet="0101", view="title block")
put("project.importance_level", tag="Missing-Flagged", note="BEDC-4 'essential for post-earthquake recovery' (0101, report 2.4.7); no importance level printed")
put("project.design_life", 100, unit="years", sheet="RPT", view="table 2-10", text="primary bridge structural elements 100")
put("project.base_point.rows[0]", tag="Model", cells={"name": "MCT local origin = MCD0 HTP1 ch 153.303 (0111)", "E": 331514.993, "N": 6245413.620},
    note="MIDAS file origin only; the description stays in MGA")

# ---------------- alignment (0111 MCD0 tables) ----------------
put("alignment.control_line", "CONTROL LINE MCD0", sheet="0111", view="horizontal alignment - control line MCD0")
L_h = math.hypot(331427.512 - 331514.993, 6245328.694 - 6245413.620)
put("alignment.horizontal.rows[0]", sheet="0111", view="horizontal alignment table MCD0", text="HTP1 153.303 E 331514.993 N 6245413.620; HTP2 275.227 bearing out 225°50'57.4\"",
    cells={"element": "tangent", "ch_start": 153.303, "length": 121.924, "E_start": 331514.993, "N_start": 6245413.620},
    note=f"straight: HTP1 to HTP2 chord {L_h:.4f} m vs chainage difference 121.924")
put("alignment.horizontal.rows[1]", sheet="0111", view="horizontal alignment table MCD0", cells={"element": "tangent", "ch_start": 275.227, "E_start": 331427.512, "N_start": 6245328.694})
put("alignment.vertical.rows[0]", sheet="0111", view="vertical alignment diagram MCD0", text="TP CH 53.699 RL 6.489, 6.00%", cells={"ch": 53.699, "RL": 6.489, "grade_out": 6.0})
put("alignment.vertical.rows[1]", tag="Calculated", cells={"ch": 131.343, "RL": 11.148, "grade_in": 6.0, "grade_out": -0.5, "curve_length": 155.289},
    formula="IP CH 131.343 RL 11.148, grades +6.00% / -0.50% (0111 diagram); curve length = TP 208.988 - TP 53.699 = 155.289; check: IP RL = 6.489 + 0.06 x 77.644 = 11.148")
put("alignment.vertical.rows[2]", sheet="0111", view="vertical alignment diagram MCD0", text="TP CH 208.988 RL 10.762, -0.50%", cells={"ch": 208.988, "RL": 10.762, "grade_in": -0.5})
put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": 3.0, "right": 3.0, "crown_offset": 1.4},
    formula="one-way 3% fall to the left (0113 section 1 / 0701 section 1): 0703 table 4 ch 163.169 RL1 (MCD0) 10.551, RL2 (6.000 left) 10.373 = -2.97%, "
            "RL3 (1.000 right) 10.580 = +2.9%; crown placed at the right deck edge (1.000 + 0.400) so the whole deck falls left", inputs=["deck.edge_right"])
for i, (s, ch, brg) in enumerate((("A", 163.643, 141.2786), ("B", 196.283, 141.2764))):
    put(f"alignment.support_lines.rows[{i}]", sheet="0305" if s == "A" else "0306", view=f"plan abutment {s}2",
        text=f"SOP CH {ch}; bearing {'141°16′43″' if s == 'A' else '321°16′35″ (= 141°16′35″)'}; 5.433° skew TYP",
        cells={"support": s, "ch": ch, "skew": 5.433, "bearing": brg})

# ---------------- deck ----------------
put("deck.carriageway_left", -6.0, unit="m", sheet="0701", view="section 1 bridge SB02", text="6000 (6027 skew) barrier setout to MCD0")
put("deck.carriageway_right", 1.0, unit="m", sheet="0701", view="section 1 bridge SB02", text="1000 (1005 skew)")
put("deck.edge_left", -6.4, unit="m", tag="Calculated", formula="barrier setout 6.000 left (0701) + 400 to the deck edge (0706 detail A)", inputs=["deck.carriageway_left"])
put("deck.edge_right", 1.4, unit="m", tag="Calculated", formula="barrier setout 1.000 right (0701) + 400 (0706 detail A); deck width 7.8 m = report table 4-1", inputs=["deck.carriageway_right"])
put("deck.slab_thickness", 200.0, unit="mm", sheet="0701", view="section 1", text="MIN 200 THICK CONCRETE DECK")
put("deck.surfacing_thickness", 75.0, unit="mm", sheet="0701", view="section 1", text="75 THICK BITUMINOUS WEARING SURFACE")
put("deck.surfacing_density", 22.0, unit="kN/m3", sheet="RPT", view="table 2-5", text="asphalt surfacing 22 kN/m3")
put("deck.end_gap", 50.0, unit="mm", sheet="0111", view="elevation bridge SB02", text="50 GAP")
put("deck.girders_follow_crossfall", True, sheet="0113", view="section 1", text="girders shown square to the 3% fall")
for b, side in (("left", "left"), ("right", "right")):
    p = f"deck.barriers[barrier_{b}]"
    put(p + ".side", side, sheet="0113", view="section 1")
    put(p + ".type", "precast concrete parapet, medium performance level, with twin steel rails", sheet="0113", view="section 1",
        text="MEDIUM PERFORMANCE LEVEL PRECAST CONCRETE TRAFFIC BARRIER WITH TWIN STEEL RAIL")
    put(p + ".height", 1250.0, unit="mm", sheet="0902", view="type PB-1 inside elevation", text="1250 precast unit; rails above not included")
    put(p + ".weight", round(4.27 * 9.80665 / 4.768, 2), unit="kN/m", tag="Calculated",
        formula="type PB-1 approximate mass 4.27 t / 4.768 m (0902 plan, inside face) x 9.80665 = 8.78 kN/m; twin steel rails not included")
    put(p + ".solid", True, sheet="0902", view="type PB-1", text="solid precast concrete unit")
    put(p + ".offset", tag="Missing-Flagged", unit="m", note="barrier centroid line not dimensioned; inside face at the setout line, base 561 wide outward (0902)")

# ---------------- superstructure ----------------
put("superstructure.type", "super-t", sheet="0600", view="girder layout plan", text="1515 DEEP SUPER-T")
put("superstructure.spans", 1, sheet="0111", view="elevation bridge SB02")
G = {"G02-01": 5.419, "G02-02": 3.445, "G02-03": 1.481, "G02-04": -0.473}     # along the support line from the SOP, + = left (0305 / 0306)
for g, d in G.items():
    p = f"superstructure.members[{g}]"
    off = round(-d * SIN, 4)
    for s in "AB":
        put(p + ".line_offset_" + s, off, unit="m", tag="Calculated",
            formula=f"bearing {abs(d):.3f} {'left' if d > 0 else 'right'} of the SOP along the support line (0305 A2 / 0306 B2 plans, the same at both) "
                    f"x sin(84.575°) = {abs(off):.4f} square to MCD0; right +")
    put(p + ".length", 33.441, unit="m", sheet="0602" if g == "G02-01" else ("0603" if g == "G02-04" else "0601"), view="table girders dimensions",
        text="02-0x X1 = 33441 overall length along girder CL (soffit)")
    for s in "AB":
        put(p + ".bearing_offset_" + s, 400, unit="mm", sheet="0601", view="plan girder type F1", text="CL bearing 400 from the girder end")
    put(p + ".straight", True, tag="Model", note="precast girders straight between bearings")
    put(p + ".type_ref", "ST1", tag="Model", note="one cross-section and strand layout for all four (0606 / 0608); F2 / F3 differ in edge details only")
gs = sorted(G, key=lambda k: -G[k])          # left to right: 02-01 ... 02-04
offs = [-G[k] * SIN for k in gs]
for i, g in enumerate(gs):
    rows = {}
    for side, j in (("left", i - 1), ("right", i + 1)):
        if 0 <= j < len(gs):
            sp = abs(offs[j] - offs[i]) * 1000
            rows[side] = round((sp - 20) / 2, 1)
    cells = {"t": 0.0, "left": rows.get("left"), "right": rows.get("right")}
    if None in cells.values():
        continue          # edge flange: Missing (below)
    put(f"superstructure.members[{g}].flange_edges.rows[0]", tag="Calculated", cells=cells,
        formula="flange tips 'VARIES' (0606): (spacing - 20 NOM gap (0701 detail C)) / 2 each side; spacings from the bearing offsets")
put("superstructure.flange_gap", 20.0, unit="mm", sheet="0701", view="detail C", text="20 NOM GAP")
put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="edge girder outer flange tip to deck edge not dimensioned (0606 'VARIES'; 0706 detail A)")
for i, s in enumerate("AB"):
    put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": s, "width": 800.0, "depth": 1265.0, "concrete": "deck (40 MPa)"},
        formula="width 800 (0706 section 2); depth: W = 1065 for SB02 (0601 table 1; 0706 '1065 (for bridges SB01 & SB02)') below the slab + 200 slab = 1265 (reading to confirm)",
        inputs=["deck.slab_thickness"])
T = "superstructure.supert_types[ST1]"
put(T + ".section", "lib:supert/T4", tag="Standard-verify", note="1515 deep Super-T (TfNSW T4 family), as BR13A")
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
# strands (0608): x = 25 + 50 (6 - loc), rows F..B at 60 + 50 k, row A at 1515 - 80, x 495
X = {k: 25 + 50 * (6 - k) for k in range(1, 7)}
ROWS = {"B": (260, {1: 0}), "C": (210, {1: 8000, 2: 0, 3: 2000, 4: 0, 5: 12000, 6: 0}), "D": (160, {1: 0, 2: 6000, 3: 0, 4: 4000, 5: 0, 6: 0}),
        "E": (110, {1: 2000, 2: 0, 3: 2000, 4: 0, 5: 4000, 6: 0}), "F": (60, {2: 2000, 4: 2000, 5: 0, 6: 0})}
st = [(1435.0, s * 495.0, 0.0, "A") for s in (-1, 1)]
for r, (y, locs) in ROWS.items():
    for loc, deb in locs.items():
        st += [(float(y), s * X[loc], float(deb), r) for s in (-1, 1)]
assert len(st) == 48
for i, (y, x, deb, r) in enumerate(sorted(st, key=lambda q: (q[0], q[1]))):
    put(T + f".strand_pattern.rows[{i}]", sheet="0608", view="strand layout + debonding schedule",
        text="rows F-B at 60 + 4 x 50; locations 1-6 at 25 + 5 x 50 each side; row A loc 7 at ±495, 80 below the top; debonded both ends",
        cells={"y": y, "x": float(x), "diameter": 15.7, "debond_left": deb, "debond_right": deb, "on": True}, note=f"row {r}")
put(T + ".jacking_ratio", round(209 / 279, 4), tag="Calculated", unit="",
    formula="force remaining in each strand immediately after release of the jack 209 kN / MBL 279 kN (0600 prestressing notes)")
for i, (a_, b_, sp) in enumerate(((1.5, 11.55, 150.0), (11.55, 21.891, 300.0), (21.891, 31.941, 150.0))):
    put(T + f".fitments.rows[{i}]", tag="Calculated", cells={"from": a_, "to": b_, "diameter": 16.0, "legs": 2, "spacing": sp},
        formula="0650 / 0651: 67 bundles of G1 1-N16-BZ / G8 2-N16-V at 150 from each end after the 1500 end diaphragm (67 x 0.15 = 10.05), "
                "36 bundles G27 / G29 2-N16-V at 300 in the centre (36 x 0.3 = 10.8 printed; the centre zone takes the remainder of 33.441: 10.341)")
for i, face in enumerate(("top", "bot")):
    put(T + f".deck_bars.rows[{i}]", tag="Calculated", cells={"face": face, "diameter": 16.0, "spacing": 150.0, "cover": 61.0},
        formula="D32 52-N16-S-150 NF / D33 52-N16-S-150 FF longitudinal (0751 plan SB02); cover 45 to the nearest bar (0750 notes) + transverse N16 = 61",
        inputs=["deck.slab_thickness"])
put("custom.girder_hog_table", tag="Direct", sheet="0600", view="calculated hog of girders",
    value={"girders": "02-01 .. 02-04", "transfer": 57, "28_days": 74, "60_days": 78, "100_days": 80, "deck_slab_deflection": -27, "mass_t": 58.2}, unit="mm")
put("custom.girder_hog_basis", "density 2550 kg/m3; E at transfer 32,800 MPa; elevated temperature curing at 70 °C for 8 hours after casting; girder self weight only",
    sheet="0600", view="prestressing notes")
put("custom.girder_density_drawing", 2550, unit="kg/m3", sheet="0600", view="prestressing notes / lifting", text="DENSITY = 2550kg/m3")
put("custom.strand_MBL", 279, unit="kN", sheet="0600", view="prestressing notes"); put("custom.strand_force_after_release", 209, unit="kN", sheet="0600", view="prestressing notes")
put("custom.steam_curing_age_at_loading", 7, unit="days", sheet="RPT", view="§2.4.9 shrinkage and creep",
    text="for precast elements subject to accelerated ageing such as steam curing, the age at first loading for k3 shall be 7 days (TMR)")

# ---------------- bearings (0500 table 1, 0503) ----------------
for s, rls in (("A", (8.527, 8.587, 8.645, 8.698)), ("B", (8.758, 8.820, 8.880, 8.936))):
    for k, g in enumerate(("G02-01", "G02-02", "G02-03", "G02-04")):
        p = f"bearings.items[{s}-{k + 1:02d}]"
        put(p + ".support", s, tag="Model", note=f"bearing {s}02-0{k + 1} on abutment {s}2")
        put(p + ".member", g, tag="Model", note=f"bearing {s}02-0{k + 1} under girder {g[1:]} (0500 / 0600 numbering)")
        put(p + ".type", "elastomeric", sheet="0503", view="laminated elastomeric bearing", text="AS5100.4 part No AS [50] 070910R")
        put(p + ".plan_a", 380, unit="mm", sheet="0503", view="plan laminated elastomeric bearing", text="380 (direction of traffic)")
        put(p + ".plan_b", 480, unit="mm", sheet="0503", view="plan laminated elastomeric bearing", text="480")
        put(p + ".bearing_height", 157, unit="mm", sheet="0503", view="elevation", text="157")
        put(p + ".top_rl", rls[k], unit="m", sheet="0500", view="table 1 bearing data", text=f"{s}02-0{k + 1} RL 'X' {rls[k]}")
        for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
            put(p + "." + f, tag="Missing-Flagged", unit="MPa" if f == "shear_modulus" else "mm", note="catalogue part AS [50] 070910R; layers / G not printed")
        put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: mortar pad + epoxy block per measured hog (0502 table 2)")
        put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric; buffer bearing behind each girder, 30 mm gap (report 4.1.3) — idealisation for the engineer")
        put(p + ".restraint_transverse", tag="Missing-Flagged", note="lateral restraint block at 2.454 along the support line (0305), HDPE plates — idealisation for the engineer")
put("custom.bearing_part_no", "AS [50] 070910R", sheet="0503", view="plan laminated elastomeric bearing")

# ---------------- supports (0305 A2, 0306 B2, 0201 pile table, report 5.3) ----------------
SUP = {"A": {"sop": (331507.574, 6245406.418), "brg": 141.2786, "front": 779, "back": 571, "start": -(128 + 1332), "end": 6375 + 128, "sheet": "0305",
             "seat": (8.524, 8.306), "soffit": (7.308, 7.081), "piles": {"A-01": (5.411, 7.143), "A-02": (2.511, 7.227), "A-03": (-0.389, 7.311)}, "toe": -11.5,
             "dA": {"SLS": 2713, "ULS": 3524, "M": 2049}},
       "B": {"sop": (331484.155, 6245383.682), "brg": 141.2764, "front": 807, "back": 543, "start": -1483, "end": 502 + 6352, "sheet": "0306",
             "seat": (8.540, 8.767), "soffit": (7.315, 7.552), "piles": {"B-01": (5.411, 7.374), "B-02": (2.511, 7.461), "B-03": (-0.389, 7.549)}, "toe": -13.5,
             "dA": {"SLS": 2885, "ULS": 3524, "M": 2031}}}
for s, c in SUP.items():
    p = f"supports[{s}]"
    put(p + ".kind", "spill-through abutment", tag="Model",
        note="catalogue class nearest to 0113 section 1: cast-in-place abutment sill beam on 3 sleeved Ø1050 bored piles inside a reinforced soil wall block")
    dep = round(((c["seat"][0] - c["soffit"][0]) + (c["seat"][1] - c["soffit"][1])) / 2 * 1000)
    put(p + ".headstock.rows[0]", tag="Calculated", cells={"width": float(c["front"] + c["back"]), "depth": float(dep), "length": round((c["end"] - c["start"]) / 1000, 3)},
        formula=f"width {c['back']} + {c['front']} about the bearing line ({c['sheet']} plan); depth = seat RL - soffit RL at both ends "
                f"({c['seat'][0]} - {c['soffit'][0]}, {c['seat'][1]} - {c['soffit'][1]}, {c['sheet']} elevation) mean; length {c['end'] - c['start']} along the support line")
    put(p + ".headstock_setout.rows[0]", sheet=c["sheet"], view="plan", text=f"{c['front']} span side of the bearing line", cells={"edge": "front", "value": float(c["front"])})
    put(p + ".headstock_setout.rows[1]", sheet=c["sheet"], view="plan", text=f"{c['back']} curtain-wall side", cells={"edge": "back", "value": -float(c["back"])})
    put(p + ".headstock_setout.rows[2]", tag="Calculated", cells={"edge": "start", "value": float(c["start"])},
        formula=f"right end of the sill from the SOP along the support line ({c['sheet']} plan dims; + = left / along {c['brg']:.4f}°)")
    put(p + ".headstock_setout.rows[3]", tag="Calculated", cells={"edge": "end", "value": float(c["end"])},
        formula=f"left end of the sill from the SOP along the support line ({c['sheet']} plan dims)")
    put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "fill / estuarine soft clay / Botany sand / residual clay / Unit 6 weak rock / Unit 7 sound rock (report table 5-3)"},
        note="lateral soil moduli in Appendix J (geotechnical design report), not in the copy supplied")
    put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="reinforced soil wall block; φ 30° c 0 (report 2.4.3); unit weight 22 kN/m3 compacted soil (table 2-4)")
    put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="SB02: Unit 6 Erm 50 MPa, Unit 7 Erm 350 MPa (report table 5-4); subgrade modulus not given")
    put(p + ".curtain_wall.rows[0]", tag="Missing-Flagged", cells={}, note="curtain wall above the seat: top RL 10.136 / 9.927 (A2) — thickness on the section sheets not read")
    E0, N0 = c["sop"]; u = (math.sin(math.radians(c["brg"])), math.cos(math.radians(c["brg"])))
    for pid, (d, rl_top) in c["piles"].items():
        q = p + f".piles[{pid}]"
        E, N = E0 + d * u[0], N0 + d * u[1]
        for k, v in (("E", E), ("N", N)):
            put(q + "." + k, round(v, 3), unit="m", tag="Calculated",
                formula=f"SOP {c['sheet']} ({E0}, {N0}) + {d:+.3f} along the pile line bearing {c['brg']:.4f}° (0200 pile layout: 5411 / 2511 / 389)")
        put(q + ".diameter", 1050.0, unit="mm", sheet="0200", view="pile layout plan", text="Ø1050 bored cast-in-place piles")
        put(q + ".rl_top", rl_top, unit="m", sheet="0201", view="table 1 pile data", text="TOP OF PILE RL 'B'")
        put(q + ".rl_toe", c["toe"], unit="m", sheet="0201", view="table 1 pile data", text="FOUNDING LEVEL RL 'A'")
        put(q + ".rl_rock", -10.0, unit="m", sheet="RPT", view="table 5-3 inferred stratigraphy", text=f"SB02 abutment {s}: Unit 6 weak rock top RL -10.0")
        put(q + ".design_actions.rows[0]", sheet="0201", view="table 1 pile data", text="design maximum axial compression at top of pile SLS", cells={"limit_state": "SLS", "N": float(c["dA"]["SLS"])},
            note="report table 5-5 gives SLS 3281 kN for socket design (query)")
        put(q + ".design_actions.rows[1]", sheet="0201", view="table 1 pile data", text="ULS axial / design maximum bending moment ULS",
            cells={"limit_state": "ULS", "N": float(c["dA"]["ULS"]), "M": float(c["dA"]["M"])})

# ---------------- materials ----------------
for i, (el, fc, sheet, txt, E_, dens) in enumerate((("Super-T girders", 50.0, "0600", "50 MPa", 34800.0, 26.0), ("deck", 40.0, "0700", "40 MPa", 32800.0, 25.0),
                                                   ("piles", 50.0, "0250", "50 MPa", 34800.0, 25.0), ("abutments", 40.0, "0302", "40 MPa", 32800.0, 25.0))):
    put(f"materials.concrete.rows[{i}]", sheet=sheet, view="general notes",
        text=f"{txt} ({sheet}); E {E_:.0f} (report table 2-1); density {dens} kN/m3 (report table 2-4: {'prestressed beams' if dens == 26.0 else 'reinforced concrete'})",
        cells={"element": el, "fc": fc, "E": E_, "density": dens},
        note="girder density: report 26.0 kN/m3 vs 0600 hog basis 2550 kg/m3 = 25.0 kN/m3 (query)" if dens == 26.0 else None)
put("materials.strand.rows[0]", sheet="RPT", view="table 2-3", text="15.7 mm 7 wire ordinary relax 2, A 150, MBL 279 kN, fpb 1860, E 195 GPa",
    cells={"type": "15.7 mm 7-wire ordinary, relax 2", "diameter": 15.7, "fpb": 1860.0, "area": 150.0, "Ep": 195000.0})
put("materials.reinforcement.rows[0]", sheet="RPT", view="table 2-2", text="D500N 500 MPa, E 200,000", cells={"grade": "D500N", "fsy": 500.0, "Es": 200000.0})
put("custom.concrete_E_report", "34,800 MPa (50 MPa) / 32,800 MPa (40 MPa); basic shrinkage 800e-6; creep 2.4 (50) / 2.8 (40)", sheet="RPT", view="table 2-1")
put("custom.densities_report", "reinforced concrete 25.0, prestressed beams 26.0, asphalt 22.0, compacted soil 22.0 kN/m3", sheet="RPT", view="table 2-4")
put("custom.sdl_line_loads", "utilities 1 kN/m, safety screens 1 kN/m", sheet="RPT", view="table 2-5")

# ---------------- loads ----------------
put("loads.traffic_models.rows[0]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "M1600", "on": True})
put("loads.traffic_models.rows[1]", sheet="0101", view="design criteria", text="ROAD TRAFFIC LOADING: SM1600", cells={"model": "S1600", "on": True})
put("loads.design_speed", 90, unit="km/h", sheet="0101", view="design criteria", text="DESIGN TRAFFIC SPEED: 90 km/h")
for k, un in (("braking_force", "kN"), ("traffic_surcharge", "kPa"), ("shrinkage_creep_shortening", "1e-6")):
    put("loads." + k, tag="Missing-Flagged", unit=un, note="AS 5100.2 method stated in the report (2.4.5 / 2.4.9); value not printed")
put("loads.wind.rows[0]", sheet="0101", view="wind loading", text="WIND VELOCITY ULS 48 m/s", cells={"item": "V_uls", "value": 48.0, "unit": "m/s"})
put("loads.wind.rows[1]", sheet="0101", view="wind loading", text="WIND VELOCITY SLS 37 m/s", cells={"item": "V_sls", "value": 37.0, "unit": "m/s"})
put("loads.wind.rows[2]", sheet="RPT", view="2.4.6 wind loads", text="design speed 35 m/s for ULS PE + road traffic", cells={"item": "V_with_traffic", "value": 35.0, "unit": "m/s"})
for i, it in enumerate(("air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 3):
    put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2 section 17 stated; values not printed")
for i, (it, v) in enumerate((("kp", "1.7"), ("Z", "0.08"), ("site_class", "De"))):
    put(f"loads.earthquake.rows[{i}]", sheet="0101", view="earthquake loading", text=f"{it} {v}", cells={"item": it, "value": v})
put("loads.earthquake.rows[3]", tag="Missing-Flagged", cells={"item": "Rf"}, note="µ 1.0 longitudinal / 1.5 transverse (0101); Rf not printed")
put("loads.earthquake.rows[4]", tag="Missing-Flagged", cells={"item": "zeta"}, note="not printed")
put("loads.earthquake.rows[5]", sheet="RPT", view="table 2-8", text="µ 1.0 vertical listed; vertical action not stated as applied", tag="Missing-Flagged", cells={"item": "vertical"})
for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
    put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note="AS 5100.2: coastal, < 1000 m, region 2 (report 2.4.10); values not printed")
for gname in ("gradient_positive", "gradient_negative"):
    for i in range(13):
        put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note="AS 5100.2 differential temperature stated; values not printed")
put("custom.design_lanes", 2, sheet="0101", view="design criteria", text="No OF DESIGN LANES SB02: 2")
put("custom.heavy_load_platform", "HLP 400, one vehicle per carriageway, centreline of carriageway ±1 m, 10 km/h, no concurrent SM1600 on SB02", sheet="RPT", view="table 2-7 / 0101")
put("custom.route_factor", 0.3, sheet="0101", view="design criteria", text="ROUTE FACTOR: 0.3")
put("custom.heavy_vehicles_per_lane_day", 169, sheet="0101", view="design criteria", text="SB02-WB: 169")
put("custom.collision_load", "2700 kN in any horizontal direction at 1.2 m above ground", sheet="0101", view="collision loading")
put("custom.differential_settlement", 11, unit="mm", sheet="0101", view="differential settlement", text="11mm TOTAL BETWEEN ADJACENT SUPPORTS (report 2.4.4: 10 mm — query)")
put("custom.earthquake_mu_longitudinal", 1.0, sheet="0101", view="earthquake loading"); put("custom.earthquake_mu_transverse", 1.5, sheet="0101", view="earthquake loading")
put("custom.wind_region", "A2", sheet="0101", view="wind loading"); put("custom.wind_terrain", "TC2", sheet="0101", view="wind loading")

# ---------------- prestress losses / hog inputs (item names of pdf2bim.design.prestress) ----------------
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
put("design.girder_options.rows[0]", sheet="0655", view="general notes", text="COVER ... INTERNAL SURFACE: 30mm, EXTERNAL SURFACE: 35mm", cells={"item": "fitment_cover_side", "value": "35"})
put("design.girder_options.rows[1]", sheet="0655", view="general notes", text="INTERNAL SURFACE: 30mm", cells={"item": "fitment_cover_top", "value": "30"})
for i, (it, v_) in enumerate((("useN", "true"), ("kuoLim", "true"), ("tend", '"sc"'), ("k1p", "0.4"), ("dsh", "true"), ("torsion_tie_legs", "1")), 2):
    put(f"design.girder_options.rows[{i}]", tag="Model", cells={"item": it, "value": v_}, note="design option, as BR13A / B12626")

# ---------------- analysis settings (Model, as BR13A / B12626) ----------------
for i, (it, v, why) in enumerate((("tgt", "2.8", "transverse member spacing target (m)"), ("merge", "0.4", "node merge tolerance (m)"), ("midgap", "1", "mid-gap lines"),
                                  ("model", "2", "integrated model"), ("girder_J_factor", "1.0", "Super-T torsion factor (ADR-041; P4-6 open)"),
                                  ("deck_top_reference", "1", "nodes at the deck top (ADR-043)"))):
    put(f"analysis.grillage.rows[{i}]", tag="Model", cells={"item": it, "value": v}, note=why + ", as BR13A")
for k, v, un, why in (("bearing_fixed_stiffness", 1e7, "kN/m", "rigid idealisation"), ("pile_toe", "vertical only", None, "as BR13A"),
                      ("column_segment", 1.0, "m", "piles split to about 1 m"), ("soil_factor", 1, None, "sensitivity factor (report: x0.5 / x2, x3 earthquake)"),
                      ("modes", 30, None, "response spectrum modes")):
    put("analysis." + k, v, tag="Model", unit=un, note=why)

json.dump({"origin": "owner drawing set SGWS1-JHSW-1000-BR-DRG-COMBINED.pdf (143 sheets) + report RPT-000001 rev E, 2026-11-04",
           "documents": sorted(docs.values(), key=lambda d: d["id"]), "values": out},
          open(os.path.join(H, "B12453_description_values.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), "values,", len(docs), "documents")
