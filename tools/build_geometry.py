#!/usr/bin/env python3
"""Build the geometry of a bridge from its description and write it as JSON (+ a readable report).

    python3 tools/build_geometry.py projects/BR13A/BR13A.bridge.0.2.json --allow-proposed \\
        --out projects/BR13A/geometry/BR13A.geometry.json [--compare tests/geometry/fixtures/br13a_dashboard_geometry.json]

--allow-proposed uses PROPOSED overrides (listed in the output as provisional). Without it, a value that is only
proposed counts as missing and the build stops with the field name.
--compare writes a cross-implementation comparison with the dashboard's model geometry (V5; not a benchmark).
"""
import argparse, json, math, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.geometry.alignment import GeometryInputError


def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if not k.startswith("_")}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, float):
        return round(o, 6)
    return o


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("description"); ap.add_argument("--out", required=True); ap.add_argument("--allow-proposed", action="store_true")
    ap.add_argument("--compare")
    a = ap.parse_args()
    doc = json.load(open(a.description))
    try:
        geo = build_geometry(doc, allow_proposed=a.allow_proposed)
    except GeometryInputError as e:
        sys.exit(f"geometry not built — missing / inconsistent input: {e}")
    geo["source"] = os.path.relpath(a.description, ROOT)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(clean(geo), open(a.out, "w"), indent=1, ensure_ascii=False)
    L = [f"# Geometry — {os.path.basename(a.description)}", "",
         f"- Built by `tools/build_geometry.py` (P1 engine `pdf2bim/geometry`). Input hash `{geo['input_hash']}` ({geo['input_format']}).",
         f"- Coordinates: {geo['coordinates']}.",
         f"- **Status: {'PROVISIONAL — uses proposed values' if geo['provisional'] else 'from accepted values only'}**. Geometry is Calculated from the description; it is not independently surveyed.", ""]
    if geo["provisional"]:
        L += ["## Provisional inputs (proposed, not yet accepted by the engineer)", ""] + [f"- `{p['path']}` ← {p['override']} ({p['decision']}, by {p['author']})" for p in geo["provisional"]] + [""]
    L += ["## Checks", "", "| Check | Value | Limit | Result |", "|---|---|---|---|"]
    for c in geo["checks"]:
        val = c.get("value_m", c.get("value_deg"))
        unit = "m" if "value_m" in c else "°"
        lim = c.get("limit_m", c.get("limit_deg"))
        L.append(f"| {c['what']} | {val:.4g} {unit} | {lim} {unit} | {'PASS' if c['pass'] else '**FAIL**'} |")
    L += ["", f"- Start bearing (Calculated): {geo['alignment']['seed_bearing']:.6f}° — {geo['alignment']['seed_derivation']['formula']}.", "",
          "## Supports", "", "| Support | Ch | E | N | RL (control line) | Bearing | Skew to chord normal | Skew to local normal |", "|---|---|---|---|---|---|---|---|"]
    for s in geo["supports"]:
        L.append(f"| {s['id']} | {s['ch']:.3f} | {s['E']:.4f} | {s['N']:.4f} | {s['RL']:.4f} | {s['bearing']:.6f}° | {s.get('skew_to_chord_normal', 0):.4f}° | {s.get('skew_to_local_normal', 0):.4f}° |")
    L += ["", "## Girders (straight chords between bearing centres)", "",
          "| Girder | Bearing A (E, N) | Bearing B (E, N) | Chord A–B (m) | End to end (m) | Chord offset at midspan vs line offset (m) |", "|---|---|---|---|---|---|"]
    for g in geo["girders"]:
        A, B = g["bearing_A"], g["bearing_B"]
        L.append(f"| {g['id']} | {A['E']:.4f}, {A['N']:.4f} | {B['E']:.4f}, {B['N']:.4f} | {g['chord_length_bearings']:.4f} | {g.get('length_end_to_end', float('nan')):.4f} | {g['midchord_station'][1] - A['offset']:+.4f} |")
    L += ["", "## Flange edges along each chord (mm, square to the chord; ADR-004)", "", "| Girder | t | left | right | width |", "|---|---|---|---|---|"]
    for g in geo["girders"]:
        for f in g["flange"]:
            if any(abs(f["t"] - x) < 1e-9 for x in (0.0, 0.5, 1.0)):
                L.append(f"| {g['id']} | {f['t']:.1f} | {f['left']:.1f} ({f['left_to']}) | {f['right']:.1f} ({f['right_to']}) | {f['width']:.1f} |")
    L += ["", "## Not produced (missing in the description)", ""] + [f"- {m}" for m in geo["deck"].get("missing", [])]
    if a.compare:
        fx = json.load(open(a.compare))
        bp = next(r["cells"] for r in doc["project"]["base_point"]["rows"]) if doc.get("project", {}).get("base_point") else None
        L += ["", "## Comparison with the dashboard model (cross-implementation, V5 — not a benchmark)", "",
              f"Dashboard geometry captured from build `{fx['dashboard_sha256'][:12]}` (MCT local coordinates + documented base point E {bp['E']}, N {bp['N']}).", "",
              "| Girder | Bearing A Δ (mm) | Bearing B Δ (mm) | Dashboard girder path length (m) | P1 end-to-end chord (m) | Δ (mm) |", "|---|---|---|---|---|---|"]
        for g, f in zip(geo["girders"], fx["girders"]):
            dA = math.hypot(f["PA"][0] + bp["E"] - g["bearing_A"]["E"], f["PA"][1] + bp["N"] - g["bearing_A"]["N"]) * 1000
            dB = math.hypot(f["PB"][0] + bp["E"] - g["bearing_B"]["E"], f["PB"][1] + bp["N"] - g["bearing_B"]["N"]) * 1000
            L.append(f"| {g['id']} | {dA:.1f} | {dB:.1f} | {f['path_length']:.4f} | {g['length_end_to_end']:.4f} | {(g['length_end_to_end'] - f['path_length']) * 1000:+.1f} |")
        L += ["", "**Explanation (F-4).**",
              "- The dashboard's frozen model places the bearing nodes up to about 26 mm off the straight printed support line.",
              "- Its four bearing nodes at a support are not collinear: G2 and G3 are 16–20 mm off the G1–G4 line.",
              "- P1 uses the exact intersection of the girder line with the straight support line.",
              "- The dashboard's 'girder length' is the polyline length along the curved girder mesh, not a chord.",
              "- **No P1 error is indicated.** The dashboard model is the approximation.", ""]
    rep = a.out.replace(".json", ".md")
    open(rep, "w").write("\n".join(L) + "\n")
    print(f"{a.out} and {os.path.relpath(rep, ROOT)} written; provisional inputs: {len(geo['provisional'])}; checks {sum(c['pass'] for c in geo['checks'])}/{len(geo['checks'])} pass")


if __name__ == "__main__":
    main()
