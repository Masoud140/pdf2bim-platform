# Python side of the lane_effect port check: the platform's own function on a synthetic influence object.
import json, math, sys, numpy as np
sys.path.insert(0, ".")
from pdf2bim.model.traffic import lane_effect, combine_lanes
class F:
    def __init__(s): s.R = list(range(5))
    def line(s, o, grid): return np.array([[math.sin(0.3 * x * (r + 1) + o * (r + 2)) * math.exp(-0.01 * x) for r in range(5)] for x in grid])
veh = {"wheel_kN": 60.0, "track_m": 2.0, "axle_spacing_m": 1.25, "gap_12_m": 3.75, "gap_23_min_m": 6.25, "gap_34_m": 5.0, "udl_kN_per_m": 6.0, "dla": 0.3}
grid = [i * 0.25 for i in range(160)]
e = [lane_effect(F(), grid, 0.25, veh, a, 3.2) for a in (-5.0, -1.8, 1.4)]
c = combine_lanes(e, [1.0, 0.8, 0.4])
print(json.dumps({"lanes": [[list(p), list(n)] for p, n in e], "comb": [list(c[0]), list(c[1])]}))
