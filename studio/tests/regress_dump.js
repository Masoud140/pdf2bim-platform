// Dump every case study's analysis (all load cases x all responses) to JSON: `node tests/regress_dump.js out.json`.
// Used to prove an engine change leaves the vertical results unchanged (compare two dumps with regress_cmp below).
const fs = require('fs');
global.HOG = require('../engines/hog_engine.js'); global.SECLIB = require('../engines/seclib.js'); global.DSG = require('../engines/dsg_engine.js');
global.DSG2 = require('../engines/dsg_engine2.js');
global.CORE = require('../src/core.js'); const AN = require('../src/analysis.js'), C = global.CORE;
if (process.argv[3]) {   // compare: node regress_dump.js new.json old.json
  const a = JSON.parse(fs.readFileSync(process.argv[2])), b = JSON.parse(fs.readFileSync(process.argv[3])); let worst = 0, where = '', n = 0;
  for (const cs in b) for (const lc in b[cs]) for (const side of ['max', 'min']) for (const key in b[cs][lc][side]) { const x = (a[cs][lc] || {})[side] ? a[cs][lc][side][key] : NaN, y = b[cs][lc][side][key], d = Math.abs(x - y) / Math.max(1e-6, Math.abs(y), 1e-3 * b[cs][lc].scale); n++; if (!(d <= worst)) { worst = d; where = cs + ' ' + lc + ' ' + side + ' ' + key + ': ' + x + ' vs ' + y; } }
  console.log(n + ' values compared; worst relative difference ' + (worst).toExponential(2) + ' at ' + where); process.exit(worst < 1e-7 ? 0 : 1);
}
const out = {};
for (const cs of Object.keys(C.CASES)) { const p = C.CASES[cs].p, cases = C.CASES_DEF.map(c => Object.assign({}, c)), cb = C.generateCombos(cases), A = AN.run(p, cases, cb, () => {}); out[cs] = {};
  for (const lc in A.V) { const v0 = A.V[lc], v = v0.max ? v0 : { max: v0, min: v0 }, o = { max: {}, min: {}, scale: 0 }; A.RS.R.forEach((r, i) => { o.max[r.key] = v.max[i]; o.min[r.key] = v.min[i]; o.scale = Math.max(o.scale, Math.abs(v.max[i]), Math.abs(v.min[i])); }); out[cs][lc] = o; } }
fs.writeFileSync(process.argv[2], JSON.stringify(out)); console.log('wrote', process.argv[2], Object.keys(out).join(', '));
