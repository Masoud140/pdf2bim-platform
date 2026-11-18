#!/usr/bin/env python3
"""Continuous spans stage 1 (pdf2bim/model/continuous.py).  Run: python3 tests/model/test_continuous.py
Closed form: two equal spans joined over the pier carry a uniform load with reactions 3/8, 10/8, 3/8 wL and a pier moment
wL²/8; a stiff tie across a short gap gives the same within the tie's flexibility. Then the SB41 WB span descriptions."""
import json, os, sys
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R)
from pdf2bim.model.solver import Model
from pdf2bim.model.continuous import join

res = []


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


E, nu, A, I, J, L, w, n = 30e6, 0.2, 0.3, 0.0025, 0.004, 10.0, 12.0, 10


def span(x0, gap=0.0):
    """One simply supported span as build_superstructure would return it (girder line 'G1', ends tagged)."""
    m, nodes = Model(), {}
    for i in range(n + 1):
        m.node(i + 1, x0 + i * L / n, 0, 0)
        nodes[i + 1] = {"id": i + 1, "line": "G1", "special": "end_A" if i == 0 else "end_B" if i == n else None}
    for i in range(n):
        m.beam(i + 1, i + 1, i + 2, E, nu, A, I, I, J, w=w, role="girder")
    m.fix(1, "111100"); m.fix(n + 1, "011000")
    return {"model": m, "nodes": nodes, "members": [], "bearings": {}}


S = join([span(0.0), span(L)])
M = S["model"]; r = M.solve()
Rz = {n_: v[2] for n_, v in r["reactions"].items()}
end1, pier, end2 = Rz[1], Rz[n + 1], Rz[S["map"][1][n + 1]]
t("two spans joined at a coincident node: one node merged, reactions 3/8, 10/8, 3/8 wL", len(S["merged"]) == 1 and abs(end1 - 0.375 * w * L) < 1e-6 and abs(pier - 1.25 * w * L) < 1e-6 and abs(end2 - 0.375 * w * L) < 1e-6,
  f"{end1:.4f} / {pier:.4f} / {end2:.4f}")
Mp = M.end_forces(n)[10]                     # element ending at the pier: My at its j end
t("pier moment wL²/8 (hogging)", abs(abs(Mp) - w * L * L / 8) < 1e-6, f"{Mp:.4f} vs {w * L * L / 8}")
t("equilibrium of the joined model", np.abs(r["equilibrium_residual"]).max() < 1e-9 * w * L * 2)

# two bearing rows 0.6 m apart, girders tied by a stiff member (diaphragm): close to the one-support answer
g = 0.6
a, b = span(0.0), span(L + g)
b["model"].fixed[1] = [1, 2]                 # second span's first bearing: vertical + transverse only (no longitudinal)
S2 = join([a, b], tie=True)
r2 = S2["model"].solve()
R2 = {n_: v[2] for n_, v in r2["reactions"].items()}
two = R2[n + 1] + R2[S2["map"][1][1]]
t("two bearing rows tied across a 0.6 m gap: one tie, both pier bearings carry about 10/8 wL", len(S2["ties"]) == 1 and abs(two - 1.25 * w * L) / (1.25 * w * L) < 0.03,
  f"{two:.3f} vs {1.25 * w * L:.3f}")
t("untied (two simply supported spans): pier carries wL", abs(sum(v[2] for k_, v in join([span(0.0), span(L + g)])["model"].solve()["reactions"].items() if k_ in (n + 1, 1_000_000 + 1)) - w * L) < 1e-6)

# SB41 WB: the two integrated span models (ADR-062), one bearing row on the pier -> pier substructure and bearings shared
try:
    from pdf2bim.geometry.bridge import build_geometry
    from pdf2bim.sections.girder import build_sections
    from pdf2bim.model.substructure import build_integrated
    from standards.accessor import Standards
    sups = []
    for s in (1, 2):
        d = json.load(open(os.path.join(R, f"projects/B12459-S{s}/B12459-S{s}.bridge.0.2.json")))
        geo = build_geometry(d, allow_proposed=True)
        sups.append(build_integrated(d, geo, build_sections(d, geo, allow_proposed=True), Standards(), allow_proposed=True))
    W = join(sups)
    pier = [b for b in W["bearings"].values() if b["support"] == "P1"]
    t("SB41 WB: the 9 pier bearings of the two spans become one set (9 links, 9 duplicates dropped)",
      len({b["link"] for b in pier}) == 9 and len(W["dropped_links"]) == 9, f"{len({b['link'] for b in pier})} links, {len(W['dropped_links'])} dropped")
    ss = [q["model"].solve() for q in sups]
    rr = W["model"].solve()
    tz = lambda q: sum(v[2] for v in q["reactions"].values())
    dup = sum(sups[k]["model"].beams[i].get("w", 0) * np.linalg.norm(sups[k]["model"].nodes[sups[k]["model"].beams[i]["n1"]] - sups[k]["model"].nodes[sups[k]["model"].beams[i]["n2"]])
              for k, i in W["dropped_beams"])
    t("SB41 WB self weight: joined total = sum of the span models less the pier substructure counted twice", dup > 0 and abs(tz(rr) - (tz(ss[0]) + tz(ss[1]) - dup)) < 1e-6 * tz(rr),
      f"{tz(rr):.1f} vs {tz(ss[0]) + tz(ss[1]) - dup:.1f}")
    Rp = sum(W["model"].link_force(l)[1][2] for l in {b["link"] for b in pier})
    Rs = sum(sups[k]["model"].link_force(b["link"])[1][2] for k in (0, 1) for b in sups[k]["bearings"].values() if b["support"] == "P1")
    t("SB41 WB self weight: the pier bearings carry more when continuous than the two simply supported spans", Rp > 1.05 * Rs, f"{Rp:.0f} vs {Rs:.0f} kN")
    print(f"     pier bearings {Rp:,.0f} kN continuous vs {Rs:,.0f} kN simply supported ({100 * (Rp / Rs - 1):+.1f} %)")
except FileNotFoundError as ex:
    t("SB41 WB descriptions present", False, str(ex))

print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
