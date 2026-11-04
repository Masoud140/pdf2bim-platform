#!/usr/bin/env python3
"""P6 tests: the unchanged platform chain on the second bridge (B12626, owner drawings 2026-10-28).

Description -> geometry -> sections -> integrated model -> SDL -> MIDAS .mct, with the development inputs of decision D-1
(PROPOSED, projects/B12626/dev_inputs.py) — so the results are PROVISIONAL. Checks are against values printed on the
drawings or hand calculations, not against another program."""
import json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.substructure import build_integrated
from pdf2bim.model.loads import sdl_case
from pdf2bim.model.mct import write_mct, read_mct
from pdf2bim.model.solver import Model
from standards.accessor import Standards

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


doc = json.load(open(os.path.join(R, "projects/B12626/B12626.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
t("alignment: the two printed setout-line points close to < 5 mm", all(c["pass"] for c in geo["checks"]), str([round(c.get("value_m", c.get("value_deg", 0)), 5) for c in geo["checks"]]))
sop = {"A": (379696.813, 6369961.333), "B": (379713.250, 6369982.879)}           # 109051 / 109052
d_sop = max(math.hypot(s["E"] - sop[s["id"]][0], s["N"] - sop[s["id"]][1]) for s in geo["supports"])
t("support points on the control line within 5 mm of the printed SOPs (MC10 lies 3-4 mm off the setout line)", d_sop < 0.005, f"{d_sop * 1000:.1f} mm")
G = {g["id"]: g for g in geo["girders"]}
t("girder length end to end = 27.900 printed (109202), all ten", all(abs(g["length_end_to_end"] - 27.9) < 1e-3 for g in geo["girders"]))
typ = [r[side] for g in geo["girders"] for r in g["flange"] for side in ("left", "right") if "deck edge" not in r[side + "_to"]
       and not {g["id"], r[side + "_to"]} == {"SG-05", "SG-06"}]
t("typical flange tips 1160 from the girder line (2344 spacing - 24 gap, = 109202-204)", max(abs(x - 1160) for x in typ) < 0.5, f"{max(abs(x - 1160) for x in typ):.2f} mm")

S = build_sections(doc, geo, allow_proposed=True)
st3 = S["girders"]["SG-03"]["stations"][0]
t("interior girder carries the full 2344 deck width (flange tips + half the gap each side; regression: girder ids not starting with 'G')",
  abs(st3["deck_left"] + st3["deck_right"] - 2344) < 0.5, f"{st3['deck_left'] + st3['deck_right']:.1f} mm")
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
m = M["model"]
r = m.solve()
W = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for b in m.beams.values())
t("self weight: support + spring reactions = member weights", abs(r["applied"][2] + W) / W < 1e-6, f"{W:.1f} kN")
# each pile hangs from the sill node at its own position (pile and bearing ids coincide on B12626: A-01 ...)
ok = True
for b in m.beams.values():
    if b["role"] == "rigid_sill_pile":
        s_, p_ = M["nodes"][b["n1"]], M["nodes"][b["n2"]]
        ok &= math.hypot(m.nodes[b["n1"]][0] - m.nodes[b["n2"]][0], m.nodes[b["n1"]][1] - m.nodes[b["n2"]][1]) < 0.5
t("rigid sill-pile arms join each pile to the sill at that pile (< 0.5 m in plan; regression: id collision)", ok)
# midspan deflection vs simply supported composite beam, girder self weight + deck strip on one girder
g5 = S["girders"]["SG-05"]; st = g5["stations"][len(g5["stations"]) // 2]
EI = S["E_girder_MPa"] * 1e3 * st["composite"]["Ix"] * 1e-12                     # kN m2 (girder units)
w = (st["girder"]["A"] * 1e-6 * 25.5) + 2.344 * 0.2 * 25.5
L = 27.0999
d_hand = 5 * w * L ** 4 / (384 * EI)
gz = [r["u"][k][2] for k, n in M["nodes"].items() if n.get("role") == "girder" and k in r["u"]]
t("midspan self-weight deflection vs 5wL^4/384EI (one girder + its deck strip, composite EI) within 15 %",
  abs(-min(gz) / d_hand - 1) < 0.15, f"model {-min(gz) * 1000:.1f} mm, hand {d_hand * 1000:.1f} mm")
sd = sdl_case(doc, geo, M, allow_proposed=True)
hand = 22 * 0.080 * (13.1167 + 9.5033) * 28.0 + (10.56 * 2 + 9.34) * 28.0
t("SDL total vs hand (surfacing 22 x 0.08 x 22.62 m x 28 m + barriers x 28 m) within 1 %", abs(-sd["total_kN"] / hand - 1) < 0.01, f"{-sd['total_kN']:.1f} vs {hand:.1f} kN")

# SDL factor groups (owner rule, ADR-048): barriers with drawing weights -> SDLs (1.4); others, surfacing -> SDLp (2.0)
import copy as _cp
sp_, ss_ = sdl_case(doc, geo, M, allow_proposed=True, part="SDLp"), sdl_case(doc, geo, M, allow_proposed=True, part="SDLs")
t("SDL split: outer precast barriers (weight from 109402 masses, Calculated) SDLs, median (density assumed) SDLp; parts sum to the whole",
  sp_["barrier_actions"] == {"barrier_left": "SDLs", "barrier_right": "SDLs", "barrier_median": "SDLp"} and abs(sp_["total_kN"] + ss_["total_kN"] - sd["total_kN"]) < 1e-6,
  f"SDLp {sp_['total_kN']:.1f} + SDLs {ss_['total_kN']:.1f} kN")
d2 = _cp.deepcopy(doc)
d2["combinations"]["settings"]["rows"].append({"cells": {"item": "barrier_sdl_action", "value": "SDLp"}, "tag": "Input-user", "status": "accepted", "decision": "D-99"})
t("combinations.settings barrier_sdl_action = SDLp (project criteria) puts every barrier at 2.0",
  set(sdl_case(d2, geo, M, allow_proposed=True, part="SDLp")["barrier_actions"].values()) == {"SDLp"})
txt, rep = write_mct(M, doc, title="test B12626")
Rd = read_mct(txt)
base = rep["base_point"]
inv = {v: k for k, v in rep["node_map"].items()}
m2 = Model()
for n, (x, y, z) in Rd["nodes"].items():
    m2.node(n, x + base[0], y + base[1], z)
for e, (mt, sc, n1, n2) in Rd["els"].items():
    a, s = Rd["mats"][mt], Rd["secs"][sc]
    m2.beam(e, n1, n2, a["E"], a["nu"], s["A"], s["Iy"], s["Iz"], s["J"], s["Asy"] or None, s["Asz"] or None, w=a["den"] * s["A"],
            off=((0, 0, s["dz"]), (0, 0, s["dz"])) if s.get("dz") else None, rel=Rd["rels"].get(e))
for i, l in enumerate(Rd["links"], 1):
    m2.link(i, l["n1"], l["n2"], l["k"], beta=l["beta"], dry=l["dry"], drz=l["drz"])
for n, k in Rd["springs"]:
    m2.spring(n, k)
for ids, f in Rd["cons"]:
    for n in ids:
        m2.fix(n, f[:6])
r2 = m2.solve(gravity=Rd["selfweight"])
U1 = np.array([r["u"][inv[n]][:3] for n in sorted(inv)]); U2 = np.array([r2["u"][n][:3] for n in sorted(inv)])
t("MCT round trip (write -> read -> solve): self weight to 1e-5 (pile scale factors written to 6 figures), translations to 0.01 mm",
  abs(r["applied"][2] / r2["applied"][2] - 1) < 1e-5 and np.abs(U1 - U2).max() < 1e-5, f"SW {r['applied'][2]:.2f} vs {r2['applied'][2]:.2f} kN, max diff {np.abs(U1 - U2).max() * 1000:.4f} mm")
t("piles written as SR Ø0.932 with area / inertia scale on the gross circle", ", SR , 2, 0.932," in txt and "1.32039, 1.32039, 1.32039, 1.61915" in txt)
# girder prestress (109206 strand layout, 109201 notes) and the losses / hog inputs
from pdf2bim.design.prestress_inputs import hog_inputs
T1 = next(x for x in doc["superstructure"]["supert_types"] if x["id"] == "ST1")
pat = [r_["cells"] for r_ in T1["strand_pattern"]["rows"]]
deb = sorted(c["debond_left"] for c in pat)
t("strand layout 109206: 48 straight strands, debonded 8 x 7000 / 6 x 5000 / 6 x 3000 / 2 x 800 (row F)",
  len(pat) == 48 and deb.count(7000) == 8 and deb.count(5000) == 6 and deb.count(3000) == 6 and deb.count(800) == 2)
Hd = hog_inputs(doc, geo, S, "SG-03", Standards(), allow_proposed=True)
p_ = Hd["p"]
t("hog inputs complete; strand area / MBL from the drawings (142.6 mm2, 261 kN), not the standards table; P0 = 0.728 x MBL less relaxation",
  not Hd["missing"] and abs(p_["Ap"] - 142.6) < 1e-9 and abs(p_["mbl"] - 260.958) < 1e-3 and abs(p_["ji"] - 0.728) < 1e-9)
EIg = p_["Ec"] * 1e3 * p_["I"] * 1e-12; Ls = (p_["L"] - 2 * p_["a"]) / 1000
t("wet-deck deflection 5wL^4/384EI from the hog inputs within 10 % of 109201 Table 1 (23 mm)", abs(5 * p_["wd"] * Ls ** 4 / (384 * EIg) * 1000 / 23 - 1) < 0.10,
  f"{5 * p_['wd'] * Ls ** 4 / (384 * EIg) * 1000:.1f} mm")
# HLP400 with 0.5 x M1600 in the unobstructed lanes (109035 cover sheet; AS 5100.7-2004 A2.2.5.2), accompanying lane factors
import copy, numpy as np
from pdf2bim.model.traffic import traffic_envelope, governing_state, concurrent, Influence
inf = Influence(M)
T = traffic_envelope(doc, geo, M, Standards(), allow_proposed=True, inf=inf)
d0 = copy.deepcopy(doc)
for r_ in d0["loads"]["traffic_models"]["rows"]:
    if r_["cells"]["model"] == "HLP400_with_half_M1600":
        r_["cells"]["on"] = False
T0 = traffic_envelope(d0, geo, M, Standards(), allow_proposed=True, inf=inf)
H, H0 = T["env"]["HLP"], T0["env"]["HLP"]
t("HLP + 0.5 M1600 in free lanes switched on (cover sheet) and never below the HLP alone", H["with_half_M1600"] and not H0["with_half_M1600"]
  and np.all(H["max"] >= H0["max"] - 1e-6) and np.all(H["min"] <= H0["min"] + 1e-6), f"max ratio {np.max(H['max']) / np.max(H0['max']):.3f}")
i = int(np.argmax(H["max"]))
st = governing_state(T, "HLP", i, 1)
t("HLP + free-lane state rebuilds the envelope value; free lanes at 0.5 x accompanying factors (0.8, 0.4 ...)",
  abs(concurrent(T, st)[i] - H["max"][i]) < 1e-6 * abs(H["max"][i]) and all(abs(f - 1.0) < 1e-9 or f <= 0.4 + 1e-9 for _, f in st["factors"]),
  f"{H['max'][i]:.1f}; factors {st['factors']}")
# divided deck: two carriageways with a 1.0 m median (synthetic split of B12626, engine test only)
d2 = copy.deepcopy(doc)
proto = d2["loads"]["traffic_models"]["rows"][0]
cl_, cr_ = d2["deck"]["carriageway_left"]["value"], d2["deck"]["carriageway_right"]["value"]
d2["deck"]["carriageways"] = {"rows": [dict(copy.deepcopy(proto), cells={"name": n_, "left": a_, "right": b_}) for n_, a_, b_ in (("west", cl_, 1.3), ("east", 2.3, cr_))]}
T2 = traffic_envelope(d2, geo, M, Standards(), allow_proposed=True, inf=inf)
inside = all(any(a_ >= c[0] - 1e-6 and a_ + T2["lane_width"] <= c[1] + 1e-6 for c in T2["carriageways"]) for L in T2["layouts"] for a_ in L)
i2 = int(np.argmax(T2["env"]["HLP"]["max"])); s2 = governing_state(T2, "HLP", i2, 1)
j2 = int(np.argmax(T2["env"]["M1600"]["max"])); m2 = governing_state(T2, "M1600", j2, 1)
t("divided deck: every lane inside one carriageway; HLP and M1600 states rebuild their envelope values", inside and len(T2["carriageways"]) == 2
  and abs(concurrent(T2, s2)[i2] - T2["env"]["HLP"]["max"][i2]) < 1e-6 * abs(T2["env"]["HLP"]["max"][i2])
  and abs(concurrent(T2, m2)[j2] - T2["env"]["M1600"]["max"][j2]) < 1e-6 * abs(T2["env"]["M1600"]["max"][j2]),
  f"{len(T2['layouts'])} layouts, {T2['lanes']} lanes")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
