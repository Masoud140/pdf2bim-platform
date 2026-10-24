# Bridge description format 0.2 — specification and migration (ADR-008)

**Status:** approved in principle 2026-10-23, with safeguards (owner).

**Implemented 2026-10-24 (P0.2, branch `p0.2-format`, not merged).** Section 6 lists the implementation and the provisional decisions made during it. 0.1 remains supported and unchanged.

## 1. What changes from 0.1

| Addition | Where | Purpose |
|---|---|---|
| `original` | on a value | The value as first extracted or entered, with its source. **Immutable** |
| `overrides` | on a value | Append-only list of engineer / AI changes, each with reason, evidence, author, time and approval |
| `current` | on a value | Which entry is the accepted value now: `"original"` or an override id |
| `significance` | on a value | How much the value matters to the results: `high` / `medium` / `low` + `basis` |
| `revision` | top level | Revision number, parent hash, author, time, note |
| `hash` | top level | Content hash with stated algorithm, coverage and canonicalisation |

`value`, `unit`, `tag` and `status` stay where they are in 0.1. They always describe the **current accepted value**, so a reader written for 0.1 still reads the right number.

## 2. Value record (0.2)

```json
"girder_depth": {
  "value": 1515, "unit": "mm", "tag": "Confirmed-Engineer", "status": "accepted",
  "current": "OV-1",
  "significance": {"level": "high", "basis": "governs section stiffness and capacity"},
  "original": {
    "value": 1500, "unit": "mm", "tag": "Direct",
    "source": {"document": "BR13A_GA_Rev02.pdf", "sheet": "Sheet 2", "revision": "02", "view": "Section A", "note": "girder depth callout"},
    "recorded_by": "extractor", "recorded_at": "2026-10-20T10:12:00+11:00"
  },
  "overrides": [
    {"id": "OV-1", "value": 1515, "unit": "mm", "from_value": 1500, "from_unit": "mm",
     "reason": "Super-T T4 product depth; drawing callout rounded",
     "evidence": ["TfNSW Super-T standard T4, depth 1515 mm"],
     "author": "Masoud", "timestamp": "2026-10-23T14:00:00+11:00",
     "approval": {"status": "accepted", "approved_by": "Masoud", "approved_at": "2026-10-23T14:05:00+11:00"},
     "decision": "D-41", "supersedes": null}
  ]
}
```

(The numbers above illustrate the structure; they are not BR13A data. The P0.2 example file states the same.)

**Rules (enforced by the validator in P0.2):**
1. **`original` is immutable.** A tool may create it once. Any later change to it fails validation against the previous revision. The migration test checks `original` is byte-identical across revisions.
2. **Overrides are append-only.** An override is never edited or deleted. A wrong override is superseded by a new one (`supersedes`), and the old one is set `rejected` / `superseded` by a new approval record.
3. **Exactly one current value.**
   - `current` names `"original"` or one override whose approval status is `accepted`.
   - `value` / `unit` / `tag` must equal that entry.
   - `tag` is `Confirmed-Engineer` (engineer override) or `Calculated` (AI-derived, ADR-005), or the original tag when `current` = `"original"`.
4. **Approval policy (ADR-005) is unchanged:**
   - `approved_by` is required for `accepted`;
   - overriding a `Direct` original needs non-empty `evidence`;
   - an AI author may only have an override accepted when its tag is `Calculated`;
   - `Missing-Flagged` values are never `accepted`.
5. **Units:** a unit change (`from_unit` ≠ `unit`, both known) needs an explicit `conversion` field. Unknown units stay `null`; they are never guessed.
6. **Decision log link:** each override that is approved has a matching decision-log entry (`decision`). The decision log stays the history of *why*; the value record holds *what* and *which is current*.
7. **Significance:**
   - Engineers set it; the AI may propose it.
   - `high` values need engineer approval for any change, even a `Calculated` one.

## 3. Revision and hash

```json
"revision": {"number": 7, "parent_hash": "sha256:…", "created": "2026-10-23T15:00:00+11:00", "author": "Masoud", "note": "accepted D-41"},
"hash": {"algorithm": "sha256", "covers": "document-without-hash", "canonicalisation": "pdf2bim-c14n/1", "value": "sha256:…"}
```

**What the hash covers:** the entire JSON document with the top-level `hash` member removed. This includes `revision` (so the number, parent, author and time are covered), all values, tables, lists and `custom`. The decision log is a separate file. Its sha256 is recorded in `revision.decision_log_sha256`, so the description hash also pins the log state.

**Canonicalisation `pdf2bim-c14n/1`** (based on RFC 8785, the JSON Canonicalization Scheme):
1. UTF-8; no BOM.
2. Object members sorted by key (Unicode code point order); arrays keep their order.
3. No insignificant whitespace (`,` and `:` separators only).
4. Numbers in the ECMAScript shortest round-trip form (RFC 8785 §3.2.2.3): `1515`, not `1515.0`; `0.1`; `1e-7`. Integers stay integers. NaN / Infinity are not allowed.
5. Strings with minimal JSON escaping (RFC 8785 §3.2.2.2).

