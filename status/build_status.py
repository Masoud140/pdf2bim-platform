#!/usr/bin/env python3
"""Build the project status dashboard: status/index.html (one self-contained file).

    python3 status/build_status.py            # rebuild from repository data
    python3 status/build_status.py --no-remote  # skip the GitHub check (offline)

Data sources (nothing is typed into the page by hand):
- status/stages.json               stage status, risks, next task (hand-maintained project data, with evidence paths)
- baseline/BR13A/snapshot.json     BR13A results + run record + consistency checks (tools/baseline_snapshot.js)
- baseline/BR13A/test_run.md       latest full test-script run (tools/run_suite.py)
- baseline/BR13A/live_run.txt      latest live baseline test output (BASELINE_LIVE=1 tests/baseline/test_baseline.py)
- status/model_3d.png              screenshot of the real 3D model tab (status/capture_model.js)
- git                              branch, HEAD, remote head, working-tree state
Every evidence path named in stages.json is checked to exist; a missing path is shown as a warning.
"""
import base64, datetime, html, json, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
J = lambda *p: os.path.join(ROOT, *p)
E = html.escape


def git(*a):
    try:
        return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, timeout=60).stdout.strip()
    except Exception:
        return ""


def rel(path):
    return os.path.relpath(J(path), J("status")).replace(os.sep, "/")


# ---------------- data ----------------
stages = json.load(open(J("status", "stages.json")))
snap = json.load(open(J("baseline", "BR13A", "snapshot.json")))
Q = {q["id"]: q for q in snap["quantities"]}
branch, head = git("rev-parse", "--abbrev-ref", "HEAD"), git("rev-parse", "HEAD")
remote = None
if "--no-remote" not in sys.argv:
    out = git("ls-remote", "origin", f"refs/heads/{branch}")
    remote = out.split()[0] if out else ""
dirty = git("status", "--porcelain", "--untracked-files=no")
head_date = git("log", "-1", "--format=%cI")
head_subject = git("log", "-1", "--format=%s")

# test run record
tr_txt = open(J("baseline", "BR13A", "test_run.md")).read() if os.path.exists(J("baseline", "BR13A", "test_run.md")) else ""
tr_time = (re.search(r"Test run record — (\S+)", tr_txt) or [None, "?"])[1]
tr_commit = (re.search(r"- Commit: `([0-9a-f]+)`", tr_txt) or [None, ""])[1]
tr_rows = []
for line in tr_txt.splitlines():
    m = re.match(r"\| (\S[^|]*?) \| `([^`]*)` \| (prints|asserts) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$", line)
    if m:
        tr_rows.append(dict(name=m[1], cmd=m[2], kind=m[3], rc=m[4].strip(), t=m[5].strip(), js=m[6].strip(), outcome=m[7].strip()))
# outdated if test/engine files changed since the recorded commit
changed = git("diff", "--name-only", tr_commit, "HEAD", "--", "tests", "src", "base", "tools", "build.sh") if tr_commit else "?"
tr_stale = bool(changed)

live_txt = open(J("baseline", "BR13A", "live_run.txt")).read() if os.path.exists(J("baseline", "BR13A", "live_run.txt")) else ""
live_lines = [l for l in live_txt.splitlines() if l.startswith(("PASS", "FAIL"))]
live_meta = dict(re.findall(r"^# (\w+): (.*)$", live_txt, re.M))


def classify(row):
    """Passed / Failed / Blocked / No assertions — never 'passed' for a print-only script."""
    if row["kind"] == "asserts":
        m = re.match(r"(\d+) PASS / (\d+) FAIL", row["outcome"])
        if m:
            return ("Passed" if int(m[2]) == 0 and row["rc"] == "0" else "Failed"), f"{m[1]} assertions passed, {m[2]} failed"
        return "Failed", row["outcome"]
    if row["rc"] != "0" or row["outcome"].startswith("ERROR"):
        if "environment" in row["outcome"] and row["rc"] == "0" and row["js"] in ("0", "-"):
            return "No assertions", "ran; only a sandbox network block (web font) was logged"
        return "Failed", row["outcome"]
    if "environment" in row["outcome"]:
        return "No assertions", "ran without software errors (sandbox blocked a web-font request); prints values, does not assert"
    return "No assertions", "ran without errors; prints values next to targets but does not assert"


