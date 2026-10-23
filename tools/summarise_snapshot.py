#!/usr/bin/env python3
"""Write a readable summary of a baseline snapshot.

    python3 tools/summarise_snapshot.py baseline/BR13A/snapshot.json > baseline/BR13A/SNAPSHOT_SUMMARY.md
"""
import json, sys, collections

d = json.load(open(sys.argv[1]))
Q = {q["id"]: q for q in d["quantities"]}
v = lambda k, f="{:.1f}": (f.format(Q[k]["value"]) if k in Q else "-")
r = d["run"]
o = []
o += [f"# BR13A baseline snapshot — summary", "",
      "> **Status: INDICATIVE.** Every value below is a reproducible output of the current software. None is a verified engineering result. "
      "Reasons are recorded per quantity in `snapshot.json` (field `reasons`).", "",
      "## Run record", "",
      f"- Created: {r['created']} ({r['duration_s']} s)",
      f"- Git: `{r['git']['commit']}` on `{r['git']['branch']}` (tracked files modified: {r['git']['dirty']})",
      f"- Dashboard: `{r['dashboard']['file']}` sha256 `{r['dashboard']['sha256']}`",
      f"- Embedded .mct sha256 `{r['inputs']['embedded_mct_sha256']}`",
      f"- Bridge description sha256 `{r['inputs']['bridge_description_sha256']}`; decision log `{r['inputs']['decision_log_sha256']}`",
      f"- Note: {r['inputs']['note']}",
      f"- Environment: Node {r['environment']['node']}, Playwright {r['environment']['playwright']}, Chromium {r['environment']['chromium']}",
      f"- Command: `{r['command']}`",
      f"- Quantities: {len(d['quantities'])}", ""]
o += ["## Consistency checks (evaluated in the run)", "", "| Check | Value | Limit | Result | Basis |", "|---|---|---|---|---|"]
o += [f"| {c['id']} — {c['description']} | {c['value']} | {c['limit']} | {'PASS' if c['pass'] else '**FAIL**'} | {c['basis']} |" for c in d["checks"]]
o += ["", "These checks test the software's internal consistency (statics, closed-form comparisons). They do not validate the inputs or the engineering rules.", ""]
o += ["## Geometry and sections", "", "| Girder | Chord length (m) | Offset (m) | Self-weight midspan uz (mm) |", "|---|---|---|---|"]
for g in range(1, 5):
    o.append(f"| G{g} | {v(f'geom.G{g}.chord_length','{:.4f}')} | {v(f'geom.G{g}.offset','{:.4f}')} | {Q[f'selfweight.G{g}.midspan_uz']['value']*1000:.2f} |")
o += ["", f"- Design section (Girder definition): D {v('design.section.D','{:.0f}')} mm, deck {v('design.section.tD','{:.0f}')} mm, deck width {v('design.section.Wd')} mm, "
      f"A {v('design.section.A','{:.0f}')} mm², I {Q['design.section.I']['value']:.4e} mm⁴, yb {v('design.section.yb')} mm, strands {v('design.section.nStrands','{:.0f}')} (placeholder)",
      f"- Pile head stiffness: model {v('pile.head_stiffness.model')} kN/m, Hetenyi hand {v('pile.head_stiffness.hand')} kN/m", ""]
o += ["## Modal (first 6 modes)", "", "| Mode | T (s) | Meff L | Meff T | Meff V |", "|---|---|---|---|---|"]
for i in range(1, 7):
    o.append(f"| {i} | {v(f'modal.mode{i}.T','{:.3f}')} | {v(f'modal.mode{i}.meff_L','{:.3f}')} | {v(f'modal.mode{i}.meff_T','{:.3f}')} | {v(f'modal.mode{i}.meff_V','{:.3f}')} |")
