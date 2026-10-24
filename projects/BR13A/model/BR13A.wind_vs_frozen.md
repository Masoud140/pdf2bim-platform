# BR13A wind: P3c vs the dashboard (characteristic, V_uls)

q = 1.215 kPa; exposed depth 2.815 m; wT 5.130, wV 8.383, wL 1.283 kN/m (inputs Assumed / Standard-verify). **V5 comparison, not verification.**

- Levers above the model node level (girder top): superstructure -0.107 m, vehicles 2.275 m. The dashboard uses -0.307 / 2.075 m measured from the deck top although its nodes are at the girder top (**H-6**: its wind levers are 0.2 m low).
- Vertical wind: P3c shares the resultant over the girder lines about their length-weighted centroid (exact total and position). The dashboard measures from the deck centre and ignores the line lengths (**H-7**): its total uplift differs by ±0.9 % between the two wind directions.

## Load totals (kN; X, Y, Z) and vertical resultant position

| Case | P3c | Dashboard | vertical resultant offset P3c / dashboard (m) |
|---|---|---|---|
| WT+ | 25.56, 151.85, 0.00 | 25.56, 151.83, 0.00 | — |
| WT- | -25.56, -151.85, 0.00 | -25.56, -151.83, 0.00 | — |
| WTV+ | 7.47, 44.40, 0.00 | 7.47, 44.39, 0.00 | — |
| WTV- | -7.47, -44.40, 0.00 | -7.47, -44.39, 0.00 | — |
| WVU+ | 0.00, 0.00, 251.69 | 0.00, 0.00, 253.79 | -2.000 / -2.004 |
| WVU- | 0.00, 0.00, 251.69 | 0.00, 0.00, 249.53 | 2.600 / 2.595 |
| WVD+ | 0.00, 0.00, -251.69 | 0.00, 0.00, -253.79 | -2.000 / -2.004 |
| WVD- | 0.00, 0.00, -251.69 | 0.00, 0.00, -249.53 | 2.600 / 2.595 |
| WL+ | -37.96, 6.39, 0.00 | -37.96, 6.39, 0.00 | — |
| WL- | 37.96, -6.39, 0.00 | 37.96, -6.39, 0.00 | — |

Target vertical resultant offsets: deck centre 0.300 ± 0.25 b.

## Responses: sum of bearing vertical forces and largest pile moment

| Case | P3c ΣRz / max pile M | Dashboard loads on the frozen model ΣRz / max pile M |
|---|---|---|
| WT+ | -0.0 / 44.6 | -0.0 / 48.3 |
| WT- | 0.0 / 44.6 | 0.0 / 48.3 |
| WTV+ | -0.0 / 12.8 | 0.0 / 13.9 |
| WTV- | 0.0 / 12.8 | -0.0 / 13.9 |
| WVU+ | -251.7 / 10.7 | -253.8 / 6.5 |
| WVU- | -251.7 / 9.1 | -249.5 / 8.5 |
| WVD+ | 251.7 / 10.7 | 253.8 / 6.5 |
| WVD- | 251.7 / 9.1 | 249.5 / 8.5 |
| WL+ | -0.0 / 23.5 | -0.0 / 28.3 |
| WL- | 0.0 / 23.5 | 0.0 / 28.3 |
