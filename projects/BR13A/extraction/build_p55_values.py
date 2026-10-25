#!/usr/bin/env python3
"""P5.5 (BR13A): values re-read from the text layer of BR13A_GA_Rev02.pdf (claude.ai project file; not in the
repository), written to the interchange sheet for tools/import_takeoff.py. Each row names the drawing and the printed
text it came from. Rows are only what the text layer prints (or explicit arithmetic on printed values: Calculated, with
the derivation). Written by the agent on 2026-10-25; to be checked by the engineer against the drawings."""
import os, json
import openpyxl

G = "BR13A_GA_Rev02.pdf"
R = []


def row(path, value, src, kind="Direct", notes=None, unit=None):
    R.append([path, json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list, str)) or value is None else value, unit, kind, f"{G} {src}" if src else None, notes])


# --- DRG 202012 (GA sheet C): horizontal alignment table, vertical alignment and skew diagrams
H = "DRG-202012 horizontal alignment table"
row("alignment.control_line", "M2W1", "DRG-202012 'CONTROL LINE M2W1'")
row("alignment.horizontal.rows[0]", {"element": "spiral", "ch_start": 1842.507, "length": 55.0, "radius": 400, "direction": "left", "E_start": 300149.725, "N_start": 6249465.626}, H, "Calculated",
    "HTP1 1842.507 / 300149.725 / 6249465.626 printed; length = HTP2 - HTP1 = 1897.507 - 1842.507 = 55.000; radius printed 400000 (mm, general notes DRG-202011: dimensions in mm) = 400 m; left: bearing decreases 285°13'31.8\" (HTP1 in) -> 281°17'11.1\" (HTP2 out)")
row("alignment.horizontal.rows[1]", {"element": "arc", "ch_start": 1897.507, "length": 138.931, "radius": 400, "direction": "left", "E_start": 300096.349, "N_start": 6249478.847}, H, "Calculated",
    "HTP2 1897.507 / 300096.349 / 6249478.847 printed; length = HTP3 - HTP2 = 2036.438 - 1897.507 = 138.931; radius 400000 mm = 400 m; HCEN 300018.064 / 6249086.583")
row("alignment.horizontal.rows[2]", {"element": "spiral", "ch_start": 2036.438, "length": 55.0, "radius": 400, "direction": "left", "E_start": 299958.154, "N_start": 6249482.071}, H, "Calculated",
    "HTP3 2036.438 / 299958.154 / 6249482.071 printed; length = HTP4 - HTP3 = 2091.438 - 2036.438 = 55.000; bearing in 261°23'10.1\", out 257°26'49.4\"")
row("alignment.horizontal.rows[3]", {"element": "tangent", "ch_start": 2091.438, "length": None, "radius": None, "direction": None, "E_start": 299904.22, "N_start": 6249471.352}, H + " (HTP4)")
V = "DRG-202012 vertical alignment diagram"
row("alignment.vertical.rows[0]", {"ch": 1742.793, "RL": 134.391, "grade_in": None, "grade_out": -4.971, "curve_length": None}, V + " 'TP CH 1742.793 RL 134.391', '-4.971%'")
row("alignment.vertical.rows[1]", {"ch": 1896.831, "RL": 131.729, "grade_in": -4.971, "grade_out": -1.728, "curve_length": 308.075}, V + " 'CH 1896.831 RL 131.729 -4.971% -1.728% LENGTH OF VERTICAL CURVE = 308.075'")
row("alignment.vertical.rows[2]", {"ch": 2050.869, "RL": 124.072, "grade_in": -1.728, "grade_out": None, "curve_length": None}, V + " 'TP CH 2050.869 RL 124.072'")
# --- support lines: setting-out points (DRG 202100 / 202101) and skew (DRG 202012)
row("alignment.support_lines.rows[0]", {"support": "A", "ch": 1895.3, "skew": 34.5, "skew_dms": None}, "DRG-202100 'SOP CH 1895.300'; DRG-202012 skew diagram '34.50°'")
row("alignment.support_lines.rows[1]", {"support": "B", "ch": 1924.21, "skew": 34.5, "skew_dms": None}, "DRG-202101 'SOP CH 1924.210'; DRG-202012 '34.50°'")
# --- deck (DRG 202400 / 202011 / 202010)
row("deck.slab_thickness", 200.0, "DRG-202400 '200 MIN THICK DECK SLAB'", unit="mm")
row("deck.surfacing_thickness", 75.0, "DRG-202011 general notes 'THE 75 THICK ASPHALT'", unit="mm")
row("deck.end_gap", 50.0, "DRG-202010 elevation '50 E.J GAP'", unit="mm")
row("deck.edge_right", 4.9, "DRG-202400 section '4500 400 9200'", "Calculated", "4500 + 400 = 4900 mm from the control line (assumed: the 4500 + 400 chain starts at the control line — check the section)", unit="m")
row("deck.edge_left", -4.3, "DRG-202400 section '4500 400 9200'", "Calculated", "9200 - 4900 = 4300 mm left of the control line (same reading as edge_right)", unit="m")
# --- superstructure (DRG 202304 / 202301-303)
row("superstructure.supert_types[ST1].depth", 1515, "DRG-202304 section '1515'; GA DRG-202010 '1515 DEEP PSC SUPER-T GIRDERS'", unit="mm")
row("superstructure.supert_types[ST1].shape.rows[0]", {"key": "D", "name": "Overall depth", "value": 1515, "unit": "mm"}, "DRG-202304 '1515'")
row("superstructure.supert_types[ST1].shape.rows[1]", {"key": "bw", "name": "Soffit width", "value": 757, "unit": "mm"}, "DRG-202304 '757 = ='")
# --- bearings: Table 1 BEARING DATA (DRG 202281)
for s, vals in (("A", (128.390, 128.561, 128.745, 128.899)), ("B", (127.371, 127.547, 127.736, 127.895))):
    for g, v in zip(("G1", "G2", "G3", "G4"), vals):
        row(f"bearings.items[{s}-G{g[1]}].seat_rl", v, f"DRG-202281 TABLE 1 BEARING DATA 'RL X' {s}-0{g[1]} {v:.3f}", unit="m",
            notes="DRG-202282 labels RL 'X' 'TOP OF BEARING RL X (SEE TABLE 1 ON SHEET 281)' — the description calls it seat_rl: meaning to confirm")
        row(f"bearings.items[{s}-G{g[1]}].type", "elastomeric", "DRG-202282 'RECTANGULAR LAMINATED ELASTOMERIC BEARING'")
