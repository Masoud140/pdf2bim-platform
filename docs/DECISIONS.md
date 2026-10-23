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
| 008 | Keep the original drawing value in the value record | proposed | 2026-10-23 |
| 009 | Standards as versioned data with a check status | proposed | 2026-10-23 |
| 010 | Planks after the shared platform is verified | accepted | 2026-10-23, owner |
| 011 | Wind, temperature and earthquake inputs stay as name/value tables | accepted | 2026-10-23, owner |

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

## ADR-008 Keep the original drawing value in the value record (proposed)

- **Proposal:** add `original: {value, unit, tag, source}` to a value when it is overridden, plus `significance` (high / medium / low) and a description `revision` and `hash` at the top of the file.
- **Why:** the master instruction requires the original to be kept, and runs need a revision to record. Today the original exists only in the decision log.
- **Needs:** owner approval; this is a format change (0.1 → 0.2).

## ADR-009 Standards as versioned data (proposed)

- **Proposal:**
  - A `standards/` data set: clause id, value or table, units, edition, and status (implemented / checked / approved), with the checker and date.
  - No Standard text is copied.
  - Engine code reads values from it, not from constants. Examples today: AS 1170.4 spectral shape is a transcribed table; the dynamic factor uses a regex.
- **Why:** traceability and licence safety.
- **Needs:** owner approval and a licensed copy for the checking.

## ADR-010 Planks later

- **Decision:** precast planks are added after the shared platform (P1–P6) is verified on Super-T. The owner will provide plank drawings for the product library.

## ADR-011 Environmental inputs as tables

- **Decision:** wind, temperature and earthquake inputs stay as name/value tables in the bridge description, not fully typed fields, for now.
- **Why:** owner priority is to read and model every bridge from primary and engineering input first.
