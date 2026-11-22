# Next session — resume here

**Last updated:** 2026-11-20.

**Standing rule (owner, 2026-11-17):** update every rule in both the repository and the Project knowledge in the same session (`DEVELOPMENT_PRINCIPLES.md` §5 item 8; index: `docs/project_knowledge/README_PROJECT_INDEX.md`).

## Work queue (owner 2026-11-20: items that need no owner input first, in this order)

**A. No owner input — do in order**
1. ~~SB01 (B12452) HLP positions~~ — checked 2026-11-20: lane widths not in the set → `custom.hlp_lane_lines` Missing - Flagged, moved to B (owner).
2. ~~SB41 WB continuous re-run~~ — done 2026-11-20 (comparison refreshed; HLP does not govern). HLP state export sped up (one response's lines only): combined actions 36 min (was > 100).
3. **Plank decks (14c)**: stages 1 / 1b (sections) 2a (grillage on bearings) and 2b (integral abutments, `supports[].abutment_spring`) done, 3a (RC plank flexure sag / hog + SLS bar stress, `pdf2bim/design/plank_design.py`) done, 3b (shear / torsion, interface shear demand) done; test_plank_design 9/9, test_plank_model 12/12; 3c-1 (girder_checks tool + app read plank results) done; 3c-2 (prestressed planks: losses + staged SLS / ULS) done; plank stage 3 complete; stage 4a SB43 survey done (`projects/B12468/extraction/SURVEY.md`, `plank_supports.json`); next stage 4b — radial-member geometry (ADR-086: `members[].setout` from Table 1, polyline support lines through the sill / deck-end / backfill code), then the SB43 description and the SB41 / SB42 lanes on it; owner: k* backfill + pile springs (geotech report), the 24 vs 22 strand query, jacking ratio / ages; owner: interface shear capacity clause; plan ADR-085 — stage 1 plank sections → 2 side-by-side grillage (bearings or integral) → 3 plank design → 4 SB43 (needs PD6694 soil stiffness from the owner for the integral abutments).
4. **Independent FEA cross-checks (owner approved 2026-11-23, ADR-087)** — verification only, never inside the product:
   - (a) **PyNite** (MIT, `pip install PyniteFEA`): re-solve the closed-form and BR13A / SB41 WB grillages (reactions, girder M / V, first frequencies) and compare with `pdf2bim/model/solver.py` in a test (`tests/verification/test_pynite_crosscheck.py`); dev / test dependency only.
   - (b) **OpenSeesPy** (UC Berkeley licence: internal / research use free, commercial distribution needs a UC licence): reference runs for EQ / time-history / staged checks, kept in tests or tools, never shipped.
   - (c) **XC** (GPL-3, Docker): watch only — reference if staged construction or fibre sections are added; no code.
5. Optional Studio extras from the dashboard inventory (ADR-068/069): N–M interaction diagram (D-10), section designer (D-13), barrier bolts (D-12), more export formats (D-15).

**B. Waiting on the owner (do not start)**
- BR13A D-49: HLP400 alone or with half SM1600 (cover sheet silent).
- SB01: travel-lane widths for the HLP lane-line positions (000101 diagram; not dimensioned in the set).
- SB41 WB: stress bar UTS (not on the drawings); span-2 hogging u up to 1.90 at 3.5–10 m from the pier vs the report's envelope; deck bars in single-span girder capacity (would shift benchmarks).
- Older benchmark queries: table 4-29 Mu or φMu; SLS combination / limit; transfer-stress basis (SB42); f'cp in table 4-32 (SB41 EB); MC80 bearing typo; SB01 drawing items.
- MIDAS moving-load export: one native .mct with a moving load (never guess the syntax).
- 4a / 4b clause-referenced design: the location of the licensed codes.
- Pile soil springs (geotechnical appendix); Revit conventions; hosted app with log-in; merge `p4-verification` to main.

**Done since the 2026-11-16 list** (details in `DECISIONS.md` / `CHANGELOG.md`): Tier 1 prestress checks (ADR-072–074); SB41 EB / WB verification; Tier 2 app items (ADR-067, 076); Tier 3 Studio parity (ADR-068, 069, 077–081); continuous spans stages 1–7 (ADR-082); Studio HLP400 (ADR-083); HLP from the cover sheets (ADR-084).
- Known (pre-existing): tests/model/test_mct.py 21/22 — 'dashboard parser ran' fails inside the external BR13A dashboard's AN.parseMCT (`M.mats[e.mat]` undefined); our writer's round trip passes.
- Do not run `git stash` while a chain runs (it swaps the shared code under the running process).

**Rule:** read this file first, then `CURRENT_STATUS.md`. Then:
1. `git fetch`;
2. compare the branch heads below with the remote;
3. check for uncommitted work;
4. resume from the last verified checkpoint.

If this file and the repository disagree, the repository wins: fix this file. **Working mode:** autonomous (ADR-018). Ask the owner only about safety, validity, licensing or irreversible actions.

## 1. Last verified checkpoint

**2026-11-17 stop point:** Studio 3D frame finished and published (ADR-071). Commands run: `node studio/tests/test_engines.js` 47/47, `node studio/tests/test_core.js` 12/12, `SUB=0 node studio/tests/regress_dump.js new.json` compared with the three-freedom baseline (4.6e-11; the baseline JSON was a scratch file, regenerate from commit before the frame work if needed), browser check of every tab with no errors. Follow-ups, not started: more modes or a static correction so the earthquake captures 90 % of the mass; substructure in the 3D view; piers of multi-span bridges as members. Deflection animation added to the 3D page (`studio/src/ui3d.js`, UI only; browser-checked every source, 0 errors; girder-alone mid-span 37.6 mm equals 5wL⁴/384EI). Limits: no prestress camber/creep in the dead-load shape; truck is wheel loads only (no lane UDL, no DLA), lane against the left kerb. Next task: Tier 1 item 1 (platform prestress checks).

| Item | Value | Verified by |
|---|---|---|
| Working branch | `p4-verification` (from `p3-model` @ `c378d73`); `p3-model` is closed (fixes only) | `git branch -vv` |
| Head | `git log -1 origin/p4-verification`; must equal the local HEAD | `git ls-remote` |
| Tests (executed 2026-10-26) | full suite, tree = `fd8c85a`: 53 scripts, 586 / 586 assertions PASS (35 asserting scripts); 18 print-only ran; test_mct rerun on `0147d4b` 16 / 16 | `baseline/BR13A/test_run.md` |
| Dashboard build | unchanged since v45 (sha256 `710b259d2c7117d0…`) | no `src` / `base` change |
| Full suite record | `baseline/BR13A/test_run.md` (tree `fd8c85a`) | executed 2026-10-26 |

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
- **P4:** plan drafted (`docs/P4_PLAN.md`, owner review non-blocking). **P4.1 concurrent traffic actions: DONE** (§1, ADR-029). **P4.2 concurrent combinations: DONE** (§2, ADR-030). **P4.3 signed earthquake / pile resultants: DONE** (§3, ADR-031 — method for the engineer to confirm). **P4.5 stage 1 flexure: DONE** (§4, ADR-032). **P4.5 stage 2 SLS + N–M: DONE** (§5). **P4.5 stage 3 shear / torsion: DONE** (§6). **P4.5 stage 4a benchmark + stations: DONE** (§7, ADR-033). **P4.5 stage 5 losses / inputs / ULS flexure: DONE** (§8, ADR-034, D-42). **P4.5 stage 6 staged SLS / minimum strength: DONE** (§9, ADR-035). **P4.5 stage 7 SLS free strains: DONE** (§10). Shear at stations waits for fitments.

## 3. Next actions

**Start here (2026-10-26 handover):**

- **Transverse section fixes DONE** (`cac0e3f`): slab J = b·d³/6, VALUE; cross girder offset CC.
- **P4-6 grillage torsion DONE** (`376a58d`, ADR-041): `girder_J_factor` = 1.0 (Assumed). See ADR-041.
- **P4-7 solid-end shear DONE** (`f1b3532`): `solid_end_geometry()` + `checks_along()` solid branch + reporting guards.
- **Awaiting owner re-import** of `BR13A.integrated.mct` with BNDR-GROUP fix (`d135add`+`cac0e3f`).
- **Moment releases at rigid-arm ends DONE** (`35b3719`, ADR-042): Iy release at W1/W2 ends; `*BEAMEND` UNVERIFIED in MCT.

0. **Owner instruction 2026-10-26 (ADR-040):** BR13A is for software development; assume reasonable code / practice values where the drawings are silent, keep them changeable (Assumed + replace_with, Query Register). D-34 … D-46 accepted; no proposed decisions; tools run without `--allow-proposed`.
1. **Fitments (D-1, D-45):** current peak u=2.79 governed by uV from torsion; solid-end stations now checked (low u). Awaiting actual fitment schedule from drawings (D-45 is Assumed N12 2L @ 100/200; D-1 Assumed).
2. **Moment releases at rigid-arm ends:** DONE (`35b3719`, ADR-042).
3. **Viewer / dashboard refresh DONE** (`13d46ef`): girder_checks regenerated; viewer rebuilt via new `build_viewer.py`.
4. **P6:** a second single-span Super-T from its PDFs (owner to supply).
5. Keep the generality guard green. Full suite ≈ 80 min.

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
- **E-1:** the reference spreadsheet behind the dashboard's dgBench (2.4 m composite trough, 120 strands) — to confirm the benchmark and the add-in's dn / dv definitions.
- **BR13A design inputs:** strand MBL / fpb, fitments, deck bars (drawings); the strand / bar layout is an Assumed placeholder (D-1).
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
