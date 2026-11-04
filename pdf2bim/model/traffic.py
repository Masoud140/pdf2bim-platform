"""Road traffic envelopes (M1600, S1600) on the integrated model by influence surfaces (stage P3c). kN, m.

    from pdf2bim.model.traffic import traffic_envelope
    T = traffic_envelope(doc, geo, mdl, std, allow_proposed=False, layout="sweep")

Method (a port of the dashboard's Traffic tab, src: trInfluence / trLaneEffect / trEnvelope, generalised):
1. Influence surfaces: one factorisation of the integrated model; a unit downward load at every deck-line node (girder,
   web, edge, mid-gap); responses (girder sagging moment at both ends of every girder element, bearing reaction, girder
   node deflection) as linear functions of the displacements.
2. Load positions on a chainage grid (step `dc`) at any offset: barycentric weights on the triangulation of the deck
   nodes in (chainage, offset), the same rule as the SDL case; positions outside the deck carry nothing.
3. One lane (left edge a, width W): lane UDL over W in 8 strips, PATTERNED (only the adverse parts loaded) unless
   pattern=False; the vehicle: two wheel lines at the lane centre +- track / 2, shifted laterally by -0.4 ... +0.4 m in
   0.1 m steps (lateral=True), four tri-axle groups (axle spacing, gaps g12, g23 >= minimum (variable), g34), both
   directions of travel, wheel loads x (1 + DLA); every position along the grid (also partly off the deck). UDL without
   DLA unless dla_on_udl=True.
4. Lanes: number = floor(carriageway width / lane width); layouts: "left" (lanes packed from the left kerb, the
   dashboard default) or "sweep" (the packed group moved across the carriageway in `sweep_step` steps). For every
   layout the lane effects are ranked (largest first) and multiplied by the accompanying lane factors; envelope = max /
   min over layouts.
Standards values (lane width, M1600 / S1600 geometry and loads, DLA, lane factors) come from standards/data through the
accessor (code-extracted-UNVERIFIED); results carry that label. Results are characteristic (no ULS / SLS factor).
"""
import itertools
import math
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spl
from ..description import Reader, MissingInput
from .loads import LOAD_LINE_ROLES

DOF = 6


def _responses(mdl):
    """Response definitions: girder sagging M at both ends of every girder element, bearing reaction (upward force on the
    girder top node, i.e. compression), deflection uz of every girder node."""
    m = mdl["model"]
    R = []
    gmem = [x for x in mdl["members"] if x["role"] == "girder"]
    for x in gmem:
        for end in (0, 1):
            R.append({"t": "M", "eid": x["id"], "end": end, "girder": x["line"], "node": x["n1"] if end == 0 else x["n2"]})
    for bid, b in sorted(mdl.get("bearings", {}).items()):
        R.append({"t": "B", "link": b["link"], "bearing": bid, "girder": b["girder"], "support": b["support"]})
    for k, v in mdl["nodes"].items():
        if v.get("role") == "girder" and v.get("line") is not None and k in m.nodes:
            R.append({"t": "D", "node": k, "girder": v["line"], "ch": v.get("ch")})
    return R


def _response_matrix(m, R, idx, nd):
    rows, cols, vals = [], [], []
    for i, r in enumerate(R):
        if r["t"] == "M":
            L, Rm, T, K, fl, dofs = m._el[r["eid"]]
            KT = K @ T
            row = KT[4] + (L if r["end"] == 1 else 0.0) * KT[2]
        elif r["t"] == "B":
            L, Rm, T, Kl, fl, dofs = m._el[("link", r["link"])]
            KT = (Kl @ T)[6:9]
            row = -(Rm.T @ KT)[2]                    # global Z force of the link on its top node
        else:
            dofs = [DOF * idx[r["node"]] + 2]; row = np.array([1.0])
        rows += [i] * len(dofs); cols += list(dofs); vals += list(row)
    return sp.csr_matrix((vals, (rows, cols)), shape=(len(R), nd))


