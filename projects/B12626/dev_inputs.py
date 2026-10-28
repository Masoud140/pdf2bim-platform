#!/usr/bin/env python3
"""B12626 development inputs (P6 stage 3b): values the platform chain needs that the drawings do not give.

    python3 projects/B12626/dev_inputs.py        # proposes every item below on B12626.bridge.0.2.json (decision D-1, PROPOSED)

Every item is a PROPOSED override under decision D-1: the extracted values stay the current values, the tools use
the proposals only with --allow-proposed (as BR13A's D-34...D-46 before acceptance), and the owner accepts, changes or
rejects them. Calculated items are arithmetic on drawing values; Assumed items are engineering placeholders with what
should replace them; Model items are platform modelling choices (the BR13A settings). Re-running is idempotent: an
item already proposed is skipped.
"""
import copy, datetime, json, os, sys
H = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(H, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "schema"))
from propose_override import propose
from rules_0_2 import records, check
from c14n import stamp

F = os.path.join(H, "B12626.bridge.0.2.json")
LOG = os.path.join(H, "B12626.decisions.jsonl")
DEC = "D-1"
A, C, Mo, SV = "Assumed", "Calculated", "Model", "Standard-verify"
T312 = "std:AS5100.5:concrete:table_3_1_2"

# (path, value (cells for a table row), unit, tag, why, replace_with (Assumed) / derivation inputs (Calculated) / ref (Standard-verify))
ITEMS = [
    ("superstructure.flange_gap", 24, "mm", C, "2344 girder spacing (109051) - 2 x 1160 flange (109202-204) = 24; across the median "
     "(2269) the platform then trims both flanges to 1122.5 — the drawings show 1160 (owner query: 51 mm overlap)", []),
    ("superstructure.edge_flange_setback", 40, "mm", A, "flange tip to deck edge from the offsets: 36 (SG-01, east) / 43 (SG-10, west); the catalogue holds one value",
     "a per-side setback (catalogue change) or the owner's choice"),
    ("materials.concrete.rows[0]", {"element": "Super-T girders", "fc": 60.0, "E": 36533.0, "density": 25.5}, None, SV,
     "fc 60 (109201); E interpolated in AS 5100.5 Table 3.1.2 between 50 MPa (34800) and 65 MPa (37400) = 36533 (standards entry "
     "code-extracted, UNVERIFIED); density 2600 kg/m3 (109201 notes) x 9.80665 = 25.5 kN/m3", T312),
    ("materials.concrete.rows[1]", {"element": "deck", "fc": 40.0, "E": 32800.0, "density": 25.5}, None, A,
     "fc 40 (109301); E = AS 5100.5 Table 3.1.2 at 40 MPa (32800, standards entry UNVERIFIED); density not printed for the deck: 25.5 kN/m3 as the girders",
     "deck concrete density from the design report / specification"),
    ("superstructure.supert_types[ST1].haunch", 0, "mm", A, "girder top to deck soffit not dimensioned (109303 section 2: slab '200 MIN', varies); 0 as BR13A",
     "haunch from the top-of-concrete RLs (109302 table 1) less girder soffit levels (bearing RL X + plate + epoxy block, 109151 / 109152) less 1215"),
]
ITEMS += [
    ("materials.concrete.rows[3]", {"element": "pile infill", "fc": 50.0, "E": 34800.0, "density": 25.5}, None, A,
     "fc 50 (109031); E = AS 5100.5 Table 3.1.2 at 50 MPa (34800, standards entry UNVERIFIED); density not printed: 25.5 kN/m3 as the girders",
     "infill concrete density from the specification"),
    ("materials.concrete.rows[2]", {"element": "abutments", "fc": 40.0, "E": 32800.0, "density": 25.5}, None, A,
     "fc 40 (109051); E = AS 5100.5 Table 3.1.2 at 40 MPa (32800, standards entry UNVERIFIED); density not printed: 25.5 kN/m3",
     "abutment concrete density from the specification"),
    ("materials.steel.rows[0]", {"element": "steel tube piles", "Es": 200000.0, "density": 78.5}, None, A,
     "Es 200000 MPa and 78.5 kN/m3 (usual structural steel values, not printed; grade not printed)", "steel grade / properties from the pile specification (AS 5100.6)"),
]
ITEMS += [
    ("deck.surfacing_density", 22, "kN/m3", SV, "asphalt surfacing density (AS 5100.2), as BR13A; standards value UNVERIFIED", "std:AS5100.2-2017/density/asphalt"),
]
ITEMS += [
    ("deck.barriers[barrier_left].offset", round(-9.5033 - 0.34, 4), "m", A, "inside face -9.5033 (carriageway edge) - 340 = half the 680 precast unit plan width (109402); centroid not computed",
     "barrier centroid from the precast barrier section (109404)"),
    ("deck.barriers[barrier_right].offset", round(13.1167 + 0.34, 4), "m", A, "inside face 13.1167 + 340 = half the 680 precast unit plan width (109402); centroid not computed",
     "barrier centroid from the precast barrier section (109404)"),
    ("deck.barriers[barrier_median].offset", 1.8097, "m", C, "median centre = crown (alignment.crossfall crown_offset): symmetric section (109303 detail D)", ["alignment.crossfall.rows[0]"]),
    ("deck.barriers[barrier_median].weight", round(0.3663 * 25.5, 2), "kN/m", A, "area 0.3663 m2 (109303 detail D, Calculated) x 25.5 kN/m3 (density not printed)",
     "cast-in-place concrete density from the specification"),
]
RPT = "B12626 design report M1RTBH2T-JHGM-6003BR09-BR-RPT-109001 (not supplied)"
ITEMS += [
    ("loads.traffic_surcharge", 10, "kPa", A, "not printed; 10 kPa as BR13A", RPT),
    ("loads.braking_force", 500, "kN", A, "not printed; 500 kN as BR13A — AS 5100.2 Cl 7.8.2 for 7 lanes / 28 m not calculated yet", "AS 5100.2 Cl 7.8.2 calculation / " + RPT),
    ("loads.shrinkage_creep_shortening", 300, "1e-6", A, "not printed; 300e-6 as BR13A", RPT),
    ("loads.wind.rows[2]", {"item": "V_with_traffic", "value": 35.0, "unit": "m/s"}, None, SV, "AS 5100.2 wind with traffic, as BR13A (UNVERIFIED)", "std:AS5100.2-2017/23.3/wind-with-traffic"),
    ("loads.wind.rows[3]", {"item": "air_density", "value": 1.2, "unit": "kg/m3"}, None, SV, "AS 1170.2 air density, as BR13A (UNVERIFIED)", "std:AS1170.2/air-density"),
]
for i, (it, v_, u_) in enumerate((("Cd", 1.5, "-"), ("CL", 0.75, "-"), ("vertical_eccentricity_b", 0.25, "-"), ("longitudinal_fraction", 0.25, "-"),
                                  ("vehicle_line_load", 1.5, "kN/m"), ("vehicle_height", 2.0, "m")), 4):
    ITEMS.append((f"loads.wind.rows[{i}]", {"item": it, "value": v_, "unit": u_}, None, A, f"not printed; {v_} as BR13A", "AS 5100.2 Cl 17 wind coefficients for this deck / " + RPT))
