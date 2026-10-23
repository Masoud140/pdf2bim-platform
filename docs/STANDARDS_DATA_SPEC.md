# Standards data — framework specification (ADR-009)

**Status:**
- The **architecture** was approved in principle on 2026-10-23.
- The **engineering content is not approved.** The owner is responsible for engineering review and will arrange independent verification of the AS 5100 and AS/NZS 1170.4 requirements against authorised copies.
- **Implementation is stage P0.3.**

## 1. Principle: framework separate from content

- **Framework** (software): the file format, the accessor that engines call, status propagation into results, and the tests. It can be built and tested now.
- **Content** (engineering): the values and rules. Each entry has its own status and reviewer. Building the framework does not approve any value in it.

## 2. Entry record

```json
{
  "id": "AS1170.4:spectral_shape:site_class_Be",
  "standard": "AS 1170.4", "edition": "2007", "amendment": "Amdt 2 (2018)",
  "reference": {"clause": "6.4", "table": "6.4", "figure": null, "authorised_source": "to be recorded by reviewer"},
  "quantity": "spectral shape factor Ch(T)",
  "units": "-",
  "value": {"type": "table", "columns": ["T_s", "Ch"], "rows": "… (entered or checked only from an authorised copy)"},
  "applicability": "site sub-soil class Be; T in s; …",
  "context": "earthquake response spectrum, design action (AS 5100.2 cl. 14 referral)",
  "implementation": {"used_by": ["src/sub5.js eqSa (current)", "python: loads.earthquake (future)"], "version": "0.1"},
  "status": "code-extracted-unverified",
  "review": {"reviewer": null, "date": null, "method": null, "notes": null},
  "interpretation": {"open": true, "note": "…", "specialist_review": false}
}
```

**Status values, in order:**

| Status | Meaning | Who sets it |
|---|---|---|
| `placeholder-unverified` | Structure only; the value is absent or a stand-in so code can run | software |
| `code-extracted-unverified` | Value copied from the existing code (for example the dashboard constants) | software. **Never higher.** |
| `transcribed-unverified` | Value transcribed from an authorised copy but not yet independently checked | transcriber, with the reference recorded |
| `checked` | Independently checked against an authorised copy by a named reviewer | reviewer |
| `approved` | Accepted by the responsible engineer for use in design | owner / responsible engineer |

**Rules:**
1. **No coefficient from the existing code enters the file above `code-extracted-unverified`.** It moves up only through transcription or checking against an authorised copy, with reviewer and date.
2. **Engines read standards values only through the accessor.** It returns the value **and its status**. Constants in engine code are removed as each module migrates (gap F-2).
3. **Status propagates.** Every result records the ids and statuses of the entries it used. If any entry is below `approved`, the result is flagged **unverified**. Reports show "UNVERIFIED — standards data not approved" and never present it as a validated final design result.
4. **Interpretation:** where a rule needs specialist interpretation or independent checking (for example earthquake design category, traffic load models, Super-T design provisions), the entry sets `interpretation.specialist_review = true`, and it is listed in a review register for the owner.
5. **Edition control:** an entry names its standard, edition and amendment. A change of edition creates new entries; it does not edit old ones.
6. **Licensing:**
   - No clause text is copied.
   - Entries hold clause references, the minimum numerical values the software needs, and short paraphrased applicability notes.
   - Whether even tabulated values may be stored in a commercial product is a **licence question for the owner** before any release.

## 3. Initial inventory (P0.3), content status

All entries listed here will be created at `code-extracted-unverified` (or `placeholder-unverified`), each with the code location they come from:

| Area | Current code source | Notes |
|---|---|---|
| AS 1170.4 spectral shape and hazard | `src/sub5.js` (C_h table transcribed earlier from memory) | specialist review |
| Dynamic load allowance / traffic factors | `dgFac` regex in the design code; Combos register | specialist review |
| AS 5100.2 load factors and combinations | Combos tab register (`CBX`) | check every row |
| Wind (AS 5100.2 / AS/NZS 1170.2 referral) | `src/sub4.js` | specialist review |
| Temperature (uniform, gradient) | `src/sub3.js`, `src/sub7.js` | — |
| AS 5100.5 material, stress-block, φ factors | `src/dsg_engine*.js` | E-1 open |
| Super-T product dimensions | Hog section library, `secGeom` | product data (TfNSW), separate product library |

## 4. P0.3 deliverables (to implement)

- `standards/schema.json`, accessor (Python first; JavaScript shim for the dashboard optional).
- The inventory above as data files, every entry `code-extracted-unverified` with its code location.
- The review register (generated list of entries with status < `approved` or `specialist_review`).
- Tests:
  - an entry cannot be saved as `checked` / `approved` without reviewer, date and authorised reference;
  - the accessor returns the status;
  - a result that uses an unapproved entry is flagged unverified.
