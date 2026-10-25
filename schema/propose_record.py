#!/usr/bin/env python3
"""Add NEW value records (a missing value or table) to a format-0.2 description as PROPOSED, in a new revision.

    python3 schema/propose_record.py projects/BR13A/BR13A.bridge.0.2.json --spec proposal.json

proposal.json:
  {"decision": {"id": "D-35", "by": "AI", "reason": "...", "evidence": [...], "affects": [...]},
   "created": "2026-10-24T15:00:00+11:00",
   "add": [ {"path": ["superstructure", "supert_types", {"id": "ST1"}, "shape"],
             "record": {"rows": [ {"cells": {...}, "tag": "Direct", "source": {...}}, ... ]}},
            {"path": [..., "haunch"], "record": {"value": 0, "unit": "mm", "tag": "Assumed", "source": {"note": "..."}, "replace_with": "..."}} ]}

Every added record (or table row) gets status 'proposed', decision id, original = itself, current = 'original'.
Existing records are never changed (refuses if the path already exists). Previous revision kept in history/.
Refuses to write unless rules_0_2.check() and check_revision() pass. The engines treat these records as missing
unless allow_proposed is set, and then list them as provisional.
"""
import argparse, copy, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from c14n import stamp
from rules_0_2 import check, check_revision

KEEP = ("source", "derivation", "ref", "note", "replace_with")


def _walk(doc, path):
    o = doc
    for p in path[:-1]:
        if isinstance(p, dict):
            o = next(x for x in o if all(x.get(k) == v for k, v in p.items()))
        else:
            o = o[p]
    return o, path[-1]


def _stamp_rec(r, did, by, created):
    r["status"] = "proposed"
    r["decision"] = did
    val_key = "cells" if "cells" in r else "value"
    orig = {val_key: copy.deepcopy(r.get(val_key)), "unit": r.get("unit"), "tag": r.get("tag"), "recorded_by": by, "recorded_at": created}
    for k in KEEP:
        if k in r:
            orig[k] = copy.deepcopy(r[k])
    r["original"], r["current"] = orig, "original"


def apply(doc, spec):
    new = copy.deepcopy(doc)
    d = spec["decision"]
    for a in spec["add"]:
        parent, key = _walk(new, a["path"])
        if a.get("append_rows"):
            tbl = parent.get(key)
            if not tbl or "rows" not in tbl:
                raise SystemExit(f"refused: {a['path']} is not an existing table")
            for row in copy.deepcopy(a["append_rows"]):
                _stamp_rec(row, d["id"], d["by"], spec["created"])
                tbl["rows"].append(row)
            continue
        if key in parent:
            raise SystemExit(f"refused: {a['path']} already exists (use propose_override.py to change it, or append_rows for a table)")
        rec = copy.deepcopy(a["record"])
        if "rows" in rec:
            for row in rec["rows"]:
                _stamp_rec(row, d["id"], d["by"], spec["created"])
        else:
            _stamp_rec(rec, d["id"], d["by"], spec["created"])
        parent[key] = rec
    new["revision"] = {"number": doc["revision"]["number"] + 1, "parent_hash": doc["hash"]["value"], "created": spec["created"],
                       "author": d["by"], "note": f"{d['id']} proposed: {len(spec['add'])} new record(s)", "decision_log_sha256": None}
    stamp(new)
    return new


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("file"); ap.add_argument("--spec", required=True); a = ap.parse_args()
    doc, spec = json.load(open(a.file)), json.load(open(a.spec))
    new = apply(doc, spec)
    logf = a.file.replace(".bridge.0.2.json", ".decisions.jsonl")
    dec = {json.loads(l)["id"]: json.loads(l) for l in open(logf) if l.strip()} if os.path.exists(logf) else {}
    d = spec["decision"]
    if d["id"] in dec:
        raise SystemExit(f"refused: decision {d['id']} already in the log")
    entry = {"id": d["id"], "date": spec["created"], "by": d["by"], "key": " + ".join("/".join(str(x if not isinstance(x, dict) else x.get('id')) for x in s["path"]) for s in spec["add"]),
             "from": None, "from_tag": "Missing-Flagged", "to": "new record(s), see the description", "to_tag": (spec["add"][0].get("record") or {}).get("tag") or ((spec["add"][0].get("record") or {}).get("rows") or spec["add"][0].get("append_rows") or [{}])[0].get("tag"),
             "reason": d["reason"], "evidence": d.get("evidence", []), "status": "proposed", **({"affects": d["affects"]} if d.get("affects") else {})}
    dec[d["id"]] = entry
    errs = check(new, dec) + check_revision(doc, new)
    try:                                   # the JSON schema too (rules_0_2 does not check every record shape)
        from jsonschema import Draft202012Validator
        sch = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge.schema.0.2.json")))
        errs += [f"schema: {e.message} at {'/'.join(map(str, e.absolute_path))}" for e in Draft202012Validator(sch).iter_errors(new)]
        dsch = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "decision.schema.json")))
        errs += [f"decision schema: {e.message} at {'/'.join(map(str, e.absolute_path))}" for e in Draft202012Validator(dsch).iter_errors(entry)]
    except ImportError:
        errs.append("schema: jsonschema not installed (cannot validate)")
    if errs:
        raise SystemExit("refused, rule errors:\n  " + "\n  ".join(errs[:20]))
    hist = os.path.join(os.path.dirname(os.path.abspath(a.file)), "history")
    os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, os.path.basename(a.file).replace(".json", f".r{doc['revision']['number']}.json"))
    if not os.path.exists(keep):
        shutil.copyfile(a.file, keep)
    json.dump(new, open(a.file, "w"), indent=1, ensure_ascii=False)
    with open(logf, "a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"{a.file}: revision {new['revision']['number']}, {d['id']} proposed ({len(spec['add'])} new record(s)); previous kept at {os.path.relpath(keep)}")


if __name__ == "__main__":
    main()
