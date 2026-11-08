# Architecture and engineering decisions (ADR log)

- **Purpose:** this file records platform-level decisions. Bridge-specific engineering decisions are in each project's decision log (for example `projects/BR13A/BR13A.decisions.jsonl`).
- **Status values:** proposed / accepted / superseded.
- **Rule:** a new decision is added at the end. A decision is never edited away; it is superseded by a new one.

| ADR | Decision | Status | Date / by |
|---|---|---|---|
| 001 | Data tags and no invented values | accepted | project rule (owner) |
| 002 | Bridge description JSON is the canonical and exchange format | accepted | 2026-10-23, owner |
| 003 | Girders are straight chords between bearings | accepted | owner, v44 |
| 004 | One Super-T definition; flange widths from the grillage | accepted | 2026-10-23, owner |
| 005 | Acceptance policy for values | accepted | 2026-10-23, owner |
| 006 | Python engineering core, TypeScript front end, strangler migration | accepted (timing open) | 2026-10-23, master instruction |
| 007 | Bearings: fixed at one support, free longitudinally at the other | accepted | owner |
| 008 | Format 0.2: immutable original, append-only overrides, current value, significance, revision + hash | accepted in principle, with safeguards (spec `FORMAT_0_2_SPEC.md`; implementation P0.2) | 2026-10-23, owner |
| 009 | Standards as versioned data; framework separate from content approval | architecture accepted; **no content approved** (spec `STANDARDS_DATA_SPEC.md`; implementation P0.3) | 2026-10-23, owner |
| 010 | Planks after the shared platform is verified | accepted | 2026-10-23, owner |
| 011 | Wind, temperature and earthquake inputs stay as name/value tables | accepted | 2026-10-23, owner |
| 012 | Verification tolerances are provisional test thresholds, not release gates | accepted | 2026-10-23, owner |
| 013 | `main` is controlled by the owner; no merges by the agent | accepted | 2026-10-23, owner |
| 014 | The BR13A baseline is a regression reference, not a verified result | accepted | 2026-10-23, owner |
| 015 | First implementation task is P0.1 (baseline) before P1 geometry | accepted, P0.1 done | 2026-10-23, owner |
| 016 | Progress saving and recovery policy | accepted | 2026-10-23, owner |
| 017 | Format 0.2 implementation choices (exact-key migration, null unknown units, provenance rule, approval transitions) | provisional (agent, reversible) | 2026-10-24, Claude |
| 018 | Autonomous development and minimal communication | accepted | 2026-10-24, owner (project instructions) |
| 019 | Standards inventory choices (null edition, row-per-factor, specialist flags) | provisional (agent, reversible) | 2026-10-24, Claude |
| 022 | P3a model: dashboard model 2 topology on straight chords; Python solver; bearings as links in girder axes; modelling constants as the dashboard (tag Model) | provisional (agent, reversible) | 2026-10-24, Claude |
| 021 | P2 sections: one Super-T definition = product type + `supert_types[].shape`; asymmetric flared flanges from P1; composite on the P1 deck width; FD torsion | provisional (agent, reversible) | 2026-10-24, Claude |
| 020 | P1 geometry definitions: support line by printed bearing; bearing centre = girder line ∩ support line; chord; flange square to chord | provisional (agent, reversible) | 2026-10-24, Claude |

---

## ADR-001 Data tags and no invented values

- **Decision:**
  - Every value carries exactly one tag: Direct / Calculated / Missing-Flagged (plus Standard-verify, Input-user, Confirmed-Engineer, Assumed, Model in the format).
  - Placeholders are allowed only to let the model run. They are tagged Assumed, shown next to the input and listed in Needs Review.
- **Why:** the owner's absolute rule. A blank flagged value is useful; an invented value is misleading.
- **Effect:** schema validation enforces it (`schema/`); the Needs Review roll-up exists in every output.

## ADR-002 Bridge description JSON is the canonical and exchange format

- **Decision:**
  - The format is `pdf2bim.bridge/0.1` (`docs/BRIDGE_DESCRIPTION_FORMAT.md`, field catalogue `schema/fields.py`).
  - Each bridge also has a decision log (JSONL).
  - Every project is different, so a `custom` section holds values outside the catalogue; they can move into the catalogue later.
- **Why:** one portable, reviewable input for every layer and for the AI. It is independent of the database and the UI.
- **Effect:** all engines must read their input from this file (directly or through the database later). The dashboard does not do this yet (gap B-1).

## ADR-003 Girders are straight chords between bearings

- **Decision:** a precast girder is a straight member from its bearing at one support to its bearing at the other. Deck edges follow the alignment; edge flange widths take up the difference.
- **Why:** this is how precast girders are made and erected.
- **Effect:** the geometry engine (P1) and the model builder (P3). The current mesh still uses offset curves (gap C-2).

## ADR-004 One Super-T definition; flange widths from the grillage

- **Decision:**
  - There is one place that defines the Super-T (type + drawing overrides). Section properties, the Hog Calculator and design all read from it.
  - Edge girders flare: the outer flange edge of G1 and G4 lines up exactly with the deck edge (edge setback 0).
  - Inner flange edges: half the distance to the next girder minus half the gap.
  - The gap between flanges is an engineer-editable field (default from the drawing: spacing − flange).
  - Widths are computed along each girder from the grillage geometry.
- **Why:** owner instruction. The earlier design used a different section (1825) from the model (1515); see BR13A decision D-7 (superseded).
- **Effect:** implemented in the dashboard v45 (`src/gdef.js`). The flare is not yet applied to model stiffness or design (gap D-2).

## ADR-005 Acceptance policy for values

- **Decision:**
  - The AI may accept **Calculated** values it derived, with the derivation shown.
  - The engineer must accept **Assumed** and **Model** values and any change to a **Direct** value. `approved_by` is required; a Direct override needs evidence.
  - **Missing** values are never accepted; they stay open until data arrives.
- **Why:** the AI must not approve its own assumptions.
- **Effect:** enforced by `schema/decision.schema.json`.

## ADR-006 Python engineering core, TypeScript front end, strangler migration

- **Decision:** the target is:
  - a Python core (geometry, sections, model builder, solver interface, loads, combinations, checks, verification);
  - a TypeScript web front end;
  - an API between them;
  - PostgreSQL and versioned file storage when multi-user is needed.

  Migration is one module at a time behind interfaces. Each module is verified against the JavaScript dashboard and independent benchmarks before it is used. The JavaScript dashboard stays the working reference.
- **Why:** the single HTML file built by string replacement cannot become a multi-user platform. Engineering code must be callable without a browser and testable.
- **Open:** when the first Python module starts. Recommended: P1 geometry, after the P0 regression snapshot.

## ADR-007 Bearing restraint

- **Decision:** bearings are fixed at one support and free longitudinally at the other. Transverse and vertical restraint follow the bearing data in the bridge description.
- **Why:** owner instruction.

## ADR-008 Format 0.2 — original, overrides, significance, revision and hash

- **Decision (owner, 2026-10-23):** approved in principle, with these safeguards:
  - The original extracted value is **immutable**.
  - An engineer's override is stored **separately**, and the current accepted value is clearly identified.
  - Each change records: original source reference, old and new values, units, reason, evidence, author, timestamp, approval status.
  - The hash coverage and canonicalisation are defined exactly. The hash identifies content and detects change; it is **not** proof that the data are correct.
  - The schema migration and backward compatibility with 0.1 are documented. Schema tests and a worked example (original → override → approved value) are included.
- **Design:** `docs/FORMAT_0_2_SPEC.md`.
- **Status:** **implemented 2026-10-24** on branch `p0.2-format` (`FORMAT_0_2_SPEC.md` §6); tests 47/47 PASS. Awaiting owner review and merge.

## ADR-009 Standards data — framework now, content by review

- **Decision (owner, 2026-10-23):** a centralised, versioned standards-data architecture is approved in principle. The implementation of the framework is kept separate from approval of its engineering content.
- **Each entry records:**
  - standard, edition and amendment;
  - clause / table / authorised reference;
  - units, applicability and calculation context;
  - verification status, reviewer and date;
  - implementation version;
  - open interpretation.
- **Safeguards:**
  - Coefficients from the existing code are never entered as approved; their highest status is `code-extracted-unverified`.
  - The owner takes responsibility for engineering review and will arrange independent verification against authorised copies of AS 5100 and AS/NZS 1170.4.
  - Rules that need specialist interpretation are flagged for that review.
  - Until values and implementations are verified, the calculations that use them are flagged **unverified** and are not presented as validated final design results.
