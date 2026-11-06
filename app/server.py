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
    ("report", "Calculation report", lambda d, o, a: ["app/report.py", d, o] + a, "report.html"),
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
    import pypdfium2 as pdfium          # pdfium: ~3 s for a 143-sheet A1 set (pdfplumber took minutes and ran out of memory)
    keys = [(d["id"], [s for s in (d.get("number"), re.sub(r"^\D+", "", d["id"])) if s and len(s) >= 5]) for d in doc.get("documents") or []]
    pages = []
    try:
        pdf = pdfium.PdfDocument(_pdf(pid, name))
        for i in range(len(pdf)):
            pg = pdf[i]
            txt = pg.get_textpage().get_text_range() or ""
            w, hh = pg.get_size()
            hit = [did for did, ks in keys if any(k in txt for k in ks)]
            pages.append({"page": i + 1, "documents": hit[:3], "w": float(w), "h": float(hh)})
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
# ---------------- drawing reader (P9, Claude API with the owner's key) ----------------
SETTINGS = lambda: os.path.join(DATA, "settings.json")


def _settings():
    try:
        return json.load(open(SETTINGS()))
    except (OSError, ValueError):
        return {}


def _api_key():
    return os.environ.get("ANTHROPIC_API_KEY") or _settings().get("api_key")


@app.get("/api/settings")
def api_settings():
    k = _api_key()
    return jsonify({"api_key_set": bool(k), "api_key_hint": ("…" + k[-4:]) if k else None, "from_env": bool(os.environ.get("ANTHROPIC_API_KEY")),
                    "model": _settings().get("model") or "claude-opus-5-5"})


