# Bridge description format — pdf2bim.bridge/0.1 (step B1, for review)

One bridge = one folder: `projects/<bridge>/`.
- **`<bridge>.bridge.json`:** every value the platform uses, each tagged (format below).
- **`<bridge>.decisions.jsonl`:** the decision log, one entry per line, append-only.

There are also two shared files for all bridges (built in later steps):
- **`library/products.json`:** Super-T and plank product sections, referenced as `lib:...`.
- **`standards/AS5100-2017.json`:** code values (factors, spectra, gradient shapes...), referenced as `std:...`. Each value is checked once against the licensed Standard.

**Files:**
- `schema/bridge.schema.json` and `schema/decision.schema.json` are the machine rules.
- `docs/BRIDGE_FIELDS.md` lists every field.
- Both are generated from `schema/fields.py` by `python schema/build_schema.py`.

## 1. Every value is a tagged value

```json
"slab_thickness": {"value": 200, "unit": "mm", "tag": "Direct", "status": "accepted",
                   "source": {"doc": "GA-01", "sheet": "202301", "view": "section A-A", "text": "200 SLAB"}}
```

| Field | Meaning |
|---|---|
| `value` | The number, text or true/false. `null` when not known |
| `unit` | Fixed per field; a wrong unit is rejected |
| `tag` | One of the tags below |
| `source` | `doc` (document id in `documents[]`), `sheet`, `view`, `text` (as printed), `note` |
| `derivation` | For Calculated values: `formula` and `inputs` (paths of the values used) |
| `ref` | `lib:` or `std:` key, for product or code values |
| `status` | `open` → `proposed` → `accepted` / `rejected`; `superseded` once replaced |
| `decision` | Id of the decision-log entry that last set it (`D-12`) |
| `replace_with` | For Assumed values: what the real value will come from |

**Tables** (strand patterns, soil layers, alignment elements...) hold `rows`. Each row has its own `cells`, tag, source and status, so one strand row can be Direct while another is Assumed.

**Lists** (members, bearings, supports, piles, barriers) have any number of items, each with an `id`. Nothing assumes four girders or two abutments.

## 2. Tags and their rules (checked by the schema)

| Tag | Meaning | Must have |
|---|---|---|
| Direct | Printed on a drawing / document | `source.doc` |
| Calculated | Arithmetic from other values | `derivation` (formula + input paths) |
| Missing-Flagged | Not available | `value: null`, status `open` |
| Standard-verify | From a standard / product sheet, to be checked against the licensed copy | `ref` |
| Input-user | Entered by the engineer | `decision` |
| Confirmed-Engineer | Read from the PDF and confirmed by the engineer where the reading was uncertain | `decision` |
| Assumed | Placeholder agreed so the work can proceed | `source.note` (why) and `replace_with` |
| Model | Modelling choice (mesh, stiffness idealisation...) | `source.note` |

The project's absolute rule still holds: **no invented values**. Assumed exists only for values the engineer agrees to use for now. Each one is visible, logged and listed until replaced.

## 3. Decision log

```json
{"id":"D-14","date":"2026-10-23T12:10:00+11:00","by":"AI","key":"bearings.items[A-G1].restraint_longitudinal",
 "from":"free","from_tag":"Missing-Flagged","to":"fixed","to_tag":"Input-user",
 "reason":"Fixed at A, free at B — engineer instruction","status":"accepted",
 "approved_by":"Masoud","approved_at":"2026-10-23T12:15:00+11:00",
 "affects":["model","analysis.static","combinations","substructure"]}
```

- **Every change is an entry:** who, what (`key` = path), from → to (value and tag), why, evidence, status, approver, and which stages it makes out of date.
- **`affects`:** says which stages must be re-run (extraction, geometry, model, static / modal analysis, traffic, loads, combinations, Super-T or plank design, substructure, reports).
- **Overruling a Direct value** requires `evidence`.
- **Approval:** an accepted entry needs `approved_by` and `approved_at`.
- **Rejected proposals stay in the log.** They are useful history for later projects.

**Who can accept (proposed policy):**
- **Accepted automatically:** Calculated values the AI derives from accepted inputs (the derivation is checkable).
- **Engineer acceptance required:**
  - Assumed values;
  - any change to a Direct value;
  - Model choices;
  - anything the AI proposes from outside the drawings.
- **Never accepted:** Missing-Flagged. It stays open until a real value arrives.

## 4. What the file covers

The groups are `project`, `alignment`, `deck`, `superstructure` (type, members, Super-T types, plank types), `bearings`, `supports` (headstock, walls, piles, soil, backfill), `materials`, `loads`, `combinations`, `analysis` (modelling choices), and `design` (options, stations). The full list is in `docs/BRIDGE_FIELDS.md`.

- **Superstructure type:** `superstructure.type` selects Super-T or plank. Members point to a type definition, so mixed edge and inner girder types are possible.
- **Results are not stored here.** The model, analysis and design outputs are generated from this file and can be rebuilt at any time.

## 5. Checked by

`python3 tests/schema/test_schema.py`. The example passes, and ten deliberately broken values are rejected:
- a Direct value with no source;
- a Calculated value with no formula;
- an Assumed value with no "replace with";
- a Missing value marked accepted;
- an Input-user value with no decision;
- a bare number;
- an unknown field;
- a wrong unit;
- an unknown type;
- an untagged table row.

Two more rejections cover the decision log: overruling a Direct value without evidence, and an accepted entry without an approver.

## Next (after review)

- **B2:** BR13A filled in from the dashboard.
- **B3:** decision log seeded with this month's decisions.
- **B4:** the dashboard reads and writes the file.
- **B5:** completeness checker (open items, stale stages).