class Influence:
    """dist = "triangles" (default: barycentric on the Delaunay triangulation of the deck nodes, as the SDL case) or
    "lines" (the dashboard's trW rule: interpolate between the two constant-offset node lines that bracket the offset,
    then between the two nodes along each line; a point beyond a line's last node goes to that node; only valid for
    meshes whose nodes lie on constant-offset lines; `ends` = the two deck-end lines limit the loaded area). The "lines"
    rule is kept to REPRODUCE the dashboard (cross-implementation check): with min_line_nodes=1 a node off every line
    (e.g. a bearing node) forms its own one-node "line" that collects all load at that offset (finding H-5)."""

    def __init__(self, mdl, dist="triangles", ends=None, min_line_nodes=1, responses=None):
        """responses: None (girder moments, bearing reactions, girder deflections) or a ResponseSet
        (pdf2bim.model.responses) whose quantities are then enveloped (self.R = its names)."""
        from scipy.spatial import Delaunay
        m = mdl["model"]
        Kt, free, idx = m.stiffness()
        nd = DOF * len(m.nodes)
        if responses is None:
            self.R = _responses(mdl)
            Rm = _response_matrix(m, self.R, idx, nd)
        else:
            if responses.idx != idx:
                raise ValueError("response set and stiffness use different node numbering")
            self.R, Rm = list(responses.names), responses.matrix
        self.deck = [k for k, v in mdl["nodes"].items() if v.get("role") in LOAD_LINE_ROLES and "ch" in v]
        X = np.array([[mdl["nodes"][k]["ch"], mdl["nodes"][k]["o"]] for k in self.deck])
        self.tri = Delaunay(X)
        pos = -np.ones(nd, int); pos[free] = np.arange(len(free))
        F = np.zeros((len(free), len(self.deck)))
        for j, k in enumerate(self.deck):
            p = pos[DOF * idx[k] + 2]
            if p >= 0:
                F[p, j] = -1.0                            # 1 kN downward
        lu = spl.splu(Kt[free][:, free].tocsc())
        Uf = lu.solve(F)
        U = np.zeros((nd, len(self.deck))); U[free] = Uf
        self.IM = np.asarray(Rm @ U)                      # (responses x deck nodes): response per 1 kN downward
        self.c0, self.c1 = float(X[:, 0].min()), float(X[:, 0].max())
        self.cache = {}
        self.dist, self.ends, self.al = dist, ends, None
        if dist == "lines":
            pts = sorted((mdl["nodes"][k]["o"], mdl["nodes"][k]["ch"], j) for j, k in enumerate(self.deck))
            groups = []
            for o, c, j in pts:                     # nodes within 5 mm of offset form one line
                if groups and o - groups[-1][-1][0] <= 0.005:
                    groups[-1].append((o, c, j))
                else:
                    groups.append([(o, c, j)])
            self.lines = [(sum(g[0] for g in G) / len(G), sorted((g[1], g[2]) for g in G)) for G in groups if len(G) >= min_line_nodes]

    def _weights_lines(self, P):
        rows, cols, vals = [], [], []
        os_ = [o for o, _ in self.lines]
        for i, (c, o) in enumerate(P):
            if self.ends is not None and not self.ends(c, o):
                continue
            a = max((j for j, x in enumerate(os_) if x <= o + 1e-9), default=None)
            b = min((j for j, x in enumerate(os_) if x >= o - 1e-9), default=None)
            if a is None or b is None:
                continue
            t = 0.0 if a == b else (o - os_[a]) / (os_[b] - os_[a])
            for li, wl in ((a, 1 - t), (b, t)) if a != b else ((a, 1.0),):
                if wl <= 0:
                    continue
                p = self.lines[li][1]
                if c <= p[0][0]:
                    rows.append(i); cols.append(p[0][1]); vals.append(wl); continue
                if c >= p[-1][0]:
                    rows.append(i); cols.append(p[-1][1]); vals.append(wl); continue
                for k in range(len(p) - 1):
                    if p[k][0] <= c <= p[k + 1][0]:
                        s_ = (c - p[k][0]) / (p[k + 1][0] - p[k][0])
                        rows += [i, i]; cols += [p[k][1], p[k + 1][1]]; vals += [wl * (1 - s_), wl * s_]
                        break
        return sp.csr_matrix((vals, (rows, cols)), shape=(len(P), len(self.deck)))

    def weights(self, P):
        """Sparse (points x deck nodes) distribution weights; rows of points outside the deck are empty."""
        P = np.asarray(P, float)
        if self.dist == "lines":
            return self._weights_lines(P)
        s = self.tri.find_simplex(P, tol=1e-9)
        ok = np.where(s >= 0)[0]
        T = self.tri.transform[s[ok]]
        b = np.einsum("ijk,ik->ij", T[:, :2, :], P[ok] - T[:, 2, :])
        W = np.column_stack([b, 1 - b.sum(axis=1)])
        rows = np.repeat(ok, 3); cols = self.tri.simplices[s[ok]].ravel()
        return sp.csr_matrix((W.ravel(), (rows, cols)), shape=(len(P), len(self.deck)))

    def line(self, o, grid):
        key = round(o * 1000)
        if key not in self.cache:
            P = np.column_stack([grid, np.full(len(grid), o)])
            self.cache[key] = np.asarray(self.weights(P) @ self.IM.T)      # (grid points x responses)
        return self.cache[key]


