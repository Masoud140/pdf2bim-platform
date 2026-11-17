# Lessons learned - PDF to bridge model pipeline (BR13A, Oct 2026) - read before building the next bridge

> Status note 2026-11-17: the lessons stand. The "dashboard" in §3 is now the platform (`pdf2bim/`) and the Bridge Studio; its stale-state rules apply to the Studio (`studio/src/`), and the MCT post-processing scripts were folded into the platform's writer (repo `docs/P3_MODEL_METHOD.md`). Later lessons (SB-1510 set): repo `docs/project_knowledge/CONTROL_LINE_RECONSTRUCTION_METHOD.md` §2a and `docs/PRESTRESS_DESIGN_RULES.md`.

Goal (engineer's words): "creating a way to read the document and build a bridge model; this project is learning for the broader bridges."
BR13A is the learning case. Everything here is written so an agent can reuse it on a different bridge.

## 0. Document map (read in this order)
1. `DATA_SOURCE_CATEGORIZATION_STANDARD.md` - Direct / Calculated / Missing - Flagged on every value.
2. `CONTROL_LINE_RECONSTRUCTION_METHOD.md` - alignment. 3. `MEMBER_PROPERTIES_METHOD.md` - transverse grouping, girder segments, composite, queries (sections 10, 12).
4. `MCT_EXPORT_METHOD.md` - MIDAS file syntax. 5. `ANALYSIS_METHOD.md` - own solver and comparison. 6. `grillage_modelling_reference.md` - Hambly rules.
7. Code: `torsion_fd.py`, `analysis_core.js`, `analysis_live_model.js`, `analysis_ui.js`, `analysis_test.js`, `analysis_ref_solver.py`.
Superseded statements: MEMBER_PROPERTIES_METHOD section 12 findings 1 (girder Asz) and 2 (Iz/Asy pairing) were FIXED in dashboard v28; section 12 "composite
table uses flange width" is still open. ANALYSIS_METHOD supersedes the "design, not yet built" note in MCT_EXPORT_METHOD section 3.

## 1. Process rules that saved or cost time
- **Read what the engineer already gave you before asking.** The engineer wrote answers in the Word query file; asking again was the most irritating mistake.
  Open every uploaded file first, apply the answers, then ask only what is left.
- **When target-software syntax is unknown, ask for ONE native export** and read its comment lines. Five import rounds were spent guessing.
  Exported MCT/DXF/IFC files describe their own format.
- **Verify syntax by import, not by belief.** Keep the parser's error text; each error taught one rule (MCT_EXPORT_METHOD section 1).
- Small checkpointed stages; stop for confirmation between them. The engineer's decisions (perimeter option, cross girder size, supports,
  weight rules) arrive as short answers - record each in the doc the same day with its tag.
- Honest limits: if a quantity cannot be computed in the browser (finite-difference J), say so in the UI and flag staleness; never silently scale.
- State the assumption you made when an instruction is ambiguous or unstable (e.g. right-hand support "Dx, Dy" would be a mechanism) and offer the literal alternative.
- Answer "why can't I see X" with the mechanism (a weight step only bends the diagram) and then offer the visual fix.

## 2. Modelling lessons (each was a real defect)
- Super-T + deck: the deck is a plain slab over a hollow trough -> closed cell; J is ~30x the open girder. Do not fill the trough.
- Shear area from webs only (2 x web thickness x height); pair Iy with Asz, Iz with Asy. Check pairing in the element code, not only the export.
- Composite weight uses GROSS part areas; composite stiffness uses TRANSFORMED area (n = Ed/Eg). Do not mix.
- Deck transverse members double-count weight if the composite girder already carries the deck above it - zero them (engineer rule).
- Section assignment by element midpoint quantises the end-block length to the mesh. Always insert nodes at section boundaries and bearings,
  and test that total weight does not change when spacing changes.
- MIDAS axis meaning: Iyy vertical. Name mismatches between the dashboard and MIDAS were fixed in the export mapping and in `kLocal`.
- MIDAS cannot hold MGA-sized coordinates: shift X,Y to a documented base point (control line at Support A), keep Z; write the offset in the header.
- A VALUE section has no shape: elements look like rectangles/invisible. Use DBUSER for rectangles, `*SECT-PSCVALUE` for polygons/composites.
- Skew is the dominant behaviour on BR13A (34.5 deg): reactions differ 2:1 between girders at one end. Expect obtuse-corner load concentration.
- Cross-check with a hand calculation of one girder before trusting a diagram; explain differences by load path (isolation test: load one girder only).

## 3. Software-engineering lessons (dashboard = one HTML file)
- **Stale state is the commonest bug class.** Panes built once (`dataset.built`), dropdowns filled once, a `dirty` flag never set, and an embedded static copy
  of the model all produced "I changed the spacing and nothing moved". Rules: every parameter change goes through one `go()` that (a) rebuilds the mesh,
  (b) marks 3D dirty, (c) marks the Analysis tab stale, (d) redraws the active tab; lists that depend on the mesh carry a signature and rebuild when it changes.
- **Live vs frozen.** Offer both: a live model built from the parameters, and a frozen/loaded MCT for reproducing a MIDAS file. Say which one the results used.
- Keep one generator per output; post-processing scripts (`build_composite_mct.py`, `assemble.py`, `fix_rect_sections.py`) are a stopgap and must be folded in.
  Known gap: the dashboard "Generate .mct" still exports the old bare-girder version.
- Test headlessly (Playwright + Chromium) after every change: load, switch tab, change a parameter through the real input, read the DOM, check `pageerror`.
  Expected/known console noise: Google Fonts blocked in the sandbox.
- Keep timestamped backups of the HTML before big edits; use numeric validation scripts, not just screenshots.
- Compute heavy things off the main flow (staged `setTimeout`), show progress text, disable the Run button while running.

## 4. What to extract from the drawings for analysis (checklist for the next bridge)
- Bearing lines (chainage, skew), bearing type and size per support, direction of guidance, bearing stiffness table (BR13A: DRG 202280-282, Table 1 on 281) - missing items to Needs Review.
- Section changes along each girder: solid end block length, bearing offset from the girder end, internal diaphragms (positions often only a range).
- Deck: thickness, haunch, effective width rules, barrier/kerb loads, surfacing.
- Material grades per member (girder 50 MPa from DRG 202300 notes; deck and cast-in-place members need their own sheet; cross girder grade still assumed 40 MPa).
- Cross girder / diaphragm size on the support line (BR13A 800 x 1065, DRG 202011; a second dimension 420 not used).
- Girder plan geometry: chord vs curve, edge girder flange taper (precast taper vs in-situ overhang is unresolved).
- Prestress per girder type (added 2026-11-17): release strength f'cp, strand pattern with x / y and debond lengths, jacking or after-release force, hog table; the platform checks transfer stresses, debonding (TfNSW) and development length from these.

## 5. Engineer preferences observed
- Wants results as files and in the web dashboard, bullets over paragraphs, plain English, no re-asking of answered questions.
- Prefers simple supports first, complexity later; wants independent calculation and a comparison with MIDAS before refinement.
- Wants everything learned stored in the project so the approach transfers to other bridges.
- Wants every rule kept up to date in both the Project knowledge and the GitHub repository (2026-11-17).
