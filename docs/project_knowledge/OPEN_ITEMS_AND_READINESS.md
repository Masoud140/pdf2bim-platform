# BR13A - open items and readiness review (2026-10-13, before starting a second bridge)

> **Historical (status note 2026-11-17).** This review predates the platform. Its section D blockers were addressed by the platform (bridge description format 0.2 loaded by Python modules, `pdf2bim/`), and its open items moved to the repository's `docs/NEXT_SESSION.md` and `docs/CURRENT_STATUS.md`, which are now the only live lists. Kept unchanged below for the record.

## A. Validated and reusable
- Tagging standard, control-line method, member-property method, MCT syntax (verified), own solver (validated, see ANALYSIS_METHOD.md section 5), lessons doc.

## B. Modelling-stage items that must be on a Needs Review list (the dashboard tab does NOT carry them yet)
| Item | State | Tag it should carry |
|---|---|---|
| Bearing type, size, stiffness (DRG 202280-282, Table 1 on 281) | not read | Missing - Flagged |
| Supports used: A pinned (Dx Dy Dz), B Dz only | engineer's simple instruction; right-end "Dx, Dy" would be a mechanism | Confirmed - Engineer (confirm B) |
| Deck transverse (TD) self weight = 0 | engineer rule to avoid double count | Confirmed - Engineer |
| Cross girder 800 x 1065 | read from DRG 202011 | Direct |
| Cross girder concrete grade | taken as deck 40 MPa | Missing - Flagged |
| 420 dimension beside the 800 | not used | Missing - Flagged |
| Solid end block length 2000 / bearing offset 518 | 1482 past bearing is Calculated; reading not confirmed against the elevation (Task B-1) | Calculated, confirm |
| Internal diaphragm positions | only a 4500-8000 range printed | Missing - Flagged |
| Edge girder taper: precast flange or in-situ overhang | unresolved (G-01 / G-04 plans) | Missing - Flagged |
| Haunch between girder and deck | assumed 0 (dashboard default) | Missing - Flagged |
| Deck effective width | full tributary width, no reduction | Model decision, flag |
| Composite J, Asy, Asz | first estimates (FD run); MIDAS recalculation pending | Calculated, provisional |
| Section offset CT vs node line | MIDAS behaviour unverified | Model decision, flag |
| Girder grade 50 MPa | DRG 202300 notes | Direct |

## C. Defects and gaps found in the review
1. Dashboard "Needs review" tab lists only abutment/pile flagged rows and parameter tag counts; section B items are absent (project rule: every flagged item).
2. End-block extent is mesh-quantised (G2: 1.379 / 2.447 m vs 1.482 m); total weight changes with spacing (4,130.5 kN at 2.8 m, 4,036.2 kN at 2.2 m).
3. "Generate .mct" in the dashboard exports the old bare-girder file; composites come from post-processing scripts / the live Analysis model.
4. Analysis not yet compared with MIDAS; import of the file with supports and self weight not yet confirmed; cross-girder visibility after the DBUSER change not confirmed.
5. MEMBER_PROPERTIES_METHOD.md header still says "PLAN FOR REVIEW, nothing implemented" and section 12 findings 1-2 are fixed (v28). Needs a rewrite.
6. Test expectation in `analysis_test.js` assumed the vertical mode was first; the lateral (weak-axis) mode is lowest. Fixed in this review.
7. Old deliverables in /outputs may mislead: `BR13A_SuperT_sections_DXF.zip` (girder-only outlines) and `BR13A_sections_MIDAS.csv` (pre-composite). Current: `BR13A_Composite_girder_DXF.zip`, `BR13A_composite_check.csv`, `BR13A_grillage.mct`.

## D. Generalisation blockers (what a new bridge would hit)
- Parameters, abutment/pile tables and tags live inside the HTML (DEF, META, DATA). A new bridge currently means editing code. Needs a bridge JSON (value, unit, tag, source sheet) the dashboard loads.
- Section generator is Super-T only (secGeom); no I-girder, box, U-trough, slab or steel plate-girder generator.
- Hard-coded BR13A rules: end block (2000 - 518) in three places, edge taper radii `SEC_RADII` for G1/G4, section ids `G\d-[EM]`, `TD`, `DUM`, `RIG`, `XG` naming, bearing node rule (girder-line node at CHA/CHB), supports rule, abutment/pile drawings, barrier bolts, hog calculator, embedded BR13A MCT.
- Single 1.6 MB HTML with minified three.js; fine to run, hard to maintain. Move code to modules (Claude Code) before the next bridge.
- Extraction is still done by reading in conversation; the AI-agent pipeline (extractor, auditor, validator ...) outputs the Excel/JSON, but the dashboard does not consume it yet.

## E. Recommended order
1. Close BR13A: insert end-block and bearing nodes; MIDAS comparison (reactions, displacements, moments); read bearing table; put section B items on Needs Review.
2. Rewrite MEMBER_PROPERTIES_METHOD.md as current state; keep one status table.
3. Define the bridge JSON schema and make the dashboard load it (BR13A becomes the first file).
4. Fold the MCT writer (composites, DBUSER, supports, load cases) into one generator.
5. Add girder section generators by type; bridge 2 chooses which one first.
