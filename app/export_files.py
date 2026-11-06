#!/usr/bin/env python3
"""Excel workbook and Word report for one chain run (the BR13A dashboard exports, for any bridge).

    python3 app/export_files.py DESCRIPTION.json RUN_DIR [--allow-proposed]   -> RUN_DIR/workbook.xlsx, RUN_DIR/report.docx

Built only from the description and the run's own outputs: no engineering value is computed here. Every bridge-data
row keeps its tag (Direct / Calculated / ... / Missing-Flagged); every Missing-Flagged row is also in "Needs Review"."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "schema")); sys.path.insert(0, HERE)
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from rules_0_2 import records
from report import load, fv, TAGS
from server import effective

FILL = {"Direct": "C6EFCE", "Calculated": "DDEBF7", "Missing-Flagged": "FFC7CE", "Assumed": "FFEB9C", "Model": "EDEDED"}


def cell_text(v):
    return json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else fv(v)


def values_rows(doc, allow):
    out = []
    for p, r in records(doc):
        v, tag, ov = effective(r, allow)
        src = r.get("source") or {}
        out.append([p, cell_text(v), r.get("unit") or "", tag or "", "proposed" if ov else r.get("status", ""),
                    " ".join(str(src.get(k, "")) for k in ("doc", "view") if src.get(k)), r.get("note") or ""])
    return out


def girder_rows(gc):
    """(girder, max ULS bending u, max SLS u, max shear u, hog at the last reported time, max mm) per girder."""
    out = []
    for g, R in sorted((k, v) for k, v in (gc or {}).items() if isinstance(v, dict) and "rows" in v):
        mx = lambda *f: max((x for r in R["rows"] for fn in f for x in [fn(r)] if isinstance(x, (int, float))), default=None)
        flex = [r for r in R["rows"] if r.get("conf") != "solid"]          # as the app summary: solid ends are shear only
        mxf = lambda k: max((x for r in flex for x in ((r.get("sag") or {}).get(k), (r.get("hog") or {}).get(k)) if isinstance(x, (int, float))), default=None)
        hg = R.get("hog") or {}
        last = (hg.get("times") or [{}])[-1]
        out.append([g, mxf("uB"), mxf("uS"), mx(lambda r: (r.get("shear") or {}).get("u")), last.get("label"),
                    max(last.get("hog_mm") or [None], key=lambda x: x or 0)])
    return out


def schedule_rows(ca):
    S = (ca or {}).get("schedule") or {}
    b = [[k, v["ULS"]["v"]["max"], v["ULS"]["v"]["min"], v["SLS"]["v"]["max"], v["SLS"]["v"]["min"], v["ULS"]["tr"]["max"], v["ULS"]["tr"]["min"],
          v["ULS"]["lon"]["max"], v["ULS"]["lon"]["min"], v["ULS"]["v"]["gmax"]] for k, v in (S.get("bearings") or {}).items()]
    pr = (ca or {}).get("pile_resultants") or {}
    p = [[k, v["ULS"]["N"]["max"], v["ULS"]["N"]["min"], v["SLS"]["N"]["max"], v["SLS"]["N"]["min"], v["ULS"]["Ml"]["abs"], v["ULS"]["Mt"]["abs"],
          (pr.get(k) or {}).get("resultant_upper"), v["SLS"]["Ml"]["abs"], v["SLS"]["Mt"]["abs"], v["ULS"]["N"]["gmax"]] for k, v in (S.get("piles") or {}).items()]
    return b, p


BH = ["Bearing", "ULS V max kN", "ULS V min kN", "SLS V max kN", "SLS V min kN", "ULS H trans max kN", "ULS H trans min kN", "ULS H long max kN", "ULS H long min kN", "Governing ULS V max"]
PH = ["Pile", "ULS N max kN", "ULS N min kN", "SLS N max kN", "SLS N min kN", "ULS M long kNm", "ULS M trans kNm", "ULS M resultant (upper) kNm", "SLS M long kNm", "SLS M trans kNm", "Governing ULS N max"]
GH = ["Girder", "ULS bending M*/phiMu max", "SLS stress u max", "Shear/torsion u max", "Hog time", "Hog max mm"]


def sheet(wb, name, head, rows, tag_col=None):
    ws = wb.create_sheet(name)
    ws.append(head)
    for c in ws[1]:
        c.font = Font(bold=True)
    for r in rows:
        ws.append(r)
        if tag_col is not None and r[tag_col] in FILL:
            ws.cell(ws.max_row, tag_col + 1).fill = PatternFill("solid", fgColor=FILL[r[tag_col]])
    ws.freeze_panes = "A2"
    for i, h in enumerate(head):
        ws.column_dimensions[ws.cell(1, i + 1).column_letter].width = min(60, max(10, len(h) + 2))
    return ws


def main():
    desc, rd = sys.argv[1], sys.argv[2]
    allow = "--allow-proposed" in sys.argv
    doc = json.load(open(desc))
    gc, ca = load(rd, "girder_checks.json"), load(rd, "combined_actions.json")
    V = values_rows(doc, allow)
    G = girder_rows(gc)
    B, P = schedule_rows(ca)
    pid = os.path.basename(desc).split(".")[0]

    wb = Workbook(); wb.remove(wb.active)
    VH = ["Path", "Value", "Unit", "Tag", "Status", "Source (sheet, view)", "Note"]
    sheet(wb, "Bridge data", VH, V, tag_col=3)
    sheet(wb, "Needs Review", VH, [r for r in V if r[3] == "Missing-Flagged"], tag_col=3)
    sheet(wb, "Girder checks", GH, G)
    for g, R in sorted((k, v) for k, v in (gc or {}).items() if isinstance(v, dict) and "rows" in v):
        hg = R.get("hog") or {}
        if hg.get("times"):
            sheet(wb, f"Hog {g}"[:31], ["x (m)"] + [f"{q['label']} (mm)" for q in hg["times"]],
                  [[x] + [q["hog_mm"][i] for q in hg["times"]] for i, x in enumerate(hg["x_m"])])
    sheet(wb, "Bearings", BH, B)
    sheet(wb, "Piles", PH, P)
    n = {t: sum(r[3] == t for r in V) for t in TAGS}
    sheet(wb, "Read me", ["Item", "Value"], [["Bridge", pid], ["Run", os.path.basename(os.path.normpath(rd))],
          ["Inputs", "proposed inputs used (provisional)" if allow else "accepted inputs only"]] + [[f"rows tagged {t}", c] for t, c in n.items() if c]
          + [["Rule", "Every value comes from the drawings (Direct / Calculated) or is tagged; Missing-Flagged rows are listed in Needs Review."]])
    wb.move_sheet("Read me", offset=-len(wb.sheetnames) + 1)
    wb.save(os.path.join(rd, "workbook.xlsx"))

    from docx import Document
    d = Document()
    d.add_heading(f"{pid} — calculation summary", 0)
    d.add_paragraph(f"Run {os.path.basename(os.path.normpath(rd))}; {'proposed inputs used — results are provisional' if allow else 'accepted inputs only'}. "
                    "Values from the run outputs; no value is computed in this document. Engineering verification is the engineer's.")

    def tbl(head, rows, nd=0):
        t = d.add_table(rows=1, cols=len(head)); t.style = "Light Grid Accent 1"
        for i, h in enumerate(head):
            t.rows[0].cells[i].text = h
        for r in rows:
            cs = t.add_row().cells
            for i, v in enumerate(r):
                cs[i].text = "—" if v is None else (f"{v:,.{nd}f}" if isinstance(v, float) else str(v))

    d.add_heading("Bridge data — tags", 1)
    tbl(["Tag", "Rows"], [[t, c] for t, c in n.items() if c])
    d.add_heading(f"Needs review ({n.get('Missing-Flagged', 0)} rows)", 1)
    tbl(["Path", "Note"], [[r[0], r[6]] for r in V if r[3] == "Missing-Flagged"])
    if G:
        d.add_heading("Girder checks — maximum utilisation", 1)
        tbl(GH, [[r[0]] + [round(x, 2) if isinstance(x, float) else x for x in r[1:]] for r in G], 2)
    if B:
        d.add_heading("Bearings (kN)", 1)
        tbl(BH[:5], [r[:5] for r in B])
    if P:
        d.add_heading("Piles (kN, kNm)", 1)
        tbl(PH[:8], [r[:8] for r in P])
    if gc:
        notes = next((v.get("notes") for v in gc.values() if isinstance(v, dict) and "rows" in v), None) or []
        if notes:
            d.add_heading("Method notes", 1)
            for x in notes:
                d.add_paragraph(x, style="List Bullet")
    d.save(os.path.join(rd, "report.docx"))
    print(f"workbook.xlsx ({len(V)} bridge-data rows, {n.get('Missing-Flagged', 0)} need review) and report.docx written")


if __name__ == "__main__":
    main()
