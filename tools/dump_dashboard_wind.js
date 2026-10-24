// Dump the dashboard's wind load cases (wdCases: transverse on structure / vehicles, vertical up / down, longitudinal)
// as nodal loads on its integrated model, with its intermediate values. Cross-implementation reference (P3c, V5).
//   node tools/dump_dashboard_wind.js > tests/model/fixtures/br13a_dashboard_wind.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const G = wdGeom(), C = wdCases(G), cases = {};
    C.list.forEach(c => { cases[c.id] = Object.keys(c.L).map(n => [+n].concat(c.L[n])); });
    return { cases, wT: C.wT, wV: C.wV, wL: C.wL, dExp: C.dExp, eSup: C.eSup, eVeh: C.eVeh, q: C.q, b: G.b, oc: G.oc, nLines: G.lines.length,
             WD: { V: WD.V, rho: WD.rho, Cd: WD.Cd, hBar: WD.hBar, CL: WD.CL, eL: WD.eL, fLon: WD.fLon, wVeh: WD.wVeh, hVeh: WD.hVeh } };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) wind cases (wdCases) as nodal loads. Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
