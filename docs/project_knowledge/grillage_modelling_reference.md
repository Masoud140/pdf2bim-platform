# Grillage Modelling of Bridge Decks — Condensed Reference
Source: Aurecon Bangkok, G. Belton, Apr 2019 (DRAFT, 45 pp). Based mainly on Hambly "Bridge Deck Behaviour". Codes cited: AS 5100.5, AASHTO 4.6.2.6, Eurocode.
Figures: `figures/<name>.png` (cropped from PDF). View one only when needed; index at the end. (Repository copy, 2026-11-17: the figures are Project files only, not in the repository.)
Notation: AX=area, AZ=vertical shear area, IX=main bending (about horiz. axis), IY=bending about vertical axis, IZ=torsion constant. (Differs from some programs.) E/G = elastic/shear modulus ratio.

## 1–3. Scope and principles
- Purpose: distribute loads to each longitudinal and transverse member. Best for beam-and-slab, slab, box decks.
- 2-D grillage: all members in one plane at the deck centroid. Vertical loads ONLY. In-plane deck results (moments about vertical axis, axial) are NOT usable.
- Longitudinal members = main beams/webs. Transverse members = slab. Add "nominal/dummy" members at edges/parapets/web positions.
- Substructure (piers, abutments, bearings) is normally 3-D; connect deck-centroid grillage to bearings/columns by stiff members. In-plane loads (wind, braking, centrifugal, thermal) are applied in the 3-D model; results valid for substructure and bearing reactions only.
- Local wheel-load slab analysis is out of scope (see separate report "GLOBAL and LOCAL Bending Moments in DECK SLABS").

## 2. Deck types covered
Solid slab; voided slab; precast I/T/inverted-T + insitu slab; steel I + insitu slab; small box beams + insitu slab; Super-Tee + insitu slab; insitu multi-cell box; single box; multi-cell box. (fig: p04_bridge_types_1, p05_bridge_types_2)

## 4. Mesh layout
- Rectangular (no skew): ≥9 transverse members, odd number (gives mid-span output). Aspect ratio (long. spacing : transv. spacing) ≲1.5. More members is fine but slower. Closer spacing near supports of continuous decks. Model diaphragms, bearings, substructure. (fig: p07_grillage_rectangular)
- Skew ≲25°: transverse members parallel to abutments; slightly conservative (over-estimates moments/deflections). (fig: p08_skew_lt25deg)
- Larger skew: transverse members perpendicular to beams where possible (narrow bridges); wide bridges: not practical, keep them parallel to supports. (fig: p08_skew_large_narrow, p08_skew_large_wide)
- Skew: transverse member width = ORTHOGONAL spacing (perpendicular to member).
- Simple beam/slab: main long. member at web centroid; transverse length = beam spacing, properties from slab thickness.
- Box beams: ideally each web its own long. member. Transverse members are (a) deck slab between boxes/cantilevers (slab properties) and (b) one member representing top+bottom flanges between webs (see §7). (fig: p09_box_beam_web_members)
- Small boxes (Super-Tee etc.): one "main" member at box centroid carrying ALL bending stiffness; "nominal" members (tiny stiffness) at web positions joined by rigid links; link ends at nominal members released for moment. Transverse members = top slab across full width. Results read directly from main member. Some programs merge nodes: then model 3-D with main member slightly lower. AUTODESK SBD reportedly cannot generate live loads with this model. (fig: p09_box_beam_nominal_rigid_links, p10_grillage_plan_main_nominal)
- Do NOT model small box as single member with slab spanning girder centres: transverse stiffness under-estimated (length too long) → load distribution to girders and global slab moments under-estimated.

## 5. Supports
- Model bearings to match articulation: free / guided (correct direction) / fixed; shear keys in correct direction.
- Elastomeric bearings: vertical AND lateral stiffness as springs (affects load distribution).
- Monolithic pier/column: stiff element from soffit to deck centroid.
- 3-D model: in-plane results valid for substructure/bearings only.

