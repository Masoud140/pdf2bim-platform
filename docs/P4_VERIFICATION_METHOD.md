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
