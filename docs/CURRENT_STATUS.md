# Current status — 2026-10-25

**Resume point:** `NEXT_SESSION.md`. **Visual overview:** `status/index.html` (generated; rebuild with `python3 status/build_status.py`).

**Stage:** P0.2 → P2, **P3a** (superstructure model + Python solver) and **P3b** (integrated model with substructure + elastomeric bearings, SDL case, MIDAS .mct writer, modes) completed 2026-10-24. **P3c** load cases (traffic, imposed strains, horizontal, wind, earthquake) and **AS 5100.2 combinations** done (2026-10-25). P3c close-out (girder and sill responses, combined-action schedule) done; P4 plan drafted (`P4_PLAN.md`); **P4.1 concurrent traffic actions, P4.2 concurrent combinations and P4.3 signed earthquake / pile resultants done** (branch `p4-verification`). P4.5 stage 1 (flexural strength in Python) done. **Next: P4.5 stage 2** (P4.4 MIDAS waits for the owner). The BR13A .mct awaits the engineer's import test. P0 → P3a await owner review (non-blocking, ADR-018). No dashboard engine code has been changed.

## Branches

| Branch | Commit | Content | State |
|---|---|---|---|
| `main` | 8a60b74 | Step A (sources, build, tests) + B1 (format) | protected by rule: merge only after review |
| `step-b1-format` | 8a60b74 | same as main | merged |
| `step-b2-br13a` | 42dcec7 | B2 BR13A description, v45 one Super-T definition, review brief | **awaiting review / merge** |
| `docs/p0-architecture` | 7d00263 | P0 docs: architecture, principles, verification, decisions, status | awaiting review |
| `p0.1-baseline` | 0d36579 | P0.1 baseline snapshot + tools + tests; decisions ADR-008…015; specs for format 0.2, standards data, P1 | awaiting review (see `MERGE_REVIEW.md`) |
| `p0.2-format` | f1fdc7a | P0.2 format 0.2: c14n + hash, 0.2 schema, rules, migration, BR13A 0.2, example, 47 tests | awaiting review |
| `p0.3-standards` | ff93af7 | P0.3 standards framework: 63 entries (unverified), accessor, review register, 28 tests | awaiting review |
| `p1-geometry` | 5e91a8f | P1 geometry engine (Python), 36 tests, BR13A geometry (provisional, D-34) | awaiting review |
| `p2-sections` | e476e99 | P2 sections (Python), product library, 24 tests, BR13A section table (provisional, D-35/D-36); test records | awaiting review |
| `p4-verification` | see `git log` (from `p3-model` @ c378d73) | P4 plan; P4.1 concurrent traffic actions; P4.2 concurrent combinations | working branch |
| `p3-model` | c378d73 (from e476e99) | P3a solver + superstructure builder; P3b integrated model, SDL, .mct, modes; P3c load cases and AS 5100.2 combinations; BR13A comparisons with the frozen model (provisional, D-34…D-41) | awaiting review |

## What works today (BR13A)

- An offline dashboard (v45, about 3.5 MB HTML, reproducible build) runs the complete chain in the browser:
  - takeoff → grillage → integrated substructure → stages → traffic → loads (earth pressure, braking, centrifugal, temperature, gradient, shrinkage / creep, wind, earthquake RSA) → AS 5100.2 combinations → bearing / pile / headstock actions → Super-T AS 5100.5 checks → Hog → Word / Excel / MIDAS exports.
- BR13A is described in the bridge format:
  - 928 tagged values. Catalogue values: Assumed 177, Calculated 92, Direct 70, Standard-verify 62, Model 50, Input-user 24, Missing 10, Confirmed 4.
  - 33 decisions: 32 accepted, 1 superseded.

## Known issues and gaps (ids used in the roadmap)