The P0.2 implementation (Python) will be tested against the RFC 8785 test vectors. A document re-saved with different formatting or key order must give the **same** hash.

**What the hash is, and is not:**
- It **identifies content** and **detects change**: a run record stores it, so a result can be traced to the exact description it used; any edit gives a new hash.
- It is **not** evidence that the data are correct or approved. It is **not** a signature: anyone can recompute it, so it does not prove who made a change.
- Correctness comes from tags, sources, approvals and verification, not from the hash.

## 4. Migration 0.1 → 0.2 and backward compatibility

- **Reading:**
  - `format` selects the schema. 0.1 files stay valid under the 0.1 schema and are never rewritten in place.
  - 0.2 keeps `value` / `unit` / `tag` / `status` as the current value, so 0.1 readers still read 0.2 values correctly; they ignore the new members.
- **Migration tool (`schema/migrate_0_1_to_0_2.py`, P0.2)** writes a **new file**:
  1. For each value: `original` = {value, unit, tag, source} as in 0.1 and `current` = `"original"`, **except** where the decision log shows the 0.1 value is already a change of an earlier value (`from` / `from_tag` in an accepted decision). Then `original` = the decision's `from` value and tag (with its source where recorded), one override per decision in log order, and `current` = the last accepted one.
  2. Where the earlier source is not recorded in the log, `original.source` is set to `{"note": "not recorded in 0.1; see decision D-n"}`. Nothing is invented.
  3. `significance` is not guessed: it is left absent and listed in the migration report for engineer input.
  4. `revision` = {number 1, parent_hash null, note "migrated from 0.1"}, and the hash is computed.
  5. Report: counts, values with reconstructed originals, decisions that could not be mapped.
- **Round trip test:** for every value, `value` / `unit` / `tag` in the 0.2 file equal the 0.1 file.
- **The engine side is unaffected:** engines read `value`.

## 5. P0.2 deliverables (as specified)

- `schema/fields.py` / `build_schema.py`: generate `bridge.schema.0.2.json` (0.1 schema kept).
- Validator rules 1–7 above (JSON Schema plus a Python rule checker, because rules 1, 2 and 3 compare across fields and revisions).
- `schema/c14n.py` + hash; RFC 8785 test vectors.
- Migration tool + report; BR13A migrated to a new file `projects/BR13A/BR13A.bridge.0.2.json` (0.1 file kept).
- `examples/override_example.0.2.json`: an original drawing value, an engineer override and the resulting approved value. Plus rejection tests:
  - edited original;
  - deleted override;
  - two current values;
  - `value` ≠ current entry;
  - Direct override without evidence;
  - AI-accepted Assumed value.
- Updated `docs/BRIDGE_DESCRIPTION_FORMAT.md` and `BRIDGE_FIELDS.md`.

## 6. Implementation (P0.2, 2026-10-24)

| Item | File |
|---|---|
| Canonical JSON + hash (`pdf2bim-c14n/1`) | `schema/c14n.py` |
| 0.2 JSON Schema (generated alongside the unchanged 0.1 schema) | `schema/build_schema.py` → `schema/bridge.schema.0.2.json` |
| Rule checker R1–R7 + hash; revision checker | `schema/rules_0_2.py` (`check`, `check_revision`) |
| Migration tool + report | `schema/migrate_0_1_to_0_2.py` |
| BR13A in 0.2 (0.1 file kept, unchanged) | `projects/BR13A/BR13A.bridge.0.2.json`, `…0.2.migration.md` |
| Worked example: original → proposed override → approved | `examples/override_example/` (fictional bridge; `build.py` regenerates rev1–rev3) |
| Tests (47 assertions) | `tests/schema/test_format_0_2.py` |

**Provisional decisions made during implementation** (recorded in `DECISIONS.md`, ADR-017; reversible):
1. **The migration rebuilds an original from the decision log only when the decision key equals the record path exactly** (`[*]` matches any list id).
   - BR13A: the four D-6 girder lengths (34950, Assumed → the Calculated chord lengths).
   - D-8 names a parent object (`supert_types[ST1]`), so it is **not** assigned to the section or depth field. Those keep their first recorded state as original, and the earlier value stays in the log.
2. **Unknown units stay `null`.** D-6's 34950 is very likely mm (the decision text says "34950 / 530 mm"), but the unit was not recorded as data, so it is left `null` and flagged.
3. **Added rule (R3 provenance):** when the current value is an override, the record's `source` / `derivation` / `ref` must be the override's.
   - This stops a drawing source (for example "200 SLAB") from staying attached to a changed value (220).
   - The drawing source stays on `original`.
4. **"One current value":** every accepted override that is not current must be superseded by a later override (`supersedes`).
5. **Allowed approval transitions between revisions:** `proposed → accepted | rejected`, `accepted → superseded`. Nothing else.
6. `significance` is never set by migration; it is set by the engineer.

**Not done yet:**
- engines and the dashboard still read 0.1 (they read `value`, so 0.2 is compatible);
- no UI for proposing or approving overrides (P5);
- `docs/BRIDGE_FIELDS.md` documents fields, which are the same in 0.1 and 0.2.
