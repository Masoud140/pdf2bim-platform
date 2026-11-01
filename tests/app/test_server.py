#!/usr/bin/env python3
"""P7 stage 1 tests: the web app's API (app/server.py) against a temporary data folder.

Checks that the app shows the description exactly as the engine reads it (tags, proposed overrides), keeps uploads
inside the data folder, refuses non-PDFs / unsafe names, creates a new bridge with every field Missing-Flagged, and
reports a failed chain step instead of inventing results."""
import io, json, os, sys, tempfile, time
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(R, "app")); sys.path.insert(0, os.path.join(R, "schema"))
import server
from rules_0_2 import records

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


tmp = tempfile.mkdtemp(prefix="pdf2bim_app_")
server.DATA = tmp
c = server.app.test_client()

ps = {p["id"]: p for p in c.get("/api/projects").get_json()}
t("repository bridges listed (BR13A, B12626)", {"BR13A", "B12626"} <= set(ps))
doc = json.load(open(os.path.join(R, "projects/B12626/B12626.bridge.0.2.json")))
n = sum(1 for _ in records(doc))
t("tag counts equal the description's records", sum(ps["B12626"]["tags"].values()) == n, f"{n} records")

V = {r["path"]: r for r in c.get("/api/projects/B12626/values?allow_proposed=1").get_json()["rows"]}
V0 = {r["path"]: r for r in c.get("/api/projects/B12626/values?allow_proposed=0").get_json()["rows"]}
sd, sd0 = V["deck.surfacing_density"], V0["deck.surfacing_density"]
t("proposed override shown as the engine uses it (allow_proposed): surfacing 22 Standard-verify, flagged proposed D-1",
  sd["value"] == 22 and sd["tag"] == "Standard-verify" and sd["proposed"] and sd["decision"] == "D-1" and sd["original_tag"] == "Missing-Flagged")
t("without allow_proposed the drawing record is shown (Missing-Flagged, no value)", sd0["value"] is None and sd0["tag"] == "Missing-Flagged" and not sd0["proposed"])
t("every value row carries one data-source tag", all(r["tag"] for r in V.values()) and len(V) == n)

# uploads
bad = c.post("/api/projects/B12626/drawings", data={"drawings": (io.BytesIO(b"not a pdf"), "x.pdf")}, content_type="multipart/form-data")
t("non-PDF content refused", bad.status_code == 400)
trav = c.post("/api/projects/B12626/drawings", data={"drawings": (io.BytesIO(b"%PDF-1.4"), "../evil.pdf")}, content_type="multipart/form-data")
t("path in the file name stripped and a broken PDF refused: nothing saved outside the data folder", trav.status_code == 400 and not os.path.exists(os.path.join(tmp, "B12626", "evil.pdf"))
  and not os.path.exists(os.path.join(R, "projects", "evil.pdf")))
from reportlab.pdfgen import canvas
buf = io.BytesIO(); cv = canvas.Canvas(buf)
cv.drawString(72, 720, "TEST PAGE ONLY - M1RTBH2T-JHGM-6003BR09-BR-DRG-109201"); cv.showPage(); cv.drawString(72, 720, "second test page"); cv.showPage(); cv.save()
pdf_bytes = buf.getvalue()
up = c.post("/api/projects/B12626/drawings", data={"drawings": (io.BytesIO(pdf_bytes), "test_set.pdf")}, content_type="multipart/form-data")
dr = c.get("/api/projects/B12626/drawings").get_json()
f = next((x for x in dr["files"] if x["file"] == "test_set.pdf"), None)
t("PDF stored and pages indexed to the description's documents by printed drawing number",
  up.status_code == 200 and f and len(f["pages"]) == 2 and f["pages"][0]["documents"] == ["DRG-109201"] and f["pages"][1]["documents"] == [])
png = c.get("/api/projects/B12626/drawings/test_set.pdf/1.png?dpi=50")
t("page rendered to PNG", png.status_code == 200 and png.data[:8] == b"\x89PNG\r\n\x1a\n")
t("unknown project / unsafe id refused", c.get("/api/projects/..%2Fx/values").status_code in (400, 404) and c.get("/api/projects/NOPE/values").status_code == 404)

# results fallback: repository outputs when the app has not run
gc = c.get("/api/projects/B12626/results/girder_checks.json").get_json()
t("design results fall back to the committed repository output, labelled as such", gc["meta"]["source"] == "repository" and "SG-01" in gc["data"])
t("only known result names served", c.get("/api/projects/B12626/results/secret.json").status_code == 404)

# new bridge: blank description, chain stops at the first step with the missing inputs
r = c.post("/api/projects", data={"id": "TESTBR", "drawings": (io.BytesIO(pdf_bytes), "set.pdf")}, content_type="multipart/form-data")
t("new bridge created", r.status_code == 200, r.get_data(as_text=True)[:200])
VN = c.get("/api/projects/TESTBR/values").get_json()["rows"]
t("new bridge: every catalogue field Missing-Flagged, nothing filled in", VN and all(x["tag"] == "Missing-Flagged" for x in VN), f"{len(VN)} fields")
t("duplicate / bad ids refused", c.post("/api/projects", data={"id": "B12626"}).status_code == 400 and c.post("/api/projects", data={"id": "../x"}).status_code == 400)
c.post("/api/projects/TESTBR/runs", json={"allow_proposed": True})
for _ in range(120):
    st = c.get("/api/projects/TESTBR/runs/latest").get_json()
    if st and st["state"] != "running":
        break
    time.sleep(0.5)
t("chain on a blank description: geometry step fails, later steps skipped, no results produced",
  st["state"] == "failed" and st["steps"][0]["state"] == "failed" and all(s["state"] == "skipped" for s in st["steps"][1:])
  and c.get("/api/projects/TESTBR/results/girder_checks.json").get_json()["data"] is None, st["log"].strip().splitlines()[-1][:160] if st["log"] else "")

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
