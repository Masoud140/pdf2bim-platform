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
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
