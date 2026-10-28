"""Integrated bridge model: superstructure (P3a) + bearings + sill beams + piles + soil / rock springs (stage P3b).

    from pdf2bim.model.substructure import build_integrated
    mdl = build_integrated(doc, geo, S, std, allow_proposed=False)
    mdl['model'] -> pdf2bim.model.solver.Model (kN, m; MGA plan coordinates, RL levels)

Per support (supports[], with geometry support_lines from P1):
- SILL BEAM (headstock): a straight line of beam elements parallel to the line of bearings, at the centroid of its plan
  setout (supports[].headstock_setout: front / back faces square to the line of bearings, start / end along it, from the
  support setout point SOP). Level: the sill SOFFIT is the least-squares straight line through the pile-head RLs
  (supports[].piles[].rl_top) along the line of bearings; centroid = soffit + depth / 2. Section b x d from
  supports[].headstock (b = front - back of the setout; checked against headstock.width). Nodes at the sill ends, at every
  pile and at every bearing (projected onto the sill line), so nothing is quantised to a mesh.
- PILES: vertical columns from rl_top to rl_toe at the pile (E, N); circular D. Split at the rock level (rl_rock), the
  ground level at the pile (ground_rl, capped at the column head), every soil-layer top, then into pieces of about
  analysis.column_segment (dashboard rule: one piece if shorter than 1.5 segments, else ceil(length / segment)).
- SPRINGS (global X and Y at each pile node): rock below rl_rock k = rock_kh * D * tributary length; soil layers between
  the ground and rl_rock k = kh * D * tributary length (tributary = half the distance to each neighbouring node, clipped to
  the layer); times analysis.soil_factor. Same rule as the dashboard (src/sub.js S.build).
- PILE TOE: analysis.pile_toe: "vertical only" (Z fixed; lateral by the springs) or "fixed".
- BEARINGS: seat node at bearings.items[].seat_rl (or top_rl - bearing_height) under the bearing centre (P1); bearing-top node at the girder soffit
  (girder line node level - girder depth D); a vertical elastic link seat -> top, local z along the girder chord,
  y across: vertical Kv, along / across from restraint_* (fixed = analysis.bearing_fixed_stiffness, free = 0,
  elastic = Ks), rotations free. Kv / Ks: pdf2bim.model.bearings (standards coefficients, UNVERIFIED).
- RIGID OFFSETS (Model, massless, sill section x 1e3): sill centroid -> pile head, sill centroid -> bearing seat,
  girder line node -> bearing top.
Not modelled (reported in mdl['not_modelled']): curtain wall, wingwalls, lateral restraint blocks, backfill / earth
pressure (load cases), access slab.
"""
import math
import numpy as np
from ..description import Reader, MissingInput
from .builder import build_superstructure, RIGID, _rect_J
from .bearings import elastomer_stiffness

SUB0 = 200000          # node / member id offset of the substructure
PILE_ASHEAR = 0.9      # circular section shear area factor (as the frozen model: Asy = Asz = 0.9 A) — Model


class _Inputs:
    """Reads values through the description Reader and records path, value and tag of every input used."""

    def __init__(self, rd):
        self.rd, self.used = rd, []

    def v(self, rec, path, required=True):
        val = self.rd.value(rec, path, required=required)
        if val is not None:
            self.used.append({"path": path, "value": val, "tag": (rec or {}).get("tag")})
        return val

    def rows(self, table, path, required=True):
        out = self.rd.rows(table, path, required=required)
        for i, r in enumerate((table or {}).get("rows", [])[:len(out)]):
            self.used.append({"path": f"{path}.rows[{i}]", "value": r.get("cells"), "tag": r.get("tag")})
        return out


def _material(rd, doc, *words, table="concrete"):
    """First row of materials.<table> whose element mentions one of the words (in the order given)."""
    rows = rd.rows((doc.get("materials") or {}).get(table), f"materials.{table}")
    for w in words:
        for r in rows:
            if w in str(r.get("element", "")).lower():
                for k in ("E", "density") if table == "concrete" else ("Es", "density"):
                    if r.get(k) is None:
                        raise MissingInput(f"materials.{table}[{r.get('element')}].{k} missing")
                return r
    raise MissingInput(f"materials.{table}: no row whose element mentions {' / '.join(map(repr, words))}")


