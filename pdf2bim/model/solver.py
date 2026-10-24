"""Linear static 3D frame solver (Timoshenko beams, elastic links, nodal springs, fixed dofs). kN, m.

    m = Model()
    m.node(id, x, y, z)
    m.beam(id, n1, n2, E, nu, A, Iy, Iz, J, Asy, Asz, w=0.0, role='girder')   # w: self weight kN/m (gravity -Z)
    m.link(id, n1, n2, k=(kx, ky, kz, krx, kry, krz), axes=None)          # elastic link, local axes (rows) or global
    m.spring(node, k=(kx, ky, kz, krx, kry, krz))                          # node to ground
    m.fix(node, dofs='111000')
    m.load(node, (Fx, Fy, Fz, Mx, My, Mz))
    r = m.solve()   # displacements, reactions (fixed dofs + springs), member end forces, equilibrium check

Conventions (MIDAS, beta = 0, as in claude/ANALYSIS_METHOD.md): local x = n1 -> n2; local y = Z x x (horizontal),
local z = x x y (up). Iy = bending about local y = VERTICAL bending (pairs with Asz); Iz = horizontal (pairs with Asy).
Vertical members: y = global Y. Asy / Asz = None or 0 -> Euler-Bernoulli in that plane.
"""
import math
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spl

DOF = 6
# Refusal thresholds (Model, P3b): a true mechanism gives an LU pivot ratio ~1e-16; valid first-case models ~1e-8 with
# 1e9 / 1e-3 stiffness contrasts. Residual check on the free dofs relative to the largest load term.
PIVOT_RATIO_MIN = 1e-13
RESID_REL_MAX = 1e-4


def axes(p1, p2):
    x = np.asarray(p2, float) - np.asarray(p1, float)
    L = float(np.linalg.norm(x))
    if L <= 0:
        raise ValueError("zero-length element")
    x /= L
    Z = np.array([0.0, 0.0, 1.0])
    if np.linalg.norm(np.cross(x, Z)) < 1e-6:
        y = np.array([0.0, 1.0, 0.0]); z = np.cross(x, y); z /= np.linalg.norm(z); y = np.cross(z, x)
    else:
        y = np.cross(Z, x); y /= np.linalg.norm(y); z = np.cross(x, y)
    return L, np.array([x, y, z])


def k_local(E, G, A, Iy, Iz, J, Asy, Asz, L):
    phy = 12 * E * Iz / (G * Asy * L * L) if Asy else 0.0
    phz = 12 * E * Iy / (G * Asz * L * L) if Asz else 0.0
    K = np.zeros((12, 12))
    EA, GJ = E * A / L, G * J / L
    K[0, 0] = K[6, 6] = EA; K[0, 6] = K[6, 0] = -EA
    K[3, 3] = K[9, 9] = GJ; K[3, 9] = K[9, 3] = -GJ
    a = 12 * E * Iz / (L ** 3 * (1 + phy)); b = 6 * E * Iz / (L ** 2 * (1 + phy))
    c = (4 + phy) * E * Iz / (L * (1 + phy)); d = (2 - phy) * E * Iz / (L * (1 + phy))
    for i, j, v in [(1, 1, a), (1, 5, b), (1, 7, -a), (1, 11, b), (5, 5, c), (5, 7, -b), (5, 11, d), (7, 7, a), (7, 11, -b), (11, 11, c)]:
        K[i, j] = K[j, i] = v
    a = 12 * E * Iy / (L ** 3 * (1 + phz)); b = 6 * E * Iy / (L ** 2 * (1 + phz))
    c = (4 + phz) * E * Iy / (L * (1 + phz)); d = (2 - phz) * E * Iy / (L * (1 + phz))
    for i, j, v in [(2, 2, a), (2, 4, -b), (2, 8, -a), (2, 10, -b), (4, 4, c), (4, 8, b), (4, 10, d), (8, 8, a), (8, 10, b), (10, 10, c)]:
        K[i, j] = K[j, i] = v
    return K