| Id | Issue | Layer |
|---|---|---|
| B-1 | The dashboard does not read or write the bridge description; it reads its own embedded data | B / H |
| B-2 | No revision / hash in the description; no run records; no "significance"; original value kept only in the log (ADR-008) | B |
| C-1 | No geometry engine on the description; geometry is spread across dashboard JavaScript | C |
| C-2 | The mesh puts girders on offset curves, not straight chords (up to 265 mm at BR13A midspan) | C / E |
| D-1 | Strands and bars are placeholders (TfNSW T4 standard layout); BR13A strand drawings are not in the set | D |
| D-2 | Flared flange widths are not applied to model stiffness or design | D / E |
| E-1 | Design engine: neutral-axis depth 8 % off the worked-example targets, Mu agrees. Investigated (P4.5): the targets have no recorded source and their section properties do not match the section (I ×12.6); the engine is exact against closed forms. **Owner: source of the worked example, or another referenced example** | F / data |
| E-2 | No model builder: a frozen BR13A MIDAS .mct is patched; members are found by BR13A names and file order | E |
| F-1 | Approximations: separate traffic M/V/T envelopes; unsigned earthquake; pile √(Ml²+Mt²); pedestrian 0; stage roll restraint (ARCHITECTURE §4) | F |
| F-2 | Standards values are constants in the JS code. They are now inventoried in `standards/` (75 entries incl. traffic and combination constants, unverified), but the dashboard does not read them from there; traffic / DLA / crack-control constants are not inventoried yet | F |
| F-3 | Node-line / section-offset level question (MEMBER_PROPERTIES_METHOD §12) unresolved | E |
| G-1 | Tests print instead of asserting; no regression snapshot; no independent MIDAS model of the integrated structure | G |
| A-1 | Extraction (agent spec, Excel takeoff) is not connected to the bridge description | A |
| H-1 | No decision UI; decisions are written by hand / script | H |
| R-1 | 177 Assumed values in BR13A need engineer decisions or data | data |
| X-1 | `schema/__pycache__` was committed (removed in 7d00263) | repo |
| H-2 | Plots drawn with NaN / Infinity coordinates: 88 SVG console errors per baseline run (baseline check `chk.no_svg_nan` fails) | H |
| D-35/36 | BR13A Super-T shape rows (incl. ttf 90) and haunch (Assumed 0) only proposed; sections provisional | data |
| D-34 | BR13A support-line bearing (44.029166°) only proposed; geometry provisional until the engineer accepts it | data |
| F-4 | Dashboard model bearing nodes up to 26 mm off the straight support line; not collinear | E |
| F-5 | BR13A abutment-drawing bearing positions (DRG 202100 / 202101) differ from the GA girder setout by 50–530 mm along the line of bearings; model uses the GA (P1) positions. **Engineer to resolve** | data / C |
| F-6 | BR13A drawn seat-to-soffit gap 100–127 mm vs Assumed bearing height 150 mm (haunch Assumed 0, D-36); model uses the drawn levels | data |
| H-3 | Dashboard modal / earthquake RSA mass weights every member, including the deck strips and dummies already inside the composite girders: +836 kN (+9.8 % mass), periods up to ~9 % long. Dashboard engine not changed (needs a baseline re-run) | H / F |
| H-4 | Dashboard traffic default lane layout packs the lanes at the left kerb and never sweeps: G4 max M ×1.33, G3 ×1.09, bearings A-G4 ×3.15, B-G4 ×2.49, A-G3 ×1.66 understated in its default results. **Engineer decision on the dashboard / any results already used** | H / F |
| H-5 | Dashboard traffic load distribution: off-line bearing nodes become one-node 'lines' that collect all load at their offset: inner-bearing traffic reactions overstated (up to +44 %), girder moments understated (1–6 %) | H / F |
| M-1 | BR13A SDL bearing split at abutment A: P3b vs frozen −11 … +25 %; the load distribution alone agrees within 8 %, so the difference is in the models. Check in the independent MIDAS model (P4) | E |
| M-2 | BR13A horizontal modes: P3b 8 % (longitudinal) / 5 % (transverse) shorter than frozen; vertical +0.6 %. Suspected bearing-link idealisation, unconfirmed | E |
| X-2 | MIDAS .mct: ELASTICLINK / SPRING syntax unverified; nodal loads not written (no *CONLOAD syntax). Needs an engineer import test and one native export with a nodal load, a spring and a link | E / interop |
| M-3 | BR13A temperature / shrinkage restraint forces at the fixed abutment depend strongly on the bearing idealisation (P3b vs frozen: H −30 %, vertical couples +35 … +80 %). The fixed-abutment sill moment in the combinations is restraint-dominated: P3c 2153 vs dashboard 4254 kN·m. Check in MIDAS (P4) and with the restraint-block detail | E |
| H-6 | Dashboard wind lever arms measured from the deck top while its nodes are at the girder top (0.2 m low) | H (minor) |
| H-7 | Dashboard vertical-wind distribution measured from the deck centre, ignores line lengths: total ±0.9 % | H (minor) |
| M-4 | BR13A combined minimum bearing force at A-G4 on the P3b model: ULS −162 kN (uplift), SLS −37 kN (dashboard +64 / +265). Largest relief: shrinkage / creep (Assumed 300e-6) through the fixed-abutment restraint (M-3). **Engineer to check** (MIDAS, bearing / restraint detail) | E / F |
| P4-1 | BR13A pile moment extremes (ULS) are all earthquake-governed; P4.3 gives concurrent pile actions (CQC most probable) and the response-ellipse resultant (0.85–0.87 of the earlier √ approximation): **method (ADR-031) for the engineer to confirm**. Bearing A-G4 at its uplift minimum carries concurrent tr −1124 / lon +1145 kN | F |
| H-8 | Dashboard combinations keep the pedestrian action selected with no load case (BR13A pedestrian Missing-Flagged): 1142 terms silently zero. The platform lists unanalysed actions instead | H (minor) |
| D-39…41 | BR13A sill setout, elastomer layer 12 mm (Assumed), bearing seat RLs — proposed; integrated model provisional | data |
| D-3 | Design end region: max uB 1.171 and uL 3.966 at x = 0.75 m; no solid-end zones defined in the design section (`zones` empty). Indicative (placeholder strands); **engineer review needed** | D / F |

