// P0.1 baseline regression snapshot of the BR13A dashboard.
// Runs the built dashboard headless, captures key outputs with a run record, writes JSON.
//
//   node tools/baseline_snapshot.js [--out file.json] [--dash file.html]
//
// Needs Playwright (NODE_PATH or a local install) and Chromium (CHROMIUM env, default /opt/pw-browsers/chromium).
// Every quantity carries status "indicative" (reproducible, NOT verified as correct) with the reasons.
// The "checks" list holds numerical consistency checks evaluated in this run (pass/fail).
// Reproducibility is a property of the software, not evidence that the engineering results are right.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DASH = path.resolve(arg('--dash', process.env.DASH || path.join(ROOT, 'dist/BR13A_grillage_dashboard.html')));
const OUT = path.resolve(arg('--out', path.join(ROOT, 'baseline/BR13A/snapshot.json')));
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git = c => { try { return cp.execSync('git ' + c, { cwd: ROOT }).toString().trim(); } catch (e) { return null; } };

// Reasons used for the status of quantities (ids refer to docs/CURRENT_STATUS.md)
const WHY = {
  model: 'integrated model not independently verified (no independent MIDAS model, G-1)',
  frozen: 'frozen BR13A .mct, flared flange widths not in model stiffness (E-2, D-2)',
  mesh: 'mesh on offset curves, not straight chords (C-2)',
  geom: 'geometry not yet independently checked against the 4 P1 validation cases',
  soil: 'soil / rock springs from Assumed inputs',
  assumed: 'load case built from Assumed inputs',
  std: 'standard values not yet verified against authorised copies (ADR-009)',
  approx: 'combination approximations: separate M/V/T traffic envelopes, unsigned earthquake (F-1)',
  ped: 'pedestrian load missing (taken as 0)',
  strands: 'strands and bars are placeholders (TfNSW T4 layout, D-1)',
  engine: 'design engine neutral-axis discrepancy vs worked example (E-1)',
  sect: 'section properties not checked against an independent calculation in this run',
};

