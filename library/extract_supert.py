#!/usr/bin/env python3
"""Extract the Super-T product data that the dashboard hard-codes into library/products/supert.json.

    python3 library/extract_supert.py

Sources (exact code locations recorded): STD (T1–T5 type dimensions), SD (shared shape defaults), PUB (published
section property table) in base/BR13A_grillage_dashboard_v15.html. Every item is status "code-extracted-unverified":
the values come from the earlier workbook port and have NOT been checked against the TfNSW Super-T standard drawings.
"""
import json, os, re, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = "base/BR13A_grillage_dashboard_v15.html"


def js_value(txt, name):
    """Evaluate the JS literal assigned to `const <name>=` with Node (no regex parsing of the values)."""
    m = re.search(r"const " + name + r"=", txt)
    if not m:
        raise SystemExit(f"{name} not found in {SRC}")
    start = m.end()
    depth, i = 0, start
    while True:
        c = txt[i]
        if c in "[{":
            depth += 1
        elif c in "]}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    lit = txt[start:i + 1]
    line = txt.count("\n", 0, m.start()) + 1
    out = subprocess.run(["node", "-e", f"console.log(JSON.stringify({lit}))"], capture_output=True, text=True, check=True).stdout
    return json.loads(out), line


def main():
    txt = open(os.path.join(ROOT, SRC), encoding="utf-8").read()
    std, l1 = js_value(txt, "STD")
    sd, l2 = js_value(txt, "SD")
    pub, l3 = js_value(txt, "PUB")
    lib = {"format": "pdf2bim.library/0.1", "product": "Super-T",
           "note": "Product data hard-coded in the dashboard (workbook SectionDesigner port). NOT verified against the TfNSW standard drawings.",
           "status": "code-extracted-unverified",
           "source": {"types": f"{SRC}:{l1} (STD)", "defaults": f"{SRC}:{l2} (SD)", "published_properties": f"{SRC}:{l3} (PUB)"},
           "units": "mm, mm^2, mm^4; S = web slope (horizontal run per unit... as coded: x = bw/2 + y/S); rho t/m3",
           "parameters": {"D": "overall depth", "bw": "soffit width", "tw": "web thickness (normal to the web)", "d1": "bottom flange: web-junction height above d2",
                          "d2": "bottom flange thickness at the centreline", "b1": "void floor half-width (as tabulated; secGeom recomputes it)", "b2": "tabulated top width",
                          "ttf": "top flange thickness", "S": "web slope factor", "fW": "outer fillet width on the flange underside", "fD": "outer fillet depth on the web",
                          "r": "top recess size (open flange)", "ifW": "void top fillet width", "ifD": "void top fillet depth", "ch": "bottom chamfer"},
           "types": {k: {kk: vv for kk, vv in v.items() if kk != "span"} for k, v in std.items()},
           "span_range": {k: v.get("span") for k, v in std.items()},
           "defaults": {k: v for k, v in sd.items() if k not in ("Wmin", "Wmax", "rho")},
           "flange_width_limits": {"min": sd.get("Wmin"), "max": sd.get("Wmax")},
           "density_t_per_m3": sd.get("rho"),
           "published_properties": [dict(zip(["flange", "W", "type", "A", "yb", "I", "mass_t_per_m"], r)) for r in pub]}
    os.makedirs(os.path.join(ROOT, "library", "products"), exist_ok=True)
    json.dump(lib, open(os.path.join(ROOT, "library", "products", "supert.json"), "w"), indent=1)
    print(f"library/products/supert.json: {len(lib['types'])} types, {len(lib['published_properties'])} published rows (code-extracted-unverified)")


if __name__ == "__main__":
    main()