- **Design:** `docs/STANDARDS_DATA_SPEC.md`.
- **Status:** **framework implemented 2026-10-24** on branch `p0.3-standards` (`STANDARDS_DATA_SPEC.md` §5); 28 / 28 tests pass. **Content: 63 entries, all `code-extracted-unverified`. Nothing approved.**

## ADR-010 Planks later

- **Decision:** precast planks are added after the shared platform (P1–P6) is verified on Super-T. The owner will provide plank drawings for the product library.

## ADR-011 Environmental inputs as tables

- **Decision:** wind, temperature and earthquake inputs stay as name/value tables in the bridge description, not fully typed fields, for now.
- **Why:** owner priority is to read and model every bridge from primary and engineering input first.

## ADR-012 Tolerances are provisional

- **Decision (owner, 2026-10-23):** the proposed tolerances are approved as **initial engineering-software test thresholds for review**. They are not universal acceptance criteria.
- **Retained:** coordinates 1 mm, equilibrium 0.1 %, modal periods 3 %.
- **Before any tolerance is used as a release gate,** its justification and applicability are documented. The complete table (quantity, benchmark, metric, tolerance, justification, action) is in `VERIFICATION_STRATEGY.md` §4.
- **Distinctions the table must keep:**
  - coordinate tolerance is generation accuracy, not survey or drawing uncertainty;
  - equilibrium defines its reference load, the force and moment residuals, and numerical precision;
  - modal comparison requires the same benchmark boundary conditions and mass source, MAC pairing, and physically comparable modes.
- **Rule:** a passing tolerance never overrides a failed physical check, an incorrect boundary condition, a modelling error or an unresolved discrepancy. Stricter or different criteria are set where the quantity needs them.

## ADR-013 Control of `main`

- **Decision (owner, 2026-10-23):** no branch is merged into `main` until the owner has reviewed and approved it.
- The agent:
  - keeps `step-b2-br13a` and `docs/p0-architecture` available;
  - prepares a merge review (`docs/MERGE_REVIEW.md`);
  - works on new feature branches from the appropriate reviewed base;
  - never force-pushes or overwrites branches.

## ADR-014 Baseline is a regression reference

- **Decision (owner, 2026-10-23):** the P0.1 baseline records what the current software produces, so that regressions can be detected. The outputs are not treated as correct because they are reproducible.
- Verified reference results are kept separate from indicative outputs. Today every quantity is `indicative`; only the internal consistency checks are evaluated pass / fail.
- Replacing the reference snapshot is a reviewed change with its reason.

## ADR-015 Order of work

- **Decision (owner, 2026-10-23):** P0.1 (baseline) before P1 (geometry in Python).
- The substantial Python geometry work starts only after the baseline and the architecture decisions are documented and the P1 plan is reviewed.
- **Proposed sequence:** P0.1 → (review) → P0.2 format 0.2 → P0.3 standards framework → P1. P0.2 / P0.3 may run before or alongside P1 at the owner's choice.

## ADR-016 Progress saving and recovery

- **Decision (owner, 2026-10-23):**
  - Progress is saved incrementally throughout every substantial task (commit and push at checkpoints).
  - At the end of each session, the next session must be able to resume from the last verified checkpoint without asking the owner to repeat history.
  - A save to GitHub is reported only after it is verified against the remote.
- **Implementation:** `DEVELOPMENT_PRINCIPLES.md` §5; `docs/NEXT_SESSION.md` (resume point) and `docs/CURRENT_STATUS.md`; Claude Project memory and `claude/SOURCE_REPOSITORY.md` updated at session end.

## ADR-017 Format 0.2 implementation choices (provisional)

- **Decision (agent, 2026-10-24; reversible; owner review invited):**
  1. Migration rebuilds an original only when the decision key equals the record path exactly. **Alternative rejected:** matching parent keys, which wrongly gave the Super-T depth the old section name as its "original".
  2. Units not recorded in 0.1 stay `null`. **Alternative rejected:** parsing units from free-text reasons.
  3. New provenance rule: record source / derivation / ref describe the current entry.
  4. Approval transitions are limited to proposed→accepted/rejected and accepted→superseded.
- **Consequence:** BR13A has 4 reconstructed originals (D-6). D-8's earlier value stays only in the decision log.
- **Risk:** none to engineering values. All 928 values, units, tags and statuses are unchanged (tested).

## ADR-018 Autonomous development policy

- **Decision (owner, 2026-10-24, project instructions):**
  - The agent works through the roadmap autonomously and makes reversible decisions itself, recorded here.
  - It asks only when safety, the validity of calculations, licensing / confidentiality / security, or an irreversible action is at stake.
  - End-of-session reports are short (completed / tests / risks / next); detail stays in repository files.
  - **Progress is saved continuously** (ADR-016).
- **Consequence:** owner reviews of earlier stages (P0, P0.1) remain open but no longer block independent next stages. `main` is still never merged by the agent.

## ADR-019 Standards inventory choices (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  - Edition and amendment are left `null` because the code does not record them. **Alternative rejected:** assuming the current editions.
  - Each load-factor row is one entry (`uls`, `uls_relieving`, `sls`).
  - Project inputs (wind speed, Z, temperatures) are excluded from standards data and listed separately.
  - The extractor keeps a review only while the code value is unchanged.
- **Consequence:** every calculation is labelled UNVERIFIED until the owner's reviewers approve entries.

## ADR-020 P1 geometry definitions (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. A support line is defined by its printed whole-circle **bearing**. The new optional column `support_lines.bearing` (format 0.1 and 0.2, additive) holds it. Skew alone is not used: drawings give no sign convention, and BR13A showed the skew is chord-referenced.
  2. **Bearing centre** = girder line (control line offset by `line_offset`, square) ∩ support line. This follows the catalogue definition "offset at support bearing line".
  3. **Girder** = straight chord between bearing centres, extended by `bearing_offset`.
  4. **Flange edges** are measured square to the chord, as the dashboard `gwWidth` does.
- **Alternatives rejected:**
  - local normal + skew: wrong by up to 195 mm on BR13A;
  - curved girder lines: contradict ADR-003.
- **BR13A:** the support bearing exists only in a note. It is proposed as D-34 (by AI, not accepted). Geometry is built with `allow_proposed` and labelled PROVISIONAL until the engineer accepts D-34.
- **Consequence:** P3 must build the model on these chords and bearing centres, not on the frozen-mesh nodes (F-4).

## ADR-021 P2 section definitions (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. **One Super-T definition** = product type (`lib:supert/<type>`) + the drawing dimensions in the new catalogue table `supert_types[].shape`. Engines never read shape values from `custom`.
  2. **Flange tips:** left and right are taken separately from the P1 flange edges, so the edge-girder flare enters the precast section, per ADR-004 (owner: edge Super-T widths flare to match the deck).
  3. **Composite:** deck slab of the P1 tributary width on the flange plus the `haunch`, transformed by n = E_deck / E_girder.
  4. **Torsion:** finite differences on the real geometry, as one material.
  5. **Missing solid-end zones are reported,** not assumed.
- **BR13A:**
  - D-35 (13 shape rows, including ttf 90 that the B2 importer had skipped) — proposed;
  - D-36 (haunch Assumed 0 mm) — proposed.

  Sections are labelled PROVISIONAL until both are accepted.

## ADR-022 P3a model builder choices (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. Keep the dashboard's engineer-confirmed **Super-T model 2** topology (D-15), rebuilt on the straight chords from P1, with P2 sections along each girder and nodes at every section change.
  2. Use the dashboard's modelling constants: dummy × 1e-3, rigid × 1e3, deck strips with full rectangular J, deck-strip weight 0, cross girders weighted. They are **reported as Model settings**, so a Hambly-style alternative (for example slab J = b t³/6) remains an open engineering choice.
  3. **Bearings:** zero-length links in girder axes, stiffness 1e9 for fixed and 0 for free; elastic bearings come in P3b.
  4. **One Python solver** for all analyses. It was verified against the dashboard solver on the integrated BR13A model to 7e-10.
- **Alternatives considered:**
  - model 1 (girder centrelines only): rejected because the engineer confirmed model 2;
  - keeping the frozen .mct: rejected because the platform must build models for any bridge.
- **Consequence:**
  - the BR13A superstructure reproduces the frozen model within −1.2 % weight, 2 % deflection and ±11 % per-bearing reaction, with the differences explained (P3_MODEL_METHOD §3);
  - new proposed inputs D-37 (cross girder) and D-38 (solid end zones).

