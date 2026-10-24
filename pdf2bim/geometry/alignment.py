"""Horizontal and vertical alignment from a bridge description (MGA coordinates, metres, degrees).

Conventions
- Bearing: whole-circle, clockwise from grid north, degrees. Direction vector (sin b, cos b) in (E, N).
- Offset: positive to the RIGHT of the direction of increasing chainage (deck edge left is negative).
- Horizontal and vertical are computed independently (CONTROL_LINE_RECONSTRUCTION_METHOD §3).

Horizontal elements: tangent, arc, spiral (clothoid: curvature varies linearly with length).
A spiral before an arc is an entry spiral (curvature 0 -> 1/R); after an arc, an exit spiral (1/R -> 0).
'left' turns reduce the bearing with increasing chainage.

The bearing at the start of the first element is not printed in the table; it is CALCULATED from the first
element's start and end coordinates (the start of the next element) and the element's own deflection.
Positions are then integrated element by element from that single seed, and the misclosure at every tabulated
point is reported (validation, method §5) — the table points are never silently snapped to.
"""
import math

GL_X = [-0.9739065285171717, -0.8650633666889845, -0.6794095682990244, -0.4333953941292472, -0.1488743389816312,
        0.1488743389816312, 0.4333953941292472, 0.6794095682990244, 0.8650633666889845, 0.9739065285171717]
GL_W = [0.0666713443086881, 0.1494513491505806, 0.2190863625159820, 0.2692667193099963, 0.2955242247147529,
        0.2955242247147529, 0.2692667193099963, 0.2190863625159820, 0.1494513491505806, 0.0666713443086881]


class GeometryInputError(ValueError):
    """A value the geometry needs is missing or inconsistent. Never defaulted silently."""


def _integrate(theta, s, panels=None):
    """(x, y) = integral_0^s (cos theta(u), sin theta(u)) du, composite 10-point Gauss-Legendre."""
    if s == 0:
        return 0.0, 0.0
    m = panels or max(4, int(abs(s) / 2.0) + 1)
    h = s / m
    x = y = 0.0
    for k in range(m):
        a = k * h
        for xi, wi in zip(GL_X, GL_W):
            u = a + h * (xi + 1) / 2
            t = theta(u)
            x += wi * math.cos(t) * h / 2
            y += wi * math.sin(t) * h / 2
    return x, y


class Element:
    def __init__(self, kind, ch0, length, k0, k1, src):
        self.kind, self.ch0, self.L, self.k0, self.k1, self.src = kind, ch0, length, k0, k1, src  # k: signed curvature (+ = right turn)

    def dtheta(self, s):
        """Change of heading (rad, + = clockwise/right) after length s into the element."""
        if self.L == math.inf or self.kind == "tangent":
            return 0.0
        return self.k0 * s + (self.k1 - self.k0) * s * s / (2 * self.L)

    def local(self, s):
        """Position after s, in the element frame (x along the start tangent, y to the RIGHT)."""
        if self.kind == "tangent":
            return s, 0.0
        if self.kind == "arc":
            k = self.k0
            return math.sin(k * s) / k, (1 - math.cos(k * s)) / k
        return _integrate(self.dtheta, s)


