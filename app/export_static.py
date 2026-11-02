#!/usr/bin/env python3
"""Read-only online copy of the web app: every GET the front end makes, saved as JSON next to the page.

    python3 app/export_static.py OUT_DIR [--data app_data]

OUT_DIR gets index.html (CSS inlined), app.js and data/... . Drawings and their page images are NOT exported (they
are confidential); upload and run buttons are hidden in this copy."""
import argparse, datetime, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import server


def key(url):  # same mapping as staticKey() in app/web/src/api.ts
    return url.lstrip("/").replace("?", "__").replace("=", "-").replace("&", "__") + ".json"


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--data", default=server.DATA)
    a = ap.parse_args()
    server.DATA = os.path.abspath(a.data)
    c = server.app.test_client()
    urls = ["/api/projects"]
    for p in c.get("/api/projects").get_json():
        b = f"/api/projects/{p['id']}"
        urls += [f"{b}/values?allow_proposed=1", f"{b}/runs/latest", f"{b}/decisions", f"{b}/verification", f"{b}/revisions"]
        urls += [f"{b}/results/{n}" for n in ("model_view.json", "combined_actions.json", "girder_checks.json", "sections.json")]
        urls.append(f"{b}/drawings")
    os.makedirs(os.path.join(a.out, "data"), exist_ok=True)
    files = []
    for u in urls:
        r = c.get(u)
        assert r.status_code == 200, (u, r.status_code)
        body = r.get_data()
        if u.endswith("/drawings"):          # list only, no files: drawings stay local
            body = b'{"files": [], "documents": []}'
        f = os.path.join(a.out, "data", key(u))
        os.makedirs(os.path.dirname(f), exist_ok=True)
        open(f, "wb").write(body); files.append(os.path.relpath(f, a.out))
    shutil.copy(os.path.join(HERE, "static", "app.js"), os.path.join(a.out, "app.js"))
    css = open(os.path.join(HERE, "static", "style.css")).read()
    commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=HERE, capture_output=True, text=True).stdout.strip()
    taken = datetime.date.today().isoformat()
    open(os.path.join(a.out, "index.html"), "w").write(
        f'<title>PDF2BIM Bridge Workbench</title>\n<style>\n{css}\n</style>\n<div id="app"><p style="padding:24px">Loading…</p></div>\n'
        f'<script>window.PDF2BIM_STATIC = {{"taken": "{taken}", "commit": "{commit}"}};</script>\n<script type="module" src="app.js"></script>\n')
    print(f"{len(files)} data files, app.js, index.html -> {a.out}")
    return files


if __name__ == "__main__":
    main()
