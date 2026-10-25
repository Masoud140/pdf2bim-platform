#!/usr/bin/env python3
"""Record the engineer's decision on a PROPOSED decision, as a new revision (P5.4, ADR-005).

    python3 schema/accept_decision.py projects/X/X.bridge.0.2.json --decision D-42 --by "Name" [--reject] [--note "..."]

- Every override proposed under the decision gets approval accepted / rejected (approved_by, approved_at); an accepted
  override becomes the record's current value (value / cells, tag, unit, source). Records whose own status is
  "proposed" under the decision become "accepted" / "rejected".
- The decision-log entry gets status accepted / rejected with approved_by / approved_at.
- The AI cannot accept or reject: --by must name a person (ADR-005; rules R4 / R7 also apply).
- Refused when a record's current value is already an accepted override (supersession is not handled here), when the
  decision is not proposed, or when the rule checks fail. The previous revision is kept in history/.
"""
import argparse, copy, datetime, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from c14n import stamp
from rules_0_2 import check, check_revision, records

AI_NAMES = {"ai", "claude", "agent", "assistant"}


def decide(doc, dec, did, by, accept=True, note=None, at=None):
    if by.strip().lower() in AI_NAMES:
        raise SystemExit("refused: the AI cannot accept or reject engineering decisions (ADR-005); --by must name a person")
    d = dec.get(did)
    if d is None or d.get("status") != "proposed":
        raise SystemExit(f"refused: decision {did} is {'not in the log' if d is None else d.get('status')}, not proposed")
    st = "accepted" if accept else "rejected"
    new = copy.deepcopy(doc)
    n_ov = n_rec = 0
    for path, rec in records(new):
        for o in rec.get("overrides") or []:
            if o.get("decision") == did and o["approval"]["status"] == "proposed":
                if accept and rec.get("current") not in (None, "original"):
                    cur = next((x for x in rec["overrides"] if x["id"] == rec["current"]), None)
                    if cur and cur["approval"]["status"] == "accepted":
                        raise SystemExit(f"refused: {path} already has the accepted override {rec['current']} (supersession not handled here)")
                o["approval"] = {"status": st, "approved_by": by, "approved_at": at, **({"note": note} if note else {})}
                if accept:
                    rec["current"] = o["id"]
                    if "cells" in rec and "value" not in rec:
                        rec["cells"] = o["value"]
                    else:
                        rec["value"] = o["value"]
                    rec["tag"] = o["tag"]
                    if o.get("unit") is not None:
                        rec["unit"] = o["unit"]
                    for k in ("source", "derivation", "ref"):
                        if k in o:
                            rec[k] = o[k]
                        else:
                            rec.pop(k, None)
                n_ov += 1
        if rec.get("status") == "proposed" and not rec.get("overrides") and rec.get("decision") == did:
            rec["status"] = st
            n_rec += 1
    if not (n_ov or n_rec):
        raise SystemExit(f"refused: nothing in the description is proposed under {did}")
    new["revision"] = {"number": doc["revision"]["number"] + 1, "parent_hash": doc["hash"]["value"], "created": at, "author": by,
                       "note": f"{did} {st} by {by}" + (f": {note}" if note else ""), "decision_log_sha256": None}
    stamp(new)
    nd = copy.deepcopy(dec)
    nd[did].update(status=st, approved_by=by, approved_at=at)          # the note goes in the revision and the approvals (no log field for it)
    return new, nd, n_ov, n_rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file"); ap.add_argument("--decision", required=True); ap.add_argument("--by", required=True)
    ap.add_argument("--reject", action="store_true"); ap.add_argument("--note"); ap.add_argument("--at")
    a = ap.parse_args()
    at = a.at or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    doc = json.load(open(a.file))
    logf = a.file.replace(".bridge.0.2.json", ".decisions.jsonl")
    lines = [json.loads(l) for l in open(logf) if l.strip()]
    dec = {d["id"]: d for d in lines}
    new, nd, n_ov, n_rec = decide(doc, dec, a.decision, a.by, not a.reject, a.note, at)
    errs = check(new, nd) + check_revision(doc, new)
    try:
        from jsonschema import Draft202012Validator
        dsch = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "decision.schema.json")))
        errs += [f"decision schema: {e.message}" for e in Draft202012Validator(dsch).iter_errors(nd[a.decision])]
        bsch = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge.schema.0.2.json")))
        errs += [f"schema: {e.message} at {'/'.join(map(str, e.absolute_path))}" for e in Draft202012Validator(bsch).iter_errors(new)]
    except ImportError:
        errs.append("jsonschema not installed (cannot validate the decision entry)")
    if errs:
        raise SystemExit("refused, rule errors:\n  " + "\n  ".join(errs[:20]))
    hist = os.path.join(os.path.dirname(os.path.abspath(a.file)), "history")
    os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, os.path.basename(a.file).replace(".json", f".r{doc['revision']['number']}.json"))
    if not os.path.exists(keep):
        shutil.copyfile(a.file, keep)
    json.dump(new, open(a.file, "w"), indent=1, ensure_ascii=False)
    with open(logf, "w") as f:
        for d in lines:
            f.write(json.dumps(nd[d["id"]], ensure_ascii=False) + "\n")
    print(f"{a.file}: revision {new['revision']['number']}: {a.decision} {'rejected' if a.reject else 'accepted'} by {a.by} ({n_ov} override(s), {n_rec} record(s)); previous kept at {os.path.relpath(keep)}")


if __name__ == "__main__":
    main()
