#!/usr/bin/env python3
"""Migrate a bridge description from pdf2bim.bridge/0.1 to 0.2 (docs/FORMAT_0_2_SPEC.md §4).

    python3 schema/migrate_0_1_to_0_2.py projects/BR13A/BR13A.bridge.json \\
        --out projects/BR13A/BR13A.bridge.0.2.json --author "migration" [--created 2026-10-24T00:00:00+11:00]

Writes a NEW file; the 0.1 file is never modified. A report goes next to the output (<out>.migration.md).

Rules applied (nothing is invented):
- original = the 0.1 value as first recorded (value/cells, unit, tag, source, derivation, ref, note), current = "original";
- EXCEPT where the record's own `decision` points to an accepted/superseded decision that recorded a previous
  value (`from` not null): original = that previous value and tag; unit and source are NOT recorded in 0.1, so
  original.unit = null and original.source.note says so; one override OV-1 carries the 0.1 value, with the
  decision's reason, evidence, author, time and approval; current = "OV-1";
- significance is not guessed (left absent; listed in the report for engineer input);
- revision 1, parent_hash null, decision-log sha256 recorded, then the content hash is stamped.
"""
import argparse, copy, datetime, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from c14n import stamp, file_sha256
from rules_0_2 import records

KEEP = ("source", "derivation", "ref", "note", "replace_with")


def key_matches(key, path):
    """Decision key equals the record path; '[*]' in the key matches any list id. No prefix / parent matching."""
    rx = "^" + re.escape(key).replace(re.escape("[*]"), r"\[[^\]]+\]") + "$"
    return re.match(rx, path) is not None


def migrate(doc01, decisions, author, created, log_sha=None):
    if doc01.get("format") != "pdf2bim.bridge/0.1":
        raise ValueError("input is not pdf2bim.bridge/0.1")
    doc = copy.deepcopy(doc01)
    doc["format"] = "pdf2bim.bridge/0.2"
    rep = {"records": 0, "reconstructed": [], "decision_links": {}, "unit_unknown": [], "unmapped_decisions": [], "not_assigned": []}
    used = set()
    for p, r in records(doc):
        rep["records"] += 1
        is_row = "cells" in r and "value" not in r
        cur_val = r["cells"] if is_row else r.get("value")
        d = decisions.get(r.get("decision")) if r.get("decision") else None
        if r.get("decision"):
            rep["decision_links"][r["decision"]] = rep["decision_links"].get(r["decision"], 0) + 1
        if d is not None and d.get("from") is not None and not key_matches(d.get("key", ""), p):
            rep["not_assigned"].append((p, d["id"], d.get("key")))
            d = None
        if d is not None and d.get("from") is not None and d.get("status") in ("accepted", "superseded"):
            used.add(d["id"])
            orig = {("cells" if is_row else "value"): d["from"], "unit": None, "tag": d.get("from_tag"),
                    "source": {"note": f"previous value as recorded in decision {d['id']}; its unit and source were not recorded in format 0.1"},
                    "recorded_by": "migration from pdf2bim.bridge/0.1", "recorded_at": d.get("date")}
            ov = {"id": "OV-1", "value": cur_val, "unit": r.get("unit"), "tag": r.get("tag"),
                  "from_value": d["from"], "from_unit": None, "reason": d.get("reason") or "(no reason recorded)",
                  "evidence": d.get("evidence", []), "author": d.get("by", "?"), "timestamp": d.get("date"),
                  "approval": {k: v for k, v in {"status": "accepted", "approved_by": d.get("approved_by"), "approved_at": d.get("approved_at")}.items() if v is not None},
                  "decision": d["id"], "supersedes": None}
            for k in KEEP[:3]:
                if k in r:
                    ov[k] = r[k]
            r["original"], r["overrides"], r["current"] = orig, [ov], "OV-1"
            rep["reconstructed"].append((p, d["id"], d["from"], d.get("from_tag"), cur_val, r.get("tag")))
            rep["unit_unknown"].append(p)
        else:
            orig = {("cells" if is_row else "value"): cur_val, "unit": r.get("unit"), "tag": r.get("tag"),
                    "recorded_by": "migration from pdf2bim.bridge/0.1 (first recorded state)", "recorded_at": None}
            for k in KEEP:
                if k in r:
                    orig[k] = copy.deepcopy(r[k])
            r["original"], r["current"] = orig, "original"
    rep["unmapped_decisions"] = sorted((k for k, d in decisions.items() if d.get("from") is not None and k not in used), key=lambda s: int(s[2:]))
    doc["revision"] = {"number": 1, "parent_hash": None, "created": created, "author": author,
                       "note": "migrated from pdf2bim.bridge/0.1", "decision_log_sha256": log_sha}
    # keep 'format' first and revision/hash at the end for readability
    doc = dict([("format", doc.pop("format"))] + list(doc.items()))
    stamp(doc)
    return doc, rep


