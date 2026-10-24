# BR13A natural modes: P3b vs the dashboard's frozen integrated model

**Cross-implementation comparison (V5), not T7.** T7 needs an independent MIDAS eigen model with the same boundary conditions and mass (P4).

- Status: **PROVISIONAL** (inputs D-37, D-39, D-40, D-41). Mass: member self weight as in the static analysis + SDL lumped (|nodal SDL| / g). Consistent beam mass.
- Total mass in the free dofs (X): P3b 957.0 t, frozen 961.8 t.

## Python modal solver vs the dashboard's AN.modal (same frozen model, same mass)

8 modes: largest period difference **4.5e-08** (relative). The dashboard's modal routine weights every member, including the deck strips and dummies whose weight is already inside the composite girders (+836 kN, +9.8 % mass): **finding H-3** (affects the dashboard's earthquake response spectrum, which uses the same routine). The P3b analysis does not do this.

## Modes (lowest 12)

| # | P3b T (s) | dominant (eff.) | Frozen T (s) | dominant (eff.) | ΔT |
|---|---|---|---|---|---|
| 1 | 0.5720 | X 0.49 | 0.6217 | X 0.49 | -8.0 % |
| 2 | 0.3370 | Y 0.56 | 0.3561 | Y 0.55 | -5.4 % |
| 3 | 0.2722 | Z 0.35 | 0.2707 | Z 0.35 | +0.6 % |
| 4 | 0.2475 | X 0.10 | 0.2518 | X 0.12 | -1.7 % |
| 5 | 0.1742 | X 0.03 | 0.1720 | X 0.01 | +1.3 % |
| 6 | 0.1656 | X 0.10 | 0.1625 | X 0.12 | +1.9 % |
| 7 | 0.0981 | X 0.00 | 0.0905 | X 0.00 | +8.4 % |
| 8 | 0.0796 | Y 0.00 | 0.0785 | Y 0.01 | +1.4 % |
| 9 | 0.0770 | X 0.00 | 0.0750 | Y 0.02 | +2.5 % |
| 10 | 0.0708 | X 0.00 | 0.0740 | X 0.02 | -4.4 % |
| 11 | 0.0703 | Y 0.04 | 0.0711 | Y 0.01 | -1.2 % |
| 12 | 0.0659 | Y 0.01 | 0.0678 | Y 0.01 | -2.7 % |

## Main mode per direction (largest effective mass)

| Direction | P3b T (s), eff. | Frozen T (s), eff. | ΔT |
|---|---|---|---|
| X | 0.5720, 0.49 | 0.6217, 0.49 | -8.0 % |
| Y | 0.3370, 0.56 | 0.3561, 0.55 | -5.4 % |
| Z | 0.2722, 0.35 | 0.2707, 0.35 | +0.6 % |

Global X / Y are the MGA east / north axes (the bridge runs roughly east-west). Modes are paired here by order and dominant direction only; a MAC pairing on common points is not done (the two meshes differ).

## Known model differences
- As `BR13A.integrated_vs_frozen.md`: straight chords, varying sections, short bearing links at the drawn seat levels, sill on its setout.
- SDL mass follows each model's own SDL nodal loads (`BR13A.sdl_vs_frozen.md`).
