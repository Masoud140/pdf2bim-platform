# B12452 (SB01) — platform vs design report RPT-000001 rev E

Run `sb01run2`; INDICATIVE: missing inputs are the generic proposals D-1 (ADR-058: soil springs, bearing elastomer, temperatures, wind); standards entries unverified; HLP400 transcribed-unverified (AS 5100.7-2004 App A). Report girder / bearing values are the critical element over the three bridges; pile values are SB01 per abutment (0201).

| Item | Report / drawing | Source | Platform | Where (governing row) | Difference |
|---|---|---|---|---|---|
| Girder ULS sagging moment M* (kNm) | 15,924 | report table 4-6 | 14,883 | G01-01 ULS-B-0156 | -6.5 % |
| Girder SLS moment (kNm) | 10,528 | report table 4-4 | 9,745 | G01-01 SLS-S-0073 | -7.4 % |
| Girder ULS shear V* (kN) | 2,157 | report table 4-6 ('equivalent shear', incl. torsion) | 2,195 | G01-01 | +1.8 % |
| Girder ULS capacity φMu at midspan (kNm) | 17,057 | report table 4-6 | 14,296 | G01-02 | -16.2 % |
| Bearing SLS N max (kN) | 2,015 | report table 4-10 | 1,848 | A01-01 | -8.3 % |
| Pile SLS N max, abutment A1 (kN) | 3,491 | drawing 0201 table 1 (report 5-5: 3573 / 3515) | 2,967 | A01-11 | -15.0 % |
| Pile ULS N max, abutment A1 (kN) | 4,210 | drawing 0201 table 1 / report 5-5 | 4,410 | A01-11 | +4.8 % |
| Pile ULS moment, abutment A1 (kNm) | 1,771 | drawing 0201 table 1 | 981 | A01-10 | -44.6 % |
| Pile SLS N max, abutment B1 (kN) | 2,791 | drawing 0201 table 1 (report 5-5: 3573 / 3515) | 3,064 | B01-11 | +9.8 % |
| Pile ULS N max, abutment B1 (kN) | 4,210 | drawing 0201 table 1 / report 5-5 | 4,531 | B01-11 | +7.6 % |
| Pile ULS moment, abutment B1 (kNm) | 1,765 | drawing 0201 table 1 | 989 | B01-11 | -44.0 % |

Colour-free on purpose: whether a difference is acceptable is the engineer's call. Known limits of this run:

- deck widths W2 / W3 vary along the span (0701 / 0703); the platform uses the mid-length values (one carriageway width each side);
- HLP400 centred on each carriageway ±1 m; the report's 'any two marked lanes in each direction' positions are not tried (traffic.py shortcut);
- lanes per carriageway floor(width / 3.2) = 4 + 5 = 9, as the 9 design lanes on drawing 0101;
- median barrier weight from the 0706 detail B outline with two slope-break heights scaled (not dimensioned);
- soil springs are generic placeholders, so pile moments are not benchmarkable until Appendix J is supplied.
