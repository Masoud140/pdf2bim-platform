# B12460 (SB41 EB) — platform vs design report RPT-410001 rev D

Runs `E1, E2, E3, E4` (spans 1-4; ADR-062). INDICATIVE: missing inputs are the generic proposals D-1 (soil springs, bearing elastomer, temperatures, wind, losses); standards entries unverified; HLP400 transcribed-unverified.

| Item | Report / drawing | Source | Platform | Where | Difference | Note |
|---|---|---|---|---|---|---|
| Girder ULS sagging moment M*, largest of the bridge (kNm) | 9,023 | report table 4-31 (41A-S3-04) | 10,304 | 41A-S3-04 ULS-B-0156 | +14.2 % |  |
| 41A-S3-04 ULS M* (kNm) | 9,023 | report table 4-31 | 10,304 | ULS-B-0156 | +14.2 % |  |
| 41A-S3-04 ULS V* (kN) | 2,005 | report table 4-31 | 2,041 | platform: largest |V| along the girder | +1.8 % | report value is the design shear at its critical section; definition not stated |
| 41A-S3-04 φMu at mid-span (kNm) | 13,725 | report table 4-31 | 11,852 | t = 0.50, φ = 0.800, kuo 0.090 | -13.6 % | platform Muo (nominal) = 14,877 |
| 41A-S3-04 SLS soffit stress at Ms* (MPa) | 1.99 | report table 4-32 (tension; limit 3.16) | 0.13 | SLS-S-0373, Ms* 4,508 kNm | -93.4 % | platform: uncracked composite stress, tension +; the report table may be at transfer (see the transfer row) |
| 41A-S3-04 transfer compression (MPa) | 19.98 | report table 4-32 (compression; limit 24) | 22.46 | x = 8.44 m, limit 20.9 | +12.4 % | platform: girder alone at transfer, f'cp 35 (0700); the report's limit 24 = 0.6 x 40 (query) |
| Pile SLS N max, abutment A (kN) | 3,702 | 0201 table 1 | 2,543 | A-12 | -31.3 % | 0201 value for A-09 .. A-13 |
| Pile ULS N max, abutment A (kN) | 4,931 | 0201 table 1 | 3,523 | A-12 | -28.6 % |  |
| Pile SLS N max, abutment B (kN) | 5,189 | 0201 table 1 | 3,558 | B-10 | -31.4 % | 0201 value for B-05 .. B-10 |
| Pile ULS N max, abutment B (kN) | 7,840 | 0201 table 1 | 5,269 | B-10 | -32.8 % |  |
| Pier 1 pile SLS N max (kN) | 3,641 | 0201 table 1 | 5,381 | P1-01 | +47.8 % | both spans' envelopes added; wall / columns above the sill not included |
| Pier 1 pile ULS N max (kN) | 5,322 | 0201 table 1 | 8,027 | P1-01 | +50.8 % | as above |
| Pier 2 pile SLS N max (kN) | 6,223 | 0201 table 1 | 10,524 | P2-06 | +69.1 % | both spans' envelopes added; wall / columns above the sill not included; P2 shared with SB41 WB (its share not included) |
| Pier 2 pile ULS N max (kN) | 9,078 | 0201 table 1 | 16,311 | P2-06 | +79.7 % | as above |
| Pier 3 pile SLS N max (kN) | 3,668 | 0201 table 1 | 6,034 | P3-02 | +64.5 % | both spans' envelopes added; wall / columns above the sill not included |
| Pier 3 pile ULS N max (kN) | 5,188 | 0201 table 1 | 8,479 | P3-02 | +63.4 % | as above |

Whether a difference is acceptable is the engineer's call. Known limits of this run:

- each span is a separate model (ADR-062): the deck joints over the piers are not modelled; pier piles add the two spans' envelopes, without the wall / column weight;
- skew above 35° at abutment B (report §2; BTD 2011/06 needs approval above 35°): the grillage is used as for any other skew;
- span 4: the printed abutment B bearing levels (0601 table 1: 8.159 .. 7.649) put the girder tops 50 - 290 mm below the deck soffit at the skewed B end (haunch Calculated up to 286 mm on 41A-S4-04, carried as SDL): query whether a thickened deck or pedestal applies there;
- the barrier section is the 1006 section 1 polygon read for SB42 (same PB family; the SB41 EB units not re-read: query);
- abutment B headstock taken centred on the bearing line (its CL for the EB part not read: query);
- safety / headlight screens and utilities are not in the SDL (Missing-Flagged); wind on screens uses generic coefficients (D-1);
- shear / torsion is not checked: the aggregate size is not on the drawings (0700 refers to TfNSW B80) — the report's governing check for 41A-S3-04 is shear (98 %);
- the report's pier pile moments are governed by rail impact, which the platform does not model (not compared).
