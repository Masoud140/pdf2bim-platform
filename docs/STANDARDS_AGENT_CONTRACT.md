# Integration contract — Standards Agent ↔ PDF 2 BIM

The two projects combine later. Keep these interfaces fixed so the merge is a file copy, not a rewrite.

## Repositories
- `Masoud140/pdf2bim-platform` (existing; branch `p4-verification` is the working branch).
- `Masoud140/standards-agent` (new). Same conventions: docs/CURRENT_STATUS.md, NEXT_SESSION.md,
  DECISIONS.md (ADR numbering starts at SA-001), CHANGELOG.md, VERIFICATION_STRATEGY.md; tests in
  `tests/`; never push to main.
- At the merge: `standards-agent/` becomes `pdf2bim-platform/standards_agent/`; its register export
  is written into `pdf2bim-platform/standards/data/`.

## Input: project profile (JSON the agent consumes)
```json
{
  "project": "B12452",
  "structure": "bridge | building | retaining_wall",
  "form": "simply supported precast Super-T",
  "location": {"state": "NSW", "lat": -33.9, "lon": 150.8, "site": "..."},
  "authority": "TfNSW | TMR | MRWA | DIT | council | none",
  "importance_level": null,
  "exposure": "B1",
  "spans_m": [33.4],
  "materials": ["precast prestressed concrete", "in-situ concrete"],
  "design_life_years": 100
}
```
pdf2bim can produce this from a bridge description (`projects/<id>/<id>.bridge.0.2.json`) — a
small exporter is a merge-time task. Fields unknown are `null`, never guessed.

## Output 1: design-basis checklist (Markdown)
One row per requirement: `# | Topic | Document | Edition / Amdt | Clause / Table / Figure / Appendix | Page | Applies because | Authority override | Status`.
`Status` is `cited` (quoted from the index) or `Standard - verify` (not found in the index). No row
without a document and page unless its status is `Standard - verify`.

## Output 2: register entries
Exactly the pdf2bim entry record (STANDARDS_DATA_SPEC.md §2, example in
STANDARDS_ENTRY_EXAMPLE.json). The agent sets `status: "transcribed-unverified"` at most, fills
`reference` (clause, table, figure, authorised_source = document + edition + page) and
`edition` / `amendment`; leaves `review` null. Ids follow `STANDARD:topic:name`
(for example `AS5100.2:wind:drag_coefficient_superT`). Validation: pdf2bim
`python3 -c "from standards.accessor import Standards; Standards()"` must load the file.

## Rules shared verbatim with pdf2bim
- ADR-005: AI never approves; ADR-009: framework now, content by review (STANDARDS_DATA_SPEC.md).
- Authority rules separate from the standard; every row names its source (PRESTRESS_DESIGN_RULES.md).
- Values from drawings come first; the standard is the check, never a source of input.

## Already in pdf2bim that the agent should reuse, not rebuild
- `standards/accessor.py` (loads, validates, status propagation) and `standards/review_register.py`.
- `docs/PRESTRESS_DESIGN_RULES.md` — the first fact-checked rule set; its "Standard - verify" rows
  are the agent's first retrieval targets (AS 5100.5 Cl 17.5.4.6, 8.1.6.2, 8.6.2.1, 4.14.2, 13.3.2.1/2).
- 96 `code-extracted-unverified` entries in `standards/data/` — the agent's second job is to find
  the clause and page for each and raise them to `transcribed-unverified`.

## First merge-time tasks (not now)
1. Profile exporter from the bridge description.
2. Copy the register export into `standards/data/` and run the review register.
3. Add a "Design basis" tab in the app that shows the checklist with its citations.