for i, (it, v_, u_) in enumerate((("T_max", 45.0, "C"), ("T_min", 5.0, "C"), ("T_set", 20.0, "C"), ("alpha", 1e-5, "1/C"))):
    ITEMS.append((f"loads.temperature.rows[{i}]", {"item": it, "value": v_, "unit": u_}, None, A, f"not printed; {v_} as BR13A (site: Raymond Terrace)", "AS 5100.2 Cl 17 shade temperatures for the site / " + RPT))
for i in range(13):
    d_ = 100.0 * i
    tp = round(32 * ((1200 - d_) / 1200) ** 5, 2) if d_ < 1200 else 0.0
    ITEMS.append((f"loads.gradient_positive.rows[{i}]", {"depth": d_, "dT": tp}, None, A, "T = 32((1200 - d)/1200)^5, as BR13A", "AS 5100.2 Cl 17 gradient for this deck / " + RPT))
    ITEMS.append((f"loads.gradient_negative.rows[{i}]", {"depth": d_, "dT": round(-0.5 * tp, 2)}, None, A, "-0.5 x positive, as BR13A", "AS 5100.2 Cl 17 gradient for this deck / " + RPT))
ITEMS += [
    ("loads.earthquake.rows[3]", {"item": "Rf", "value": "1"}, None, A, "µ = 1.0 longitudinal and transverse printed (109001): elastic, Rf 1 as BR13A", "AS 5100.2 Cl 14 Rf for µ = 1.0 / " + RPT),
    ("loads.earthquake.rows[4]", {"item": "zeta", "value": "0.05"}, None, SV, "5 % damping, as BR13A (UNVERIFIED)", "std:AS1170.4/zeta"),
    ("loads.earthquake.rows[5]", {"item": "vertical", "value": "False"}, None, A, "no vertical earthquake, as BR13A", RPT),
]
GEO = "geotechnical interpretive report M1RTBH2T-JHGM-6003-GE-RPT-152001 (109001 references)"
for s_, tops in (("A", (5.977, 6.122, 6.266, 6.122, 5.977)), ("B", (5.484, 5.627, 5.770, 5.627, 5.484))):
    for k in range(1, 6):
        ITEMS.append((f"supports[{s_}].piles[{s_}-{k:02d}].rl_rock", -22.5, "m", A, "no rock: piles found in very dense sand (3C2, 109031); "
                      "rock level put at the toe so no rock socket is modelled", GEO))
    ITEMS += [
        (f"supports[{s_}].soil_layers.rows[0]", {"name": "sands / clay (placeholder single layer)", "kh": 10.0, "gamma": 20.0, "phi": 30.0}, None, A,
         "placeholder: one layer from the ground (pile top) to the toe, kh 10 MN/m3 as BR13A's fill — the drawings defer to the geotechnical report", GEO),
        (f"supports[{s_}].rock_kh", 200, "MN/m3", A, "not used (no rock socket); 200 as BR13A", GEO),
        (f"supports[{s_}].backfill.rows[0]", {"gamma": 20.0, "phi": 30.0, "K": "K0"}, None, A, "select backfill (109055): gamma 20, phi 30, at rest, as BR13A", GEO),
    ]
