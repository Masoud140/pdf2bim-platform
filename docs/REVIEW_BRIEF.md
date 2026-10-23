# Review brief — PDF 2 BIM single-span bridge platform

*Prepared 23 October 2026 for an independent reviewer. Please review the approach and the roadmap (sections 5–7) and answer the questions in section 8.*

---

## 1. Your task as reviewer

You are reviewing an engineering software platform that is part-built. It is not finished.

Please judge:
- whether the **architecture and roadmap** will get us to the goal in section 2;
- what is **missing, wrong or in the wrong order**;
- what you would **change, drop or add**.

Be specific and critical. A short list of concrete problems is more useful than general praise.

## 2. The goal

An **AI agent, working with a bridge engineer**, takes the **preliminary / GA drawings (PDF) of a single-span bridge** plus **engineering input**, and then:
1. extracts every value with a confidence tag;
2. builds the structural model (superstructure grillage + bearings + substructure + piles + ground springs);
3. runs the analysis and the AS 5100 load combinations;
4. designs the girders (Super-T now, precast planks next) to AS 5100.5;
5. produces reports and the bearing, headstock and pile design actions.

Preliminary data is always incomplete. The engineer and the AI must be able to fill gaps, decide, and **change values that are in the preliminary data**. Every decision is recorded.

The platform must work for **any** single-span Super-T or plank bridge. **BR13A is only the first test case.**

## 3. Non-negotiable rules (from the project)

- **No invented values.** Every value is tagged as one of:
  - **Direct:** printed on a drawing;
  - **Calculated:** documented arithmetic from other values;
  - **Missing – Flagged:** blank, not filled;
  - **Standard – verify:** a code or product value to check against the licensed copy;
  - **Input (user)** / **Confirmed (engineer)**;
  - **Assumed:** a placeholder the engineer agreed to so the work can proceed. Its value is stated at the input, and it must say what will replace it;
  - **Model:** a modelling choice.
- **A blank flagged value is better than a guessed one.**
- **Work in small stages**, with the engineer confirming between them.
- **Coordinates** are true project survey coordinates (MGA). There is no arbitrary local origin, except a documented export offset.

## 4. What exists today

**Repository:** https://github.com/Masoud140/pdf2bim-platform (private).
- `main` = step A + format B1.
- Branch `step-b2-br13a` = B2 + v45, waiting for review.

**Build and check:**
- `./build.sh` builds `dist/BR13A_grillage_dashboard.html`.
- `python3 tests/schema/test_schema.py` checks the format.
- `node tests/*.js` runs the browser checks (Playwright + Chromium).

### 4.1 The BR13A dashboard (single offline HTML, about 3.5 MB)

**Test bridge:** M7–M12 southbound exit ramp. 30 m single span, 34.5° skew, on a 400 m radius curve with spirals. Four 1515 mm deep PSC Super-T girders, a 200 mm deck, spill-through abutments on four Ø1050 rock-socketed piles each.

| Area | What it does | Status |
|---|---|---|
| Takeoff | Every row of the Excel takeoff (abutments, piles, alignment), tagged | Works; BR13A data |
| Alignment | Spiral–arc–spiral and vertical curve, support lines, skew | Works; method in `CONTROL_LINE_RECONSTRUCTION_METHOD.md` |
| Grillage | Deck grillage (girders, transverse strips, rigid offsets, dummies, cross girders) | **A fixed BR13A MIDAS file (.mct) embedded in the page**. A parametric "live" mesh exists for the deck only |
| Integrated model | Bearings as elastic links (fixed / free / elastomer); sill beams; columns and piles; rock springs; soil springs set by soil level per pile; toe supports | Works, by patching the fixed .mct text |
| Solver | 3D frame + springs + links, dense Cholesky, subspace modes | Works in the browser; a Python reference solver exists |
| Construction stages | Girder alone → wet deck → composite; creep and shrinkage | Works |
| Traffic | M1600 / S1600 influence surfaces, lane layouts, envelopes | Works |
| Loads | Self weight and superimposed dead load; earth pressure and traffic surcharge; braking; centrifugal; uniform temperature; temperature gradient; shrinkage + creep shortening; wind (transverse, vertical, longitudinal, on vehicles); earthquake (response spectrum, CQC + missing mass, 100/30 directions) | Works; most site inputs are **Assumed** placeholders |
| Combinations | AS 5100.2 combination generator (Table D3 logic, 1,315 rows for BR13A), applied to every result with envelopes | Works |
| Outputs | Bearing schedule, pile actions along each pile, headstock action envelopes, CSV | Works |
| Super-T design | AS 5100.5 fibre / strain-compatibility engine. SLS stresses, crack control, ULS bending (N–M), shear and torsion, longitudinal tension; stations along the girder; open / solid zones; per-station strand forces from the Hog time analysis; design combination "x" = every Combos-tab row | Works. Engine checked against a worked example to about 0.1 %. **Strands and bars are placeholders** (TfNSW T4 standard layout); the BR13A strand drawings are not in the set |
| Hog Calculator | Prestress losses, camber, transfer stresses (time-step) | Works |
| Girder definition (v45) | **One Super-T definition** (drawn shape: T4 + DRG 202304 overrides) used by Hog, design, earth pressure and wind. Flange widths per girder along its length from the geometry: straight girders, edge flanges flare to the deck edge, the gap is an editable field | Works, but the analysis model and the design stations **do not use the flared widths yet** |
| Reports | Word / Excel / HTML design reports; MIDAS load-case export | Works |
| Needs Review | Roll-up of every Missing and Assumed item | Works |

