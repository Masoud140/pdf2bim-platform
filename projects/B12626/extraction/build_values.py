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
rec("superstructure.flange_note", None, None, M, note="top flange 1160 each side of the girder centreline on every girder sheet (109202 SG-01, "
    "109203 SG-02..09, 109204 SG-10; no trimmed variant drawn) = 2320 > 2269 bearing spacing of SG-06 / SG-05 across the median: flanges overlap 51 mm. "
    "Owner to confirm which is right (girder spacing at the median, or a trimmed flange not drawn)")
for g in ["SG-%02d" % k for k in range(1, 11)]:
    rec("superstructure.members[%s].flange_left" % g, 1160, "mm", D, "109202-204", "plan", "1160 girder centreline to flange edge")
    rec("superstructure.members[%s].flange_right" % g, 1160, "mm", D, "109202-204", "plan", "1160")
rec("superstructure.end_diaphragm_length", 1500, "mm", D, "109203", "plan", "1500 END DIAPHRAGM each end")
rec("superstructure.flange_end_cutback", 800, "mm", D, "109203 / 109204", "plan",
    "top flange cut back 800 from each girder end (both sides SG-02..09; inner side only on SG-10 / SG-01)")
rec("superstructure.supert_types[ST1].density", 2600, "kg/m3", D, "109201", "general notes", "DENSITY = 2600 kg/m³ (2400 kg/m³ FOR CALCULATION OF MODULUS)")
rec("superstructure.supert_types[ST1].E_transfer", 32100, "MPa", D, "109201", "general notes", "ELASTIC MODULUS AT TRANSFER = 32100 MPa")
rec("superstructure.supert_types[ST1].mass", 45.7, "t", D, "109201", "lifting and handling", "approx. 45.7 tonnes each (density 2550)")
rec("superstructure.cross_girders.end_width", 800, "mm", D, "109303", "sections 2 / 3", "800 cross girder (pour 1) at each abutment end")
rec("superstructure.cross_girders.end_depth_below_slab", 765, "mm", D, "109303", "sections 2 / 3", "765 below the deck slab")
rec("superstructure.cross_girders.intermediate", None, None, M, note="no intermediate cast-in-place cross girder drawn on 109301-304 (girders have internal diaphragms, 109203)")

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

# ================= stage 2b (2026-10-28) =================
# ---------------- bearing plan / height (109152) and restraint (109056) ----------------
for s in "AB":
    for k in range(10):
        p = "bearings.items[%s-%02d]" % (s, k + 1)
        rec(p + ".plan_a", 380, "mm", D, "109152", "plan rectangular laminated elastomeric bearing", "380 (along traffic, same orientation as the 530 plate)")
        rec(p + ".plan_b", 480, "mm", D, "109152", "plan", "480")
        rec(p + ".height", 115, "mm", D, "109152", "section 2", "115 bearing below the attachment plate")
        rec(p + ".part_no", "AS [50] 070907R", None, D, "109152", "plan", "AS PART No")
        for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
            rec(p + "." + f, None, None, M, note="not printed; manufacturer catalogue part AS [50] 070907R (not in this drawing set)")
        rec(p + ".restraint_longitudinal", "elastomeric; buffer bearing at the curtain wall after a 35 (±5) gap", None, D, "109055", "detail E buffer bearing")
        rec(p + ".restraint_transverse", "lateral restraint block, 10 nom gap" if k + 1 in (5, 6) else "elastomeric", None, D, "109056",
            "lateral restraint block detail", "one 900-wide block between SG-05 and SG-06 at each abutment")

# ---------------- abutments (109055 section 1 / 3; GA) ----------------
for s, dep, cw in (("A", 1575, 1327), ("B", 1925, 1324)):
    p = "supports[%s]" % s
    rec(p + ".kind", "piled abutment (sill beam on driven steel tube piles)", None, D, "109011", "elevation")
    rec(p + ".headstock.width", 1350, "mm", D, "109055", "section 1 (3)", "1350 = 350 curtain wall + 500 + 500")
    rec(p + ".headstock.depth", dep, "mm", D, "109055", "section 1 (3)", "front face depth below the bearing seat; values for B in brackets")
    rec(p + ".headstock.length", 26.315 if s == "A" else 26.312, "m", D, "109011", "plan", "abutment length")
    rec(p + ".headstock_setout.front", 500, "mm", D, "109055", "section 1", "front face 500 from ℄ bearings")
    rec(p + ".headstock_setout.back", -850, "mm", C, derivation="-(500 + 350) from 109055 section 1 (500 to ℄ bearings, 350 curtain wall)")
    rec(p + ".headstock_setout.start_end", None, None, M, note="along-line extents not dimensioned from the SOP on the sheets read")
    rec(p + ".curtain_wall.thickness", 350, "mm", D, "109055", "section 1")
    rec(p + ".curtain_wall.height", cw, "mm", D, "109055", "section 1 (3)", "above the bearing seat")
    rec(p + ".soil", None, None, M, note="geotechnical parameters in the factual / interpretive reports (109001 references), not in the drawings")

