# BR13A single-span bridge platform — dashboard sources

The source of the BR13A offline dashboard (`dist/BR13A_grillage_dashboard.html`, one self-contained HTML file):
- GA-PDF takeoff;
- parametric grillage;
- integrated superstructure + substructure model;
- AS 5100.2 loads and combinations;
- Super-T design checks to AS 5100.5;
- Hog Calculator;
- Word / Excel / MIDAS exports.

This repository is **step A** of turning that work into a reusable platform for single-span Super-T and plank bridges: the sources are kept, the build is reproducible, and the checks can be re-run. See `docs/ROADMAP.md` for the later steps.

> Status: BR13A-specific. Many values and rules are still tied to BR13A (see `docs/BR13A_SPECIFIC.md`). Values not in the drawing set are tagged **Assumed** in the dashboard and listed in its Needs Review tab. None of them are drawing values.

## Build

```bash
./build.sh                       # -> dist/BR13A_grillage_dashboard.html
OUT=/tmp/x.html ./build.sh       # other output path
```

- **Needs:** Python 3 and bash. No network access or npm install.
- **Reproducibility:** the build of commit 1 is byte-identical to the delivered `BR13A_grillage_dashboard_v44.html` (sha256 `4f981dbc5308…`).

**How the build works** (`src/mk19.sh`):
1. `mk17.py` makes `dsg3_ui.js` from `dsg3_sec.js` + `dsg2_ui.js`.
2. An inline step makes `dsg5_ui.js` from `dsg3_ui.js`, overriding functions with `dsg4.js`.
3. `build_v23.py` takes `base/BR13A_grillage_dashboard_v15.html` and:
   - replaces its design-engine block with the engines + `dsg5_ui.js` + exports + `dsg6`…`dsg12`;
   - applies string replacements (with asserts) to the base;
   - adds CSS;
   - appends the `srf`, `sub*` and `srf2` scripts before `</body>`.

**Generated files:** `dsg3_ui.js` and `dsg5_ui.js` are build intermediates (git-ignored). **Edit `dsg3_sec.js` and `dsg4.js`, never the generated files.**

## Tests

The tests are browser runs: Playwright drives Chromium on the built file. Set `DASH=/path/to/file.html` to test another build. Screenshots go to `tests/shots/`.

```bash
npm i -D playwright@1            # once; set PLAYWRIGHT_BROWSERS_PATH or executablePath for Chromium
node tests/sub_t.js              # integrated model: pile head stiffness 2740 vs Hetenyi 2700 kN/m
node tests/sl_t.js               # earth pressure / braking / centrifugal: spring sums = applied loads
node tests/soil_t.js             # soil levels along the columns
node tests/tm_t.js               # uniform temperature: chord elongation / alpha*dT*L ~ 1.00
node tests/tg_t.js               # gradient camber, shrinkage+creep shortening, design combination x
node tests/wd_t.js               # wind cases, totals vs hand
node tests/eq_t.js               # response spectrum (about 40 s)
node tests/rx_t.js               # combined actions: SDL at bearings = applied, bearing schedule (about 75 s)
node tests/x_t.js                # Super-T design combination "x"
node tests/gw_t.js               # deck width along each girder, Hog length from the model
node tests/dg36_t.js             # girder definition tab + design re-run
node tests/engine/dsg_test.js    # section engine vs the worked example (prints model vs target)
```

- Most tests print values against their hand or target values; turning them into pass/fail assertions is on the roadmap.
- The executable path in the scripts is `/opt/pw-browsers/chromium` (the cloud workspace). Change it for a local machine.

## Layout

| Path | What |
|---|---|
| `base/BR13A_grillage_dashboard_v15.html` | Frozen base. It contains the takeoff data (`DATA`), dashboard parameters (`P`), the frozen MIDAS model (`<script id="an_mct_src">`), the analysis solver (`AN`), construction stages, traffic, the Combos builder and the Hog Calculator. Its history is in `history/` |
| `src/dsg_engine.js`, `dsg_engine2.js` | AS 5100.5 fibre / strain-compatibility section engine (SLS, ULS, shear, torsion); node-testable |
| `src/dsg2_ui.js`, `dsg3_sec.js`, `dsg4.js` | Super-T design UI, section definition, girder stations |
| `src/dsg6.js` … `dsg11.js` | Design features: options, analysis views, crack control, zones (open / solid), losses per station, combinations (a) / (b) / gradient |
| `src/dsg12.js` | Design combination **x**: every Combos-tab row at the station (v43) |
| `src/dsg_xl.js`, `dsg_rep.js`, `dsg_calc.js`, `dsg_docx.js`, `xlw.js` | Excel, HTML and Word reports |
| `src/srf.js` | Properties → Girder definition tab (strands, debonding, bars, zones, fitments) |
| `src/srf2.js` | Deck width along each girder (straight between bearings); Hog length and offset follow the model (v44) |
| `src/gdef.js` | One Super-T definition: Section designer shape → Hog section "Girder definition" → design; flange widths per girder (gap, edge setback) (v45) |
| `src/sub.js` | Integrated model: bearings, piles, rock and soil springs, soil levels and layers, hand check (v37–v39) |
| `src/sub2.js` | Earth pressure, traffic surcharge, braking, centrifugal (v38) |
| `src/sub3.js` | Uniform temperature; bearing deformation helper `brgDef` (v39) |
| `src/sub4.js` | Wind (v40) |
| `src/sub5.js` | Earthquake: subspace modes, AS 1170.4 spectrum, CQC + missing mass (v41) |
| `src/sub6.js` | Combined actions: all cases × Combos rows, bearing schedule, pile and headstock envelopes, Needs Review roll-up (v42–v43) |
| `src/sub7.js` | Temperature gradient (fibre-integrated ε0, φ) and shrinkage + creep shortening (v44) |
| `src/dg17.css`, `dg23.css` | Design styles |
| `vendor/docx.iife.js` | docx 9.7.1 (MIT) for the Word export |
| `tests/` | Browser tests, engine worked-example checks |
| `history/` | Earlier build and patch scripts that produced the base (traceability only) |
| `docs/` | Method notes, BR13A-specific list, roadmap |

## Conventions

- **Data tags on every value:** Direct / Calculated / Missing — Flagged / Standard — verify / Input (user) / **Assumed** (orange, value stated next to the input). Project rule: no invented values. An assumed value is allowed only on the engineer's instruction, and it is always shown and rolled up in Needs Review.
- **Load cases are unfactored.** Factors and combinations come from the Combos tab register only (`window.CBX`).
- **Sign conventions:**
  - bearing forces are on the headstock, vertical compression positive, horizontal in bearing axes (longitudinal = along the girder);
  - girder M is sagging positive;
  - pile N is compression positive.

## Related notes (claude.ai project "PDF 2 BIM")
- `docs/INTEGRATED_MODEL_LOADS_METHOD.md`: a copy of the project note for the integrated model, loads and combinations.
- These stay in the project, not this repository:
  - `DATA_SOURCE_CATEGORIZATION_STANDARD.md`, `CONTROL_LINE_RECONSTRUCTION_METHOD.md`, `pdf-ga-extractor.md`, `control-line-dxf-builder.md`: extraction stage;
  - `claude/ANALYSIS_METHOD.md`, `claude/GRILLAGE_PIPELINE_LESSONS.md`, `claude/MCT_EXPORT_METHOD.md`, `claude/MEMBER_PROPERTIES_METHOD.md`, `claude/BARRIER_BOLT_BASIS.md`, `claude/OPEN_ITEMS_AND_READINESS.md`.
