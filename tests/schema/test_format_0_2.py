#!/usr/bin/env python3
"""Format 0.2 tests (docs/FORMAT_0_2_SPEC.md).  Run: python3 tests/schema/test_format_0_2.py

Prints PASS/FAIL per assertion; exit code 1 if any fails.
"""
import copy, hashlib, json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(R, "schema"))
from jsonschema import Draft202012Validator
from c14n import canonical, content_hash, stamp, _num
from rules_0_2 import check, check_revision, records

S = Draft202012Validator(json.load(open(os.path.join(R, "schema/bridge.schema.0.2.json"))))
S01 = Draft202012Validator(json.load(open(os.path.join(R, "schema/bridge.schema.json"))))
res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


def ld(p):
    return json.load(open(os.path.join(R, p)))


def log(p):
    return {d["id"]: d for d in (json.loads(l) for l in open(os.path.join(R, p)) if l.strip())}


def raises(f, exc):
    try:
        f()
    except exc:
        return True
    except Exception:
        return False
    return False


def valid(doc, dec=None):
    return list(S.iter_errors(doc)) == [] and check(doc, dec) == []


# ---------- canonicalisation (RFC 8785 number vectors + structure) ----------
VEC = {0: "0", -0.0: "0", 5e-324: "5e-324", 1.7976931348623157e308: "1.7976931348623157e+308", 9007199254740992: "9007199254740992",
       1e21: "1e+21", 1e20: "100000000000000000000", 0.000001: "0.000001", 1e-7: "1e-7", 1515.0: "1515", 0.1: "0.1",
       123456789012345680000.0: "123456789012345680000", 4.5e-6: "0.0000045", 333333333.3333333: "333333333.3333333", -1e-7: "-1e-7", 1e22: "1e+22"}
bad = [(k, v, _num(k)) for k, v in VEC.items() if _num(k) != v]
t("c14n: RFC 8785 number serialisation vectors (16)", not bad, str(bad))
t("c14n: keys sorted by UTF-16 code units", canonical({"דּ": 1, "\U0001F600": 2, "a": 3}) == '{"a":3,"\U0001F600":2,"דּ":1}')
t("c14n: NaN rejected", raises(lambda: canonical(float("nan")), ValueError))
t("c14n: Infinity rejected", raises(lambda: canonical(float("inf")), ValueError))
d1 = {"b": [1, 2.0, "x"], "a": {"z": 1, "y": None}}
d2 = json.loads('{ "a" : {"y":null, "z":1.0},\n "b":[1,2,"x"] }')
t("hash: same content in different key order / whitespace / 1 vs 1.0 gives the same hash", content_hash(d1) == content_hash(d2))
d3 = copy.deepcopy(d1); d3["a"]["z"] = 2
t("hash: a changed value gives a different hash", content_hash(d1) != content_hash(d3))
d4 = dict(d1); stamp(d4)
t("hash: covers the document without its hash member", d4["hash"]["value"] == content_hash(d1))

# ---------- worked example (fictional bridge): original -> override -> approved ----------
ex = [ld(f"examples/override_example/rev{i}.json") for i in (1, 2, 3)]
exd = log("examples/override_example/decisions.jsonl")
for i, d in enumerate(ex, 1):
    t(f"example rev{i} valid (schema + rules)", valid(d, exd), str(list(S.iter_errors(d))[:1]) + str(check(d, exd)[:2]))
t("example revision chain rev1 -> rev2 valid", check_revision(ex[0], ex[1]) == [], str(check_revision(ex[0], ex[1])))
t("example revision chain rev2 -> rev3 valid", check_revision(ex[1], ex[2]) == [], str(check_revision(ex[1], ex[2])))
r1, r3 = ex[0]["deck"]["slab_thickness"], ex[2]["deck"]["slab_thickness"]
t("example: original drawing value 200 mm Direct with its source, unchanged in rev3",
  r3["original"]["value"] == 200 and r3["original"]["tag"] == "Direct" and r3["original"]["source"]["doc"] == "GA-01" and canonical(r1["original"]) == canonical(r3["original"]))