def _shift(A, s):
    if s <= 0:
        return A
    out = np.zeros_like(A); out[:-s] = A[s:]
    return out


def lane_effect(inf, grid, dc, veh, a, W, pattern=True, lateral=True, dla_on_udl=False):
    nr = len(inf.R)
    N = len(grid)
    # UDL over the lane width (8 strips), adverse parts only
    ns = 8
    strips = sum(inf.line(a + (s + 0.5) * W / ns, grid) for s in range(ns))
    fu = (1 + veh["dla"] if dla_on_udl else 1.0) * veh["udl_kN_per_m"] * dc / ns
    f = strips * fu
    if pattern:
        pos = np.where(f > 0, f, 0).sum(0); neg = np.where(f < 0, f, 0).sum(0)
    else:
        tot = f.sum(0); pos = np.maximum(tot, 0); neg = np.minimum(tot, 0)
    # vehicle
    sa = round(veh["axle_spacing_m"] / dc)
    s12 = round((2 * veh["axle_spacing_m"] + veh["gap_12_m"]) / dc)
    s34 = round((2 * veh["axle_spacing_m"] + veh["gap_34_m"]) / dc)
    sg = round((2 * veh["axle_spacing_m"] + veh["gap_23_min_m"]) / dc)
    lat = [round(-0.4 + 0.1 * i, 10) for i in range(9)] if lateral else [0.0]
    PAD = s12 + s34 + sg + 2 * sa + 4
    ln = N + 2 * PAD
    oc = a + W / 2
    amp = veh["wheel_kN"] * (1 + veh["dla"])
    vp = np.zeros(nr); vn = np.zeros(nr)
    for dv in lat:
        Lw = inf.line(oc + dv - veh["track_m"] / 2, grid); Rw = inf.line(oc + dv + veh["track_m"] / 2, grid)
        A = np.zeros((ln, nr)); A[PAD:PAD + N] = amp * (Lw + Rw)
        Gg = A + _shift(A, sa) + _shift(A, 2 * sa)
        for f1, f2 in ((s12, s34), (s34, s12)):          # both directions of travel
            need = f1 + sg
            P1 = Gg + _shift(Gg, f1); P2 = Gg + _shift(Gg, f2)
            SMx = np.zeros((ln + 1, nr)); SMn = np.zeros((ln + 1, nr))
            SMx[:ln] = np.maximum.accumulate(P2[::-1], axis=0)[::-1]; SMn[:ln] = np.minimum.accumulate(P2[::-1], axis=0)[::-1]
            SMx[:ln] = np.maximum(SMx[:ln], 0); SMn[:ln] = np.minimum(SMn[:ln], 0)
            j = np.arange(ln) + need
            jj = np.minimum(j, ln)
            tx = P1 + np.where((j < ln)[:, None], SMx[jj], 0); tn = P1 + np.where((j < ln)[:, None], SMn[jj], 0)
            vp = np.maximum(vp, np.maximum(tx.max(0), 0)); vn = np.minimum(vn, np.minimum(tn.min(0), 0))
    return pos + vp, neg + vn


