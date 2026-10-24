// Read a .mct with the dashboard's own MIDAS-text parser (AN.parseMCT) and report what it understood: counts, warnings,
// total self weight (density x weight area x length) and the section table. Independent reading of the syntax (V5);
// NOT a MIDAS import.   node tools/check_mct_dashboard.js file.mct > out.json
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
const txt = fs.readFileSync(process.argv[2], 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); await p.goto('file://' + DASH); await p.waitForTimeout(1500);
  const d = await p.evaluate((t) => {
    const M = AN.parseMCT(t); let W = 0;
    M.els.forEach(e => { const a = M.nodes[e.n1], c = M.nodes[e.n2], L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
      W += M.mats[e.mat].w * M.secs[e.sec].wA * L; });
    return { nodes: Object.keys(M.nodes).length, els: M.els.length, mats: Object.keys(M.mats).length, secs: Object.keys(M.secs).length,
             links: (M.links || []).length, cons: M.cons.map(c => ({ n: c.nodes.length, f: c.f.join('') })), gravity: M.gravity, warn: M.warn,
             weight: W, sections: M.secs, links_k: (M.links || []).map(l => ({ n1: l.n1, n2: l.n2, beta: l.beta, k: l.k, dry: l.dry, drz: l.drz })) };
  }, txt);
  await b.close();
  process.stdout.write(JSON.stringify(d) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
