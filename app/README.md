# PDF2BIM web app (P7 stage 1, ADR-049)

One place to follow a bridge: drawings → bridge data (every value with its data-source tag) → integrated model (3D)
→ analysis → design checks → MIDAS file and reports.

## Run it

```
pip install flask pdfplumber pypdfium2 numpy        # once (the platform's own requirements as well)
python3 app/server.py                               # then open http://localhost:8600
```

- Data folder `app_data/` (git-ignored): uploaded drawings, rendered pages, chain runs. Drawings never go into the repository.
- `--data DIR` to keep it elsewhere; `--host 0.0.0.0` only on a trusted network (no log-in yet).

## What each tab shows

| Tab | Content | Source |
|---|---|---|
| Overview | Pipeline status, run button, key results, data quality | latest run, else committed repository outputs |
| Drawings | Upload PDFs; page viewer; pages matched to the description's drawing numbers | `app_data/<id>/drawings` |
| Bridge data | Every description value: tag, sheet (links to the page), derivation, proposed overrides, Needs review filter | the description JSON |
| Model 3D | Integrated model by member role; deformed self weight / SDL | `app/model_view.py` |
| Analysis | SW / SDL totals, deflections; bearing, pile, girder, sill design actions | `tools/combined_actions.py` |
| Design checks | Girder utilisation summary and heat maps; station detail | `tools/girder_checks.py` |
| Run log & files | Step status and times, full log, downloads (.mct, .md, .json) | the run folder |

## Rules

- The app computes no engineering value: each chain step is the existing tool the engineer would run.
- Results are labelled INDICATIVE; runs that use proposed inputs say so.
- A new bridge starts with every field Missing — Flagged. Automatic extraction from the PDFs is the next stage (P7.2).

## Front end

TypeScript in `app/web/src` (ADR-006), bundled to `app/static/app.js` (committed, so Python alone runs the app).
Rebuild after editing: `cd app/web && npm install && npm run build`.

Tests: `python3 tests/app/test_server.py`.
