#!/usr/bin/env python3
"""PDF2BIM web application (P7 stage 1, ADR-049): one place to upload drawings and follow a bridge from the
description through the model, analysis and design checks.

    python3 app/server.py [--port 8600] [--data app_data]      ->  http://localhost:8600

The engine is the repository's Python platform; the app only calls the existing tools (each chain step is the same
command an engineer would run), stores uploads / runs under the data folder (git-ignored: drawings are confidential)
and serves their outputs. Nothing here computes an engineering value."""
import argparse, datetime, glob, io, json, os, re, shutil, subprocess, sys, threading, time
from flask import Flask, jsonify, request, send_file, abort, send_from_directory

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT, "schema"))
from rules_0_2 import records

STATIC = os.path.join(os.path.dirname(__file__), "static")
app = Flask(__name__, static_folder=None)
DATA = os.path.join(ROOT, "app_data")
ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,40}$")
FILE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 _.()-]{0,120}$")
PY = sys.executable

# chain: (key, title, command builder(desc, run_dir, allow) -> argv, main output)
STEPS = [
    ("geometry", "Geometry (alignment, supports, girders, piles)", lambda d, o, a: ["tools/build_geometry.py", d, "--out", f"{o}/geometry.json"] + a, "geometry.json"),
    ("sections", "Section properties (Super-T, composite, torsion)", lambda d, o, a: ["tools/build_sections.py", d, "--out", f"{o}/sections.json"] + a, "sections.json"),
    ("model", "Integrated model + self weight / SDL solution", lambda d, o, a: ["app/model_view.py", d, f"{o}/model_view.json"] + a, "model_view.json"),
    ("mct", "MIDAS Civil export (.mct)", lambda d, o, a: ["tools/export_mct.py", d, "--out", f"{o}/model.mct"] + a, "model.mct"),
    ("actions", "Loads, combinations and combined actions", lambda d, o, a: ["tools/combined_actions.py", d, "--out", f"{o}/combined_actions.md"] + a, "combined_actions.json"),
    ("design", "Girder design checks (SLS, ULS, shear / torsion)", lambda d, o, a: ["tools/girder_checks.py", d, "--out", f"{o}/girder_checks.md"] + a, "girder_checks.json"),
]
JOBS = {}          # project id -> thread
LOCK = threading.Lock()


# ---------------- projects ----------------
def _repo_projects():
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "projects", "*", "*.bridge.0.2.json"))):
        pid = os.path.basename(os.path.dirname(f))
        out[pid] = {"id": pid, "description": f, "origin": "repository", "repo_outputs": os.path.join(os.path.dirname(f), "model")}
    for f in sorted(glob.glob(os.path.join(DATA, "projects", "*", "*.bridge.0.2.json"))):
        pid = os.path.basename(os.path.dirname(f))
        out.setdefault(pid, {"id": pid, "description": f, "origin": "uploaded", "repo_outputs": None})
    return out


def project(pid):
    if not ID.match(pid or ""):
        abort(400, "bad project id")
    p = _repo_projects().get(pid)
    if not p:
        abort(404, "no such project")
    return p


def pdir(pid, *sub):
    d = os.path.join(DATA, pid, *sub)
    os.makedirs(d, exist_ok=True)
    return d


def load_doc(p):
    return json.load(open(p["description"]))


def effective(rec, allow):
    """(value, tag, override) the engine would use: the last proposed override when allow_proposed, else the record."""
    ov = [o for o in rec.get("overrides", []) if o.get("approval", {}).get("status") == "proposed"]
    if allow and ov:
        return ov[-1].get("value"), ov[-1].get("tag"), ov[-1]
    return rec.get("cells", rec.get("value")) if "value" not in rec else rec.get("value"), rec.get("tag"), None


def latest_run(pid):
    runs = sorted(glob.glob(os.path.join(DATA, pid, "runs", "*", "status.json")))
    return json.load(open(runs[-1])) if runs else None


