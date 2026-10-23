# Next session — resume here

**Last updated:** 2026-10-23 (end of the P0.1 session).

**Rule:** a new session reads this file first, then `CURRENT_STATUS.md`. It then resumes from the **last verified checkpoint** below, without asking the owner to repeat history. If this file and the repository disagree, the repository (`git log`, the test results) wins. Report the disagreement.

## 1. Last verified checkpoint

| Item | Value | How it was verified |
|---|---|---|
| Working branch | `p0.1-baseline` | `git branch -a -vv` |
| Last commit (pushed) | see `git log -1 origin/p0.1-baseline`. The P0.1 work is commit `a46b21e`; the commit that adds this file follows it | `git fetch` + `git ls-remote origin p0.1-baseline` equals the local HEAD |
| Dashboard build | `./build.sh` → sha256 `710b259d2c7117d0…` (v45) | rebuilt and hashed |
| Baseline | `baseline/BR13A/snapshot.json`, 953 quantities; 15 checks: 14 PASS, 1 FAIL (H-2) | 2 runs identical; live test reproduced the reference exactly; perturbed input detected |
| Tests | `baseline/BR13A/test_run.md` (full run on `2811b27`: 2 asserting files 25/25 PASS; 18 scripts print-only, all ran) and `baseline/BR13A/live_run.txt` (11/11 PASS on `2811b27`) | `python3 tools/run_suite.py`; live test log |
| Audit | `docs/P0.1_AUDIT_REPORT.md`: verdict partially verified (software reproducible; nothing independently verified) | audit of a46b21e, 5392777, 2811b27 |

**Branch stack:** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline`.
- **Not merged; the owner controls `main`** (ADR-013).
- Merge order and review notes: `MERGE_REVIEW.md`.

**Status dashboard:** `status/index.html`, built from `status/stages.json` + baseline + test records + git (`status/README.md`). Keep `stages.json` in step with this file.

## 2. Stage status

- **P0** (architecture, principles, verification, decisions): documented. Awaiting owner review.
- **P0.1 BR13A baseline:** DONE. Awaiting owner review.
- **P0.2 format 0.2:** spec in `FORMAT_0_2_SPEC.md`. **Not started.**
- **P0.3 standards-data framework:** spec in `STANDARDS_DATA_SPEC.md`. **Not started.**
- **P1 geometry in Python:** plan in `P1_GEOMETRY_PLAN.md`, for review. **Not started.**

## 3. Next action

1. Wait for the owner's review of P0.1 and the P1 plan.
2. Then, unless the owner reorders:
   - start **P0.2** on a new branch `p0.2-format` from `p0.1-baseline`;
   - follow `FORMAT_0_2_SPEC.md` §5 and the 10-step process (`DEVELOPMENT_PRINCIPLES.md` §2).
3. **Do not start P1 code** until the owner approves the P1 plan.

## 4. Open questions for the owner

1. **D-3:** design end region, max uB 1.171 and uL 3.966 at x = 0.75 m; no solid-end zones defined. Is this expected with placeholder strands, or does the end block need defining before P2?
2. **H-2:** fix the SVG NaN plot errors now, or leave it for the UI rework (P5 / P7)?
3. **P1 plan open points** (`P1_GEOMETRY_PLAN.md` §5): who checks the hand coordinates; bearing setback source; Python packaging on Windows.
4. **Order:** P0.2 / P0.3 before P1, or in parallel?

## 5. How to set up a session (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin
git checkout p0.1-baseline                     # or the branch named in section 1
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html    # expect 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules  # Playwright 1.56 in the cloud workspace
python3 tests/schema/test_schema.py && python3 tests/baseline/test_baseline.py
BASELINE_LIVE=1 python3 tests/baseline/test_baseline.py         # about 4 min: proves the reference still reproduces
```

## 6. Standing rules (short; full text in `DEVELOPMENT_PRINCIPLES.md` and `DECISIONS.md`)

- Every value comes from the PDF, or is tagged. Assumed values only to let the model run, shown and rolled up in Needs Review.
- The AI never approves its own assumptions (ADR-005).
- No merge into `main`; no force-push; no overwriting branches (ADR-013).
- Report only executed results. Print-only scripts are not passes.
- Results are indicative until verified (ADR-014). Unverified standards data are flagged (ADR-009).
- **Save progress incrementally** (`DEVELOPMENT_PRINCIPLES.md` §5): commit and push at each checkpoint; update this file and `CURRENT_STATUS.md` before the session ends.
