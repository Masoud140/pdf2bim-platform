/* ===== Bridge Studio analysis runner and design checks. Uses CORE (grillage), HOG (losses), DSG / DSG2 (section strength), SECLIB. ===== */
var ANALYSIS = (function () {
  'use strict';
  var C = CORE;

  /* ---------- structural analysis: every load case, then combinations ---------- */
  function run(p, cases, combos, progress) {
    var t0 = Date.now(), log = function (s) { if (progress) progress(s); };
    var g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc);
    log('Assembling stiffness (' + 3 * m.nodes.length + ' degrees of freedom)');
    var S = C.build(m), RS = C.responses(m), nr = RS.R.length, on = {};
    cases.forEach(function (c) { on[c.id] = c.on && !c.proposed; });
    var V = {};                                   /* case id -> Float64Array of responses (static) or {max, min} (traffic) */
    /* girder-alone cases: simply supported beam per girder */
    var ga = C.girderAlone(p, g, sc, g.spans[0]);
    function alone(wOf) {
      var v = new Float64Array(nr);
      RS.R.forEach(function (r, k) {
        if (r.kind === 'Mel' || r.kind === 'V' || r.kind === 'T') {
          var e = m.els[r.e], sp = g.spans[e.k], L = sp.L, w = wOf(e.i), x1 = e.j / m.n * L, x2 = (e.j + 1) / m.n * L;
          if (r.kind === 'Mel') { var x = r.end === 1 ? x1 : x2; v[k] = w * x * (L - x) / 2; }
          else if (r.kind === 'V') v[k] = w * (L / 2 - x1);
          else v[k] = 0;
        } else if (r.kind === 'w') {
          var n = m.nodes[r.n], L2 = g.spans[n.k].L, x3 = n.f * L2, EI = sc.Eg * 1e3 * sc.I * 1e-12;
          v[k] = -wOf(n.i) * x3 * (Math.pow(L2, 3) - 2 * L2 * x3 * x3 + Math.pow(x3, 3)) / (24 * EI) * 1000;
        } else if (r.kind === 'R') { var s = m.sup[r.s]; v[k] = wOf(s.i) * g.spans[s.k].L / 2; }
      });
      return v;
    }
    log('Girder-alone load cases');
    V.G1 = alone(function () { return ga.wG; });
    V.G2 = alone(function (i) { return (i === 0 || i === g.ng - 1 ? (g.s / 2 + p.overhang) / g.s : 1) * ga.wD; });
    V.C = alone(function (i) { return (i === 0 || i === g.ng - 1 ? (g.s / 2 + p.overhang) / g.s : 1) * ga.wC; });
    /* composite cases on the grillage */
    log('Superimposed dead load on the grillage');
    var pB = C.deep(p); pB.surf = 0; pB.utilities = 0; var pS = C.deep(p); pS.barrierLoad = 0;
    V.SDLs = C.evalResponses(m, RS, C.solve(S, C.sdlLoads(pB, m, g)));
    V.SDLp = C.evalResponses(m, RS, C.solve(S, C.sdlLoads(pS, m, g)));
    var env = {}, IM = null;
    ['M1600', 'S1600'].forEach(function (vk) {
      if (!on[vk]) return;
      if (!IM) { log('Influence surfaces (' + m.nodes.length + ' unit loads)'); IM = C.influence(m, S, RS); }
      log(vk + ' moving-load envelope (' + g.lanes + ' lanes)');
      var e = C.trafficEnvelope(m, g, IM, C.STD[vk], { dlaUDL: p.dlaUDL, step: p.sweep }, RS); V[vk] = { max: e.max, min: e.min }; env[vk] = e;
    });
    log('Combinations');
    var CB = combine(V, combos, cases, nr);
    log('Done');
    return { g: g, sc: sc, m: m, RS: RS, V: V, CB: CB, env: env, ms: Date.now() - t0, nd: S.nd };
  }
  /* combinations: each response maximised and minimised; traffic picks its adverse envelope */
  function combine(V, combos, cases, nr) {
    var on = {}; cases.forEach(function (c) { on[c.id] = c.on && !c.proposed; });
    return combos.map(function (cb) {
      var mx = new Float64Array(nr), mn = new Float64Array(nr), used = [];
      Object.keys(cb.f).forEach(function (id) {
        var f = cb.f[id], v = V[id]; if (!f || !v || !on[id]) return; used.push(id);
        if (v.max) for (var r = 0; r < nr; r++) { mx[r] += f * v.max[r]; mn[r] += f * v.min[r]; }
        else for (var r2 = 0; r2 < nr; r2++) { mx[r2] += f * v[r2]; mn[r2] += f * v[r2]; }
      });
      return { id: cb.id, ls: cb.ls, name: cb.name, max: mx, min: mn, used: used };
    });
  }
  /* crack-control options for prestressed beams, AS 5100.5:2017 Cl 8.6.2.1, as the original dashboard codes them (values supplied by
     the owner from the standard; tagged Standard - verify): u = tension <= 0.25 sqrt f'c, deemed controlled; a = Cl 8.6.2.1(a) tension
     <= 0.5 sqrt f'c with bonded steel <= 200 mm near the tension face; b = Cl 8.6.2.1(b) steel stress increment <= Table 8.6.2.1. */
  var CC = { u: { k: 0.25, spacing: false, label: 'Cl 8.6.2.1, tension ≤ 0.25√f\'c (deemed controlled)' },
             a: { k: 0.5, spacing: true, label: 'Cl 8.6.2.1(a), tension ≤ 0.5√f\'c' },
             b: { k: 0, spacing: true, label: 'Cl 8.6.2.1(b), steel stress increment ≤ Table 8.6.2.1' },
             tendonInc: 200, table8621: [[12, 330], [16, 280], [20, 240], [24, 210]] };

  /* value of one response by key for a case or combination */
  function val(A, key, src, which) {
    var k = A.RS.idx[key]; if (k === undefined) return null;
    var cb = A.CB.filter(function (c) { return c.id === src; })[0];
    if (cb) return which === 'min' ? cb.min[k] : cb.max[k];
    var v = A.V[src]; if (!v) return null; return v.max ? (which === 'min' ? v.min[k] : v.max[k]) : v[k];
  }
  /* girder line diagram: values at the nodes of girder i in span k */
  function line(A, k, i, kind, src, which) {
    var n = A.m.n, out = [];
    for (var j = 0; j <= n; j++) {
      var x = j / n * A.g.spans[k].L, v;
      if (kind === 'M') v = j < n ? val(A, 'M:' + k + ':' + i + ':' + j + ':a', src, which) : val(A, 'M:' + k + ':' + i + ':' + (j - 1) + ':b', src, which);
      else if (kind === 'V' || kind === 'T') v = val(A, kind + ':' + k + ':' + i + ':' + Math.min(j, n - 1), src, which);
      else if (kind === 'w') v = val(A, 'w:' + A.m.id[k + ':' + i + ':' + j], src, which);
      out.push({ x: x, v: v });
    }
    return out;
  }
  function governing(A, key, ls, which) {   /* combination giving the largest |value| of a response, within one limit state */
    var best = null;
    A.CB.forEach(function (c) { if (ls && c.ls !== ls) return; var k = A.RS.idx[key]; [['max', c.max[k]], ['min', c.min[k]]].forEach(function (q) { if (which && q[0] !== which) return; if (!best || Math.abs(q[1]) > Math.abs(best.v)) best = { id: c.id, name: c.name, v: q[1], side: q[0] }; }); });
    return best;
  }

  /* ---------- prestress losses / camber: inputs for the losses engine ---------- */
  function hogInputs(p, A, tpl, sk) {
    var sc = A.sc, g = A.g, sp = g.spans[sk || 0], h = C.deep(tpl), s = HOG.STR[p.db];
    if (!s) throw new Error('strand diameter must be one of ' + Object.keys(HOG.STR).join(', '));
    var on = p.strands.filter(function (q) { return q.on; });
    if (!on.length) throw new Error('turn on at least one strand');
    Object.assign(h, { L: sp.Lg * 1000, a: p.endDist * 1000, A: sc.A, yb: sc.yb, I: sc.I, H: sc.H, ue: sc.ue, rho: p.gGirder, fc: p.fcG, fci: p.fcT,
      db: p.db, Ap: s[0], mbl: s[1], ji: p.jack, sy: on.map(function (q) { return q.y; }), sx: on.map(function (q) { return q.x; }), sl: on.map(function (q) { return { d: q.d || 0, d2: q.d2 || 0 }; }),
      bars: [], deck: 1, beff: g.s * 1000, dbw: g.s * 1000, ued: g.s * 1000, dth: p.slab, dgam: p.gConc, dgap: 0, fcd: p.fcD,
      tau: p.stage.tau, pour: p.stage.pour, dhard: p.stage.dhard, sidlA: p.stage.sidlA, asup: NaN, terec: NaN, emod: 1, relpre: 1, hcur: 0, Tcur: 20 });
    var sdl = (A.g.cwR - A.g.cwL) * p.surf / 1000 * p.gSurf / g.ng + 2 * p.barrierLoad / g.ng + p.utilities / g.ng;
    h.sidl = sdl;
    /* derived fields, as the dashboard's read() computes them */
    var a = HOG.t312(h.fci), b = HOG.t312(h.fc); h.Ect = a.E; h.fcmi = a.fcmi; h.Ec = b.E; h.Ecp = b.E; h.Ecs = b.E; h.Ed = HOG.t312(h.fcd).E;
    h.k8 = Math.max(h.Tav / 20, 1); h.rel = HOG.relax(h, 0) / 100; h.k3s = 0;
    var R = sc.R, Ln = function (u, v) { return Math.hypot(v[0] - u[0], v[1] - u[1]); }, inn = 0; for (var i = 7; i < R.length - 1; i++) inn += Ln(R[i], R[i + 1]);
    h.ueC = h.ue - 2 * Ln(R[6], R[7]) - inn; h.uesw = Math.abs(h.ueC - h.ue) > 1e-6;
    h.wd = h.dth * h.dbw * h.dgam / 1e6 + h.dform;
    var nd = h.Ed / h.Ecs, da = h.beff * h.dth * nd, yd = h.H + h.dgap + h.dth / 2, yc = (h.A * h.yb + da * yd) / (h.A + da);
    h.Ac = h.A + da; h.yc = yc; h.Ic = h.I + h.A * Math.pow(h.yb - yc, 2) + h.beff * nd * Math.pow(h.dth, 3) / 12 + da * Math.pow(yd - yc, 2);
    h.times = [7, 14, 28, h.pour, h.pour + h.dhard, h.sidlA, 365, p.stage.final].filter(function (v, k, arr) { return v > 0 && arr.indexOf(v) === k; }).sort(function (x, y) { return x - y; });
    h.fl = { rl: 1, sh: 1, cr: 1, dk: 1, bar: 1 };
    return h;
  }

  /* ---------- staged cracked-section SLS (the dashboard's dgLC idea, simplified: no bars, no free strains) ----------
     Girder alone carries prestress P (eccentricity e) and Mnc elastically; those strains are locked into the composite
     section (girder strips e0, tendon prestrain = effective stress / Ep); the composite moment Mc is then added with
     concrete tension cut off. Returns the composite moment at soffit decompression (Mdec, kNm, total = Mnc + Mc) and the
     increment of stress in the lowest tendon from decompression to Mnc + Mc (dsp, MPa; 0 below decompression). */
  function crackInc(S0, sc, p, ps, Mnc, Mc) {
    var S = { conc: S0.conc.map(function (c) { return Object.assign({}, c); }), bars: [], tend: S0.tend.map(function (t) { return Object.assign({}, t, { pre: t.spe / t.E }); }) };
    var yTop = p.slab, H = sc.H, P = ps.P * 1e3, e = ps.e;
    S.conc.forEach(function (c) { if (c.y < yTop) { c.e0 = 0; return; } var ys = yTop + H - c.y, sg = -P / sc.A + (Mnc * 1e6 - P * e) * (sc.yb - ys) / sc.I; c.e0 = -sg / c.E; });
    var r0 = DSG.respSLS(S, 0, 0, false), M0 = r0.M, N0 = r0.N;          /* resultants of the locked state (about the top) */
    /* own Newton solve for N = N0, M = M0 + dM: DSG.solveSLS stops at 10 % of |M|, too loose for increments */
    var solve = function (dM, crack) {
      var e0 = 0, k = 0;
      for (var it = 0; it < 100; it++) {
        var r = DSG.respSLS(S, e0, k, crack), R1 = N0 - r.N, R2 = M0 + dM - r.M; if (Math.abs(R1) < 1 && Math.abs(R2) < 1e4) break;
        var a = DSG.respSLS(S, e0 + 1e-7, k, crack), b = DSG.respSLS(S, e0, k + 1e-10, crack), J11 = (a.N - r.N) / 1e-7, J12 = (b.N - r.N) / 1e-10, J21 = (a.M - r.M) / 1e-7, J22 = (b.M - r.M) / 1e-10, D = J11 * J22 - J12 * J21;
        if (!isFinite(D) || D === 0) break; e0 += (R1 * J22 - R2 * J12) / D; k += (J11 * R2 - J21 * R1) / D;
      }
      return { e0: e0, k: k };
    };
    var low = S.tend.reduce(function (b, t) { return !b || t.y > b.y ? t : b; }, null), yb = yTop + H;
    var soffit = function (pl) { var c = S.conc.reduce(function (b, q) { return !b || q.y > b.y ? q : b; }, null); return c.E * (pl.e0 + pl.k * c.y - c.e0); };
    var tst = function (pl) { return low.E * (pl.e0 + pl.k * low.y + low.pre); };
    var s0 = soffit({ e0: 0, k: 0 }), ds = (soffit(solve(1e9, false)) - s0) / 1000;       /* soffit stress per kNm, uncracked (linear) */
    var Mcd = ds !== 0 ? -s0 / ds : Infinity, Mdec = Mnc + Mcd;
    if (Mc <= Mcd) return { Mdec: Mdec, dsp: 0 };
    var pd = solve(Mcd * 1e6, false), pc = solve(Mc * 1e6, true);
    return { Mdec: Mdec, dsp: Math.max(0, tst(pc) - tst(pd)) };
  }

  /* pairs of debonded strands next to each other on the strand grid, horizontally (same row, next position) or vertically
     (same x, next row): TfNSW BTD 2011/06 Rev 1 forbids both */
  function debAdj(fs) {
    var deb = function (q) { return (q.d || 0) + (q.d2 || 0) > 0; }, ys = fs.map(function (q) { return q.y; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    var xs = fs.map(function (q) { return Math.abs(q.x); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }), dx = Infinity, dy = Infinity, out = [];
    for (var i = 1; i < xs.length; i++) dx = Math.min(dx, xs[i] - xs[i - 1]); for (i = 1; i < ys.length; i++) dy = Math.min(dy, ys[i] - ys[i - 1]);
    if (xs.length && xs[0] > 0) dx = Math.min(dx, 2 * xs[0]);
    fs.forEach(function (a, i) { if (!deb(a)) return; fs.forEach(function (b, j) { if (j <= i || !deb(b)) return;
      if ((a.y === b.y && Math.abs(Math.abs(a.x - b.x) - dx) < 1) || (a.x === b.x && Math.abs(Math.abs(a.y - b.y) - dy) < 1)) out.push([a, b]); }); });
    return out;
  }

  /* largest centre-to-centre spacing of bonded strands in the row nearest the tension face (dgNearFaceSp) */
  function nearFaceSpacing(p) {
    var on = p.strands.filter(function (q) { return q.on; }); if (!on.length) return null;
    var y0 = Math.min.apply(null, on.map(function (q) { return q.y; })), xs = on.filter(function (q) { return q.y <= y0 + 60; }).map(function (q) { return q.x; }).sort(function (a, b) { return a - b; }), m = 0;
    for (var i = 1; i < xs.length; i++) m = Math.max(m, xs[i] - xs[i - 1]);
    return { s: m, n: xs.length, y0: y0 };
  }

  /* ---------- Super-T design checks at stations along one girder ---------- */
  function design(p, A, tpl, gi, sk) {
    sk = sk || 0; var sc = A.sc, g = A.g, sp = g.spans[sk], h = hogInputs(p, A, tpl, sk), r = HOG.run(h), Lb = sp.L, n = A.m.n;
    var fs = p.strands.filter(function (q) { return q.on; }), Ap = h.Ap, Ep = h.Ep || 195000, lt = h.lt * h.db;
    var Pm0 = r.res[0].mid.Pm, PmF = r.res[r.res.length - 1].mid.Pm;   /* kN per strand at mid-span: transfer and final */
    var final = r.res[r.res.length - 1], stations = [];
    var cg = function (xg) {   /* effective prestress state at x along the girder (mm from the girder end) */
      var P = 0, Pe = 0, Pt = 0, sgy = 0;
      fs.forEach(function (q, k) { var d1 = q.d || 0, d2 = q.d2 || 0, ef = Math.max(0, Math.min(1, (xg - d1) / lt, (h.L - xg - d2) / lt));
        var f = ef * PmF[k]; P += f; Pe += f * (sc.yb - q.y); Pt += ef * Pm0[k]; sgy += ef; });
      return { P: P, e: P > 0 ? Pe / P : 0, Pt: Pt, frac: sgy };
    };
    for (var j = 0; j <= n; j++) {
      var x = j / n * Lb, xg = x * 1000 + h.a, key = 'M:' + sk + ':' + gi + ':' + Math.min(j, n - 1) + ':' + (j < n ? 'a' : 'b'), kv = 'V:' + sk + ':' + gi + ':' + Math.min(j, n - 1), kt = 'T:' + sk + ':' + gi + ':' + Math.min(j, n - 1);
      var Mg = val(A, key, 'G1') + val(A, key, 'G2'), Msdl = val(A, key, 'SDLs') + val(A, key, 'SDLp');
      var st = { j: j, x: x, xg: xg, Mg: Mg, Msdl: Msdl };
      /* service stresses (MPa, tension +): prestress + girder-alone on the girder; SDL + traffic on the composite */
      var ps = cg(xg); st.P = ps.P; st.e = ps.e;
      var fp = function (Mnc, Mc) { return { bot: (-ps.P * 1e3 / sc.A - ps.P * 1e3 * ps.e / sc.Zb + Mnc * 1e6 / sc.Zb + Mc * 1e6 / sc.Zcb), top: (-ps.P * 1e3 / sc.A + ps.P * 1e3 * ps.e / sc.Zt - Mnc * 1e6 / sc.Zt - Mc * 1e6 / sc.Zct), deck: -Mc * 1e6 / sc.Zcd }; };
      st.sls = {};
      var slsRows = [];
      A.CB.filter(function (c) { return c.ls === 'SLS'; }).forEach(function (c) {
        var k = A.RS.idx[key], Mt = c.max[k], Mnc = (c.used.indexOf('G1') >= 0 ? val(A, key, 'G1') * 1 : 0) + (c.used.indexOf('G2') >= 0 ? val(A, key, 'G2') : 0);
        st.sls[c.id] = fp(Mnc, Mt - Mnc); slsRows.push([c.id, Mnc, Mt - Mnc]);
      });
      /* ULS bending: composite strain compatibility (DSG engine), strands effective by transmission / debonding */
      var S = { conc: DSG.stripsFromPolygon(sc.P, sc.H, p.slab, sc.Eg, p.fcG, 'g', 10).concat(DSG.stripsFromLayers([{ h: p.slab, b1: g.s * 1000, b2: g.s * 1000, E: sc.Ed, fc: p.fcD }], 10)), bars: [], tend: [] };
      fs.forEach(function (q, k) { var ef = Math.max(0, Math.min(1, (xg - (q.d || 0)) / lt, (h.L - xg - (q.d2 || 0)) / lt)); if (ef <= 0) return;
        var sp_ = PmF[k] * 1e3 / Ap; S.tend.push({ y: p.slab + sc.H - q.y, A: Ap * ef, E: Ep, fpb: h.mbl * 1e3 / Ap, eu: 0.035, spe: sp_, epe: sp_ / Ep + (ps.P * 1e3 / sc.A + ps.P * 1e3 * ps.e * ps.e / sc.I) / sc.Eg }); });
      var kU = A.RS.idx[key], uls = A.CB.filter(function (c) { return c.ls === 'ULS'; });
      var Mu = uls.reduce(function (m_, c) { return Math.max(m_, c.max[kU]); }, 0), Vu = 0, Tu = 0, govM = governing(A, key, 'ULS', 'max'), govV = governing(A, kv, 'ULS'), govT = governing(A, kt, 'ULS');
      uls.forEach(function (c) { Vu = Math.max(Vu, Math.abs(c.max[A.RS.idx[kv]]), Math.abs(c.min[A.RS.idx[kv]])); Tu = Math.max(Tu, Math.abs(c.max[A.RS.idx[kt]]), Math.abs(c.min[A.RS.idx[kt]])); });
      st.Mu = Mu; st.Vu = Vu; st.Tu = Tu; st.govM = govM; st.govV = govV; st.govT = govT;
      /* development length, AS 5100.5 Cl 13.3.2.2 (verify): Lp = 0.145 (σpu - 0.67 σpe) db >= 60 db; 2 Lp for a debonded strand
         (conservative: tension within that length assumed). σpu taken as fpb (upper bound, longer Lp). Strands short of Lp are counted. */
      var dev = { n: 0, A: 0, At: 0 };
      fs.forEach(function (q, k) { var lb = Math.min(xg - (q.d || 0), h.L - xg - (q.d2 || 0)); if (lb <= 0) return;
        var spe = PmF[k] * 1e3 / Ap, Lp = Math.max(60 * p.db, 0.145 * (h.mbl * 1e3 / Ap - 0.67 * spe) * p.db) * ((q.d || q.d2) ? 2 : 1);
        dev.At += Ap; if (lb < Lp) { dev.n++; dev.A += Ap; } });
      st.dev = dev;
      /* crack control, AS 5100.5 Cl 8.6.2.1(b): tendon stress increment above decompression, cracked composite section (staged) */
      if (S.tend.length) slsRows.forEach(function (rw) { var o = crackInc(S, sc, p, ps, rw[1], rw[2]); st.sls[rw[0]].Mdec = o.Mdec; st.sls[rw[0]].dsp = o.dsp; st.sls[rw[0]].Ms = rw[1] + rw[2]; });
      if (S.tend.length) {
        var u = DSG.ulsBend(S, {}); st.phiMu = u.phiMu; st.dn = u.dn; st.kuo = u.kuo; st.phi = u.phi;
        /* minimum strength: Muo >= 1.2 Mcr (staged cracking moment, flexural tensile strength 0.6 sqrt f'c) */
        var fcf = 0.6 * Math.sqrt(p.fcG), Mcr = ((fcf + ps.P * 1e3 / sc.A + ps.P * 1e3 * ps.e / sc.Zb) - Mg * 1e6 / sc.Zb) * sc.Zcb / 1e6 + Mg; st.Mcr = Mcr; st.Muo = u.Mu;
      } else { st.phiMu = 0; st.why = 'no effective strands at this station'; }
      /* shear and torsion: general method (DSG2 engine) */
      var D = p.slab + sc.H, dp = S.tend.length ? S.tend.reduce(function (s_, t_) { return s_ + t_.y * t_.A; }, 0) / S.tend.reduce(function (s_, t_) { return s_ + t_.A; }, 0) : 0.9 * D;
      var slope = (sc.R[2][0] - sc.R[1][0]) / (sc.R[2][1] - sc.R[1][1]), bv = 2 * 100 * Math.sqrt(1 + slope * slope), Ab = Math.PI * p.fitD * p.fitD / 4;
      var Apt = 0, spo = 0, Act = 0; S.tend.forEach(function (t_) { if (t_.y > D / 2) { Apt += t_.A; spo += t_.A * t_.spe; } }); spo = Apt ? spo / Apt : 0;
      S.conc.forEach(function (c_) { if (c_.y > D / 2) Act += c_.b * c_.h; });
      var J = sc.Jcell, uh = 2 * (J.bt + J.bb) / 2 + 2 * Math.hypot((J.bt - J.bb) / 2, J.h), Acp = sc.A + g.s * 1000 * p.slab, uc = sc.ue + 2 * g.s * 1000;
      var Q = { bv: bv, dv: Math.max(0.72 * D, 0.9 * dp), fc: p.fcG, Ec: sc.Eg, Es: 200000, Ep: Ep, Ast: 0, Apt: Apt, spo: spo, Act: Act, fsyf: 500, fsy: 500, fpb: h.mbl * 1e3 / Ap,
        AsvS: Math.max(0, 2 * p.fitLegs - 2) * Ab / p.fitS, AswS: Ab / p.fitS, dg: p.dg, Pv: 0, uh: uh, Ao: J.A0, Aoh: J.A0 / 0.85, Acp: Acp, uc: uc, y1: Math.max(J.h, J.bt) };
      st.shear = Apt > 0 ? DSG2.shear(Q, { V: Vu, T: Tu, M: Mu, N: 0 }) : null; st.Q = Q;
      stations.push(st);
    }
    /* transfer stresses along the girder (losses engine) */
    var fcp = Math.min(h.fci, h.fc), tr = r.st.map(function (s_) { return { x: s_.x, top: s_.top, bot: s_.bot }; });
    /* the losses engine reports compression positive (MPa) */
    var cMax = Math.max.apply(null, r.st.map(function (s_) { return Math.max(s_.top, s_.bot); })), tMin = Math.min.apply(null, r.st.map(function (s_) { return Math.min(s_.top, s_.bot); }));
    var hog = r.res.map(function (q) { return { label: q.label, t: q.t, mid: q.hog[r.mi], P: q.mid ? q.mid.Pm.reduce(function (a_, b_) { return a_ + b_; }, 0) : null }; });
    var debT = 100 * fs.filter(function (q) { return q.d || q.d2; }).length / fs.length, rows = {}; fs.forEach(function (q) { var o = rows[q.y] = rows[q.y] || { n: 0, d: 0 }; o.n++; if (q.d || q.d2) o.d++; });
    var debR = Math.max.apply(null, Object.keys(rows).map(function (y) { return 100 * rows[y].d / rows[y].n; })), mxd = Math.max.apply(null, fs.map(function (q) { return (q.d || 0) + (q.d2 || 0); }));
    return { h: h, r: r, stations: stations, transfer: { cMax: cMax, tMin: tMin, fcp: fcp, along: r.st, X: r.X, mi: r.mi }, hog: hog, Pi: h.ji * h.mbl * fs.length, P0: r.P0 * fs.length, Pfinal: PmF.reduce(function (a_, b_) { return a_ + b_; }, 0), Ptr: Pm0.reduce(function (a_, b_) { return a_ + b_; }, 0),
      detail: { adj: debAdj(fs), n: fs.length, debT: debT, debR: debR, mxd: mxd, lt: lt, Lg: h.L, cgs: fs.reduce(function (a_, q) { return a_ + q.y; }, 0) / fs.length, minCover: Math.min.apply(null, fs.map(function (q) { return q.y; })) - p.db / 2 } };
  }

  /* summary checks for one girder: demand, capacity, utilisation, status, governing combination */
  function checks(p, A, D, lim) {
    var out = [], st = D.stations, add = function (grp, name, dem, cap, unit, gov, note, why) { var u = cap ? dem / cap : null; out.push({ grp: grp, name: name, dem: dem, cap: cap, unit: unit, u: u, ok: u === null ? null : u <= 1, gov: gov || '', note: note || '', why: why || '' }); };
    var mid = st[Math.round(st.length / 2) - (st.length % 2 ? 0 : 0)] || st[0], sm = st.reduce(function (b, s) { return (s.phiMu && s.Mu / s.phiMu > ((b.phiMu && b.Mu / b.phiMu) || -1)) ? s : b; }, st[0]);
    add('Flexure (ULS)', 'Sagging moment M* vs φMu (worst station, x = ' + sm.x.toFixed(1) + ' m)', sm.Mu, sm.phiMu, 'kNm', sm.govM && sm.govM.id, 'AS 5100.5 strain compatibility, rectangular stress block (engine of the original dashboard)');
    var mm = st.reduce(function (b, s) { return s.Mcr && Math.abs(s.x - st[st.length - 1].x / 2) < Math.abs(b.x - st[st.length - 1].x / 2) ? s : b; }, st[0]);
    if (mm.Mcr) add('Flexure (ULS)', 'Minimum strength: 1.2 Mcr vs Muo (mid-span)', 1.2 * mm.Mcr, mm.Muo, 'kNm', '', 'staged cracking moment, f\'ct.f = 0.6√f\'c');
    var ss = st.filter(function (s) { return s.shear; }).reduce(function (b, s) { return !b || s.shear.u > b.shear.u ? s : b; }, null);
    if (ss) add('Shear and torsion (ULS)', 'Combined shear / torsion utilisation (worst station, x = ' + ss.x.toFixed(1) + ' m)', ss.shear.u, 1, '–', ss.govV && ss.govV.id, 'AS 5100.5 general method (engine of the original dashboard); V* = ' + ss.Vu.toFixed(0) + ' kN, T* = ' + ss.Tu.toFixed(0) + ' kNm');
    else add('Shear and torsion (ULS)', 'Shear and torsion', null, null, '', '', '', 'no station with bonded strands in the tension half');
    var sls = Object.keys(mid.sls || {});
    sls.forEach(function (id) {
      var worstB = st.reduce(function (b, s) { return s.sls[id] && s.sls[id].bot > b.v ? { v: s.sls[id].bot, x: s.x } : b; }, { v: -1e9, x: 0 });
      var worstC = st.reduce(function (b, s) { return s.sls[id] && Math.min(s.sls[id].top, s.sls[id].bot) < b.v ? { v: Math.min(s.sls[id].top, s.sls[id].bot), x: s.x } : b; }, { v: 1e9, x: 0 });
      var cc = CC[lim.cc] || CC.a;
      if (id === 'SLS-P') {
        var tl = lim.tPerm;
        add('Service stresses (SLS)', id + ': soffit tension (x = ' + worstB.x.toFixed(1) + ' m)', Math.max(0, worstB.v), tl > 0 ? tl : null, 'MPa', id, 'permanent effects: limit ' + (tl > 0 ? tl.toFixed(2) + ' MPa' : 'no tension (decompression), an input'), tl > 0 ? '' : (worstB.v > 0 ? 'tension present where none is allowed' : ''));
        if (!(tl > 0)) out[out.length - 1].ok = worstB.v <= 0;
      } else if (cc.k) {
        var tk = cc.k * Math.sqrt(p.fcG);
        add('Service stresses (SLS)', id + ': soffit tension, uncracked (x = ' + worstB.x.toFixed(1) + ' m)', Math.max(0, worstB.v), tk, 'MPa', id, cc.label + ': ' + cc.k + '√f\'c = ' + tk.toFixed(2) + ' MPa');
      } else {
        var wd = st.reduce(function (b, s) { return s.sls[id] && s.sls[id].dsp !== undefined && s.sls[id].dsp > b.v ? { v: s.sls[id].dsp, x: s.x, s: s } : b; }, { v: 0, x: st[Math.round(st.length / 2)].x, s: null });
        add('Service stresses (SLS)', id + ': tendon stress increment above decompression (x = ' + wd.x.toFixed(1) + ' m)', wd.v, CC.tendonInc, 'MPa', id, cc.label + ': cracked section, staged; Table 8.6.2.1 bonded tendons ' + CC.tendonInc + ' MPa (no girder bars modelled)');
      }
      add('Service stresses (SLS)', id + ': compression (x = ' + worstC.x.toFixed(1) + ' m)', -worstC.v, lim.cS * p.fcG, 'MPa', id, lim.cS + ' f\'c');
    });
    var nf = nearFaceSpacing(p), ccx = CC[lim.cc] || CC.a;
    if (ccx.spacing && nf) add('Service stresses (SLS)', 'Spacing of bonded tendons near the tension face', nf.s, lim.ccSpacing, 'mm', '', ccx.label + ': c/c spacing in the lowest strand row (' + nf.n + ' strands at ' + nf.y0 + ' mm) ≤ ' + lim.ccSpacing + ' mm');
    add('Transfer (losses engine)', 'Compression at transfer', D.transfer.cMax, lim.cT * D.transfer.fcp, 'MPa', 'transfer', lim.cT + ' f\'cp (' + (lim.cT >= 0.6 ? 'triangular' : 'rectangular') + ' stress distribution, AS 5100.5 Cl 8.1.6.2, verify), f\'cp = ' + D.transfer.fcp + ' MPa');
    var tlim = lim.tT * Math.sqrt(D.transfer.fcp); add('Transfer (losses engine)', 'Tension at transfer', Math.max(0, -D.transfer.tMin), tlim, 'MPa', 'transfer', lim.tT + '√f\'cp' + (lim.tT > 0.25 ? ' (bonded reinforcement near the tensile face assumed)' : ''));
    var hogF = D.hog[D.hog.length - 1].mid, hogE = D.hog.filter(function (q) { return q.t <= p.stage.pour; }).pop();
    add('Deflection and camber', 'Hog at deck pour (mid-span)', hogE ? hogE.mid : null, null, 'mm', '', 'for deck levels and haunch; losses engine');
    add('Deflection and camber', 'Long-term hog (' + p.stage.final + ' d)', hogF, null, 'mm', '', 'positive = up; includes deck, SDL, creep, shrinkage, relaxation');
    var sk = lim.sk || 0, Lmm = A.g.spans[sk].L * 1000, wl = Math.abs(Math.min.apply(null, [A.V.M1600, A.V.S1600].filter(Boolean).map(function (v) { return v.min[A.RS.idx['w:' + A.m.id[sk + ':' + lim.gi + ':' + Math.round(A.m.n / 2)]]]; })));
    if (isFinite(wl)) add('Deflection and camber', 'Traffic deflection at mid-span vs span / ' + lim.defl, wl, Lmm / lim.defl, 'mm', 'M1600 / S1600', 'criterion is an input (illustrative)');
    add('Prestress', 'Jacking force per strand / MBL', D.h.ji, lim.jackMax, '–', '', 'limit ' + lim.jackMax);
    add('Prestress', 'Loss of prestress (transfer to final, mid-span)', 100 * (1 - D.Pfinal / D.P0), null, '%', '', 'initial ' + D.P0.toFixed(0) + ' kN after release, final ' + D.Pfinal.toFixed(0) + ' kN');
    if (lim.debRule === 'tfnsw') {
      add('Detailing', 'Debonded strands at any section (girder end)', D.detail.debT, 50, '%', '', 'TfNSW BTD 2011/06 Rev 1: ≤ 50 % of the strands at any section');
      var adj = D.detail.adj || [];
      add('Detailing', 'Debonded strands next to a debonded strand', adj.length, null, 'pairs', '', 'TfNSW BTD 2011/06 Rev 1: strands horizontally or vertically adjacent to a debonded strand must not be debonded',
        adj.length ? 'adjacent debonded pairs: ' + adj.slice(0, 4).map(function (pr) { return '(' + pr[0].x + ', ' + pr[0].y + ')-(' + pr[1].x + ', ' + pr[1].y + ')'; }).join(', ') + (adj.length > 4 ? ' …' : '') : '');
      out[out.length - 1].ok = adj.length === 0;
    } else {
      add('Detailing', 'Debonded strands, total', D.detail.debT, lim.dbT, '%', '', 'limit ' + lim.dbT + ' % (input; AASHTO-style rule, not AS 5100.5 or TfNSW)');
      add('Detailing', 'Debonded strands, worst row', D.detail.debR, lim.dbR, '%', '', 'limit ' + lim.dbR + ' % (input; AASHTO-style rule)');
    }
    var dv = st.filter(function (s) { return s.dev && s.dev.n && s.Mu > 0 && s.phiMu; }).reduce(function (b, s) { return !b || s.Mu / s.phiMu > b.Mu / b.phiMu ? s : b; }, null);
    add('Detailing', 'Strands within their development length where M* acts', dv ? 100 * dv.dev.A / dv.dev.At : 0, null, '%', '', 'AS 5100.5 Cl 13.3.2.2 (verify): Lp = 0.145 (σpu − 0.67 σpe) db ≥ 60 db, 2 Lp for debonded strands; φMu assumes full development',
      dv ? 'x = ' + dv.x.toFixed(1) + ' m: ' + dv.dev.n + ' strands not fully developed (M*/φMu ' + (dv.Mu / dv.phiMu).toFixed(2) + '); φMu there is unconservative: check by hand' : '');
    out[out.length - 1].ok = dv ? null : true;
    add('Detailing', 'Debond + 2 × transmission length vs girder length', D.detail.mxd + 2 * D.detail.lt, D.detail.Lg, 'mm', '', 'transmission length ' + D.detail.lt.toFixed(0) + ' mm');
    add('Detailing', 'Cover to the lowest strands', lim.cover, Math.max(1e-6, D.detail.minCover), 'mm', '', 'required ' + lim.cover + ' mm, provided ' + D.detail.minCover.toFixed(0) + ' mm (demand = required)');
    return out;
  }

  /* ---------- substructure: bearing reactions to a row of piles; pile N-M check (DSG2 engine) ---------- */
  function piles(p, A, sup) {
    var P = p.piles, g = A.g, b = A.m.sup.map(function (s, q) { return { q: q, s: s }; }).filter(function (o) { return o.s.k === 0 && o.s.end === (sup === 'B' ? 'end' : 'start'); });
    var y = []; for (var i = 0; i < P.n; i++) y.push((i - (P.n - 1) / 2) * P.s);
    var Sy2 = y.reduce(function (s, v) { return s + v * v; }, 0), out = {};
    A.CB.forEach(function (c) {
      var R = b.map(function (o) { return { y: g.y[o.s.i], v: c.max[A.RS.idx['Rb:' + o.q]] }; }), Ptot = R.reduce(function (s, r) { return s + r.v; }, 0), Mx = R.reduce(function (s, r) { return s + r.v * r.y; }, 0);
      var H = c.ls === 'ULS' ? (P.H_brake || 0) * (c.used.some(function (u) { return u === 'M1600' || u === 'S1600'; }) ? 1 : 0) : 0;
      var Mp = (Ptot * P.ecc + H * P.Lf / 2) / P.n;
      out[c.id] = { ls: c.ls, Ptot: Ptot, Mx: Mx, H: H, pile: y.map(function (yi) { return { y: yi, N: Ptot / P.n + Mx * yi / Sy2, M: Mp }; }) };
    });
    /* pile section: circular, bars evenly spaced */
    var D = P.D, Rr = D / 2, poly = []; for (var k = 0; k < 72; k++) { var a = 2 * Math.PI * k / 72; poly.push([Rr * Math.cos(a), Rr + Rr * Math.sin(a)]); }
    var Ec = HOG.t312(P.fc).E, S = { conc: DSG.stripsFromPolygon(poly, D, 0, Ec, P.fc, 'p', 10), bars: [], tend: [] }, rb = Rr - P.cover - 12 - P.dBar / 2;
    for (var q = 0; q < P.nBar; q++) { var a2 = 2 * Math.PI * q / P.nBar; S.bars.push({ y: Rr - rb * Math.sin(a2), A: Math.PI * P.dBar * P.dBar / 4, E: 200000, fsy: 500 }); }
    var nm = DSG2.nm(S, 'top', Rr), curve = nm.pts.map(function (pt) { return { N: -pt.N, M: Math.abs(pt.M), phiN: -pt.N * pt.phi, phiM: Math.abs(pt.M) * pt.phi }; });
    var phiMuAt = function (N) {   /* factored moment capacity at compression N (kN, + compression), linear on the curve */
      var c = curve.slice().sort(function (u, v) { return u.phiN - v.phiN; });
      for (var i2 = 0; i2 < c.length - 1; i2++) if (N >= c[i2].phiN && N <= c[i2 + 1].phiN) { var t = (N - c[i2].phiN) / (c[i2 + 1].phiN - c[i2].phiN || 1); return c[i2].phiM + t * (c[i2 + 1].phiM - c[i2].phiM); }
      return 0;
    };
    var util = []; Object.keys(out).forEach(function (id) { if (out[id].ls !== 'ULS') return; out[id].pile.forEach(function (pl, i3) { var cap = phiMuAt(pl.N); util.push({ id: id, i: i3, N: pl.N, M: pl.M, cap: cap, u: cap > 0 ? pl.M / cap : Infinity }); }); });
    var worst = util.reduce(function (b2, u) { return !b2 || u.u > b2.u ? u : b2; }, null);
    return { y: y, by: out, curve: curve, worst: worst, util: util, S: S };
  }

  return { run: run, combine: combine, val: val, line: line, governing: governing, hogInputs: hogInputs, design: design, checks: checks, piles: piles, CC: CC, crackInc: crackInc, nearFaceSpacing: nearFaceSpacing, debAdj: debAdj };
})();
if (typeof module !== 'undefined') module.exports = ANALYSIS;
