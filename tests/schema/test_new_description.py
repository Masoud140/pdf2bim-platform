#!/usr/bin/env python3
"""P6 stage 3 tests: tools/new_description.py — a new 0.2 description from extracted values (any bridge)."""
import json, os, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R); sys.path.insert(0, os.path.join(R, "tools"))
from new_description import build, validate
from schema.rules_0_2 import records

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


S = {"doc": "DRG-1", "view": "section 1"}
inp = {"documents": [{"id": "DRG-1", "kind": "drawing"}], "values": [
    {"path": "deck.slab_thickness", "value": 200, "unit": "mm", "tag": "Direct", "source": S},
    {"path": "superstructure.members[G1].length", "value": 27.9, "unit": "m", "tag": "Direct", "source": S},
    {"path": "superstructure.members[G1].line_offset_A", "value": 1.2, "unit": "m", "tag": "Calculated", "derivation": {"formula": "a + b", "inputs": []}},
    {"path": "alignment.vertical.rows[0]", "cells": {"ch": 1.0, "RL": 2.0}, "tag": "Direct", "source": S},
    {"path": "alignment.vertical.rows[2]", "cells": {"ch": 1.0}, "tag": "Direct", "source": S},
    {"path": "deck.bogus", "value": 1, "tag": "Direct", "source": S},
    {"path": "deck.end_gap", "value": 0.05, "unit": "m", "tag": "Direct", "source": S},
    {"path": "custom.part_no", "value": "X", "tag": "Direct", "source": S}]}
doc, filled, refused = build(inp, "test", "2026-10-28T00:00:00+00:00")
rec = dict(records(doc))
t("valid 0.2 description: JSON Schema + format rules + hash", validate(doc) == [], str(validate(doc)[:3]))
t("supplied values land on their paths with tag, unit and source; original = the extracted state",
  rec["deck.slab_thickness"]["value"] == 200 and rec["deck.slab_thickness"]["original"]["tag"] == "Direct" and rec["deck.slab_thickness"]["current"] == "original"
  and rec["superstructure.members[G1].length"]["value"] == 27.9 and rec["alignment.vertical.rows[0]"]["cells"]["RL"] == 2.0 and rec["custom.part_no"]["value"] == "X")
t("a list item gets the full catalogue skeleton: fields not supplied are Missing-Flagged, open, null",
  rec["superstructure.members[G1].bearing_offset_A"]["tag"] == "Missing-Flagged" and rec["superstructure.members[G1].bearing_offset_A"]["value"] is None
  and rec["superstructure.members[G1].bearing_offset_A"]["status"] == "open")
t("every catalogue field exists; nothing invented (only Direct / Calculated / Missing-Flagged here)",
  {r["tag"] for _, r in records(doc)} == {"Direct", "Calculated", "Missing-Flagged"} and rec["project.importance_level"]["tag"] == "Missing-Flagged")
why = dict(refused)
t("refused: unknown path, unit other than the catalogue's (no conversion), table rows out of order",
  filled == 5 and set(why) == {"deck.bogus", "deck.end_gap", "alignment.vertical.rows[2]"} and "catalogue 'mm'" in why["deck.end_gap"], str(refused))
d = tempfile.mkdtemp(); f = os.path.join(d, "in.json"); o = os.path.join(d, "X.bridge.0.2.json")
json.dump(inp, open(f, "w")); open(o, "w").write("{}")
r = subprocess.run([sys.executable, os.path.join(R, "tools/new_description.py"), f, "--out", o], capture_output=True, text=True)
t("never writes over an existing description", r.returncode != 0 and open(o).read() == "{}", r.stderr[-120:])
B = os.path.join(R, "projects/B12626/B12626.bridge.0.2.json")
if os.path.exists(B):
    b = json.load(open(B))
    t("B12626 description (P6) passes the schema and format rules", validate(b) == [], str(validate(b)[:3]))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