## 6. Where to put grillage members (fig refs)
- Solid slab: member width 1.0–1.75× slab depth; edge member sized so grillage line ≈0.3d from outer edge. Voided slab: same rules, members along void webs. (fig: p12_slab_voided_slab, p19_solid_slab_section, p19_voided_slab_section)
- Composite beam+slab: long. member at beam centroid; optional nominal members at cantilever ends. Transverse = insitu slab + cantilevers. (fig: p12_composite_beam_slab, p20_concrete_beam_section, p21_steel_beam_section)
- Composite box "pseudo-slab" / Super-Tee: main member at box centroid, rigid links to nominal web members. Transverse = top slab (bottom slab ignored, ok for small boxes). (fig: p13_boxbeam_supertee, p22_composite_box_pseudo_slab, p23_supertee_section)
- Multicell box: main members at each web centroid; nominal members at cantilever tips; one transverse member for top+bottom slab with adjusted properties; cantilevers/stitch as simple slabs. (fig: p13_multicell, p24_multicell_section)
- Single box: one main member per box at total-box centroid in the layout figure (section-property table in §7 instead splits box properties half to each web member). Transverse top+bottom slab adjusted; cantilevers simple slabs. (fig: p14_single_box, p25_single_box_section)

## 7. Section properties
### General
- Torsion: for slab and beam-slab decks use torsion of each individual member (avoid over-estimating). For boxes (torsionally stiff) divide TOTAL torsion among long. members.
- Box deformation = longitudinal bending (IX total box) + transverse bending (IX of top+bottom slab acting together) + torsional rotation (IZ total box) + distortion (independent flexure of slabs, frame action). Single transverse member must mimic distortion via equivalent shear area. (fig: p16_box_deformation_modes, p16_single_multi_box)
- Variable-thickness slabs: model actual variable depth or an equivalent single-depth member of same stiffness; get weight and stiffness right. (fig: p17_variable_thickness_section)
- Effective flange width (shear lag) must be used for I/T/box properties (Annex A).
- Torsion stiffness rule: uncracked (full) at SLS; cracked at ULS (AS 5100.5 cl 7.2.5(c): ≤20% of uncracked when checking flexure; other codes silent). Reason: over-estimating beam torsion stiffness reduces load transfer to the slab, so slab may be under-designed. Under AS 5100 all torsion beyond concrete strength is carried by reinforcement; Eurocode: cracked members normally not designed to resist torsion. If torsion results are high, recheck model; torsion is not normally critical except large boxes.

### Solid slab (each member, width b, depth d)
AX = AZ = b·d; IX = b·d³/12; IY = d·b³/12; IZ = b·d³/6 (this is 50% of full value, deliberate). Edge members include cantilevers, exclude parapets. Long. and trans. bending stiffness taken as equal.

### Voided slab
- Long. members: AX, IX, IY from actual "I" or "C" section; AZ = slab depth × web thickness; IZ per Annex B.
- Trans. members: AX, IX, IY from top+bottom slabs about common axis; AZ = (dt+db) × spacing; IZ = 2(ht+hb)²·dt·db/(dt+db) per unit width. (ht, hb = slab centroid distances from overall centroid; dt, db = slab depths.) Large voids behave like multicell.

### Composite beam+slab (concrete or steel beams)
- Main member: all beam properties in one member. Precast/steel beam alone (self weight, prestress, insitu slab stage); composite section (precast+insitu, transformed by modular ratio to precast/steel E) for all other loads. AZ = beam depth × min web thickness. E = precast concrete (or steel).
- Nominal members (only at parapets/cantilever tips): small rectangular section, width & depth = actual slab depth, E insitu. Turn OFF automatic self-weight on them. Exclude parapet stiffness.
- Transverse: AX, IX, IY, IZ of insitu slab (width = grillage spacing); AZ = AX; diaphragms as actual section + adjacent slab width; E insitu.

### Composite box pseudo-slab and Super-Tee
- Main member as above; AZ = beam depth × combined thickness of 2 webs; E precast.
- Nominal members as above.
- Transverse: insitu slab only (no bottom-slab reinforcement/prestress); if bottom flange has transverse reinforcement/prestress use combined top+bottom slab. AZ = AX. Diaphragms actual section. E insitu.

