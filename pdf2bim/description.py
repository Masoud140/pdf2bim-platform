"""Read effective values from a bridge description (format 0.1 / 0.2), with provisional-use tracking.

Effective value of a record:
- normally its current value (0.2) / its value (0.1);
- with allow_proposed=True: the latest PROPOSED override if there is one, and a record whose own status is
  'proposed' is usable; every such use is listed in `provisional`;
- with allow_proposed=False: a record whose status is 'proposed' counts as missing;
- a record whose status is 'rejected' always counts as missing.
Missing values raise MissingInput naming the path. Nothing is defaulted.
"""


class MissingInput(ValueError):
    pass


class Reader:
    def __init__(self, doc, allow_proposed=False):
        self.doc, self.allow, self.provisional = doc, allow_proposed, []

    def rec(self, rec, path):
        if rec is None:
            raise MissingInput(f"{path}: missing")
        if rec.get("status") == "rejected":
            raise MissingInput(f"{path}: rejected by the engineer")
        if rec.get("status") == "proposed" and not rec.get("overrides"):
            if not self.allow:
                raise MissingInput(f"{path}: only proposed (not accepted); run with allow_proposed to use it provisionally")
            self.provisional.append({"path": path, "override": None, "decision": rec.get("decision"), "author": (rec.get("original") or {}).get("recorded_by"),
                                     "value": rec.get("cells", rec.get("value")), "reason": "record proposed"})
        if self.allow:
            prop = [o for o in rec.get("overrides", []) if o["approval"]["status"] == "proposed"]
            if prop:
                o = prop[-1]
                self.provisional.append({"path": path, "override": o["id"], "decision": o.get("decision"), "author": o.get("author"),
                                         "value": o["value"], "reason": o.get("reason", "")[:200]})
                return o["value"], o.get("tag")
        if "cells" in rec and "value" not in rec:
            return rec["cells"], rec.get("tag")
        return rec.get("value"), rec.get("tag")

    def value(self, rec, path, required=True):
        if rec is None:
            if required:
                raise MissingInput(f"{path}: missing")
            return None
        v, _ = self.rec(rec, path)
        if v is None and required:
            raise MissingInput(f"{path}: value missing (tag {rec.get('tag')})")
        return v

    def rows(self, table, path, required=True):
        if not table or "rows" not in table:
            if required:
                raise MissingInput(f"{path}: table missing")
            return []
        out = []
        for i, r in enumerate(table["rows"]):
            try:
                out.append(self.rec(r, f"{path}.rows[{i}]")[0])
            except MissingInput:
                if required:
                    raise
        return out