def _pile_section(D, t, Ec, dens_c, steel):
    # D m, t mm, Ec MPa (as materials.steel Es), dens kN/m3
    """Solid concrete pile (t None) or concrete-filled steel tube, transformed to the pile concrete (Ec): uncracked,
    full bond (Model). Returns the section (shape carries the area / inertia scale on the gross circle, for the MCT) and the weight per metre."""
    A0, I0 = math.pi * D * D / 4, math.pi * D ** 4 / 64
    if not t:
        sec, w = {"A": A0, "Iy": I0, "Iz": I0, "J": 2 * I0}, A0 * dens_c
    else:
        d = D - 2 * t / 1000
        Ac, Ic = math.pi * d * d / 4, math.pi * d ** 4 / 64
        n = float(steel["Es"]) / Ec
        A, I = Ac + n * (A0 - Ac), Ic + n * (I0 - Ic)
        sec, w = {"A": A, "Iy": I, "Iz": I, "J": 2 * I}, Ac * dens_c + (A0 - Ac) * float(steel["density"])
    sec.update(Asy=PILE_ASHEAR * sec["A"], Asz=PILE_ASHEAR * sec["A"])
    sec["shape"] = ("circle", D) if not t else ("circle", D, round(sec["A"] / A0, 6), round(sec["Iy"] / I0, 6))
    return sec, w


def _pile_levels(top, toe, cuts, seg):
    """Node levels of one pile column, top -> toe. cuts: levels that must be nodes, highest priority first."""
    ts = [top, toe]
    for z in cuts:                       # in priority order (rock level first): a cut within 50 mm of a kept level is dropped
        if toe + 0.05 < z < top - 0.05 and all(abs(z - x) > 0.05 for x in ts):
            ts.append(z)
    ts.sort(reverse=True)
    out = [ts[0]]
    for a, b in zip(ts, ts[1:]):
        L = a - b
        n = 1 if L < 1.5 * seg else math.ceil(L / seg)
        out += [a - L * i / n for i in range(1, n + 1)]
    return out


def _overlap(lo, hi, a, b):
    return max(0.0, min(hi, b) - max(lo, a))


