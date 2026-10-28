#!/usr/bin/env python3
"""Create a NEW bridge description (format 0.2) from extracted values — any bridge, no project code (P6 stage 3).

    python3 tools/new_description.py projects/X/extraction/X_values.json --out projects/X/X.bridge.0.2.json

Input (JSON object):
    {"documents": [{"id": "DRG-109001", "number": "...", "revision": "00", "kind": "drawing", "title": "..."}, ...],
     "values": [{"path": "deck.slab_thickness", "value": 200, "unit": "mm", "tag": "Direct",
                 "source": {"doc": "DRG-109301", "view": "section 1", "text": "200 MIN"}}, ...]}
- path: the description path as schema/rules_0_2.records() writes it; list items by id
  (superstructure.members[SG-01].length); a table row as <table>.rows[i] with "cells": {...} instead of "value";
- tag / source / derivation {formula, inputs} / note / replace_with / ref / decision as the format requires;
- custom.<name>: project items the catalogue has no field for.

Every catalogue field (schema/fields.py) that no value fills is written as Missing-Flagged (value null, status open,
note "not extracted"), tables as empty; nothing is invented. A path the catalogue does not know, or a unit other than
the catalogue's, is refused (listed in the report; no silent conversion). Then the 0.1 -> 0.2 record keeping is applied
(original = the extracted state), the content hash is stamped, and the result is checked against the 0.2 JSON Schema
and the format rules. Report: <out>.new.md.
"""
import argparse, copy, datetime, json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "schema"))
from fields import SECTIONS
from migrate_0_1_to_0_2 import migrate
from c14n import stamp
from rules_0_2 import check

SEG = re.compile(r"([^.\[\]]+)(?:\[([^\]]+)\])?")
KEEP = ("source", "derivation", "note", "replace_with", "ref", "decision")


def _missing(unit):
    r = {"value": None, "tag": "Missing-Flagged", "status": "open", "note": "not extracted"}
    if unit:
        r["unit"] = unit
    return r


def skeleton(spec):
    """Empty group / list / leaf for a catalogue spec."""
    if isinstance(spec, dict):
        return {k: skeleton(v) for k, v in spec.items()}
    if spec[0] == "list":
        return []
    if spec[0] == "table":
        return {"rows": []}
    return _missing(spec[1])


def resolve(doc, spec, path):
    """-> (container, key, leaf spec) for a path; creates list items (full skeleton) on first use."""
    parts = [m.groups() for m in SEG.finditer(path)]
    node, sp = doc, SECTIONS
    for i, (name, idx) in enumerate(parts):
        last = i == len(parts) - 1
        if name == "rows" and isinstance(sp, tuple) and sp[0] == "table":
            if not last or idx is None:
                raise KeyError(f"{path}: a table row is <table>.rows[i]")
            return node, ("rows", int(idx)), sp
        if not isinstance(sp, dict) or name not in sp:
            raise KeyError(f"{path}: '{name}' is not a catalogue field")
        sub = sp[name]
        if isinstance(sub, tuple) and sub[0] == "list":
            if idx is None:
                raise KeyError(f"{path}: list '{name}' needs an [id]")
            lst = node.setdefault(name, [])
            item = next((x for x in lst if x["id"] == idx), None)
            if item is None:
                item = {"id": idx, **skeleton(sub[1])}
                lst.append(item)
            if last:
                raise KeyError(f"{path}: a list item is not a value")
            node, sp = item, sub[1]
            continue
        if last:
            return node, name, sub
        node, sp = node[name], sub
    raise KeyError(path)


