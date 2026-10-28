#!/usr/bin/env python3
"""B12626: map the extraction records (B12626_values.json, build_values.py) onto bridge-description paths (P6 stage 3a).

    python3 projects/B12626/extraction/to_description.py         # -> B12626_description_values.json
    python3 tools/new_description.py projects/B12626/extraction/B12626_description_values.json --out projects/B12626/B12626.bridge.0.2.json

Only re-shapes what was extracted: paths, units the catalogue uses, sources as document ids. Two conversions are
arithmetic and tagged Calculated with their derivation:
- offsets: the drawings give them from MC10 at the SOP; the control line is the deck setout line, and the SOPs lie
  3.8 mm (A) / 2.8 mm (B) left of it, so offset(setout) = offset(MC10) + SOP offset;
- the MC10 vertical profile: deck setout ch = MC10 ch - 9210.9007 (both SOPs: 9216.350 - 5.4493, 9243.450 - 32.5493),
  the arc / chord difference over the 27 m span being < 0.1 mm.
Values the catalogue has no field for go to custom.*; values never extracted stay Missing-Flagged (new_description fills them).
"""
import json, math, os, re

H = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(H, "B12626_values.json")))
R = {r["path"]: r for r in V}
out, docs = [], {}


def src(r, extra=None):
    s = r.get("source") or {}
    if not s.get("sheet"):
        return None
    num = re.findall(r"\d{6}", s["sheet"])[0]
    did = "DRG-" + num
    docs[did] = {"id": did, "number": "M1RTBH2T-JHGM-6003BR09-BR-DRG-" + num, "revision": "00", "kind": "drawing"}
    o = {"doc": did}
    if s.get("view"):
        o["view"] = s["view"] + ("" if s["sheet"] == num else f" (sheets {s['sheet']})")
    if s.get("note") or extra:
        o["text"] = " ".join(x for x in (s.get("note"), extra) if x)
    return o


def put(path, r=None, value=None, unit=None, tag=None, cells=None, derivation=None, inputs=(), note=None, model_note=None):
    """One description record. r = the extraction record it comes from (value / tag / source / derivation defaults)."""
    e = {"path": path, "tag": tag or r["tag"]}
    if cells is not None:
        e["cells"] = cells
    else:
        e["value"] = r["value"] if (r is not None and value is None and tag in (None, r["tag"])) else value
    if unit:
        e["unit"] = unit
    if e["tag"] == "Direct":
        e["source"] = src(r)
    elif e["tag"] == "Calculated":
        e["derivation"] = {"formula": derivation or r.get("derivation"), "inputs": list(inputs)}
    elif e["tag"] == "Model":
        e["source"] = {"note": model_note or "platform modelling choice"}
    elif e["tag"] == "Standard-verify":
        e["ref"] = e["value"]
    if e["tag"] == "Missing-Flagged":
        e["value"] = None
        e["note"] = note or (r or {}).get("note") or ((r or {}).get("source") or {}).get("note") or "not printed on the drawings read"
    if note and e["tag"] != "Missing-Flagged":
        e["note"] = note
    out.append(e)


# ---------------- SOP offsets of MC10 from the setout line (Calculated) ----------------
E0, N0, E40, N40 = 379693.511, 6369956.998, 379717.771, 6369988.801
L40 = math.hypot(E40 - E0, N40 - N0); u = ((E40 - E0) / L40, (N40 - N0) / L40); nR = (u[1], -u[0])
sop = {"A": (379696.813, 6369961.333), "B": (379713.250, 6369982.879)}
oS = {s: (E - E0) * nR[0] + (N - N0) * nR[1] for s, (E, N) in sop.items()}
oM = (oS["A"] + oS["B"]) / 2
SOPD = "SOP A / B (109051 / 109052) lie %.4f / %.4f m from the setout line (right +)" % (oS["A"], oS["B"])

# ---------------- project ----------------
for k in ("name", "bridge_id", "client", "designer", "drawing_set", "revision", "status", "datum_horizontal", "datum_vertical"):
    put("project." + k, R["project." + k])
