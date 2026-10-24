# Current status — 2026-10-24

**Resume point:** `NEXT_SESSION.md`. **Visual overview:** `status/index.html` (generated; rebuild with `python3 status/build_status.py`).

**Stage:** P0.2 and P0.3 completed 2026-10-24 (branches `p0.2-format`, `p0.3-standards`). **P1 geometry in progress** (`P1_GEOMETRY_PLAN.md`). P0 / P0.1 await owner review (non-blocking, ADR-018). No dashboard engine code has been changed.

## Branches

| Branch | Commit | Content | State |
|---|---|---|---|
| `main` | 8a60b74 | Step A (sources, build, tests) + B1 (format) | protected by rule: merge only after review |
| `step-b1-format` | 8a60b74 | same as main | merged |
| `step-b2-br13a` | 42dcec7 | B2 BR13A description, v45 one Super-T definition, review brief | **awaiting review / merge** |
| `docs/p0-architecture` | 7d00263 | P0 docs: architecture, principles, verification, decisions, status | awaiting review |
| `p0.1-baseline` | 0d36579 | P0.1 baseline snapshot + tools + tests; decisions ADR-008…015; specs for format 0.2, standards data, P1 | awaiting review (see `MERGE_REVIEW.md`) |
| `p0.2-format` | f1fdc7a | P0.2 format 0.2: c14n + hash, 0.2 schema, rules, migration, BR13A 0.2, example, 47 tests | awaiting review |
| `p0.3-standards` | see `git log` (from f1fdc7a) | P0.3 standards framework: 63 entries (unverified), accessor, review register, 28 tests | awaiting review |

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
| E-1 | Design engine: neutral-axis depth 8 % off the worked example, although Mu agrees (VERIFICATION §5) | F |
| E-2 | No model builder: a frozen BR13A MIDAS .mct is patched; members are found by BR13A names and file order | E |
| F-1 | Approximations: separate traffic M/V/T envelopes; unsigned earthquake; pile √(Ml²+Mt²); pedestrian 0; stage roll restraint (ARCHITECTURE §4) | F |
| F-2 | Standards values are constants in the JS code. They are now inventoried in `standards/` (63 entries, unverified), but the dashboard does not read them from there; traffic / DLA / crack-control constants are not inventoried yet | F |
| F-3 | Node-line / section-offset level question (MEMBER_PROPERTIES_METHOD §12) unresolved | E |
| G-1 | Tests print instead of asserting; no regression snapshot; no independent MIDAS model of the integrated structure | G |
| A-1 | Extraction (agent spec, Excel takeoff) is not connected to the bridge description | A |
| H-1 | No decision UI; decisions are written by hand / script | H |
| R-1 | 177 Assumed values in BR13A need engineer decisions or data | data |
| X-1 | `schema/__pycache__` was committed (removed in 7d00263) | repo |
| H-2 | Plots drawn with NaN / Infinity coordinates: 88 SVG console errors per baseline run (baseline check `chk.no_svg_nan` fails) | H |
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

## Next task

**P1:** geometry engine in Python (`P1_GEOMETRY_PLAN.md`). Branch `p1-geometry` from `p0.3-standards`.
