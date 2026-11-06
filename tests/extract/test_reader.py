#!/usr/bin/env python3
"""P9 drawing reader: Claude's proposals pass through deterministic checks before they reach the description.
No network: the API is replaced by a fake that returns prepared answers, some honest, some invented."""
import json, os, subprocess, sys, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from pdf2bim.extract.verify import check_page, evaluate
from pdf2bim.extract.run import run

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


tmp = tempfile.mkdtemp()
pdf = os.path.join(tmp, "set.pdf")
c = canvas.Canvas(pdf, pagesize=landscape(A3))
for lines in (["DRG No TEST-BR-DRG-000110", "200 MIN THICK INSITU DECK", "75 THICK BITUMINOUS WEARING SURFACE",
               "HEADSTOCK 779 571", "SPILL THROUGH ABUTMENT", "PILE A-01 ULS 3524 kN SLS 2713 kN M 2049 kNm"],
              ["DRG No TEST-BR-DRG-000111", "250 MIN THICK INSITU DECK"]):
    y = 760
    for s in lines:
        c.drawString(60, y, s); y -= 24
    c.showPage()
c.save()

P1 = {"document": {"number": "TEST-BR-DRG-000110", "revision": "C", "title": "GA"}, "values": [
    {"path": "deck.slab_thickness", "value": 200, "unit": "mm", "tag": "Direct", "quote": "200 MIN THICK INSITU DECK", "view": "section 1"},
    {"path": "deck.surfacing_thickness", "value": 75, "unit": "mm", "tag": "Direct", "quote": "75 THICK BITUMINOUS WEARING SURFACE"},
    {"path": "deck.surfacing_density", "value": 22, "unit": "kN/m3", "tag": "Direct", "quote": "ASPHALT 22 kN/m3"},          # invented
    {"path": "deck.end_gap", "value": 50, "unit": "mm", "tag": "Direct", "quote": "200 MIN THICK INSITU DECK"},           # number not in quote
    {"path": "supports[A].headstock.rows[]", "cells": {"width": 1350}, "tag": "Direct", "quote": "HEADSTOCK 779 571"},       # 1350 not printed
    {"path": "custom.headstock_width_A", "value": 1350, "tag": "Calculated", "expression": "779 + 571", "quotes": ["HEADSTOCK 779 571"]},
    {"path": "custom.headstock_bad", "value": 1400, "tag": "Calculated", "expression": "779 + 571", "quotes": ["HEADSTOCK 779 571"]},
    {"path": "custom.headstock_sneaky", "value": 1379, "tag": "Calculated", "expression": "779 + 600", "quotes": ["HEADSTOCK 779 571"]},
    {"path": "deck.wobble", "value": 1, "tag": "Direct", "quote": "200 MIN THICK INSITU DECK"},                               # not a field
    {"path": "supports[A].kind", "value": "spill-through abutment", "tag": "Direct", "quote": "SPILL THROUGH ABUTMENT"},
    {"path": "supports[A].piles[A-01].design_actions.rows[]", "cells": {"limit_state": "ULS", "N": 3524, "M": 2049}, "tag": "Direct",
     "quote": "PILE A-01 ULS 3524 kN SLS 2713 kN M 2049 kNm"}]}
P2 = {"document": {"number": "TEST-BR-DRG-000111", "revision": "C"}, "values": [
    {"path": "deck.slab_thickness", "value": 250, "unit": "mm", "tag": "Direct", "quote": "250 MIN THICK INSITU DECK"}]}
answers = iter([P1, P2])
fake = lambda body, key: {"content": [{"type": "text", "text": json.dumps(next(answers))}], "usage": {"input_tokens": 10, "output_tokens": 5}}

t("arithmetic evaluator computes plain sums", evaluate("779 + 571") == 1350 and evaluate("1050 / 1000") == 1.05)
try:
    evaluate("__import__('os').system('x')"); safe = False
except ValueError:
    safe = True
t("evaluator rejects function calls", safe)

out = os.path.join(tmp, "x")
s = run([pdf], out, "test-key", call=fake, progress=lambda m: None)
V = {v["path"]: v for v in json.load(open(os.path.join(out, "values.json")))["values"]}
pg = json.load(open(os.path.join(out, "pages", "set_pdf_p001.json")))
why = {r["value"]["path"]: r["reason"] for r in pg["rejected"]}
t("printed value with its quote on the page is accepted as Direct with sheet and quote",
  V["deck.surfacing_thickness"]["tag"] == "Direct" and V["deck.surfacing_thickness"]["source"]["doc"] == "DRG-000110"
  and "75 THICK" in V["deck.surfacing_thickness"]["source"]["text"])
t("invented value (quote not on the page) is rejected", "deck.surfacing_density" not in V and "not found" in why["deck.surfacing_density"])
t("number not in its quote is rejected", "deck.end_gap" not in V and "not printed" in why["deck.end_gap"])
t("table cell not printed is rejected", "supports[A].headstock.rows[0]" not in V)
t("Calculated is re-evaluated: correct sum kept with its formula", V["custom.headstock_width_A"]["tag"] == "Calculated"
  and "779 + 571" in V["custom.headstock_width_A"]["derivation"]["formula"])
t("Calculated with a wrong result is rejected", "custom.headstock_bad" not in V and "does not equal" in why["custom.headstock_bad"])
t("Calculated using a number not printed is rejected", "custom.headstock_sneaky" not in V and "not printed" in why["custom.headstock_sneaky"])
t("unknown path is rejected", "deck.wobble" not in V)
t("an enum read from wording becomes tag Model with the quote as note", V["supports[A].kind"]["tag"] == "Model" and "SPILL THROUGH" in V["supports[A].kind"]["source"]["note"])
t("table row with printed numbers is accepted", V["supports[A].piles[A-01].design_actions.rows[0]"]["cells"]["N"] == 3524)
t("two sheets disagree (200 vs 250): left Missing-Flagged with both candidates for the engineer",
  V["deck.slab_thickness"]["tag"] == "Missing-Flagged" and "200" in V["deck.slab_thickness"]["note"] and "250" in V["deck.slab_thickness"]["note"])
t("a number matched only by dropping its decimal point is rejected (8527 vs printed 8.527)",
  check_page([{"path": "deck.slab_thickness", "value": 8527, "unit": "mm", "tag": "Direct", "quote": "RL 8527"}], "BEARING RL 8.527", "D", 1)[0] == [])
t("scanned page (no text layer): nothing accepted", check_page(P2["values"], "", "D", 1)[0] == [])

desc = os.path.join(tmp, "X.bridge.0.2.json")
r = subprocess.run([sys.executable, os.path.join(R, "tools/new_description.py"), os.path.join(out, "values.json"), "--out", desc], capture_output=True, text=True)
d = json.load(open(desc)) if os.path.exists(desc) else {}
t("reader output builds a valid 0.2 description (schema + format rules)", r.returncode == 0 and d.get("deck", {}).get("surfacing_thickness", {}).get("value") == 75,
  (r.stdout + r.stderr)[-300:])
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