put("project.importance_level", R["project.importance_level"])

put("project.base_point.rows[0]", tag="Model", cells={"name": "MCT local origin = deck setout line ch 0 (109013)", "E": E0, "N": N0},
    model_note="MIDAS file origin only (coordinates stay MGA in the description); the printed setout-line start point")

# ---------------- alignment ----------------
put("alignment.control_line", R["alignment.control_line"], value="DECK SETOUT LINE", tag="Direct")
r = R["alignment.horizontal"]
put("alignment.horizontal.rows[0]", r, cells={"element": "tangent", "ch_start": 0.0, "length": 40.0, "E_start": E0, "N_start": N0})
put("alignment.horizontal.rows[1]", r, cells={"element": "tangent", "ch_start": 40.0, "E_start": E40, "N_start": N40})
CH = 9216.350 - 5.4493
for i, rv in enumerate(R["alignment.vertical"]["value"]):
    put("alignment.vertical.rows[%d]" % i, tag="Calculated", cells=dict(rv, ch=round(rv["ch"] - CH, 4)),
        derivation="MC10 profile point CH %.3f RL %.3f (109013: TP 8927.688 RL 7.501 / IP 9168.188 RL 11.830 +1.80 / -1.90 %% VC 481 / TP 9408.688 RL 7.260) "
                   "on deck setout chainage: ch(setout) = CH(MC10) - %.4f (SOP A 9216.350 = 5.4493; SOP B 9243.450 = 32.5493 gives the same); "
                   "levels at MC10 = the setout line (%s). OPEN: RL 9.493 is printed both as design surface (109011) and top of deck concrete (109302)"
                   % (rv["ch"], rv["RL"], CH, SOPD), inputs=["alignment.support_lines.rows[0]"])
cf = R["alignment.crossfall"]["value"][0]
put("alignment.crossfall.rows[0]", tag="Calculated", cells={"left": cf["left"], "right": cf["right"], "crown_offset": round(cf["crown_offset"] + oM, 4)},
    derivation="3 %% falls both ways from the median centre (109012 section 1), crown 1813 east of MC10 (109051) + mean SOP offset %.4f" % oM)
for i, s in enumerate("AB"):
    sl = R["alignment.support_lines"]["value"][i]
    put("alignment.support_lines.rows[%d]" % i, R["alignment.support_lines"], cells={"support": s, "ch": sl["ch"], "skew": 0.0, "bearing": 127.3375})

# ---------------- deck ----------------
for k in ("carriageway_left", "carriageway_right", "edge_left", "edge_right"):
    put("deck." + k, R["deck." + k], value=round(R["deck." + k]["value"] + oM, 4), unit="m", tag="Calculated",
        derivation=f"{R['deck.' + k]['value']} from MC10 ({R['deck.' + k].get('derivation') or 'Direct, 109051 elevation'}) + mean SOP offset {oM:.4f}")
for k in ("slab_thickness", "surfacing_thickness", "end_gap"):
    put("deck." + k, R["deck." + k], unit="mm")
put("deck.girders_follow_crossfall", value=True, tag="Direct",
    r={"tag": "Direct", "value": True, "source": {"sheet": "109152", "view": "section 1", "note": "attachment plate +3.0% / -3.0%, girder at 90° to it"}})
