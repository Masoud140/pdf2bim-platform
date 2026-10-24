"""Imposed-strain load cases on the integrated model (stage P3c): uniform temperature, temperature gradient,
shrinkage + creep shortening. kN, m.

    from pdf2bim.model.thermal import thermal_cases
    C = thermal_cases(doc, geo, S, mdl, allow_proposed=False)
    r = mdl['model'].solve(gravity=(0, 0, 0), loads={}, imposed=C['cases']['TU+']['imposed'])

As the dashboard (src/sub3.js tmRun, src/sub7.js tgImposed), generalised:
- SUPERSTRUCTURE = every beam connected to the girder members without crossing a bearing link (girders, webs, deck
  strips, cross girders, dummies, rigid offsets down to the bearing tops). Sill beams and piles are not heated [Model].
- Uniform temperature TU+ / TU-: dT = T_max - T_set / T_min - T_set (loads.temperature), axial free strain alpha * dT on
  every superstructure beam.
- Shrinkage + creep shortening SCR: axial free strain -eps (loads.shrinkage_creep_shortening, 1e-6) on every
  superstructure beam.
- Gradient TGP / TGN: the profile (loads.gradient_positive / negative: depth below the top of the deck concrete, dT; 0
  outside the defined depths, as the dashboard) integrated EXACTLY over each composite girder element's own section
  (P2 girder outline + deck slab, E-weighted, at the element midpoint): free axial strain e0 = N / EA and free curvature
  phi = M / EI (+ = strain increasing upwards, top hotter), imposed on that element. Polygons are cut into horizontal
  bands at the profile breakpoints; within a band dT is linear in y, so the polygon moments give the integrals exactly.
Free displacements of an element (local, node 1 held): u[6] = e0 L, u[8] = -phi L^2 / 2, u[10] = phi L.
All inputs here are description values (they may be Assumed placeholders); alpha from loads.temperature.
"""
import math
import numpy as np
from ..description import Reader, MissingInput
from ..sections.polygon import raw
from ..sections.supert import supert_section


def superstructure_beams(mdl):
    m = mdl["model"]
    by = {}
    for eid, b in m.beams.items():
        by.setdefault(b["n1"], []).append(eid); by.setdefault(b["n2"], []).append(eid)
    seed = [x["id"] for x in mdl["members"] if x["role"] == "girder"]
    seen, st = set(seed), list(seed)
    while st:
        e = st.pop()
        b = m.beams[e]
        for n in (b["n1"], b["n2"]):
            for q in by.get(n, []):
                if q not in seen:
                    seen.add(q); st.append(q)
    return seen


def _band(pts, lo, hi):
    """Part of polygon pts with lo <= y <= hi (Sutherland-Hodgman against two horizontal lines)."""
    def clip(P, keep, cut):
        out = []
        for i in range(len(P)):
            A, B = P[i], P[(i + 1) % len(P)]
            ka, kb = keep(A), keep(B)
            if ka:
                out.append(A)
            if ka != kb:
                t = (cut - A[1]) / (B[1] - A[1])
                out.append((A[0] + t * (B[0] - A[0]), cut))
        return out
    P = clip(pts, lambda p: p[1] >= lo, lo)
    return clip(P, lambda p: p[1] <= hi, hi) if P else []


def free_strain(parts, profile, alpha, y_top):
    """parts: [(polygon in mm, E)], profile: [(depth mm, dT)] sorted, alpha 1/C, y_top: top of the deck concrete (mm).
    Returns e0 (-), phi (1/m, + top hotter), and the section sums."""
    EA = ESy = 0.0
    for pts, E in parts:
        r = raw(pts); EA += E * r["A"]; ESy += E * r["Sx"]
    yc = ESy / EA
    EI = N = Mt = 0.0
    for pts, E in parts:
        r = raw(pts); EI += E * (r["Ixx"] - 2 * yc * r["Sx"] + yc * yc * r["A"])
        for (d0, t0), (d1, t1) in zip(profile, profile[1:]):
            hi, lo = y_top - d0, y_top - d1          # band in y (d down from the top)
            if hi - lo <= 0:
                continue
            Q = _band(pts, lo, hi)
            if len(Q) < 3:
                continue
            q = raw(Q)
            # dT(y) linear: t0 at y = hi, t1 at y = lo -> dT = a + b y
            b = (t0 - t1) / (hi - lo); a = t0 - b * hi
            iT = a * q["A"] + b * q["Sx"]                     # integral of dT dA
            iTy = a * q["Sx"] + b * q["Ixx"]                  # integral of dT y dA
            N += E * alpha * iT
            Mt += E * alpha * (iTy - yc * iT)
    return {"e0": N / EA, "phi": Mt / EI * 1000.0, "yc": yc, "EA": EA, "EI": EI, "N": N, "M": Mt}


def _profile(rd, recs, path):
    rows = rd.rows(recs, path)
    pts = sorted((float(r["depth"]), float(r["dT"])) for r in rows)
    if len(pts) < 2:
        raise MissingInput(f"{path}: needs at least two (depth, dT) rows")
    return pts


def _temperature(rd, doc):
    rows = {r["item"]: float(r["value"]) for r in rd.rows((doc.get("loads") or {}).get("temperature"), "loads.temperature")}
    for k in ("T_max", "T_min", "T_set", "alpha"):
        if k not in rows:
            raise MissingInput(f"loads.temperature: item {k!r} missing")
    return rows


