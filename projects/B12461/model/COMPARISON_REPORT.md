# B12461 (SB42) — platform vs design report RPT-410001 rev D

Runs `runS1b, runS2b` (span 1, span 2; ADR-062). INDICATIVE: missing inputs are the generic proposals D-1 (soil springs, bearing elastomer, temperatures, wind, losses); standards entries unverified; HLP400 transcribed-unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging moment M* (kNm) | 15,089 | report table 4-29 (42-S1-05) | 14,889 | 42-S1-05 ULS-B-0156 | -1.3 % |  |
| 42-S1-05 ULS M* (kNm) | 15,089 | report table 4-29 | 14,889 | ULS-B-0156 | -1.3 % |  |
| 42-S1-05 ULS V* (kN) | 1,716 | report table 4-29 | 2,243 | platform: largest |V| along the girder | +30.7 % | report value is the design shear at its critical section; definition not stated |
| 42-S1-05 φMu at mid-span (kNm) | 15,726 | report table 4-29 | 12,679 | t = 0.50, φ = 0.791, kuo 0.091 | -19.4 % | platform Muo (nominal, minimum-strength check) = 15,677 |
| 42-S1-05 φMu, independent hand check (kNm) | 15,726 | report table 4-29 | 12,439 | AS 5100.5 Cl 8.1.8 approximate method, b 2.4 m, no haunch | -20.9 % | nominal Mu 15,549 kNm, phi 0.80 (tools/phimu_hand_check.py): see model/PHIMU_SLS_NOTE.md |
| 42-S1-05 SLS soffit stress at Ms* (MPa) | 3.15 | report table 4-30 (tension; limit 3.16) | 7.61 | SLS-S-0073, Ms* 6,212 kNm | +141.7 % | platform: uncracked composite stress, tension + |
| Pile SLS N max, abutment A (kN) | 4,686 | 0201 table 1 (design max for the abutment) | 3,056 | A-04 | -34.8 % | 0201 value covers the whole abutment (SB41 + SB42 piles) |
| Pile ULS N max, abutment A (kN) | 6,606 | 0201 table 1 | 4,766 | A-04 | -27.9 % |  |
| Pile SLS N max, abutment B (kN) | 4,177 | 0201 table 1 (design max for the abutment) | 3,321 | B-02 | -20.5 % |  |
| Pile ULS N max, abutment B (kN) | 5,840 | 0201 table 1 | 4,715 | B-02 | -19.3 % |  |
| Pier 1 pile SLS N max (kN) | 5,763 | 0201 table 1 / report | 8,484 | SB42 P1-01 | +47.2 % | span 1 + span 2 + wall: upper bound for traffic; blade wall 22.02 m2 (12.05 x 1.65 + π 0.825², 0406) x (6.99 m (mean top RL 8.444 - pile top 1.452) - 2 x 1.5 m sill already in the two span models) x 25 kN/m3 = 2,197 kN, 732 per pile (ULS x 1.2) |
| Pier 1 pile ULS N max (kN) | 8,562 | 0201 table 1 / report | 12,661 | SB42 P1-01 | +47.9 % | as above |

Whether a difference is acceptable is the engineer's call. Known limits of this run:

- each span is a separate model (ADR-062): the link slab over the pier is not modelled; pier piles are the sum of the two spans' envelopes plus the wall;
- deck widths vary along the spans (0805); the platform takes the widest station on each side (edge girders slightly conservative);
- abutment A is curved (R 154.089); a straight support line through its end bearings is used (middle bearings up to ~80 mm off it, girder lines kept);
- the raised footpath concrete is in the SDL (Calculated from the 0805 RLs); safety / headlight screens and utilities are not yet (Missing-Flagged);
- wind on the screens in the report's critical combination (PE + HLP400 + 35 m/s wind) uses generic coefficients (D-1);
- shear / torsion is not checked: the aggregate size is not on the drawings (0700 refers to TfNSW B80);
- the report's pier pile moments are governed by rail impact, which the platform does not model (not compared).