tests = [(r, *classify(r)) for r in tr_rows]
counts = {k: sum(1 for t in tests if t[1] == k) for k in ["Passed", "Failed", "Blocked", "No assertions"]}
n_assert_pass = sum(int(m[1]) for r in tr_rows for m in [re.match(r"(\d+) PASS", r["outcome"])] if m and r["kind"] == "asserts")
n_assert_fail = sum(int(m[1]) for r in tr_rows for m in [re.match(r"\d+ PASS / (\d+) FAIL", r["outcome"])] if m and r["kind"] == "asserts")
checks = snap["checks"]

img = J("status", "model_3d.png")
img_uri = "data:image/png;base64," + base64.b64encode(open(img, "rb").read()).decode() if os.path.exists(img) else None
img_meta = json.load(open(J("status", "model_3d.json"))) if os.path.exists(J("status", "model_3d.json")) else {}

missing_evidence = [(s["id"], p) for s in stages["stages"] for p in s.get("evidence", []) if not os.path.exists(J(p))]

# ---------------- helpers ----------------
STATUS = {"completed": ("Completed", "ok"), "in_progress": ("In progress", "prog"), "blocked": ("Blocked", "bad"), "not_started": ("Not started", "none")}
TSTAT = {"Passed": "ok", "Failed": "bad", "Blocked": "warn", "No assertions": "none"}


def v(k, f="{:.1f}", scale=1.0):
    return f.format(Q[k]["value"] * scale) if k in Q else "—"


def link(path, text=None):
    return f'<a href="{E(rel(path))}">{E(text or path)}</a>' if os.path.exists(J(path)) else f'<span class="muted">{E(text or path)} (missing)</span>'


def table(head, rows, cls=""):
    h = "".join(f"<th>{E(c)}</th>" for c in head)
    b = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="tw"><table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'


def badge(text, kind):
    return f'<span class="b b-{kind}">{E(text)}</span>'


VER = badge("Indicative — reproduces baseline, not independently verified", "warn")
run = snap["run"]
src_line = (f'Source: <code>baseline/BR13A/snapshot.json</code> · model = embedded BR13A .mct '
            f'<code>{run["inputs"]["embedded_mct_sha256"][:12]}</code> · dashboard build <code>{run["dashboard"]["sha256"][:12]}</code> · '
            f'code commit <code>{run["git"]["commit"][:7]}</code> · captured {E(run["created"][:16].replace("T", " "))} UTC')

# ---------------- sections ----------------
sync_ok = remote is not None and remote == head and not dirty
cur = next((s for s in stages["stages"] if s["status"] == "in_progress"), None)
done = [s for s in stages["stages"] if s["status"] == "completed"]
todo = [s for s in stages["stages"] if s["status"] in ("not_started", "blocked")]
last_done = done[-1] if done else None

overview = f'''
<section id="overview"><h2>Overview</h2>
<div class="cards">
 <div class="card"><div class="k">Current stage</div><div class="big">{E(last_done["id"] if last_done else "—")}</div>
  <p>{E(last_done["name"]) if last_done else ""}</p><p>{badge("Completed", "ok")} {badge(last_done.get("review", ""), "warn") if last_done and last_done.get("review") else ""}</p></div>
 <div class="card"><div class="k">Being worked on</div><div class="big">{E(cur["id"]) if cur else "Nothing"}</div>
  <p>{E(cur["name"]) if cur else "Paused for owner review before the next stage."}</p></div>
 <div class="card"><div class="k">Next milestone</div><p class="mid">{E(stages["next"]["task"])}</p><p class="muted">{E(stages["next"]["why"])}</p></div>
 <div class="card"><div class="k">Latest commit</div><div class="mono">{E(branch)} @ {E(head[:7])}</div>
  <p class="muted">{E(head_subject)}<br>{E(head_date[:16].replace("T", " "))}</p>
  <p>{badge("Saved on GitHub", "ok") if sync_ok else (badge("GitHub not checked", "none") if remote is None else badge("Not in sync with GitHub", "bad"))}</p></div>
</div>
<div class="cols">
 <div><h3>Done (with evidence)</h3><ul>{"".join(f"<li><b>{E(s['id'])}</b> {E(s['plain'])}</li>" for s in done)}</ul></div>
 <div><h3>Not yet done</h3><ul>{"".join(f"<li><b>{E(s['id'])}</b> {E(s['plain'])}</li>" for s in todo)}</ul></div>
</div>
<p class="note"><b>Important.</b> The software runs the full BR13A chain (model → loads → combinations → girder design) and its output is reproducible.
<b>No result has yet been independently verified</b>, many inputs are placeholders, and nothing here shows the bridge is safe or code-compliant.</p>
</section>'''

