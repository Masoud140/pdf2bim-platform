# B12459 (SB41 WB) — platform vs design report RPT-410001 rev D — INDICATIVE

Run (engine ce39f7c + stage 4b): **both spans joined continuous over the pier (ADR-082)** — self weight on the simply supported spans, SDL, thermal, wind and traffic on the continuous structure (staging provisional, not read from the drawings); hogging capacity = the girder section's (deck reinforcement / stress bars not yet in the section). Missing inputs are the generic proposals D-1; standards entries unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging M*, largest of the bridge (kNm) | 17,320 | report table 4-27 (41B-S1-09) | 17,964 | 41B-S1-01 ULS-B-0138 | +3.7 % | simply supported: expected above the continuous design |
| 41B-S1-09 ULS M* sagging (kNm) | 17,320 | report table 4-27 | 14,205 | ULS-B-0102 | -18.0 % | continuous, self weight simply supported (staging provisional) |
| 41B-S1-09 ULS M* hogging (kNm) | 14,521 | report table 4-27 (φMu 14,698) | 13,005 | ULS-B-0108, ch 694.73 | -10.4 % | magnitude; continuous, staging provisional |
| 41B-S1-09 φMu hogging over the pier (kNm) | 14,698 | report table 4-27 | 15,052 | x = 38.59 m, deck bars top 11 x (N32 + N32) over 1606 mm; bot 11 x (N32 + N32) over 1606 mm | +2.4 % | deck reinforcement alone; with the 6 stress bars at lock-off 15,232; bar UTS Missing - Flagged |
| 41B-S1-09 ULS V* (kN) | 2,122 | report table 4-27 | 2,115 | platform: largest |V| along the girder | -0.3 % | report: design shear at its critical section |
| 41B-S1-09 φMu at mid-span (kNm) | 17,720 | report table 4-27 | 15,505 | t = 0.50, φ = 0.791 | -12.5 % | platform Muo = 19,424; the report value may include the deck reinforcement / stress bars |
| 41B-S1-09 SLS soffit stress at Ms* (MPa) | 3.06 | report table 4-28 (tension; limit 3.16) | -0.35 | SLS-S-0027, Ms* 5,647 kNm | -111.4 % | platform: continuous (staging provisional), uncracked composite, tension + |
| 41B-S1-09 transfer compression (MPa) | 23.54 | report table 4-28 (compression; limit 24) | 28.29 | x = 8.44 m, limit 23.5 | +20.2 % | girder alone at transfer, f'cp 40 (0700) |
| Pile SLS N max, A-05/A-06/A-07/A-08 (kN) | 4,686 | 0201 table 1 | 3,146 | A-08 | -32.9 % |  |
| Pile ULS N max, A-05/A-06/A-07/A-08 (kN) | 6,606 | 0201 table 1 | 4,540 | A-08 | -31.3 % |  |
| Pile SLS N max, A-09/A-10 (kN) | 3,702 | 0201 table 1 | 2,935 | A-09 | -20.7 % |  |
| Pile ULS N max, A-09/A-10 (kN) | 4,931 | 0201 table 1 | 4,278 | A-09 | -13.2 % |  |
| Pile SLS N max, B-05/B-06/B-07/B-08 (kN) | 5,189 | 0201 table 1 | 3,978 | B-08 | -23.3 % |  |
| Pile ULS N max, B-05/B-06/B-07/B-08 (kN) | 7,840 | 0201 table 1 | 5,977 | B-08 | -23.8 % |  |
| Pier 1 (EB P2) pile SLS N max (kN) | 6,223 | 0201 table 1 (P2-04) | 8,346 | P2-04 | +34.1 % | one continuous model; wall weight and the SB41 EB share not included |
| Pier 1 (EB P2) pile ULS N max (kN) | 9,078 | 0201 table 1 (P2-04) | 12,235 | P2-04 | +34.8 % | as above |

Known limits of this run (whether a difference is acceptable is the engineer's call):

- continuity: staging provisional (self weight simply supported); earthquake not combined; braking per span; span 1 carriageway along the deck (ADR-082);
- the girder ends stop short of the single pier bearing (X1 - chord = -180 .. -490 mm): the pier end is modelled 100 mm past the bearing (Model);
- abutment B girder end distance taken 400 as abutment A (0709 dims at 44°: query);
- deck taken at the widest 0801 W1 / W2 station in each span (the deck tapers 18.1 -> 15.0 m in span 1): the south edge girder 41B-S1-01 carries a 3.9 m overhang at the pier end that does not exist, so its M* / V* (largest of the bridge) are not comparable — compare girder 09;
- SLS soffit tension 9.7 MPa vs 3.06: simply supported SDL + traffic (the report's are continuous) and generic losses (D-1); transfer compression +20 % with f'cp 40; the 0724 strand reading for S1-07..09 (52 strands) was re-checked: the difference is the basis, not the reading;
- one Super-T type per span (strands of the 07-09 group, fitments of girder 09);
- headstock ends of the shared abutments = end bearings ± 1 m (Model); barrier section as SB41 EB (query);
- skew above 35° at abutment B; HLP400 placed by the platform's rule, not the two-marked-lanes position.
