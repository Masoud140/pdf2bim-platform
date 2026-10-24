"""Superstructure grillage model from the bridge description + P1 geometry + P2 sections (stage P3a).

    from pdf2bim.model.builder import build_superstructure
    mdl = build_superstructure(doc, geo, sections, allow_proposed=False)
    mdl['model']  -> pdf2bim.model.solver.Model (kN, m; MGA plan coordinates, RL levels)
    mdl['nodes'], mdl['members'] -> records with stable ids and ROLES (girder, web, edge, midgap, slab, rigid, outrigger,
                                    cross_girder, deck_end, bearing)

Topology = the dashboard's "Super-T model 2" (engineer-confirmed, D-15), generalised to STRAIGHT girder chords (ADR-003):
- longitudinal lines: deck edges (offset curves); per girder its chord and two web lines (chord +- web offset, the web
  centreline at the girder top, as the dashboard); mid-gap lines between neighbouring web / edge lines wider than 0.4 m;
- transverse lines: normal to the control line at uniform chainage spacing (grillage target spacing), clipped to the deck
  between the two deck-end lines; plus the two support lines and the two deck-end lines (skewed);
- nodes: every line x transverse-line intersection; girder lines also at the girder ends, bearing centres and
  solid-zone boundaries (P2 zones), so section changes fall on nodes (lesson: no mesh quantisation);
- members: girder (P2 composite / solid-end section by segment midpoint, weight from GROSS girder + deck area);
  web / edge / mid-gap longitudinal dummies (girder-alone x 1e-3, massless); deck strips between lines outside the girder
  zone (b x t, b = tributary width along the deck, weight 0 — the deck weight is inside the composite girders);
  rigid members inside the girder zone and outriggers from girder to web nodes (girder-alone x 1e3, massless);
  cross girders on the support lines (superstructure.cross_girders, keep weight); deck-end-line dummies;
- bearings: a node on the girder chord at the bearing centre, supported through a zero-length link to ground in
  chord axes (along / across / vertical): fixed = 1e9 kN/m, free = 0, from bearings.items[*].restraint_*.
Modelling constants used (dummy x 1e-3, rigid x 1e3, fixed 1e9, mid-gap 0.4 m) reproduce the dashboard's choices and are
reported in mdl['settings'] (tag Model). Missing inputs stop the build with the field name.
"""
import math
import numpy as np
from ..description import Reader, MissingInput
from .solver import Model

DUMMY, RIGID, KFIX, MIDGAP_MIN = 1e-3, 1e3, 1e9, 0.4


def _grillage_setting(rd, doc, item):
    rows = rd.rows(((doc.get("analysis") or {}).get("grillage")), "analysis.grillage")
    for r in rows:
        if r.get("item") == item:
            return float(r["value"])
    raise MissingInput(f"analysis.grillage: setting {item!r} missing")


def _interp_station(stations, t, key):
    """Linear interpolation of a station property dict at chord parameter t (clamped to 0..1)."""
    t = min(1.0, max(0.0, t))
    ts = [s["t"] for s in stations]
    for i in range(len(ts) - 1):
        if ts[i] - 1e-12 <= t <= ts[i + 1] + 1e-12:
            f = (t - ts[i]) / (ts[i + 1] - ts[i])
            a, b = stations[i][key], stations[i + 1][key]
            return {k: a[k] + f * (b[k] - a[k]) for k in a}
    return dict(stations[-1][key])


def _line_line(P, d, Q, e):
    """Intersection of P + s d and Q + u e (2D). Returns (s, u) or None."""
    den = d[0] * e[1] - d[1] * e[0]
    if abs(den) < 1e-14:
        return None
    w = (Q[0] - P[0], Q[1] - P[1])
    return (w[0] * e[1] - w[1] * e[0]) / den, (w[0] * d[1] - w[1] * d[0]) / den


