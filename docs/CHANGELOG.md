# Changelog

Meaningful project changes, newest first. Details are in the linked documents and commits.

## 2026-10-25 — P4.5 stage 2: SLS strain plane and N–M interaction (branch `p4-verification`)

- **Added:** `pdf2bim/design/sls.py`, `nm.py`; standards entries `AS5100.5:strain:balanced_steel`, `:capacity_factor:phi_compression` (80 entries).
- **Tests:** SLS + N–M 13 (closed forms; port = dashboard engine; 6 / 6 mutations caught).
- **Change vs the dashboard:** a cracked SLS solve starts from the uncracked plane (the zero start can be singular).

## 2026-10-25 — P4.5 stage 1: flexural strength in Python (branch `p4-verification`)

- **Added:** `pdf2bim/design/flexure.py`; standards entries `AS5100.5:stress_block:alpha2`, `:capacity_factor:phi_bending`, `:strand:stress_strain_mattock` (78 entries).
- **Tests:** flexure 13 (closed forms; port = dashboard engine 1e-9; 5 / 5 mutations caught).
- **E-1:** investigated; the worked-example targets have no source and inconsistent section properties — owner item.

## 2026-10-25 — P4.3 signed earthquake and pile resultants (branch `p4-verification`)

- **Added:** `earthquake.covariance()` / `concurrent()`; earthquake primitives with their RSA; `combinations.eq_resultant()`, `pile_eq_resultants()`; pile resultant table in `BR13A.combined_actions.md`.
- **Tests:** earthquake 16, concurrent 17 (4 / 4 new mutations caught).
- **Result:** BR13A pile resultant upper bound 0.85–0.87 of the earlier √ of separate envelopes; pile concurrent actions no longer flagged.

## 2026-10-25 — P4.2 concurrent combinations (branch `p4-verification`)

- **Added:** `combinations.concurrent_row()`, `concurrent_schedule()`; concurrent tables in `tools/combined_actions.py` / `BR13A.combined_actions.md`.
- **Tests:** concurrent 13 (4 / 4 new mutations caught).
- **Findings:** A-G4 uplift minimum comes with large concurrent horizontal forces (tr −1124, lon +1145 kN); pile moment extremes are earthquake-governed (P4.3 needed).

## 2026-10-25 — P4.1 concurrent traffic actions (branch `p4-verification`)

- **Added:** `traffic.governing_state()` / `traffic.concurrent()`; `tools/concurrent_traffic.py` → `projects/BR13A/model/BR13A.traffic_concurrent.md`; `docs/P4_PLAN.md`, `docs/P4_VERIFICATION_METHOD.md`.
- **Tests:** concurrent 8 (5 / 5 mutations caught).
- **Result:** BR13A concurrent girder shear at max sagging 33–49 % of the shear envelope; concurrent pile resultant 0.45–0.98 of the √ envelope bound.

## 2026-10-25 — P3c close-out: girders, sills, combined-action schedule (branch `p3-model`)

