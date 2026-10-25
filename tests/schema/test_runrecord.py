#!/usr/bin/env python3
"""P5.1 tests: run records and stale marking (pdf2bim/runrecord.py, tools/stale.py), on a copy of the example project."""
import copy, json, os, shutil, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.runrecord import make, status, LAYERS
from schema.c14n import stamp

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


d = tempfile.mkdtemp()
src = os.path.join(R, "projects/BR13A")
for f in ("BR13A.bridge.0.2.json", "BR13A.decisions.jsonl"):
    shutil.copy(os.path.join(src, f), d)
shutil.copytree(os.path.join(src, "history"), os.path.join(d, "history"))
P = os.path.join(d, "BR13A.bridge.0.2.json")
doc = json.load(open(P))
rc = make(P, doc, "girder_checks", allow_proposed=True)
rg = make(P, doc, "geometry", allow_proposed=True)
t("record carries revision, content hash, decisions, proposed used, engine commit, standards / library hashes",
  rc["revision"] == doc["revision"]["number"] and rc["description_hash"] == doc["hash"]["value"] and "D-42" in rc["proposed_used"] and rc["engine_commit"] and rc["standards_hash"].startswith("sha256:") and rc["library_hash"].startswith("sha256:"))
t("unchanged description: current", status(rc, P)["state"] == "current" and status(rg, P)["state"] == "current")
spec = json.load(open(os.path.join(src, "proposals/D-42.json")))
spec["decision"].update(id="D-99", affects=["design.supert"], reason="test proposal (P5.1 stale test)")
spec["add"][0]["path"] = ["custom", "stale_test"]
sp = os.path.join(d, "spec.json"); json.dump(spec, open(sp, "w"))
r = subprocess.run([sys.executable, os.path.join(R, "schema/propose_record.py"), P, "--spec", sp], capture_output=True, text=True)
t("a new proposal (test D-99, affects design.supert) creates the next revision", r.returncode == 0 and json.load(open(P))["revision"]["number"] == doc["revision"]["number"] + 1, (r.stdout + r.stderr)[-200:])
sc, sg = status(rc, P), status(rg, P)
t("a decision affecting the output's layers makes it stale, naming the decision", sc["state"] == "stale" and any("D-99" in x for x in sc["reasons"]) and sc["decisions_since"][0]["decision"] == "D-99", "; ".join(sc["reasons"]))
t("an output whose layers the decision does not affect stays current (reason recorded)", sg["state"] == "current" and "outside" in sg["reasons"][0])
d2 = json.load(open(P)); d2["revision"]["number"] += 1; d2["revision"]["note"] = "hand edit"; stamp(d2); json.dump(d2, open(P, "w"))
t("a revision not explained by a decision makes every later-revision output stale", status(rg, P)["state"] == "stale" and any("not explained" in x or "no history copy" in x for x in status(rg, P)["reasons"]), "; ".join(status(rg, P)["reasons"]))
d3 = copy.deepcopy(doc); d3["project"]["note_test"] = "x"; stamp(d3); json.dump(d3, open(P, "w"))
t("a changed description without a later revision number is stale", status(rg, P)["state"] == "stale" and "without a later revision" in status(rg, P)["reasons"][0])
json.dump(doc, open(P, "w"))
bad = dict(rg, standards_hash="sha256:0")
t("changed standards data makes the output stale", status(bad, P)["state"] == "stale" and "standards data changed" in status(bad, P)["reasons"])
t("an output without a run record is 'unknown'", status(None)["state"] == "unknown" and status({"run": {}})["state"] == "unknown")
t("an older engine commit is reported as engine changed (state unaffected)", status(dict(rg, engine_commit="0" * 40), P)["engine_changed"] is True and status(dict(rg, engine_commit="0" * 40), P)["state"] == "current")
t("every tool layer set uses decision 'affects' values of the decision schema",
  all(set(v) <= set(json.load(open(os.path.join(R, "schema/decision.schema.json")))["properties"]["affects"]["items"]["enum"]) for v in LAYERS.values()))
o = subprocess.run([sys.executable, os.path.join(R, "tools/stale.py"), src], capture_output=True, text=True)
t("tools/stale.py lists the example project's outputs with a state each", o.returncode == 0 and "current" in o.stdout and "without a run record" in o.stdout, o.stdout.strip().splitlines()[-1] if o.stdout else o.stderr[-200:])
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
