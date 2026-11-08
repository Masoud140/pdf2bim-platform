"""Build Bridge Studio into one self-contained HTML page (studio/dist/bridge_studio.html).

Engines and core are inlined in one script element (also used to start the analysis Web Worker);
three.js loads from the CDN; the PDF and spreadsheet libraries load on first export.
"""
import json
import pathlib

H = pathlib.Path(__file__).resolve().parent
ENGINES = ["engines/seclib.js", "engines/hog_engine.js", "engines/dsg_engine.js", "engines/dsg_engine2.js", "src/core.js", "src/analysis.js"]
UI = ["src/ui_base.js", "src/ui_app.js", "src/ui_tabs2.js", "src/ui3d.js", "src/ui_report.js", "src/ui_ai.js", "src/ui_main.js"]
CDN = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
       "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"]


def read(p):
    s = (H / p).read_text()
    assert "</script" not in s.lower(), p + " contains a closing script tag"
    return s


def build():
    tpl = json.loads((H / "tests/fixtures/hog_snap.json").read_text())["p"]
    out = ['<title>Bridge Studio</title>',
           '<meta name="claude:viewport-fit-sides" content="cover">',
           '<meta name="description" content="Super-T bridge analysis and design on generic case studies: grillage, moving loads, prestress, checks, reports.">',
           '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">',
           '<style>' + read("src/ui.css") + '</style>',
           '<div class="bs" id="bs"><div class="empty" style="margin:40px">Loading Bridge Studio…</div></div>']
    out += ['<script src="%s"></script>' % u for u in CDN]
    out.append('<script id="bs-engines">\n' + "\n".join(read(p) for p in ENGINES) + '\n</script>')
    out.append('<script>\n' + read(UI[0]) + '\nU.TPL = ' + json.dumps(tpl, separators=(",", ":")) + ';\n' + "\n".join(read(p) for p in UI[1:]) + '\n</script>')
    d = H / "dist"
    d.mkdir(exist_ok=True)
    (d / "bridge_studio.html").write_text("\n".join(out))
    return d / "bridge_studio.html"


if __name__ == "__main__":
    p = build()
    print(p, p.stat().st_size, "bytes")
