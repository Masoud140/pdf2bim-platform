#!/usr/bin/env python3
"""Radial (fanned) members, ADR-086 stage 4b-1: geometry from setout chainage + bearing.  Run: python3 tests/geometry/test_radial.py
Synthetic: control line = a circular arc R 180 m (turning right, as SB43's MCH0 fan suggests: R = 179.99 m Calculated
from Table 1), five members radial to it at 0.877 m chainage steps, 8.85 m back to end A and 9.85 m on to end B (SB43's
plank setout), bearings 75 mm in from each end. Closed forms: every member line passes through the arc centre; the end
polylines are arcs of radius R -/+ distance."""
import copy, json, math, os, sys
R_ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R_)
from pdf2bim.geometry.bridge import build_geometry

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


rec = lambda v: {"value": v, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"value": v, "tag": "Input-user"}}
tab = lambda rows: {"rows": [{"cells": c, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": c, "tag": "Input-user"}} for c in rows]}
R, b0, L, E0, N0, ch0 = 180.0, 120.0, 100.0, 330850.0, 6244900.0, 370.0
c = 2 * R * math.sin(L / (2 * R)); cb = math.radians(b0) + L / (2 * R)
doc = {"format": "pdf2bim.bridge/0.2",
       "alignment": {"horizontal": tab([{"element": "arc", "ch_start": ch0, "length": L, "radius": R, "direction": "right", "E_start": E0, "N_start": N0},
                                        {"element": "tangent", "ch_start": ch0 + L, "length": None, "radius": None, "direction": None,
                                         "E_start": E0 + c * math.sin(cb), "N_start": N0 + c * math.cos(cb)}])},
       "supports": [{"id": "B"}, {"id": "C"}],
       "superstructure": {"members": []}}
dA, dB, bo = 8.85, 9.85, 75.0
chs = [400.0 + 0.877 * k for k in range(5)]
for k, ch in enumerate(chs):
    th = b0 + math.degrees((ch - ch0) / R)          # control-line bearing at ch (right turn)
    doc["superstructure"]["members"].append({"id": f"PL-{k + 1:02d}", "setout_ch": rec(ch), "setout_bearing": rec(th + 90.0), "setout_to_A": rec(dA),
                                             "setout_to_B": rec(dB), "bearing_offset_A": rec(bo), "bearing_offset_B": rec(bo)})
g = build_geometry(doc, allow_proposed=True)
al = g["_alignment"]
t("radial mode: five members, supports named from the description (B, C) as polylines", g.get("radial") and len(g["girders"]) == 5 and [s["id"] for s in g["supports"]] == ["B", "C"]
  and all(s["kind"] == "polyline" for s in g["supports"]))
G = g["girders"][2]
t("member: setout point on the control line, end A 8.85 back, end B 9.85 on, bearings 75 mm in, chord = 18.7 - 0.15",
  abs(math.dist((G["end_A"]["E"], G["end_A"]["N"]), (G["setout"]["E"], G["setout"]["N"])) - dA) < 1e-9 and abs(G["length_end_to_end"] - 18.7) < 1e-12
  and abs(math.dist((G["bearing_A"]["E"], G["bearing_A"]["N"]), (G["bearing_B"]["E"], G["bearing_B"]["N"])) - (18.7 - 0.15)) < 1e-9)
# arc centre: right turn -> centre to the right of the control line (bearing + 90)
cbr = math.radians(b0 + 90)
Cc = (E0 + R * math.sin(cbr), N0 + R * math.cos(cbr))
dev = []
for m in g["girders"]:
    P = (m["setout"]["E"], m["setout"]["N"]); u = m["unit_t"]
    v = (Cc[0] - P[0], Cc[1] - P[1])
    dev.append(abs(v[0] * u[1] - v[1] * u[0]))      # distance from the centre to the member line
t("closed form: every member line passes through the arc centre (radial)", max(dev) < 1e-6, f"{max(dev):.2e} m")
t("closed form: setout points at R from the centre", all(abs(math.dist((m["setout"]["E"], m["setout"]["N"]), Cc) - R) < 1e-6 for m in g["girders"]))
pA = g["supports"][0]["polyline"]
rA = [math.dist(p, Cc) for p in pA]; rB = [math.dist(p, Cc) for p in g["supports"][1]["polyline"]]
t("closed form: end A on the arc R + 8.85 (outside), end B on R - 9.85 (bearing + 90 points to the centre)",
  max(abs(r - (R + dA)) for r in rA) < 1e-6 and max(abs(r - (R - dB)) for r in rB) < 1e-6, f"{rA[0]:.4f} / {rB[0]:.4f}")
step = 2 * (R + dA) * math.sin(0.877 / (2 * R))
t("closed form: consecutive A ends 2 (R + dA) sin(dch / 2R) apart", all(abs(math.dist(a, b) - step) < 1e-9 for a, b in zip(pA, pA[1:])), f"{math.dist(pA[0], pA[1]):.6f} vs {step:.6f}")
f0 = G["flange"][0]; f1 = G["flange"][-1]
wa = (R + dA - bo / 1000) * math.tan(0.877 / R) * 1000 / 2   # along the member normal from the bearing to the neighbouring radial line
t("deck strip: half the gap to the neighbouring chords at the bearing (wider at A, narrower at B: the fan)",
  abs(f0["left"] - wa) < 1e-3 and f0["left"] > f1["left"] and "mirrored (edge member)" in (g["girders"][0]["flange"][0]["left_to"], g["girders"][0]["flange"][0]["right_to"]), f"{f0['left']:.3f} vs {wa:.3f} mm")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