def combine_lanes(eff, lf):
    """Lane effects [(pos, neg), ...] -> (max, min): per response the lane effects are ranked (largest adverse first) and
    multiplied by the accompanying lane factors lf[0], lf[1], ... (the last factor repeats)."""
    P = np.sort(np.array([e[0] for e in eff]), axis=0)[::-1]
    Q = np.sort(np.array([e[1] for e in eff]), axis=0)
    fac = np.array([lf[min(i, len(lf) - 1)] for i in range(len(eff))])[:, None]
    return (fac * np.where(P > 0, P, 0)).sum(0), (fac * np.where(Q < 0, Q, 0)).sum(0)


def traffic_envelope(doc, geo, mdl, std, allow_proposed=False, layout="sweep", dc=0.25, sweep_step=0.1, pattern=True, lateral=True,
                     dla_on_udl=False, models=None, inf=None):
    rd = Reader(doc, allow_proposed)
    D = doc.get("deck") or {}
    cl = rd.value(D.get("carriageway_left"), "deck.carriageway_left")
    cr = rd.value(D.get("carriageway_right"), "deck.carriageway_right")
    on = {r["model"]: bool(r.get("on")) for r in rd.rows((doc.get("loads") or {}).get("traffic_models"), "loads.traffic_models")}
    hlp = [k for k, v in on.items() if v and k in ("HLP320", "HLP400")]
    models = models or [k for k, v in on.items() if v and k in ("M1600", "S1600")] + hlp
    if not models:
        raise MissingInput("loads.traffic_models: no M1600 / S1600 / HLP model switched on")
    W = std.get("AS5100.2:traffic:lane_width").value
    lf = list(std.get("AS5100.2:traffic:accompanying_lane_factors").value)
    veh = {mn: std.get(f"AS5100.2:traffic:{mn}").value for mn in models}
    if len([m for m in models if m.startswith("HLP")]) > 1:
        raise MissingInput("loads.traffic_models: more than one HLP model switched on (one register action 'HLP')")
    cws = [(r["left"], r["right"]) for r in rd.rows(D.get("carriageways"), "deck.carriageways", required=False)] or [(cl, cr)]
    per = []                                  # lane layouts of each carriageway (lanes never cross a median)
    for a0, a1 in cws:
        b = a1 - a0
        n = int(math.floor(b / W + 1e-9))
        if n < 1:
            if len(cws) == 1:
                raise MissingInput(f"carriageway {b:.3f} m narrower than one lane ({W} m)")
            per.append([[]]); continue
        if layout == "left":
            per.append([[round(a0 + i * W, 6) for i in range(n)]])
        elif layout == "sweep":
            k = int(math.floor((b - n * W) / sweep_step + 1e-9))
            per.append([[round(a0 + d * sweep_step + i * W, 6) for i in range(n)] for d in range(k + 1)])
        else:
            raise ValueError(f"layout {layout!r}: 'left' or 'sweep'")
    lays = [sum(c, []) for c in itertools.product(*per)]   # every combination of the carriageways' layouts
    n = len(lays[0])
    inf = inf or Influence(mdl)
    N = int(math.floor((inf.c1 - inf.c0) / dc)) + 1
    grid = inf.c0 + dc * np.arange(N)
    env, hlp_acc = {}, None
    for mn in models:
        if mn.startswith("HLP"):     # one platform vehicle, no UDL, no lane factors; register action id "HLP"
            veh[mn] = dict(veh[mn], split=len(geo["supports"]) > 2)   # the central gap is for continuous bridges only
            acc = None
            if on.get(mn + "_with_half_M1600"):   # AS 5100.7-2004 A2.2.5.2: half M1600 in unobstructed lanes unless the authority says otherwise
                acc = {"veh": std.get("AS5100.2:traffic:M1600").value, "factor": 0.5, "lf": lf[1:] or lf[-1:], "cl": cl, "cr": cr}
            hlp_acc = acc
            p = q = None
            for c in cws:   # one HLP, on any carriageway (shortcut: centred on the carriageway; marked-lane pairs not tried)
                pc, qc = platform_effect(inf, grid, dc, veh[mn], (c[0] + c[1]) / 2, acc and dict(acc, cl=c[0], cr=c[1], others=[x for x in cws if x != c]),
                                         c[0], c[1], W, {"pattern": pattern, "lateral": lateral, "dla_on_udl": dla_on_udl})
                p = pc if p is None else np.maximum(p, pc); q = qc if q is None else np.minimum(q, qc)
            env["HLP"] = {"max": p, "min": q, "vehicle": mn, "with_half_M1600": bool(acc)}
            veh["HLP"] = veh[mn]
            continue
        memo = {}
        mx = np.zeros(len(inf.R)); mi = np.zeros(len(inf.R))
        for Lay in lays:
            eff = []
            for a in Lay:
                key = round(a * 1000)
                if key not in memo:
                    memo[key] = lane_effect(inf, grid, dc, veh[mn], a, W, pattern, lateral, dla_on_udl)
                eff.append(memo[key])
            p, q = combine_lanes(eff, lf)
            mx = np.maximum(mx, p); mi = np.minimum(mi, q)
        env[mn] = {"max": mx, "min": mi}
    return {"case": "traffic", "kind": "characteristic (DLA and lane factors included, no load factor)", "models": models, "carriageway_centre": (cl + cr) / 2, "carriageways": cws, "hlp_accompany": hlp_acc, "lanes": n,
            "layouts": lays, "layout_mode": layout, "lane_factors": lf, "responses": inf.R, "env": env, "influence": inf, "vehicles": veh,
            "lane_width": W, "grid": grid,
            "settings": {"dc_m": dc, "sweep_step_m": sweep_step, "pattern_udl": pattern, "lateral_shift": lateral, "dla_on_udl": dla_on_udl, "tag": "Model"},
            "standards_status": std.result_status(), "standards_used": std.usage(),
            "provisional": rd.provisional + list(mdl.get("provisional") or [])}   # the model's provisional inputs carry over


