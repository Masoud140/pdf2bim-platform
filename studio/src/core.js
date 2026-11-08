/* ===== Bridge Studio core: case studies, geometry, grillage model and solver, load cases, moving-load envelopes,
   combinations, and the calculation dependency graph. Units: m, kN, kNm (model); mm, N, MPa (sections).
   Engineering basis: see METHOD below. Code coefficients come from the platform's standards inventory and are UNVERIFIED. */
var CORE = (function () {
  'use strict';
  var deep = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- AS 5100.2 data (platform standards inventory, status: code-extracted-unverified) ---------- */
  var STD = {
    M1600: { wheel_kN: 60, track_m: 2.0, axle_spacing_m: 1.25, gap_12_m: 3.75, gap_23_min_m: 6.25, gap_34_m: 5.0, udl_kN_per_m: 6.0, dla: 0.3 },
    S1600: { wheel_kN: 40, track_m: 2.0, axle_spacing_m: 1.25, gap_12_m: 3.75, gap_23_min_m: 6.25, gap_34_m: 5.0, udl_kN_per_m: 24.0, dla: 0.0 },
    ALF: [1.0, 0.8, 0.4], laneW: 3.2,
    status: 'code-extracted-unverified (platform standards inventory, AS 5100.2)'
  };

  /* ---------- generic case studies (illustrative data, not from any project) ---------- */
  var BASE = {
    spans: [28.0], skew: 10, ng: 6, spacing: 2.2, girder: '1500 Super-T', slab: 200, overhang: 1.2, gap: 20,
    barrierW: 0.5, barrierLoad: 10.0, surf: 75, gSurf: 22, gConc: 25, gGirder: 26, utilities: 1.0,
    endDist: 0.4, cgW: 0.8, kv: 1.0e6,
    nEl: 12, nTrans: 0, constLL: 1.5, sweep: 0.2,
    fcG: 50, fcT: 45, fcD: 40, db: 15.2, jack: 0.75,
    stage: { tau: 7, pour: 60, dhard: 7, sidlA: 100, final: 3650 },
    fitD: 16, fitLegs: 2, fitS: 125, dg: 20, Jf: 1.0, bars: 'N16 @ 150 top and bottom of deck',
    vehicles: { M1600: true, S1600: true }, dlaUDL: false,
    piles: { n: 6, rows: 1, s: 2.4, D: 900, fc: 40, cover: 75, nBar: 16, dBar: 28, Lf: 6.0, H_brake: 0, ecc: 0.3 },
    strands: null
  };
  function strandDefault(sec) {
    var g = SECLIB.grid(sec);
    g.forEach(function (s) { s.on = true; s.d = 0; s.d2 = 0; });   /* illustrative: every standard location used, 10 strands debonded */
    [[60, 25, 3000], [110, 75, 2000], [160, 75, 4000]].forEach(function (r) { g.filter(function (s) { return s.y === r[0] && Math.abs(s.x) <= r[1]; }).forEach(function (s) { s.d = r[2]; s.d2 = r[2]; }); });
    return g;
  }
  function mk(o) { var p = Object.assign(deep(BASE), o); p.strands = p.strands || strandDefault(p.girder); return p; }
  var CASES = {
    cs01: { name: 'Case Study 01', title: 'Super-T girder bridge', focus: 'Single simply supported 28 m span, 10° skew, six 1500 Super-T girders.', p: mk({}) },
    cs02: { name: 'Case Study 02', title: 'Multi-span bridge', focus: 'Three simply supported spans (24 + 28 + 24 m) on two piers, six 1500 Super-T girders per span.', p: mk({ spans: [24, 28, 24], skew: 0, ng: 6, spacing: 2.2 }) },
    cs03: { name: 'Case Study 03', title: 'Bridge deck and load distribution', focus: 'Wide 22 m span at 20° skew with eight 1200 Super-T girders: how traffic shares between girders.', p: mk({ spans: [22], skew: 20, ng: 8, spacing: 2.2, girder: '1200 Super-T', overhang: 1.1 }) },
    cs04: { name: 'Case Study 04', title: 'Substructure and pile design', focus: 'A 28 m span; abutment bearing reactions taken into a single row of six bored piles.', p: mk({ spans: [28], skew: 0, ng: 6, spacing: 2.2, piles: { n: 6, rows: 1, s: 2.4, D: 900, fc: 40, cover: 75, nBar: 16, dBar: 28, Lf: 6.0, H_brake: 450, ecc: 0.3 } }) }
  };

  /* ---------- dependency graph: which results depend on which input groups ---------- */
  var GROUPS = { geometry: 'Geometry', section: 'Girder section', material: 'Materials', mesh: 'Mesh', loads: 'Loads', combos: 'Combinations', prestress: 'Prestress and strands', detailing: 'Reinforcement', substructure: 'Substructure' };
  var NODES = {
    mesh: ['geometry', 'section', 'mesh'],
    model: ['geometry', 'section', 'material', 'mesh'],
    loads: ['geometry', 'section', 'material', 'mesh', 'loads'],
    losses: ['geometry', 'section', 'material', 'prestress', 'loads'],
    design: ['geometry', 'section', 'material', 'mesh', 'loads', 'combos', 'prestress', 'detailing'],
    piles: ['geometry', 'section', 'material', 'mesh', 'loads', 'combos', 'substructure']
  };
  /* input field -> group */
  var FIELD = { spans: 'geometry', skew: 'geometry', ng: 'geometry', spacing: 'geometry', overhang: 'geometry', barrierW: 'geometry', endDist: 'geometry', cgW: 'geometry', kv: 'geometry',
    girder: 'section', slab: 'section', gap: 'section',
    fcG: 'material', fcT: 'material', fcD: 'material', gConc: 'loads', gGirder: 'loads',
    nEl: 'mesh', nTrans: 'mesh', Jf: 'mesh', sweep: 'loads',
    barrierLoad: 'loads', surf: 'loads', gSurf: 'loads', utilities: 'loads', constLL: 'loads', vehicles: 'loads', dlaUDL: 'loads', cases: 'loads',
    combos: 'combos',
    strands: 'prestress', db: 'prestress', jack: 'prestress', stage: 'prestress',
    fitD: 'detailing', fitLegs: 'detailing', fitS: 'detailing', dg: 'detailing',
    piles: 'substructure' };
  function stamp(p, groups) {   /* the part of the inputs a result depends on, as a string */
    var o = {}; Object.keys(p).forEach(function (k) { if (groups.indexOf(FIELD[k] || 'other') >= 0) o[k] = p[k]; }); return JSON.stringify(o);
  }

  /* ---------- geometry ---------- */
  function geometry(p) {
    var ng = Math.max(2, Math.round(p.ng)), s = p.spacing, th = p.skew * Math.PI / 180, t = Math.tan(th);
    var y = []; for (var i = 0; i < ng; i++) y.push((i - (ng - 1) / 2) * s);
    var W = (ng - 1) * s + 2 * p.overhang, edgeL = -W / 2, edgeR = W / 2;
    var cwL = edgeL + p.barrierW, cwR = edgeR - p.barrierW;
    var spans = [], x0 = 0;
    p.spans.forEach(function (L, k) { spans.push({ k: k, L: L, x0: x0, Lg: L + 2 * p.endDist }); x0 += L + (k < p.spans.length - 1 ? 2 * p.endDist + 0.05 : 0); });
    var nl = Math.floor((cwR - cwL) / STD.laneW + 1e-9);
    return { ng: ng, y: y, s: s, th: th, t: t, W: W, edgeL: edgeL, edgeR: edgeR, cwL: cwL, cwR: cwR, spans: spans, total: x0, lanes: nl,
      xAt: function (k, i, f) { var sp = spans[k]; return sp.x0 + y[i] * t + f * sp.L; } };   /* plan x of girder i at fraction f of span k */
  }

  /* ---------- sections ---------- */
  function Ec(fc) { return HOG.t312(fc).E; }
  function sections(p, g) {
    var fw = Math.max(SECLIB.FWMIN, Math.min(2500, g.s * 1000 - p.gap));
    var q = SECLIB.secProps(p.girder, fw), H = q.H, R = SECLIB.sR(SECLIB.SEC[p.girder], fw);
    var Eg = Ec(p.fcG), Ed = Ec(p.fcD), n = Ed / Eg, beff = g.s * 1000, t = p.slab;
    var Ad = beff * t * n, yd = H + t / 2, Ac = q.A + Ad, yc = (q.A * q.yb + Ad * yd) / Ac;
    var Ic = q.I + q.A * Math.pow(q.yb - yc, 2) + beff * n * Math.pow(t, 3) / 12 + Ad * Math.pow(yd - yc, 2);
    /* torsion: closed cell (webs, bottom flange, top flange + deck), Bredt thin-wall approximation */
    var ttop = t + 75, tb = R[R.length - 1][1], xw = function (yy) { return R[1][0] + (R[2][0] - R[1][0]) * (yy - R[1][1]) / (R[2][1] - R[1][1]); };
    var yb_ = tb / 2, yt_ = H + t / 2 - ttop / 2 + 37.5, bb = 2 * (xw(yb_) - 50), bt = 2 * (xw(Math.min(yt_, R[2][1])) - 50), h = yt_ - yb_;
    var webL = Math.hypot((bt - bb) / 2, h), A0 = (bb + bt) / 2 * h, J = 4 * A0 * A0 / (bt / ttop + bb / tb + 2 * webL / 100);
    /* transverse slab strips per metre width; end cross girder */
    var cgD = H + t, cgI = p.cgW * 1000 * Math.pow(cgD, 3) / 12, b_ = Math.min(p.cgW * 1000, cgD), d_ = Math.max(p.cgW * 1000, cgD), cgJ = (1 / 3 - 0.21 * b_ / d_ * (1 - Math.pow(b_ / d_, 4) / 12)) * d_ * Math.pow(b_, 3);
    return { fw: fw, R: R, P: q.P, A: q.A, yb: q.yb, I: q.I, H: H, ue: q.ue, Eg: Eg, Ed: Ed, beff: beff, Ac: Ac, yc: yc, Ic: Ic, J: J, Jcell: { A0: A0, bt: bt, bb: bb, h: h, ttop: ttop, tb: tb },
      slabI1: Math.pow(t, 3) / 12, slabJ1: Math.pow(t, 3) / 6, cgI: cgI, cgJ: cgJ, cgD: cgD,
      Zb: q.I / q.yb, Zt: q.I / (H - q.yb), Zcb: Ic / yc, Zct: Ic / (H - yc), Zcd: Ic / (H + t - yc) / n };
  }

  /* ---------- grillage mesh ---------- */
  function mesh(p, g, sc) {
    var n = Math.max(4, Math.round(p.nEl)), N = [], E = [], sup = [], id = {};
    g.spans.forEach(function (sp, k) {
      for (var i = 0; i < g.ng; i++) for (var j = 0; j <= n; j++) {
        var f = j / n; id[k + ':' + i + ':' + j] = N.length;
        N.push({ id: N.length, k: k, i: i, j: j, f: f, x: g.xAt(k, i, f), y: g.y[i] });
        if (j === 0 || j === n) sup.push({ node: N.length - 1, k: k, i: i, end: j === 0 ? 'start' : 'end', kv: p.kv });
      }
      var dL = sp.L / n, Gg = sc.Eg / 2.4, Gd = sc.Ed / 2.4;
      for (var i2 = 0; i2 < g.ng; i2++) for (var j2 = 0; j2 < n; j2++)
        E.push({ id: E.length, type: 'girder', k: k, i: i2, j: j2, n1: id[k + ':' + i2 + ':' + j2], n2: id[k + ':' + i2 + ':' + (j2 + 1)], EI: sc.Eg * 1e3 * sc.Ic * 1e-12, GJ: (p.Jf || 1) * Gg * 1e3 * sc.J * 1e-12, label: 'Super-T + deck (composite)' });
      for (var j3 = 0; j3 <= n; j3++) for (var i3 = 0; i3 < g.ng - 1; i3++) {
        var end = j3 === 0 || j3 === n, b = end ? dL / 2 : dL;
        var EI = end ? sc.Ed * 1e3 * sc.cgI * 1e-12 : sc.Ed * 1e3 * sc.slabI1 * 1e-9 * b, GJ = end ? Gd * 1e3 * sc.cgJ * 1e-12 : Gd * 1e3 * sc.slabJ1 * 1e-9 * b;
        E.push({ id: E.length, type: end ? 'diaphragm' : 'slab', k: k, i: i3, j: j3, n1: id[k + ':' + i3 + ':' + j3], n2: id[k + ':' + (i3 + 1) + ':' + j3], EI: EI, GJ: GJ, b: b, label: end ? 'end cross girder' : 'deck slab strip ' + b.toFixed(2) + ' m' });
      }
    });
    E.forEach(function (e) { var a = N[e.n1], c = N[e.n2]; e.L = Math.hypot(c.x - a.x, c.y - a.y); e.c = (c.x - a.x) / e.L; e.s = (c.y - a.y) / e.L; });
    /* quality indicators (grillage practice, Hambly / Austroads guidance as summarised in the project reference) */
    var dL = g.spans[0].L / n, ratio = dL / g.s, Q = [];
    Q.push({ k: 'Skew angle', v: p.skew.toFixed(1) + '°', ok: p.skew <= 25, note: p.skew <= 25 ? 'skew mesh (transverse members parallel to supports) acceptable below about 25°' : 'above about 25° use an orthogonal mesh; results here are indicative only' });
    Q.push({ k: 'Elements per span', v: n, ok: n >= 8, note: n >= 8 ? 'at least 8 longitudinal elements per span' : 'fewer than 8 elements: moments under point loads under-estimated' });
    Q.push({ k: 'Longitudinal / transverse spacing', v: ratio.toFixed(2), ok: ratio >= 0.5 && ratio <= 2.5, note: 'transverse member spacing close to the girder spacing gives a well-conditioned grillage (0.5 – 2.5 here)' });
    Q.push({ k: 'Smallest element', v: Math.min.apply(null, E.map(function (e) { return e.L; })).toFixed(2) + ' m', ok: true, note: '' });
    return { n: n, nodes: N, els: E, sup: sup, id: id, quality: Q, dL: dL };
  }

  /* ---------- grillage solver: 3 dof per node (w up, rX, rY), dense Cholesky ---------- */
  function kLocal(e) {   /* dofs (w1, rx1, ry1, w2, rx2, ry2); ry = -dw/dx */
    var L = e.L, a = e.EI / (L * L * L), k = [];
    for (var i = 0; i < 6; i++) k.push([0, 0, 0, 0, 0, 0]);
    var B = [[12, 6 * L, -12, 6 * L], [6 * L, 4 * L * L, -6 * L, 2 * L * L], [-12, -6 * L, 12, -6 * L], [6 * L, 2 * L * L, -6 * L, 4 * L * L]], m = [0, 2, 3, 5], sg = [1, -1, 1, -1];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) k[m[r]][m[c]] = a * B[r][c] * sg[r] * sg[c];
    var t = e.GJ / L; k[1][1] = t; k[4][4] = t; k[1][4] = -t; k[4][1] = -t;
    return k;
  }
  function Tm(e) { var c = e.c, s = e.s, T = []; for (var i = 0; i < 6; i++) T.push([0, 0, 0, 0, 0, 0]);
    [0, 3].forEach(function (o) { T[o][o] = 1; T[o + 1][o + 1] = c; T[o + 1][o + 2] = s; T[o + 2][o + 1] = -s; T[o + 2][o + 2] = c; }); return T; }
  function dofs(e) { return [3 * e.n1, 3 * e.n1 + 1, 3 * e.n1 + 2, 3 * e.n2, 3 * e.n2 + 1, 3 * e.n2 + 2]; }
  function build(m) {
    var nd = 3 * m.nodes.length, K = new Float64Array(nd * nd);
    m.els.forEach(function (e) {
      var kl = kLocal(e), T = Tm(e), kg = [], d = dofs(e);
      for (var i = 0; i < 6; i++) { kg.push([]); for (var j = 0; j < 6; j++) { var s = 0; for (var a = 0; a < 6; a++) for (var b = 0; b < 6; b++) s += T[a][i] * kl[a][b] * T[b][j]; kg[i].push(s); } }
      e.kl = kl; e.T = T;
      for (var i2 = 0; i2 < 6; i2++) for (var j2 = 0; j2 < 6; j2++) K[d[i2] * nd + d[j2]] += kg[i2][j2];
    });
    m.sup.forEach(function (s) { K[3 * s.node * nd + 3 * s.node] += s.kv; if (s.krx) K[(3 * s.node + 1) * nd + 3 * s.node + 1] += s.krx; });
    /* Cholesky (lower), in place */
    var Lc = new Float64Array(K);
    for (var j = 0; j < nd; j++) {
      var sum = Lc[j * nd + j]; for (var k = 0; k < j; k++) sum -= Lc[j * nd + k] * Lc[j * nd + k];
      if (sum <= 0) throw new Error('model is unstable (stiffness matrix not positive definite at dof ' + j + ')');
      var dj = Math.sqrt(sum); Lc[j * nd + j] = dj;
      for (var i = j + 1; i < nd; i++) { var s2 = Lc[i * nd + j]; for (var k2 = 0; k2 < j; k2++) s2 -= Lc[i * nd + k2] * Lc[j * nd + k2]; Lc[i * nd + j] = s2 / dj; }
    }
    return { nd: nd, L: Lc };
  }
  function solve(S, F) {
    var nd = S.nd, L = S.L, y = new Float64Array(nd), x = new Float64Array(nd);
    for (var i = 0; i < nd; i++) { var s = F[i]; for (var k = 0; k < i; k++) s -= L[i * nd + k] * y[k]; y[i] = s / L[i * nd + i]; }
    for (var i2 = nd - 1; i2 >= 0; i2--) { var s2 = y[i2]; for (var k2 = i2 + 1; k2 < nd; k2++) s2 -= L[k2 * nd + i2] * x[k2]; x[i2] = s2 / L[i2 * nd + i2]; }
    return x;
  }
  /* element end forces in local axes; returns sagging moment at both ends, shear and torsion (kN, kNm) */
  function elForces(e, U) {
    var d = dofs(e), ug = d.map(function (q) { return U[q]; }), ul = [];
    for (var i = 0; i < 6; i++) { var s = 0; for (var j = 0; j < 6; j++) s += e.T[i][j] * ug[j]; ul.push(s); }
    var f = []; for (var a = 0; a < 6; a++) { var s2 = 0; for (var b = 0; b < 6; b++) s2 += e.kl[a][b] * ul[b]; f.push(s2); }
    /* f[2] = end-1 moment about +y acting on the element; sagging moment at end 1 = f[2], at end 2 = -f[5]; shear V1 = f[0] */
    return { M1: f[2], M2: -f[5], V: f[0], T: f[1] };
  }

  /* ---------- responses: girder moment / shear / torsion at each node, deflection, bearing reactions ---------- */
  function responses(m) {
    var R = [], idx = {};
    m.els.filter(function (e) { return e.type === 'girder'; }).forEach(function (e) {
      R.push({ key: 'M:' + e.k + ':' + e.i + ':' + e.j + ':a', kind: 'Mel', e: e.id, end: 1, k: e.k });
      R.push({ key: 'M:' + e.k + ':' + e.i + ':' + e.j + ':b', kind: 'Mel', e: e.id, end: 2, k: e.k });
      R.push({ key: 'V:' + e.k + ':' + e.i + ':' + e.j, kind: 'V', e: e.id, k: e.k });
      R.push({ key: 'T:' + e.k + ':' + e.i + ':' + e.j, kind: 'T', e: e.id, k: e.k });
    });
    m.nodes.forEach(function (n) { R.push({ key: 'w:' + n.id, kind: 'w', n: n.id, k: n.k }); });
    m.sup.forEach(function (s, q) { R.push({ key: 'Rb:' + q, kind: 'R', s: q, k: s.k }); });
    R.forEach(function (r, i) { idx[r.key] = i; });
    return { R: R, idx: idx };
  }
  function evalResponses(m, RS, U) {
    var out = new Float64Array(RS.R.length), cache = {};
    RS.R.forEach(function (r, i) {
      if (r.kind === 'w') out[i] = U[3 * r.n] * 1000;    /* mm, + up */
      else if (r.kind === 'R') { var s = m.sup[r.s]; out[i] = -s.kv * U[3 * s.node]; }   /* kN, + = compression on the bearing */
      else { var f = cache[r.e] || (cache[r.e] = elForces(m.els[r.e], U)); out[i] = r.kind === 'Mel' ? (r.end === 1 ? f.M1 : f.M2) : r.kind === 'V' ? f.V : f.T; }
    });
    return out;
  }
  /* influence: response per unit downward load (1 kN) at each node */
  function influence(m, S, RS) {
    var nn = m.nodes.length, IM = [];
    for (var n = 0; n < nn; n++) { var F = new Float64Array(S.nd); F[3 * n] = -1; IM.push(evalResponses(m, RS, solve(S, F))); }
    return IM;   /* IM[node][response] */
  }
  /* bilinear weights of a point load at plan (X, Y) onto the grillage nodes */
  function weights(m, g, X, Y, only) {
    var ys = g.y, ng = g.ng, i0, wi;
    if (Y <= ys[0]) { i0 = 0; wi = 0; } else if (Y >= ys[ng - 1]) { i0 = ng - 2; wi = 1; } else { i0 = Math.min(ng - 2, Math.floor((Y - ys[0]) / g.s)); wi = (Y - ys[i0]) / g.s; }
    var out = [];
    [[i0, 1 - wi], [i0 + 1, wi]].forEach(function (q) {
      if (q[1] <= 0) return; var i = q[0];
      g.spans.forEach(function (sp, k) {
        if (only !== undefined && k !== only) return;
        var f = (X - sp.x0 - ys[i] * g.t) / sp.L; if (f < -1e-9 || f > 1 + 1e-9) return;
        f = Math.max(0, Math.min(1, f)); var u = f * m.n, j = Math.min(m.n - 1, Math.floor(u)), r = u - j;
        out.push([m.id[k + ':' + i + ':' + j], q[1] * (1 - r)]); out.push([m.id[k + ':' + i + ':' + (j + 1)], q[1] * r]);
      });
    });
    return out;
  }
  function Inf(m, g, IM, cols, span) {   /* cols: response indices kept (one span), span: loads on that span only */
    this.m = m; this.g = g; this.IM = IM; this.cols = cols || null; this.span = span; this.nr = cols ? cols.length : IM[0].length; this.cache = {};
  }
  Inf.prototype.line = function (o, grid) {   /* (grid points x responses): effect of 1 kN at (grid[x], o) */
    var key = Math.round(o * 1000); if (this.cache[key]) return this.cache[key];
    var nr = this.nr, out = [], self = this;
    var cols = this.cols;
    grid.forEach(function (X) { var row = new Float64Array(nr); weights(self.m, self.g, X, o, self.span).forEach(function (w) { var v = self.IM[w[0]]; if (cols) for (var r = 0; r < nr; r++) row[r] += w[1] * v[cols[r]]; else for (var r2 = 0; r2 < nr; r2++) row[r2] += w[1] * v[r2]; }); out.push(row); });
    return (this.cache[key] = out);
  };
  /* ---- port of pdf2bim/model/traffic.py lane_effect (tested in the platform) ---- */
  function laneEffect(inf, grid, dc, veh, a, W, dlaUDL) {   /* flat-array port of lane_effect: same arithmetic as the Python engine */
    var nr = inf.nr, N = grid.length, ns = 8, pos = new Float64Array(nr), neg = new Float64Array(nr), i, r, s;
    var fu = (dlaUDL ? 1 + veh.dla : 1) * veh.udl_kN_per_m * dc / ns, F = new Float64Array(N * nr);
    for (s = 0; s < ns; s++) { var Ls = inf.line(a + (s + 0.5) * W / ns, grid); for (i = 0; i < N; i++) { var row = Ls[i], o = i * nr; for (r = 0; r < nr; r++) F[o + r] += row[r] * fu; } }
    for (i = 0; i < N * nr; i++) { var v = F[i]; if (v > 0) pos[i % nr] += v; else neg[i % nr] += v; }
    var sa = Math.round(veh.axle_spacing_m / dc), s12 = Math.round((2 * veh.axle_spacing_m + veh.gap_12_m) / dc), s34 = Math.round((2 * veh.axle_spacing_m + veh.gap_34_m) / dc), sg = Math.round((2 * veh.axle_spacing_m + veh.gap_23_min_m) / dc);
    var PAD = s12 + s34 + sg + 2 * sa + 4, ln = N + 2 * PAD, oc = a + W / 2, amp = veh.wheel_kN * (1 + veh.dla), vp = new Float64Array(nr), vn = new Float64Array(nr);
    var A = new Float64Array(ln * nr), G = new Float64Array(ln * nr), P1 = new Float64Array(ln * nr), P2 = new Float64Array(ln * nr), SMx = new Float64Array((ln + 1) * nr), SMn = new Float64Array((ln + 1) * nr);
    var sh = function (X, k, q) { return k + q < ln ? X[(k + q) * nr + r] : 0; };
    for (var q = 0; q < 9; q++) {
      var dv = Math.round((-0.4 + 0.1 * q) * 1e10) / 1e10, Lw = inf.line(oc + dv - veh.track_m / 2, grid), Rw = inf.line(oc + dv + veh.track_m / 2, grid);
      A.fill(0); for (i = 0; i < N; i++) { var o2 = (PAD + i) * nr, lw = Lw[i], rw = Rw[i]; for (r = 0; r < nr; r++) A[o2 + r] = amp * (lw[r] + rw[r]); }
      for (i = 0; i < ln; i++) for (r = 0; r < nr; r++) G[i * nr + r] = A[i * nr + r] + sh(A, i, sa) + sh(A, i, 2 * sa);
      [[s12, s34], [s34, s12]].forEach(function (ff) {
        var f1 = ff[0], f2 = ff[1], need = f1 + sg, k, rr;
        for (k = 0; k < ln; k++) for (rr = 0; rr < nr; rr++) { var b = k * nr + rr; P1[b] = G[b] + (k + f1 < ln ? G[(k + f1) * nr + rr] : 0); P2[b] = G[b] + (k + f2 < ln ? G[(k + f2) * nr + rr] : 0); }
        for (rr = 0; rr < nr; rr++) { SMx[ln * nr + rr] = 0; SMn[ln * nr + rr] = 0; }
        for (k = ln - 1; k >= 0; k--) for (rr = 0; rr < nr; rr++) { var x = P2[k * nr + rr]; SMx[k * nr + rr] = k === ln - 1 ? x : Math.max(x, SMx[(k + 1) * nr + rr]); SMn[k * nr + rr] = k === ln - 1 ? x : Math.min(x, SMn[(k + 1) * nr + rr]); }
        for (k = 0; k < ln; k++) for (rr = 0; rr < nr; rr++) { var c = k * nr + rr; if (SMx[c] < 0) SMx[c] = 0; if (SMn[c] > 0) SMn[c] = 0; }
        for (k = 0; k < ln; k++) { var j = k + need; for (rr = 0; rr < nr; rr++) { var p1 = P1[k * nr + rr], tx = p1 + (j < ln ? SMx[j * nr + rr] : 0), tn = p1 + (j < ln ? SMn[j * nr + rr] : 0); if (tx > vp[rr]) vp[rr] = tx; if (tn < vn[rr]) vn[rr] = tn; } }
      });
    }
    for (r = 0; r < nr; r++) { pos[r] += Math.max(vp[r], 0); neg[r] += Math.min(vn[r], 0); }
    return [pos, neg];
  }
  function combineLanes(eff, lf) {   /* rank lane effects per response, largest adverse first, times the accompanying lane factors */
    var nr = eff[0][0].length, mx = new Float64Array(nr), mn = new Float64Array(nr);
    for (var r = 0; r < nr; r++) {
      var P = eff.map(function (e) { return e[0][r]; }).sort(function (a, b) { return b - a; }), Q = eff.map(function (e) { return e[1][r]; }).sort(function (a, b) { return a - b; });
      for (var i = 0; i < P.length; i++) { var f = lf[Math.min(i, lf.length - 1)]; mx[r] += f * P[i]; mn[r] += f * Q[i]; }
    }
    return [mx, mn];
  }
  function trafficEnvelope(m, g, IM, veh, opt, RS) {
    /* spans are simply supported, so each span's responses see only that span's loads: one envelope per span (exact) */
    opt = opt || {}; var dc = 0.25, nrAll = IM[0].length, W = STD.laneW, nl = g.lanes, slack = (g.cwR - g.cwL) - nl * W, lay = [];
    var mx = new Float64Array(nrAll), mn = new Float64Array(nrAll);
    if (nl < 1) return { max: mx, min: mn, layouts: 0, lanes: 0 };
    var stp = opt.step || 0.1; for (var u = 0; u <= slack + 1e-9; u += stp) lay.push(g.cwL + u);
    if (!lay.length) lay.push(g.cwL);
    var skx = Math.abs(g.y[0] * g.t);
    g.spans.forEach(function (sp, k) {
      var cols = []; RS.R.forEach(function (r, q) { if (r.k === k) cols.push(q); });
      var grid = []; for (var X = sp.x0 - skx - 1; X <= sp.x0 + sp.L + skx + 1; X += dc) grid.push(X);
      var inf = new Inf(m, g, IM, cols, k), nr = cols.length, bx = new Float64Array(nr).fill(-Infinity), bn = new Float64Array(nr).fill(Infinity);
      lay.forEach(function (a0) {
        var eff = []; for (var l = 0; l < nl; l++) eff.push(laneEffect(inf, grid, dc, veh, a0 + l * W, W, opt.dlaUDL));
        var c = combineLanes(eff, STD.ALF);
        for (var r = 0; r < nr; r++) { if (c[0][r] > bx[r]) bx[r] = c[0][r]; if (c[1][r] < bn[r]) bn[r] = c[1][r]; }
      });
      cols.forEach(function (q, r) { mx[q] = bx[r]; mn[q] = bn[r]; });
    });
    return { max: mx, min: mn, layouts: lay.length, lanes: nl };
  }

  /* ---------- static load cases on the grillage (SDL) and on the girder alone (DL, construction) ---------- */
  function sdlLoads(p, m, g) {
    var F = new Float64Array(3 * m.nodes.length), nodeTrib = function (n) { return (n.j === 0 || n.j === m.n ? 0.5 : 1) * m.dL; };
    var surfW = (g.cwR - g.cwL) * p.surf / 1000 * p.gSurf + p.utilities;   /* kN/m over the carriageway, spread to girders by tributary width */
    m.nodes.forEach(function (n) {
      var trib = (n.i === 0 || n.i === g.ng - 1) ? (g.s / 2 + (p.overhang - p.barrierW)) : g.s, share = surfW * trib / (g.cwR - g.cwL);
      F[3 * n.id] -= share * nodeTrib(n);
      if (n.i === 0 || n.i === g.ng - 1) {   /* barrier line load at the deck edge: vertical load plus torque about the girder line */
        var e = (p.overhang - p.barrierW / 2) * (n.i === 0 ? -1 : 1), P = p.barrierLoad * nodeTrib(n);
        F[3 * n.id] -= P; F[3 * n.id + 1] -= P * e;   /* moment about +X of a downward load at +Y offset e is -P e */
      }
    });
    return F;
  }
  function girderAlone(p, g, sc, sp) {   /* simply supported girder under its own and the wet deck weight, construction load: M(x), V(x) at nodes */
    var wG = sc.A * 1e-6 * p.gGirder, wD = (g.s * p.slab / 1000 + 0.075 * 0.5) * p.gConc, wC = p.constLL * g.s, L = sp.L, a = p.endDist, Lg = L + 2 * a;
    var at = function (w, x) { var xb = x; return { M: w * xb * (L - xb) / 2 - 0, V: w * (L / 2 - xb) }; };
    return { wG: wG, wD: wD, wC: wC, at: at, L: L };
  }

  /* ---------- combinations ---------- */
  var CASES_DEF = [
    { id: 'G1', name: 'Girder self weight', cls: 'Permanent', act: 'DLc', on: true, on_girder: true },
    { id: 'G2', name: 'Wet deck slab', cls: 'Permanent', act: 'DLc', on: true, on_girder: true },
    { id: 'SDLs', name: 'Barriers', cls: 'Superimposed dead', act: 'SDLs', on: true },
    { id: 'SDLp', name: 'Surfacing and utilities', cls: 'Superimposed dead', act: 'SDLp', on: true },
    { id: 'C', name: 'Construction live load', cls: 'Construction', act: 'CON', on: true, on_girder: true },
    { id: 'M1600', name: 'M1600 moving traffic', cls: 'Traffic', act: 'M1600', on: true },
    { id: 'S1600', name: 'S1600 stationary traffic', cls: 'Traffic', act: 'S1600', on: true },
    { id: 'TEMP', name: 'Temperature', cls: 'Environmental', act: 'T', on: false, proposed: true, note: 'Not modelled: simply supported girders carry no restraint moment from uniform temperature; differential temperature stresses are a proposed addition.' },
    { id: 'WIND', name: 'Wind', cls: 'Environmental', act: 'W', on: false, proposed: true, note: 'Not modelled in this vertical-load grillage (affects bearings and substructure).' }
  ];
  function defaultCombos() {   /* factors from the standards inventory (DLc 1.2/0.85/1.0, SDLs 1.4/1.0, SDLp 2.0/1.3, traffic 1.8/1.0), construction illustrative */
    return [
      { id: 'ULS-1', ls: 'ULS', name: 'Permanent + M1600', f: { G1: 1.2, G2: 1.2, SDLs: 1.4, SDLp: 2.0, M1600: 1.8 } },
      { id: 'ULS-2', ls: 'ULS', name: 'Permanent + S1600', f: { G1: 1.2, G2: 1.2, SDLs: 1.4, SDLp: 2.0, S1600: 1.8 } },
      { id: 'ULS-C', ls: 'ULS', name: 'Construction (girder alone)', f: { G1: 1.2, G2: 1.2, C: 1.5 }, illustrative: true },
      { id: 'SLS-1', ls: 'SLS', name: 'Permanent + M1600', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, M1600: 1.0 } },
      { id: 'SLS-2', ls: 'SLS', name: 'Permanent + S1600', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, S1600: 1.0 } },
      { id: 'SLS-P', ls: 'SLS', name: 'Permanent only', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.0 } }
    ];
  }
  function generateCombos(cases) {   /* automated generation: every enabled traffic model with all permanent cases at default factors */
    var on = cases.filter(function (c) { return c.on && !c.proposed; }), tr = on.filter(function (c) { return c.cls === 'Traffic'; }), out = [];
    var perm = function (ls) { var f = {}; on.forEach(function (c) { if (c.cls === 'Permanent') f[c.id] = ls === 'ULS' ? 1.2 : 1.0; if (c.id === 'SDLs') f[c.id] = ls === 'ULS' ? 1.4 : 1.0; if (c.id === 'SDLp') f[c.id] = ls === 'ULS' ? 2.0 : 1.3; }); return f; };
    tr.forEach(function (t, i) { ['ULS', 'SLS'].forEach(function (ls) { var f = perm(ls); f[t.id] = ls === 'ULS' ? 1.8 : 1.0; out.push({ id: ls + '-' + (i + 1), ls: ls, name: 'Permanent + ' + t.id, f: f }); }); });
    if (on.some(function (c) { return c.id === 'C'; })) out.push({ id: 'ULS-C', ls: 'ULS', name: 'Construction (girder alone)', f: { G1: 1.2, G2: 1.2, C: 1.5 }, illustrative: true });
    var fp = {}; on.forEach(function (c) { if (c.cls === 'Permanent' || c.cls === 'Superimposed dead') fp[c.id] = 1.0; }); out.push({ id: 'SLS-P', ls: 'SLS', name: 'Permanent only', f: fp });
    return out;
  }

  var METHOD = [
    'Deck: grillage of composite Super-T + deck slab longitudinal members, deck slab strips as transverse members, end cross girders on the support lines; vertical loads only (3 degrees of freedom per node).',
    'Each span is simply supported (girders and deck discontinuous over piers).',
    'Girder and wet-deck weight and construction load act on the girder alone (non-composite), computed as a simply supported beam.',
    'Superimposed dead load and traffic act on the composite grillage. Barrier weight is applied at the deck edge as a line load plus its torque on the edge girder.',
    'Traffic: M1600 and S1600 moving-load envelopes by influence surfaces, lanes swept across the carriageway at 0.1 m, accompanying lane factors 1.0 / 0.8 / 0.4 (port of the platform engine).',
    'Torsion constant of the Super-T closed cell: Bredt thin-wall approximation. Slab strips: I = b t³/12, J = b t³/6.',
    'Prestress losses, camber and transfer stresses: AS 5100.5 time-dependent engine of the original dashboard (verified to 1e-9 against it).',
    'Section strength: AS 5100.5 strain-compatibility and general shear method engines of the original dashboard.',
    'All code coefficients are unverified transcriptions held in the platform standards inventory. Results are not a compliance check.'
  ];

  return { STD: STD, CASES: CASES, BASE: BASE, GROUPS: GROUPS, NODES: NODES, FIELD: FIELD, stamp: stamp, deep: deep, strandDefault: strandDefault,
    geometry: geometry, sections: sections, mesh: mesh, build: build, solve: solve, elForces: elForces, responses: responses, evalResponses: evalResponses,
    influence: influence, weights: weights, Inf: Inf, laneEffect: laneEffect, combineLanes: combineLanes, trafficEnvelope: trafficEnvelope,
    sdlLoads: sdlLoads, girderAlone: girderAlone, CASES_DEF: CASES_DEF, defaultCombos: defaultCombos, generateCombos: generateCombos, METHOD: METHOD, Ec: Ec };
})();
if (typeof module !== 'undefined') module.exports = CORE;
