#!/usr/bin/env python3
"""Radial plank grillage (ADR-086 stage 4b-2).  Run: python3 tests/model/test_radial_model.py
Synthetic SB43-like deck: BR13A's description (materials, deck, settings) with its members replaced by 7 planks
(600 x 700, topping) fanned off an R 180 m arc at 0.877 m steps, 8.85 m / 9.85 m to the ends, bearings 75 mm in,
levels from a 2 % fall; bearings fixed at A, free along the member at B."""
import copy, json, math, os, sys
import numpy as np
R_ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, R_)
from pdf2bim.geometry.bridge import build_geometry
from pdf2bim.sections.girder import build_sections
from pdf2bim.model.builder import build_superstructure

res = []
cross2 = lambda a, b: a[0] * b[1] - a[1] * b[0]


def t(name, ok, info=""):
    ok = bool(ok); res.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not info else f"  [{info}]"))


rec = lambda v: {"value": v, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"value": v, "tag": "Input-user"}}
tab = lambda rows: {"rows": [{"cells": c, "tag": "Input-user", "status": "accepted", "current": "original", "original": {"cells": c, "tag": "Input-user"}} for c in rows]}


def radial_doc(npl=7):
    d = copy.deepcopy(json.load(open(os.path.join(R_, "projects", "BR13A", "BR13A.bridge.0.2.json"))))
    Rr, b0, L, E0, N0, ch0 = 180.0, 120.0, 100.0, 330850.0, 6244900.0, 370.0
    c = 2 * Rr * math.sin(L / (2 * Rr)); cb = math.radians(b0) + L / (2 * Rr)
    d["alignment"]["horizontal"] = tab([{"element": "arc", "ch_start": ch0, "length": L, "radius": Rr, "direction": "right", "E_start": E0, "N_start": N0},
                                        {"element": "tangent", "ch_start": ch0 + L, "length": None, "radius": None, "direction": None,
                                         "E_start": E0 + c * math.sin(cb), "N_start": N0 + c * math.cos(cb)}])
    S = d["superstructure"]
    d["alignment"].pop("vertical", None)   # radial members take their levels from the setout table
    S["plank_types"] = [{"id": "PK1", "width": rec(600.0), "depth": rec(700.0), "topping": rec(True), "voids": {"rows": []}}]
    S["supert_types"] = []
    S["members"] = []
    items = []
    for k in range(npl):
        ch = 400.0 + 0.877 * k
        th = b0 + math.degrees((ch - ch0) / Rr) + 90.0
        gid = f"PL-{k + 1:02d}"
        S["members"].append({"id": gid, "type_ref": rec("PK1"), "setout_ch": rec(ch), "setout_bearing": rec(th), "setout_to_A": rec(8.85), "setout_to_B": rec(9.85),
                             "bearing_offset_A": rec(75.0), "bearing_offset_B": rec(75.0), "level_A": rec(8.984), "level_B": rec(8.984 - 0.02 * 18.7)})
        for sid, rl in (("A", "fixed"), ("B", "free")):
            items.append({"id": f"{sid}-{gid}", "support": rec(sid), "member": rec(gid), "restraint_longitudinal": rec(rl), "restraint_transverse": rec("fixed")})
    d["bearings"]["items"] = items
    row = copy.deepcopy(d["materials"]["concrete"]["rows"][0]); row["cells"]["element"] = "Planks"; row["original"]["cells"]["element"] = "Planks"
    d["materials"]["concrete"]["rows"].append(row)
    return d


