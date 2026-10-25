#!/usr/bin/env python3
"""P4.1 concurrent traffic actions: the rebuilt load state of an envelope value reproduces it (synthetic deck and
BR13A), closed-form check of the state's moment, concurrent values within every other response's envelope,
equilibrium of the state (bearing forces = applied load)."""
import json, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.model.solver import Model
from pdf2bim.model.traffic import Influence, lane_effect, combine_lanes, governing_state, concurrent, traffic_envelope
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


# ---------- synthetic deck: two practically independent simply supported girders at offsets -h, +h ----------
Lspan, dx = 30.0, 0.25


def deck(h):
    m = Model(); nodes = {}; members = []
    n = int(round(Lspan / dx)); k = 0; ids = {}
    for g, o in (("G1", -h), ("G2", h)):
        for i in range(n + 1):
            k += 1; ids[(g, i)] = k
            m.node(k, i * dx, o, 0.0)
            nodes[k] = {"role": "girder", "line": g, "ch": i * dx, "o": o}
    e = 0
    for g in ("G1", "G2"):
        for i in range(n):
            e += 1
            m.beam(e, ids[(g, i)], ids[(g, i + 1)], 3e7, 0.2, 1.0, 0.5, 0.5, 1.0)
            members.append({"id": e, "n1": ids[(g, i)], "n2": ids[(g, i + 1)], "role": "girder", "line": g})
        m.fix(ids[(g, 0)], "111100"); m.fix(ids[(g, n)], "011100")
    for i in range(n + 1):
        e += 1
        m.beam(e, ids[("G1", i)], ids[("G2", i)], 3e7, 0.2, 1e-6, 1e-9, 1e-9, 1e-9)
        members.append({"id": e, "n1": ids[("G1", i)], "n2": ids[("G2", i)], "role": "slab", "line": None})
    return {"model": m, "nodes": nodes, "members": members, "bearings": {}}, ids, n


mdl, ids, n = deck(1.0)
inf = Influence(mdl)
grid = inf.c0 + dx * np.arange(int(round((inf.c1 - inf.c0) / dx)) + 1)
veh = {"wheel_kN": 10.0, "track_m": 2.0, "axle_spacing_m": 1.25, "gap_12_m": 3.75, "gap_23_min_m": 6.25, "gap_34_m": 5.0, "udl_kN_per_m": 6.0, "dla": 0.3, "wheel_width_m": 0.4}
lay, W, lf = [[-3.2, 0.0], [-1.6, 1.6]], 3.2, [1.0, 0.8]
st = {"dc_m": dx, "pattern_udl": True, "lateral_shift": True, "dla_on_udl": False}
mx = np.zeros(len(inf.R)); mn = np.zeros(len(inf.R))
for L in lay:
    p, q = combine_lanes([lane_effect(inf, grid, dx, veh, a, W, True, True, False) for a in L], lf)
    mx = np.maximum(mx, p); mn = np.minimum(mn, q)
T = {"influence": inf, "grid": grid, "settings": st, "vehicles": {"X": veh}, "lane_width": W, "lane_factors": lf, "layouts": lay, "env": {"X": {"max": mx, "min": mn}}}
bad, outside = 0.0, 0.0
for r in range(0, len(inf.R), 7):
    for sg, k in ((1, "max"), (-1, "min")):
        S = governing_state(T, "X", r, sg); c = concurrent(T, S)
        e = T["env"]["X"][k][r]
        bad = max(bad, abs(S["value"] - e) / max(abs(e), 1.0), abs(c[r] - e) / max(abs(e), 1.0))
        outside = max(outside, float(np.max(c - mx)), float(np.max(mn - c)))
t("synthetic deck: the rebuilt state reproduces the envelope value (state value and concurrent response, 1e-9)", bad < 1e-9, f"{bad:.1e}")
t("synthetic deck: every concurrent response of every state lies within that response's own envelope", outside < 1e-9, f"{outside:.1e}")
mid = n // 2
r_mid = next(i for i, r in enumerate(inf.R) if r["t"] == "M" and r["girder"] == "G1" and r["node"] == ids[("G1", mid)] and r["end"] == 1)
S = governing_state(T, "X", r_mid, 1)
eta = lambda x: (x * (Lspan - 15) / Lspan if x <= 15 else 15 * (Lspan - x) / Lspan) if 0 <= x <= Lspan else 0.0
# loads between the girder lines are shared linearly; on the weakly linked deck G1 takes (h - o) / 2h of each load
cf = sum(P * eta(c) * min(max((1.0 - o) / 2.0, 0.0), 1.0) for c, o, P in S["loads"] if -1.0 - 1e-9 <= o <= 1.0 + 1e-9)
t("closed form: the state's G1 midspan moment = sum P x beam influence x transverse share (1e-3; weak links)", abs(cf / S["value"] - 1) < 1e-3, f"{cf:.2f} vs {S['value']:.2f}")
t("state record: layout, lane factors used, point loads (positive, downward)", S["layout"] in lay and S["factors"] and all(P > 0 for _, _, P in S["loads"]))

# ---------- P4.2 concurrent combination rows (synthetic primitives) ----------
from pdf2bim.model.combinations import combine, concurrent_row
nq = len(inf.R)
rng0 = np.random.default_rng(11)
A_ = rng0.normal(0, 50, nq); w1, w2 = rng0.normal(0, 5, nq), rng0.normal(0, 5, nq); Rq = np.abs(rng0.normal(0, 20, nq))
prim = {"A": {"s": A_}, "X": {"max": mx, "min": mn, "state": (T, "X")}, "W": {"max": np.maximum(w1, w2), "min": np.minimum(w1, w2), "parts": [w1, w2]},
        "E": {"max": Rq, "min": -Rq, "unsigned": True}}