### Multicellular box (properties distributed to each web member)
- Long.: AX, IX, IY from "I" or "C" beam between slab centre points, transformed to total-section centroid; AZ = depth × min web thickness for each member; IZ from overall box, distributed by width; E concrete.
- Nominal members at cantilever tips: as above.
- Trans. (top+bottom slab acting together, no cell distortion in IX): 
  - IX = (ht+hb)²·dt·db/(dt+db) per unit length
  - IY = (dt·s³ + db·s³)/12, s = transverse member spacing (approximation, not critical)
  - IZ = 2(ht+hb)²·dt·db/(dt+db) per unit cell width
  - AZ (equivalent shear area, distortion) = [(dt³+db³)/L²] × [dw³·L / (dw³·L + (dt³+db³)(ht+hb))] × E/G, L = web spacing, dw = web thickness
- Diaphragms: actual section with adjacent top+bottom slab. Cantilevers: simple slabs.

### Single box
- Long.: half of total box AX, IX, IY, IZ to each web member (torsionally stiff total box); AZ = box depth × each web thickness; E concrete.
- Trans.: same IX, IY, IZ as multicell. AZ same form but with factor 2: [(dt³+db³)/L²] × [dw³·L / (dw³·L + 2(dt³+db³)(ht+hb))] × E/G.
- **SOURCE INCONSISTENCY:** p.17 gives the "2" for MULTI-cell and none for single-cell; pp.24–25 give it for SINGLE-box (noted as "different to multicellular") and none for multicell. Verify against Hambly ch. 6 before use.
- Alternative for AZ: frame analysis of top slab, bottom slab, webs; restrain all but one node for rotation/vertical; shear stiffness = applied vertical load / deflection.
- (fig: p17_transverse_bending_distortion, p24_cog_slabs_diagram)

## 8. Loads
- Apply UNFACTORED, each major load as a separate case; factor and combine afterwards (helps self-checks).
- Self weight: beam weight lumped at centroid usually includes slab → correct long. results, but NO local slab bending; compute local slab moment separately and add to global. Watch omitted or double-applied loads, and what the program auto-assigns.
- Other dead loads (asphalt, medians, footways, barriers): apply directly to transverse slab members (or nominal edge members for parapets) to get valid transverse results. Point loads on nodes or UDL on long. members give only global effect; add local separately.
- Highway live loads: know how the program applies wheel/axle loads: (a) to 4 adjacent nodes, (b) to long. members, (c) to transverse members, or mix. Fine for long. beam design, but local transverse moment/shear may be wrong: (a) none/incorrect, (b) none, (c) load goes to a "beam" so moment depends on member span/width whereas real slab moment is span independent. Global moments are always present. For (a)/(b) add local separately; (c) cannot be reliably combined.
- Lanes: code lanes may not give worst case (esp. widely spaced beams). Check whether loads are generated strictly inside lanes or straddling; strict-lane generation can miss local transverse effects.
- Rail: loads through rails/sleepers (≈500–600 mm) and ballast; same local-moment-vs-member-width issue.
- Prestress: direct cable input or P and M=P·e at nodes. Check secondary effects by hand. Beware variable centroid (Annex C).
- Time-dependent: prestress loss, creep, shrinkage; model correct ages: transfer/release, lifting of precast or falsework release, insitu pours, end of creep/shrinkage (~25–30 yr).
- Thermal: uniform expansion/contraction and vertical differential temperature (programs usually generate from code).
- Transverse/in-plane loads (wind, braking, traction, centrifugal): 2-D deck moments not valid; bearing reactions valid. Apply as in-plane patch loads in the correct loaded lane (outer-lane braking creates plan rotation affecting long. and transv. bearing reactions).

## 9. Self-check list
Materials match design criteria (programs use defaults: density, E, creep, shrinkage) · section properties vs hand/spreadsheet · loads per criteria · total reactions vs simple estimate · line-beam M and V vs grillage for each case (live: estimate lane share per beam plus transverse distribution) · load factors and dynamic allowance · BMD shape (end releases, e.g. zero moment if simply supported) · deflected shape sensible · prestress losses vs hand check. Write a calc note (hand vs computer) and a formal check list.

## 10. Interpreting output
- Long. results valid and directly usable. At each node of a long. member there is a "step" in bending moment (from torsion of transverse members transferring load); using the average is permissible. Likewise a step in torsion moment from transverse bending.
- Transverse member results need care: know how loads were applied. Do a separate local transverse frame analysis for UDLs not applied directly to transverse members and add to global results. Do not apply a load in both global and local analyses (over-estimates).

