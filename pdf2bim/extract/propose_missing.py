"""Development placeholders for inputs the drawings never give (P9.2), proposed as ONE decision for the engineer.

The same placeholders the three example bridges ran with (BR13A D-46, B12626 / B12453 D-1): each is tagged Assumed
(or Standard-verify with its standards key) with what should replace it. They are PROPOSED overrides: the extracted
values stay the record; the chain uses them only with "use proposed inputs"; only a person can accept them (ADR-005).
A field that the drawings did fill is never touched."""
import datetime, json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "schema"))
from propose_override import propose          # noqa: E402
from rules_0_2 import records, check          # noqa: E402
from c14n import stamp                        # noqa: E402

A, SV = "Assumed", "Standard-verify"
RPT = "the design report / design criteria for this bridge"
GEO = "the geotechnical report for this site"
CAT = "the bearing manufacturer's data sheet"
HOG = "the girder designer's prestress / hog calculation inputs"
AS = "as the example bridges (BR13A / B12626 / B12453)"

# (path with {support} / {bearing} / {supert} placeholders, value or row cells, unit, tag, why, replace_with or std ref)
SCALARS = [
    ("superstructure.edge_flange_setback", 40, "mm", A, f"edge flange tip to deck edge not dimensioned; 40 {AS}", "the edge girder flange width on the girder drawings"),
    ("superstructure.flange_gap", 20, "mm", A, f"gap between precast flanges not dimensioned; 20 {AS}", "girder spacing less flange widths on the girder drawings"),
    ("superstructure.supert_types[{supert}].haunch", 0, "mm", A, f"girder top to deck soffit not dimensioned; 0 {AS} (haunch concrete is applied as SDL)", "deck RLs less girder top levels"),
    ("superstructure.supert_types[{supert}].age_at_transfer", 1, "days", A, "steam-cured girders: transfer the next day (as the examples)", HOG),
    ("superstructure.supert_types[{supert}].age_deck_cast", 100, "days", A, f"deck cast at about 100 days {AS}", "the construction programme"),
    ("deck.surfacing_density", 22, "kN/m3", SV, "asphalt density (AS 5100.2) as the examples; standards value UNVERIFIED", "std:AS5100.2-2017/density/asphalt"),
    ("loads.traffic_surcharge", 10, "kPa", A, f"not on the drawings; 10 kPa {AS}", RPT),
    ("loads.braking_force", 500, "kN", A, f"not on the drawings; 500 kN {AS}; AS 5100.2 Cl 7.8.2 not calculated", "AS 5100.2 Cl 7.8.2 for this bridge"),
    ("loads.shrinkage_creep_shortening", 300, "1e-6", A, f"not on the drawings; 300e-6 {AS}", RPT),
    ("supports[{support}].rock_kh", 200, "MN/m3", A, f"rock subgrade modulus not given; 200 {AS}", GEO),
    ("bearings.items[{bearing}].restraint_longitudinal", "elastic", None, A, "laminated elastomeric bearing in shear (as the examples)", "the engineer's restraint idealisation"),
    ("bearings.items[{bearing}].restraint_transverse", "elastic", None, A, "laminated elastomeric bearing in shear (as the examples)", "the engineer's restraint idealisation"),
    ("bearings.items[{bearing}].elastomer_thickness", 112, "mm", A, f"total elastomer not printed; 112 {AS}", CAT),
    ("bearings.items[{bearing}].layer_thickness", 16, "mm", A, f"internal layer not printed; 16 {AS}", CAT),
    ("bearings.items[{bearing}].shear_modulus", 0.69, "MPa", A, f"not printed; 0.69 MPa {AS}", CAT),
]


def _grad(d):
    return round(32 * ((1200 - d) / 1200) ** 5, 2) if d < 1200 else 0.0


# table rows, matched by a key column; (table path, key column, cells, tag, why, replace_with or ref)
ROWS = [("loads.wind", "item", {"item": "V_with_traffic", "value": 35.0, "unit": "m/s"}, SV, "AS 5100.2 wind with traffic, as the examples (UNVERIFIED)", "std:AS5100.2-2017/wind/with-traffic"),
        ("loads.wind", "item", {"item": "air_density", "value": 1.2, "unit": "kg/m3"}, SV, "AS 1170.2 air density, as the examples (UNVERIFIED)", "std:AS1170.2/air-density")]
