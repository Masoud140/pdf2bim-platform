#!/usr/bin/env python3
"""B12626 extraction, stage 2a (P6): geometry, girders, bearing lines, piles — from the owner's drawing set
(Second_Example.pdf, sha256 a03329fc..., not committed). Writes B12626_values.json: one record per value with
path, value, unit, tag (Direct / Calculated / Missing-Flagged), source (drawing, view) and, for Calculated, the derivation.
Re-run after editing; every number here is printed on a named drawing or derived from such numbers below.

Sign convention (platform): offsets from the control line, left (west, looking up-chainage to the NE) negative."""
import json, math, os

H = os.path.dirname(os.path.abspath(__file__))
out = []


def rec(path, value, unit, tag, sheet=None, view=None, note=None, derivation=None):
    r = {"path": path, "value": value, "unit": unit, "tag": tag}
    if sheet:
        r["source"] = {"document": "Second_Example.pdf", "sheet": sheet, "view": view, "note": note}
    if derivation:
        r["derivation"] = derivation
    out.append(r)
    return value


D, C, M = "Direct", "Calculated", "Missing-Flagged"

# ---------------- project (109001 cover) ----------------
rec("project.name", "M1 Pacific Motorway extension to Raymond Terrace - bridge over Botanic Gardens Road", None, D, "109001", "title block")
rec("project.bridge_id", "B12626", None, D, "109001", "title block")
rec("project.client", "Transport for NSW", None, D, "109001", "title block")
rec("project.designer", "JBJV (Jacobs BG&E JV) for John Holland Gamuda JV", None, D, "109001", "title block")
rec("project.drawing_set", "DS2023/000442", None, D, "109001", "title block")
rec("project.revision", "00", None, D, "109001", "title block")
rec("project.status", "Issue for construction (IFC)", None, D, "109001", "title block")
rec("project.datum_horizontal", "MGA zone 56 (GDA94)", None, D, "109001", "title block")
rec("project.datum_vertical", "AHD71", None, D, "109001", "title block")
rec("project.importance_level", None, None, M, note="classification BEDC-4 printed (109001); AS 5100.2 importance level not printed")

# ---------------- control line = DECK SETOUT LINE (109301 / 109013) ----------------
E0, N0 = 379693.511, 6369956.998          # ch 0 (109013 diagram)
E40, N40 = 379717.771, 6369988.801        # ch 40
L40 = math.hypot(E40 - E0, N40 - N0)
brg = math.degrees(math.atan2(E40 - E0, N40 - N0))
u = ((E40 - E0) / L40, (N40 - N0) / L40)  # unit vector up-chainage
nR = (u[1], -u[0])                         # unit vector to the right (east of the line)
rec("alignment.control_line", "DECK SETOUT LINE (straight; deck setout chainage 0-40)", None, D, "109301", "deck layout", "bearing 37°20'15\"")
rec("alignment.horizontal", [{"element": "straight", "ch_start": 0.0, "length": 40.0, "radius": None, "direction": None,
                              "E_start": E0, "N_start": N0}], None, D, "109013", "horizontal alignment diagram",
    "DECK SETOUT LINE end coordinates; check: length %.4f, bearing %.5f deg vs printed 37°20'15\" = 37.33750" % (L40, brg))

# deck-setout chainage of a point on (or near) the line
def ch_of(E, N):
    return (E - E0) * u[0] + (N - N0) * u[1]

def off_of(E, N):
    return (E - E0) * nR[0] + (N - N0) * nR[1]

# ---------------- support (bearing) lines: abutment SOPs on MC10, perpendicular (bearing 127°20'15") ----------------
sopA = (379696.813, 6369961.333)   # 109051 plan, SOP CH 9216.350 (MC10)
sopB = (379713.250, 6369982.879)   # 109052 plan, SOP CH 9243.450
chA, chB = ch_of(*sopA), ch_of(*sopB)
rec("alignment.support_lines", [
    {"support": "A", "ch": round(chA, 4), "skew": 0.0, "bearing": "127°20'15\""},
    {"support": "B", "ch": round(chB, 4), "skew": 0.0, "bearing": "127°20'15\""}], None, C,
    derivation="abutment SOP coordinates (109051 E 379696.813 N 6369961.333; 109052 E 379713.250 N 6369982.879) projected on the "
               "deck setout line: ch %.4f / %.4f, off-line %.4f / %.4f m; bearing line printed 127°20'15\" = setout 37°20'15\" + 90 -> skew 0; "
               "span %.4f = girder 27.900 - 2 x 0.400 (109202) = 27.100" % (chA, chB, off_of(*sopA), off_of(*sopB), chB - chA))

