# Next session — resume here

**Last updated:** 2026-11-16.

## Priority order (owner-agreed list, 2026-11-16) — work top to bottom
Tier 1 — engineering trust on real bridges
1. Platform prestress checks (transfer 0.5 / 0.6 f'cp, TfNSW debonding + adjacency, development length).
2. Verify SB41 EB, SB41 WB, SB43 from the 2000 set (each as SB42: survey → values → chain → comparison, haunch from levels).
3. Owner queries that gate the benchmarks: table 4-29 Mu vs φMu; SLS combination and limit; SB01 drawing items. (Owner.)
4. Standards verification against licensed editions; Standards Agent S0 licence check and corpus list. (Owner.)
4a. **Codes to text and clause-referenced design** (owner request 2026-11-16): extract the licensed AS 5100 parts 1–7 (and the other codes the design calls on: AS/NZS 1170.2 wind, AS 3600, AS 4100, AS/NZS 4672, authority documents) to clause-level text with document / edition / amendment / page on every chunk; then make every design check in the platform and the Studio cite the clause it applies (table, figure, appendix) and quote it on demand. Runs through the Standards Agent (S1 index → S4 register export) and the pdf2bim standards register; values stay `transcribed-unverified` until checked against the licensed copy. Licence check (item 4) gates the extraction; the licensed PDFs and extracted text never enter git.
4b. **Alternative / complement to 4a: read the standard from the screen with Claude in Chrome** (owner idea 2026-11-16). The engineer opens the clause in the firm's licensed online reader (their own log-in); Claude in Chrome reads the page and (i) quotes the clause with document / edition / page into the design-basis checklist or a register entry, (ii) compares a register value with the clause on screen and the engineer marks it `checked`. Nothing is stored beyond the quote the engineer accepts. Use it for verification and on-demand quoting; it does not replace the index for retrieval (no search across a whole part, not reproducible, not headless). Check the reader's terms on automated access before relying on it.
Tier 2 — the app as the one tool
**Items 5–8 done 2026-11-16 (ADR-067).** Left over: member pick in the 3D model view; traffic states for headstocks / piles; `traffic.json` in the read-only online copy; re-run the example bridges so their runs carry `traffic.json` and member properties (repository outputs predate both).
5. P9.6 Loads tab (full case list, read-only combination matrix).
6. P9.7 Moving-load lanes in the app (lane layouts in the description, influence lines, governing positions, member pick).
7. App: Materials and member-properties transparency pages (dashboard parity M-1, M-3) and Needs-review roll-up as a first-class page (W-1).
8. App: per-girder definition — strands, debonding, bars, fitments (M-4) — with the Studio's editable design and rerun.
Tier 3 — Studio showcase
9. S-1…S-4 (lane editor on the cross-section, Materials card, deck-weight note, member b × h).
10. Dashboard parity in the Studio, in this order: L-6 construction stages page, D-5 hog page, L-8 full combinations, L-1 wind, L-2 temperature, D-1 bearings, M-5 bars on the section; then M-4 per-girder definition.
11. Optional: section-drawing zoom; generated live-load model page.
Tier 4 — platform scope
12. Pile moments with real soil springs (needs the geotechnical appendix); D-2 / D-3 views in the Studio only after that.
13. Alignment views in the Studio (G-1, G-2, G-4) as views of platform results.
14. Moving-load MIDAS export; planks; continuous spans; Revit output; hosted app with log-in.
15. Merge `p4-verification` to main (owner).
- SB01 haunch done; re-run and comparison updated (φMu −15 %, M* −2 %).
- `traffic.py` speed fix: the full SB01 chain now takes about 30 min (actions 10, design 18).
- Next: the Python platform checks from `docs/PRESTRESS_DESIGN_RULES.md` "Rules for the next calculation" items 1–3 (transfer 0.5 / 0.6 f'cp, TfNSW debonding with adjacency, development length).
- Then P9.6 (owner request 2026-11-13): a **Loads** tab in the app, like the Studio Loads page but over the full platform case set.
  - List every case (permanent, SDLs / SDLp, M1600, S1600, HLP, pedestrian, temperature, shrinkage, earth pressure, surcharge, braking, centrifugal, wind, earthquake, flood, collision) with on/off and intensity records read from `loads.*` in the description; edits go through `propose_override` (history and tags kept); a change marks the run stale as the Girder editor does.
  - Show the generated combination matrix (`combinations.py`) read-only: factors are standards-inventory entries, not per-project edits.
  - Server: one `loads` view; no engine change. Check first that every `loads.*` record has a `propose_override` path.
- Then P9.7 (owner request 2026-11-13): **moving-load lanes in the app, MIDAS-Civil style, to AS 5100.2.**
  - Engineers or the agent define lane layouts for every case to check (AS 5100.2 standard design lanes 3.2 m; automatic sweep across the carriageway, or named manual layouts), stored in the description (`loads.lane_layouts`) with tags and history.
  - Results: influence lines for any response; the governing lane layout, lane ranking (accompanying lane factors) and vehicle / patterned-UDL positions behind each envelope value (`traffic.governing_state` already exists in the engine).
  - Pick any member in the model view and see the load position that gives its maximum bending and shear, drawn on the plan.
  - Studio showcase of the same (Moving loads tab) built 2026-11-16 as the reference for the app's UI.
- Studio items S-1…S-4 (owner questions 2026-11-16), small, do together:
  - S-1 lane editor on the typical cross-section (type or drag lane left edges; feeds the Moving loads manual layouts).
  - S-2 Materials card on the design page: concrete grades and Ec (AS 5100.5 table), densities, strand area / MBL / Ep, fitment steel grade, each with its source; make the steel properties visible inputs.
  - S-3 Loads page note + per-girder G2 weight: deck weight acts on the bare girders by tributary width (non-composite), so slab strips carry stiffness only.
  - S-4 Mesh member table: add section geometry columns (b × h: deck strip = element spacing × slab; end cross girder = cgW × (H + slab); girder = composite Super-T + deck strip one spacing wide).
- **P8.x Verify the remaining bridges of the latest drawing set** (owner request 2026-11-16): set SGWS1-JHSW-2000-BR-DRG-COMBINED (design lot SB-1510, report RPT-410001 rev D) holds four bridges; SB42 (B12461) is done. Still to do, each as SB42 was (survey → values.py → description → chain → COMPARISON_REPORT against the report, haunch from levels):
  - SB41 EB (B12460) and SB41 WB (B12459) — note end skews above 35° on some ends (survey §3 item 3), so expect a FE-deck flag per BTD 2011/06;
  - SB43 (B12468).
  - From the earlier set SGWS1-JHSW-1000-BR-DRG-COMBINED: SB01 (B12452) and SB02 (B12453) done; check the set's bridge list for any third bridge not yet surveyed.
  - Owner PDFs and the report stay uncommitted; page indices are 0-based into the combined PDF.
- **Studio parity with the BR13A design dashboard** (owner request 2026-11-16; inventory of `BR13A_Design_Dashboard.html`, 23 tabs in 7 groups, against the Studio). Generic, anonymised versions only. Not in the Studio yet:
  - D-1 **Materials tab**: one source of truth — concrete grades, AS 5100.5 Table 3.1.2 values, derived constants (Ec, f'ct, εcs…), steel and strand data, "where each material is used". (absorbs S-2)
  - D-2 **Member properties tab**: consolidated member table with b × h and sketches, girder segmentation (solid end blocks, diaphragms), transverse members grouped by width, edge-girder flange taper, tributary closure check. (absorbs S-4)
  - D-3 **AS 5100.2 combination builder**: full case register with directions (±X / ±Y / up / down), adverse and beneficial permanent factors, every ULS / SLS combination generated as its own row; export to Excel, MIDAS, SPACE GASS, Strand7. Studio has a 6-row editable matrix only.
  - D-4 **Environmental and horizontal loads**: wind (AS 5100.2 Section 17), uniform and differential temperature, shrinkage, earthquake response spectrum. Needs the 6-DOF grillage (Studio is 3-DOF vertical). Listed as "proposed" on the Loads page.
  - D-5 **Construction stages**: MIDAS-style stage groups (structure / boundary / load), cumulative girder moment and deflection by stage, time-dependent creep and shrinkage per stage, bearing and pile forces by stage. Studio has hog stages only.
  - D-6 **Bearings and supports**: elastic links sill-to-girder, support conditions, boundary changes during construction, bearing design.
  - D-7 **Pile results with soil springs**: pile deflection, moment, shear and axial along the pile. Studio piles are a rigid-cap distribution.
  - D-8 **Stiffness-matrix inspector and MIDAS export** of the Studio grillage: member 12 × 12 matrices, validation, model totals, connectivity, .mct download.
  - D-9 **Traffic extras**: lane packing presets (pack from left / right barrier, centre), envelope CSV download. (manual lanes exist since ADR-066)
  - D-10 **Super-T design extras**: "materials and derived parameters" step; N–M interaction diagram; V–M diagram; solid end-block sections with their own fitments and sections along the girder; deck width and flange width along each girder (edge taper); engine benchmark step; calculation report with formula / substitution / clause per check.
  - D-11 **Hog calculator extras**: rule-based debond editor (rules applied in order, TfNSW defaults), longitudinal reinforcement in the detailed method, Stage D deflection contributions, "effect of each item on hog", review verification (stage table, tendon-force reconciliation, creep build-up, section equilibrium), sensitivity table, Word hog report.
  - D-12 **Barrier bolts check** (anchorage: load case, bolt group, materials, coefficients as inputs, capacity, needs-review).
  - D-13 **Section designer**: editable outline vertices and derived properties; Studio uses library shapes only.
  - D-14 **Needs review roll-up**: counts by tag and every flagged / proposed / unverified item on one page (Studio tags: Calculated / Illustrative / Unverified / Experimental).
  - D-15 **More export formats**: MIDAS .mct, SPACE GASS, Strand7, long-format CSV (Studio: PDF, Excel, HTML).
  - Project-specific dashboard tabs (horizontal / vertical alignment, deck section, abutments, pile data, drawing-tag padlocks) belong to the app, not the generic Studio; the app already has their equivalents.
  - Suggested order: D-1, D-2 (small, with S-1/S-3) → D-10 → D-14 → D-3 → D-9 → D-11 → D-13 → D-8/D-15 → D-5/D-6 → D-4 (needs the 6-DOF grillage) → D-7 → D-12.
- **Studio gap list against the BR13A design dashboard** (owner request 2026-11-16; the dashboard has 28 pages, the Studio 12). Not yet in the Studio, grouped; keep the Studio anonymised and self-contained:
  - Geometry: G-1 horizontal alignment (spiral-curve-spiral, girders as chords, MGA setout); G-2 vertical alignment, crossfall and deck levels (haunch from levels); G-3 deck section editor (wearing surface, barrier shape, footpaths, haunch); G-4 abutment / sill geometry (sill, RLs, toe); G-5 boundary-condition editor beyond the single bearing stiffness.
  - Sections and materials: M-1 Materials page (S-2); M-2 section designer for arbitrary outlines (Studio uses library shapes only); M-3 member-properties page with full transparency (S-4) and the stiffness-matrix view; M-4 girder definition per girder (strands and debonding per girder, reinforcement bars, fitments; one pattern for all girders today); M-5 bars, deck bars and ligatures on the section drawing.
  - Loads: L-1 wind (AS 5100.2 Cl 16); L-2 temperature uniform + gradient with restraint; L-3 earthquake RSA with site class; L-4 abutment soil pressure, braking, centrifugal; L-5 HLP and pedestrian traffic; L-6 construction stages page (bare girder, wet deck, composite, long-term) as a page, not only inside the design engine; L-7 user-input additional actions at the section; L-8 full AS 5100.2 combination set (the Studio has the vertical cases only).
  - Substructure and details: D-1 bearings and supports (elastomeric bearing stiffness and design: shear, rotation, stability); D-2 combined actions at bearings, headstocks and piles; D-3 pile group with soil springs and pile results (the Studio piles step is simplified); D-4 barrier bolts; D-5 hog calculator as a standalone page with the staged losses table.
  - Workflow: W-1 Needs-review roll-up of every tagged value; W-2 generated live-load model page.
  - Rule for choosing: items that make the Studio a complete single-span Super-T design tool (M-1, M-4, L-1, L-2, L-6, L-8, D-1, D-5, W-1) first; alignment and substructure (G-1, G-2, G-4, D-2, D-3) are platform features and should come to the Studio only as views of platform results.
- Not brought across from the BR13A dashboard section view (optional): girder bars, deck bars, ligature outline, zoom.
- Open owner queries:
  - report table 4-29: Mu or φMu;
  - the SLS combination and its limit;
  - the B01-08 RL;
  - the A01-14 pad of 43 mm.

Earlier: 2026-11-09 Studio ADR-063 done (crack control, station table, Validation page); republished. Next: SB01 haunch from levels (below), then owner queries.

Earlier 2026-11-09: SB42 (B12461) stage 1 survey done (`projects/B12461/extraction/SURVEY.md`).
- The owner PDF is at /mnt/user-data/uploads/SGWS1-JHSW-2000-BR-DRG-COMBINED.pdf; the report docx is in the session attachments. Neither is committed.
- Stages 2–4 done (ADR-062): rebuild with `sh projects/B12461/build.sh`.
- Run the chain per span: steps geometry, sections, model, actions, design, each with `--allow-proposed`, about 5 min a span.
- Compare: `python3 projects/B12461/compare_report.py RUN_S1 RUN_S2`.
- Done: the φMu gap is explained in `projects/B12461/model/PHIMU_SLS_NOTE.md`. The platform matches a hand check; the report value equals the nominal Mu.
  - Two owner queries are open: whether report table 4-29 is Mu or φMu, and the SLS combination and limit.
- Done: SB42 haunch from levels (`values.py haunch()`).
- Next: apply the same method to SB01. Its inputs are 0703 table 2 RLs, 0500 bearing RLs, 0502 pads and the 0600 hog table.
- Do not run `git stash` while a chain runs: it swaps the shared code under the running process (it happened once on 2026-11-09).

Earlier: 2026-11-08 ADR-061: Bridge Studio (`studio/`, README there).
- Rebuild with `python3 studio/build.py`, then republish `studio/dist/bridge_studio.html` to artifact LPiMgACdEH2Wk3nuZXhkHA (same file path, or pass the URL).
- Not verified here: the `sample` (AI) and `downloads` capabilities inside claude.ai. The browser check used a local fallback download.
- Next: owner feedback on the Studio, then P9.1 live reading test.

Earlier: 2026-11-07 ADR-060: SB01 values.py + build.sh + compare_report.py + test_b12452_chain (14/14); actions step memory fixed (traffic.py CACHE_BYTES). Rebuild: projects/B12452/build.sh. Full SB01 chain takes about 40 min (design 18 min). Next: live reading test with the owner key; shear inputs for SB01 (aggregate_size). Earlier P9.4 ADR-059: hog chart (Design tab), Excel workbook + Word report as chain step "exports", fuller pile table; tests/app all pass (exports 8/8). Next: live reading test with the owner key; SB01 values.py; stale header in projects/B12453/compare_report.py. Earlier P9.2+P9.3 ADR-058: generic missing-input proposals (D-1) after reading -> full chain from upload; Girder editor tab with Save and run. Next: hog calculator + Word/Excel exports into the app; live reading test with the owner key. Earlier P9.1 ADR-057: drawing reader (Claude API, owner key) in the app; next P9.2 propose missing inputs as a decision, P9.3 Super-T section / tendon / reinforcement editors from the BR13A dashboard into the app (any bridge, rerun). Earlier 2026-11-05: ADR-056 divided decks (deck.carriageways); SB01 survey projects/B12452/extraction/SURVEY.md; next SB01 values.py (stage 4b). ADR-055 barrier from section + HLP with half M1600 (runs B12453 / B12626 20261105-071140). ADR-054 haunch concrete as SDL (deck.haunch_concrete; loads.sdl_case); SB02 run 20261105-065703. Earlier: 2026-10-28 — Generality suite run + 2 regressions fixed. girder_J_factor record: replace_with was erroneously nested inside source (not valid per $defs/source); moved to record level + original level + added D-47 decision. format_0_2 now 48/48, takeoff 10/10. All asserting tests match baseline (pre-existing dashboard failures unchanged). Next: P6 (second bridge, owner PDFs — blocked); re-import MCT (blocked on owner). Later 2026-10-28: owner saw piles drawn as lines in MIDAS → X-3 fixed from the owner's native BR13B .mct (SR circle, SECT-SCALE); girders now COMPOSITE-GEN too. *BEAMEND -> *FRAME-RLS after owner import error; Option B deck-top reference implemented (ADR-043, D-48). Full Python suite re-run in progress at commit time — check tests/*/ results vs baseline/BR13A/test_run.md (girder_checks / girder_shear / girder_sls already crash at baseline). MIDAS run matched after the solver release fix; owner then removed the releases (ADR-045). Static nodal-load cases exported (*CONLOAD). Owner re-ran the current .mct with all 18 cases: matches everywhere (midas_run_2026-10-28b). Temperature / shrinkage and 133 combinations exported (test_mct). Next: owner MIDAS run of TUp/TUm/SCR/TGP/TGN + combinations; then P6 second bridge (owner PDF Second_Example.pdf, 72 pp, received 2026-10-28) — P6 stage 3 DONE (ADR-047, docs/P6_SECOND_BRIDGE.md): tools/new_description.py builds projects/B12626/B12626.bridge.0.2.json from the extraction; projects/B12626/dev_inputs.py proposes 173 development inputs under D-1 (PROPOSED); the unchanged chain runs to the MIDAS .mct (projects/B12626/model/). Generality gaps G-2, G-4..G-10 fixed (filled steel tube piles, pile/bearing id collision, search ranges, Missing seat_rl, checks); G-1 (per-side flange setback) and G-3 (crowned sill) open. Rebuild order: build_values -> to_description -> rm description -> new_description -> dev_inputs. Next: traffic + combinations on B12626, compare pile actions with 109035 table 4 (SLS 3535 / ULS 5175 kN, M 1831 kNm). Tests 2026-10-28 on 8781004: model + schema + geometry + sections suites all PASS except test_mct's dashboard check (needs a dist build, as at baseline); test_b12626_chain 10/10. Owner queries: flange overlap 51 mm, sill depth 1350 TYP vs 1575, RL 9.493, alignment typos, bearing catalogue, design report, geotechnical report. Earthquake exported (d81852a). Traffic (moving load: *LINELANE / *VEHICLE / *MVLDCASE, syntax in the native BR13B file) DEFERRED by the agent until after P6 — owner can redirect. Owner MIDAS run still wanted for TUp/TUm/SCR/TGP/TGN, EQ_L/EQ_T and the combinations. Fitments parked by owner. 2026-11-02: P6 stage 4 DONE — girder strands (48, debonding), fitments, deck bars, hog table extracted; G-11 (deck width lost when girder ids do not start with 'G') and G-12 (strand area / MBL from the drawings) fixed; benchmarks: pile N SLS +2.6 % / ULS +4.3 %, M +23 % (EQ, placeholder soil), deck deflection +6 %, hog transfer +18 % and growth 3x (finding H-11). Next: B12626 girder design checks (flexure / SLS / shear with the real strands and fitments), then owner items; the combined-actions run record shows '+ uncommitted changes' (run before the commit; same engine). 2026-11-02 (later): P6 stage 5 DONE — girder checks on B12626 with the real strands / fitments (projects/B12626/model/B12626.girder_checks.md): edge girders ULS 1.04 / shear 1.01, others <= 0.96; finding H-12 (SDL factor 2.0 on barriers). G-13 fixed (report header quoted BR13A decisions; summary table added). Tests 2026-11-02 with dist built (./build.sh reproduces sha 710b259d…): test_girder_checks 8/8 (fixed: solid-end rows skipped), test_girder_sls 11/11, test_girder_shear 5/5 (the old 'crash at baseline' was the missing dist build), test_mct 21/22 — the dashboard's frozen v15 .mct parser cannot read SR / SECT-SCALE / COMPOSITE-GEN (known since X-3). Next: owner decisions H-11 / H-12; then traffic moving-load MIDAS export (deferred) or G-1 / G-3. 2026-11-02 (H-12): owner rule implemented (ADR-048): barriers with drawing weights SDLs 1.4, others SDLp 2.0; SDL case split (loads.sdl_case part=, combinations SDLs primitive, .mct SDLs case); B12626 edge girders 1.04 -> 1.02 ULS, shear 0.98; piles SLS +1.2 % / ULS +2.5 % vs 109035. Tests: b12626_chain 16/16, loads 25/25, combinations 35/35, earthquake 16/16, concurrent 17/17, mct 21/22 (dashboard frozen parser, known). Open: H-11 (hog / losses). 2026-11-02 (P7.1, ADR-049): web app `app/server.py` (Flask API over the existing tools) + TypeScript front end `app/web/src` bundled to `app/static/app.js` (rebuild: cd app/web && npm install && npm run build); data in git-ignored `app_data/`; tests/app/test_server.py 16/16; screenshots via tests/app/shots.js. Owner keeps H-11 open. Read-only online copy published (app/export_static.py; claude.ai artifact 8cAic3UrwUA6VgD8UkFFqJ). P7.3 DONE (ADR-050): Decisions tab + value entry via accept_decision / propose_override; fixed accept_decision (record decision field), B12626 D-1 log entry, value rounding on screen; tests/app 22/22, schema suites pass. Waiting on the owner: (1) may drawings go to the Claude API for extraction (P7.2); (2) run locally or on a server with log-in. D-1 on B12626 is still PROPOSED — owner accepts in the app. P7.4–P7.7 DONE (ADR-051): start scripts, modes (earthquake.lumped_mass shared), Sections tab, app/report.py (chain step 'report'), Verification tab; tests/app/test_report.py 9/9, test_server 25/25. P7.8 revision history + diff DONE (Decisions tab); verification compares drawing envelopes with the platform maximum. 2026-11-04 P8.2 (ADR-053): HLP platform in traffic engine; AS5100.2:traffic:HLP400 is placeholder-unverified (owner to check Fig 7.3); SB02 rerun 20261104-090706: HLP governs some SLS only, girder gap -15 % stays (report critical girder likely SB01). Next: SB01 (B12452) or 0.5 SM1600 with HLP; B12626 HLP row. 2026-11-04 P8 (ADR-052): third bridge B12453 SB02 extracted (437 values), D-1 proposed (116), chain runs end to end; test_b12453_chain 9/9; report benchmark projects/B12453/model/COMPARISON_REPORT.md (girder M -15 %, piles N -11/+9 %, pile M -52 % placeholder soil; HLP400 not modelled). Next: HLP400 vehicle (standards entry UNVERIFIED) + rerun compare_report.py on a new run. Earlier: Next per docs/P7_PLAN.md: P7.8 rest (new table rows: format needs an add-row operation); P7.2 / P7.9 wait on the owner.

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
