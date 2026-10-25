"""Response quantities of the integrated model, as linear functionals of the displacements (stage P3c).

    from pdf2bim.model.responses import ResponseSet
    RS = ResponseSet(mdl)                 # after mdl["model"] has been solved or assembled once
    v = RS.static(gravity=(0, 0, -1), loads=..., imposed=...)    # exact values for one static load case
    RS.matrix                              # (responses x all dofs) sparse: value = matrix @ u (no member loads)

Names (tuples):
  ("B",  bearing, "FX" | "FY" | "FZ")   force of the bearing link on its top (girder) node, global axes
  ("BL", bearing, "v" | "tr" | "lon")   link axes: v = vertical (compression +), tr = transverse, lon = longitudinal
  ("P",  (pile, element), q)            pile element: My1, Mz1, My2, Mz2 (local end moments, forces on the element),
                                        Vy, Vz (local shear, end 1), N1 / N2 (axial force at the end, COMPRESSION +),
                                        Ml1 / Ml2, Mt1 / Mt2 (section moment at the end, global, about the support's
                                        sill axis (l) and about its horizontal normal (t))
  ("H",  pile, "ux" | "uy")             pile-head displacement
  ("S",  "springs", "X" | "Y")          total force of all springs on the structure
Member-end quantities include the member's fixed-end forces (self weight, imposed strain) in `static`, so they are
exact for every load case; `matrix` alone is exact for nodal loads and dynamic (modal) responses.
The sill axis of a support is the horizontal direction between its two most distant sill nodes, oriented from the first
to the last sill node in the support's node order (only its line matters for |M|)."""
import numpy as np
import scipy.sparse as sp

DOF = 6


def _sill_axes(mdl):
    m = mdl["model"]
    out = {}
    for sid, s in mdl["supports"].items():
        P = np.array([m.nodes[k][:2] for k in s["sill_nodes"]], float)
        d = P[:, None, :] - P[None, :, :]
        i, j = np.unravel_index(np.argmax((d ** 2).sum(-1)), (len(P), len(P)))
        i, j = min(i, j), max(i, j)
        u = P[j] - P[i]
        u = u / np.linalg.norm(u) if np.linalg.norm(u) > 1e-9 else np.array([1.0, 0.0])
        out[sid] = (u, np.array([-u[1], u[0]]))
    return out


class ResponseSet:
    def __init__(self, mdl):
        m = mdl["model"]
        if not getattr(m, "_el", None):
            m.solve(gravity=(0.0, 0.0, 0.0), loads={})      # assemble element data
        ids = sorted(m.nodes)
        self.idx = idx = {n: i for i, n in enumerate(ids)}
        self.nd = nd = DOF * len(ids)
        self.mdl, self.m = mdl, m
        names, rows, el_rows = [], [], []                  # rows: (dofs, coefficients); el_rows: (row, element key, c12)

        def el_row(name, key, c12):
            L, Rm, T, K, fl, dofs = m._el[key]
            el_rows.append((len(names), key, np.asarray(c12, float)))
            names.append(name); rows.append((dofs, np.asarray(c12, float) @ K @ T))

        for bid, b in sorted(mdl["bearings"].items()):
            key = ("link", b["link"])
            L, Rm, T, Kl, fl, dofs = m._el[key]
            for c, lab in enumerate("XYZ"):
                c12 = np.zeros(12); c12[6:9] = -Rm[:, c]       # global force on n2 = -(R^T f[6:9]) component c
                el_row(("B", bid, "F" + lab), key, c12)
            for c, lab, sg in ((0, "v", 1.0), (1, "tr", -1.0), (2, "lon", -1.0)):
                c12 = np.zeros(12); c12[c] = sg
                el_row(("BL", bid, lab), key, c12)
        axes = _sill_axes(mdl)
        for sid, s in mdl["supports"].items():
            u, n = axes[sid]
            for p in s["piles"]:
                ch = set(p["chain"])
                for eid, bm in m.beams.items():
                    if bm["n1"] in ch and bm["n2"] in ch:
                        Rm = m._el[eid][1]
                        pe = ("P", (p["id"], eid))
                        for j, lab in ((4, "My1"), (5, "Mz1"), (10, "My2"), (11, "Mz2"), (1, "Vy"), (2, "Vz")):
                            c12 = np.zeros(12); c12[j] = 1.0
                            el_row(pe + (lab,), eid, c12)
                        for end in (0, 1):
                            c12 = np.zeros(12)
                            if end == 0:
                                c12[0] = 1.0
                            else:
                                c12[6] = -1.0
                            el_row(pe + (f"N{end + 1}",), eid, c12)
                            sg = -1.0 if end == 0 else 1.0           # section moment at the end, local -> global
                            for ax, lab in ((u, "Ml"), (n, "Mt")):
                                c12 = np.zeros(12)
                                g = Rm.T[:2, :]                          # global x, y rows of R^T (local m -> global)
                                c12[6 * end + 3:6 * end + 6] = sg * (ax @ g)
                                el_row(pe + (f"{lab}{end + 1}",), eid, c12)
                for c, lab in ((0, "ux"), (1, "uy")):
                    names.append(("H", p["id"], lab)); rows.append(([DOF * idx[p["head"]] + c], np.array([1.0])))
        for c, lab in ((0, "X"), (1, "Y")):
            dofs, vals = [], []
            for nn, k in m.springs.items():
                if k[c]:
                    dofs.append(DOF * idx[nn] + c); vals.append(-k[c])
            names.append(("S", "springs", lab)); rows.append((dofs, np.array(vals)))
        r_, c_, v_ = [], [], []
        for i, (dofs, row) in enumerate(rows):
            r_ += [i] * len(dofs); c_ += list(dofs); v_ += list(row)
        self.names = names
        self.index = {nm: i for i, nm in enumerate(names)}
        self.matrix = sp.csr_matrix((v_, (r_, c_)), shape=(len(rows), nd))
        self._el_rows = el_rows

    def from_u(self, u):
        """Values for a full displacement vector u (all dofs), no member loads."""
        return np.asarray(self.matrix @ u).ravel()

    def static(self, gravity=(0.0, 0.0, 0.0), loads=None, imposed=None):
        """Solve one static load case and return the exact response values (fixed-end forces included)."""
        m = self.m
        m.solve(gravity=gravity, loads=loads if loads is not None else {}, imposed=imposed)
        if sorted(m._idx) != sorted(self.idx) or m._idx != self.idx:
            raise ValueError("model node numbering changed since the response set was built")
        v = self.from_u(m._u)
        for i, key, c12 in self._el_rows:
            v[i] -= c12 @ m._el[key][4]
        return v