if __name__ == "__main__":
    d = radial_doc()
    geo = build_geometry(d, allow_proposed=True)
    S = build_sections(d, geo, allow_proposed=True)
    B = build_superstructure(d, geo, S, allow_proposed=True)
    m = B["model"]
    roles = {}
    for x in B["members"]:
        roles[x["role"]] = roles.get(x["role"], 0) + 1
    npl, nst = 7, B["settings"]["stations"]
    t("radial grillage: one line per plank + two deck-edge lines, slab strips between facing stations, end / support lines",
      roles.get("girder") == npl * (nst + 1) and roles.get("slab") == (npl - 1) * (nst - 2) + 2 * nst and roles.get("deck_end") == 2 * (npl - 1) + 4 and roles.get("edge") == 2 * (nst + 1) and roles.get("cross_girder") == 2 * (npl - 1),
      str(roles))
    g0 = geo["girders"][3]
    seq = [k for k, v in B["nodes"].items() if v["line"] == g0["id"]]
    ze = [B["nodes"][k]["Z"] - B["nodes"][k]["x"] * (-0.02) for k in seq]
    t("node levels: setout level (plank soffit) + plank depth, falling 2 % along the plank", max(ze) - min(ze) < 1e-9 and abs(ze[0] - (8.984 + 0.7 + B["node_above_girder_top"])) < 1e-9,
      f"{ze[0]:.4f}")
    r = m.solve()
    W = sum(b["w"] * np.linalg.norm(m.nodes[b["n1"]] - m.nodes[b["n2"]]) for b in m.beams.values())
    Rz = sum(v[2] for v in r["reactions"].values())
    t("self weight: bearing reactions = member weights", abs(Rz - W) < 1e-6 * W, f"{Rz:.2f} vs {W:.2f}")
    # each plank carries about its own weight (fan: wider strips at A); middle plank reaction close to wL/2 per end
    mids = [b for b in B["bearings"].values() if b["girder"] == g0["id"]]
    tot = sum(r["reactions"][b["ground"]][2] for b in mids)
    Wg = sum(x["w"] * np.linalg.norm(m.nodes[x["n1"]] - m.nodes[x["n2"]]) for x in B["members"] if x["role"] == "girder" and x["line"] == g0["id"])
    t("middle plank: its two bearings carry its own weight within 10 % (little transverse sharing under uniform load)", abs(tot - Wg) < 0.1 * Wg, f"{tot:.1f} vs {Wg:.1f} kN")
    lw = [b["w"] for b in B["members"] if b["role"] == "girder" and b["line"] == g0["id"]]
    t("fan: the plank's deck strip (and weight per m) is wider at end A than at end B", lw[1] > lw[-2], f"{lw[1]:.3f} vs {lw[-2]:.3f} kN/m")
    # stage 4b-3: integrated model on the curved (polyline) supports, integral abutments with backfill springs
    from pdf2bim.model.substructure import build_integrated
    from standards.accessor import Standards
    br = copy.deepcopy(d["bearings"]["items"])
    tpl = json.load(open(os.path.join(R_, "projects", "BR13A", "BR13A.bridge.0.2.json")))
    b0r = tpl["bearings"]["items"][0]
    for it in d["bearings"]["items"]:
        for k_ in ("type", "plan_a", "plan_b", "elastomer_thickness", "shear_modulus", "layer_thickness", "bearing_height"):
            it[k_] = copy.deepcopy(b0r[k_])
        it["seat_rl"] = rec((8.984 if it["support"]["value"] == "A" else 8.984 - 0.02 * 18.7) - 0.05)
        it.pop("top_rl", None)
    hd = 1.2
    for sp_, gs in zip(d["supports"], geo["supports"]):
        pl = np.array(gs["polyline"]); Ltot = float(np.hypot(*np.diff(pl, axis=0).T).sum())
        sp_["kind"] = rec("integral abutment"); sp_["abutment_spring"] = rec(1.0e4)
        sp_["headstock_setout"] = tab([{"edge": "front", "value": 600}, {"edge": "back", "value": -600}, {"edge": "start", "value": -500}, {"edge": "end", "value": Ltot * 1000 + 500}])
        sp_["headstock"] = tab([{"width": 1200, "depth": hd * 1000, "length": None, "rl_top": None, "rl_soffit": None}])
        lvl = 8.984 if sp_["id"] == "A" else 8.984 - 0.02 * 18.7
        sp_["piles"] = [{"id": f"{sp_['id']}{j}", "E": rec(float(pl[i][0])), "N": rec(float(pl[i][1])), "diameter": rec(900.0), "rl_top": rec(lvl - 0.05 - hd),
                         "rl_rock": rec(lvl - 12.0), "rl_toe": rec(lvl - 16.0), "ground_rl": rec(lvl - 0.05 - hd)} for j, i in enumerate((0, 3, 6))]
        sp_["soil_layers"] = {"rows": []}
        bf = sp_["backfill"]["rows"][0]; bf["cells"]["retained_height"] = 2.0; bf["original"]["cells"]["retained_height"] = 2.0
    MI = build_integrated(d, geo, S, Standards(), allow_proposed=True)
    mi = MI["model"]
    ri = mi.solve()
    Wi = sum(b["w"] * np.linalg.norm(mi.nodes[b["n1"]] - mi.nodes[b["n2"]]) for b in mi.beams.values())
    t("integrated on curved supports: builds, self weight = reactions (piles, sills, planks)", abs(sum(v[2] for v in ri["reactions"].values()) - Wi) < 1e-6 * Wi,
      f"{sum(v[2] for v in ri['reactions'].values()):.1f} vs {Wi:.1f}")
    sA = MI["supports"][geo["supports"][0]["id"]]
    plA = np.array(geo["supports"][0]["polyline"])
    dist = []
    for k_ in sA["sill_nodes"]:
        q = mi.nodes[k_][:2]
        dist.append(min(abs(cross2(plA[i + 1] - plA[i], q - plA[i]) / np.linalg.norm(plA[i + 1] - plA[i])) for i in range(len(plA) - 1)))
    t("sill on the curved headstock: every sill node on the member-end polyline (centroid offset 0), integral links, a spring per sill node",
      max(dist) < 1e-6 and all(L["role"] != "bearing" for L in mi.links.values()) and len(sA["abutment_springs"]) == len(sA["sill_nodes"]), f"{max(dist):.2e} m")
    ang = []
    for q in sA["abutment_springs"]:
        ax0 = mi.links[q["link"]]["R"][0][:2]
        k_ = q["node"]; P = mi.nodes[k_][:2]
        i = min(range(len(plA) - 1), key=lambda i: abs(cross2(plA[i + 1] - plA[i], P - plA[i]) / np.linalg.norm(plA[i + 1] - plA[i])) + 1e3 * (
            max(0.0, -np.dot(P - plA[i], plA[i + 1] - plA[i])) + max(0.0, np.dot(P - plA[i + 1], plA[i + 1] - plA[i]))))
        tt = (plA[i + 1] - plA[i]) / np.linalg.norm(plA[i + 1] - plA[i])
        ang.append(abs(np.dot(ax0, tt)))
    t("backfill springs act square to the local headstock segment", max(ang) < 1e-9, f"{max(ang):.2e}")
    # stage 4b-4: all primitive load cases and the combinations on the radial integrated model
    from pdf2bim.model.combinations import combined_actions
    from pdf2bim.model.wind import wind_cases
    CA = combined_actions(d, geo, S, MI, Standards(), allow_proposed=True)
    t("combined actions on the radial model: every term analysed (traffic, SDL, thermal, wind, EQ, earth pressure ...)",
      not CA["missing_terms"] and {a_ for a_, _ in CA["not_combined"]} <= {"PED", "FLH", "COLX"}, str(CA["not_combined"]))
    W = wind_cases(d, geo, S, MI, allow_proposed=True)
    ec = [v["ch"] for v in MI["nodes"].values() if v.get("role") == "edge"]
    FT = sum(np.linalg.norm(f[:2]) for f in W["cases"]["WT+"]["loads"].values())
    t("radial wind: transverse wind total = wT x deck length along the control line (edge-line chainage range)", abs(FT - W["values"]["wT"] * (max(ec) - min(ec))) < 1e-9 * FT,
      f"{FT:.3f} vs {W['values']['wT'] * (max(ec) - min(ec)):.3f} kN")
    Fv = sum(f[2] for f in W["cases"]["WVU+"]["loads"].values())
    t("radial wind: vertical wind total = wV x deck length", abs(Fv - W["values"]["wV"] * (max(ec) - min(ec))) < 1e-9 * abs(Fv))
    # stage 4b-5: plank design along a radial plank (RC, then prestressed) from these combined actions
    from pdf2bim.design.plank_design import plank_checks
    T_ = d["superstructure"]["plank_types"][0]
    T_["bars"] = tab([{"y": 55.0, "diameter": 20.0, "number": 4}, {"y": 850.0, "diameter": 16.0, "number": 4}])
    T_["fitments"] = tab([{"from": 0.0, "to": 19.0, "diameter": 12.0, "legs": 2, "spacing": 150.0}])
    gl = geo["girders"][3]["id"]
    ne = sum(1 for x in MI["members"] if x["role"] == "girder" and x["line"] == gl)
    PC = plank_checks(d, geo, S, CA, MI, Standards(), gl, allow_proposed=True)
    t("RC plank checks along a radial plank: every element end, flexure / SLS / shear / interface", len(PC["rows"]) == 2 * ne and all("u" in r["shear"] for r in PC["rows"]),
      str({k: round(v, 2) for k, v in PC["governing"].items()}))
    T_["strand_pattern"] = tab([{"y": y, "x": -225.0 + 50 * k, "diameter": 15.2, "debond_left": 0.0, "debond_right": 0.0, "on": True} for y in (55.0, 105.0) for k in (0, 1, 8, 9)])
    for k_, v_ in (("jacking_ratio", 0.75), ("age_at_transfer", 3.0), ("age_deck_cast", 60.0), ("concrete_transfer", 35.0), ("concrete_28d", 50.0)):
        T_[k_] = rec(v_)
    PP = plank_checks(d, geo, S, CA, MI, Standards(), gl, allow_proposed=True)
    t("prestressed plank checks on the radial plank (losses on its chord): phi Mu above the RC plank's", PP["prestressed"] and PP["phiMu_sag"] > PC["phiMu_sag"],
      f"{PP['phiMu_sag']:.0f} vs {PC['phiMu_sag']:.0f} kNm")
    try:   # independent engine on the radial model (ADR-087), when PyNite is installed
        sys.path.insert(0, os.path.join(R_, "tests", "verification"))
        from pynite_model import convert, displacements, euler_copy
        me = euler_copy(m)
        ro = me.solve()
        P = convert(me); P.analyze_linear(check_statics=False, check_stability=False)
        up = displacements(P, me)
        du = max(np.abs(up[k][:3] - ro["u"][k][:3]).max() for k in up); um = max(np.abs(ro["u"][k][:3]).max() for k in up)
        t("radial grillage solved by PyNite: displacements agree within 0.01 % of the largest", du < 1e-4 * um, f"{du:.2e} of {um:.2e} m")
    except ImportError:
        print("SKIP PyNite cross-check (pip install PyniteFEA)")
    print(f"\n{sum(res)} passed, {len(res) - sum(res)} failed")
    sys.exit(0 if all(res) else 1)