## ADR-023 P3b integrated model choices (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. The substructure is **built from the description**, not taken from the frozen .mct (the dashboard only patches its frozen sill / pile mesh): sill beam on its plan setout centroid, soffit through the pile-head RLs, piles split at rock / ground / layer levels, springs by the dashboard rule (kh · D · tributary).
  2. **Bearings are short vertical links** from the Direct seat RL to the girder soffit (the frozen model spans 1.78 m from the sill top to the girder node line). The Assumed bearing height is checked against the drawn gap, not used for geometry (F-6).
  3. **Bearing positions come from P1** (GA girder setout ∩ support line). The abutment drawings' bearing chain disagrees by up to 530 mm (F-5); the engineer must resolve it.
  4. **Elastomer stiffness method as the dashboard** (Ec = 6 G S², bulk 2000 MPa). The coefficients are read from `standards/data` (unverified), so results carry the UNVERIFIED label.
  5. **The solver refuses numerically singular systems** (LU pivot ratio < 1e-13, or free-dof residual > 1e-4 of the largest load), because a mechanism was otherwise solved silently.
- **Alternatives considered:**
  - keep the frozen sill / pile mesh: rejected, since the platform must build any bridge;
  - long links to the girder node line, as frozen: rejected, because it is not the physical bearing height;
  - take bearing positions from the abutment drawing: deferred until F-5 is resolved.
- **Consequence:** BR13A vs the frozen integrated model: weight −0.6 %, bearing Rz within 5.6 %, pile toe within 2.4 %, midspan within 0.3 mm. New proposals D-39 (sill setout), D-40 (layer 12 mm, Assumed), D-41 (seat RLs).

## ADR-024 P3b load case, MIDAS writer and modes (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. **Area and line loads are discretised in plan, with cells clipped exactly at the skewed deck ends,** and distributed by barycentric weights on a triangulation of the deck nodes (exact force and first moments). Line bracketing was tried and rejected: it lost moment conservation for 1.2 % of the load in the skew corners.
  2. **The .mct writer writes verified syntax only.** Elastic links and springs are written in the dashboard's format, marked UNVERIFIED. Nodal loads are not written until a native export documents `*CONLOAD`. Self weight is preserved through per-member materials (density = w / A).
  3. **Composite girders go to VALUE sections** (stiffness only) for now; COMPOSITE-GEN is deferred.
  4. **Modal mass = the static self weight + SDL** (deck strips, dummies and rigid members massless). The dashboard's modal mass rule (every member weighted) is **not** reproduced except to verify the solver (finding H-3).
  5. **The remaining load cases and the combinations move to a new stage P3c,** so that P3b closes with the model, bearings, SDL, export and modes.
- **Consequence:** the BR13A SDL total is within 0.3 % of the dashboard, and the distribution alone within 8 %. Modal solver = dashboard to 4.5e-8. The .mct needs the engineer's import test. Open items: M-1 (SDL split at A between the models), M-2 (horizontal modes 5–8 % shorter), H-3.

## ADR-025 P3c traffic engine (provisional)

- **Decision (agent, 2026-10-24; reversible):**
  1. **Traffic by influence surfaces on the integrated model,** with the dashboard's algorithm ported and generalised.
  2. **Load distribution by barycentric weights** on the deck triangulation (as the SDL), **not** the dashboard's line rule, which turns off-line bearing nodes into one-node "lines" (H-5). The line rule is kept only as an option, to reproduce the dashboard in tests.
  3. **The lane group is swept across the carriageway by default** (0.1 m), not packed at the left kerb (H-4).
  4. **Traffic constants inventoried as unverified standards data** and read through the accessor.
  5. **Defaults kept from the dashboard and reported as Model settings:** lateral wheel shift ±0.4 m, patterned UDL, no DLA on the UDL, 0.25 m steps.
- **Consequence:**
  - with the dashboard's rule, the engine reproduces the dashboard's envelope to 0.01 % (moments);
  - BR13A M1600 girder moments vs the dashboard sweep: −2 … +6 %.
  - The dashboard's design-time traffic results are affected by H-4 (G3 / G4 and outer bearings understated) and H-5 (inner bearings overstated, moments understated by 1–6 %); the owner decides on the dashboard.

## ADR-026 P3c imposed-strain, horizontal, wind and earthquake cases (provisional)

- **Decision (agent, 2026-10-25; reversible):**
  1. **Each case is ported from the dashboard and verified with an isolation run** (the P3c method on the dashboard's frozen model) before being run on the P3b model.
  2. **Corrections kept, not reproduced:**
     - the gradient is integrated exactly over each element's own section (not one design section);
     - the earth-pressure retained height is calculated from the levels (not a built-up height with an assumed 0.15 m bearing zone);
     - wind levers are measured from the model's node level (H-6);
     - the vertical-wind split uses exact statics (H-7);
     - the earthquake mass is the static self weight + SDL (H-3).
  3. **Centrifugal force uses the smallest alignment radius under the deck** (Model, conservative); wind at the ULS speed with (V/V_uls)² scale factors.
  4. **The combinations are a separate next stage,** after their remaining constants are inventoried.
- **Consequence:** every P3c case reproduces the dashboard on the dashboard's own model, to round-off or to its documented differences. On the P3b model the differences come from the documented model and input differences (M-2, M-3, H-3, retained height).

## ADR-027 P3c AS 5100.2 combinations (provisional)

- **Decision (agent, 2026-10-25; reversible):**
  1. **The dashboard's combination generator and evaluation are ported unchanged in logic** (`genAll`, `rxCombine`), with the traffic modelled as one moving-load case per vehicle model (lane factors inside the traffic envelope). The per-lane mode is not ported.
  2. **Every factor is read from the standards data** (`AS5100.2:load_factor:*`, new `AS5100.2:combination:*`), all code-extracted-unverified; none is approved.
  3. **One shared response set** (bearings, pile element ends, pile heads, springs) for the static cases, the traffic influence and the earthquake RSA, with fixed-end forces included in static values.
  4. **Only actions with an analysed case take part by default;** Missing-Flagged description items (pedestrian, flood, collision) are listed as not combined, not silently zero (the dashboard keeps them selected with zero effect: H-8).
  5. **Earth pressure is carried by SOo** (other fills) because the fill category is not in the description; recorded as a provisional input (larger adverse and smaller relieving factor).
- **Consequence:** the generated rows equal the dashboard's for 9 register / option sets, and the evaluation of the dashboard's primitives is exact. Combined bearing and pile actions on the P3b model differ from the dashboard's only through the load cases (H-4, H-5, M-1, M-3). Finding M-4 (A-G4 bearing uplift in the combined minimum) goes to the engineer. Girder and headstock responses are not yet in the response set.

## ADR-028 Combined-action schedule conventions (provisional)

- **Decision (agent, 2026-10-25; reversible):** section actions are reported on the +x face of each member end in member axes (girder M sagging +, N tension +; pile N compression +, pile moments projected on the sill axis / its normal); every extreme carries its governing row and position; the schedule is values only (no capacity check) and records the input hash and engine commit.
- **Consequence:** the schedule can feed P4 design checks without re-deriving signs; the P3 combination stage is closed. Concurrent actions (M with V, T) are not yet available (P4).

## ADR-029 P4.1 concurrent traffic actions by state reconstruction (provisional)

- **Decision (agent, 2026-10-25; reversible):** concurrent traffic actions come from rebuilding, per governing response, the exact load state of the envelope search (layout, lane ranking and factors, patterned UDL, vehicle position) as explicit point loads, then evaluating every response under it. The envelope algorithm itself is unchanged.
- **Alternatives:** storing the argmax state for every response during the envelope (memory × responses, more intrusive); a separate optimisation per interaction (later, P4.3 if needed).
- **Consequence:** each extreme has its concurrent actions, exactly consistent with the envelope (1e-15); concurrent values are admissible (inside every envelope). The concurrent pile resultant is a lower bound and the √ of separate envelopes an upper bound of the true largest resultant.

## ADR-030 P4.2 concurrent combination rows (provisional)

- **Decision (agent, 2026-10-25; reversible):** a concurrent vector is built for the governing row of each extreme by replacing each envelope term with the single state that gives the value `combine` took (traffic state, governing wind / surcharge part). Earthquake terms keep the unsigned envelope and are flagged until P4.3; flagged values are not used as concurrent design actions.
- **Consequence:** girder, bearing and sill concurrent actions are admissible and exactly consistent with the envelopes; pile actions wait for P4.3.

## ADR-031 P4.3 earthquake concurrency and pile resultants (provisional)

- **Decision (agent, 2026-10-25; reversible):** concurrent earthquake actions are the most probable values from the CQC covariance (c_j = C_ij / R_i); pile moment resultants in earthquake rows use the response ellipse (Menun-Der) with the 100 / 30 directional terms added linearly; other rows use √ of their separate envelopes. The √ of the full separate envelopes is no longer the reported pile resultant.
- **Alternatives:** time-history (not available), SRSS of directions inside the ellipse (less conservative than the 100 / 30 rule used by the combinations), dominant-mode signs (cruder).
- **Consequence:** BR13A pile resultants fall to 0.85–0.87 of the earlier √ approximation. Method choice affects design values: **engineer to confirm** before it is used for design (listed in the owner items).

## ADR-032 P4.5 design engine port, stage 1 (provisional)

- **Decision (agent, 2026-10-25; reversible):** the Super-T flexural strength is ported unchanged in method from the dashboard to `pdf2bim/design/flexure.py`, with every coefficient read from the standards data; the strand curve stays the PCI form already used, flagged as not from AS 5100.5. The dashboard's worked-example targets are reported but not used as a pass / fail benchmark (no source; internally inconsistent section properties).
- **Consequence:** E-1 is reclassified as a reference-data question (owner: source of the worked example, or another referenced example for T11). Next stages: SLS stresses (cracked / uncracked), N–M interaction, shear and torsion.

## ADR-033 P4.5 benchmark source and design readiness (provisional)

- **Decision (agent, 2026-10-25; reversible):** the dashboard's dgBench reference-spreadsheet outputs are used as the V4 benchmark for the design modules, asserting only the quantities the dashboard itself reports as agreeing (with its tolerances) and reporting the rest. BR13A station design is not run until fpb, effective prestress, fitments and deck bars exist; nothing is assumed to fill them.
- **Consequence:** E-1 is explained (method differences in dn and dv; Mu agrees 0.13 %); the owner can confirm by supplying the spreadsheet. The next autonomous stage is the prestress-loss (Hog) port that produces the effective prestress.

## ADR-034 P4.5 prestress losses: port and inputs (provisional)

- **Decision (agent, 2026-10-25; reversible):** the dashboard's Hog time analysis is ported unchanged in method (`pdf2bim/design/prestress.py`); its constants are standards entries (unverified). Inputs come from the description, P1 / P2 and the standards tables; the inputs the description did not hold are recorded as Assumed rows of the new field `design.prestress_losses` (D-42, the dashboard's Hog-tab values), refused unless the proposals are accepted. Where the dashboard's interpretation is ambiguous the dashboard's choice is kept and flagged (ueC half-trough rule, P4-4); `age_deck_cast` is read as an age (P4-3, owner to confirm).
- **Alternatives:** a new losses model (no benchmark); the dashboard's inputs copied as constants (breaks the description-only rule).
- **Consequence:** effective prestress per strand and station is available to the design checks; port = dashboard to 1e-12; BR13A results stay indicative until D-42 and D-1 are replaced by project data.

