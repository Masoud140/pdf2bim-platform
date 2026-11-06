#!/usr/bin/env python3
"""P9 app tests: API key setting and the 'Read drawings' job, with the Claude API replaced by a fake (no network)."""
import io, json, os, stat, sys, tempfile, time
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R); sys.path.insert(0, os.path.join(R, "app")); sys.path.insert(0, os.path.join(R, "schema"))
import server
import pdf2bim.extract.reader as reader
from reportlab.pdfgen import canvas

res = []


def t(name, ok, info=""):
    res.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


tmp = tempfile.mkdtemp(prefix="pdf2bim_reader_")
server.DATA = tmp
os.environ.pop("ANTHROPIC_API_KEY", None)
c = server.app.test_client()

b = io.BytesIO()
cv = canvas.Canvas(b); cv.drawString(60, 760, "DRG No TEST-BR-DRG-000210"); cv.drawString(60, 730, "200 MIN THICK INSITU DECK"); cv.showPage(); cv.save()
r = c.post("/api/projects", data={"id": "NEW1", "drawings": (io.BytesIO(b.getvalue()), "set.pdf")}, content_type="multipart/form-data")
t("new bridge created from an uploaded PDF", r.status_code == 200, r.get_data(as_text=True)[:200])

r = c.post("/api/projects/NEW1/extract", json={})
t("reading without an API key is refused with a clear message", r.status_code == 400 and "API key" in r.get_data(as_text=True))
r = c.post("/api/settings", json={"api_key": "not a key!"})
t("a malformed key is refused", r.status_code == 400)
KEY = "sk-ant-test-0123456789abcdefghij"
s = c.post("/api/settings", json={"api_key": KEY}).get_json()
f = os.path.join(tmp, "settings.json")
t("key saved locally, owner-only file, never sent back (only its last 4 characters)", s["api_key_set"] and s["api_key_hint"] == "…ghij"
  and KEY not in json.dumps(c.get("/api/settings").get_json()) and stat.S_IMODE(os.stat(f).st_mode) == 0o600)
t("repository bridges cannot be overwritten by a reading", c.post("/api/projects/B12626/extract", json={}).status_code == 409)

seen = {}


def fake(body, key):
    seen["key"] = key; seen["model"] = body["model"]
    return {"content": [{"type": "text", "text": json.dumps({"document": {"number": "TEST-BR-DRG-000210", "revision": "A"}, "values": [
        {"path": "deck.slab_thickness", "value": 200, "unit": "mm", "tag": "Direct", "quote": "200 MIN THICK INSITU DECK", "view": "section"},
        {"path": "deck.surfacing_thickness", "value": 75, "unit": "mm", "tag": "Direct", "quote": "75 THICK WEARING SURFACE"}]})}],
        "usage": {"input_tokens": 100, "output_tokens": 20}}


reader.http_call = fake
r = c.post("/api/projects/NEW1/extract", json={"pages": "1-1"})
t("reading started", r.status_code == 200, r.get_data(as_text=True)[:200])
for _ in range(100):
    st = c.get("/api/projects/NEW1/extract/latest").get_json()
    if st and st["state"] != "running":
        break
    time.sleep(0.2)
t("reading finished and reported", st["state"] == "done" and st["summary"]["values"] == 1 and st["summary"]["rejected"] == 1, json.dumps(st.get("summary")))
t("the saved key and model were used for the API call", seen.get("key") == KEY and seen.get("model") == "claude-opus-5-5")
V = {x["path"]: x for x in c.get("/api/projects/NEW1/values?allow_proposed=1").get_json()["rows"]}
t("Bridge data now shows the printed value as Direct with its sheet; the invented one is absent",
  V["deck.slab_thickness"]["value"] == 200 and V["deck.slab_thickness"]["tag"] == "Direct" and V["deck.surfacing_thickness"]["tag"] == "Missing-Flagged")
D = c.get("/api/projects/NEW1/decisions").get_json()
t("missing inputs proposed as one decision D-1 for the engineer (not accepted)", st.get("proposed", 0) > 0 and [x["id"] for x in D["items"]] == ["D-1"]
  and V["loads.traffic_surcharge"]["proposed"] and V["loads.traffic_surcharge"]["tag"] == "Assumed", f"{st.get('proposed')} placeholders")
t("a field read from the drawings is never overwritten by a placeholder", V["deck.slab_thickness"]["tag"] == "Direct" and not V["deck.slab_thickness"]["proposed"])
t("reading again is allowed while nothing has been decided", c.post("/api/projects/NEW1/extract", json={"pages": "1-1"}).status_code == 200)
t("reading report lists the rejected proposal", "quote not found" in (st.get("report") or ""))
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
