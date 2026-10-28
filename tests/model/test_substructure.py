#!/usr/bin/env python3
"""P3b tests: elastomeric bearing stiffness, pile discretisation and springs, integrated BR13A model (closed-form
invariants, hand checks, refusals) and a regression guard against the dashboard's frozen integrated model (V5)."""
import copy, json, math, os, sys
import numpy as np
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, R)
from pdf2bim.description import Reader, MissingInput
from pdf2bim.model.bearings import elastomer_stiffness
from pdf2bim.model.substructure import build_integrated, _pile_levels, pile_head_stiffness, hetenyi_head_stiffness
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from standards.accessor import Standards, UNVERIFIED

res = []


def t(name, ok, info=""):
    res.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info else ""))


def raises(fn, exc, word=None):
    try:
        fn()
    except exc as e:
        return word is None or word in str(e)
    return False


# ---------- bearing stiffness (closed form) ----------
def rec(v, tag="Assumed"):
    return {"value": v, "tag": tag, "status": "accepted"}


item = {"id": "X", "plan_a": rec(400), "plan_b": rec(500), "elastomer_thickness": rec(60), "layer_thickness": rec(12), "shear_modulus": rec(0.69)}
std = Standards()
k = elastomer_stiffness(item, Reader({}), std)
S_ = 400 * 500 / (2 * 900 * 12); Ec = 6 * 0.69 * S_ ** 2; Ee = 1 / (1 / Ec + 1 / 2000.0)
t("bearing Ks = G A / T (400 x 500, T 60, G 0.69 -> 2300 kN/m)", abs(k["Ks"] - 2300.0) < 1e-9, f"{k['Ks']}")
t("bearing Kv = Eeff A / T with Ec = 6 G S^2, 1/Eeff = 1/Ec + 1/2000 (hand formula)", abs(k["Kv"] - Ee * 200000 / 60) < 1e-6, f"{k['Kv']:.1f}")
t("bearing stiffness carries the UNVERIFIED standards label", k["status"] == UNVERIFIED and all(s == "code-extracted-unverified" for _, s in k["standards"]))
bad = copy.deepcopy(item); bad["layer_thickness"] = rec(70)
t("bearing: layer thicker than the elastomer is refused", raises(lambda: elastomer_stiffness(bad, Reader({}), std), MissingInput, "exceeds"))
bad = copy.deepcopy(item); del bad["shear_modulus"]
t("bearing: missing G is refused with the field name", raises(lambda: elastomer_stiffness(bad, Reader({}), std), MissingInput, "shear_modulus"))

# ---------- pile levels ----------
z = _pile_levels(10.0, 0.0, [6.5, 12.0, -1.0, 6.52], 1.0)
t("pile levels: start at the head, end at the toe, strictly decreasing", z[0] == 10.0 and z[-1] == 0.0 and all(a > b for a, b in zip(z, z[1:])))
t("pile levels: node at every cut level inside the pile (6.5 m), cuts outside ignored", any(abs(v - 6.5) < 1e-12 for v in z) and not any(abs(v - 12.0) < 1e-9 for v in z))
t("pile levels: cuts closer than 50 mm to an existing level are merged", sum(1 for v in z if 6.45 < v < 6.57) == 1, str([round(v, 3) for v in z if 6 < v < 7]))
t("pile levels: no piece longer than 1.5 segments", max(a - b for a, b in zip(z, z[1:])) <= 1.5 + 1e-12)

# ---------- integrated BR13A ----------
doc = json.load(open(os.path.join(R, "projects/BR13A/BR13A.bridge.0.2.json")))
geo = build_geometry(doc, allow_proposed=True)
S = build_sections(doc, geo, allow_proposed=True)
M = build_integrated(doc, geo, S, Standards(), allow_proposed=True)
m = M["model"]
r = m.solve()
W = -r["applied"][2]
# revision 14 keeps D-34 ... D-43 proposed (accepted 2026-10-26 on the owner's instruction, ADR-040): refusal / provisional checks run on it
dp = json.load(open(os.path.join(R, "projects/BR13A/history/BR13A.bridge.0.2.r14.json")))
gp = build_geometry(dp, allow_proposed=True); Sp = build_sections(dp, gp, allow_proposed=True)
Mp = build_integrated(dp, gp, Sp, Standards(), allow_proposed=True)
t("r14 integrated: refused without allow_proposed (proposed inputs D-34 ... D-41)",
  raises(lambda: build_integrated(dp, gp, Sp, Standards(), allow_proposed=False), MissingInput, "proposed"))