ROWS += [("loads.wind", "item", {"item": it, "value": v, "unit": u}, A, f"not on the drawings; {v} {AS}", "AS 5100.2 section 17 for this deck")
         for it, v, u in (("Cd", 1.5, "-"), ("CL", 0.75, "-"), ("vertical_eccentricity_b", 0.25, "-"), ("longitudinal_fraction", 0.25, "-"),
                          ("vehicle_line_load", 1.5, "kN/m"), ("vehicle_height", 2.0, "m"))]
ROWS += [("loads.temperature", "item", {"item": it, "value": v, "unit": u}, A, f"not on the drawings; {v} {AS}", "AS 5100.2 section 18 for the site")
         for it, v, u in (("T_max", 45.0, "C"), ("T_min", 5.0, "C"), ("T_set", 20.0, "C"), ("alpha", 1e-5, "1/C"))]
ROWS += [(f"loads.gradient_{s}", "depth", {"depth": 100.0 * i, "dT": f(_grad(100.0 * i))}, A, why, "AS 5100.2 section 18 gradient for this deck")
         for s, f, why in (("positive", lambda x: x, "T = 32((1200 - d)/1200)^5, as the examples"), ("negative", lambda x: round(-0.5 * x, 2), "-0.5 x positive, as the examples"))
         for i in range(13)]
ROWS += [("loads.earthquake", "item", {"item": "Rf", "value": "1"}, A, "elastic response, Rf 1 as the examples", "AS 5100.2 Rf for the bearings' ductility"),
         ("loads.earthquake", "item", {"item": "zeta", "value": "0.05"}, SV, "5 % damping, as the examples (UNVERIFIED)", "std:AS1170.4/zeta"),
         ("loads.earthquake", "item", {"item": "vertical", "value": "False"}, A, "no vertical earthquake, as the examples", RPT)]
ROWS += [("design.prestress_losses", "item", {"item": it, "value": v, "unit": u}, A, f"not on the drawings; {v} {AS}", HOG)
         for it, v, u in (("k4", 0.6, "-"), ("chi", 0.8, "-"), ("ts", 1.0, "days"), ("Rb", 2.0, "%"), ("k7", 1.0, "-"), ("Tav", 20.0, "C"), ("jt", 8.0, "days"),
                          ("rb", 0.0071, "-"), ("dhard", 7.0, "days"), ("tsd", 7.0, "days"), ("rd", 0.0, "-"), ("sidl", 4.0, "kN/m"), ("sidlA", 130.0, "days"),
                          ("dform", 1.0, "kN/m"), ("meth", 1.0, "-"), ("rlx", 1.0, "-"), ("relpre", 1.0, "-"), ("emod", 1.0, "-"))]
ROWS += [("supports[{support}].soil_layers", None, {"name": "placeholder single layer", "kh": 10.0, "gamma": 20.0, "phi": 30.0}, A,
          f"one layer pile top to rock, kh 10 MN/m3 {AS}: pile moments depend on it", GEO),
         ("supports[{support}].backfill", None, {"gamma": 20.0, "phi": 30.0, "K": "K0"}, A, f"backfill at rest, gamma 20, phi 30 {AS}", GEO)]


def _ids(values, prefix):
    """Item ids already in the extracted values, e.g. prefix 'bearings.items[' -> ['A-01', ...]."""
    out = []
    for v in values:
        p = v["path"]
        if p.startswith(prefix):
            i = p[len(prefix):].split("]", 1)[0]
            if i not in out:
                out.append(i)
    return out


def _expand(path, ids):
    for key, lst in (("{support}", ids["support"]), ("{bearing}", ids["bearing"]), ("{supert}", ids["supert"])):
        if key in path:
            return [p for i in lst for p in _expand(path.replace(key, i), ids)]
    return [path]