@app.get("/api/projects")
def api_projects():
    rows = []
    for pid, p in _repo_projects().items():
        doc = load_doc(p)
        pr = doc.get("project") or {}
        name = (pr.get("name") or {}).get("value") if isinstance(pr.get("name"), dict) else None
        c = {}
        for _, r in records(doc):
            c[r.get("tag")] = c.get(r.get("tag"), 0) + 1
        run = latest_run(pid)
        rows.append({"id": pid, "name": name, "origin": p["origin"], "revision": doc.get("revision"), "tags": c,
                     "drawings": len(glob.glob(os.path.join(DATA, pid, "drawings", "*.pdf"))),
                     "last_run": run and {k: run[k] for k in ("id", "state", "started", "finished")}})
    return jsonify(rows)


@app.post("/api/projects")
def api_new_project():
    pid = (request.form.get("id") or "").strip()
    if not ID.match(pid) or pid in _repo_projects():
        abort(400, "project id must be new, letters / digits / - / _")
    files = request.files.getlist("drawings")
    d = pdir("projects", pid)
    docs = []
    for i, f in enumerate(files, 1):
        name = _save_pdf(pid, f)
        docs.append({"id": f"DOC-{i}", "number": name, "revision": "-", "kind": "drawing"})
    inp = os.path.join(d, "input.json")
    json.dump({"documents": docs, "values": []}, open(inp, "w"), indent=1)
    out = os.path.join(d, f"{pid}.bridge.0.2.json")
    r = subprocess.run([PY, "tools/new_description.py", inp, "--out", out], cwd=ROOT, capture_output=True, text=True)
    if r.returncode or not os.path.exists(out):
        shutil.rmtree(d, ignore_errors=True)
        abort(500, "description not created: " + (r.stderr or r.stdout)[-800:])
    return jsonify({"id": pid})


# ---------------- drawings ----------------
def _save_pdf(pid, f):
    name = os.path.basename(f.filename or "")
    if not FILE.match(name) or not name.lower().endswith(".pdf"):
        abort(400, f"not a PDF file name: {name!r}")
    head = f.stream.read(5); f.stream.seek(0)
    if head != b"%PDF-":
        abort(400, f"{name} is not a PDF")
    dest = os.path.join(pdir(pid, "drawings"), name)
    f.save(dest)
    try:
        import pypdfium2 as pdfium
        if len(pdfium.PdfDocument(dest)) < 1:
            raise ValueError("no pages")
    except Exception as e:      # unreadable: do not keep it (it would break the page index)
        os.remove(dest)
        abort(400, f"{name} could not be read as a PDF ({e})")
    idx = os.path.join(pdir(pid, "pages"), name + ".json")
    if os.path.exists(idx):
        os.remove(idx)
    return name


def _pdf(pid, name):
    if not FILE.match(name or ""):
        abort(400)
    f = os.path.join(DATA, pid, "drawings", name)
    if not os.path.exists(f):
        abort(404)
    return f


def page_index(pid, name, doc):
    """Per page: the description's document whose number (or id digits) is printed on the page — generic, from the
    description's documents list."""
    cache = os.path.join(pdir(pid, "pages"), name + ".json")
    if os.path.exists(cache):
        return json.load(open(cache))
    import pdfplumber
    keys = [(d["id"], [s for s in (d.get("number"), re.sub(r"^\D+", "", d["id"])) if s and len(s) >= 5]) for d in doc.get("documents") or []]
    pages = []
    try:
        with pdfplumber.open(_pdf(pid, name)) as pdf:
            for i, pg in enumerate(pdf.pages):
                txt = pg.extract_text() or ""
                hit = [did for did, ks in keys if any(k in txt for k in ks)]
                pages.append({"page": i + 1, "documents": hit[:3], "w": float(pg.width), "h": float(pg.height)})
    except Exception as e:
        return [{"page": 0, "documents": [], "error": f"unreadable PDF: {e}"[:200]}]   # not cached: re-read after a re-upload
    json.dump(pages, open(cache, "w"))
    return pages


