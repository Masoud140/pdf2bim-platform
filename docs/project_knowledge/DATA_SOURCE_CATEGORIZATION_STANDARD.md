# Data Source Categorization Standard

**Status: proposed standing rule, applies to every output in the PDF 2 BIM pipeline** —
Excel takeoffs, DXF exports, Rhino/Grasshopper models, and anything else built from
extracted drawing data. One system, used the same way everywhere, so a reviewer who learns
it once can read any deliverable from this pipeline without relearning conventions.

This formalizes what the ABSOLUTE RULE already establishes conceptually (direct vs. derived
vs. forbidden-to-assume) into a concrete, structural requirement: **every single value in
every output must carry an explicit, visible category tag.** Not implied by a note, not
left for the reader to infer — an actual column, an actual layer, an actual color, that a
tool or a person can filter on.

## The three categories

| Category | Definition | Applies when |
|---|---|---|
| **Direct** | Literally printed on the source PDF — a number, label, or note, transcribed as-is. | The value came from one specific, pointable-to location on one specific sheet. |
| **Calculated** | Computed by explicit, documented arithmetic or geometric derivation from two or more Direct values already found on the PDF. | Every input to the calculation is itself traceable to the PDF, and the derivation method is stated, not just the result. |
| **Missing — Flagged for Review** | Needed, but not recoverable from the PDF at all — illegible, not dimensioned, conflicting between views, or referencing a detail/package sheet not included in this set. | Nothing here is guessed or defaulted. The cell exists and is empty (or contains only the flag), never a plausible-sounding invented number. |

No fourth category for **extracted drawing values**. If a value doesn't cleanly fit "printed as-is" or "computed from printed
values," it's Missing — Flagged, even if a reasonable engineer could guess it.

### Platform tags (added 2026-11-17)

The platform (repo `docs/DEVELOPMENT_PRINCIPLES.md` §1 item 2, `docs/BRIDGE_DESCRIPTION_FORMAT.md`) keeps these three for drawing values and adds tags for values that do not come from the drawings: **Standard-verify** (from the standards register, not yet checked against the licensed edition), **Input-user**, **Confirmed-Engineer**, **Assumed** (a placeholder that lets the model run: shown next to its input, rolled up in Needs Review, accepted only by the engineer; owner instruction ADR-040) and **Model** (a modelling decision). None of these may be presented as Direct or Calculated. Extraction outputs (Excel, DXF, Rhino) still use only the three categories above.

## Required implementation — Excel

Every data tab gets two dedicated columns per value (in addition to whatever labels/values
columns already exist), never folded into a single free-text notes column:

- **Data Source** — one of exactly three values: `Direct`, `Calculated`, `Missing — Flagged`.
  Plain text, filterable/sortable, not buried in prose.
- **Notes** — for Direct: which sheet/callout it came from. For Calculated: the derivation
  (which Direct cells, which formula). For Missing: what's needed and where it should have
  been (which package/sheet, if known).

**Color convention** (background fill), consistent with the visualization guide's tiers:

| Data Source | Fill |
|---|---|
| Direct | No fill (white/default) |
| Calculated | Light amber |
| Missing — Flagged | Soft red, dark red text (existing ambiguity-flag convention) |

Every cell gets a fill matching its category — this is broader than the earlier rule of
"only highlight the specific ambiguous cell." Now *every* value is visibly categorized, not
just the flagged ones; Direct values simply read as unstyled/default, which is itself the
signal that nothing is wrong with them.

**Required roll-up, every workbook:**
1. The Extraction Summary tab reports a count of Direct / Calculated / Missing-Flagged
   values, not just a single "fields flagged" number.
2. A dedicated **"Needs Review"** tab lists every Missing — Flagged row from every other tab
   in one place: sheet name, row label, what's missing, where it should be. This is the
   thing a reviewer (or the next agent/person in the pipeline) checks first, before doing
   anything else — it should be possible to know exactly what's outstanding without opening
   every tab.

## Required implementation — DXF / Rhino (already established, restated for consistency)

The layer scheme already in use maps directly onto the same three categories — no new work
needed here, just confirming the mapping so it's documented in one place:

| Category | DXF/Rhino layer | Color/linetype |
|---|---|---|
| Direct | `QC_CONFIRMED` | Neutral/black, continuous |
| Calculated | `QC_REVIEW` | Amber/orange, dash-dot |
| Missing — Flagged | `RED_LINE_UNCERTAIN` | Red, dashed, ghosted transparency on solids |

## "Ready for next steps" — what this enables

The point of making this structural rather than just a note in prose: the next agent, the
next reviewer, or a script can filter `Data Source = Missing — Flagged` and get a complete,
reliable punch-list without reading the whole workbook — and can trust that anything *not*
in that list is either a real drawing value or a shown, checkable calculation. This is what
lets a staged pipeline (Agent 1 → human check → Agent 2 → human check) actually work at
speed: each stage's output tells the next stage (or the next person) exactly what's solid
and exactly what still needs a human before it's relied on.
