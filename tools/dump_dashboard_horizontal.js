// Dump the dashboard's horizontal load cases (earth pressure, traffic surcharge, braking, centrifugal; slRun) on its
// integrated model: totals, bearing forces, pile results, spring sums, retained heights. Cross-implementation reference (P3c, V5).
//   node tools/dump_dashboard_horizontal.js > tests/model/fixtures/br13a_dashboard_horizontal.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const R = slRun(), M = R.G.M, L = {}; (M.links || []).forEach(l => { L['L' + l.id] = l; });
    const cases = {};
    R.res.forEach(r => { cases[r.cs.id] = { tot: r.tot, sprX: r.sprX, sprY: r.sprY,
      brg: r.brg.map(q => ({ id: q.id, ab: q.ab, v: q.v, tr: q.tr, lon: q.lon, n2: L[q.id] ? M.nodes[L[q.id].n2] : null })),
      piles: r.piles.map(x => ({ id: x.id, ab: x.ab, M: x.M, zM: x.zM, V: x.V, dx: x.dx })) }; });
    const g = {}; Object.keys(R.G.abs).forEach(a => { const o = R.G.abs[a]; g[a] = { H: o.H, Hc: o.Hc, len: o.len, n: o.n }; });
    return { cases, geom: g, parts: R.G.parts, SL: { gam: SL.gam, phi: SL.phi, kmode: SL.kmode, q: SL.q, hBrg: SL.hBrg, Fbr: SL.Fbr, V: SL.V, W: SL.W, Fc: SL.Fc, nDeck: SL.nDeck }, R: (typeof P !== 'undefined' ? P.R : null) };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) horizontal load cases (slRun). Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
