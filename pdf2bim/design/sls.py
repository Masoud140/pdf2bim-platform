"""Serviceability section response: strain plane for given N, M, uncracked or cracked (P4.5 stage 2). N, mm, MPa.

    from pdf2bim.design.sls import response, solve, prestress_state, stress
    prestress_state(S, yr)                    # tendon prestrain so that each tendon has its effective stress at N = M = 0
    pl = solve(S, N, M, yr, cracked=False)    # strain plane e(y) = e0 + k y  (y down from the top; tension +)
    stress(S, pl, y)                          # concrete stress at depth y (strip at y)

Port of the dashboard's engine (src/dsg_engine.js respSLS / solveSLS and the prestress iteration of
tests/engine/dsg_test.js): linear-elastic concrete per strip (E, locked-in strain e0 — default 0), cracked = no
concrete tension; bars and tendons linear (tendon strain = plane + prestrain), each displacing the concrete of its strip
(the displaced concrete stress is deducted over the steel area, except where that concrete is cracked in tension).
M is about the reference depth yr, sagging + ; N tension +. Newton iteration with a numerical Jacobian (as the
dashboard: 200 iterations, |dN| < 1e-3 (1 + |N|) N, |dM| < 0.1 (1 + |M|) N mm), here with the steps scaled to the
section; the cracked solve starts from the uncracked plane. No standards coefficient is used here."""


def _strip_index(S, y):
    for i, c in enumerate(S.conc):
        if abs(c["y"] - y) <= c["h"] / 2:
            return i
    return -1


def response(S, e0, k, cracked=False):
    """(N, M about y = 0) of the strain plane e0 + k y."""
    N = M = 0.0
    for c in S.conc:
        s = c["E"] * (e0 + k * c["y"] - c.get("e0", 0.0))
        if cracked and s > 0:
            s = 0.0
        f = s * c["b"] * c["h"]; N += f; M += f * c["y"]

    def disp(y, A):
        j = _strip_index(S, y)
        if j < 0:
            return 0.0
        c = S.conc[j]
        sc = c["E"] * (e0 + k * y - c.get("e0", 0.0))
        return 0.0 if (cracked and sc > 0) else sc * A
    for b in S.bars:
        e = e0 + k * b["y"] - b.get("e0", 0.0)
        f = b["E"] * e * b["A"] - disp(b["y"], b["A"]); N += f; M += f * b["y"]
    for t in S.tend:
        e = e0 + k * t["y"] + t.get("pre", 0.0)
        f = t["E"] * e * t["A"] - disp(t["y"], t["A"]); N += f; M += f * t["y"]
    return N, M


def solve(S, N, M, yr, cracked=False, iterations=200):
    """Strain plane (e0, k) for axial force N (tension +) and moment M about depth yr (sagging +). A cracked solve
    starts from the uncracked plane (the dashboard starts from zero, where a cracked section with one steel layer has a
    singular Jacobian and stops unconverged; the converged plane is the same)."""
    e0 = k = 0.0
    if cracked:
        p0 = solve(S, N, M, yr, False, iterations)
        e0, k = p0["e0"], p0["k"]
    conv = False
    for _ in range(iterations):
        n_, m_ = response(S, e0, k, cracked)
        Mr = m_ - n_ * yr
        R1, R2 = N - n_, M - Mr
        if abs(R1) < 1e-3 * (1 + abs(N)) and abs(R2) < 1e-1 * (1 + abs(M)):
            conv = True
            break
        h1, h2 = 1e-9, 1e-12
        a = response(S, e0 + h1, k, cracked); b = response(S, e0, k + h2, cracked)
        J11, J12 = (a[0] - n_) / h1, (b[0] - n_) / h2
        J21, J22 = ((a[1] - a[0] * yr) - Mr) / h1, ((b[1] - b[0] * yr) - Mr) / h2
        D = J11 * J22 - J12 * J21
        if D == 0 or D != D:
            break
        e0 += (R1 * J22 - R2 * J12) / D
        k += (J11 * R2 - J21 * R1) / D
    return {"e0": e0, "k": k, "converged": conv}


def prestress_state(S, yr, iterations=6):
    """Set each tendon's prestrain so that its stress equals its effective prestress t["spe"] when N = M = 0 (uncracked),
    as the dashboard's worked example does (6 fixed-point iterations). Returns the tendon stresses reached."""
    for t in S.tend:
        t.setdefault("pre", t["spe"] / t["E"])
    for _ in range(iterations):
        p = solve(S, 0.0, 0.0, yr, False)
        for t in S.tend:
            t["pre"] = t["spe"] / t["E"] - (p["e0"] + p["k"] * t["y"])
    p = solve(S, 0.0, 0.0, yr, False)
    return [t["E"] * (p["e0"] + p["k"] * t["y"] + t["pre"]) for t in S.tend]


def stress(S, plane, y, cracked=False):
    """Concrete stress (tension +) at depth y, from the strip holding y (its E and locked-in strain)."""
    j = _strip_index(S, y)
    if j < 0:
        raise ValueError(f"depth {y} outside the concrete strips")
    c = S.conc[j]
    s = c["E"] * (plane["e0"] + plane["k"] * y - c.get("e0", 0.0))
    return 0.0 if (cracked and s > 0) else s
