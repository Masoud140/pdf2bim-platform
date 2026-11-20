# SB43 (B12468) — survey (ADR-085 stage 4a, 2026-11-20)

Set: SGWS1-JHSW-2000-BR-DRG-COMBINED (255 sheets, design lot SB-1510) and report SGWS1-JHSW-2000-BR-RPT-410001 rev D.
Page = 0-based index into the combined PDF. The owner's files are not committed.

## 1. What SB43 is

- A **portal-frame roof over New Airport Drive**. 91 precast prestressed planks span about 18.7 m between abutment B and abutment C. They are rotationally fixed into integral headstocks; there are no permanent bearings (report §§ on articulation and maintenance).
- The SB41 EB, SB41 WB and SB42 carriageways (control lines MCR0, MC90, MC80) run **across the top of the planks**. Only part of the deck is trafficked; the rest is "unused deck area" behind safety screens (sheet 0809; report: "the carriageway only utilises part of the planks").
- **Plan topology** (sheets 0605, 0780, 0809):
  - The planks fan radially off control line MCH0.
  - MCH0 runs *along* the abutments, roughly parallel to them, so each plank is square to it at its own chainage.
  - The span direction is therefore **across** the control line, and the support lines B and C are curved (concentric arcs, deck about 80 m along MCH0).
  - The platform's geometry assumes members run *along* a control line between two straight support lines. SB43 cannot be described in the current schema (see § 4).

## 2. Sheets

| Page | Sheet | Content |
|---|---|---|
| 0 | cover | Loads: SM1600, fatigue heavy vehicles SB43 1954 /lane/day, route factor 0.3, HLP 400 note (applicability to SB43 to confirm), wind TC2 48 / 37 m/s. Number of design lanes listed for SB41 EB / WB and SB42 only, **none for SB43**. |
| 111 | 0605 | **Plank supports**: Table 1 (91 planks: chainage on MCH0, bearing, setout levels at B and C, slope). Plank setout detail: 8850 (radial) to the abutment B end, 9850 (radial) to the abutment C end. Packer load per plank end ULS 110 / SLS 90 kN (temporary). |
| 158 | 0780 | PSC plank details A: plank layout plan (91 planks, type F1). Notes: f'c 50 MPa, f'cp 35 MPa; strands 7-wire ordinary Ø12.7, 1870 MPa, relax 2, min breaking force 184 kN; force per strand at midspan just after release 138 kN; hog at transfer 20 mm, at 28 days 30 mm; deflection under the cast-in-place concrete per plank group; density 2550 kg/m³; E at transfer 32,800 MPa; cover 35. |
| 159 | 0781 | PSC plank details B: plank 600 wide × 700 deep, length 18,700. Ø300 void centred 350 above the soffit, stopping 1000 from each end. Top: 50 × 20 recesses at both edges (500 between); broom-roughened top. Section 2: strand grid x = −225 … +225 at 50, rows y = 55 / 105 / 155 / 205. Q3 4-N20 bottom bars; Q1 / Q2 N12 fitments (bundles at 50 … 250, in zones). Strands marked ⊕ are sheathed 2000 mm at each end. Couplers for the deck bars at each plank end. |
| 169 | 0809 | Deck concrete plan with corner coordinates (MGA) and RLs. Section 19: "200 MIN THICK DECK (TYP)", 18 mm fibre-cement permanent formwork between planks, vertical CJs. |
| 171 | 0811 | Setout co-ordinates SB43 (tables 12–14: radial sections MCR0, cross sections MC90 / MC80). |
| 172 | 0812 | Deck concrete sections at abutments B and C: planks cast into the headstocks (CJ); Ø20 stainless dowels to the approach slabs. |
| 182–184 | 0859 / 0860 | Abutment B / C reinforcement; coupler bars DD37 / DD38 (N20) per plank end. |

## 3. Values read (Direct unless stated)