o += ["", f"- Total mass {v('modal.mass_total_L')} t", ""]
o += ["## Bearing vertical reactions (kN, compression +)", "", "| Bearing | DL | SDL | M1600 max | ULS max | ULS min | SLS max |", "|---|---|---|---|---|---|---|"]
for k in sorted({q.split('.')[1] for q in Q if q.startswith('brg.') and '.V.' in q}):
    b = f"brg.{k}.V"
    o.append(f"| {k.replace('_',' ')} | {v(b+'.DLc','{:.0f}')} | {v(b+'.SDLp','{:.0f}')} | {v(b+'.M1600.max','{:.0f}')} | {v(b+'.ULS.max','{:.0f}')} | {v(b+'.ULS.min','{:.0f}')} | {v(b+'.SLS.max','{:.0f}')} |")
o += ["", "## Girder actions (envelope over the girder's elements; kNm / kN)", "", "| Girder / quantity | DL max | SDL max | M1600 max | ULS max | ULS min | SLS max |", "|---|---|---|---|---|---|---|"]
for g in range(1, 5):
    for t in ["GM1", "GV", "GT"]:
        b = f"girder.G{g}.{t}"
        if b + ".DLc.max" in Q:
            o.append(f"| G{g} {t} | {v(b+'.DLc.max','{:.0f}')} | {v(b+'.SDLp.max','{:.0f}')} | {v(b+'.M1600.max','{:.0f}')} | {v(b+'.ULS.max','{:.0f}')} | {v(b+'.ULS.min','{:.0f}')} | {v(b+'.SLS.max','{:.0f}')} |")
o += ["", "## Pile actions (ULS envelope over the pile length)", "", "| Pile | N max | N min | Ml max | Ml min | Mt max | Mt min |", "|---|---|---|---|---|---|---|"]
for p in sorted({q.split('.')[1] for q in Q if q.startswith('pile.') and q.endswith('.ULS.max') and not q.startswith('pile.head')}):
    b = f"pile.{p}"
    o.append(f"| {p} | {v(b+'.N.ULS.max','{:.0f}')} | {v(b+'.N.ULS.min','{:.0f}')} | {v(b+'.Ml.ULS.max','{:.0f}')} | {v(b+'.Ml.ULS.min','{:.0f}')} | {v(b+'.Mt.ULS.max','{:.0f}')} | {v(b+'.Mt.ULS.min','{:.0f}')} |")
o += ["", "## Super-T design (design locations)", "", "| Location | uS (SLS) | uST | uB (ULS bending) | uL (shear/torsion) | Mu (kNm) | φMu (kNm) | dn (mm) |", "|---|---|---|---|---|---|---|---|"]
for l in ["LC1", "LC2", "LC3", "LC4"]:
    b = f"design.{l}"
    o.append(f"| {l} | {v(b+'.uS','{:.3f}')} | {v(b+'.uST','{:.3f}')} | {v(b+'.uB','{:.3f}')} | {v(b+'.uL','{:.3f}')} | {v(b+'.Mu','{:.0f}')} | {v(b+'.phiMu','{:.0f}')} | {v(b+'.dn','{:.1f}')} |")
st = sorted({q.split('.')[1] for q in Q if q.startswith('design.station')})
mx = {p: max((Q[f'design.{s}.{p}.max']['value'], Q[f'design.{s}.x']['value']) for s in st if f'design.{s}.{p}.max' in Q) for p in ['uS', 'uB', 'uL']}
o += ["", f"- Along the girder ({len(st)} stations, all design combinations): max uS {mx['uS'][0]:.3f} at x = {mx['uS'][1]:.2f} m; "
      f"max uB {mx['uB'][0]:.3f} at x = {mx['uB'][1]:.2f} m; max uL {mx['uL'][0]:.3f} at x = {mx['uL'][1]:.2f} m", ""]
o += ["## Limitations recorded in the snapshot", ""] + [f"- {x}" for x in d["limitations"]]
cnt = collections.Counter(rr for q in d["quantities"] for rr in q["reasons"])
o += ["", "## Why the values are indicative (count of quantities per reason)", "", "| Reason | Quantities |", "|---|---|"] + [f"| {k} | {n} |" for k, n in cnt.most_common()]
print("\n".join(o))
