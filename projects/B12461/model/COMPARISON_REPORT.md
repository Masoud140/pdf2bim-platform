# B12461 (SB42) — platform vs design report RPT-410001 rev D

Runs `runS1c, runS2c` (span 1, span 2; ADR-062). INDICATIVE: missing inputs are the generic proposals D-1 (soil springs, bearing elastomer, temperatures, wind, losses); standards entries unverified; HLP400 transcribed-unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging moment M* (kNm) | 15,089 | report table 4-29 (42-S1-05) | 16,354 | 42-S1-05 ULS-B-0156 | +8.4 % |  |
| 42-S1-05 ULS M* (kNm) | 15,089 | report table 4-29 | 16,354 | ULS-B-0156 | +8.4 % |  |
| 42-S1-05 ULS V* (kN) | 1,716 | report table 4-29 | 2,404 | platform: largest |V| along the girder | +40.1 % | report value is the design shear at its critical section; definition not stated |
| 42-S1-05 φMu at mid-span (kNm) | 15,726 | report table 4-29 | 13,484 | t = 0.50, φ = 0.791, kuo 0.087 | -14.3 % | platform Muo (nominal, minimum-strength check) = 16,660 |
| 42-S1-05 φMu, independent hand check (kNm) | 15,726 | report table 4-29 | 13,158 | AS 5100.5 Cl 8.1.8 approximate method, b 2.4 m, haunch 85 mm | -16.3 % | nominal Mu 16,448 kNm, phi 0.80 (tools/phimu_hand_check.py): see model/PHIMU_SLS_NOTE.md |
| 42-S1-05 SLS soffit stress at Ms* (MPa) | 3.15 | report table 4-30 (tension; limit 3.16) | 8.83 | SLS-S-0073, Ms* 7,099 kNm | +180.3 % | platform: uncracked composite stress, tension + |
| Pile SLS N max, abutment A (kN) | 4,686 | 0201 table 1 (design max for the abutment) | 3,175 | A-03 | -32.2 % | 0201 value covers the whole abutment (SB41 + SB42 piles) |
| Pile ULS N max, abutment A (kN) | 6,606 | 0201 table 1 | 4,904 | A-04 | -25.8 % |  |
| Pile SLS N max, abutment B (kN) | 4,177 | 0201 table 1 (design max for the abutment) | 3,404 | B-02 | -18.5 % |  |
| Pile ULS N max, abutment B (kN) | 5,840 | 0201 table 1 | 4,843 | B-02 | -17.1 % |  |
| Pier 1 pile SLS N max (kN) | 5,763 | 0201 table 1 / report | 8,703 | SB42 P1-01 | +51.0 % | span 1 + span 2 + wall: upper bound for traffic; blade wall 22.02 m2 (12.05 x 1.65 + π 0.825², 0406) x (6.99 m (mean top RL 8.444 - pile top 1.452) - 2 x 1.5 m sill already in the two span models) x 25 kN/m3 = 2,197 kN, 732 per pile (ULS x 1.2) |
| Pier 1 pile ULS N max (kN) | 8,562 | 0201 table 1 / report | 12,994 | SB42 P1-01 | +51.8 % | as above |

Whether a difference is acceptable is the engineer's call. Known limits of this run:

- each span is a separate model (ADR-062): the link slab over the pier is not modelled; pier piles are the sum of the two spans' envelopes plus the wall;
- deck widths vary along the spans (0805); the platform takes the widest station on each side (edge girders slightly conservative);
- abutment A is curved (R 154.089); a straight support line through its end bearings is used (middle bearings up to ~80 mm off it, girder lines kept);
- haunch concrete (Calculated from the deck levels, bearing RLs, pads and hogs: 26 - 111 mm) is SDL at ULS 2.0 (owner rule, ADR-054); the report probably treats it as dead load (1.2), which alone is worth about 1,000 kNm of M* on 42-S1-05;
- the raised footpath concrete is in the SDL (Calculated from the 0805 RLs); safety / headlight screens and utilities are not yet (Missing-Flagged);
- wind on the screens in the report's critical combination (PE + HLP400 + 35 m/s wind) uses generic coefficients (D-1);
- shear / torsion is not checked: the aggregate size is not on the drawings (0700 refers to TfNSW B80);
- the report's pier pile moments are governed by rail impact, which the platform does not model (not compared).