for b in ("left", "right", "median"):
    p = f"deck.barriers[barrier_{b}]"
    put(p + ".side", value=b, tag="Direct", r={"tag": "Direct", "value": b, "source": R[p + ".type"]["source"]})
    put(p + ".type", R[p + ".type"])
    if b == "median":
        put(p + ".height", value=920, unit="mm", tag="Direct", r={"tag": "Direct", "source": {"sheet": "109012", "view": "section 1", "note": "920 above the wearing surface"}})
        put(p + ".weight", R[p + ".weight"], unit="kN/m")
        put("custom.median_barrier_area", R[p + ".area"], unit="m2")
    else:
        put(p + ".height", tag="Calculated", value=725.0, unit="mm", derivation="109405 section 1: barrier top 490 + 160 + 155 = 805 above the deck concrete, "
            "less 80 wearing surface (109011) = 725 above the deck surface; twin traffic rails above it (109451-) not included", inputs=["deck.surfacing_thickness"])
        put(p + ".weight", R[p + ".weight"], unit="kN/m", inputs=[])
    put(p + ".solid", value=True, tag="Direct", r={"tag": "Direct", "source": {"sheet": "109405" if b != "median" else "109303", "view": "section 1" if b != "median" else "detail D",
        "note": "solid concrete barrier" + ("; open twin rails above (109451-) not included" if b != "median" else "")}})
    put(p + ".offset", tag="Missing-Flagged", unit="m", note="centroid line not dimensioned" + ("; symmetric about the median centre" if b == "median" else "; inside face at the carriageway edge"))

# ---------------- superstructure ----------------
put("superstructure.type", R["superstructure.type"]); put("superstructure.spans", R["superstructure.spans"])
for k in range(1, 11):
    g = "SG-%02d" % k; p = f"superstructure.members[{g}]"
    for s in "AB":
        r = R[p + ".line_offset_" + s]
        put(p + ".line_offset_" + s, r, value=round(r["value"] + oS[s], 4), unit="m", tag="Calculated",
            derivation=f"{r['value']} from MC10 at SOP {s} ({r['derivation'][:120]}...) + SOP offset {oS[s]:.4f}")
    put(p + ".length", R[p + ".length"], unit="m")
    put(p + ".bearing_offset_A", R[p + ".bearing_offset_A"], unit="mm"); put(p + ".bearing_offset_B", R[p + ".bearing_offset_B"], unit="mm")
    put(p + ".straight", value=True, tag="Model", model_note="precast girders are straight between bearings")
    put(p + ".type_ref", R[p + ".type_ref"], model_note="all ten girders on one girder type (109201 girder schedule: one cross-section)")
    put(p + ".flange_edges.rows[0]", R[p + ".flange_left"], cells={"t": 0.0, "left": 1160.0, "right": 1160.0})
put("superstructure.flange_gap", tag="Missing-Flagged", unit="mm", note="1160 flanges on 2344 spacing leave 24 mm; across the median (2269) they overlap 51 mm: owner query")
put("superstructure.edge_flange_setback", tag="Missing-Flagged", unit="mm", note="flange tip to deck edge: 36 mm east (SG-01), 43 mm west (SG-10) from the offsets; one value per bridge in the catalogue")
for i, s in enumerate("AB"):
    put(f"superstructure.cross_girders.rows[{i}]", tag="Calculated", cells={"support": s, "width": 800.0, "depth": 965.0, "concrete": "deck (40 MPa)"},
        derivation="width 800 (109303 sections 2 / 3); depth 765 below the slab + 200 slab = 965", inputs=["deck.slab_thickness"])
t = "superstructure.supert_types[ST1]"
put(t + ".section", R[t + ".section"])
put(t + ".depth", R[t + ".depth"], unit="mm")
put(t + ".shape.rows[0]", R[t + ".depth"], cells={"key": "D", "name": "Overall depth", "value": 1215.0, "unit": "mm"})
put(t + ".top_flange_width", tag="Calculated", value=2320.0, unit="mm", derivation="2 x 1160 (109202-204 plan)", inputs=[])
put(t + ".concrete_28d", R[t + ".concrete_28d"], unit="MPa"); put(t + ".concrete_transfer", R[t + ".concrete_transfer"], unit="MPa")
for i, end in enumerate("AB"):
    put(t + ".zones.rows[%d]" % i, R["superstructure.end_diaphragm_length"], cells={"from": 0.0, "to": 1.5, "kind": "solid_end_" + end},
        note="END DIAPHRAGM 1500 from each girder end (109203 plan)")