## ADR-035 P4.5 staged SLS actions (provisional)

- **Decision (agent, 2026-10-25; reversible):** the staged SLS check (port of dgLC) takes the non-composite moment Mnc as the simple-span moment of girder self weight + wet deck on the bearings (the losses analysis loads), and the composite SLS moment from the AS 5100.2 SLS envelope with the self-weight action DLc removed; ULS uses the full envelope. Axial forces are the concurrent values of the governing rows. Temperature-gradient primary strains (with the governing SLS row's factors) and deck differential shrinkage (losses analysis) are applied as free strains (stage 7, 2026-10-25).
- **Alternatives:** a staged-construction analysis (not in the platform); the composite-model DLc as Mnc (wrong stage: girder self weight would act on the composite section).
- **Consequence:** diaphragm / cross-girder self weight on the girder alone is not in Mnc (it is in neither stage of the SLS check); the governing SLS row is chosen by the moment, not the fibre stress. Both are listed for the engineer (P4-5) and for a later stage.

## ADR-036 P4.4 MIDAS comparison format (provisional)

- **Decision (agent, 2026-10-25; reversible):** MIDAS results are compared through CSV result tables with an explicit header map and sign conventions held as data in `pdf2bim/model/midas_compare.py`, marked UNCONFIRMED until the owner's first export; modes are paired by MAC, never by order.
- **Alternatives:** reading MIDAS binary / API results (not available here); comparing by mode order (rejected by T7).
- **Consequence:** the comparison runs as soon as tables exist; the first real export may need the map corrected (one place), which must be recorded with the export as evidence.

## ADR-037 P5.1 run records and the stale rule (provisional)

- **Decision (agent, 2026-10-25; reversible):** every tool output carries a run record (description revision and content hash, decisions, engine commit, standards / library hashes, layers). An output is stale unless every description revision since it was made is explained by a decision whose `affects` misses the output's layers; standards / library changes always make it stale; engine changes are reported separately.
- **Alternatives:** path-level dependency tracking (exact, but needs every engine to declare the paths it reads — later); always stale on any change (simple, but every unrelated proposal would invalidate every result).
- **Consequence:** the `affects` field of a decision must be filled correctly (now validated by the proposer); revision notes must name their decision (the proposal and acceptance tools do).

## ADR-038 P5.3 / P5.4 import and acceptance rules (provisional)

- **Decision (agent, 2026-10-25; reversible):** extracted values enter the description only as proposals (never overwriting Direct / Confirmed values: conflicts become queries; no unit conversion by the importer); the engineer's decision is recorded by `schema/accept_decision.py` naming a person — the AI cannot accept or reject.
- **Consequence:** the interchange sheet is the extraction contract; the extractor's own multi-tab workbook needs a label → path map (P5.5). Supersession of accepted overrides is a later addition.

## ADR-039 P4.5 stage 8 shear / torsion at the girder stations (provisional)

- **Decision (agent, 2026-10-26; reversible):** the dashboard's closed-box torsion geometry (dgGeo, open section) is ported unchanged; its box parameters are mapped from the P2 Super-T parameters (n = S, Bb = bw, twT = twB = tw, sd = ttf + ifD, tb = d2 - d1, tt = 0). Actions per station: the ULS row that governs |V*| at the nearer girder element end, with the concurrent T*, M*, N* of that row (P4.2). Fitments act as the shear legs and, per design option torsion_tie_legs, as the closed torsion tie legs.
- **Alternatives:** the dashboard's own 12-point outline (a second section definition — rejected, one definition rule); enveloped V, T separately (not concurrent).
- **Consequence:** stations inside the 2 m solid end blocks are not checked (solid-block geometry not mapped yet); strand development not checked.

## ADR-040 BR13A development values (owner instruction 2026-10-26)

- **Decision (owner, Masoud, 2026-10-26):** BR13A is used to develop the software. Reasonable values based on the code and actual practice may be assumed where the drawings are silent or ambiguous, as long as they remain changeable. On that basis D-34 … D-43 were accepted (approver recorded: Masoud, with the instruction as the note), and D-44 (top-of-bearing levels and vertical grades from the drawings, 75 mm bearing unit height assumed), D-45 (fitments N12 2 legs @ 100 / 200, deck bars N16 @ 200) and D-46 (fitment covers 40 / 45, aggregate 20 mm, one tie leg per web) were proposed and accepted the same way.
- **Consequence:** the BR13A description has no proposed decisions; the tools run from accepted values (no allow_proposed). Every assumed value stays tagged Assumed with what replaces it, listed in the Query Register, and can be overridden through the normal proposal / acceptance tools. **BR13A results remain development results, not design results.**

## ADR-041 P4-6 grillage torsion stiffness factor on Super-T composite J (provisional)

- **Decision (agent, 2026-10-26; reversible; per ADR-040):** a `girder_J_factor` parameter is added to `analysis.grillage` (Assumed / Model, default 1.0) and applied to the composite Super-T J_geometric in `builder.py`. The default is α=1.0 (full FD closed-cell value).
- **Alternatives considered:**
  - α ≈ 0.5 (Hambly, grillage_modelling_reference Annex B): reduces peak governing u from ~2.8 to ~1.6 at the critical stations. Appropriate when the grillage over-estimates torsional stiffness; not justified here — the FD J is mechanically correct for the composite closed cell.
  - Torsion from the closed-box share only: equivalent to the FD value (J_geometric already uses the closed-cell Bredt formula).
- **Rationale for α=1.0:** (1) J_geometric is the mechanically correct Bredt torsional stiffness for the composite section — there is no structural reason to reduce it. (2) The high uT / uV at the current stations reflects the Assumed fitments placeholder (D-45) — the fitment quantity, not the J model, is the design issue. (3) α=1.0 is conservative: it gives an upper bound on torsion demand and on the closed-tie requirement. (4) The Hambly 0.5 correction targets grillages that use the full rectangular J for a section that is not a closed tube; the Super-T composite section IS a closed tube.
- **Sensitivity (α=1.0 vs α=0.5, T scales linearly with J):** peak u drops from 2.79 → 1.60 at G1 x=9 m; uT from 2.23 → 1.12 (still > 1.0 — closed ties required at critical stations either way). Governed by uV throughout; uL unchanged (≤ 0.83).
- **Consequence:** girder_J_factor = 1.0 is stored as Assumed (replaceable); the owner can change it to 0.5 or another value via the normal proposal tool. The high u values reflect the fitment placeholder — the design will change once actual fitments are supplied (D-45, D-1).

## ADR-042 Moment releases at rigid-arm ends of Super-T grillage model (provisional)

- **Decision (agent, 2026-10-27; reversible; per ADR-040):** in the "small box" Super-T grillage model (grillage_modelling_reference §4), each transverse rigid link connecting a main girder node to a nominal web member node (on the W1 or W2 lines) has its vertical bending DOF (solver Iy, strong axis) released at the **web/nominal-member end**. The main girder end remains fully fixed.
- **Implementation:** `builder.py` `add()` now accepts `releases={"i":"Iy"}` / `releases={"j":"Iy"}`; the rigid-arm creation block determines which end is on a web line and tags accordingly. `mct.py` emits a `*BEAMEND` block mapping solver `Iy` → MIDAS DOF code `"000010"` (Ry, position 4 in the 0-indexed Dx Dy Dz Rx Ry Rz string).
- **Basis:** grillage_modelling_reference §4: "link ends at nominal members released for moment." The rigid link transmits shear and axial force; the main girder carries all vertical bending. Releasing at the web-line end prevents the nominal member from attracting spurious moment from the rigid-arm constraint.
- **MCT syntax:** `*BEAMEND` is **UNVERIFIED** — not yet confirmed by a MIDAS Civil import. Written only when `include_unverified=True` and flagged in `rep["unverified_blocks"]` and the status string. Awaits engineer import test (same as `*ELASTICLINK`, `*SPRING`).
- **DOF mapping:** solver Iy (vertical bending, strong axis) = MIDAS Ry = DOF code position 4 (0-indexed) = `"000010"`. If other DOFs are needed, extend `_DOF_CODE` in `mct.py`.
- **Consequence:** the model topology is unchanged; rigid arms now correctly isolate bending at the main girder. Peak u values unaffected (releases are on dummy web members with near-zero stiffness contribution). MCT import test required before this result can be relied on in MIDAS.

**ADR-042 update (2026-10-28):** MIDAS rejected `*BEAMEND` ("Parsing Error ... Invalid command"). Replaced by `*FRAME-RLS` (two lines per element, boundary group `Releases`), syntax from the engineer's native BR13B export; always written.

## ADR-043 Deck-top grillage reference with member offsets (Option B, D-48)

- **Decision (owner, 2026-10-28; switchable):** the top of deck is the reference level. Nodes sit at the finished deck top (below surfacing); every member with a section is offset down to its own centroid — slab strips −t/2, cross girders −depth/2 (top flush with the deck: **Assumed**, the drawings give width × depth only), composite girders to the transformed centroid of the drawn station. Dummies, rigid arms and outriggers stay on the node plane. Owner chose to apply it to **both** the platform solver and the MIDAS export, so the two still analyse the same structure.
- **Setting:** `analysis.grillage` row `deck_top_reference` = 1 (D-48). 0 restores Option A (all members on the deck-soffit node plane, the earlier model).
- **Basis:** grillage_modelling_reference Annex C — Option B for frames / axial-sensitive structures; BR13A's integrated fixed abutment is one.
- **Implementation:** `solver.py` rigid end offsets (`off=`, 6×6 transformation folded into T; test: equals explicit stiff stubs to 1e-5); `builder.py` node level and per-member `dz`; `substructure.py` bearing top = node − node_above_girder_top − D; `mct.py` section offset `CT` on offset members (top of section on the node = the solver offset), reader parses it back (round trip exact).
- **Consequence (BR13A self weight):** girder moments unchanged, vertical bearing reactions within 1 %, horizontal bearing forces change up to ~15 %, girder axial force rises (max 56 → 116 kN). Restraint actions (temperature, shrinkage, braking) are the most affected. Design checks use girder M only; girder axial force from eccentricity is not yet carried into the design checks.
- **Unverified:** that MIDAS applies the section offset in the analysis (expected for MIDAS Civil); confirm by comparing the imported model's self-weight reactions with the report.

## ADR-044 No cross girder outside the edge Super-Ts (owner, 2026-10-28)

- **Decision (owner):** support-line cross girders exist only between the Super-Ts. Outside the edge girders there is only the deck cantilever.
- **Implementation:** `builder.py` — support-line segments beyond the outer web lines (G1W1 / G4W2) become massless nominal links (role `support_edge`, girder-alone × 1e-3), not a slab strip: the cantilever slab stiffness is already in the neighbouring uniform transverse strips, so a strip on the support line would double-count it. Cross girder weight falls by the removed segments (BR13A superstructure SW 4130 → 4011 kN).
- **Frozen comparison:** `tools/compare_frozen_superstructure.py` drops the frozen model's XG segments outside the edge girder chords (+ web offset), so the cross-implementation check stays like-for-like (weight within 2 %, bearings within 15 %, deflections within 5 % — unchanged tolerances).

**ADR-042 correction (2026-10-28):** the releases were written to the .mct but NOT applied by the platform solver (the builder did not pass them to `Model.beam`). Found by the first MIDAS run: transverse member forces differed by up to 70 %. `solver.py` now condenses released end dofs (`rel=`, test: propped cantilever exact); after the fix every node matches MIDAS to 0.013 mm and every element force to 0.4 % (`tests/model/test_midas_run.py`). All platform results before this commit carry the error; changes are in transverse / torsion actions, global vertical response barely moves.

## ADR-045 Rigid-arm moment releases removed (owner, 2026-10-28) — supersedes ADR-042

- **Decision (owner):** no moment releases on the Super-T rigid arms. Back to the engineer-confirmed model 2 (D-15): the deck slab is continuous over the girder webs and the cantilever is fixed to the girder.
- **Why:** once the solver applied ADR-042 (fixed 2026-10-28), the released web ends left the cantilever deck held only by nominal torsion and the slab simply supported at every web. SDL deck-edge deflection 78 mm (5.9 mm without), girder SDL moment +13 %, girder torsion +40 %.
- **Implementation:** `builder.RIGID_ARM_RELEASES = False`. The solver keeps release support (`rel=`, tested); the .mct writes no *FRAME-RLS block. `tests/model/test_midas_run.py` switches the releases back on, because the MIDAS run of 2026-10-28 was made on the released model; a MIDAS re-run of the current file will replace that evidence.

## ADR-046 Earthquake mass lumped at the nodes, X Y Z (owner, 2026-10-28)

- **Decision (owner):** the platform's response-spectrum analysis uses MIDAS's mass idealisation — member self weight lumped half at each end node plus the SDL as nodal mass, in X, Y and Z — instead of consistent member mass at the centroids. Owner: "more conservative".
- **Evidence:** MIDAS run 2026-10-28g (Loads to Masses X, Y, Z): the platform with this mass reproduces MIDAS EQ_L / EQ_T to 0.0-0.9 %; with consistent centroid mass girder EQ moments differ by up to ~24 %, pile actions by up to ~11 %.
- **Implementation:** `earthquake.earthquake_rsa` default path builds the lumped mass and calls `Model.modes(beam_mass=False)`; an explicit `extra_mass` keeps the old behaviour (beam mass consistent + given nodal mass). `Model.modes` default unchanged (consistent) for the modal comparisons. The .mct writes *LOADTOMASS direction XYZ.
- **Consequence:** earthquake actions (and the ULS-H combination rows, pile design actions) change; re-run of the combined actions needed.

## ADR-047 New bridge descriptions from extracted values; development inputs as proposed overrides (P6, 2026-10-28)

- **Decision (agent, reversible):** a new bridge starts from `tools/new_description.py`.
  - Every catalogue field is written; unfilled fields are Missing-Flagged and nothing is invented.
  - Revision 1 holds the extracted state as the original.
  - Values the drawings do not give but the chain needs are added as overrides **proposed** under one decision (B12626: D-1, `projects/B12626/dev_inputs.py`). They are tagged Calculated, Assumed with what replaces them, Standard-verify with a reference, or Model.
  - Tools use them only with `--allow-proposed`, as BR13A's D-34…D-46 were used before acceptance.
- **Why:** the owner asked for B12626 to be "a second example to test our model". Running the unchanged chain needs complete inputs, but the extraction rule forbids assumptions in extracted values. Proposed overrides keep both: the extracted record stays intact, and the owner accepts or replaces each assumption.
- **Alternatives:**
  - Writing assumptions straight into the description was rejected: it mixes them with drawing values.
  - Stopping at the first Missing input was rejected: it finds only one gap per run.
- **Catalogue change:** `supports[].piles[].wall_thickness` and `materials.steel` for concrete-filled steel tube piles (G-2, `docs/P6_SECOND_BRIDGE.md`).
- **Format limitation:** an override needs an existing record. A table row the chain needs is therefore written as a Missing-Flagged placeholder row in revision 1.
- **Status:** D-1 is PROPOSED. B12626 results are provisional.

## ADR-048 Barrier superimposed dead load factor by how well its weight is known (owner, 2026-11-02)

- **Decision (owner rule, H-12):**
  - A barrier is 'SDL – special case permanent' (AS 5100.2 SDLs, ULS 1.4) when it is treated as permanent SDL and its self weight is accurately known.
  - Otherwise it is 'SDL – permanent' (SDLp, ULS 2.0).
  - It is also SDLp when the applicable standard or the project design criteria require 2.0, or the load uncertainty justifies the higher factor.
- **Implementation:**
  - `loads.barrier_action` sets "accurately known" from the data-source tag of `deck.barriers[].weight` in use: Direct, Calculated (from drawing values) or Confirmed-Engineer.
  - Assumed or Missing weights stay at 2.0.
  - `combinations.settings` item `barrier_sdl_action = SDLp` puts every barrier at 2.0 (project criteria).
  - The SDL case is split: SDLp = surfacing + other SDL + uncertain barriers; SDLs = barriers with known weight. The .mct writes them as SDL and SDLs.
- **Effect:**
  - BR13A: no change (barrier weights Assumed).
  - B12626: outer precast barriers (6.01 t / 5.58 m, 109402) take 1.4. The median barrier stays at 2.0 (its density is assumed).
- **Factors:** code-extracted standards entries AS5100.2:load_factor:SDLs / SDLp (UNVERIFIED).

## ADR-049 Web application stage 1: local Python API over the existing tools, TypeScript front end (P7.1, 2026-11-02)

- **Owner request (2026-11-02):** "a software or web base that I can upload drawings and see everything happening there, including model analysis and design"; text-only output is not acceptable for engineering work. P7 brought forward; H-11 stays open.
- **Decision (agent, reversible):**
  - `app/server.py` (Flask) serves an API and a single-page front end. Each chain step runs the existing tool as a subprocess (`build_geometry`, `build_sections`, `app/model_view.py`, `export_mct`, `combined_actions`, `girder_checks`), so the app computes no engineering value and the results equal the command-line results.
  - Front end in TypeScript (ADR-006), no framework, three.js for 3D; bundled with esbuild to `app/static/app.js`, which is committed so the app runs with Python only.
  - Uploads, rendered pages and runs live in `app_data/` (git-ignored): drawings are confidential and must not reach the repository.
  - A new bridge gets a blank description from `tools/new_description.py` (all Missing-Flagged); nothing is filled in automatically.
  - Results show provenance (run id, engine commit, proposed inputs used) and the INDICATIVE banner; without a run the committed repository outputs are shown, labelled.
- **Alternatives:** FastAPI (not installed; no gain at one user); a hosted artifact page (cannot run the Python engine); React (a framework is not needed yet).
- **Not yet (P7 later stages):** automatic extraction from uploaded PDFs (needs an AI service: key / confidentiality decision), editing values and accepting decisions in the app, users / log-in and hosting, PostgreSQL. Until log-in exists the server listens on localhost only.

## ADR-050 Decisions and engineer input in the web app (P7.3, 2026-11-02)

- **Decision (agent, reversible):** the app's Decisions tab accepts or rejects a proposed decision, and the Bridge data tab lets a person enter a value for a Missing / Assumed / proposed record. Both call the existing tools: `schema/accept_decision.py` and `schema/propose_override.py` (a person's entry is proposed under a new decision and accepted by the same person). History, rule checks, JSON-schema validation and the refusal of AI approval (ADR-005) therefore apply unchanged. A name is required; a rejection needs a note; entry tags limited to Direct (with its sheet), Input-user, Confirmed-Engineer.
- **Runs record the description revision;** the Overview warns when the bridge data changed after the last run.
- **Bugs found by this stage and fixed at the source:**
  - `accept_decision` did not set the record's `decision` field, so any accepted Input-user / Confirmed-Engineer value failed the schema.
  - B12626 D-1 log entry was invalid against the decision schema (`to_tag` null; layer `sections` does not exist), so D-1 could never be accepted. `dev_inputs.py` and the log fixed: `to_tag` Assumed (mixed set, labelled by its weakest tag); affects geometry, model, loads, design.supert, substructure.
  - The app rounded bridge values to integers on screen (barrier offset −9.8433 shown −10); values are now shown exactly as stored.

