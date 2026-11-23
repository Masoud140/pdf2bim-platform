#!/usr/bin/env python3
"""Independent cross-check of the grillage solver against PyNite (ADR-087).  Run: python3 tests/verification/test_pynite_crosscheck.py
Needs `pip install PyniteFEA` (test-only dependency; the test reports SKIP without it).
1. Closed form in both engines: cantilever tip deflection PL^3 / 3EI (checks the axis mapping).
2. BR13A superstructure grillage (girders, webs, slab strips, cross girders, rigid offsets, bearings): self weight plus
   eccentric point loads, Euler-Bernoulli copy of our model vs PyNite: every node's displacement and every bearing reaction.
3. BR13A integrated model (elastomeric bearing links, sills, piles, soil / rock springs): displacements and pile-toe reactions."""
import json, os, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import Pynite  # noqa: F401
except ImportError:
    print("SKIP PyNite not installed (pip install PyniteFEA)"); sys.exit(0)
from pynite_model import convert, displacements, euler_copy, from_py
from pdf2bim.model.solver import Model

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok and not info else f"  [{info}]"))


# 1. cantilever along x, tip load -z
E, nu, A, Iy, Iz, J, L, Pz = 30e6, 0.2, 0.3, 0.004, 0.009, 0.006, 8.0, 50.0
m = Model()
m.node(1, 0, 0, 0); m.node(2, L, 0, 0)
m.beam(1, 1, 2, E, nu, A, Iy, Iz, J)
m.fix(1)
P = convert(m, loads={2: (0, 0, -Pz, 0, 0, 0)}, gravity=False); P.analyze_linear(check_statics=False)
u = displacements(P, m)[2]
uo = m.solve(gravity=(0, 0, 0), loads={2: (0, 0, -Pz, 0, 0, 0)})["u"][2]
dz = -Pz * L ** 3 / (3 * E * Iy)
t("cantilever: PyNite and ours both give -PL^3/3EI (vertical bending uses Iy, axis mapping right)", abs(u[2] - dz) < 1e-9 * abs(dz) and abs(uo[2] - dz) < 1e-9 * abs(dz),
  f"PyNite {u[2]:.6e}, ours {uo[2]:.6e}, closed form {dz:.6e}")
m.loads = {}
P = convert(m, loads={2: (0, 30.0, 0, 0, 0, 0)}, gravity=False); P.analyze_linear(check_statics=False)
t("cantilever: horizontal load uses Iz", abs(displacements(P, m)[2][1] - 30 * L ** 3 / (3 * E * Iz)) < 1e-9)