### 4.2 Platform pieces (general, not BR13A-specific)

- **Bridge description format** `pdf2bim.bridge/0.1` (`schema/`, `docs/BRIDGE_DESCRIPTION_FORMAT.md`, `docs/BRIDGE_FIELDS.md`):
  - one JSON file per bridge;
  - every value is a tagged object (value, unit, tag, source / derivation / ref, status), with tag rules checked by JSON Schema;
  - tables are tagged per row; lists have any length;
  - a `custom` section holds project-specific items;
  - Super-T and plank types are both covered.
- **Decision log** (`<bridge>.decisions.jsonl`): who, what (path), from → to (value and tag), why, evidence, status (proposed / accepted / rejected / superseded), approver, and which stages are now out of date. Acceptance policy:
  - the AI accepts its own Calculated values;
  - the engineer accepts Assumed values, model choices and any change to a drawing value.
- **BR13A as the first file** (`projects/BR13A/`): 928 tagged values, 33 log entries, and an auto-generated `SUMMARY.md` of open items. Moved from the dashboard by a one-off converter.
- **Tools:**
  - `tools/dump_dashboard_state.js` dumps the state of a built dashboard;
  - `tools/summarise_bridge.py` gives tag counts, open items and decisions waiting for the engineer.
- **Project knowledge** (claude.ai project "PDF 2 BIM"): extraction rules, the tagging standard, the alignment method, the grillage modelling reference, and method notes for analysis, member properties, MCT export, and the integrated model and loads.

## 5. What is BR13A-specific today (the main gap)

1. **The analysis model is a fixed BR13A .mct.** Nothing builds a model from parameters for the full structure. A new bridge needs a hand-made model file.
2. **Model parts are found by BR13A names:**
   - section names (`G1-M_composite`, `SB_sill_beam`, `Pile…`, `RIG`, `DUM`, `TD…`);
   - group names (`AbutA`, `AbutB`);
   - bearings paired girder-by-girder by their order in the file;
   - piles numbered by toe-constraint order.
3. **The dashboard reads BR13A's takeoff rows and its own settings**, not the bridge description file. Nothing loads or saves the file yet.
4. **The grillage girder lines follow the curved control line at a constant offset.** The real girders are straight chords; the difference is up to 265 mm at midspan on BR13A. Flange and deck widths now use the chords, but the mesh does not.
5. **The grillage girder section properties are fixed** in the .mct. They do not follow the Super-T definition, and the edge-girder flare is not in the model.
6. **The page is built by string replacement** on a frozen v15 base HTML, with layers of overrides (`dsg2 → dsg3 → dsg4 → dsg5`, wrapped functions). It works and is reproducible, but it is hard to extend.

## 6. Known issues to fix (independent of the roadmap)

- **Placeholders:** 177 Assumed values in the main BR13A fields. They include site wind speed, effective temperatures, earthquake hazard (k_p, site class, response factor), soil and rock stiffness, ground levels at the piles, bearing sizes and stiffness, barrier height and mass, and the strand / bar pattern. Design and substructure results are therefore indicative only.
- **Earthquake spectral shape C_h(T)** was transcribed from memory. It must be checked against AS 1170.4 Table 6.4. Several AS 5100.2 coefficients (Cd, CL, vertical-wind eccentricity, longitudinal fraction, wind on vehicles) are placeholders.
- **There is no standards file yet.** Code values are spread through the code. Load factors are read from the combination register by pattern matching on its text.
- **Combination approximations:**
  - traffic M, V and T are enveloped separately (not concurrent);
  - the earthquake response is an unsigned envelope;
  - pile moment resultants combine two envelopes (an upper bound);
  - pedestrian load is taken as zero (footway not confirmed).
- **Not modelled yet:** internal diaphragms (only a 4500–8000 range is dimensioned), and wingwall / approach-slab interaction.
- **Unconfirmed drawing reading:** the solid end-block extent (2000 / 518 mm on the girder sheets) needs confirming.
- **Flange gap:** 30 mm = girder spacing − nominal flange width. Not confirmed as a drawing value; now an editable field.
- **Checks are not pass/fail:** tests print values against hand values. The integrated model has hand checks only (pile head stiffness vs Hetényi 2740 / 2700 kN/m, temperature elongation, gradient camber, load equilibrium). There is no MIDAS cross-check of the integrated model yet.
- **Extraction is not connected:** the PDF extraction agent writes an Excel takeoff, not the bridge description file.
- **No plank module** for the grillage or design. The Hog Calculator has TfNSW plank sections only.
- **No decision interface:** decisions are recorded by scripts, not from the dashboard.

