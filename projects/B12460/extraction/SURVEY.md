# SB41 EB (B12460), SB41 WB (B12459), SB43 (B12468) — survey (stage 1, 2026-11-17)

Same set as SB42: SGWS1-JHSW-2000-BR-DRG-COMBINED (255 sheets, design lot SB-1510) and report SGWS1-JHSW-2000-BR-RPT-410001 rev D. Page numbers are 0-based indices into the combined PDF. Sheet titles were read from every title block (OCR, checked by eye where used). The owner's files are not committed.

## 1. Scope verdicts (what the platform can verify)

| Bridge | Structure (drawings / report) | Verdict |
|---|---|---|
| **SB41 EB (B12460)** | Four Super-T spans on MC80 (41A-S1 … S4, 4 girders each: F13–F21), then span 5 over the new Airport Drive. Report: deck continuity only on SB41 WB, so EB spans are simply supported; skew above 35° at abutment B (report §2). | **In scope, next.** One description per span (ADR-062), as SB42. Expect a skew flag (BTD 2011/06: above 35° needs approval; the report treats skew by AASHTO / NZTA / EC8). |
| SB41 WB (B12459) | Two spans of nine girders (41B-S1 / S2, F7–F12), **made continuous over the pier with post-installed stress bars** (report: hogging M* 14,521 kNm vs φMu 14,698 kNm, table 4-27). Skew above 35° at abutment B. | **Partly in scope.** The platform has no girder continuity (Tier 4 "continuous spans"). A simply supported run overstates sagging and gives no hogging moment; the comparison would only be indicative. Do after SB41 EB, labelled as such. |
| SB43 (B12468) | **Precast plank deck with integral abutments** (report figs 4-13 … 4-15, tables 4-34 / 4-35; sheets 0111 plank supports, 0780 / 0781 PSC plank details). | **Out of scope.** The platform models Super-T girders only (planks are Tier 4). No run; record only. |

## 2. SB41 EB: values read so far

| Item | Value | Source |
|---|---|---|
| Spans along MC80 | 15,978 / 24,021 / 25,750 / 12,138 (spans 1–4); overall deck 77,887 along MC80; span 5 32,632 measured perpendicular to MCH0 (over the new Airport Drive) | 0110 elevation (p4) |
| Supports | abutment A, EB piers 1 (blade wall + deflection wall), 2, 3 (Ø1200 column), abutment B; Ø900 piles at A, Ø1200 at the piers and B | 0110 elevation (p4) |
| Design surface level on MC80 at the supports | 10.636 (A), 10.524 (P1), 10.355 (P2), 10.173 (P3), 10.088 (B); 0.7 % fall towards B | 0110 elevation (p4) |
| Control line MC80 | HTP5 CH 425.000 (330962.591, 6244980.901) → arc R 656.300, centre HCEN-3 (330607.970, 6245533.144) → HTP6 CH 502.691 (330894.889, 6244942.884) → tangent → HTP7 CH 610.906 (330797.563, 6244895.575) → arc R 683.700, centre HCEN-4 (331096.461, 6244280.672) → HTP8 CH 1077.682 (330476.612, 6244569.174) | 0117 table (p11) |
| Check | HTP6–HTP7 distance 108.215 = chainage difference 108.215 (Calculated). **The table prints the tangent bearing as 64°04'34"; the direction of increasing chainage is 244°04'34"** (Calculated from the coordinates). Treat the printed value as the back bearing; flag. | 0117 (p11) |
| Girders | S1: 41A-S1-01 F14, 02 F13a, 03 F13b, 04 F15; S2: 41A-S2-01 F17a, 02 F16a, 03 F16b, 04 F18a; S3: 41A-S3-01 F17b, 02 F16c, 03 F16d, 04 F18b; S4: 41A-S4-01 F20, 02 F19a, 03 F19b, 04 F21 | 0700 girder layout plan (p114) |
| Girder concrete | F13–F21: f'c 50 MPa, transfer 35 MPa; Ec at transfer 31,100 MPa (hog assumptions); density 2550 kg/m³ | 0700 notes (p114) |
| Strands | 15.7 mm, 1860 MPa, Relax 2, MBL 279 kN, 209 kN per strand after release (set-wide note) | 0700 notes (p114) |
| Design lanes | 2 (SM1600); HLP400 within ±1.0 m of the carriageway centreline | report §2 |

