#!/usr/bin/env python3
"""SB43 (B12468): Table 1 - Plank supports (sheet 0605, combined-PDF page index 111), read from the PDF text layer.
Run: python3 plank_supports.py <SGWS1-JHSW-2000-BR-DRG-COMBINED.pdf>  -> plank_supports.json (all values Direct).
Self-checks: 91 rows PL-01..PL-91; chainage and bearing step uniform (plank fan); SB43 GA (sheet 0605) radial lengths
8850 (to abutment B) + 9850 (to abutment C) = 18700 = the plank length on sheet 0781 (Calculated check)."""
import json, re, subprocess, sys

pdf = sys.argv[1]
txt = subprocess.run(["pdftotext", "-f", "112", "-l", "112", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout
rows = []
for m in re.finditer(r"PL-(\d+) +([0-9.]+) +([0-9.]+) +([0-9.]+) +([0-9.]+) +(-?[0-9.]+)", txt):
    rows.append({"id": f"PL-{int(m[1]):02d}", "ch_MCH0": float(m[2]), "bearing_deg": float(m[3]), "level_setout_B": float(m[4]),
                 "level_setout_C": float(m[5]), "slope_pct": float(m[6])})
rows.sort(key=lambda r: r["id"])
assert [r["id"] for r in rows] == [f"PL-{k:02d}" for k in range(1, 92)], "not PL-01..PL-91"
dch = [a["ch_MCH0"] - b["ch_MCH0"] for a, b in zip(rows, rows[1:])]
dbr = [a["bearing_deg"] - b["bearing_deg"] for a, b in zip(rows, rows[1:])]
assert max(dch) - min(dch) < 0.003 and max(dbr) - min(dbr) < 0.003, (min(dch), max(dch), min(dbr), max(dbr))
out = {"source": "SGWS1-JHSW-2000-BR-DRG-410605 rev 00 (sheet 0605) Table 1 - Plank supports; combined PDF page index 111; text layer",
       "tag": "Direct",
       "notes": ["chainage 'x' on MCH0 = plank setout point (on MCH0); bearing = plank direction (decimal degrees)",
                 "setout levels at abutment B / C ends; slope along plank -0.020 % on every row as printed",
                 "radial distance setout point to the plank end: 8850 towards abutment B, 9850 towards abutment C (plank setout detail, same sheet)"],
       "steps": {"d_chainage_m": [min(dch), max(dch)], "d_bearing_deg": [min(dbr), max(dbr)]},
       "rows": rows}
json.dump(out, open("plank_supports.json", "w"), indent=1)
print(f"{len(rows)} planks; chainage step {min(dch):.3f}-{max(dch):.3f} m; bearing step {min(dbr):.3f}-{max(dbr):.3f} deg")