def _element_station(mdl, S, eid):
    """(girder id, P2 station dict at the element midpoint (widths interpolated), solid-end key or None)."""
    mem = next(x for x in mdl["members"] if x["id"] == eid)
    gid = mem["line"]
    nodes = mdl["nodes"]
    xm = (nodes[mem["n1"]].get("x", 0.0) + nodes[mem["n2"]].get("x", 0.0)) / 2
    G = S["girders"][gid]
    zone = next((z for z in G["zones"] if z["kind"] == "solid" and z["from_end_A"] - 1e-9 <= xm <= z["to_end_A"] + 1e-9), None)
    if zone:
        return gid, G["solid_end"][zone["end"]], zone["end"]
    L = G["length_end_to_end"]
    st = G["stations"]
    ba = next(v.get("x") for k, v in nodes.items() if v.get("line") == gid and v.get("special") == "bearing_A")
    bb = next(v.get("x") for k, v in nodes.items() if v.get("line") == gid and v.get("special") == "bearing_B")
    t = min(1.0, max(0.0, (xm - ba) / (bb - ba)))
    ts = [s["t"] for s in st]
    i = max(j for j in range(len(ts)) if ts[j] <= t + 1e-12) if t > ts[0] else 0
    i = min(i, len(ts) - 2)
    f = (t - ts[i]) / (ts[i + 1] - ts[i])
    keys = ("w_left", "w_right", "deck_left", "deck_right")
    return gid, {k: st[i][k] + f * (st[i + 1][k] - st[i][k]) for k in keys}, None


def thermal_cases(doc, geo, S, mdl, allow_proposed=False):
    rd = Reader(doc, allow_proposed)
    Ld = doc.get("loads") or {}
    T = _temperature(rd, doc)
    alpha = T["alpha"]
    eps = rd.value(Ld.get("shrinkage_creep_shortening"), "loads.shrinkage_creep_shortening") * 1e-6
    prof = {"TGP": _profile(rd, Ld.get("gradient_positive"), "loads.gradient_positive"),
            "TGN": _profile(rd, Ld.get("gradient_negative"), "loads.gradient_negative")}
    tD = rd.value((doc.get("deck") or {}).get("slab_thickness"), "deck.slab_thickness")
    m = mdl["model"]
    sup = superstructure_beams(mdl)
    cases = {}
    for cid, dT in (("TU+", T["T_max"] - T["T_set"]), ("TU-", T["T_min"] - T["T_set"])):
        imp = {}
        for e in sup:
            u = np.zeros(12)
            L = float(np.linalg.norm(m.nodes[m.beams[e]["n2"]] - m.nodes[m.beams[e]["n1"]]))
            u[6] = alpha * dT * L
            imp[e] = u
        cases[cid] = {"kind": "uniform temperature", "dT": dT, "alpha": alpha, "imposed": imp}
    imp = {}
    for e in sup:
        L = float(np.linalg.norm(m.nodes[m.beams[e]["n2"]] - m.nodes[m.beams[e]["n1"]]))
        u = np.zeros(12); u[6] = -eps * L
        imp[e] = u
    cases["SCR"] = {"kind": "shrinkage + creep shortening", "strain": -eps, "imposed": imp}
    Eg, Ed = S["E_girder_MPa"], S["E_deck_MPa"]
    cache, sect = {}, {}
    for cid in ("TGP", "TGN"):
        imp = {}
        for x in mdl["members"]:
            if x["role"] != "girder":
                continue
            gid, st, solid = _element_station(mdl, S, x["id"])
            G = S["girders"][gid]
            p = G["params"]
            key = (gid, solid, tuple(round(st[k], 1) for k in ("w_left", "w_right", "deck_left", "deck_right")), cid)
            if key not in cache:
                gs = supert_section(p, st["w_left"], st["w_right"], "solid" if solid else "open")
                y0 = p["D"] + G["haunch"]
                deck = [(-st["deck_left"], y0), (st["deck_right"], y0), (st["deck_right"], y0 + tD), (-st["deck_left"], y0 + tD)]
                parts = [(gs["outline"], Eg), (deck, Ed)]
                if G["haunch"] > 0:
                    th = gs.get("trough_half_top") or p["bw"] / 2
                    parts.append(([(-th, p["D"]), (th, p["D"]), (th, y0), (-th, y0)], Ed))
                cache[key] = free_strain(parts, prof[cid], alpha, y0 + tD)
            fs = cache[key]
            b = m.beams[x["id"]]
            L = float(np.linalg.norm(m.nodes[b["n2"]] - m.nodes[b["n1"]]))
            u = np.zeros(12); u[6] = fs["e0"] * L; u[8] = -fs["phi"] * L * L / 2; u[10] = fs["phi"] * L
            imp[x["id"]] = u
            sect.setdefault(cid, {})[x["id"]] = fs
        cases[cid] = {"kind": "temperature gradient", "profile": prof[cid], "alpha": alpha, "imposed": imp, "free": sect[cid]}
    return {"cases": cases, "superstructure_beams": len(sup), "inputs": {"temperature": T, "shrinkage_strain": eps, "profiles": prof},
            "provisional": rd.provisional + list(mdl.get("provisional") or [])}
