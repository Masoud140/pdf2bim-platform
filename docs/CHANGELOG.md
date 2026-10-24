# Changelog

Meaningful project changes, newest first. Details are in the linked documents and commits.

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