## Baseline (P0.1)

- `baseline/BR13A/`: the reference snapshot (953 indicative quantities, 15 consistency checks: 14 PASS, 1 FAIL H-2), a readable summary, the test-run record and reproduction commands.
- All quantities are **indicative**. None is a verified reference result yet.
- Latest full test run: `baseline/BR13A/test_run.md` (commit `2811b27`). Live baseline test: `baseline/BR13A/live_run.txt` (11/11 PASS). Audit: `P0.1_AUDIT_REPORT.md`.

## P0.2 (format 0.2), done 2026-10-24

- **Tests:**
  - `tests/schema/test_format_0_2.py`: 47 / 47 PASS. Every rejection test asserts its own rule code.
  - Existing tests unchanged: schema 17 / 17, baseline 8 / 8.
- **BR13A:** `BR13A.bridge.0.2.json`; all 928 values, units, tags and statuses unchanged; 4 originals rebuilt (D-6).
- **Flagged for the engineer** (`BR13A.bridge.0.2.migration.md`):
  - the original unit of the D-6 value 34950 was not recorded (probably mm);
  - D-8's earlier section is not assigned to a single field;
  - no significance levels have been set.

## P0.3 (standards-data framework), done 2026-10-24

- `standards/`: 63 inventoried entries, **all `code-extracted-unverified`**, 27 flagged for specialist review (`standards/REVIEW_REGISTER.md`).
- `tests/standards/test_standards.py`: 28 / 28 PASS. The inventory equals the code, checked by independent Node evaluation of the code literals.
- **Limitation:** the JavaScript dashboard still uses its own constants. Python engines must use `Standards.get()`.

## P1 (geometry engine), done 2026-10-24

- `pdf2bim/geometry/` (Python): `tests/geometry/test_geometry.py` 36 / 36 PASS. The 4 closed-form validation cases are within 1 mm.
- **BR13A** (`projects/BR13A/geometry/BR13A.geometry.md`):
  - misclosure ≤ 2.2 mm;
  - base point 0.3 mm;
  - deck widths equal the dashboard to 2 mm.
- **BR13A geometry is PROVISIONAL:** it uses the proposed support bearing **D-34** (engineer acceptance needed).
- **Findings:**
  - the skew is chord-referenced;
  - F-4: dashboard bearing nodes are up to 26 mm off the support line;
  - the baseline's "chord_length" is a mesh path length.

  Details in `P1_GEOMETRY_METHOD.md` §3.

## P2 (sections), done 2026-10-24

- `pdf2bim/sections/`: `tests/sections/test_sections.py` 24 / 24 PASS. 30 published Super-T rows within 0.47 %; exact torsion benchmarks met.
- **BR13A** (`projects/BR13A/sections/BR13A.sections.md`):
  - the one definition equals the dashboard exactly;
  - the G2 / G3 composite equals the frozen model within 0.1 %;
  - the edge-girder flare now enters the sections (G4 area +8 % at midspan).
- **PROVISIONAL:** uses D-34, D-35 and D-36 (proposed).
- **Found and fixed:** the B2 importer had skipped the Super-T detail rows, including ttf 90 mm.

## Tests (latest full run)

