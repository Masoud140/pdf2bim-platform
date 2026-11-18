// Engines extracted into the studio give the same results as the original grillage dashboard they came from.
const path = require('path'), fs = require('fs');
const H = require('../engines/hog_engine.js'), L = require('../engines/seclib.js'), D = require('../engines/dsg_engine.js');
let pass = 0, fail = 0; const t = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  [' + info + ']' : '')); };
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hog_snap.json')));
const r = H.run(snap.p);
t('losses / hog engine: hog at mid-span at every reported time equals the dashboard (1e-9 mm)', Math.max(...r.res.map((q, i) => Math.abs(q.hog[r.mi] - snap.hogmid[i]))) < 1e-9);
t('losses / hog engine: transfer stresses at mid-span equal the dashboard', Math.abs(r.st[r.mi].top - snap.stmid.top) < 1e-9 && Math.abs(r.st[r.mi].bot - snap.stmid.bot) < 1e-9);
const q = L.secProps('1500 Super-T', 1790);
const P = q.P; let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += (a[0] * b[1] - b[0] * a[1]) / 2; }
t('section library: 1500 Super-T area from its outline (shoelace) equals secProps', Math.abs(A - q.A) < 1e-6, q.A.toFixed(0));
t('section library: wider top flange adds area', L.secProps('1500 Super-T', 2400).A > q.A);
t('section library: standard strand grid of the 1500 Super-T has 48 locations (dashboard grid)', L.grid('1500 Super-T').length === 48);
const S = D.stripsFromPolygon ? null : null;
// crack control (Cl 8.6.2.1(b) option): staged decompression on a rectangle equals the transformed-section hand value
{
  global.SECLIB = L; global.HOG = H; global.DSG = D; global.DSG2 = require('../engines/dsg_engine2.js'); global.CORE = require('../src/core.js');
  const AN = require('../src/analysis.js'), b = 500, Hh = 1000, E = 30000, Ep = 195000, Ap = 1000, spe = 1000, yp = 100, P = Ap * spe / 1e3;
  const S = { conc: D.stripsFromLayers([{ h: Hh, b1: b, b2: b, E: E, fc: 50 }], 5), bars: [], tend: [{ y: Hh - yp, A: Ap, E: Ep, spe: spe }] };
  const A = b * Hh, I = b * Hh ** 3 / 12, yb = Hh / 2, sc = { H: Hh, A: A, yb: yb, I: I }, Mnc = 300;
  const o = AN.crackInc(S, sc, { slab: 0 }, { P: P, e: yb - yp }, Mnc, 2000);
  const s0 = -P * 1e3 / A - P * 1e3 * (yb - yp) * yb / I + Mnc * 1e6 * yb / I;          /* locked soffit stress, gross */
  const nA = (Ep / E - 1) * Ap, ybt = (A * yb + nA * yp) / (A + nA), It = I + A * (yb - ybt) ** 2 + nA * (ybt - yp) ** 2;
  const Mdec = Mnc - s0 * It / ybt / 1e6;
  t('crack control: staged decompression moment on a rectangle = transformed-section hand value (0.5 %)', Math.abs(o.Mdec - Mdec) < 0.005 * Mdec, o.Mdec.toFixed(1) + ' vs ' + Mdec.toFixed(1));
  const o2 = AN.crackInc(S, sc, { slab: 0 }, { P: P, e: yb - yp }, Mnc, (Mdec - Mnc) * 1.5);
  t('crack control: tendon stress increment is 0 below decompression', AN.crackInc(S, sc, { slab: 0 }, { P: P, e: yb - yp }, Mnc, (Mdec - Mnc) * 0.9).dsp === 0);
  t('crack control: increment above decompression is positive and below the steel stress for full-depth cracking', o2.dsp > 0 && o2.dsp < 400, o2.dsp.toFixed(1));
}
// added construction stages (p.extra load events) in the time-step losses method
{
  const base = Object.assign({}, snap.p, { meth: 1 }), r0 = H.run(base), mid = (r) => r.res[r.res.length - 1].hog[r.mi];
  const tOn = base.pour + base.dhard + 10, w = 5;
  const rStay = H.run(Object.assign({}, base, { extra: [{ t: tOn, w: w }], times: base.times.concat([tOn]).sort((a, b) => a - b) }));
  const rTemp = H.run(Object.assign({}, base, { extra: [{ t: tOn, w: w }, { t: tOn + 1, w: -w }], times: base.times.concat([tOn, tOn + 1]).sort((a, b) => a - b) }));
  const rZero = H.run(Object.assign({}, base, { extra: [{ t: tOn, w: 0 }], times: base.times.concat([tOn]).sort((a, b) => a - b) }));
  t('added stages: a zero load changes nothing beyond the extra time step (0.01 mm)', Math.abs(mid(rZero) - mid(r0)) < 0.01, mid(rZero).toFixed(3) + ' vs ' + mid(r0).toFixed(3));
  t('added stages: a staying load lowers the long-term hog; the same load removed a day later lowers it far less', mid(rStay) < mid(rTemp) - 1 && mid(rTemp) <= mid(r0) + 1e-6 && mid(r0) - mid(rTemp) < 0.2 * (mid(r0) - mid(rStay)),
    [mid(r0), mid(rTemp), mid(rStay)].map(v => v.toFixed(2)).join(' / '));
  t('added stages: without meth the engine switches to the time-step method', H.run(Object.assign({}, snap.p, { extra: [{ t: tOn, w: w }] })).det === 1);
}
// cracked-state output of crackInc: tension cut off, neutral axis inside the section
{
  const AN = require('../src/analysis.js'), b = 500, Hh = 1000, E = 30000, S = { conc: D.stripsFromLayers([{ h: Hh, b1: b, b2: b, E: E, fc: 50 }], 5), bars: [], tend: [{ y: 900, A: 1000, E: 195000, spe: 1000 }] };
  const o = AN.crackInc(S, { H: Hh, A: b * Hh, yb: 500, I: b * Hh ** 3 / 12 }, { slab: 0 }, { P: 1000, e: 400 }, 300, 1200);
  t('cracked state: no tensile concrete stress, neutral axis between the top and the tendon', o.cracked && Math.max(...o.prof.map(q => q[1])) <= 0 && o.na > 0 && o.na < 900, 'na ' + o.na);
}
// TfNSW BTD 2011/06 adjacency: debonded neighbours on the grid are found horizontally and vertically, not diagonally
{
  const AN = require('../src/analysis.js'), q = (x, y, d) => ({ x, y, d, d2: 0, on: true });
  const fs = [q(-75, 60, 2000), q(-25, 60, 0), q(25, 60, 2000), q(75, 60, 2000), q(-75, 110, 0), q(-25, 110, 2000), q(25, 110, 0), q(75, 110, 0), q(25, 160, 2000)];
  const adj = AN.debAdj(fs).map(p => p.map(s => s.x + ',' + s.y).join(' '));
  t('debonding adjacency: (25,60)-(75,60) horizontal found, diagonals ignored, gap across the centreline counted', adj.length === 1 && adj[0] === '25,60 75,60', JSON.stringify(adj));
}
// moving loads: the governing lane state (lane layout + vehicle / UDL positions) reproduces the envelope value it explains
{
  const C = global.CORE, p = C.CASES.cs01.p, g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc), S = C.build(m), RS = C.responses(m);
  const IM = C.influence(m, S, RS), lays = C.laneLayouts(g, p), opt = { dlaUDL: p.dlaUDL, layouts: lays };
  const e = C.trafficEnvelope(m, g, IM, C.STD.M1600, opt, RS);
  t('moving loads: sweep layouts cover the carriageway at the sweep step', lays.length > 1 && lays.every(L => L.length === g.lanes), lays.length + ' layouts');
  const keys = ['M:0:2:' + (m.n / 2) + ':a', 'V:0:0:0', 'Rb:0'];
  const worst = Math.max(...keys.map(k => { const q = RS.idx[k], gs = C.governingState(m, g, IM, RS, C.STD.M1600, opt, k, 1); const sum = gs.loads.reduce((a, L) => a + L[2] * C.weights(m, g, L[0], L[1], 0).reduce((b, w) => b + w[1] * IM[w[0]][q], 0), 0); return Math.max(Math.abs(gs.value - e.max[q]), Math.abs(sum - e.max[q])) / Math.abs(e.max[q]); }));
  t('moving loads: governing state value = envelope max, and re-applying its loads to the influence surface gives the same (1e-9)', worst < 1e-9, worst.toExponential(1));
  const gn = C.governingState(m, g, IM, RS, C.STD.M1600, opt, 'Rb:0', -1);
  t('moving loads: governing state for the minimum equals the envelope min', Math.abs(gn.value - e.min[RS.idx['Rb:0']]) < 1e-9);
  const pm = Object.assign({}, p, { laneMode: 'manual', laneOffs: [g.cwL + 0.5, g.cwL + 0.5 + 3.2, g.cwL + 20] });
  t('moving loads: manual layout keeps only lanes inside the carriageway and not overlapping', C.laneLayouts(g, pm).length === 1 && C.laneLayouts(g, pm)[0].length === 2);
  const il = C.influenceLine(m, g, IM, RS, keys[0], g.y[2]);
  t('moving loads: influence line of mid-span moment peaks near mid-span and is zero at the supports', il[0][1] === 0 && Math.abs(il.reduce((b, q) => q[1] > b[1] ? q : b)[0] - g.spans[0].L / 2 - g.y[2] * g.t) < 0.6);
}
// differential temperature: self-equilibrating; a uniform temperature gives no stress; a hot top hogs the span
{
  const C = global.CORE, p = Object.assign({}, C.CASES.cs01.p), g = C.geometry(p), sc = C.sections(p, g), tg = require('../src/analysis.js').tempGrad(p, sc, g);
  t('temperature gradient: stresses carry no axial force and no moment', Math.abs(tg.resN) < 1e-3 && Math.abs(tg.resM) < 1, tg.resN.toExponential(1) + ' N, ' + tg.resM.toExponential(1) + ' Nmm');
  t('temperature gradient: hot deck top is in compression, the span hogs (curvature < 0)', tg.deckTop < 0 && tg.k < 0, tg.deckTop.toFixed(2) + ' MPa');
  const tu = require('../src/analysis.js').tempGrad(Object.assign({}, p, { dTdepth: 1e9 }), sc, g);
  t('temperature: a uniform rise gives zero stress everywhere', Math.max(...tu.prof.map(r => Math.abs(r[2]))) < 1e-6);
  const pb = require('../src/analysis.js').parseBars('60:16x4, 1400:N12 x 6; junk');
  t('girder bars parse: two groups, junk ignored', pb.length === 2 && pb[0].y === 60 && pb[0].d === 16 && pb[0].n === 4 && pb[1].n === 6);
  const F = C.windLoads(C.mesh(p, g, sc), g, p, 1), tot = -F.reduce((a, v, i) => a + (i % 3 === 0 ? v : 0), 0);
  t('vertical wind: total load = pressure x deck plan area', Math.abs(tot - (g.edgeR - g.edgeL) * g.spans[0].L) < 1e-6 * tot, tot.toFixed(1) + ' kN at 1 kPa');
}
// bearings schedule and combination generator with wind
{
  const C = global.CORE, AN = require('../src/analysis.js'), p = Object.assign({}, C.CASES.cs01.p), cases = C.CASES_DEF.map(c => Object.assign({}, c, { on: c.proposed ? false : true }));
  const cb = C.generateCombos(cases);
  t('combinations: switching vertical wind on adds one ULS and one SLS wind row with the permanent factors', cb.filter(c => c.id === 'ULS-W' || c.id === 'SLS-W').length === 2 && cb.find(c => c.id === 'ULS-W').f.WVu === 1 && cb.find(c => c.id === 'ULS-W').f.G1 === cb.find(c => c.id === 'ULS-1').f.G1);
  const A0 = AN.run(p, cases, cb, () => {}), A = Object.assign({}, A0, { CB: AN.combine(A0.V, cb, cases, A0.RS.R.length) }), B = AN.bearings(p, A, 0);
  const perm = B.rows.reduce((a, r) => a + r.perm, 0), g = A.g, sc = A.sc;
  const W = g.ng * sc.A * 1e-6 * p.gGirder * g.spans[0].Lg;
  t('bearings: one row per bearing; ULS max >= SLS max >= permanent > 0; permanent reactions sum above the girder weight alone', B.rows.length === 2 * g.ng && B.rows.every(r => r.by.ULS.max >= r.by.SLS.max && r.by.SLS.max >= r.perm - 1e-6 && r.perm > 0) && perm > W, perm.toFixed(0) + ' kN vs girders ' + W.toFixed(0));
  t('bearings: thermal movement = alpha x dT x L', Math.abs(B.dTmove - p.alphaT * 1e-6 * p.dTuni * g.spans[0].L * 1000) < 1e-9, B.dTmove.toFixed(2) + ' mm');
}
// vibration modes and earthquake
{
  const C = global.CORE, AN = require('../src/analysis.js'), p = Object.assign({}, C.CASES.cs01.p, { skew: 0 }), g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc), S = C.build(m), M = C.nodalMass(p, m, g, sc);
  const md = C.modes(S, M, 6), L = g.spans[0].L, tot = M.reduce((a, v) => a + v, 0), EI = m.els.filter(e => e.type === 'girder' && e.j === 0).reduce((a, e) => a + e.EI, 0);
  const f1 = Math.PI / (2 * L * L) * Math.sqrt(EI / (tot / L));
  t('modes: first vertical mode of the square deck = simply supported beam formula with the total EI and mass (3 %)', Math.abs(md[0].f / f1 - 1) < 0.03, md[0].f.toFixed(3) + ' Hz vs ' + f1.toFixed(3));
  t('modes: frequencies ascend; first mode carries most of the vertical mass (8/pi^2 = 81 % for a beam)', md.every((q, i) => !i || q.f >= md[i - 1].f - 1e-9) && Math.abs(md[0].part - 8 / Math.PI ** 2) < 0.03, (100 * md[0].part).toFixed(1) + ' %');
  let orth = 0; for (let i = 0; i < M.length; i++) orth += md[0].phi[i] * M[i] * md[1].phi[i];
  let res = 0; { const F = new Float64Array(S.nd); for (let i = 0; i < M.length; i++) F[C.ND * i] = M[i] * md[0].phi[i] * md[0].w2; const u = C.solve(S, F); for (let i = 0; i < M.length; i++) res = Math.max(res, Math.abs(u[C.ND * i] - md[0].phi[i])); }
  t('modes: mass-orthogonal, and mode 1 satisfies K phi = w2 M phi', Math.abs(orth) < 1e-8 && res < 1e-8 * Math.max(...md[0].phi.map(Math.abs)), orth.toExponential(1) + ', ' + res.toExponential(1));
  const W = tot * C.G_ACC, Q = AN.quake(p, W, null, 0), P = p.piles, kp = 12 * H.t312(P.fc).E * 1e3 * Math.PI * (P.D / 1000) ** 4 / 64 / P.Lf ** 3;
  t('earthquake: T = 2 pi sqrt(m / K) with K = n x 12 EI / Lf^3; transverse (both abutments) is stiffer; F = Sa W', Math.abs(Q.L.T - 2 * Math.PI * Math.sqrt(tot / (P.n * kp))) < 1e-12 && Q.T.T < Q.L.T && Math.abs(Q.L.F - Q.L.Sa * W) < 1e-9, 'T_L ' + Q.L.T.toFixed(3) + ' s');
  t('earthquake: spectral shape is the platform rule (Ce: 1.3 at T = 0, plateau 3.68, 1.25 / T, 1.874 / T^2)', AN.chFactor(0, 'Ce') === 1.3 && AN.chFactor(0.2, 'Ce') === 3.68 && Math.abs(AN.chFactor(1, 'Ce') - 1.25) < 1e-12 && Math.abs(AN.chFactor(2, 'Ce') - 1.874 / 4) < 1e-12);
  const Q2 = AN.quake(Object.assign({}, p, { eq: Object.assign({}, p.eq, { Rf: 2 }) }), W, null, 0);
  t('earthquake: Rf divides the force; pile moment = H Lf / 2', Math.abs(Q2.L.F - Q.L.F / 2) < 1e-9 && Math.abs(Q.L.M - Q.L.H * P.Lf / 2) < 1e-12);
}
// six-freedom frame: horizontal actions (statics and closed forms)
{
  const C = global.CORE, base = Object.assign({}, C.CASES.cs01.p, { skew: 0, sub: Object.assign({}, C.CASES.cs01.p.sub, { on: false }) });   // deck and bearings on rigid ground: the closed forms below assume it
  const run = (over, F) => { const p = Object.assign({}, base, over), g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc), S = C.build(m), RS = C.responses(m); return { p, g, m, RS, v: C.evalResponses(m, RS, C.solve(S, F(m, g, p))) }; };
  const sum = (o, kind, f) => o.m.sup.reduce((a, s, q) => a + (f && !f(s) ? 0 : o.v[o.RS.idx[kind + ':' + q]]), 0);
  let o = run({}, (m, g, p) => C.hzLoads(m, g, p, 'x', () => 500));
  t('braking 500 kN, fixed / free bearings: all of it at the fixed line, shared equally; nothing vertical or transverse', Math.abs(sum(o, 'Hx', s => s.end === 'start') - 500) < 1e-6 && Math.abs(sum(o, 'Hx', s => s.end === 'end')) < 1e-9 && Math.abs(sum(o, 'Hy')) < 1e-6 && Math.abs(sum(o, 'Rb')) < 1e-6
    && o.m.sup.filter(s => s.end === 'start').every((s, q) => Math.abs(o.v[o.RS.idx['Hx:' + o.m.sup.indexOf(s)]] - 500 / o.g.ng) < 1), sum(o, 'Hx', s => s.end === 'start').toFixed(3));
  o = run({}, (m, g, p) => C.hzLoads(m, g, p, 'y', k => 6 * g.spans[k].L)); const L = o.g.spans[0].L;
  const hs = sum(o, 'Hy', s => s.end === 'start'), Fw = C.hzLoads(o.m, o.g, o.p, 'y', k => 6 * o.g.spans[k].L);
  const Mload = o.m.nodes.reduce((a, n) => a + n.x * Fw[C.ND * n.id + 4], 0), Mbrg = o.m.sup.reduce((a, s, q) => a + o.m.nodes[s.node].x * o.v[o.RS.idx['Hy:' + q]] - o.m.nodes[s.node].y * o.v[o.RS.idx['Hx:' + q]], 0);
  t('transverse wind 6 kN/m: force and moment in plan balance; two guided bearings carry it; the fixed line, which also resists turning in plan, takes between 1/2 and 5/8', Math.abs(sum(o, 'Hy') - 6 * L) < 1e-6 && Math.abs(Mbrg - Mload) < 1e-6 * Math.abs(Mload) && hs / (6 * L) > 0.5 && hs / (6 * L) < 0.625 && o.m.sup.filter(s => s.ky).length === 2 && Math.abs(sum(o, 'Hx')) < 1e-6, (100 * hs / (6 * L)).toFixed(1) + ' % at the fixed line');
  o = run({}, (m, g, p) => C.thermalLoads(m, p, 25)); const far = o.m.sup.filter(s => s.end === 'end')[0], dl = o.p.alphaT * 1e-6 * 25 * L * 1000;
  t('uniform temperature, fixed / free with one transverse guide per line: free expansion alpha dT L at the free end and no bearing force', Math.abs(o.v[o.RS.idx['ux:' + far.node]] - dl) < 1e-6 * dl && o.m.sup.every((s, q) => Math.abs(o.v[o.RS.idx['Hx:' + q]]) < 1e-6 && Math.abs(o.v[o.RS.idx['Hy:' + q]]) < 1e-6), dl.toFixed(3) + ' mm');
  o = run({ brgT: 'all' }, (m, g, p) => C.thermalLoads(m, p, 25));
  t('uniform temperature with every bearing held transversely: the deck width is restrained and the bearings take transverse force (self-balancing)', Math.max(...o.m.sup.map((s, q) => Math.abs(o.v[o.RS.idx['Hy:' + q]]))) > 10 && Math.abs(sum(o, 'Hy')) < 1e-6);
  const ke = 3000; o = run({ brg: { start: 'elastomeric', end: 'elastomeric' }, brgKe: ke }, (m, g, p) => C.thermalLoads(m, p, 25));
  const EA = o.m.els.filter(e => e.type === 'girder' && e.i === 0 && e.j === 0)[0].EA, d2 = dl / 1000 / 2 / (1 + ke * L / (2 * EA)), h0 = o.v[o.RS.idx['Hx:' + o.m.sup.indexOf(o.m.sup.filter(s => s.end === 'start' && s.i === 2)[0])]];
  t('elastomeric bearings both ends: each end moves about half the free expansion, bearing force = shear stiffness x movement (bar on two springs, 1 %)', Math.abs(Math.abs(h0) / (ke * d2) - 1) < 0.01 && Math.abs(sum(o, 'Hx')) < 1e-6, Math.abs(h0).toFixed(2) + ' kN vs ' + (ke * d2).toFixed(2));
  o = run({ brg: { start: 'elastomeric', end: 'elastomeric' } }, (m, g, p) => C.hzLoads(m, g, p, 'x', () => 500));
  t('elastomeric both ends: braking shared by both lines', Math.abs(sum(o, 'Hx', s => s.end === 'start') - 250) < 1 && Math.abs(sum(o, 'Hx') - 500) < 1e-6);
  let msg = ''; try { run({ brg: { start: 'free', end: 'free' } }, (m, g, p) => C.hzLoads(m, g, p, 'x', () => 1)); } catch (e) { msg = e.message; }
  t('free bearings at both ends: refused as unstable, naming the freedom', /unstable/.test(msg) && /uX/.test(msg), msg.slice(0, 70));
  const cb = C.generateCombos(C.CASES_DEF.map(c => Object.assign({}, c)));
  t('combinations: braking rides with traffic at its factor; wind and temperature rows exist', cb.find(c => c.id === 'ULS-1').f.BRK === 1.8 && cb.find(c => c.id === 'SLS-1').f.BRK === 1.0 && cb.find(c => c.id === 'ULS-W').f.WTu === 1 && cb.find(c => c.id === 'ULS-T').f.TU === 1.25 && cb.find(c => c.id === 'SLS-T').f.TU === 1);
}
// substructure in the frame: sill, piles with soil springs, bearings as eccentric springs
{
  const C = global.CORE, p = Object.assign({}, C.CASES.cs01.p, { skew: 0 }), g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc), S = C.build(m), RS = C.responses(m), ND = C.ND;
  const ev = F => C.evalResponses(m, RS, C.solve(S, F)), keys = pre => RS.R.filter(r => r.key.startsWith(pre)).map(r => r.key), tot = (v, pre, f) => keys(pre).filter(k => !f || f(k)).reduce((a, k) => a + v[RS.idx[k]], 0);
  t('substructure: ' + m.subN.length + ' nodes, a sill and ' + p.piles.n + ' piles at each abutment, soil springs only below the ground level', m.piles.length === 2 * p.piles.n && m.subE.filter(e => e.type === 'sill').length > 0 && m.springs.filter(s => s.soil !== undefined).every(s => -m.subN[s.soil - m.nodes.length].z + m.subLev.zs > p.piles.gl - 1e-9));
  const Fs = C.sdlLoads(p, m, g), W = -m.nodes.reduce((a, n) => a + Fs[ND * n.id], 0), v = ev(Fs);
  t('vertical load path: superimposed dead load = sum of bearing reactions = sum of pile axial forces', Math.abs(tot(v, 'Rb:') - W) < 1e-6 * W && Math.abs(tot(v, 'pN:') - W) < 1e-6 * W, W.toFixed(1) + ' kN');
  const vb = ev(C.hzLoads(m, g, p, 'x', () => 500));
  t('braking 500 kN: bearings of the fixed line pass it to the piles of abutment A; abutment B piles carry none', Math.abs(tot(vb, 'Hx:') - 500) < 1e-6 && Math.abs(tot(vb, 'pVx:A') - 500) < 1e-6 && Math.abs(tot(vb, 'pVx:B')) < 1e-6, tot(vb, 'pVx:A').toFixed(3));
  const M1 = Math.max(...keys('pMy:A:0:').map(k => Math.abs(vb[RS.idx[k]]))), Hp = 500 / p.piles.n;
  t('braking: pile moment lies between a pile fixed at the ground level and one fixed 6 diameters below it (head held by the sill)', M1 > Hp * p.piles.gl / 2 && M1 < Hp * (p.piles.gl + 6 * p.piles.D / 1000) / 2 * 1.5, M1.toFixed(0) + ' kNm for ' + Hp.toFixed(0) + ' kN per pile');
  const vw = ev(C.hzLoads(m, g, p, 'y', k => 6 * g.spans[k].L));
  t('transverse wind: carried by the piles of both abutments', Math.abs(tot(vw, 'pVy:') - 6 * g.spans[0].L) < 1e-6 && Math.abs(tot(vw, 'pVy:A')) > 10 && Math.abs(tot(vw, 'pVy:B')) > 10);
  const p0 = Object.assign({}, p, { sub: Object.assign({}, p.sub, { on: false }) }), m0 = C.mesh(p0, g, sc);
  t('substructure off: no extra nodes, bearings on rigid ground', !m0.subN && m0.sup.every(s => s.below === undefined));
}
// frame modes and response spectrum analysis
{
  const C = global.CORE, AN = require('../src/analysis.js'), p = Object.assign({}, C.CASES.cs01.p, { skew: 0 }), g = C.geometry(p), sc = C.sections(p, g), m = C.mesh(p, g, sc), S = C.build(m), RS = C.responses(m);
  const D = AN.rsa(p, m, S, RS, g, sc, 12), mx = D.modes[D.dir.x.lead], my = D.modes[D.dir.y.lead];
  t('frame modes: ascending; the leading longitudinal and transverse modes carry most of the mass in their direction', D.modes.every((q, i) => !i || q.f >= D.modes[i - 1].f - 1e-9) && mx.part[0] > 0.5 && my.part[1] > 0.5, 'x: mode ' + (D.dir.x.lead + 1) + ' T ' + mx.T.toFixed(3) + ' s ' + (100 * mx.part[0]).toFixed(0) + ' %; y: mode ' + (D.dir.y.lead + 1) + ' T ' + my.T.toFixed(3) + ' s ' + (100 * my.part[1]).toFixed(0) + ' %');
  const Q = AN.quake(p, D.mass.deck * C.G_ACC, null, 0);
  t('earthquake along the bridge: base shear cannot exceed total mass x peak spectrum, and is at least the leading mode alone', D.dir.x.V <= D.mass.total * C.G_ACC * p.eq.kp * p.eq.Z * 3.68 / p.eq.Rf * 1.0001 && D.dir.x.V >= 0.99 * mx.part[0] * D.mass.total * C.G_ACC * D.dir.x.Sa[D.dir.x.lead], D.dir.x.V.toFixed(0) + ' kN; single-mass hand estimate ' + Q.L.F.toFixed(0) + ' kN at T ' + Q.L.T.toFixed(2) + ' s');
  const pv = k => RS.R.filter(r => r.key.startsWith(k)).reduce((a, r) => a + D.dir.x.R[RS.idx[r.key]], 0);
  t('earthquake along the bridge: bearing forces at the fixed line and pile shears at abutment A are of the order of the base shear of the deck', pv('Hx:') > 0.5 * mx.part[0] * D.mass.deck * C.G_ACC * D.dir.x.Sa[D.dir.x.lead] && pv('pVx:A') > 0 && D.dir.x.R.every(v => v >= 0 && isFinite(v)), 'sum |Hx| ' + pv('Hx:').toFixed(0) + ' kN, pile shears A ' + pv('pVx:A').toFixed(0) + ' kN, B ' + pv('pVx:B').toFixed(0) + ' kN');
  t('mass captured by 12 modes is reported per direction', D.dir.x.captured > 0 && D.dir.x.captured <= 1.0001 && D.dir.y.captured <= 1.0001, 'x ' + (100 * D.dir.x.captured).toFixed(0) + ' %, y ' + (100 * D.dir.y.captured).toFixed(0) + ' %');
  const cb = C.generateCombos(C.CASES_DEF.map(c => Object.assign({}, c))), e = cb.find(c => c.id === 'ULS-EQx');
  t('earthquake combinations: permanent at 1.0 with 100 % + 30 %', e && e.f.EQx === 1 && e.f.EQy === 0.3 && e.f.G1 === 1 && cb.find(c => c.id === 'ULS-EQy').f.EQx === 0.3);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
