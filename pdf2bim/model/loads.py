"""Load cases on the integrated model (stage P3b). kN, m.

    from pdf2bim.model.loads import sdl_case
    case = sdl_case(doc, geo, mdl, allow_proposed=False)
    r = mdl['model'].solve(gravity=(0, 0, 0), loads=case['loads'])

SDL (superimposed dead load) = surfacing + barriers + other SDL, from the description only:
- surfacing: pressure gamma * t over the carriageway (deck.carriageway_left .. carriageway_right; deck.surfacing_thickness,
  deck.surfacing_density) between the two skewed deck-end lines;
- barriers: deck.barriers[]: line load `weight` along the control-line offset `offset`, between the deck-end lines;
- other SDL: deck.other_sdl (kPa over the full deck width), if it has a value; otherwise reported as not applied.
No factor is applied here (characteristic load case); factors belong to the combinations (standards accessor).

Discretisation (deterministic, no mesh quantisation of the total):
- the loaded strip is cut into cells of about `dc` (along the control line) x `do` (across) in chainage / offset; each
  cell is a plan quadrilateral (corner points on the alignment), CLIPPED EXACTLY by the deck-end half-planes; its plan area
  (shoelace) times the pressure acts at its centroid. The total therefore equals pressure x the clipped plan area.
- line loads: cut into pieces of about `dc` along the offset curve, clipped at the end lines; w x piece length at the
  piece midpoint.
Distribution of each point force to the grillage (statically equivalent in chainage / offset): Delaunay triangulation of
the deck-line nodes (girder, web, edge, mid-gap) in (chainage, offset); barycentric weights of the containing triangle.
"""
import math
import numpy as np
from ..description import Reader, MissingInput

LOAD_LINE_ROLES = ("girder", "web", "edge", "midgap")
SNAP_MAX = 0.05   # m: largest distance a load point may be moved onto the node hull (Model)


def deck_end_lines(geo):
    """The two deck-end lines (through the girder ends, parallel to the support line): {support: (P, u, interior_sign)}."""
    sups = geo["supports"]
    out = {}
    for s, key in ((sups[0], "end_A"), (sups[-1], "end_B")):
        pts = [(g[key]["E"], g[key]["N"]) for g in geo["girders"]]
        u = (math.sin(math.radians(s["bearing"])), math.cos(math.radians(s["bearing"])))
        P = (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
        out[s["id"]] = [P, u, 0.0]
    ids = list(out)
    for a, b in ((ids[0], ids[1]), (ids[1], ids[0])):
        P, u, _ = out[a]
        Q = out[b][0]
        out[a][2] = 1.0 if (Q[0] - P[0]) * u[1] - (Q[1] - P[1]) * u[0] > 0 else -1.0
    return {k: tuple(v) for k, v in out.items()}


def _side(P, u, sg, X):
    return sg * ((X[0] - P[0]) * u[1] - (X[1] - P[1]) * u[0])


def _clip(poly, P, u, sg):
    """Sutherland-Hodgman: keep the part of poly on the interior side of the line (P, u)."""
    out = []
    n = len(poly)
    for i in range(n):
        A, B = poly[i], poly[(i + 1) % n]
        sa, sb = _side(P, u, sg, A), _side(P, u, sg, B)
        if sa >= 0:
            out.append(A)
        if (sa >= 0) != (sb >= 0):
            t = sa / (sa - sb)
            out.append((A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])))
    return out


def _area_centroid(poly):
    """Plan area and centroid. Computed relative to the first vertex: with survey coordinates (~1e6 m) the plain
    shoelace products (~1e12) would lose the cell area to round-off."""
    x0_, y0_ = poly[0]
    poly = [(x - x0_, y - y0_) for x, y in poly]
    a = cx = cy = 0.0
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % n]
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    if abs(a) / 2 < 1e-8:   # sliver from clipping: centroid ill-conditioned, use the vertex average (area kept)
        return abs(a) / 2, (x0_ + sum(p[0] for p in poly) / n, y0_ + sum(p[1] for p in poly) / n)
    return abs(a) / 2, (x0_ + cx / (3 * a), y0_ + cy / (3 * a))


