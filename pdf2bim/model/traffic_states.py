"""Moving-load states for the app (P9.7): for every girder moment / shear response, bearing reaction, headstock moment and pile-head axial force, the lane
layout, lane ranking and load positions behind the traffic envelope's max and min, plus influence lines along the lane
centres of the governing layout. Uses traffic.governing_state (the engine's own rebuild of an envelope value), so what
the app draws is exactly what the combination used. Output is plain JSON for app/static (traffic.json in the run)."""
import math
import numpy as np
from .traffic import governing_state


def _runs(loads, dc, W):
    """[(ch, o, P)] -> [[o0, o1, P, c0, c1], ...]: equal loads merged into runs along the chainage, then equal runs on
    neighbouring UDL strips merged across the lane (patterned UDL -> one band per run; wheels stay points, o0 == o1)."""
    g = {}
    for c, o, P in loads:
        g.setdefault((round(o, 4), round(P, 4)), []).append(c)
    runs = {}
    for (o, P), cs in g.items():
        cs.sort()
        c0 = cp = cs[0]
        for c in cs[1:] + [None]:
            if c is None or c - cp > 1.5 * dc:
                runs.setdefault((P, round(c0, 2), round(cp, 2)), []).append(o)
                if c is not None:
                    c0 = c
            if c is not None:
                cp = c
    out = []
    for (P, c0, c1), os_ in sorted(runs.items(), key=lambda kv: (-kv[0][0], kv[0][1])):
        os_.sort(); half = W / 16 + 1e-6               # strips are W/8 wide: merge offsets that sit one strip apart
        o0 = op = os_[0]
        for o in os_[1:] + [None]:
            if o is None or o - op > 2 * half + 1e-3:
                band = o0 == op and (len(os_) == 1 or P > 1.0)
                out.append([round(o0 - (0 if band else half), 3), round(op + (0 if band else half), 3), round(P, 3), c0, c1])
                if o is not None:
                    o0 = o
            if o is not None:
                op = o
    return out


def _state(Tr, model, r, sign):
    s = governing_state(Tr, model, r, sign)
    if s is None:
        return None
    dc = Tr["settings"]["dc_m"]
    return {"value": float(s["value"]), "layout": [round(a, 3) for a in s["layout"]], "factors": [[round(a, 3), f] for a, f in s.get("factors", [])],
            "loads": _runs(s["loads"], dc, Tr["lane_width"])}