# 2. BR13A superstructure grillage
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.builder import build_superstructure
d = json.load(open(os.path.join(R, "projects", "BR13A", "BR13A.bridge.0.2.json")))
g = build_geometry(d, allow_proposed=True); S = build_sections(d, g, allow_proposed=True)
B = build_superstructure(d, g, S, allow_proposed=True)
me = euler_copy(B["model"])
gn = sorted(x["n1"] for x in B["members"] if x["role"] == "girder")
loads = {gn[len(gn) // 2]: (0, 0, -400.0, 0, 0, 0), gn[len(gn) // 3]: (0, 0, -250.0, 120.0, 0, 0), gn[-5]: (20.0, -15.0, -100.0, 0, 0, 0)}
ro = me.solve(gravity=(0, 0, -1), loads=loads)
P = convert(me, loads=loads)
# PyNite's own stability pre-check flags this model (its heuristic, not a mechanism: our solver's pivot / residual checks pass)
P.analyze_linear(check_statics=False, check_stability=False)
up = displacements(P, me)
uo = ro["u"]
ns = sorted(up)
du = max(np.abs(up[n][:3] - uo[n][:3]).max() for n in ns); umax = max(np.abs(uo[n][:3]).max() for n in ns)
dr = max(np.abs(up[n][3:] - uo[n][3:]).max() for n in ns); rmax = max(np.abs(uo[n][3:]).max() for n in ns)
t(f"BR13A grillage ({len(me.beams)} beams, {len(ns)} nodes): translations agree within 0.01 % of the largest", du < 1e-4 * umax, f"max diff {du:.3e} of {umax:.3e} m")
t("BR13A grillage: rotations agree within 0.01 % of the largest", dr < 1e-4 * rmax, f"max diff {dr:.3e} of {rmax:.3e} rad")
k = {l["n2"]: l["k"][2] for l in me.links.values()}
Rp = {n: -kk * up[n][2] for n, kk in k.items()}   # link z axis = global Z for these bearings (R[2] = (0, 0, 1))
Ro = {l["n2"]: ro["reactions"][l["n1"]][2] for l in me.links.values()}
dR = max(abs(Rp[n] - Ro[n]) for n in k); Rm = max(abs(v) for v in Ro.values())
t("BR13A grillage: bearing vertical reactions agree within 0.01 % of the largest", dR < 1e-4 * Rm, f"max diff {dR:.4f} of {Rm:.1f} kN")
t("BR13A grillage: total vertical reaction equal (statics, both engines)", abs(sum(Rp.values()) - sum(Ro.values())) < 1e-3 * abs(sum(Ro.values())),
  f"{sum(Rp.values()):.2f} vs {sum(Ro.values()):.2f} kN")
print(f"     max |u| {umax * 1000:.2f} mm, diff {du * 1000:.4f} mm; bearings {', '.join(f'{Ro[n]:.0f}/{Rp[n]:.0f}' for n in sorted(k))} kN (ours / PyNite)")

# 3. (0.05 %: the residual is a uniform ~3 um deck slide on the soft elastomer shear springs — PyNite's conditioning with the
#    stiff arms; stiffer arms make it worse, 1e5 x gives 3 %)
# BR13A integrated model: + elastomeric bearing links (seat -> top, shear springs at mid-height), sills, rigid arms,
#    piles, soil / rock springs, pile toes
from pdf2bim.model.substructure import build_integrated
from standards.accessor import Standards
MI = build_integrated(d, g, S, Standards(), allow_proposed=True)
mi = euler_copy(MI["model"])
gi = sorted(x["n1"] for x in MI["members"] if x["role"] == "girder")
li = {gi[len(gi) // 2]: (35.0, -20.0, -400.0, 0, 0, 0), gi[len(gi) // 3]: (0, 0, -250.0, 120.0, 0, 0)}   # with horizontal load: engages links + piles
ri = mi.solve(gravity=(0, 0, -1), loads=li)
P = convert(mi, loads=li)
P.analyze_linear(check_statics=False, check_stability=False)
up = displacements(P, mi)
ns = [n for n in up if n in ri["u"]]
du = max(np.abs(up[n][:3] - ri["u"][n][:3]).max() for n in ns); umax = max(np.abs(ri["u"][n][:3]).max() for n in ns)
t(f"BR13A integrated ({len(mi.beams)} beams, {len(mi.links)} links, {len(mi.springs)} spring nodes): translations within 0.05 % of the largest", du < 5e-4 * umax,
  f"max diff {du:.3e} of {umax:.3e} m")
toes = [p_["toe"] for s_ in MI["supports"].values() for p_ in s_["piles"]]
Ro = {n: ri["reactions"][n][2] for n in toes}
Rp = {n: from_py([P.nodes[f"N{n}"].RxnFX["C"], P.nodes[f"N{n}"].RxnFY["C"], P.nodes[f"N{n}"].RxnFZ["C"]])[2] for n in toes}
dR = max(abs(Rp[n] - Ro[n]) for n in toes); Rm = max(abs(v) for v in Ro.values())
t("BR13A integrated: pile toe vertical reactions within 0.05 % of the largest", dR < 5e-4 * Rm, f"max diff {dR:.3f} of {Rm:.1f} kN")
print(f"     pile toes {', '.join(f'{Ro[n]:.0f}/{Rp[n]:.0f}' for n in toes)} kN (ours / PyNite)")
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
