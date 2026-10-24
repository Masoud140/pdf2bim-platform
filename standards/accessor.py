"""Standards-data accessor (docs/STANDARDS_DATA_SPEC.md).

    from standards.accessor import Standards
    S = Standards()                         # loads standards/data/*.json and validates them
    v = S.get("AS5100.2:load_factor:DLc")   # -> Value(value, status, id); records the use
    S.result_status()                       # 'UNVERIFIED — standards data not approved' unless every used entry is approved

Rules enforced on load (validate()):
- status 'checked' or 'approved' needs review.reviewer, review.date, review.method and reference.authorised_source;
- status 'approved' also needs edition and amendment (the edition the value was checked against);
- 'approved' cannot be set by 'AI' / 'Claude' (ADR-005, ADR-009);
- ids are unique.
The accessor never upgrades a status. Engine code must read standards values only through get().
"""
import glob, json, os
from collections import namedtuple

HERE = os.path.dirname(os.path.abspath(__file__))
STATUS_ORDER = ["placeholder-unverified", "code-extracted-unverified", "transcribed-unverified", "checked", "approved"]
UNVERIFIED = "UNVERIFIED — standards data not approved"
AGENTS = {"ai", "claude", "agent"}
Value = namedtuple("Value", "value status id units")


class StandardsError(ValueError):
    pass


def validate_entry(e):
    errs = []
    st = e.get("status")
    if st not in STATUS_ORDER:
        errs.append(f"{e.get('id')}: unknown status {st!r}")
        return errs
    rv, ref = e.get("review") or {}, e.get("reference") or {}
    if STATUS_ORDER.index(st) >= STATUS_ORDER.index("checked"):
        for k in ("reviewer", "date", "method"):
            if not rv.get(k):
                errs.append(f"{e['id']}: status {st} needs review.{k}")
        if not ref.get("authorised_source"):
            errs.append(f"{e['id']}: status {st} needs reference.authorised_source (the authorised copy checked against)")
        if (rv.get("reviewer") or "").strip().lower() in AGENTS:
            errs.append(f"{e['id']}: status {st} cannot be set by an AI agent")
    if st == "transcribed-unverified" and not (ref.get("authorised_source") or ref.get("clause") or ref.get("table")):
        errs.append(f"{e['id']}: transcribed-unverified needs a clause/table or authorised source reference")
    if st == "approved":
        if not e.get("edition"):
            errs.append(f"{e['id']}: approved needs the edition")
        if e.get("amendment") is None:
            errs.append(f"{e['id']}: approved needs the amendment ('none' if none)")
    return errs


class Standards:
    def __init__(self, folder=None, entries=None):
        self.entries = {}
        self.used = {}
        src = entries if entries is not None else [x for f in sorted(glob.glob(os.path.join(folder or os.path.join(HERE, "data"), "AS*.json"))) for x in json.load(open(f))["entries"]]
        errs = []
        for e in src:
            if e["id"] in self.entries:
                errs.append(f"{e['id']}: duplicate id")
            self.entries[e["id"]] = e
            errs += validate_entry(e)
        if errs:
            raise StandardsError("; ".join(errs))

    def get(self, id_):
        if id_ not in self.entries:
            raise KeyError(f"standards entry {id_!r} not found — add it to standards/data with its source; do not hard-code")
        e = self.entries[id_]
        self.used[id_] = e["status"]
        return Value(e["value"], e["status"], id_, e.get("units"))

    def result_status(self):
        """Status label every result that used get() must carry."""
        if not self.used:
            return "no standards data used"
        return "approved standards data" if all(s == "approved" for s in self.used.values()) else UNVERIFIED

    def usage(self):
        """[(id, status)] of every entry used, for the run record."""
        return sorted(self.used.items())

    def review_register(self):
        """Entries that still need review: status below approved, or flagged for specialist review."""
        rows = []
        for e in sorted(self.entries.values(), key=lambda x: x["id"]):
            sp = (e.get("interpretation") or {}).get("specialist_review")
            if e["status"] != "approved" or sp:
                rows.append({"id": e["id"], "standard": e["standard"], "clause": (e.get("reference") or {}).get("clause"), "status": e["status"],
                             "specialist": bool(sp), "edition": e.get("edition"), "used_by": e["implementation"]["used_by"][0],
                             "note": (e.get("interpretation") or {}).get("note", "")})
        return rows
