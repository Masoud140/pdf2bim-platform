"""Convert a pdf2bim solver Model (pdf2bim/model/solver.py) into an independent PyNite FEModel3D (ADR-087) — test
and verification use only, never imported by the platform (PyNite: MIT, `pip install PyniteFEA`).

Mapping:
- PyNite is Y-up: ours (x, y, z) -> PyNite (X, Y, Z) = (x, z, -y) (a proper rotation, det +1); forces and moments the same.
- Horizontal members: PyNite local y = global Y (up), so PyNite Iz (about local z, horizontal) = our Iy (vertical bending)
  and PyNite Iy = our Iz. PyNite is Euler-Bernoulli: compare with our model stripped of Asy / Asz (euler_copy).
- Rigid end offsets (off): an extra node at node + o, joined by a stiff member (E x 1e4 of the element's, A / I 10 x).
- Links (no rotational stiffness): each translational spring = a PyNite axial spring along its link axis, from a point
  rigidly carried by n1 to a point 1 m further along the axis rigidly carried by n2, both at the spring's location
  (the shear springs at dry / drz of the length, as the solver). Rotational link stiffness (integral) is refused.
- Nodal springs (global k per dof) -> PyNite support springs; fixed dofs -> PyNite supports.
- PyNite's automatic splitting of members at nodes on their line is switched off (_ends_only), as ours never joins them.
- Self weight w (kN/m, gravity -z) -> a global FY distributed load -w on the flexible member.
"""
import copy, types
import numpy as np
from Pynite import FEModel3D
from Pynite.PhysMember import PhysMember


def _ends_only(pm):
    """PyNite splits a physical member at every node lying on its line and joins them; ours never does (an offset
    element's centroid line can pass through another element's offset point without being connected)."""
    keep = pm.model.nodes
    pm.model.nodes = {pm.i_node.name: pm.i_node, pm.j_node.name: pm.j_node}
    try:
        PhysMember.descritize(pm)
    finally:
        pm.model.nodes = keep

DOF = ("DX", "DY", "DZ", "RX", "RY", "RZ")


def to_py(v):
    v = np.asarray(v, float)
    return np.array([v[0], v[2], -v[1]])


def from_py(v):
    v = np.asarray(v, float)
    return np.array([v[0], -v[2], v[1]])


def euler_copy(m):
    """Our model with the shear areas removed (Euler-Bernoulli), as PyNite."""
    c = copy.deepcopy(m)
    for b in c.beams.values():
        b["Asy"] = b["Asz"] = None
    return c


def _link_axes(m, l):
    """Link axes and the shear points, exactly as solver.Model.solve: (R rows x, y, z; point of the y / z shear springs)."""
    p1, p2 = m.nodes[l["n1"]], m.nodes[l["n2"]]
    Ll = float(np.linalg.norm(p2 - p1))
    if l["R"] is not None or Ll == 0:
        if Ll > 1e-9:
            raise ValueError("link with given axes between separate nodes: not converted (no case in the platform)")
        return (l["R"] if l["R"] is not None else np.eye(3)), p1, p1
    x = (p2 - p1) / Ll
    b = np.radians(l["beta"] or 0.0)
    if np.hypot(x[0], x[1]) < 1e-6:
        z0 = np.array([np.cos(b), np.sin(b), 0.0]); y = np.cross(z0, x); y /= np.linalg.norm(y); z = np.cross(x, y)
    else:
        y0 = np.cross([0, 0, 1.0], x); y0 /= np.linalg.norm(y0); z1 = np.cross(x, y0)
        y = np.cos(b) * y0 + np.sin(b) * z1; z = np.cross(x, y)
    return np.array([x, y, z]), p1 + l["dry"] * Ll * x, p1 + l["drz"] * Ll * x


