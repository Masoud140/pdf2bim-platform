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
