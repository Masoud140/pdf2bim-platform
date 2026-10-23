# Merge review — branches awaiting the owner's approval (2026-10-23)

**Rule (ADR-013):**
- Nothing is merged into `main` without the owner's review.
- No branch is force-pushed or overwritten.
- The branches are **stacked**: each contains the one before it, and `main` (8a60b74) is an ancestor of all of them. Each merge is therefore a fast-forward with no conflicts.

```
main 8a60b74 ── step-b2-br13a 42dcec7 ── docs/p0-architecture 7d00263 ── p0.1-baseline (this stage)
```

## Recommended merge order

Merge in this order, one at a time, after review: **1 → 2 → 3**. Alternatively, merging 3 alone brings in 1 and 2, but then you review all three together.

### 1. `step-b2-br13a` (3 commits over main)

**Changes:**
- **50af83a:** BR13A in the bridge description format (`projects/BR13A/`: 928 tagged values, decision log), importer, summary tool.
- **76b1823:** dashboard v45. One Super-T definition (`src/gdef.js`); flange widths per girder (gap field, G1 / G4 outer edge on the deck edge); description updated; D-7 superseded.
- **42dcec7:** review brief and the R0–R9 roadmap.

23 files, +15171 / −19. Most of this is the BR13A description JSON.

**Tests (executed):**
- build reproducible (v45 sha256 `710b259d…`);
- schema tests PASS;
- dashboard scripts run (print-only);
- baseline live run on this code: 0 differences vs reference (the code is identical to stage 3).

**Outstanding:**
- 177 Assumed values in BR13A;
- strand / bar layout placeholders (D-1);
- the flare is not applied to model stiffness or design (D-2);
- the review brief's engine claim is corrected in stage 2, not here.

**Review focus:**
- the decision log entries (D-1 … D-33), especially the Assumed values you accepted;
- `docs/BR13A_SPECIFIC.md`.

### 2. `docs/p0-architecture` (1 commit over 1)

**Changes:**
- architecture, development principles, verification strategy, decisions (ADR-001…011), current status;
- roadmap P0–P7;
- README;
- review brief engine correction;
- `__pycache__` removed from git.

10 files, +443 / −20. Documentation only; no code change.

**Tests:** schema tests PASS (re-run after the edits).

**Review focus:** the architecture (layers A–H), the principles, and the ADRs (decision records).

### 3. `p0.1-baseline` (this stage, over 2)

**Changes:**
- **Baseline tooling:** `tools/baseline_snapshot.js`, `tools/compare_snapshot.py`, `tools/summarise_snapshot.py`, `tools/run_suite.py`.
- **Baseline data:** `baseline/BR13A/` (`snapshot.json`, summary, test run record, README).
- **Tests:** `tests/baseline/test_baseline.py`.
- **Decisions recorded:** ADR-008 / 009 updated; ADR-012 … 015 new.
- **New docs:** `FORMAT_0_2_SPEC.md`, `STANDARDS_DATA_SPEC.md`, `P1_GEOMETRY_PLAN.md`, this file.
- **Updated docs:** `VERIFICATION_STRATEGY` §4 (full tolerance table) and §5, `CURRENT_STATUS`, `ROADMAP`, README.

No dashboard code change; the build is unchanged.

**Tests (executed):** see `baseline/BR13A/test_run.md` and VERIFICATION §5:
- baseline comparator: 8 / 8 PASS;
- live run reproduces the reference exactly;
- the perturbed input is detected.

**Outstanding:**
- consistency check H-2 fails (SVG NaN plot errors);
- finding D-3 (end-region utilisation) needs your review;
- format 0.2 (P0.2) and the standards framework (P0.3) are specified but not implemented.

**Review focus:**
- whether the baseline captures the right quantities;
- the tolerance table §4;
- the P1 plan;
- the specs for P0.2 and P0.3.

## After approval

- Merge with `git merge --ff-only <branch>` on `main` (or a GitHub pull request per branch).
- Then tag `baseline-br13a-p0.1` on the merged commit, so the reference code can always be checked out.
