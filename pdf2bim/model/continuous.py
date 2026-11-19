"""Continuous spans, stage 1 (Tier 4 item 14b): join the per-span superstructure models of ADR-062 into one model.

Each span keeps its own description and is built as before (`build_superstructure`). `join` renumbers every span's nodes,
members and links (span k: id + k * STEP) and then:
  - merges nodes that coincide (within `tol` m) across spans: with one bearing row on the pier (SB41 WB), the girder nodes
    over the bearing and the bearing ground nodes of the two spans are the same points, so the girder lines become
    continuous over the pier and the two bearings become one (a duplicate link with the same end nodes is dropped);
  - optionally ties girder lines across a support with a stiff member (`tie=True`), for decks with two bearing rows where
    a cast-in-place diaphragm makes the girders continuous: the end node of span k's girder joins span k+1's start node.
Loads applied to the joined model act on the continuous structure. Construction staging (girder and wet-deck weight on
simply supported girders, later loads continuous) is the caller's job: solve those cases on the span models (stage 2).
"""
import numpy as np

from .solver import Model

STEP = 1_000_000


def _rigid_props(beams):
    """A stiff member for ties: 100 x the stiffest girder-line member of the spans (dimensionless scale, as RIGID)."""
    g = [b for b in beams if b.get("role") == "girder"] or list(beams)
    b = max(g, key=lambda q: q["E"] * q["Iy"])
    return dict(E=b["E"], nu=b["E"] / (2 * b["G"]) - 1, A=b["A"] * 100, Iy=b["Iy"] * 100, Iz=b["Iz"] * 100, J=b["J"] * 100)


