// Dump the dashboard's Hog (prestress losses / camber) inputs p (LAST.p of the Hog Calculator for the current girder)
// and the results of its engine (base/... "//ENGINE" block: shrink, creep, relax, run, runDet) for the method as set and
// for both methods. The engine block is evaluated in Node from the source text (the Hog Calculator is a scoped IIFE).
// Cross-implementation reference (P4.5 stage 5).
//   node tools/dump_dashboard_hog.js > tests/design/fixtures/br13a_dashboard_hog.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
const BASE = path.join(ROOT, 'base/BR13A_grillage_dashboard_v15.html');
function engine() {
  const s = fs.readFileSync(BASE, 'utf8');
  const i = s.indexOf('//ENGINE'), j = s.indexOf('// ===================== Word (.docx) calculation report', i);
  const ccb = s.match(/const CCB=\[[^;]*\];/)[0], itp = s.match(/const interp=\(t,x\)=>\{[^\n]*\};/)[0];
  const ctx = {}; vm.createContext(ctx); vm.runInContext(ccb + '\n' + itp + '\n' + s.slice(i, j) + '\nthis.run=run;this.shrink=shrink;this.creep=creep;this.relax=relax;', ctx);
  return ctx;
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage(); await pg.goto('file://' + DASH); await pg.waitForTimeout(2500);
  const P = await pg.evaluate(() => { let s = HOG_API.snap(); if (!s.p) { HOG_API.calc(); s = HOG_API.snap(); }
    return { p: JSON.parse(JSON.stringify(s.p, (k, v) => (typeof v === 'number' && !isFinite(v)) ? 'Infinity:' + v : v)), mid_hog_browser: s.r.res.map(q => q.hog[s.r.mi]) }; });
  await b.close();
  const fix = o => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === 'string' && v.startsWith('Infinity:')) ? Number(v.slice(9)) : v);
  const p = fix(P.p), E = engine();
  const keep = r => ({ X: r.X, mi: r.mi, P0: r.P0, tcR: isFinite(r.tcR) ? r.tcR : null, sigo: r.sigo, k9: r.k9,
    st: r.st.map(q => ({ x: q.x, w: q.w, Pr: q.Pr, T: q.T, Mn: q.Mn, M: q.M, Md: q.Md, Ms: q.Ms })),
    res: r.res.map(q => ({ label: q.label, t: q.t, phi: q.phi, eps: q.eps === undefined ? null : q.eps, hog_mid: q.hog[r.mi], Pm: q.Pm || null })) });
  const runs = { as_set: keep(E.run(Object.assign({}, p))), simple: keep(E.run(Object.assign({}, p, { meth: 0 }))), detailed: keep(E.run(Object.assign({}, p, { meth: 1 }))),
                 simple_nodeck: keep(E.run(Object.assign({}, p, { meth: 0, fl: Object.assign({}, p.fl, { dk: 0 }) }))) };
  const mat = { shrink: [10, 30, 100, 1000, 10000].map(a => E.shrink(a, p).v), creep: [10, 30, 100, 1000, 10000].map(a => E.creep(a, p).v), relax: [0, 1, 10, 100, 1000, 10000].map(t => E.relax(p, t)) };
  const asSet = runs.as_set.res.map(q => q.hog_mid), sameBrowser = asSet.length === P.mid_hog_browser.length && asSet.every((v, k) => Math.abs(v - P.mid_hog_browser[k]) < 1e-9);
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) Hog engine inputs and results (engine block evaluated in Node; the as-set run is checked against the browser).',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(),
    node_equals_browser: sameBrowser, p, runs, mat }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
