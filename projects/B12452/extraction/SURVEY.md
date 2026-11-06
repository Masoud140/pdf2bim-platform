# B12452 (SB01) — survey (P8 stage 4, 2026-11-05)

This is the same owner drawing set and report as SB02 (`projects/B12453/extraction/SURVEY.md`). SB01 is the wide bridge of the three. Page numbers are 0-based indices into the combined PDF.

## 1. What the drawings give (read so far)

| Item | Value | Source |
|---|---|---|
| Girders | 14 × 1515 Super-T, G01-01 … G01-14 (F2 edge / F1 / F4 edge) | 0113 section 1, 0600 |
| Girder lengths X1 | 33,441 (01-02…05, 01-08…13); 33,559 (01-06); 33,559 (01-07); edges on 0602 / 0603 (to read) | 0601 table 1 |
| Girder W (cross-girder depth below slab) | 1065 (all SB01 F1) | 0601 table 1 |
| Hog table | transfer 57; 28 d 75 (76 G01-06, 74 G01-14); 60 d 79; 100 d 81 (82 / 79); deck deflection −29 (G01-01…06), −28 (07…13), −27 (14); mass 59.4–62.5 t | 0600 |
| Setout | **straight bridge setout line on control line MC20**, end A (331496.102, 6245421.481) to end B (331471.822, 6245398.356), 33.530 long. Report Table 2-1x: "SB01 is setout as a straight bridge, mid-ordinate 78 mm" (accepted departure DD-3910) | 0703 table 1 / 2, report |
| Alignments | MC20: HTP1 660.529 → HCEN R 1800 → HTP2 821.569; MC30: R 1300 (782.116 … 769.142); vertical MC30 IP 762.288 RL 11.496, +1.27 / −1.31 %; MC20 IP 721.022 RL 11.721, +1.48 / −1.31 % | 0111 |
| Deck widths | W1 13.459 (13.400 square) setout line → median crown; W2 1.206–1.531 (varies along the span); W3 16.548–16.692 (varies) → deck ~31.0–31.3 m wide, **width varies along the span** (breakdown bay) | 0701 / 0703 table 1–2 |
| Cross-section | two carriageways (eastern / western side), median cast-in-place barrier type MCI (0706 detail B), **one-way 3 % fall to the west across the whole deck** (0701 section 1; 0703 RLs: 11.596 → 10.651 over 31.347 m; corrected 2026-11-06, earlier read as crowned), 75 asphalt, 200 min slab, safety screens, drainage pipe ∅225 | 0701 section 1, 0703 |
| Lanes | 9 design lanes (0101); 6 marked lanes | 0101, report table 2-7 |
| HLP400 | ±1 m about the centreline of any two marked lanes in each direction, or of the carriageway, whichever is worse; **0.5 × SM1600 on adjacent unoccupied lanes** | report table 2-7 |
| Bearings | 14 per abutment, RL X A01-01 9.589 … A01-14 8.663; B01-01 9.740 … B01-14 8.839 (**B01-07 and B01-08 both 9.324: query**) | 0500 table 1 |
| Piles | 11 × ∅1050 per abutment; toe A −11.5, B −14.0; top RL A01-01 8.199 … A01-11 7.306, B01-01 8.350 … B01-11 7.476; design actions ULS 4210, SLS 3491 (A) / 2791 (B), M ULS 1771 (A) / 1765 (B) | 0201 table 1 |
| Pile setout | along the pile line from the SOP (0200 dims: 1976 / 4876 / 7776 … 15317, 2317 … 15200; to be resolved per pile) | 0200 |
| Report | girder rating factors G01-01 1.08 … G01-14 1.08 (Table 4-18); abutment RF 1.23 / 1.24 (4-19); pile SLS 3573 / 3515, ULS 4210 (5-5) | report |

## 2. What this already tells us about the report's "critical element" values

- **Piles:** the report's ULS pile moment of 2,053 kNm (Table 4-15) matches SB02 (drawing 0201: 2,049 / 2,031). SB01's pile moment is 1,771 / 1,765 kNm. So the pile benchmark is SB02, which the platform already models. The SB02 pile-moment gap (−52 %) is therefore the soil springs, not scope.
- **Girders:** the edge girders of all three bridges rate 1.08 (Table 4-18), so the report's critical girder could be on any of them. SB01 is still needed to close the girder comparison.

## 3. Platform gaps SB01 exposes (before it can run)

1. **Two carriageways with a median barrier.** The traffic engine has one carriageway, so lanes would be placed across the median. Needed: carriageway rows; lanes and HLP positions per carriageway / direction.
2. **Deck width that varies along the span.** `deck.edge_*` and `carriageway_*` are single values. W2 / W3 vary by about 0.3 m over 33.5 m. Shortcut: the mean width (flagged). Proper fix: edge rows by chainage.
3. **Fanned girders with different lengths** (33,441 / 33,559): each girder's offsets differ at A and B. `line_offset_A/B` already exist, so this needs checking only.
4. **HLP position rule "centreline of any two marked lanes"** needs the marked-lane setout (0113: 3.5 / 3.312–3.381 / 4.0 lanes, breakdown bay 5.837–6.0).
5. **Median cast-in-place barrier (type MCI)** needs its own section for the shape-based weight (0705 / 0707). Safety screens are a line SDL (report Table 2-5).
6. **Two lateral restraint blocks per abutment** (not modelled; same gap as SB02).

## 4. Plan

- Stage 4a: engine support for (1) carriageway rows and per-carriageway lanes / HLP, and (2) edges and carriageway by chainage, or the mean with a flag. ADR first.
- Stage 4b: `values.py` for SB01: setout line, 14 girders (offsets from 0600 / 0601 plan dims), 28 bearings, 22 piles, barriers (PB-1 + median), tables.
- Stage 4c: chain run; compare girder results with report Tables 4-4 / 4-6 and pile results with drawing 0201.

## 5. Stage 4b done (2026-11-06)

- `values.py` + `build.sh`: setout line as the control line (chainage from end A), bearings / piles from the MC20 / MC30 SOP dimensions (0300 / 0301 / 0200), checks in the script: every girder bearing-to-bearing 32.641 + 0.8 = X1 33.441.
- Missing inputs: the generic proposals D-1 (ADR-058), no SB01 dev script.
- Findings: skew 5.433° is printed against MC20; against the straight setout line it is ~4.9° (bearing is used, so no effect). 01-06 / 01-07 X1 33,559 with the same bearing spacing (query). B01-08 RL 9.324 = B01-07 (query). Lanes counted per carriageway 4 + 5 = 9 = the 9 design lanes printed (0101). Median barrier slope-break heights scaled (not dimensioned).