put(t + ".haunch", tag="Missing-Flagged", unit="mm", note="girder top to deck soffit not dimensioned on the sheets read")
for k in ("end_diaphragm_length", "flange_end_cutback"):
    put("custom." + k, R["superstructure." + k], unit="mm")
put("custom.girder_density", R[t + ".density"], unit="kg/m3"); put("custom.girder_E_transfer", R[t + ".E_transfer"], unit="MPa")
put("custom.girder_mass", R[t + ".mass"], unit="t")
put("custom.flange_overlap_query", R["superstructure.flange_note"])

# ---------------- bearings ----------------
for s in "AB":
    for k in range(1, 11):
        p = "bearings.items[%s-%02d]" % (s, k)
        put(p + ".support", R[p + ".support"], model_note="bearing on support %s (109151 plan)" % s)
        put(p + ".member", R[p + ".member"], model_note="bearing %s-%02d under girder SG-%02d (109151 / 109201 numbering)" % (s, k, k))
        put(p + ".type", R[p + ".type"])
        put(p + ".plan_a", R[p + ".plan_a"], unit="mm"); put(p + ".plan_b", R[p + ".plan_b"], unit="mm")
        put(p + ".bearing_height", R[p + ".height"], unit="mm")
        put(p + ".top_rl", R[p + ".top_rl"], unit="m", note="109152 section 1: TOP OF BEARING RL 'X'")
        for f in ("elastomer_thickness", "layer_thickness", "shear_modulus"):
            put(p + "." + f, R[p + "." + f], unit={"shear_modulus": "MPa"}.get(f, "mm"))
        put(p + ".height", tag="Missing-Flagged", unit="mm", note="seat to soffit: cement mortar pad varies (50 nom) + epoxy block per measured hog (109151 table 2)")
        put(p + ".restraint_longitudinal", tag="Missing-Flagged", note="laminated elastomeric; buffer bearing at the curtain wall after a 35 (±5) gap (109055) — idealisation for the engineer")
        put(p + ".restraint_transverse", tag="Missing-Flagged", note=("lateral restraint block between SG-05 / SG-06, 10 nom gap (109056)" if k in (5, 6) else "laminated elastomeric") + " — idealisation for the engineer")
put("custom.bearing_part_no", R["bearings.items[A-01].part_no"])