def join(sups, tol=0.005, tie=False):
    """sups: build_superstructure outputs in span order. Returns {"model", "nodes", "members", "bearings", "map", "merged",
    "ties", "dropped_links", "dropped_beams", "supports", "alias", "beam_map"}; "map"[k][old id] = new node id of span k.
    Shared bearings and supports keep the first span's record (later spans' keys in "alias"), so the result is a model dict
    pdf2bim.model.responses.ResponseSet accepts."""
    M = Model()
    nodes, members, bearings, maps, merged, dropped, dropped_b, ties = {}, [], {}, [], [], [], [], []
    lmap, bmap, alias, supports = {}, {}, {}, {}                # (span, dropped link / beam) -> kept id; shared bearing / support keys
    seen = []                                                   # (xyz, new id) of the nodes placed so far
    for k, S in enumerate(sups):
        m, off, mp = S["model"], k * STEP, {}
        prior = list(seen)                                        # merge only with earlier spans' nodes, never within a span
        for n, xyz in m.nodes.items():
            hit = next((j for p, j in prior if np.linalg.norm(p - xyz) < tol), None) if k else None
            if hit is not None:
                mp[n] = hit
                merged.append((k, n, hit))
                continue
            mp[n] = n + off
            M.node(mp[n], *xyz)
            seen.append((xyz, mp[n]))
            if n in S["nodes"]:
                nodes[mp[n]] = dict(S["nodes"][n], span=k)
        maps.append(mp)
        bkeys = {frozenset((b["n1"], b["n2"])): j for j, b in M.beams.items()}
        for i, b in m.beams.items():
            hit = bkeys.get(frozenset((mp[b["n1"]], mp[b["n2"]]))) if k else None
            if hit is not None:                                   # a shared member (pier headstock / pile) built by both spans
                dropped_b.append((k, i))
                bmap[(k, i)] = hit
                continue
            q = {kk: v for kk, v in b.items() if kk not in ("n1", "n2", "G")}
            M.beam(i + off, mp[b["n1"]], mp[b["n2"]], nu=b["E"] / (2 * b["G"]) - 1, **q)
        keys = {(L["n1"], L["n2"]) for L in M.links.values()}
        for i, L in m.links.items():
            n1, n2 = mp[L["n1"]], mp[L["n2"]]
            if (n1, n2) in keys:                                  # the same bearing seen from both spans
                dropped.append((k, i))
                lmap[(k, i)] = next(j for j, Q in M.links.items() if (Q["n1"], Q["n2"]) == (n1, n2))
                continue
            q = {kk: v for kk, v in L.items() if kk not in ("n1", "n2", "k", "R")}
            M.link(i + off, n1, n2, L["k"], axes=L["R"], **q)
        for n, d in m.fixed.items():
            if mp[n] not in M.fixed:
                M.fixed[mp[n]] = list(d)
        for n, kk in m.springs.items():
            if mp[n] not in M.springs:                            # a shared node's soil spring counts once
                M.spring(mp[n], kk)
        for x in S["members"]:
            if (k, x["id"]) in bmap:
                continue
            members.append(dict(x, id=x["id"] + off, n1=mp[x["n1"]], n2=mp[x["n2"]], span=k) if "n1" in x else dict(x, span=k))
        for bid, b in S["bearings"].items():
            q = {kk: mp.get(b[kk], b[kk]) for kk in ("node", "ground", "girder_node") if b.get(kk) is not None}
            if (k, b.get("link")) in lmap:                        # the shared bearing: keep the earlier span's record
                alias[f"S{k + 1}:{bid}"] = next(kk for kk, v in bearings.items() if v.get("link") == lmap[(k, b["link"])])
                continue
            if b.get("link") is not None:
                q["link"] = b["link"] + off
            bearings[f"S{k + 1}:{bid}"] = dict(b, **q, span=k)
        for sid, sp_ in (S.get("supports") or {}).items():
            sill = [mp[n] for n in sp_["sill_nodes"]]
            have = next((j for j, v in supports.items() if v["sill_nodes"][:1] == sill[:1]), None)
            if have is not None:                                  # the shared pier: built by both spans, kept once
                alias[("support", k, sid)] = have
                continue
            supports[sid] = dict(sp_, sill_nodes=sill, span=k,
                                 piles=[dict(p, head=mp[p["head"]], toe=mp[p["toe"]], chain=[mp[n] for n in p["chain"]]) for p in sp_["piles"]])
    if tie:                                                       # girder lines across each interior support
        R = _rigid_props(M.beams.values())
        for k in range(len(sups) - 1):
            ends = {}
            for (kk, side) in ((k, "end_B"), (k + 1, "end_A")):
                for n, d in sups[kk]["nodes"].items():
                    if d.get("special") == side:
                        ends.setdefault(d.get("line"), {})[kk] = maps[kk][n]
            for line, e in sorted(ends.items(), key=lambda q: str(q[0])):
                if len(e) == 2 and e[k] != e[k + 1]:
                    i = (k + 1) * STEP + 900_000 + len(ties) + 1
                    M.beam(i, e[k], e[k + 1], R["E"], R["nu"], R["A"], R["Iy"], R["Iz"], R["J"], role="continuity")
                    ties.append({"id": i, "line": line, "n1": e[k], "n2": e[k + 1], "support_after_span": k + 1})
    return {"format": "pdf2bim.model/0.1+continuous", "model": M, "nodes": nodes, "members": members, "bearings": bearings,
            "map": maps, "merged": merged, "ties": ties, "dropped_links": dropped, "dropped_beams": dropped_b,
            "supports": supports, "alias": alias, "beam_map": bmap,
            "provisional": [q for S in sups for q in (S.get("provisional") or [])]}


def _name(J, k, nm):
    """The joined response name of span k's response nm (pdf2bim.model.responses names)."""
    off, kind, a = k * STEP, nm[0], nm[1]
    bid = lambda e: J["beam_map"].get((k, e), e + off)
    if kind in ("B", "BL"):
        b = f"S{k + 1}:{a}"
        return (kind, J["alias"].get(b, b)) + nm[2:]
    if kind == "G":
        return ("G", (a[0], a[1] + off)) + nm[2:]
    if kind == "HS":
        return ("HS", (J["alias"].get(("support", k, a[0]), a[0]), bid(a[1]))) + nm[2:]
    if kind == "P":
        return ("P", (a[0], bid(a[1]))) + nm[2:]
    return nm                                                     # H (pile head displacement), S (spring totals): ids unchanged


def from_spans(J, RSJ, parts):
    """Response vector on the joined response set RSJ from span results: parts = [(k, RS_k, v_k)], each the span model's
    response set and values of a case solved on the simply supported span (loads before continuity). Shared responses
    (pier bearings, headstock, piles) add up; responses absent from a span stay zero."""
    v = np.zeros(len(RSJ.names))
    for k, RS, x in parts:
        for nm, val in zip(RS.names, x):
            i = RSJ.index.get(_name(J, k, nm))
            if i is None:
                raise KeyError(f"span {k + 1} response {nm!r} has no joined counterpart")
            v[i] += val
    return v


