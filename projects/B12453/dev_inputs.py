#!/usr/bin/env python3
"""B12453 (SB02) development inputs (P8 stage 2): values the platform chain needs that neither the drawings nor the design report give.

    python3 projects/B12453/dev_inputs.py        # proposes every item below on B12453.bridge.0.2.json (decision D-1, PROPOSED)

Every item is a PROPOSED override under decision D-1: the extracted values stay the current values, the tools use
the proposals only with --allow-proposed (as B12626's D-1), and the owner accepts, changes or
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

F = os.path.join(H, "B12453.bridge.0.2.json")
LOG = os.path.join(H, "B12453.decisions.jsonl")
DEC = "D-1"
A, C, Mo, SV = "Assumed", "Calculated", "Model", "Standard-verify"
T312 = "std:AS5100.5:concrete:table_3_1_2"

# (path, value (cells for a table row), unit, tag, why, replace_with (Assumed) / derivation inputs (Calculated) / ref (Standard-verify))

RPT = "design report SGWS1-JHSW-1000-BR-RPT-000001: value not stated"
GEO = "Appendix J geotechnical design report (placeholder in the copy supplied)"
CAT = "manufacturer catalogue data for part AS [50] 070910R (0503)"
HOG = "the girder supplier's / designer's hog calculation inputs (0600 gives the basis only)"
ITEMS = [
    ("superstructure.edge_flange_setback", 40, "mm", A, "edge flange tip to deck edge not dimensioned; 40 as B12626 gives edge half-flanges 965 (G02-01) / 889 (G02-04) against 963-973 interior",
     "edge girder flange width from the girder plans (0602 / 0603)"),
    ("superstructure.supert_types[ST1].haunch", 0, "mm", A, "girder top to deck soffit not dimensioned (slab '200 MIN'); 0 as BR13A / B12626",
     "haunch from the deck RLs (0703 tables) less girder top (bearing RL X 0500 + plate + epoxy block + 1515)"),
    ("deck.barriers[barrier_left].offset", -6.28, "m", A, "inside face -6.000 (0701) - 280 = half the 561 PB-1 base (0902); centroid not computed", "barrier centroid from the PB-1 section (0909)"),
    ("deck.barriers[barrier_right].offset", 1.28, "m", A, "inside face 1.000 (0701) + 280 = half the 561 PB-1 base (0902); centroid not computed", "barrier centroid from the PB-1 section (0909)"),
    ("deck.other_sdl", round(2.0 / 7.8, 3), "kPa", A, "report table 2-5: utilities 1 kN/m + safety screens 1 kN/m = 2 kN/m spread over the 7.8 m deck (the catalogue holds an area load)",
     "line loads at their positions (catalogue: line SDL)"),
    ("loads.traffic_surcharge", 10, "kPa", A, "not stated; 10 kPa as BR13A", RPT),
    ("loads.braking_force", 500, "kN", A, "AS 5100.2 Cl 7.8.2 stated (report 2.4.5.4); not calculated yet: 500 kN as BR13A", "AS 5100.2 Cl 7.8.2 for 2 lanes / 33.4 m"),
    ("loads.shrinkage_creep_shortening", 179, "1e-6", A, "report table 4-9: shrinkage and creep joint movement 3.0 mm per joint over half the 33.559 deck = 179e-6 (if the movement splits equally)",
     "AS 5100.2 section 19 shortening strain (report basic shrinkage 800e-6)"),
    ("loads.wind.rows[3]", {"item": "air_density", "value": 1.2, "unit": "kg/m3"}, None, SV, "AS 1170.2 air density, as BR13A (UNVERIFIED)", "std:AS1170.2/air-density"),
]
for i, (it, v_, u_) in enumerate((("Cd", 1.5, "-"), ("CL", 0.75, "-"), ("vertical_eccentricity_b", 0.25, "-"), ("longitudinal_fraction", 0.25, "-"),
                                  ("vehicle_line_load", 1.5, "kN/m"), ("vehicle_height", 2.0, "m")), 4):
    ITEMS.append((f"loads.wind.rows[{i}]", {"item": it, "value": v_, "unit": u_}, None, A, f"not stated; {v_} as BR13A", "AS 5100.2 section 17 for this deck"))
for i, (it, v_, u_) in enumerate((("T_max", 45.0, "C"), ("T_min", 5.0, "C"), ("T_set", 20.0, "C"), ("alpha", 1e-5, "1/C"))):
    ITEMS.append((f"loads.temperature.rows[{i}]", {"item": it, "value": v_, "unit": u_}, None, A,
                  f"{v_} as BR13A" + (" (report table 2-1: 10e-6)" if it == "alpha" else " (report: AS 5100.2 coastal, region 2; values not stated)"), "AS 5100.2 section 18 shade temperatures"))
for i in range(13):
    d_ = 100.0 * i
    tp = round(32 * ((1200 - d_) / 1200) ** 5, 2) if d_ < 1200 else 0.0
    ITEMS.append((f"loads.gradient_positive.rows[{i}]", {"depth": d_, "dT": tp}, None, A, "T = 32((1200 - d)/1200)^5, as BR13A", "AS 5100.2 section 18 gradient"))
    ITEMS.append((f"loads.gradient_negative.rows[{i}]", {"depth": d_, "dT": round(-0.5 * tp, 2)}, None, A, "-0.5 x positive, as BR13A", "AS 5100.2 section 18 gradient"))
# haunch concrete over each girder as permanent SDL (owner rule 2026-11-05): parabolic haunch, zero at the thinnest point
# ('200 MIN' slab), extreme delta = vertical-curve rise over the girder chord - girder net camber after the deck pour
K = (6.0 - (-0.5)) / 100 / 155.289                      # 0111: grades +6.00 % / -0.50 %, curve length 155.289 m -> curvature 1/m
LG = 33.441                                             # 0601-0603 girder length
RISE = K * LG ** 2 / 8 * 1000                           # mm, crest: deck rises above the girder chord at midspan
CAMBER = 80 - 27                                        # 0600 hog at 100 days (deck pour age 100 d, proposed) - deck slab deflection 27
DELTA = RISE - CAMBER                                   # > 0: haunch largest at midspan, zero at the ends
OFF = {"G02-01": -5.3947, "G02-02": -3.4296, "G02-03": -1.4744, "G02-04": 0.4709}   # girder offsets (0305 / 0306, as values.py)
ids = list(OFF)
for i, g in enumerate(ids):
    halves = [(abs(OFF[g] - OFF[ids[j]]) - 0.020) / 2 if 0 <= j < len(ids) else abs(OFF[g] - edge) - 0.040
              for j, edge in ((i - 1, -6.4), (i + 1, 1.4))]  # interior: (spacing - 20 gap) / 2; edge: to the deck edge - 40 setback (proposed)
    w = round(sum(halves) * (2 / 3 * abs(DELTA) / 1000) * 25.0, 3)
    ITEMS.append((f"deck.haunch_concrete.rows[{i}]", {"girder": g, "w": w}, "kN/m", A,
                  f"flange width {sum(halves):.4f} m x mean haunch 2/3 x |{RISE:.1f} - ({CAMBER})| = {2 / 3 * abs(DELTA):.2f} mm x 25 kN/m3 (deck, report table 2-4); "
                  f"crest curve {RISE:.1f} mm over {LG} m from 0111, hog 80 at 100 days and deck deflection -27 from 0600; pour age 100 d proposed",
                  "the designer's haunch / deck-level table (deck RLs 0703 less girder tops from bearing RL X 0500 + stack + 1515 + measured hog)"))
ITEMS += [
    ("loads.earthquake.rows[3]", {"item": "Rf", "value": "1"}, None, A, "µ 1.0 longitudinal / 1.5 transverse (0101); one Rf in the platform: 1 (µ 1.0, the larger action)",
     "AS 5100.2 Rf per direction (platform: one value)"),
    ("loads.earthquake.rows[4]", {"item": "zeta", "value": "0.05"}, None, SV, "5 % damping, as BR13A (UNVERIFIED)", "std:AS1170.4/zeta"),
    ("loads.earthquake.rows[5]", {"item": "vertical", "value": "False"}, None, A, "no vertical earthquake, as BR13A", RPT),
    ("superstructure.supert_types[ST1].age_at_transfer", 1, "days", A, "steam cured 70 °C for 8 h (0600): transfer the next day", HOG),
    ("superstructure.supert_types[ST1].age_deck_cast", 100, "days", A, "deck cast after the 100-day hog of 0600 (girder self weight only to 100 days)", "construction programme"),
]
for i_, (it, v_, u_) in enumerate((("k4", 0.6, "-"), ("chi", 0.8, "-"), ("ts", 1.0, "days"), ("Rb", 2.0, "%"), ("k7", 1.0, "-")), 0):
    ITEMS.append((f"design.prestress_losses.rows[{i_}]", {"item": it, "value": v_, "unit": u_}, None, A, f"not stated; {v_} as BR13A", HOG))
ITEMS.append(("design.prestress_losses.rows[5]", {"item": "Tav", "value": 20.0, "unit": "C"}, None, A, "storage temperature not stated; 20 °C as B12626 (109201)", HOG))
for i_, (it, v_, u_) in enumerate((("jt", 8.0, "days"), ("rb", 0.0071, "-"), ("dhard", 7.0, "days"), ("tsd", 7.0, "days"), ("rd", 0.0, "-"), ("sidl", 4.0, "kN/m"),
                                   ("sidlA", 130.0, "days"), ("dform", 1.0, "kN/m"), ("meth", 1.0, "-"), ("rlx", 1.0, "-"), ("relpre", 1.0, "-"), ("emod", 1.0, "-")), 6):
    ITEMS.append((f"design.prestress_losses.rows[{i_}]", {"item": it, "value": v_, "unit": u_}, None, A,
                  f"not stated; {v_} as BR13A" + (" except SIDL at 130 days, after the 100-day deck" if it == "sidlA" else ""), HOG))
for s_, piles in (("A", ("A-01", "A-02", "A-03")), ("B", ("B-01", "B-02", "B-03"))):
    ITEMS += [
        (f"supports[{s_}].soil_layers.rows[0]", {"name": "fill / soft clay / sand (placeholder single layer)", "kh": 10.0, "gamma": 20.0, "phi": 30.0}, None, A,
         "placeholder: one layer pile top to rock, kh 10 MN/m3 as BR13A / B12626 — Appendix J gives the springs (report 4.2.2: halved / doubled, x3 earthquake)", GEO),
        (f"supports[{s_}].rock_kh", 200, "MN/m3", A, "Unit 6 Erm 50 / Unit 7 Erm 350 MPa (report table 5-4); subgrade modulus not given: 200 as BR13A", GEO),
        (f"supports[{s_}].backfill.rows[0]", {"gamma": 22.0, "phi": 30.0, "K": "K0"}, None, A, "report 2.4.3: φ 30°, c 0; compacted soil 22 kN/m3 (table 2-4); at rest", GEO),
        (f"supports[{s_}].curtain_wall.rows[0]", {"thickness": 400.0, "height": 1612.0}, None, A,
         "thickness not read (assumed 400); height = top RL 10.136 - seat RL 8.524 (0305 elevation, west end)", "abutment sections (0307 / 0313)"),
    ]
for s_ in "AB":
    for k in range(1, 5):
        b_ = "bearings.items[%s-%02d]" % (s_, k)
        ITEMS += [
            (b_ + ".restraint_longitudinal", "elastic", None, A, "laminated elastomeric bearing in shear; buffer bearings 30 mm gap (report 4.1.3) not modelled", "engineer's restraint idealisation"),
            (b_ + ".restraint_transverse", "elastic", None, A, "laminated elastomeric bearing in shear; lateral restraint block (0305) not modelled", "engineer's restraint idealisation"),
            (b_ + ".elastomer_thickness", 112, "mm", A, "not printed: 157 high bearing less shims; 112 placeholder", CAT),
            (b_ + ".layer_thickness", 16, "mm", A, "not printed: 16 mm internal layers placeholder", CAT),
            (b_ + ".shear_modulus", 0.69, "MPa", A, "not printed: 0.69 MPa as BR13A / B12626", CAT),
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
        doc, ov = propose(doc, path, value, tag, why, ["SGWS1-JHSW-1000-BR-DRG-COMBINED.pdf", "SGWS1-JHSW-1000-BR-RPT-000001 rev E"], "AI", DEC, src, unit, created, **kw)
        if tag == SV:
            ov["ref"] = extra; stamp(doc)
        R = dict(records(doc)); done += 1
    if not done:
        print("nothing new to propose"); return
    if DEC not in dec:
        dec[DEC] = {"id": DEC, "date": created, "by": "AI", "key": "(B12453 development inputs: projects/B12453/dev_inputs.py)", "from": None, "from_tag": None,
                    "to": None, "to_tag": "Assumed", "reason": "values the platform chain needs that the B12453 drawings do not give, so P6 can run "
                    "(owner 2026-10-28: B12453 is the second example to test the model); Calculated items are arithmetic on drawing values, "
                    "Assumed items are placeholders to replace", "evidence": ["projects/B12453/dev_inputs.py"], "status": "proposed",
                    "affects": ["geometry", "model", "loads", "design.supert", "substructure"]}
        open(LOG, "a").write(json.dumps(dec[DEC], ensure_ascii=False) + "\n")
    doc["revision"] = {"number": first_rev + 1, "parent_hash": json.load(open(F))["hash"]["value"], "created": created, "author": "AI",
                       "note": f"{done} overrides proposed under {DEC} (projects/B12453/dev_inputs.py)", "decision_log_sha256": None}
    stamp(doc)
    errs = check(doc, dec)
    if errs:
        sys.exit("refused:\n  " + "\n  ".join(errs[:20]))
    hist = os.path.join(H, "history"); os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, f"B12453.bridge.0.2.r{first_rev}.json")
    if not os.path.exists(keep):
        open(keep, "w").write(open(F).read())
    json.dump(doc, open(F, "w"), indent=1, ensure_ascii=False)
    print(f"{done} proposals under {DEC}; revision {first_rev} -> {doc['revision']['number']}")


if __name__ == "__main__":
    main()
