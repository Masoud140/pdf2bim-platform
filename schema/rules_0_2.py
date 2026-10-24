"""Format 0.2 rules that JSON Schema cannot express (docs/FORMAT_0_2_SPEC.md §2 rules 1-7, §3 hash).

    from rules_0_2 import check, check_revision
    errors = check(doc, decisions=None)          # one revision on its own
    errors = check_revision(prev_doc, new_doc)   # immutability / append-only between two revisions

Each error is a string '<path>: <rule>: <message>'. An empty list means no rule is broken.
These checks test the integrity of the record keeping. They say nothing about whether a value is correct.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from c14n import canonical, content_hash

AI = "AI"
ALLOWED_APPROVAL_CHANGES = {("proposed", "accepted"), ("proposed", "rejected"), ("accepted", "superseded")}


def records(doc):
    """Yield (path, record) for every tagged value record and table row. Paths use list ids where present."""
    def walk(o, p):
        if isinstance(o, dict):
            if "tag" in o and ("value" in o or "cells" in o):
                yield p, o
                return
            for k, v in o.items():
                if not p and k in ("hash", "revision", "documents", "format"):
                    continue
                yield from walk(v, f"{p}.{k}" if p else k)
        elif isinstance(o, list):
            for i, v in enumerate(o):
                key = v.get("id") if isinstance(v, dict) and isinstance(v.get("id"), str) and "tag" not in v else i
                yield from walk(v, f"{p}[{key}]")
    yield from walk(doc, "")


def _val(rec):
    return rec["cells"] if "cells" in rec and "value" not in rec else rec.get("value")


def _same(a, b):
    return canonical(a) == canonical(b)


def check(doc, decisions=None):
    """Rules 3-7 on one document, plus the hash. decisions: dict id -> decision entry (optional)."""
    errs = []
    if doc.get("format") != "pdf2bim.bridge/0.2":
        return [f"format: expected pdf2bim.bridge/0.2, got {doc.get('format')}"]
    h = doc.get("hash", {}).get("value")
    if h != content_hash(doc):
        errs.append("hash: value does not match the canonical content (document changed after stamping, or not stamped)")
    for p, r in records(doc):
        e = lambda rule, msg: errs.append(f"{p}: {rule}: {msg}")
        orig, ovs, cur = r.get("original"), r.get("overrides", []), r.get("current")
        if orig is None or cur is None:
            e("R3", "original and current are required in 0.2")
            continue
        ids = [o["id"] for o in ovs]
        if len(ids) != len(set(ids)):
            e("R2", "override ids must be unique")
        byid = {o["id"]: o for o in ovs}
        # R3 exactly one current value, and value/unit/tag equal to it
        if cur == "original":
            entry, eunit = orig, orig.get("unit")
            if any(o["approval"]["status"] == "accepted" for o in ovs if not any(x.get("supersedes") == o["id"] for x in ovs)):
                e("R3", "an accepted override exists but current is 'original'")
        elif cur in byid:
            entry, eunit = byid[cur], byid[cur].get("unit", r.get("unit"))
            if entry["approval"]["status"] != "accepted":
                e("R3", f"current {cur} is not accepted ({entry['approval']['status']})")
        else:
            e("R3", f"current {cur!r} names no entry")
            continue
        ev = entry.get("cells") if ("cells" in r and "value" not in r and "cells" in entry) else entry.get("value")
        if not _same(_val(r), ev):
            e("R3", f"value {_val(r)!r} differs from the current entry {ev!r}")
        if entry.get("tag") is not None and r.get("tag") != entry.get("tag"):
            e("R3", f"tag {r.get('tag')} differs from the current entry {entry.get('tag')}")
        if eunit is not None and r.get("unit") is not None and eunit != r.get("unit"):
            e("R3", f"unit {r.get('unit')} differs from the current entry {eunit}")
        # provenance on the record describes the CURRENT entry (not a stale drawing source)
        for k in ("source", "derivation", "ref"):
            if k in r and not _same(r[k], entry.get(k)):
                e("R3", f"record {k} does not belong to the current entry {cur}")
        # accepted overrides other than current must be superseded by a later override
        for o in ovs:
            if o["approval"]["status"] == "accepted" and o["id"] != cur and not any(x.get("supersedes") == o["id"] for x in ovs):
                e("R3", f"{o['id']} is accepted but neither current nor superseded")
        sig = (r.get("significance") or {}).get("level")
        for o in ovs:
            a = o["approval"]
            # R4 approval policy (ADR-005)
            if orig.get("tag") == "Direct" and not o.get("evidence"):
                e("R4", f"{o['id']} overrides a Direct original without evidence")
            if a["status"] == "accepted":
                if a.get("approved_by") == AI and o.get("tag") != "Calculated":
                    e("R4", f"{o['id']}: AI may accept only Calculated values (tag {o.get('tag')})")
                if o.get("tag") == "Missing-Flagged":
                    e("R4", f"{o['id']}: a Missing-Flagged value is never accepted")
                # R7 significance
                if sig == "high" and a.get("approved_by") == AI:
                    e("R7", f"{o['id']}: high-significance value needs a person's approval")
                # R6 decision link
                if not o.get("decision"):
                    e("R6", f"{o['id']}: accepted override needs a decision-log id")
                elif decisions is not None:
                    d = decisions.get(o["decision"])
                    if d is None:
                        e("R6", f"{o['id']}: decision {o['decision']} not in the log")
                    elif d.get("status") not in ("accepted", "superseded"):
                        e("R6", f"{o['id']}: decision {o['decision']} is {d.get('status')}")
            # R5 units
            fu, u = o.get("from_unit"), o.get("unit", r.get("unit"))
            if fu is not None and u is not None and fu != u and not o.get("conversion"):
                e("R5", f"{o['id']}: unit changes {fu} -> {u} without a stated conversion")
            if o.get("supersedes") and o["supersedes"] not in byid:
                e("R2", f"{o['id']} supersedes unknown {o['supersedes']}")
    return errs


def check_revision(prev, new):
    """Rules 1-2 between two revisions: originals immutable, overrides append-only, revision chain."""
    errs = []
    pr, nr = (prev.get("revision") or {}), (new.get("revision") or {})
    if nr.get("number") != (pr.get("number") or 0) + 1:
        errs.append(f"revision: number {nr.get('number')} should be {(pr.get('number') or 0) + 1}")
    if nr.get("parent_hash") != (prev.get("hash") or {}).get("value"):
        errs.append("revision: parent_hash does not equal the previous revision's hash")
    old = dict(records(prev))
    cur = dict(records(new))
    for p, r in old.items():
        if p not in cur:
            errs.append(f"{p}: R2: value record removed")
            continue
        n = cur[p]
        if not _same(r.get("original"), n.get("original")):
            errs.append(f"{p}: R1: original changed (it is immutable)")
        o_ovs, n_ovs = r.get("overrides", []), n.get("overrides", [])
        if len(n_ovs) < len(o_ovs):
            errs.append(f"{p}: R2: override deleted")
        for a, b in zip(o_ovs, n_ovs):
            fa = {k: v for k, v in a.items() if k != "approval"}
            fb = {k: v for k, v in b.items() if k != "approval"}
            if not _same(fa, fb):
                errs.append(f"{p}: R2: override {a['id']} edited (overrides are append-only)")
            sa, sb = a["approval"]["status"], b["approval"]["status"]
            if sa != sb and (sa, sb) not in ALLOWED_APPROVAL_CHANGES:
                errs.append(f"{p}: R2: override {a['id']} approval {sa} -> {sb} not allowed")
            elif sa == sb and not _same(a["approval"], b["approval"]):
                errs.append(f"{p}: R2: override {a['id']} approval record edited")
    return errs
