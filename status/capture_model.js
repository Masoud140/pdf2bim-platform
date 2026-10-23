// Screenshot the real 3D model tab of the built BR13A application for the status dashboard.
//   node status/capture_model.js      -> status/model_3d.png + status/model_3d.json (build hash, time)
// Needs a built dist/ (./build.sh), Playwright (NODE_PATH) and Chromium (CHROMIUM, default /opt/pw-browsers/chromium).
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + DASH); await p.waitForTimeout(2500);
  await p.evaluate(() => showTab('v3d')); await p.waitForTimeout(3000);
  const c = await p.$('canvas'); if (!c) throw new Error('no 3D canvas found');
  await c.screenshot({ path: path.join(__dirname, 'model_3d.png') });
  fs.writeFileSync(path.join(__dirname, 'model_3d.json'), JSON.stringify({
    captured: new Date().toISOString(), source: 'application 3D model tab (v3d), default view',
    dashboard: path.relative(ROOT, DASH), dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), page_errors: errs.length }, null, 1) + '\n');
  console.log('status/model_3d.png captured; page errors', errs.length);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