def _platform_axles(veh, dc):
    """Axle-row positions (grid steps from the first row): one train of rows; on continuous bridges (veh["split"]) also
    the two-group variants with every central gap tried."""
    s, n = veh["axle_line_spacing_m"], veh["axle_rows"]
    out = [(None, [round(k * s / dc) for k in range(n)])]
    sp = veh.get("continuous_split")
    if veh.get("split") and sp:
        m = n // sp["groups"]
        for g in np.arange(sp["gap_min_m"], sp["gap_max_m"] + 1e-9, 1.0):   # shortcut: 1 m steps over the gap; refine if it governs
            x = [k * s for k in range(m)]
            out.append((float(g), [round(v / dc) for v in x + [x[-1] + g + v for v in x]]))
    return out


def _platform_scan(inf, grid, dc, veh, oc, r=None, lat=None):
    """Heavy load platform (HLP) scan: every axle line carries len(wheel_offsets) equal wheel loads x (1 + DLA) at
    oc + lateral shift + offset; lateral shift over +-lateral_range in 0.1 m steps; the platform at every grid position
    (also partly off the deck); symmetric in plan, so one direction of travel. r None: (max, min) per response; else
    for response r: {(+1|-1): (value, (shift, gap, start index))}."""
    N = len(grid)
    amp = veh["axle_line_kN"] * (1 + veh["dla"]) / len(veh["wheel_offsets_m"])
    lat = _hlp_shifts(veh) if lat is None else lat
    ax = _platform_axles(veh, dc)
    PAD = max(a[1][-1] for a in ax) + 2
    nr = len(inf.R)
    vp = np.zeros(nr); vn = np.zeros(nr); best = {1: (0.0, None), -1: (0.0, None)}
    for dv in lat:
        A = sum(inf.line(oc + dv + w, grid) for w in veh["wheel_offsets_m"]) * amp
        A = A if r is None else A[:, [r]]
        Z = np.zeros((N + 2 * PAD, A.shape[1])); Z[PAD:PAD + N] = A
        for g, offs in ax:
            E = sum(_shift(Z, o) for o in offs)
            if r is None:
                vp = np.maximum(vp, np.maximum(E.max(0), 0)); vn = np.minimum(vn, np.minimum(E.min(0), 0))
            else:
                for sg in (1, -1):
                    i = int(np.argmax(sg * E[:, 0]))
                    if sg * E[i, 0] > sg * best[sg][0]:
                        best[sg] = (float(E[i, 0]), (dv, g, i - PAD, offs))
    return (vp, vn) if r is None else best