## ADR-051 App completion stages P7.4–P7.7 (2026-11-02)

- **Owner request:** bring the app to completion as a professional, comprehensive platform; more examples later. Plan in `docs/P7_PLAN.md`.
- **P7.4:** `start_app.bat` / `start_app.sh` + `requirements.txt` so the owner runs the app on his PC (the cloud workspace address cannot be reached from outside).
- **P7.5:** natural modes in the model view with the earthquake mass rule (ADR-046), via `earthquake.lumped_mass` extracted so there is one definition; BR13A T1 0.5626 s = MIDAS run g 0.563 s (test). Sections tab draws the Super-T / composite section from the section engine outline.
- **P7.6:** `app/report.py` writes a printable calculation report per run (last chain step) from the run outputs only.
- **P7.7:** Verification tab compares drawing-printed design actions held in the description (tag Direct, e.g. 109035 pile loads) with the latest results and lists the recorded MIDAS runs. It reports differences; colour bands (5 / 15 %) describe size only, acceptance stays with the engineer.

## ADR-052 Third example bridge B12453 (SB02, Sydney Gateway) and report benchmark (P8, 2026-11-04)

- **Owner request:** run the third bridge (drawings plus design report RPT-000001 rev E) and check the results against the report's numbers. The owner's PDF and docx are not committed.
- **Done:**
  - `projects/B12453/extraction/values.py` extracts 437 tagged values from 22 documents.
  - `dev_inputs.py` proposes 116 development inputs under D-1 (PROPOSED; the owner accepts).
  - The unchanged chain runs end to end in the app (run 20261104-084337).
  - `tests/model/test_b12453_chain.py` passes 9/9 against printed geometry.
  - `compare_report.py` writes `projects/B12453/model/COMPARISON_REPORT.md`.
