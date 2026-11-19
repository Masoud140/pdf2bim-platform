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
            "supports": supports, "alias": alias, "beam_map": bmap}


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
