"""Run records and stale marking (P5.1, ARCHITECTURE §2 "Run record").

    from pdf2bim.runrecord import make, status
    rec = make(desc_path, doc, tool="girder_checks", layers=LAYERS["girder_checks"], allow_proposed=True, options={...})
    json.dump({"run_record": rec, ...}, ...)          # every tool output carries it
    status(rec, desc_path)                             # current / stale / engine-changed, with the reasons

A record holds: the description path, revision number and content hash; the decisions in the log at run time (and
which proposed ones were used); the engine commit and whether the working tree had uncommitted changes; the content
hashes of the standards data and the product library; the tool, its layers (decision `affects` values it depends on)
and options; the time.

Stale rule: the record is **current** when the description hash and the standards / library hashes are unchanged. When
the description changed, every revision since the recorded one is looked up in `history/` (and the current file): if
each one is explained by a decision whose `affects` does not meet the record's layers, the record stays current
(changes outside its layers); anything else — an unexplained revision, a decision affecting its layers, a missing
history file — makes it **stale**. A changed engine commit is reported separately ("engine changed": re-run to confirm).
"""
import datetime, glob, hashlib, json, os, re, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ALL = ["extraction", "geometry", "model", "analysis.static", "analysis.modal", "traffic", "loads", "combinations", "design.supert", "design.plank", "substructure", "reports"]
LAYERS = {
    "geometry": ["extraction", "geometry"],
    "sections": ["extraction", "geometry", "model", "design.supert"],
    "export_mct": ["extraction", "geometry", "model", "substructure", "design.supert"],
    "combined_actions": ["extraction", "geometry", "model", "substructure", "analysis.static", "analysis.modal", "traffic", "loads", "combinations", "design.supert"],
    "concurrent_traffic": ["extraction", "geometry", "model", "substructure", "analysis.static", "traffic", "loads", "design.supert"],
    "girder_flexure": ALL[:-2] + ["design.supert"],
    "girder_checks": ALL[:-2] + ["design.supert"],
    "midas_compare": ["extraction", "geometry", "model", "substructure", "analysis.static", "analysis.modal", "design.supert"],
}


def _sha_files(paths):
    h = hashlib.sha256()
    for p in sorted(paths):
        h.update(os.path.relpath(p, ROOT).encode()); h.update(open(p, "rb").read())
    return "sha256:" + h.hexdigest()


def standards_hash():
    return _sha_files(glob.glob(os.path.join(ROOT, "standards", "data", "*.json")))


def library_hash():
    return _sha_files([p for p in glob.glob(os.path.join(ROOT, "library", "products", "**", "*"), recursive=True) if os.path.isfile(p)])


def _git(*a):
    try:
        return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return None


def decision_log(desc_path):
    f = desc_path.replace(".bridge.0.2.json", ".decisions.jsonl")
    if not os.path.exists(f):
        return {}
    return {d["id"]: d for d in (json.loads(l) for l in open(f) if l.strip())}


def make(desc_path, doc, tool, layers=None, allow_proposed=False, options=None):
    from schema.c14n import content_hash
    dec = decision_log(desc_path)
    return {"format": "pdf2bim.run/1", "tool": tool, "layers": layers if layers is not None else LAYERS.get(tool, ALL),
            "description": os.path.relpath(os.path.abspath(desc_path), ROOT), "revision": (doc.get("revision") or {}).get("number"),
            "description_hash": content_hash(doc), "decisions": sorted(dec, key=lambda s: int(s.split("-")[1])),
            "proposed_used": sorted([k for k, d in dec.items() if d.get("status") == "proposed"], key=lambda s: int(s.split("-")[1])) if allow_proposed else [],
            "allow_proposed": allow_proposed, "engine_commit": _git("rev-parse", "HEAD"), "engine_dirty": bool(_git("status", "--porcelain", "--", "pdf2bim", "standards", "library", "schema", "tools")),
            "standards_hash": standards_hash(), "library_hash": library_hash(), "options": options or {},
            "run_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")}


def _revision_files(desc_path):
    """{revision number: path} of the history copies and the current file."""
    base = os.path.basename(desc_path).replace(".json", "")
    out = {}
    for p in glob.glob(os.path.join(os.path.dirname(os.path.abspath(desc_path)), "history", base + ".r*.json")):
        m = re.search(r"\.r(\d+)\.json$", p)
        if m:
            out[int(m.group(1))] = p
    return out


def status(rec, desc_path=None, doc=None):
    """{"state": current | stale | unknown, "engine_changed": bool, "reasons": [...], "decisions_since": [...]}"""
    from schema.c14n import content_hash
    if not rec or rec.get("format") != "pdf2bim.run/1":
        return {"state": "unknown", "engine_changed": None, "reasons": ["no run record"], "decisions_since": []}
    desc_path = desc_path or os.path.join(ROOT, rec["description"])
    doc = doc or json.load(open(desc_path))
    reasons, since = [], []
    state = "current"
    if content_hash(doc) != rec["description_hash"]:
        dec = decision_log(desc_path)
        files = _revision_files(desc_path)
        r0, r1 = rec.get("revision"), (doc.get("revision") or {}).get("number")
        layers = set(rec.get("layers") or ALL)
        if r0 is None or r1 is None or r1 <= r0:
            state = "stale"; reasons.append(f"description changed without a later revision number (recorded r{r0}, now r{r1})")
        else:
            for n in range(r0 + 1, r1 + 1):
                d = doc if n == r1 else (json.load(open(files[n])) if n in files else None)
                if d is None:
                    state = "stale"; reasons.append(f"revision r{n}: no history copy, change unknown"); continue
                note = (d.get("revision") or {}).get("note") or ""
                ids = re.findall(r"\bD-\d+\b", note)
                if not ids:
                    state = "stale"; reasons.append(f"revision r{n}: not explained by a decision ({note!r})"); continue
                for i in ids:
                    q = dec.get(i)
                    aff = set((q or {}).get("affects") or ALL)
                    since.append({"revision": n, "decision": i, "status": (q or {}).get("status"), "affects": sorted(aff)})
                    if aff & layers:
                        state = "stale"; reasons.append(f"r{n} {i} affects {sorted(aff & layers)}")
            if state == "current":
                reasons.append("description changed outside this output's layers only")
    if rec.get("standards_hash") != standards_hash():
        state = "stale"; reasons.append("standards data changed")
    if rec.get("library_hash") != library_hash():
        state = "stale"; reasons.append("product library changed")
    head = _git("rev-parse", "HEAD")
    return {"state": state, "engine_changed": bool(head and rec.get("engine_commit") and head != rec["engine_commit"]) or bool(rec.get("engine_dirty")),
            "reasons": reasons, "decisions_since": since}
