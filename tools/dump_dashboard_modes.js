// Dump the dashboard's natural modes of its integrated Analysis-tab model (AN.modal: consistent mass of the members only,
// no SDL mass, subspace iteration) as a cross-implementation reference for the Python modal solver (P3b, V5).
//   node tools/dump_dashboard_modes.js > tests/model/fixtures/br13a_dashboard_modes.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const M = AN.parseMCT(document.getElementById('an_mct_src').textContent), P = AN.prepare(M, { shear: true }), K = AN.assembleK(P);
    AN.cholesky(K, P.nf);
    const modes = AN.modal(P, K, 8, 200);
    return { n_free: P.nf, modes: modes.map(m => ({ T: m.T, f: m.f, eff: m.eff })) };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) AN.modal of the Analysis-tab model, member mass only (no SDL). Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