dec = {p.get("decision") for p in Mp["provisional"]}
t("r14 integrated: provisional list names the substructure proposals D-39, D-40, D-41", {"D-39", "D-40", "D-41"} <= dec, str(sorted(d for d in dec if d)))
t("current revision: every substructure decision accepted -> no proposed value used", not [p for p in M["provisional"] if p.get("decision") in ("D-39", "D-40", "D-41")])
t("BR13A integrated: equilibrium residual < 1e-6 of the weight", np.abs(r["equilibrium_residual"]).max() < 1e-6 * W, f"{np.abs(r['equilibrium_residual']).max():.1e}")
toes = [p["toe"] for s in M["supports"].values() for p in s["piles"]]
t("BR13A integrated: pile-toe vertical reactions sum to the total weight (springs act horizontally only)",
  abs(sum(r["reactions"][n][2] for n in toes) - W) < 1e-6 * W, f"{sum(r['reactions'][n][2] for n in toes):.3f} vs {W:.3f}")
t("BR13A integrated: horizontal spring forces sum to zero under gravity", np.abs(sum((f[:2] for f in r["spring_forces"].values()), np.zeros(2))).max() < 1e-6 * W)

dens = 25.5
for sid, s in M["supports"].items():
    sl = s["sill"]
    wsill = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for b in m.beams.values() if b["role"] == "sill" and m.nodes[b["n1"]] is not None and M["nodes"][b["n1"]].get("support") == sid)
    L = math.hypot(sl["end"] - sl["start"], sl["soffit_slope"] * (sl["end"] - sl["start"]))
    t(f"{sid}: sill weight = b d L gamma (sloping length)", abs(wsill - sl["b"] * sl["d"] * L * dens) < 1e-6, f"{wsill:.3f} vs {sl['b'] * sl['d'] * L * dens:.3f}")
    for p in s["piles"]:
        rock = sum(x["k"] for x in M["springs"] if x["pile"] == p["id"] and x["kind"] == "rock")
        soil = sum(x["k"] for x in M["springs"] if x["pile"] == p["id"] and x["kind"].startswith("soil"))
        Ls, Lg = p["rock"] - p["levels"][-1], p["ground"] - p["rock"]
        ok_r = abs(rock - p["rock_kh"] * 1000 * p["D"] * Ls) < 1e-6 * rock
        kh_fill = p["layers"][0]["kh"] if p["layers"] else 0.0
        ok_s = abs(soil - kh_fill * 1000 * p["D"] * Lg) < 1e-6 * max(soil, 1)
        if p["id"].endswith("1"):
            t(f"{sid}: rock springs sum to kh D x socket length; fill springs to kh D x (ground - rock) (pile {p['id']})", ok_r and ok_s,
              f"rock {rock:.0f}, soil {soil:.0f}")
        sn = [b for b in m.beams.values() if b["role"] == "rigid_sill_pile" and b["n2"] == p["head"]][0]
        off = math.hypot(*(m.nodes[sn["n1"]][:2] - m.nodes[p["head"]][:2]))
        if p["id"].endswith("1"):
            t(f"{sid}: pile head hangs from a sill node at the pile (plan offset = sill centroid offset - pile offset from the bearing line)", abs(off - abs(sl["centroid_offset"] - p["v"])) < 1e-6, f"{off * 1000:.1f} mm")
    pw = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for b in m.beams.values() if b["role"] == "pile" and M["nodes"][b["n1"]].get("support") == sid)
    exp = sum(math.pi * p["D"] ** 2 / 4 * (p["levels"][0] - p["levels"][-1]) * dens for p in s["piles"])
    t(f"{sid}: pile weight = pi D^2 / 4 x length x gamma", abs(pw - exp) < 1e-6, f"{pw:.2f}")

