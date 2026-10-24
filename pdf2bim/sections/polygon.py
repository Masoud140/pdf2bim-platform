"""Section properties of polygons (Green's theorem, exact for straight-edged outlines).

Units follow the input (mm -> mm^2, mm^4). x horizontal (transverse), y vertical (up). A polygon can be solid (+) or a
void (−); a part can carry a modular ratio n (E_part / E_reference) for transformed composite sections.

    props([Part(outline, n=1.0), Part(void, n=1.0, void=True), Part(deck, n=Ed/Eg)])
    -> {'A', 'xc', 'yc', 'Ix' (about the horizontal centroidal axis = vertical bending), 'Iy' (about the vertical axis), 'Ixy'}
"""
from collections import namedtuple

Part = namedtuple("Part", "pts n void", defaults=(1.0, False))


def raw(pts):
    """Signed-area-independent raw integrals of one simple polygon: A, Sx=∫y, Sy=∫x, Ixx=∫y², Iyy=∫x², Ixy=∫xy (about the origin)."""
    a = sx = sy = ixx = iyy = ixy = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        c = x0 * y1 - x1 * y0
        a += c
        sx += (y0 + y1) * c
        sy += (x0 + x1) * c
        ixx += (y0 * y0 + y0 * y1 + y1 * y1) * c
        iyy += (x0 * x0 + x0 * x1 + x1 * x1) * c
        ixy += (x0 * y1 + 2 * x0 * y0 + 2 * x1 * y1 + x1 * y0) * c
    s = 1.0 if a >= 0 else -1.0  # orientation-independent
    return {"A": s * a / 2, "Sx": s * sx / 6, "Sy": s * sy / 6, "Ixx": s * ixx / 12, "Iyy": s * iyy / 12, "Ixy": s * ixy / 24}


def props(parts):
    tot = {"A": 0.0, "Sx": 0.0, "Sy": 0.0, "Ixx": 0.0, "Iyy": 0.0, "Ixy": 0.0}
    for p in parts:
        r = raw(p.pts)
        w = -p.n if p.void else p.n
        for k in tot:
            tot[k] += w * r[k]
    A = tot["A"]
    if A <= 0:
        raise ValueError("section area is not positive")
    xc, yc = tot["Sy"] / A, tot["Sx"] / A
    return {"A": A, "xc": xc, "yc": yc,
            "Ix": tot["Ixx"] - A * yc * yc,   # about the horizontal centroidal axis (vertical bending)
            "Iy": tot["Iyy"] - A * xc * xc,   # about the vertical centroidal axis (lateral bending)
            "Ixy": tot["Ixy"] - A * xc * yc}