class Alignment:
    def __init__(self, rows, vertical_rows=None):
        """rows: horizontal table rows' cells, in order; vertical_rows: vertical table cells."""
        if not rows:
            raise GeometryInputError("alignment.horizontal has no rows")
        self.rows = rows
        self.elements = []
        kinds = [r.get("element") for r in rows]
        for i, r in enumerate(rows):
            kind = r.get("element")
            if kind not in ("tangent", "arc", "spiral"):
                raise GeometryInputError(f"horizontal row {i}: unknown element {kind!r}")
            for k in ("ch_start", "E_start", "N_start"):
                if r.get(k) is None:
                    raise GeometryInputError(f"horizontal row {i}: {k} missing")
            L = r.get("length")
            if L is None:
                if i != len(rows) - 1 or kind != "tangent":
                    raise GeometryInputError(f"horizontal row {i}: length missing (only a final tangent may be open-ended)")
                L = math.inf
            if i + 1 < len(rows) and abs(rows[i + 1]["ch_start"] - (r["ch_start"] + L)) > 0.0005:
                raise GeometryInputError(f"horizontal row {i}: ch_start + length = {r['ch_start'] + L:.4f} but next element starts at {rows[i + 1]['ch_start']}")
            sgn = {"right": 1, "left": -1, None: 0}.get(r.get("direction"))
            if sgn is None:
                raise GeometryInputError(f"horizontal row {i}: direction must be 'left' or 'right'")
            if kind == "tangent":
                k0 = k1 = 0.0
            else:
                R = r.get("radius")
                if not R:
                    raise GeometryInputError(f"horizontal row {i}: radius missing for {kind}")
                if sgn == 0:
                    raise GeometryInputError(f"horizontal row {i}: direction missing for {kind}")
                k = sgn / R
                if kind == "arc":
                    k0 = k1 = k
                else:
                    nxt = kinds[i + 1] if i + 1 < len(kinds) else None
                    prv = kinds[i - 1] if i > 0 else None
                    if nxt == "arc":
                        k0, k1 = 0.0, k
                    elif prv == "arc":
                        k0, k1 = k, 0.0
                    else:
                        raise GeometryInputError(f"horizontal row {i}: spiral must be next to an arc (entry or exit)")
            self.elements.append(Element(kind, r["ch_start"], L, k0, k1, i))
        # seed bearing at the start of element 0 from its end point (= next element's tabulated start)
        e0 = self.elements[0]
        if len(rows) < 2:
            raise GeometryInputError("need at least two tabulated points to fix the start bearing")
        dE, dN = rows[1]["E_start"] - rows[0]["E_start"], rows[1]["N_start"] - rows[0]["N_start"]
        chord_brg = math.degrees(math.atan2(dE, dN))
        lx, ly = e0.local(e0.L)
        defl = math.degrees(math.atan2(ly, lx))  # + = chord lies to the right of the start tangent
        self.seed_bearing = (chord_brg - defl) % 360
        self.seed_derivation = {"formula": "bearing(TS->next point) − deflection of the chord in element 0",
                                "chord_bearing": chord_brg, "chord_deflection": defl}
        # integrate the start state of every element from the single seed
        E, N, b = rows[0]["E_start"], rows[0]["N_start"], math.radians(self.seed_bearing)
        self.state = []
        for e in self.elements:
            self.state.append((E, N, b))
            if e.L == math.inf:
                break
            x, y = e.local(e.L)
            E, N = E + x * math.sin(b) + y * math.cos(b), N + x * math.cos(b) - y * math.sin(b)
            b = b + e.dtheta(e.L)
        self.vertical = Vertical(vertical_rows) if vertical_rows else None

    # ---------- evaluation ----------
    def _find(self, ch):
        for i, e in enumerate(self.elements):
            if ch < e.ch0 - 1e-9:
                break
            if ch <= e.ch0 + e.L + 1e-9 or i == len(self.elements) - 1:
                last = i
        else:
            pass
        idx = [i for i, e in enumerate(self.elements) if e.ch0 - 1e-9 <= ch]
        if not idx:
            raise GeometryInputError(f"chainage {ch} before the start of the alignment ({self.elements[0].ch0})")
        i = idx[-1]
        e = self.elements[i]
        if ch > e.ch0 + e.L + 1e-6:
            raise GeometryInputError(f"chainage {ch} beyond the end of the alignment")
        return i, e

    def point(self, ch, offset=0.0):
        """(E, N, bearing_deg) of the control line at ch, moved `offset` to the right (normal to the control line)."""
        i, e = self._find(ch)
        E0, N0, b0 = self.state[i]
        s = ch - e.ch0
        x, y = e.local(s)
        E, N = E0 + x * math.sin(b0) + y * math.cos(b0), N0 + x * math.cos(b0) - y * math.sin(b0)
        b = b0 + e.dtheta(s)
        if offset:
            E, N = E + offset * math.cos(b), N - offset * math.sin(b)
        return E, N, math.degrees(b) % 360

    def station(self, E, N, guess=None):
        """(ch, offset) of a point: Newton iteration on (P − C(ch))·t = 0."""
        ch = guess if guess is not None else self.elements[0].ch0 + 1.0
        for _ in range(60):
            cE, cN, b = self.point(ch)
            br = math.radians(b)
            t = (math.sin(br), math.cos(br))
            f = (E - cE) * t[0] + (N - cN) * t[1]
            if abs(f) < 1e-10:
                break
            ch += f  # derivative of the along-track distance w.r.t. ch is ~1 (exact on a tangent)
        cE, cN, b = self.point(ch)
        br = math.radians(b)
        off = (E - cE) * math.cos(br) - (N - cN) * math.sin(br)
        return ch, off

    def misclosure(self):
        """Distance between the integrated and the tabulated start point of every element (method §5)."""
        out = []
        for i, r in enumerate(self.rows):
            if i == 0:
                continue
            E, N, _ = self.state[i] if i < len(self.state) else (None, None, None)
            out.append({"row": i, "ch": r["ch_start"], "dE": E - r["E_start"], "dN": N - r["N_start"],
                        "dist": math.hypot(E - r["E_start"], N - r["N_start"])})
        return out


class Vertical:
    """Grade polyline through the tabulated points; a symmetric parabolic curve at each point with a curve_length."""

    def __init__(self, rows):
        pts = sorted(rows, key=lambda r: r["ch"])
        if len(pts) < 2:
            raise GeometryInputError("alignment.vertical needs at least two points")
        for r in pts:
            if r.get("ch") is None or r.get("RL") is None:
                raise GeometryInputError("alignment.vertical: ch and RL required on every row")
        self.pts = pts
        self.g = [(b["RL"] - a["RL"]) / (b["ch"] - a["ch"]) for a, b in zip(pts, pts[1:])]
        self.curves = []
        for i, r in enumerate(pts):
            Lc = r.get("curve_length")
            if Lc:
                if i == 0 or i == len(pts) - 1:
                    raise GeometryInputError("a vertical curve needs grades on both sides of its point")
                self.curves.append((r["ch"] - Lc / 2, r["ch"] + Lc / 2, self.g[i - 1], self.g[i], i))

    def grade_rl(self, ch):
        pts = self.pts
        if ch < pts[0]["ch"] - 1e-6 or ch > pts[-1]["ch"] + 1e-6:
            raise GeometryInputError(f"chainage {ch} outside the vertical alignment {pts[0]['ch']}–{pts[-1]['ch']}")
        for i, (a, b) in enumerate(zip(pts, pts[1:])):
            if ch <= b["ch"] + 1e-9:
                return a["RL"] + self.g[i] * (ch - a["ch"])
        return pts[-1]["RL"]

    def rl(self, ch):
        """Design RL of the control line at ch."""
        z = self.grade_rl(ch)
        for c0, c1, g1, g2, i in self.curves:
            if c0 - 1e-9 <= ch <= c1 + 1e-9:
                x = ch - c0
                Lc = c1 - c0
                z0 = self.pts[i]["RL"] - g1 * Lc / 2  # grade-line RL at the start of the curve
                return z0 + g1 * x + (g2 - g1) * x * x / (2 * Lc)
        return z
