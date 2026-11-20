# B12459 (SB41 WB) — platform vs design report RPT-410001 rev D — INDICATIVE

Run (engine 5257ac8, HLP at the three 0101 positions): **both spans joined continuous over the pier (ADR-082)** — girder self weight on the simply supported spans, deck, SDL, thermal, wind and traffic on the continuous structure (staging from 0575); hogging over the pier with the 0850 deck bars and the 0575 stress bars (bar UTS Missing - Flagged). Missing inputs are the generic proposals D-1; standards entries unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging M*, largest of the bridge (kNm) | 17,320 | report table 4-27 (41B-S1-09) | 17,960 | 41B-S1-01 ULS-B-0138 | +3.7 % | simply supported: expected above the continuous design |
| 41B-S1-09 ULS M* sagging (kNm) | 17,320 | report table 4-27 | 14,203 | ULS-B-0102 | -18.0 % | continuous; girder self weight simply supported, deck on the continuous girders (0575) |
| 41B-S1-09 ULS M* hogging (kNm) | 14,521 | report table 4-27 (φMu 14,698) | 12,984 | ULS-B-0108, ch 694.73 | -10.6 % | magnitude; continuous (staging 0575) |
| 41B-S1-09 φMu hogging over the pier (kNm) | 14,698 | report table 4-27 | 15,046 | x = 38.59 m, deck bars top 11 x (N32 + N32) over 1606 mm; bot 11 x (N32 + N32) over 1606 mm | +2.4 % | deck reinforcement alone; with the 6 stress bars at lock-off 15,236; bar UTS Missing - Flagged |
| 41B-S1-09 ULS V* (kN) | 2,122 | report table 4-27 | 2,110 | platform: largest |V| along the girder | -0.6 % | report: design shear at its critical section |
| 41B-S1-09 φMu at mid-span (kNm) | 17,720 | report table 4-27 | 15,505 | t = 0.50, φ = 0.791 | -12.5 % | platform Muo = 19,424; the report value may include the deck reinforcement / stress bars |
| 41B-S1-09 SLS soffit stress at Ms* (MPa) | 3.06 | report table 4-28 (tension; limit 3.16) | -0.36 | SLS-S-0027, Ms* 5,645 kNm | -111.7 % | platform: continuous (staging 0575), uncracked composite, tension + |
| 41B-S1-09 transfer compression (MPa) | 23.54 | report table 4-28 (compression; limit 24) | 28.29 | x = 8.44 m, limit 23.5 | +20.2 % | girder alone at transfer, f'cp 40 (0700) |
| Pile SLS N max, A-05/A-06/A-07/A-08 (kN) | 4,686 | 0201 table 1 | 3,134 | A-08 | -33.1 % |  |
| Pile ULS N max, A-05/A-06/A-07/A-08 (kN) | 6,606 | 0201 table 1 | 4,519 | A-08 | -31.6 % |  |
| Pile SLS N max, A-09/A-10 (kN) | 3,702 | 0201 table 1 | 2,946 | A-09 | -20.4 % |  |
| Pile ULS N max, A-09/A-10 (kN) | 4,931 | 0201 table 1 | 4,265 | A-09 | -13.5 % |  |
| Pile SLS N max, B-05/B-06/B-07/B-08 (kN) | 5,189 | 0201 table 1 | 3,884 | B-08 | -25.1 % |  |
| Pile ULS N max, B-05/B-06/B-07/B-08 (kN) | 7,840 | 0201 table 1 | 5,851 | B-05 | -25.4 % |  |
| Pier 1 (EB P2) pile SLS N max (kN) | 6,223 | 0201 table 1 (P2-04) | 8,294 | P2-04 | +33.3 % | one continuous model; wall weight and the SB41 EB share not included |
| Pier 1 (EB P2) pile ULS N max (kN) | 9,078 | 0201 table 1 (P2-04) | 12,141 | P2-04 | +33.7 % | as above |

Known limits of this run (whether a difference is acceptable is the engineer's call):

- continuity (ADR-082): girder self weight simply supported, deck continuous (0575); earthquake not combined; braking per span; span 1 carriageway along the deck (ADR-082);
- the girder ends stop short of the single pier bearing (X1 - chord = -180 .. -490 mm): the pier end is modelled 100 mm past the bearing (Model);
- abutment B girder end distance taken 400 as abutment A (0709 dims at 44°: query);
- deck taken at the widest 0801 W1 / W2 station in each span (the deck tapers 18.1 -> 15.0 m in span 1): the south edge girder 41B-S1-01 carries a 3.9 m overhang at the pier end that does not exist, so its M* / V* (largest of the bridge) are not comparable — compare girder 09;
- SLS soffit tension 9.7 MPa vs 3.06: simply supported SDL + traffic (the report's are continuous) and generic losses (D-1); transfer compression +20 % with f'cp 40; the 0724 strand reading for S1-07..09 (52 strands) was re-checked: the difference is the basis, not the reading;
- one Super-T type per span (strands of the 07-09 group, fitments of girder 09);
- headstock ends of the shared abutments = end bearings ± 1 m (Model); barrier section as SB41 EB (query);
- skew above 35° at abutment B; HLP400 placed by the platform's rule, not the two-marked-lanes position.

Girder checks of this run: sagging ULS u ≤ 1.02 (41B-S1-01, the overhang noted above); hogging over P1 with the stress bars at lock-off u 0.65–1.01; **span 2 open stations 3.5–10 m from the pier: hogging u up to 1.90 (41B-S2-01)** — the DA35 / DA36 N32 stay inside the pier stitch (0852 sections 6 / 7), so only the typical N16 and the 10 m DA16 N32 act there; mostly M1600 and the negative gradient restraint (uncracked stiffness). Owner query: the report's hogging envelope there. HLP400 at the three 0101 positions (ADR-084) does not govern any girder envelope. Run time 36 min (traffic-state export 13 min after the HLP speed fix).