- **Result (indicative):**
  - Girder M is −15 % and bearing N max −17 %, consistent with HLP400 not being modelled.
  - Pile N is within −11 / +9 %.
  - Pile M is about −52 % (placeholder soil springs; Appendix J not supplied).
  - φMu is −18 %, but the platform's un-factored Muo is within 2.6 % of the report's "design capacity". Recorded as a query; nothing changed.
- **Not done (gaps):** HLP400 vehicle; buffer bearings and restraint blocks; soil-spring sensitivity; separate µ per direction; shear-check aggregate size (blank, not assumed).
- **Next:** the HLP400 standards entry (UNVERIFIED) with the SB02 placement rule, then rerun the comparison.

## ADR-053 HLP heavy load platform in the traffic engine (P8.2, 2026-11-04) — PROVISIONAL

- **Why:** SB02 (report table 2-7 / 0101) requires HLP400 on the carriageway centreline ±1 m, with no SM1600 alongside. The engine had only M1600 and S1600.
- **What:**
  - `traffic.platform_effect` / `_platform_state` scans one platform: two trailers of axle lines, a variable trailer gap in 1 m steps, wheel positions across the platform, and lateral shift within ±range. No UDL and no lane factor.
  - The results go under the existing register action `HLP` (factors ULS 1.5 / SLS 1.0, which agree with report table 2-9). The concurrent traffic state rebuilds exactly (test).
  - Switched on by a `loads.traffic_models` row `HLP320` / `HLP400` (Direct from the report).