def _end_chainage(al, end, o, guess):
    """Chainage where the offset curve o crosses the deck-end line (scan + bisection on the side function)."""
    P, u, sg = end
    f = lambda c: _side(P, u, sg, al.point(c, o)[:2])
    a, b = guess - 15.0, guess + 15.0
    xs = np.linspace(a, b, 301)
    fs = [f(x) for x in xs]
    for i in range(len(xs) - 1):
        if fs[i] == 0:
            return xs[i]
        if fs[i] * fs[i + 1] < 0:
            lo, hi = xs[i], xs[i + 1]
            for _ in range(60):
                m = (lo + hi) / 2
                if f(lo) * f(m) <= 0:
                    hi = m
                else:
                    lo = m
            return (lo + hi) / 2
    raise MissingInput(f"offset {o:.3f} m does not cross the deck-end line within ±15 m of chainage {guess:.3f}")


class Distributor:
    """Distribution of vertical point forces to the superstructure deck-line nodes: Delaunay triangulation of the nodes in
    (chainage, offset); each force is split over the three nodes of its triangle by barycentric weights. This conserves
    the force and both first moments (in chainage / offset) exactly, also in the skewed end triangles."""

    def __init__(self, nodes):
        from scipy.spatial import Delaunay
        self.ids = [k for k, v in nodes.items() if v.get("role") in LOAD_LINE_ROLES and "ch" in v]
        self.X = np.array([[nodes[k]["ch"], nodes[k]["o"]] for k in self.ids])
        self.tri = Delaunay(self.X)
        self.pts = []

    def add(self, ch, o, F):
        self.pts.append((ch, o, F))

    def nodal(self):
        if not self.pts:
            return {}
        P = np.array([[p[0], p[1]] for p in self.pts]); F = np.array([p[2] for p in self.pts])
        simp = self.tri.find_simplex(P, tol=1e-9)
        self.snapped, self.snap_max = 0, 0.0
        if (simp < 0).any():
            # points between the node hull and the true deck boundary (a straight plan end line is slightly curved in
            # chainage / offset; the hull follows only its nodes): project onto the nearest hull edge
            E = self.tri.convex_hull
            A, B = self.X[E[:, 0]], self.X[E[:, 1]]
            for i in np.where(simp < 0)[0]:
                d = B - A
                t = np.clip(((P[i] - A) * d).sum(1) / (d * d).sum(1), 0, 1)
                Q = A + t[:, None] * d
                dist = np.hypot(*(Q - P[i]).T)
                j = int(dist.argmin())
                if dist[j] > SNAP_MAX:
                    raise MissingInput(f"load point (ch {P[i][0]:.3f}, offset {P[i][1]:.3f}) lies {dist[j]:.3f} m outside the deck grillage nodes")
                self.snapped += 1; self.snap_max = max(self.snap_max, float(dist[j]))
                Qi = Q[j] + (self.X.mean(0) - Q[j]) * 1e-9
                P[i] = Qi
                simp[i] = self.tri.find_simplex(Qi[None, :], tol=1e-9)[0]
                if simp[i] < 0:
                    raise MissingInput(f"load point (ch {P[i][0]:.3f}, offset {P[i][1]:.3f}) could not be placed on the grillage")
        T = self.tri.transform[simp]
        b = np.einsum("ijk,ik->ij", T[:, :2, :], P - T[:, 2, :])
        W = np.column_stack([b, 1 - b.sum(axis=1)])
        out = {}
        for s_, w, f in zip(simp, W, F):
            for k, wk in zip(self.tri.simplices[s_], w):
                out[self.ids[k]] = out.get(self.ids[k], 0.0) + f * wk
        return out


