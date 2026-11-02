#!/usr/bin/env python3
"""Calculation report for one chain run (P7.6): one self-contained, printable HTML page (browser Print -> PDF).

    python3 app/report.py DESCRIPTION.json RUN_DIR [--allow-proposed]      -> RUN_DIR/report.html

Built only from the run's own outputs and the description: no engineering value is computed here (only maxima and
counts of values the tools wrote)."""
import datetime, html, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "schema")); sys.path.insert(0, HERE)
from rules_0_2 import records
from server import effective

e = html.escape
TAGS = ["Direct", "Calculated", "Confirmed-Engineer", "Input-user", "Standard-verify", "Model", "Assumed", "Missing-Flagged"]


def f(v, d=0):
    if v is None:
        return "—"
    if isinstance(v, bool):
        return str(v).lower()
    if isinstance(v, (int, float)):
        return f"{v:,.{d}f}"
    if isinstance(v, dict):
        return "; ".join(f"{k}: {x}" for k, x in v.items())
    return str(v)


def fv(v):
    """A stored value exactly as stored (no rounding): 1100.0 -> 1100, 9.8433 -> 9.8433, True -> true."""
    if isinstance(v, bool):
        return str(v).lower()
    if isinstance(v, float):
        return str(int(v)) if v.is_integer() else repr(v)
    if isinstance(v, int):
        return str(v)
    return f(v)