- **Standards entry `AS5100.2:traffic:HLP400` is `placeholder-unverified`.** It has no code source and no authorised copy: 16 × 250 kN axle lines at 1.8 m, gap 6–15 m, 4 wheel positions at ±0.5 / ±1.5 m, DLA 0.1. These are the agent's recollection of Fig 7.3, and the owner must check them. It is generated by `standards/extract_from_code.py placeholders()`. The standards test now admits `placeholder-unverified` (still below any reviewed status).
- **Not done:** 0.5 × SM1600 in the other lanes alongside HLP (needed for SB01 and B12626); per-lane HLP positions for SB01.
- **Effect on SB02:** HLP governs some SLS rows (bearing N max +2 %) and no ULS row. The girder gap against the report stays at −15 % (see `projects/B12453/model/COMPARISON_REPORT.md`).
- **Update 2026-11-04 (owner input).** The owner confirmed 16 axle lines × 250 kN at 1.8 m (4000 kN), overall width 4.5 m and tyre contact 500 × 200 mm, citing AS 5100.2:2017 Cl 7.3 / Fig 7.3. The tyre positions are spread to the outer tyre centres at ±2.0 m. Still agent placeholders: the trailer gap of 6–15 m, the 4 tyres per axle line, and DLA 0.1. The entry stays `placeholder-unverified` until an authorised copy is checked. SB02 rerun 20261104-173933: bearing N max 1,712 kN (+0.8 % from the wider spread); girder results unchanged.
- **Update 2026-11-04 (sources the owner pointed to).** The owner named AS 5100.7:2004 and NZTA RR 361 Fig 2.4, but the links did not come through and no file was attached. The NZTA report and the MIDAS / VicRoads pages could not be read. The Autodesk AU handout SE6327 (public) confirms the placement rules the engine already uses: ±1.0 m lateral, accompanying lane factor 1.0, and 0.5 M1600 / S1600 in unobstructed lanes (that last rule is not implemented). It says the vehicle configuration is in AS 5100.7, which is licensed and not reachable. The trailer gap, the tyres per axle line and the DLA remain placeholders.
- **Update 2026-11-04 (definition supplied by the owner).** HLP400 is transcribed from AS 5100.7-2004 Appendix A (A2.2.4, Fig A3, A2.2.10.3, A2.2.5.2), a superseded edition supplied by the owner. The MIDAS Civil HLP400 library vehicle (owner screenshot) agrees.
  - 16 axle rows × 250 kN at 1.8 m.
  - 4 dual wheels per row at ±1.1 / ±2.0 m (Calculated from Fig A3).
  - DLA 0.1.
  - The 6–15 m central gap applies to continuous bridges only; the engine offers it only when there are more than 2 supports.
  - The entry status is now `transcribed-unverified`. AS 5100.2:2017 Cl 7.3 and Amendment 2:2024 are still to be checked.
  - SB02 rerun 20261104-175724: HLP400 governs the SLS results. Girder SLS M −5 %, bearing N max −9 %, pile SLS N −0.4 / −3.8 % against drawing 0201.

## ADR-054 Haunch concrete as superimposed dead load (2026-11-05)

- **Owner rule (2026-11-05):** the extra deck concrete from precamber and the vertical profile is treated as superimposed dead load.
- **What:**
  - New description field `deck.haunch_concrete` (table: girder, w kN/m).
  - `loads.sdl_case` applies it as a line load along each girder chord, end to end, in the permanent SDL part (`SDLp`, report table 2-9 SDL permanent: ULS 2.0 / 0.7, SLS 1.3 via the register).
  - The girder self-weight still uses the 200 mm minimum slab only.
- **SB02 values (D-1, PROPOSED):**
  - Haunch is parabolic and zero at the thinnest point (deck "200 MIN").
  - Extreme value = crest-curve rise over the 33.441 m girder chord (58.5 mm, 0111) − girder net camber at deck pour (80 − 27 = 53 mm, 0600; deck pour age 100 days proposed) = 5.5 mm, largest at midspan.
  - Mean over the girder = 2/3 × 5.5 = 3.7 mm; × flange width × 25 kN/m³ gives 0.17–0.18 kN/m per girder, 23.5 kN in total.
  - Girders follow the crossfall (0113), so there is no transverse wedge.
  - On SB02 the crest curve nearly cancels the precamber. On a flat or sag profile the same rule gives the haunch largest at the ends, as the owner described.
- **Effect (run 20261105-065703):** girder ULS M +0.3 %, SLS M +0.3 %. Pile and bearing changes are under 0.3 %.
- **Open:** replace with the designer's haunch / deck-level table, or with deck RLs less girder tops, when available.

## ADR-055 Barrier line load from the drawn section; HLP with half M1600 and accompanying lane factors (2026-11-05)

- **Owner request (2026-11-05):** apply accompanying lane factors to the moving load, and calculate the barrier line load from the barrier shape.
- **Barrier (SB02):**
  - `values.py` builds the precast PB-1 and in-situ stitch-pour polygons from 0909 section 1 (dimensioned; the stitch diagonal end is scaled at y 577).
  - Area and centroid use `loads._area_centroid`, × 25 kN/m³ (report table 2-4), giving 11.47 kN/m.
  - The centroid is 252.2 mm outward from the inside face, so offsets are −6.252 / +1.252 (Calculated; the D-1 offset proposals were removed).
  - Check: the PB-1 polygon alone gives 9.28 kN/m against the 0902 unit mass of 8.78 kN/m (+5.7 %; chamfers, conduits and recesses ignored).
  - Twin steel rails are not included (mass not printed).
- **HLP + 0.5 M1600:**
  - A `loads.traffic_models` row `<HLP>_with_half_M1600` switches it on.
  - The HLP occupies two standard lanes, or the carriageway if narrower, centred on its (shifted) position.
  - The free lanes are packed outward on both sides, each loaded with 0.5 × M1600 (patterned UDL + vehicle) and ranked with the accompanying lane factors after the first (HLP = lane 1, factor 1.0): 0.5 × 0.8, 0.5 × 0.4 ...
  - The envelope is the maximum over lateral shifts. The governing state rebuilds exactly (test).
  - Interpretation, PROVISIONAL: the ALF ranking of the free lanes and taking the HLP register factor (ULS 1.5) for the whole group. The platform source (AS 5100.7-2004 A2.2.5.2 / A2.2.6) says not to apply the multiple-lane factors to the HLP and gives no rule for the accompanying lanes.
  - SB02: off (report table 2-7 "No"). B12626: on (cover sheet). Piles are unchanged (+1.2 / +2.5 / +24.8 % against 109035).
- **Effect on SB02 (run 20261105-071140):** girder ULS M −10.3 %, SLS M −3.0 %, bearing N max −7.4 %, pile SLS N +0.9 / −2.5 %, pile ULS N +8.3 / +10.4 % against drawing 0201.

## ADR-056 Divided decks: carriageway rows (P8 stage 4a, 2026-11-05)

- **Why:** SB01 has two carriageways with a median barrier. The engine had one carriageway, so lanes could straddle the median.
- **What:**
  - New field `deck.carriageways` (table: name, left, right).
  - Traffic: lane layouts per carriageway (left-packed or swept within that carriageway). The bridge layouts are every combination of the carriageways' layouts. All lanes are ranked together with the accompanying lane factors.
  - HLP: one platform, centred on any carriageway (±range). With half M1600, the free lanes of its carriageway plus the left-packed lanes of the other carriageways are loaded.
  - SDL surfacing is applied on each carriageway only.
  - Empty table: unchanged behaviour (single carriageway between `carriageway_left` / `carriageway_right`).
- **Test:** B12626 split into two carriageways (synthetic) gives 169 layouts, 6 lanes, and every lane inside a carriageway. The HLP and M1600 governing states rebuild their envelope values.
- **Shortcuts (flagged in code):** the HLP is centred on the carriageway, not on "any two marked lanes" (needs the marked-lane setout). The other carriageways' lanes are left-packed when accompanying the HLP.

## ADR-057 Drawing reader through the Claude API (P9.1, 2026-11-06) — owner decision P7.2

- **Owner decision (2026-11-06, Masoud):** drawings may be sent to the Claude API with the owner's key, so the app can read new drawings automatically on upload. This resolves open decision P7.2.
- **What:** `pdf2bim/extract/` sends each page (image + text layer) to Claude with the field catalogue and the no-assumption rules. Claude only proposes. `verify.py` decides deterministically:
  - the path must be a catalogue field (or `custom.*`);
  - Direct: the quote must be on the page and the number must be printed on the page;
  - Calculated: the expression is re-evaluated (arithmetic only) from printed numbers;
  - wording that is not a printed literal becomes `Model` with the quote as its note;
  - scanned pages are rejected;
  - sheets that disagree leave the field Missing-Flagged with the candidates.
  - The output goes through `tools/new_description.py`.
  - Every page's answer and checks are kept for audit (`app_data/<id>/extract/<run>/pages/`), with a summary in `EXTRACTION.md`.