# ---------------- barriers (109401-402, 109303 detail D) ----------------
for side, off in (("left", -9.500), ("right", 13.120)):
    p = "deck.barriers[barrier_%s]" % side
    rec(p + ".type", "precast concrete parapet, medium performance level (+ twin rails 109451-)", None, D, "109001 / 109401", "notes")
    rec(p + ".height", 1400, "mm", D, "109402", "inside elevation PB01", "1400 precast unit")
    rec(p + ".offset", off, "m", D, "109051", "elevation", "inside face of barrier (carriageway edge)")
    rec(p + ".weight", round(6.01 / 5.580 * 9.80665, 2), "kN/m", C,
        derivation="PB01 mass 6.01 t / length 5.580 m x g 9.80665 (109402); precast unit only — rails (109451-) not included")
    rec(p + ".rail_weight", None, "kN/m", M, note="twin traffic barrier rails 109451-455 not read")
A_med = 0.600 * 0.160 + (0.600 + 0.350) / 2 * 0.180 + (0.350 + 0.210) / 2 * 0.660
rec("deck.barriers[barrier_median].type", "cast-in-place concrete median barrier, regular performance level", None, D, "109303", "detail D")
rec("deck.barriers[barrier_median].height", 1000, "mm", D, "109303", "detail D", "1000 above deck concrete (920 above wearing surface, 109012)")
rec("deck.barriers[barrier_median].offset", crown, "m", D, "109051", "plan", "median centre (lateral restraint block setout) 1813 east of MC10, as the crown")
rec("deck.barriers[barrier_median].area", round(A_med, 4), "m2", C,
    derivation="109303 detail D: widths 600 (0-160), 600->350 (160-340), 350->210 (340-1000); 0.6x0.16 + 0.475x0.18 + 0.28x0.66")
rec("deck.barriers[barrier_median].weight", None, "kN/m", M, note="area %.4f m2 Calculated; density of cast-in-place concrete not printed" % A_med)

# ---------------- materials ----------------
rec("materials.concrete[girders].fc", 60, "MPa", D, "109201", "general notes")
rec("materials.concrete[deck].fc", 40, "MPa", D, "109301", "general notes")
rec("materials.concrete[abutments].fc", 40, "MPa", D, "109051", "general notes")
rec("materials.concrete[pile infill].fc", 50, "MPa", D, "109031", "general notes")
rec("materials.concrete[precast barriers].fc", 50, "MPa", D, "109401", "general notes")
for el in ("girders", "deck", "abutments", "pile infill"):
    rec("materials.concrete[%s].E" % el, None, "MPa", M, note="28-day modulus not printed (girder transfer modulus 32100 only)")
rec("materials.strand.diameter", 15.2, "mm", D, "109201", "general notes", "7-wire ordinary 15.2 mm")
rec("materials.strand.fpb", 1830, "MPa", D, "109201", "general notes", "nominal tensile strength 1830 MPa, relax 2")
rec("materials.strand.MBL", 261, "kN", D, "109201", "general notes", "minimum breaking load 261 kN")
rec("materials.strand.jacking_force_after_release", 190, "kN", D, "109201", "general notes", "force in each strand immediately after release of the jack")
rec("materials.steel_pile.fy_limit", 315, "MPa", D, "109035", "notes", "stress in ID 900 / 16 wall limited to 315 MPa (driving)")

# ---------------- loads (109001 cover) ----------------
L1 = lambda item, v, u=None, note=None: rec("loads." + item, v, u, D, "109001", "design criteria", note)
L1("traffic_models", "SM1600 (M1600 + S1600)")
L1("design_lanes", 7)
L1("design_speed", 120, "km/h")
L1("heavy_load_platform", "HLP 400, one vehicle per carriageway, 10 km/h, ±1 m lateral")
L1("concurrent_traffic_with_HLP", "0.5 x SM1600 on unobstructed lanes")
L1("fatigue", "70% of a single A160, 70% of a single M1600 without UDL; 2270 heavy vehicles / lane / day")
L1("route_factor", 1.0)
L1("differential_settlement", 5, "mm", "total SLS between adjacent supports")
L1("wind.region", "A2"); L1("wind.terrain", "TC2")
L1("wind.V_uls", 48, "m/s"); L1("wind.V_sls", 37, "m/s")
L1("wind.ARI_uls", 2000, "years"); L1("wind.ARI_sls", 20, "years")
rec("loads.wind.V_with_traffic", None, "m/s", M, note="not printed on 109001")
L1("earthquake.kp", 1.7); L1("earthquake.Z", 0.11); L1("earthquake.site_class", "De")
L1("earthquake.mu_longitudinal", 1.0); L1("earthquake.mu_transverse", 1.0)
L1("design_standard", "AS(/NZS) 5100:2017 series")
for it in ("temperature", "gradient", "shrinkage_creep_shortening", "braking_force", "traffic_surcharge"):
    rec("loads." + it, None, None, M, note="not printed on the cover sheet (109001) — design report M1RTBH2T-JHGM-6003BR09-BR-RPT-109001 not supplied")

json.dump(out, open(os.path.join(H, "B12626_values.json"), "w"), indent=1, ensure_ascii=False)
tags = {}
for r in out:
    tags[r["tag"]] = tags.get(r["tag"], 0) + 1
print(len(out), "values", tags)
print("checks: setout length %.4f (40.000), bearing %.5f (37.33750); support ch A %.4f B %.4f span %.4f (27.100)" % (L40, brg, chA, chB, chB - chA))