def build_superstructure(doc, geo, S, allow_proposed=False, spacing=None, bearings="ground", rd=None):
    """bearings = "ground": each bearing node is supported by a zero-length link to ground (P3a, superstructure alone);
    bearings = "none": no bearing supports are added (the caller attaches the substructure, P3b).
    rd: an existing description Reader to share (so provisional uses are listed once)."""
    rd = rd or Reader(doc, allow_proposed)
    al = geo["_alignment"]
    D = doc.get("deck") or {}
    SS = doc.get("superstructure") or {}
    tgt = spacing or _grillage_setting(rd, doc, "tgt")
    midgap = _grillage_setting(rd, doc, "midgap")
    mtype = _grillage_setting(rd, doc, "model")
    if int(round(mtype)) != 2:
        raise MissingInput("analysis.grillage.model: only model 2 (girder + web lines, engineer-confirmed) is implemented")
    tD = rd.value(D.get("slab_thickness"), "deck.slab_thickness") / 1000
    surf = rd.value(D.get("surfacing_thickness"), "deck.surfacing_thickness", required=False)
    surf = (surf or 0) / 1000
    xf = rd.rows((doc.get("alignment") or {}).get("crossfall"), "alignment.crossfall")[0]
    Eg, Ed = S["E_girder_MPa"] * 1000, S["E_deck_MPa"] * 1000  # kPa = kN/m2
    mats = {r.get("element", "").lower(): r for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete")}
    dens_g = next(float(r["density"]) for k, r in mats.items() if "super-t" in k)
    dens_d = next(float(r["density"]) for k, r in mats.items() if "deck" in k)
    nu = 0.2
    xg_rows = rd.rows(SS.get("cross_girders"), "superstructure.cross_girders")
    xg = {r["support"]: r for r in xg_rows}
    eL, eR = geo["deck"]["edge_left_offset"], geo["deck"]["edge_right_offset"]
    girders = geo["girders"]
    sup = {s["id"]: dict(s, u=(math.sin(math.radians(s["bearing"])), math.cos(math.radians(s["bearing"])))) for s in geo["supports"]}
    sA, sB = geo["supports"][0]["id"], geo["supports"][-1]["id"]

    def hxf(o):
        hc = lambda x: -((xf["left"] if x < xf["crown_offset"] else xf["right"]) / 100) * abs(x - xf["crown_offset"])
        return hc(o) - hc(0)

    def z_at(E, N, chg):
        ch, o = al.station(E, N, guess=chg)
        return al.vertical.rl(ch) + hxf(o) - surf - tD, ch, o

    # ---- deck-end lines: through the girder ends, parallel to the support line (Calculated) ----
    ends = {}
    for sid, key in ((sA, "end_A"), (sB, "end_B")):
        pts = [(g[key]["E"], g[key]["N"]) for g in girders]
        u = (math.sin(math.radians(sup[sid]["bearing"])), math.cos(math.radians(sup[sid]["bearing"])))
        offs = [(p[0] - pts[0][0]) * u[1] - (p[1] - pts[0][1]) * u[0] for p in pts]
        if max(abs(o) for o in offs) > 0.02:
            raise MissingInput(f"girder ends at support {sid} are not on one line parallel to the support line (spread {max(abs(o) for o in offs):.3f} m); deck end line undefined")
        ends[sid] = {"P": (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)), "u": u}

    # ---- longitudinal lines (as 2D line objects or offset curves) ----
    p0 = S["girders"][girders[0]["id"]]["params"]
    th = p0["tw"] * math.sqrt(1 + 1 / p0["S"] ** 2)
    W = (p0["bw"] / 2 + p0["D"] / p0["S"] - th / 2) / 1000  # web centreline at the girder top (dashboard P.web)
    lines = [{"id": "EDGE_L", "role": "edge", "kind": "curve", "o": eL}]
    for g in girders:
        A_, B_ = (g["bearing_A"]["E"], g["bearing_A"]["N"]), (g["bearing_B"]["E"], g["bearing_B"]["N"])
        t = g["unit_t"]; nR = (t[1], -t[0])
        for sfx, off, role in (("W1", -W, "web"), ("", 0.0, "girder"), ("W2", W, "web")):
            lines.append({"id": g["id"] + sfx, "role": role, "kind": "line", "P": (A_[0] + off * nR[0], A_[1] + off * nR[1]), "d": t, "girder": g["id"]})
    lines.append({"id": "EDGE_R", "role": "edge", "kind": "curve", "o": eR})

    def line_point_on(ln, P, n):
        """Intersection of a longitudinal line with the line P + s n. Returns the point."""
        if ln["kind"] == "curve":
            return None
        r = _line_line(P, n, ln["P"], ln["d"])
        return None if r is None else (P[0] + r[0] * n[0], P[1] + r[0] * n[1])

    def side_of_end(Pt, sid):
        e = ends[sid]
        return (Pt[0] - e["P"][0]) * e["u"][1] - (Pt[1] - e["P"][1]) * e["u"][0]

    sgnA = side_of_end((sup[sB]["E"], sup[sB]["N"]), sA)  # interior side of end line A
    sgnB = side_of_end((sup[sA]["E"], sup[sA]["N"]), sB)
    inside = lambda Pt: side_of_end(Pt, sA) * sgnA >= -1e-9 and side_of_end(Pt, sB) * sgnB >= -1e-9

    # ---- cross lines: uniform transverse stations + support lines + deck-end lines ----
    chs = [al.station(*ends[sA]["P"], guess=sup[sA]["ch"])[0], al.station(*ends[sB]["P"], guess=sup[sB]["ch"])[0]]
    # extent of the deck along the control line, over the full width (skewed ends)
    ext = []
    for sid in (sA, sB):
        for o in (eL, eR):
            e = ends[sid]
            Pt = _line_curve(al, e["P"], e["u"], o, sup[sid]["ch"])
            ext.append(al.station(*Pt, guess=sup[sid]["ch"])[0])
    lo, hi = min(ext), max(ext)
    nst = max(2, int(round((hi - lo) / tgt)))
    step = (hi - lo) / nst
    cross = []
    for i in range(nst + 1):
        c = lo + i * step
        E0, N0, b = al.point(c)
        br = math.radians(b)
        cross.append({"id": f"T{i:02d}", "kind": "transverse", "P": (E0, N0), "n": (math.cos(br), -math.sin(br)), "ch": c})
    for sid in (sA, sB):
        s = sup[sid]
        cross.append({"id": f"SUP_{sid}", "kind": "support", "P": (s["E"], s["N"]), "n": s["u"], "support": sid})
        cross.append({"id": f"END_{sid}", "kind": "deck_end", "P": ends[sid]["P"], "n": ends[sid]["u"], "support": sid})

    # ---- intersections: nodes ----
    nodes, by_line = {}, {ln["id"]: [] for ln in lines}
    nid = [0]

    def new_node(E, N, chg, role, line, cross_id, meta=None):
        for k, v in nodes.items():
            if abs(v["E"] - E) < 1e-6 and abs(v["N"] - N) < 1e-6:
                return k
        nid[0] += 1
        z, ch, o = z_at(E, N, chg)
        nodes[nid[0]] = {"id": nid[0], "E": E, "N": N, "Z": z, "ch": ch, "o": o, "role": role, "line": line, "cross": cross_id, **(meta or {})}
        return nid[0]

    girder_ids = {g["id"] for g in girders}
    gby = {g["id"]: g for g in girders}
    # special girder points: ends, bearings, zone boundaries (positions along the chord from end A)
    special = {}
    for g in girders:
        Pe = (g["end_A"]["E"], g["end_A"]["N"]); t = g["unit_t"]
        bo_a = math.hypot(g["bearing_A"]["E"] - Pe[0], g["bearing_A"]["N"] - Pe[1])
        pts = {0.0: "end_A", bo_a: "bearing_A", bo_a + g["chord_length_bearings"]: "bearing_B", g["length_end_to_end"]: "end_B"}
        for z in S["girders"][g["id"]]["zones"]:
            for x in (z["from_end_A"], z["to_end_A"]):
                if all(abs(x - k) > 1e-6 for k in pts):
                    pts[x] = "zone_boundary"
        special[g["id"]] = {x: (Pe[0] + x * t[0], Pe[1] + x * t[1], lab) for x, lab in pts.items()}

    merge = _grillage_setting(rd, doc, "merge")
    cross_nodes = {c["id"]: [] for c in cross}
    for ln in lines:
        ln_nodes = []
        if ln["role"] == "girder":
            g = gby[ln["id"]]
            for x, (E, N, lab) in special[ln["id"]].items():
                k = new_node(E, N, g["bearing_A"]["ch"], "girder", ln["id"], None, {"special": lab, "x": x})
                ln_nodes.append((x, k))
                if lab.startswith("bearing"):
                    sid = sA if lab == "bearing_A" else sB
                    cross_nodes[f"SUP_{sid}"].append((None, k))
                if lab.startswith("end"):
                    sid = sA if lab == "end_A" else sB
                    cross_nodes[f"END_{sid}"].append((None, k))
        for c in cross:
            if ln["role"] == "girder" and c["kind"] != "transverse":
                continue  # girder line already has its bearing / end nodes on the support / end lines
            if ln["kind"] == "curve":
                if c["kind"] == "transverse":
                    E, N, _ = al.point(c["ch"], ln["o"])
                else:
                    E, N = _line_curve(al, c["P"], c["n"], ln["o"], sup[c["support"]]["ch"])
                Pt = (E, N)
            else:
                Pt = line_point_on(ln, c["P"], c["n"])
                if Pt is None:
                    continue
            if not inside(Pt) and c["kind"] == "transverse":
                continue
            if ln["role"] == "girder":
                g = gby[ln["id"]]
                x = (Pt[0] - g["end_A"]["E"]) * g["unit_t"][0] + (Pt[1] - g["end_A"]["N"]) * g["unit_t"][1]
                if x < -1e-6 or x > g["length_end_to_end"] + 1e-6:
                    continue
                near = [k for xx, k in ln_nodes if abs(xx - x) < merge]
                if near:  # transverse station within merge distance of a special point: use that node
                    cross_nodes[c["id"]].append((None, near[0]))
                    continue
                k = new_node(Pt[0], Pt[1], al.station(*Pt, guess=c.get("ch", g["bearing_A"]["ch"]))[0], "girder", ln["id"], c["id"], {"x": x})
                ln_nodes.append((x, k))
            else:
                k = new_node(Pt[0], Pt[1], c.get("ch") or sup[c["support"]]["ch"], ln["role"], ln["id"], c["id"])
                d0 = ln.get("d") or (lambda b: (math.sin(math.radians(b)), math.cos(math.radians(b))))(al.point(nodes[k]["ch"])[2])
                ln_nodes.append(((Pt[0] - lines[0].get("P", Pt)[0]) * 0 + nodes[k]["ch"], k))
            cross_nodes[c["id"]].append((None, k))
        by_line[ln["id"]] = ln_nodes

    # mid-gap lines: midpoints between consecutive non-girder-zone lines along each cross line
    order = [ln["id"] for ln in lines]
    mids = []
    if midgap:
        for c in cross:
            cn = [k for _, k in cross_nodes[c["id"]]]
            pos = {}
            for k in cn:
                pos[nodes[k]["line"]] = k
            seq = [pos[l] for l in order if l in pos]
            for a, b in zip(seq, seq[1:]):
                la, lb = nodes[a]["line"], nodes[b]["line"]
                ra, rb = nodes[a]["role"], nodes[b]["role"]
                if (ra in ("web", "edge") and rb in ("web", "edge")) and not (ra == "web" and rb == "web" and la[:-2] == lb[:-2]):
                    gapw = math.hypot(nodes[b]["E"] - nodes[a]["E"], nodes[b]["N"] - nodes[a]["N"])
                    if gapw > MIDGAP_MIN:
                        Em, Nm = (nodes[a]["E"] + nodes[b]["E"]) / 2, (nodes[a]["N"] + nodes[b]["N"]) / 2
                        k = new_node(Em, Nm, nodes[a]["ch"], "midgap", f"S_{la}_{lb}", c["id"])
                        cross_nodes[c["id"]].append((None, k))
                        by_line.setdefault(f"S_{la}_{lb}", []).append((nodes[k]["ch"], k))
                        mids.append(k)

    # ---- members ----
    mdl = Model()
    for k, v in nodes.items():
        mdl.node(k, v["E"], v["N"], v["Z"])
    members = []
    mid_ = [0]

    def add(n1, n2, role, sec, w=0.0, E=None, line=None):
        if n1 == n2:
            return
        mid_[0] += 1
        Ex = E if E is not None else Ed
        mdl.beam(mid_[0], n1, n2, Ex, nu, sec["A"], sec["Iy"], sec["Iz"], sec["J"], sec.get("Asy"), sec.get("Asz"), w=w, role=role)
        members.append({"id": mid_[0], "n1": n1, "n2": n2, "role": role, "line": line, "A": sec["A"], "Iy": sec["Iy"], "Iz": sec["Iz"], "J": sec["J"], "w": w, "E": Ex,
                        "Asy": sec.get("Asy"), "Asz": sec.get("Asz"), "shape": sec.get("shape")})

    # girder + girder-alone (for dummies / rigid) per girder
    galone = {}
    for g in girders:
        Sg = S["girders"][g["id"]]
        st = Sg["stations"]
        mid_st = _interp_station(st, 0.5, "girder")
        galone[g["id"]] = {"A": mid_st["A"] / 1e6, "Iy": mid_st["Ix"] / 1e12, "Iz": mid_st["Iy"] / 1e12, "J": mid_st["J"] / 1e12}
        p = Sg["params"]
        th_ = p["tw"] * math.sqrt(1 + 1 / p["S"] ** 2)
        Asz = 2 * th_ * ((p["D"] - p["ttf"]) - (p["d2"] + p["d1"])) / 1e6   # webs only (lesson: never bottom width x depth)
        seq = sorted(by_line[g["id"]])
        bo_a = [x for x, (E, N, lab) in special[g["id"]].items() if lab == "bearing_A"][0]
        for (x1, n1), (x2, n2) in zip(seq, seq[1:]):
            xm = (x1 + x2) / 2
            zone = next((z for z in Sg["zones"] if z["kind"] == "solid" and z["from_end_A"] - 1e-9 <= xm <= z["to_end_A"] + 1e-9), None)
            if zone:
                se = Sg["solid_end"][zone["end"]]
                C, Gg = se["composite"], se["girder"]
                gross = Gg["A"] / 1e6 + (se["deck_left"] + se["deck_right"]) / 1000 * tD
                asz = (Gg["A"] * 5 / 6) / 1e6
            else:
                tt = (xm - bo_a) / g["chord_length_bearings"]
                C = _interp_station(st, tt, "composite")
                Gg = _interp_station(st, tt, "girder")
                dw = _interp_station([{"t": s["t"], "d": {"w": (s["deck_left"] + s["deck_right"]) / 1000}} for s in st], tt, "d")["w"]
                gross = Gg["A"] / 1e6 + dw * tD
                asz = Asz
            sec = {"A": C["A_transformed"] / 1e6, "Iy": C["Ix"] / 1e12, "Iz": C["Iy"] / 1e12, "J": C["J_geometric"] / 1e12, "Asy": None, "Asz": asz}
            add(n1, n2, "girder", sec, w=gross * dens_g, E=Eg, line=g["id"])

    dummy_of = lambda gid: {k: v * DUMMY for k, v in galone[gid].items()}
    rigid_of = lambda gid: {k: v * RIGID for k, v in galone[gid].items()}
    any_g = girders[0]["id"]
    for lid, seq in by_line.items():
        role = "girder" if lid in girder_ids else None
        if role:
            continue
        r = next((ln["role"] for ln in lines if ln["id"] == lid), "midgap")
        gid = lid[:-2] if r == "web" else any_g
        seq = sorted(seq)
        for (c1, n1), (c2, n2) in zip(seq, seq[1:]):
            add(n1, n2, r, dummy_of(gid), line=lid)

    # transverse / support / deck-end members along each cross line
    zone_of = {}
    for g in girders:
        zone_of[g["id"]] = (g["id"] + "W1", g["id"], g["id"] + "W2")
    for c in cross:
        cn = sorted({k for _, k in cross_nodes[c["id"]]}, key=lambda k: (nodes[k]["E"] - c["P"][0]) * c["n"][0] + (nodes[k]["N"] - c["P"][1]) * c["n"][1])
        for a, b in zip(cn, cn[1:]):
            la, lb = nodes[a]["line"], nodes[b]["line"]
            in_zone = any({la, lb} <= set(z) for z in zone_of.values())
            if c["kind"] == "support":
                r = xg[c["support"]]
                bw_, h_ = r["width"] / 1000, r["depth"] / 1000
                A = bw_ * h_
                sec = {"A": A, "Iy": bw_ * h_ ** 3 / 12, "Iz": h_ * bw_ ** 3 / 12, "J": _rect_J(bw_, h_), "Asy": A * 5 / 6, "Asz": A * 5 / 6, "shape": ("rect", h_, bw_)}
                add(a, b, "cross_girder", sec, w=A * dens_d, line=c["id"])
            elif c["kind"] == "deck_end":
                add(a, b, "deck_end", dummy_of(any_g), line=c["id"])
            elif in_zone:
                gid = next(g for g, z in zone_of.items() if {la, lb} <= set(z))
                add(a, b, "rigid", rigid_of(gid), line=c["id"])
            else:
                bt = _tributary(c, cross, step)
                sec = {"A": bt * tD, "Iy": bt * tD ** 3 / 12, "Iz": tD * bt ** 3 / 12, "J": _rect_J(bt, tD), "Asy": bt * tD * 5 / 6, "Asz": bt * tD * 5 / 6, "shape": ("rect", tD, bt)}
                add(a, b, "slab", sec, line=c["id"])
    # outriggers at girder special nodes that are not on a cross line (zone boundaries): none needed (girder line only)

    # ---- bearings: zero-length links to ground in chord axes ----
    bear = {}
    items = (doc.get("bearings") or {}).get("items") or []
    for g in girders:
        for lab, sid in (("bearing_A", sA), ("bearing_B", sB)):
            k = next(kk for xx, kk in by_line[g["id"]] if nodes[kk].get("special") == lab)
            it = next((b for b in items if rd.value(b.get("support"), f"bearings[{b['id']}].support") == sid and rd.value(b.get("member"), f"bearings[{b['id']}].member") == g["id"]), None)
            if it is None:
                raise MissingInput(f"bearings.items: no bearing for {sid}-{g['id']}")
            rl = rd.value(it.get("restraint_longitudinal"), f"bearings[{it['id']}].restraint_longitudinal")
            rt = rd.value(it.get("restraint_transverse"), f"bearings[{it['id']}].restraint_transverse")
            if bearings == "none":
                bear[it["id"]] = {"node": k, "ground": None, "longitudinal": rl, "transverse": rt, "support": sid, "girder": g["id"], "unit_t": tuple(g["unit_t"])}
                continue
            kk_ = []
            for r in (rl, rt):
                if r == "fixed":
                    kk_.append(KFIX)
                elif r == "free":
                    kk_.append(0.0)
                else:
                    raise MissingInput(f"bearings[{it['id']}]: restraint {r!r} needs a stiffness (elastic bearings: P3b)")
            t = g["unit_t"]
            axes_ = np.array([[t[0], t[1], 0.0], [-t[1], t[0], 0.0], [0.0, 0.0, 1.0]])
            gnode = 100000 + len(bear) + 1
            mdl.node(gnode, nodes[k]["E"], nodes[k]["N"], nodes[k]["Z"])
            mdl.fix(gnode, "111111")
            mdl.link(len(bear) + 1, gnode, k, (kk_[0], kk_[1], KFIX, 0, 0, 0), axes=axes_, role="bearing")
            bear[it["id"]] = {"node": k, "ground": gnode, "longitudinal": rl, "transverse": rt, "support": sid, "girder": g["id"], "unit_t": tuple(g["unit_t"])}

    return {"format": "pdf2bim.model/0.1", "model": mdl, "nodes": nodes, "members": members, "bearings": bear,
            "settings": {"transverse_spacing_target": tgt, "transverse_step": step, "stations": nst + 1, "midgap": midgap, "web_offset_m": W,
                         "dummy_factor": DUMMY, "rigid_factor": RIGID, "fixed_stiffness": KFIX, "midgap_min_m": MIDGAP_MIN, "merge_m": merge, "tag": "Model"},
            "provisional": rd.provisional}


