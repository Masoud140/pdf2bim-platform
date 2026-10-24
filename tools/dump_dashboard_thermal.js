// Dump the dashboard's imposed-strain cases on its integrated model: uniform temperature TU+ / TU- (tmRun), gradient
// TGP / TGN and shrinkage + creep shortening SCR (tgRun), with its free strain / curvature of the design section.
// Cross-implementation reference (P3c, V5).   node tools/dump_dashboard_thermal.js > tests/model/fixtures/br13a_dashboard_thermal.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const M = AN.parseMCT(document.getElementById('an_mct_src').textContent), L = {}; (M.links || []).forEach(l => { L['L' + l.id] = l; });
    const br = list => list.map(q => ({ id: q.id, ab: q.ab, v: q.v, tr: q.tr, lon: q.lon, dtr: q.dtr, dlon: q.dlon, n2: L[q.id] ? M.nodes[L[q.id].n2] : null }));
    const tm = tmRun(), tg = tgRun(), out = {};
    tm.res.forEach(r => { out[r.cs.id] = { dT: r.cs.dT, brg: br(r.brg), hc: r.hc, piles: r.piles.map(x => ({ id: x.id, M: x.M, V: x.V, dx: x.dx })), nHeat: r.nHeat }; });
    Object.keys(tg.res).forEach(k => { out[k] = { brg: br(tg.res[k].brg), zmax: tg.res[k].zmax }; });
    return { cases: out, free: tg.f, alpha: TM.alpha, T: { Tmax: TM.Tmax, Tmin: TM.Tmin, Tset: TM.Tset }, eps: TG.eps, temp: DG.temp };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) uniform temperature, gradient and shrinkage cases. Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
