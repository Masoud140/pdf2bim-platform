#!/usr/bin/env python3
"""P5.2 tests: Query Register from the bridge description (pdf2bim/register.py, tools/query_register.py)."""
import json, os, re, subprocess, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.register import build, values_of, to_html, to_markdown
from pdf2bim.runrecord import decision_log, LAYERS

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


f = os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")
doc = json.load(open(f)); dec = decision_log(f)
Q = build(doc, dec)
vals = values_of(doc)
tc = Q["tag_counts"]
t("counts equal the description's: missing = Missing-Flagged, assumed = Assumed, standard = Standard-verify, proposed = values with status proposed",
  Q["counts"]["missing"] == tc.get("Missing-Flagged", 0) and Q["counts"]["assumed"] == tc.get("Assumed", 0) and Q["counts"]["standard"] == tc.get("Standard-verify", 0)
  and Q["counts"]["proposed"] == sum(v.get("status") == "proposed" or any(o["approval"]["status"] == "proposed" for o in v.get("overrides") or []) for _, v in vals), str(Q["counts"]))
enum = set(json.load(open(os.path.join(R, "schema/decision.schema.json")))["properties"]["affects"]["items"]["enum"])
t("every item has a path, a 'needed from', affects from the decision schema and outputs from the run-record layers",
  all(q["path"] and q["needed_from"] and set(q["affects"]) <= enum and set(q["outputs"]) <= set(LAYERS) for q in Q["items"]))
import tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proposed_state import make as proposed_state   # revision 14, D-34 ... D-43 still proposed (ADR-040)
fp = proposed_state(tempfile.mkdtemp())
Qp = build(json.load(open(fp)), decision_log(fp))
d42 = [q for q in Qp["items"] if q["decision"] == "D-42"]
t("a proposed record (D-42 loss inputs) carries its decision, reason, affects and the outputs it touches (girder checks, not geometry)",
  d42 and all("proposed" in q["categories"] and q["affects"] == ["design.supert"] and "girder_checks" in q["outputs"] and "geometry" not in q["outputs"] and q["decision_reason"] for q in d42), f"{len(d42)} rows")
t("no item without an open category (Direct / Calculated accepted values are not listed)", all(q["categories"] for q in Q["items"]) and not any(q["tag"] in ("Direct", "Calculated") and q["status"] != "proposed" for q in Q["items"]))
t("deterministic: built twice, identical", json.dumps(build(doc, dec)) == json.dumps(Q))
h = to_html(Q, "x")
t("HTML is standalone (no external script or stylesheet) and holds every item", not re.search(r"<script[^>]+src=|<link[^>]+stylesheet", h) and h.count('"path"') == len(Q["items"]))
m = to_markdown(Q, "x")
t("Markdown lists every item once per category", sum(m.count(f"| `{q['path']}` |") for q in Q["items"][:50]) == sum(len(q["categories"]) for q in Q["items"][:50]))
o = subprocess.run([sys.executable, os.path.join(R, "tools/query_register.py"), f], capture_output=True, text=True)
J = json.load(open(os.path.join(R, "projects/BR13A/QUERY_REGISTER.json")))
t("tools/query_register.py writes the register equal to build() (JSON items)", o.returncode == 0 and J["items"] == json.loads(json.dumps(Q["items"], default=str)))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
