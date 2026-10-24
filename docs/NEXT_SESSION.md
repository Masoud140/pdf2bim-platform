# Next session — resume here

**Last updated:** 2026-10-24 (P0.2 → P2, P3a and P3b done; P3c next).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p3-model` (from `p2-sections` @ `e476e99`); P3b continues on it | `git branch -vv` |
| Head | `git log -1 origin/p3-model`; must equal the local HEAD | `git ls-remote` |
| Tests (executed 2026-10-24) | full suite on `009ce60`: 30 scripts, 277 / 277 assertions PASS; 18 print-only ran | `baseline/BR13A/test_run.md` |
| Dashboard build | unchanged since v45 (sha256 `710b259d2c7117d0…`) | no `src` / `base` change |
| Full suite record | `baseline/BR13A/test_run.md` (commit `009ce60`) | executed 2026-10-24 |

**Branch stack (none merged; the owner controls `main`):** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline` 0d36579 → `p0.2-format` f1fdc7a → `p0.3-standards` ff93af7 → `p1-geometry` 5e91a8f → `p2-sections` e476e99 → `p3-model`.

## 2. Stage status

- **P0, P0.1:** done; awaiting owner review (non-blocking, ADR-018).
- **P0.2 format 0.2:** DONE (ADR-017).
- **P0.3 standards framework:** DONE (ADR-019). **Content is NOT approved:** 63 entries `code-extracted-unverified`.
- **P1 geometry:** DONE (`P1_GEOMETRY_METHOD.md`, ADR-020). **BR13A geometry is PROVISIONAL** (uses the proposed D-34).
- **P2 sections:** DONE (`P2_SECTIONS_METHOD.md`, ADR-021). **PROVISIONAL** (uses D-35 / D-36).
- **P3a model + solver:** DONE (`P3_MODEL_METHOD.md`, ADR-022). BR13A model PROVISIONAL (D-34…D-38).
- **P3b stage 1–2 integrated model:** DONE (`P3_MODEL_METHOD.md` §5, ADR-023). BR13A PROVISIONAL (D-34…D-41). Findings F-5, F-6.
- **P3b stages 3–5:** SDL, MIDAS .mct writer, modes — DONE (`P3_MODEL_METHOD.md` §6, ADR-024). The .mct awaits the engineer import test.
- **P3c:** remaining load cases + combinations — next.

## 3. Next actions

1. **P3c**, on `p3-model`. Load cases on the integrated model with `Model.solve(gravity=(0, 0, 0), loads=...)`:
   - traffic first: M1600 / S1600 lanes and influence-surface envelopes. The dashboard's version is in `src/` (`tr*`), cross-check via a dump tool like `tools/dump_dashboard_sdl.js`;
   - then braking, temperature (uniform + gradient), shrinkage / creep, wind, earth pressure and earthquake RSA (use `Model.modes`);
   - then the AS 5100.2 combinations;
   - every factor via `standards.accessor` (all unverified), with no hard-coded coefficients.
2. Keep the generality guard green: `python3 tests/geometry/test_geometry.py` fails if engine code contains a bridge name or constant, **including in comments / docstrings** (it caught this twice in P3b).
3. Re-run `tools/run_suite.py` (≈ 30 min; don't switch branches or edit tested files while it runs), commit the record, rebuild the status page.

New in P3b stages 3–5 (for reference):
- `pdf2bim/model/loads.py`, `pdf2bim/model/mct.py`, `Model.modes`, `Model.solve(loads=)`, `Model.link_force`;
- tools `export_mct.py`, `compare_frozen_sdl.py`, `compare_frozen_modes.py`, `dump_dashboard_sdl.js`, `dump_dashboard_modes.js`, `check_mct_dashboard.js`;
- tests `test_loads.py`, `test_mct.py`, `test_modes.py`.

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
- **D-34 … D-38:**
  - accept the BR13A support-line bearing (44.029166°), the 13 Super-T shape rows (incl. ttf 90) and the cross girder 800 × 1065;
  - replace the haunch (Assumed 0 mm);
  - confirm the 2000 END DIAPHRAGM reading (Task B-1).

- **D-39 … D-41** (P3b): sill setout, elastomer layer 12 mm (Assumed), bearing seat RLs (girder assignment by order).
- **F-5:** bearing positions — abutment drawings vs GA girder setout, 50–530 mm apart. Which is right?
- **F-6:** seat-to-soffit gap 100–127 mm vs the Assumed 150 mm bearing height.
- **MIDAS import test** of `projects/BR13A/model/BR13A.integrated.mct` (checklist `.mct.md`); a native export with one nodal load, one point spring and one elastic link would remove the unverified syntax (X-2).
- **H-3:** the dashboard's modal / earthquake mass double-counts the deck strips (+9.8 %): fix in the dashboard now, or leave it until P3c replaces that analysis?

  Once these are settled, geometry, sections and the model are no longer provisional.

## 6. Setup (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git checkout p3-model
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html      # 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules
python3 tests/schema/test_schema.py && python3 tests/schema/test_format_0_2.py && python3 tests/standards/test_standards.py && python3 tests/geometry/test_geometry.py && python3 tests/sections/test_sections.py && python3 tests/model/test_solver.py && python3 tests/model/test_builder.py && python3 tests/baseline/test_baseline.py
```
