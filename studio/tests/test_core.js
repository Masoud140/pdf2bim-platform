// Studio analysis core: solver checks against closed-form results; moving-load port against the Python engine.
const path = require('path'), fs = require('fs'), cp = require('child_process');
global.SECLIB = require('../engines/seclib.js'); global.HOG = require('../engines/hog_engine.js');
const C = require('../src/core.js');
let pass = 0, fail = 0; const t = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  [' + info + ']' : '')); };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// 1. single beam: 10 elements, UDL lumped to nodes, rigid supports
const L = 20, n = 10, EI = 1e6, w = 10, nodes = [], els = [];
for (let j = 0; j <= n; j++) nodes.push({ id: j, x: j * L / n, y: 0 });
for (let j = 0; j < n; j++) els.push({ id: j, type: 'girder', n1: j, n2: j + 1, EI, GJ: 1e5, EA: 1e6, EIz: 1e6, L: L / n, c: 1, s: 0 });
const m = { nodes, els, sup: [{ node: 0, kv: 1e12, krx: 1e9, kx: 1e9, ky: 1e9 }, { node: n, kv: 1e12, ky: 1e9 }], n };
const S = C.build(m), F = new Float64Array(C.ND * (n + 1));
nodes.forEach((q, j) => F[C.ND * j] = -w * L / n * (j === 0 || j === n ? 0.5 : 1));
const U = C.solve(S, F), fm = C.elForces(els[n / 2], U);
t('simply supported beam: mid-span sagging moment = wL²/8', near(fm.M1, w * L * L / 8, 1e-9), fm.M1.toFixed(4) + ' vs ' + (w * L * L / 8));
t('simply supported beam: mid-span deflection within 1 % of 5wL⁴/384EI (lumped loads)', near(-U[C.ND * n / 2], 5 * w * L ** 4 / 384 / EI, 0.01), (-U[C.ND * n / 2]).toFixed(5));
t('simply supported beam: end shear = wL/2 less the end node share', near(C.elForces(els[0], U).V, w * L / 2 - w * L / n / 2, 1e-9));
// rotated beam (member along 45°) gives the same moment
const els45 = els.map(e => Object.assign({}, e, { c: Math.SQRT1_2, s: Math.SQRT1_2 })), m45 = { nodes, els: els45, sup: m.sup, n };
const U45 = C.solve(C.build(m45), F);
t('member direction does not change the result (beam along 45°)', near(C.elForces(els45[n / 2], U45).M1, w * L * L / 8, 1e-9));

// 2. full grillage of Case Study 01
const p = C.CASES.cs01.p, g = C.geometry(p), sc = C.sections(p, g), M = C.mesh(p, g, sc), SS = C.build(M);
const Fs = C.sdlLoads(p, M, g), Us = C.solve(SS, Fs), RS = C.responses(M), r = C.evalResponses(M, RS, Us);
const Rsum = M.sup.reduce((s, _, q) => s + r[RS.idx['Rb:' + q]], 0), Fsum = -Array.from(Fs).filter((_, i) => i % C.ND === 0).reduce((a, b) => a + b, 0);
t('grillage equilibrium: bearing reactions = applied SDL', near(Rsum, Fsum, 1e-8), Rsum.toFixed(2) + ' kN');
const tot = M.els.filter(e => e.type === 'girder' && e.j === M.n / 2 - 1).reduce((s, e) => s + C.elForces(e, Us).M2, 0);
const Ltot = g.spans[0].L, wtot = Fsum / Ltot;
t('grillage statics: sum of girder moments at mid-span = total load x L²/8 (straight deck)', p.skew !== 0 || near(tot, wtot * Ltot * Ltot / 8, 1e-6), tot.toFixed(1));
const p0 = Object.assign(C.deep(p), { skew: 0 }), g0 = C.geometry(p0), M0 = C.mesh(p0, g0, C.sections(p0, g0)), S0 = C.build(M0), F0 = C.sdlLoads(p0, M0, g0), U0 = C.solve(S0, F0);
const tot0 = M0.els.filter(e => e.type === 'girder' && e.j === M0.n / 2 - 1).reduce((s, e) => s + C.elForces(e, U0).M2, 0), w0 = -Array.from(F0).filter((_, i) => i % C.ND === 0).reduce((a, b) => a + b, 0) / g0.spans[0].L;
t('grillage statics, square deck: sum of mid-span girder moments = wL²/8', near(tot0, w0 * g0.spans[0].L ** 2 / 8, 1e-6), tot0.toFixed(1) + ' vs ' + (w0 * g0.spans[0].L ** 2 / 8).toFixed(1));
const IM = C.influence(M0, S0, C.responses(M0)), RS0 = C.responses(M0);
let maxd = 0; for (let q = 0; q < 6; q++) { const nn = (q * 37) % M0.nodes.length, Fq = new Float64Array(S0.nd); Fq[C.ND * nn] = -1; const rr = C.evalResponses(M0, RS0, C.solve(S0, Fq)); rr.forEach((v, k) => maxd = Math.max(maxd, Math.abs(v - IM[nn][k]))); }
t('influence matrix row = direct solve of a unit load', maxd < 1e-9);
// Maxwell reciprocity: deflection at a due to load at b = deflection at b due to load at a
const a = 10, b = 50; t('reciprocity of deflections (Maxwell)', near(IM[a][RS0.idx['w:' + b]], IM[b][RS0.idx['w:' + a]], 1e-9));

