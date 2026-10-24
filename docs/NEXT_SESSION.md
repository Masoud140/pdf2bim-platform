# Next session — resume here

**Last updated:** 2026-10-24 (P0.2 done; P0.3 started).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p0.2-format` (from `p0.1-baseline` @ `0d36579`) | `git branch -vv` |
| Head | `git log -1 origin/p0.2-format`; must equal the local HEAD | `git ls-remote origin refs/heads/p0.2-format` |
| P0.2 tests | `python3 tests/schema/test_format_0_2.py` → 47 / 47 PASS | executed 2026-10-24 |
| Existing fast tests | schema 17 / 17, baseline 8 / 8 | executed 2026-10-24 |
| Dashboard build | unchanged since v45; sha256 `710b259d2c7117d0…` | no `src` / `base` change since |
| Full suite record | `baseline/BR13A/test_run.md`: last full run on `2811b27`. Test and tool files have changed since, so the status page marks it OUTDATED until `tools/run_suite.py` is re-run | — |

**Branch stack (none merged; the owner controls `main`):** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline` 0d36579 → `p0.2-format`.

## 2. Stage status

- **P0, P0.1:** done; awaiting owner review (does not block, ADR-018).
- **P0.2 format 0.2:** DONE (`FORMAT_0_2_SPEC.md` §6, ADR-017).
- **P0.3 standards-data framework:** IN PROGRESS (spec `STANDARDS_DATA_SPEC.md`). Nothing implemented yet at the time of writing; check `git log` for later commits.
- **P1 geometry:** plan `P1_GEOMETRY_PLAN.md`; next after P0.3.

## 3. Next actions

1. **P0.3**, on branch `p0.3-standards` from `p0.2-format`:
   - `standards/` schema + Python accessor;
   - an inventory of current code constants, every entry `code-extracted-unverified`, with its code location;
   - a review-register generator;
   - tests: no `checked` / `approved` entry without reviewer, date and authorised reference; the accessor returns the status; a result that uses an unapproved entry is flagged unverified.
2. Re-run `python3 tools/run_suite.py` (about 15 min) and `BASELINE_LIVE=1 python3 tests/baseline/test_baseline.py`; commit the records.
3. Rebuild the status page: `node status/capture_model.js`, then `python3 status/build_status.py`. Commit.

## 4. Do not

- Do not mark any standards value `checked` / `approved`. Only the owner or the reviewers they nominate may, with an authorised copy (ADR-009).
- Do not copy clause text from the Standards. Store clause references and the minimum numbers only.
- Do not change dashboard engine code without re-running the baseline (T1 exact).
- Do not merge, force-push or delete branches.

## 5. Open items for the owner (non-blocking)

- **D-3:** girder end region (uB 1.17, uL 3.97 at x = 0.75 m; no solid-end zone defined).
- **BR13A 0.2 migration:**
  - the unit of D-6's original 34950 (probably mm);
  - significance levels for high-impact values.
- **H-2:** plots drawn with NaN coordinates (fix now or later).

## 6. Setup (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git checkout p0.2-format
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html      # 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules
python3 tests/schema/test_schema.py && python3 tests/schema/test_format_0_2.py && python3 tests/baseline/test_baseline.py
```
