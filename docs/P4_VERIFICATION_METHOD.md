# P4 structural verification — method and results

Plan: `P4_PLAN.md`. Branch `p4-verification` (from `p3-model` @ c378d73).

## 1. P4.1 Concurrent traffic actions (`pdf2bim/model/traffic.py`, `tools/concurrent_traffic.py`, `tests/model/test_concurrent.py` 8)

**Problem:** the traffic envelope keeps, per response, only the extreme value (ARCHITECTURE §4: M, V and T enveloped separately; pile √(Ml² + Mt²) of separate envelopes).

**Method:** `governing_state(T, model, r, sign)` repeats the envelope search for one response and keeps the arguments:
- lane layout (sweep position); lanes ranked by their effect, accompanying factors in rank order (only adverse lanes);
- per lane: the patterned UDL (the grid points where the lane's summed strip influence is adverse, all 8 strips) and the vehicle (lateral shift, direction of travel, front-axle position of the first pair, optional second pair at or beyond the minimum gap);
- returned as explicit downward point loads (ch, o, P) with the lane factor applied.

`concurrent(T, state)` distributes the points with the same barycentric weights as the envelope and returns every response of the response set (bearings, piles, girders, sills) under that one state.

**Checks:**

| Check | Result |
|---|---|
| State reproduces its envelope value (synthetic two-girder deck, every 7th response, max and min) | 4e-16 |
| BR13A, M1600 and S1600, 13 responses incl. a bearing, max and min | 1e-15 |
| Every concurrent response lies within its own envelope (synthetic; BR13A) | 5e-13; 1e-15 |
| Closed form: state's girder midspan moment = Σ P · beam influence · transverse share | 993.75 vs 993.70 (weak links) |
| T4 equilibrium of each BR13A state: total bearing force = load on the deck | 2e-8 |
| Mutations (second vehicle pair, lane factor, ranking order, UDL pattern sign, lateral shift) | 5 / 5 caught |

**BR13A results (characteristic, `projects/BR13A/model/BR13A.traffic_concurrent.md`):**
- at the state of the largest girder sagging moment, the concurrent shear is 33–49 % of the section's shear envelope, and the concurrent torsion 57–96 % of its envelope (M1600 and S1600);
- pile moment resultant: the concurrent resultant at the max-|Ml| state is 0.45–0.98 of the separate-envelope bound √(Ml_env² + Mt_env²). The true largest resultant lies between the concurrent value (lower bound) and the √ bound (upper bound) — P4.3 refines it.

Characteristic values only; no load factor; inputs Assumed / Standard-verify; standards values unverified.

## 2. P4.2 Concurrent combinations (`combinations.concurrent_row`, `concurrent_schedule`, `tests/model/test_concurrent.py` 13)

**Method:** for the governing row of an extreme (response i, ULS / SLS, max / min), every term is evaluated as one state, chosen exactly as `combine` chose its bound at i:
- static primitives: f · v;
- traffic: the rebuilt vehicle / lane state of P4.1 for response i and the side taken (sign of f included);
- "parts" envelopes (vertical wind WVU+ / WVU−, traffic surcharge EPTA / EPTB / none): the whole governing part;
- earthquake (RSA): still the unsigned envelope of each response — **flagged** "not a concurrent state" until P4.3.

`concurrent_schedule` gives, at the schedule's ULS extremes, girder M with V, T (same section), bearing v with tr, lon, pile Ml / Mt / N with the concurrent resultant against the √ envelope bound, and sill My with Vz, Mz, T. `tools/combined_actions.py` writes them to `projects/BR13A/model/BR13A.combined_actions.md` (section "Concurrent actions").

**Checks:** the concurrent value of the governing response equals its envelope value (synthetic 1e-15; BR13A all 52 schedule items 1e-15, 30 random responses 3e-16); every concurrent component lies within the envelopes (8e-15); flags exactly on rows with earthquake terms; the parts rule closed form; 4 / 4 mutations caught.

**BR13A findings (ULS, indicative):**
- girder max sagging rows are traffic rows: concurrent V is small (−218 … +265 kN), concurrent T −810 … −1072 kN·m;
- **bearing A-G4 at its uplift minimum (−162 kN) carries concurrent tr −1124 kN and lon +1145 kN** (row ULS-B-0107: shrinkage, temperature and traffic): relevant to M-4 and the bearing / restraint design;
- **every pile moment extreme is governed by an earthquake row (ULS-H-…)**, so the pile concurrent values are flagged and not yet physical — P4.3 (signed earthquake) is needed before pile interaction checks.

## 3. P4.3 Signed earthquake and pile resultants (`earthquake.covariance` / `concurrent`, `combinations.eq_resultant`, `pile_eq_resultants`)

**Concurrent earthquake actions:** per direction, the RSA keeps the modal response matrix R (modes × responses), the CQC correlation ρ (cross terms below 1e-4 dropped, as before) and the missing-mass vector r. Covariance C_ij = Σ_kl ρ_kl R_ki R_lj + r_i r_j (C_ii = R_i²). When response i is at ± R_i, the most probable concurrent value of j is c_j = ± C_ij / R_i (|c_j| ≤ R_j). In `concurrent_row` each earthquake term f · EQX / EQY now uses this vector with the side `combine` took; the row's value at i is unchanged and no flag is raised.

**Pile moment resultant:** for a row with earthquake terms, the largest √(Ml² + Mt²) at an element end is max over unit u of u · s0 + Σ_d |f_d| √(uᵀ S_d u) (s0 = the row's static terms, S_d = the 2 × 2 CQC covariance of (Ml, Mt) in direction d): the response-ellipse method (Menun & Der Kiureghian), with the 100 / 30 terms added linearly (conservative against SRSS of directions). Rows without earthquake: √ of their separate envelopes (conservative). The larger is an upper bound over all rows.

**Checks:** C_ii = R_i² and |c_j| ≤ R_j on 1- and 2-mode models; the cross term against the closed form; concurrent rows with a CQC state reproduce the envelope, are admissible and not flagged; the ellipse resultant against a brute force over the Minkowski sum of two ellipses with a static offset (1e-4); refusal for rows with non-earthquake envelopes; BR13A record: ellipse ≤ √ bound and ≥ every earthquake-row concurrent resultant; 4 / 4 mutations caught.

**BR13A (ULS, indicative):** every pile's resultant comes from an earthquake row; **upper bound 0.85–0.87 of the √ of the full separate envelopes** (A1 1803 vs 2102 kN·m; B1 1480 vs 1744). The concurrent pile actions in the schedule are now physical (most probable values), e.g. A1 at max |Ml| 1789: Mt −220, N 1370 kN.

## 4. P4.5 stage 1 — flexural strength (`pdf2bim/design/flexure.py`, `tests/design/test_flexure.py` 13)

**Port:** the dashboard's section engine (`src/dsg_engine.js`: strips from trapezoid layers / polygons, transformed elastic properties, ULS bending by strain compatibility with the rectangular stress block, partial strips integrated exactly, displaced concrete at compression bars, strand curve, bisection on N = 0, φ from kuo). Every coefficient comes from the standards data (`AS5100.5:stress_block:alpha2` / `:gamma`, `:strain:ecu`, `:capacity_factor:phi_bending`, `:strand:stress_strain_mattock` — the last is a PCI-form material model, flagged as **not** from AS 5100.5). All unverified.

**Checks:**

| Check | Result |
|---|---|
| Rectangular, tension controlled: dn = As fsy / (α2 f'c b γ), Mu = As fsy (d − γ dn / 2) | 1e-9 |
| Rectangular, compression controlled (steel elastic): quadratic closed form | 1e-9 |
| T section, block in the flange (γ from the top strip, α2 per strip) | 1e-9 |
| Port = dashboard engine on its worked-example section: dn, kuo, Mu, φ, every steel stress, options, elastic properties, strand curve (Node-evaluated) | 1e-9 (elastic 1e-12) |
| Mutations (γ source, displaced concrete, α2 per strip, strand cap, bar yield) | 5 / 5 caught |

**E-1 (neutral-axis depth vs the worked-example targets) — investigated, not resolved:** the targets are hard-coded in the dashboard (`src/dsg2_ui.js` / `dsg3_ui.js` / `dsg5_ui.js`: Mu 68 979, φMu 55 183, dn 240.9, kuo 0.1019) with **no recorded source**. The port reproduces Mu to −0.01 % but dn −8.3 %. Hypotheses tested on the same section (none reproduces dn and Mu together):
- γ = α2 = 0.775 (a swapped factor): dn 238.0, Mu 68 610 (−0.5 %);
- AS 5100.5 approximate tendon stress σpu = fpb(1 − k1 k2 / γ), k1 0.4 / 0.28, f'c 50 / 65: dn 220.5 … 223.9;
- compression bars ignored: dn 247.3, Mu 67 941.
The same targets also list I = 2.634e13 mm⁴ and yc 961.6 mm, against 2.09e12 mm⁴ and 990.3 mm for this section (A agrees exactly), so the targets probably come from a different version of the section or contain errors. **The worked example cannot serve as a T11 benchmark until its source is known (owner item).** The engine itself is exact against the closed forms.

## 5. P4.5 stage 2 — SLS strain plane and N–M interaction (`pdf2bim/design/sls.py`, `nm.py`, `tests/design/test_sls_nm.py` 13)

**SLS (port of `respSLS` / `solveSLS`):** linear-elastic strips (cracked: no concrete tension), linear steel displacing its strip's concrete, Newton solve of the strain plane for N, M about a reference depth; prestress state by iterating each tendon's prestrain to its effective stress. One deliberate change: a cracked solve starts from the uncracked plane (from zero, the dashboard's Jacobian is singular for a section with one steel layer and the solve stops unconverged; where it converges the plane is the same).

**N–M (port of `dsg_engine2.js` at / muAtN / nm):** either face in compression, γ from the strip nearest the compression face, displaced concrete at bars in the block, strand curve with effective prestrain; state at a given axial force by geometric bisection; 92-point curve with the tension point (φ_tension_point) and φ = φ_compression at and above the balanced load (dn_b = εcu / (εcu + ε_b) d), linear to the bending φ at N = 0. New unverified entries: `AS5100.5:strain:balanced_steel` (0.0025), `AS5100.5:capacity_factor:phi_compression` (0.6).

**Checks:** uncracked rectangle σ = N/A + M(y − yc)/I (1e-4 MPa); cracked rectangle neutral axis and steel stress vs the transformed-section closed form (0.1 %, 4 mm strips); N = 0 state = `uls_bend` (1e-6); symmetric section hogging = − sagging (1e-9); tension point; φ rule; axial-force solve; refusals beyond squash / tension capacity; port = dashboard engine on its worked-example section: SLS stresses uncracked / cracked at 15 000 and 40 000 kN·m (1e-6 MPa), prestrain (1e-9), both N–M curves (N, M, φ, Nub; 1e-9), state at −3000 kN (1e-9). Mutations 6 / 6 caught.

## 6. P4.5 stage 3 — shear and torsion, general method (`pdf2bim/design/shear.py`, `tests/design/test_shear.py` 11)

**Port** of `src/dsg_engine2.js` `shear()` / `vm()`: torsion as an equivalent wall shear (k T uh / 2Ao), Veff = √((V − Pv)² + Teq²), εx = (M/dv + Veff + a N − Apt σpo) / 2(Es Ast + Ep Apt) with Ec Act added when negative, clamped; θ = a + b εx; kv with the minimum-steel switch and size factor; closed-tie legs needed for torsion removed from the shear steel; Vuc, Vus, Vu,max, Tus, Tcr, Asv,min, Asw,min; longitudinal tension demand vs Ast fsy + tendon force; utilisations uCr, uV, uT, uL; V–M curve by bisection. All coefficients in one unverified entry `AS5100.5:shear:general_method` (+ φ 0.7).

**Deviation, finding H-9:** without a closed torsion cell (Ao = 0) and T = 0 the dashboard returns NaN for the longitudinal and torsion utilisations (0 / 0), so its governing utilisation is NaN; the port returns 0 / finite values (and ∞ when T > 0). Super-T sections have Ao > 0, so BR13A results are not affected.

**Checks:** hand chain on one case (Teq, Veff, εx, θ, kv, Vuc, Vus, uV, uCr; 1e-12); εx < 0 branch and both clamps; minimum-steel switch; torsion taking shear steel; monotonic responses; Ao = 0 behaviour; port = engine on 180 cases (5 section variants × 36 action sets, every output, 1e-9) and the 41-point V–M curve. A wrong inventoried coefficient would break the port check. Mutations 5 / 5 caught.

## 7. P4.5 stage 4a — reference benchmark and design sections at stations

**Benchmark (`tests/design/test_benchmark.py` 4):** the dashboard records a reference example (`src/dsg2_ui.js` dgBench: 2.4 m composite trough girder, 50 MPa deck, 65 MPa beam, 120 strands) with the outputs of a **reference spreadsheet** (its numbers come from a compiled add-in; the spreadsheet is not in the repository). This is the source of the E-1 targets. Re-run with the Python modules:
- equal to the dashboard's own dgBench on every quantity (1e-6);
- **vs the spreadsheet (V4):** SLS top / bottom stresses +0.010 % / +0.002 %, decompression moment and Ms,allow (fscr 200 MPa, a benchmark input) within 0.001 %, φMu and Muo −0.13 %, Muo,min = 1.2 Mcr 0.000 %, Asv,min / s and Asw,min / s exact, θ and kv from the spreadsheet's own εx exact;
- **differ (reported, not asserted):** dn / kuo −8.4 % (the add-in's stress-block depth is not visible), dv −6.5 % (0.9 × the yield-force-weighted tension resultant vs a deeper d in the add-in) and everything that follows from it (εx, θ, kv, φVuc −10 %, φVus −7 %, φVu,max +4 %), φTcr +8.5 % (no prestress enhancement here), torsion and longitudinal utilisations (the add-in's definitions are not documented).
So E-1 is explained as far as the visible outputs allow: bending strength agrees to 0.13 %; the neutral-axis depth and the shear chain differ by method. **Shear / torsion stays "method, verify"** for the engineer. New unverified entries: `AS5100.5:concrete:flexural_tensile_strength` (0.6 √f'c), `AS5100.5:flexure:minimum_strength_factor` (1.2).

**Stations (`pdf2bim/design/stations.py`, `tests/design/test_stations.py` 10):** design section at a P2 station: the girder outline from `supert_section` (open, or solid inside a solid-end zone), the deck slab over the station's deck widths at girder top + haunch, as strips; strands from `strand_pattern` (on / off, debonded lengths from each end), bars from `bars` (from / to), materials from the description. Strip properties = the P2 composite properties at every open station of every girder (A, centroid, I; 1.2e-4 with 2 mm strips) and at the solid end. The checks refuse a tendon without effective prestrain or fpb.

**BR13A readiness:** 48 strands and 18 bars are present but **Assumed placeholders** (TfNSW T4 layout, D-1); missing for the design checks: strand fpb (materials.strand.fpb), **effective prestress** (time-dependent losses — not ported yet), fitments, deck bars. No BR13A design utilisation is produced until these exist.

## 8. P4.5 stage 5 — effective prestress (losses), inputs from the description, girder ULS flexure

**5a Losses port (`pdf2bim/design/prestress.py`, `tests/design/test_prestress.py` 12):** the dashboard's Hog time analysis (base/v15 Hog engine: transfer with elastic shortening, transmission, debonding; shrinkage, creep with k9, relaxation; simplified and detailed time-step methods; deck and SDL stages; camber) ported unchanged in method. Every material constant is a standards entry (`AS5100.5:shrinkage:model`, `:shrinkage:basic_drying`, `:creep:model`, `:creep:basic_coefficient`, `:creep:nonlinear_k9`, `:relaxation:k6`, `:losses:simplified`, `:concrete:table_3_1_2`, `:strand:table_3_3_1`, `:prestress:transmission_length`; all unverified). Verified:
- port = the dashboard's engine evaluated in Node (`tools/dump_dashboard_hog.js`, fixture `br13a_dashboard_hog.json`) for the simple, simple-without-deck and detailed runs: stations, midspan hog and strand forces at every time ≤ 1e-12;
- closed forms: elastic shortening of a concentric strand, transmission length, no-loss and single-mechanism switches, relaxation loss = P (R(t) − R(0)) / 100.

**5b Inputs (`pdf2bim/design/prestress_inputs.py`, `tests/design/test_prestress_inputs.py` 12):** every Hog input has a recorded source — geometry from P1 (girder length, bearing chord → overhang a), section from P2, strands / bars / ages / jacking from `supert_types[]`, concrete moduli and f'cmi from Table 3.1.2, strand area / MBL from Table 3.3.1, the rest from the new field `design.prestress_losses` (**D-42**, Assumed: the dashboard Hog-tab values, revision 11). Without D-42 accepted the builder refuses. V5 vs the dashboard's inputs: ≥ 40 scalars equal; the differences are the documented geometry / density / age items (A, I, yb, ue within 0.3 %; ueC 0.1 %; L 0.3 %; a 1 %; rho; pour), and with the dashboard's values substituted the run equals the dashboard's exactly (1e-9).
- **P4-3:** `age_deck_cast` (60 d) is read as an age (pour = 53 d after transfer); the dashboard uses 60 d after transfer. Owner to confirm which the drawings / programme mean.
- **P4-4 / H-10:** the composite drying perimeter ueC counts the flange tops plus half the trough interior, as the dashboard (an interpretation; the trough is closed by the deck).

**5c Girder ULS flexure (`girder_design.flexure_along`, `tools/girder_flexure.py`, `tests/design/test_girder_flexure.py` 8):** effective prestrain per strand at each P2 station from the losses run (last reported time), fpb = MBL / area = 1786 MPa (Table 3.3.1; `materials.strand.fpb` empty), M* = ULS sagging envelope interpolated between the bracketing girder element ends. BR13A: M* / φMu ≤ 0.81 (G4 midspan). Superseded by stage 6 (prestrain includes the concrete strain at the strand; concurrent N*).

## 9. P4.5 stage 6 — staged SLS, cracking moment, minimum strength (`pdf2bim/design/girder_sls.py`, `girder_design.checks_along`)

Port of the dashboard's load-case check dgLC (SLS and bending parts; method in the module docstring): girder alone under prestress + Mnc (strand prestrain iterated to the effective prestress), state locked into the composite section, composite strain planes uncracked / cracked; Mdec, Mal (Table 8.6.2.1 increments), MdecT / MalT (top face), uncracked check soffit ≤ 0.25 √f'c, Mcr / McrH at f'ct.f, Muo,min = 1.2 Mcr, ULS φMu at N* (phi rule with the balanced load) and Muo at N = 0. New unverified entries: `AS5100.5:crack_control:table_8_6_2_1` (bar diameter → 330 / 280 / 240 / 210, larger and no-bar 200, tendons 200 MPa, as coded), `AS5100.5:crack_control:uncracked_tension_limit` (0.25). The SLS strain-plane solve is now vectorised (same terms; round-off-level differences; stage 2 tests unchanged).

**Tests:** `test_girder_sls.py` 10 — Table 8.6.2.1 pick; stage 1 reproduces each strand's effective prestress (1e-3 MPa); soffit 0 at Mdec and f'ct.f at Mcr, deck top f'ct.f at McrH (1e-6 MPa); uncracked increment Δσ = ΔM (D − yc) / I (1e-3); Muo,min = k Mcr; Mal at a limit; **port = dashboard dgLC** (evaluated in Node from the built dashboard with its own engines) on four load cases (sagging; axial force + free strains; hogging; compression): moments ≤ 0.02 kN·m (bisection on a solver tolerance), stresses ≤ 2e-8 MPa, flags / φ / kuo / Nub equal. `test_girder_checks.py` 7 — the BR13A record reproduced live; Mnc closed form; per-station consistency.

**Actions (`checks_along`; provisional, ADR-035):**
- Mnc = SLS factor × simple-span moment of the girder self weight + wet deck on its bearings — the loads of the losses analysis (the platform has no staged-construction analysis; the dashboard takes CS2 + CS3 from its stage model);
- Ms*, Ns* = SLS envelope with DLc removed (DLc acts on the girder alone), concurrent N of the governing row (option useN);
- M*, N* = ULS envelope (DLc on the composite model: total moment) with the concurrent N.
- **Not applied:** temperature-gradient primary (self-equilibrating) stresses and differential deck shrinkage (the dashboard applies them as free strains in its '+' / '−' combinations); shear / torsion (fitments, torsion box geometry); strand development.

**BR13A (INDICATIVE; D-1 placeholder strands / bars, D-42 Assumed loss inputs, standards unverified):** every station uncracked at SLS (soffit ≤ +1.31 MPa vs 0.25 √65 = 2.02 MPa, G4 midspan); Ms* / Mal ≤ 0.62; Muo ≥ 1.2 Mcr everywhere (≈ 18 300–18 800 vs 10 800–11 200 kN·m); M* / φMu ≤ 0.81 (G4 midspan, with N*). No hogging ULS moment in the span; record `projects/BR13A/model/BR13A.girder_checks.md`.

## 10. P4.5 stage 7 — SLS free strains

- **Deck differential shrinkage** (`prestress.differential_shrinkage`): the detailed losses method now records, per reported time after composite action, the deck shrinkage since composite action sd, the girder shrinkage over the same period sg, the deck creep coefficient phd and chi (the built dashboard's newer Hog engine adds this `dsh` output; base/v15 does not); eps_free,deck = −(sd − sg) / (1 + chi phd) (dgDshEps). Port = the dashboard's browser run at every reported time to 1e-12 (`test_prestress.py`, fixture `dsh_browser`). BR13A: −79.6 × 10⁻⁶ at 3650 d (design option dsh on).
- **Temperature-gradient primary strains:** alpha × (f_TGP T_P(y) + f_TGN T_N(y)), the profiles and alpha of `loads.gradient_*` / `loads.temperature` (as the thermal cases), the factors f of the governing SLS row; profile lookup = dashboard dgProfAt (`test_girder_sls.py`). The gradient's secondary (restraint) actions are already in the envelopes. Limitation: the governing row is chosen by the moment alone, not by the fibre stress.
- **BR13A (indicative):** soffit stress at Ms* falls from +1.31 to +1.03 MPa (G4 midspan; limit 2.02 MPa); Ms*/Mal, Muo and φMu unchanged to the reported precision. `test_girder_checks.py` 8 reproduces the record with its free strains.
- **Shear / torsion at the stations:** not wired. It needs the closed-box torsion geometry (dashboard dgGeo / dgParFromR from its own 12-point outline: to be mapped to the P2 parameters) and the fitments (tie diameter, legs, spacing, covers, fsy.f, aggregate size). BR13A has no fitments (`supert_types[].fitments` empty): **owner / drawings**. The method is ported and verified (§6).

## 11. P4.4 agent part — MIDAS result reader and comparison (`pdf2bim/model/midas_compare.py`, `tools/midas_compare.py`)

- **Platform side:** `platform_tables(mdl, sidecar)` solves the self-weight case (the only case in the .mct) and the modes of the integrated model and writes them in the .mct numbering (sidecar node / element maps; refused if the sets differ): reactions (supports + springs, global), beam end forces (local axes, +x-face section forces: I = −f_I, J = +f_J), periods and translational mode shapes. BR13A tables: `projects/BR13A/model/midas/platform_*.csv` (revision 11; total reaction 8488.0 kN = model weight).
- **MIDAS side:** CSV result tables read with a header map (`COLUMNS`) and sign conventions (`CONVENTIONS`) that are **UNCONFIRMED** until the owner's first export; units in brackets ignored; an unmatched header stops the reader and lists the headers found.
- **Comparison:** reactions and member end forces T10 2 % of the larger value with a floor of 1 % of the component's largest value; total reaction; modes paired by MAC ≥ 0.9 on the common nodes' translations, paired periods T7 3 %; without MIDAS shapes nothing is paired (periods by order only, not assessed); unpaired modes reported as findings.
- **Tests (`tests/model/test_midas_compare.py` 10):** total reaction = weight; CSV round trip identical (888 reaction / 8352 force values, 6 modes); a reaction, a member moment and a period 5 % off are each caught; reordered modes with a sign flip paired correctly; a missing mode reported unpaired; unknown headers refused; foreign sidecar refused.
- **Open (owner):** run MIDAS on `BR13A.integrated.mct` (its own checklist), export the tables, confirm or correct `COLUMNS` / `CONVENTIONS` (local-axis orientation and sign of MIDAS beam forces are the main risk), then `tools/midas_compare.py --midas <folder>`. Mass source for modes: self weight as consistent mass.