# ---------------- supports ----------------
for s in "AB":
    p = f"supports[{s}]"
    put(p + ".kind", value="spill-through abutment", tag="Direct",
        r={"tag": "Direct", "source": {"sheet": "109001", "view": "construction sequence", "note": "CONSTRUCT EMBANKMENTS TO UNDERSIDE OF ABUTMENT SILL BEAMS ... BACKFILL; sill beam on 5 piles"}})
    put(p + ".headstock.rows[0]", R[p + ".headstock.width"], cells={"width": 1350.0, "depth": float(R[p + ".headstock.depth"]["value"]), "length": R[p + ".headstock.length"]["value"]},
        tag="Direct", note="depth = front face below the bearing seat (109055 section 1 / 3); elevation shows 1350 / 1700 TYP (225 less) — to confirm; length 23412 (109051 / 052 plan)")
    put(p + ".headstock_setout.rows[0]", R[p + ".headstock_setout.front"], cells={"edge": "front", "value": 500.0})
    put(p + ".headstock_setout.rows[1]", R[p + ".headstock_setout.back"], cells={"edge": "back", "value": -850.0}, inputs=[])
    for i, (edge, k) in enumerate((("start", "west_end"), ("end", "east_end")), 2):
        r = R[p + ".headstock_setout." + k]
        put(p + f".headstock_setout.rows[{i}]", r, tag="Calculated", cells={"edge": edge, "value": round(r["value"] - oS[s] * 1000, 1)},
            derivation=f"{r['value']} from the SOP ({r['source']['sheet']} plan; + east = + along the support line bearing 127°20'15\") "
                       f"- SOP position on the support line {oS[s] * 1000:.1f} mm")
    put(p + ".soil_layers.rows[0]", tag="Missing-Flagged", cells={"name": "units 2C2 very stiff clay, 3A1 / 3A2 / 3B / 3C1 sands, 3C2 very dense sand (109035 table 2)"},
        note="layer levels and lateral moduli not on the drawings: 'values are a function of depth, refer geotechnical report'")
    put(p + ".backfill.rows[0]", tag="Missing-Flagged", cells={}, note="select backfill to TfNSW D&C B30 (109055); properties not printed")
    put(p + ".rock_kh", tag="Missing-Flagged", unit="MN/m3", note="piles found in very dense sand 3C2 (109031); no rock")
    put(p + ".curtain_wall.rows[0]", R[p + ".curtain_wall.thickness"], cells={"thickness": 350.0, "height": float(R[p + ".curtain_wall.height"]["value"])})
    for k in range(1, 6):
        q = p + ".piles[%s-%02d]" % (s, k)
        put(q + ".E", R[q + ".E"], unit="m", inputs=[]); put(q + ".N", R[q + ".N"], unit="m", inputs=[])
        put(q + ".diameter", R[q + ".diameter"], value=900.0 + 2 * 16, unit="mm", tag="Calculated",
            derivation="outside diameter = 900 internal (109035 '∅900 ID') + 2 x 16 wall (109031 table 1)", inputs=[q + ".wall_thickness"])
        dl = R[q + ".design_loads"]
        put(q + ".design_actions.rows[0]", dl, cells={"limit_state": "SLS", "N": 3535.0}, note="109035 table 4; not concurrent")
        put(q + ".design_actions.rows[1]", dl, cells={"limit_state": "ULS", "N": 5175.0, "M": 1831.0},
            note="109035 table 4: ULS moment 1831 kNm (concrete) + 50 kNm (steel part); not concurrent with N"); put(q + ".rl_top", R[q + ".rl_top"], unit="m"); put(q + ".rl_toe", R[q + ".rl_toe"], unit="m")
        put(q + ".rl_rock", R[q + ".rl_rock"], unit="m")
        put(q + ".wall_thickness", R[q + ".wall_thickness"], unit="mm")
put("custom.steel_pile_driving_stress_limit", R["materials.steel_pile.fy_limit"], unit="MPa")

# ---------------- materials ----------------
for i, (el, pth) in enumerate((("Super-T girders", "girders"), ("deck", "deck"), ("abutments", "abutments"), ("pile infill", "pile infill"), ("precast barriers", "precast barriers"))):
    r = R[f"materials.concrete[{pth}].fc"]
    cells = {"element": el, "fc": float(r["value"])}
    put(f"materials.concrete.rows[{i}]", r, cells=cells)
put("materials.steel.rows[0]", tag="Missing-Flagged", cells={"element": "steel tube piles"},
    note="Ø900 x 16 driven steel tubes with concrete infill (109031 / 109035); grade, Es and density not printed (driving stress limited to 315 MPa)")
put("materials.strand.rows[0]", R["materials.strand.fpb"], cells={"type": "15.2 mm 7-wire ordinary, relax 2", "diameter": 15.2, "fpb": 1830.0})
put("custom.strand_MBL", R["materials.strand.MBL"], unit="kN"); put("custom.strand_force_after_release", R["materials.strand.jacking_force_after_release"], unit="kN")

# ---------------- loads ----------------
put("loads.traffic_models.rows[0]", R["loads.traffic_models"], cells={"model": "M1600", "on": True})
put("loads.traffic_models.rows[1]", R["loads.traffic_models"], cells={"model": "S1600", "on": True})
put("loads.design_speed", R["loads.design_speed"], unit="km/h")
for k in ("braking_force", "traffic_surcharge", "shrinkage_creep_shortening"):
    put("loads." + k, R.get("loads." + k) or R["loads.temperature"], unit={"braking_force": "kN", "traffic_surcharge": "kPa", "shrinkage_creep_shortening": "1e-6"}[k], tag="Missing-Flagged",
        note="not printed on the cover sheet (109001); design report M1RTBH2T-JHGM-6003BR09-BR-RPT-109001 not supplied")
