/* Alignment page (G-1, G-2, G-4 as views of platform results): load a platform geometry.json (tools/build_geometry.py or an
   app run) and see the control line, girders and deck edges in MGA, the vertical profile with the crossfall at each support,
   and the support / bearing set-out. Nothing is computed here beyond drawing: every number is the platform's. The file stays
   in this browser (not saved with the case, not uploaded). */
(function () {
  'use strict';
  var U = window.U, ST = U.ST, esc = U.esc, f = U.f;
  var AL = U.AL = { geo: null, name: '', err: '' };

  function plan(G) {   /* G-1: plan in MGA, north up */
    var S = G.alignment.samples || [], pts = [];
    S.forEach(function (q) { pts.push([q.E, q.N]); });
    G.girders.forEach(function (g) { ['end_A', 'end_B', 'bearing_A', 'bearing_B'].forEach(function (k) { if (g[k]) pts.push([g[k].E, g[k].N]); }); });
    ['left', 'right'].forEach(function (sd) { (G.deck.edges[sd] || []).forEach(function (q) { pts.push([q.E, q.N]); }); });
    var e0 = Math.min.apply(null, pts.map(function (p) { return p[0]; })), e1 = Math.max.apply(null, pts.map(function (p) { return p[0]; }));
    var n0 = Math.min.apply(null, pts.map(function (p) { return p[1]; })), n1 = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
    var W = 960, H = 560, pad = 95, k = Math.min((W - 2 * pad) / ((e1 - e0) || 1), (H - 2 * pad) / ((n1 - n0) || 1));
    var X = function (E) { return pad + (E - e0) * k + ((W - 2 * pad) - (e1 - e0) * k) / 2; }, Y = function (N) { return H - pad - (N - n0) * k - ((H - 2 * pad) - (n1 - n0) * k) / 2; };
    var s = '<svg class="plot" data-zoom="1" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Plan in MGA">';
    var rr = Math.max(e1 - e0, n1 - n0) / 6, step = Math.pow(10, Math.floor(Math.log10(rr || 1))); step *= rr / step > 5 ? 5 : rr / step > 2 ? 2 : 1;   /* grid: about six lines */
    for (var E = Math.ceil(e0 / step) * step, ie = 0; E <= e1; E += step, ie++) s += '<line x1="' + X(E) + '" x2="' + X(E) + '" y1="' + Y(n0) + '" y2="' + Y(n1) + '" style="stroke:var(--line2)"/>' + (ie % 2 ? '' : '<text x="' + X(E) + '" y="' + (Y(n0) + 14) + '" text-anchor="middle">E ' + f(E, 0) + '</text>');
    for (var N = Math.ceil(n0 / step) * step; N <= n1; N += step) s += '<line x1="' + X(e0) + '" x2="' + X(e1) + '" y1="' + Y(N) + '" y2="' + Y(N) + '" style="stroke:var(--line2)"/><text x="' + (X(e0) - 4) + '" y="' + (Y(N) + 3) + '" text-anchor="end">N ' + f(N, 0) + '</text>';
    ['left', 'right'].forEach(function (sd) { var q = G.deck.edges[sd] || []; if (q.length > 1) s += '<path d="' + q.map(function (p, i) { return (i ? 'L' : 'M') + X(p.E).toFixed(1) + ' ' + Y(p.N).toFixed(1); }).join('') + '" style="stroke:var(--ink);stroke-width:1.4;fill:none"><title>deck edge ' + sd + '</title></path>'; });
    G.supports.forEach(function (sp) {
      var L = (G.deck.edges.left || []).find(function (q) { return q.support === sp.id; }), R = (G.deck.edges.right || []).find(function (q) { return q.support === sp.id; });
      if (L && R) s += '<line x1="' + X(L.E) + '" y1="' + Y(L.N) + '" x2="' + X(R.E) + '" y2="' + Y(R.N) + '" style="stroke:var(--bad);stroke-width:1.6"><title>support ' + esc(sp.id) + ' line, bearing ' + f(sp.bearing, 4) + '°</title></line>';
      s += '<circle cx="' + X(sp.E) + '" cy="' + Y(sp.N) + '" r="4" style="fill:var(--bad)"><title>' + esc(sp.id) + ': CH ' + f(sp.ch, 3) + ', E ' + f(sp.E, 3) + ', N ' + f(sp.N, 3) + '</title></circle><text x="' + (X(sp.E) + 6) + '" y="' + (Y(sp.N) - 6) + '" style="fill:var(--bad);font-weight:600">' + esc(sp.id) + ' CH ' + f(sp.ch, 3) + '</text>';
    });
    G.girders.forEach(function (g) {
      if (g.end_A && g.end_B) s += '<line x1="' + X(g.end_A.E) + '" y1="' + Y(g.end_A.N) + '" x2="' + X(g.end_B.E) + '" y2="' + Y(g.end_B.N) + '" style="stroke:var(--accs);stroke-width:5;opacity:.6"><title>' + esc(g.id) + ': ' + f(g.length_end_to_end, 3) + ' m end to end, chord bearing ' + f(g.chord_bearing, 4) + '°</title></line>';
      s += '<line x1="' + X(g.bearing_A.E) + '" y1="' + Y(g.bearing_A.N) + '" x2="' + X(g.bearing_B.E) + '" y2="' + Y(g.bearing_B.N) + '" style="stroke:var(--acc);stroke-width:1.4"/>';
      ['bearing_A', 'bearing_B'].forEach(function (b) { var q = g[b]; s += '<circle cx="' + X(q.E) + '" cy="' + Y(q.N) + '" r="2.6" style="fill:var(--acc)"><title>' + esc(g.id) + ' ' + b.replace('_', ' ') + ': E ' + f(q.E, 3) + ', N ' + f(q.N, 3) + ', CH ' + f(q.ch, 3) + ', offset ' + f(q.offset, 3) + '</title></circle>'; });
    });
    if (S.length) s += '<path d="' + S.map(function (q, i) { return (i ? 'L' : 'M') + X(q.E).toFixed(1) + ' ' + Y(q.N).toFixed(1); }).join('') + '" style="stroke:var(--load);stroke-width:1.6;stroke-dasharray:8 4;fill:none"><title>control line</title></path>';
    s += '<g transform="translate(' + (W - 40) + ',50)"><path d="M0 -26L8 4L0 -2L-8 4Z" style="fill:var(--ink)"/><text x="0" y="18" text-anchor="middle" style="font-weight:600">N</text></g></svg>';
    return s;
  }

  function profile(G) {   /* G-2: design surface on the control line, supports marked */
    var S = (G.alignment.samples || []).filter(function (q) { return q.RL !== undefined; });
    if (S.length < 2) return '<p class="note">No vertical alignment in this geometry file.</p>';
    var c0 = S[0].ch, c1 = S[S.length - 1].ch, r0 = Math.min.apply(null, S.map(function (q) { return q.RL; })), r1 = Math.max.apply(null, S.map(function (q) { return q.RL; }));
    var W = 960, H = 300, X = function (c) { return 60 + (c - c0) / (c1 - c0) * (W - 100); }, rg = Math.max(r1 - r0, 0.5), Y = function (r) { return 40 + (r1 + rg * 0.15 - r) / (rg * 1.3) * (H - 90); };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Vertical profile">';
    s += '<path d="' + S.map(function (q, i) { return (i ? 'L' : 'M') + X(q.ch).toFixed(1) + ' ' + Y(q.RL).toFixed(1); }).join('') + '" style="stroke:var(--acc);stroke-width:2;fill:none"/>';
    G.supports.forEach(function (sp) { s += '<line x1="' + X(sp.ch) + '" x2="' + X(sp.ch) + '" y1="' + Y(sp.RL) + '" y2="' + (H - 40) + '" style="stroke:var(--bad);stroke-dasharray:4 3"/><circle cx="' + X(sp.ch) + '" cy="' + Y(sp.RL) + '" r="4" style="fill:var(--bad)"/><text x="' + X(sp.ch) + '" y="' + (Y(sp.RL) - 10) + '" text-anchor="middle" style="font-weight:600">' + esc(sp.id) + ' RL ' + f(sp.RL, 3) + '</text><text x="' + X(sp.ch) + '" y="' + (H - 24) + '" text-anchor="middle">CH ' + f(sp.ch, 3) + '</text>'; });
    var gr = (S[S.length - 1].RL - S[0].RL) / (c1 - c0) * 100;
    s += '<text x="' + X((c0 + c1) / 2) + '" y="' + (Y((S[0].RL + S[S.length - 1].RL) / 2) + 22) + '" text-anchor="middle">mean grade ' + f(gr, 3) + ' %</text><text x="60" y="' + (H - 6) + '">chainage (m) · RL (m) of the design surface on the control line</text></svg>';
    return s;
  }

  function section(G, sp) {   /* G-2: design surface across the deck at one support (crossfall from the description) */
    var xf = (G.alignment.crossfall || [])[0], eL = G.deck.edge_left_offset, eR = G.deck.edge_right_offset;
    if (!xf || sp.RL === undefined || sp.RL === null) return '';
    var rl = function (o) { return sp.RL - ((o < xf.crown_offset ? xf.left : xf.right) / 100) * Math.abs(o - xf.crown_offset); };
    var os = [eL, xf.crown_offset, eR].filter(function (o) { return o >= eL && o <= eR; }).sort(function (a, b) { return a - b; });
    var vs = os.map(rl), lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs), W = 460, H = 150, X = function (o) { return 30 + (o - eL) / (eR - eL) * (W - 60); }, kz = 60 / Math.max(hi - lo, 0.05), Y = function (r) { return 40 + (hi - r) * kz; };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Crossfall at ' + esc(sp.id) + '"><path d="' + os.map(function (o, i) { return (i ? 'L' : 'M') + X(o).toFixed(1) + ' ' + Y(rl(o)).toFixed(1); }).join('') + '" style="stroke:var(--ink);stroke-width:2;fill:none"/>';
    os.forEach(function (o) { s += '<text x="' + X(o) + '" y="' + (Y(rl(o)) - 6) + '" text-anchor="middle">' + f(rl(o), 3) + '</text>'; });
    G.girders.forEach(function (g) { var b = g.bearing_A.ch !== undefined && Math.abs(g.bearing_A.ch - sp.ch) < Math.abs(g.bearing_B.ch - sp.ch) ? g.bearing_A : g.bearing_B; s += '<line x1="' + X(b.offset) + '" x2="' + X(b.offset) + '" y1="' + (Y(rl(b.offset)) + 4) + '" y2="' + (Y(rl(b.offset)) + 26) + '" style="stroke:var(--acc);stroke-width:3"><title>' + esc(g.id) + ' at offset ' + f(b.offset, 3) + '</title></line>'; });
    s += '<line x1="' + X(0) + '" x2="' + X(0) + '" y1="20" y2="' + (H - 30) + '" style="stroke:var(--load);stroke-dasharray:6 3"/><text x="' + X(0) + '" y="' + (H - 16) + '" text-anchor="middle">control line</text><text x="' + X(eL) + '" y="' + (H - 4) + '">' + f(eL, 2) + '</text><text x="' + X(eR) + '" y="' + (H - 4) + '" text-anchor="end">' + f(eR, 2) + '</text></svg>';
    return '<div><h4 style="margin:6px 0">Support ' + esc(sp.id) + ' — crossfall left ' + xf.left + ' %, right ' + xf.right + ' %, crown at ' + f(xf.crown_offset, 2) + ' m</h4>' + s + '</div>';
  }

  U.RENDER.alignment = function () {
    var h = '<div><h1 class="h1">Alignment and set-out <span class="sub">views of a platform geometry file</span></h1><p class="lede">Load <span class="mono">geometry.json</span> from a platform run (the app\'s run folder, or <span class="mono">tools/build_geometry.py</span>). The Studio\'s own case studies are straight and level; real alignments, MGA set-out and levels come from the platform. The file stays in this browser.</p></div>';
    h += '<section class="card"><div class="row"><label class="btn" for="al-file">Load geometry.json</label><input type="file" id="al-file" accept=".json,application/json" style="display:none">' + (AL.geo ? '<span class="note">' + esc(AL.name) + ' · ' + AL.geo.supports.length + ' supports · ' + AL.geo.girders.length + ' girders</span><button class="btn ghost" data-act="al-clear">Clear</button>' : '<span class="note">No file loaded.</span>') + (AL.err ? '<span class="bad">' + esc(AL.err) + '</span>' : '') + '</div></section>';
    var G = AL.geo; if (!G) return h;
    h += '<section class="card"><h3>Plan (MGA, north up) <span class="sub">control line dashed, girders between bearings, support lines red; scroll to zoom, hover for coordinates</span></h3>' + plan(G) + '<p class="note">' + esc(G.coordinates) + '. Girders are straight chords between bearings; the shaded bar is the girder end to end.</p></section>';
    h += '<section class="card"><h3>Vertical profile and crossfall</h3>' + profile(G) + '<div class="grid2">' + G.supports.map(function (sp) { return section(G, sp); }).join('') + '</div></section>';
    h += '<div class="grid2"><section class="card"><h3>Supports</h3><div class="tbox"><table class="t"><thead><tr><th>Support</th><th class="n">CH</th><th class="n">E</th><th class="n">N</th><th class="n">RL</th><th class="n">Line bearing (°)</th><th class="n">Skew to chord normal (°)</th></tr></thead><tbody>' +
      G.supports.map(function (sp) { return '<tr><td>' + esc(sp.id) + '</td><td class="n">' + f(sp.ch, 3) + '</td><td class="n">' + f(sp.E, 3) + '</td><td class="n">' + f(sp.N, 3) + '</td><td class="n">' + (sp.RL === null || sp.RL === undefined ? '–' : f(sp.RL, 3)) + '</td><td class="n">' + f(sp.bearing, 4) + '</td><td class="n">' + (sp.skew_to_chord_normal === null || sp.skew_to_chord_normal === undefined ? '–' : f(sp.skew_to_chord_normal, 2)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3 style="margin-top:10px">Checks</h3><table class="t"><tbody>' + (G.checks || []).map(function (c) { return '<tr><td>' + esc(c.what || c.id) + '</td><td class="n">' + (c.value_m !== undefined ? f(c.value_m * 1000, 3) + ' mm' : '') + '</td><td class="' + (c.pass ? 'ok' : 'bad') + '">' + (c.pass ? 'pass' : 'FAIL') + '</td></tr>'; }).join('') + '</tbody></table></section>' +
      '<section class="card"><h3>Bearings (set-out)</h3><div class="tbox"><table class="t"><thead><tr><th>Girder</th><th>End</th><th class="n">E</th><th class="n">N</th><th class="n">CH</th><th class="n">Offset</th><th class="n">RL on control line</th><th class="n">Chord length</th></tr></thead><tbody>' +
      G.girders.map(function (g) { return ['bearing_A', 'bearing_B'].map(function (b, i) { var q = g[b]; return '<tr><td>' + (i ? '' : esc(g.id)) + '</td><td>' + b.slice(-1) + '</td><td class="n">' + f(q.E, 3) + '</td><td class="n">' + f(q.N, 3) + '</td><td class="n">' + f(q.ch, 3) + '</td><td class="n">' + f(q.offset, 3) + '</td><td class="n">' + (q.RL_control_line === undefined || q.RL_control_line === null ? '–' : f(q.RL_control_line, 3)) + '</td><td class="n">' + (i ? '' : f(g.chord_length_bearings, 3)) + '</td></tr>'; }).join(''); }).join('') + '</tbody></table></div></section></div>';
    return h;
  };
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.id !== 'al-file' || !e.target.files[0]) return;
    var fl = e.target.files[0], rd = new FileReader();
    rd.onload = function () {
      try { var G = JSON.parse(rd.result); if (!/^pdf2bim\.geometry\//.test(G.format || '') || !G.supports || !G.girders || !G.deck) throw new Error('not a platform geometry file (format pdf2bim.geometry/…)');
        AL.geo = G; AL.name = fl.name; AL.err = ''; if (!(G.alignment && G.alignment.samples)) AL.err = 'This file predates the control-line samples: re-run the geometry step for the plan line and profile.'; G.alignment = G.alignment || {}; }
      catch (x) { AL.err = x.message; }
      U.paint();
    };
    rd.readAsText(fl);
  });
  U.ACT['al-clear'] = function () { AL.geo = null; AL.name = ''; AL.err = ''; U.paint(); };
})();
