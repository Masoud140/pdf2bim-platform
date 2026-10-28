# BR13A integrated model — MIDAS run of all exported load cases vs platform solver (2026-10-28, second run)

- File: `BR13A.integrated.mct` at commit 6ef711b (deck-top reference D-48, no rigid-arm releases ADR-045, cross girders between Super-Ts only ADR-044, 17 *CONLOAD cases).
- MIDAS Civil NX, owner run 2026-10-28 12:05. Results: `Results_all_cases.xlsx` (sheet "Reaction" = beam end forces, "Displacement" = nodes).
- Supersedes `../midas_run_2026-10-28/` (released model, SW only).

| Case | Worst nodal diff (mm) | Largest displacement (mm) | Worst element force diff | Largest force | % |
|---|---|---|---|---|---|
| SW | 0.0062 | 18.802 | 13.17 | 2733.7 | 0.48 |
| SDL | 0.0022 | 5.946 | 4.01 | 799.8 | 0.50 |
| EP | 0.0032 | 10.842 | 1.58 | 324.6 | 0.49 |
| EPTA | 0.0006 | 2.844 | 0.20 | 103.0 | 0.19 |
| EPTB | 0.0010 | 2.482 | 0.29 | 109.6 | 0.26 |
| BRKp | 0.0009 | 6.855 | 0.36 | 273.2 | 0.13 |
| BRKm | 0.0009 | 6.855 | 0.36 | 273.2 | 0.13 |
| CEN | 0.0007 | 0.558 | 0.33 | 43.3 | 0.77 |
| WTp | 0.0009 | 0.857 | 0.57 | 65.7 | 0.87 |
| WTm | 0.0009 | 0.857 | 0.57 | 65.7 | 0.87 |
| WTVp | 0.0008 | 0.274 | 0.29 | 23.8 | 1.20 |
| WTVm | 0.0008 | 0.274 | 0.29 | 23.8 | 1.20 |
| WVUp | 0.0009 | 1.993 | 1.31 | 255.1 | 0.51 |
| WVUm | 0.0014 | 2.080 | 1.66 | 275.4 | 0.60 |
| WVDp | 0.0009 | 1.993 | 1.31 | 255.1 | 0.51 |
| WVDm | 0.0014 | 2.080 | 1.66 | 275.4 | 0.60 |
| WLp | 0.0005 | 0.524 | 0.04 | 21.2 | 0.17 |
| WLm | 0.0005 | 0.524 | 0.04 | 21.2 | 0.17 |

**Verified:** every block of the generated file including *CONLOAD load cases and load groups; the platform solver and MIDAS analyse the same structure
for every static load case (displacements to 0.006 mm, forces to ~1 %). This is software agreement, not an engineering check of the design.
Regression test: `tests/model/test_midas_run.py`.