def build_integrated(doc, geo, S, std, allow_proposed=False, spacing=None):
    rd = Reader(doc, allow_proposed)
    inp = _Inputs(rd)
    sup = build_superstructure(doc, geo, S, allow_proposed=allow_proposed, spacing=spacing, bearings="none", rd=rd)
    mdl, nodes = sup["model"], sup["nodes"]
    A_ = doc.get("analysis") or {}
    kfix = inp.v(A_.get("bearing_fixed_stiffness"), "analysis.bearing_fixed_stiffness")
    toe_mode = inp.v(A_.get("pile_toe"), "analysis.pile_toe")
    seg = inp.v(A_.get("column_segment"), "analysis.column_segment")
    fac = inp.v(A_.get("soil_factor"), "analysis.soil_factor")
    toe_dofs = {"vertical only": "001000", "fixed": "111111"}.get(str(toe_mode).strip().lower())
    if toe_dofs is None:
        raise MissingInput(f"analysis.pile_toe: {toe_mode!r} not one of 'vertical only', 'fixed'")
    mat = _material(rd, doc, "headstock", "sill", "abutment", "pile")          # sill concrete
    Es, dens = float(mat["E"]) * 1000, float(mat["density"])   # kPa, kN/m3
    pmat = _material(rd, doc, "pile")                                          # pile concrete (infill of a steel tube)
    Ep, dens_p = float(pmat["E"]) * 1000, float(pmat["density"])
    nu = 0.2
    items = {b["id"]: b for b in (doc.get("bearings") or {}).get("items") or []}
    dsup = {s["id"]: s for s in doc.get("supports") or []}
    gsup = {s["id"]: s for s in geo["supports"]}

    nid, mid = [SUB0], [SUB0]
    members, springs, checks, recs = [], [], [], {"supports": {}, "bearings": {}}

    def node(E, N, Z, role, **meta):
        nid[0] += 1
        mdl.node(nid[0], E, N, Z)
        nodes[nid[0]] = {"E": E, "N": N, "Z": Z, "role": role, **meta}
        return nid[0]

    def beam(n1, n2, role, sec, w=0.0, E=None, **meta):
        mid[0] += 1
        Ex = E if E is not None else Es
        mdl.beam(mid[0], n1, n2, Ex, nu, sec["A"], sec["Iy"], sec["Iz"], sec["J"], sec.get("Asy"), sec.get("Asz"), w=w, role=role)
        members.append({"id": mid[0], "n1": n1, "n2": n2, "role": role, "w": w, "E": Ex, **{k: sec[k] for k in ("A", "Iy", "Iz", "J")},
                        "Asy": sec.get("Asy"), "Asz": sec.get("Asz"), "shape": sec.get("shape"), **meta})
        return mid[0]

    for sid, gs in gsup.items():
        ds = dsup.get(sid)
        if ds is None:
            raise MissingInput(f"supports: no support {sid!r}")
        P0 = np.array([gs["E"], gs["N"]])
        u = np.array([math.sin(math.radians(gs["bearing"])), math.cos(math.radians(gs["bearing"]))])
        nR = np.array([u[1], -u[0]])
        other = next(v for k, v in gsup.items() if k != sid)
        vs = nR * (1.0 if np.dot(np.array([other["E"], other["N"]]) - P0, nR) > 0 else -1.0)   # toward the span
        so = {r["edge"]: float(r["value"]) / 1000 for r in inp.rows(ds.get("headstock_setout"), f"supports[{sid}].headstock_setout")}
        for e in ("front", "back", "start", "end"):
            if e not in so:
                raise MissingInput(f"supports[{sid}].headstock_setout: edge {e!r} missing")
        hs = inp.rows(ds.get("headstock"), f"supports[{sid}].headstock")[0]
        d = float(hs["depth"]) / 1000
        b = so["front"] - so["back"]
        if hs.get("width") is not None:
            checks.append({"id": f"{sid}: sill width (setout front - back) vs headstock.width", "model": b * 1000, "description": float(hs["width"]),
                           "diff_mm": b * 1000 - float(hs["width"]), "ok": abs(b * 1000 - float(hs["width"])) <= 1.0})
        c = (so["front"] + so["back"]) / 2
        # piles
        piles = []
        for p in ds.get("piles") or []:
            pid = p.get("id")
            q = {k: inp.v(p.get(k), f"supports[{sid}].piles[{pid}].{k}") for k in ("E", "N", "diameter", "rl_top", "rl_rock", "rl_toe")}
            q["ground"] = inp.v(p.get("ground_rl"), f"supports[{sid}].piles[{pid}].ground_rl", required=False)
            q["t"] = inp.v(p.get("wall_thickness"), f"supports[{sid}].piles[{pid}].wall_thickness", required=False)
            q["id"] = pid
            rel = np.array([q["E"], q["N"]]) - P0
            q["u"], q["v"] = float(rel @ u), float(rel @ vs)
            piles.append(q)
        if not piles:
            raise MissingInput(f"supports[{sid}].piles: none")
        # sill soffit line through the pile heads (least squares)
        U = np.array([p["u"] for p in piles]); Z = np.array([p["rl_top"] for p in piles])
        if len(piles) >= 2 and np.ptp(U) > 0.1:
            slope, z0 = np.polyfit(U, Z, 1)
        else:
            slope, z0 = 0.0, float(Z.mean())
        soffit = lambda uu: z0 + slope * uu
        res = Z - soffit(U)
        checks.append({"id": f"{sid}: pile heads on one straight sill soffit (max residual)", "model": float(np.abs(res).max()) * 1000, "description": 0.0,
                       "diff_mm": float(np.abs(res).max()) * 1000, "ok": float(np.abs(res).max()) <= 0.010})
        off = max(abs(p["v"] - c) + p["diameter"] / 2000 for p in piles)        # piles are linked to the sill centroid by rigid arms: any position inside the sill works
        checks.append({"id": f"{sid}: piles inside the sill width (max pile edge from the sill centre)", "model": off * 1000, "description": b / 2 * 1000,
                       "diff_mm": (off - b / 2) * 1000, "ok": off <= b / 2 + 1e-6})
        # bearings at this support
        brgs = [(bid, bb) for bid, bb in sup["bearings"].items() if bb["support"] == sid]
        bu = {}
        for bid, bb in brgs:
            n = nodes[bb["node"]]
            bu[bid] = float((np.array([n["E"], n["N"]]) - P0) @ u)
        # sill nodes
        stations = {so["start"]: ("end_start", None), so["end"]: ("end_end", None)}
        for p in piles:
            stations[p["u"]] = ("pile", p["id"])
        for bid, uu in bu.items():
            stations.setdefault(uu, ("bearing", bid))
        keys = sorted(stations)
        merged = []
        for k in keys:
            if merged and k - merged[-1][0] < 0.001:
                merged[-1][1].append(stations[k])
            else:
                merged.append([k, [stations[k]]])
        if keys[0] < so["start"] - 1e-6 or keys[-1] > so["end"] + 1e-6:
            raise MissingInput(f"supports[{sid}]: a pile or bearing lies outside the sill ends ({so['start']:.3f} .. {so['end']:.3f} m)")
        sill_at, sill_nodes = {}, []
        for uu, labs in merged:
            Pp = P0 + uu * u + c * vs
            k = node(float(Pp[0]), float(Pp[1]), soffit(uu) + d / 2, "sill", support=sid, u=uu)
            sill_nodes.append(k)
            for lab in labs:
                if lab[1] is not None:
                    sill_at[lab] = k            # keyed (kind, id): pile and bearing ids may coincide (e.g. both A-01)
        Asb = b * d
        sec_sb = {"A": Asb, "Iy": b * d ** 3 / 12, "Iz": d * b ** 3 / 12, "J": _rect_J(b, d), "Asy": Asb * 5 / 6, "Asz": Asb * 5 / 6, "shape": ("rect", d, b)}
        rig = {k: v * RIGID for k, v in sec_sb.items() if k in ("A", "Iy", "Iz", "J")}
        rig.update({"Asy": None, "Asz": None})
        for a, bnode in zip(sill_nodes, sill_nodes[1:]):
            beam(a, bnode, "sill", sec_sb, w=Asb * dens, support=sid)
        # piles
        prec = []
        for p in piles:
            D = p["diameter"] / 1000
            head = node(p["E"], p["N"], p["rl_top"], "pile_head", support=sid, pile=p["id"])
            beam(sill_at[("pile", p["id"])], head, "rigid_sill_pile", rig, support=sid, pile=p["id"])
            ground = p["rl_top"] if p["ground"] is None else min(p["ground"], p["rl_top"])
            rock = p["rl_rock"]
            layers_in = inp.rows(ds.get("soil_layers"), f"supports[{sid}].soil_layers", required=False)
            layers = []
            for j, L in enumerate(layers_in):
                top = ground if j == 0 else (None if L.get("rl_top") is None else min(float(L["rl_top"]), ground))
                if top is None:
                    continue
                layers.append({"j": j, "name": L.get("name"), "top": top, "kh": float(L.get("kh") or 0)})
            for i, L in enumerate(layers):
                L["bot"] = max(rock, layers[i + 1]["top"]) if i + 1 < len(layers) else rock
            layers = [L for L in layers if L["top"] > L["bot"] + 1e-6]
            khr = inp.v(ds.get("rock_kh"), f"supports[{sid}].rock_kh")
            zs = _pile_levels(p["rl_top"], p["rl_toe"], [rock, ground] + [L["top"] for L in layers] + [L["bot"] for L in layers], seg)
            chain = [head] + [node(p["E"], p["N"], z, "pile", support=sid, pile=p["id"]) for z in zs[1:]]
            sec_p, wp = _pile_section(D, p["t"], Ep / 1000, dens_p, _material(rd, doc, "pile", table="steel") if p["t"] else None)
            for a, bnode in zip(chain, chain[1:]):
                beam(a, bnode, "pile", sec_p, w=wp, support=sid, pile=p["id"], E=Ep)
            mdl.fix(chain[-1], toe_dofs)
            sp = []
            for i, (n, z) in enumerate(zip(chain, zs)):
                up = zs[i - 1] if i > 0 else z
                dn = zs[i + 1] if i + 1 < len(zs) else z
                lo, hi = (z + dn) / 2, (z + up) / 2
                k = khr * 1000 * fac * D * _overlap(lo, hi, -1e9, rock)
                kind = "rock"
                for L in layers:
                    kl = L["kh"] * 1000 * fac * D * _overlap(lo, hi, L["bot"], L["top"])
                    if kl > 0:
                        sp.append({"node": n, "z": z, "k": kl, "kind": f"soil L{L['j'] + 1}"})
                if k > 0:
                    sp.append({"node": n, "z": z, "k": k, "kind": kind})
            for s_ in sp:
                mdl.spring(s_["node"], (s_["k"], s_["k"], 0, 0, 0, 0))
            springs += [dict(s_, support=sid, pile=p["id"]) for s_ in sp]
            prec.append({"id": p["id"], "head": head, "toe": chain[-1], "chain": chain, "levels": zs, "D": D, "rock": rock, "ground": ground,
                         "layers": layers, "u": p["u"], "v": p["v"], "rock_kh": khr})
        # bearings
        for bid, bb in brgs:
            it = items[bid]
            n = nodes[bb["node"]]
            top_rl = inp.v(it.get("top_rl"), f"bearings.items[{bid}].top_rl", required=False)
            seat_rl = inp.v(it.get("seat_rl"), f"bearings.items[{bid}].seat_rl", required=top_rl is None)   # a Missing record counts as not given
            if seat_rl is None:                           # seat from the top-of-bearing level and the bearing unit height
                bh = inp.v(it.get("bearing_height"), f"bearings.items[{bid}].bearing_height (needed with top_rl when seat_rl is not given)")
                seat_rl = top_rl - bh / 1000
            Dg = S["girders"][bb["girder"]]["params"]["D"] / 1000
            top_z = n["Z"] - sup["node_above_girder_top"] - Dg
            hgt = inp.v(it.get("height"), f"bearings.items[{bid}].height", required=False)
            seat = node(n["E"], n["N"], seat_rl, "bearing_seat", support=sid, bearing=bid)
            top = node(n["E"], n["N"], top_z, "bearing_top", support=sid, bearing=bid)
            beam(sill_at[("bearing", bid)], seat, "rigid_sill_seat", rig, support=sid, bearing=bid)
            beam(bb["node"], top, "rigid_girder_bearing", rig, support=sid, bearing=bid)
            ks = elastomer_stiffness(it, rd, std)
            for f, val in ks["inputs"].items():
                inp.used.append({"path": f"bearings.items[{bid}].{f}", "value": val, "tag": ks["tags"][f]})
            kd = {"fixed": kfix, "free": 0.0, "elastic": ks["Ks"]}
            for r in (bb["longitudinal"], bb["transverse"]):
                if r not in kd:
                    raise MissingInput(f"bearings.items[{bid}]: restraint {r!r} not one of fixed / free / elastic")
            t = bb["unit_t"]
            beta = math.degrees(math.atan2(t[1], t[0]))
            lid = len(mdl.links) + 1
            mdl.link(lid, seat, top, (ks["Kv"], kd[bb["transverse"]], kd[bb["longitudinal"]], 0, 0, 0), beta=beta, dry=0.5, drz=0.5, role="bearing")
            gap = top_z - seat_rl
            recs["bearings"][bid] = {"link": lid, "seat": seat, "top": top, "girder_node": bb["node"], "support": sid, "girder": bb["girder"],
                                     "longitudinal": bb["longitudinal"], "transverse": bb["transverse"], "Kv": ks["Kv"], "Ks": ks["Ks"],
                                     "k_along": kd[bb["longitudinal"]], "k_across": kd[bb["transverse"]], "beta": beta,
                                     "seat_rl": seat_rl, "soffit_rl": top_z, "gap_m": gap, "height_input_m": None if hgt is None else hgt / 1000,
                                     "u": bu[bid], "stiffness": ks}
            if top_rl is not None:
                checks.append({"id": f"{bid}: top of bearing below the girder soffit (attachment plate + epoxy block)", "model": (top_z - top_rl) * 1000, "description": None,
                               "diff_mm": None, "ok": top_z - top_rl >= 0})
            if hgt is not None and top_rl is None:          # with a top-of-bearing level the seat comes from it (the old height check is superseded)
                checks.append({"id": f"{bid}: seat RL + bearings.height vs girder soffit", "model": gap * 1000, "description": hgt,
                               "diff_mm": gap * 1000 - hgt, "ok": abs(gap * 1000 - hgt) <= 10.0})
        recs["supports"][sid] = {"sill_nodes": sill_nodes, "sill": {"b": b, "d": d, "centroid_offset": c, "start": so["start"], "end": so["end"],
                                                                     "soffit_z0": float(z0), "soffit_slope": float(slope)},
                                 "piles": prec}
    return {"format": "pdf2bim.model/0.1", "kind": "integrated", "model": mdl, "nodes": nodes, "members": sup["members"] + members,
            "superstructure_members": len(sup["members"]), "node_above_girder_top": sup["node_above_girder_top"], "bearings": recs["bearings"], "supports": recs["supports"], "springs": springs,
            "checks": checks, "inputs": inp.used, "settings": dict(sup["settings"], bearing_fixed_stiffness=kfix, pile_toe=toe_mode,
                                                                    column_segment=seg, soil_factor=fac, pile_shear_area_factor=PILE_ASHEAR),
            "standards_status": std.result_status(), "standards_used": std.usage(), "provisional": rd.provisional,
            "not_modelled": ["curtain wall (weight and stiffness)", "wingwalls", "lateral restraint blocks", "backfill / earth pressure (load cases)",
                             "access / approach slab"]}