## 7. Proposed roadmap (for your review)

Each stage ends with an engineer checkpoint. BR13A is the regression test, and a second, different bridge proves the result is general.

| Stage | Work | Accept when |
|---|---|---|
| **R0** | Review and merge B2 + v45 (format, BR13A file, one Super-T definition, flange widths) | Engineer sign-off |
| **R1 Geometry engine** | From the bridge description only: alignment, support lines and skew, girder chords between bearings, deck edges, flange and deck widths, pile positions. Any girder count and skew | Reproduces BR13A geometry to 1 mm; a made-up straight square bridge passes |
| **R2 Section engine** | Super-T T1–T5 + drawing overrides; open / solid end; flared flange per segment; composite with deck; closed-cell torsion (finite-difference J); plank family later. Library file of products (`lib:`) | BR13A G2 matches today's model (A, I) exactly; solid-end J ≫ open J; edge girders change |
| **R3 Model builder** | Grillage mesh rules (from the grillage modelling reference), transverse members, cross girders, dummies, rigid offsets, bearings, headstocks, columns and piles, springs by soil layer. Members tagged by **role**, not name. Writes the internal model + MIDAS .mct | Built BR13A model matches the current results: reactions, pile head stiffness, first modes, bearing schedule within a stated tolerance; MIDAS import round trip |
| **R4 Callable library** | Solver, loads, combinations, design and reports as functions an agent can call without the browser (language choice: see Q3). The dashboard loads a bridge file and becomes a viewer / editor | Same BR13A results headless and in the dashboard |
| **R5 Standards + product files** | One reviewed `standards/AS5100-2017.json` (factors, spectra, gradient, wind coefficients, densities) and `library/products.json` (Super-T, planks), each value checked once against the licensed Standard | Every `std:` / `lib:` reference resolves; no code constants left |
| **R6 Extraction → description** | The extraction agent writes the bridge description and the Query Register directly; decisions in the dashboard (propose / accept / reject) | A fresh BR13A extraction matches the migrated file |
| **R7 Plank module** | Plank sections from the engineer's plank drawings, plank grillage (shear keys, transverse stressing), plank design | Worked example + engineer review |
| **R8 Pilot bridge** | A second, different bridge (plank, or straight / square Super-T) from PDF to design, with **no code change** | Only a new description file and decisions were needed |
| **R9 Agent skills** | One skill per stage (extract → describe → queries → model → analyse → combine → design → report), with checkpoints and the Query Register as the gate | An agent runs the pilot with the engineer at the checkpoints |

**Throughout:** turn the tests into pass/fail assertions; keep the BR13A regression green; replace each Assumed value when real data arrive (the decision log records each one).

## 8. Questions for the reviewer

1. **Order.** Is it right to build geometry → sections → model builder (R1–R3) before the callable library (R4) and the extraction link (R6)? Or should the library boundary come first?
2. **Mesh geometry.** Should the model builder place grillage girder lines on the **straight chords** (the real girders) rather than on curves parallel to the control line? What should happen to the transverse members and deck edges on a curved, skewed deck?
3. **Language.** The engines are JavaScript today, running in an offline HTML page, and a Python reference solver exists. Should the callable library be JavaScript (one codebase with the dashboard), Python (better for agents and testing), or Python with the dashboard as a pure viewer?
4. **Format.** Is one JSON file per bridge with per-value tags and an append-only decision log the right core? Anything missing, for example versioning, multi-user editing, or links from results back to the inputs they used?
5. **Approximations.** Are the combination approximations (non-concurrent envelopes, earthquake envelope, moment resultant upper bound) acceptable for preliminary design? Where would you insist on concurrent actions?
6. **Validation.** What is the minimum independent validation before the engineer can rely on the outputs: MIDAS cross-check, hand checks, a second software, published examples?
7. **Scope.** Is "single span, Super-T and plank" the right first scope? What should be explicitly out of scope (integral abutments, multi-span, steel)?
8. **Risks.** What are the biggest risks you see? For example licensing of Standards content, maintainability of a single HTML page, data-entry burden, or the engineer's trust in AI-proposed values.

## 9. How to look at it

```bash
git clone https://github.com/Masoud140/pdf2bim-platform && cd pdf2bim-platform
git checkout step-b2-br13a
./build.sh                                   # dist/BR13A_grillage_dashboard.html (open in a browser)
python3 tests/schema/test_schema.py          # format rules, BR13A file
python3 tools/summarise_bridge.py projects/BR13A/BR13A.bridge.json
```

Start with:
- `README.md`, `docs/ROADMAP.md`, `docs/BR13A_SPECIFIC.md`;
- `docs/BRIDGE_DESCRIPTION_FORMAT.md`, `docs/INTEGRATED_MODEL_LOADS_METHOD.md`;
- `projects/BR13A/SUMMARY.md`.
