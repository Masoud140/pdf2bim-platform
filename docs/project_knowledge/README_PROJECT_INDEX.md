# Project index - PDF 2 BIM (updated 2026-11-17)

**The platform repository is now the authoritative record** (Masoud140/pdf2bim-platform, branch `p4-verification`; read `claude/SOURCE_REPOSITORY.md`, then the repo's `docs/NEXT_SESSION.md`). Every rule doc below is kept in two places: the Project knowledge and the repository (`docs/` or `docs/project_knowledge/`). Change both in the same session.

## Current rules and methods

| Topic | Project doc | Repository copy |
|---|---|---|
| Tagging every value | DATA_SOURCE_CATEGORIZATION_STANDARD.md | docs/project_knowledge/ |
| Alignment / control line | CONTROL_LINE_RECONSTRUCTION_METHOD.md | docs/project_knowledge/ (engine: `pdf2bim/geometry/alignment.py`) |
| Repository, branches, working rules | claude/SOURCE_REPOSITORY.md | docs/project_knowledge/ |
| Development and progress-saving principles | claude/DEVELOPMENT_PRINCIPLES.md | docs/DEVELOPMENT_PRINCIPLES.md |
| Verification levels, tolerances, test evidence | claude/VERIFICATION_STRATEGY.md | docs/VERIFICATION_STRATEGY.md |
| Prestress and debonding rules (transfer, TfNSW debonding, development length) | claude/PRESTRESS_DESIGN_RULES.md | docs/PRESTRESS_DESIGN_RULES.md (code: `pdf2bim/design/prestress_checks.py`, ADR-072) |
| Integrated model loads | claude/INTEGRATED_MODEL_LOADS_METHOD.md | docs/INTEGRATED_MODEL_LOADS_METHOD.md |
| Standards Agent interface | claude/STANDARDS_AGENT_CONTRACT.md | docs/STANDARDS_AGENT_CONTRACT.md |
| Capturing standard clauses with Claude in Chrome | claude/STANDARDS_CLAUSE_CAPTURE_PROMPT.md | docs/STANDARDS_CLAUSE_CAPTURE_PROMPT.md |
| Lessons from the BR13A pipeline | claude/GRILLAGE_PIPELINE_LESSONS.md | docs/project_knowledge/ |
| Grillage conventions (Hambly) | grillage_modelling_reference.md | Project only (reference) |
| Extraction agent specs | pdf-ga-extractor.md, control-line-dxf-builder.md | Project only (agent specs) |

## Historical (BR13A dashboard era, October 2026)

Superseded by the platform; kept for the record. Project only.

- claude/MEMBER_PROPERTIES_METHOD.md, claude/MCT_EXPORT_METHOD.md, claude/ANALYSIS_METHOD.md, claude/BARRIER_BOLT_BASIS.md (parked), with code `torsion_fd.py`, `analysis_*.js`, `analysis_ref_solver.py`. Their platform successors: repo `docs/P2_SECTIONS_METHOD.md`, `docs/P3_MODEL_METHOD.md`, `docs/P4_VERIFICATION_METHOD.md`.
- claude/OPEN_ITEMS_AND_READINESS.md (2026-10-13 review): open items now live in the repo's `docs/NEXT_SESSION.md`.

## Live outputs

- Bridge Studio (anonymised showcase): claude.ai artifact LPiMgACdEH2Wk3nuZXhkHA (source `studio/` in the repo).
- Platform app: local, `./start_app.sh` in the repo.
- The old BR13A grillage dashboard artifact (LPAvKCDfhCGdxiCFcErJkM, v30) is superseded.
