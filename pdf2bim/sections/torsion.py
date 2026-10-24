"""Saint-Venant torsion constant J of a polygonal section (solid, open or closed-cell), by finite differences on the
Prandtl stress function. Port of the project's validated script claude/torsion_fd.py (same method, same boundary
treatment), generalised to multi-material composite sections by the usual approximation of transforming widths
is NOT done here: J is computed for a single material region; for a composite (girder + deck) the deck is included
geometrically and the result is referred to the girder modulus by the caller (see girder.py).

    J = torsion_J(solids=[outline, deck], voids=[void], h=5.0)     # mm -> mm^4

Validation (tests/sections/test_sections.py): solid rectangle vs the exact series (< 0.5 %), thin square tube vs
Bredt, mesh convergence (h and h/2 within 2 %, VERIFICATION_STRATEGY T6).
"""
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spl
from matplotlib.path import Path
from scipy import ndimage


def raster(solids, voids, h):
    allp = np.vstack([np.asarray(p, float) for p in solids])
    x0, y0 = allp.min(0) - 2 * h
    x1, y1 = allp.max(0) + 2 * h
    nx, ny = int((x1 - x0) / h) + 1, int((y1 - y0) / h) + 1
    xs, ys = x0 + (np.arange(nx) + 0.5) * h, y0 + (np.arange(ny) + 0.5) * h
    X, Y = np.meshgrid(xs, ys, indexing="ij")
    pts = np.c_[X.ravel(), Y.ravel()]
    solid = np.zeros(nx * ny, bool)
    for p in solids:
        solid |= Path(np.asarray(p, float)).contains_points(pts)
    for p in voids:
        solid &= ~Path(np.asarray(p, float)).contains_points(pts)
    return solid.reshape(nx, ny)


def J_prandtl(solid, h):
    nx, ny = solid.shape
    lab, nl = ndimage.label(~solid)
    ext = set(np.unique(np.r_[lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]])) - {0}
    holes = [l for l in range(1, nl + 1) if l not in ext]
    idx = -np.ones(solid.shape, int)
    idx[solid] = np.arange(solid.sum())
    n = int(solid.sum())
    hid = {l: i for i, l in enumerate(holes)}
    nh = len(holes)
    b = np.zeros(n + nh)
    ri, ci, vi = [], [], []
    ii, jj = np.nonzero(solid)
    diag = np.full(n, -4.0)
    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ni, nj = ii + di, jj + dj
        inb = (ni >= 0) & (ni < nx) & (nj >= 0) & (nj < ny)
        nbs = np.zeros(n, bool)
        nbs[inb] = solid[ni[inb], nj[inb]]
        sel = np.nonzero(nbs)[0]
        ri += list(sel); ci += list(idx[ni[sel], nj[sel]]); vi += [1.0] * len(sel)
        for k in np.nonzero(~nbs)[0]:
            diag[k] -= 1.0  # ghost value = -phi (exterior) or 2c - phi (hole): boundary at the cell face
            if inb[k]:
                l = lab[ni[k], nj[k]]
                if l in hid:
                    ri.append(k); ci.append(n + hid[l]); vi.append(2.0)
    ri += list(range(n)); ci += list(range(n)); vi += list(diag)
    b[:n] = -2.0 * h * h
    for l, k in hid.items():
        cells = np.argwhere(lab == l)
        nfaces = 0
        for a, q in cells:
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p, r = a + di, q + dj
                if 0 <= p < nx and 0 <= r < ny and solid[p, r]:
                    ri.append(n + k); ci.append(idx[p, r]); vi.append(-1.0); nfaces += 1
        ri.append(n + k); ci.append(n + k); vi.append(float(nfaces)); b[n + k] = len(cells) * h * h
    A = sp.csr_matrix((vi, (ri, ci)), shape=(n + nh, n + nh))
    u = spl.spsolve(A.tocsc(), b)
    phi, c = u[:n], u[n:]
    return 2.0 * h * h * phi.sum() + sum(2.0 * c[k] * (np.count_nonzero(lab == l) * h * h) for l, k in hid.items())


def torsion_J(solids, voids=(), h=5.0):
    """J (units^4) of the union of `solids` minus `voids`, mesh size h."""
    return float(J_prandtl(raster(solids, list(voids), h), h))


def rect_J_exact(a, b):
    """Exact (series) St-Venant J of a solid a x b rectangle, a >= b."""
    a, b = max(a, b), min(a, b)
    s = sum((1.0 / n ** 5) * np.tanh(n * np.pi * a / (2 * b)) for n in range(1, 400, 2))
    return a * b ** 3 / 3 * (1 - 192 / np.pi ** 5 * (b / a) * s)
