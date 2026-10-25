#!/usr/bin/env python3
"""Add a PROPOSED override to a format-0.2 bridge description, as a new revision.

    python3 schema/propose_override.py projects/BR13A/BR13A.bridge.0.2.json \\
        --path "alignment.support_lines.rows[0]" --value '{"support":"A", ...}' --tag Direct \\
        --source '{"doc":"DRG-202012","view":"skew diagram"}' --reason "..." --evidence "..." --author AI --decision D-34

- The current value does NOT change (a proposal is not accepted). The engineer accepts it later (ADR-005).
- The previous revision is copied to <project>/history/<name>.r<N>.json before the file is rewritten.
- A decision-log entry with status 'proposed' is appended (if --decision is new).
- Refuses to write unless rules_0_2.check() and check_revision() pass on the result.
"""
import argparse, copy, datetime, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from c14n import stamp
from rules_0_2 import check, check_revision, records


def propose(doc, path, value, tag, reason, evidence, author, decision, source=None, unit=None, created=None, derivation=None, replace_with=None):
    new = copy.deepcopy(doc)
    rec = dict(records(new)).get(path)
    if rec is None:
        raise SystemExit(f"no value record at {path!r}")
    cur_id = rec["current"]
    cur_entry = rec["original"] if cur_id == "original" else next(o for o in rec["overrides"] if o["id"] == cur_id)
    from_value = rec["cells"] if "cells" in rec and "value" not in rec else rec.get("value")
    n = len(rec.get("overrides", [])) + 1
    ov = {"id": f"OV-{n}", "value": value, "unit": unit if unit is not None else rec.get("unit"), "tag": tag,
          "from_value": from_value, "from_unit": rec.get("unit"), "reason": reason, "evidence": evidence, "author": author,
          "timestamp": created, "approval": {"status": "proposed"}, "decision": decision, "supersedes": None}
    if source:
        ov["source"] = source
    if derivation:
        ov["derivation"] = derivation
    if replace_with:
        rec["replace_with"] = replace_with          # record-level: what replaces an Assumed value
    rec.setdefault("overrides", []).append(ov)
    new["revision"] = {"number": doc["revision"]["number"] + 1, "parent_hash": doc["hash"]["value"], "created": created,
                       "author": author, "note": f"{ov['id']} proposed at {path} ({decision})", "decision_log_sha256": None}
    stamp(new)
    return new, ov


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file"); ap.add_argument("--path", required=True); ap.add_argument("--value", required=True)
    ap.add_argument("--tag", required=True); ap.add_argument("--reason", required=True); ap.add_argument("--evidence", action="append", default=[])
    ap.add_argument("--author", required=True); ap.add_argument("--decision", required=True); ap.add_argument("--source"); ap.add_argument("--unit")
    ap.add_argument("--affects", action="append", default=[]); ap.add_argument("--created")
    ap.add_argument("--derivation", help='JSON {"formula": "...", "inputs": [paths]} (required by the schema for a Calculated value)')
    ap.add_argument("--replace-with", help="what replaces an Assumed value (required by the schema for Assumed)")
    a = ap.parse_args()
    doc = json.load(open(a.file))
    created = a.created or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    new, ov = propose(doc, a.path, json.loads(a.value), a.tag, a.reason, a.evidence, a.author, a.decision,
                      json.loads(a.source) if a.source else None, a.unit, created,
                      json.loads(a.derivation) if a.derivation else None, a.replace_with)
    logf = a.file.replace(".bridge.0.2.json", ".decisions.jsonl")
    dec = {}
    if os.path.exists(logf):
        dec = {json.loads(l)["id"]: json.loads(l) for l in open(logf) if l.strip()}
    entry = None
    if a.decision not in dec:
        entry = {"id": a.decision, "date": created, "by": a.author, "key": a.path, "from": ov["from_value"], "from_tag": None,
                 "to": ov["value"], "to_tag": a.tag, "reason": a.reason, "evidence": a.evidence, "status": "proposed"}
        if a.affects:
            entry["affects"] = a.affects
        dec[a.decision] = entry
    errs = check(new, dec) + check_revision(doc, new)
    try:                                   # the JSON schema too (it requires derivation for Calculated, replace_with for Assumed, ...)
        from jsonschema import Draft202012Validator
        sch = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge.schema.0.2.json")))
        errs += [f"schema: {e.message} at {'/'.join(map(str, e.absolute_path))}" for e in Draft202012Validator(sch).iter_errors(new)]
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
    if entry:
        with open(logf, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"{a.file}: revision {new['revision']['number']}, {ov['id']} proposed at {a.path}; previous revision kept at {os.path.relpath(keep)}")


if __name__ == "__main__":
    main()