@app.get("/api/projects/<pid>/drawings")
def api_drawings(pid):
    p = project(pid); doc = load_doc(p)
    out = [{"file": os.path.basename(f), "pages": page_index(pid, os.path.basename(f), doc)} for f in sorted(glob.glob(os.path.join(DATA, pid, "drawings", "*.pdf")))]
    return jsonify({"files": out, "documents": doc.get("documents") or []})


@app.post("/api/projects/<pid>/drawings")
def api_upload(pid):
    project(pid)
    return jsonify({"saved": [_save_pdf(pid, f) for f in request.files.getlist("drawings")]})


@app.get("/api/projects/<pid>/drawings/<name>/<int:page>.png")
def api_page(pid, name, page):
    project(pid)
    dpi = min(max(int(request.args.get("dpi", 110)), 40), 300)
    f = os.path.join(pdir(pid, "pages"), f"{name}.{page}.{dpi}.png")
    if not os.path.exists(f):
        import pypdfium2 as pdfium
        doc = pdfium.PdfDocument(_pdf(pid, name))
        if not 1 <= page <= len(doc):
            abort(404)
        doc[page - 1].render(scale=dpi / 72).to_pil().save(f)
    return send_file(f, mimetype="image/png", max_age=3600)


# ---------------- description values ----------------
@app.get("/api/projects/<pid>/values")
def api_values(pid):
    p = project(pid); doc = load_doc(p)
    allow = request.args.get("allow_proposed", "1") == "1"
    rows = []
    for path, r in records(doc):
        v, tag, ov = effective(r, allow)
        src = (ov or {}).get("source") or r.get("source") or {}
        der = (ov or {}).get("derivation") or r.get("derivation")
        rows.append({"path": path, "value": v, "unit": (ov or r).get("unit"), "tag": tag, "status": r.get("status"),
                     "sheet": src.get("sheet") or src.get("doc") or src.get("document"), "view": src.get("view"),
                     "note": (ov or {}).get("reason") or r.get("note") or src.get("note") or src.get("text"),
                     "derivation": der and der.get("formula"), "decision": (ov or {}).get("decision") or r.get("decision"),
                     "proposed": bool(ov), "original_tag": (r.get("original") or {}).get("tag"),
                     "replace_with": (ov or {}).get("replace_with") or r.get("replace_with")})
    return jsonify({"revision": doc.get("revision"), "hash": doc.get("hash"), "rows": rows})


