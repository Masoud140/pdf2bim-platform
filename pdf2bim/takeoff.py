"""Takeoff importer: extracted values (PDF -> workbook) -> proposals on the bridge description (P5.3).

    from pdf2bim.takeoff import read_values, plan_import, write_values
    rows = read_values("BR_GA_Extraction.xlsx")        # sheet "Values" (interchange format below)
    P = plan_import(doc, rows)                         # same / overrides / queries / refused / new_paths
    write_values(doc, "out.xlsx")                      # the description's Direct / Calculated values in the same format

Interchange sheet "Values" (one row per value; the extractor's tabs map onto it through their field paths):
    Path | Value | Unit | Data Source | Source ref | Notes
- Path: the description path (schema.rules_0_2.records syntax, e.g. "alignment.support_lines.rows[0]"); a table row's
  Value is a JSON object of its cells;
- Data Source: Direct, Calculated or Missing — Flagged (DATA_SOURCE_CATEGORIZATION_STANDARD; "NOT FOUND", "DIRECT",
  "CALCULATED", "Missing - Flagged" accepted);
- Source ref: drawing / sheet / view / callout — required for Direct and Calculated;
- Notes: the derivation, required for Calculated.

Rules (no value is ever overwritten by an import):
- equal value and tag -> "same" (confirmed by the extraction);
- equal value, different tag (e.g. an Assumed value now found on the drawing) -> an override proposal with the new tag
  and source;
- different value: when the current value is Direct or Confirmed-Engineer -> a QUERY (conflict for the engineer, no
  proposal); otherwise -> an override proposal;
- Missing — Flagged with a value, Direct / Calculated without a source ref, Calculated without a derivation, an
  unknown Data Source -> refused;
- Missing — Flagged where the description holds a Direct value -> a query (the extraction did not find it);
- a unit different from the description's -> refused (convert in the workbook; no silent conversion);
- a path the description does not have -> "new_paths" (needs a catalogue field or custom item: for the engineer).
"""
import json, math

TAGS = {"direct": "Direct", "calculated": "Calculated", "missing — flagged": "Missing-Flagged", "missing - flagged": "Missing-Flagged",
        "missing-flagged": "Missing-Flagged", "not found": "Missing-Flagged", "missing": "Missing-Flagged"}
HEAD = ["Path", "Value", "Unit", "Data Source", "Source ref", "Notes"]
PROTECTED = ("Direct", "Confirmed-Engineer")


def _cur(rec):
    return rec["cells"] if "cells" in rec and "value" not in rec else rec.get("value")


def _parse(v):
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip()
    try:
        return json.loads(s)
    except Exception:
        return s


def _equal(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool):
        return math.isclose(float(a), float(b), rel_tol=1e-9, abs_tol=1e-12)
    if isinstance(a, dict) and isinstance(b, dict):
        return set(a) == set(b) and all(_equal(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_equal(x, y) for x, y in zip(a, b))
    return a == b


def read_values(path, sheet="Values"):
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    if sheet not in wb.sheetnames:
        raise ValueError(f"{path}: no sheet {sheet!r} (sheets: {wb.sheetnames})")
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(h).strip() if h is not None else "" for h in rows[0]]
    miss = [h for h in HEAD if h not in hdr]
    if miss:
        raise ValueError(f"{path}/{sheet}: columns {miss} missing (found {hdr})")
    ix = {h: hdr.index(h) for h in HEAD}
    out = []
    for n, r in enumerate(rows[1:], start=2):
        if not any(c is not None and str(c).strip() for c in r):
            continue
        g = lambda h: r[ix[h]] if ix[h] < len(r) else None
        out.append({"row": n, "path": str(g("Path") or "").strip(), "value": _parse(g("Value")), "unit": g("Unit"), "source_type": g("Data Source"),
                    "source_ref": g("Source ref"), "notes": g("Notes")})
    return out


def plan_import(doc, rows):
    from schema.rules_0_2 import records
    R = dict(records(doc))
    P = {"same": [], "overrides": [], "queries": [], "refused": [], "new_paths": []}
    for r in rows:
        st = TAGS.get(str(r.get("source_type") or "").strip().lower())
        ref, notes, v = (r.get("source_ref") or ""), (r.get("notes") or ""), r.get("value")
        why = None
        if st is None:
            why = f"unknown Data Source {r.get('source_type')!r}"
        elif st == "Missing-Flagged" and v is not None:
            why = "Missing — Flagged with a value"
        elif st in ("Direct", "Calculated") and not str(ref).strip():
            why = f"{st} value without a source ref"
        elif st == "Calculated" and not str(notes).strip():
            why = "Calculated value without its derivation in Notes"
        elif not r.get("path"):
            why = "no path"
        if why:
            P["refused"].append(dict(r, why=why)); continue
        rec = R.get(r["path"])
        if rec is None:
            P["new_paths"].append(r); continue
        cur, tag = _cur(rec), rec.get("tag")
        if r.get("unit") and rec.get("unit") and str(r["unit"]).strip() != str(rec["unit"]).strip():
            P["refused"].append(dict(r, why=f"unit {r['unit']!r} differs from the description's {rec['unit']!r}: convert in the workbook")); continue
        if st == "Missing-Flagged":
            if tag in PROTECTED and cur is not None:
                P["queries"].append(dict(r, why=f"extraction did not find the value the description holds as {tag}", current=cur, current_tag=tag))
            else:
                P["same"].append(dict(r, current_tag=tag))
            continue
        src = {"doc": str(ref)} if not notes else {"doc": str(ref), "note": str(notes)}
        if _equal(cur, v):
            if tag == st:
                P["same"].append(dict(r, current_tag=tag))
            elif tag in PROTECTED:
                P["same"].append(dict(r, current_tag=tag, note=f"extraction tag {st}, description keeps {tag}"))
            else:
                P["overrides"].append({"path": r["path"], "value": v, "unit": r.get("unit") or rec.get("unit"), "tag": st, "source": src, "from_tag": tag, "row": r["row"], "kind": "tag upgrade"})
        elif tag in PROTECTED:
            P["queries"].append(dict(r, why=f"conflict with the description's {tag} value", current=cur, current_tag=tag))
        else:
            P["overrides"].append({"path": r["path"], "value": v, "unit": r.get("unit") or rec.get("unit"), "tag": st, "source": src, "from_tag": tag, "row": r["row"], "kind": "value"})
    P["counts"] = {k: len(v) for k, v in P.items() if isinstance(v, list)}
    return P


def write_values(doc, path, tags=("Direct", "Calculated")):
    """The description's values with the given tags in the interchange format (a round-trip / review aid)."""
    import openpyxl
    from schema.rules_0_2 import records
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Values"; ws.append(HEAD)
    for p, rec in records(doc):
        if rec.get("tag") not in tags:
            continue
        src = rec.get("source") or {}
        ref = src.get("doc") or src.get("note") if isinstance(src, dict) else str(src)
        note = rec.get("note") or (src.get("note") if isinstance(src, dict) else None)
        if rec["tag"] == "Calculated" and not note:
            note = "derivation as recorded in the description"
        v = _cur(rec)
        ws.append([p, json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list, str)) or v is None else v, rec.get("unit"),
                   {"Direct": "Direct", "Calculated": "Calculated"}[rec["tag"]], ref or "description", note])
    wb.save(path)
