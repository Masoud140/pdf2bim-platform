"""Test fixture: the example project as it stood at revision 14, before the owner accepted D-34 ... D-43 (2026-10-26,
ADR-040). Writes into a directory: the r14 description as the current file, the history copies before r14, and the
decision log up to D-43 with D-34 ... D-43 back at status "proposed" (approval fields removed). Used by the tests of
the proposal / review tools, which need decisions still waiting for the engineer."""
import json, os, re, shutil

R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(R, "projects/BR13A")
REV = 14
REOPEN = {f"D-{n}" for n in range(34, 44)}


def make(d):
    os.makedirs(os.path.join(d, "history"), exist_ok=True)
    shutil.copy(os.path.join(SRC, "history", f"BR13A.bridge.0.2.r{REV}.json"), os.path.join(d, "BR13A.bridge.0.2.json"))
    for f in os.listdir(os.path.join(SRC, "history")):
        m = re.search(r"\.r(\d+)\.json$", f)
        if m and int(m.group(1)) < REV:
            shutil.copy(os.path.join(SRC, "history", f), os.path.join(d, "history", f))
    out = []
    for line in open(os.path.join(SRC, "BR13A.decisions.jsonl")):
        if not line.strip():
            continue
        e = json.loads(line)
        if int(e["id"].split("-")[1]) > 43:
            continue
        if e["id"] in REOPEN:
            e["status"] = "proposed"
            for k in ("approved_by", "approved_at", "decision_note", "note_approval"):
                e.pop(k, None)
        out.append(json.dumps(e, ensure_ascii=False))
    open(os.path.join(d, "BR13A.decisions.jsonl"), "w").write("\n".join(out) + "\n")
    return os.path.join(d, "BR13A.bridge.0.2.json")
