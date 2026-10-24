// Run the dashboard's Traffic tab (influence surfaces + M1600 / S1600 envelope, default options) and dump the envelope
// of its responses, for a cross-implementation comparison (P3c, V5).  MODE=def (lanes packed from the left kerb, the
// dashboard default) or MODE=sweep.   MODE=sweep node tools/dump_dashboard_traffic.js > tests/model/fixtures/br13a_dashboard_traffic_sweep.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
const MODE = process.env.MODE || 'def';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  await p.click('#tg_an'); await p.waitForTimeout(300);
  await p.evaluate((mode) => { trBuild(); TR.mode = mode; TR.env = null; trRun(); }, MODE);
  await p.waitForFunction(() => typeof TR !== 'undefined' && TR.env && TR.env.env, null, { timeout: 600000, polling: 1000 });
  const d = await p.evaluate(() => {
    const S = TR.inf.S, M = ANS.res.P.M, out = {};
    TR.env.models.forEach(mn => { const E = TR.env.env[mn];
      out[mn] = S.R.map((r, i) => { const o = { t: r.t, max: E.max[i], min: E.min[i] };
        if (r.t === 'M' || r.t === 'V' || r.t === 'D') { o.g = r.g; o.s = r.s; }
        if (r.t === 'B') { const e = ANS.res.P.els[r.ix]; o.n2 = M.nodes[e.n2]; }
        return o; }).filter(o => o.t === 'M' || o.t === 'B' || o.t === 'D'); });
    return { mode: TR.mode, lays: TR.env.lays, opt: TR.env.opt, lf: trLF(), lanes: TR.n, models: TR.env.models, R: out };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) Traffic tab envelope (characteristic). Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