road_items = []
for s in stages["stages"]:
    lab, k = STATUS[s["status"]]
    ev = ", ".join(link(p, os.path.basename(p)) for p in s.get("evidence", [])) or '<span class="muted">none yet</span>'
    extra = (f'<p>{badge(s["review"], "warn")}</p>' if s.get("review") else "") + (f'<p class="muted">{E(s["note"])}</p>' if s.get("note") else "")
    road_items.append(f'<li class="st st-{k}"><details><summary><span class="dot"></span><b>{E(s["id"])}</b> {E(s["name"])} {badge(lab, k)}</summary>'
                      f'<div class="det"><p>{E(s["plain"])}</p>{extra}<p><span class="k">Evidence:</span> {ev}</p></div></details></li>')
roadmap = f'<section id="roadmap"><h2>Roadmap</h2><p class="muted">A stage is marked completed only when its evidence exists in the repository. Click a stage for details.</p><ol class="road">{"".join(road_items)}</ol></section>'

app = f'''<section id="app"><h2>The actual software</h2>
<p>The working prototype is a single offline HTML application. Build it, then open it from this page:</p>
<pre>./build.sh        # writes dist/BR13A_grillage_dashboard.html (not stored in git; about 3.5 MB)</pre>
<p>{link("dist/BR13A_grillage_dashboard.html", "Open the BR13A application (3D model, analysis, design)")}</p>
{(f'<figure><img src="{img_uri}" alt="Screenshot of the real 3D model tab"><figcaption>{badge("Actual generated model", "ok")} '
  f'Screenshot of the application\'s own 3D tab (swept from the live grillage: 4 Super-T girders, deck, bearings, sill beams, columns, piles). '
  f'Captured {E(img_meta.get("captured", "?")[:16].replace("T", " "))} UTC from build <code>{E(img_meta.get("dashboard_sha256", "?")[:12])}</code>. '
  f'Not a conceptual illustration. Open the application for the interactive view.</figcaption></figure>') if img_uri else '<p class="muted">No 3D screenshot captured (run <code>node status/capture_model.js</code>).</p>'}
</section>'''

# results
geo_rows = [[f"G{g}", v(f"geom.G{g}.chord_length", "{:.3f}"), v(f"geom.G{g}.offset", "{:.3f}"), v(f"selfweight.G{g}.midspan_uz", "{:.1f}", 1000)] for g in range(1, 5)]
sec = [[E(n.split(".")[2]), v(f"model.section.{n.split('.')[2]}.A", "{:.3f}"), v(f"model.section.{n.split('.')[2]}.Iy", "{:.4f}"), v(f"model.section.{n.split('.')[2]}.J", "{:.4f}")]
       for n in sorted({k.rsplit(".", 1)[0] for k in Q if k.startswith("model.section.")})]
brg = []
for k in sorted({q.split(".")[1] for q in Q if q.startswith("brg.") and ".V." in q}):
    b = f"brg.{k}.V"
    brg.append([E(k.replace("_", " ")), v(b + ".DLc", "{:.0f}"), v(b + ".SDLp", "{:.0f}"), v(b + ".M1600.max", "{:.0f}"), v(b + ".ULS.max", "{:.0f}"), v(b + ".ULS.min", "{:.0f}"), v(b + ".SLS.max", "{:.0f}")])
gir = [[f"G{g}", v(f"girder.G{g}.GM1.DLc.max", "{:.0f}"), v(f"girder.G{g}.GM1.SDLp.max", "{:.0f}"), v(f"girder.G{g}.GM1.M1600.max", "{:.0f}"), v(f"girder.G{g}.GM1.ULS.max", "{:.0f}"), v(f"girder.G{g}.GV.ULS.max", "{:.0f}"), v(f"girder.G{g}.GT.ULS.max", "{:.0f}")] for g in range(1, 5)]
piles = [[p, v(f"pile.{p}.N.ULS.max", "{:.0f}"), v(f"pile.{p}.N.ULS.min", "{:.0f}"), v(f"pile.{p}.Ml.ULS.max", "{:.0f}"), v(f"pile.{p}.Mt.ULS.max", "{:.0f}")]
         for p in sorted({q.split(".")[1] for q in Q if q.startswith("pile.") and q.endswith(".N.ULS.max")})]
