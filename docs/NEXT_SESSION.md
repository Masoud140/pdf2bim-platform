# Next session — resume here

**Last updated:** 2026-10-25 (P0.2 → P3 done; P4 plan drafted; P4.1–P4.3 and P4.5 stages 1–3 done on `p4-verification`; P4.5 stage 4 next; P4.4 MIDAS waits for the owner).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p4-verification` (from `p3-model` @ `c378d73`); `p3-model` is closed (fixes only) | `git branch -vv` |
| Head | `git log -1 origin/p4-verification`; must equal the local HEAD | `git ls-remote` |
| Tests (executed 2026-10-25) | full suite on `ea37a13`: 40 scripts, 460 / 460 assertions PASS; 18 print-only ran |  `baseline/BR13A/test_run.md` |
| Dashboard build | unchanged since v45 (sha256 `710b259d2c7117d0…`) | no `src` / `base` change |
| Full suite record | `baseline/BR13A/test_run.md` (commit `ea37a13`) | executed 2026-10-25 |

**Branch stack (none merged; the owner controls `main`):** `main` 8a60b74 → `step-b2-br13a` 42dcec7 → `docs/p0-architecture` 7d00263 → `p0.1-baseline` 0d36579 → `p0.2-format` f1fdc7a → `p0.3-standards` ff93af7 → `p1-geometry` 5e91a8f → `p2-sections` e476e99 → `p3-model` c378d73 → `p4-verification`.

## 2. Stage status

- **P0, P0.1:** done; awaiting owner review (non-blocking, ADR-018).
- **P0.2 format 0.2:** DONE (ADR-017).
- **P0.3 standards framework:** DONE (ADR-019). **Content is NOT approved:** 63 entries `code-extracted-unverified`.
- **P1 geometry:** DONE (`P1_GEOMETRY_METHOD.md`, ADR-020). **BR13A geometry is PROVISIONAL** (uses the proposed D-34).
- **P2 sections:** DONE (`P2_SECTIONS_METHOD.md`, ADR-021). **PROVISIONAL** (uses D-35 / D-36).
- **P3a model + solver:** DONE (`P3_MODEL_METHOD.md`, ADR-022). BR13A model PROVISIONAL (D-34…D-38).
- **P3b stage 1–2 integrated model:** DONE (`P3_MODEL_METHOD.md` §5, ADR-023). BR13A PROVISIONAL (D-34…D-41). Findings F-5, F-6.
- **P3b stages 3–5:** SDL, MIDAS .mct writer, modes — DONE (`P3_MODEL_METHOD.md` §6, ADR-024). The .mct awaits the engineer import test.
- **P3c stage 1 traffic:** DONE (`P3_MODEL_METHOD.md` §7, ADR-025). Findings H-4, H-5.
- **P3c stages 2–5:** thermal, horizontal, wind, earthquake — DONE (`P3_MODEL_METHOD.md` §8, ADR-026).
- **P3c AS 5100.2 combinations:** DONE (`P3_MODEL_METHOD.md` §9, ADR-027). Findings M-4, H-8.
- **P3c close-out:** girder and sill responses, combined-action schedule — DONE (§9.1, ADR-028).
- **P4:** plan drafted (`docs/P4_PLAN.md`, owner review non-blocking). **P4.1 concurrent traffic actions: DONE** (§1, ADR-029). **P4.2 concurrent combinations: DONE** (§2, ADR-030). **P4.3 signed earthquake / pile resultants: DONE** (§3, ADR-031 — method for the engineer to confirm). **P4.5 stage 1 flexure: DONE** (§4, ADR-032). **P4.5 stage 2 SLS + N–M: DONE** (§5). **P4.5 stage 3 shear / torsion: DONE** (§6). **P4.5 stage 4: next.**

## 3. Next actions

1. **P4.5 stage 4 — design stations along the girder**, on `p4-verification`:
   - read how the dashboard builds its design sections and stations (`src/dsg2_ui.js` … `dsg12.js`: layers from the Super-T shape, open / solid end zones, composite deck width, strand / bar layout, `dgFac`, shear data bv, dv, Ao, uh, Acp, uc, y1, Pv, spo, transmission Fpt) and list every input with its source (description field, standards entry, or Assumed);
   - build the same from the P2 sections (`pdf2bim/sections`) and the description in `pdf2bim/design/stations.py`; strands / bars for BR13A are placeholders (D-1) — keep them flagged;
   - design actions per station from the combined-action schedule's girder rows (concurrent M, V, T at ULS; SLS M for stresses), then run flexure, SLS, shear per station; compare with the dashboard's design results (V5) and report utilisations as INDICATIVE;
   - tests: station geometry vs P2 properties; actions = schedule values; port-equals-dashboard on the dashboard's own section data where possible.
2. **Owner items** that block T11 (E-1 source), P4.4 (MIDAS) and the method confirmations (ADR-031).
3. Keep the generality guard green (local pre-commit hook, CHANGELOG 2026-10-25). Full suite ≈ 55 min.

For reference (P4.5 stage 3): `pdf2bim/design/shear.py` (`shear`, `vm`); test `tests/design/test_shear.py` (≈ 2 s, uses Node).

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
- **H-4 / H-5 (traffic, dashboard):**
  - the default lane layout is never swept (G4 M ×1.33, outer bearings up to ×3.15);
  - the one-node bearing "lines" overstate inner-bearing reactions (up to +44 %) and understate girder moments (1–6 %).

  Were any dashboard traffic results already used outside the platform?
- **M-3:** temperature / shrinkage restraint forces at the fixed abutment are sensitive to the bearing idealisation. The restraint-block / dowel detail would settle the bearing model.
- **M-4:** combined minimum at bearing A-G4 is uplift on the P3b model (ULS −162 kN, SLS −37 kN), mostly from the Assumed shrinkage (300e-6) through the fixed-abutment restraint. Check in MIDAS / with the bearing detail.
- **Earth-pressure fill category** (controlled fill SOc or other SOo): not in the description; the combinations use SOo (provisional).
- **E-1:** source of the Super-T worked-example targets (Mu 68 979, dn 240.9, I 2.634e13) — or another referenced worked example for T11.
- **ADR-031:** earthquake concurrency (CQC most probable values) and the pile response-ellipse resultant with linear 100 / 30 — confirm the method before design use.

  Once these are settled, geometry, sections and the model are no longer provisional.

## 6. Setup (cloud workspace)

```bash
git clone https://github.com/Masoud140/pdf2bim-platform.git && cd pdf2bim-platform
git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch origin && git checkout p3-model
./build.sh && sha256sum dist/BR13A_grillage_dashboard.html      # 710b259d2c7117d0...
export NODE_PATH=/opt/npm-tools/node_modules
python3 tests/schema/test_schema.py && python3 tests/schema/test_format_0_2.py && python3 tests/standards/test_standards.py && python3 tests/geometry/test_geometry.py && python3 tests/sections/test_sections.py && python3 tests/model/test_solver.py && python3 tests/model/test_builder.py && python3 tests/baseline/test_baseline.py
```
