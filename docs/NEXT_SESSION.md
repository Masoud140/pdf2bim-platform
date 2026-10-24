# Next session — resume here

**Last updated:** 2026-10-24 (P0.2, P0.3, P1, P2 done; P3 next).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p2-sections` (from `p1-geometry` @ `5e91a8f`); P3 goes on `p3-model` from it | `git branch -vv` |
| Head | `git log -1 origin/p2-sections`; must equal the local HEAD | `git ls-remote` |
| Tests (executed 2026-10-24) | full suite on `5e91a8f`: 136 / 136 assertions; live baseline 11 / 11. On `p2-sections`: sections 24 / 24, format 48 / 48, schema 17 / 17, geometry 36 / 36 | `baseline/BR13A/test_run.md`, §6 |
| Dashboard build | unchanged since v45 (sha256 `710b259d2c7117d0…`) | no `src` / `base` change |
| Full suite record | `baseline/BR13A/test_run.md` (commit `5ab04c7`): 24 scripts, 161 / 161 assertions PASS, 18 print-only ran | executed 2026-10-24 |

**Branch stack (none merged; the owner controls `main`):** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline` 0d36579 → `p0.2-format` f1fdc7a → `p0.3-standards` ff93af7 → `p1-geometry` 5e91a8f → `p2-sections` → (`p3-model`).

## 2. Stage status

- **P0, P0.1:** done; awaiting owner review (non-blocking, ADR-018).
- **P0.2 format 0.2:** DONE (ADR-017).
- **P0.3 standards framework:** DONE (ADR-019). **Content is NOT approved:** 63 entries `code-extracted-unverified`.
- **P1 geometry:** DONE (`P1_GEOMETRY_METHOD.md`, ADR-020). **BR13A geometry is PROVISIONAL** (uses the proposed D-34).
- **P2 sections:** DONE (`P2_SECTIONS_METHOD.md`, ADR-021). **PROVISIONAL** (uses D-35 / D-36).
- **P3 model builder:** next.

## 3. Next actions

1. **P3 model builder**, on branch `p3-model`:
   - read `claude/GRILLAGE_PIPELINE_LESSONS.md`, `claude/MCT_EXPORT_METHOD.md`, `grillage_modelling_reference.md` (project docs) and the member-properties method (transverse groups, Stage A);
   - build the grillage from P1 + P2: girder chords; transverse slab strips at orthogonal spacing; support-line cross girders; rigid offsets; bearings as links; substructure, piles and springs from the description;
   - members with roles and stable ids; a Python solver interface;
   - compare with the frozen model: SDL reactions, modes (T7), equilibrium (T4);
   - write MIDAS .mct.
2. Re-run `tools/run_suite.py` on the new head, then commit the record.
3. Rebuild the status page.

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
- **D-34 / D-35 / D-36:** accept the BR13A support-line bearing (44.029166°), the 13 Super-T shape rows (incl. ttf 90) and replace the haunch (Assumed 0 mm) — then geometry and sections are no longer provisional.

## 6. Setup (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git checkout p2-sections   # or p3-model if it exists
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html      # 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules
python3 tests/schema/test_schema.py && python3 tests/schema/test_format_0_2.py && python3 tests/standards/test_standards.py && python3 tests/geometry/test_geometry.py && python3 tests/sections/test_sections.py && python3 tests/baseline/test_baseline.py
```
