# BR13A earthquake RSA: P3c vs the dashboard (characteristic)

kp 1.7, Z 0.08, site Ce, Rf 1.0, ζ 0.05 (Assumed / Standard-verify); 30 modes, CQC + missing mass, 100 / 30 %. Ch(T) and kp from code-extracted-UNVERIFIED standards entries. **V5 comparison, not verification.**

## Periods (s), first 6 modes

| Mode | Dashboard | P3c, frozen model, dashboard mass (engine check) | P3c, frozen model, P3c mass (H-3 removed) | P3c, P3b model |
|---|---|---|---|---|
| 1 | 0.6665 | 0.6665 | 0.6217 | 0.5720 |
| 2 | 0.3771 | 0.3771 | 0.3561 | 0.3370 |
| 3 | 0.2978 | 0.2978 | 0.2707 | 0.2722 |
| 4 | 0.2613 | 0.2613 | 0.2518 | 0.2475 |
| 5 | 0.1752 | 0.1752 | 0.1720 | 0.1742 |
| 6 | 0.1633 | 0.1633 | 0.1625 | 0.1656 |

## Engine check: dashboard eqRun vs the P3c RSA on the same model and mass

| Response | Dir | Largest |Δ| | Largest value |
|---|---|---|---|
| bearing forces (link axes) | L | 6.73e-04 kN | 436.9 kN |
| pile max moment | L | 6.22e-05 kN·m | 1230.8 kN·m |
| bearing forces (link axes) | T | 1.74e-03 kN | 501.7 kN |
| pile max moment | T | 9.78e-05 kN·m | 1001.9 kN·m |

## Platform result (P3b model, P3c mass) vs the dashboard: pile max moment (kN·m)

| Pile | EQ-L P3c | EQ-L dashboard | EQ-T P3c | EQ-T dashboard |
|---|---|---|---|---|
| A1 | 1173 | 1380 | 1074 | 1207 |
| A2 | 1162 | 1359 | 1091 | 1204 |
| A3 | 1154 | 1340 | 1067 | 1176 |
| A4 | 1146 | 1314 | 998 | 1109 |
| B1 | 554 | 595 | 897 | 982 |
| B2 | 571 | 604 | 974 | 1059 |
| B3 | 569 | 604 | 992 | 1089 |
| B4 | 552 | 602 | 960 | 1079 |

Effect of H-3 alone (frozen model, P3c mass vs dashboard mass, EQ-L pile moments): ratio 0.932 … 0.936.
Differences on the P3b model also include the model differences (M-2: horizontal modes 5–8 % shorter).
