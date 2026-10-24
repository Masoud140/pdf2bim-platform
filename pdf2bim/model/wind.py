"""Wind load cases on the integrated model (stage P3c). kN, m. Characteristic, at the ULS design speed; the SLS and
with-traffic speeds are carried as scale factors (V / V_uls)^2 for the combinations.

    from pdf2bim.model.wind import wind_cases
    W = wind_cases(doc, geo, S, mdl, allow_proposed=False)

As the dashboard (src/sub4.js wdCases), generalised (inputs: loads.wind rows; deck; barriers; P2 girder depth):
- q = 0.5 rho V^2 (kPa); superstructure exposed depth d = girder depth + haunch + slab + barrier height, transverse wind
  wT = q Cd d per metre (WT+ toward +offset, WT- toward -offset), acting at the middle of the exposed depth;
- wind on vehicles WTV+/-: vehicle_line_load at vehicle_height above the road surface (not scaled with V);
- vertical wind WVU+/- (uplift) and WVD+/- (downward): wV = q CL b, b = deck width, at vertical_eccentricity_b x b to
  windward of the deck centre (windward = the -offset side for wind toward +offset);
- longitudinal wind WL+/-: longitudinal_fraction x wT along the alignment tangent, at the superstructure lever.
Distribution: the girder-line nodes, tributary length along each line / number of girder lines; vertical wind shared
over the girder-line nodes (total wV x mean line length) linearly in each node's offset about their TRIBUTARY-WEIGHTED
CENTROID, so the total and the resultant position are exact (the dashboard measures y from the deck centre and ignores the line
lengths: H-7). Horizontal forces carry the
moment of their lever above the NODE LEVEL of the model (the girder top), measured from the model's actual levels.
"""
import math
import numpy as np
from ..description import Reader, MissingInput

ITEMS = ("V_uls", "V_sls", "V_with_traffic", "air_density", "Cd", "CL", "vertical_eccentricity_b", "longitudinal_fraction",
         "vehicle_line_load", "vehicle_height")