def table(head, rows, cls="num"):
    return (f'<table class="{cls}"><thead><tr>' + "".join(f"<th>{e(h)}</th>" for h in head) + "</tr></thead><tbody>"
            + "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows) + "</tbody></table>")


def uc(u):
    if u is None:
        return '<span class="na">—</span>'
    return f'<span class="{"fail" if u > 1 else "warn" if u > 0.9 else "ok"}">{u:.2f}</span>'


def load(d, name):
    p = os.path.join(d, name)
    return json.load(open(p)) if os.path.exists(p) else None


def main():
    desc, rd = sys.argv[1], sys.argv[2]
    allow = "--allow-proposed" in sys.argv
    doc = json.load(open(desc))
    st, mv, ca, gc, geo, sec = (load(rd, n) for n in ("status.json", "model_view.json", "combined_actions.json", "girder_checks.json", "geometry.json", "sections.json"))
    pid = os.path.basename(desc).split(".")[0]
    pname = ((doc.get("project") or {}).get("name") or {}).get("value") or ""
    rev = doc.get("revision") or {}
    recs = list(records(doc))
    S, n = [], 0

    def sec_(title, body):
        nonlocal n
        n += 1
        S.append(f'<section><h2>{n}. {e(title)}</h2>{body}</section>')

    # 1 basis
    cnt = {t: 0 for t in TAGS}
    rows_rev = []
    for path, r in recs:
        v, tag, ov = effective(r, allow)
        cnt[tag] = cnt.get(tag, 0) + 1
        if tag in ("Missing-Flagged", "Assumed") or ov:
            rows_rev.append([f'<code>{e(path)}</code>', e(fv(v)), e((ov or r).get("unit") or ""), f'<span class="tag t-{tag.replace("-", "")}">{e(tag)}</span>',
                             e((ov or {}).get("reason") or r.get("note") or ((r.get("source") or {}).get("note")) or ""), e(r.get("replace_with") or "")])
    prov = (mv or {}).get("provisional_decisions") or []
    sec_("Basis of this report", f"""<p>Bridge description <code>{e(os.path.relpath(desc, ROOT))}</code> revision {rev.get('number')} ({e(str((doc.get('hash') or {}).get('value', ''))[:19])}…).
Engine commit {e(str((st or {}).get('engine_commit')))}. Run {e(str((st or {}).get('id')))} started {e(str((st or {}).get('started')))}.
{('<b>Proposed (not yet accepted) inputs used:</b> ' + e(', '.join(prov)) + '.' if prov else 'Run allowed proposed inputs; none were used (all decisions accepted).') if allow else 'Accepted inputs only.'}</p>
<p>Every input value carries one data-source tag (DATA_SOURCE_CATEGORIZATION_STANDARD): Direct = printed on the drawings; Calculated = arithmetic on printed values (derivation recorded);
Missing-Flagged = not available; Assumed / Model / Standard-verify / Input-user / Confirmed-Engineer as defined in the format.</p>
{table(["Tag", "Values"], [[f'<span class="tag t-{t.replace("-", "")}">{t}</span>', cnt[t]] for t in TAGS if cnt.get(t)])}
<p class="warn-box">Standards values used by the engine are code-extracted entries that are <b>not yet verified</b> by a reviewer. Results are INDICATIVE and not design-approved.</p>""")
    # 2 needs review
    sec_(f"Values needing review ({len(rows_rev)})", "<p>Missing, Assumed, or proposed values the run used or could not use. Each must be replaced from a document or accepted by the engineer.</p>"
         + table(["Path", "Value", "Unit", "Tag", "Note", "Replace with"], rows_rev, "txt"))
    # 3 geometry
    if geo:
        sec_("Geometry checks", table(["Check", "What", "Value", "Limit", "Pass", "Basis"], [[e(str(c.get("id", ""))), e(str(c.get("what", ""))),
              e(str(c.get("value_m", c.get("value_deg", "")))), e(str(c.get("limit_m", c.get("limit_deg", "")))), "yes" if c.get("pass") else '<span class="fail">NO</span>',
              e(str(c.get("basis", "")))] for c in geo.get("checks", [])], "txt"))
    # 4 model, SW / SDL, modes
    if mv:
        roles = {}
        for b in mv["beams"]:
            roles[b[2]] = roles.get(b[2], 0) + 1
        def gz(c):
            u = [v[2] for k, v in mv["cases"][c]["u"].items() if mv["nodes"].get(k, [0, 0, 0, ""])[3] == "girder"]
            return -min(u) * 1000 if u else None
        body = (f"<p>Integrated grillage model: {len(mv['nodes'])} nodes, {len(mv['beams'])} members, {len(mv['links'])} bearing links, "
                f"{len(mv['fixed'])} fixed supports, {len(mv['springs'])} spring nodes. Members by role: {e(', '.join(f'{k} {v}' for k, v in sorted(roles.items())))}.</p>"
                + table(["Case", "Applied (kN)", "Max girder deflection (mm)", "Equilibrium residual (kN)"],
                        [[nm, f(-mv["cases"][c]["applied_kN"][2], 1), f(gz(c), 1), f"{mv['cases'][c]['equilibrium_residual_kN']:.1e}"] for c, nm in (("SW", "Self weight"), ("SDL", "Superimposed dead load")) if c in mv["cases"]]))
        if mv.get("modes"):
            body += f"<h3>Natural modes — mass: {e(mv.get('mass_rule') or '')}</h3>" + table(["Mode", "T (s)", "f (Hz)", "Mass X %", "Mass Y %", "Mass Z %"],
                [[m["n"], f(m["T"], 3), f(m["f"], 2), f(100 * m["eff"]["X"], 1), f(100 * m["eff"]["Y"], 1), f(100 * m["eff"]["Z"], 1)] for m in mv["modes"][:10]])
        sec_("Model and permanent loads", body)
    if sec:
        G = sec["girders"]
        sec_("Section properties at midspan", table(["Girder", "Type", "Girder A (mm²)", "Girder Ix (×10⁹ mm⁴)", "Composite A tr. (mm²)", "Composite yc (mm)", "Composite Ix (×10⁹ mm⁴)"],
             [[g, G[g]["type"], f(m_["girder"]["A"]), f(m_["girder"]["Ix"] / 1e9, 2), f(m_["composite"]["A_transformed"]), f(m_["composite"]["yc"], 1), f(m_["composite"]["Ix"] / 1e9, 2)]
              for g in sorted(G) for m_ in [G[g]["stations"][len(G[g]["stations"]) // 2]]]) + f"<p class='small'>{e(' '.join(sec.get('notes') or []))}</p>")
    # 5 design actions
    if ca:
        Z = ca["schedule"]
        g_ = lambda o, k: f'<br><span class="small">{e(str(o.get(k, "")))}</span>'
        body = "<h3>Bearings (kN)</h3>" + table(["Bearing", "ULS V max", "ULS V min", "SLS V max", "SLS V min", "ULS H trans. ±", "ULS H long. ±"],
            [[k, f(v["ULS"]["v"]["max"]) + g_(v["ULS"]["v"], "gmax"), f(v["ULS"]["v"]["min"]), f(v["SLS"]["v"]["max"]), f(v["SLS"]["v"]["min"]),
              f"{f(v['ULS']['tr']['max'])} / {f(v['ULS']['tr']['min'])}", f"{f(v['ULS']['lon']['max'])} / {f(v['ULS']['lon']['min'])}"] for k, v in Z["bearings"].items()])
        body += "<h3>Piles (kN, kN·m)</h3>" + table(["Pile", "ULS N max", "ULS N min", "SLS N max", "ULS M long.", "ULS M trans.", "ULS M resultant"],
            [[k, f(v["ULS"]["N"]["max"]) + g_(v["ULS"]["N"], "gmax"), f(v["ULS"]["N"]["min"]), f(v["SLS"]["N"]["max"]), f(v["ULS"]["Ml"]["abs"]), f(v["ULS"]["Mt"]["abs"]),
              f((ca.get("pile_resultants") or {}).get(k, {}).get("resultant_upper"))] for k, v in Z["piles"].items()])
        body += "<h3>Girders (kN, kN·m)</h3>" + table(["Girder", "ULS M sag", "ULS M hog", "ULS V", "ULS T", "SLS M sag"],
            [[k, f(v["ULS"]["M_sag"]["value"]) + g_(v["ULS"]["M_sag"], "gov"), f(v["ULS"]["M_hog"]["value"]), f(v["ULS"]["V"]["abs"]), f(v["ULS"]["T"]["abs"]), f(v["SLS"]["M_sag"]["value"])]
             for k, v in sorted(Z["girders"].items())])
        body += "<h3>Sills / headstocks (kN·m, kN)</h3>" + table(["Support", "ULS My max", "ULS My min", "ULS Vz", "ULS T"],
            [[k, f(v["ULS"]["My_max"]["value"]), f(v["ULS"]["My_min"]["value"]), f(v["ULS"]["Vz"]["abs"]), f((v["ULS"].get("T") or {}).get("abs"))] for k, v in Z["sills"].items()])
        nc = ca.get("not_combined") or []
        body += f"<p class='small'>AS 5100.2 combinations: {len(ca.get('governing_rows') or [])} governing rows listed in combined_actions.md. Not combined: {e('; '.join(map(str, nc)) or 'none')}.</p>"
        sec_("Design actions (AS 5100.2 combinations)", body)
    # 6 girder checks
    if gc:
        gs = sorted(k for k in gc if isinstance(gc[k], dict) and "rows" in gc[k])
        summ = []
        for g in gs:
            R_ = gc[g]["rows"]; op = [r for r in R_ if r.get("conf") != "solid"]
            uB = max([max((r.get("sag") or {}).get("uB") or 0, (r.get("hog") or {}).get("uB") or 0) for r in op] or [None])
            uS = max([max((r.get("sag") or {}).get("uS") or 0, (r.get("hog") or {}).get("uS") or 0) for r in op] or [None])
            uV = max([(r.get("shear") or {}).get("u") or 0 for r in R_] or [None])
            mf = sum(1 for r in op if (r.get("sag") or {}).get("okMin") is False)
            summ.append([g, uc(uB), uc(uS), uc(uV), f'<span class="fail">{mf}</span>' if mf else "0"])
        st_ = [r["t"] for r in gc[gs[0]]["rows"]]
        heat = table(["Girder"] + [f"t={t:.1f}" for t in st_], [[g] + [uc((r.get("sag") or {}).get("uB")) if r.get("conf") != "solid" else '<span class="na">solid</span>' for r in gc[g]["rows"]] for g in gs])
        heatv = table(["Girder"] + [f"t={t:.1f}" for t in st_], [[g] + [uc((r.get("shear") or {}).get("u")) for r in gc[g]["rows"]] for g in gs])
        notes = gc[gs[0]].get("notes") or []
        sec_("Super-T girder checks (AS 5100.5)", "<p>Utilisation = design action / capacity; red &gt; 1.00, amber &gt; 0.90.</p>"
             + table(["Girder", "ULS bending", "SLS stress", "Shear / torsion", "Minimum strength fails"], summ)
             + "<h3>ULS bending M*/φMu (sagging) along the girders</h3>" + heat + "<h3>Shear / torsion along the girders</h3>" + heatv
             + "<h3>Method notes</h3><ul>" + "".join(f"<li>{e(x)}</li>" for x in notes) + "</ul>")
    # 7 limitations
    sec_("Limitations and open items", """<ul>
<li>Results are INDICATIVE: not design-approved; standards entries are code-extracted and unverified.</li>
<li>Values tagged Assumed, Model or Missing-Flagged (section 2) must be replaced or accepted by the engineer before any design use.</li>
<li>Open engineering items are tracked in <code>docs/CURRENT_STATUS.md</code> and <code>docs/P7_PLAN.md</code> (e.g. prestress losses / hog after transfer, Super-T torsion approach).</li>
<li>Traffic moving-load cases are not in the MIDAS export; traffic actions here come from the platform's influence-surface engine.</li></ul>""")
    if st:
        sec_("Run record", table(["Step", "State", "Time (s)"], [[e(s["title"]), e(s["state"]), f(s.get("seconds"), 1)] for s in st["steps"]], "txt"))
    now = datetime.datetime.now().astimezone().isoformat(timespec="minutes")
    out = os.path.join(rd, "report.html")
    open(out, "w").write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(pid)} calculation report</title><style>
body {{ font: 10.5pt/1.45 Georgia, "Times New Roman", serif; color: #1b1f24; background: #fff; max-width: 1100px; margin: 0 auto; padding: 24px; }}
h1 {{ font: 600 22pt/1.2 system-ui, sans-serif; margin: 0; }} h2 {{ font: 600 14pt system-ui, sans-serif; border-bottom: 2px solid #1f5fa8; padding-bottom: 4px; margin-top: 28px; }}
h3 {{ font: 600 11pt system-ui, sans-serif; margin: 16px 0 6px; }}
.cover {{ border: 1px solid #ccd; padding: 18px 22px; }} .cover .meta {{ font: 10pt system-ui, sans-serif; color: #555; }}
.banner, .warn-box {{ background: #fff3d6; color: #6b4a00; padding: 8px 12px; border-left: 4px solid #c48a00; font-family: system-ui, sans-serif; font-size: 10pt; }}
table {{ border-collapse: collapse; width: 100%; font: 9pt system-ui, sans-serif; margin: 6px 0 10px; }}
th, td {{ border: 1px solid #d5d9de; padding: 3px 6px; vertical-align: top; text-align: left; }} th {{ background: #eef1f5; }}
table.num td:not(:first-child) {{ text-align: right; font-variant-numeric: tabular-nums; }}
.ok {{ color: #1d6b31; }} .warn {{ color: #8a5d00; font-weight: 600; }} .fail {{ color: #b0170c; font-weight: 700; }} .na {{ color: #999; }}
.small {{ font-size: 8.5pt; color: #555; }} code {{ font-size: 8.5pt; }}
.tag {{ padding: 0 5px; border: 1px solid #ccd; border-radius: 3px; white-space: nowrap; }} .t-Calculated {{ background: #fff1cc; }} .t-MissingFlagged {{ background: #fbe0dc; color: #9b1c12; }}
.t-Assumed {{ background: #efe6fb; }} .t-Model {{ background: #e6ecf2; }} .t-Standardverify {{ background: #dff3f1; }}
@media print {{ body {{ padding: 0; max-width: none; }} section {{ break-inside: auto; }} h2 {{ break-after: avoid; }} tr {{ break-inside: avoid; }} .noprint {{ display: none; }} }}
</style></head><body>
<div class="cover"><div class="meta">PDF2BIM bridge platform · calculation report</div><h1>{e(pid)}</h1><p>{e(pname)}</p>
<div class="meta">Description revision {rev.get('number')} · run {e(str((st or {}).get('id')))} · engine {e(str((st or {}).get('engine_commit')))} · generated {now}</div>
<p class="banner"><b>INDICATIVE — NOT DESIGN-APPROVED.</b> {'Uses PROPOSED inputs: ' + e(', '.join(prov)) + '.' if allow and prov else ''} Generated automatically from the platform outputs; to be checked and signed by the responsible engineer.</p>
<p class="noprint small">Print this page (Ctrl+P) and choose "Save as PDF" for a PDF copy.</p></div>
{''.join(S)}
</body></html>""")
    print(f"report: {out} ({n} sections, {len(rows_rev)} values needing review)")


if __name__ == "__main__":
    main()