def _line_curve(al, P, u, o, ch_guess, smax=12.0):
    """Point where the straight line P + s u crosses the offset curve o (station offset = o). Scan + bisection."""
    f = lambda s: al.station(P[0] + s * u[0], P[1] + s * u[1], guess=ch_guess)[1] - o
    ss = [(-smax + 2 * smax * i / 48) for i in range(49)]
    fs = [f(x) for x in ss]
    best = None
    for i in range(48):
        if fs[i] == 0 or fs[i] * fs[i + 1] < 0:
            a, b, fa = ss[i], ss[i + 1], fs[i]
            for _ in range(80):
                m = (a + b) / 2; fm = f(m)
                if fa * fm <= 0:
                    b = m
                else:
                    a, fa = m, fm
                if b - a < 1e-10:
                    break
            r = (a + b) / 2
            if best is None or abs(r) < abs(best):
                best = r
    if best is None:
        raise MissingInput(f"line does not cross the offset curve {o} within {smax} m")
    return P[0] + best * u[0], P[1] + best * u[1]


def _rect_J(b, t):
    a, c = max(b, t), min(b, t)
    return a * c ** 3 * (1 / 3 - 0.21 * (c / a) * (1 - c ** 4 / (12 * a ** 4)))


def _tributary(c, cross, step):
    """Orthogonal tributary width of a transverse line: the uniform step (interior); half-step at the first / last
    station. (Per-element tributary to the skewed deck end — MEMBER_PROPERTIES_METHOD Stage A — is a P3 refinement.)"""
    tr = [x for x in cross if x["kind"] == "transverse"]
    if c is tr[0] or c is tr[-1]:
        return step / 2
    return step
