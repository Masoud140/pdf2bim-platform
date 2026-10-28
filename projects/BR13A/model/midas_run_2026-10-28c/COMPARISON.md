# BR13A — MIDAS run 2026-10-28c: temperature / shrinkage and combinations vs platform

- File: commit 8e8312d (adds TUp, TUm, SCR as *ELTEMPER, TGP, TGN as *BSTEMPER, 133 combination rows + envelopes). Earthquake was not in that file.
- Owner run 2026-10-28 13:16. `Results_thermal_combinations.xlsx` (251 load labels; 207 compared — the '(all)' labels are skipped).

## Load cases

| Case | Worst nodal diff (mm) | Largest (mm) | Worst force diff | Largest force | % |
|---|---|---|---|---|---|
| SW | 0.0062 | 18.80 | 13.17 | 2733.7 | 0.48 |
| SDL | 0.0022 | 5.95 | 4.01 | 799.8 | 0.50 |
| EP | 0.0032 | 10.84 | 1.58 | 324.6 | 0.49 |
| EPTA | 0.0006 | 2.84 | 0.20 | 103.0 | 0.19 |
| EPTB | 0.0010 | 2.48 | 0.29 | 109.6 | 0.26 |
| BRKp | 0.0009 | 6.86 | 0.36 | 273.2 | 0.13 |
| BRKm | 0.0009 | 6.86 | 0.36 | 273.2 | 0.13 |
| CEN | 0.0007 | 0.56 | 0.33 | 43.3 | 0.77 |
| WTp | 0.0009 | 0.86 | 0.57 | 65.7 | 0.87 |
| WTm | 0.0009 | 0.86 | 0.57 | 65.7 | 0.87 |
| WTVp | 0.0008 | 0.27 | 0.29 | 23.8 | 1.20 |
| WTVm | 0.0008 | 0.27 | 0.29 | 23.8 | 1.20 |
| WVUp | 0.0009 | 1.99 | 1.31 | 255.1 | 0.51 |
| WVUm | 0.0014 | 2.08 | 1.66 | 275.4 | 0.60 |
| WVDp | 0.0009 | 1.99 | 1.31 | 255.1 | 0.51 |
| WVDm | 0.0014 | 2.08 | 1.66 | 275.4 | 0.60 |
| WLp | 0.0005 | 0.52 | 0.04 | 21.2 | 0.17 |
| WLm | 0.0005 | 0.52 | 0.04 | 21.2 | 0.17 |
| TUp | 0.0085 | 8.21 | 10.03 | 1021.2 | 0.98 |
| TUm | 0.0052 | 4.92 | 6.02 | 612.8 | 0.98 |
| SCR | 0.0100 | 9.85 | 12.03 | 1225.5 | 0.98 |
| TGP | 0.0110 | 13.82 | 14.73 | 433.4 | 3.40 |
| TGN | 0.0057 | 6.91 | 7.36 | 216.8 | 3.40 |
| NIL | 0.0000 | 0.00 | 0.00 | 0.0 | 0.00 |

**Temperature:** uniform / shrinkage within 1 %; gradients: displacements equal (0.011 mm) but vertical shear differs by up to 14.7 kN
(3.4 % of the case maximum) at a few element ends next to the bearings (girder, cross girder, web, rigid) — MIDAS's *BSTEMPER on offset
members distributes the locked-in action locally differently. Global response identical; accepted with a 4 % tolerance in the test.

## Combinations — export bug found and fixed
- First comparison (platform semantics): 44 of 207 labels outside tolerance, all of them rows with a NEGATIVE factor on an
  envelope term (e.g. `CB, WZ_S_env, -0.7`) and the overall envelopes containing them.
- Re-evaluated assuming MIDAS scales an envelope's max / min by the factor WITHOUT swapping them: 6 outside tolerance
  (the gradient cases above and small residuals) — so MIDAS does not swap, and its 'max' of such a row was the lower bound.
- Fix (mct.midas_combinations): a negative factor on an envelope now references a negated copy of the envelope (`*_env_n`) with a positive
  factor — exact under either convention. test_mct re-evaluates the file with MIDAS's observed semantics and fails on the old writer.
- The combination results of this run are therefore superseded; re-run the current file to confirm.
