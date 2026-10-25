#!/usr/bin/env python3
"""P5.4 tests: recording the engineer's decision (schema/accept_decision.py) on a copy of the example project —
accept a record proposal and an override proposal, reject one, AI refusal, rule checks, stale marking, register."""
import json, os, shutil, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from schema.rules_0_2 import records, check
from pdf2bim.description import Reader, MissingInput
from pdf2bim.register import build
from pdf2bim.runrecord import make, status, decision_log

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proposed_state import make as proposed_state   # revision 14, D-34 ... D-43 still proposed (ADR-040)
d = tempfile.mkdtemp()
P = proposed_state(d)
sys.path.insert(0, os.path.join(R, "tools"))
from decision_review import review
_, it0 = review(P)
run = lambda *a: subprocess.run([sys.executable, os.path.join(R, "schema/accept_decision.py"), P, *a], capture_output=True, text=True)
doc0 = json.load(open(P)); rc = make(P, doc0, "girder_checks", allow_proposed=True); rg = make(P, doc0, "geometry", allow_proposed=True)
Q0 = build(doc0, decision_log(P))
r = run("--decision", "D-42", "--by", "AI")
t("the AI cannot accept a decision", r.returncode != 0 and "AI cannot" in (r.stdout + r.stderr))
r = run("--decision", "D-42", "--by", "Test Engineer", "--at", "2026-10-25T13:00:00+00:00")
doc1 = json.load(open(P)); dec1 = decision_log(P)
rows = [rec for p, rec in records(doc1) if p.startswith("design.prestress_losses")]
t("accept D-42 (record proposals): next revision, every row accepted, log entry accepted with the approver; rule checks pass",
  r.returncode == 0 and doc1["revision"]["number"] == doc0["revision"]["number"] + 1 and rows and all(x["status"] == "accepted" for x in rows)
  and dec1["D-42"]["status"] == "accepted" and dec1["D-42"]["approved_by"] == "Test Engineer" and not check(doc1, dec1), (r.stdout + r.stderr)[-200:])
try:
    v = Reader(doc1, allow_proposed=False).rows(doc1["design"]["prestress_losses"], "design.prestress_losses"); ok = len(v) == len(rows)
except MissingInput as e:
    ok = False
t("after acceptance the rows are read without allow_proposed", ok)
t("the girder-check record (layers incl. design.supert) is now stale, the geometry record is not",
  status(rc, P)["state"] == "stale" and status(rg, P)["state"] == "current", "; ".join(status(rc, P)["reasons"]))
Q1 = build(doc1, dec1)
t("the Query Register drops the accepted proposals (D-42 rows no longer 'proposed')", Q1["counts"]["proposed"] == Q0["counts"]["proposed"] - len(rows) and not [q for q in Q1["items"] if q["decision"] == "D-42" and "proposed" in q["categories"]] and "D-42" not in Q1["proposed_decisions"])
r = run("--decision", "D-42", "--by", "Test Engineer")
t("a decision already accepted cannot be decided again", r.returncode != 0 and "not proposed" in (r.stdout + r.stderr))
ov = [(p, rec) for p, rec in records(doc1) if any(o.get("decision") == "D-34" and o["approval"]["status"] == "proposed" for o in rec.get("overrides") or [])]
r = run("--decision", "D-34", "--by", "Test Engineer", "--at", "2026-10-25T13:05:00+00:00")
doc2 = json.load(open(P)); R2 = dict(records(doc2))
p0, rec0 = ov[0]
o = next(x for x in R2[p0]["overrides"] if x.get("decision") == "D-34")
t("accept D-34 (override proposal): the override becomes current (value, tag), approval recorded, rules pass",
  r.returncode == 0 and R2[p0]["current"] == o["id"] and o["approval"]["status"] == "accepted" and (R2[p0].get("cells") or R2[p0].get("value")) == o["value"] and R2[p0]["tag"] == o["tag"]
  and not check(doc2, decision_log(P)), (r.stdout + r.stderr)[-300:])
r = run("--decision", "D-39", "--by", "Test Engineer", "--reject", "--note", "test rejection", "--at", "2026-10-25T13:10:00+00:00")
doc3 = json.load(open(P)); dec3 = decision_log(P)
t("reject D-39: approval rejected, current value unchanged, log entry rejected", r.returncode == 0 and dec3["D-39"]["status"] == "rejected"
  and all(o["approval"]["status"] == "rejected" for p, rec in records(doc3) for o in rec.get("overrides") or [] if o.get("decision") == "D-39")
  and all((rec.get("current") == dict(records(doc2))[p].get("current")) for p, rec in records(doc3) if any(o.get("decision") == "D-39" for o in rec.get("overrides") or [])), (r.stdout + r.stderr)[-200:])
Q3 = build(doc3, dec3)
t("register after the decisions: no item proposed under D-34 / D-39 / D-42", not [q for q in Q3["items"] if q["decision"] in ("D-34", "D-39", "D-42") and "proposed" in q["categories"]])
t("history keeps every previous revision", all(os.path.exists(os.path.join(d, "history", f"BR13A.bridge.0.2.r{n}.json")) for n in range(doc0["revision"]["number"], doc3["revision"]["number"])))
_, it3 = review(P)
t("decision review page: lists the proposed decisions with their values and accept / reject commands; decided ones drop out",
  {x["id"] for x in it0} - {x["id"] for x in it3} == {"D-34", "D-39", "D-42"} and all(x["values"] and "--decision " + x["id"] in x["accept"] for x in it0), f"{len(it0)} -> {len(it3)}")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
