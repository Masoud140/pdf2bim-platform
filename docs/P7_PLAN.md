# P7 plan — from working app to complete bridge platform (owner request 2026-11-02)

Owner: "bring the existing application to completion as a professional, comprehensive and fully functional bridge
engineering platform; later improve it with more examples". Scope stays single-span Super-T (planks in the format).
Each stage ends with tests, docs and a push; owner-only decisions are listed separately and are never assumed.

| Stage | Content | State |
|---|---|---|
| P7.1 | Web app: drawings, bridge data, 3D model, analysis, design, run log (ADR-049) | DONE |
| P7.3 | Decisions and engineer input in the app (ADR-050) | DONE |
| P7.4 | Run it yourself: `start_app.bat` (Windows) / `start_app.sh`, `requirements.txt` | DONE 2026-11-02 |
| P7.5 | Complete results: modes (periods, mass participation, mode shapes in 3D), section properties with section drawings, geometry checks | DONE 2026-11-02 |
| P7.6 | Calculation report per run (printable HTML → PDF): inputs with tags, needs-review list, model, actions, design, provenance, limitations | DONE 2026-11-02 |
| P7.7 | Verification view: drawing-printed design actions vs results (differences, no invented criterion); recorded MIDAS runs | DONE 2026-11-02 |
| P7.8 | Revision history + diff (DONE 2026-11-02); edit table rows (DONE, JSON cells); add new rows (format needs an add-row operation) | partly done |
| P7.2 | Extraction of uploaded PDFs in the app | **owner: may drawings go to the Claude API?** |
| P7.9 | Users, log-in, hosting, database | **owner: local only, or a server?** |

## Engineering items that block "design-ready" (owner / reviewer, not software)

- H-11 hog / prestress losses after transfer (kept open by the owner 2026-11-02).
- P4-6 torsion approach for Super-T shear (BR13A shear / torsion u up to 2.8 indicates the method).
- 63 standards entries code-extracted and unverified (P0.3).
- Traffic moving-load export to MIDAS (deferred), plank design checks (not started).
- B12626: 190 Assumed development inputs (D-1 proposed), G-1 per-side flange setback, G-3 crowned sill.

Until these close, every result in the app stays INDICATIVE and says so.