def wind_cases(doc, geo, S, mdl, allow_proposed=False, lever_datum="node"):
    """lever_datum = "node" (levers above the model node level = girder top) or "slab_top" (the dashboard's datum, kept
    only to reproduce the dashboard: its levers are measured from the deck top while its nodes are at the girder top, H-6)."""
    rd = Reader(doc, allow_proposed)
    Ld, D = doc.get("loads") or {}, doc.get("deck") or {}
    rows = {r["item"]: float(r["value"]) for r in rd.rows(Ld.get("wind"), "loads.wind")}
    for k in ITEMS:
        if k not in rows:
            raise MissingInput(f"loads.wind: item {k!r} missing")
    tD = rd.value(D.get("slab_thickness"), "deck.slab_thickness") / 1000
    ts = (rd.value(D.get("surfacing_thickness"), "deck.surfacing_thickness", required=False) or 0) / 1000
    hb = [rd.value(b.get("height"), f"deck.barriers[{b.get('id')}].height") / 1000 for b in D.get("barriers") or []]
    if not hb:
        raise MissingInput("deck.barriers: none (barrier height sets the exposed depth)")
    hBar = max(hb)
    gd = max(G["params"]["D"] + G["haunch"] for G in S["girders"].values()) / 1000
    eL_, eR_ = geo["deck"]["edge_left_offset"], geo["deck"]["edge_right_offset"]
    b = eR_ - eL_
    oc = (eL_ + eR_) / 2
    q = 0.5 * rows["air_density"] * rows["V_uls"] ** 2 / 1000
    dExp = gd + tD + hBar
    eSup = (tD + hBar - gd) / 2                 # middle of the exposed depth above the node level (girder top)
    eVeh = tD + ts + rows["vehicle_height"]
    if lever_datum == "slab_top":
        eSup, eVeh = eSup - tD, eVeh - tD
    elif lever_datum != "node":
        raise ValueError(f"lever_datum {lever_datum!r}: 'node' or 'slab_top'")
    wT, wV = q * rows["Cd"] * dExp, q * rows["CL"] * b
    wL = rows["longitudinal_fraction"] * wT
    al = geo["_alignment"]
    nodes = mdl["nodes"]
    lines = {}
    for k, v in nodes.items():
        if v.get("role") == "girder" and v.get("line") is not None and "ch" in v:
            lines.setdefault(v["line"], []).append(k)
    lines = {g: sorted(ks, key=lambda k: nodes[k]["ch"]) for g, ks in lines.items()}
    nG = len(lines)
    trib = {}
    for g, ks in lines.items():
        for i, k in enumerate(ks):
            a = (nodes[k]["ch"] - nodes[ks[i - 1]]["ch"]) / 2 if i > 0 else 0.0
            bb = (nodes[ks[i + 1]]["ch"] - nodes[k]["ch"]) / 2 if i < len(ks) - 1 else 0.0
            trib[k] = a + bb
    St = sum(trib.values())
    Lbar = St / nG                                                             # mean girder-line length
    cg = sum(t * nodes[k]["o"] for k, t in trib.items()) / St                  # tributary-weighted centroid of the girder-line nodes
    Swyy = sum(t * (nodes[k]["o"] - cg) ** 2 for k, t in trib.items())
    C = {k: {} for k in ("WT+", "WT-", "WTV+", "WTV-", "WVU+", "WVU-", "WVD+", "WVD-", "WL+", "WL-")}

    def add(cid, n, f):
        C[cid][n] = C[cid].get(n, np.zeros(6)) + np.asarray(f, float)

    for g, ks in lines.items():
        for i, k in enumerate(ks):
            y = nodes[k]["o"] - cg
            c = nodes[k]["ch"]
            a = (c - nodes[ks[i - 1]]["ch"]) / 2 if i > 0 else 0.0
            bb = (nodes[ks[i + 1]]["ch"] - c) / 2 if i < len(ks) - 1 else 0.0
            t = a + bb
            if t <= 0:
                continue
            br = math.radians(al.point(c)[2])
            s = np.array([math.sin(br), math.cos(br), 0.0]); n = np.array([math.cos(br), -math.sin(br), 0.0])   # tangent, toward +offset
            sh = t / nG
            hz = lambda w, e, d: np.concatenate([w * sh * d, np.cross([0.0, 0.0, e], w * sh * d)])
            add("WT+", k, hz(wT, eSup, n)); add("WT-", k, hz(wT, eSup, -n))
            add("WTV+", k, hz(rows["vehicle_line_load"], eVeh, n)); add("WTV-", k, hz(rows["vehicle_line_load"], eVeh, -n))
            add("WL+", k, hz(wL, eSup, s)); add("WL-", k, hz(wL, eSup, -s))
            for cid, sg, side in (("WVU+", 1, -1), ("WVU-", 1, 1), ("WVD+", -1, -1), ("WVD-", -1, 1)):
                # total wV Lbar with its resultant at oc + side * e b: per metre of line j, uniform part + moment part about the
                # length-weighted centroid of the lines (exact total and resultant position)
                Ftot = wV * Lbar
                Mx = Ftot * (oc + side * rows["vertical_eccentricity_b"] * b - cg)
                f = Ftot / St + (Mx * y / Swyy if Swyy > 0 else 0.0)
                add(cid, k, [0, 0, sg * f * t, 0, 0, 0])
    V = rows["V_uls"]
    return {"cases": {k: {"loads": L} for k, L in C.items()},
            "values": {"q_kPa": q, "exposed_depth": dExp, "lever_super": eSup, "lever_vehicle": eVeh, "wT": wT, "wV": wV, "wL": wL, "b": b,
                       "girder_lines": nG, "node_level": "girder top (model node plane)"},
            "scale": {"sls": (rows["V_sls"] / V) ** 2, "with_traffic": (rows["V_with_traffic"] / V) ** 2,
                      "note": "pressure-proportional cases (WT, WVU, WVD, WL) scale with V^2; the vehicle wind WTV does not"},
            "inputs": rows, "provisional": rd.provisional + list(mdl.get("provisional") or [])}
