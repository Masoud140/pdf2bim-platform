/* ===== Bridge Studio UI (experimental): AI assistant, drawing reader, strand optimisation and sensitivity.
   The AI never calculates: it reads results through page tools and can only PROPOSE input changes that the engineer applies. ===== */
(function () {
  'use strict';
  var ST = U.ST, esc = U.esc, f = U.f;
  var AI = { sample: undefined, images: false, turns: [], busy: false, ctl: null, props: [], draw: null, drawRows: null, drawBusy: false, drawMsg: '' };
  var EDIT = { spans: 'm, list', skew: '°', ng: '', spacing: 'm', overhang: 'm', girder: 'one of ' + Object.keys(SECLIB.SEC).join(', '), slab: 'mm', barrierW: 'm', barrierLoad: 'kN/m', surf: 'mm', utilities: 'kN/m', fcG: 'MPa', fcT: 'MPa', fcD: 'MPa', db: 'mm', jack: '× MBL', fitD: 'mm', fitLegs: '', fitS: 'mm', nEl: '', 'piles.n': '', 'piles.D': 'mm', 'piles.s': 'm' };
  (async function () { try { AI.sample = await window.claude.use('sample'); if (AI.sample) { var l = await AI.sample.limits().catch(function () { return null; }); AI.images = !!(l && l.images); } } catch (e) { AI.sample = null; } if (ST.tab === 'assistant') U.paint(); })();
  var why = function (e) { return { not_granted: 'Claude was not allowed for this page. Reload the page to be asked again.', rate_limited: 'Too many requests at once. Wait a moment and try again.', cancelled: 'Stopped.', images_unavailable: 'Images cannot be sent from this view.', prompt_too_large: 'The request was too large.', invalid_json: 'The reply could not be read as data. Try again.', refused: 'The request was declined.' }[e && e.code] || ('The request failed' + (e && e.message ? ': ' + e.message : '.')); };

  /* ---------- page tools the assistant may call (read-only, plus proposals) ---------- */
  function compactChecks(sk, gi) {
    var R = ST.R.design; if (!R) return { error: 'design has not been run' };
    var list = gi === undefined || gi === null ? U.worstChecks(R.data.CK) : ((R.data.CK[sk || 0] || [])[gi] || []).map(function (c) { return Object.assign({ gi: gi, sk: sk || 0 }, c); });
    return { current: U.ok('design'), checks: list.map(function (c) { return { girder: 'G' + (c.gi + 1), span: c.sk + 1, group: c.grp, check: c.name, demand: +(+c.dem).toPrecision(4), capacity: c.cap === null ? null : +(+c.cap).toPrecision(4), unit: c.unit, utilisation: c.u === null ? null : +c.u.toFixed(3), status: c.ok === null ? 'info' : c.ok ? 'OK' : 'NG', governing: c.gov, basis: c.note }; }) };
  }
  var TOOLS = [
    { name: 'get_model_state', description: 'Current case study, inputs, calculation status of each step (current or out of date) and the deterministic summary. Call this first.',
      execute: function () { var g = CORE.geometry(ST.p); return { case: CORE.CASES[ST.caseId].name + ' – ' + CORE.CASES[ST.caseId].title, inputs: Object.keys(EDIT).reduce(function (o, k) { o[k] = U.get(k); return o; }, {}), derived: { deckWidth_m: +g.W.toFixed(3), lanes: g.lanes, strands: ST.p.strands.filter(function (q) { return q.on; }).length }, status: U.ORDER.reduce(function (o, n) { var s = U.status(n); o[n] = s.s + (s.why.length ? ' (' + s.why.join(', ') + ')' : ''); return o; }, {}), summary: U.summaryText(), warnings: U.warnings().map(function (w) { return w[1]; }), combinations: ST.combos.map(function (c) { return c.id + ' ' + c.ls + ': ' + JSON.stringify(c.f); }) }; } },
    { name: 'get_design_checks', description: 'Design check table. Without girder: the worst girder for each check. With girder (1-based) and optional span (1-based): that girder only.',
      inputSchema: { type: 'object', properties: { girder: { type: 'integer' }, span: { type: 'integer' } } },
      execute: function (a) { return compactChecks(a && a.span ? a.span - 1 : 0, a && a.girder ? a.girder - 1 : null); } },
    { name: 'get_girder_results', description: 'Results along one girder for a load case or combination id: quantity M (kNm), V (kN), T (kNm) or w (mm). Returns stations with max and min.',
      inputSchema: { type: 'object', properties: { girder: { type: 'integer' }, span: { type: 'integer' }, source: { type: 'string' }, quantity: { type: 'string', enum: ['M', 'V', 'T', 'w'] } }, required: ['girder', 'source', 'quantity'] },
      execute: function (a) { var A = U.A(); if (!A) return { error: 'analysis has not been run' }; var k = (a.span || 1) - 1, i = a.girder - 1; if (!A.g.spans[k] || i < 0 || i >= A.g.ng) throw new Error('no such girder or span'); var mx = ANALYSIS.line(A, k, i, a.quantity, a.source, 'max'), mn = ANALYSIS.line(A, k, i, a.quantity, a.source, 'min'); if (mx.every(function (q) { return q.v === null; })) throw new Error('unknown source ' + a.source); return { current: U.ok('analysis') && U.ok('combos'), stations: mx.map(function (q, j) { return { x_m: +q.x.toFixed(2), max: +(+q.v).toPrecision(4), min: +(+mn[j].v).toPrecision(4) }; }) }; } },
    { name: 'propose_input_change', description: 'Propose a change to one input for the engineer to review. It is NOT applied: the engineer presses Apply. Allowed paths: ' + Object.keys(EDIT).join(', ') + '.',
      inputSchema: { type: 'object', properties: { path: { type: 'string' }, value: {}, reason: { type: 'string' } }, required: ['path', 'value', 'reason'] },
      execute: function (a) { if (!EDIT.hasOwnProperty(a.path)) throw new Error('path not allowed: ' + a.path); var v = a.path === 'spans' ? (Array.isArray(a.value) ? a.value : String(a.value).split(/[,\s+]+/)).map(Number).filter(function (x) { return x > 0; }) : a.path === 'girder' ? String(a.value) : Number(a.value); if (a.path === 'girder' && !SECLIB.SEC[v]) throw new Error('unknown girder ' + v); if (a.path !== 'spans' && a.path !== 'girder' && !isFinite(v)) throw new Error('value must be a number'); AI.props.push({ path: a.path, value: v, from: U.get(a.path), reason: String(a.reason || ''), state: 'open' }); U.paintSoon(); return { recorded: true, note: 'Shown to the engineer with an Apply button. Results go out of date when applied.' }; } }
  ];
  U.paintSoon = function () { clearTimeout(U._ps); U._ps = setTimeout(function () { if (ST.tab === 'assistant') U.paint(); }, 60); };
  var RULES = 'You are the engineering assistant inside Bridge Studio, a teaching and demonstration application for Super-T girder bridges (generic case studies with illustrative inputs). Rules: (1) Every number you state must come from a tool result in this conversation; call get_model_state first. Never compute structural results yourself and never invent capacities, code clauses or coefficients. (2) Say whether results are current; if a step is out of date, say so and suggest pressing Run. (3) Code coefficients in the app are unverified transcriptions; never state or imply that a design complies with a standard. (4) To suggest a design change, call propose_input_change; the engineer decides. (5) Be brief: short paragraphs or a few bullets, units always given.';

  async function ask(text) {
    if (!AI.sample || AI.busy || !text.trim()) return;
    AI.turns.push({ role: 'user', content: text.trim() }); AI.busy = true; AI.ctl = new AbortController(); AI.live = 'Thinking…'; U.paint();
    try {
      var r = await AI.sample([{ role: 'user', content: RULES }, { role: 'assistant', content: 'Understood. I will use the page tools for every number and only propose changes.' }].concat(AI.turns), { tools: TOOLS, cache: false, signal: AI.ctl.signal, onText: function (o) { AI.live = o.text; var el = U.$('#ai-live'); if (el) el.textContent = o.text; } });
      AI.turns.push({ role: 'assistant', content: r.text + (r.truncated ? '\n[answer cut short]' : '') });
    } catch (e) { AI.turns.push({ role: 'assistant', content: (e.text ? e.text + '\n' : '') + '[' + why(e) + ']' }); }
    AI.busy = false; AI.live = ''; U.paint();
  }
  var DRAW_PROMPT = 'This image is a bridge general-arrangement drawing or sketch. Extract only values that are printed or written on it. Reply with only a JSON array of objects {"field","value","unit","quote","confidence"} where field is one of: spans (array of span lengths in m), skew (degrees), ng (number of girders), spacing (girder spacing, m), overhang (deck overhang beyond the outer girder centreline, m), girder (Super-T depth label such as "1500 Super-T"), slab (deck slab thickness, mm), barrierW (barrier width, m), fcG (girder concrete strength, MPa), fcD (deck concrete strength, MPa). quote is the exact text you read; confidence is high, medium or low. Omit any field that is not printed. Convert units to the ones given. Example: [{"field":"skew","value":15,"unit":"deg","quote":"SKEW 15°","confidence":"high"}]';
  async function readDrawing() {
    if (!AI.sample || !AI.draw || AI.drawBusy) return;
    AI.drawBusy = true; AI.drawMsg = 'Reading the drawing… this can take a minute.'; U.paint();
    try {
      var rows = await AI.sample.json(DRAW_PROMPT, { images: [AI.draw], modelTier: 'default' });
      if (!Array.isArray(rows)) throw { code: 'invalid_json' };
      AI.drawRows = rows.filter(function (r) { return r && EDIT.hasOwnProperty(r.field); }).map(function (r) { return Object.assign({ pick: r.confidence !== 'low' }, r); });
      AI.drawMsg = AI.drawRows.length ? AI.drawRows.length + ' values read. Check each against the drawing before applying.' : 'No supported values were found on the drawing.';
    } catch (e) { AI.drawMsg = why(e); }
    AI.drawBusy = false; U.paint();
  }

  U.RENDER.assistant = function () {
    var h = '<div><h1 class="h1">AI assistant ' + U.tag('exp') + '</h1><p class="lede">Ask about the model and its results. The assistant reads the deterministic results through page tools; it does not calculate, and it can only propose input changes for you to apply.</p></div>';
    if (AI.sample === undefined) return h + '<div class="empty">Connecting to Claude…</div>';
    if (!AI.sample) return h + '<div class="empty">The assistant needs Claude, which is available when this page is opened in Claude. Everything else in the application works without it.</div>';
    h += '<div class="grid2" style="align-items:start"><section class="card"><h3>Conversation</h3><div class="chat" id="ai-chat">' + (AI.turns.length ? '' : '<div class="msg sys">Try one of the questions below.</div>') + AI.turns.map(function (t) { return '<div class="msg ' + (t.role === 'user' ? 'u' : 'a') + '">' + esc(t.content) + '</div>'; }).join('') + (AI.busy ? '<div class="msg a" id="ai-live">' + esc(AI.live) + '</div>' : '') + '</div>' +
      '<div class="row">' + ['Which check governs the design and by how much?', 'Why does the edge girder carry more moment than the internal girders?', 'Is transfer stress a problem? Suggest one change to fix it.', 'Summarise the results for a design review.'].map(function (q) { return '<button class="btn ghost" data-act="ai-q" data-q="' + esc(q) + '"' + (AI.busy ? ' disabled' : '') + '>' + esc(q) + '</button>'; }).join('') + '</div>' +
      '<label for="ai-in" class="note">Your question</label><textarea class="ask" id="ai-in" placeholder="Ask about loads, results or checks"></textarea><div class="row"><button class="btn pri" data-act="ai-send"' + (AI.busy ? ' disabled' : '') + '>Ask</button>' + (AI.busy ? '<button class="btn" data-act="ai-stop">Stop</button>' : '') + '<button class="btn ghost" data-act="ai-clear"' + (AI.busy ? ' disabled' : '') + '>Clear conversation</button><span class="note">Each question uses your Claude usage.</span></div></section>';
    h += '<section class="card"><h3>Proposed changes <span class="sub">from the assistant; nothing changes until you apply it</span></h3>' + (AI.props.length ? '<div class="tbox"><table class="t"><thead><tr><th>Input</th><th>Now</th><th>Proposed</th><th>Reason</th><th></th></tr></thead><tbody>' + AI.props.map(function (q, i) { return '<tr><td class="mono">' + esc(q.path) + '</td><td class="n">' + esc(q.from) + '</td><td class="n"><b>' + esc(q.value) + '</b></td><td class="note">' + esc(q.reason) + '</td><td>' + (q.state === 'open' ? '<button class="btn pri" data-act="ai-apply" data-i="' + i + '">Apply</button> <button class="btn ghost" data-act="ai-dismiss" data-i="' + i + '">Dismiss</button>' : '<span class="note">' + q.state + '</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="note">None yet.</p>') + '</section></div>';
    h += '<section class="card"><h3>Drawing interpretation ' + U.tag('exp') + '<span class="sub">read key dimensions from an image of a general-arrangement drawing</span></h3>' + (AI.images ? '<div class="row"><input type="file" id="ai-file" accept="image/png,image/jpeg,image/webp" aria-label="Drawing image"><button class="btn pri" data-act="ai-draw"' + (AI.draw && !AI.drawBusy ? '' : ' disabled') + '>Read drawing</button><span class="note">' + esc(AI.drawMsg) + '</span></div>' +
      (AI.drawRows && AI.drawRows.length ? '<div class="tbox"><table class="t"><thead><tr><th>Apply</th><th>Input</th><th>Value read</th><th>Current</th><th>Text on the drawing</th><th>Confidence</th></tr></thead><tbody>' + AI.drawRows.map(function (r, i) { return '<tr><td><input type="checkbox" data-act="ai-dpick" data-i="' + i + '"' + (r.pick ? ' checked' : '') + ' aria-label="Apply ' + esc(r.field) + '"></td><td class="mono">' + esc(r.field) + '</td><td class="n"><b>' + esc(Array.isArray(r.value) ? r.value.join(', ') : r.value) + '</b> ' + esc(r.unit || '') + '</td><td class="n">' + esc(U.get(r.field)) + '</td><td class="mono note">' + esc(r.quote) + '</td><td>' + esc(r.confidence) + '</td></tr>'; }).join('') + '</tbody></table></div><div class="row"><button class="btn pri" data-act="ai-dapply">Apply selected values</button><span class="note">Applied values are AI-read: confirm each one against the drawing. This replaces no other input.</span></div>' : '') : '<p class="note">Image input is not available in this view.</p>') + '</section>';
    return h;
  };
  U.AFTER.assistant = function () {
    var c = U.$('#ai-chat'); if (c) c.scrollTop = c.scrollHeight;
    var fi = U.$('#ai-file'); if (fi) fi.addEventListener('change', function () { AI.draw = fi.files[0] || null; AI.drawRows = null; AI.drawMsg = AI.draw ? AI.draw.name + ' ready' : ''; U.paint(); });
    var ta = U.$('#ai-in'); if (ta) ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ask(ta.value); } });
  };
  U.ACT['ai-q'] = function (a) { ask(a.getAttribute('data-q')); };
  U.ACT['ai-send'] = function () { var t = U.$('#ai-in'); ask(t ? t.value : ''); };
  U.ACT['ai-stop'] = function () { if (AI.ctl) AI.ctl.abort(); };
  U.ACT['ai-clear'] = function () { AI.turns = []; U.paint(); };
  U.ACT['ai-apply'] = function (a) { var q = AI.props[+a.getAttribute('data-i')]; U.set(q.path, q.value); q.state = 'applied'; U.changed(); };
  U.ACT['ai-dismiss'] = function (a) { AI.props[+a.getAttribute('data-i')].state = 'dismissed'; U.paint(); };
  U.ACT['ai-draw'] = function () { readDrawing(); };
  U.ACT['ai-dpick'] = function (a) { AI.drawRows[+a.getAttribute('data-i')].pick = a.checked; };
  U.ACT['ai-dapply'] = function () {
    var n = 0; AI.drawRows.forEach(function (r) { if (!r.pick) return; var v = r.field === 'spans' ? [].concat(r.value).map(Number).filter(function (x) { return x > 0; }) : r.field === 'girder' ? String(r.value) : Number(r.value); if ((r.field === 'girder' && !SECLIB.SEC[v]) || (r.field === 'spans' && !v.length) || (typeof v === 'number' && !isFinite(v))) return; U.set(r.field, v); ST.history.push({ t: Date.now(), what: 'AI-read value applied: ' + r.field + ' = ' + v + ' ("' + r.quote + '")' }); n++; });
    U.toast(n + ' value' + (n === 1 ? '' : 's') + ' applied from the drawing'); U.changed();
  };

  /* ---------- optimisation and sensitivity (deterministic engines; the grillage result is reused) ---------- */
  var OP = { busy: false, opt: null, sens: null, msg: '' };
  function evalStrands(strands, girders, pOver) {
    var p = Object.assign(U.deep(ST.p), pOver || {}); p.strands = strands; var A = U.A(), worst = { u: 0 }, by = {};
    girders.forEach(function (gs) { var D = ANALYSIS.design(p, A, U.TPL, gs[1], gs[0]), ck = ANALYSIS.checks(p, A, D, Object.assign({}, ST.lim, { tLive: ST.lim.tLive * Math.sqrt(p.fcG), gi: gs[1], sk: gs[0] }));
      ck.forEach(function (c) { if (c.ok === null || c.u === null) return; var u = isFinite(c.u) ? c.u : 99; if (!by[c.grp] || u > by[c.grp]) by[c.grp] = u; if (u > worst.u) worst = { u: u, name: c.name, g: gs }; }); });
    return { worst: worst, by: by, pass: worst.u <= 1 };
  }
  function allGirders() { var A = U.A(), o = []; A.g.spans.forEach(function (_, k) { for (var i = 0; i < A.g.ng; i++) o.push([k, i]); }); return o; }
  var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
  async function optimise() {
    if (!U.fresh(['analysis', 'combos'])) { U.toast('Run the analysis first'); return; }
    OP.busy = true; OP.opt = null; var H = CORE.sections(ST.p, CORE.geometry(ST.p)).H, base = U.deep(ST.p.strands), gl = allGirders(), rows = [];
    var order = base.map(function (q, i) { return [q, i]; }).filter(function (x) { return x[0].on && x[0].y < H / 2 && x[0].x > 0; }).sort(function (a, b) { return b[0].y - a[0].y || b[0].x - a[0].x; });
    var cur = U.deep(base), fails = 0;
    for (var step = 0; step <= order.length; step++) {
      if (step > 0) { var q = order[step - 1][0]; cur.forEach(function (s) { if (s.y === q.y && Math.abs(s.x) === q.x) s.on = false; }); }
      OP.msg = 'Evaluating ' + cur.filter(function (s) { return s.on; }).length + ' strands on ' + gl.length + ' girders'; U.paint(); await tick();
      var r = evalStrands(U.deep(cur), gl); rows.push({ n: cur.filter(function (s) { return s.on; }).length, r: r, strands: U.deep(cur) });
      if (!r.pass) { if (++fails >= 2) break; } else fails = 0;
    }
    var ok = rows.filter(function (x) { return x.r.pass; }), best = ok.reduce(function (b, x) { return !b || x.n < b.n ? x : b; }, null);
    OP.opt = { rows: rows, best: best, at: U.ORDER.map(function (n) { return ST.R[n] ? ST.R[n].id : 0; }).join(',') }; OP.busy = false; OP.msg = ''; U.paint();
  }
  var SENS = [['fcG', "Girder f'c", 0.1, 'MPa'], ['fcT', "Transfer f'cp", 0.1, 'MPa'], ['jack', 'Jacking stress / MBL', 0.05, ''], ['fitS', 'Ligature spacing', 0.25, 'mm'], ['stage.pour', 'Deck pour age', 0.5, 'days'], ['dg', 'Aggregate size', 0.25, 'mm']];
  async function sensitivity() {
    if (!U.fresh(['analysis', 'combos'])) { U.toast('Run the analysis first'); return; }
    OP.busy = true; OP.sens = null; var d = U.digest(), gs = d.worst ? [[d.worst.sk, d.worst.gi]] : [[ST.sel.sk, ST.sel.gi]], base = evalStrands(U.deep(ST.p.strands), gs), out = [];
    for (var i = 0; i < SENS.length; i++) {
      var s = SENS[i], v0 = U.get(s[0]), res = [];
      for (var sg = -1; sg <= 1; sg += 2) {
        OP.msg = 'Varying ' + s[1]; U.paint(); await tick();
        var o = {}, v = s[0] === 'jack' ? +(v0 + sg * s[2]).toFixed(3) : v0 * (1 + sg * s[2]);
        if (s[0].indexOf('.') > 0) { var st = U.deep(ST.p.stage); st[s[0].split('.')[1]] = v; o.stage = st; } else o[s[0]] = v;
        res.push({ v: v, r: evalStrands(U.deep(ST.p.strands), gs, o) });
      }
      out.push({ s: s, v0: v0, lo: res[0], hi: res[1] });
    }
    OP.sens = { base: base, out: out, g: gs[0], at: U.ORDER.map(function (n) { return ST.R[n] ? ST.R[n].id : 0; }).join(',') }; OP.busy = false; OP.msg = ''; U.paint();
  }
  U.RENDER.optimise = function () {
    var at = U.ORDER.map(function (n) { return ST.R[n] ? ST.R[n].id : 0; }).join(','), ready = U.fresh(['analysis', 'combos']);
    var h = '<div><h1 class="h1">Optimisation and sensitivity ' + U.tag('exp') + '</h1><p class="lede">Deterministic searches that re-run the losses, transfer and strength engines on every girder while reusing the grillage results (strands do not change the grillage stiffness in this model). Use them to explore; confirm any change with a full run.</p></div>';
    if (!ready) h += U.staleBox(['analysis', 'combos'], 'analysis results the searches need');
    h += '<section class="card"><h3>Minimum strands that pass every check</h3><p class="note">Removes mirrored pairs of bottom-flange strands, highest row and outermost first, from the current pattern, and stops after two failing steps. Debonding is kept.</p><div class="row"><button class="btn pri" data-act="op-run"' + (OP.busy || !ready ? ' disabled' : '') + '>Search strand count</button><span class="prog">' + esc(OP.msg) + '</span></div>';
    if (OP.opt) {
      var o = OP.opt, old = o.at !== at;
      h += (old ? '<div class="stalebox">Inputs or results changed since this search. Search again for current numbers.</div>' : '') + '<div class="' + (old ? 'is-stale' : '') + '"><div class="grid2"><div class="plotwrap-host">' + U.chart({ series: [{ name: 'highest utilisation', pts: o.rows.map(function (x) { return [x.n, x.r.worst.u]; }), dots: 1 }], hlines: [{ y: 1, label: 'limit' }], xl: 'number of strands', yl: 'highest utilisation', h: 220, xfmt: function (v) { return Number.isInteger(v) ? String(v) : ''; } }) + '</div>' +
        '<div class="tbox"><table class="t"><thead><tr><th class="n">Strands</th><th class="n">Highest u</th><th>Governing check</th><th>Status</th></tr></thead><tbody>' + o.rows.map(function (x) { return '<tr' + (o.best && x.n === o.best.n ? ' class="sel"' : '') + '><td class="n">' + x.n + '</td><td class="n">' + x.r.worst.u.toFixed(2) + '</td><td class="note">' + esc((x.r.worst.name || '').replace(/\s*\(.*?\)/g, '')) + ' (G' + ((x.r.worst.g || [0, 0])[1] + 1) + ')</td><td>' + U.stat(x.r.pass) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
        (o.best ? '<div class="row"><b>' + o.best.n + ' strands</b><span class="note">pass every computed check on every girder (highest utilisation ' + o.best.r.worst.u.toFixed(2) + ').</span><button class="btn pri" data-act="op-apply"' + (old ? ' disabled' : '') + '>Use this layout</button></div>' : '<p class="note">No layout in the search passes every check. Change the section, concrete strength or debonding and search again.</p>') + '</div>';
    }
    h += '</section><section class="card"><h3>Sensitivity of the governing girder</h3><p class="note">Each design parameter moved down and up by the step shown; bars show the highest utilisation of the governing girder. Concrete strength changes are applied to the section engines only (the grillage is not re-solved).</p><div class="row"><button class="btn pri" data-act="op-sens"' + (OP.busy || !ready ? ' disabled' : '') + '>Run sensitivity</button></div>';
    if (OP.sens) {
      var S = OP.sens, b0 = S.base.worst.u, mx = Math.max.apply(null, S.out.map(function (x) { return Math.max(Math.abs(x.lo.r.worst.u - b0), Math.abs(x.hi.r.worst.u - b0)); })) || 0.01, old2 = S.at !== at;
      h += (old2 ? '<div class="stalebox">Inputs or results changed since this run.</div>' : '') + '<div class="' + (old2 ? 'is-stale' : '') + '"><p class="note">Governing girder G' + (S.g[1] + 1) + (CORE.geometry(ST.p).spans.length > 1 ? ', span ' + (S.g[0] + 1) : '') + '; base highest utilisation ' + b0.toFixed(3) + ' (' + esc((S.base.worst.name || '').replace(/\s*\(.*?\)/g, '')) + ').</p><div class="tbox"><table class="t"><thead><tr><th>Parameter</th><th class="n">Low</th><th class="n">u</th><th style="min-width:220px">Change in highest utilisation</th><th class="n">u</th><th class="n">High</th></tr></thead><tbody>' +
        S.out.map(function (x) { var dl = x.lo.r.worst.u - b0, dh = x.hi.r.worst.u - b0, bar = function (dv) { var w = Math.abs(dv) / mx * 50; return '<i style="position:absolute;top:2px;bottom:2px;' + (dv < 0 ? 'right:50%' : 'left:50%') + ';width:' + w + '%;background:' + (dv > 0 ? 'var(--bad)' : 'var(--ok)') + ';opacity:.75;border-radius:2px"></i>'; };
          return '<tr><td>' + esc(x.s[1]) + ' <span class="note">(' + esc(x.v0) + ' ' + esc(x.s[3]) + ')</span></td><td class="n">' + f(x.lo.v, x.s[0] === 'jack' ? 2 : 0) + '</td><td class="n">' + x.lo.r.worst.u.toFixed(3) + '</td><td><div style="position:relative;height:16px;background:var(--line2);border-radius:3px">' + bar(dl) + bar(dh) + '<b style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--ink)"></b></div></td><td class="n">' + x.hi.r.worst.u.toFixed(3) + '</td><td class="n">' + f(x.hi.v, x.s[0] === 'jack' ? 2 : 0) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="note">Red: utilisation rises; green: it falls. The bars for the low and high values are drawn over each other.</p></div>';
    }
    return h + '</section>';
  };
  U.ACT['op-run'] = function () { optimise(); };
  U.ACT['op-sens'] = function () { sensitivity(); };
  U.ACT['op-apply'] = function () { ST.p.strands = U.deep(OP.opt.best.strands); ST.history.push({ t: Date.now(), what: 'Applied optimised strand layout (' + OP.opt.best.n + ' strands)' }); U.toast('Strand layout applied; the design is now out of date'); U.changed(); };
})();