def _hlp_shifts(veh):
    R = veh["lateral_range_m"]
    return [round(-R + 0.1 * i, 10) for i in range(int(round(2 * R / 0.1)) + 1)]


def _accompany_lanes(cl, cr, W, c, occ):
    """Left edges of the standard design lanes outside the strip the HLP occupies ([c - occ/2, c + occ/2]), packed
    outward from the strip on both sides (shortcut: one packing; a sweep of the free lanes is not tried)."""
    out, a = [], c - occ / 2 - W
    while a >= cl - 1e-9:
        out.append(a); a -= W
    a = c + occ / 2
    while a + W <= cr + 1e-9:
        out.append(a); a += W
    return out


def _other_lanes(acc, W):
    """Lanes packed from the left kerb of every other carriageway (shortcut: one packing per carriageway)."""
    return [round(a0 + i * W, 6) for a0, a1 in acc.get("others", []) for i in range(int(math.floor((a1 - a0) / W + 1e-9)))]


def platform_effect(inf, grid, dc, veh, oc, acc=None, cl=None, cr=None, W=None, kw=None):
    """HLP envelope (max, min). acc: {"veh": M1600 vehicle, "factor": 0.5, "lf": accompanying lane factors} -> at every
    lateral shift the HLP plus factor x M1600 in the unobstructed lanes, ranked with lf (the HLP is lane 1, factor 1)."""
    if not acc:
        return _platform_scan(inf, grid, dc, veh, oc)
    occ = min(2 * W, cr - cl)
    nr = len(inf.R); mx = np.zeros(nr); mi = np.zeros(nr); memo = {}
    for dv in _hlp_shifts(veh):
        p, q = _platform_scan(inf, grid, dc, veh, oc, lat=[dv])
        eff = []
        for a in _accompany_lanes(cl, cr, W, oc + dv, occ) + _other_lanes(acc, W):
            k = round(a * 1000)
            if k not in memo:
                e = lane_effect(inf, grid, dc, acc["veh"], a, W, **(kw or {}))
                memo[k] = (acc["factor"] * e[0], acc["factor"] * e[1])
            eff.append(memo[k])
        if eff:
            cp, cq = combine_lanes(eff, acc["lf"]); p = p + cp; q = q + cq
        mx = np.maximum(mx, p); mi = np.minimum(mi, q)
    return mx, mi