# --- abutments (DRG 202100 / 202101 / 202011 / 202010)
row("supports[A].headstock.rows[0]", {"width": 1700, "depth": 1500, "length": 10.928, "rl_top": None, "rl_soffit": None}, "DRG-202011 section '1500 DEEP x 1700 WIDE HEADSTOCK'; DRG-202100 plan '10928'",
    notes="GA section prints 1500 deep; the description has 1520 (from DRG-202103) — conflict for the engineer")
row("supports[B].headstock.rows[0]", {"width": 1700, "depth": 1500, "length": 11.445, "rl_top": None, "rl_soffit": None}, "DRG-202011 '1500 DEEP x 1700 WIDE HEADSTOCK'; DRG-202101 plan '11445'",
    notes="as abutment A")
row("supports[A].headstock_setout.rows[2]", {"edge": "start", "value": -5645}, "DRG-202100 plan '5283 5645'")
row("supports[A].headstock_setout.rows[3]", {"edge": "end", "value": 5283}, "DRG-202100 plan '5283 5645'")
row("supports[B].headstock_setout.rows[2]", {"edge": "start", "value": -4751}, "DRG-202101 plan '4751 6694'")
row("supports[B].headstock_setout.rows[3]", {"edge": "end", "value": 6694}, "DRG-202101 plan '4751 6694'")
row("supports[A].headstock_setout.rows[0]", None, None, "Missing — Flagged", "835 not printed in the text layer of DRG-202100 (printed near the front face: '150 TYP 810'); check the plan")
row("supports[B].headstock_setout.rows[0]", None, None, "Missing — Flagged", "824 not printed in the text layer of DRG-202101 (printed: '150 TYP 811'); check the plan")
for s, toe in (("A", 109.770), ("B", 109.987)):
    for i in range(1, 5):
        row(f"supports[{s}].piles[{s}{i}].diameter", 1050.0, "DRG-202010 '4 No ∅1050 CAST-IN-PLACE BORED PILES'", unit="mm")
        row(f"supports[{s}].piles[{s}{i}].rl_toe", toe, f"DRG-202010 elevation 'RL {toe:.3f}' (pile toe level as read; pile table DRG-202050 not legible in the text layer)", unit="m",
            notes="elevation callout; the description cites the DRG-202050 pile table")
        row(f"supports[{s}].piles[{s}{i}].rl_rock", None, None, "Missing — Flagged", "rock level not in the text layer (pile table DRG-202050 is graphic)")
# --- earthquake (DRG 202001 cover sheet; the left of each line is cut in the text layer)
E1 = "DRG-202001 cover sheet, earthquake loading notes (text layer, line starts cut)"
row("loads.earthquake.rows[0]", {"item": "kp", "value": "1.7"}, E1 + " '…Y FACTOR kp: 1.7'")
row("loads.earthquake.rows[1]", {"item": "Z", "value": "0.08"}, E1 + " '…ARD FACTOR Z: 0.08'")
row("loads.earthquake.rows[2]", {"item": "site_class", "value": "Be"}, E1 + " '…L CLASS: Be'", notes="label cut in the text layer ('…L CLASS'); the description has Ce (Assumed)")
row("loads.earthquake.rows[mu_longitudinal]", {"item": "mu_longitudinal", "value": "1.0"}, E1 + " '…TILITY FACTOR µ LONGITUDINAL : 1.0'")
row("loads.earthquake.rows[mu_transverse]", {"item": "mu_transverse", "value": "1.5"}, E1 + " '…TILITY FACTOR µ TRANSVERSE : 1.5'")
row("loads.earthquake.rows[bedc]", {"item": "bedc", "value": "BEDC-4"}, E1 + " '…SSIFICATION: BEDC-4'")

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "BR13A_P5.5_values.xlsx")
wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Values"
ws.append(["Path", "Value", "Unit", "Data Source", "Source ref", "Notes"])
for r in R:
    ws.append(r)
wb.save(out)
print(out, len(R), "rows")