rows_ = [{"name": "U1", "ls": "ULS", "t": [("A", 1.2), ("X", 1.8), ("W", -1.0)]}, {"name": "U2", "ls": "ULS", "t": [("A", 0.9), ("E", 1.0), ("W", 1.0)]}]
Cs = combine(rows_, prim)
bad, outside, flag_ok = 0.0, 0.0, True
for i in range(0, nq, 3):
    for w in ("max", "min"):
        row = next(r for r in rows_ if r["name"] == Cs["ULS"]["g" + w][i])
        c = concurrent_row(prim, row, i, w)
        bad = max(bad, abs(c["v"][i] - Cs["ULS"][w][i]) / max(1.0, abs(Cs["ULS"][w][i])))
        outside = max(outside, float(np.max(c["v"] - Cs["ULS"]["max"])), float(np.max(Cs["ULS"]["min"] - c["v"])))
        flag_ok &= bool(c["flags"]) == (row["name"] == "U2")
t("P4.2 concurrent row: reproduces the governing envelope value (static + traffic state + governing wind part + EQ envelope)", bad < 1e-9, f"{bad:.1e}")
t("P4.2 concurrent row: every component within the envelopes of the same rows", outside < 1e-9, f"{outside:.1e}")
t("P4.2 concurrent row: rows with an unsigned earthquake term are flagged (not a concurrent state); others are not", flag_ok)
c = concurrent_row(prim, rows_[0], 0, "max")
k = 0 if -w1[0] >= -w2[0] else 1
t("P4.2 concurrent row: a 'parts' term uses the whole governing part (negative factor picks the smaller part for the max)",
  np.allclose(c["v"] - 1.2 * A_ - 1.8 * concurrent(T, governing_state(T, "X", 0, 1)), -1.0 * [w1, w2][k]))

# ---------- BR13A on the full response set ----------
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.responses import ResponseSet
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
std = Standards()
geo = build_geometry(doc, allow_proposed=True); Sx = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, Sx, std, allow_proposed=True)
RS = ResponseSet(M)
TB = traffic_envelope(doc, geo, M, std, allow_proposed=True, inf=Influence(M, responses=RS))
rng = np.random.default_rng(7)
sel = sorted(set(rng.choice(len(RS.names), 12, replace=False).tolist()) | {RS.index[("BL", sorted(M["bearings"])[0], "v")]})
bad, outside, eq = 0.0, 0.0, 0.0
for mn_ in TB["models"]:
    E = TB["env"][mn_]
    for r in sel:
        for sg, k in ((1, "max"), (-1, "min")):
            S = governing_state(TB, mn_, r, sg); c = concurrent(TB, S)
            e = E[k][r]
            bad = max(bad, abs(c[r] - e) / max(abs(e), 1.0))
            outside = max(outside, float(np.max((c - E["max"]) / np.maximum(np.abs(E["max"]), 1.0))), float(np.max((E["min"] - c) / np.maximum(np.abs(E["min"]), 1.0))))
            on_deck = sum(P for (cc, o, P), w in zip(S["loads"], np.asarray(TB["influence"].weights(np.array([(a, b) for a, b, _ in S["loads"]])).sum(1)).ravel()) if w > 0.5) if S["loads"] else 0.0
            fz = sum(c[RS.index[("B", b, "FZ")]] for b in M["bearings"])
            eq = max(eq, abs(fz - on_deck) / max(on_deck, 1.0))
t("BR13A (M1600, S1600; 13 responses incl. a bearing, max and min): the rebuilt state reproduces the envelope (1e-9)", bad < 1e-9, f"{bad:.1e}")
t("BR13A: concurrent responses within their own envelopes (1e-9 relative)", outside < 1e-9, f"{outside:.1e}")
t("BR13A: equilibrium of each state — total bearing force = load on the deck (1e-6, T4)", eq < 1e-6, f"{eq:.1e}")
z = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.traffic_concurrent.json")))
ok = all(abs(g["check"] - g["M"]) < 1e-6 * abs(g["M"]) and abs(g["V"]) <= g["V_env"] + 1e-6 and abs(g["T"]) <= g["T_env"] + 1e-6 for m_ in z["models"].values() for g in m_["girders"].values())
ok &= all(st["resultant"] <= p["bound"] + 1e-6 for m_ in z["models"].values() for p in m_["piles"].values() for st in p["states"].values())
t("record (tools/concurrent_traffic.py): each state reproduces its extreme; concurrent V, T within the section envelopes; concurrent pile resultant <= the separate-envelope bound", ok)
ca = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.combined_actions.json")))["concurrent"]
chk = []
def walk(d):
    if isinstance(d, dict):
        if "check" in d and "value" in d:
            chk.append((abs(d["check"] - d["value"]) / max(1.0, abs(d["value"])), d))
        for v in d.values():
            walk(v)
walk(ca)
t("record (tools/combined_actions.py): every concurrent item reproduces its envelope value (1e-9); earthquake-governed items flagged",
  chk and max(x for x, _ in chk) < 1e-9 and all(bool(d["flags"]) == any("unsigned" in tt[2] for tt in d["terms"]) for _, d in chk), f"{len(chk)} items")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
