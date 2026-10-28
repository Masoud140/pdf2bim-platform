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
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