# ---------------- vertical (MC10 profile, 109013) and the RL conflict ----------------
rec("alignment.vertical", [{"ch": 9168.188, "RL": 11.830, "grade_in": 1.80, "grade_out": -1.90, "curve_length": 481.000}], None, D,
    "109013", "vertical alignment diagram MC10", "IP CH 9168.188 RL 11.830, +1.80 % / -1.90 %, VC 481.000 — chainage along MC10, not the deck setout line")
rec("alignment.vertical_note", None, None, M, note=(
    "CONFLICT: 109011 elevation prints DESIGN SURFACE RL 9.493 at MC10 CH 9215.900 (end of deck A); 109302 Table 1 prints TOP OF DECK "
    "CONCRETE RL 9.493 at deck ch 5.000 point 1 (same point). Wearing surface 80 thick (109011 notes) -> one label is wrong. "
    "Mapping MC10 chainage -> deck setout chainage also needed (SOP A: MC10 9216.350 = deck %.3f)." % chA))

# ---------------- crossfall (109012 section 1, 109302 table 1) ----------------
crown = 1.813   # 109051: dimension from SOP (MC10) to lateral restraint block setout (median centre) 1813; bearing RLs symmetric about it
rec("alignment.crossfall", [{"ch": 0.0, "left": 3.0, "right": 3.0, "crown_offset": crown}], None, D, "109012 / 109051",
    "section 1 '3% FALL' both ways from the median; crown at the median centre 1813 from MC10 (109051)",
    "check (109302 table 1, ch 5.000): points 3/4 at the median faces RL 9.539, point 1 at the setout line 9.493 -> (9.539-9.493)/1.513 = 3.0 %")

# ---------------- deck ----------------
rec("deck.carriageway_left", -9.500, "m", D, "109051", "elevation abutment A", "Δ9500 MC10 to western curtain wall / barrier face")
rec("deck.carriageway_right", 13.120, "m", D, "109051", "elevation abutment A", "Δ13120 MC10 to eastern face (9500 + 13120 = 22620 overall)")
rec("deck.edge_left", -9.900, "m", C, derivation="carriageway_left - 0.400 (109301 section 1: 400 outside the barrier line)")
rec("deck.edge_right", 13.520, "m", C, derivation="carriageway_right + 0.400 (109301 section 1); check deck width 23.420 vs abutment 23412")
rec("deck.slab_thickness", 200.0, "mm", D, "109301", "section 1", "200 MIN THICK DECK SLAB")
rec("deck.surfacing_thickness", 80.0, "mm", D, "109011", "general notes", "total thickness of 80mm (SBWM + DGA 40 + SMA 30)")
rec("deck.end_gap", 50.0, "mm", D, "109011", "elevation", "50 GAP each end")

# ---------------- girders: 10 x PSC Super-T 1215 deep (109201 / 109202), bearings 2344 c/c (109051) ----------------
# bearing positions along the bearing line from the SOP (MC10), west negative; 109051 plan dimension string
pos = [-8.697, -6.353, -4.009, -1.665, 0.679, 2.948, 5.292, 7.636, 9.980, 12.324]   # SG-10 ... SG-01 (west -> east)
names = ["SG-%02d" % k for k in range(10, 0, -1)]
for nm, o in sorted(zip(names, pos)):
    p = "superstructure.members[%s]" % nm
    rec(p + ".line_offset_A", o, "m", C, derivation="109051 plan: bearings 1190 | 4 x 2344 | 2269 | 679 to SOP | 1665 | 3 x 2344 | 1198 "
        "(sums 13516 / 9897 printed); A-01 most easterly (bearing RLs symmetric about the crown 1813 east of MC10, 109151 Table 1)")
    rec(p + ".line_offset_B", o, "m", C, derivation="109052 plan: same string mirrored (1198 | 3 x 2344 | 1665 | 679 | 2269 | 4 x 2344 | 1190)")
    rec(p + ".length", 27.900, "m", D, "109202", "plan girder SG-01", "OVERALL LENGTH ALONG ℄ OF GIRDER = 27900 (all SG-01..SG-10 alike, 109201)")
    rec(p + ".bearing_offset_A", 400, "mm", D, "109202", "plan", "400 end of girder to ℄ bearing")
    rec(p + ".bearing_offset_B", 400, "mm", D, "109202", "plan", "400")
    rec(p + ".type_ref", "ST1", None, "Model")
