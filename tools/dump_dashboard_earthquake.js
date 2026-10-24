// Dump the dashboard's earthquake RSA (eqRun): periods, effective masses, its lumped SDL masses (node, t), directions,
// and the summarised responses (bearings, piles, springs) per direction and per 100/30 combination. Cross-implementation
// reference (P3c, V5).   node tools/dump_dashboard_earthquake.js > tests/model/fixtures/br13a_dashboard_earthquake.json
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const d = await p.evaluate(() => {
    const R = eqRun(), E = EQ._E, M = E.M, L = {}; (M.links || []).forEach(l => { L['L' + l.id] = l; });
    // the dashboard's lumped SDL mass, recomputed with its own formula (eqModel)
    const G = E.G, gam = (typeof LD !== 'undefined' && LD.gamma) || 22, ts = (typeof LD !== 'undefined' && LD.tsurf) ? (LD.tsurf > 1 ? LD.tsurf / 1000 : LD.tsurf) : G.ts,
      cw = trCW(), wbar = (typeof LD !== 'undefined' && LD.wbar) ? LD.wbar : EQ.wbar, wSDL = gam * ts * cw.b + 2 * wbar, nG = G.lines.length, md = {};
    G.lines.forEach(l => { l.p.forEach((q, i) => { const a = i > 0 ? (q.c - l.p[i - 1].c) / 2 : 0, bb = i < l.p.length - 1 ? (l.p[i + 1].c - q.c) / 2 : 0; md[q.id] = (md[q.id] || 0) + wSDL * (a + bb) / nG / AN.G; }); });
    const sum = v => { const s = eqSum(R.Q, v); s.brg.forEach(x => { x.n2 = L[x.id] ? M.nodes[L[x.id].n2] : null; }); return s; };
    const resp = {}; Object.keys(R.resp).forEach(k => { resp[k] = sum(R.resp[k].R); resp[k].meff = R.resp[k].meff; });
    const combos = {}; R.combos.forEach(c => { combos[c.id] = sum(c.R); });
    return { modes: R.modes, dirs: R.E.dirs, mtot: R.E.mtot, mSDL: R.E.mSDL, mStr: R.E.mStr, wSDL: R.E.wSDL, sdl_mass: Object.keys(md).map(k => [+k, md[k]]),
             resp, combos, EQ: { kp: EQ.kp, Z: EQ.Z, site: EQ.site, Rf: EQ.Rf, zeta: EQ.zeta, nModes: EQ.nModes, vert: EQ.vert }, G: AN.G };
  });
  await b.close();
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) earthquake RSA (eqRun). Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...d }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
