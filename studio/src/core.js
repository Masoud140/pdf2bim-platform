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
    stage: { tau: 7, pour: 60, dhard: 7, sidlA: 100, final: 3650 }, stageLoads: [],
    fitD: 16, fitLegs: 2, fitS: 125, fsyf: 500, dg: 20, Jf: 1.0, bars: 'N16 @ 150 top and bottom of deck',
    vehicles: { M1600: true, S1600: true }, dlaUDL: false, laneMode: 'sweep', laneOffs: [],
    windVu: 1.0, windVs: 0.5, dTtop: 20, dTdepth: 300, alphaT: 11, dTuni: 25, gbars: '',
    piles: { n: 6, rows: 1, s: 2.4, D: 900, fc: 40, cover: 75, nBar: 16, dBar: 28, Lf: 6.0, H_brake: 0, ecc: 0.3, gl: 1.5, L: 18 },
    eq: { kp: 1.0, Z: 0.08, site: 'Ce', Rf: 1.0 },
    brg: { start: 'fixed', end: 'free' }, brgT: 'centre', brgKe: 3000,
    hBrake: 500, hCent: 0, windTu: 6, windTs: 3,
    sub: { on: true, capW: 1.5, capD: 1.2, ks: 20000, seg: 2, kToe: 1e7 }   /* horizontal actions: braking and centrifugal force per span (kN); transverse wind per metre of bridge (kN/m), ultimate and serviceability */   /* bearing type at each end of every span; brgKe: shear stiffness of one elastomeric bearing, kN/m */   /* gl: ground level below the cap soffit (m); L: pile length (m): drawn and reported, the pile check uses Lf */,
    strands: null, gStr: {}   /* gStr: {girder index: own strand pattern}; girders not listed use `strands` */
  };
  function strandDefault(sec) {
    var g = SECLIB.grid(sec);
    g.forEach(function (s) { s.on = true; s.d = 0; s.d2 = 0; });   /* illustrative: every standard location used, 10 strands debonded */
    [[60, 25, 3000], [110, 75, 2000], [160, 75, 4000]].forEach(function (r) { g.filter(function (s) { return s.y === r[0] && Math.abs(s.x) <= r[1]; }).forEach(function (s) { s.d = r[2]; s.d2 = r[2]; }); });
    return g;
  }
  function mk(o) { var p = Object.assign(deep(BASE), o); ['piles', 'sub', 'eq', 'brg', 'stage'].forEach(function (k) { if (o[k] && BASE[k]) p[k] = Object.assign(deep(BASE[k]), o[k]); });   /* a case that sets part of a group keeps the other defaults */
    p.strands = p.strands || strandDefault(p.girder); return p; }
  var CASES = {
    cs01: { name: 'Case Study 01', title: 'Super-T girder bridge', focus: 'Single simply supported 28 m span, 10° skew, six 1500 Super-T girders.', p: mk({}) },
    cs02: { name: 'Case Study 02', title: 'Multi-span bridge', focus: 'Three simply supported spans (24 + 28 + 24 m) on two piers, six 1500 Super-T girders per span.', p: mk({ spans: [24, 28, 24], skew: 0, ng: 6, spacing: 2.2 }) },
    cs03: { name: 'Case Study 03', title: 'Bridge deck and load distribution', focus: 'Wide 22 m span at 20° skew with eight 1200 Super-T girders: how traffic shares between girders.', p: mk({ spans: [22], skew: 20, ng: 8, spacing: 2.2, girder: '1200 Super-T', overhang: 1.1, piles: { n: 8 } }) },   /* eight piles under the wider deck */
    cs04: { name: 'Case Study 04', title: 'Substructure and pile design', focus: 'A 28 m span; abutment bearing reactions taken into a single row of six bored piles.', p: mk({ spans: [28], skew: 0, ng: 6, spacing: 2.2, piles: { n: 6, rows: 1, s: 2.4, D: 900, fc: 40, cover: 75, nBar: 16, dBar: 28, Lf: 6.0, H_brake: 450, ecc: 0.3 } }) }
  };

  /* ---------- dependency graph: which results depend on which input groups ---------- */
  var GROUPS = { geometry: 'Geometry', section: 'Girder section', material: 'Materials', mesh: 'Mesh', loads: 'Loads', combos: 'Combinations', prestress: 'Prestress and strands', detailing: 'Reinforcement', substructure: 'Substructure', thermal: 'Temperature gradient' };
  var NODES = {
    mesh: ['geometry', 'section', 'mesh', 'substructure'],
    model: ['geometry', 'section', 'material', 'mesh', 'substructure'],
    loads: ['geometry', 'section', 'material', 'mesh', 'loads', 'substructure'],
    losses: ['geometry', 'section', 'material', 'prestress', 'loads'],
    design: ['geometry', 'section', 'material', 'mesh', 'loads', 'combos', 'prestress', 'detailing', 'substructure'],
    piles: ['geometry', 'section', 'material', 'mesh', 'loads', 'combos', 'substructure']
  };
  /* input field -> group */
  var FIELD = { spans: 'geometry', skew: 'geometry', ng: 'geometry', spacing: 'geometry', overhang: 'geometry', barrierW: 'geometry', endDist: 'geometry', cgW: 'geometry', kv: 'geometry',
    girder: 'section', slab: 'section', gap: 'section',
    fcG: 'material', fcT: 'material', fcD: 'material', gConc: 'loads', gGirder: 'loads',
    nEl: 'mesh', nTrans: 'mesh', Jf: 'mesh', sweep: 'loads',
    barrierLoad: 'loads', stageLoads: 'loads', surf: 'loads', gSurf: 'loads', utilities: 'loads', constLL: 'loads', vehicles: 'loads', dlaUDL: 'loads', cases: 'loads', laneMode: 'loads', laneOffs: 'loads', windVu: 'loads', windVs: 'loads', dTtop: 'thermal', dTdepth: 'thermal', alphaT: 'thermal', dTuni: 'thermal',
    combos: 'combos',
    strands: 'prestress', gStr: 'prestress', db: 'prestress', jack: 'prestress', stage: 'prestress',
    fitD: 'detailing', fitLegs: 'detailing', fitS: 'detailing', fsyf: 'detailing', dg: 'detailing', gbars: 'detailing',
    piles: 'substructure', eq: 'loads', brg: 'mesh', brgT: 'mesh', brgKe: 'mesh', sub: 'mesh', hBrake: 'loads', hCent: 'loads', windTu: 'loads', windTs: 'loads', dTuni: 'loads', alphaT: 'loads' };
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
        N.push({ id: N.length, k: k, i: i, j: j, f: f, x: g.xAt(k, i, f), y: g.y[i], z: 0 });
        if (j === 0 || j === n) { var bt = (p.brg || {})[j === 0 ? 'start' : 'end'] || (j === 0 ? 'fixed' : 'free'), kh = bt === 'elastomeric' ? p.brgKe : p.kv;   /* fixed: held both ways; free: slides along the bridge, guided across; elastomeric: shear stiffness both ways */
          var guide = bt === 'elastomeric' || p.brgT === 'all' || i === Math.floor((g.ng - 1) / 2);   /* rigid bearings: one transverse guide per support line, so the deck can breathe across its width */
          sup.push({ node: N.length - 1, k: k, i: i, end: j === 0 ? 'start' : 'end', kv: p.kv, type: bt, kx: bt === 'free' ? 0 : kh, ky: guide ? kh : 0 }); }
      }
      var dL = sp.L / n, Gg = sc.Eg / 2.4, Gd = sc.Ed / 2.4;
      for (var i2 = 0; i2 < g.ng; i2++) for (var j2 = 0; j2 < n; j2++)
        E.push({ id: E.length, type: 'girder', k: k, i: i2, j: j2, n1: id[k + ':' + i2 + ':' + j2], n2: id[k + ':' + i2 + ':' + (j2 + 1)], EI: sc.Eg * 1e3 * sc.Ic * 1e-12, GJ: (p.Jf || 1) * Gg * 1e3 * sc.J * 1e-12, EA: sc.Eg * 1e3 * sc.Ac * 1e-6, EIz: sc.Ed * 1e3 * (p.slab / 1000) * Math.pow(g.s, 3) / 12, label: 'Super-T + deck (composite)' });
      for (var j3 = 0; j3 <= n; j3++) for (var i3 = 0; i3 < g.ng - 1; i3++) {
        var end = j3 === 0 || j3 === n, b = end ? dL / 2 : dL;
        var EI = end ? sc.Ed * 1e3 * sc.cgI * 1e-12 : sc.Ed * 1e3 * sc.slabI1 * 1e-9 * b, GJ = end ? Gd * 1e3 * sc.cgJ * 1e-12 : Gd * 1e3 * sc.slabJ1 * 1e-9 * b;
        var t_ = p.slab / 1000, EA = end ? sc.Ed * 1e3 * p.cgW * sc.cgD / 1000 : sc.Ed * 1e3 * t_ * b, EIz = end ? sc.Ed * 1e3 * (sc.cgD / 1000) * Math.pow(p.cgW, 3) / 12 : sc.Ed * 1e3 * t_ * Math.pow(b, 3) / 12;   /* in-plane: the deck as a frame of strips */
        E.push({ id: E.length, type: end ? 'diaphragm' : 'slab', k: k, i: i3, j: j3, n1: id[k + ':' + i3 + ':' + j3], n2: id[k + ':' + (i3 + 1) + ':' + j3], EI: EI, GJ: GJ, EA: EA, EIz: EIz, b: b, label: end ? 'end cross girder' : 'deck slab strip ' + b.toFixed(2) + ' m' });
      }
    });
    E.forEach(function (e) { var a = N[e.n1], c = N[e.n2]; e.L = Math.hypot(c.x - a.x, c.y - a.y); e.c = (c.x - a.x) / e.L; e.s = (c.y - a.y) / e.L; });
    /* in-plane shear of the deck slab: a frame of strips alone is far too soft in plan, so each deck panel gets two diagonal ties
       sized to the slab's shear stiffness G t (area = G t d^3 / (2 E a b) for a panel a x b with diagonal d). They act on the in-plane freedoms only. */
    var braces = [], tS = p.slab / 1000;
    g.spans.forEach(function (sp, k) { for (var i = 0; i < g.ng - 1; i++) for (var j = 0; j < n; j++) {
      var q = [id[k + ':' + i + ':' + j], id[k + ':' + (i + 1) + ':' + j], id[k + ':' + i + ':' + (j + 1)], id[k + ':' + (i + 1) + ':' + (j + 1)]], a = sp.L / n, b = g.s;
      [[q[0], q[3]], [q[1], q[2]]].forEach(function (d) { var A = N[d[0]], B = N[d[1]], L = Math.hypot(B.x - A.x, B.y - A.y); braces.push({ n1: d[0], n2: d[1], L: L, c: (B.x - A.x) / L, s: (B.y - A.y) / L, EA: sc.Ed * 1e3 / 2.4 * tS * Math.pow(L, 3) / (2 * a * b) }); }); } });
    /* quality indicators (grillage practice, Hambly / Austroads guidance as summarised in the project reference) */
    var dL = g.spans[0].L / n, ratio = dL / g.s, Q = [];
    Q.push({ k: 'Skew angle', v: p.skew.toFixed(1) + '°', ok: p.skew <= 25, note: p.skew <= 25 ? 'skew mesh (transverse members parallel to supports) acceptable below about 25°' : 'above about 25° use an orthogonal mesh; results here are indicative only' });
    Q.push({ k: 'Elements per span', v: n, ok: n >= 8, note: n >= 8 ? 'at least 8 longitudinal elements per span' : 'fewer than 8 elements: moments under point loads under-estimated' });
    Q.push({ k: 'Longitudinal / transverse spacing', v: ratio.toFixed(2), ok: ratio >= 0.5 && ratio <= 2.5, note: 'transverse member spacing close to the girder spacing gives a well-conditioned grillage (0.5 – 2.5 here)' });
    Q.push({ k: 'Smallest element', v: Math.min.apply(null, E.map(function (e) { return e.L; })).toFixed(2) + ' m', ok: true, note: '' });
    var M_ = { n: n, nodes: N, els: E, sup: sup, braces: braces, id: id, quality: Q, dL: dL };
    if (p.sub && p.sub.on) substructure(p, g, sc, M_);
    return M_;
  }

  /* ---------- substructure: abutment sill beams on piles with soil springs, bearings as springs between deck and sill ----------
     Added to the mesh as m.subN (nodes, ids following the deck nodes), m.subE (sill and pile members) and m.springs (soil and toe).
     Levels (z up, deck nodes at z = 0 = composite centroid): bearing at -yc, sill axis half a cap depth below it. */
  function pileK(EA, EI, GJ, L) {   /* 12 x 12 of a VERTICAL member, node 1 above node 2, node freedoms [w, rX, rY, uX, uY, rZ] */
    var k = [], i; for (i = 0; i < 12; i++) k.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    var B = [[12, 6 * L, -12, 6 * L], [6 * L, 4 * L * L, -6 * L, 2 * L * L], [-12, -6 * L, 12, -6 * L], [6 * L, 2 * L * L, -6 * L, 4 * L * L]], a = EI / (L * L * L);
    var put = function (ix, sg) { for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) k[ix[r]][ix[c]] += a * B[r][c] * sg[r] * sg[c]; };
    var x = EA / L; k[0][0] += x; k[6][6] += x; k[0][6] -= x; k[6][0] -= x;
    var t = GJ / L; k[5][5] += t; k[11][11] += t; k[5][11] -= t; k[11][5] -= t;
    put([3, 2, 9, 8], [1, -1, 1, -1]);   /* bending in the x-z plane: slope along the pile (downwards) = -rY */
    put([4, 1, 10, 7], [1, 1, 1, 1]);    /* bending in the y-z plane: slope along the pile = +rX */
    return k;
  }
  function substructure(p, g, sc, m) {
    var P = p.piles, Sb = p.sub, N = m.nodes, nid = N.length, subN = [], subE = [], springs = [], Ec = HOG.t312(P.fc).E * 1e3, Gc = Ec / 2.4;
    var a1 = sc.yc / 1000, a2 = Sb.capD / 2, zs = -(a1 + a2), D = P.D / 1000, Ap = Math.PI * D * D / 4, Ip = Math.PI * Math.pow(D, 4) / 64;
    var b = Sb.capW, d = Sb.capD, la = Math.max(b, d), sm = Math.min(b, d), Jc = la * Math.pow(sm, 3) * (1 / 3 - 0.21 * sm / la * (1 - Math.pow(sm, 4) / (12 * Math.pow(la, 4))));
    var node = function (x, y, z, k) { subN.push({ id: nid, x: x, y: y, z: z, k: k, sub: true }); return nid++; };
    var dofs6 = function (n) { return [0, 1, 2, 3, 4, 5].map(function (c) { return ND * n + c; }); };
    if (!(P.L > P.gl)) throw new Error('piles: the pile length must be greater than the depth of the ground level below the cap');
    var nseg = Math.max(3, Math.ceil(P.L / (Sb.seg || 2))), dz = P.L / nseg, info = [];
    [{ k: 0, end: 'start', name: 'A' }, { k: g.spans.length - 1, end: 'end', name: 'B' }].forEach(function (ab) {
      var sups = m.sup.filter(function (s) { return s.k === ab.k && s.end === ab.end; }).sort(function (u, v) { return N[u.node].y - N[v.node].y; });
      var A0 = N[sups[0].node], B0 = N[sups[sups.length - 1].node], xAt = function (y) { return A0.x + (y - A0.y) * (B0.x - A0.x) / ((B0.y - A0.y) || 1); };
      var pts = sups.map(function (s) { return { y: N[s.node].y, sup: s }; }); for (var q = 0; q < P.n; q++) pts.push({ y: (q - (P.n - 1) / 2) * P.s, pile: q });
      pts.sort(function (u, v) { return u.y - v.y; });
      var line = [], last = null; pts.forEach(function (pt) { if (!last || pt.y - last.y > 1e-3) { last = { y: pt.y, n: node(xAt(pt.y), pt.y, zs, ab.k) }; line.push(last); } pt.n = last.n; });
      for (var i = 0; i < line.length - 1; i++) { var n1 = line[i].n, n2 = line[i + 1].n, na = subN[n1 - N.length], nb = subN[n2 - N.length], L = Math.hypot(nb.x - na.x, nb.y - na.y);
        subE.push({ type: 'sill', ab: ab.name, n1: n1, n2: n2, L: L, c: (nb.x - na.x) / L, s: (nb.y - na.y) / L, EI: Ec * b * d * d * d / 12, GJ: Gc * Jc, EA: Ec * b * d, EIz: Ec * d * b * b * b / 12, label: 'abutment sill ' + b + ' x ' + d + ' m' }); }
      pts.forEach(function (pt) {
        if (pt.sup) {   /* bearing: springs between the deck node and the sill node, acting at bearing level through rigid arms a1 (deck side) and a2 (sill side) */
          var s = pt.sup, ld = [0, 1, 2, 3, 4].map(function (c) { return ND * s.node + c; }).concat([0, 1, 2, 3, 4].map(function (c) { return ND * pt.n + c; }));
          s.below = pt.n; s.ld = ld; s.rows = { R: { k: s.kv, b: [1, 0, 0, 0, 0, -1, 0, 0, 0, 0] }, Hx: { k: s.kx || 0, b: [0, 0, -a1, 1, 0, 0, 0, -a2, -1, 0] }, Hy: { k: s.ky || 0, b: [0, a1, 0, 0, 1, 0, a2, 0, 0, -1] } };
          var K = ld.map(function () { return ld.map(function () { return 0; }); }); ['R', 'Hx', 'Hy'].forEach(function (c) { var r = s.rows[c]; if (!r.k) return; for (var u = 0; u < 10; u++) for (var v = 0; v < 10; v++) K[u][v] += r.k * r.b[u] * r.b[v]; });
          s.link = { d: ld, k: K };
        } else {        /* pile: vertical members from the sill down to the toe; lateral soil springs below the ground level; toe held vertically */
          var top = pt.n, x0 = subN[top - N.length].x, kg = pileK(Ec * Ap, Ec * Ip, Gc * 2 * Ip, dz);
          for (var e = 1; e <= nseg; e++) { var nb2 = node(x0, pt.y, zs - e * dz, ab.k), depth = e * dz;
            subE.push({ type: 'pile', ab: ab.name, k: ab.k, q: pt.pile, e: e, n1: top, n2: nb2, L: dz, kg: kg, d: dofs6(top).concat(dofs6(nb2)), EI: Ec * Ip, EA: Ec * Ap, label: 'pile D' + P.D });
            if (depth > P.gl + 1e-9) { var kh = Sb.ks * D * (e === nseg ? dz / 2 : dz) * Math.min(1, (depth - P.gl + dz / 2) / dz); springs.push({ d: [ND * nb2 + 3], k: [[kh]], soil: nb2, kh: kh }); springs.push({ d: [ND * nb2 + 4], k: [[kh]] }); }
            if (e === nseg) springs.push({ d: [ND * nb2], k: [[Sb.kToe || 1e7]] });
            top = nb2; }
          info.push({ ab: ab.name, q: pt.pile, y: pt.y, head: pt.n });
        }
      });
    });
    m.subN = subN; m.subE = subE; m.springs = springs; m.piles = info; m.subLev = { a1: a1, a2: a2, zs: zs, dz: dz, nseg: nseg };
  }

  /* ---------- space-frame solver: 6 freedoms per node [w up, rX, rY, uX, uY, rZ] ----------
     The first three are the grillage freedoms (vertical deflection and the two bending rotations); the last three are the
     in-plane ones (movement along and across the bridge, rotation in plan). A flat deck with no offsets keeps the two
     sets uncoupled, so vertical results are those of the grillage; bearings with eccentricity and the substructure couple them.
     Skyline (variable-band) Cholesky with the nodes numbered along the bridge. */
  var ND = 6;
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
  function dofs(e) { return [ND * e.n1, ND * e.n1 + 1, ND * e.n1 + 2, ND * e.n2, ND * e.n2 + 1, ND * e.n2 + 2]; }
  /* in-plane part of a horizontal member: local (u1, v1, rz1, u2, v2, rz2), u along the member, v across it in plan, rz = dv/ds */
  function kPlane(e) {
    var L = e.L, a = e.EIz / (L * L * L), k = [], x = e.EA / L; for (var i = 0; i < 6; i++) k.push([0, 0, 0, 0, 0, 0]);
    k[0][0] = x; k[3][3] = x; k[0][3] = -x; k[3][0] = -x;
    var B = [[12, 6 * L, -12, 6 * L], [6 * L, 4 * L * L, -6 * L, 2 * L * L], [-12, -6 * L, 12, -6 * L], [6 * L, 2 * L * L, -6 * L, 4 * L * L]], m = [1, 2, 4, 5];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) k[m[r]][m[c]] = a * B[r][c];
    return k;
  }
  function TmP(e) { var c = e.c, s = e.s, T = []; for (var i = 0; i < 6; i++) T.push([0, 0, 0, 0, 0, 0]);
    [0, 3].forEach(function (o) { T[o][o] = c; T[o][o + 1] = s; T[o + 1][o] = -s; T[o + 1][o + 1] = c; T[o + 2][o + 2] = 1; }); return T; }
  function dofsP(e) { return [ND * e.n1 + 3, ND * e.n1 + 4, ND * e.n1 + 5, ND * e.n2 + 3, ND * e.n2 + 4, ND * e.n2 + 5]; }
  function toGlobal(kl, T) { var n = kl.length, kg = []; for (var i = 0; i < n; i++) { kg.push([]); for (var j = 0; j < n; j++) { var s = 0; for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) s += T[a][i] * kl[a][b] * T[b][j]; kg[i].push(s); } } return kg; }
  function build(m) {
    var N = m.nodes.concat(m.subN || []), nn = N.length, nd = ND * nn, items = [], i, j, k;
    /* number the nodes along the bridge so each row of the matrix only reaches back to nearby nodes */
    var order = N.map(function (n) { return n.id; }).sort(function (a, b) { return (N[a].x - N[b].x) || (N[a].y - N[b].y) || ((N[b].z || 0) - (N[a].z || 0)) || (a - b); }), pos = new Int32Array(nn);
    order.forEach(function (id, q) { pos[id] = q; });
    var P = new Int32Array(nd); for (i = 0; i < nd; i++) P[i] = ND * pos[(i / ND) | 0] + i % ND;
    m.els.concat(m.subE || []).forEach(function (e) {
      if (e.kg) { items.push({ d: e.d, k: e.kg }); return; }                 /* a member that brings its own global stiffness (substructure) */
      e.kl = kLocal(e); e.T = Tm(e); items.push({ d: dofs(e), k: toGlobal(e.kl, e.T) });
      e.klP = kPlane(e); e.TP = TmP(e); items.push({ d: dofsP(e), k: toGlobal(e.klP, e.TP) });
    });
    m.sup.forEach(function (s) {
      if (s.link) { items.push(s.link); return; }                            /* bearing as a spring between the deck and the substructure */
      items.push({ d: [ND * s.node], k: [[s.kv]] }); if (s.krx) items.push({ d: [ND * s.node + 1], k: [[s.krx]] });
      if (s.kx) items.push({ d: [ND * s.node + 3], k: [[s.kx]] }); if (s.ky) items.push({ d: [ND * s.node + 4], k: [[s.ky]] });
    });
    (m.braces || []).forEach(function (b) { var x = b.EA / b.L, c = b.c, sn = b.s, v = [c, sn, -c, -sn], kk = v.map(function (a) { return v.map(function (q) { return x * a * q; }); }); items.push({ d: [ND * b.n1 + 3, ND * b.n1 + 4, ND * b.n2 + 3, ND * b.n2 + 4], k: kk }); });
    (m.springs || []).forEach(function (sp) { items.push(sp); });            /* springs to ground: {d: [dof...], k: matrix} */
    var fi = new Int32Array(nd); for (i = 0; i < nd; i++) fi[i] = i;
    items.forEach(function (it) { it.q = it.d.map(function (d) { return P[d]; }); var mn = Math.min.apply(null, it.q); it.q.forEach(function (r) { if (mn < fi[r]) fi[r] = mn; }); });
    var ptr = new Int32Array(nd + 1); for (i = 0; i < nd; i++) ptr[i + 1] = ptr[i] + (i - fi[i] + 1);
    var A = new Float64Array(ptr[nd]);
    items.forEach(function (it) { for (var a = 0; a < it.q.length; a++) for (var b = 0; b < it.q.length; b++) { var r = it.q[a], c = it.q[b]; if (c <= r) A[ptr[r] + c - fi[r]] += it.k[a][b]; } });
    for (i = 0; i < nd; i++) {                                              /* Cholesky inside the skyline, row by row */
      var f0 = fi[i], pi = ptr[i] - f0;
      for (j = f0; j < i; j++) { var fj = fi[j], pj = ptr[j] - fj, s = A[pi + j]; for (k = f0 > fj ? f0 : fj; k < j; k++) s -= A[pi + k] * A[pj + k]; A[pi + j] = s / A[pj + j]; }
      var d0 = A[pi + i], sum = d0; for (k = f0; k < i; k++) sum -= A[pi + k] * A[pi + k];
      if (!(sum > 1e-10 * d0)) {   /* a pivot that cancels to rounding is a mechanism, not a stiffness */ var dn = order[(i / ND) | 0]; throw new Error('model is unstable: node ' + dn + ' is free to move in freedom ' + ['w', 'rX', 'rY', 'uX', 'uY', 'rZ'][i % ND] + ' (check the bearing types and supports)'); }
      A[pi + i] = Math.sqrt(sum);
    }
    return { nd: nd, L: A, fi: fi, ptr: ptr, P: P, stored: A.length };
  }
  function solve(S, F) {
    var nd = S.nd, L = S.L, fi = S.fi, ptr = S.ptr, P = S.P, y = new Float64Array(nd), x = new Float64Array(nd), i, k;
    for (i = 0; i < nd; i++) y[P[i]] = F[i] || 0;   /* load vectors may cover the deck nodes only */
    for (i = 0; i < nd; i++) { var pi = ptr[i] - fi[i], s = y[i]; for (k = fi[i]; k < i; k++) s -= L[pi + k] * y[k]; y[i] = s / L[pi + i]; }
    for (i = nd - 1; i >= 0; i--) { var pj = ptr[i] - fi[i], v = y[i] / L[pj + i]; y[i] = v; for (k = fi[i]; k < i; k++) y[k] -= L[pj + k] * v; }
    for (i = 0; i < nd; i++) x[i] = y[P[i]];
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
    m.nodes.forEach(function (n) { if (n.sub) return; R.push({ key: 'w:' + n.id, kind: 'w', n: n.id, k: n.k }); });
    m.sup.forEach(function (s, q) { R.push({ key: 'Rb:' + q, kind: 'R', s: q, k: s.k }); });
    m.sup.forEach(function (s, q) { R.push({ key: 'rot:' + q, kind: 'rot', s: q, k: s.k }); });   /* girder end rotation about the transverse axis, mrad */
    m.sup.forEach(function (s, q) { R.push({ key: 'Hx:' + q, kind: 'Hx', s: q, k: s.k }); R.push({ key: 'Hy:' + q, kind: 'Hy', s: q, k: s.k }); });   /* horizontal force on the bearing from the deck, kN, + along x / y */
    m.nodes.forEach(function (n) { if (n.sub) return; R.push({ key: 'ux:' + n.id, kind: 'ux', n: n.id, k: n.k }); R.push({ key: 'uy:' + n.id, kind: 'uy', n: n.id, k: n.k }); });   /* deck movement, mm */
    (m.subE || []).forEach(function (e, q) { if (e.type !== 'pile') return; var id = e.ab + ':' + e.q;   /* pile: axial force and head shears at the top member; moments at the top of every member. k = the span the abutment carries, so the traffic envelope of that span includes them */
      if (e.e === 1) { R.push({ key: 'pN:' + id, kind: 'pile', se: q, c: 0, sg: -1, k: e.k }); R.push({ key: 'pVx:' + id, kind: 'pile', se: q, c: 3, sg: 1, k: e.k }); R.push({ key: 'pVy:' + id, kind: 'pile', se: q, c: 4, sg: 1, k: e.k }); }
      R.push({ key: 'pMx:' + id + ':' + e.e, kind: 'pile', se: q, c: 1, sg: 1, k: e.k }); R.push({ key: 'pMy:' + id + ':' + e.e, kind: 'pile', se: q, c: 2, sg: 1, k: e.k }); });
    R.forEach(function (r, i) { idx[r.key] = i; });
    return { R: R, idx: idx };
  }
  function evalResponses(m, RS, U) {
    var out = new Float64Array(RS.R.length), cache = {};
    RS.R.forEach(function (r, i) {
      if (r.kind === 'w') out[i] = U[ND * r.n] * 1000;    /* mm, + up */
      else if (r.kind === 'pile') { var pe = m.subE[r.se], fv = 0; for (var c2 = 0; c2 < 12; c2++) fv += pe.kg[r.c][c2] * U[pe.d[c2]]; out[i] = r.sg * fv; }   /* member end force at its top node: axial kN (compression +), shear kN, moment kNm */
      else if (r.kind === 'rot') out[i] = U[ND * m.sup[r.s].node + 2] * 1000;
      else if (r.kind === 'ux' || r.kind === 'uy') out[i] = U[ND * r.n + (r.kind === 'ux' ? 3 : 4)] * 1000;
      else if (r.kind === 'R' || r.kind === 'Hx' || r.kind === 'Hy') { var s = m.sup[r.s], c = r.kind === 'R' ? 0 : r.kind === 'Hx' ? 3 : 4, kk = r.kind === 'R' ? s.kv : r.kind === 'Hx' ? s.kx : s.ky, rel = U[ND * s.node + c];
        if (s.rows) { var rw = s.rows[r.kind]; rel = 0; for (var u = 0; u < 10; u++) rel += rw.b[u] * U[s.ld[u]]; }   /* relative movement across the bearing, at bearing level */
        out[i] = (r.kind === 'R' ? -1 : 1) * (kk || 0) * rel; }   /* vertical: kN, + = compression on the bearing; `below` = the substructure node under the bearing, if modelled */
      else { var f = cache[r.e] || (cache[r.e] = elForces(m.els[r.e], U)); out[i] = r.kind === 'Mel' ? (r.end === 1 ? f.M1 : f.M2) : r.kind === 'V' ? f.V : f.T; }
    });
    return out;
  }
  /* influence: response per unit downward load (1 kN) at each node */
  function influence(m, S, RS) {
    var nn = m.nodes.length, IM = [];
    for (var n = 0; n < nn; n++) { var F = new Float64Array(S.nd); F[ND * n] = -1; IM.push(evalResponses(m, RS, solve(S, F))); }
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
  /* lane layouts (arrays of lane left edges, m): AS 5100.2 standard design lanes of STD.laneW across the carriageway.
     'sweep' = every transverse position at the sweep step (the platform engine's rule); 'manual' = the offsets the engineer typed */
  function laneLayouts(g, p) {
    var W = STD.laneW, nl = g.lanes, out = [];
    if ((p.laneMode || 'sweep') === 'manual') {
      var a = (p.laneOffs || []).filter(function (x) { return isFinite(x) && x >= g.cwL - 1e-6 && x + W <= g.cwR + 1e-6; }).sort(function (x, y) { return x - y; });
      a = a.filter(function (x, i) { return i === 0 || x - a[i - 1] >= W - 1e-6; });   /* lanes may not overlap */
      if (a.length) return [a];
    }
    if (nl < 1) return [];
    var slack = (g.cwR - g.cwL) - nl * W, stp = p.sweep || 0.1;
    for (var u = 0; u <= slack + 1e-9; u += stp) { var L = []; for (var l = 0; l < nl; l++) L.push(g.cwL + u + l * W); out.push(L); }
    return out.length ? out : [[g.cwL]];
  }
  function spanGrid(g, sp, dc) { var skx = Math.abs(g.y[0] * g.t), grid = []; for (var X = sp.x0 - skx - 1; X <= sp.x0 + sp.L + skx + 1; X += dc) grid.push(X); return grid; }
  function trafficEnvelope(m, g, IM, veh, opt, RS) {
    /* spans are simply supported, so each span's responses see only that span's loads: one envelope per span (exact) */
    opt = opt || {}; var dc = 0.25, nrAll = IM[0].length, W = STD.laneW, lays = opt.layouts || laneLayouts(g, { sweep: opt.step });
    var mx = new Float64Array(nrAll), mn = new Float64Array(nrAll);
    if (!lays.length) return { max: mx, min: mn, layouts: 0, lanes: 0, lays: [] };
    g.spans.forEach(function (sp, k) {
      var cols = []; RS.R.forEach(function (r, q) { if (r.k === k) cols.push(q); });
      var grid = spanGrid(g, sp, dc);
      var inf = new Inf(m, g, IM, cols, k), nr = cols.length, bx = new Float64Array(nr).fill(-Infinity), bn = new Float64Array(nr).fill(Infinity), memo = {};
      lays.forEach(function (Lay) {
        var eff = Lay.map(function (a) { var key = Math.round(a * 1000); if (!memo[key]) memo[key] = laneEffect(inf, grid, dc, veh, a, W, opt.dlaUDL); return memo[key]; });
        var c = combineLanes(eff, STD.ALF);
        for (var r = 0; r < nr; r++) { if (c[0][r] > bx[r]) bx[r] = c[0][r]; if (c[1][r] < bn[r]) bn[r] = c[1][r]; }
      });
      cols.forEach(function (q, r) { mx[q] = bx[r]; mn[q] = bn[r]; });
    });
    return { max: mx, min: mn, layouts: lays.length, lanes: lays[0].length, lays: lays };
  }
  /* ---- port of traffic.py _lane_state / governing_state: the load position behind one envelope value ---- */
  function laneState(inf, grid, dc, veh, a, W, sign, dlaUDL) {   /* inf holds ONE response; returns {v, loads: [[x, y, P kN]]} */
    var N = grid.length, ns = 8, fu = (dlaUDL ? 1 + veh.dla : 1) * veh.udl_kN_per_m * dc / ns, offs = [], f = new Float64Array(N), i, s;
    for (s = 0; s < ns; s++) { var o = a + (s + 0.5) * W / ns, L = inf.line(o, grid); offs.push(o); for (i = 0; i < N; i++) f[i] += L[i][0] * fu; }
    var loads = [], udl = 0, on = [];
    for (i = 0; i < N; i++) if (sign * f[i] > 0) { udl += f[i]; on.push(i); }
    offs.forEach(function (o) { on.forEach(function (k) { loads.push([grid[k], o, fu]); }); });
    var sa = Math.round(veh.axle_spacing_m / dc), s12 = Math.round((2 * veh.axle_spacing_m + veh.gap_12_m) / dc), s34 = Math.round((2 * veh.axle_spacing_m + veh.gap_34_m) / dc), sg = Math.round((2 * veh.axle_spacing_m + veh.gap_23_min_m) / dc);
    var PAD = s12 + s34 + sg + 2 * sa + 4, ln = N + 2 * PAD, oc = a + W / 2, amp = veh.wheel_kN * (1 + veh.dla), best = 0, bs = null;
    var sh = function (X, k) { var o = new Float64Array(ln); for (var q = 0; q + k < ln; q++) o[q] = X[q + k]; return o; };
    var add = function (X, Y, c) { var o = new Float64Array(ln); for (var q = 0; q < ln; q++) o[q] = c * (X[q] + Y[q]); return o; };
    for (var q = 0; q < 9; q++) {
      var dv = Math.round((-0.4 + 0.1 * q) * 1e10) / 1e10, Lw = inf.line(oc + dv - veh.track_m / 2, grid), Rw = inf.line(oc + dv + veh.track_m / 2, grid), A = new Float64Array(ln);
      for (i = 0; i < N; i++) A[PAD + i] = amp * (Lw[i][0] + Rw[i][0]);
      var Gg = add(add(A, sh(A, sa), 1), sh(A, 2 * sa), 1);
      [[s12, s34], [s34, s12]].forEach(function (ff) {
        var f1 = ff[0], f2 = ff[1], need = f1 + sg, P1 = add(Gg, sh(Gg, f1), sign), P2 = add(Gg, sh(Gg, f2), sign), SM = new Float64Array(ln + 1), k;
        for (k = ln - 1; k >= 0; k--) SM[k] = Math.max(P2[k], SM[k + 1]);   /* optional second pair ahead, never adverse */
        var bi = -1, bv = -Infinity;
        for (k = 0; k < ln; k++) { var tot = P1[k] + SM[Math.min(k + need, ln)]; if (tot > bv) { bv = tot; bi = k; } }
        if (bv > best) { var j = bi + need, jb = null; if (j < ln && SM[j] > 0) { var m_ = -Infinity, mi = j; for (k = j; k < ln; k++) if (P2[k] > m_) { m_ = P2[k]; mi = k; } jb = mi; } best = bv; bs = [dv, f1, f2, bi, jb]; }
      });
    }
    var axles = [];
    if (bs) { var groups = [bs[3], bs[3] + bs[1]].concat(bs[4] === null ? [] : [bs[4], bs[4] + bs[2]]);
      groups.forEach(function (g0) { [g0, g0 + sa, g0 + 2 * sa].forEach(function (ax) { var k = ax - PAD; if (k >= 0 && k < N) [-1, 1].forEach(function (side) { loads.push([grid[k], oc + bs[0] + side * veh.track_m / 2, amp]); axles.push(grid[k]); }); }); }); }
    return { v: udl + sign * best, loads: loads, udl: on.map(function (k) { return grid[k]; }), axles: axles, dv: bs ? bs[0] : 0 };
  }
  function governingState(m, g, IM, RS, veh, opt, key, sign) {   /* the lane layout, lane ranking and load positions behind env[key] (max: sign +1, min: -1) */
    var q = RS.idx[key], r = RS.R[q], k = r.k, dc = 0.25, W = STD.laneW, grid = spanGrid(g, g.spans[k], dc), inf = new Inf(m, g, IM, [q], k), memo = {}, best = null;
    (opt.layouts || laneLayouts(g, { sweep: opt.step })).forEach(function (Lay) {
      var eff = Lay.map(function (a) { var kk = Math.round(a * 1000); if (!memo[kk]) memo[kk] = laneState(inf, grid, dc, veh, a, W, sign, opt.dlaUDL); return memo[kk]; });
      var order = eff.map(function (e, i) { return i; }).sort(function (x, y) { return sign * eff[y].v - sign * eff[x].v; }), val = 0, loads = [], lanes = [];
      order.forEach(function (i, rank) { var fk = STD.ALF[Math.min(rank, STD.ALF.length - 1)], e = eff[i]; if (sign * e.v > 0) { val += fk * e.v; e.loads.forEach(function (L) { loads.push([L[0], L[1], L[2] * fk]); }); lanes.push({ a: Lay[i], f: fk, v: e.v, udl: e.udl, axles: e.axles, dv: e.dv }); } else lanes.push({ a: Lay[i], f: 0, v: e.v, udl: [], axles: [], dv: 0 }); });
      loads = loads.filter(function (L) { return weights(m, g, L[0], L[1], k).length; });   /* grid points beyond the span carry nothing */
      if (!best || sign * val > sign * best.value) best = { value: val, loads: loads, layout: Lay, lanes: lanes, grid: grid };
    });
    return best;
  }
  function influenceLine(m, g, IM, RS, key, o) {   /* response per 1 kN at (x, o) along the response's span */
    var q = RS.idx[key], k = RS.R[q].k, grid = spanGrid(g, g.spans[k], 0.25), inf = new Inf(m, g, IM, [q], k);
    return inf.line(o, grid).map(function (row, i) { return [grid[i], row[0]]; });
  }

  /* ---------- static load cases on the grillage (SDL) and on the girder alone (DL, construction) ---------- */
  function windLoads(m, g, p, q) {   /* uniform vertical pressure q (kPa, + down) over the whole deck plan, to the girder lines by tributary width */
    var F = new Float64Array(ND * m.nodes.length);
    m.nodes.forEach(function (n) { F[ND * n.id] -= q * ((n.i === 0 || n.i === g.ng - 1) ? g.s / 2 + p.overhang : g.s) * (n.j === 0 || n.j === m.n ? 0.5 : 1) * m.dL; });
    return F;
  }
  /* ---------- horizontal actions on the deck (the in-plane freedoms) ---------- */
  function deckShare(m, g, p) {   /* share of a span's deck plan area at each deck node (sums to 1 per span) */
    var w = new Float64Array(m.nodes.length), tot = {};
    m.nodes.forEach(function (n) { if (n.sub) return; w[n.id] = ((n.i === 0 || n.i === g.ng - 1) ? g.s / 2 + p.overhang : g.s) * (n.j === 0 || n.j === m.n ? 0.5 : 1); tot[n.k] = (tot[n.k] || 0) + w[n.id]; });
    m.nodes.forEach(function (n) { if (!n.sub) w[n.id] /= tot[n.k]; });
    return w;
  }
  function hzLoads(m, g, p, dir, perSpan) {   /* dir 'x' (along the bridge) or 'y' (across): perSpan(k) kN on each span, spread over the deck plan */
    var F = new Float64Array(ND * m.nodes.length), w = deckShare(m, g, p), c = dir === 'x' ? 3 : 4;
    m.nodes.forEach(function (n) { if (!n.sub) F[ND * n.id + c] += w[n.id] * perSpan(n.k); });
    return F;
  }
  function thermalLoads(m, p, dT) {   /* uniform temperature change dT (deg C) of the deck: each member tries to lengthen by alpha dT L; equivalent end forces EA alpha dT */
    var F = new Float64Array(ND * m.nodes.length), a = p.alphaT * 1e-6 * dT;
    m.els.filter(function (e) { return e.EA && !e.kg; }).concat(m.braces || []).forEach(function (e) { var N0 = e.EA * a; F[ND * e.n1 + 3] -= N0 * e.c; F[ND * e.n1 + 4] -= N0 * e.s; F[ND * e.n2 + 3] += N0 * e.c; F[ND * e.n2 + 4] += N0 * e.s; });
    return F;
  }
  /* ---------- dynamics: lumped vertical mass and vibration modes of the deck grillage ---------- */
  var G_ACC = 9.80665;
  function permStage(p) { return (p.stageLoads || []).reduce(function (a, q) { return a + (q && q.w && !(q.off > q.t) ? q.w : 0); }, 0); }   /* kN/m per girder */
  function nodalMass(p, m, g, sc) {   /* tonnes at each node: girder + deck (tributary width) + superimposed dead load (barriers, surfacing, utilities) */
    var M = new Float64Array(m.nodes.length), F = sdlLoads(p, m, g);
    m.nodes.forEach(function (n) { var trib = (n.i === 0 || n.i === g.ng - 1) ? g.s / 2 + p.overhang : g.s, w = sc.A * 1e-6 * p.gGirder + (trib * p.slab / 1000 + 0.0375) * p.gConc;
      M[n.id] = (w * (n.j === 0 || n.j === m.n ? 0.5 : 1) * m.dL - F[ND * n.id]) / G_ACC; });
    return M;
  }
  function jacobi(A) {   /* eigenvalues / vectors of a small symmetric matrix (cyclic Jacobi); returns {val, vec} with vec[i][k] = component i of vector k */
    var n = A.length, V = [], i, j, k; for (i = 0; i < n; i++) { V.push([]); for (j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
    for (var sw = 0; sw < 60; sw++) { var off = 0; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += A[i][j] * A[i][j]; if (off < 1e-26) break;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { if (Math.abs(A[i][j]) < 1e-300) continue; var th = (A[j][j] - A[i][i]) / (2 * A[i][j]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), sn = t * c;
        for (k = 0; k < n; k++) { var aik = A[i][k], ajk = A[j][k]; A[i][k] = c * aik - sn * ajk; A[j][k] = sn * aik + c * ajk; }
        for (k = 0; k < n; k++) { var aki = A[k][i], akj = A[k][j]; A[k][i] = c * aki - sn * akj; A[k][j] = sn * aki + c * akj; }
        for (k = 0; k < n; k++) { var vki = V[k][i], vkj = V[k][j]; V[k][i] = c * vki - sn * vkj; V[k][j] = sn * vki + c * vkj; } } }
    return { val: A.map(function (r, q) { return r[q]; }), vec: V };
  }
  /* lowest vertical modes by subspace iteration on K phi = w^2 M phi (mass on the vertical freedoms only; S = the factorised stiffness from build) */
  /* general form: Md = mass on each freedom of the frame (tonnes; zero where there is none). Returns for each mode the full
     displacement shape `u` (all freedoms, mass-normalised) and the participation factor in each direction. */
  function modesF(S, Md, nm) {
    var nd = S.nd, act = [], ii; for (ii = 0; ii < nd; ii++) if (Md[ii] > 0) act.push(ii);
    var nn = act.length, M = new Float64Array(nn); for (ii = 0; ii < nn; ii++) M[ii] = Md[act[ii]];
    var q = Math.min(nn, (nm || 6) + 6), X = [], i, j, k, lam = [];
    for (j = 0; j < q; j++) { var v = new Float64Array(nn); for (i = 0; i < nn; i++) v[i] = Math.sin((j + 1) * (i + 1) * 0.7391) + (j === 0 ? 1 : 0); X.push(v); }
    for (var it = 0; it < 40; it++) {
      var Y = X.map(function (x) { var F = new Float64Array(nd); for (var a = 0; a < nn; a++) F[act[a]] = M[a] * x[a]; var u = solve(S, F), y = new Float64Array(nn); for (var b = 0; b < nn; b++) y[b] = u[act[b]]; return y; });
      var Kr = [], Mr = []; for (j = 0; j < q; j++) { Kr.push(new Array(q)); Mr.push(new Array(q)); }
      for (j = 0; j < q; j++) for (k = j; k < q; k++) { var a1 = 0, b1 = 0; for (i = 0; i < nn; i++) { a1 += Y[j][i] * M[i] * X[k][i]; b1 += Y[j][i] * M[i] * Y[k][i]; } Kr[j][k] = Kr[k][j] = a1; Mr[j][k] = Mr[k][j] = b1; }   /* Y'KY = Y'MX because KY = MX */
      var Gc = []; for (j = 0; j < q; j++) { Gc.push(new Array(q).fill(0)); for (k = 0; k <= j; k++) { var sm = Mr[j][k]; for (i = 0; i < k; i++) sm -= Gc[j][i] * Gc[k][i]; Gc[j][k] = j === k ? Math.sqrt(Math.max(sm, 1e-300)) : sm / Gc[k][k]; } }
      var fwd = function (B) { var o = B.map(function (r) { return r.slice(); }); for (var c = 0; c < q; c++) for (var r = 0; r < q; r++) { var s2 = o[r][c]; for (var t2 = 0; t2 < r; t2++) s2 -= Gc[r][t2] * o[t2][c]; o[r][c] = s2 / Gc[r][r]; } return o; };   /* G^-1 B */
      var tr = function (B) { return B[0].map(function (_, c) { return B.map(function (r) { return r[c]; }); }); };
      var Ar = fwd(tr(fwd(Kr))), E = jacobi(Ar), Z = [];   /* G^-1 Kr G^-T */
      for (k = 0; k < q; k++) { var z = new Array(q); for (j = q - 1; j >= 0; j--) { var s3 = E.vec[j][k]; for (i = j + 1; i < q; i++) s3 -= Gc[i][j] * z[i]; z[j] = s3 / Gc[j][j]; } Z.push(z); }   /* z = G^-T v */
      var ord = E.val.map(function (v2, c) { return c; }).sort(function (a2, b2) { return E.val[a2] - E.val[b2]; }), prev = lam.slice();
      lam = ord.map(function (c) { return E.val[c]; });
      X = ord.map(function (c) { var x = new Float64Array(nn); for (j = 0; j < q; j++) { var zj = Z[c][j], yj = Y[j]; for (i = 0; i < nn; i++) x[i] += zj * yj[i]; } return x; });
      if (prev.length && lam.slice(0, nm || 6).every(function (l, c) { return Math.abs(l - prev[c]) <= 1e-10 * Math.abs(l); })) break;
    }
    return lam.slice(0, nm || 6).map(function (l, c) { var F = new Float64Array(nd), G = [0, 0, 0], dirOf = { 0: 2, 3: 0, 4: 1 }, a;
      for (a = 0; a < nn; a++) { F[act[a]] = M[a] * X[c][a] * l; var d = dirOf[act[a] % ND]; if (d !== undefined) G[d] += M[a] * X[c][a]; }
      return { w2: l, f: Math.sqrt(l) / (2 * Math.PI), T: 2 * Math.PI / Math.sqrt(l), phiA: X[c], u: solve(S, F), G: G }; });   /* K u = w2 M phi, so u is the shape on every freedom; G = participation factors along x, y, z */
  }
  /* vertical modes of the deck alone (mass per deck node on the vertical freedom) */
  function modes(S, M, nm) {
    var Md = new Float64Array(S.nd), tot = 0, i; for (i = 0; i < M.length; i++) { Md[ND * i] = M[i]; tot += M[i]; }
    return modesF(S, Md, nm).map(function (r) { return { w2: r.w2, f: r.f, T: r.T, phi: r.phiA, part: r.G[2] * r.G[2] / tot }; });
  }
  /* mass on every translational freedom of the frame: the deck's dead load, plus the weight of the sill and piles */
  function frameMass(p, m, g, sc) {
    var nd = ND * (m.nodes.length + (m.subN || []).length), Md = new Float64Array(nd), Mn = nodalMass(p, m, g, sc), tot = { deck: 0, sub: 0 }, put = function (n, v) { Md[ND * n] += v; Md[ND * n + 3] += v; Md[ND * n + 4] += v; };
    m.nodes.forEach(function (n) { put(n.id, Mn[n.id]); tot.deck += Mn[n.id]; });
    (m.subE || []).forEach(function (e) { var A = e.type === 'pile' ? Math.PI * Math.pow(p.piles.D / 1000, 2) / 4 : p.sub.capW * p.sub.capD, mh = A * e.L * p.gConc / G_ACC / 2; put(e.n1, mh); put(e.n2, mh); tot.sub += 2 * mh; });
    return { Md: Md, deck: tot.deck, sub: tot.sub };
  }
  function sdlLoads(p, m, g) {
    var F = new Float64Array(ND * m.nodes.length), nodeTrib = function (n) { return (n.j === 0 || n.j === m.n ? 0.5 : 1) * m.dL; };
    /* kN/m over the carriageway, spread to girders by tributary width; added construction stages that stay (no removal age) join this case */
    var surfW = (g.cwR - g.cwL) * p.surf / 1000 * p.gSurf + p.utilities + permStage(p) * g.ng;
    m.nodes.forEach(function (n) {
      var trib = (n.i === 0 || n.i === g.ng - 1) ? (g.s / 2 + (p.overhang - p.barrierW)) : g.s, share = surfW * trib / (g.cwR - g.cwL);
      F[ND * n.id] -= share * nodeTrib(n);
      if (n.i === 0 || n.i === g.ng - 1) {   /* barrier line load at the deck edge: vertical load plus torque about the girder line */
        var e = (p.overhang - p.barrierW / 2) * (n.i === 0 ? -1 : 1), P = p.barrierLoad * nodeTrib(n);
        F[ND * n.id] -= P; F[ND * n.id + 1] -= P * e;   /* moment about +X of a downward load at +Y offset e is -P e */
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
    { id: 'WVu', name: 'Wind, vertical on the deck (ultimate)', cls: 'Wind', act: 'W', on: false, note: 'Vertical wind pressure on the deck plan, upward or downward (enveloped). Transverse wind is not modelled in this vertical-load grillage.' },
    { id: 'WVs', name: 'Wind, vertical on the deck (serviceability)', cls: 'Wind', act: 'W', on: false },
    { id: 'HLP', name: 'HLP 320 / 400 heavy load platform', cls: 'Traffic', act: 'HLP', on: false, proposed: true, note: 'Platform app only: needs the platform vehicle, its lane rules and co-existing half M1600.' },
    { id: 'PED', name: 'Pedestrian load', cls: 'Traffic', act: 'PED', on: false, proposed: true, note: 'Platform app only: no footpath in the Studio deck.' },
    { id: 'BRK', name: 'Braking force', cls: 'Horizontal', act: 'BRKR', on: true, note: 'Along the bridge, either direction, on each span; goes with the traffic models.' },
    { id: 'CEN', name: 'Centrifugal force', cls: 'Horizontal', act: 'CENR', on: false, note: 'Across the bridge, either direction, on each span; goes with the traffic models.' },
    { id: 'WTu', name: 'Wind, transverse (ultimate)', cls: 'Wind', act: 'W', on: true, note: 'Line load across the bridge at deck level, either direction.' },
    { id: 'WTs', name: 'Wind, transverse (serviceability)', cls: 'Wind', act: 'W', on: true },
    { id: 'TU', name: 'Temperature, uniform', cls: 'Thermal', act: 'TU', on: true, note: 'Rise and fall of the deck temperature by the uniform range: bearing movement, and bearing force where the articulation restrains it.' },
    { id: 'TEMP', name: 'Temperature, differential (gradient)', cls: 'Thermal', act: 'TG', on: true, note: 'Positive gradient (Stages page profile): self-equilibrating stresses added to the service stresses of every combination that includes it (simply supported spans: no secondary moments; the negative gradient is not modelled).' },
    { id: 'SCR', name: 'Shrinkage and creep shortening', cls: 'Thermal', act: 'SCR', on: false, proposed: true, note: 'Prestress losses and hog are in the losses engine; restraint effects need the full platform model.' },
    { id: 'EP', name: 'Earth pressure and traffic surcharge on abutments', cls: 'Horizontal', act: 'EP', on: false, proposed: true, note: 'Substructure: needs the full platform model.' },
    { id: 'EQx', name: 'Earthquake along the bridge', cls: 'Earthquake', act: 'EQ', on: true, note: 'Response spectrum analysis of the frame, modes combined by CQC; either direction.' },
    { id: 'EQy', name: 'Earthquake across the bridge', cls: 'Earthquake', act: 'EQ', on: true },
    { id: 'FL', name: 'Water flow and debris', cls: 'Horizontal', act: 'FL', on: false, proposed: true, note: 'Platform app only.' },
    { id: 'COL', name: 'Collision loads (barrier, pier)', cls: 'Horizontal', act: 'COL', on: false, proposed: true, note: 'Platform app only.' }
  ];
  function defaultCombos() {   /* factors from the standards inventory (DLc 1.2/0.85/1.0, SDLs 1.4/1.0, SDLp 2.0/1.3, traffic 1.8/1.0), construction illustrative */
    return [
      { id: 'ULS-1', ls: 'ULS', name: 'Permanent + M1600', f: { G1: 1.2, G2: 1.2, SDLs: 1.4, SDLp: 2.0, M1600: 1.8 } },
      { id: 'ULS-2', ls: 'ULS', name: 'Permanent + S1600', f: { G1: 1.2, G2: 1.2, SDLs: 1.4, SDLp: 2.0, S1600: 1.8 } },
      { id: 'ULS-C', ls: 'ULS', name: 'Construction (girder alone)', f: { G1: 1.2, G2: 1.2, C: 1.5 }, illustrative: true },
      { id: 'SLS-1', ls: 'SLS', name: 'Permanent + M1600', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, M1600: 1.0 } },
      { id: 'SLS-2', ls: 'SLS', name: 'Permanent + S1600', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, S1600: 1.0 } },
      { id: 'SLS-P', ls: 'SLS', name: 'Permanent only', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.0 } },
      /* temperature (uniform + positive gradient) leading, and as the 0.7 companion of M1600 (AS 5100.2 Cl 23.4 companions, unverified) */
      { id: 'SLS-1+T', ls: 'SLS', name: 'Permanent + M1600 + 0.7 × temperature', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, M1600: 1.0, TU: 0.7, TEMP: 0.7 } },
      { id: 'SLS-T', ls: 'SLS', name: 'Permanent + temperature', f: { G1: 1.0, G2: 1.0, SDLs: 1.0, SDLp: 1.3, TU: 1.0, TEMP: 1.0 } }
    ];
  }
  function generateCombos(cases) {   /* automated generation: every enabled traffic model with all permanent cases at default factors */
    var on = cases.filter(function (c) { return c.on && !c.proposed; }), tr = on.filter(function (c) { return c.cls === 'Traffic'; }), out = [];
    var perm = function (ls) { var f = {}; on.forEach(function (c) { if (c.cls === 'Permanent') f[c.id] = ls === 'ULS' ? 1.2 : 1.0; if (c.id === 'SDLs') f[c.id] = ls === 'ULS' ? 1.4 : 1.0; if (c.id === 'SDLp') f[c.id] = ls === 'ULS' ? 2.0 : 1.3; }); return f; };
    var has = function (id) { return on.some(function (c) { return c.id === id; }); };
    tr.forEach(function (t, i) { ['ULS', 'SLS'].forEach(function (ls) { var f = perm(ls), tf = ls === 'ULS' ? 1.8 : 1.0, hz = []; f[t.id] = tf; ['BRK', 'CEN'].forEach(function (h) { if (has(h)) { f[h] = tf; hz.push(h === 'BRK' ? 'braking' : 'centrifugal'); } });   /* braking and centrifugal are traffic actions: same factor */
      if (ls === 'ULS') out.push({ id: ls + '-' + (i + 1), ls: ls, name: 'Permanent + ' + t.id + (hz.length ? ' + ' + hz.join(' + ') : ''), f: f }); }); });   /* SLS rows: lead-group generator below */
    if (on.some(function (c) { return c.id === 'C'; })) out.push({ id: 'ULS-C', ls: 'ULS', name: 'Construction (girder alone)', f: { G1: 1.2, G2: 1.2, C: 1.5 }, illustrative: true });
    var fp = {}; on.forEach(function (c) { if (c.cls === 'Permanent' || c.cls === 'Superimposed dead') fp[c.id] = 1.0; }); out.push({ id: 'SLS-P', ls: 'SLS', name: 'Permanent only', f: fp });
    /* SLS (AS 5100.2 Cl 23.4, as the platform's generator): each transient group leads at 1.0 with every subset of the others at the
       companion factor k1 = 0.7 (one other) or k2 = 0.5 (two or more) (standards entry AS5100.2:combination:sls_companion, unverified).
       Groups: traffic (one model at a time, with braking / centrifugal), thermal (uniform + gradient), wind (serviceability pressures). */
    var K1 = 0.7, K2 = 0.5, grpS = [];
    var trS = tr.map(function (t, i) { var f = {}; f[t.id] = 1; ['BRK', 'CEN'].forEach(function (h_) { if (has(h_)) f[h_] = 1; }); return { tag: String(i + 1), name: t.id, f: f }; });
    if (trS.length) grpS.push({ S: trS });
    var thS = {}; ['TU', 'TEMP'].forEach(function (c) { if (has(c)) thS[c] = 1; }); if (Object.keys(thS).length) grpS.push({ S: [{ tag: 'T', name: 'temperature', f: thS }] });
    var wS = {}; ['WVs', 'WTs'].forEach(function (c) { if (has(c)) wS[c] = 1; }); if (Object.keys(wS).length) grpS.push({ S: [{ tag: 'W', name: 'wind', f: wS }] });
    grpS.forEach(function (L) {
      var O = grpS.filter(function (x) { return x !== L; });
      for (var mask = 0; mask < (1 << O.length); mask++) {
        var oth = O.filter(function (x, i) { return mask & (1 << i); }), k = oth.length === 0 ? 1 : oth.length === 1 ? K1 : K2, sets = [[]];
        [L].concat(oth).forEach(function (G, gi) { var nx = []; sets.forEach(function (cb) { G.S.forEach(function (s_) { nx.push(cb.concat([[s_, gi === 0 ? 1 : k]])); }); }); sets = nx; });
        sets.forEach(function (parts) {
          var f = perm('SLS');
          parts.forEach(function (q) { Object.keys(q[0].f).forEach(function (c) { f[c] = (f[c] || 0) + q[0].f[c] * q[1]; }); });
          out.push({ id: 'SLS-' + parts.map(function (q) { return q[0].tag; }).join('+'), ls: 'SLS', name: 'Permanent + ' + parts.map(function (q) { return (q[1] !== 1 ? q[1] + ' × ' : '') + q[0].name; }).join(' + '), f: f });
        });
      }
    });
    /* wind: permanent + wind at its own limit-state pressure, factor 1.0 (the ultimate and serviceability pressures are separate inputs); unverified */
    if (has('WVu') || has('WTu')) { var fu = perm('ULS'); if (has('WVu')) fu.WVu = 1.0; if (has('WTu')) fu.WTu = 1.0; out.push({ id: 'ULS-W', ls: 'ULS', name: 'Permanent + wind', f: fu }); }
    /* earthquake: permanent actions at 1.0 with 100 % of one direction and 30 % of the other (platform standards inventory, unverified) */
    if (has('EQx') || has('EQy')) [['x', 1, 0.3], ['y', 0.3, 1]].forEach(function (c) { if (!has('EQ' + c[0])) return; var fe = perm('SLS'); if (has('EQx')) fe.EQx = c[1]; if (has('EQy')) fe.EQy = c[2]; out.push({ id: 'ULS-EQ' + c[0], ls: 'ULS', name: 'Permanent + earthquake ' + (c[0] === 'x' ? 'along' : 'across') + ' the bridge (100 % + 30 %)', f: fe }); });
    /* uniform temperature: 1.25 ultimate, 1.0 serviceability (platform standards inventory, unverified) */
    if (has('TU')) { var ft = perm('ULS'); ft.TU = 1.25; out.push({ id: 'ULS-T', ls: 'ULS', name: 'Permanent + uniform temperature', f: ft }); }
    return out;
  }

  var METHOD = [
    'Deck: grillage of composite Super-T + deck slab longitudinal members, deck slab strips as transverse members, end cross girders on the support lines; with six freedoms per node (vertical deflection, two bending rotations, movement along and across the bridge, rotation in plan).',
    'Horizontal actions (braking, centrifugal force, transverse wind, uniform temperature) act on the in-plane freedoms of the deck, which is modelled as a frame of the girders and deck strips; bearings are fixed, free (sliding along the bridge) or elastomeric.',
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
    influence: influence, weights: weights, Inf: Inf, laneEffect: laneEffect, combineLanes: combineLanes, trafficEnvelope: trafficEnvelope, laneLayouts: laneLayouts, laneState: laneState, governingState: governingState, influenceLine: influenceLine,
    sdlLoads: sdlLoads, windLoads: windLoads, ND: ND, pileK: pileK, hzLoads: hzLoads, thermalLoads: thermalLoads, deckShare: deckShare, nodalMass: nodalMass, modes: modes, modesF: modesF, frameMass: frameMass, G_ACC: G_ACC, girderAlone: girderAlone, CASES_DEF: CASES_DEF, defaultCombos: defaultCombos, generateCombos: generateCombos, METHOD: METHOD, Ec: Ec };
})();
if (typeof module !== 'undefined') module.exports = CORE;
