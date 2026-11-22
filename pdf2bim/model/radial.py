"""Grillage of a radial / fanned plank deck (ADR-086 stage 4b-2), e.g. SB43: geometry from build_geometry's radial mode.
Same return structure as builder.build_superstructure (which calls this when geo["radial"]).

- One longitudinal line per member (plank) with nodes at its ends, bearings and n equal stations between the bearings
  (the same n on every member, so station i of neighbouring members face each other across the fan);
- plank members: the P2 composite section (plank + its deck strip), weight from the gross plank + strip, Asz 5/6 A
  (ADR-085 shortcut);
- transverse slab strips between station i of neighbouring members: b x tD, b = the mean of the two members' tributary
  lengths at that station, J = b tD^3 / 6 (as the builder, ADR-040), weight 0 (the deck weight is in the planks);
- end lines: members' end nodes joined by deck-end dummies, bearing nodes by cross girders (superstructure.cross_girders
  of that support) or dummies when none is given;
- levels: the member's level_A / level_B (setout level, at the plank SOFFIT per the SB43 setout detail) linear along it, plus
  the plank depth (node plane = plank top = deck soffit, Option A), plus tD with the deck-top reference (D-48);
- bearings: zero-length links to ground in member axes, as the builder (bearings.items restraint fields).
Missing levels or bearing items stop the build with the field name.
"""
import math
import numpy as np
from ..description import MissingInput
from .solver import Model
from .builder import _grillage_setting, _interp_station, _rect_J, DUMMY, KFIX


