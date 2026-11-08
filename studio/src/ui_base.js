/* ===== Bridge Studio UI: state, calculation dependency graph, runner (Web Worker), DOM and chart helpers ===== */
var U = {};
(function () {
  'use strict';
  var esc = U.esc = function (s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.f = function (v, d) { if (v === null || v === undefined || !isFinite(v)) return '–'; return Number(v).toLocaleString('en-AU', { minimumFractionDigits: d === undefined ? 0 : d, maximumFractionDigits: d === undefined ? 0 : d }); };
  U.deep = CORE.deep;

  /* ---------- application state ---------- */
  var LIM0 = { tPerm: 0, tLive: 0.25, cS: 0.5, cT: 0.6, tT: 0.5, defl: 600, jackMax: 0.8, dbT: 25, dbR: 40, cover: 45 };
  var ST = U.ST = { caseId: 'cs01', p: null, cases: null, combos: null, lim: null, tab: 'overview', sel: { gi: 0, sk: 0, src: 'ULS-1', kind: 'M', strand: null },
    R: { analysis: null, combos: null, design: null, piles: null }, running: null, log: '', auto: false, nid: 1, history: [] };
  U.TPL = null;   /* losses-engine template (set by the build) */
  U.loadCase = function (id) {
    var c = CORE.CASES[id]; ST.caseId = id; ST.p = U.deep(c.p); ST.cases = U.deep(CORE.CASES_DEF); ST.combos = CORE.defaultCombos(); ST.lim = U.deep(LIM0);
    ST.R = { analysis: null, combos: null, design: null, piles: null }; ST.sel.gi = 0; ST.sel.sk = 0; ST.sel.src = 'ULS-1'; ST.sel.strand = null;
    ST.history.push({ t: Date.now(), what: 'Loaded ' + c.name + ' (' + c.title + ')' });
  };

  /* ---------- dependency graph: a result keeps the stamp of every input group and upstream result it used ---------- */
  var GRP = U.GRP = Object.assign({}, CORE.GROUPS, { checks: 'Check limits' });
  U.DEP = {
    analysis: { label: 'Grillage analysis', short: 'Analysis', needs: ['geometry', 'section', 'material', 'mesh', 'loads'], up: [] },
    combos: { label: 'Load combinations', short: 'Combinations', needs: ['combos'], up: ['analysis'] },
    design: { label: 'Super-T design', short: 'Design', needs: ['prestress', 'detailing', 'checks'], up: ['combos'] },
    piles: { label: 'Pile design', short: 'Piles', needs: ['substructure'], up: ['combos'] }
  };
  U.ORDER = ['analysis', 'combos', 'design', 'piles'];
  U.stamps = function () {
    var o = {}; Object.keys(CORE.GROUPS).forEach(function (g) { o[g] = CORE.stamp(ST.p, [g]); });
    o.loads += JSON.stringify(ST.cases.map(function (c) { return [c.id, c.on]; }));
    o.combos = JSON.stringify(ST.combos); o.checks = JSON.stringify(ST.lim); return o;
  };
  U.status = function (node) {   /* {s: 'cur' | 'out' | 'none' | 'run', why: [...]} */
    if (ST.running === node) return { s: 'run', why: [] };
    var r = ST.R[node]; if (!r) return { s: 'none', why: ['not run yet'] };
    var cur = U.stamps(), why = [];
    U.DEP[node].needs.forEach(function (g) { if (r.st[g] !== cur[g]) why.push(GRP[g] + ' changed'); });
    U.DEP[node].up.forEach(function (u) { var ur = ST.R[u], us = U.status(u); if (!ur || ur.id !== r.up[u] || us.s !== 'cur') why.push(U.DEP[u].short + ' ' + (us.s === 'cur' ? 'was re-run' : 'is out of date')); });
    return { s: why.length ? 'out' : 'cur', why: why };
  };
  U.ok = function (node) { return U.status(node).s === 'cur'; };
  function keep(node, data, ms) {
    var st = U.stamps(), r = { id: ST.nid++, st: {}, up: {}, data: data, at: new Date(), ms: ms };
    U.DEP[node].needs.forEach(function (g) { r.st[g] = st[g]; });
    U.DEP[node].up.forEach(function (u) { r.up[u] = ST.R[u].id; });
    ST.R[node] = r; ST.history.push({ t: Date.now(), what: U.DEP[node].label + ' run (' + U.f(ms) + ' ms)' });
  }
  U.A = function () { var a = ST.R.analysis, c = ST.R.combos; if (!a || !c) return null; return Object.assign({}, a.data, { CB: c.data }); };

  /* ---------- runner: the grillage analysis in a Web Worker (main-thread fallback), then the quick steps ---------- */
  var worker = null, workerOK = true;
  function analyse(p, cases, combos, log) {
    return new Promise(function (res, rej) {
      if (workerOK && typeof Worker !== 'undefined') {
        try {
          if (!worker) {
            var src = document.getElementById('bs-engines').textContent + '\nself.onmessage=function(e){try{var d=e.data,A=ANALYSIS.run(d.p,d.cases,d.combos,function(s){self.postMessage({log:s})});self.postMessage({done:1,V:A.V,env:A.env,ms:A.ms,nd:A.nd})}catch(err){self.postMessage({err:String(err&&err.message||err)})}};';
            worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
          }
          var t = setTimeout(function () { worker.onmessage = null; workerOK = false; worker.terminate(); worker = null; analyse(p, cases, combos, log).then(res, rej); }, 120000);
          worker.onerror = function (e) { clearTimeout(t); e.preventDefault && e.preventDefault(); workerOK = false; worker = null; analyse(p, cases, combos, log).then(res, rej); };
          worker.onmessage = function (e) { var d = e.data; if (d.log) { log(d.log); return; } clearTimeout(t); if (d.err) rej(new Error(d.err)); else res(d); };
          worker.postMessage({ p: p, cases: cases, combos: combos });
          return;
        } catch (e) { workerOK = false; worker = null; }
      }
      log('Running on the page (background worker unavailable)');
      setTimeout(function () { try { var A = ANALYSIS.run(p, cases, combos, log); res({ V: A.V, env: A.env, ms: A.ms, nd: A.nd }); } catch (e) { rej(e); } }, 40);
    });
  }
  var tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
  U.run = async function (only) {
    if (ST.running) return;
    var p = U.deep(ST.p), todo = U.ORDER.filter(function (n) { return !U.ok(n) && (!only || only.indexOf(n) >= 0); });
    try {
      for (var q = 0; q < todo.length; q++) {
        var node = todo[q]; ST.running = node; ST.log = U.DEP[node].label + '…'; U.paint(); await tick();
        var t0 = performance.now();
        if (node === 'analysis') {
          var d = await analyse(p, ST.cases, ST.combos, function (s) { ST.log = s; U.paintDeps(); });
          var g = CORE.geometry(p), sc = CORE.sections(p, g), m = CORE.mesh(p, g, sc), RS = CORE.responses(m);
          keep('analysis', { p: p, g: g, sc: sc, m: m, RS: RS, V: d.V, env: d.env, ms: d.ms, nd: d.nd, cases: U.deep(ST.cases) }, d.ms);
        } else if (node === 'combos') {
          var a = ST.R.analysis.data; keep('combos', ANALYSIS.combine(a.V, ST.combos, ST.cases, a.RS.R.length), performance.now() - t0);
        } else if (node === 'design') {
          var A = U.A(), D = [], CK = [], lim = ST.lim;
          for (var sk = 0; sk < A.g.spans.length; sk++) {
            D.push([]); CK.push([]);
            for (var gi = 0; gi < A.g.ng; gi++) {
              ST.log = 'Super-T design: span ' + (sk + 1) + ', girder G' + (gi + 1); U.paintDeps(); await tick();
              try { var dd = ANALYSIS.design(p, A, U.TPL, gi, sk); D[sk].push(dd); CK[sk].push(ANALYSIS.checks(p, A, dd, Object.assign({}, lim, { tLive: lim.tLive * Math.sqrt(p.fcG), gi: gi, sk: sk }))); }
              catch (e) { D[sk].push({ err: e.message }); CK[sk].push([]); }
            }
          }
          keep('design', { D: D, CK: CK }, performance.now() - t0);
        } else if (node === 'piles') {
          var A2 = U.A(); keep('piles', { A: ANALYSIS.piles(p, A2, 'A'), B: ANALYSIS.piles(p, A2, 'B') }, performance.now() - t0);
        }
      }
      ST.log = '';
    } catch (e) { ST.log = 'Run failed: ' + e.message; console.error(e); }
    ST.running = null; U.paint();
  };

  /* ---------- input fields (one function, so every edit marks results stale the same way) ---------- */
  U.fld = function (path, label, unit, o) {
    o = o || {}; var v = U.get(path), id = 'f-' + path.replace(/[^a-z0-9]/gi, '_'), grp = CORE.FIELD[path.split('.')[0]] || o.grp;
    var inp = o.options ? '<select id="' + id + '" data-path="' + esc(path) + '"' + (o.num ? ' data-num="1"' : '') + '>' + o.options.map(function (x) { var val = Array.isArray(x) ? x[0] : x, lab = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(lab) + '</option>'; }).join('') + '</select>'
      : '<input id="' + id + '" data-path="' + esc(path) + '" type="' + (o.text ? 'text' : 'number') + '" value="' + esc(o.text && Array.isArray(v) ? v.join(', ') : v) + '"' + (o.step ? ' step="' + o.step + '"' : ' step="any"') + (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + (o.text ? ' data-list="1"' : '') + '>';
    return '<div class="fld" title="' + esc(o.tip || (grp ? 'Input group: ' + (GRP[grp] || grp) : '')) + '"><label for="' + id + '">' + esc(label) + (unit ? '<span class="u">' + esc(unit) + '</span>' : '') + '</label>' + inp + '</div>';
  };
  U.get = function (path) { return path.split('.').reduce(function (o, k) { return o === undefined ? undefined : o[k]; }, path.indexOf('lim.') === 0 ? ST : ST.p) ; };
  U.set = function (path, v) {
    var root = path.indexOf('lim.') === 0 ? ST : ST.p, ks = path.split('.'), o = root;
    for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
    if (path === 'girder') { ST.p.strands = CORE.strandDefault(v); ST.sel.strand = null; }
    ST.history.push({ t: Date.now(), what: 'Set ' + path + ' = ' + (Array.isArray(v) ? v.join(', ') : v) });
  };
  document.addEventListener('change', function (e) {
    var t = e.target, path = t.getAttribute && t.getAttribute('data-path'); if (!path) return;
    var v = t.value;
    if (t.getAttribute('data-list')) { v = v.split(/[,\s+]+/).map(Number).filter(function (x) { return isFinite(x) && x > 0; }); if (!v.length) { U.toast('Enter at least one span length in metres, separated by commas'); U.paint(); return; } }
    else if (t.type === 'number' || t.getAttribute('data-num')) { v = Number(v); if (!isFinite(v)) { U.toast('Enter a number'); U.paint(); return; } if (t.min !== '' && v < Number(t.min)) v = Number(t.min); if (t.max !== '' && v > Number(t.max)) v = Number(t.max); }
    if (v === 'true') v = true; else if (v === 'false') v = false;
    U.set(path, v); U.changed();
  });
  U.changed = function () { if (ST.auto) { var quick = U.ORDER.filter(function (n) { return n !== 'analysis'; }); if (U.ok('analysis')) setTimeout(function () { U.run(quick); }, 0); } U.paint(); };

  /* ---------- toast ---------- */
  U.toast = function (msg) { var t = U.$('#bs-toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(U._tt); U._tt = setTimeout(function () { t.hidden = true; }, 3800); };

  /* ---------- stale banner for a tab section ---------- */
  U.staleBox = function (nodes, what) {
    var bad = nodes.map(function (n) { return [n, U.status(n)]; }).filter(function (x) { return x[1].s !== 'cur'; });
    if (!bad.length) return '';
    var none = bad.some(function (x) { return x[1].s === 'none'; }), run = bad.some(function (x) { return x[1].s === 'run'; });
    var why = bad.map(function (x) { return '<b>' + esc(U.DEP[x[0]].short) + '</b>: ' + esc(x[1].why.join(', ')); }).join(' · ');
    return '<div class="stalebox" role="status">' + (run ? '<span class="prog">Running: ' + esc(ST.log) + '</span>' : (none ? 'No current results for ' + esc(what) + '. ' : 'These ' + esc(what) + ' are out of date and shown greyed. ') + why +
      ' <button class="btn pri" data-act="run">Run stale steps</button>') + '</div>';
  };
  U.fresh = function (nodes) { return nodes.every(U.ok); };

  /* ---------- SVG chart (lines, envelopes) with hover readout ---------- */
  U.ticks = function (a, b, n) {
    if (!(b > a)) { b = a + 1; }
    var span = b - a, step = Math.pow(10, Math.floor(Math.log10(span / (n || 5)))), err = span / (n || 5) / step;
    step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var t = [], s0 = Math.ceil(a / step - 1e-9) * step; for (var v = s0; v <= b + step * 1e-6; v += step) t.push(Math.abs(v) < step * 1e-9 ? 0 : v); return { t: t, step: step };
  };
  U.SER = ['var(--acc)', 'var(--load)', '#8a52c7', 'var(--ok)', 'var(--bad)', 'var(--mut)'];
  U.chart = function (o) {   /* o: {series: [{name, color, pts: [[x, y]], dash, fill, dots}], xl, yl, w, h, flip, hlines: [{y, label, color}], vlines, yfmt} */
    var W = o.w || 640, H = o.h || 240, L = 56, R = 14, T = o.title ? 26 : 12, B = 36, xs = [], ys = [];
    o.series.forEach(function (s) { s.pts.forEach(function (p) { if (p[1] !== null && isFinite(p[1])) { xs.push(p[0]); ys.push(p[1]); } }); });
    (o.hlines || []).forEach(function (h) { ys.push(h.y); });
    if (!xs.length) return '<div class="empty">No data to plot.</div>';
    var x0 = o.xmin !== undefined ? o.xmin : Math.min.apply(null, xs), x1 = o.xmax !== undefined ? o.xmax : Math.max.apply(null, xs), y0 = Math.min(0, Math.min.apply(null, ys)), y1 = Math.max(0, Math.max.apply(null, ys));
    var pad = (y1 - y0) * 0.08 || 1; y0 -= (y0 < 0 ? pad : 0); y1 += pad;
    var tx = U.ticks(x0, x1, 8), ty = U.ticks(y0, y1, 5); y0 = Math.min(y0, ty.t[0]); y1 = Math.max(y1, ty.t[ty.t.length - 1]);
    var X = function (x) { return L + (x - x0) / (x1 - x0 || 1) * (W - L - R); }, Y = function (y) { var f = (y - y0) / (y1 - y0 || 1); return o.flip ? T + f * (H - T - B) : H - B - f * (H - T - B); };
    var yf = o.yfmt || function (v) { return U.f(v, Math.abs(ty.step) < 1 ? (Math.abs(ty.step) < 0.1 ? 2 : 1) : 0); };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || o.yl || 'chart') + '">';
    if (o.title) s += '<text class="ttl" x="' + L + '" y="16">' + esc(o.title) + '</text>';
    ty.t.forEach(function (v) { s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end">' + yf(v) + '</text>'; });
    tx.t.forEach(function (v) { s += '<text x="' + X(v) + '" y="' + (H - B + 15) + '" text-anchor="middle">' + (o.xfmt ? o.xfmt(v) : U.f(v, tx.step < 1 ? 1 : 0)) + '</text>'; });
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
    if (o.xl) s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(o.xl) + '</text>';
    if (o.yl) s += '<text x="12" y="' + ((T + H - B) / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + ((T + H - B) / 2) + ')">' + esc(o.yl) + '</text>';
    (o.vlines || []).forEach(function (v) { s += '<line x1="' + X(v.x) + '" x2="' + X(v.x) + '" y1="' + T + '" y2="' + (H - B) + '" style="stroke:' + (v.color || 'var(--axis)') + ';stroke-dasharray:3 3"/>' + (v.label ? '<text x="' + (X(v.x) + 3) + '" y="' + (T + 10) + '">' + esc(v.label) + '</text>' : ''); });
    (o.hlines || []).forEach(function (h) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(h.y) + '" y2="' + Y(h.y) + '" style="stroke:' + (h.color || 'var(--bad)') + ';stroke-dasharray:5 4"/><text x="' + (W - R - 4) + '" y="' + (Y(h.y) - 4) + '" text-anchor="end" style="fill:' + (h.color || 'var(--bad)') + '">' + esc(h.label || '') + '</text>'; });
    o.series.forEach(function (sr, k) {
      var c = sr.color || U.SER[k % U.SER.length], pts = sr.pts.filter(function (p) { return p[1] !== null && isFinite(p[1]); });
      if (!pts.length) return;
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
      if (sr.fill) s += '<path d="' + d + 'L' + X(pts[pts.length - 1][0]).toFixed(1) + ' ' + Y(0) + 'L' + X(pts[0][0]).toFixed(1) + ' ' + Y(0) + 'Z" style="fill:' + c + ';opacity:.12;stroke:none"/>';
      s += '<path d="' + d + '" style="fill:none;stroke:' + c + ';stroke-width:' + (sr.w || 2) + (sr.dash ? ';stroke-dasharray:' + sr.dash : '') + '"/>';
      if (sr.dots) pts.forEach(function (p) { s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3" style="fill:' + c + '"/>'; });
    });
    s += '<rect class="hov" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" style="fill:transparent"/><line class="cur" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" style="stroke:var(--ink);opacity:0;stroke-width:1"/></svg>';
    var id = 'c' + Math.random().toString(36).slice(2, 8);
    U._charts[id] = { o: o, X: X, x0: x0, x1: x1, L: L, R: R, W: W, unit: o.unit || '' };
    var leg = o.series.length > 1 ? '<div class="legend">' + o.series.map(function (sr, k) { return '<span><i style="background:' + (sr.color || U.SER[k % U.SER.length]) + '"></i>' + esc(sr.name) + '</span>'; }).join('') + '</div>' : '';
    return '<div class="plotwrap" data-chart="' + id + '">' + s + '<div class="tip" hidden></div></div>' + leg;
  };
  U._charts = {};
  document.addEventListener('mousemove', function (e) {
    var w = e.target.closest && e.target.closest('.plotwrap'); U.$$('.plotwrap .tip').forEach(function (t) { if (!w || !w.contains(t)) t.hidden = true; });
    if (!w) return; var c = U._charts[w.getAttribute('data-chart')], svg = w.querySelector('svg'); if (!c || !svg) return;
    var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * c.W, x = c.x0 + (px - c.L) / (c.W - c.L - c.R) * (c.x1 - c.x0), tip = w.querySelector('.tip'), ln = svg.querySelector('.cur');
    if (px < c.L || px > c.W - c.R) { tip.hidden = true; ln.style.opacity = 0; return; }
    var rows = c.o.series.map(function (sr) { var best = null; sr.pts.forEach(function (p) { if (p[1] !== null && isFinite(p[1]) && (!best || Math.abs(p[0] - x) < Math.abs(best[0] - x))) best = p; }); return best ? esc(sr.name) + ': ' + U.f(best[1], Math.abs(best[1]) < 10 ? 2 : 1) + ' ' + esc(c.unit) : ''; }).filter(Boolean);
    tip.innerHTML = (c.o.xl ? esc(c.o.xl.split(' (')[0]) + ' ' : 'x ') + U.f(x, 2) + '<br>' + rows.join('<br>'); tip.hidden = false;
    var tx = e.clientX - w.getBoundingClientRect().left + 12; tip.style.left = Math.min(tx, w.clientWidth - tip.offsetWidth - 4) + 'px'; tip.style.top = (e.clientY - w.getBoundingClientRect().top + 10) + 'px';
    ln.setAttribute('x1', c.X(x)); ln.setAttribute('x2', c.X(x)); ln.style.opacity = 0.35;
  });

  /* utilisation bar and status */
  U.ubar = function (u) { if (u === null || u === undefined || !isFinite(u)) return '<span class="st na">–</span>'; var w = Math.min(100, u * 100 / 1.25), cl = u > 1 ? 'b' : u > 0.9 ? 'w' : ''; return '<div class="row" style="gap:8px;flex-wrap:nowrap"><div class="ubar" title="utilisation ' + u.toFixed(3) + '"><i class="' + cl + '" style="width:' + w + '%"></i><b style="left:' + (100 / 1.25) + '%"></b></div><span class="num">' + u.toFixed(2) + '</span></div>'; };
  U.stat = function (ok) { return ok === null || ok === undefined ? '<span class="st na">info</span>' : ok ? '<span class="st ok">OK</span>' : '<span class="st ng">NG</span>'; };
  U.tag = function (k) { return { calc: '<span class="tg calc" title="Computed by the deterministic engines from the inputs shown">Calculated</span>', ill: '<span class="tg ill" title="Generic example input, not from any project">Illustrative input</span>', exp: '<span class="tg exp" title="Experimental feature; output needs engineering review">Experimental</span>', unv: '<span class="tg unv" title="Code coefficient transcribed into the platform standards inventory; not yet independently verified">Unverified coefficient</span>' }[k]; };
})();