def _platform_state(T, r, sign):
    veh, grid, dc, inf = T["vehicles"]["HLP"], T["grid"], T["settings"]["dc_m"], T["influence"]
    st_ = T["settings"]
    amp = veh["axle_line_kN"] * (1 + veh["dla"]) / len(veh["wheel_offsets_m"])
    best = None
    for c in T["carriageways"]:
        oc = (c[0] + c[1]) / 2
        acc = T.get("hlp_accompany") and dict(T["hlp_accompany"], cl=c[0], cr=c[1], others=[x for x in T["carriageways"] if x != c])
        b_ = _platform_state_at(T, r, sign, oc, acc, veh, grid, dc, inf, st_, amp)
        if best is None or sign * b_["value"] > sign * best["value"]:
            best = b_
    return best


def _platform_state_at(T, r, sign, oc, acc, veh, grid, dc, inf, st_, amp):
    best = None
    for dv in (_hlp_shifts(veh) if acc else [None]):
        val, st = _platform_scan(inf, grid, dc, veh, oc, r, lat=None if dv is None else [dv])[sign]
        loads, fac = [], [(oc, 1.0)]
        if st is not None:
            d_, g, i0, offs = st
            for o in offs:
                k = i0 + o
                if 0 <= k < len(grid):
                    loads += [(float(grid[k]), oc + d_ + w, amp) for w in veh["wheel_offsets_m"]]
        if acc:
            occ = min(2 * T["lane_width"], acc["cr"] - acc["cl"])
            lanes = _accompany_lanes(acc["cl"], acc["cr"], T["lane_width"], oc + dv, occ) + _other_lanes(acc, T["lane_width"])
            eff = [_lane_state(inf, grid, dc, acc["veh"], a, T["lane_width"], r, sign, st_["pattern_udl"], st_["lateral_shift"], st_["dla_on_udl"]) for a in lanes]
            order = sorted(range(len(eff)), key=lambda k: -sign * eff[k][0])
            for rank, k in enumerate(order):
                fk = acc["factor"] * acc["lf"][min(rank, len(acc["lf"]) - 1)]
                if sign * eff[k][0] > 0:
                    val += fk * eff[k][0]
                    loads += [(c, o, P * fk) for c, o, P in eff[k][1]]
                    fac.append((lanes[k], fk))
        if best is None or sign * val > sign * best["value"]:
            best = {"value": val, "loads": loads, "layout": [oc], "factors": fac, "platform": st and {"shift_m": st[0], "gap_m": st[1]}}
    return best


# ----------------------------------------------------------------------------------------------------------------
# P4.1 concurrent actions: the load state that produces one envelope value, rebuilt as explicit point loads