# vertical equilibrium of the superstructure: bearing forces on the girders = superstructure weight
wsup = sum(b["w"] * np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]) for i, b in m.beams.items() if i < 200000)
Rb = {bid: m.link_force(b["link"])[1] for bid, b in M["bearings"].items()}
t("BR13A integrated: bearing vertical forces sum to the superstructure weight", abs(sum(f[2] for f in Rb.values()) - wsup) < 1e-6 * wsup,
  f"{sum(f[2] for f in Rb.values()):.3f} vs {wsup:.3f}")
t("BR13A integrated: horizontal bearing forces on the superstructure sum to zero under gravity", np.abs(sum((f[:2] for f in Rb.values()), np.zeros(2))).max() < 1e-6 * wsup)

# bearing links: restraints and axes
kfix = M["settings"]["bearing_fixed_stiffness"]
okA = all(b["k_along"] == kfix and b["k_across"] == kfix for b in M["bearings"].values() if b["support"] == "A")
okB = all(b["k_along"] == 0.0 and b["k_across"] == kfix for b in M["bearings"].values() if b["support"] == "B")
t("bearings: A fixed along and across, B free along / fixed across (restraint_* records), fixed = analysis.bearing_fixed_stiffness", okA and okB)
lk_ok = all(m.links[b["link"]]["k"][1] == b["k_across"] and m.links[b["link"]]["k"][2] == b["k_along"] and m.links[b["link"]]["k"][0] == b["Kv"]
            for b in M["bearings"].values())
t("bearing links: stiffness vector = (Kv, across, along) in link axes x, y, z", lk_ok)
lev_ok = True
for sid, s in M["supports"].items():
    for p in s["piles"]:
        sn = [b for b in m.beams.values() if b["role"] == "rigid_sill_pile" and b["n2"] == p["head"]][0]["n1"]
        lev_ok &= abs(m.nodes[sn][2] - (m.nodes[p["head"]][2] + s["sill"]["d"] / 2)) < 0.001
t("sill centroid line = pile-head (soffit) RL + depth / 2 at every pile (within 1 mm)", lev_ok)
ax_ok = True
for bid, b in M["bearings"].items():
    Rl = m._el[("link", b["link"])][1]
    tg = np.array(next(g["unit_t"] for g in geo["girders"] if g["id"] == b["girder"]) + (0.0,)) if isinstance(next(g["unit_t"] for g in geo["girders"]), tuple) else np.array(list(next(g["unit_t"] for g in geo["girders"] if g["id"] == b["girder"])) + [0.0])
    ax_ok &= abs(Rl[0] @ np.array([0, 0, 1.0]) - 1) < 1e-12 and abs(Rl[2] @ tg - 1) < 1e-9
t("bearing links: local x vertical (seat -> bearing top), local z along the girder chord A -> B", ax_ok)
t("bearing links: seat at the seat RL, top at the girder soffit (girder line node - node height above the girder top - D)",
  all(abs(m.nodes[b["seat"]][2] - b["seat_rl"]) < 1e-12 and abs(m.nodes[b["top"]][2] - (m.nodes[b["girder_node"]][2] - M["node_above_girder_top"] - S["girders"][b["girder"]]["params"]["D"] / 1000)) < 1e-12 for b in M["bearings"].values()))
t("r14: geometry check flags the seat-to-soffit gap that disagrees with the Assumed bearing height (F-6)",
  sum(1 for c in Mp["checks"] if "bearings.height" in c["id"] and not c["ok"]) == 8)
tb = [c for c in M["checks"] if "top of bearing below the girder soffit" in c["id"]]
t("current revision (F-6 resolved, RL X = top of bearing): 8 top-of-bearing checks, all below the soffit",
  len(tb) == 8 and all(c["ok"] for c in tb), str([round(c["model"]) for c in tb]))