## 11. Transverse design
- Global wheel-load results on transverse members are NOT valid (wheel load on a beam element gives a width-independent moment; per-metre design moment = M ÷ member width, so it depends on mesh spacing).
- Example: 100 kN point load at centre of 3.0 m span, M = PL/8 = 37.5 kNm. Divided by member width: 1.0 m → 37.5; 2.0 m → 18.8; 3.0 m → 12.5 kNm/m, whereas plate analysis gives ≈24 kNm/m.
- Procedure: (1) extract and design main long. members; (2) design diaphragms; (3) local transverse frame analysis for uniform dead/live not directly applied in grillage; (4) local slab analysis for wheel loads (plate/grillage or Pucher/Westergaard charts); (5) combine global grillage results with local results for transverse slab members.

## 12. Substructure and foundations (3-D model)
- Initial design: fixed base OK; update to actual foundation once loads known.
- Deck and base modelled at their own centroids; pier/wall portions inside deck/base modelled as stiff.
- Piled foundation: spring per pile; foundation grillage members pass through each pile, extra members at piers and where piles are widely spaced; member width 1.0–1.5× depth. Member properties as solid slab (AX=AZ=b·d, IX=b·d³/12, IY=d·b³/12, IZ=b·d³/6 = 50% of full). If pile springs unknown: vertically fixed, moment-released pile supports, give preliminary pile loads to geotechnical engineer. Lateral springs where lateral stiffness matters (from geotech). (fig: p32_piled_foundation_3d, p32_footing_member_sketch)
- Sensitivity: always run 50% and 200% of base soil/pile stiffness.
- Spread footing: much finer grillage; spring at every grillage intersection; width 1.0–1.5× depth; preferred: equal-width strips B ≈ slab depth D, member at centre of each strip, edge members at B/2 from footing edge. (fig: p34_spread_foundation_3d, p34_footing_member_sketch)
- Example (wall on 5 m footing, P=100 kN/m, M=50 kNm/m) showing mesh sensitivity (fig: p35_footing_results):

| Model | Moment kNm/m | Shear kN/m | Ground pressure kN/m² |
|---|---|---|---|
| 3 members | 108 | 43 | 34 |
| 5 members (layout A) | 100 | 52 | 45 |
| 5 members (layout B) | 85 | 55 | 33 |
| Theoretical | 88 | 65 | 32 |

- Ground pressure under spread footing: extrapolate from outer member centroid to footing edge.
- Spring values from geotech: check it is stiffness (MN/m), not modulus of subgrade reaction (MN/m³). Spring stiffness = modulus / (pile diameter × node spacing) [as given in source].

## 13. Design check list
- Long. beams: prestress top/bottom fibre stresses at transfer and in service (SLS; stress class 1/2/3 per design criteria; end sections often solid, different properties); ULS flexure (at every curtailment); ULS shear; ULS torsion (and combined shear+torsion); deflection/pre-camber; end block/bursting; horizontal shear at precast-insitu interface; reinforcement details (durability, cover, crack width, min area, min spacing).
- Transverse slabs (incl. slabs of long. beams): bending and shear both directions (Mx main span, My longitudinal); punching under wheels; torsional shear flow if part of a box.
- Diaphragms: bending, shear, bursting, bearing stress above bearings.
- Bearings: confirm selection; check vertical (permanent; dead+other), lateral/longitudinal force for fixed/guided, rotation (2 axes), movement (2 axes: thermal, braking, wind). Maxima normally not from coincident cases: take the max of each effect with coincident others. Usually check against manufacturer catalogue; detailed check only for non-standard elastomeric. Bearing stiffness is a support boundary condition input.
- Piers/walls: combined axial + (bi-axial) bending, slenderness; contact pressure and bursting just below bearings.
- Foundations/piles: structural pile design like columns; geotechnical design stays with geotech engineer; send pile-spring results back to geotech; compare spread-footing max pressure with allowable; check foundation slabs for bending and shear.

