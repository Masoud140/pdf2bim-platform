# P5 plan — extraction → description → decisions (draft for owner review, 2026-10-25)

**Goal (ROADMAP):** a new GA produces a valid bridge description; every value is source-linked; decisions are reviewed in one place; results know when they are stale.
**Acceptance:** as ROADMAP P5 plus the per-sub-stage checks below. Autonomous parts first; owner review non-blocking (ADR-018).

## Sub-stages

| Id | Sub-stage | What | Acceptance | Who |
|---|---|---|---|---|
| P5.1 | **Run records and stale marking** | One run-record function for every tool output (description path, revision, content hash, last decision, proposed decisions used, engine commit + dirty flag, standards / product-library file hashes, options, time). `tools/stale.py` lists outputs whose description hash or standards differ from the current ones, with the decisions added since and the layers they affect (`affects`) | A changed value marks dependent records stale; an unchanged description keeps them current; legacy outputs without a record are reported "unknown" | agent |
| P5.2 | **Query Register from the description** | Every Missing-Flagged, Assumed (with `replace_with`), Standard-verify and proposed-decision item as a register (JSON + Markdown + standalone HTML): path, tag, current value, source note, what is needed and from whom, decision id, layers affected, impact on results (stale tools) | Counts equal the description's tag counts; every item has a path and a "needed from"; regenerated without manual edits | agent |
| P5.3 | **Takeoff importer** | Excel workbook in the extractor's format (`pdf-ga-extractor.md`: tabs with Data Source + Notes columns, Needs Review tab) → a proposal spec for `schema/propose_record.py` / `propose_override.py`. Direct / Calculated / Missing — Flagged map to the description tags; the source note keeps sheet / view / callout; a value that conflicts with an existing Direct value becomes a query, never an overwrite | Round trip: a workbook written from the BR13A description imports back to the same values and tags; a conflicting value produces a query; a value without a source is refused | agent |
| P5.4 | **Decision review page** | Generated HTML page of the decision log + proposals (what, why, evidence, affects, stale results) and an acceptance tool `schema/accept_decision.py --by <name>` that records the approver; the AI cannot accept engineering decisions | Accepting a proposal changes its status, keeps the history, re-stamps the hash and marks the dependent records stale | agent (tool); **owner** (decisions) |
| P5.5 | **BR13A re-extraction regression** | Run the extractor on the BR13A GA set and import it with P5.3; compare with the current description | Every Direct value of the description re-found or explained | agent (with the PDFs); owner review |

## Order

P5.1 → P5.2 → P5.3 → P5.4 → P5.5. P5.1 first: the register and the review page show which results each open item affects.

## Not in P5

Web application, multi-user database (P7); second bridge (P6, needs the owner's PDFs).
