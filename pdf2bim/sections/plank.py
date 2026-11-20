"""Plank sections (ADR-085 stage 1): side-by-side precast planks, solid or voided, with an optional composite deck overlay.

Inputs are a superstructure.plank_types entry's values (mm): width, depth, voids rows (shape circle / rect, x from the
plank centreline, y from the plank soffit, size = diameter or side) and the overlay (thickness, strip width, modular ratio
n = E_deck / E_plank). Properties by polygons (exact for straight edges; circles as 72-gons) and St-Venant J by the
finite-difference Prandtl solution (torsion.py), as the Super-T sections. y up from the plank soffit.
"""
import math

from .polygon import Part, props
from .torsion import torsion_J


def _circle(xc, yc, d, n=72):
    r = d / 2
    return [(xc + r * math.cos(2 * math.pi * i / n), yc + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def _rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def plank_section(width, depth, voids=(), overlay=0.0, strip=None, n_deck=1.0, torsion_h=5.0):
    """-> {"plank": props of the plank alone, "composite": transformed props with the overlay strip (if any),
    "J_plank", "J_composite" (overlay transformed by n_deck), "outline", "voids"}. Units mm."""
    if width <= 0 or depth <= 0:
        raise ValueError(f"plank width / depth must be positive, got {width} / {depth}")
    out = _rect(-width / 2, 0.0, width / 2, depth)
    vs = []
    for v in voids:
        sh, x, y, sz = v.get("shape", "circle"), float(v["x"]), float(v["y"]), float(v["size"])
        if not (-width / 2 < x - sz / 2 and x + sz / 2 < width / 2 and 0 < y - sz / 2 and y + sz / 2 < depth):
            raise ValueError(f"void at x {x}, y {y}, size {sz} is not inside the {width} x {depth} plank")
        vs.append(_circle(x, y, sz) if sh == "circle" else _rect(x - sz / 2, y - sz / 2, x + sz / 2, y + sz / 2))
    P = [Part(out)] + [Part(v, void=True) for v in vs]
    res = {"outline": out, "voids": vs, "plank": props(P), "J_plank": torsion_J([out], vs, torsion_h)}
    if overlay > 0:
        s = width if strip is None else strip
        deck = _rect(-s / 2, depth, s / 2, depth + overlay)
        res["composite"] = props(P + [Part(deck, n=n_deck)])
        # torsion of the composite: overlay width scaled by n (transformed section, as the Super-T composite J)
        res["J_composite"] = torsion_J([out, _rect(-s * n_deck / 2, depth, s * n_deck / 2, depth + overlay)], vs, torsion_h)
    return res