def convert(m, loads=None, gravity=True):
    P = FEModel3D()
    name = lambda n: f"N{n}"
    x0 = next(iter(m.nodes.values()))       # local origin: survey coordinates (1e6 m) cost PyNite its precision
    to = lambda x: to_py(np.asarray(x, float) - x0)
    for n, x in m.nodes.items():
        P.add_node(name(n), *to(x))
    stubs = {}
    Eref = max(b["E"] for b in m.beams.values()) * 1e4
    P.add_material("RIG", Eref, Eref / 2.4, 0.2, 0.0)
    P.add_section("RIGS", 1e3, 1e3, 1e3, 1e3)   # arms far stiffer than the 1e9 kN/m fixity springs

    def arm(n_from, X, tag):
        """A node at X rigidly attached to node n_from (a stiff member; the node itself when X is on it)."""
        if np.linalg.norm(X - m.nodes[n_from]) < 1e-9:
            return name(n_from)
        key = ("arm", n_from, tuple(np.round(X, 9)), tag)
        if key not in stubs:
            nid = stubs[key] = f"A{len(stubs)}"
            P.add_node(nid, *to(X))
            P.add_member(f"RA{nid}", name(n_from), nid, "RIG", "RIGS")
        return stubs[key]

    for k, l in m.links.items():
        # each translational link spring = a PyNite axial spring along its link axis between two points at the spring's
        # location, one rigidly carried by n1, the other (1 m further along the axis) by n2: its elongation is the relative
        # displacement along the axis at that point, as the solver's link (shear springs at dry / drz with the end rotations)
        if np.any(l["k"][3:]):
            raise ValueError(f"link {k}: rotational link stiffness not converted (integral connections)")
        R, Py, Pz = _link_axes(m, l)
        for a_, kk in enumerate(l["k"][:3]):
            if not kk:
                continue
            X = (m.nodes[l["n1"]], Py, Pz)[a_]
            A_ = arm(l["n1"], X, f"L{k}a")
            Q = arm(l["n2"], X + R[a_], f"L{k}q{a_}")
            P.add_spring(f"K{k}_{a_}", A_, Q, float(kk))
    for n, ds in m.fixed.items():
        fl = [False] * 6
        for d in ds:
            fl[d] = True
        # our dofs (x, y, z) -> PyNite (X, Z, Y) by the mapping: DX <- x, DY <- z, DZ <- y; same for rotations
        P.def_support(name(n), fl[0], fl[2], fl[1], fl[3], fl[5], fl[4])
    for n, k in m.springs.items():
        kp = [k[0], k[2], k[1], k[3], k[5], k[4]]
        for d, v in zip(DOF, kp):
            if v:
                P.def_support_spring(name(n), d, float(v))
    for eid, b in m.beams.items():
        mat, sec = f"M{eid}", f"S{eid}"
        P.add_material(mat, b["E"], b["G"], b["E"] / (2 * b["G"]) - 1, 0.0)
        P.add_section(sec, b["A"], b["Iz"], b["Iy"], b["J"])
        i, j = name(b["n1"]), name(b["n2"])
        if b.get("off") is not None:
            for end, nn, o in (("i", b["n1"], b["off"][0]), ("j", b["n2"], b["off"][1])):
                if np.linalg.norm(o) < 1e-12:
                    continue
                key = (nn, tuple(np.round(np.asarray(o, float), 9)))
                if key not in stubs:   # one stub per (node, offset): ends sharing it are rigidly tied to the same node anyway
                    nid = stubs[key] = f"O{eid}{end}"
                    P.add_node(nid, *to(m.nodes[nn] + np.asarray(o, float)))
                    rm, rs = f"RM{eid}{end}", f"RS{eid}{end}"
                    P.add_material(rm, b["E"] * 1e4, b["G"] * 1e4, b["E"] / (2 * b["G"]) - 1, 0.0)
                    P.add_section(rs, b["A"] * 10, b["Iy"] * 10 + b["Iz"] * 10, b["Iy"] * 10 + b["Iz"] * 10, b["J"] * 10 + b["Iy"] + b["Iz"])
                    P.add_member(f"R{eid}{end}", name(nn), nid, rm, rs)
                nid = stubs[key]
                if end == "i":
                    i = nid
                else:
                    j = nid
        mem = f"E{eid}"
        P.add_member(mem, i, j, mat, sec)
        if b.get("rel"):
            raise ValueError(f"beam {eid}: releases not converted")
        if gravity and b["w"]:
            P.add_member_dist_load(mem, "FY", -b["w"], -b["w"], case="SW")
    for n, f in (loads or {}).items():
        F = to_py(f[:3]); Mm = to_py(f[3:])
        for d, v in zip(("FX", "FY", "FZ", "MX", "MY", "MZ"), list(F) + list(Mm)):
            if v:
                P.add_node_load(name(n), d, float(v), case="PL")
    for pm in P.members.values():
        pm.descritize = types.MethodType(_ends_only, pm)
    P.add_load_combo("C", {"SW": 1.0, "PL": 1.0})
    return P


def displacements(P, m):
    out = {}
    for n in m.nodes:
        N = P.nodes[f"N{n}"]
        out[n] = np.concatenate([from_py([N.DX["C"], N.DY["C"], N.DZ["C"]]), from_py([N.RX["C"], N.RY["C"], N.RZ["C"]])])
    return out