def build(inp, author, created):
    doc = {"format": "pdf2bim.bridge/0.1", "documents": inp.get("documents", []), "library": "library/products.json",
           "standards": "standards/AS5100-2017.json", "custom": {}}
    doc.update({k: skeleton(v) if not (isinstance(v, tuple) and v[0] == "list") else [] for k, v in SECTIONS.items()})
    refused, filled = [], 0
    for v in inp["values"]:
        p = v["path"]
        rec = {k: copy.deepcopy(v[k]) for k in KEEP if k in v}
        rec["tag"] = v["tag"]
        rec["status"] = v.get("status") or ("open" if v["tag"] == "Missing-Flagged" else "accepted")
        if p.startswith("custom."):
            name = p[len("custom."):]
            rec.update({"value": v.get("value")} if "cells" not in v else {})
            if v.get("unit"):
                rec["unit"] = v["unit"]
            if "cells" in v:
                doc["custom"].setdefault(name, {"rows": []})["rows"].append({"cells": v["cells"], **rec})
            else:
                doc["custom"][name] = rec
            filled += 1
            continue
        try:
            node, key, sp = resolve(doc, SECTIONS, p)
        except KeyError as e:
            refused.append((p, str(e)))
            continue
        if isinstance(key, tuple):                       # table row
            tbl = node                                   # resolve() stops on the table itself
            if key[1] != len(tbl["rows"]):
                refused.append((p, f"rows must be given in order (expected rows[{len(tbl['rows'])}])"))
                continue
            unknown = set(v.get("cells", {})) - set(sp[3])
            if unknown or "cells" not in v:
                refused.append((p, f"cells missing or not catalogue columns: {sorted(unknown)}"))
                continue
            tbl["rows"].append({"cells": v["cells"], **rec})
        else:
            unit = sp[1]
            if (v.get("unit") or "") != (unit or ""):
                refused.append((p, f"unit {v.get('unit')!r}, catalogue {unit!r}"))
                continue
            if unit:
                rec["unit"] = unit
            rec["value"] = v.get("value")
            node[key] = rec
        filled += 1
    doc02, _ = migrate(doc, {}, author, created)
    for _, r in __import__("rules_0_2").records(doc02):
        r["original"]["recorded_by"] = author
    doc02["revision"]["note"] = f"new description from extracted values ({inp.get('origin', 'values file')})"
    stamp(doc02)
    return doc02, filled, refused


def validate(doc):
    from jsonschema import Draft202012Validator
    sch = json.load(open(os.path.join(ROOT, "schema", "bridge.schema.0.2.json")))
    errs = [f"{'/'.join(map(str, e.absolute_path))}: {e.message[:160]}" for e in Draft202012Validator(sch).iter_errors(doc)]
    return errs + check(doc)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("values"); ap.add_argument("--out", required=True); ap.add_argument("--author", default="AI (extraction)")
    ap.add_argument("--created")
    a = ap.parse_args()
    if os.path.exists(a.out):
        sys.exit(f"{a.out} exists: a new description is never written over an existing one (use the override tools)")
    inp = json.load(open(a.values))
    created = a.created or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    doc, filled, refused = build(inp, a.author, created)
    errs = validate(doc)
    from rules_0_2 import records
    tags = {}
    for _, r in records(doc):
        tags[r["tag"]] = tags.get(r["tag"], 0) + 1
    L = [f"# New description — `{os.path.basename(a.out)}`", "", f"From `{os.path.relpath(a.values, ROOT)}`: {filled} values written, {len(refused)} refused.",
         "Records by tag: " + ", ".join(f"{k} {v}" for k, v in sorted(tags.items())) + ".", "",
         f"Schema + format rules: {'PASS' if not errs else f'{len(errs)} errors'}.", "", "## Refused (fix the values file)", ""]
    L += [f"- `{p}`: {why}" for p, why in refused] or ["none"]
    L += ["", "## Validation errors", ""] + ([f"- {e}" for e in errs] or ["none"])
    open(a.out.replace(".json", ".new.md"), "w").write("\n".join(L) + "\n")
    if errs:
        print("\n".join(L)); sys.exit(1)
    json.dump(doc, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(f"{a.out}: {filled} values, {len(refused)} refused, tags {tags}, hash {doc['hash']['value'][:19]}…")


if __name__ == "__main__":
    main()