- **App:** the Drawings tab gets a "Read the drawings with Claude" panel.
  - The key is set from `ANTHROPIC_API_KEY` or saved in `app_data/settings.json` (mode 600, git-ignored, never echoed).
  - Only new (uploaded) bridges whose data has no reviewed revision can be read; repository bridges are refused.
  - The model defaults to `claude-opus-5-5`.
- **Fix:** the page index uses pdfium instead of pdfplumber. The 143-sheet SB02 set took over 100 s with pdfplumber and crashed the dev server; it now takes about 3 s.
- **Not yet:** proposing the inputs drawings never give (soil, bearings, temperatures) as a D-n decision for engineer acceptance; a live run on a real set with the owner's key (no key in the cloud session).
- **Tests:** `tests/extract/test_reader.py` 16/16, `tests/app/test_reader_app.py` 10/10 (fake API, no network).

## ADR-058 From upload to design checks without a bridge script; Girder editor (P9.2 / P9.3, 2026-11-06)

- **Owner request:** upload new drawings and have the platform build the model and run all the analysis and design checks, with the BR13A dashboard's girder editing (section, reinforcement, tendons) applied to any bridge.
- **P9.2 `pdf2bim/extract/propose_missing.py`.** After a reading, every input the drawings did not give and the chain needs is proposed as ONE decision D-1 (AI, proposed, never accepted by AI):
  - deck and girder placeholders, bearing elastomer, soil and rock springs, backfill;
  - wind, temperature and gradient rows, earthquake Rf / damping, prestress-loss inputs;
  - the same placeholders BR13A / B12626 / B12453 ran with, each Assumed (or Standard-verify with its key) with what should replace it.
  - A value read from the drawings is never overwritten. Placeholder rows are added to tables so the proposal has a record.
- **Proof on SB02.** Starting from SB02's extracted values with no SB02 script, the generic proposals (111) gave a full chain run (20261106-153555): geometry → model → actions → design → report.
  - Against the report: girder SLS M −4.0 %, ULS M −11.4 %, bearing N max −8.2 %, pile SLS N +0.2 / −3.2 %.
  - These are within about 1 % of the run with SB02's own development inputs.
- **P9.3 Girder editor tab.** For each Super-T type:
  - section and material values; tendons one row per strand (debond lengths, on / off); bars; fitments; zones; deck bars; shape keys;
  - a preview of the entered tendon layout on the last computed outline (drawing only, no engineering numbers);
  - last-run utilisation for the girders of that type.
  - **Save** goes through `POST /values/batch`: one decision under the person's name, Input-user, proposed and accepted by the same person, one revision with history. New table rows are added as records; records are never deleted (switch a strand off).
  - **Save and run** reruns the chain and opens Design checks.
- **End-to-end check:** 4 bottom bonded strands switched off on the SB02 copy, then rerun → midspan φMu 14,002 → 12,858 kNm (−8.2 %, 4 / 48 strands) and ULS bending utilisation 0.98 → 1.07.
- **Tests:** `tests/app/test_girder_edit.py` 8/8, `tests/app/test_reader_app.py` 13/13.
- **Not yet:** the dashboard's hog calculator, Word / Excel exports and pile / bearing results views; editing on read-only copies.


## ADR-059 Dashboard exports, hog view and fuller pile results in the app (P9.4, 2026-11-06)

- **Status:** done (agent decision, reversible).
- **Hog.** `girder_design` results now carry `hog`: x (m) and the hog curve (mm, + up) at each reported time of the losses / camber analysis. The values were already computed; until now they were not saved.
- **Design tab.** Adds a hog chart for each girder and a table of hog at mid-length and maximum hog.
  - Hog values printed on the drawings (Direct rows whose path contains "hog") are listed beside it for comparison. The basis note says to check the drawing's load basis before comparing.
  - No acceptance verdict is given. H-11 stays open.
- **Exports step** (`app/export_files.py`, chain step `exports`) writes `workbook.xlsx` and `report.docx` from the description and the run outputs only. No value is computed.
  - Workbook tabs: Read me, Bridge data (every record with its tag and source, colour-coded), Needs Review (every Missing-Flagged row), Girder checks, one Hog sheet per girder, Bearings, Piles.
  - The Word report is a summary. The full calculation report stays `report.html`.
- **Analysis tab, pile table:** adds the SLS N min and SLS moment columns, plus a note on the governing resultant.
- **Dependency:** `python-docx` added to requirements.txt.
- **Tests:** `tests/app/test_exports.py` 8/8. The `tests/app` suite all passes (girder_edit 8, reader 13, report 9, server 27).
- **SB02-GEN check:** hog at transfer is 51 mm against 57 mm printed (DRG-0600, self-weight basis). The later times include the deck stages, so they do not compare directly with the printed table.

## ADR-060 SB01 (B12452) through the unchanged chain; influence-line cache bounded (P8.4b/c, 2026-11-07)

- **Status:** done (agent decision, reversible). Inputs come from the drawings; the missing inputs are the generic proposals D-1 (ADR-058), still PROPOSED.
- **Control line.** The straight bridge setout line from 0703, with chainage measured from end of superstructure A.
  - It is carried 10 m past the outermost printed points (Calculated, same line), so the skewed sills stay on the alignment.
  - The vertical profile is one parabola through printed RL1 at 4 / 16 / 28 m. The other five printed points fit within 1 mm (tested).
- **Bearings and piles.** Taken from the chained dimensions measured from the MC20 / MC30 SOP along the support lines (0300 / 0301 / 0200).
  - Self-check: every bearing-to-bearing length + 0.8 equals X1 = 33.441.
  - The support-line skew is computed against the chord (about 4.9°). The printed 5.433° is measured against MC20.
- **Deck.** One-way 3 % fall (SURVEY corrected). Two carriageways either side of the median MCI barrier, giving 4 + 5 = 9 lanes, the same as the 9 printed on 0101.
  - W2 / W3 taken at mid-length.
  - The median barrier weight comes from the detail B outline. Two of its heights are scaled, not dimensioned.
- **Haunch rows without a load** are reported as not applied (flagged), never assumed (loads.py).
- **Memory.** `Influence.line` cache bounded at 1.5 GB (oldest lines dropped; results unchanged).
  - Before the fix, SB01's actions step peaked at about 6 GB and was killed when another job ran at the same time.
- **Benchmark** (`projects/B12452/model/COMPARISON_REPORT.md`):

  | Result | Difference from report |
  |---|---|
  | Girder M* ULS | −6.5 % |
  | Girder M* SLS | −7.4 % |
  | Girder V* | +1.8 % |
  | φMu | −16.2 % (same query as SB02) |
  | Bearing N SLS | −8.3 % |
  | Pile N ULS | +4.8 / +7.6 % |
  | Pile N SLS | −15.0 / +9.8 % |
  | Pile M | about −44 % (placeholder soil) |

  The girder gaps are smaller than SB02's, which supports the reading that the report's critical girder is on SB01.
- **Queries for the owner:**
  - 01-06 / 01-07 X1 = 33,559 with the same bearing spacing.
  - B01-08 RL 9.324 is the same as B01-07.
  - Pile SLS on 0201 vs report 5-5.
- **Tests:** `tests/model/test_b12452_chain.py` 14/14.

## ADR-061 Bridge Studio: client-side application on generic case studies (2026-11-08)

- **Status:** done (agent decision, reversible). The owner requested it on 2026-11-08 (an interactive engineering application with no project identifiers).
- **Where it lives.** `studio/` is separate from the Flask app and the dashboard, which are unchanged. It is built to a single HTML page and published as a claude.ai artifact.
- **Engines are reused, not rewritten.**
  - DSG, DSG2, HOG and SECLIB are verbatim extractions from the original dashboard. Hog matches it to 1e-14.
  - The moving-load code is a port of `lane_effect` / `combine_lanes`. It matches the Python engine to 1e-13.
  - The new grillage solver uses 3 DOF per node with Cholesky, and is checked against beam theory, equilibrium and Maxwell reciprocity.
- **Dependency system.**
  - Every result stores a stamp of the input groups and upstream results it used.
  - Any change marks dependants "out of date" and greys their views. Exports leave stale sections out.
  - Order: analysis → combinations → design → piles.
- **Generic data.**
  - Four case studies with illustrative inputs. No bridge names, clients or project numbers (the output is scanned for them).
  - Losses-engine template values are listed on the page as illustrative.
- **Limits.**
  - Code coefficients are unverified.
  - Temperature and wind are not modelled.
  - Piles use a rigid cap with an illustrative eccentricity and lever arm, and no soil.
  - AI features are labelled experimental and can only propose changes.
- **Alternatives considered.** Adding to the Flask app: rejected, because it needs a server and the owner wants a shareable, self-running demonstration.