- Commit `5e91a8f`: 23 scripts; 136 / 136 assertions PASS; 18 print-only scripts ran.
- Live baseline 11 / 11.
- Re-run on `5ab04c7` (p2-sections): 24 scripts, 161 / 161 assertions PASS (incl. sections 24, format 48).

## P3a (model + solver), done 2026-10-24

- **Python solver:** equals the dashboard solver on the integrated BR13A model to 7e-10 (V5).
- **Superstructure builder** (model 2 on straight chords): BR13A gives 275 nodes and 514 members. Against the frozen superstructure: weight −1.2 %, midspan deflection ≤ 2 %, bearing reactions ±11 % (explained, `P3_MODEL_METHOD.md` §3).
- **New proposed inputs:**
  - D-37: cross girder 800 × 1065 (engineer query answer);
  - D-38: 2.0 m solid end zones (interpretation pending, Task B-1).

## P3b stage 1–2 (integrated model), done 2026-10-24

- `pdf2bim/model/substructure.py` + `bearings.py`: sill beams on their setout, piles split at rock / ground / layer levels, rock and fill springs, elastomeric bearing links from the Direct seat RLs to the girder soffit.
- **Solver:** now refuses numerically singular systems (a mechanism had been solved silently: 814 m displacement).
- **BR13A vs the frozen integrated model:**
  - weight −0.6 %;
  - bearing Rz within 5.6 %;
  - pile toe Rz within 2.4 %;
  - midspan within 0.3 mm;
  - pile-head stiffness vs Hetényi +1.1 %.

  See `P3_MODEL_METHOD.md` §5.
- **PROVISIONAL:** D-34…D-41. **Findings F-5, F-6** for the engineer.

## P3b stages 3–5 (SDL, .mct, modes), done 2026-10-24

- **SDL** (`pdf2bim/model/loads.py`): exact clipping at the skewed ends; barycentric distribution.
  - BR13A total 897.2 kN vs the dashboard 894.5 kN (+0.3 %).
  - Distribution alone within 8 % per bearing.
- **MIDAS .mct** (`pdf2bim/model/mct.py`): `projects/BR13A/model/BR13A.integrated.mct` + import checklist.
  - Round trip and the dashboard parser both agree.
  - **No MIDAS import yet.**
- **Modes** (`Model.modes`): dashboard AN.modal reproduced to 4.5e-8.
  - BR13A P3b vs frozen: vertical +0.6 %, horizontal −5 … −8 % (M-2).
- **Findings:** H-3, M-1, M-2, X-2 (table above). Details in `P3_MODEL_METHOD.md` §6.

## P3c stage 1 (traffic), done 2026-10-24

- `pdf2bim/model/traffic.py`: influence surfaces; lanes swept; vehicle with variable gap, both directions and lateral shift; patterned UDL; lane factors.
- **Engine reproduces the dashboard to 0.01 %** with its distribution rule.
- **BR13A, M1600 (characteristic, PROVISIONAL):** max girder M G1 3383, G2 3282, G3 3274, G4 3825 kN·m.
- **Findings H-4, H-5** (table above). Details in `P3_MODEL_METHOD.md` §7 and `projects/BR13A/model/BR13A.traffic_vs_frozen.md`.

## P3c stages 2–5 (thermal, horizontal, wind, earthquake), done 2026-10-25

- Modules `thermal.py`, `horizontal.py`, `wind.py`, `earthquake.py`. Each reproduces the dashboard on the dashboard's own model (thermal 3e-7 kN, earthquake 3e-6, load totals equal), with documented corrections (H-3, H-6, H-7, retained height).
- Details in `P3_MODEL_METHOD.md` §8 and `projects/BR13A/model/BR13A.*_vs_frozen.md`.

## Tests (latest full run)

- Commit `b3810a2` (branch `p4-verification`): 37 scripts; **423 / 423 assertions PASS**; 18 print-only scripts ran (`baseline/BR13A/test_run.md`).
- Previous: `9931562`, 417 / 417.
- The run on `37e7f04` had 1 FAIL: the generality guard found "BR13A" in the .mct writer docstring. Fixed in `009ce60` and re-run.

## Next task

**P4.5 design engine, stage 2** (`docs/P4_PLAN.md`): SLS stresses (uncracked / cracked strain plane, prestress state) and the N–M interaction (`src/dsg_engine2.js`) in `pdf2bim/design/`, with closed forms and the port-equals-engine check. Branch `p4-verification`. P4.4 (independent MIDAS model) needs the owner.