for i, (it, un) in enumerate((("V_uls", "m/s"), ("V_sls", "m/s"))):
    put(f"loads.wind.rows[{i}]", R["loads.wind." + it], cells={"item": it, "value": float(R["loads.wind." + it]["value"]), "unit": un})
for i, it in enumerate(("kp", "Z", "site_class")):
    put(f"loads.earthquake.rows[{i}]", R["loads.earthquake." + it], cells={"item": it, "value": str(R["loads.earthquake." + it]["value"])})
# rows the platform reads that the drawings do not give: written as Missing-Flagged placeholders (item / depth only)
NP = "not printed on 109001; design report M1RTBH2T-JHGM-6003BR09-BR-RPT-109001 not supplied"
for i, it in enumerate(("V_with_traffic", "air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction", "vehicle_line_load", "vehicle_height"), 2):
    put(f"loads.wind.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note=NP)
for i, it in enumerate(("T_max", "T_min", "T_set", "alpha")):
    put(f"loads.temperature.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note=NP)
for gname in ("gradient_positive", "gradient_negative"):
    for i in range(13):
        put(f"loads.{gname}.rows[{i}]", tag="Missing-Flagged", cells={"depth": 100.0 * i}, note=NP)
for i, it in enumerate(("Rf", "zeta", "vertical"), 3):
    put(f"loads.earthquake.rows[{i}]", tag="Missing-Flagged", cells={"item": it}, note=("µ 1.0 longitudinal / transverse printed (109001); Rf not printed" if it == "Rf" else NP))
for k in ("design_lanes", "heavy_load_platform", "concurrent_traffic_with_HLP", "fatigue", "route_factor", "design_standard"):
    put("custom." + k, R["loads." + k])
put("custom.differential_settlement", R["loads.differential_settlement"], unit="mm")
for k in ("region", "terrain", "ARI_uls", "ARI_sls"):
    put("custom.wind_" + k, R["loads.wind." + k], unit="years" if "ARI" in k else None)
for k in ("mu_longitudinal", "mu_transverse"):
    put("custom.earthquake_" + k, R["loads.earthquake." + k])

# ---------------- analysis: platform modelling settings (Model), the same as BR13A ----------------
for i, (it, v, why) in enumerate((("tgt", "2.8", "transverse member spacing target (m), as BR13A"), ("merge", "0.4", "node merge tolerance (m), as BR13A"),
                                  ("midgap", "1", "mid-gap longitudinal lines, as BR13A (owner choice there)"), ("model", "2", "integrated model, as BR13A (owner choice there)"),
                                  ("girder_J_factor", "1.0", "Super-T torsion stiffness factor, as BR13A (ADR-041; torsion approach open, P4-6)"),
                                  ("deck_top_reference", "1", "nodes at the deck top, members offset (ADR-043), as BR13A"))):
    put(f"analysis.grillage.rows[{i}]", tag="Model", cells={"item": it, "value": v}, model_note=why)
for k, v, un, why in (("bearing_fixed_stiffness", 1e7, "kN/m", "rigid idealisation, as BR13A"), ("pile_toe", "vertical only", None, "as BR13A"),
                      ("column_segment", 1.0, "m", "piles split to about 1 m, as BR13A"), ("soil_factor", 1, None, "sensitivity factor, as BR13A"),
                      ("modes", 30, None, "response spectrum modes, as BR13A")):
    put("analysis." + k, tag="Model", value=v, unit=un, model_note=why)

docs_list = sorted(docs.values(), key=lambda d: d["id"])
json.dump({"origin": "projects/B12626/extraction/B12626_values.json (Second_Example.pdf, sha256 a03329fc...)", "documents": docs_list, "values": out},
          open(os.path.join(H, "B12626_description_values.json"), "w"), indent=1, ensure_ascii=False)
print(len(out), "description values,", len(docs_list), "documents")
