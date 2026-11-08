// Engines extracted into the studio give the same results as the original grillage dashboard they came from.
const path = require('path'), fs = require('fs');
const H = require('../engines/hog_engine.js'), L = require('../engines/seclib.js'), D = require('../engines/dsg_engine.js');
let pass = 0, fail = 0; const t = (n, ok, info) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? '  [' + info + ']' : '')); };
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/hog_snap.json')));
const r = H.run(snap.p);
t('losses / hog engine: hog at mid-span at every reported time equals the dashboard (1e-9 mm)', Math.max(...r.res.map((q, i) => Math.abs(q.hog[r.mi] - snap.hogmid[i]))) < 1e-9);
t('losses / hog engine: transfer stresses at mid-span equal the dashboard', Math.abs(r.st[r.mi].top - snap.stmid.top) < 1e-9 && Math.abs(r.st[r.mi].bot - snap.stmid.bot) < 1e-9);
const q = L.secProps('1500 Super-T', 1790);
const P = q.P; let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += (a[0] * b[1] - b[0] * a[1]) / 2; }
t('section library: 1500 Super-T area from its outline (shoelace) equals secProps', Math.abs(A - q.A) < 1e-6, q.A.toFixed(0));
t('section library: wider top flange adds area', L.secProps('1500 Super-T', 2400).A > q.A);
t('section library: standard strand grid of the 1500 Super-T has 48 locations (dashboard grid)', L.grid('1500 Super-T').length === 48);
const S = D.stripsFromPolygon ? null : null;
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
