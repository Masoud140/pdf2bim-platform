#!/usr/bin/env python3
"""Worked example for format 0.2: original drawing value -> engineer override -> approved value.

    python3 examples/override_example/build.py

Uses the FICTIONAL example bridge (examples/new_bridge.bridge.json), not project data.
Writes three revisions and the decision log next to this script:
  rev1.json  migrated from 0.1: deck.slab_thickness = 200 mm, Direct from GA-01 (original, current = "original")
  rev2.json  engineer proposes 220 mm (OV-1, status proposed); value still 200 (current = "original")
  rev3.json  engineer accepts OV-1 (decision D-2); value 220 mm, tag Confirmed-Engineer, current = "OV-1";
             the original 200 mm and its drawing source are unchanged
"""
import copy, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, "schema"))
from c14n import stamp, file_sha256
from migrate_0_1_to_0_2 import migrate

src = json.load(open(os.path.join(ROOT, "examples", "new_bridge.bridge.json")))
dec_src = [json.loads(l) for l in open(os.path.join(ROOT, "examples", "new_bridge.decisions.jsonl")) if l.strip()]
D2 = {"id": "D-2", "date": "2026-10-24T10:05:00+11:00", "by": "Engineer A", "key": "deck.slab_thickness", "from": 200, "from_tag": "Direct",
      "to": 220, "to_tag": "Confirmed-Engineer",
      "reason": "Deck slab thickened to 220 mm for the cover required by the durability assessment (example only)",
      "evidence": ["Example durability memo EX-DUR-01 (fictional)"], "status": "accepted",
      "approved_by": "Engineer A", "approved_at": "2026-10-24T10:20:00+11:00", "affects": ["model", "loads", "design.supert"]}
log = os.path.join(HERE, "decisions.jsonl")
with open(log, "w") as f:
    for d in dec_src + [D2]:
        f.write(json.dumps(d, ensure_ascii=False) + "\n")

rev1, _ = migrate(src, {d["id"]: d for d in dec_src}, "Engineer A", "2026-10-24T09:00:00+11:00")

rev2 = copy.deepcopy(rev1)
r = rev2["deck"]["slab_thickness"]
r["overrides"] = [{"id": "OV-1", "value": 220, "unit": "mm", "tag": "Confirmed-Engineer", "from_value": 200, "from_unit": "mm",
                   "reason": D2["reason"], "evidence": D2["evidence"], "author": "Engineer A", "timestamp": D2["date"],
                   "approval": {"status": "proposed"}, "decision": "D-2", "supersedes": None}]
r["significance"] = {"level": "high", "basis": "governs deck stiffness, self weight and composite section", "set_by": "Engineer A"}
r["status"] = "proposed"
rev2["revision"] = {"number": 2, "parent_hash": rev1["hash"]["value"], "created": "2026-10-24T10:05:00+11:00", "author": "Engineer A",
                    "note": "OV-1 proposed (deck slab 220 mm)", "decision_log_sha256": None}
stamp(rev2)

rev3 = copy.deepcopy(rev2)
r = rev3["deck"]["slab_thickness"]
r["overrides"][0]["approval"] = {"status": "accepted", "approved_by": "Engineer A", "approved_at": D2["approved_at"]}
r.update(value=220, tag="Confirmed-Engineer", status="accepted", current="OV-1", decision="D-2")
r.pop("source")  # the drawing source belongs to the original (kept there), not to the 220 mm value
rev3["revision"] = {"number": 3, "parent_hash": rev2["hash"]["value"], "created": "2026-10-24T10:20:00+11:00", "author": "Engineer A",
                    "note": "OV-1 accepted (D-2)", "decision_log_sha256": file_sha256(log)}
stamp(rev3)

for name, doc in (("rev1.json", rev1), ("rev2.json", rev2), ("rev3.json", rev3)):
    json.dump(doc, open(os.path.join(HERE, name), "w"), indent=1, ensure_ascii=False)
print("rev1/rev2/rev3 written:", rev1["hash"]["value"][:19], rev2["hash"]["value"][:19], rev3["hash"]["value"][:19])
