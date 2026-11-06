#!/usr/bin/env python3
"""P9.3 app tests: an engineer edits a girder (strands, fitments) in one save: one decision under their name,
accepted, new rows added as records (never removed), every change tagged Input-user, history kept."""
import json, os, shutil, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(R, "app")); sys.path.insert(0, os.path.join(R, "schema"))
import server
from rules_0_2 import records, check

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


tmp = tempfile.mkdtemp(prefix="pdf2bim_edit_")
server.DATA = tmp
d = os.path.join(tmp, "projects", "ED1"); os.makedirs(d)
shutil.copy(os.path.join(R, "projects/B12453/B12453.bridge.0.2.json"), os.path.join(d, "ED1.bridge.0.2.json"))
shutil.copy(os.path.join(R, "projects/B12453/B12453.decisions.jsonl"), os.path.join(d, "ED1.decisions.jsonl"))
c = server.app.test_client()
F = os.path.join(d, "ED1.bridge.0.2.json")
rev0 = json.load(open(F))["revision"]["number"]
ST = "superstructure.supert_types[ST1]"
rec0 = dict(records(json.load(open(F))))[f"{ST}.strand_pattern.rows[0]"]
off = dict(rec0["cells"], on=False)

r = c.post("/api/projects/ED1/values/batch", json={"by": "", "reason": "x", "items": [{"path": f"{ST}.strand_pattern.rows[0]", "value": off}]})
t("a save without a name is refused (decisions are recorded against a person)", r.status_code == 400)
r = c.post("/api/projects/ED1/values/batch", json={"by": "Masoud", "reason": "", "items": [{"path": f"{ST}.strand_pattern.rows[0]", "value": off}]})
t("a save without a reason is refused", r.status_code == 400)
r = c.post("/api/projects/ED1/values/batch", json={"by": "Masoud", "reason": "option B: strand 1 off, closer fitments at the ends",
           "items": [{"path": f"{ST}.strand_pattern.rows[0]", "value": off}, {"path": f"{ST}.jacking_ratio", "value": 0.72}],
           "new_rows": [{"table": f"{ST}.fitments", "cells": {"from": 0.0, "to": 1.5, "diameter": 16.0, "legs": 2, "spacing": 100.0}}]})
j = r.get_json() or {}
t("girder edit saved as one decision", r.status_code == 200 and j.get("changed") == 3, r.get_data(as_text=True)[:300])
doc = json.load(open(F))
Rn = dict(records(doc))
did = j.get("decision")
dec = {json.loads(l)["id"]: json.loads(l) for l in open(os.path.join(d, "ED1.decisions.jsonl")) if l.strip()}
t("the decision is accepted by the same person; every change is Input-user", dec[did]["status"] == "accepted" and all(
    Rn[p]["tag"] == "Input-user" for p in (f"{ST}.strand_pattern.rows[0]", f"{ST}.jacking_ratio")))
t("strand switched off, not deleted (record kept, original unchanged)", Rn[f"{ST}.strand_pattern.rows[0]"]["cells"]["on"] is False
  and Rn[f"{ST}.strand_pattern.rows[0]"]["original"]["cells"]["on"] is True)
fit = [p for p in Rn if p.startswith(f"{ST}.fitments.rows[")]
t("new fitment row added as a record with the entered cells", Rn[fit[-1]]["cells"]["spacing"] == 100.0 and Rn[fit[-1]]["tag"] == "Input-user")
t("description still passes the format rules; revisions kept in history", not check(doc, dec) and doc["revision"]["number"] == rev0 + 2
  and os.path.exists(os.path.join(d, "history", f"ED1.bridge.0.2.r{rev0}.json")))
r = c.post("/api/projects/ED1/values/batch", json={"by": "Masoud", "reason": "x", "items": [{"path": "deck.nope", "value": 1}]})
t("unknown path refused, nothing written", r.status_code == 400 and json.load(open(F))["revision"]["number"] == rev0 + 2)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
