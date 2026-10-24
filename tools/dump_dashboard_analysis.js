// Dump the dashboard's prepared analysis model (Analysis tab, self weight) and its solved displacements, as a
// cross-implementation reference for the Python solver (P3, V5). Not an independent benchmark.
//   node tools/dump_dashboard_analysis.js > tests/model/fixtures/br13a_dashboard_selfweight.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  await p.click('#tg_an'); await p.click('#tb_pr'); await p.waitForTimeout(500);
  await p.waitForFunction(() => typeof ANS !== 'undefined' && ANS.res && !ANS.stale, null, { timeout: 180000 });
  const d = await p.evaluate(() => {
    const P = ANS.res.P, M = P.M, U = Array.from(ANS.res.S.U);
    const els = P.els.filter(e => !e.link).map(e => { const s = M.secs[e.sec], m = M.mats[e.mat];
      return { id: e.id, n1: e.n1, n2: e.n2, E: m.E, nu: m.nu, A: s.A, Iy: s.Iy, Iz: s.Iz, J: s.J, Asy: s.Asy, Asz: s.Asz, w: e.w, sec: s.name }; });
    const links = M.links.map(l => ({ id: l.id, n1: l.n1, n2: l.n2, beta: l.beta, k: l.k, dry: l.dry, drz: l.drz, group: l.group }));
    const fixed = []; for (let i = 0; i < P.ndof; i++) if (P.fixed[i]) fixed.push(i);
    return { nodes: P.ids.map(n => [n].concat(M.nodes[n])), els, links, spr: (P.spr || []).map(s => ({ n: s.n, k6: s.k6, k: s.k })),
             fixed_dofs: fixed, ids: P.ids, gravity: M.gravity, U, opt_shear: true };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) Analysis-tab model + self-weight displacements. Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
