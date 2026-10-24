#!/usr/bin/env python3
"""Inventory the standards values that are currently hard-coded in the dashboard, as standards-data entries.

    python3 standards/extract_from_code.py      # writes standards/data/*.json (regenerates; review fields preserved)

Every entry is created with status "code-extracted-unverified" and the exact code location it came from.
Nothing here is checked against a Standard. The edition / amendment are NOT recorded in the code, so they are
left null and flagged; nothing is guessed. No clause text is copied: only clause numbers and numbers the code uses.

If a data file already exists, review fields (status, review, reference.authorised_source, edition, amendment,
interpretation) of matching ids are kept, but a value that changed in code is reported and its status is reset to
code-extracted-unverified (a reviewed value no longer matches what the code uses).
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "standards", "data")
IMPL_VERSION = "dashboard v45 (src/, base/ at P0.3)"


def find(path, pattern, flags=0):
    """(line number, match) of the first match of pattern in file path."""
    txt = open(os.path.join(ROOT, path), encoding="utf-8").read()
    m = re.search(pattern, txt, flags)
    if not m:
        raise SystemExit(f"pattern not found in {path}: {pattern[:60]}")
    return txt.count("\n", 0, m.start()) + 1, m


def entry(id_, standard, clause, quantity, units, value, applicability, context, used_by, interp=None, specialist=False, table=None):
    return {"id": id_, "standard": standard, "edition": None, "amendment": None,
            "reference": {"clause": clause, "table": table, "figure": None, "authorised_source": None},
            "quantity": quantity, "units": units, "value": value, "applicability": applicability, "context": context,
            "implementation": {"used_by": used_by, "version": IMPL_VERSION},
            "status": "code-extracted-unverified",
            "review": {"reviewer": None, "date": None, "method": None, "notes": None},
            "interpretation": {"open": True, "note": interp or "Edition and amendment not recorded in the code; value not checked against an authorised copy.", "specialist_review": specialist}}


def load_factors():
    path = "base/BR13A_grillage_dashboard_v15.html"
    txt = open(os.path.join(ROOT, path), encoding="utf-8").read()
    rx = re.compile(r"\['([A-Za-z0-9]+)','([^']*)','([A-Z]+)','([^']*)',([\d.]+),([\d.]+),([\d.]+),'([A-Z]+)',([01]),'([^']*)'\]")
    out = []
    for m in rx.finditer(txt):
        line = txt.count("\n", 0, m.start()) + 1
        lid, name, grp, clause, u, b, s = m.group(1), m.group(2), m.group(3), m.group(4), float(m.group(5)), float(m.group(6)), float(m.group(7))
        spec = grp in ("RT", "RL", "EQ", "CO") or lid in ("EPT", "SDLp", "SDLr")
        out.append(entry(f"AS5100.2:load_factor:{lid}", "AS 5100.2", clause, f"load factors for '{name}' (ULS, ULS relieving, SLS)", "-",
                         {"uls": u, "uls_relieving": b, "sls": s},
                         f"action group {grp}; dashboard switch on={m.group(9)}", "combination register (Combos tab, window.CBX) and Super-T design dgFac()",
                         [f"{path}:{line}", "src/dsg2_ui.js:35 (dgFac reads these by regex)"],
                         interp=("Edition / amendment not recorded in the code. " + ("EPT factor is 0 in code: AS 5100.3 governs, not set. " if lid == "EPT" else "")
                                 + "Not checked against an authorised copy."), specialist=spec))
    if len(out) < 40:
        raise SystemExit(f"expected about 50 load-factor rows, found {len(out)}")
    return out


def earthquake():
    line, m = find("src/sub5.js", r"var EQ_CH=\{(.*?)\};")
    tab = {k: [float(x) for x in v.split(",")] for k, v in re.findall(r"(\w+):\[([^\]]+)\]", m.group(1))}
    e = [entry("AS1170.4:spectral_shape:Ch", "AS 1170.4", None, "spectral shape factor Ch(T) — piecewise parameters per site class", "-",
               {"type": "piecewise", "columns": ["Ch(0)", "slope 0-0.1 s", "plateau", "c (T<=1.5 s: c/T)", "c2 (T>1.5 s: c2/T^2)"], "rows": tab},
               "site sub-soil classes Ae-Ee", "earthquake response spectrum (Loads -> Earthquake)", [f"src/sub5.js:{line}", "src/sub5.js:9 eqCh()"],
               interp="Transcribed earlier from memory, not from an authorised copy (gap F-2). Clause / table number not recorded in code. Must be checked.",
               specialist=True)]
    line, m = find("src/sub5.js", r"var EQ=\{kp:([\d.]+), Z:([\d.]+)")
    e.append(entry("AS1170.4:probability_factor:kp_default", "AS 1170.4", None, "probability factor kp used as default (1/2000 annual probability)", "-",
                   float(m.group(1)), "default only; the design return period follows the bridge importance level (AS 5100.2) — project input",
                   "earthquake spectrum", [f"src/sub5.js:{line}"], interp="Default in code; return period and importance level not in the drawing set.", specialist=True))
    return e


def design():
    e = []
    line, m = find("src/dsg_engine.js", r"function gam\(fc\)\{ return Math\.max\(([\d.]+), Math\.min\(([\d.]+), ([\d.]+)-([\d.]+)\*fc\)\); \}")
    e.append(entry("AS5100.5:stress_block:gamma", "AS 5100.5", None, "rectangular stress block depth factor γ = clamp(a − b·f'c, min, max)", "-",
                   {"a": float(m.group(3)), "b": float(m.group(4)), "min": float(m.group(1)), "max": float(m.group(2))}, "f'c in MPa",
                   "ULS bending (fibre engine)", [f"src/dsg_engine.js:{line}"], interp="Form and limits as coded; engine discrepancy E-1 open.", specialist=False))
    line, m = find("src/dsg_engine.js", r"var ecu=([\d.]+)")
    e.append(entry("AS5100.5:strain:ecu", "AS 5100.5", None, "ultimate concrete compressive strain", "-", float(m.group(1)), "ULS strain compatibility",
                   "ULS bending (both engines)", [f"src/dsg_engine.js:{line}", "src/dsg_engine2.js:4"]))
    line, m = find("src/dsg_engine2.js", r"phi:([\d.]+), dn:0")
    e.append(entry("AS5100.5:capacity_factor:phi_tension_point", "AS 5100.5", None, "capacity reduction factor at the pure-tension point of the N-M diagram", "-",
                   float(m.group(1)), "N-M interaction", "ULS bending + axial", [f"src/dsg_engine2.js:{line}"],
                   interp="Value as coded; how φ varies along the N-M curve not reviewed.", specialist=True))
    line, m = find("src/dsg_engine2.js", r"phi=([\d.]+), o=\{\}")
    e.append(entry("AS5100.5:capacity_factor:phi_shear_torsion", "AS 5100.5", None, "capacity reduction factor, shear and torsion", "-",
                   float(m.group(1)), "shear / torsion checks", "ULS shear and torsion", [f"src/dsg_engine2.js:{line}"]))
    return e


def environment():
    e = []
    line, m = find("src/sub4.js", r"var WD=\{V:([\d.]+), rho:([\d.]+), Cd:([\d.]+), hBar:([\d.]+), CL:([\d.]+), eL:([\d.]+), fLon:([\d.]+)")
    e.append(entry("AS1170.2:air_density", "AS/NZS 1170.2", None, "air density ρ", "kg/m3", float(m.group(2)), "wind pressure q = 0.5 ρ V²",
                   "wind (Loads -> Wind)", [f"src/sub4.js:{line}", "src/sub4.js:13 wdQ()"]))
    e.append(entry("AS5100.2:wind:Cd_default", "AS 5100.2", None, "drag coefficient default (should come from the chart for b/d)", "-", float(m.group(3)),
                   "default only — to be read from the chart for the section's b/d", "transverse wind", [f"src/sub4.js:{line}"],
                   interp="Code uses a fixed default instead of the chart value.", specialist=True))
    e.append(entry("AS5100.2:wind:CL_default", "AS 5100.2", None, "lift coefficient default", "-", float(m.group(5)), "vertical wind", "vertical wind",
                   [f"src/sub4.js:{line}"], specialist=True))
    e.append(entry("AS5100.2:wind:longitudinal_fraction", "AS 5100.2", None, "longitudinal wind as a fraction of transverse", "-", float(m.group(7)),
                   "longitudinal wind", "longitudinal wind", [f"src/sub4.js:{line}"], specialist=True))
    line, m = find("src/sub3.js", r"alpha:([\d.e-]+)")
    e.append(entry("AS5100.5:concrete:thermal_expansion", "AS 5100.5", None, "coefficient of thermal expansion of concrete", "1/°C", float(m.group(1)),
                   "uniform temperature and gradient", "temperature (Loads -> Temperature)", [f"src/sub3.js:{line}", "src/sub7.js:10"]))
    return e


# project inputs found next to the standards values: NOT standards data (they belong in the bridge description)
PROJECT_DEFAULTS = [
    ("src/sub4.js", "WD.V = 45 m/s", "design wind speed — site-specific (region, terrain, return period)"),
    ("src/sub5.js", "EQ.Z = 0.08, site 'Ce'", "hazard factor and site class — site-specific"),
    ("src/sub3.js", "TM.Tmax / Tmin / Tset", "shade air temperatures and set temperature — site-specific"),
    ("src/sub7.js", "TG.T0 = 32, eps = 300e-6", "gradient top temperature and shrinkage/creep strain — project / material inputs"),
]


def main():
    groups = {"AS5100.2": load_factors() + [x for x in environment() if x["standard"] == "AS 5100.2"],
              "AS1170.4": earthquake(),
              "AS5100.5": design() + [x for x in environment() if x["standard"] == "AS 5100.5"],
              "AS1170.2": [x for x in environment() if x["standard"] == "AS/NZS 1170.2"]}
    os.makedirs(OUT, exist_ok=True)
    keep = ("status", "review", "edition", "amendment", "interpretation")
    report = []
    for name, entries in groups.items():
        f = os.path.join(OUT, f"{name}.json")
        old = {x["id"]: x for x in json.load(open(f))["entries"]} if os.path.exists(f) else {}
        for x in entries:
            o = old.get(x["id"])
            if o:
                if json.dumps(o["value"], sort_keys=True) == json.dumps(x["value"], sort_keys=True):
                    for k in keep:
                        x[k] = o[k]
                    x["reference"]["authorised_source"] = o["reference"].get("authorised_source")
                else:
                    report.append(f"{x['id']}: value changed in code ({o['value']} -> {x['value']}); status reset to code-extracted-unverified")
        json.dump({"format": "pdf2bim.standards/0.1", "group": name,
                   "note": "Inventory of values hard-coded in the software. NOT verified. See docs/STANDARDS_DATA_SPEC.md.",
                   "entries": sorted(entries, key=lambda e: e["id"])}, open(f, "w"), indent=1, ensure_ascii=False)
    json.dump({"note": "Project-specific inputs found in code next to standards values. They are NOT standards data and belong in the bridge description.",
               "items": [{"file": a, "item": b, "why": c} for a, b, c in PROJECT_DEFAULTS]}, open(os.path.join(OUT, "_project_defaults_not_standards.json"), "w"), indent=1)
    n = sum(len(v) for v in groups.values())
    print(f"standards/data: {n} entries in {len(groups)} files, all code-extracted-unverified unless previously reviewed")
    for r in report:
        print("NOTE", r)


if __name__ == "__main__":
    main()