let IMc_; const IMc0 = () => IMc_ || (IMc_ = C.influence(M, SS, RS));
// 3. moving-load port against the platform's Python lane_effect on the same synthetic influence lines
const py = JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'fake_lane.py')], { cwd: path.join(__dirname, '..', '..') }).toString());
const fake = { nr: 5, line: (o, grid) => grid.map(x => Float64Array.from([0, 1, 2, 3, 4], rr => Math.sin(0.3 * x * (rr + 1) + o * (rr + 2)) * Math.exp(-0.01 * x))) };
const grid = Array.from({ length: 160 }, (_, i) => i * 0.25);
const js = [-5.0, -1.8, 1.4].map(a0 => C.laneEffect(fake, grid, 0.25, C.STD.M1600, a0, 3.2));
let dmax = 0; js.forEach((e, l) => [0, 1].forEach(s => e[s].forEach((v, k) => dmax = Math.max(dmax, Math.abs(v - py.lanes[l][s][k])))));
t('lane_effect port equals the Python engine (UDL + vehicle, both directions, lateral shifts)', dmax < 1e-9, dmax.toExponential(2));
const cj = C.combineLanes(js, C.STD.ALF); let dc = 0; [0, 1].forEach(s => cj[s].forEach((v, k) => dc = Math.max(dc, Math.abs(v - py.comb[s][k]))));
t('combine_lanes port equals the Python engine (accompanying lane factors)', dc < 1e-9);
// 3b. HLP400 port against the platform's platform_effect (alone, and with half M1600 in the unobstructed lanes)
const hv = C.STD.HLP400;
t('HLP400 data in the Studio equal the platform standards entry', Object.keys(py.hlp_veh).every(k => JSON.stringify(py.hlp_veh[k]) === JSON.stringify(hv[k])));
const h0 = C.hlpEffect(fake, grid, 0.25, hv, 0.3, null, -6, 6, 3.2), h1 = C.hlpEffect(fake, grid, 0.25, hv, 0.3, { veh: C.STD.M1600, factor: 0.5 }, -6, 6, 3.2);
let dh = 0; [[h0, py.hlp], [h1, py.hlp_half]].forEach(([j, q]) => [0, 1].forEach(s => j[s].forEach((v, k) => dh = Math.max(dh, Math.abs(v - q[s][k])))));
t('HLP400 port equals the Python engine (platform alone and with half M1600)', dh < 1e-9, dh.toExponential(2));
t('half M1600 in the free lanes adds to the platform alone', h1[0].every((v, k) => v >= h0[0][k] - 1e-12) && h1[0].some((v, k) => v > h0[0][k] + 1e-6));
const eh = C.hlpEnvelope(M, g, IMc0(), hv, { half: true }, RS), mh = [...Array(g.ng).keys()].map(i => eh.max[RS.idx['M:0:' + i + ':' + (M.n / 2 - 1) + ':b']]);
t('HLP envelope on Case 01: positive mid-span moments in every girder', mh.every(v => v > 0), mh.map(v => v.toFixed(0)).join(' '));
{ const key = 'M:0:' + Math.floor(g.ng / 2) + ':' + (M.n / 2 - 1) + ':b', st = C.hlpState(M, g, IMc0(), RS, hv, { half: true }, key, 1);
  t('HLP governing state reproduces its envelope value', near(st.value, eh.max[RS.idx[key]], 1e-9), st.value.toFixed(2) + ' vs ' + eh.max[RS.idx[key]].toFixed(2)); }
{ const cs = C.deep(C.CASES_DEF); cs.forEach(c => { if (c.id === 'HLP') c.on = true; }); const cb = C.generateCombos(cs, p), hu = cb.filter(c => c.ls === 'ULS' && c.f.HLP), hs = cb.filter(c => c.ls === 'SLS' && c.f.HLP);
  t('HLP in the generated combinations: ULS factor 1.5 (1.0 in the wind-with-traffic row), SLS 1.0, never with braking or centrifugal', hu.length && hu.every(c => (c.id.startsWith('ULS-W+') ? c.f.HLP === 1 : c.f.HLP === 1.5) && !c.f.BRK && !c.f.CEN) && hs.length && hs.some(c => c.f.HLP === 1) && hs.every(c => !c.f.BRK),
    hu.map(c => c.id).join(' ')); }
// 4. traffic envelope on Case 01 runs and gives positive mid-span moments in every girder
const IMc = IMc0(), env = C.trafficEnvelope(M, g, IMc, C.STD.M1600, {}, RS);
const mids = [...Array(g.ng).keys()].map(i => env.max[RS.idx['M:0:' + i + ':' + (M.n / 2 - 1) + ':b']]);
t('M1600 envelope: every girder has a positive mid-span moment; ' + env.lanes + ' lanes, ' + env.layouts + ' layouts', mids.every(v => v > 0), mids.map(v => v.toFixed(0)).join(' '));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
