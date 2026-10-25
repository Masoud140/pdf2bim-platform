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