def pile_head_stiffness(mdl, pile, include_soil=True):
    """Lateral stiffness (kN/m) of ONE pile column alone, free head, unit horizontal force at the head (X).
    Builds a separate model from the pile chain of an integrated model record."""
    from .solver import Model
    m0 = mdl["model"]
    m = Model()
    for n in pile["chain"]:
        m.node(n, *m0.nodes[n])
    ch = set(pile["chain"])
    for i, b in m0.beams.items():
        if b["n1"] in ch and b["n2"] in ch:
            m.beam(i, b["n1"], b["n2"], b["E"], 0.2, b["A"], b["Iy"], b["Iz"], b["J"], b["Asy"], b["Asz"], w=0.0)
    for n in pile["chain"]:
        if n in m0.springs:
            k = np.array(m0.springs[n])
            if not include_soil:
                k = sum((np.array([s["k"], s["k"], 0, 0, 0, 0]) for s in mdl["springs"] if s["node"] == n and s["kind"] == "rock"), np.zeros(6))
            if k.any():
                m.spring(n, k)
    m.fix(pile["toe"], "001000")
    m.fix(pile["head"], "000001")   # torsion about the pile axis only
    m.load(pile["head"], (1.0, 0, 0, 0, 0, 0))
    r = m.solve(gravity=(0, 0, 0))
    return 1.0 / r["u"][pile["head"]][0]


def hetenyi_head_stiffness(EI, k, Lc):
    """Hand check (Hetenyi, semi-infinite beam on elastic foundation k = kh D, free head) with a cantilever column of
    length Lc above it: unit horizontal force at the column head. Returns kN/m and beta."""
    b = (k / (4 * EI)) ** 0.25
    H, M0 = 1.0, Lc
    d0 = 2 * H * b / k + 2 * M0 * b * b / k
    t0 = 2 * H * b * b / k + 4 * M0 * b ** 3 / k
    d = d0 + t0 * Lc + H * Lc ** 3 / (3 * EI)
    return 1.0 / d, b