def _remap_loads(J, k, loads):
    out = {}
    for n, f in loads.items():
        j = J["map"][k][n]
        out[j] = out.get(j, np.zeros(6)) + np.asarray(f, float)
    return out


def _remap_imposed(J, k, imp):
    return {J["beam_map"].get((k, e), e + k * STEP): u for e, u in imp.items()}


def primitives(spans, J, std, allow_proposed=False, soil_action="SOo", traffic_kw=None):
    """Combination primitives (as combinations.primitives) on the joined model J. spans = [(doc, geo, S, sup)] in span
    order, sup = the span's build_integrated output that J was joined from.
    Staging (shortcut: provisional default, not read from the description — owner to confirm per bridge): self weight of
    every member acts on the simply supported spans (girders and deck before continuity, from_spans); SDL, earth pressure,
    braking, centrifugal, thermal, wind and traffic act on the continuous structure.
    Per-span cases are generated on each span model and remapped onto J. Braking and centrifugal are each span's own
    (shortcut: AS 5100.2 braking for the whole continuous deck length not formed, upgrade with the staging input).
    Traffic: one envelope over the whole joined deck (lanes and carriageway of the first span's description; shortcut:
    HLP central-gap variants not tried). Earthquake: not combined (RSA on the joined masses not built)."""
    from .responses import ResponseSet
    from .loads import sdl_case
    from .horizontal import horizontal_cases
    from .thermal import thermal_cases
    from .wind import wind_cases
    from .traffic import traffic_envelope, Influence
    from .combinations import SOIL_ACTIONS
    if soil_action not in SOIL_ACTIONS:
        raise ValueError(f"soil_action {soil_action!r}: one of {SOIL_ACTIONS}")
    RS = ResponseSet(J)
    st = lambda **kw: RS.static(**kw)
    P, src, notc = {}, {}, []
    prov = [{"path": "analysis.continuity_stage", "value": "self weight simply supported; SDL and later loads continuous", "author": "AI", "decision": None,
             "reason": "construction staging of the continuity not in the description (ADR-082)"},
            {"path": "loads (earth pressure fill category)", "value": soil_action, "author": "AI", "decision": None,
             "reason": "fill category (controlled fill SOc / other SOo) not in the description; SOo has the larger ULS factor and the smaller relieving factor"}]
    parts, loads, imp, ept, Ts = [], {}, {}, [], []
    add = lambda key, d: loads.setdefault(key, {}).update({n: loads[key].get(n, 0) + f for n, f in d.items()})
    sdl_used = set()
    for k, (doc, geo, S, sup) in enumerate(spans):
        RSk = ResponseSet(sup)
        parts.append((k, RSk, RSk.static(gravity=(0.0, 0.0, -1.0))))
        C = sdl_case(doc, geo, sup, allow_proposed=allow_proposed, part="SDLp")
        add("SDLp", _remap_loads(J, k, C["loads"]))
        if any(a_ == "SDLs" for a_ in C["barrier_actions"].values()):
            add("SDLs", _remap_loads(J, k, sdl_case(doc, geo, sup, allow_proposed=allow_proposed, part="SDLs")["loads"])); sdl_used.add(k)
        H = horizontal_cases(doc, geo, sup, std, allow_proposed=allow_proposed)
        for cid, v in H["cases"].items():
            if cid.startswith("EPT"):
                ept.append(st(loads=_remap_loads(J, k, v["loads"])))
            elif cid in ("EP", "BRKp", "CEN"):
                add(cid, _remap_loads(J, k, v["loads"]))
        prov += list(H.get("provisional") or [])
        T = thermal_cases(doc, geo, S, sup, allow_proposed=allow_proposed)
        Ts.append(T)
        for cid, v in T["cases"].items():
            imp.setdefault(cid, {}).update(_remap_imposed(J, k, v["imposed"]))
        prov += list(T.get("provisional") or [])
        W = wind_cases(doc, geo, S, sup, allow_proposed=allow_proposed)
        for cid, v in W["cases"].items():
            add("W" + cid, _remap_loads(J, k, v["loads"]))
        if k == 0:
            r35, rS = W["scale"]["with_traffic"], W["scale"]["sls"]
        elif (W["scale"]["with_traffic"], W["scale"]["sls"]) != (r35, rS):
            raise ValueError("wind speed ratios differ between the span descriptions")
        prov += list(W.get("provisional") or [])
    P["DLc"] = {"s": from_spans(J, RS, parts)}; src["DLc"] = "self weight of every member, on the simply supported spans (staging, provisional)"
    P["SDLp"] = {"s": st(loads=loads["SDLp"])}; src["SDLp"] = "SDL (surfacing, other SDL, barriers not accurately known), continuous"
    if "SDLs" in loads:
        P["SDLs"] = {"s": st(loads=loads["SDLs"])}; src["SDLs"] = "SDL special case: barriers with accurately known weight, continuous"
    P[soil_action] = {"s": st(loads=loads["EP"])}; src[soil_action] = "earth pressure on both abutment headstocks"
    z = np.zeros(len(RS.names))
    P["EPT"] = {"max": np.maximum.reduce(ept + [z]), "min": np.minimum.reduce(ept + [z]), "parts": ept + [z]}; src["EPT"] = "traffic surcharge behind A or behind B"
    P["BRKR"] = {"s": st(loads=loads["BRKp"])}; src["BRKR"] = "braking toward B, each span's own (whole-deck braking not formed)"
    P["CENR"] = {"s": st(loads=loads["CEN"])}; src["CENR"] = "centrifugal, outward"
    for aid, cid in (("TUW", "TU+"), ("TUC", "TU-"), ("TGP", "TGP"), ("TGN", "TGN"), ("SCR", "SCR")):
        if cid in imp:
            P[aid] = {"s": st(imposed=imp[cid])}; src[aid] = f"thermal case {cid} on the continuous structure (restraint moments included)"
    wc = {c[1:]: st(loads=v) for c, v in loads.items() if c.startswith("W")}
    for sx, r in (("U", 1.0), ("35", r35), ("S", rS)):
        P["WX_" + sx] = {"s": wc["WL+"] * r}
        P["WY_" + sx] = {"s": wc["WT+"] * r + (wc["WTV+"] if sx == "35" else 0.0)}
        P["WZ_" + sx] = {"max": np.maximum(wc["WVU+"], wc["WVU-"]) * r, "min": np.minimum(wc["WVU+"], wc["WVU-"]) * r, "parts": [wc["WVU+"] * r, wc["WVU-"] * r]}
    src["WX"] = "WL+"; src["WY"] = "WT+ (+ WTV+ with traffic)"; src["WZ"] = "uplift WVU+ / WVU- envelope"
    doc0, geo0 = spans[0][0], spans[0][1]
    Tr = traffic_envelope(doc0, geo0, J, std, allow_proposed=allow_proposed, inf=Influence(J, responses=RS), **(traffic_kw or {}))
    for mn, e in Tr["env"].items():
        P[mn] = {"max": e["max"], "min": e["min"], "state": (Tr, mn)}; src[mn] = f"{mn} moving-load envelope over the joined deck"
    prov += list(Tr.get("provisional") or [])
    notc.append(("EQX", "earthquake on the joined model not built (continuous spans stage 2b)"))
    notc.append(("EQY", "earthquake on the joined model not built (continuous spans stage 2b)"))
    dedup = []
    for p in prov:
        if p not in dedup:
            dedup.append(p)
    return {"prim": P, "names": RS.names, "meta": RS.meta, "sources": src, "not_combined": notc, "provisional": dedup,
            "cases": {"traffic": Tr, "thermal": Ts[0], "thermal_spans": Ts}, "response_set": RS}


def combined_actions(spans, J, std, allow_proposed=False, options=None, on=None, **kw):
    """combinations.combined_actions on the joined model (same rows, same envelopes)."""
    from .combinations import Register, generate, combine, available_actions
    Pr = primitives(spans, J, std, allow_proposed=allow_proposed, **kw)
    on = set(on) if on is not None else available_actions(Pr["prim"])
    G = generate(Register(std, on), options)
    Cb = combine(G["rows"], Pr["prim"])
    return {"case": "AS 5100.2 combined actions (continuous spans)", "names": Pr["names"], "envelopes": Cb, "rows": G["rows"], "capped": G["capped"],
            "on": sorted(on), "options": G["options"], "sources": Pr["sources"], "not_combined": Pr["not_combined"], "missing_terms": Cb["missing"],
            "standards_status": std.result_status(), "standards_used": std.usage(), "provisional": Pr["provisional"], "primitives": Pr}
