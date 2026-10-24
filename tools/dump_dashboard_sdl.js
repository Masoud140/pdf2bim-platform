// Dump the dashboard's superimposed dead load case (Design -> Combined actions, rxSDL: surfacing over the carriageway
// + barrier line loads, as nodal loads on the integrated analysis model) as a cross-implementation reference (P3b, V5).
//   node tools/dump_dashboard_sdl.js > tests/model/fixtures/br13a_dashboard_sdl.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const s = rxSDL();
    const loads = Object.keys(s.L).map(n => [+n].concat(s.L[n]));
    return { loads, total: s.tot, barrier_w: s.wb, assumed_barrier: s.assumedBar, gamma: LD.gamma, t_surf: (LD.tsurf === null ? P.surf : LD.tsurf),
             carriageway: [P.cwL, P.cwR], edges: [P.edgeL, P.edgeR] };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) SDL case (rxSDL) as nodal loads on the Analysis-tab model. Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