rec("superstructure.type", "super-t", None, D, "109012", "section 1", "10 No 1215 DEEP PSC SUPER-T GIRDERS")
rec("superstructure.spans", 1, None, D, "109011", "elevation")
rec("superstructure.supert_types[ST1].section", "lib:supert/T3", None, "Standard-verify", note="1215 deep = T3 (1200) family, as BR13A 1515 = T4")
rec("superstructure.supert_types[ST1].depth", 1215, "mm", D, "109202", "elevation girder SG-01", "1215")
rec("superstructure.supert_types[ST1].concrete_28d", 60, "MPa", D, "109201", "general notes", "minimum 28 day 60 MPa")
rec("superstructure.supert_types[ST1].concrete_transfer", 37, "MPa", D, "109201", "general notes", "37 MPa at transfer")
rec("superstructure.flange_note", None, None, M, note="top flange 1160 each side of the girder centreline (109202 SG-01) = 2320 > 2269 spacing of the "
    "two girders either side of the median: their flanges must be trimmed — read 109203 (SG-02..09) / 109204 (SG-10) before setting flange edges")

# ---------------- bearings (109151 table 1) ----------------
rlX = {"A": [7.632, 7.703, 7.773, 7.844, 7.912, 7.911, 7.841, 7.770, 7.700, 7.630],
       "B": [7.488, 7.558, 7.628, 7.699, 7.767, 7.766, 7.695, 7.625, 7.554, 7.484]}
for s in "AB":
    for k in range(10):
        p = "bearings.items[%s-%02d]" % (s, k + 1)
        rec(p + ".support", s, None, "Model")
        rec(p + ".member", "SG-%02d" % (k + 1), None, "Model")
        rec(p + ".type", "elastomeric", None, D, "109151", "general", "laminated elastomeric bearing")
        rec(p + ".top_rl", rlX[s][k], "m", D, "109151", "table 1 bearing data", "RL 'X' — meaning (top of bearing / seat) to confirm on the bearing detail, as BR13A P5-4")

# ---------------- piles (109031 table 1 + plan) ----------------
dirB = (math.sin(math.radians(127 + 20 / 60 + 15 / 3600)), math.cos(math.radians(127 + 20 / 60 + 15 / 3600)))   # bearing 127°20'15" (east)
piles = {"A": ((379696.708, 6369961.193), [-7.788, -2.988, 1.812, 6.612, 11.412], [5.977, 6.122, 6.266, 6.122, 5.977]),
         "B": ((379713.357, 6369983.017), [-7.805, -3.005, 1.795, 6.595, 11.395], [5.484, 5.627, 5.770, 5.627, 5.484])}
for s, (sop, offs, tops) in piles.items():
    rec("supports[%s].pile_line_ch" % s, round(ch_of(*sop), 4), "m", C,
        derivation="SOP %s %s projected on the deck setout line (off-line %.4f m)" % ("1" if s == "A" else "2", sop, off_of(*sop)))
    for k, (o, top) in enumerate(zip(offs, tops)):
        p = "supports[%s].piles[%s-%02d]" % (s, s, k + 1)
        E, N = sop[0] + o * dirB[0], sop[1] + o * dirB[1]
        rec(p + ".E", round(E, 3), "m", C, derivation="SOP + %.3f along bearing 127°20'15\" (109031 plan dimensions; west negative)" % o)
        rec(p + ".N", round(N, 3), "m", C, derivation="as E")
        rec(p + ".diameter", 900, "mm", D, "109031", "table 1")
        rec(p + ".wall_thickness", 16, "mm", D, "109031", "table 1", "steel pile thickness t")
        rec(p + ".rl_top", top, "m", D, "109031", "table 1", "top of pile RL 'B'")
        rec(p + ".rl_toe", -22.500, "m", D, "109031", "table 1", "pile toe level RL 'A'")
        rec(p + ".rl_rock", None, "m", M, note="not printed; 109031 gives founding material 3C2 and 'minimum penetration level for lateral stability RL -10.0'")

json.dump(out, open(os.path.join(H, "B12626_values.json"), "w"), indent=1, ensure_ascii=False)
tags = {}
for r in out:
    tags[r["tag"]] = tags.get(r["tag"], 0) + 1
print(len(out), "values", tags)
print("checks: setout length %.4f (40.000), bearing %.5f (37.33750); support ch A %.4f B %.4f span %.4f (27.100)" % (L40, brg, chA, chB, chB - chA))
