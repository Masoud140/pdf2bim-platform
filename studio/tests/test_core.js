// Studio analysis core: solver checks against closed-form results; moving-load port against the Python engine.
const path = require('path'), fs = require('fs'), cp = require('child_process');
global.SECLIB = require('../engines/seclib.js'); global.HOG = require('../engines/hog_engine.js');
const C = require('../src/core.js');
let pass = 0, fail = 0; const t = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  [' + info + ']' : '')); };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// 1. single beam: 10 elements, UDL lumped to nodes, rigid supports
const L = 20, n = 10, EI = 1e6, w = 10, nodes = [], els = [];
for (let j = 0; j <= n; j++) nodes.push({ id: j, x: j * L / n, y: 0 });
for (let j = 0; j < n; j++) els.push({ id: j, type: 'girder', n1: j, n2: j + 1, EI, GJ: 1e5, L: L / n, c: 1, s: 0 });
const m = { nodes, els, sup: [{ node: 0, kv: 1e12, krx: 1e9 }, { node: n, kv: 1e12 }], n };
const S = C.build(m), F = new Float64Array(3 * (n + 1));
nodes.forEach((q, j) => F[3 * j] = -w * L / n * (j === 0 || j === n ? 0.5 : 1));
const U = C.solve(S, F), fm = C.elForces(els[n / 2], U);
t('simply supported beam: mid-span sagging moment = wL²/8', near(fm.M1, w * L * L / 8, 1e-9), fm.M1.toFixed(4) + ' vs ' + (w * L * L / 8));
t('simply supported beam: mid-span deflection within 1 % of 5wL⁴/384EI (lumped loads)', near(-U[3 * n / 2], 5 * w * L ** 4 / 384 / EI, 0.01), (-U[3 * n / 2]).toFixed(5));
t('simply supported beam: end shear = wL/2 less the end node share', near(C.elForces(els[0], U).V, w * L / 2 - w * L / n / 2, 1e-9));
// rotated beam (member along 45°) gives the same moment
const els45 = els.map(e => Object.assign({}, e, { c: Math.SQRT1_2, s: Math.SQRT1_2 })), m45 = { nodes, els: els45, sup: m.sup, n };
const U45 = C.solve(C.build(m45), F);
t('member direction does not change the result (beam along 45°)', near(C.elForces(els45[n / 2], U45).M1, w * L * L / 8, 1e-9));

// 2. full grillage of Case Study 01
const p = C.CASES.cs01.p, g = C.geometry(p), sc = C.sections(p, g), M = C.mesh(p, g, sc), SS = C.build(M);
const Fs = C.sdlLoads(p, M, g), Us = C.solve(SS, Fs), RS = C.responses(M), r = C.evalResponses(M, RS, Us);
const Rsum = M.sup.reduce((s, _, q) => s + r[RS.idx['Rb:' + q]], 0), Fsum = -Array.from(Fs).filter((_, i) => i % 3 === 0).reduce((a, b) => a + b, 0);
t('grillage equilibrium: bearing reactions = applied SDL', near(Rsum, Fsum, 1e-8), Rsum.toFixed(2) + ' kN');
const tot = M.els.filter(e => e.type === 'girder' && e.j === M.n / 2 - 1).reduce((s, e) => s + C.elForces(e, Us).M2, 0);
const Ltot = g.spans[0].L, wtot = Fsum / Ltot;
t('grillage statics: sum of girder moments at mid-span = total load x L²/8 (straight deck)', p.skew !== 0 || near(tot, wtot * Ltot * Ltot / 8, 1e-6), tot.toFixed(1));
const p0 = Object.assign(C.deep(p), { skew: 0 }), g0 = C.geometry(p0), M0 = C.mesh(p0, g0, C.sections(p0, g0)), S0 = C.build(M0), F0 = C.sdlLoads(p0, M0, g0), U0 = C.solve(S0, F0);
const tot0 = M0.els.filter(e => e.type === 'girder' && e.j === M0.n / 2 - 1).reduce((s, e) => s + C.elForces(e, U0).M2, 0), w0 = -Array.from(F0).filter((_, i) => i % 3 === 0).reduce((a, b) => a + b, 0) / g0.spans[0].L;
t('grillage statics, square deck: sum of mid-span girder moments = wL²/8', near(tot0, w0 * g0.spans[0].L ** 2 / 8, 1e-6), tot0.toFixed(1) + ' vs ' + (w0 * g0.spans[0].L ** 2 / 8).toFixed(1));
const IM = C.influence(M0, S0, C.responses(M0)), RS0 = C.responses(M0);
let maxd = 0; for (let q = 0; q < 6; q++) { const nn = (q * 37) % M0.nodes.length, Fq = new Float64Array(S0.nd); Fq[3 * nn] = -1; const rr = C.evalResponses(M0, RS0, C.solve(S0, Fq)); rr.forEach((v, k) => maxd = Math.max(maxd, Math.abs(v - IM[nn][k]))); }
t('influence matrix row = direct solve of a unit load', maxd < 1e-9);
// Maxwell reciprocity: deflection at a due to load at b = deflection at b due to load at a
const a = 10, b = 50; t('reciprocity of deflections (Maxwell)', near(IM[a][RS0.idx['w:' + b]], IM[b][RS0.idx['w:' + a]], 1e-9));

// 3. moving-load port against the platform's Python lane_effect on the same synthetic influence lines
const py = JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'fake_lane.py')], { cwd: path.join(__dirname, '..', '..') }).toString());
const fake = { nr: 5, line: (o, grid) => grid.map(x => Float64Array.from([0, 1, 2, 3, 4], rr => Math.sin(0.3 * x * (rr + 1) + o * (rr + 2)) * Math.exp(-0.01 * x))) };
const grid = Array.from({ length: 160 }, (_, i) => i * 0.25);
const js = [-5.0, -1.8, 1.4].map(a0 => C.laneEffect(fake, grid, 0.25, C.STD.M1600, a0, 3.2));
let dmax = 0; js.forEach((e, l) => [0, 1].forEach(s => e[s].forEach((v, k) => dmax = Math.max(dmax, Math.abs(v - py.lanes[l][s][k])))));
t('lane_effect port equals the Python engine (UDL + vehicle, both directions, lateral shifts)', dmax < 1e-9, dmax.toExponential(2));
const cj = C.combineLanes(js, C.STD.ALF); let dc = 0; [0, 1].forEach(s => cj[s].forEach((v, k) => dc = Math.max(dc, Math.abs(v - py.comb[s][k]))));
t('combine_lanes port equals the Python engine (accompanying lane factors)', dc < 1e-9);
// 4. traffic envelope on Case 01 runs and gives positive mid-span moments in every girder
const IMc = C.influence(M, SS, RS), env = C.trafficEnvelope(M, g, IMc, C.STD.M1600, {}, RS);
const mids = [...Array(g.ng).keys()].map(i => env.max[RS.idx['M:0:' + i + ':' + (M.n / 2 - 1) + ':b']]);
t('M1600 envelope: every girder has a positive mid-span moment; ' + env.lanes + ' lanes, ' + env.layouts + ' layouts', mids.every(v => v > 0), mids.map(v => v.toFixed(0)).join(' '));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