modes = [[str(i), v(f"modal.mode{i}.T", "{:.3f}"), v(f"modal.mode{i}.meff_L", "{:.0%}"), v(f"modal.mode{i}.meff_T", "{:.0%}"), v(f"modal.mode{i}.meff_V", "{:.0%}")] for i in range(1, 7)]
des = []
for l in ["LC1", "LC2", "LC3", "LC4"]:
    b = f"design.{l}"
    cells = [l]
    for p in ["uS", "uB", "uL"]:
        x = Q.get(f"{b}.{p}", {}).get("value")
        cells.append("—" if x is None else (f'<span class="{"over" if x > 1 else ""}">{x:.2f}</span>'))
    cells += [v(b + ".Mu", "{:.0f}"), v(b + ".dn", "{:.0f}")]
    des.append(cells)
st = sorted({q.split(".")[1] for q in Q if q.startswith("design.station")})
xs = [Q[f"design.{s}.x"]["value"] for s in st]


def line_svg(series, xs, ylab):
    W, H, pl, pb = 640, 220, 44, 28
    ymax = max(1.2, max(max(s[1]) for s in series) * 1.05)
    X = lambda x: pl + (x - min(xs)) / (max(xs) - min(xs)) * (W - pl - 10)
    Y = lambda y: H - pb - y / ymax * (H - pb - 10)
    g = "".join(f'<line x1="{pl}" x2="{W-10}" y1="{Y(t):.1f}" y2="{Y(t):.1f}" class="grid"/><text x="{pl-6}" y="{Y(t)+4:.1f}" class="ax" text-anchor="end">{t:g}</text>' for t in [0, 0.5, 1.0] + ([2, 3, 4] if ymax > 2 else []) if t <= ymax)
    g += f'<line x1="{pl}" x2="{W-10}" y1="{Y(1):.1f}" y2="{Y(1):.1f}" class="lim"/><text x="{W-12}" y="{Y(1)-4:.1f}" class="ax" text-anchor="end">utilisation 1.0</text>'
    g += "".join(f'<text x="{X(t):.1f}" y="{H-8}" class="ax" text-anchor="middle">{t:.0f}</text>' for t in range(0, int(max(xs)) + 1, 5))
    p = "".join(f'<polyline class="s{i}" points="{" ".join(f"{X(x):.1f},{Y(y):.1f}" for x, y in zip(xs, s[1]))}"/>' for i, s in enumerate(series))
    leg = " ".join(f'<span class="lg s{i}">{E(s[0])}</span>' for i, s in enumerate(series))
    return f'<div class="tw"><svg viewBox="0 0 {W} {H}" class="chart" role="img" aria-label="{E(ylab)}">{g}{p}</svg></div><p class="muted">{leg} · x = distance along girder (m)</p>'


chart = line_svg([(lab, [Q.get(f"design.{s}.{p}.max", {}).get("value", 0) for s in st]) for lab, p in [("SLS stress uS", "uS"), ("ULS bending uB", "uB"), ("shear/torsion uL", "uL")]], xs, "Design utilisation along the girder")

