/* ===== Bridge Studio UI: Super-T girder design, Structural analysis, Engineering design checks ===== */
(function () {
  'use strict';
  var ST = U.ST, esc = U.esc, f = U.f;
  var DEB = [0, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000];
  var SM = { mode: 'toggle', sym: true };

  /* ---------- strand drawing (also used by the reports) ---------- */
  U.strandSVG = function (p, sc, opt) {
    opt = opt || {}; var P = sc.P, H = sc.H, t = p.slab, bw = CORE.geometry(p).s * 1000, half = Math.max(bw, sc.fw) / 2 + 80;
    var W = opt.w || 560, k = W / (2 * half), Hh = (H + t + 120) * k, X = function (x) { return W / 2 + x * k; }, Y = function (y) { return 20 + (H + t - y) * k; };
    var s = '<svg class="plot strand-svg" viewBox="0 0 ' + W + ' ' + (Hh + 50).toFixed(0) + '" role="img" aria-label="Super-T cross-section with strand layout"' + (opt.xmlns ? ' xmlns="http://www.w3.org/2000/svg"' : '') + '>';
    var ink = opt.print ? '#13202c' : 'var(--ink)', acc = opt.print ? '#0b7aa3' : 'var(--acc)', ld = opt.print ? '#b86b00' : 'var(--load)', mut = opt.print ? '#9aa7b3' : 'var(--axis)', bg = opt.print ? '#ffffff' : 'var(--panel)';
    s += '<rect x="' + X(-bw / 2) + '" y="' + Y(H + t) + '" width="' + (bw * k) + '" height="' + (t * k) + '" style="fill:' + mut + ';opacity:.25;stroke:' + mut + ';stroke-dasharray:4 3"/>';
    s += '<path d="' + P.map(function (q, i) { return (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join('') + 'Z" style="fill:' + mut + ';fill-opacity:.18;stroke:' + ink + ';stroke-width:1.4"/>';
    s += '<line x1="' + X(-half + 40) + '" x2="' + X(half - 40) + '" y1="' + Y(sc.yb) + '" y2="' + Y(sc.yb) + '" style="stroke:' + acc + ';stroke-dasharray:6 4;opacity:.7"/><text x="' + X(half - 40) + '" y="' + (Y(sc.yb) - 4) + '" text-anchor="end" style="fill:' + acc + '">centroid ' + f(sc.yb) + '</text>';
    var on = p.strands.filter(function (q) { return q.on; }); if (on.length) { var cg = on.reduce(function (a, q) { return a + q.y; }, 0) / on.length; s += '<line x1="' + X(-half + 40) + '" x2="' + X(half - 40) + '" y1="' + Y(cg) + '" y2="' + Y(cg) + '" style="stroke:' + ld + ';stroke-dasharray:2 3"/><text x="' + X(-half + 40) + '" y="' + (Y(cg) - 4) + '" style="fill:' + ld + '">strand centroid ' + f(cg) + ' (e = ' + f(sc.yb - cg) + ' mm)</text>'; }
    var r = Math.max(3.2, p.db / 2 * k * 1.3);
    p.strands.forEach(function (q, i) {
      var deb = (q.d || q.d2), sel = ST.sel.strand === i;
      s += '<circle ' + (opt.print ? '' : 'data-act="strand" data-k="' + i + '" tabindex="0" ') + 'cx="' + X(q.x).toFixed(1) + '" cy="' + Y(q.y).toFixed(1) + '" r="' + r.toFixed(1) + '" style="fill:' + (q.on ? (deb ? ld : acc) : bg) + ';stroke:' + (sel ? ink : q.on ? (deb ? ld : acc) : mut) + ';stroke-width:' + (sel ? 2.6 : 1.2) + '"><title>' + esc('x = ' + q.x + ', y = ' + q.y + ' mm' + (q.on ? (deb ? ', debonded ' + q.d + ' mm each end' : ', fully bonded') : ', not used')) + '</title></circle>';
    });
    s += '<text x="8" y="' + (Hh + 22).toFixed(0) + '">' + esc(p.girder + ', top flange ' + f(sc.fw) + ' mm, deck ' + t + ' mm on ' + f(bw) + ' mm') + '</text>';
    s += '<g transform="translate(8,' + (Hh + 30).toFixed(0) + ')"><circle cx="6" cy="8" r="5" style="fill:' + acc + '"/><text x="16" y="12">bonded</text><circle cx="76" cy="8" r="5" style="fill:' + ld + '"/><text x="86" y="12">debonded</text><circle cx="160" cy="8" r="5" style="fill:' + bg + ';stroke:' + mut + '"/><text x="170" y="12">not used</text></g>';
    return s + '</svg>';
  };
  U.strandStats = function (p, sc) {
    var on = p.strands.filter(function (q) { return q.on; }), s = HOG.STR[p.db] || [0, 0], cg = on.length ? on.reduce(function (a, q) { return a + q.y; }, 0) / on.length : 0, rows = {};
    on.forEach(function (q) { var o = rows[q.y] = rows[q.y] || { y: q.y, n: 0, d: 0 }; o.n++; if (q.d || q.d2) o.d++; });
    return { n: on.length, deb: on.filter(function (q) { return q.d || q.d2; }).length, Ap: on.length * s[0], cg: cg, e: sc.yb - cg, ec: sc.yc - cg, Pj: p.jack * s[1] * on.length, rows: Object.keys(rows).map(function (k) { return rows[k]; }).sort(function (a, b) { return a.y - b.y; }) };
  };

  /* ---------- 5. Super-T design ---------- */
  U.RENDER.design = function () {
    var p = ST.p, g = U.clampSel(), sc = CORE.sections(p, g), ss = U.strandStats(p, sc), q = ST.sel.strand !== null ? p.strands[ST.sel.strand] : null;
    var sec = SECLIB.SEC[p.girder];
    var h = '<div><h1 class="h1">Super-T girder design</h1><p class="lede">Section, materials and strands for every girder of the bridge (one strand pattern for all girders). The losses, transfer and strength engines run when you press Run.</p></div>';
    h += '<div class="row">' + U.selBox('sk', U.spanOpts(g.spans.length), 'Span') + U.selBox('gi', U.girderOpts(g.ng), 'Girder') + '</div>';
    h += '<div class="grid2"><section class="card"><h3>Section and materials ' + U.tag('ill') + '</h3><div class="form">' +
      U.fld('girder', 'Super-T section', '', { options: Object.keys(SECLIB.SEC) }) + U.fld('slab', 'Deck slab', 'mm', { min: 150, max: 300 }) + U.fld('gap', 'Gap between top flanges', 'mm', { min: 0, max: 400 }) +
      U.fld('fcG', "Girder f'c at 28 days", 'MPa', { options: [40, 50, 65, 80], num: true }) + U.fld('fcT', "Girder f'cp at transfer", 'MPa', { min: 25, max: 65 }) + U.fld('fcD', "Deck f'c", 'MPa', { options: [32, 40, 50], num: true }) +
      U.fld('db', 'Strand diameter', 'mm', { options: Object.keys(HOG.STR), num: true }) + U.fld('jack', 'Jacking stress / MBL', '', { min: 0.5, max: 0.85 }) +
      U.fld('stage.tau', 'Transfer age', 'days', { min: 1, max: 28 }) + U.fld('stage.pour', 'Deck pour age', 'days', { min: 14, max: 365 }) + U.fld('stage.sidlA', 'Superimposed dead load at', 'days', { min: 30, max: 1000 }) + U.fld('stage.final', 'Long-term age', 'days', { min: 365, max: 36500 }) +
      U.fld('fitD', 'Shear ligature diameter', 'mm', { options: [12, 16, 20], num: true }) + U.fld('fitLegs', 'Ligature legs per web', '', { min: 1, max: 4, step: 1 }) + U.fld('fitS', 'Ligature spacing', 'mm', { min: 75, max: 400 }) + U.fld('dg', 'Aggregate size', 'mm', { min: 10, max: 40 }) + '</div></section>';
    h += '<section class="card"><h3>Section properties ' + U.tag('calc') + '</h3><div class="tbox"><table class="t"><tbody>' +
      [['Depth H', f(sc.H), 'mm'], ['Top flange width', f(sc.fw), 'mm'], ['Area A', f(sc.A / 1e3, 1), '×10³ mm²'], ['Centroid above soffit yb', f(sc.yb, 1), 'mm'], ['Second moment I', f(sc.I / 1e9, 1), '×10⁹ mm⁴'], ['Ec girder / deck', f(sc.Eg) + ' / ' + f(sc.Ed), 'MPa'],
        ['Composite centroid yc', f(sc.yc, 1), 'mm'], ['Composite Ic', f(sc.Ic / 1e9, 1), '×10⁹ mm⁴'], ['Section moduli Zb / Zt', f(sc.Zb / 1e6) + ' / ' + f(sc.Zt / 1e6), '×10⁶ mm³'], ['Composite Zb / Zt girder / Zt deck', f(sc.Zcb / 1e6) + ' / ' + f(sc.Zct / 1e6) + ' / ' + f(sc.Zcd / 1e6), '×10⁶ mm³'], ['Torsion constant J (closed cell)', f(sc.J / 1e9, 1), '×10⁹ mm⁴'], ['Girder weight', f(sc.A * 1e-6 * p.gGirder, 2), 'kN/m']]
        .map(function (r) { return '<tr><td style="color:var(--mut)">' + r[0] + '</td><td class="n">' + r[1] + '</td><td class="note">' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div><p class="note">Outline from the standard Super-T shapes in the section library (' + esc(sec ? sec.t === 'T' ? 'open trough, ' + sec.R.length + '-point half outline' : '' : '') + ').</p></section></div>';
    /* strand layout */
    h += '<section class="card"><h3>Strand layout <span class="sub">' + (SM.mode === 'toggle' ? 'click a strand to add or remove it' : 'click a strand to select it, then set its debonding') + '</span></h3>' +
      '<div class="row"><div class="seg" role="group" aria-label="Click action"><button data-act="sm" data-k="mode" data-v="toggle" aria-pressed="' + (SM.mode === 'toggle') + '">Add / remove</button><button data-act="sm" data-k="mode" data-v="select" aria-pressed="' + (SM.mode === 'select') + '">Select for debonding</button></div>' +
      '<label class="row" style="gap:6px"><input type="checkbox" data-act="sm" data-k="sym"' + (SM.sym ? ' checked' : '') + '> Mirror about the centreline</label><button class="btn" data-act="st-all">All locations</button><button class="btn" data-act="st-def">Default pattern</button><button class="btn ghost" data-act="st-nodeb">Remove all debonding</button></div>' +
      '<div class="grid2" style="align-items:start"><div class="tbox" style="border:0">' + U.strandSVG(p, sc) + '</div><div style="display:grid;gap:10px">' +
      '<div class="kpis"><div class="kpi"><span class="l">Strands</span><span class="v">' + ss.n + '</span><span class="s">' + ss.deb + ' debonded</span></div><div class="kpi"><span class="l">Area Ap</span><span class="v">' + f(ss.Ap) + '<small>mm²</small></span><span class="s">' + p.db + ' mm strand</span></div><div class="kpi"><span class="l">Eccentricity</span><span class="v">' + f(ss.e) + '<small>mm</small></span><span class="s">composite ' + f(ss.ec) + ' mm</span></div><div class="kpi"><span class="l">Jacking force</span><span class="v">' + f(ss.Pj) + '<small>kN</small></span><span class="s">' + p.jack + ' × MBL</span></div></div>' +
      (q ? '<div class="card" style="box-shadow:none"><h3>Selected strand <span class="sub mono">x = ' + q.x + ', y = ' + q.y + ' mm</span></h3><div class="row"><label class="row" style="gap:6px"><input type="checkbox" data-act="st-on"' + (q.on ? ' checked' : '') + '> Used</label><label class="row" style="gap:6px">Debond each end <select class="sm" data-act="st-deb" id="st-deb">' + DEB.map(function (d) { return '<option value="' + d + '"' + ((q.d || 0) === d ? ' selected' : '') + '>' + (d ? d + ' mm' : 'none') + '</option>'; }).join('') + '</select></label></div></div>' : '<p class="note">Switch to "Select for debonding" and click a strand to set its debond length.</p>') +
      '<div class="tbox"><table class="t"><thead><tr><th class="n">Row height</th><th class="n">Strands</th><th class="n">Debonded</th><th class="n">Debonded %</th></tr></thead><tbody>' + ss.rows.map(function (r) { return '<tr><td class="n">' + r.y + ' mm</td><td class="n">' + r.n + '</td><td class="n">' + r.d + '</td><td class="n">' + f(100 * r.d / r.n) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div></section>';
    /* results */
    var fresh = U.fresh(['design']), DD = ST.R.design && ST.R.design.data.D[ST.sel.sk] && ST.R.design.data.D[ST.sel.sk][ST.sel.gi];
    h += '<div class="' + (fresh ? '' : 'is-stale') + '" style="display:grid;gap:14px">' + U.staleBox(['design'], 'girder design results');
    if (DD && !DD.err) {
      var mx = Math.max.apply(null, DD.transfer.along.map(function (s) { return s.x; })), sx = mx > 200 ? 1000 : 1;
      h += '<div class="kpis"><div class="kpi"><span class="l">Jacking force</span><span class="v">' + f(DD.Pi) + '<small>kN</small></span><span class="s">before losses</span></div><div class="kpi"><span class="l">After transfer</span><span class="v">' + f(DD.Ptr) + '<small>kN</small></span><span class="s">mid-span, ' + f(100 * (1 - DD.Ptr / DD.Pi), 1) + ' % loss</span></div><div class="kpi"><span class="l">Long term</span><span class="v">' + f(DD.Pfinal) + '<small>kN</small></span><span class="s">' + f(100 * (1 - DD.Pfinal / DD.Pi), 1) + ' % total loss</span></div><div class="kpi"><span class="l">Hog at deck pour</span><span class="v">' + f((DD.hog.filter(function (x) { return x.t <= p.stage.pour; }).pop() || {}).mid, 1) + '<small>mm</small></span><span class="s">long term ' + f(DD.hog[DD.hog.length - 1].mid, 1) + ' mm</span></div></div>';
      h += '<div class="grid2"><section class="card res"><h3>Camber (hog) at mid-span ' + U.tag('calc') + '</h3>' + U.chart({ series: [{ name: 'hog', pts: DD.hog.map(function (x) { return [Math.log10(Math.max(1, x.t)), x.mid]; }), dots: 1 }], xl: 'girder age (days, log scale)', yl: 'hog (mm, + up)', unit: 'mm', xfmt: function (v) { return f(Math.pow(10, v)); }, h: 220 }) +
        '<p class="note">Stages: ' + DD.hog.map(function (x) { return esc(x.label) + ' ' + f(x.mid, 1); }).join(' · ') + ' mm. Losses engine of the original dashboard.</p></section>';
      h += '<section class="card res"><h3>Stresses at transfer ' + U.tag('calc') + '</h3>' + U.chart({ series: [{ name: 'top fibre', pts: DD.transfer.along.map(function (s) { return [s.x / sx, s.top]; }) }, { name: 'bottom fibre', pts: DD.transfer.along.map(function (s) { return [s.x / sx, s.bot]; }) }], hlines: [{ y: ST.lim.cT * DD.transfer.fcp, label: 'compression limit ' + f(ST.lim.cT * DD.transfer.fcp, 1) }, { y: -ST.lim.tT * Math.sqrt(DD.transfer.fcp), label: 'tension limit', color: 'var(--warn)' }], xl: 'distance from girder end (m)', yl: 'stress (MPa, + compression)', unit: 'MPa', h: 220 }) + '</section></div>';
      var ck = ST.R.design.data.CK[ST.sel.sk][ST.sel.gi];
      h += '<section class="card res"><h3>Checks for G' + (ST.sel.gi + 1) + (g.spans.length > 1 ? ', span ' + (ST.sel.sk + 1) : '') + ' <span class="sub">full table on the Design checks page</span></h3>' + U.checkTable(ck, false) + '</section>';
    } else if (DD && DD.err) h += '<div class="empty">Design could not run: ' + esc(DD.err) + '</div>';
    else h += '<div class="empty">Press Run to calculate losses, camber, transfer stresses and strength for this girder.</div>';
    return h + '</div>';
  };
  function mirror(i) { var q = ST.p.strands[i]; for (var k = 0; k < ST.p.strands.length; k++) { var o = ST.p.strands[k]; if (k !== i && o.y === q.y && o.x === -q.x) return k; } return -1; }
  U.ACT.strand = function (a) {
    var i = Number(a.getAttribute('data-k')), q = ST.p.strands[i], j = SM.sym ? mirror(i) : -1;
    if (SM.mode === 'select') { ST.sel.strand = i; U.paint(); return; }
    q.on = !q.on; if (j >= 0) ST.p.strands[j].on = q.on; ST.sel.strand = i;
    ST.history.push({ t: Date.now(), what: (q.on ? 'Added' : 'Removed') + ' strand at x ' + q.x + ', y ' + q.y + (j >= 0 ? ' (and mirror)' : '') }); U.changed();
  };
  U.ACT.sm = function (a) { var k = a.getAttribute('data-k'); SM[k] = k === 'sym' ? a.checked : a.getAttribute('data-v'); U.paint(); };
  U.ACT['st-on'] = function (a) { var i = ST.sel.strand, j = SM.sym ? mirror(i) : -1; ST.p.strands[i].on = a.checked; if (j >= 0) ST.p.strands[j].on = a.checked; U.changed(); };
  U.ACT['st-all'] = function () { ST.p.strands.forEach(function (q) { q.on = true; }); U.changed(); };
  U.ACT['st-def'] = function () { ST.p.strands = CORE.strandDefault(ST.p.girder); ST.sel.strand = null; U.changed(); };
  U.ACT['st-nodeb'] = function () { ST.p.strands.forEach(function (q) { q.d = 0; q.d2 = 0; }); U.changed(); };
  document.addEventListener('change', function (e) { if (e.target.id !== 'st-deb') return; var i = ST.sel.strand, j = SM.sym ? mirror(i) : -1, v = Number(e.target.value); [i, j].forEach(function (k) { if (k >= 0) { ST.p.strands[k].d = v; ST.p.strands[k].d2 = v; } }); ST.history.push({ t: Date.now(), what: 'Debond ' + v + ' mm on strand ' + i }); U.changed(); });

  /* ---------- check table (one girder or worst across girders) ---------- */
  U.checkTable = function (ck, showG) {
    if (!ck || !ck.length) return '<div class="empty">No checks.</div>';
    var grp = null, h = '<div class="tbox"><table class="t"><thead><tr><th>Check</th>' + (showG ? '<th>Girder</th>' : '') + '<th class="n">Demand</th><th class="n">Capacity / limit</th><th>Unit</th><th>Utilisation</th><th>Status</th><th>Governing</th><th>Basis</th></tr></thead><tbody>';
    ck.forEach(function (c) {
      if (c.grp !== grp) { grp = c.grp; h += '<tr class="grp"><td colspan="' + (showG ? 9 : 8) + '">' + esc(grp) + '</td></tr>'; }
      var dp = Math.abs(c.dem) < 10 ? 2 : Math.abs(c.dem) < 100 ? 1 : 0;
      h += '<tr><td>' + esc(c.name) + (c.why ? '<div class="note" style="color:var(--bad)">' + esc(c.why) + '</div>' : '') + '</td>' + (showG ? '<td class="mono">G' + (c.gi + 1) + (c.sk ? ' / S' + (c.sk + 1) : '') + '</td>' : '') + '<td class="n">' + f(c.dem, dp) + '</td><td class="n">' + (c.cap === null ? '–' : f(c.cap, Math.abs(c.cap) < 10 ? 2 : Math.abs(c.cap) < 100 ? 1 : 0)) + '</td><td class="note">' + esc(c.unit) + '</td><td>' + U.ubar(c.u) + '</td><td>' + U.stat(c.ok) + '</td><td class="mono">' + esc(c.gov) + '</td><td class="note">' + esc(c.note) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  };
  U.worstChecks = function (CK) {   /* per check type, the girder with the highest utilisation */
    var by = {}, order = [];
    CK.forEach(function (row, k) { row.forEach(function (ck, i) { ck.forEach(function (c) { var key = c.grp + '|' + c.name.replace(/\s*\(.*?\)/g, ''); var o = Object.assign({ gi: i, sk: k }, c); if (!by[key]) { by[key] = o; order.push(key); } else { var b = by[key]; var uo = o.u === null ? -1 : o.u, ub = b.u === null ? -1 : b.u; if (uo > ub || (o.ok === false && b.ok !== false)) by[key] = o; } }); }); });
    return order.map(function (k) { return by[k]; });
  };

  /* ---------- 6. Structural analysis ---------- */
  var KIND = { M: ['Bending moment', 'kNm', 'BMD'], V: ['Shear force', 'kN', 'SFD'], T: ['Torsion', 'kNm', 'torsion'], w: ['Deflection', 'mm', 'deflection'] };
  var AV = { contour: 'resp' };
  U.RENDER.analysis = function () {
    var g = U.clampSel(), A = U.A(), h = '<div><h1 class="h1">Structural analysis</h1><p class="lede">Grillage results for one girder, the share of load each girder carries, a contour over the deck, bearing reactions and the combinations that govern.</p></div>';
    var srcs = ST.cases.filter(function (c) { return c.on && !c.proposed; }).map(function (c) { return [c.id, c.id + ' – ' + c.name]; }).concat(ST.combos.map(function (c) { return [c.id, c.id + ' – ' + c.name + ' (' + c.ls + ')']; }));
    if (!srcs.some(function (s) { return s[0] === ST.sel.src; })) ST.sel.src = srcs[0][0];
    h += '<div class="row">' + U.selBox('src', srcs, 'Case / combination') + U.selBox('sk', U.spanOpts(g.spans.length), 'Span') + U.selBox('gi', U.girderOpts(g.ng), 'Girder') +
      '<div class="seg" role="group" aria-label="Quantity">' + Object.keys(KIND).map(function (k) { return '<button data-act="sel" data-k="kind" data-v="' + k + '" aria-pressed="' + (ST.sel.kind === k) + '">' + KIND[k][2] + '</button>'; }).join('') + '</div></div>';
    var fresh = U.fresh(['analysis', 'combos']);
    h += '<div class="' + (fresh ? '' : 'is-stale') + '" style="display:grid;gap:14px">' + U.staleBox(['analysis', 'combos'], 'analysis results');
    if (!A) return h + '<div class="empty">Press Run to solve the grillage.</div></div>';
    var k = Math.min(ST.sel.sk, A.g.spans.length - 1), i = Math.min(ST.sel.gi, A.g.ng - 1), src = ST.sel.src, kind = ST.sel.kind, K = KIND[kind];
    var isEnv = !!(A.CB.filter(function (c) { return c.id === src; })[0] || (A.V[src] && A.V[src].max));
    var mx = ANALYSIS.line(A, k, i, kind, src, 'max'), mn = ANALYSIS.line(A, k, i, kind, src, 'min');
    var ser = [{ name: isEnv ? 'maximum' : src, pts: mx.map(function (q) { return [q.x, q.v]; }), fill: !isEnv }];
    if (isEnv) ser.push({ name: 'minimum', pts: mn.map(function (q) { return [q.x, q.v]; }), color: 'var(--load)' });
    var ext = mx.concat(mn).reduce(function (b, q) { return q.v !== null && Math.abs(q.v) > Math.abs(b.v) ? q : b; }, { v: 0, x: 0 });
    h += '<section class="card res"><h3>' + K[0] + ', G' + (i + 1) + (A.g.spans.length > 1 ? ', span ' + (k + 1) : '') + ' – ' + esc(src) + ' ' + U.tag('calc') + '<span class="sub">extreme ' + f(ext.v, kind === 'w' ? 1 : 0) + ' ' + K[1] + ' at ' + f(ext.x, 2) + ' m</span></h3>' +
      U.chart({ series: ser, xl: 'distance along the span (m)', yl: K[0].toLowerCase() + ' (' + K[1] + ')', unit: K[1], flip: kind === 'M', w: 1100, h: 320 }) +
      '<p class="note">' + (kind === 'M' ? 'Sagging positive, drawn downward (tension side). ' : kind === 'w' ? 'Upward positive. ' : '') + (isEnv ? 'Envelope: each response maximised and minimised independently over vehicle positions and combinations.' : 'Single static load case.') + '</p></section>';
    /* distribution between girders */
    var mid = Math.round(A.m.n / 2), keyOf = function (gi) { return kind === 'w' ? 'w:' + A.m.id[k + ':' + gi + ':' + mid] : kind === 'M' ? 'M:' + k + ':' + gi + ':' + Math.min(mid, A.m.n - 1) + ':a' : kind + ':' + k + ':' + gi + ':0'; };
    var dist = []; for (var gi = 0; gi < A.g.ng; gi++) dist.push(ANALYSIS.val(A, keyOf(gi), src, (kind === 'w') ? 'min' : 'max'));
    var tot = dist.reduce(function (a, b) { return a + Math.abs(b || 0); }, 0);
    h += '<div class="grid2"><section class="card res"><h3>Load distribution between girders <span class="sub">' + (kind === 'M' || kind === 'w' ? 'mid-span' : 'at the support') + ', ' + esc(src) + '</span></h3>' + bars(dist, K[1], i, tot) + '<p class="note">Share of the total in brackets. Edge girders carry the barrier and the outer lanes; the grillage spreads load through the deck slab and cross girders.</p></section>';
    /* contour */
    var D = ST.R.design && U.ok('design') ? ST.R.design.data.D : null, slsSrc = ST.combos.filter(function (c) { return c.id === src && c.ls === 'SLS'; })[0];
    var modeStress = AV.contour === 'stress' && D && slsSrc;
    h += '<section class="card res"><h3>Contour on the deck plan <span class="sub">' + (modeStress ? 'soffit stress, MPa (tension +)' : K[0].toLowerCase() + ', ' + K[1]) + '</span></h3><div class="seg" role="group" aria-label="Contour"><button data-act="av" data-v="resp" aria-pressed="' + !modeStress + '">' + K[0] + '</button><button data-act="av" data-v="stress" aria-pressed="' + !!modeStress + '"' + (D && slsSrc ? '' : ' disabled title="Pick an SLS combination and run the design"') + '>Girder soffit stress (SLS)</button></div>' + contour(A, k, kind, src, modeStress ? D[k] : null) + '</section></div>';
    /* reactions */
    var sups = A.m.sup.map(function (s, q) { return { s: s, q: q }; }), lines = {};
    sups.forEach(function (o) { var key = o.s.k + ':' + o.s.end; (lines[key] = lines[key] || []).push(o); });
    h += '<section class="card res"><h3>Bearing reactions – ' + esc(src) + ' ' + U.tag('calc') + '<span class="sub">kN, compression positive' + (isEnv ? '; maximum / minimum' : '') + '</span></h3><div class="tbox"><table class="t"><thead><tr><th>Support line</th>' + A.g.y.map(function (_, j) { return '<th class="n">G' + (j + 1) + '</th>'; }).join('') + '<th class="n">Total</th></tr></thead><tbody>' +
      Object.keys(lines).map(function (key) { var L = lines[key], s0 = L[0].s, nm = A.g.spans.length === 1 ? (s0.end === 'start' ? 'Abutment A' : 'Abutment B') : 'Span ' + (s0.k + 1) + ' ' + (s0.end === 'start' ? 'start' : 'end'); var mxs = L.map(function (o) { return ANALYSIS.val(A, 'Rb:' + o.q, src, 'max'); }), mns = L.map(function (o) { return ANALYSIS.val(A, 'Rb:' + o.q, src, 'min'); });
        return '<tr><td>' + nm + '</td>' + mxs.map(function (v, j) { return '<td class="n">' + f(v) + (isEnv ? '<div class="note">' + f(mns[j]) + '</div>' : '') + '</td>'; }).join('') + '<td class="n"><b>' + f(mxs.reduce(function (a, b) { return a + b; }, 0)) + '</b></td></tr>'; }).join('') + '</tbody></table></div><p class="note">The total of individual maxima exceeds the true maximum total for traffic, because each bearing is maximised by a different vehicle position.</p></section>';
    /* critical combinations */
    var rows = []; for (var q = 0; q < A.g.ng; q++) {
      var km = 'M:' + k + ':' + q + ':' + Math.min(mid, A.m.n - 1) + ':a', kv = 'V:' + k + ':' + q + ':0', sIdx = sups.filter(function (o) { return o.s.k === k && o.s.i === q && o.s.end === 'start'; })[0];
      rows.push([q, ANALYSIS.governing(A, km, 'ULS', 'max'), ANALYSIS.governing(A, kv, 'ULS'), sIdx ? ANALYSIS.governing(A, 'Rb:' + sIdx.q, 'ULS', 'max') : null, ANALYSIS.governing(A, km, 'SLS', 'max')]);
    }
    var cell = function (gv, d) { return gv ? '<td class="n">' + f(gv.v, d || 0) + '</td><td class="mono">' + esc(gv.id) + '</td>' : '<td class="n">–</td><td></td>'; };
    h += '<section class="card res"><h3>Critical combinations ' + U.tag('calc') + '<span class="sub">span ' + (k + 1) + '; the combination giving the largest value of each response</span></h3><div class="tbox"><table class="t"><thead><tr><th>Girder</th><th class="n">ULS M* mid-span</th><th>by</th><th class="n">ULS V* at support</th><th>by</th><th class="n">ULS bearing reaction</th><th>by</th><th class="n">SLS M mid-span</th><th>by</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr' + (r[0] === i ? ' class="sel"' : '') + '><td class="mono">G' + (r[0] + 1) + '</td>' + cell(r[1]) + cell(r[2]) + cell(r[3]) + cell(r[4]) + '</tr>'; }).join('') + '</tbody></table></div>' +
      (A.env && Object.keys(A.env).length ? '<p class="note">Moving loads: ' + Object.keys(A.env).map(function (v) { return v + ' – ' + A.env[v].lanes + ' lanes, ' + A.env[v].layouts + ' transverse lane layouts'; }).join('; ') + '. Analysis ' + f(A.ms) + ' ms, ' + f(A.nd) + ' equations.</p>' : '') + '</section>';
    return h + '</div>';
  };
  function bars(v, unit, sel, tot) {
    var W = 520, H = 200, L = 50, B = 30, n = v.length, mx = Math.max.apply(null, v.map(function (x) { return Math.abs(x || 0); })) || 1, bw = (W - L - 10) / n;
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Load distribution between girders">';
    U.ticks(0, mx, 4).t.forEach(function (t) { var y = H - B - t / mx * (H - B - 16); s += '<line class="gl" x1="' + L + '" x2="' + (W - 10) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 6) + '" y="' + (y + 3) + '" text-anchor="end">' + f(t) + '</text>'; });
    v.forEach(function (x, i) { var hh = Math.abs(x || 0) / mx * (H - B - 16), X = L + i * bw + bw * 0.18; s += '<rect data-act="sel" data-k="gi" data-v="' + i + '" x="' + X + '" y="' + (H - B - hh) + '" width="' + (bw * 0.64) + '" height="' + hh + '" rx="2" style="fill:' + (i === sel ? 'var(--acc)' : 'var(--axis)') + ';cursor:pointer"><title>G' + (i + 1) + ': ' + f(x, 1) + ' ' + unit + '</title></rect><text x="' + (X + bw * 0.32) + '" y="' + (H - B + 14) + '" text-anchor="middle">G' + (i + 1) + '</text><text x="' + (X + bw * 0.32) + '" y="' + (H - B - hh - 4) + '" text-anchor="middle">' + f(x) + (tot ? ' (' + f(100 * Math.abs(x || 0) / tot) + '%)' : '') + '</text>'; });
    return s + '</svg>';
  }
  function contour(A, k, kind, src, Dk) {
    var g = A.g, m = A.m, sp = g.spans[k], vals = [], lo = Infinity, hi = -Infinity;
    for (var i = 0; i < g.ng; i++) { var row = Dk ? Dk[i].stations.map(function (s) { return s.sls[src] ? s.sls[src].bot : null; }) : ANALYSIS.line(A, k, i, kind, src, kind === 'w' ? 'min' : 'max').map(function (q) { return q.v; }); vals.push(row); row.forEach(function (v) { if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); }
    var x0 = sp.x0 + g.edgeL * g.t - 0.5, x1 = sp.x0 + sp.L + g.edgeR * g.t + 0.5, W = 520, sx = (W - 20) / (x1 - x0), ex = Math.max(1, 150 / ((g.W) * sx)), H = g.W * sx * ex + 60;
    var X = function (x) { return 10 + (x - x0) * sx; }, Y = function (y) { return 10 + (g.edgeR - y) * sx * ex; };
    var amax = Math.max(Math.abs(lo), Math.abs(hi)) || 1, col = function (v) { var t = v / amax; return t >= 0 ? 'hsl(' + (Dk ? 4 : 198) + ',75%,' + (92 - 50 * t) + '%)' : 'hsl(' + (Dk ? 205 : 32) + ',80%,' + (92 + 50 * t) + '%)'; };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H.toFixed(0) + '" role="img" aria-label="Contour on the deck plan">';
    for (var i2 = 0; i2 < g.ng; i2++) for (var j = 0; j <= m.n; j++) {
      var v = vals[i2][j]; if (v === null || v === undefined) continue;
      var ya = i2 === 0 ? g.edgeL : (g.y[i2 - 1] + g.y[i2]) / 2, yb = i2 === g.ng - 1 ? g.edgeR : (g.y[i2] + g.y[i2 + 1]) / 2, fa = Math.max(0, (j - 0.5) / m.n), fb = Math.min(1, (j + 0.5) / m.n);
      var pt = function (y, fr) { return X(sp.x0 + y * g.t + fr * sp.L).toFixed(1) + ' ' + Y(y).toFixed(1); };
      s += '<path d="M' + pt(ya, fa) + 'L' + pt(ya, fb) + 'L' + pt(yb, fb) + 'L' + pt(yb, fa) + 'Z" style="fill:' + col(v) + ';stroke:' + col(v) + ';stroke-width:.6"><title>G' + (i2 + 1) + ', ' + f(m.n ? j / m.n * sp.L : 0, 1) + ' m: ' + f(v, 2) + '</title></path>';
    }
    g.y.forEach(function (y, i3) { s += '<line x1="' + X(sp.x0 + y * g.t) + '" x2="' + X(sp.x0 + y * g.t + sp.L) + '" y1="' + Y(y) + '" y2="' + Y(y) + '" style="stroke:var(--ink);opacity:.35"/><text x="' + (X(sp.x0 + y * g.t) - 2) + '" y="' + (Y(y) + 3) + '" text-anchor="end">G' + (i3 + 1) + '</text>'; });
    var ly = H - 22; s += '<defs><linearGradient id="cg' + k + '"><stop offset="0" stop-color="' + col(-amax) + '"/><stop offset=".5" stop-color="' + col(0) + '"/><stop offset="1" stop-color="' + col(amax) + '"/></linearGradient></defs><rect x="' + (W / 2 - 110) + '" y="' + ly + '" width="220" height="8" rx="3" fill="url(#cg' + k + ')"/><text x="' + (W / 2 - 116) + '" y="' + (ly + 8) + '" text-anchor="end">' + f(-amax, 1) + '</text><text x="' + (W / 2 + 116) + '" y="' + (ly + 8) + '">' + f(amax, 1) + '</text>';
    return s + '</svg><p class="note">Range ' + f(lo, 2) + ' to ' + f(hi, 2) + '. Cells span half-way to the neighbouring girders; values at the grillage nodes.' + (Dk ? ' Soffit stress from prestress, girder-alone and composite actions (design engine).' : '') + '</p>';
  }
  U.ACT.av = function (a) { AV.contour = a.getAttribute('data-v'); U.paint(); };

  /* ---------- 7. Engineering design checks ---------- */
  var CV = { scope: 'worst', abut: 'A' };
  U.RENDER.checks = function () {
    var g = U.clampSel(), d = U.digest(), h = '<div><h1 class="h1">Engineering design checks</h1><p class="lede">Demand against capacity for every check the engines can compute. Capacities come from the section engines; limits are inputs shown in the table. Not a compliance check: the code coefficients are unverified.</p></div>';
    var fresh = U.fresh(['design']), R = ST.R.design;
    h += '<div class="' + (fresh ? '' : 'is-stale') + '" style="display:grid;gap:14px">' + U.staleBox(['design'], 'design checks');
    if (R) {
      var all = U.worstChecks(R.data.CK), cnt = { ok: 0, ng: 0, info: 0 }; all.forEach(function (c) { if (c.ok === null) cnt.info++; else if (c.ok) cnt.ok++; else cnt.ng++; });
      var worst = all.filter(function (c) { return c.u !== null && isFinite(c.u); }).reduce(function (b, c) { return !b || c.u > b.u ? c : b; }, null);
      h += '<div class="kpis"><div class="kpi ' + (cnt.ng ? 'bad' : 'ok') + '"><span class="l">Result</span><span class="v">' + (cnt.ng ? cnt.ng + ' NG' : 'All OK') + '</span><span class="s">' + cnt.ok + ' within limits, ' + cnt.info + ' information</span></div><div class="kpi"><span class="l">Highest utilisation</span><span class="v">' + (worst ? worst.u.toFixed(2) : '–') + '</span><span class="s">' + (worst ? esc(worst.name.replace(/\s*\(.*?\)/g, '')) + ', G' + (worst.gi + 1) : '') + '</span></div><div class="kpi"><span class="l">Girders checked</span><span class="v">' + R.data.CK.length * (R.data.CK[0] || []).length + '</span><span class="s">' + (R.data.CK.length > 1 ? R.data.CK.length + ' spans × ' : '') + (R.data.CK[0] || []).length + ' girders, ' + f(R.ms) + ' ms</span></div></div>';
      h += '<section class="card res"><h3>Super-T girders ' + U.tag('calc') + U.tag('unv') + '</h3><div class="row"><div class="seg" role="group" aria-label="Scope"><button data-act="cv" data-k="scope" data-v="worst" aria-pressed="' + (CV.scope === 'worst') + '">Worst girder per check</button><button data-act="cv" data-k="scope" data-v="one" aria-pressed="' + (CV.scope === 'one') + '">One girder</button></div>' + (CV.scope === 'one' ? U.selBox('sk', U.spanOpts(g.spans.length), 'Span') + U.selBox('gi', U.girderOpts(g.ng), 'Girder') : '') + '</div>' +
        U.checkTable(CV.scope === 'worst' ? all : (R.data.CK[ST.sel.sk] || [])[ST.sel.gi], CV.scope === 'worst') + '</section>';
      h += '<section class="card"><h3>Check limits ' + U.tag('ill') + '<span class="sub">editable; a change marks the design out of date</span></h3><div class="form">' + U.fld('lim.tLive', 'SLS tension with traffic', "× √f'c", { min: 0, max: 1 }) + U.fld('lim.tPerm', 'SLS tension, permanent', 'MPa', { min: 0, max: 5 }) + U.fld('lim.cS', 'SLS compression', "× f'c", { min: 0.3, max: 0.7 }) + U.fld('lim.cT', 'Transfer compression', "× f'cp", { min: 0.4, max: 0.7 }) + U.fld('lim.tT', 'Transfer tension', "× √f'cp", { min: 0, max: 1 }) + U.fld('lim.defl', 'Traffic deflection', 'span /', { min: 200, max: 2000 }) + U.fld('lim.jackMax', 'Jacking stress', '× MBL', { min: 0.5, max: 0.85 }) + U.fld('lim.dbT', 'Debonded strands, total', '%', { min: 0, max: 100 }) + U.fld('lim.dbR', 'Debonded strands, per row', '%', { min: 0, max: 100 }) + U.fld('lim.cover', 'Cover to strands', 'mm', { min: 20, max: 100 }) + '</div></section>';
    } else h += '<div class="empty">Press Run to calculate the design checks.</div>';
    h += '</div>';
    /* piles */
    var pf = U.fresh(['piles']), PR = ST.R.piles;
    h += '<div class="' + (pf ? '' : 'is-stale') + '" style="display:grid;gap:14px">' + U.staleBox(['piles'], 'pile results');
    h += '<section class="card"><h3>Abutment piles ' + U.tag('ill') + '<span class="sub">bearing reactions into a rigid cap on one row of bored piles</span></h3><div class="form">' + U.fld('piles.n', 'Piles per abutment', '', { min: 2, max: 16, step: 1 }) + U.fld('piles.s', 'Pile spacing', 'm', { min: 1, max: 6 }) + U.fld('piles.D', 'Pile diameter', 'mm', { options: [600, 750, 900, 1050, 1200, 1500], num: true }) + U.fld('piles.fc', "Pile f'c", 'MPa', { options: [32, 40, 50], num: true }) + U.fld('piles.nBar', 'Longitudinal bars', '', { min: 6, max: 40, step: 1 }) + U.fld('piles.dBar', 'Bar diameter', 'mm', { options: [20, 24, 28, 32, 36], num: true }) + U.fld('piles.cover', 'Cover', 'mm', { min: 40, max: 120 }) + U.fld('piles.ecc', 'Load eccentricity on the cap', 'm', { min: 0, max: 2 }) + U.fld('piles.H_brake', 'Horizontal force (braking)', 'kN', { min: 0 }) + U.fld('piles.Lf', 'Pile free length', 'm', { min: 0, max: 30 }) + '</div>';
    if (PR) {
      var P = PR.data[CV.abut], wv = P.worst, uls = P.util;
      h += '<div class="res" style="display:grid;gap:10px"><div class="row"><div class="seg" role="group" aria-label="Abutment"><button data-act="cv" data-k="abut" data-v="A" aria-pressed="' + (CV.abut === 'A') + '">Abutment A</button><button data-act="cv" data-k="abut" data-v="B" aria-pressed="' + (CV.abut === 'B') + '">Abutment B</button></div><span class="note">Worst pile: ' + (wv ? 'P' + (wv.i + 1) + ' under ' + esc(wv.id) + ', N* ' + f(wv.N) + ' kN, M* ' + f(wv.M) + ' kNm, φMu ' + f(wv.cap) + ' kNm' : '–') + '</span></div>' +
        '<div class="grid2"><div>' + U.chart({ series: [{ name: 'φ capacity', pts: P.curve.map(function (c) { return [c.phiM, c.phiN]; }) }, { name: 'nominal', pts: P.curve.map(function (c) { return [c.M, c.N]; }), dash: '4 4', color: 'var(--mut)', w: 1.2 }, { name: 'ULS pile actions', pts: uls.map(function (u) { return [u.M, u.N]; }), color: 'var(--load)', dots: 1, w: 0 }], xl: 'moment (kNm)', yl: 'axial (kN, + compression)', unit: 'kN', h: 280 }) + '</div>' +
        '<div class="tbox"><table class="t"><thead><tr><th>Combination</th><th class="n">Total reaction</th><th class="n">Max pile N*</th><th class="n">M* per pile</th><th class="n">φMu at N*</th><th>Utilisation</th></tr></thead><tbody>' +
        Object.keys(P.by).filter(function (id) { return P.by[id].ls === 'ULS'; }).map(function (id) { var o = P.by[id], us = uls.filter(function (u) { return u.id === id; }), w2 = us.reduce(function (b, u) { return !b || u.u > b.u ? u : b; }, null); return '<tr><td class="mono">' + esc(id) + '</td><td class="n">' + f(o.Ptot) + '</td><td class="n">' + f(Math.max.apply(null, o.pile.map(function (q) { return q.N; }))) + '</td><td class="n">' + f(o.pile[0].M) + '</td><td class="n">' + f(w2 && w2.cap) + '</td><td>' + U.ubar(w2 && w2.u) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div><p class="note">N–M interaction from the general section engine on a circular section with ' + ST.p.piles.nBar + ' N' + ST.p.piles.dBar + ' bars. Moment per pile = (total reaction × eccentricity + horizontal force × free length / 2) / number of piles: an illustrative simplification with no soil model. Pile geotechnical capacity is not assessed.</p></div>';
    } else h += '<div class="empty">Press Run to calculate pile actions.</div>';
    return h + '</section></div>';
  };
  U.ACT.cv = function (a) { CV[a.getAttribute('data-k')] = a.getAttribute('data-v'); U.paint(); };
})();