- **Added:** girder and sill responses in `pdf2bim/model/responses.py`; `combinations.schedule()`; `tools/combined_actions.py` → `projects/BR13A/model/BR13A.combined_actions.md/.json`; dashboard fixture with its girder / headstock combined actions.
- **Tests:** combinations 35 (5 / 5 new mutations caught).
- **Findings:** fixed-abutment sill moment is restraint-dominated in both models (P3c about half the dashboard's) — part of M-3.

## 2026-10-25 — P3c combinations: AS 5100.2 (branch `p3-model`)

- **Added:** `pdf2bim/model/combinations.py` (generator, evaluation, platform primitives, combined actions) and `responses.py` (shared response set; earthquake and traffic use it); combination constants in the standards inventory (75 entries); `tools/dump_dashboard_combinations.js`, `tools/compare_frozen_combinations.py`; `projects/BR13A/model/BR13A.combinations_vs_frozen.md`.
- **Tests:** combinations 27 (mutation 7 / 7); standards 30.
- **Findings:** M-4 (A-G4 bearing uplift in the combined minimum on the P3b model); H-8 (dashboard combines a pedestrian action that has no load case).

## 2026-10-25 — P3c stages 2–5: imposed strains, horizontal loads, wind, earthquake (branch `p3-model`)

- **Added:** `pdf2bim/model/thermal.py`, `horizontal.py`, `wind.py`, `earthquake.py`; solver `imposed=` (free deformations), `Model.modes(matrices=True)`; dashboard dump tools for each, plus comparisons (`projects/BR13A/model/BR13A.{thermal,horizontal,wind,earthquake}_vs_frozen.md`).
- **Tests:** thermal 20, horizontal 22, wind 14, earthquake 14 (mutation checks all caught).
- **Findings:** M-3 (fixed-bearing restraint forces sensitive to the bearing idealisation); H-6 (dashboard wind levers 0.2 m low); H-7 (dashboard vertical-wind split ±0.9 %).
- **Process:** a local git pre-commit hook now refuses bridge-specific text in `pdf2bim/` (the generality guard had caught it three times).

## 2026-10-24 — P3c stage 1: traffic M1600 / S1600 (branch `p3-model`)

- **Added:**
  - `pdf2bim/model/traffic.py` (influence surfaces, lanes, vehicle, patterned UDL, lane factors, sweep);
  - `Model.stiffness()`;
  - traffic standards entries (`AS5100.2:traffic:*`, unverified) + test;
  - `tools/dump_dashboard_traffic.js`, `tools/compare_frozen_traffic.py`.
- **Tests:** traffic 20 (mutation 4 / 4); standards 29.
- **Findings:**
  - H-4: the dashboard's default lane layout is never swept: G4 M ×1.33, outer bearings up to ×3.15;
  - H-5: one-node bearing "lines" in the dashboard's load distribution: inner-bearing traffic reactions up to +44 %, girder M −1 … −6 %.

## 2026-10-24 — P3b stages 3–5: SDL, MIDAS .mct, modes (branch `p3-model`)

- **Added:**
  - `pdf2bim/model/loads.py` (SDL case);
  - `pdf2bim/model/mct.py` + `tools/export_mct.py` (MIDAS writer; BR13A `.mct` + import checklist);
  - `Model.modes()` (consistent mass, lumped SDL);
  - `Model.solve(loads=...)` (per-solve load case);
  - dashboard dump tools for SDL and modes; `tools/check_mct_dashboard.js`;
  - comparisons `BR13A.sdl_vs_frozen.md` and `BR13A.modes_vs_frozen.md`.
- **Tests:** loads 25, mct 16, modes 10 (mutation checks 4 / 4, 3 / 3, 3 / 3).
- **Findings:**
  - H-3: the dashboard's modal / earthquake mass includes the deck strips (+9.8 %);
  - M-1: SDL bearing split at A differs between the models (distribution alone within 8 %);
  - M-2: P3b horizontal modes 5–8 % shorter than frozen.
- **Roadmap:** the remaining load cases and the combinations move to P3c (ADR-024).

## 2026-10-24 — P3b stage 2: integrated model (branch `p3-model`)

- **Added:**
  - `pdf2bim/model/substructure.py` (sill beams, piles, rock / fill springs, bearing links, pile-head hand check);
  - `pdf2bim/model/bearings.py` (elastomer Ks / Kv via the standards accessor);
  - `tools/compare_frozen_integrated.py`.
- **Solver:** refuses numerically singular systems; `link_force()`. Builder: `bearings="none"` option.
- **Format:** `bearings.items[].seat_rl`, `layer_thickness`; `supports[].headstock_setout`.
- **BR13A:** D-39, D-40, D-41 proposed.
- **Findings:** F-5 (bearing positions disagree between the abutment drawings and the GA, up to 530 mm); F-6 (seat-to-soffit gap 100–127 mm vs the Assumed 150 mm bearing height).
- **Tests:** 35 substructure (4 / 4 mutations caught).
- **Result:** vs the frozen integrated model: weight −0.6 %, bearing Rz ≤ 5.6 %, pile toe ≤ 2.4 %, midspan ≤ 0.3 mm. See `docs/P3_MODEL_METHOD.md` §5.

## 2026-10-24 — P3a model builder + solver (branch `p3-model`)

- **Added:**
  - `pdf2bim/model/solver.py` (3D Timoshenko frame, MIDAS-type links, springs); equals the dashboard solver on the integrated BR13A model to 7e-10;
  - `pdf2bim/model/builder.py` (superstructure grillage, model 2 on straight chords);
  - `tools/compare_frozen_superstructure.py`.
- **Tests:** 11 solver + 17 builder.
- **Format:** `superstructure.cross_girders`; zones kinds `solid_end_A/B`.
- **BR13A:** D-37 (cross girder 800 × 1065) and D-38 (2.0 m solid end zones) proposed. P2 now produces the solid end sections.
- **Result:** the BR13A superstructure vs the frozen model is −1.2 % weight, ≤ 2 % midspan deflection and ±11 % bearing reactions (explained). See `docs/P3_MODEL_METHOD.md`.

## 2026-10-24 — P2 sections and products (branch `p2-sections`)

- **Added:**
  - `pdf2bim/sections/`: polygon properties; Super-T outline port with asymmetric flanges; FD torsion; girder and composite sections along each girder;
  - `library/products/supert.json` (code-extracted, unverified);
  - `tools/build_sections.py`;
  - 24 tests.
- **Format:** `supert_types[].shape` and `haunch`. BR13A D-35 (shape incl. ttf 90) and D-36 (haunch Assumed 0) proposed.
- **Fixed:** the B2 importer skipped the detail shape rows (SDET); fixed for future imports.
- **Results:**
  - 30 published Super-T rows within 0.47 %;
  - BR13A one definition equals the dashboard exactly;
  - G2 / G3 composites equal the frozen model within 0.1 %;
  - the edge-girder flare now changes the sections.
- See `docs/P2_SECTIONS_METHOD.md` and ADR-021.

## 2026-10-24 — P1 geometry engine (branch `p1-geometry`)

- **Added:**
  - `pdf2bim/geometry/`: alignment (clothoid, single-seed integration, vertical parabola), supports, bearing centres, straight chords, deck edges, flange edges;
  - `tools/build_geometry.py`;
  - 36 tests (4 closed-form cases, method known cases, BR13A checks, cross-check with the dashboard).
- **Format:** optional `support_lines.bearing` column. BR13A D-34 proposed (support bearing 44.029166°, structured from the description's own Direct note).
- **Added:** `schema/propose_override.py`, which adds a proposed override as a new revision and keeps history.
- **Findings:**
  - skew is chord-referenced;
  - the dashboard bearing nodes are off the support line by up to 26 mm (F-4);
  - the baseline's "chord length" is a mesh path length.
- See `docs/P1_GEOMETRY_METHOD.md` and ADR-020.

## 2026-10-24 — P0.3 standards-data framework (branch `p0.3-standards`)

- **Added:**
  - `standards/`: extractor, 63 inventoried entries (all `code-extracted-unverified`, each with its code location), accessor with status propagation, generated review register.
  - 28 tests, including an independent Node evaluation of the code literals.
- **Fixed during work:** the extractor's id pattern missed ids with lowercase letters (8 rows, e.g. DLc). It was caught by the independent count.
- See `docs/STANDARDS_DATA_SPEC.md` §5 and ADR-019.

## 2026-10-24 — P0.2 bridge description format 0.2 (branch `p0.2-format`)

- **Added:**
  - format 0.2: immutable `original`, append-only `overrides`, `current`, `significance`, `revision`, content `hash`;
  - canonical JSON (RFC 8785 based) and content hash;
  - rule checker (R1–R7);
  - migration tool.
- BR13A migrated to `BR13A.bridge.0.2.json`. All 928 values are unchanged; 4 originals are rebuilt from decision D-6. The 0.1 file is untouched.
- Worked example (fictional bridge): original 200 mm → proposed 220 mm → approved.
- 47 new test assertions. The existing tests are unchanged (schema 17/17, baseline 8/8).
- See `docs/FORMAT_0_2_SPEC.md` §6 and ADR-017.

## 2026-10-23 — P0.1 baseline, audit, status dashboard (branch `p0.1-baseline`)

- BR13A baseline snapshot (953 indicative values, 15 consistency checks), comparator and live / perturbation tests.
- Audit report (`docs/P0.1_AUDIT_REPORT.md`). Test-harness fix (`dgxl_t`, `dgdoc_t`).
- Status dashboard `status/index.html`, generated from repository data.
- Progress-saving policy (ADR-016), `NEXT_SESSION.md`.

## 2026-10-23 — P0 architecture (branch `docs/p0-architecture`)

- Architecture, development principles, verification strategy, decisions (ADR-001…011), current status, roadmap P0–P7.

## 2026-10-23 — B2 / v45 (branch `step-b2-br13a`)

- BR13A in the bridge description format (928 tagged values, decision log).
- Dashboard v45: one Super-T definition, flange widths per girder.

## 2026-10-23 — A / B1 (`main`)

- Dashboard sources under version control; reproducible build.
- Bridge description format 0.1 and decision log schema.
