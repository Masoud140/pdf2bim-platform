# P5 method — run records, Query Register, takeoff import, decisions (2026-10-25)

Plan: `P5_PLAN.md`. Decisions: ADR-037, ADR-038.

## 1. P5.1 Run records and stale marking (`pdf2bim/runrecord.py`, `tools/stale.py`)

- Every tool output (`tools/combined_actions.py`, `concurrent_traffic.py`, `export_mct.py` sidecar, `girder_flexure.py`, `girder_checks.py`, `midas_compare.py`, `query_register.py`) carries a top-level `run_record` (format `pdf2bim.run/1`): description path, revision, content hash; decisions in the log and the proposed ones used; engine commit + uncommitted-changes flag; standards-data and product-library hashes; the tool's layers (decision `affects` values, `LAYERS`); options; time.
- **Stale rule:** current when the description, standards and library hashes are unchanged. If the description changed, each revision since the recorded one must be explained by a decision (revision note) whose `affects` misses the output's layers; otherwise stale (unexplained revision, missing history copy, a decision touching its layers, a changed hash without a new revision number). A newer engine commit is reported separately.
- `tools/stale.py [projects/X]` lists every output with its state; outputs without a record are "unknown".
- Tests `tests/schema/test_runrecord.py` 12 (copy of the example project: unchanged → current; D-99 affecting design.supert → girder checks stale, geometry current; unexplained / unnumbered changes stale; standards change stale; engine change flagged).

## 2. P5.2 Query Register (`pdf2bim/register.py`, `tools/query_register.py`)

- Open items from the description (path rules of `schema.rules_0_2.records`): Missing-Flagged → missing, Assumed → assumed, Standard-verify → standard, a record with status proposed or a proposed override → proposed (with the override's decision and value). Each item: value, unit, note, replace with, decision + reason, layers affected (decision `affects`, else the description section), outputs that depend on them, needed from.
- Output `projects/<X>/QUERY_REGISTER.{md,json,html}` (standalone HTML with category filter and search; light / dark).
- BR13A revision 11: missing 53, assumed 206, standard 65, proposed 73 (9 decisions).
- Tests `tests/schema/test_register.py` 8 (counts = tag counts; items complete; D-42 rows; deterministic; standalone HTML).

## 3. P5.3 Takeoff import (`pdf2bim/takeoff.py`, `tools/import_takeoff.py`)

- Interchange sheet `Values`: Path | Value | Unit | Data Source | Source ref | Notes (the extractor's workbook tabs map onto it by field path). Rules in the module docstring; in short: never overwrite — equal value → same; Assumed / Calculated / Model … value differing or newly found → override proposal with the source; differing from Direct / Confirmed-Engineer → query; missing source / derivation / unknown category / unit mismatch → refused; unknown path → listed for the engineer.
- `--apply --decision D-n` proposes each override through `schema/propose_override.py` (one revision each, status proposed); queries and new paths are never applied.
- Tests `tests/schema/test_takeoff.py` 10 (round trip of 565 Direct / Calculated values = same; each rule; apply on a copy).
- **Not yet:** a direct reader of the extractor's multi-tab workbook (needs the label → path map for its tabs, P5.5) — the interchange sheet is the contract.

## 4. P5.4 Decisions (`schema/accept_decision.py`, `tools/decision_review.py`)

- `accept_decision.py FILE --decision D-n --by "<name>" [--reject --note]`: proposed overrides under the decision → approval accepted / rejected (accepted → becomes current: value / cells, tag, unit, source); records with status proposed → accepted / rejected; log entry status + approved_by / approved_at; new revision "D-n accepted by <name>"; history copy; rule checks (R1–R7) and the decision schema. The AI cannot accept or reject. Supersession of an already accepted override is refused (not handled yet).
- The description reader now treats a rejected record as missing.
- `tools/decision_review.py FILE` → `DECISION_REVIEW.{md,html}`: every proposed decision with reason, evidence, values, layers, the recorded outputs it makes stale, and the accept / reject commands.
- Tests `tests/schema/test_accept.py` 11 (on a copy: AI refused; D-42 accepted → read without allow_proposed, girder-check record stale, register updated; D-34 override accepted; D-39 rejected; review page).
- `schema/propose_record.py` now validates the decision entry against the decision schema (found by the full suite: D-42 `affects: design`, fixed).