def report_md(src, out, doc, rep):
    L = [f"# Migration report — {os.path.basename(src)} → {os.path.basename(out)}", "",
         f"- Records migrated: {rep['records']}",
         f"- Originals reconstructed from the decision log: {len(rep['reconstructed'])}",
         f"- Revision {doc['revision']['number']}, created {doc['revision']['created']}, hash `{doc['hash']['value']}`",
         f"- Decision log sha256: `{doc['revision']['decision_log_sha256']}`", "",
         "## Reconstructed originals (current = OV-1)", "",
         "| Path | Decision | Original value (tag) | Current value (tag) |", "|---|---|---|---|"]
    for p, did, fv, ft, cv, ct in rep["reconstructed"]:
        L.append(f"| `{p}` | {did} | {json.dumps(fv)[:60]} ({ft}) | {json.dumps(cv)[:60]} ({ct}) |")
    L += ["", "## Needs engineer input", "",
          f"- **Original unit unknown** for {len(rep['unit_unknown'])} reconstructed originals (format 0.1 did not record it). Left `null`, not guessed: " + ", ".join(f"`{p}`" for p in rep["unit_unknown"]),
          "- **Significance** not set on any value (not guessed). To be set by the engineer, high-impact values first.",
          "- Decisions with a previous value that were NOT assigned to a single field (the decision key does not equal the record path; e.g. it names a parent object). "
          "The record keeps its first recorded state as original; the earlier value stays only in the decision log: "
          + ("; ".join(f"`{p}` ← {d} (key `{k}`)" for p, d, k in rep["not_assigned"]) or "none"),
          "- Decisions with a previous value that no record links to (history stays in the log): " + (", ".join(rep["unmapped_decisions"]) or "none"),
          "", "## Decision links found on records", "", ", ".join(f"{k}×{n}" for k, n in sorted(rep["decision_links"].items(), key=lambda x: int(x[0][2:])))]
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("--out", required=True); ap.add_argument("--decisions")
    ap.add_argument("--author", default="migration"); ap.add_argument("--created")
    a = ap.parse_args()
    src = json.load(open(a.src))
    lf = a.decisions or a.src.replace(".bridge.json", ".decisions.jsonl")
    decisions = {}
    if os.path.exists(lf):
        for line in open(lf):
            if line.strip():
                d = json.loads(line); decisions[d["id"]] = d
    created = a.created or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    doc, rep = migrate(src, decisions, a.author, created, file_sha256(lf) if os.path.exists(lf) else None)
    if os.path.abspath(a.out) == os.path.abspath(a.src):
        sys.exit("refusing to overwrite the 0.1 file")
    json.dump(doc, open(a.out, "w"), indent=1, ensure_ascii=False)
    open(a.out.replace(".json", ".migration.md"), "w").write(report_md(a.src, a.out, doc, rep))
    print(f"{a.out}: {rep['records']} records, {len(rep['reconstructed'])} reconstructed originals, hash {doc['hash']['value'][:19]}…")


if __name__ == "__main__":
    main()