(async () => {
  const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
  const b = await chromium.launch({ executablePath: exe });
  const page = await (await b.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('page: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|net::|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  const t0 = Date.now();
  await page.goto('file://' + DASH); await page.waitForTimeout(2000);

  // ---------- inputs and settings ----------
  const inputs = await page.evaluate(() => {
    const mct = document.getElementById('an_mct_src').textContent;
    return { P: JSON.parse(JSON.stringify(P)), cbx_opt: JSON.parse(JSON.stringify(CBX.opt())), mct_len: mct.length, mct };
  });
  const mctSha = crypto.createHash('sha256').update(inputs.mct).digest('hex'); delete inputs.mct;

  // ---------- geometry, model sections, pile stiffness ----------
  const g1 = await page.evaluate(() => {
    const Z = gwGeom(), M = AN.parseMCT(document.getElementById('an_mct_src').textContent);
    const secs = {}; for (const id in M.secs) { const s = M.secs[id]; if (/^G\d/.test(s.name)) secs[s.name] = { A: s.A, Iy: s.Iy, Iz: s.Iz, J: s.J, Asy: s.Asy, Asz: s.Asz }; }
    const elGirder = {}; M.els.forEach(e => { const s = M.secs[e.sec]; const m = s && /^G(\d)/.exec(s.name); if (m) elGirder[e.id] = +m[1]; });
    return { G: Z.G.map(g => ({ k: g.k, o: g.o, L: g.Ltot, nodes: g.nodes })), secs, elGirder,
      model: { nodes: Object.keys(M.nodes).length, els: M.els.length, links: M.links.length, springs: M.springs.length, cons: M.cons.length },
      sub: SUBM.check() };
  });

  // ---------- self-weight analysis (Analysis tab, frozen grillage) ----------
  await page.click('#tg_an'); await page.click('#tb_pr'); await page.waitForTimeout(500);
  await page.waitForFunction(() => typeof ANS !== 'undefined' && ANS.res && !ANS.stale, null, { timeout: 180000 });
  const sw = await page.evaluate(G => {
    const r = ANS.res, idx = r.P.idx, U = r.S.U;
    return G.map(g => { const n = g.nodes[Math.floor(g.nodes.length / 2)]; const i = idx[n]; return { k: g.k, node: n, uz: U[i * 6 + 2] }; });
  }, g1.G.map(g => ({ k: g.k, nodes: g.nodes })));

  // ---------- modal (earthquake page engine) and uniform temperature ----------
  const eq = await page.evaluate(() => { const r = eqRun(); return { modes: r.modes.slice(0, 6).map(m => ({ T: m.T, L: m.eff.L, T_: m.eff.T, V: m.eff.V })), E: { mtot: r.E.mtot, mStr: r.E.mStr, mSDL: r.E.mSDL } }; });
  const tm = await page.evaluate(() => { tmRun(); return TM.res.res.map(r => ({ id: r.cs.id, hc: r.hc.map(q => ({ L: q.L, free: q.free, model: q.model })) })); });

  // ---------- combined actions (all cases x Combos rows) ----------
  await page.evaluate(() => showTab('rx')); await page.waitForTimeout(500); await page.click('#rx_run');
  await page.waitForFunction(() => /Done|Stopped/.test(document.getElementById('rx_st').textContent), null, { timeout: 900000 });
  const rx = await page.evaluate(elGirder => {
    const Q = RX.Q, R = RX.res, Pm = R.Pm, U = R.C.out.ULS, S = R.C.out.SLS;
    const cases = {}; for (const k in Pm) cases[k] = { tag: Pm[k].tag, src: Pm[k].src };
    const v = (e, i) => e.s ? [e.s[i]] : [e.max[i], e.min[i]];
    const brg = [], gir = {}, pile = {}, hs = {};
    Q.forEach((q, i) => {
      if (q.k === 'B') brg.push({ nm: q.nm, t: q.t, DLc: v(Pm.DLc.e, i)[0], SDLp: v(Pm.SDLp.e, i)[0], M1600: v(Pm.M1600.e, i), ULS: [U.max[i], U.min[i]], SLS: [S.max[i], S.min[i]] });
      else if (q.k === 'G') { const gk = 'G' + (elGirder[q.id] || '?') + ' ' + q.t; const o = gir[gk] || (gir[gk] = { DLc: [-1e99, 1e99], SDLp: [-1e99, 1e99], M1600: [-1e99, 1e99], ULS: [-1e99, 1e99], SLS: [-1e99, 1e99] });
        const up = (a, mx, mn) => { a[0] = Math.max(a[0], mx); a[1] = Math.min(a[1], mn); };
        up(o.DLc, Pm.DLc.e.s[i], Pm.DLc.e.s[i]); up(o.SDLp, Pm.SDLp.e.s[i], Pm.SDLp.e.s[i]); up(o.M1600, Pm.M1600.e.max[i], Pm.M1600.e.min[i]); up(o.ULS, U.max[i], U.min[i]); up(o.SLS, S.max[i], S.min[i]); }
      else if (q.k === 'P') { const pk = q.pile + ' ' + q.t; const o = pile[pk] || (pile[pk] = { ULS: [-1e99, 1e99] }); o.ULS[0] = Math.max(o.ULS[0], U.max[i]); o.ULS[1] = Math.min(o.ULS[1], U.min[i]); }
      else if (q.k === 'H') { const hk = q.ab + ' ' + q.t; const o = hs[hk] || (hs[hk] = { ULS: [-1e99, 1e99] }); o.ULS[0] = Math.max(o.ULS[0], U.max[i]); o.ULS[1] = Math.min(o.ULS[1], U.min[i]); }
    });
    let sdlB = 0; Q.forEach((q, i) => { if (q.k === 'B' && q.t === 'V') sdlB += Pm.SDLp.e.s[i]; });
    return { cases, brg, gir, pile, hs, sdlB, sdlApplied: RX.st._sdl.tot, miss: R.C.miss, capped: R.C.capped, rowsU: CBX.genAll(CBX.opt()).rows.length, status: document.getElementById('rx_st').textContent };
  }, g1.elGirder);

  // ---------- Super-T design (Design tab, stations along the girder) ----------
  await page.click('#tg_des'); await page.click('#tb_dg'); await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('dg_ex').click()); await page.click('#dg_fill');
  await page.waitForFunction(() => DG.gird && DG.gird.ver === DG.ver && !DG.girdBusy, null, { timeout: 600000 });
  const dg = await page.evaluate(() => {
    const pick = o => o ? { uS: o.uS, uST: o.uST, uB: o.uB, Mu: o.Mu, phiMu: o.phiMu, dn: o.dn, uL: o.sh && typeof o.sh.uL === 'number' ? o.sh.uL : null } : null;
    const I = DG.res.lc[0].B && DG.res.lc[0].B.I;
    return { sec: { name: DG.sec.name, D: DG.sec.P.D, tD: DG.sec.tD, Wd: DG.sec.Wd, A: I && I.A, I: I && I.I, yb: I && I.yb, nStrands: DG.sec.strands.filter(s => s.on !== false).length },
      lc: DG.res.lc.map((l, i) => ({ name: DG.lc[i].name, ...pick(l) })),
      st: DG.gird.st.map(r => ({ x: r.x, solid: r.solid, P: r.P, o: pick(r.o), cb: Object.fromEntries(Object.entries(r.cb || {}).map(([k, c]) => [k, pick(c.o)])) })) };
  });
  const secs = ((Date.now() - t0) / 1000);
  const chromeVer = b.version();
  await b.close();

  // ---------- assemble quantities ----------
  const Qs = [];
  const add = (id, value, unit, why) => Qs.push({ id, value: (typeof value === 'number' && isFinite(value)) ? +value.toPrecision(12) : value, unit, status: 'indicative', reasons: why.map(k => WHY[k] || k) });
  g1.G.forEach(g => { add(`geom.G${g.k}.chord_length`, g.L, 'm', ['geom', 'mesh']); add(`geom.G${g.k}.offset`, g.o, 'm', ['geom']); });
  for (const n in g1.secs) for (const p of ['A', 'Iy', 'Iz', 'J', 'Asy', 'Asz']) add(`model.section.${n}.${p}`, g1.secs[n][p], p === 'A' || p.startsWith('As') ? 'm2' : 'm4', ['frozen', 'sect']);
  for (const p of ['D', 'tD', 'Wd', 'A', 'I', 'yb', 'nStrands']) add(`design.section.${p}`, dg.sec[p], { D: 'mm', tD: 'mm', Wd: 'mm', A: 'mm2', I: 'mm4', yb: 'mm', nStrands: '-' }[p], ['sect', p === 'nStrands' ? 'strands' : 'sect']);
  add('pile.head_stiffness.model', g1.sub.model, 'kN/m', ['soil']); add('pile.head_stiffness.hand', g1.sub.hand, 'kN/m', ['soil']);
  sw.forEach(s => add(`selfweight.G${s.k}.midspan_uz`, s.uz, 'm', ['frozen', 'model']));
  eq.modes.forEach((m, i) => { add(`modal.mode${i + 1}.T`, m.T, 's', ['model', 'soil', 'assumed']); for (const d of ['L', 'T_', 'V']) add(`modal.mode${i + 1}.meff_${d.replace('_', '')}`, m[d], '-', ['model']); });
  add('modal.mass_total_L', eq.E.mtot.L, 't', ['model']);
  tm.forEach(c => c.hc.forEach((h, j) => add(`temp.${c.id}.G${j + 1}.elongation_model`, h.model, 'mm', ['model', 'assumed'])));
  const caseWhy = k => { const t = rx.cases[k] && rx.cases[k].tag; return ['model', t === 'A' ? 'assumed' : t === 'S' ? 'std' : 'model']; };
  rx.brg.forEach(r => { const id = `brg.${r.nm.replace(' ', '_')}.${r.t}`; add(id + '.DLc', r.DLc, 'kN|mm', caseWhy('DLc')); add(id + '.SDLp', r.SDLp, 'kN|mm', caseWhy('SDLp'));
    add(id + '.M1600.max', r.M1600[0], 'kN|mm', caseWhy('M1600')); add(id + '.M1600.min', r.M1600[1], 'kN|mm', caseWhy('M1600'));
    for (const L of ['ULS', 'SLS']) { add(`${id}.${L}.max`, r[L][0], 'kN|mm', ['model', 'assumed', 'std', 'approx', 'ped']); add(`${id}.${L}.min`, r[L][1], 'kN|mm', ['model', 'assumed', 'std', 'approx', 'ped']); } });
  for (const k in rx.gir) { const o = rx.gir[k], id = 'girder.' + k.replace(' ', '.');
    for (const c of ['DLc', 'SDLp', 'M1600', 'ULS', 'SLS']) { const w = c === 'ULS' || c === 'SLS' ? ['model', 'assumed', 'std', 'approx', 'ped', 'frozen'] : caseWhy(c).concat('frozen'); add(`${id}.${c}.max`, o[c][0], 'kN|kNm', w); add(`${id}.${c}.min`, o[c][1], 'kN|kNm', w); } }
  for (const k in rx.pile) { add(`pile.${k.replace(' ', '.')}.ULS.max`, rx.pile[k].ULS[0], 'kN|kNm', ['model', 'soil', 'assumed', 'std', 'approx', 'ped']); add(`pile.${k.replace(' ', '.')}.ULS.min`, rx.pile[k].ULS[1], 'kN|kNm', ['model', 'soil', 'assumed', 'std', 'approx', 'ped']); }
  for (const k in rx.hs) { add(`headstock.${k.replace(' ', '.')}.ULS.max`, rx.hs[k].ULS[0], 'kN|kNm', ['model', 'assumed', 'std', 'approx', 'ped']); add(`headstock.${k.replace(' ', '.')}.ULS.min`, rx.hs[k].ULS[1], 'kN|kNm', ['model', 'assumed', 'std', 'approx', 'ped']); }
  add('combos.rows', rx.rowsU, '-', ['std']);
  const dWhy = ['strands', 'engine', 'std', 'assumed', 'approx', 'frozen'];
  dg.lc.forEach(l => { for (const p of ['uS', 'uST', 'uB', 'uL', 'Mu', 'phiMu', 'dn']) if (l[p] != null) add(`design.${l.name.split(' ')[0]}.${p}`, l[p], { Mu: 'kNm', phiMu: 'kNm', dn: 'mm' }[p] || '-', dWhy); });
  dg.st.forEach((r, i) => { const s = 'design.station' + String(i).padStart(2, '0');
    add(s + '.x', r.x, 'm', ['geom']); add(s + '.P', r.P, 'kN', ['strands']);
    const all = [r.o].concat(Object.values(r.cb)).filter(Boolean);
    for (const p of ['uS', 'uB', 'uL']) { const vals = all.map(o => o[p]).filter(v => typeof v === 'number'); if (vals.length) add(`${s}.${p}.max`, Math.max(...vals), '-', dWhy); } });

  // ---------- consistency checks (evaluated now; they test the software, not the inputs) ----------
  const checks = [];
  const chk = (id, desc, value, limit, pass, basis) => checks.push({ id, description: desc, value: +(+value).toPrecision(6), limit, pass: !!pass, basis });
  const eqr = Math.abs(rx.sdlB - rx.sdlApplied) / Math.abs(rx.sdlApplied);
  chk('chk.equilibrium.SDL', 'Sum of SDL vertical bearing reactions vs applied SDL total (superstructure)', eqr, 'relative residual <= 0.001', eqr <= 0.001, 'statics');
  const kr = g1.sub.model / g1.sub.hand - 1;
  chk('chk.pile_stiffness', 'Pile head lateral stiffness: discretised model vs Hetenyi beam-on-elastic-foundation hand value', kr, '|ratio-1| <= 0.05 (provisional)', Math.abs(kr) <= 0.05, 'closed form');
  tm.forEach(c => c.hc.forEach((h, j) => { const r = h.model / h.free - 1; chk(`chk.temp.${c.id}.G${j + 1}`, 'Girder elongation under uniform temperature: model vs free alpha*dT*L', r, '|ratio-1| <= 0.01 (free longitudinal bearing at one end)', Math.abs(r) <= 0.01, 'closed form'); }));
  const mr = eq.E.mtot.L / (eq.E.mStr + eq.E.mSDL) - 1;
  chk('chk.modal_mass', 'Modal analysis total mass vs structure + SDL mass', mr, '|ratio-1| <= 1e-6', Math.abs(mr) <= 1e-6, 'bookkeeping');
  const jsErr = errs.filter(e => e.startsWith('page:')), svgErr = errs.filter(e => /attribute .*Expected (length|number)/.test(e)), otherErr = errs.filter(e => !e.startsWith('page:') && !/attribute .*Expected (length|number)/.test(e));
  chk('chk.no_js_exceptions', 'No uncaught JavaScript exceptions during the run', jsErr.length, '= 0', jsErr.length === 0, 'software');
  chk('chk.no_console_errors', 'No other console errors during the run', otherErr.length, '= 0', otherErr.length === 0, 'software');
  chk('chk.no_svg_nan', 'No SVG elements drawn with NaN / Infinity coordinates (plot defect, known issue H-2)', svgErr.length, '= 0', svgErr.length === 0, 'software');
  chk('chk.combination_complete', 'Combined actions run finished, not capped', rx.capped ? 1 : 0, 'Done and not capped', /Done/.test(rx.status) && !rx.capped, 'software');

  const limitations = [
    'All quantities are INDICATIVE: reproducible outputs of the current software, not verified engineering results.',
    'Combination: missing load cases reported by the engine: ' + JSON.stringify(rx.miss) + ' (pedestrian load taken as 0).',
    'Load case tags (C Calculated, A Assumed-input, S Standard): ' + Object.entries(rx.cases).map(([k, c]) => k + ':' + c.tag).join(' '),
    'Self-weight displacements come from the Analysis tab (frozen grillage .mct, gravity), not from the integrated substructure model.',
    'Design results use the TfNSW T4 standard strand/bar layout as a placeholder (D-1).',
  ];

  const bridge = path.join(ROOT, 'projects/BR13A/BR13A.bridge.json'), dec = path.join(ROOT, 'projects/BR13A/BR13A.decisions.jsonl');
  const snap = {
    format: 'pdf2bim.baseline/0.1',
    bridge: 'BR13A',
    run: {
      created: new Date().toISOString(), duration_s: +secs.toFixed(1),
      git: { commit: git('rev-parse HEAD'), branch: git('rev-parse --abbrev-ref HEAD'), dirty: !!git('status --porcelain --untracked-files=no') },
      dashboard: { file: path.relative(ROOT, DASH), sha256: sha(DASH) },
      inputs: { embedded_mct_sha256: mctSha, embedded_mct_chars: inputs.mct_len,
        bridge_description_sha256: fs.existsSync(bridge) ? sha(bridge) : null, decision_log_sha256: fs.existsSync(dec) ? sha(dec) : null,
        note: 'The dashboard runs on its embedded data (P parameters + frozen .mct). The bridge description is recorded for traceability but is NOT read by the dashboard (B-1).' },
      settings: { combination_options: inputs.cbx_opt, dashboard_parameters: inputs.P, model_size: g1.model },
      environment: { node: process.version, playwright: require('playwright/package.json').version, chromium: chromeVer },
      command: 'node tools/baseline_snapshot.js --out ' + path.relative(ROOT, OUT),
    },
    page_errors: errs,
    checks,
    limitations,
    quantities: Qs,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snap, null, 1) + '\n');
  console.log(`snapshot: ${Qs.length} quantities, ${checks.filter(c => c.pass).length}/${checks.length} checks pass, ${errs.length} page errors, ${secs.toFixed(0)} s -> ${path.relative(ROOT, OUT)}`);
  checks.filter(c => !c.pass).forEach(c => console.log('CHECK FAIL', c.id, c.value, c.limit));
})().catch(e => { console.error(e); process.exit(2); });