def fef_uniform(q, L):
    """Fixed-end forces (nodal equivalent loads) of a uniform local load q = (qx, qy, qz) per length."""
    f = np.zeros(12)
    f[0] = f[6] = q[0] * L / 2
    f[1] = f[7] = q[1] * L / 2; f[5] = q[1] * L * L / 12; f[11] = -q[1] * L * L / 12
    f[2] = f[8] = q[2] * L / 2; f[4] = -q[2] * L * L / 12; f[10] = q[2] * L * L / 12
    return f


def m_local(mu, Ip, L):
    """Consistent element mass (local axes), as the dashboard's mLocal: axial and torsion linear, bending Hermite."""
    M = np.zeros((12, 12))

    def st(i, j, v):
        M[i, j] = v; M[j, i] = v
    m6 = mu * L / 6
    st(0, 0, 2 * m6); st(6, 6, 2 * m6); st(0, 6, m6)
    t6 = Ip * L / 6
    st(3, 3, 2 * t6); st(9, 9, 2 * t6); st(3, 9, t6)
    k = mu * L / 420
    st(1, 1, 156 * k); st(1, 5, 22 * L * k); st(1, 7, 54 * k); st(1, 11, -13 * L * k); st(5, 5, 4 * L * L * k); st(5, 7, 13 * L * k)
    st(5, 11, -3 * L * L * k); st(7, 7, 156 * k); st(7, 11, -22 * L * k); st(11, 11, 4 * L * L * k)
    st(2, 2, 156 * k); st(2, 4, -22 * L * k); st(2, 8, 54 * k); st(2, 10, 13 * L * k); st(4, 4, 4 * L * L * k); st(4, 8, -13 * L * k)
    st(4, 10, -3 * L * L * k); st(8, 8, 156 * k); st(8, 10, 22 * L * k); st(10, 10, 4 * L * L * k)
    return M


