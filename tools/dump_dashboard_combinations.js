// Dump the dashboard's AS 5100.2 combinations (Combos tab genAll) and its combined actions (Design -> Combined actions,
// rxRun: rxPrim primitives + rxCombine envelopes). Cross-implementation reference (P3c, V5).
//   node tools/dump_dashboard_combinations.js > tests/model/fixtures/br13a_dashboard_combinations.json
// rows: the generated rows for the dashboard defaults with tm 's' (as rxCombine) and for option variants;
// rx: primitive vectors (static {s} or envelope {max,min}) per register id, the ULS / SLS envelopes and governing rows,
// and the response definitions (bearing link quantities; pile element-end quantities) needed to map them.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const DASH = process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); p.setDefaultTimeout(0);
  await p.goto('file://' + DASH); await p.waitForTimeout(2000);
  const rows = await p.evaluate(() => {
    const base = Object.assign(CBX.opt(), { tm: 's' }), out = {};
    const variants = { default: {}, pm_m: { pm: 'm' }, wm_v: { wm: 'v' }, wm_a: { wm: 'a' }, k_custom: { k1: 0.6, k2: 0.4 }, no_pw: { pw: false } };
    Object.keys(variants).forEach(k => { const o = Object.assign({}, base, variants[k]); const G = CBX.genAll(o); out[k] = { opt: o, capped: G.capped, rows: G.rows.map(r => [r.name, r.ls, r.col, r.type, r.pe, r.t]) }; });
    // other register selections (every generator path): the switch state is restored afterwards
    const save = CBX.R.map(r => r.on), sets = {
      all_but_SDLr: { ids: CBX.R.map(r => r.id).filter(i => i !== 'SDLr'), opt: { cap: 3000 } },
      rail_flood: { ids: ['DLc', 'SDLp', 'BAL', 'LA300', 'BRKT', 'NOS', 'CENT', 'FLH', 'FLVU', 'BUOY', 'WX', 'WY', 'TUW', 'TGP'], opt: { td: true } },
      collision_barrier: { ids: ['DLc', 'DLs', 'PS', 'SDLp', 'GW', 'M1600', 'HLP', 'A160', 'CENR', 'PED', 'MRLH', 'MRLV', 'COLX', 'COLY', 'COLS', 'BAR', 'PBAR', 'EQX', 'WZ', 'TUC'], opt: { pm: 'm', wm: 'v' } } };
    Object.keys(sets).forEach(k => { CBX.R.forEach(r => { r.on = sets[k].ids.includes(r.id) ? 1 : 0; }); const o = Object.assign({}, base, sets[k].opt), G = CBX.genAll(o);
      out[k] = { opt: o, on: sets[k].ids, capped: G.capped, rows: G.rows.map(r => [r.name, r.ls, r.col, r.type, r.pe, r.t]) }; });
    CBX.R.forEach((r, i) => { r.on = save[i]; });
    CBX.genAll(base);
    out.register = CBX.R.map(r => ({ id: r.id, g: r.g, u: r.u, b: r.b, s: r.s, on: r.on }));
    return out;
  });
  const rx = await p.evaluate(() => new Promise((res, rej) => {
    try { rxRun(() => {
      const R = RX.res, Q = RX.Q, a = v => Array.from(v, x => (isFinite(x) ? x : null));
      const Pm = {}; Object.keys(R.Pm).forEach(k => { const e = R.Pm[k].e; Pm[k] = e.s ? { s: a(e.s) } : { max: a(e.max), min: a(e.min) }; });
      const C = {}; ['ULS', 'SLS'].forEach(ls => { const O = R.C.out[ls]; C[ls] = { max: a(O.max), min: a(O.min), gmax: O.gmax, gmin: O.gmin, n: O.n }; });
      const M = AN.parseMCT(document.getElementById('an_mct_src').textContent);
      const q = Q.map(x => x.k === 'B' ? { k: 'B', t: x.t, id: x.id, ab: x.ab, n2: M.nodes[x.lk.n2], n1: M.nodes[x.lk.n1] }
        : x.k === 'P' ? { k: 'P', t: x.t, id: x.id, end: x.end, pile: x.pile, ab: x.ab, z: x.z, u: x.u, n: x.n }
        : (() => { const e = M.els.find(q => q.id === x.id) || {}; return { k: x.k, t: x.t, id: x.id, end: x.end, ab: x.ab, s: x.s, sec: e.sec !== undefined ? (M.secs[e.sec] || {}).name : null, n1: M.nodes[e.n1], n2: M.nodes[e.n2] }; })());
      res({ Pm, C, Q: q, tr: R.tr, trErr: R.trErr, miss: R.C.miss, byLs: R.C.byLs, secs: R.secs, V: WD.V, V35: RX.V35, Vs: RX.Vs });
    }); } catch (e) { rej(e); }
  }));
  await b.close();
  if (process.env.RAW) { process.stdout.write(JSON.stringify({ rows, rx }) + '\n'); return; }
  // compact form for the repository: each row set as a SHA-256 of its canonical text (one line per row:
  // name|ls|col|type|pe|id:factor(4 dp),...), counts per limit state / clause, and the first and last rows
  const canon = R => R.map(r => [r[0], r[1], r[2], r[3], r[4], r[5].map(t => t[0] + ':' + t[1].toFixed(4)).join(',')].join('|')).join('\n');
  const sets = {}; Object.keys(rows).filter(k => k !== 'register').forEach(k => { const v = rows[k], c = {};
    v.rows.forEach(r => { c[r[1] + ' ' + r[2]] = (c[r[1] + ' ' + r[2]] || 0) + 1; });
    sets[k] = { opt: v.opt, on: v.on || null, capped: v.capped, n: v.rows.length, counts: c, sha256: crypto.createHash('sha256').update(canon(v.rows)).digest('hex'),
                head: v.rows.slice(0, 3), tail: v.rows.slice(-2) }; });
  // response subset: every bearing, pile, girder (G) and headstock (H) quantity for the envelopes; primitives for the bearings and
  // two piles only (enough for the arithmetic check of the combination step)
  const keepC = rx.Q.map((q, i) => (q.k === 'B' || q.k === 'P' || q.k === 'G' || q.k === 'H') ? i : -1).filter(i => i >= 0);
  const keepP = rx.Q.map((q, i) => (q.k === 'B' || (q.k === 'P' && (q.pile === 'A1' || q.pile === 'B4'))) ? i : -1).filter(i => i >= 0);
  const pick = (v, ix) => ix.map(i => v[i]);
  const Pm = {}; Object.keys(rx.Pm).forEach(k => { const e = rx.Pm[k]; Pm[k] = e.s ? { s: pick(e.s, keepP) } : { max: pick(e.max, keepP), min: pick(e.min, keepP) }; });
  const C = {}, CP = {}; ['ULS', 'SLS'].forEach(ls => { const O = rx.C[ls]; C[ls] = { n: O.n, max: pick(O.max, keepC), min: pick(O.min, keepC), gmax: pick(O.gmax, keepC), gmin: pick(O.gmin, keepC) };
    CP[ls] = { max: pick(O.max, keepP), min: pick(O.min, keepP), gmax: pick(O.gmax, keepP), gmin: pick(O.gmin, keepP) }; });
  process.stdout.write(JSON.stringify({ note: 'Dashboard (v45) AS 5100.2 combinations (genAll) and combined actions (rxRun), compact. Cross-implementation reference only.',
    dashboard_sha256: crypto.createHash('sha256').update(fs.readFileSync(DASH)).digest('hex'), captured: new Date().toISOString(),
    register: rows.register, sets, rx: { Q: pick(rx.Q, keepC), qP: keepP.map(i => keepC.indexOf(i)), Pm, C, C_on_P: CP, tr: rx.tr, trErr: rx.trErr, miss: rx.miss, byLs: rx.byLs, V: rx.V, V35: rx.V35, Vs: rx.Vs } }) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
