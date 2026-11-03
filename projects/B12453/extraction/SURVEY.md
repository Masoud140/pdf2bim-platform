# B12453 (SB02) — survey of the third example (owner, 2026-11-04)

Sydney Gateway Stage 1, "Three bridges on Airport Drive over Main Road No 183" (SB-1520): SB01 B12452, **SB02 B12453**, SB03 B12454.
Designer BG&E for John Holland Seymour Whyte (JHSW). Owner files (not in the repository, confidential):
- Drawings `SGWS1-JHSW-1000-BR-DRG-COMBINED.pdf`: 143 sheets, DS2021/000504, final design documentation (sheet revs B–E, 2022-03-10 latest).
- Design report `SGWS1-JHSW-1000-BR-RPT-000001` rev E (Substantial Detailed Design wording; Strand7 grillage, ASBD beam module).

## 1. Why SB02 first

- Three separate single-span Super-T bridges, 1515 deep girders, 200 min slab, 75 asphalt, abutments on ∅1050 bored piles in a reinforced soil wall (RSW), elastomeric bearings, buffer bearings, lateral restraint blocks. In platform scope.
- SB02: 4 girders, deck 7.8 m, 2 design lanes, 3 piles per abutment, straight control line MCD0 (0111), deck 33.559 m along MCD0. Smallest model; its abutments have the lowest substructure rating factors (1.07 / 1.08, report Table 4-19), so it is a candidate for the report's governing pile / bearing values.
- SB01 (14 girders, 11 piles) and SB03 follow with the same chain once SB02 matches.

## 2. Benchmarks in the report (design actions to compare)

"Most critically loaded" element over the three bridges unless stated; whether SB02 governs is not stated.

| Item | Report value | Table |
|---|---|---|
| Girder SLS moment / strand stress increment | 10,528 kNm / 157.8 MPa (limit 160) | 4-4 |
| Girder transfer stresses | compression 23.3 (limit 24), tension 3.2 (limit 3.2) MPa | 4-5 |
| Girder ULS sagging moment / capacity | 15,924 / 17,057 kNm | 4-6 |
| Girder ULS equivalent shear / capacity | 2,157 / 2,590 kN | 4-6 |
| Deck slab SLS moment sag / hog | 26.1 / 49.4 kNm/m | 4-7 |
| Deck slab ULS sag / hog / shear / punching / cantilever | 40 / 75 kNm/m, 89 kN/m, 200 kN, 780 kNm/m | 4-8 |
| Joint movements | S&C 3.0, thermal ±7.5, braking 25 mm (buffer limited) | 4-9 |
| Bearing AS 070910R | N max 2,015, N min 946 kN, rotation 0.009 rad, displacement 35 mm | 4-10 |
| Headstock strut-and-tie (ULS) | strut 6,250, tie 3,550 kN | 4-12 |
| Pile SLS | M 952 kNm with N 2,358 kN | 4-14 |
| Pile ULS | M 2,053 kNm with N 2,802 kN; V 852 kN | 4-15 |
| **Pile axial per abutment (SB02)** | **SLS 3,281 kN, ULS 3,524 kN (A2 and B2)** | 5-5 |
| Girder rating factors (SB02) | G02-01 1.08, -02 1.09, -03 1.09, -04 1.08 | 4-18 |

## 3. Inputs the report gives (the drawings usually do not)

- Concrete E 34,800 (50 MPa) / 32,800 (40 MPa); basic shrinkage 800e-6; creep 2.4 (50) / 2.8 (40); α 10e-6 (Table 2-1).
- Strand 15.7 mm, A 150, MBL 279 kN, fpb 1860, Ep 195 GPa; jacking ≤ 75 % MBL (Table 2-3).
- Densities: reinforced concrete 25.0, **prestressed beams 26.0**, asphalt 22 kN/m3 (Table 2-4); SDL utilities 1 kN/m, safety screens 1 kN/m (Table 2-5).
- Earth pressure φ 30°, c 0. Traffic SM1600 + HLP400 (SB02: centreline ±1 m, no concurrent SM1600), 2 lanes, design speed 90 km/h.
- Wind A2, TC2, 48 / 37 m/s, 35 m/s with traffic. Earthquake BEDC-4, kp 1.7, Z 0.08, De, µ 1.0 long. / 1.5 trans.
- **Steam-cured girders: age at first loading 7 days for k3 (TMR criteria)** — relevant to H-11.
- Load factors Table 2-9 (SDL permanent 1.3 SLS / 2.0 ULS; HLP400 1.5). Soil springs from Appendix J, halved / doubled as sensitivity, ×3 for earthquake.
- Stratigraphy (Table 5-3) and rock parameters (Table 5-4: SB02 Unit 6 UCS 1.0, Erm 50 MPa; Unit 7 UCS 7.0, Erm 350 MPa).

## 4. Not available / queries

- **Appendix J (geotechnical design report with the lateral soil springs) is a placeholder in this copy** → pile springs remain an assumption (as B12626) unless the owner supplies it.
- Differential settlement: drawing 0101 says 11 mm, report §2.4.4 says 10 mm (drawing governs; query).
- HLP400 axle loads are not printed (standard vehicle) → standards entry, UNVERIFIED, like M1600.

## 5. Platform gaps this bridge exposes

1. HLP400 traffic (not modelled for any bridge yet; B12626 also has it on its cover sheet).
2. Buffer bearings (30 mm gap) and lateral restraint blocks: the platform uses elastomeric bearings only.
3. Soil-spring sensitivity (½× / 2×, ×3 earthquake) as separate runs.
4. Earthquake µ = 1.5 transverse (platform: one Rf).
5. Design checks not yet in the platform: deck slab, strut-and-tie headstock, piles, bearings, transfer / transport stresses.

## 6. Sheets for SB02 (page in the combined PDF → drawing)

0101 / 0102 cover (p1–2), 0105 list (p3), 0110–0115 GA (p4–9; SB02 elevation and MCD0 alignment on 0111, p5), 0200–0201 piles (p11–12),
0250 pile details (p13), 0300–0315 abutment concrete (p14–29), 0500–0503 bearings (p53–56), 0600–0608 girder concrete (p57–65),
0650–0655 girder reinforcement (p66–71), 0700–0707 deck concrete (p72–79), 0750–0757 deck reinforcement (p80–87), 0900– barriers.