class Model:
    def __init__(self):
        self.nodes, self.beams, self.links, self.springs, self.fixed, self.loads = {}, {}, {}, {}, {}, {}

    def node(self, i, x, y, z):
        self.nodes[i] = np.array([x, y, z], float)

    def beam(self, i, n1, n2, E, nu, A, Iy, Iz, J, Asy=None, Asz=None, w=0.0, role="", **meta):
        self.beams[i] = dict(n1=n1, n2=n2, E=E, G=E / (2 * (1 + nu)), A=A, Iy=Iy, Iz=Iz, J=J, Asy=Asy, Asz=Asz, w=w, role=role, **meta)

    def link(self, i, n1, n2, k, axes=None, beta=None, dry=0.5, drz=0.5, role="link", **meta):
        """Elastic link (MIDAS GEN type). k = (kx, ky, kz, krx, kry, krz) in link axes.
        axes: 3x3 rows (x, y, z); or beta (deg): axes from n1 -> n2 rotated by beta about x (MIDAS convention), with the
        shear springs acting at dry / drz of the length from n1 (couples shear with end rotations, as MIDAS / dashboard)."""
        self.links[i] = dict(n1=n1, n2=n2, k=np.asarray(k, float), R=None if axes is None else np.asarray(axes, float),
                             beta=beta, dry=dry, drz=drz, role=role, **meta)

    def spring(self, n, k):
        self.springs[n] = self.springs.get(n, np.zeros(6)) + np.asarray(k, float)

    def fix(self, n, dofs="111111"):
        self.fixed[n] = [i for i, c in enumerate(dofs) if c == "1"]

    def load(self, n, f):
        self.loads[n] = self.loads.get(n, np.zeros(6)) + np.asarray(f, float)

    # ------------------------------------------------------------------
    def solve(self, gravity=(0.0, 0.0, -1.0), loads=None):
        """gravity: self-weight direction (0 vector = no self weight). loads: {node: (Fx..Mz)} for this solve only
        (a load case); None = the loads added with load()."""
        nodal = self.loads if loads is None else {n: np.asarray(f, float) for n, f in loads.items()}
        ids = sorted(self.nodes)
        idx = {n: i for i, n in enumerate(ids)}
        nd = DOF * len(ids)
        rows, cols, vals = [], [], []
        F = np.zeros(nd)
        self._el = {}
        g = np.asarray(gravity, float)
        tot_w = np.zeros(3)
        for eid, e in self.beams.items():
            L, R = axes(self.nodes[e["n1"]], self.nodes[e["n2"]])
            K = k_local(e["E"], e["G"], e["A"], e["Iy"], e["Iz"], e["J"], e["Asy"], e["Asz"], L)
            T = np.kron(np.eye(4), R)
            Kg = T.T @ K @ T
            q = R @ (g * e["w"])
            fl = fef_uniform(q, L)
            dofs = [DOF * idx[e["n1"]] + k for k in range(6)] + [DOF * idx[e["n2"]] + k for k in range(6)]
            ii, jj = np.meshgrid(dofs, dofs, indexing="ij")
            rows += list(ii.ravel()); cols += list(jj.ravel()); vals += list(Kg.ravel())
            F[dofs] += T.T @ fl
            tot_w += g * e["w"] * L
            self._el[eid] = (L, R, T, K, fl, dofs)
        for lid, l in self.links.items():
            k = l["k"]
            p1, p2 = self.nodes[l["n1"]], self.nodes[l["n2"]]
            Ll = float(np.linalg.norm(p2 - p1))
            if l["R"] is not None or Ll == 0:
                R = l["R"] if l["R"] is not None else np.eye(3)
                a1 = b1 = a2 = b2 = 0.0
            else:
                x = (p2 - p1) / Ll
                b = np.radians(l["beta"] or 0.0)
                if np.hypot(x[0], x[1]) < 1e-6:
                    z0 = np.array([np.cos(b), np.sin(b), 0.0]); y = np.cross(z0, x); y /= np.linalg.norm(y); z = np.cross(x, y)
                else:
                    y0 = np.cross([0, 0, 1.0], x); y0 /= np.linalg.norm(y0); z1 = np.cross(x, y0)
                    y = np.cos(b) * y0 + np.sin(b) * z1; z = np.cross(x, y)
                R = np.array([x, y, z])
                a1, b1, a2, b2 = l["dry"] * Ll, (1 - l["dry"]) * Ll, l["drz"] * Ll, (1 - l["drz"]) * Ll
            T = np.kron(np.eye(4), R)
            Kl = np.zeros((12, 12))
            gv = []
            g = np.zeros(12); g[0], g[6] = -1, 1; gv.append(g)
            g = np.zeros(12); g[1], g[5], g[7], g[11] = -1, -a1, 1, -b1; gv.append(g)
            g = np.zeros(12); g[2], g[4], g[8], g[10] = -1, a2, 1, b2; gv.append(g)
            for d in (3, 4, 5):
                g = np.zeros(12); g[d], g[d + 6] = -1, 1; gv.append(g)
            for d in range(6):
                if k[d]:
                    Kl += k[d] * np.outer(gv[d], gv[d])
            Kg = T.T @ Kl @ T
            dofs = [DOF * idx[l["n1"]] + k for k in range(6)] + [DOF * idx[l["n2"]] + k for k in range(6)]
            ii, jj = np.meshgrid(dofs, dofs, indexing="ij")
            rows += list(ii.ravel()); cols += list(jj.ravel()); vals += list(Kg.ravel())
            self._el[("link", lid)] = (None, R, T, Kl, np.zeros(12), dofs)
        for n, k in self.springs.items():
            for d in range(6):
                if k[d]:
                    rows.append(DOF * idx[n] + d); cols.append(DOF * idx[n] + d); vals.append(k[d])
        for n, f in nodal.items():
            F[DOF * idx[n]:DOF * idx[n] + 6] += f
        Kt = sp.csr_matrix((vals, (rows, cols)), shape=(nd, nd))
        fixed = sorted(DOF * idx[n] + d for n, ds in self.fixed.items() for d in ds)
        free = np.setdiff1d(np.arange(nd), fixed)
        u = np.zeros(nd)
        Kff = Kt[free][:, free].tocsc()
        try:
            lu = spl.splu(Kff)
        except RuntimeError as ex:
            raise ValueError(f"stiffness matrix singular (mechanism or missing support): {ex}")
        piv = np.abs(lu.U.diagonal())
        if piv.size and piv.min() < PIVOT_RATIO_MIN * piv.max():
            raise ValueError(f"stiffness matrix numerically singular (mechanism or missing support): LU pivot ratio {piv.min() / piv.max():.1e} < {PIVOT_RATIO_MIN:.0e}")
        u[free] = lu.solve(F[free])
        if not np.all(np.isfinite(u)):
            raise ValueError("solution not finite: mechanism or missing support")
        rfree = float(np.abs((Kff @ u[free]) - F[free]).max()) if len(free) else 0.0
        if rfree > RESID_REL_MAX * max(float(np.abs(F).max()), 1.0):
            raise ValueError(f"solution residual {rfree:.2e} kN too large (near-mechanism or ill-conditioned model)")
        Rall = Kt @ u - F  # residual: nonzero only at fixed dofs (reactions incl. springs counted separately below)
        reac = {n: Rall[DOF * idx[n]:DOF * idx[n] + 6].copy() for n in self.fixed}
        spr = {n: -self.springs[n] * u[DOF * idx[n]:DOF * idx[n] + 6] for n in self.springs}  # force the spring exerts on the node
        # equilibrium: applied (self weight + nodal) + support reactions + spring forces = 0
        applied = tot_w + sum((f[:3] for f in nodal.values()), np.zeros(3))
        R_sup = sum((r[:3] for r in reac.values()), np.zeros(3))
        resid = applied + R_sup + sum((s[:3] for s in spr.values()), np.zeros(3))
        free_resid = float(np.abs(Rall[free]).max()) if len(free) else 0.0
        self._u, self._idx = u, idx
        return {"u": {n: u[DOF * i:DOF * i + 6] for n, i in idx.items()}, "reactions": reac, "spring_forces": spr,
                "applied": applied, "equilibrium_residual": resid, "free_dof_residual": free_resid,
                "ndof": nd, "nfree": int(len(free))}

    def link_force(self, lid):
        """Bearing / link force after solve(): (local, global). local = (axial, shear y, shear z) in link axes, the force node n2
        exerts ON the link (tension + for axial); global = the force the link exerts ON node n2 (kN, global X, Y, Z)."""
        L, R, T, Kl, fl, dofs = self._el[("link", lid)]
        f = (Kl @ (T @ self._u[dofs]))[6:9]
        return f, -(R.T @ f)

    def stiffness(self):
        """Global stiffness (beams, links, springs) as a sparse matrix, the free dof numbers and the node index map.
        Runs solve() with no load first, so a mechanism is refused before anything else."""
        self.solve(gravity=(0.0, 0.0, 0.0), loads={})
        idx = self._idx; nd = DOF * len(self.nodes)
        rk, ck, vk = [], [], []
        for key, (L, R, T, K, fl, dofs) in self._el.items():
            Kg = T.T @ K @ T
            ii, jj = np.meshgrid(dofs, dofs, indexing="ij")
            rk += list(ii.ravel()); ck += list(jj.ravel()); vk += list(Kg.ravel())
        for nn, k in self.springs.items():
            for d in range(6):
                if k[d]:
                    rk.append(DOF * idx[nn] + d); ck.append(DOF * idx[nn] + d); vk.append(k[d])
        Kt = sp.csr_matrix((vk, (rk, ck)), shape=(nd, nd))
        fixed = sorted(DOF * idx[nn] + d for nn, ds in self.fixed.items() for d in ds)
        free = np.setdiff1d(np.arange(nd), fixed)
        return Kt, free, idx

    def modes(self, n=10, extra_mass=None, g=9.80665):
        """Lowest n natural modes (consistent beam mass, as the dashboard: translations Hermite with mu = w / g, axial,
        torsional inertia mu (Iy + Iz) / A; links and springs massless) + lumped translational extra_mass {node: t}.
        Generalised eigenproblem K phi = w2 M phi on the free dofs (shift-invert Lanczos). Returns periods, mass-normalised
        shapes per node and effective mass fractions in global X, Y, Z (of r^T M r, including the extra mass)."""
        Kt, free, idx = self.stiffness()
        ids = sorted(self.nodes); nd = DOF * len(ids)
        rm, cm, vm = [], [], []
        for key, (L, R, T, K, fl, dofs) in self._el.items():
            if isinstance(key, tuple):
                continue
            ii, jj = np.meshgrid(dofs, dofs, indexing="ij")
            b = self.beams[key]
            mu = b["w"] / g
            if mu == 0:
                continue
            Ip = mu * (b["Iy"] + b["Iz"]) / b["A"] if b["A"] > 0 else 0.0
            Mg = T.T @ m_local(mu, Ip, L) @ T
            rm += list(ii.ravel()); cm += list(jj.ravel()); vm += list(Mg.ravel())
        for nn, mm in (extra_mass or {}).items():
            for d in range(3):
                rm.append(DOF * idx[nn] + d); cm.append(DOF * idx[nn] + d); vm.append(mm)
        Mt = sp.csr_matrix((vm, (rm, cm)), shape=(nd, nd))
        Kff = Kt[free][:, free].tocsc(); Mff = Mt[free][:, free].tocsc()
        Nf = Kff.shape[0]
        if Nf <= 400 or n >= Nf - 1:
            # small model: dense, M may be singular (massless dofs). K = L L^T; L^-1 M L^-T z = (1 / w2) z
            import scipy.linalg as sla
            Lc = np.linalg.cholesky(Kff.toarray())
            Ai = sla.solve_triangular(Lc, Mff.toarray(), lower=True)
            Ac = sla.solve_triangular(Lc, Ai.T, lower=True)
            Ac = 0.5 * (Ac + Ac.T)
            lam, Z = np.linalg.eigh(Ac)
            keep = np.argsort(-lam)[:n]
            keep = [j for j in keep if lam[j] > 1e-14 * max(lam.max(), 1e-300)]
            w2 = np.array([1 / lam[j] for j in keep])
            V = sla.solve_triangular(Lc.T, Z[:, keep], lower=False)
        else:
            w2, V = spl.eigsh(Kff, k=n, M=Mff, sigma=0.0, which="LM")
        o = np.argsort(w2); w2, V = w2[o], V[:, o]
        out = []
        r = {d: np.zeros(len(free)) for d in range(3)}
        pos = {f: i for i, f in enumerate(free)}
        for nn in ids:
            for d in range(3):
                f = DOF * idx[nn] + d
                if f in pos:
                    r[d][pos[f]] = 1.0
        mtot = {d: float(r[d] @ (Mff @ r[d])) for d in range(3)}
        for k in range(len(w2)):
            phi = V[:, k] / math.sqrt(V[:, k] @ (Mff @ V[:, k]))
            Mphi = Mff @ phi
            eff = {"XYZ"[d]: float((phi @ (Mff @ r[d])) ** 2 / mtot[d]) if mtot[d] > 0 else 0.0 for d in range(3)}
            full = np.zeros(nd); full[free] = phi
            out.append({"w": math.sqrt(w2[k]), "T": 2 * math.pi / math.sqrt(w2[k]), "f": math.sqrt(w2[k]) / (2 * math.pi), "eff": eff,
                        "shape": {nn: full[DOF * idx[nn]:DOF * idx[nn] + 6] for nn in ids}})
        return {"modes": out, "mass_t": mtot}

    def end_forces(self, eid):
        """Local end forces f = K T u - f_eq (forces the nodes exert on the element), for a beam id."""
        L, R, T, K, fl, dofs = self._el[eid]
        return K @ (T @ self._u[dofs]) - fl
