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
