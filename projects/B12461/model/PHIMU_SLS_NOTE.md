# Girder strength and SLS stress gaps against the design reports (SB42, SB01)

2026-11-09. Investigation of the two largest girder differences in `COMPARISON_REPORT.md`:
- φMu: −19 % on SB42 and −16 % on SB01.
- SLS soffit stress: 7.6 vs 3.15 MPa on SB42.

## 1. φMu: the platform agrees with an independent hand check

`tools/phimu_hand_check.py` uses AS 5100.5 Cl 8.1.8 (the approximate tendon stress method) with a rectangular stress block in the deck. It reads only the description: strand pattern, girder depth, slab, deck f'c and strand data. It does not use the platform's section engine.

| Bridge (girder) | Report φMu | Platform φMu | Hand check φMu (nominal Mu) | Conditions |
|---|---|---|---|---|
| SB42 (42-S1-05) | 15,726 | 12,679 | 12,190 – 12,439 (15,237 – 15,549) | b 1.9 – 2.4 m, no haunch |
| SB42 (42-S1-05) | | | 13,330 – 13,581 (16,662 – 16,976) | 135 mm haunch: an upper bound, since the deck is at most 335 incl. DWS |
| SB01 | 17,057 | 14,294 | 14,528 (18,160) | 2.2 m, no haunch |
| SB01 | | | 15,550 (19,438) | 100 mm haunch |

- **The platform is within 2–4 % of the hand check.** The section engine is not the cause of the gap.
- **SB42: 40 strands cannot reach the report's capacity if it is factored.**
  - With φ ≤ 0.8 (Table 2.3.2), the report's 15,726 needs a nominal Mu of 19,660 kNm.
  - That needs a tendon lever arm of about 2.0 m, more than the girder plus deck can give.
  - The report value equals the hand-check *nominal* Mu, and the platform Muo (15,677), within 1 %.
- **Query for the designer:** is the "Design Capacity 15,726" in report table 4-29 Mu or φMu?
  - If φ = 0.8 is applied to it, the utilisation becomes 15,089 / 12,600 ≈ 1.2.
  - This is an engineering question for the owner. The platform does not decide it.
- **SB01:**
  - The report value (17,057) lies between the hand-check φMu and nominal Mu.
  - It is reachable with φ = 0.8 only with a haunch of about 250 mm.
  - The haunch is not dimensioned on either set. It is a D-1 placeholder of 0 mm (ADR-054 applies haunch concrete as SDL only).
  - Reading the deck levels against the girder top levels would close part of the gap on both bridges.

## 2. SLS soffit stress: the combination is not the same

- **The platform's governing SLS row (SLS-S-0073) is** DLc 1.0 + SDLp 1.3 + SDLs 1.0 + shrinkage 1.2 + creep 1.0 + M1600 1.0 + braking −1.0 + wind −0.7, with the strand stresses at 130 days.
  - At mid-span of 42-S1-05: Ms 6,212 kNm against the decompression moment Mdec 3,293 kNm.
  - This gives an uncracked soffit stress of 7.6 MPa. The platform's own check (Ms*/Mal) passes at 0.94.
- **The report gives 3.15 MPa against a limit of 3.16** (table 4-30). Neither the combination nor the basis of the limit is stated.
  - 3.16 is not 0.25√f'c (1.94 MPa for 60 MPa).
  - At the platform's prestress, 3.15 MPa corresponds to about 4,500 kNm instead of 6,212.
- **Query for the designer:** what are the SLS combination and the tension limit behind table 4-30?
- **Also affecting the platform value:** the losses are D-1 placeholders, and the factor 1.3 on SDLp is an unverified standards entry.

## 3. What this changes

- Nothing in the platform's flexure engine is changed: it is confirmed by an independent calculation.
- The two report items are recorded as queries for the owner.
- The haunch should be read from the drawings: deck RLs against girder levels and hogs. Done for SB42 (§4) and SB01 (§5).

## 4. Update the same day: haunch from the drawings

- **How the haunch is now calculated.** The haunch per girder is no longer a 0 mm placeholder (values.py `haunch()`). It is Calculated from:
  - the MCR0 design level less 75 DWS, plus the 3 % crossfall (this matches 0805 RL 'A' within 2 mm);
  - bearing top RL 'X' (0601) plus the epoxy pads (0602, in the row of the 30-day hog);
  - the 0701 hog and deck deflection.
- **Results.**
  - Span 1: 26–111 mm. At mid-span: 111 / 96 / 85 / 85 / 97 mm for girders 01–05.
  - Span 2: 30–67 mm.
  - The section type uses the smallest mid-span value: 85 mm for span 1.
- **Re-run on 42-S1-05.**

  | Item | Platform | Report | Difference |
  |---|---|---|---|
  | φMu | 13,484 kNm | 15,726 kNm | −14 % |
  | Nominal Mu | 16,660 kNm | | |
  | Hand check φMu at 85 mm haunch | 13,158 kNm (nominal 16,448) | | within 2.5 % of the platform |
  | ULS M* | 16,354 kNm | 15,089 kNm | +8.4 % |

  - ULS M* rose because ADR-054 applies haunch concrete as SDL with a ULS factor of 2.0.
- **The Mu-or-φMu query stands.** At this haunch the report's 15,726 is still 6 % below the platform's *nominal* Mu, and 17 % above φMu.

## 5. Update 2026-11-10: SB01 haunch from the drawings

- Calculated in `projects/B12452/extraction/values.py haunch()`:
  - deck from the 0703 table 2 RLs;
  - girder top from the 0500 bearing RLs, the 0502 pads and the 0600 hog plus deck deflection.
- Result: 18–38 mm; minimum 18 mm at mid-span (G01-02); section haunch 18 mm.
- Drawing queries:
  - B01-08 RL repeats B01-07, so the neighbour mean is used.
  - The A01-14 pad 43 mm is used as printed.
- Re-run `runSB01h`, girder G01-01 / G01-02:

  | Item | Before (0 mm haunch) | Now | Report | Difference from the report |
  |---|---|---|---|---|
  | M* (kNm) | 14,883 | 15,588 | 15,924 | −2.1 % |
  | SLS M (kNm) | 9,745 | 10,183 | 10,528 | −3.3 % |
  | φMu (kNm) | 14,296 | 14,486 | 17,057 | −15.1 % |
  | V* (kN) | 2,195 | 2,282 | 2,157 | +5.8 % |

- The haunch closes most of the M* gap but cannot explain the φMu gap: about 250 mm would be needed.
- The Mu-or-φMu query (§2) stands for SB01 too.
