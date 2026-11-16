/* Properties page (materials, girder definition, member properties), Boundary conditions page (bearings, piles and
   ground level) and the point-of-interest card of the Super-T design page (staged SLS stresses through the section).
   Cards that already exist on other pages are reused from those pages' own renderers, so there is one definition of each. */
(function () {
  'use strict';
  var U = window.U, ST = U.ST, esc = U.esc, f = U.f;
  /* take the cards whose heading starts with one of `titles` out of another page's HTML */
  function pick(html, titles) {
    var t = document.createElement('template'); t.innerHTML = html; var out = [];
    titles.forEach(function (ti) { var hs = t.content.querySelectorAll('section.card > h3'); for (var i = 0; i < hs.length; i++) if (hs[i].textContent.trim().indexOf(ti) === 0) { out.push(hs[i].parentNode.outerHTML); break; } });
    return out.join('');
  }
  U.pick = pick;
  var sg = function (v) { return v === null || v === undefined || !isFinite(v) ? '–' : (v > 0 ? '+' : '') + f(v, 2); };

  U.RENDER.properties = function () {
    var p = ST.p, g = CORE.geometry(p); U.clampSel(); var sc = CORE.sections(p, g), dsg = U.RENDER.design(), own = ST.p.gStr || {};
    var h = '<div><h1 class="h1">Properties</h1><p class="lede">Everything the model is made of, in one place: materials, the definition of each girder, and the properties of every member type in the grillage. Edit here or on the page each card comes from; the values are the same.</p></div>';
    h += '<h2 class="h2">Materials</h2>' + pick(dsg, ['Materials used by the engines', 'Section and materials']);
    h += '<h2 class="h2">Girder definition</h2>' + pick(dsg, ['Typical cross-section', 'Section properties']);
    h += '<section class="card"><h3>Girders ' + U.tag('calc') + '<span class="sub">one Super-T type for the bridge; a girder can carry its own strand pattern (Super-T girder design page)</span></h3><div class="tbox"><table class="t"><thead><tr><th>Girder</th><th>Section</th><th class="n">Offset (m)</th><th class="n">Deck width carried (mm)</th><th class="n">Strands used</th><th class="n">Debonded</th><th>Strand pattern</th><th>Bars</th><th>Fitments</th></tr></thead><tbody>' +
      g.y.map(function (y, i) { var s = own[i] || p.strands, on = s.filter(function (q) { return q.on; }), trib = (i === 0 || i === g.ng - 1) ? g.s / 2 + p.overhang : g.s;
        return '<tr><td><button class="btn ghost" data-act="sel" data-k="gi" data-v="' + i + '" aria-pressed="' + (ST.sel.gi === i) + '">G' + (i + 1) + '</button></td><td>' + esc(p.girder) + '</td><td class="n">' + f(y, 3) + '</td><td class="n">' + f(trib * 1000) + '</td><td class="n">' + on.length + ' × ' + p.db + ' mm</td><td class="n">' + on.filter(function (q) { return q.d || q.d2; }).length + '</td><td>' + (own[i] ? 'own' : 'shared') + '</td><td class="note">' + (esc(p.gbars) || '–') + '</td><td class="note">N' + p.fitD + ' × ' + p.fitLegs + ' legs @ ' + p.fitS + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    h += '<h2 class="h2">Member properties</h2>' + pick(U.RENDER.mesh(), ['Member properties']);
    return h;
  };

  /* pile elevation: cap, pile, ground level, depth to fixity */
  function pileSVG(P) {
    var W = 560, Hh = 380, top = 40, sc = (Hh - top - 30) / Math.max(P.L, P.Lf + 1, P.gl + 1), cx = 150, d = Math.max(14, P.D / 1000 * sc), Y = function (z) { return top + z * sc; };
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + Hh + '" style="max-width:600px" role="img" aria-label="Pile elevation">';
    s += '<rect x="' + (cx - 70) + '" y="' + (top - 28) + '" width="140" height="28" style="fill:var(--axis);fill-opacity:.35;stroke:var(--ink)"/><text x="' + (cx + 78) + '" y="' + (top - 10) + '">pile cap / sill</text>';
    s += '<rect x="' + (cx - d / 2) + '" y="' + top + '" width="' + d + '" height="' + (P.L * sc) + '" style="fill:var(--accs);stroke:var(--acc);stroke-width:1.4"/>';
    s += '<rect x="20" y="' + Y(P.gl) + '" width="' + (W - 40) + '" height="' + Math.max(0, Hh - 10 - Y(P.gl)) + '" style="fill:var(--load);opacity:.10"/><line x1="20" x2="' + (W - 20) + '" y1="' + Y(P.gl) + '" y2="' + Y(P.gl) + '" style="stroke:var(--load);stroke-width:1.6"/><text x="' + (W - 22) + '" y="' + (Y(P.gl) - 5) + '" text-anchor="end" style="fill:var(--load)">ground level, ' + f(P.gl, 2) + ' m below the cap</text>';
    s += '<line x1="' + (cx - 60) + '" x2="' + (cx + 60) + '" y1="' + Y(P.Lf) + '" y2="' + Y(P.Lf) + '" style="stroke:var(--bad);stroke-dasharray:5 3;stroke-width:1.6"/><text x="' + (cx + 66) + '" y="' + (Y(P.Lf) + 4) + '" style="fill:var(--bad)">point of fixity, ' + f(P.Lf, 2) + ' m (' + f(P.Lf - P.gl, 2) + ' m below ground)</text>';
    s += '<text x="' + (cx + 66) + '" y="' + (Y(P.L) - 2) + '">toe, ' + f(P.L, 1) + ' m</text><text x="' + (cx - d / 2 - 6) + '" y="' + Y(P.L / 2) + '" text-anchor="end">D ' + P.D + '</text>';
    return s + '</svg>';
  }

  U.RENDER.boundary = function () {
    var p = ST.p, g = CORE.geometry(p), sc = CORE.sections(p, g), m = CORE.mesh(p, g, sc), P = p.piles, ck = U.RENDER.checks();
    var h = '<div><h1 class="h1">Boundary conditions</h1><p class="lede">How the model is held: the bearings under each girder end, and the piles under each abutment with the ground level and the depth to fixity.</p></div>';
    h += '<section class="card"><h3>Bearings ' + U.tag('ill') + '<span class="sub">one vertical spring under each girder end</span></h3><div class="form">' + U.fld('kv', 'Bearing vertical stiffness', 'kN/m', { min: 1e3, max: 1e9 }) + U.fld('endDist', 'Girder end to bearing centreline', 'm', { min: 0.1, max: 1.5 }) + '</div>' +
      '<div class="tbox"><table class="t"><thead><tr><th>Bearing</th><th class="n">x (m)</th><th class="n">y (m)</th><th class="n">Vertical kv (kN/m)</th><th>Vertical</th><th>Longitudinal</th><th>Transverse</th><th>Rotation</th></tr></thead><tbody>' +
      m.sup.map(function (s) { var n = m.nodes[s.node]; return '<tr><td>' + (g.spans.length > 1 ? 'S' + (s.k + 1) + ' ' : '') + 'G' + (s.i + 1) + ' ' + s.end + '</td><td class="n">' + f(n.x, 3) + '</td><td class="n">' + f(n.y, 3) + '</td><td class="n">' + f(s.kv) + '</td><td>spring</td><td class="note">not in this model</td><td class="note">not in this model</td><td>free</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="note">The Studio grillage has vertical deflection and two rotations at each node, so a bearing is a vertical spring; longitudinal and transverse restraint (fixed and guided bearings, elastomer shear stiffness) belong to the platform model. A very stiff spring (1e6 kN/m or more) behaves as a rigid support. Reactions, rotations and movements are on the Bearing actions page.</p></section>';
    h += '<section class="card"><h3>Piles and ground ' + U.tag('ill') + '<span class="sub">one row of piles under a rigid cap at each abutment</span></h3><div class="grid2"><div><div class="form">' +
      U.fld('piles.n', 'Piles per abutment', '', { min: 2, max: 16, step: 1 }) + U.fld('piles.s', 'Pile spacing', 'm', { min: 1, max: 6 }) + U.fld('piles.D', 'Pile diameter', 'mm', { options: [600, 750, 900, 1050, 1200, 1500], num: true }) +
      U.fld('piles.L', 'Pile length below the cap', 'm', { min: 3, max: 60 }) + U.fld('piles.gl', 'Ground level below the cap soffit', 'm', { min: 0, max: 20 }) + U.fld('piles.Lf', 'Depth to the point of fixity below the cap', 'm', { min: 1, max: 30 }) +
      U.fld('piles.H_brake', 'Horizontal force per abutment (braking)', 'kN', { min: 0, max: 5000 }) + U.fld('piles.ecc', 'Eccentricity of the reactions on the cap', 'm', { min: 0, max: 2 }) + '</div>' +
      '<div class="tbox"><table class="t"><tbody><tr><td>Free length above ground</td><td class="n">' + f(P.gl, 2) + '</td><td>m</td></tr><tr><td>Fixity below ground</td><td class="n">' + f(P.Lf - P.gl, 2) + '</td><td>m' + (P.Lf < P.gl ? ' — fixity is above the ground level: check the inputs' : '') + '</td></tr><tr><td>Embedded length</td><td class="n">' + f(P.L - P.gl, 2) + '</td><td>m</td></tr><tr><td>Pile moment from the horizontal force</td><td class="n">H × Lf / 2 / n</td><td>fixed-head pile, per pile</td></tr></tbody></table></div></div><div>' + pileSVG(P) + '</div></div>' +
      '<p class="note">The soil is represented by an equivalent depth to fixity, not by springs along the pile: the ground level and pile length are drawn and reported, and the pile check uses the fixity depth. Soil layers with lateral springs along the pile, the sill and the abutment are in the platform model. Section reinforcement and the pile interaction check are on the Design checks page.</p></section>';
    h += pick(ck, ['Abutment piles']);
    return h;
  };

  /* ---------- point of interest: staged SLS stresses through the section (Super-T alone, composite increment, total) ---------- */
  U.poiCard = function (p, g, sc, D, A, lim) {
    var n = D.stations.length - 1, j = ST.sel.poi === undefined || ST.sel.poi === null || ST.sel.poi > n ? Math.floor(n / 2) : ST.sel.poi, st = D.stations[j]; ST.sel.poi = j;
    var sls = A.CB.filter(function (c) { return c.ls === 'SLS'; }), cb = sls.filter(function (c) { return c.id === ST.sel.cb; })[0] || sls[0]; if (!cb) return ''; ST.sel.cb = cb.id;
    var key = 'M:' + ST.sel.sk + ':' + ST.sel.gi + ':' + Math.min(j, A.m.n - 1) + ':' + (j < A.m.n ? 'a' : 'b'), Mt = cb.max[A.RS.idx[key]];
    var Mnc = (cb.used.indexOf('G1') >= 0 ? ANALYSIS.val(A, key, 'G1') : 0) + (cb.used.indexOf('G2') >= 0 ? ANALYSIS.val(A, key, 'G2') : 0), Mc = Mt - Mnc, H = sc.H, t = p.slab, Dp = H + t;
    /* stresses (MPa, tension +) at: deck top, deck bottom, girder top, girder bottom */
    var s1 = { gt: -st.P * 1e3 / sc.A + st.P * 1e3 * st.e / sc.Zt - Mnc * 1e6 / sc.Zt, gb: -st.P * 1e3 / sc.A - st.P * 1e3 * st.e / sc.Zb + Mnc * 1e6 / sc.Zb };
    var dT = -Mc * 1e6 / sc.Zcd, s2 = { dt: dT, db: dT * (H - sc.yc) / (H + t - sc.yc), gt: -Mc * 1e6 / sc.Zct, gb: Mc * 1e6 / sc.Zcb };
    var s3 = { dt: s2.dt, db: s2.db, gt: s1.gt + s2.gt, gb: s1.gb + s2.gb };
    var traffic = cb.used.some(function (u) { return u === 'M1600' || u === 'S1600'; }), tl = traffic ? lim.tLive * Math.sqrt(p.fcG) : lim.tPerm, cl = -lim.cS * p.fcG;
    var where = j === 0 || j === n ? 'Support' : j === Math.floor(n / 2) ? 'Midspan' : 'x / L = ' + f(st.x / g.spans[ST.sel.sk].L, 2);
    var poiOpts = D.stations.map(function (q, i) { return [i, (i + 1) + ' – x = ' + f(q.x, 2) + ' m' + (i === Math.floor(n / 2) ? ' (midspan)' : i === 0 || i === n ? ' (support)' : '')]; });
    var W = 1000, top = 46, k = 250 / Dp, Hh = top + Dp * k + 46, Y = function (y) { return top + (Dp - y) * k; };   /* y above the soffit */
    var s = '<svg class="plot" viewBox="0 0 ' + W + ' ' + Hh.toFixed(0) + '" style="min-width:760px" role="img" aria-label="SLS stresses through the section">';
    /* section */
    var half = sc.fw / 2, kx = Math.min(k, 230 / (g.s * 1000)), X0 = 130, X = function (x) { return X0 + x * kx; };
    s += '<text x="' + X0 + '" y="16" text-anchor="middle" style="font-weight:600">Section</text>';
    s += '<rect x="' + X(-g.s * 500) + '" y="' + Y(Dp) + '" width="' + (g.s * 1000 * kx) + '" height="' + (t * k) + '" style="fill:var(--axis);fill-opacity:.3;stroke:var(--ink)"/>';
    s += '<path d="' + sc.P.map(function (q, i) { return (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join('') + 'Z" style="fill:var(--accs);stroke:var(--ink);stroke-width:1.2"/>';
    p.strands.forEach(function (q) { if (q.on) s += '<circle cx="' + X(q.x).toFixed(1) + '" cy="' + Y(q.y).toFixed(1) + '" r="1.6" style="fill:var(--acc)"/>'; });
    [[sc.yc, 'yc composite'], [sc.yb, 'yb Super-T']].forEach(function (r) { s += '<line x1="' + X(-half) + '" x2="' + X(half) + '" y1="' + Y(r[0]) + '" y2="' + Y(r[0]) + '" style="stroke:var(--mut);stroke-dasharray:4 3"/><text x="' + X(half * 0.25) + '" y="' + (Y(r[0]) - 3) + '" style="fill:var(--mut)">' + r[1] + '</text>'; });
    s += '<text x="' + X(-half) + '" y="' + (Hh - 8) + '">D = ' + f(Dp) + ' mm</text>';
    /* three stress panels on one stress scale */
    var all = [s1.gt, s1.gb, s2.dt, s2.db, s2.gt, s2.gb, s3.gt, s3.gb, cl, tl, 0], lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pw = 190, ks = (pw - 30) / (hi - lo || 1);
    var panel = function (x0, title, sub, pts, limits) {   /* pts: [[y, sigma], ...] top to bottom, may contain a break (null) */
      var Z = x0 + 15 + (0 - lo) * ks, SX = function (v) { return x0 + 15 + (v - lo) * ks; }, o = '<text x="' + (x0 + pw / 2) + '" y="16" text-anchor="middle" style="font-weight:600">' + title + '</text><text x="' + (x0 + pw / 2) + '" y="30" text-anchor="middle" style="fill:var(--mut)">' + sub + '</text>';
      o += '<line x1="' + Z + '" x2="' + Z + '" y1="' + Y(Dp) + '" y2="' + Y(0) + '" style="stroke:var(--ink)"/>';
      pts.forEach(function (seg) { for (var i = 0; i < seg.length - 1; i++) { var a = seg[i], b = seg[i + 1];
        /* split a segment that changes sign so compression and tension are filled separately */
        var parts = a[1] * b[1] < 0 ? (function () { var tt = a[1] / (a[1] - b[1]), ym = a[0] + (b[0] - a[0]) * tt; return [[a, [ym, 0]], [[ym, 0], b]]; })() : [[a, b]];
        parts.forEach(function (q) { var ten = (q[0][1] + q[1][1]) > 0; o += '<path d="M' + Z + ' ' + Y(q[0][0]) + 'L' + SX(q[0][1]) + ' ' + Y(q[0][0]) + 'L' + SX(q[1][1]) + ' ' + Y(q[1][0]) + 'L' + Z + ' ' + Y(q[1][0]) + 'Z" style="fill:' + (ten ? 'var(--bad)' : 'var(--acc)') + ';fill-opacity:.22;stroke:none"/>'; });
        o += '<line x1="' + SX(a[1]) + '" y1="' + Y(a[0]) + '" x2="' + SX(b[1]) + '" y2="' + Y(b[0]) + '" style="stroke:var(--acc);stroke-width:1.8"/>'; }
        [seg[0], seg[seg.length - 1]].forEach(function (q, e) { o += '<text x="' + (SX(q[1]) + (q[1] < 0 ? -4 : 4)) + '" y="' + (Y(q[0]) + (e ? -3 : 11)) + '" text-anchor="' + (q[1] < 0 ? 'end' : 'start') + '" style="font-weight:600' + (q[1] > 0 ? ';fill:var(--bad)' : '') + '">' + f(q[1], 2) + '</text>'; }); });
      if (limits) { o += '<line x1="' + SX(cl) + '" x2="' + SX(cl) + '" y1="' + Y(Dp) + '" y2="' + Y(0) + '" style="stroke:var(--bad);stroke-dasharray:5 3"/><text x="' + SX(cl) + '" y="' + (Y(0) + 14) + '" text-anchor="middle" style="fill:var(--bad)">' + f(cl, 1) + ' (' + lim.cS + ' f\'c)</text>';
        o += '<line x1="' + SX(tl) + '" x2="' + SX(tl) + '" y1="' + Y(Dp) + '" y2="' + Y(0) + '" style="stroke:var(--bad);stroke-dasharray:5 3"/><text x="' + SX(tl) + '" y="' + (Y(0) + 28) + '" text-anchor="middle" style="fill:var(--bad)">+' + f(tl, 2) + ' (tension limit)</text>'; }
      return o + '<text x="' + (x0 + pw / 2) + '" y="' + (Hh - 4) + '" text-anchor="middle" style="fill:var(--mut)">σ (MPa)</text>';
    };
    s += panel(300, '1. Super-T alone', 'prestress + Mnc ' + f(Mnc, 0) + ' kNm', [[[H, s1.gt], [0, s1.gb]]]);
    s += panel(530, '2. + Composite increment', 'on the composite: Mc ' + f(Mc, 0) + ' kNm', [[[Dp, s2.dt], [H, s2.db]], [[H, s2.gt], [0, s2.gb]]]);
    s += panel(760, '3. = Total at the SLS', 'uncracked' + (traffic ? ', with traffic' : ', permanent'), [[[Dp, s3.dt], [H, s3.db]], [[H, s3.gt], [0, s3.gb]]], true);
    s += '</svg>';
    /* ---- ULS bending: strain and force diagrams at the same section ---- */
    var ul = '';
    if (st.uls) { var q = st.uls, Wu = 1000, Hu = top + Dp * k + 40, Yd = function (d) { return top + d * k; }, T = q.lay.reduce(function (a_, l) { return a_ + l.F; }, 0), a_blk = q.gamma * q.dn;
      var yT = q.lay.reduce(function (a_, l) { return a_ + l.F * l.y; }, 0) / (T || 1), yC = yT - q.Mu * 1e3 / (T || 1), emax = Math.max.apply(null, q.lay.map(function (l) { return l.t === 'tend' ? l.e : q.ecu * (l.y - q.dn) / q.dn; }).concat([q.ecu * (Dp - q.dn) / q.dn])), ke = 200 / (emax + q.ecu), x0 = 420 + q.ecu * ke;
      ul = '<svg class="plot" viewBox="0 0 ' + Wu + ' ' + Hu.toFixed(0) + '" style="min-width:760px" role="img" aria-label="ULS strain and force diagrams">';
      ul += '<text x="' + X0 + '" y="16" text-anchor="middle" style="font-weight:600">Section</text><rect x="' + X(-g.s * 500) + '" y="' + Y(Dp) + '" width="' + (g.s * 1000 * kx) + '" height="' + (t * k) + '" style="fill:var(--axis);fill-opacity:.3;stroke:var(--ink)"/><path d="' + sc.P.map(function (pt, i) { return (i ? 'L' : 'M') + X(pt[0]).toFixed(1) + ' ' + Y(pt[1]).toFixed(1); }).join('') + 'Z" style="fill:var(--accs);stroke:var(--ink);stroke-width:1.2"/>';
      ul += '<rect x="' + X(-g.s * 500) + '" y="' + Yd(0) + '" width="' + (g.s * 1000 * kx) + '" height="' + (Math.min(a_blk, t) * k) + '" style="fill:var(--acc);opacity:.45"/><line x1="' + X(-g.s * 500 - 60) + '" x2="' + X(g.s * 500 + 60) + '" y1="' + Yd(q.dn) + '" y2="' + Yd(q.dn) + '" style="stroke:var(--bad);stroke-dasharray:5 3"/><text x="' + X(g.s * 500 + 60) + '" y="' + (Yd(q.dn) + 12) + '" text-anchor="end" style="fill:var(--bad)">neutral axis dn ' + f(q.dn, 0) + '</text>';
      p.strands.forEach(function (sd) { if (sd.on) ul += '<circle cx="' + X(sd.x).toFixed(1) + '" cy="' + Y(sd.y).toFixed(1) + '" r="1.6" style="fill:var(--acc)"/>'; });
      /* strain */
      ul += '<text x="430" y="16" text-anchor="middle" style="font-weight:600">Strain at ultimate</text><text x="430" y="30" text-anchor="middle" style="fill:var(--mut)">plane sections; concrete ' + q.ecu + ' at the top</text><line x1="' + x0 + '" x2="' + x0 + '" y1="' + Yd(0) + '" y2="' + Yd(Dp) + '" style="stroke:var(--ink)"/>';
      ul += '<path d="M' + x0 + ' ' + Yd(0) + 'L' + (x0 - q.ecu * ke) + ' ' + Yd(0) + 'L' + x0 + ' ' + Yd(q.dn) + 'Z" style="fill:var(--acc);fill-opacity:.25;stroke:var(--acc);stroke-width:1.6"/><path d="M' + x0 + ' ' + Yd(q.dn) + 'L' + (x0 + q.ecu * (Dp - q.dn) / q.dn * ke) + ' ' + Yd(Dp) + 'L' + x0 + ' ' + Yd(Dp) + 'Z" style="fill:var(--bad);fill-opacity:.15;stroke:var(--acc);stroke-width:1.6"/>';
      ul += '<text x="' + (x0 - q.ecu * ke - 4) + '" y="' + (Yd(0) + 11) + '" text-anchor="end" style="font-weight:600">−' + q.ecu + '</text>';
      var deep = q.lay.filter(function (l) { return l.t === 'tend'; }).pop(); q.lay.forEach(function (l) { if (l.t !== 'tend') return; ul += '<circle cx="' + (x0 + l.e * ke).toFixed(1) + '" cy="' + Yd(l.y) + '" r="3" style="fill:var(--load)"><title>strand layer at ' + f(l.y, 0) + ' mm: total strain ' + l.e.toFixed(4) + ', stress ' + f(l.s, 0) + ' MPa</title></circle>'; });
      if (deep) ul += '<text x="' + (x0 + deep.e * ke) + '" y="' + (Yd(deep.y) + 16) + '" text-anchor="middle" style="fill:var(--load)">strand ' + deep.e.toFixed(4) + ' (incl. prestrain)</text>';
      /* forces */
      var xf = 760, kf = 170 / Math.max(q.C, 1), Fm = Math.max.apply(null, q.lay.map(function (l) { return Math.abs(l.F); }).concat([1])), kl = 150 / Fm;
      ul += '<text x="' + xf + '" y="16" text-anchor="middle" style="font-weight:600">Forces at ultimate</text><text x="' + xf + '" y="30" text-anchor="middle" style="fill:var(--mut)">stress block ' + f(q.gamma, 2) + ' dn deep; steel by layer</text><line x1="' + xf + '" x2="' + xf + '" y1="' + Yd(0) + '" y2="' + Yd(Dp) + '" style="stroke:var(--ink)"/>';
      ul += '<rect x="' + (xf - 60) + '" y="' + Yd(0) + '" width="60" height="' + (a_blk * k) + '" style="fill:var(--acc);fill-opacity:.3;stroke:var(--acc)"/><line x1="' + (xf - 150) + '" x2="' + (xf - 62) + '" y1="' + Yd(yC) + '" y2="' + Yd(yC) + '" style="stroke:var(--acc);stroke-width:2.4"/><path d="M' + (xf - 62) + ' ' + Yd(yC) + 'l-9 -5v10z" style="fill:var(--acc)"/><text x="' + (xf - 152) + '" y="' + (Yd(yC) - 5) + '" style="font-weight:600">C = ' + f(q.C, 0) + ' kN</text>';
      q.lay.forEach(function (l) { var w = l.F * kl; ul += '<line x1="' + xf + '" x2="' + (xf + w) + '" y1="' + Yd(l.y) + '" y2="' + Yd(l.y) + '" style="stroke:' + (l.t === 'tend' ? 'var(--load)' : 'var(--ink)') + ';stroke-width:3"><title>' + (l.t === 'tend' ? 'strands' : 'bars') + ' at ' + f(l.y, 0) + ' mm: ' + f(l.s, 0) + ' MPa × ' + f(l.A, 0) + ' mm² = ' + f(l.F, 0) + ' kN</title></line>'; });
      ul += '<text x="' + (xf + 8) + '" y="' + (Yd(yT) - 8) + '" style="font-weight:600;fill:var(--load)">T = ' + f(T, 0) + ' kN</text><line x1="' + (xf + 200) + '" x2="' + (xf + 200) + '" y1="' + Yd(yC) + '" y2="' + Yd(yT) + '" style="stroke:var(--mut)"/><text x="' + (xf + 196) + '" y="' + ((Yd(yC) + Yd(yT)) / 2) + '" text-anchor="end" style="fill:var(--mut)">lever arm ' + f(yT - yC, 0) + ' mm</text></svg>';
      ul = '<h3 style="margin-top:10px">ULS bending — strain and force diagrams at point ' + (j + 1) + '</h3><div class="kpis"><div class="kpi"><span class="l">Neutral axis dn</span><span class="v">' + f(q.dn, 0) + ' mm</span><span class="s">kuo = ' + f(st.kuo, 3) + (st.kuo > 0.36 ? ' — above 0.36' : '') + '</span></div><div class="kpi"><span class="l">Muo</span><span class="v">' + f(q.Mu, 0) + ' kNm</span><span class="s">C × lever arm; C = T within ' + f(Math.abs(q.C - T), 1) + ' kN</span></div><div class="kpi"><span class="l">φ</span><span class="v">' + f(q.phi, 2) + '</span><span class="s">from kuo (unverified factor)</span></div><div class="kpi"><span class="l">φMu against M*</span><span class="v">' + f(st.phiMu, 0) + ' kNm</span><span class="s">M* ' + f(st.Mu, 0) + ' kNm → ' + (st.phiMu ? f(st.Mu / st.phiMu, 2) : '–') + '</span></div></div><div class="tbox" style="border:0">' + ul + '</div>' +
        '<div class="tbox"><table class="t"><thead><tr><th>Steel layer</th><th class="n">Depth below the deck top (mm)</th><th class="n">Area (mm²)</th><th class="n">Strain</th><th class="n">Stress (MPa)</th><th class="n">Force (kN)</th></tr></thead><tbody>' + q.lay.map(function (l) { return '<tr><td>' + (l.t === 'tend' ? 'Strands' : 'Bars') + '</td><td class="n">' + f(l.y, 0) + '</td><td class="n">' + f(l.A, 0) + '</td><td class="n">' + (l.t === 'tend' ? l.e.toFixed(4) : (q.ecu * (l.y - q.dn) / q.dn).toFixed(4)) + '</td><td class="n">' + f(l.s, 0) + '</td><td class="n">' + f(l.F, 0) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="note">Rectangular stress block on the composite section with strain compatibility; strand stress from the stress–strain curve at its total strain (prestrain + bending). Strands still inside their transmission or debonded length count at a reduced area. The φ factor and block coefficients are from the engine: unverified.</p>'; }
    var ok = s3.gb <= tl + 1e-9 && Math.min(s3.gt, s3.gb, s3.dt) >= cl - 1e-9;
    return '<section class="card res"><h3>Point of interest ' + (j + 1) + ' ' + U.tag('calc') + '<span class="sub">' + where + ' · x = ' + f(st.x, 3) + ' m from the bearing · G' + (ST.sel.gi + 1) + ' · combination <b>' + esc(cb.id + ' — ' + cb.name) + '</b></span></h3>' +
      '<div class="row">' + U.selBox('gi', U.girderOpts(g.ng), 'Girder') + (g.spans.length > 1 ? U.selBox('sk', U.spanOpts(g.spans.length), 'Span') : '') + U.selBox('poi', poiOpts, 'Point of interest') + U.selBox('cb', sls.map(function (c) { return [c.id, c.id + ' — ' + c.name]; }), 'Combination') + '</div>' +
      '<div class="kpis"><div class="kpi"><span class="l">Service moment Ms*</span><span class="v">' + f(Mt, 0) + ' kNm</span><span class="s">' + f(Mnc, 0) + ' on the girder alone + ' + f(Mc, 0) + ' composite</span></div><div class="kpi"><span class="l">Prestress at this section</span><span class="v">' + f(st.P, 0) + ' kN</span><span class="s">eccentricity ' + f(st.e, 0) + ' mm, long-term</span></div><div class="kpi"><span class="l">Girder soffit</span><span class="v">' + sg(s3.gb) + ' MPa</span><span class="s">limit +' + f(tl, 2) + ' MPa</span></div><div class="kpi"><span class="l">Bending strength</span><span class="v">' + (st.phiMu ? f(st.Mu / st.phiMu, 2) : '–') + '</span><span class="s">M* ' + f(st.Mu, 0) + ' / φMu ' + f(st.phiMu, 0) + ' kNm</span></div></div>' +
      '<h3 style="margin-top:6px">SLS stresses through the section — point ' + (j + 1) + ', ' + where.toLowerCase() + '</h3><div class="tbox" style="border:0">' + s + '</div>' +
      '<p class="note">Compression negative, tension positive (red fill). Stage 1 is carried by the Super-T alone and locked in; stage 2 acts on the composite section; the total is their sum. ' + (ok ? 'All faces are within the limits shown (' + lim.cS + ' f\'c in compression, +' + f(tl, 2) + ' MPa in tension).' : '<b>A face is outside the limits shown.</b>') + ' Deck stresses are in the deck concrete (transformed by Ec deck / Ec girder). Limits and the crack-control class are set under Check limits and Crack control on this page.</p>' + ul + '</section>';
  };
})();
