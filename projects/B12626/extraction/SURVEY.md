# B12626 — drawing-set survey (P6 stage 1, 2026-10-28)

Source: `Second_Example.pdf` supplied by the owner 2026-10-28 (72 pp, A1, Bluebeam), sha256
`a03329fceee928d9ef160d55e00797d1d58c16b2dc96b6f1843cd4ddce6fd6b8`. Not committed (client drawings).
Bridge B12626 — M1 Pacific Motorway extension to Raymond Terrace, bridge over Botanic Gardens Road, 157.1 km north of
Sydney. Drawing set DS2023/000442, status Issue for Construction, rev 00 (13.02.24). Client Transport for NSW; designer
JBJV (Jacobs BG&E JV) for John Holland Gamuda JV. Datum MGA zone 56 (GDA94), AHD71. Text layer present on every sheet.

## Sheet map (PDF page -> drawing)
| Pages | Drawings | Use |
|---|---|---|
| 1-2 | 109001 cover, 109005 schedule | project data, design criteria (cover) |
| 3-5 | 109011-109013 general arrangement A-C | span, levels, deck section, alignment tables |
| 6-7 | 109031 pile layout, 109035 pile details | piles |
| 8-14 | 109051-109057 abutment concrete A-G | headstock / sill, bearing pedestals, setouts |
| 15-21 | 109071-109077 abutment reinforcement | (not needed for the model) |
| 22-23 | 109151-109152 bearings | bearing table, types |
| 24-29 | 109201-109206 PSC girder concrete | girder types, lengths, end blocks |
| 30-36 | 109251-109257 PSC girder reinforcement | strands (design inputs) |
| 37-41 | 109301-109305 deck concrete | deck setout table, slab, cross girders |
| 42-44 | 109351-109353 deck reinforcement | |
| 45-46 | 109371-109372 deck joints | |
| 47 | 109391 cover plates | |
| 48-59 | 109401-109434 precast barrier | barrier geometry / weight |
| 60-64 | 109451-109455 traffic barrier railings | |
| 65-67 | 109501-109503 approach slabs | |
| 68-71 | 109651-109654 batter protection | |
| 72 | 109991-109992 bar shapes | |
No dedicated "alignment and skew diagram" sheet: the alignment tables are on GA sheet C (109013); support-line
geometry must come from the deck setout table (109301, p 37-38) and the abutment setouts.

## Global data found so far (GA A-C, visual + text layer)
- Single span, deck 28 000 along control line MC10, deck ends CH 9215.900 / 9243.900; design surface RL 9.493 / 9.347.
- 10 No 1215 deep PSC Super-T girders; laminated elastomeric bearings; cast-in-place cross girders.
- Deck 22 620 overall between outer barrier faces (2 x 11 010 carriageways + 600 median), 805 outside each;
  3 % fall both ways from the median; 200 min deck slab; 80 wearing surface; MC10 (northbound) and MC20 (southbound)
  control lines either side of the median barrier.
- Barriers: medium performance level (precast parapet + twin rails) outside, regular performance level median barrier 920 high.
- Abutments: 5 No Ø900 driven steel tube piles with concrete infill each; toe RL -22.500; abutment lengths 26 315 (A) / 26 312 (B) — skewed supports.
- Vertical (MC10): IP CH 9168.188 RL 11.830, +1.80 % / -1.90 %, VC 481.000 (TP 8927.688 RL 7.501, TP 9408.688 RL 7.260).
  Check: deck-end RLs 9.494 / 9.347 vs printed 9.493 / 9.347.
- Horizontal (MC10): circular curve R 2000 (no spirals), HTP1 CH 8755.973 (379464.666, 6369564.949), HCEN (381295.127, 6368759.087), HTP2 CH 9477.324.

## Conflicts in the printed alignment table (109013) — Missing-Flagged, owner to confirm
| Printed | Problem | Self-consistent value (Calculated) | Derivation |
|---|---|---|---|
| HTP2 N 6360159.080 | 8 717.8 m from HCEN, radius is 2 000 | 6370159.080 | |HTP2-HCEN| = 2000.000 with the corrected northing |
| bearing in 25°45'42" | arc from chainages (721.351) needs a 20°39'55" deflection | 23°45'42" (23°45'41.5" computed) | radial HCEN->HTP1 + 90°; also gives 37°20'19" at mid-bridge vs printed 37°20'14" |
With the corrected values: R = 2000.000 at both ends, arc = 721.351 m = chainage difference exactly, bearing out 44°25'36" = printed.

## Next (P6 stage 2)
Extract into the interchange sheet (P5.3 format): deck setout table (109301), girder types / lengths / end blocks (109201-206),
bearings table (109151), abutment / pile setouts (109031, 109051-), barrier data (109401-), cover-sheet design criteria.
Then build `projects/B12626/B12626.bridge.0.2.json` with a generic new-description tool and run the platform chain unchanged.