t("example: approved value 220 mm Confirmed-Engineer, current = OV-1, approved by a person with decision D-2",
  r3["value"] == 220 and r3["tag"] == "Confirmed-Engineer" and r3["current"] == "OV-1" and r3["overrides"][0]["approval"]["approved_by"] == "Engineer A" and r3["overrides"][0]["decision"] == "D-2")
t("example: in rev2 the proposal is recorded but the value is still the original 200 mm",
  ex[1]["deck"]["slab_thickness"]["value"] == 200 and ex[1]["deck"]["slab_thickness"]["current"] == "original")

# ---------- rejection cases (rules 1-7) ----------
def mut(doc, f, restamp=True):
    x = copy.deepcopy(doc); f(x)
    if restamp: stamp(x)
    return x

base = ex[2]
st = lambda x: x["deck"]["slab_thickness"]
CASES = [
    ("R3", "value differs from the current entry", lambda x: st(x).update(value=230)),
    ("R3", "tag differs from the current entry", lambda x: st(x).update(tag="Direct", source={"doc": "GA-01"})),
    ("R3", "current names no entry", lambda x: st(x).update(current="OV-9")),
    ("R3", "current points to a proposed override", lambda x: st(x)["overrides"][0]["approval"].update(status="proposed")),
    ("R3", "two current values: accepted override not current and not superseded", lambda x: (st(x).update(current="original", value=200, tag="Direct"), st(x).update(source=st(x)["original"]["source"]))),
    ("R4", "Direct original overridden without evidence", lambda x: st(x)["overrides"][0].update(evidence=[])),
    ("R4", "AI accepts an Assumed value", lambda x: (st(x)["overrides"][0].update(tag="Assumed", author="AI", source={"note": "x"}), st(x)["overrides"][0]["approval"].update(approved_by="AI"), st(x).update(tag="Assumed", replace_with="x", source={"note": "x"}))),
    ("R7", "high-significance value approved by AI (even Calculated)", lambda x: (st(x)["overrides"][0].update(tag="Calculated"), st(x)["overrides"][0]["approval"].update(approved_by="AI"), st(x).update(tag="Calculated", derivation={"formula": "f", "inputs": []}), st(x)["overrides"][0].update(derivation={"formula": "f", "inputs": []}))),
    ("R6", "accepted override without a decision id", lambda x: st(x)["overrides"][0].pop("decision")),
    ("R5", "unit change without a stated conversion", lambda x: st(x)["overrides"][0].update(from_unit="m")),
    ("R3", "stale drawing source left on an overridden value", lambda x: st(x).update(source={"doc": "GA-01", "text": "200 SLAB"})),
    ("R2", "duplicate override ids", lambda x: st(x)["overrides"].append(dict(st(x)["overrides"][0], approval={"status": "rejected"}))),
]
for code, name, f in CASES:
    x = mut(base, f)
    se, ce = list(S.iter_errors(x)), check(x, exd)
    t(f"rejects ({code}): " + name, not se and any(f": {code}:" in e for e in ce), f"schema {[e.message[:60] for e in se[:1]]} rules {ce[:2]}")
t("rejects: record without original (schema)", len(list(S.iter_errors(mut(base, lambda x: st(x).pop("original"))))) > 0)
t("rejects: content changed after stamping (hash mismatch)", any(e.startswith("hash") for e in check(mut(base, lambda x: st(x).update(value=220.0001), restamp=False), exd)))
t("rejects: accepted approval without approver (schema)", len(list(S.iter_errors(mut(base, lambda x: st(x)["overrides"][0]["approval"].pop("approved_by"))))) > 0)
t("rejects: Missing-Flagged override accepted", any("R4" in e for e in check(mut(base, lambda x: (st(x)["overrides"][0].update(tag="Missing-Flagged"), st(x).update(tag="Missing-Flagged", status="open"))), exd)))
t("rejects: decision id not in the log", any("R6" in e for e in check(mut(base, lambda x: (st(x)["overrides"][0].update(decision="D-99"), st(x).update(decision="D-99"))), exd)))