| Item | Value | Source |
|---|---|---|
| Planks | 91, type F1, PL-01 … PL-91 | 0780, 0605 |
| Plank chainage on MCH0 / bearing | PL-01 458.035 / 29.187° … PL-91 379.155 / 4.077°; uniform steps 0.876–0.877 m and 0.279° (self-check) | 0605 Table 1 → `plank_supports.json` (`plank_supports.py`) |
| Plank length | 18,700 = 8850 + 9850 (Calculated check: consistent) | 0781 elevation; 0605 setout detail |
| Section | 600 × 700, Ø300 void at y 350, solid 1000 at each end, top recesses 50 × 20 | 0781 |
| Concrete | f'c 50, f'cp 35, density 2550 kg/m³, E at transfer 32,800 MPa | 0780 notes |
| Strands | Ø12.7, 1870 MPa, relaxation class 2, MBL 184 kN | 0780 notes |
| Strand pattern | Read from section 2: row y 55 at x −225, −175, −25, +25, +175, +225 (6); row y 105 at −225, −175, −125, −75 ⊕, +75 ⊕, +125, +175, +225 (8); row y 155 at −225, −175 ⊕, −125, +125, +175 ⊕, +225 (6); row y 205 at −175, +175 (2) → **22 strands**, 4 sheathed 2000 mm at both ends | 0781 section 2 |
| Bottom bars | Q3 4-N20 at y 55, x −125, −75, +75, +125 | 0781 section 2 |
| Topping | 200 minimum (typical) | 0809 section 19 |
| Supports | integral headstocks at abutments B and C (planks cast in), no bearings | 0812; report |

### Missing / conflicts (Missing – Flagged)

- **Strand count:** the label says "24/Ø12.7mm strands" (×2 on sheet 0781), but the section shows 22 strand positions. Raise as a query; do not resolve by assumption.
- **Jacking ratio:** not given. The notes give the force at midspan after release (138 kN), which is a different quantity. Back-calculating the ratio would need assumed losses, so it is not done.
- **Ages:** age at transfer and age when the deck is cast are not given. Steam curing at 70 °C for 8 h is stated.
- **Slope column:** Table 1's "slope along plank (%)" prints −0.020. The levels give (C − B) / 18.7 = −0.0200, so the column is a ratio (−2.0 %), not −0.020 %. This is a unit-label conflict, recorded only.
- **Number of design lanes for SB43:** not on the cover. The carriageways on top belong to SB41 / SB42.
- **Backfill stiffness:**
  - The report applies PD6694-1 k* behind abutment C (soil stiffness × 1.5 for densification, more onerous of ka / k0 / k*).
  - It gives no numbers; the geotechnical report (Appendix J) is not in the set.
  - The values are needed for `supports[].abutment_spring`. **Owner input.**
- **Pile springs:** in the geotechnical report as well (same as the other bridges).
- **Interface shear capacity clause:** owner input (ADR-085 stage 3b).

### Benchmarks (report RPT-410001 rev D, tables 4-34 / 4-35)

| Planks | Design action | Capacity | Utilisation (case) |
|---|---|---|---|
| ULS moment (kNm) | 2,285 | 2,630 | 87 % (PE+LL) |
| SLS steel stress increment (MPa) | 89 | 160 | 56 % (PE+LL) |
| Longitudinal shear (kPa) | 1,933 | 2,024 | 96 % (PE+LL) |
| Shear (kN) | 478 | 1,268 | 38 % (PE+LL) |
| Torsion (kNm) | 103 | 2,129 | 5 % (PE+LL) |

Deck slab (table 4-35): ULS M 39.1 / 101 kNm, SLS M 22 / 64 kNm, shear 102 / 276 kN, punching 202 / 417 kN (W80).

## 4. What the platform needs before SB43 can run

1. **Radial-member geometry (stage 4b):**
   - Members are given by their own setout (chainage on the control line, bearing, distances to each end, end levels), as Table 1 does, instead of offsets between two straight support lines.
   - Support lines become the polylines through the member ends. The substructure sill, deck-end lines and thermal / traffic placement then follow those polylines.
   - Proposed as ADR-086 (provisional default: polyline supports, one sill segment per plank).
2. **Live load on a deck whose traffic runs across the members:** the SB41 / SB42 carriageways on top. Lanes come from those bridges' descriptions, placed on the SB43 deck by their control lines.
3. **Owner inputs:** k* backfill stiffness and pile springs (geotechnical report); the strand-count query; the jacking ratio and ages (or acceptance as Missing, which runs SB43 as reinforced planks only).
