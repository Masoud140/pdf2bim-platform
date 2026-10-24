// Dump the dashboard's girder geometry (model-local MCT coordinates) as a cross-implementation reference for P1.
//   node tools/dump_dashboard_geometry.js > tests/geometry/fixtures/br13a_dashboard_geometry.json
// Source: gwGeom() of the built dashboard (girder node lines of the frozen .mct, bearing link nodes), plus the
// deck edge lines. Coordinates are MCT local (m); the documented MCT base point converts them to MGA.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const g = await p.evaluate(() => { const Z = gwGeom(), M = AN.parseMCT(document.getElementById('an_mct_src').textContent);
    return { girders: Z.G.map(q => ({ k: q.k, offset: q.o, path_length: q.Ltot, sA: q.sA, sB: q.sB, PA: q.PA, PB: q.PB, nodes: q.nodes.map(n => M.nodes[n]) })),
             edge_left: Z.eL ? Z.eL.p : null, edge_right: Z.eR ? Z.eR.p : null,
             links: M.links.map(l => ({ group: l.group, n1: M.nodes[l.n1], n2: M.nodes[l.n2] })) }; });
  await b.close();
  const out = { note: 'Dashboard (v45) girder geometry in MCT local coordinates, for P1 cross-implementation comparison. NOT an independent benchmark.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(), ...g };
  process.stdout.write(JSON.stringify(out, null, 1) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