## 3. Report benchmark (SB41 EB)

| Element | Action | Report value | Source |
|---|---|---|---|
| Girder 41A-S3-04 (F18b, edge, span 3) | ULS M* sagging | 9,023 kNm (φMu 13,725, 66 %) | table 4-31 |
| | ULS V* | 2,005 kN (φVu 2,035, **98 %**) | table 4-31 |
| | SLS / transfer tension | 1.99 MPa (limit 3.16) | table 4-32 |
| | compression | 19.98 MPa (limit 24) | table 4-32 |
| Critical combination | PE + HLP400 (with DLA) + wind 35 m/s on the screen / barrier | | report |
| Piers | EB P3 headstock / column / pile cap / piles; EB P1 piles; EB P2 = WB P1 piles | tables 4-6, 4-12, 4-16, 4-19, 4-21, 4-22 |

Note: the limits 3.16 and 24 MPa are 0.5 √f'cp and 0.6 f'cp **for f'cp 40**, though F13–F21 have f'cp 35 per 0700 (0.5 √35 = 2.96, 0.6 × 35 = 21.0). Query: which f'cp the report's table 4-32 uses for 41A-S3-04.

## 4. Still to read (SB41 EB)

- Bearing setout tables for A and B (0300–0307, p19–26) and pier dimensions (0400–0407, p45–52); bearings 0600–0605 (p106–111), table 1 levels.
- Girder sheets for F13–F21 (0700–0724, p114–138): lengths, end skews, strand patterns and debonding, hog table (0701).
- Deck: typical section (0112–0115, p6–9), deck concrete / levels (0800–0812, p160–172), barriers (1000–1009), screens (1150–1160).
- Piles (0200–0252, p13–18).
- Vertical alignment of MC80 (only levels at supports read so far); MC80 chainages of the support lines (plan on 0110 / 0117).

## 4a. Read in stage 2 (2026-11-17), now in `values.py`

- MC80 vertical: one grade (-0.7036 %) through the 0110 design levels at the deck ends; 0803 RL 'A' + 75 agrees within 0.5 mm from CH 458 to 543.
- Bearings: abutment A = 0301 table 2 **B1-B4** (not B10-B13: those are SB41 WB; found by stationing every bearing on MC80); piers from the 0401 / 0403 / 0404 headstock dimensions; abutment B = 0303 table 3 B34-B37. Girder chords + (X1 - chord) reproduce every printed X1, and chord directions match the bearing angles 'a' (240.776° span 1, 244.07° span 4).
- Deck: carriageway -1.000 / +8.000 radial, 400 barriers (0802 section 5); one-way 3 % fall to the north; 200 slab, 75 surfacing, 1515 Super-T (0113).
- Girders, hogs (0701), pads (0602 table 2), strands (0724: S1 / S4 30 strands, S2 / S3 38), fitments (0759, 0761, 0763), piles (0201), pier sills (0400 / 0404), materials (0700, report table 2-1).
- Queries added: SB41 EB barrier section; abutment B CL for the EB part; pier 3 pile-cap width.

## 5. Plan

1. Stage 2: `projects/B12460/extraction/values.py` → four span descriptions `projects/B12460-S1 … S4` (ADR-062 pattern), with the MC80 bearing flag. **Done 2026-11-17.**
2. Stage 3: run the chain per span; `projects/B12460/model/COMPARISON_REPORT.md` against tables 4-31 / 4-32 and the pier pile tables.
3. Then SB41 WB as an indicative, simply supported comparison (continuity not modelled). **Done 2026-11-18**: `projects/B12459/`.