def add_placeholders(values):
    """Before the description is built: an empty (Missing-Flagged) row for every placeholder table row the drawings
    did not give, so that the proposal has a record to attach to. Returns the extended values list."""
    ids = {"support": _ids(values, "supports["), "bearing": _ids(values, "bearings.items["), "supert": _ids(values, "superstructure.supert_types[")}
    out = list(values)
    for table, key, cells, *_ in ROWS:
        for t in _expand(table, ids):
            rows = [v for v in out if v["path"].startswith(t + ".rows[")]
            if key is None:
                if rows:
                    continue
            elif any((v.get("cells") or {}).get(key) == cells[key] for v in rows):
                continue
            out.append({"path": f"{t}.rows[{len(rows)}]", "tag": "Missing-Flagged", "cells": ({key: cells[key]} if key else {}),
                        "note": "not on the drawings (placeholder row for a proposed development input)"})
    seen = {}                                          # rows numbered 0, 1, 2 ... per table, in order (the format requires it)
    for v in out:
        if ".rows[" in v["path"]:
            t = v["path"].rsplit(".rows[", 1)[0]
            v["path"] = f"{t}.rows[{seen.setdefault(t, 0)}]"; seen[t] += 1
    return out


def propose_defaults(desc_path, decision="D-1", evidence="pdf2bim/extract/propose_missing.py"):
    """Propose a placeholder on every Missing-Flagged record that has one; one decision, one new revision. -> count."""
    doc = json.load(open(desc_path))
    first = doc["revision"]["number"]
    created = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    R = dict(records(doc))
    ids = {"support": [s["id"] for s in doc.get("supports") or []], "bearing": [b["id"] for b in (doc.get("bearings") or {}).get("items") or []],
           "supert": [s["id"] for s in (doc.get("superstructure") or {}).get("supert_types") or []]}
    todo = []
    for path, value, unit, tag, why, extra in SCALARS:
        todo += [(p, value, unit, tag, why, extra) for p in _expand(path, ids)]
    for table, key, cells, tag, why, extra in ROWS:
        for t in _expand(table, ids):
            for p, rec in R.items():
                if p.startswith(t + ".rows[") and (key is None or (rec.get("cells") or {}).get(key) == cells[key]):
                    todo.append((p, cells, None, tag, why, extra))
                    break
    n = 0
    for path, value, unit, tag, why, extra in todo:
        rec = R.get(path)
        if rec is None or rec.get("tag") != "Missing-Flagged" or rec.get("overrides"):
            continue                                  # filled from the drawings, or already proposed: never touched
        kw = {"replace_with": extra} if tag == A else {}
        doc, ov = propose(doc, path, value, tag, why, [evidence], "AI", decision, {"note": why}, unit, created, **kw)
        if tag == SV:
            ov["ref"] = extra; stamp(doc)
        R = dict(records(doc)); n += 1
    if not n:
        return 0
    log = desc_path.replace(".bridge.0.2.json", ".decisions.jsonl")
    dec = {decision: {"id": decision, "date": created, "by": "AI", "key": "(development placeholders for inputs the drawings do not give)", "from": None,
                      "from_tag": None, "to": None, "to_tag": "Assumed", "status": "proposed", "evidence": [evidence],
                      "reason": "inputs the analysis needs that the drawings do not give (soil, bearings, temperatures, wind coefficients, prestress losses): "
                                "the placeholders the example bridges ran with, so the chain can run; each says what should replace it",
                      "affects": ["geometry", "model", "loads", "design.supert", "substructure"]}}
    doc["revision"] = {"number": first + 1, "parent_hash": json.load(open(desc_path))["hash"]["value"], "created": created, "author": "AI",
                       "note": f"{n} development placeholders proposed under {decision}", "decision_log_sha256": None}
    stamp(doc)
    errs = check(doc, dec)
    if errs:
        raise ValueError("placeholders refused by the format rules: " + "; ".join(errs[:10]))
    hist = os.path.join(os.path.dirname(desc_path), "history"); os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, os.path.basename(desc_path).replace(".json", f".r{first}.json"))
    if not os.path.exists(keep):
        open(keep, "w").write(open(desc_path).read())
    json.dump(doc, open(desc_path, "w"), indent=1, ensure_ascii=False)
    open(log, "a").write(json.dumps(dec[decision], ensure_ascii=False) + "\n")
    return n