def _lane_state(inf, grid, dc, veh, a, W, r, sign, pattern=True, lateral=True, dla_on_udl=False):
    """The lane's contribution to response r (sign +1: max, -1: min) as in lane_effect, with the state that gives it:
    (value, [(ch, o, P) point loads, downward kN])."""
    N = len(grid)
    ns = 8
    fu = (1 + veh["dla"] if dla_on_udl else 1.0) * veh["udl_kN_per_m"] * dc / ns
    offs = [a + (s_ + 0.5) * W / ns for s_ in range(ns)]
    f = sum(inf.line(o, grid)[:, r] for o in offs) * fu
    loads = []
    if pattern:
        on = sign * f > 0
        udl = float(f[on].sum())
        for o in offs:
            loads += [(float(grid[g]), o, fu) for g in np.nonzero(on)[0]]
    else:
        tot = float(f.sum())
        udl = tot if sign * tot > 0 else 0.0
        if udl:
            for o in offs:
                loads += [(float(c), o, fu) for c in grid]
    sa = round(veh["axle_spacing_m"] / dc)
    s12 = round((2 * veh["axle_spacing_m"] + veh["gap_12_m"]) / dc)
    s34 = round((2 * veh["axle_spacing_m"] + veh["gap_34_m"]) / dc)
    sg = round((2 * veh["axle_spacing_m"] + veh["gap_23_min_m"]) / dc)
    lat = [round(-0.4 + 0.1 * i, 10) for i in range(9)] if lateral else [0.0]
    PAD = s12 + s34 + sg + 2 * sa + 4
    ln = N + 2 * PAD
    oc = a + W / 2
    amp = veh["wheel_kN"] * (1 + veh["dla"])
    best, bstate = 0.0, None
    for dv in lat:
        Lw = inf.line(oc + dv - veh["track_m"] / 2, grid)[:, r]; Rw = inf.line(oc + dv + veh["track_m"] / 2, grid)[:, r]
        A = np.zeros(ln); A[PAD:PAD + N] = amp * (Lw + Rw)
        sh = lambda X, k: X if k <= 0 else np.concatenate([X[k:], np.zeros(k)])
        Gg = A + sh(A, sa) + sh(A, 2 * sa)
        for f1, f2 in ((s12, s34), (s34, s12)):
            need = f1 + sg
            P1 = sign * (Gg + sh(Gg, f1)); P2 = sign * (Gg + sh(Gg, f2))
            SM = np.zeros(ln + 1); SM[:ln] = np.maximum(np.maximum.accumulate(P2[::-1])[::-1], 0)   # optional second pair
            j = np.minimum(np.arange(ln) + need, ln)
            tot = P1 + SM[j]
            i = int(np.argmax(tot))
            if tot[i] > best:
                jb = None
                if j[i] < ln and SM[j[i]] > 0:
                    jb = int(j[i] + np.argmax(P2[j[i]:]))
                best, bstate = float(tot[i]), (dv, f1, f2, i, jb)
    if bstate is not None:
        dv, f1, f2, i, jb = bstate
        groups = [i, i + f1] + ([jb, jb + f2] if jb is not None else [])
        for g0 in groups:
            for ax in (g0, g0 + sa, g0 + 2 * sa):
                k = ax - PAD
                if 0 <= k < N:
                    for side in (-1, 1):
                        loads.append((float(grid[k]), oc + dv + side * veh["track_m"] / 2, amp))
    return udl + sign * best, loads


def governing_state(T, model, r, sign=1):
    """Rebuild the load state of traffic envelope value T["env"][model]["max" | "min"][r] (sign +1 / -1): lane layout,
    lanes ranked with the accompanying factors, per lane the patterned UDL and the vehicle position. Returns
    {"value": envelope value from the state, "loads": [(ch, o, P)], "layout": offsets, "factors": [...]}."""
    if model == "HLP":
        return _platform_state(T, r, sign)
    inf, grid, st = T["influence"], T["grid"], T["settings"]
    veh, W, lf = T["vehicles"][model], T["lane_width"], T["lane_factors"]
    best = None
    for Lay in T["layouts"]:
        eff = [_lane_state(inf, grid, st["dc_m"], veh, a, W, r, sign, st["pattern_udl"], st["lateral_shift"], st["dla_on_udl"]) for a in Lay]
        order = sorted(range(len(eff)), key=lambda k: -sign * eff[k][0])
        val, loads, fac = 0.0, [], []
        for rank, k in enumerate(order):
            fk = lf[min(rank, len(lf) - 1)]
            if sign * eff[k][0] > 0:
                val += fk * eff[k][0]
                loads += [(c, o, P * fk) for c, o, P in eff[k][1]]
                fac.append((Lay[k], fk))
        if best is None or sign * val > sign * best["value"]:
            best = {"value": val, "loads": loads, "layout": Lay, "factors": fac}
    return best


def concurrent(T, state):
    """All responses of the influence's response set under an explicit state (downward point loads)."""
    inf = T["influence"]
    if not state["loads"]:
        return np.zeros(len(inf.R))
    P = np.array([(c, o) for c, o, _ in state["loads"]])
    w = np.array([p for _, _, p in state["loads"]])
    Wm = inf.weights(P)
    return np.asarray((Wm.T @ w) @ inf.IM.T).ravel()