# ---------------- chain runs ----------------
def _run_chain(pid, desc, allow, rid):
    d = pdir(pid, "runs", rid)
    st = {"id": rid, "state": "running", "pid": os.getpid(), "allow_proposed": allow, "started": _now(), "finished": None, "description": os.path.relpath(desc, ROOT),
          "engine_commit": _git("rev-parse", "--short", "HEAD"), "steps": [{"key": k, "title": t, "state": "waiting"} for k, t, _, _ in STEPS]}
    save = lambda: json.dump(st, open(os.path.join(d, "status.json"), "w"), indent=1)
    save()
    log = open(os.path.join(d, "log.txt"), "w")
    for s, (k, t, cmd, outf) in zip(st["steps"], STEPS):
        s["state"] = "running"; s["started"] = _now(); save()
        t0 = time.time()
        log.write(f"\n=== {t}\n$ python3 {' '.join(cmd(os.path.relpath(desc, ROOT), os.path.relpath(d, ROOT), ['--allow-proposed'] if allow else []))}\n"); log.flush()
        r = subprocess.run([PY] + cmd(desc, d, ["--allow-proposed"] if allow else []), cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        s["seconds"] = round(time.time() - t0, 1)
        s["state"] = "done" if r.returncode == 0 and os.path.exists(os.path.join(d, outf)) else "failed"
        save()
        if s["state"] == "failed":
            for s2 in st["steps"]:
                if s2["state"] == "waiting":
                    s2["state"] = "skipped"
            break
    log.close()
    st["state"] = "failed" if any(s["state"] == "failed" for s in st["steps"]) else "done"
    st["finished"] = _now(); save()


def _alive(p):
    try:
        os.kill(int(p), 0)
        return True
    except (TypeError, ValueError, OSError):
        return False


def _now():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def _git(*a):
    try:
        return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    except OSError:
        return None


@app.post("/api/projects/<pid>/runs")
def api_run(pid):
    p = project(pid)
    allow = (request.json or {}).get("allow_proposed", True) if request.is_json else True
    with LOCK:
        if pid in JOBS and JOBS[pid].is_alive():
            abort(409, "a run is already in progress")
        rid = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        th = threading.Thread(target=_run_chain, args=(pid, p["description"], bool(allow), rid), daemon=True)
        JOBS[pid] = th; th.start()
    return jsonify({"id": rid})


@app.get("/api/projects/<pid>/runs/latest")
def api_run_latest(pid):
    project(pid)
    st = latest_run(pid)
    if not st:
        return jsonify(None)
    if st["state"] == "running" and not (pid in JOBS and JOBS[pid].is_alive()) and not _alive(st.get("pid")):
        st["state"] = "interrupted"            # the server that ran it has stopped
    lf = os.path.join(DATA, pid, "runs", st["id"], "log.txt")
    st["log"] = open(lf).read()[-20000:] if os.path.exists(lf) else ""
    st["files"] = sorted(os.path.basename(f) for f in glob.glob(os.path.join(DATA, pid, "runs", st["id"], "*")) if not f.endswith("status.json"))
    return jsonify(st)


def _result_file(pid, name):
    """Latest app run output; else the repository output committed for the project (labelled)."""
    st = latest_run(pid)
    if st:
        f = os.path.join(DATA, pid, "runs", st["id"], name)
        if os.path.exists(f):
            return f, {"source": "run", "run": st["id"], "allow_proposed": st["allow_proposed"], "engine_commit": st.get("engine_commit")}
    p = project(pid)
    if p["repo_outputs"]:
        alias = {"combined_actions.json": f"{pid}.combined_actions.json", "girder_checks.json": f"{pid}.girder_checks.json",
                 "model.mct": f"{pid}.integrated.mct"}.get(name)
        f = alias and os.path.join(p["repo_outputs"], alias)
        if f and os.path.exists(f):
            return f, {"source": "repository", "file": os.path.relpath(f, ROOT), "engine_commit": _git("log", "-1", "--format=%h", "--", f)}
    return None, None


@app.get("/api/projects/<pid>/results/<name>")
def api_result(pid, name):
    if name not in ("model_view.json", "combined_actions.json", "girder_checks.json", "geometry.json"):
        abort(404)
    f, meta = _result_file(pid, name)
    if not f:
        return jsonify({"meta": None, "data": None})
    return app.response_class('{"meta": %s, "data": %s}' % (json.dumps(meta), open(f).read()), mimetype="application/json")


@app.get("/api/projects/<pid>/files/<name>")
def api_file(pid, name):
    project(pid)
    if not FILE.match(name):
        abort(400)
    st = latest_run(pid)
    f = st and os.path.join(DATA, pid, "runs", st["id"], name)
    if not f or not os.path.exists(f):
        f, _ = _result_file(pid, name)
    if not f:
        abort(404)
    return send_file(f, as_attachment=True, download_name=f"{pid}.{name}")


@app.get("/api/projects/<pid>/description.json")
def api_desc_file(pid):
    p = project(pid)
    return send_file(p["description"], as_attachment=True)


# ---------------- front end ----------------
@app.get("/")
@app.get("/p/<path:_>")
def index(_=None):
    return send_from_directory(STATIC, "index.html")


@app.get("/static/<path:f>")
def static_files(f):
    return send_from_directory(STATIC, f)


def main():
    global DATA
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8600); ap.add_argument("--host", default="127.0.0.1"); ap.add_argument("--data", default=DATA)
    a = ap.parse_args()
    DATA = os.path.abspath(a.data)
    os.makedirs(DATA, exist_ok=True)
    print(f"PDF2BIM app: http://{a.host}:{a.port}   (data: {DATA})")
    app.run(host=a.host, port=a.port, threaded=True)


if __name__ == "__main__":
    main()
