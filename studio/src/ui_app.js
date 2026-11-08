/* ===== Bridge Studio UI: shell, navigation, Overview, Loads and combinations, Finite element mesh ===== */
(function () {
  'use strict';
  var ST = U.ST, esc = U.esc, f = U.f;
  var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  U.TABS = [
    { id: 'overview', t: 'Project overview', i: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16"/>') },
    { id: 'loads', t: 'Loads & combinations', i: ic('<path d="M12 3v10M8 9l4 4 4-4M4 17h16M4 21h16"/>') },
    { id: 'mesh', t: 'Finite element mesh', i: ic('<path d="M3 6h18M3 12h18M3 18h18M7 3l-2 18M12 3v18M17 3l2 18"/>') },
    { id: 'model', t: '3D bridge model', i: ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>') },
    { id: 'design', t: 'Super-T girder design', i: ic('<path d="M3 5h18l-4 2-1.5 11h-7L7 7z"/><circle cx="10" cy="16" r=".8"/><circle cx="14" cy="16" r=".8"/>') },
    { id: 'analysis', t: 'Structural analysis', i: ic('<path d="M3 12h18"/><path d="M3 12c3 7 15 7 18 0"/>') },
    { id: 'checks', t: 'Design checks', i: ic('<path d="M4 12l5 5L20 6"/>') },
    { id: 'reports', t: 'Reports & export', i: ic('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>') },
    { id: 'validation', t: 'Validation', i: ic('<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>') },
    { sep: 1 },
    { id: 'assistant', t: 'AI assistant', i: ic('<path d="M4 5h16v11H9l-5 4z"/><path d="M9 10h6"/>'), exp: 1 },
    { id: 'optimise', t: 'Optimise & sensitivity', i: ic('<path d="M4 20l6-8 4 4 6-10"/><circle cx="20" cy="6" r="1.5"/>'), exp: 1 }
  ];
  U.RENDER = {}; U.AFTER = {};

  /* ---------- shell ---------- */
  U.shell = function () {
    var root = U.$('#bs');
    root.innerHTML = '<header class="bs-top"><div class="bs-brand">' + ic('<path d="M2 17h20M4 17V9M20 17V9M4 9c4-5 12-5 16 0M8 17v-5M12 17v-6M16 17v-5"/>').replace('<svg', '<svg width="28" height="28" style="color:var(--acc)"') +
      '<div><b>Bridge Studio</b><small>Super-T bridge analysis and design · generic case studies</small></div></div>' +
      '<select class="bs-case" id="bs-case" aria-label="Case study">' + Object.keys(CORE.CASES).map(function (k) { var c = CORE.CASES[k]; return '<option value="' + k + '">' + esc(c.name + ' – ' + c.title) + '</option>'; }).join('') + '</select>' +
      '<span class="bs-spacer"></span><span id="bs-state"></span>' +
      '<button class="btn ghost" data-act="theme" id="bs-theme" title="Switch light / dark theme">Theme</button>' +
      '<button class="bs-run" data-act="run" id="bs-run">Run</button></header>' +
      '<div class="bs-deps" id="bs-deps"></div>' +
      '<div class="bs-body"><nav class="bs-nav" role="tablist" aria-label="Sections">' + U.TABS.map(function (t) { return t.sep ? '<div class="sep"></div>' : '<button role="tab" data-tab="' + t.id + '" aria-selected="false">' + t.i + '<span>' + esc(t.t) + '</span>' + (t.exp ? '<span class="tag">EXP</span>' : '') + '</button>'; }).join('') + '</nav>' +
      '<main class="bs-main" id="bs-main"></main></div><div class="tip" id="bs-toast" hidden style="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(20px + env(safe-area-inset-bottom, 0px));font-family:var(--f-sans);font-size:13px;z-index:50"></div>';
    U.$('#bs-case').addEventListener('change', function (e) { U.loadCase(e.target.value); U.paint(); U.run(); });
  };
  U.paintDeps = function () {
    var el = U.$('#bs-deps'); if (!el) return;
    var pill = function (n) { var s = U.status(n), lab = { cur: 'current', out: 'out of date', none: 'not run', run: 'running' }[s.s]; return '<span class="dep" title="' + esc(s.why.join('; ')) + '"><span class="pill ' + s.s + '">' + esc(U.DEP[n].short) + ': ' + lab + '</span></span>'; };
    el.innerHTML = U.ORDER.map(pill).join('<span class="arrow">→</span>') + (ST.running ? '<span class="prog" role="status">' + esc(ST.log) + '</span>' : (ST.log ? '<span class="why">' + esc(ST.log) + '</span>' : '')) +
      '<span class="bs-spacer"></span><label class="row" style="gap:6px"><input type="checkbox" id="bs-auto" data-act="auto"' + (ST.auto ? ' checked' : '') + '> Re-run quick steps automatically</label>';
    var stale = U.ORDER.filter(function (n) { return !U.ok(n); }), b = U.$('#bs-run');
    b.disabled = !!ST.running; b.classList.toggle('idle', !stale.length);
    b.innerHTML = ST.running ? '<span class="spin" style="display:inline-block">◐</span> Running' : stale.length ? 'Run ' + stale.length + ' stale step' + (stale.length > 1 ? 's' : '') : 'All results current';
    var sx = U.$('#bs-state'); if (sx) { var any = U.ORDER.some(function (n) { return U.status(n).s === 'out'; }); sx.innerHTML = any ? '<span class="pill out">Inputs changed since the last run</span>' : ''; }
  };
  U.paint = function () {
    U.paintDeps();
    U.$$('.bs-nav [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === ST.tab ? 'true' : 'false'); });
    var sel = U.$('#bs-case'); if (sel) sel.value = ST.caseId;
    var main = U.$('#bs-main'), y = window.scrollY; U._charts = {};
    try { main.innerHTML = U.RENDER[ST.tab](); } catch (e) { console.error(e); main.innerHTML = '<div class="card"><h3>This view failed to draw</h3><p class="note">' + esc(e.message) + '</p></div>'; }
    if (U.AFTER[ST.tab]) try { U.AFTER[ST.tab](); } catch (e) { console.error(e); }
    window.scrollTo(0, y);
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t && t.closest('.bs-nav, .bs-main')) { ST.tab = t.getAttribute('data-tab'); try { localStorage.setItem('bs-tab', ST.tab); } catch (x) {} window.scrollTo(0, 0); U.paint(); return; }
    var a = e.target.closest('[data-act]'); if (!a) return; var act = a.getAttribute('data-act'), h = U.ACT[act]; if (h) h(a, e);
  });
  U.ACT = {
    run: function () { U.run(); },
    auto: function (a) { ST.auto = a.checked; if (ST.auto) U.changed(); },
    theme: function () { var r = document.documentElement, cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), nx = cur === 'dark' ? 'light' : 'dark'; r.setAttribute('data-theme', nx); try { localStorage.setItem('bs-theme', nx); } catch (x) {} if (U.V3) U.V3.theme(); U.paint(); },
    case: function (a) { U.loadCase(a.getAttribute('data-id')); U.paint(); U.run(); },
    sel: function (a) { var k = a.getAttribute('data-k'), v = a.getAttribute('data-v'); ST.sel[k] = isNaN(Number(v)) || v === '' ? v : Number(v); U.paint(); }
  };
  document.addEventListener('change', function (e) {   /* selection controls (not inputs) */
    var t = e.target; if (!t.getAttribute) return; var k = t.getAttribute('data-sel'); if (!k) return;
    ST.sel[k] = isNaN(Number(t.value)) || t.value === '' ? t.value : Number(t.value); U.paint();
  });
  U.selBox = function (k, opts, label) { return '<label class="row" style="gap:6px;font-size:12px;color:var(--mut)">' + esc(label) + ' <select class="sm" data-sel="' + k + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(ST.sel[k]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; };
  U.girderOpts = function (ng) { var o = []; for (var i = 0; i < ng; i++) o.push([i, 'G' + (i + 1) + (i === 0 || i === ng - 1 ? ' (edge)' : '')]); return o; };
  U.spanOpts = function (n) { var o = []; for (var k = 0; k < n; k++) o.push([k, 'Span ' + (k + 1)]); return o; };
  U.clampSel = function () { var g = CORE.geometry(ST.p); if (ST.sel.gi >= g.ng) ST.sel.gi = g.ng - 1; if (ST.sel.sk >= g.spans.length) ST.sel.sk = g.spans.length - 1; return g; };

  /* ---------- results digest used by Overview, Reports and the assistant ---------- */
  U.digest = function () {
    var g = CORE.geometry(ST.p), A = U.A(), o = { g: g, checks: null, worst: null, nOK: 0, nNG: 0, nInfo: 0, gov: null, piles: null };
    if (A && U.ok('combos')) {
      var best = null; A.g.spans.forEach(function (sp, k) { for (var i = 0; i < A.g.ng; i++) { var mid = Math.round(A.m.n / 2), key = 'M:' + k + ':' + i + ':' + Math.min(mid, A.m.n - 1) + ':a', gv = ANALYSIS.governing(A, key, 'ULS', 'max'); if (gv && (!best || gv.v > best.v)) best = { v: gv.v, id: gv.id, i: i, k: k }; } });
      o.gov = best;
    }
    if (ST.R.design && U.ok('design')) {
      var all = []; ST.R.design.data.CK.forEach(function (row, k) { row.forEach(function (ck, i) { ck.forEach(function (c) { all.push(Object.assign({ gi: i, sk: k }, c)); }); }); });
      o.checks = all; all.forEach(function (c) { if (c.ok === null) o.nInfo++; else if (c.ok) o.nOK++; else o.nNG++; });
      o.worst = all.filter(function (c) { return c.u !== null && isFinite(c.u); }).reduce(function (b, c) { return !b || c.u > b.u ? c : b; }, null);
    }
    if (ST.R.piles && U.ok('piles')) o.piles = ST.R.piles.data;
    return o;
  };
  U.warnings = function () {
    var w = [], g = CORE.geometry(ST.p), m = CORE.mesh(ST.p, g, CORE.sections(ST.p, g)), d = U.digest();
    m.quality.forEach(function (q) { if (!q.ok) w.push(['warn', 'Mesh: ' + q.k + ' ' + q.v + '. ' + q.note]); });
    if (g.lanes < 1) w.push(['bad', 'The carriageway is narrower than one 3.2 m lane: no traffic is applied.']);
    U.ORDER.forEach(function (n) { var s = U.status(n); if (s.s === 'out') w.push(['stale', U.DEP[n].label + ' is out of date (' + s.why.join(', ') + ').']); });
    if (d.checks) d.checks.filter(function (c) { return c.ok === false; }).slice(0, 6).forEach(function (c) { w.push(['bad', 'G' + (c.gi + 1) + (g.spans.length > 1 ? ' span ' + (c.sk + 1) : '') + ': ' + c.name + ' – utilisation ' + (isFinite(c.u) ? c.u.toFixed(2) : '∞') + (c.why ? ' (' + c.why + ')' : '')]); });
    if (d.piles) ['A', 'B'].forEach(function (s) { var wv = d.piles[s].worst; if (wv && wv.u > 1) w.push(['bad', 'Abutment ' + s + ' piles: bending utilisation ' + wv.u.toFixed(2) + ' (' + wv.id + ').']); });
    ST.cases.filter(function (c) { return c.proposed; }).forEach(function (c) { w.push(['info', c.name + ' – ' + c.note]); });
    ST.combos.filter(function (c) { return c.illustrative; }).forEach(function (c) { w.push(['info', c.id + ' (' + c.name + ') uses an illustrative construction load factor.']); });
    w.push(['info', 'All code coefficients (vehicle loads, load factors, material models) are unverified transcriptions in the platform standards inventory. Results are not a compliance check.']);
    return w;
  };
  U.summaryText = function () {
    var c = CORE.CASES[ST.caseId], g = CORE.geometry(ST.p), d = U.digest(), s = [];
    s.push(c.name + ' (' + c.title + '): ' + ST.p.spans.join(' + ') + ' m, skew ' + ST.p.skew + '°, ' + g.ng + ' × ' + ST.p.girder + ' girders at ' + ST.p.spacing + ' m, deck width ' + f(g.W, 2) + ' m, ' + g.lanes + ' traffic lane' + (g.lanes === 1 ? '' : 's') + '. All inputs are illustrative.');
    if (d.gov) s.push('Largest ULS mid-span girder moment: ' + f(d.gov.v) + ' kNm in G' + (d.gov.i + 1) + (g.spans.length > 1 ? ', span ' + (d.gov.k + 1) : '') + ', governed by ' + d.gov.id + '.');
    else s.push('The grillage analysis has no current results.');
    if (d.checks) s.push('Design checks: ' + d.nOK + ' within limits, ' + d.nNG + ' exceed their limits, ' + d.nInfo + ' reported for information. Highest utilisation ' + (d.worst ? d.worst.u.toFixed(2) + ' (' + d.worst.name + ', G' + (d.worst.gi + 1) + ')' : '–') + '.');
    else s.push('Design checks have no current results.');
    if (d.piles) { var pw = [d.piles.A.worst, d.piles.B.worst].filter(Boolean).reduce(function (b, x) { return !b || x.u > b.u ? x : b; }, null); if (pw) s.push('Pile bending (rigid cap, illustrative eccentricity and lever arm): highest utilisation ' + pw.u.toFixed(2) + ' under ' + pw.id + '.'); }
    return s;
  };

  /* ---------- 1. Overview ---------- */
  var WORKFLOW = [
    ['overview', 'Select a case study', 'Pick one of the four generic bridges.'],
    ['model', 'Review the geometry in 3D', 'Rotate, section and pick a girder.'],
    ['model', 'Change a dimension', 'Spans, skew, girder count or spacing; the model and mesh update.'],
    ['mesh', 'Inspect the grillage mesh', 'Elements, supports, member properties and quality.'],
    ['loads', 'Set up load cases', 'Enable cases and edit intensities.'],
    ['loads', 'Edit or generate combinations', 'Factor matrix by limit state.'],
    ['analysis', 'Run the analysis', 'Grillage solve and moving-load envelopes.'],
    ['analysis', 'Read the results', 'BMD, SFD, deflection, reactions, load distribution.'],
    ['design', 'Lay out the strands', 'Toggle strands and debonding on the section.'],
    ['checks', 'Review the design checks', 'Demand, capacity, utilisation, governing combination.'],
    ['overview', 'Change an input and see what goes stale', 'Results grey out until re-run.'],
    ['reports', 'Export the report', 'PDF, Excel and HTML with images.']
  ];
  U.RENDER.overview = function () {
    var c = CORE.CASES[ST.caseId], g = CORE.geometry(ST.p), sc = CORE.sections(ST.p, g), m = CORE.mesh(ST.p, g, sc), d = U.digest(), A = ST.R.analysis;
    var kp = function (l, v, u, s, cl) { return '<div class="kpi ' + (cl || '') + '"><span class="l">' + esc(l) + '</span><span class="v">' + v + (u ? '<small>' + esc(u) + '</small>' : '') + '</span>' + (s ? '<span class="s">' + s + '</span>' : '') + '</div>'; };
    var h = '<div><h1 class="h1">' + esc(c.name + ' – ' + c.title) + '</h1><p class="lede">' + esc(c.focus) + ' Generic example: every input is illustrative and not taken from any real project.</p></div>';
    h += '<div class="cases" role="group" aria-label="Case studies">' + Object.keys(CORE.CASES).map(function (k) { var q = CORE.CASES[k]; return '<button class="casebtn" data-act="case" data-id="' + k + '" aria-pressed="' + (k === ST.caseId) + '"><span class="k">' + esc(q.name) + '</span><span class="t">' + esc(q.title) + '</span><span class="d">' + esc(q.focus) + '</span></button>'; }).join('') + '</div>';
    h += '<div class="kpis">' + kp('Spans', ST.p.spans.join(' + '), 'm', 'skew ' + ST.p.skew + '°') + kp('Deck width', f(g.W, 2), 'm', g.lanes + ' lane' + (g.lanes === 1 ? '' : 's') + ' of 3.2 m') + kp('Girders', g.ng + ' × ' + ST.p.girder.split(' ')[0], '', 'Super-T at ' + ST.p.spacing + ' m') +
      kp('Model', f(m.nodes.length * 3), 'DOF', m.nodes.length + ' nodes, ' + m.els.length + ' elements') +
      kp('ULS girder moment', d.gov ? f(d.gov.v) : '–', d.gov ? 'kNm' : '', d.gov ? 'G' + (d.gov.i + 1) + ', ' + esc(d.gov.id) : 'run the analysis') +
      kp('Design checks', d.checks ? d.nOK + ' / ' + (d.nOK + d.nNG) : '–', d.checks ? 'OK' : '', d.checks ? (d.nNG ? d.nNG + ' NG · ' : '') + 'max u ' + (d.worst ? d.worst.u.toFixed(2) : '–') : 'not current', d.checks ? (d.nNG ? 'bad' : 'ok') : '') + '</div>';
    /* calculation status */
    h += '<div class="grid2"><section class="card"><h3>Calculation status <span class="sub">each result remembers the inputs it used</span></h3><div class="tbox"><table class="t"><thead><tr><th>Step</th><th>Depends on</th><th>Status</th><th class="n">Run time</th></tr></thead><tbody>' +
      U.ORDER.map(function (n) { var s = U.status(n), r = ST.R[n]; return '<tr><td><b>' + esc(U.DEP[n].label) + '</b></td><td class="note">' + esc(U.DEP[n].needs.map(function (q) { return U.GRP[q]; }).concat(U.DEP[n].up.map(function (u) { return U.DEP[u].short; })).join(', ')) + '</td><td><span class="pill ' + s.s + '">' + { cur: 'current', out: 'out of date', none: 'not run', run: 'running' }[s.s] + '</span>' + (s.s === 'out' ? '<div class="note">' + esc(s.why.join('; ')) + '</div>' : '') + '</td><td class="n">' + (r ? f(r.ms) + ' ms' : '–') + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="row"><button class="btn pri" data-act="run"' + (U.ORDER.every(U.ok) ? ' disabled' : '') + '>Run stale steps</button><span class="note">Analysis runs in a background worker; ' + (A ? 'last solve ' + f(A.data.nd) + ' equations' : 'not yet solved') + '.</span></div></section>';
    h += '<section class="card"><h3>Summary <span class="sub">written from the current results</span>' + U.tag('calc') + '</h3>' + U.summaryText().map(function (t) { return '<p style="margin:0">' + esc(t) + '</p>'; }).join('') + '</section></div>';
    /* workflow and warnings */
    h += '<div class="grid2"><section class="card"><h3>Demonstration workflow</h3><ol style="margin:0;padding-left:20px;display:grid;gap:4px">' + WORKFLOW.map(function (w) { return '<li><button class="btn ghost" style="padding:2px 6px" data-tab="' + w[0] + '"><b>' + esc(w[1]) + '</b></button> <span class="note">' + esc(w[2]) + '</span></li>'; }).join('') + '</ol></section>';
    var W = U.warnings(), col = { bad: 'var(--bad)', warn: 'var(--warn)', stale: 'var(--stale)', info: 'var(--mut)' };
    h += '<section class="card"><h3>Warnings and notes <span class="sub">' + W.filter(function (x) { return x[0] !== 'info'; }).length + ' need attention</span></h3><ul style="margin:0;padding-left:0;list-style:none;display:grid;gap:6px">' + W.map(function (x) { return '<li style="display:flex;gap:8px;align-items:baseline"><span style="width:8px;height:8px;border-radius:2px;flex:none;background:' + col[x[0]] + '"></span><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul></section></div>';
    /* provenance */
    h += '<section class="card"><h3>How to read the numbers</h3><div class="row">' + U.tag('calc') + '<span class="note">computed by the deterministic engines from the inputs shown</span></div><div class="row">' + U.tag('ill') + '<span class="note">generic example input, not from any project</span></div><div class="row">' + U.tag('unv') + '<span class="note">code coefficient in the platform standards inventory, not yet independently verified</span></div><div class="row">' + U.tag('exp') + '<span class="note">AI or optimisation output that needs engineering review</span></div>' +
      '<details><summary style="cursor:pointer;font-weight:600">Engineering method and limits</summary><ul class="note" style="margin:8px 0 0;padding-left:18px">' + CORE.METHOD.map(function (t) { return '<li>' + esc(t.replace('at 0.1 m', 'at ' + ST.p.sweep + ' m')) + '</li>'; }).join('') +
      '<li>Losses engine template values (illustrative): ageing coefficient 0.8, transmission length 60 strand diameters, mean temperature 20 °C, environment factor 0.6, drying from 1 day, formwork 1 kPa, Ep = 200 GPa.</li><li>Pile design: rigid pile cap, reactions from the grillage bearing results, moment from an assumed load eccentricity and braking force over half the free length (illustrative); no soil–structure interaction.</li></ul></details></section>';
    return h;
  };

  /* ---------- 2. Loads and combinations ---------- */
  U.RENDER.loads = function () {
    var p = ST.p, g = CORE.geometry(p);
    var applied = function (c) { return c.on_girder ? 'Girder alone (non-composite)' : c.cls === 'Traffic' ? 'Composite grillage, influence surfaces' : c.proposed ? '–' : 'Composite grillage'; };
    var intensity = { G1: f(CORE.sections(p, g).A * 1e-6 * p.gGirder, 2) + ' kN/m per girder', G2: f((g.s * p.slab / 1000 + 0.0375) * p.gConc, 2) + ' kN/m per internal girder', SDLs: p.barrierLoad + ' kN/m per barrier at the deck edge', SDLp: p.surf + ' mm × ' + p.gSurf + ' kN/m³ + ' + p.utilities + ' kN/m utilities', C: p.constLL + ' kPa on the girder spacing', M1600: 'wheel 60 kN, UDL 6 kN/m, DLA 0.3', S1600: 'wheel 40 kN, UDL 24 kN/m, DLA 0' };
    var h = '<div><h1 class="h1">Loads and combinations</h1><p class="lede">Load cases feed the grillage analysis; combinations are re-formed from the stored case results without re-solving.</p></div>';
    h += '<section class="card"><h3>Load cases ' + U.tag('ill') + U.tag('unv') + '</h3><div class="tbox"><table class="t"><thead><tr><th>On</th><th>Case</th><th>Description</th><th>Class</th><th>Applied to</th><th>Intensity</th></tr></thead><tbody>' +
      ST.cases.map(function (c) { return '<tr' + (c.proposed ? ' style="opacity:.75"' : '') + '><td><input type="checkbox" data-act="case-on" data-id="' + c.id + '"' + (c.on ? ' checked' : '') + (c.proposed ? ' disabled title="Proposed: not modelled yet"' : '') + ' aria-label="Include ' + esc(c.name) + '"></td><td class="mono"><b>' + c.id + '</b></td><td>' + esc(c.name) + (c.proposed ? ' <span class="tg">proposed, not modelled</span><div class="note">' + esc(c.note) + '</div>' : '') + '</td><td>' + esc(c.cls) + '</td><td class="note">' + applied(c) + '</td><td class="note">' + esc(intensity[c.id] || '–') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    h += '<section class="card"><h3>Load intensities ' + U.tag('ill') + '</h3><div class="form">' + U.fld('barrierLoad', 'Barrier weight', 'kN/m') + U.fld('surf', 'Surfacing thickness', 'mm') + U.fld('gSurf', 'Surfacing density', 'kN/m³') + U.fld('utilities', 'Utilities', 'kN/m') +
      U.fld('gConc', 'Deck concrete density', 'kN/m³') + U.fld('gGirder', 'Girder concrete density', 'kN/m³') + U.fld('constLL', 'Construction live load', 'kPa') + U.fld('dlaUDL', 'Dynamic allowance on UDL', '', { options: [['false', 'No (point loads only)'], ['true', 'Yes']] }) + U.fld('sweep', 'Lane sweep step', 'm', { min: 0.05, max: 1 }) + '</div>' +
      '<p class="note">Traffic: ' + g.lanes + ' lane' + (g.lanes === 1 ? '' : 's') + ' of 3.2 m on a ' + f(g.cwR - g.cwL, 2) + ' m carriageway, accompanying lane factors 1.0 / 0.8 / 0.4. Vehicle data from the platform standards inventory (' + esc(CORE.STD.status) + ').</p></section>';
    /* combination matrix */
    var ids = ST.cases.filter(function (c) { return !c.proposed; }).map(function (c) { return c.id; });
    h += '<section class="card"><h3>Combination matrix ' + U.tag('unv') + '<span class="sub">load factors per case; empty or 0 = not included</span></h3><div class="row"><button class="btn" data-act="cb-add">Add combination</button><button class="btn" data-act="cb-gen">Generate from enabled cases</button><button class="btn ghost" data-act="cb-reset">Reset to defaults</button></div>' +
      '<div class="tbox"><table class="t"><thead><tr><th>ID</th><th>Limit state</th><th>Name</th>' + ids.map(function (i) { return '<th class="n">' + i + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
      ST.combos.map(function (cb, r) { return '<tr><td><input class="cell" style="width:70px;text-align:left" data-cb="' + r + '" data-k="id" value="' + esc(cb.id) + '" aria-label="Combination id"></td><td><select class="sm" data-cb="' + r + '" data-k="ls"><option' + (cb.ls === 'ULS' ? ' selected' : '') + '>ULS</option><option' + (cb.ls === 'SLS' ? ' selected' : '') + '>SLS</option></select></td><td><input class="cell" style="width:200px;text-align:left" data-cb="' + r + '" data-k="name" value="' + esc(cb.name) + '" aria-label="Combination name">' + (cb.illustrative ? ' <span class="tg ill">illustrative</span>' : '') + '</td>' +
        ids.map(function (i) { var v = cb.f[i]; return '<td class="n"><input class="cell' + (v ? '' : ' z') + '" data-cb="' + r + '" data-k="f" data-case="' + i + '" value="' + (v ? v : '') + '" inputmode="decimal" aria-label="' + esc(cb.id + ' factor on ' + i) + '"></td>'; }).join('') + '<td><button class="btn ghost" data-act="cb-del" data-r="' + r + '" title="Delete ' + esc(cb.id) + '" aria-label="Delete ' + esc(cb.id) + '">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><p class="note">Factors: permanent 1.2 (ULS) / 1.0 (SLS), barriers 1.4 / 1.0, surfacing 2.0 / 1.3, traffic 1.8 / 1.0, as held in the standards inventory (unverified). Minimum permanent-load factors (0.85, 0.8, 0.7) are not used because every response here is maximised by full dead load.</p></section>';
    return h;
  };
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.getAttribute) return;
    if (t.getAttribute('data-act') === 'case-on') { var c = ST.cases.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; c.on = t.checked; ST.history.push({ t: Date.now(), what: (c.on ? 'Enabled ' : 'Disabled ') + c.id }); U.changed(); return; }
    var r = t.getAttribute('data-cb'); if (r === null) return; var cb = ST.combos[Number(r)], k = t.getAttribute('data-k');
    if (k === 'f') { var v = t.value.trim() === '' ? 0 : Number(t.value); if (!isFinite(v) || v < 0) { U.toast('A load factor must be a number of zero or more'); U.paint(); return; } if (v) cb.f[t.getAttribute('data-case')] = v; else delete cb.f[t.getAttribute('data-case')]; delete cb.illustrative; }
    else if (k === 'id') { var nv = t.value.trim(); if (!nv || ST.combos.some(function (x, q) { return q !== Number(r) && x.id === nv; })) { U.toast('Each combination needs a unique id'); U.paint(); return; } cb.id = nv; }
    else cb[k] = t.value;
    ST.history.push({ t: Date.now(), what: 'Edited combination ' + cb.id }); U.changed();
  });
  U.ACT['cb-add'] = function () { var n = ST.combos.length + 1, id = 'USR-' + n; while (ST.combos.some(function (c) { return c.id === id; })) id = 'USR-' + (++n); ST.combos.push({ id: id, ls: 'ULS', name: 'User combination', f: { G1: 1.2, G2: 1.2 } }); U.changed(); };
  U.ACT['cb-del'] = function (a) { if (ST.combos.length <= 1) { U.toast('Keep at least one combination'); return; } ST.combos.splice(Number(a.getAttribute('data-r')), 1); U.changed(); };
  U.ACT['cb-gen'] = function () { ST.combos = CORE.generateCombos(ST.cases); U.toast('Generated ' + ST.combos.length + ' combinations from the enabled cases'); U.changed(); };
  U.ACT['cb-reset'] = function () { ST.combos = CORE.defaultCombos(); U.changed(); };

  /* ---------- 3. Finite element mesh ---------- */
  var MV = { nodes: true, labels: false, colour: 'type', pick: null };
  U.RENDER.mesh = function () {
    var p = ST.p, g = CORE.geometry(p), sc = CORE.sections(p, g), m = CORE.mesh(p, g, sc), cnt = {};
    m.els.forEach(function (e) { cnt[e.type] = (cnt[e.type] || 0) + 1; });
    var h = '<div><h1 class="h1">Finite element mesh</h1><p class="lede">Grillage generated automatically from the geometry: one longitudinal member per girder (composite Super-T and deck), deck slab strips across, end cross girders on the support lines. Regenerated on every geometry or mesh change.</p></div>';
    h += '<div class="kpis"><div class="kpi"><span class="l">Nodes</span><span class="v">' + m.nodes.length + '</span><span class="s">' + f(3 * m.nodes.length) + ' degrees of freedom</span></div><div class="kpi"><span class="l">Girder members</span><span class="v">' + (cnt.girder || 0) + '</span><span class="s">' + m.n + ' per girder per span</span></div><div class="kpi"><span class="l">Slab strips</span><span class="v">' + (cnt.slab || 0) + '</span><span class="s">at ' + f(m.dL, 2) + ' m</span></div><div class="kpi"><span class="l">Cross girders</span><span class="v">' + (cnt.diaphragm || 0) + '</span><span class="s">end diaphragm members</span></div><div class="kpi"><span class="l">Bearings</span><span class="v">' + m.sup.length + '</span><span class="s">vertical springs ' + f(p.kv / 1e6, 1) + '×10⁶ kN/m</span></div></div>';
    h += '<section class="card"><h3>Mesh controls ' + U.tag('ill') + '</h3><div class="form">' + U.fld('nEl', 'Elements per span (refinement)', '', { min: 4, max: 40, step: 1 }) + U.fld('Jf', 'Girder torsion factor', '× J', { min: 0.1, max: 2 }) + U.fld('kv', 'Bearing vertical stiffness', 'kN/m', { min: 1e3 }) + U.fld('cgW', 'End cross girder width', 'm', { min: 0.3, max: 2 }) + '</div>' +
      '<div class="row"><input type="range" min="4" max="40" step="1" value="' + p.nEl + '" id="mesh-rf" aria-label="Elements per span" style="flex:1 1 220px"><span class="note">Drag to refine: ' + p.nEl + ' elements per span (' + f(m.dL, 2) + ' m)</span></div></section>';
    h += '<section class="card"><h3>Plan of the grillage <span class="sub">click a member or node to inspect it</span></h3><div class="row"><div class="seg" role="group" aria-label="Show"><button data-act="mv" data-k="nodes" aria-pressed="' + MV.nodes + '">Nodes</button><button data-act="mv" data-k="labels" aria-pressed="' + MV.labels + '">Labels</button></div><div class="seg" role="group" aria-label="Colour"><button data-act="mv" data-k="colour" data-v="type" aria-pressed="' + (MV.colour === 'type') + '">By member type</button><button data-act="mv" data-k="colour" data-v="EI" aria-pressed="' + (MV.colour === 'EI') + '">By bending stiffness</button></div>' +
      '<span class="legend"><span><i style="background:var(--acc)"></i>girder</span><span><i style="background:var(--axis)"></i>slab strip</span><span><i style="background:var(--load)"></i>cross girder</span><span><i style="background:var(--bad)"></i>bearing</span></span></div>' +
      '<div class="tbox" style="border:0">' + planSVG(g, m) + '</div>' + inspector(m, sc) + '</section>';
    h += '<section class="card"><h3>Mesh quality</h3><div class="tbox"><table class="t"><thead><tr><th>Indicator</th><th class="n">Value</th><th>Status</th><th>Guidance</th></tr></thead><tbody>' + m.quality.map(function (q) { return '<tr><td>' + esc(q.k) + '</td><td class="n">' + esc(q.v) + '</td><td>' + U.stat(q.ok) + '</td><td class="note">' + esc(q.note) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    h += '<section class="card"><h3>Member properties ' + U.tag('calc') + '</h3><div class="tbox"><table class="t"><thead><tr><th>Member</th><th class="n">EI (kNm²)</th><th class="n">GJ (kNm²)</th><th>Basis</th></tr></thead><tbody>' +
      [['girder', 'Composite Super-T + deck', 'gross composite I, deck transformed by modular ratio; J of the closed cell (Bredt) × torsion factor'], ['slab', 'Deck slab strip', 'I = b t³/12, J = b t³/6 per strip width b'], ['diaphragm', 'End cross girder', 'rectangle ' + p.cgW + ' m wide × girder + deck depth']].map(function (r) { var e = m.els.filter(function (x) { return x.type === r[0]; })[0]; return e ? '<tr><td>' + r[1] + '</td><td class="n">' + f(e.EI) + '</td><td class="n">' + f(e.GJ) + '</td><td class="note">' + r[2] + '</td></tr>' : ''; }).join('') + '</tbody></table></div></section>';
    return h;
  };
  function planSVG(g, m) {
    var x0 = Math.min.apply(null, m.nodes.map(function (n) { return n.x; })) - 1, x1 = Math.max.apply(null, m.nodes.map(function (n) { return n.x; })) + 1, y0 = g.edgeL - 0.8, y1 = g.edgeR + 0.8;
    var W = 960, sx = (W - 40) / (x1 - x0), sy = sx, Hn = (y1 - y0) * sy, ex = 1;
    if (Hn < 200) { ex = 200 / Hn; Hn = 200; } if (Hn > 560) { ex = 560 / Hn; Hn = 560; }
    var X = function (x) { return 20 + (x - x0) * sx; }, Y = function (y) { return 20 + (y1 - y) * sy * ex; }, H = Hn + 40;
    var EImax = Math.max.apply(null, m.els.map(function (e) { return e.EI; })), col = function (e) { if (MV.colour === 'EI') { var t = Math.log10(e.EI) / Math.log10(EImax); return 'hsl(' + (200 - 160 * Math.max(0, t * t)) + ',70%,48%)'; } return e.type === 'girder' ? 'var(--acc)' : e.type === 'diaphragm' ? 'var(--load)' : 'var(--axis)'; };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" style="min-width:640px" role="img" aria-label="Grillage plan">';
    s += '<path d="M' + X(g.spans[0].x0 + g.edgeL * g.t) + ' ' + Y(g.edgeL) + 'L' + X(g.total + g.edgeL * g.t) + ' ' + Y(g.edgeL) + 'L' + X(g.total + g.edgeR * g.t) + ' ' + Y(g.edgeR) + 'L' + X(g.edgeR * g.t) + ' ' + Y(g.edgeR) + 'Z" style="fill:var(--accs);opacity:.5;stroke:var(--line)"/>';
    m.els.forEach(function (e) { var a = m.nodes[e.n1], b = m.nodes[e.n2], sel = MV.pick && MV.pick[0] === 'e' && MV.pick[1] === e.id; s += '<line data-act="mpick" data-t="e" data-id="' + e.id + '" x1="' + X(a.x).toFixed(1) + '" y1="' + Y(a.y).toFixed(1) + '" x2="' + X(b.x).toFixed(1) + '" y2="' + Y(b.y).toFixed(1) + '" style="stroke:' + (sel ? 'var(--ink)' : col(e)) + ';stroke-width:' + (sel ? 5 : e.type === 'girder' ? 3 : e.type === 'diaphragm' ? 3 : 1.4) + ';cursor:pointer"><title>' + esc(e.label + ' #' + e.id) + '</title></line>'; });
    m.sup.forEach(function (q) { var n = m.nodes[q.node], cx = X(n.x), cy = Y(n.y); s += '<path d="M' + cx + ' ' + (cy + 3) + 'l-5 8h10z" style="fill:var(--bad)"/>'; });
    if (MV.nodes) m.nodes.forEach(function (n) { var sel = MV.pick && MV.pick[0] === 'n' && MV.pick[1] === n.id; s += '<circle data-act="mpick" data-t="n" data-id="' + n.id + '" cx="' + X(n.x).toFixed(1) + '" cy="' + Y(n.y).toFixed(1) + '" r="' + (sel ? 5 : 2.6) + '" style="fill:' + (sel ? 'var(--ink)' : 'var(--panel)') + ';stroke:var(--ink);stroke-width:1;cursor:pointer"><title>node ' + n.id + '</title></circle>'; });
    if (MV.labels) { g.y.forEach(function (y, i) { s += '<text x="6" y="' + (Y(y) + 3) + '">G' + (i + 1) + '</text>'; }); m.nodes.filter(function (n) { return n.i === 0; }).forEach(function (n) { s += '<text x="' + X(n.x) + '" y="' + (Y(g.edgeL) + 14) + '" text-anchor="middle">' + n.id + '</text>'; }); }
    s += '<text x="' + (W - 20) + '" y="' + (H - 6) + '" text-anchor="end">' + (ex !== 1 ? 'transverse scale × ' + ex.toFixed(2) : 'true scale') + ' · x along the bridge, m</text></svg>';
    return s;
  }
  function inspector(m, sc) {
    if (!MV.pick) return '<p class="note">Nothing selected. Click a member or a node on the plan.</p>';
    var rows;
    if (MV.pick[0] === 'e') { var e = m.els[MV.pick[1]]; if (!e) return ''; rows = [['Member', '#' + e.id + ' – ' + e.label], ['Type', e.type], ['Span / position', 'span ' + (e.k + 1) + (e.type === 'girder' ? ', girder G' + (e.i + 1) + ', segment ' + (e.j + 1) + ' of ' + m.n : ', between G' + (e.i + 1) + ' and G' + (e.i + 2) + ', station ' + e.j)], ['Nodes', e.n1 + ' → ' + e.n2], ['Length', f(e.L, 3) + ' m'], ['EI', f(e.EI) + ' kNm²'], ['GJ', f(e.GJ) + ' kNm²'], ['Direction cosines', f(e.c, 3) + ', ' + f(e.s, 3)]]; }
    else { var n = m.nodes[MV.pick[1]]; if (!n) return ''; var sp = m.sup.filter(function (q) { return q.node === n.id; })[0]; rows = [['Node', '#' + n.id], ['Position', 'x = ' + f(n.x, 3) + ' m, y = ' + f(n.y, 3) + ' m'], ['Girder / station', 'G' + (n.i + 1) + ', span ' + (n.k + 1) + ', ' + f(n.f * 100) + ' % of span'], ['Degrees of freedom', 'w, θx, θy (' + (3 * n.id) + '–' + (3 * n.id + 2) + ')'], ['Boundary condition', sp ? 'bearing (vertical spring ' + f(sp.kv / 1e6, 1) + '×10⁶ kN/m), rotations free' : 'free']]; }
    return '<div class="tbox"><table class="t"><tbody>' + rows.map(function (r) { return '<tr><td style="width:180px;color:var(--mut)">' + r[0] + '</td><td class="mono">' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  U.ACT.mv = function (a) { var k = a.getAttribute('data-k'), v = a.getAttribute('data-v'); MV[k] = v !== null ? v : !MV[k]; U.paint(); };
  U.ACT.mpick = function (a) { MV.pick = [a.getAttribute('data-t'), Number(a.getAttribute('data-id'))]; U.paint(); };
  U.AFTER.mesh = function () { var r = U.$('#mesh-rf'); if (r) { r.addEventListener('input', function () { r.nextElementSibling.textContent = 'Release to apply: ' + r.value + ' elements per span'; }); r.addEventListener('change', function () { U.set('nEl', Number(r.value)); MV.pick = null; U.changed(); }); } };
})();
