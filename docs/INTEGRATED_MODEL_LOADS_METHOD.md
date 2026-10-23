# Integrated model, loads and combinations — method (dashboard v37–v44)

## Model
- One model: grillage superstructure + elastomeric bearing links + sill beams (headstocks) + D1050 columns/piles + ground springs.
- Bearings: GEN links, local x vertical, y transverse, z along girder; fixed = 1e7 kN/m, elastomer Ks = G·A/T, Kv = E_eff·A/T (E_c = 6GS², bulk 2000 MPa).
- Bearing movement = shear-spring deformation at DRy/DRz along the link (not raw node difference).
- Piles: rock springs below RL B (k_h·D·trib); soil springs on the column only between RL B and the ground level at each pile; layered soil (layer tops by RL); columns split at every soil level and to ~1 m.
- Toe: vertical support only.

## Load cases (all unfactored, solved on the integrated model, self weight off except DL)
- Earth pressure (K0 or Ka, ½KγH² at H/3) and traffic surcharge (K·q·H) on the headstocks; braking spread on carriageway deck nodes; centrifugal W·V²/(g·R).
- Uniform temperature: superstructure members only, fixed-end axial E·A·α·ΔT, member force = K·u + FEF. Check: girder chord change = α·ΔT·L (ratio ≈ 1.00).
- Temperature gradient (v44): profile from Design → options (assumed 5th-power shape if none entered), integrated over the design-section fibres → free ε0 and φ; imposed on composite girder elements as u_free = [ε0L, w = −φL²/2, θy = φL] at end 2, fixed-end forces −K·u_free. Check: simply supported camber φL²/8 (model 11.5 mm vs hand 12.5 mm). Transverse deck gradient not applied.
- Shrinkage + creep shortening (SCR, v44): uniform strain on the superstructure (assumed 300 ×10⁻⁶ after bearings set).
- Wind: transverse q·Cd·d at exposed-depth centroid (with torsion), vehicles line load, vertical q·CL·b at b/4 to windward, longitudinal fraction. Wind at other speeds scaled by (V/V_ULS)².
- Earthquake: own subspace iteration with SDL as lumped deck mass; Sa = kp·Z·Ch(T)/Rf; CQC (5 %) + missing-mass residual at T = 0; 100/30 directional.

## Combinations (step 5)
- Uses the Combos tab generator itself (exposed as window.CBX), traffic as one moving-load case per model; SOo and SCR switched on by default.
- Static cases enter with their signed factor; traffic (M1600/S1600) and earthquake are envelopes — each row takes the governing end per result.
- Outputs: bearing schedule, pile actions along each pile, headstock action envelopes, CSV.
- Super-T design: combination "x" = every Combos row at the station; permanent actions keep construction-stage values (SW, WET, REL, SDL, CSH), others from the integrated model.

## Girder definition (v44)
- Deck width with each girder: girders straight between their bearing nodes; half distance to the neighbouring chord (square to the girder) or full distance to the model deck edge line; 11-point override table; each design station builds its composite section with its own width.
- Hog Calculator beam length and bearing offset follow the model girder line (G1: 30.162 m, a = 566 mm; was 34.95 m / 530 mm from the workbook template).

## Not yet analysed (taken as zero, flagged)
- Pedestrian load (no footway confirmed on the GA? — untick in Combos if none).

## Assumed inputs
- All site / code values not in the drawing set are tagged "Assumed", stated next to the input, and rolled up in Needs Review (engineer instruction 2026-10-22/23).