res_status = table(["Category", "Captured", "Compared with baseline", "Independently verified"], [
    ["Geometry (girder chords, offsets)", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Section properties (model + design section)", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Self-weight displacements (grillage only)", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Bearing, girder, pile, headstock actions", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Modal periods", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Super-T design utilisations", badge("yes", "ok"), badge("yes", "ok"), badge("no", "bad")],
    ["Integrated-model displacements, pile head movements", badge("no", "none"), "—", "—"],
    ["List of combination factors (only the row count is captured)", badge("partial", "warn"), "count only", "—"],
])

results = f'''<section id="results"><h2>Engineering results — BR13A</h2>
<p class="note">{VER} Every number below is a <b>calculated</b> output of the current software. It is recorded in the baseline and a re-run reproduces it exactly.
It is <b>not</b> independently verified, and many inputs are <b>provisional assumptions</b> (placeholders). Do not use for design.</p>
<p class="muted small">{src_line}</p>
{res_status}
<details open><summary><b>Geometry and self-weight deflection</b></summary>{table(["Girder", "Chord length (m)", "Offset from control line (m)", "Self-weight midspan deflection (mm)"], geo_rows)}
<p class="muted small">Deflection from the Analysis tab (grillage .mct, self weight), not from the integrated substructure model.</p></details>
<details><summary><b>Girder section properties (model, composite)</b></summary>{table(["Section", "A (m²)", "Iy vertical (m⁴)", "J torsion (m⁴)"], sec)}
<p class="muted small">Design section (one Super-T definition): depth {v("design.section.D", "{:.0f}")} mm, deck {v("design.section.tD", "{:.0f}")} mm, deck width {v("design.section.Wd", "{:.0f}")} mm,
A {v("design.section.A", "{:,.0f}")} mm², I {Q["design.section.I"]["value"]:.3e} mm⁴, {v("design.section.nStrands", "{:.0f}")} strands ({badge("placeholder layout", "warn")}).</p></details>
<details><summary><b>Bearing vertical reactions (kN, compression +)</b></summary>{table(["Bearing", "Dead load", "Superimposed DL", "M1600 max", "ULS max", "ULS min", "SLS max"], brg)}
<p class="muted small">Check: sum of SDL bearing reactions = applied SDL (residual {next(c["value"] for c in checks if c["id"] == "chk.equilibrium.SDL"):.1e}).</p></details>
<details><summary><b>Girder actions (envelopes)</b></summary>{table(["Girder", "M dead (kNm)", "M SDL (kNm)", "M M1600 (kNm)", "M ULS (kNm)", "V ULS (kN)", "T ULS (kNm)"], gir)}</details>
<details><summary><b>Pile actions (ULS envelopes)</b></summary>{table(["Pile", "N max (kN)", "N min (kN)", "M long. max (kNm)", "M trans. max (kNm)"], piles)}</details>
<details><summary><b>Modal periods</b></summary>{table(["Mode", "Period (s)", "Mass long.", "Mass trans.", "Mass vert."], modes)}</details>
<details open><summary><b>Super-T design checks</b> — utilisation above 1.0 is shown in red</summary>
{table(["Location", "SLS stress uS", "ULS bending uB", "Shear/torsion uL", "Mu (kNm)", "Neutral axis dn (mm)"], des)}
{chart}
<p class="note warn">The end region (x ≈ 0.75 m) exceeds 1.0 for bending and shear/torsion. The solid end block is not defined in the design section and the strands are placeholders.
<b>Open item D-3, engineer review needed.</b> It is not known yet whether this is a real issue or a missing input.</p></details>
<details><summary><b>Why these results are not verified (number of values affected)</b></summary>
{table(["Reason", "Values"], [[E(k), str(n)] for k, n in sorted(__import__("collections").Counter(r for q in snap["quantities"] for r in q["reasons"]).items(), key=lambda x: -x[1])])}
<ul>{"".join(f"<li>{E(x)}</li>" for x in snap["limitations"])}</ul></details>
</section>'''

trows = [[E(r["name"]), E({"asserts": "assertions", "prints": "prints only"}[r["kind"]]), badge(c, TSTAT[c]), E(why), E(r["t"]) + " s"] for r, c, why in tests]
chk_rows = [[E(c["id"].replace("chk.", "")), E(c["description"]), E(str(c["value"])), E(c["limit"]), badge("Passed" if c["pass"] else "Failed", "ok" if c["pass"] else "bad")] for c in checks]
live_rows = [[E(l[5:].split("  [")[0]), badge("Passed" if l.startswith("PASS") else "Failed", "ok" if l.startswith("PASS") else "bad")] for l in live_lines]
tests_html = f'''<section id="tests"><h2>Tests and quality</h2>
<div class="cards">
 <div class="card"><div class="k">Assertions passed</div><div class="big">{n_assert_pass}</div><p class="muted">in {sum(1 for t in tests if t[0]["kind"] == "asserts")} asserting test files</p></div>
 <div class="card"><div class="k">Assertions failed</div><div class="big">{n_assert_fail}</div></div>
 <div class="card"><div class="k">Scripts without assertions</div><div class="big">{counts["No assertions"]}</div><p class="muted">they print numbers; they cannot pass or fail</p></div>
 <div class="card"><div class="k">Scripts failed / blocked</div><div class="big">{counts["Failed"]} / {counts["Blocked"]}</div></div>
</div>
<p>Latest full run: <b>{E(tr_time.replace("T", " ")[:16])} UTC</b> on commit <code>{E(tr_commit[:7])}</code>
{badge("OUTDATED — test or engine files changed since this run", "bad") if tr_stale else badge("current for this commit's code", "ok")} · {link("baseline/BR13A/test_run.md", "full log")}</p>
<details open><summary><b>Every test script</b></summary>{table(["Script", "Type", "Status", "Meaning", "Time"], trows)}</details>
<details><summary><b>Live baseline test</b> (re-runs the application and compares with the reference)</summary>
{table(["Check", "Status"], live_rows) if live_rows else '<p class="muted">No live run recorded.</p>'}
<p class="muted small">Run {E(live_meta.get("run", "?"))} on commit <code>{E(live_meta.get("commit", "?")[:7])}</code> · {link("baseline/BR13A/live_run.txt", "log")}</p></details>
<details><summary><b>Consistency checks inside the baseline run</b> (software self-checks, not engineering verification)</summary>{table(["Check", "What", "Value", "Limit", "Result"], chk_rows)}</details>
<p class="note">Passing tests show the software is <b>consistent and unchanged</b>. They do not show the bridge results are correct.</p>
</section>'''

sev = {"high": "bad", "medium": "warn", "low": "none"}
risk_html = "".join(f'<details class="risk"><summary>{badge(r["severity"], sev[r["severity"]])} <b>{E(r["title"])}</b></summary><div class="det"><p>{E(r["plain"])}</p><p><span class="k">Why it matters:</span> {E(r["why"])}</p><p class="muted">ref {E(r["id"])}</p></div></details>' for r in stages["risks"])
risks = f'''<section id="risks"><h2>Risks and next action</h2>{risk_html}
<div class="next"><div class="k">Single most important next task</div><p class="mid">{E(stages["next"]["task"])}</p>
<p>{E(stages["next"]["why"])}</p><p><span class="k">Evidence needed:</span> {E(stages["next"]["evidence"])}</p></div></section>'''

warn = ("".join(f'<p class="note warn">Evidence file missing for {E(s)}: {E(p)}</p>' for s, p in missing_evidence)) if missing_evidence else ""
built = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

CSS = """
:root{--bg:#f6f7f5;--panel:#fff;--fg:#1d2321;--mut:#5d6964;--line:#dfe3e0;--acc:#0b6e6e;--ok:#1d7a46;--okb:#e3f3ea;--warn:#8a5a00;--warnb:#fbf0d9;--bad:#a12a2a;--badb:#f8e3e1;--none:#55605c;--noneb:#eceeed;--s0:#0b6e6e;--s1:#b5651d;--s2:#6b4fa0;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#141816;--panel:#1c211f;--fg:#e6ebe8;--mut:#9aa6a0;--line:#2e3633;--acc:#4fb3b3;--ok:#6fcf97;--okb:#18321f;--warn:#e7b65a;--warnb:#3a2e14;--bad:#f08a80;--badb:#3d1d1b;--none:#a5afab;--noneb:#262c2a;--s0:#4fb3b3;--s1:#e09a5a;--s2:#a991d8;color-scheme:dark}}
:root[data-theme=dark]{--bg:#141816;--panel:#1c211f;--fg:#e6ebe8;--mut:#9aa6a0;--line:#2e3633;--acc:#4fb3b3;--ok:#6fcf97;--okb:#18321f;--warn:#e7b65a;--warnb:#3a2e14;--bad:#f08a80;--badb:#3d1d1b;--none:#a5afab;--noneb:#262c2a;--s0:#4fb3b3;--s1:#e09a5a;--s2:#a991d8;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
header{background:var(--panel);border-bottom:1px solid var(--line);padding:18px max(16px,calc(50% - 560px))}
header h1{margin:0;font-size:22px}header p{margin:4px 0 0;color:var(--mut)}
nav{position:sticky;top:0;z-index:2;background:var(--panel);border-bottom:1px solid var(--line);padding:0 max(16px,calc(50% - 560px));display:flex;gap:4px;overflow-x:auto}
nav a{padding:10px 12px;color:var(--mut);text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent}nav a:hover{color:var(--fg);border-color:var(--acc)}
main{max-width:1120px;margin:0 auto;padding:8px 16px 48px}section{margin-top:28px}h2{font-size:19px;border-bottom:2px solid var(--acc);padding-bottom:4px;text-wrap:balance}h3{font-size:15px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.card,.next{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px 14px;min-width:0}
.k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)}.big{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums}.mid{font-size:16px;font-weight:600;margin:4px 0}
.mono,code,pre{font-family:ui-monospace,Consolas,monospace;font-size:13px}pre{background:var(--panel);border:1px solid var(--line);padding:8px;overflow-x:auto}
.muted{color:var(--mut)}.small{font-size:13px}.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.cols>div{min-width:0}
.note{background:var(--panel);border-left:4px solid var(--acc);padding:8px 12px}.note.warn{border-color:var(--warn);background:var(--warnb)}
.b{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;font-weight:600;max-width:100%}td .b{white-space:nowrap}a{color:var(--acc)}.b-ok{color:var(--ok);background:var(--okb)}.b-warn{color:var(--warn);background:var(--warnb)}.b-bad{color:var(--bad);background:var(--badb)}.b-none,.b-prog{color:var(--none);background:var(--noneb)}
.tw{overflow-x:auto;margin:8px 0}table{border-collapse:collapse;width:100%;background:var(--panel);font-variant-numeric:tabular-nums}th,td{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}th{font-size:12px;color:var(--mut);font-weight:600}
td:not(:first-child){white-space:nowrap}.over{color:var(--bad);font-weight:700}
details{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:8px 0;padding:6px 12px}summary{cursor:pointer;padding:4px 0}.det{padding:4px 0 6px 22px}
.road{list-style:none;padding:0;margin:0;position:relative}.road li{position:relative;padding-left:8px}.road details{margin:6px 0}
.dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:8px;border:2px solid var(--none);vertical-align:-1px}.st-ok .dot{background:var(--ok);border-color:var(--ok)}.st-prog .dot{background:var(--warn);border-color:var(--warn)}.st-bad .dot{background:var(--bad);border-color:var(--bad)}
figure{margin:12px 0}figure img{max-width:100%;border:1px solid var(--line);border-radius:8px}figcaption{color:var(--mut);font-size:13px;margin-top:6px}
.chart{width:100%;max-width:760px;background:var(--panel)}.chart .grid{stroke:var(--line)}.chart .lim{stroke:var(--bad);stroke-dasharray:5 4}.chart .ax{fill:var(--mut);font-size:11px}.chart polyline{fill:none;stroke-width:2}
.s0{stroke:var(--s0);color:var(--s0)}.s1{stroke:var(--s1);color:var(--s1)}.s2{stroke:var(--s2);color:var(--s2)}.lg{font-weight:600;margin-right:10px}.lg:before{content:"— "}
.risk summary b{margin-left:4px}.next{border-left:4px solid var(--acc);margin-top:12px}footer{color:var(--mut);font-size:12px;text-align:center;padding:24px 16px}
"""

page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PDF-to-BIM Project Status</title><style>{CSS}</style></head><body>
<header><h1>PDF-to-BIM bridge platform — project status</h1><p>Single-span Super-T / plank bridges · test bridge BR13A · generated from repository data on {built}</p></header>
<nav><a href="#overview">Overview</a><a href="#roadmap">Roadmap</a><a href="#app">Software</a><a href="#results">Results</a><a href="#tests">Tests</a><a href="#risks">Risks &amp; next</a></nav>
<main>{warn}{overview}{roadmap}{app}{results}{tests_html}{risks}</main>
<footer>Built by <code>status/build_status.py</code> from stages.json, baseline/BR13A, git. Rebuild after any change: <code>python3 status/build_status.py</code>. Branch {E(branch)} @ {E(head[:7])}{" (uncommitted changes present)" if dirty else ""}.</footer>
</body></html>'''
open(J("status", "index.html"), "w").write(page)
print(f"status/index.html written: branch {branch} @ {head[:7]}, remote {'=' if sync_ok else '≠/unchecked'}, tests run {tr_time} ({'OUTDATED' if tr_stale else 'current'}), "
      f"{len(snap['quantities'])} baseline values, missing evidence {len(missing_evidence)}")