def sdl_case(doc, geo, mdl, allow_proposed=False, dc=0.2, do=0.1):
    rd = Reader(doc, allow_proposed)
    used = []

    def v(rec, path, required=True):
        x = rd.value(rec, path, required=required)
        used.append({"path": path, "value": x, "tag": (rec or {}).get("tag"), "status": (rec or {}).get("status")})
        return x

    al = geo["_alignment"]
    D = doc.get("deck") or {}
    ends = deck_end_lines(geo)
    sA, sB = geo["supports"][0], geo["supports"][-1]
    eA, eB = ends[sA["id"]], ends[sB["id"]]
    dist = Distributor(mdl["nodes"])
    comps = []

    def ch_range(o):
        return _end_chainage(al, eA, o, sA["ch"]), _end_chainage(al, eB, o, sB["ch"])

    def area_load(name, oL, oR, q, recs):
        if q == 0:
            return
        no = max(1, math.ceil((oR - oL) / do - 1e-9))
        ofs = [oL + (oR - oL) * j / no for j in range(no + 1)]
        rng = [ch_range(o) for o in ofs]
        c0 = min(min(r) for r in rng) - dc; c1 = max(max(r) for r in rng) + dc
        nc = max(1, math.ceil((c1 - c0) / dc))
        chs = [c0 + (c1 - c0) * i / nc for i in range(nc + 1)]
        V = [[al.point(c, o)[:2] for o in ofs] for c in chs]
        tot = area = 0.0
        npts = 0
        for i in range(nc):
            for j in range(no):
                poly = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]]
                lo_ok = chs[i] >= max(rng[j][0], rng[j + 1][0]) and chs[i + 1] <= min(rng[j][1], rng[j + 1][1])
                if not lo_ok:
                    poly = _clip(_clip(poly, *eA), *eB)
                    if len(poly) < 3:
                        continue
                A, C = _area_centroid(poly)
                if A <= 0:
                    continue
                if lo_ok:
                    chc, oc = (chs[i] + chs[i + 1]) / 2, (ofs[j] + ofs[j + 1]) / 2
                else:
                    chc, oc = al.station(C[0], C[1], guess=(chs[i] + chs[i + 1]) / 2)
                F = -q * A
                dist.add(chc, oc, F)
                tot += F; area += A; npts += 1
        comps.append({"name": name, "kind": "area", "from_offset": oL, "to_offset": oR, "pressure_kPa": q, "plan_area_m2": area,
                      "total_kN": tot, "points": npts, "inputs": recs})

    def line_load(name, o, w, recs):
        a, b = ch_range(o)
        n = max(1, math.ceil((b - a) / dc))
        tot = length = 0.0
        for i in range(n):
            c0, c1 = a + (b - a) * i / n, a + (b - a) * (i + 1) / n
            P0, P1 = al.point(c0, o)[:2], al.point(c1, o)[:2]
            L = math.hypot(P1[0] - P0[0], P1[1] - P0[1])
            F = -w * L
            dist.add((c0 + c1) / 2, o, F)
            tot += F; length += L
        comps.append({"name": name, "kind": "line", "offset": o, "w_kN_per_m": w, "length_m": length, "total_kN": tot, "points": n,
                      "ch_from": a, "ch_to": b, "inputs": recs})

    # surfacing
    t = v(D.get("surfacing_thickness"), "deck.surfacing_thickness")
    g = v(D.get("surfacing_density"), "deck.surfacing_density")
    cl = v(D.get("carriageway_left"), "deck.carriageway_left")
    cr = v(D.get("carriageway_right"), "deck.carriageway_right")
    area_load("surfacing", cl, cr, g * t / 1000, ["deck.surfacing_thickness", "deck.surfacing_density", "deck.carriageway_left", "deck.carriageway_right"])
    # barriers
    for b in D.get("barriers") or []:
        bid = b.get("id")
        w = v(b.get("weight"), f"deck.barriers[{bid}].weight")
        o = v(b.get("offset"), f"deck.barriers[{bid}].offset")
        line_load(f"barrier {bid}", o, w, [f"deck.barriers[{bid}].weight", f"deck.barriers[{bid}].offset"])
    # other SDL
    q = v(D.get("other_sdl"), "deck.other_sdl", required=False)
    not_applied = []
    if q:
        el = v(D.get("edge_left"), "deck.edge_left"); er = v(D.get("edge_right"), "deck.edge_right")
        area_load("other SDL", el, er, q, ["deck.other_sdl", "deck.edge_left", "deck.edge_right"])
    else:
        not_applied.append({"path": "deck.other_sdl", "tag": (D.get("other_sdl") or {}).get("tag"), "reason": "no value (not applied)"})
    loads = dist.nodal()
    point_loads = list(dist.pts)
    total = sum(loads.values())
    return {"case": "SDL", "kind": "permanent (characteristic, unfactored)", "loads": {k: (0.0, 0.0, f, 0.0, 0.0, 0.0) for k, f in loads.items()},
            "total_kN": total, "components": comps, "point_loads": point_loads, "inputs": used, "not_applied": not_applied, "points": len(dist.pts), "snapped_points": dist.snapped, "snap_max_m": dist.snap_max,
            "settings": {"dc_m": dc, "do_m": do, "tag": "Model"}, "provisional": rd.provisional}