@app.post("/api/settings")
def api_save_settings():
    b = request.json or {}
    s = _settings()
    if "api_key" in b:
        k = str(b["api_key"] or "").strip()
        if k and not re.match(r"^[A-Za-z0-9_\-]{20,300}$", k):
            abort(400, "that does not look like an API key")
        s["api_key"] = k or None
    if b.get("model"):
        if not re.match(r"^[a-z0-9.\-]{3,60}$", b["model"]):
            abort(400, "bad model name")
        s["model"] = b["model"]
    os.makedirs(DATA, exist_ok=True)
    f = SETTINGS()
    with open(os.open(f, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as fh:    # local only, owner-readable, never committed
        json.dump(s, fh)
    return api_settings()


def _extract_job(pid, p, rid, page_range):
    from pdf2bim.extract.run import run as read_set
    d = pdir(pid, "extract", rid)
    st = {"id": rid, "state": "running", "started": _now(), "finished": None, "log": [], "summary": None}
    save = lambda: json.dump(st, open(os.path.join(d, "status.json"), "w"), indent=1)
    prog = lambda m: (st["log"].append(m), save())
    save()
    try:
        pdfs = sorted(glob.glob(os.path.join(DATA, pid, "drawings", "*.pdf")))
        st["summary"] = read_set(pdfs, d, _api_key(), _settings().get("model") or "claude-opus-5-5", page_range, progress=prog)
        from pdf2bim.extract.propose_missing import add_placeholders, propose_defaults
        vj = os.path.join(d, "values.json")
        v = json.load(open(vj)); v["values"] = add_placeholders(v["values"]); json.dump(v, open(vj, "w"), indent=1)
        desc = p["description"]
        for f in (desc, desc[:-5] + ".new.md", desc.replace(".bridge.0.2.json", ".decisions.jsonl")):
            if os.path.exists(f):
                os.remove(f)
        shutil.rmtree(os.path.join(os.path.dirname(desc), "history"), ignore_errors=True)
        r = subprocess.run([PY, "tools/new_description.py", vj, "--out", desc], cwd=ROOT, capture_output=True, text=True)
        prog((r.stdout or "") + (r.stderr or ""))
        if r.returncode == 0 and os.path.exists(desc):
            n = propose_defaults(desc)
            prog(f"{n} development placeholders proposed as decision D-1 (Decisions tab): accept, change or reject them before relying on results")
            st["proposed"] = n
            st["state"] = "done"
        else:
            st["state"] = "failed"
    except Exception as e:
        prog(f"failed: {e}"); st["state"] = "failed"
    st["finished"] = _now(); save()


@app.post("/api/projects/<pid>/extract")
def api_extract(pid):
    p = project(pid)
    if p["origin"] != "uploaded":
        abort(409, "this bridge's data is kept in the repository; create a new bridge in the app to read drawings")
    log = p["description"].replace(".bridge.0.2.json", ".decisions.jsonl")
    if os.path.exists(log) and any(json.loads(l).get("status") != "proposed" for l in open(log) if l.strip()):
        abort(409, "an engineer has already decided on this bridge's data; reading again would replace it. Create a new bridge instead.")
    if not _api_key():
        abort(400, "no Claude API key: add it on the Drawings tab (it is stored on this computer only)")
    if not glob.glob(os.path.join(DATA, pid, "drawings", "*.pdf")):
        abort(400, "upload the drawings first")
    pr = (request.json or {}).get("pages") if request.is_json else None
    page_range = None
    if pr:
        m = re.match(r"^\s*(\d+)\s*-\s*(\d+)\s*$", str(pr))
        if not m:
            abort(400, "pages: e.g. 1-20")
        page_range = (int(m.group(1)), int(m.group(2)))
    key = pid + ":extract"
    with LOCK:
        if (key in JOBS and JOBS[key].is_alive()) or (pid in JOBS and JOBS[pid].is_alive()):
            abort(409, "a reading or a run is already in progress")
        rid = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        th = threading.Thread(target=_extract_job, args=(pid, p, rid, page_range), daemon=True)
        JOBS[key] = th; th.start()
    return jsonify({"id": rid})


@app.get("/api/projects/<pid>/extract/latest")
def api_extract_latest(pid):
    project(pid)
    fs = sorted(glob.glob(os.path.join(DATA, pid, "extract", "*", "status.json")))
    if not fs:
        return jsonify(None)
    st = json.load(open(fs[-1]))
    rep = os.path.join(os.path.dirname(fs[-1]), "EXTRACTION.md")
    st["report"] = open(rep).read()[:200000] if os.path.exists(rep) else None
    st["log"] = st.get("log", [])[-400:]
    return jsonify(st)


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


# ---------------- decisions and engineer input (P7.3) ----------------
# Both go through the existing schema tools (subprocess), which keep history, check the rules and refuse AI approval.
EDIT_TAGS = ("Direct", "Input-user", "Confirmed-Engineer")      # tags a person can enter here without a derivation / replace_with


def _tool(argv):
    r = subprocess.run([PY] + argv, cwd=ROOT, capture_output=True, text=True)
    if r.returncode:
        abort(400, (r.stderr or r.stdout).strip()[-1500:] or "refused")
    return r.stdout.strip()


def _person(by):
    by = (by or "").strip()
    if len(by) < 2:
        abort(400, "enter your name: decisions are recorded against a person")
    return by


@app.get("/api/projects/<pid>/decisions")
def api_decisions(pid):
    p = project(pid)
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from decision_review import review
    doc, items = review(p["description"])
    return jsonify({"revision": (doc.get("revision") or {}).get("number"), "items": items})


@app.post("/api/projects/<pid>/decisions/<did>")
def api_decide(pid, did):
    p = project(pid)
    if not re.match(r"^D-\d+$", did):
        abort(400, "bad decision id")
    b = request.get_json(force=True) or {}
    by, accept, note = _person(b.get("by")), bool(b.get("accept")), (b.get("note") or "").strip()
    if not accept and not note:
        abort(400, "say why the decision is rejected")
    argv = ["schema/accept_decision.py", p["description"], "--decision", did, "--by", by] + ([] if accept else ["--reject"]) + (["--note", note] if note else [])
    return jsonify({"message": _tool(argv)})


@app.post("/api/projects/<pid>/values")
def api_enter_value(pid):
    """A person enters a value: proposed under a new decision, then accepted by the same person (two revisions)."""
    p = project(pid)
    b = request.get_json(force=True) or {}
    by, path, tag, reason = _person(b.get("by")), b.get("path") or "", b.get("tag"), (b.get("reason") or "").strip()
    if tag not in EDIT_TAGS:
        abort(400, f"tag must be one of {', '.join(EDIT_TAGS)}")
    if not reason:
        abort(400, "give the reason / where the value comes from")
    if path not in dict(records(load_doc(p))):
        abort(400, f"no value at {path}")
    src = {k: v for k, v in (("doc", b.get("sheet")), ("view", b.get("view")), ("note", reason)) if v}
    if tag == "Direct" and not b.get("sheet"):
        abort(400, "a Direct value needs the drawing / sheet it is printed on")
    logf = p["description"].replace(".bridge.0.2.json", ".decisions.jsonl")
    ids = [int(json.loads(l)["id"][2:]) for l in open(logf) if l.strip()] if os.path.exists(logf) else []
    did = f"D-{max(ids, default=0) + 1}"
    argv = ["schema/propose_override.py", p["description"], "--path", path, "--value", json.dumps(b.get("value")), "--tag", tag,
            "--reason", reason, "--author", by, "--decision", did, "--source", json.dumps(src)]
    if b.get("unit"):
        argv += ["--unit", b["unit"]]
    m1 = _tool(argv)
    m2 = _tool(["schema/accept_decision.py", p["description"], "--decision", did, "--by", by, "--note", "entered in the app"])
    return jsonify({"decision": did, "message": m1 + "\n" + m2})


@app.post("/api/projects/<pid>/values/batch")
def api_enter_batch(pid):
    """An engineer edits several values at once (e.g. a girder's strands, bars and fitments): one decision, proposed
    and accepted by that person, one new revision. New table rows are added as empty records first (records are never
    removed: switch a strand off with on = false). Tag Input-user; nothing is computed here."""
    from propose_override import propose
    from rules_0_2 import check, check_revision
    from c14n import stamp
    p = project(pid)
    b = request.get_json(force=True) or {}
    by, reason = _person(b.get("by")), (b.get("reason") or "").strip()
    if not reason:
        abort(400, "give the reason for the change (e.g. design option 2: 44 strands)")
    items, new_rows = b.get("items") or [], b.get("new_rows") or []
    if not items and not new_rows:
        abort(400, "nothing changed")
    if len(items) + len(new_rows) > 500:
        abort(400, "too many changes in one save")
    prev = load_doc(p)
    doc = json.loads(json.dumps(prev))
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    R = dict(records(doc))
    for nr in new_rows:                                  # append an empty row record to the table, then propose its cells
        t, cells = str(nr.get("table") or ""), nr.get("cells")
        if not isinstance(cells, dict) or not cells:
            abort(400, "a new row needs its cells")
        node = doc
        for name, idx in re.findall(r"([^.\[\]]+)(?:\[([^\]]+)\])?", t):
            node = node.get(name) if isinstance(node, dict) else None
            if idx is not None and isinstance(node, list):
                node = next((x for x in node if isinstance(x, dict) and x.get("id") == idx), None)
            if node is None:
                abort(400, f"no table at {t}")
        if not isinstance(node, dict) or not isinstance(node.get("rows"), list):
            abort(400, f"{t} is not a table")
        rec = {"cells": {}, "note": "row added in the app", "tag": "Missing-Flagged", "status": "open",
               "original": {"cells": {}, "unit": None, "tag": "Missing-Flagged", "recorded_by": by, "recorded_at": now, "note": "row added in the app"}, "current": "original"}
        node["rows"].append(rec)
        items.append({"path": f"{t}.rows[{len(node['rows']) - 1}]", "value": cells})
    stamp(doc)
    R = dict(records(doc))
    logf = p["description"].replace(".bridge.0.2.json", ".decisions.jsonl")
    dec = {json.loads(l)["id"]: json.loads(l) for l in open(logf) if l.strip()} if os.path.exists(logf) else {}
    did = f"D-{max([int(k[2:]) for k in dec], default=0) + 1}"
    n = 0
    for it in items:
        path = str(it.get("path") or "")
        if path not in R:
            abort(400, f"no value at {path}")
        doc, _ = propose(doc, path, it.get("value"), "Input-user", reason, [f"entered in the app by {by}"], by, did, {"note": reason}, it.get("unit"), now)
        R = dict(records(doc)); n += 1
    first = prev["revision"]["number"]
    doc["revision"] = {"number": first + 1, "parent_hash": prev["hash"]["value"], "created": now, "author": by,
                       "note": f"{n} values entered in the app under {did}: {reason}"[:300], "decision_log_sha256": None}
    stamp(doc)
    entry = {"id": did, "date": now, "by": by, "key": f"({n} values entered in the app)", "from": None, "from_tag": None, "to": None, "to_tag": "Input-user",
             "reason": reason, "evidence": [f"entered in the app by {by}"], "status": "proposed", "affects": ["design.supert"]}
    errs = check(doc, dict(dec, **{did: entry})) + check_revision(prev, doc)
    if errs:
        abort(400, "refused by the format rules: " + "; ".join(errs[:8]))
    hist = os.path.join(os.path.dirname(p["description"]), "history"); os.makedirs(hist, exist_ok=True)
    keep = os.path.join(hist, os.path.basename(p["description"]).replace(".json", f".r{first}.json"))
    if not os.path.exists(keep):
        shutil.copy(p["description"], keep)
    json.dump(doc, open(p["description"], "w"), indent=1, ensure_ascii=False)
    open(logf, "a").write(json.dumps(entry, ensure_ascii=False) + "\n")
    m2 = _tool(["schema/accept_decision.py", p["description"], "--decision", did, "--by", by, "--note", "entered in the app"])
    return jsonify({"decision": did, "changed": n, "message": m2})


# ---------------- chain runs ----------------
def _run_chain(pid, desc, allow, rid):
    d = pdir(pid, "runs", rid)
    st = {"id": rid, "state": "running", "pid": os.getpid(), "allow_proposed": allow, "started": _now(), "finished": None, "description": os.path.relpath(desc, ROOT),
          "engine_commit": _git("rev-parse", "--short", "HEAD"), "revision": (json.load(open(desc)).get("revision") or {}).get("number"), "steps": [{"key": k, "title": t, "state": "waiting"} for k, t, _, _ in STEPS]}
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
    if name not in ("model_view.json", "combined_actions.json", "girder_checks.json", "geometry.json", "sections.json"):
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


# ---------------- revision history (P7.8) ----------------
def _revisions(p):
    d = os.path.dirname(p["description"]); base = os.path.basename(p["description"]).replace(".json", "")
    revs = {}
    for f in glob.glob(os.path.join(d, "history", base + ".r*.json")):
        m = re.search(r"\.r(\d+)\.json$", f)
        if m:
            revs[int(m.group(1))] = f
    cur = load_doc(p)["revision"]["number"]
    revs[cur] = p["description"]
    return revs


@app.get("/api/projects/<pid>/revisions")
def api_revisions(pid):
    p = project(pid)
    out = []
    for n, f in sorted(_revisions(p).items(), reverse=True):
        r = json.load(open(f)).get("revision") or {}
        out.append({"number": n, "created": r.get("created"), "author": r.get("author"), "note": r.get("note"), "current": f == p["description"]})
    return jsonify(out)


@app.get("/api/projects/<pid>/revisions/<int:a>/<int:b>")
def api_rev_diff(pid, a, b):
    """Values whose current value, tag or status differ between two revisions (as stored, not with proposals)."""
    revs = _revisions(project(pid))
    if a not in revs or b not in revs:
        abort(404, "revision not kept")
    A, B = (dict(records(json.load(open(revs[x])))) for x in (a, b))
    cur = lambda r: (r.get("cells") if "value" not in r else r.get("value"), r.get("tag"), r.get("status"), len(r.get("overrides") or []))
    rows = []
    for path in sorted(set(A) | set(B)):
        ra, rb = A.get(path), B.get(path)
        if ra is None or rb is None or cur(ra) != cur(rb):
            ca_, cb_ = (cur(x) if x else (None, None, None, 0) for x in (ra, rb))
            rows.append({"path": path, "from": ca_[0], "from_tag": ca_[1], "from_status": ca_[2], "to": cb_[0], "to_tag": cb_[1], "to_status": cb_[2],
                         "proposals_added": cb_[3] - ca_[3], "decision": (rb or {}).get("decision")})
    return jsonify({"a": a, "b": b, "rows": rows})


# ---------------- verification (P7.7) ----------------
PILE_DA = re.compile(r"^supports\[([^\]]+)\]\.piles\[([^\]]+)\]\.design_actions\.rows\[\d+\]$")


@app.get("/api/projects/<pid>/verification")
def api_verification(pid):
    """Printed values on the drawings (description, tag Direct) against the latest results, plus recorded MIDAS runs.
    Differences only; acceptance is the engineer's (no pass criterion is invented here)."""
    p = project(pid); doc = load_doc(p)
    f, meta = _result_file(pid, "combined_actions.json")
    ca = json.load(open(f)) if f else None
    rows = []
    for path, r in records(doc):
        m = PILE_DA.match(path)
        if not m or r.get("tag") not in ("Direct", "Calculated", "Confirmed-Engineer"):
            continue
        c = r.get("cells") or {}; pile = m.group(2); ls = c.get("limit_state")
        sch = ((ca or {}).get("schedule") or {}).get("piles", {}).get(pile, {}).get(ls) if ca else None
        src = r.get("source") or {}
        for q, ref, plat in (("N max", c.get("N"), sch and sch["N"]["max"]),
                             ("M", c.get("M"), ls == "ULS" and ca and (ca.get("pile_resultants") or {}).get(pile, {}).get("resultant_upper"))):
            if ref is not None:
                rows.append({"item": f"Pile {pile} {ls} {q}", "reference": ref, "platform": plat, "unit": "kN" if q.startswith("N") else "kN·m",
                             "source": f"{src.get('doc', '')} {src.get('view', '')}".strip(), "note": src.get("text"), "path": path})
    # one printed value shared by several piles from the same table is an envelope: compare with the platform maximum
    groups = {}
    for r in rows:
        groups.setdefault((r["item"].split(" ", 2)[2], r["reference"], r["source"]), []).append(r)
    env = []
    for (q, ref, src), g in groups.items():
        if len(g) == 1:
            env.append(g[0]); continue
        vals = [x["platform"] for x in g if x["platform"] is not None]
        top = max(g, key=lambda x: x["platform"] or float("-inf"))
        env.append({**g[0], "item": f"{len(g)} piles, envelope: {q}", "platform": max(vals) if vals else None, "governing": top["item"].split(" ")[1],
                    "piles": [{"pile": x["item"].split(" ")[1], "platform": x["platform"]} for x in g]})
    rows = env
    runs = []
    for fm in sorted(glob.glob(os.path.join(os.path.dirname(p["description"]), "model", "midas_run_*", "COMPARISON.md"))):
        txt = open(fm).read()
        runs.append({"run": os.path.basename(os.path.dirname(fm)), "title": txt.splitlines()[0].lstrip("# ").strip(), "text": txt[:6000]})
    return jsonify({"meta": meta, "printed": rows, "midas_runs": runs})


@app.get("/api/projects/<pid>/report")
def api_report(pid):
    project(pid)
    st = latest_run(pid)
    f = st and os.path.join(DATA, pid, "runs", st["id"], "report.html")
    if not f or not os.path.exists(f):
        abort(404, "no report yet: run the chain")
    return send_file(f, mimetype="text/html")


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