## Annex A — Shear lag (AS 5100.5 cl 8.8.2, SLS only)
- Effective flange: T-beam and box: bef = bw + 0.2a; L-beam: bef = bw + 0.1a. a = distance between zero-moment points (0.7L continuous, 1.0L simply supported). Overhang ≤ half clear distance to next member, or 6× flange thickness + smaller fillet dimension.
- ULS: no shear lag allowance; full section.
- AS 5100.5 App. F: shear lag significant if L1/bfc < 5 (positive moment), L2/bfc < 10 (negative). AASHTO 4.6.2.6 is more rigorous (reference). (fig: p39_shear_lag_section)

## Annex B — Torsion in box girders
- SLS: full torsion stiffness; ULS: reduced (AS 5100: ≤20%). Avoids over-estimating cracked-beam torsion and under-estimating transverse slab load.
- Use Hambly for boxes; Hambly values ≈ ½ of St Venant (St Venant ignores box deformation in a grillage).
- Worked example (D=2.5 m, web spacing B=3.5 m, top slab 0.25, bottom slab 0.15, web 0.5, h=2.3 m between slab mid-depths). (fig: p41_torsion_comparison)

| Case | St Venant C=4A²/Σ(d/t) | Hambly C=2h²d'd''/(d'+d'') |
|---|---|---|
| Single box (3.5 m) | 5.57 m⁴ | 3.47 m⁴ (0.99 m⁴/m width) |
| Multi-cell (10.5 m) | 19.25 m⁴ | 10.41 m⁴ |

If each web is a separate long. member, assign half (single box) or proportion by width (multicell).
- Over-estimating torsional stiffness → over-estimated transverse distribution → under-estimated long. moment.

## Annex C — Variable centroid height
- Default 2-D single-level modelling is fine for most decks. Matters for: post-tensioned continuous bridges, frame/portal structures, anything where axial load drives distribution. Not critical for simply supported pretensioned precast beams.
- Thickened bottom slab/diaphragm/flange thickening moves the centroid. Option A (all centroids on one plane): axial loads produce no bending; top of sections not aligned. Option B (top of deck at one level, centroids offset): axial forces create bending. Use B for PT, frames, axial-sensitive structures. (fig: p43_variable_centroid_options, p45_portal_frame)
- Section properties at local thickening: stress redistributes over ~1–2 segment lengths, diaphragm thickening does not act longitudinally, so full-section properties can mislead. Use realistic effective properties (esp. centroid) but do not under-estimate self weight. (fig: p44_longitudinal_section_stress)
- Prestress input: (a) P and M=P·e at each node, (b) global cable profile and force. With Option A: (a) reasonable but misses centroid-shift axial effects; (b) misrepresents eccentricity → invalid. With Option B: either is most accurate. Always give realistic section properties for correct cable eccentricity.

---
## Figure index (pick by name; all in `figures/`)
| File | Shows |
|---|---|
| p04_bridge_types_1, p05_bridge_types_2 | cross-sections of all deck types |
| p07_grillage_rectangular | plan of no-skew grillage |
| p08_skew_lt25deg / _large_narrow / _large_wide | skew mesh layouts |
| p09_box_beam_web_members | box beams with web members as separate long. members |
| p09_box_beam_nominal_rigid_links | small box: main member + nominal web members + rigid links |
| p10_grillage_plan_main_nominal | plan with main and nominal members |
| p12_slab_voided_slab, p12_composite_beam_slab | member locations, slab and beam-slab |
| p13_boxbeam_supertee, p13_multicell, p14_single_box | member locations, box types |
| p16_single_multi_box, p16_box_deformation_modes | box deformation components |
| p17_transverse_bending_distortion, p24_cog_slabs_diagram | ht/hb/dt/db definitions, distortion |
| p17_variable_thickness_section | large box with variable slab thickness |
| p19_solid_slab_section, p19_voided_slab_section, p20…p25_*_section | grillage points on each deck type |
| p32_piled_foundation_3d, p32_footing_member_sketch | pile cap grillage |
| p34_spread_foundation_3d, p34_footing_member_sketch | spread footing grillage |
| p35_footing_results | 3-member vs 5-member footing mesh results (numbers in table above) |
| p39_shear_lag_section | shear lag geometry (bfc, fillet a) |
| p41_torsion_comparison | St Venant vs Hambly worked example |
| p43_variable_centroid_options | Option A vs B centroid modelling |
| p44_longitudinal_section_stress | stress spread at flange thickening |
| p45_portal_frame | frame with centroid offsets |