tags = {x["tag"] for x in M["inputs"] if x["path"].endswith("rock_kh") or ".plan_a" in x["path"]}
t("inputs record keeps the tags (rock_kh and bearing plan size are Assumed)", tags == {"Assumed"}, str(tags))

# pile head stiffness: model vs Hetenyi hand value (V2)
p0 = M["supports"]["A"]["piles"][0]
pb = next(b for b in m.beams.values() if b["role"] == "pile")
EI = pb["E"] * pb["Iy"]
hand, beta = hetenyi_head_stiffness(EI, p0["rock_kh"] * 1000 * p0["D"], p0["levels"][0] - p0["rock"])
km = pile_head_stiffness(M, p0, include_soil=False)
t("pile head lateral stiffness (rock springs only) within 3 % of the Hetenyi hand value (provisional tolerance)", abs(km / hand - 1) <= 0.03, f"{km:.0f} vs {hand:.0f}")
kl = hetenyi_head_stiffness(EI, 1e5, 0.0)[0]
t("Hetenyi hand formula: column length 0 gives k / (2 beta) (closed form)", abs(kl - 1e5 / (2 * (1e5 / (4 * EI)) ** 0.25)) < 1e-6 * kl)

# refusal: no lateral support -> mechanism, not a silent solve
d2 = copy.deepcopy(doc)
for s in d2["supports"]:
    s["rock_kh"]["value"] = 0
    for row in s["soil_layers"]["rows"]:
        row["cells"]["kh"] = 0
M2 = build_integrated(d2, geo, S, Standards(), allow_proposed=True)
t("no rock / soil stiffness: the model is refused as a mechanism (not solved)", raises(lambda: M2["model"].solve(), ValueError))

# regression guard vs the frozen integrated model (V5 — cross-implementation, not verification)
fz = json.load(open(os.path.join(R, "projects/BR13A/model/BR13A.integrated_vs_frozen.json")))
okb = all(abs(a / b - 1) <= 0.10 for _, a, b, *_ in fz["bearings"])
okp = all(abs(a / b - 1) <= 0.05 for _, a, b in fz["piles"])
okd = all(abs(a - b) <= 1.0 for _, a, b in fz["deflection"])
t("vs frozen integrated model: bearing Rz within 10 %, pile toe Rz within 5 %, midspan uz within 1 mm (recorded run)", okb and okp and okd)
# concrete-filled steel tube pile (P6, B12626): transformed to the pile concrete; weight of both materials
from pdf2bim.model.substructure import _pile_section
sec_t, w_t = _pile_section(0.932, 16, 34800, 25.5, {"Es": 200000, "density": 78.5})
A0_ = math.pi * 0.932 ** 2 / 4; Ac_ = math.pi * 0.9 ** 2 / 4; I0_ = math.pi * 0.932 ** 4 / 64; Ic_ = math.pi * 0.9 ** 4 / 64; n_ = 200000 / 34800
t("filled steel tube pile: A, I transformed by n = Es / Ec; weight = concrete + steel; MCT scale on the gross circle",
  abs(sec_t["A"] - (Ac_ + n_ * (A0_ - Ac_))) < 1e-9 and abs(sec_t["Iy"] - (Ic_ + n_ * (I0_ - Ic_))) < 1e-12 and abs(w_t - (Ac_ * 25.5 + (A0_ - Ac_) * 78.5)) < 1e-9
  and sec_t["shape"] == ("circle", 0.932, round(sec_t["A"] / A0_, 6), round(sec_t["Iy"] / I0_, 6)))
sec_s, w_s = _pile_section(1.05, None, 32800, 25.5, None)
t("solid concrete pile unchanged (BR13A): gross circle, shape ('circle', D)", sec_s["shape"] == ("circle", 1.05) and abs(w_s - math.pi * 1.05 ** 2 / 4 * 25.5) < 1e-9)
print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
sys.exit(0 if all(res) else 1)