CAT = "manufacturer catalogue data for part AS [50] 070907R (109152)"
for s_ in "AB":
    for k in range(1, 11):
        b_ = "bearings.items[%s-%02d]" % (s_, k)
        ITEMS += [
            (b_ + ".restraint_longitudinal", "elastic", None, A, "laminated elastomeric bearing in shear; buffer bearings at the curtain wall after a 35 (±5) gap "
             "(109055) not modelled", "engineer's restraint idealisation"),
            (b_ + ".restraint_transverse", "elastic", None, A, "laminated elastomeric bearing in shear" + ("; lateral restraint block SG-05 / SG-06 with a 10 nom gap "
             "(109056) not modelled" if k in (5, 6) else ""), "engineer's restraint idealisation"),
            (b_ + ".elastomer_thickness", 84, "mm", A, "not printed: 6 x 12 internal + 2 x 6 cover = 84 fits the 115 bearing height with 7 x 4.5 shims", CAT),
            (b_ + ".layer_thickness", 12, "mm", A, "not printed: 12 mm internal layers, as BR13A (D-40)", CAT),
            (b_ + ".shear_modulus", 0.69, "MPa", A, "not printed: 0.69 MPa as BR13A ('[50]' in the part number may be the hardness)", CAT),
        ]


def main():
    doc = json.load(open(F))
    first_rev = doc["revision"]["number"]
    dec = {json.loads(l)["id"]: json.loads(l) for l in open(LOG)} if os.path.exists(LOG) else {}
    created = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    R = dict(records(doc)); done = 0
    for path, value, unit, tag, why, extra in ITEMS:
        rec = R[path]
        if any(o.get("decision") == DEC for o in rec.get("overrides", [])):
            continue
        kw = {"derivation": {"formula": why, "inputs": extra}} if tag == C else {"replace_with": extra} if tag == A else {}
        src = {"note": why} if tag in (A, Mo, SV) else None
        doc, ov = propose(doc, path, value, tag, why, ["B12626 drawing set (Second_Example.pdf)"], "AI", DEC, src, unit, created, **kw)
        if tag == SV:
            ov["ref"] = extra; stamp(doc)
        R = dict(records(doc)); done += 1
    if not done:
        print("nothing new to propose"); return
    if DEC not in dec:
        dec[DEC] = {"id": DEC, "date": created, "by": "AI", "key": "(B12626 development inputs: projects/B12626/dev_inputs.py)", "from": None, "from_tag": None,
                    "to": None, "to_tag": None, "reason": "values the platform chain needs that the B12626 drawings do not give, so P6 can run "
                    "(owner 2026-10-28: B12626 is the second example to test the model); Calculated items are arithmetic on drawing values, "
                    "Assumed items are placeholders to replace", "evidence": ["projects/B12626/dev_inputs.py"], "status": "proposed",
                    "affects": ["geometry", "sections", "model", "loads"]}
        open(LOG, "a").write(json.dumps(dec[DEC], ensure_ascii=False) + "\n")
    doc["revision"] = {"number": first_rev + 1, "parent_hash": json.load(open(F))["hash"]["value"], "created": created, "author": "AI",
                       "note": f"{done} overrides proposed under {DEC} (projects/B12626/dev_inputs.py)", "decision_log_sha256": None}
    stamp(doc)
    errs = check(doc, dec)
    if errs:
        sys.exit("refused:\n  " + "\n  ".join(errs[:20]))
    hist = os.path.join(H, "history"); os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, f"B12626.bridge.0.2.r{first_rev}.json")
    if not os.path.exists(keep):
        open(keep, "w").write(open(F).read())
    json.dump(doc, open(F, "w"), indent=1, ensure_ascii=False)
    print(f"{done} proposals under {DEC}; revision {first_rev} -> {doc['revision']['number']}")


if __name__ == "__main__":
    main()