def build_radial(doc, geo, S, rd, spacing=None, bearings="ground"):
    al = geo["_alignment"]
    D = doc.get("deck") or {}
    SS = doc.get("superstructure") or {}
    tgt = spacing or _grillage_setting(rd, doc, "tgt")
    try:
        deck_top = int(round(_grillage_setting(rd, doc, "deck_top_reference"))) == 1
    except MissingInput:
        deck_top = False
    tD = rd.value(D.get("slab_thickness"), "deck.slab_thickness") / 1000
    Eg, Ed = S["E_girder_MPa"] * 1000, S["E_deck_MPa"] * 1000
    mats = {r.get("element", "").lower(): r for r in rd.rows((doc.get("materials") or {}).get("concrete"), "materials.concrete")}
    dens_g = next((float(r["density"]) for k, r in mats.items() if "plank" in k), None)
    if dens_g is None:
        raise MissingInput("materials.concrete: no 'Planks' row (density)")
    nu = 0.2
    xg = {r["support"]: r for r in rd.rows(SS.get("cross_girders"), "superstructure.cross_girders", required=False)}
    girders = geo["girders"]
    sA, sB = geo["supports"][0]["id"], geo["supports"][-1]["id"]
    n = max(2, int(round(max(g["chord_length_bearings"] for g in girders) / tgt)))

    mdl, nodes, members = Model(), {}, []
    lines = {}
    for g in girders:
        Sg = S["girders"][g["id"]]
        if Sg["type"] != "plank":
            raise MissingInput(f"radial decks are implemented for planks only (member {g['id']} is {Sg['type']})")
        lv = g["levels"]
        if lv.get("level_A") is None or lv.get("level_B") is None:
            raise MissingInput(f"superstructure.members[{g['id']}].level_A / level_B (radial members take their levels from the setout table)")
        Pe, t, Lg = (g["end_A"]["E"], g["end_A"]["N"]), g["unit_t"], g["length_end_to_end"]
        boa = math.hypot(g["bearing_A"]["E"] - Pe[0], g["bearing_A"]["N"] - Pe[1])
        xs = [(0.0, "end_A")] if boa > 1e-6 else []
        xs += [(boa + g["chord_length_bearings"] * i / n, {0: "bearing_A", n: "bearing_B"}.get(i, i)) for i in range(n + 1)]
        if Lg - (boa + g["chord_length_bearings"]) > 1e-6:
            xs.append((Lg, "end_B"))
        top = Sg["params"]["depth"] / 1000 + (tD if deck_top else 0.0)
        seq = []
        for x, lab in xs:
            k = len(nodes) + 1
            E, N = Pe[0] + x * t[0], Pe[1] + x * t[1]
            Z = lv["level_A"] + (lv["level_B"] - lv["level_A"]) * x / Lg + top
            ch, o = al.station(E, N, guess=g["setout"]["ch"])
            nodes[k] = {"id": k, "E": E, "N": N, "Z": Z, "ch": ch, "o": o, "role": "girder", "line": g["id"], "x": x,
                        "special": lab if isinstance(lab, str) else None, "station": lab if isinstance(lab, int) else None}
            mdl.node(k, E, N, Z)
            seq.append(k)
        lines[g["id"]] = seq

    def add(n1, n2, role, sec, w=0.0, E=None, line=None, dz=0.0, w_girder=None):
        i = len(members) + 1
        Ex = E if E is not None else Ed
        off = ((0.0, 0.0, dz), (0.0, 0.0, dz)) if deck_top and dz else None
        mdl.beam(i, n1, n2, Ex, nu, sec["A"], sec["Iy"], sec["Iz"], sec["J"], sec.get("Asy"), sec.get("Asz"), w=w, role=role, off=off,
                 **({} if w_girder is None else {"w_girder": w_girder}))
        members.append({"id": i, "n1": n1, "n2": n2, "role": role, "line": line, "A": sec["A"], "Iy": sec["Iy"], "Iz": sec["Iz"], "J": sec["J"],
                        "w": w, "E": Ex, "Asy": sec.get("Asy"), "Asz": sec.get("Asz"), "shape": sec.get("shape"), "off": off})

    galone = {}
    for g in girders:
        Sg, st = S["girders"][g["id"]], S["girders"][g["id"]]["stations"]
        Gm = _interp_station(st, 0.5, "girder")
        galone[g["id"]] = {"A": Gm["A"] / 1e6, "Iy": Gm["Ix"] / 1e12, "Iz": Gm["Iy"] / 1e12, "J": Gm["J"] / 1e12}
        boa = nodes[lines[g["id"]][0]]["x"] if nodes[lines[g["id"]][0]]["special"] == "bearing_A" else \
            next(nodes[k]["x"] for k in lines[g["id"]] if nodes[k]["special"] == "bearing_A")
        for a, b in zip(lines[g["id"]], lines[g["id"]][1:]):
            tt = ((nodes[a]["x"] + nodes[b]["x"]) / 2 - boa) / g["chord_length_bearings"]
            C, Gg = _interp_station(st, tt, "composite"), _interp_station(st, tt, "girder")
            dw = _interp_station([{"t": s["t"], "d": {"w": (s["deck_left"] + s["deck_right"]) / 1000}} for s in st], tt, "d")["w"]
            poly = min(st, key=lambda s_: abs(s_["t"] - tt))
            asz = 5 / 6 * Gg["A"] / 1e6   # shortcut (ADR-085): rectangle rule on the net plank area
            sec = {"A": C["A_transformed"] / 1e6, "Iy": C["Ix"] / 1e12, "Iz": C["Iy"] / 1e12, "J": C["J_geometric"] / 1e12, "Asy": None, "Asz": asz,
                   "shape": ("composite", poly["outline"], poly["deck"], Ed, Gg["J"] / 1e12, asz)}
            topmm = Sg["params"]["depth"] + Sg["haunch"] + tD * 1000
            add(a, b, "girder", sec, w=(Gg["A"] / 1e6 + dw * tD) * dens_g, E=Eg, line=g["id"], dz=(poly["composite"]["yc"] - topmm) / 1000,
                w_girder=Gg["A"] / 1e6 * dens_g)

    # transverse slab strips: station i of neighbouring members
    def trib(seq, j):
        xs_ = [nodes[k]["x"] for k in seq]
        lo = xs_[j - 1] if j > 0 else xs_[j]
        hi = xs_[j + 1] if j + 1 < len(xs_) else xs_[j]
        return (hi - lo) / 2
    for ga, gb in zip(girders, girders[1:]):
        A_, B_ = lines[ga["id"]], lines[gb["id"]]
        ia = {nodes[k]["special"] or nodes[k]["station"]: (j, k) for j, k in enumerate(A_)}
        ib = {nodes[k]["special"] or nodes[k]["station"]: (j, k) for j, k in enumerate(B_)}
        for key in ia:
            if key not in ib:
                continue
            (ja, ka), (jb, kb) = ia[key], ib[key]
            if key in ("end_A", "end_B"):
                add(ka, kb, "deck_end", {k: v * DUMMY for k, v in galone[ga["id"]].items()}, line=f"END_{sA if key == 'end_A' else sB}")
                continue
            if key in ("bearing_A", "bearing_B") and (sA if key == "bearing_A" else sB) in xg:
                r = xg[sA if key == "bearing_A" else sB]
                bw_, h_ = r["width"] / 1000, r["depth"] / 1000
                A = bw_ * h_
                add(ka, kb, "cross_girder", {"A": A, "Iy": bw_ * h_ ** 3 / 12, "Iz": h_ * bw_ ** 3 / 12, "J": _rect_J(bw_, h_), "Asy": A * 5 / 6, "Asz": A * 5 / 6,
                                             "shape": ("rect", h_, bw_)}, w=A * dens_g, line=f"SUP_{sA if key == 'bearing_A' else sB}", dz=-h_ / 2)
                continue
            bt = (trib(A_, ja) + trib(B_, jb)) / 2
            sec = {"A": bt * tD, "Iy": bt * tD ** 3 / 12, "Iz": tD * bt ** 3 / 12, "J": bt * tD ** 3 / 6, "Asy": bt * tD * 5 / 6, "Asz": bt * tD * 5 / 6,
                   "shape": ("rect", tD, bt)}
            add(ka, kb, "slab", sec, line=f"T{key}" if isinstance(key, int) else f"SUP_{key}", dz=-tD / 2)

    bear = {}
    items = (doc.get("bearings") or {}).get("items") or []
    for g in girders:
        for lab, sid in (("bearing_A", sA), ("bearing_B", sB)):
            k = next(kk for kk in lines[g["id"]] if nodes[kk]["special"] == lab)
            it = next((b for b in items if rd.value(b.get("support"), f"bearings[{b['id']}].support") == sid
                       and rd.value(b.get("member"), f"bearings[{b['id']}].member") == g["id"]), None)
            if it is None:
                raise MissingInput(f"bearings.items: no bearing for {sid}-{g['id']}")
            rl = rd.value(it.get("restraint_longitudinal"), f"bearings[{it['id']}].restraint_longitudinal")
            rt = rd.value(it.get("restraint_transverse"), f"bearings[{it['id']}].restraint_transverse")
            rec = {"node": k, "ground": None, "longitudinal": rl, "transverse": rt, "support": sid, "girder": g["id"], "unit_t": tuple(g["unit_t"])}
            if bearings != "none":
                kk_ = []
                for r in (rl, rt):
                    if r not in ("fixed", "free"):
                        raise MissingInput(f"bearings[{it['id']}]: restraint {r!r} needs a stiffness (elastic bearings: P3b)")
                    kk_.append(KFIX if r == "fixed" else 0.0)
                t = g["unit_t"]
                gnode = 100000 + len(bear) + 1
                mdl.node(gnode, nodes[k]["E"], nodes[k]["N"], nodes[k]["Z"])
                mdl.fix(gnode, "111111")
                mdl.link(len(bear) + 1, gnode, k, (kk_[0], kk_[1], KFIX, 0, 0, 0), axes=np.array([[t[0], t[1], 0.0], [-t[1], t[0], 0.0], [0.0, 0.0, 1.0]]),
                         role="bearing")
                rec["ground"] = gnode
            bear[it["id"]] = rec
    return {"format": "pdf2bim.model/0.1", "model": mdl, "nodes": nodes, "members": members, "bearings": bear,
            "node_above_girder_top": tD if deck_top else 0.0,
            "settings": {"radial": True, "deck_top_reference": deck_top, "transverse_spacing_target": tgt, "stations": n + 1, "dummy_factor": DUMMY,
                         "fixed_stiffness": KFIX, "tag": "Model"},
            "provisional": rd.provisional}