# revision rules (R1 immutable original, R2 append-only)
def rev_next(prev, f):
    x = copy.deepcopy(prev); f(x)
    x["revision"] = dict(prev["revision"], number=prev["revision"]["number"] + 1, parent_hash=prev["hash"]["value"]); stamp(x)
    return x
t("rejects: original edited in a later revision", any("R1" in e for e in check_revision(base, rev_next(base, lambda x: st(x)["original"].update(value=210)))))
t("rejects: override deleted in a later revision", any("R2" in e for e in check_revision(base, rev_next(base, lambda x: st(x).update(overrides=[], current="original")))))
t("rejects: override content edited in a later revision", any("R2" in e for e in check_revision(base, rev_next(base, lambda x: st(x)["overrides"][0].update(reason="changed")))))
t("rejects: approval accepted -> proposed", any("R2" in e for e in check_revision(base, rev_next(base, lambda x: st(x)["overrides"][0]["approval"].update(status="proposed")))))
t("rejects: value record removed in a later revision", any("R2" in e for e in check_revision(base, rev_next(base, lambda x: x["deck"].pop("slab_thickness")))))
t("rejects: wrong parent hash", any("parent_hash" in e for e in check_revision(base, dict(rev_next(base, lambda x: None), revision=dict(base["revision"], number=4, parent_hash="sha256:" + "0" * 64)))))
t("accepts: superseding OV-1 by OV-2 (append) and marking OV-1 superseded", check_revision(base, rev_next(base, lambda x: (
    st(x)["overrides"][0]["approval"].update(status="superseded"),
    st(x)["overrides"].append({"id": "OV-2", "value": 240, "unit": "mm", "tag": "Confirmed-Engineer", "from_value": 220, "from_unit": "mm", "reason": "r", "evidence": ["e"],
                                "author": "Engineer A", "timestamp": "2026-10-25T09:00:00+11:00", "approval": {"status": "accepted", "approved_by": "Engineer A", "approved_at": "2026-10-25T09:00:00+11:00"},
                                "decision": "D-2", "supersedes": "OV-1"}),
    st(x).update(value=240, current="OV-2"))) ) == [])

# ---------- BR13A migration ----------
b01, b02 = ld("projects/BR13A/BR13A.bridge.json"), ld("projects/BR13A/BR13A.bridge.0.2.json")
bd = log("projects/BR13A/BR13A.decisions.jsonl")
t("BR13A 0.1 file still valid under the 0.1 schema", list(S01.iter_errors(b01)) == [])
t("BR13A 0.1 file unchanged by P0.2 (same as at P0.1 commit 0d36579)",
  subprocess.run(["git", "diff", "--quiet", "0d36579", "--", "projects/BR13A/BR13A.bridge.json"], cwd=R).returncode == 0)
t("BR13A 0.2 file valid (schema + rules)", valid(b02, bd), str(list(S.iter_errors(b02))[:1]) + str(check(b02, bd)[:2]))
a, b = dict(records(b01)), dict(records(b02))
same = [p for p in a if p in b and all(canonical(a[p].get(k)) == canonical(b[p].get(k)) for k in ("value", "cells", "unit", "tag", "status"))]
t(f"BR13A round trip: all {len(a)} records keep value / unit / tag / status", len(same) == len(a) == len(b), f"{len(same)}/{len(a)}/{len(b)}")
recon = [p for p, r in b.items() if r["current"] != "original"]
t("BR13A: only the D-6 girder lengths get reconstructed originals (key matches the record path exactly)",
  sorted(recon) == [f"superstructure.members[G{i}].length" for i in range(1, 5)], str(recon))
t("BR13A: reconstructed originals keep unit = null (not recorded in 0.1, not guessed)", all(b[p]["original"]["unit"] is None for p in recon))
t("BR13A: no significance invented", not any("significance" in r for r in b.values()))

from migrate_0_1_to_0_2 import migrate
t("migration refuses a non-0.1 input", raises(lambda: migrate(b02, bd, "x", "2026-10-24T00:00:00+11:00"), ValueError))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
