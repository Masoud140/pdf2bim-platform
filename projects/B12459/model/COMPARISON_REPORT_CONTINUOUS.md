# B12459 (SB41 WB) — platform vs design report RPT-410001 rev D — INDICATIVE

Run (scratch, engine f9171ae + this change): **both spans joined continuous over the pier (ADR-082)** — self weight on the simply supported spans, SDL, thermal, wind and traffic on the continuous structure (staging provisional, not read from the drawings); hogging capacity = the girder section's (deck reinforcement / stress bars not yet in the section). Missing inputs are the generic proposals D-1; standards entries unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging M*, largest of the bridge (kNm) | 17,320 | report table 4-27 (41B-S1-09) | 18,949 | 41B-S1-01 ULS-B-0138 | +9.4 % | simply supported: expected above the continuous design |
| 41B-S1-09 ULS M* sagging (kNm) | 17,320 | report table 4-27 | 14,966 | ULS-B-0102 | -13.6 % | continuous, self weight simply supported (staging provisional) |
| 41B-S1-09 ULS M* hogging (kNm) | 14,521 | report table 4-27 (φMu 14,698) | 11,255 | ULS-B-0108, ch 694.73 | -22.5 % | magnitude; continuous, staging provisional |
| 41B-S1-09 ULS V* (kN) | 2,122 | report table 4-27 | 2,166 | platform: largest |V| along the girder | +2.1 % | report: design shear at its critical section |
| 41B-S1-09 φMu at mid-span (kNm) | 17,720 | report table 4-27 | 15,055 | t = 0.50, φ = 0.788 | -15.0 % | platform Muo = 18,936; the report value may include the deck reinforcement / stress bars |
| 41B-S1-09 SLS soffit stress at Ms* (MPa) | 3.06 | report table 4-28 (tension; limit 3.16) | 4.78 | SLS-S-0027, Ms* 5,647 kNm | +56.3 % | platform: continuous (staging provisional), uncracked composite, tension + |
| 41B-S1-09 transfer compression (MPa) | 23.54 | report table 4-28 (compression; limit 24) | 28.29 | x = 8.44 m, limit 23.5 | +20.2 % | girder alone at transfer, f'cp 40 (0700) |
| Pile SLS N max, A-05/A-06/A-07/A-08 (kN) | 4,686 | 0201 table 1 | 3,220 | A-08 | -31.3 % |  |
| Pile ULS N max, A-05/A-06/A-07/A-08 (kN) | 6,606 | 0201 table 1 | 4,629 | A-08 | -29.9 % |  |
| Pile SLS N max, A-09/A-10 (kN) | 3,702 | 0201 table 1 | 3,007 | A-09 | -18.8 % |  |
| Pile ULS N max, A-09/A-10 (kN) | 4,931 | 0201 table 1 | 4,364 | A-09 | -11.5 % |  |
| Pile SLS N max, B-05/B-06/B-07/B-08 (kN) | 5,189 | 0201 table 1 | 4,024 | B-08 | -22.5 % |  |
| Pile ULS N max, B-05/B-06/B-07/B-08 (kN) | 7,840 | 0201 table 1 | 6,196 | B-05 | -21.0 % |  |
| Pier 1 (EB P2) pile SLS N max (kN) | 6,223 | 0201 table 1 (P2-04) | 9,040 | P2-04 | +45.3 % | one continuous model; wall weight and the SB41 EB share not included |
| Pier 1 (EB P2) pile ULS N max (kN) | 9,078 | 0201 table 1 (P2-04) | 13,068 | P2-04 | +44.0 % | as above |

Known limits of this run (whether a difference is acceptable is the engineer's call):

- continuity: staging provisional (self weight simply supported); earthquake not combined; braking per span; span 1 carriageway along the deck (ADR-082);
- the girder ends stop short of the single pier bearing (X1 - chord = -180 .. -490 mm): the pier end is modelled 100 mm past the bearing (Model);
- abutment B girder end distance taken 400 as abutment A (0709 dims at 44°: query);
- deck taken at the widest 0801 W1 / W2 station in each span (the deck tapers 18.1 -> 15.0 m in span 1): the south edge girder 41B-S1-01 carries a 3.9 m overhang at the pier end that does not exist, so its M* / V* (largest of the bridge) are not comparable — compare girder 09;
- SLS soffit tension 9.7 MPa vs 3.06: simply supported SDL + traffic (the report's are continuous) and generic losses (D-1); transfer compression +20 % with f'cp 40; the 0724 strand reading for S1-07..09 (52 strands) was re-checked: the difference is the basis, not the reading;
- one Super-T type per span (strands of the 07-09 group, fitments of girder 09);
- headstock ends of the shared abutments = end bearings ± 1 m (Model); barrier section as SB41 EB (query);
- skew above 35° at abutment B; HLP400 placed by the platform's rule, not the two-marked-lanes position.
