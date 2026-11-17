# B12459 (SB41 WB) — platform vs design report RPT-410001 rev D — INDICATIVE

Runs `W1, W2` (spans 1-2; ADR-062). **The girders are continuous over the pier (stress bars, report table 4-27); the platform has no continuity, so each span runs simply supported: sagging is overstated, hogging is absent.** Missing inputs are the generic proposals D-1; standards entries unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging M*, largest of the bridge (kNm) | 17,320 | report table 4-27 (41B-S1-09) | 21,205 | 41B-S1-01 ULS-B-0156 | +22.4 % | simply supported: expected above the continuous design |
| 41B-S1-09 ULS M* sagging (kNm) | 17,320 | report table 4-27 | 16,941 | ULS-B-0156 | -2.2 % | simply supported vs continuous |
| 41B-S1-09 ULS M* hogging (kNm) | 14,521 | report table 4-27 (φMu 14,698) | — | not modelled | — | no continuity in the platform |
| 41B-S1-09 ULS V* (kN) | 2,122 | report table 4-27 | 2,278 | platform: largest |V| along the girder | +7.4 % | report: design shear at its critical section |
| 41B-S1-09 φMu at mid-span (kNm) | 17,720 | report table 4-27 | 15,117 | t = 0.50, φ = 0.796 | -14.7 % | platform Muo = 18,936; the report value may include the deck reinforcement / stress bars |
| 41B-S1-09 SLS soffit stress at Ms* (MPa) | 3.06 | report table 4-28 (tension; limit 3.16) | 9.72 | SLS-S-0073, Ms* 7,036 kNm | +217.8 % | platform: simply supported, uncracked composite, tension + |
| 41B-S1-09 transfer compression (MPa) | 23.54 | report table 4-28 (compression; limit 24) | 28.29 | x = 8.44 m, limit 23.5 | +20.2 % | girder alone at transfer, f'cp 40 (0700) |
| Pile SLS N max, A-05/A-06/A-07/A-08 (kN) | 4,686 | 0201 table 1 | 3,383 | A-08 | -27.8 % |  |
| Pile ULS N max, A-05/A-06/A-07/A-08 (kN) | 6,606 | 0201 table 1 | 4,852 | A-08 | -26.5 % |  |
| Pile SLS N max, A-09/A-10 (kN) | 3,702 | 0201 table 1 | 3,213 | A-09 | -13.2 % |  |
| Pile ULS N max, A-09/A-10 (kN) | 4,931 | 0201 table 1 | 4,645 | A-09 | -5.8 % |  |
| Pile SLS N max, B-05/B-06/B-07/B-08 (kN) | 5,189 | 0201 table 1 | 3,945 | B-05 | -24.0 % |  |
| Pile ULS N max, B-05/B-06/B-07/B-08 (kN) | 7,840 | 0201 table 1 | 6,234 | B-05 | -20.5 % |  |
| Pier 1 (EB P2) pile SLS N max (kN) | 6,223 | 0201 table 1 (P2-04) | 9,498 | P2-04 | +52.6 % | both spans' envelopes added; wall weight and the SB41 EB share not included |
| Pier 1 (EB P2) pile ULS N max (kN) | 9,078 | 0201 table 1 (P2-04) | 14,132 | P2-04 | +55.7 % | as above |

Known limits of this run (whether a difference is acceptable is the engineer's call):

- continuity over the pier not modelled (Tier 4 'continuous spans'): not a verification of SB41 WB;
- the girder ends stop short of the single pier bearing (X1 - chord = -180 .. -490 mm): the pier end is modelled 100 mm past the bearing (Model);
- abutment B girder end distance taken 400 as abutment A (0709 dims at 44°: query);
- deck taken at the widest 0801 W1 / W2 station in each span (the deck tapers 18.1 -> 15.0 m in span 1): the south edge girder 41B-S1-01 carries a 3.9 m overhang at the pier end that does not exist, so its M* / V* (largest of the bridge) are not comparable — compare girder 09;
- SLS soffit tension 9.7 MPa vs 3.06: simply supported SDL + traffic (the report's are continuous) and generic losses (D-1); transfer compression +20 % with f'cp 40; the 0724 strand reading for S1-07..09 (52 strands) was re-checked: the difference is the basis, not the reading;
- one Super-T type per span (strands of the 07-09 group, fitments of girder 09);
- headstock ends of the shared abutments = end bearings ± 1 m (Model); barrier section as SB41 EB (query);
- skew above 35° at abutment B; HLP400 placed by the platform's rule, not the two-marked-lanes position.
