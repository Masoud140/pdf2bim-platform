# Bridge Studio

An interactive Super-T bridge analysis and design application on four generic case studies (ADR-061). It runs entirely in the browser and is published as a claude.ai artifact.

## Build and check

- `python3 studio/build.py` writes `studio/dist/bridge_studio.html` (one self-contained page, about 260 kB; git-ignored).
- Engine tests: `node studio/tests/test_engines.js` (5/5) and `node studio/tests/test_core.js` (12/12).
- Browser check: a Playwright run of the built page with the CDN libraries served locally. The script is not in the repository because it needs local copies of three.js, jsPDF and SheetJS.
  - It runs every tab, the four case studies, stale propagation, the exports, the optimiser and the sensitivity run.

## Layout

| Path | Contents |
|---|---|
| `engines/` | DSG, DSG2, HOG and SECLIB, extracted verbatim from the platform's original grillage dashboard (verified in `tests/test_engines.js`) |
| `src/core.js` | Case studies, geometry, grillage mesh and solver, moving-load envelopes (port of the Python engine), load cases, combinations, dependency groups |
| `src/analysis.js` | Analysis runner, combinations, girder design and checks, piles |
| `src/ui_*.js`, `src/ui3d.js`, `src/ui.css` | Interface: shell and dependency graph, 8 pages plus AI assistant and optimisation, three.js model, reports |

## What is calculated and what is not

- **Calculated:** everything shown as a result. That covers:
  - grillage responses and envelopes
  - losses, camber and transfer stresses
  - flexure, shear and torsion
  - SLS stresses
  - pile N–M
- **Inputs:** all illustrative. The code coefficients come from the platform standards inventory, which is unverified.
- **Not modelled:**
  - temperature and wind (they are shown as proposed cases)
  - soil
  - bearing capacity
  - pile geotechnical capacity
- **Experimental:**
  - The AI assistant and drawing reader use the artifact `sample` capability. They read results through page tools and only propose input changes.
  - The optimiser and sensitivity reuse the grillage result.
