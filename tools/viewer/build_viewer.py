#!/usr/bin/env python3
"""Build the BR13A interactive viewer HTML.

Usage (from repo root):
    python3 tools/viewer/build_viewer.py [--out PATH] [--allow-proposed]

Assembles:
    head.html + <model-data JSON> + body.html + script.js  →  BR13A.viewer.html

The model/design data is extracted by running extract2.py logic (imported
directly). If projects/BR13A/model/viewer_data.json is fresh, it is reused;
otherwise the extraction runs first.

Default output: projects/BR13A/model/BR13A.viewer.html
"""
import argparse, json, os, subprocess, sys, textwrap

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="projects/BR13A/model/BR13A.viewer.html")
    ap.add_argument("--allow-proposed", action="store_true")
    ap.add_argument("--skip-extract", action="store_true",
                    help="Reuse existing viewer_data.json (no model recompute)")
    a = ap.parse_args()

    os.chdir(ROOT)

    data_path = "projects/BR13A/model/viewer_data.json"

    if not a.skip_extract:
        print("Extracting model/design data …")
        cmd = [sys.executable, "tools/viewer/extract2.py", "--out", data_path]
        if a.allow_proposed:
            cmd.append("--allow-proposed")
        r = subprocess.run(cmd, check=True)

    print(f"Reading data from {data_path} …")
    with open(data_path) as f:
        data_json = f.read()

    # --- assemble HTML ---
    vdir = os.path.join(ROOT, "tools", "viewer")
    head = open(os.path.join(vdir, "head.html")).read()
    body = open(os.path.join(vdir, "body.html")).read()
    script = open(os.path.join(vdir, "script.js")).read()

    # three.js r128 + OrbitControls — same versions as the original viewer
    three_cdn = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    orbit_cdn = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"

    flag = ("Indicative · accepted decisions only" if not a.allow_proposed
            else "Indicative · proposed decisions used · not design-approved")

    html = textwrap.dedent(f"""\
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        {head}
        </head>
        <body>
        {body}
        <script id="model-data" type="application/json">{data_json}</script>
        <script src="{three_cdn}"></script>
        <script src="{orbit_cdn}"></script>
        <script>
        {script}
        </script>
        </body>
        </html>
    """)

    # patch the flag text to reflect allow_proposed state
    html = html.replace(
        "Indicative · proposed decisions used · not design-approved", flag
    )

    out = a.out
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

    sz = os.path.getsize(out)
    print(f"Written: {out}  ({sz:,} bytes)")


if __name__ == "__main__":
    main()