def export(Tr, RS, mdl, models=None):
    """Tr: traffic_envelope result (with influence); RS: the ResponseSet the influence was built on; mdl: integrated model."""
    inf, grid, W = Tr["influence"], Tr["grid"], Tr["lane_width"]
    names = list(RS.names)
    sel = []                                                     # (key, label, kind, ch, o, girder)
    N = mdl["nodes"]
    for i, nm in enumerate(names):
        if nm[0] == "G" and nm[2] in ("M1", "M2", "V1", "V2"):
            line, eid = nm[1]
            x = next(m for m in mdl["members"] if m["id"] == eid)
            if nm[2].endswith("2") and any(y["role"] == "girder" and y["line"] == line and y["n1"] == x["n2"] for y in mdl["members"]):
                continue                                     # end 2 repeats the next element's end 1
            node = N[x["n1"] if nm[2].endswith("1") else x["n2"]]
            if "ch" not in node:
                continue
            sel.append((i, f"{line}:{eid}:{nm[2]}", nm[2][0], float(node["ch"]), float(node.get("o", 0.0)), line))
        elif nm[0] == "BL" and nm[2] == "v":
            b = mdl["bearings"][nm[1]]; node = N.get(b.get("girder_node"), {})
            if "ch" in node:
                sel.append((i, f"{nm[1]}:R", "R", float(node["ch"]), float(node.get("o", 0.0)), b.get("girder")))
    # substructure (sill My along each headstock, pile-head axial force): substructure nodes carry u (distance along the
    # support line) only, so the plan position comes from straight-line fits of the support's bearings u -> (ch, o)
    fit = {}
    for b in mdl["bearings"].values():
        g = N.get(b.get("girder_node"), {})
        if "ch" in g and b.get("u") is not None:
            fit.setdefault(b["support"], []).append((float(b["u"]), float(g["ch"]), float(g.get("o", 0.0))))
    def at(sid, u):
        q = fit.get(sid) or []
        if len({a for a, _, _ in q}) < 2:
            return None
        U = [a for a, _, _ in q]
        return tuple(float(np.polyval(np.polyfit(U, [r[j] for r in q], 1), u)) for j in (1, 2))
    heads = {pl["id"]: (sid, pl["head"], pl.get("u", 0.0)) for sid, sup in mdl["supports"].items() for pl in sup["piles"]}
    elem = {x["id"]: x for x in mdl["members"]}
    for i, nm in enumerate(names):
        if nm[0] == "HS" and nm[2] in ("My1", "My2"):
            sid, eid = nm[1]; x = elem.get(eid)
            if x is None or (nm[2] == "My2" and any(y["role"] == x["role"] and y["n1"] == x["n2"] for y in mdl["members"])):
                continue                                     # interior end 2 repeats the next element's end 1
            pos = at(sid, float(N[x["n1" if nm[2] == "My1" else "n2"]].get("u", 0.0)))
            if pos:
                sel.append((i, f"{sid}:{eid}:{nm[2]}", "H", pos[0], pos[1], f"headstock {sid}"))
        elif nm[0] == "P" and nm[2] in ("N1", "N2"):
            pid, eid = nm[1]; sid, head, u = heads.get(pid, (None, None, 0.0)); x = elem.get(eid)
            if x is None or x[{"N1": "n1", "N2": "n2"}[nm[2]]] != head:
                continue                                     # pile-head end only
            pos = at(sid, float(u))
            if pos:
                sel.append((i, f"{pid}:N", "N", pos[0], pos[1], f"piles {sid}"))
    models = models or [m for m in Tr["env"]]
    states, il = {}, {}
    for m in models:
        st = {}
        for i, key, kind, ch, o, line in sel:
            st[key] = {"max": _state(Tr, m, i, 1), "min": _state(Tr, m, i, -1)}
        states[m] = st
    lay0 = Tr["layouts"][0]
    ilo = [round(a + W / 2, 3) for a in lay0]                     # lane centres of the first layout (same lanes shift across the sweep)
    for i, key, kind, ch, o, line in sel:
        il[key] = [[float(f"{float(v):.4g}") for v in inf.line_r(oc, grid, i)] for oc in ilo]
    plan = {"girders": {}, "bearings": [], "deck": [[float(N[k]["ch"]), float(N[k]["o"])] for k in inf.deck]}
    for x in mdl["members"]:
        if x["role"] == "girder" and "ch" in N.get(x["n1"], {}) and "ch" in N.get(x["n2"], {}):
            plan["girders"].setdefault(x["line"], []).append({"id": x["id"], "a": [float(N[x["n1"]]["ch"]), float(N[x["n1"]].get("o", 0))], "b": [float(N[x["n2"]]["ch"]), float(N[x["n2"]].get("o", 0))]})
    for bid, b in sorted(mdl["bearings"].items()):
        node = N.get(b.get("girder_node"), {})
        if "ch" in node:
            plan["bearings"].append({"id": bid, "ch": float(node["ch"]), "o": float(node.get("o", 0)), "girder": b.get("girder")})
    return {"models": models, "lane_width": W, "lane_factors": list(Tr["lane_factors"]), "layout_mode": Tr["layout_mode"], "layouts": [[round(a, 3) for a in L] for L in Tr["layouts"]],
            "carriageways": [list(c) for c in Tr["carriageways"]], "settings": Tr["settings"], "vehicles": {k: {kk: vv for kk, vv in v.items() if not hasattr(vv, "tolist") or True} for k, v in Tr["vehicles"].items()},
            "grid": [round(float(c), 3) for c in grid], "il_offsets": ilo, "responses": [{"key": k, "kind": kd, "ch": round(ch, 3), "o": round(o, 3), "girder": ln} for _, k, kd, ch, o, ln in sel],
            "states": states, "il": il, "plan": plan}
