/* ===== Bridge Studio UI: 3D bridge model (three.js r128). Built from the same geometry the grillage uses. ===== */
(function () {
  'use strict';
  var ST = U.ST, esc = U.esc, f = U.f;
  var SHOW = { deck: true, girders: true, cross: true, bearings: true, sub: true, piles: true, barriers: true, mesh: false, labels: true, util: false };
  var CHIPS = [['deck', 'Deck'], ['girders', 'Girders'], ['cross', 'Cross girders'], ['bearings', 'Bearings'], ['barriers', 'Barriers'], ['sub', 'Piers & abutments'], ['piles', 'Piles'], ['mesh', 'Mesh overlay'], ['labels', 'Dimensions'], ['util', 'Utilisation colours']];
  var V = null;

  function make() {
    if (typeof THREE === 'undefined') return null;
    var el = document.createElement('div'); el.className = 'v3';
    var R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); el.appendChild(R.domElement);
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1.6, 0.1, 2000);
    scene.add(new THREE.HemisphereLight(0xdfefff, 0x2a3440, 0.85)); var sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(-40, 60, 50); scene.add(sun);
    var ctl = THREE.OrbitControls ? new THREE.OrbitControls(cam, R.domElement) : null;
    var hud = document.createElement('div'); hud.className = 'hud'; el.appendChild(hud);
    var lbl = document.createElement('div'); el.appendChild(lbl);
    var pick = document.createElement('div'); pick.className = 'pick'; pick.hidden = true; el.appendChild(pick);
    V = { el: el, R: R, scene: scene, cam: cam, ctl: ctl, hud: hud, lbl: lbl, pick: pick, root: null, girders: [], labels: [], stamp: '', view: 'iso', box: null };
    if (ctl) ctl.addEventListener('change', render);
    var down = null;
    R.domElement.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    R.domElement.addEventListener('pointerup', function (e) { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return; pickAt(e); });
    new ResizeObserver(function () { size(); }).observe(el);
    hud.addEventListener('click', function (e) { var b = e.target.closest('[data-v3]'); if (!b) return; var k = b.getAttribute('data-v3'), v = b.getAttribute('data-x'); if (k === 'view') { V.view = v; frame(v); } else { SHOW[k] = !SHOW[k]; build(true); } hudPaint(); });
    return V;
  }
  function size() { if (!V) return; var w = V.el.clientWidth || 1000, h = V.el.clientHeight || 600; V.R.setSize(w, h, false); V.R.domElement.style.width = '100%'; V.R.domElement.style.height = '100%'; V.cam.aspect = w / h; V.cam.updateProjectionMatrix(); render(); }
  function hudPaint() {
    V.hud.innerHTML = ['iso', 'plan', 'elevation', 'section'].map(function (v) { return '<button class="chip" data-v3="view" data-x="' + v + '" aria-pressed="' + (V.view === v) + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('') + '<span style="width:12px"></span>' +
      CHIPS.map(function (c) { return '<button class="chip" data-v3="' + c[0] + '" aria-pressed="' + SHOW[c[0]] + '">' + c[1] + '</button>'; }).join('');
  }
  /* bridge coordinates (x along, y across, z up) to three.js (x, z, -y) */
  var P3 = function (x, y, z) { return new THREE.Vector3(x, z, -y); };
  function prism(pl, z0, z1, mat) {   /* pl: 4 plan points [[x, y]] anticlockwise */
    var b = pl.map(function (q) { return P3(q[0], q[1], z0); }), t = pl.map(function (q) { return P3(q[0], q[1], z1); }), v = [];
    var tri = function (a, c, d) { v.push(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z); }, quad = function (a, c, d, e) { tri(a, c, d); tri(a, d, e); };
    quad(t[0], t[1], t[2], t[3]); quad(b[0], b[3], b[2], b[1]); for (var i = 0; i < 4; i++) { var j = (i + 1) % 4; quad(b[i], b[j], t[j], t[i]); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
    var m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; return m;
  }
  var mat = function (c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.82, metalness: 0.02 }, o || {})); };
  function utilOf(gi, sk) {
    var R = ST.R.design; if (!R || !U.ok('design')) return null; var ck = (R.data.CK[sk] || [])[gi]; if (!ck) return null;
    return ck.reduce(function (b, c) { return c.u !== null && isFinite(c.u) && c.ok !== null ? Math.max(b, c.u) : b; }, 0);
  }
  function build(force) {
    var p = ST.p, st = CORE.stamp(p, ['geometry', 'section', 'mesh', 'substructure']) + JSON.stringify(SHOW) + (SHOW.util && ST.R.design ? ST.R.design.id + U.ok('design') : '') + ST.sel.gi + ':' + ST.sel.sk;
    if (!force && st === V.stamp) return; var first = !V.stamp; V.stamp = st;
    if (V.root) { V.scene.remove(V.root); V.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    var root = new THREE.Group(); V.root = root; V.girders = []; V.labels = [];
    var g = CORE.geometry(p), sc = CORE.sections(p, g), H = sc.H / 1000, t = p.slab / 1000, zs = -(H + t), zb = zs - 0.08, zh = zb - 1.2, zg = zb - 6.5, a = p.endDist;
    var cDeck = mat(0xb9c2ca), cGir = mat(0x8fa3b3), cSel = mat(0x39b6e3, { emissive: 0x0b4d66, emissiveIntensity: 0.5 }), cX = mat(0xc08a3e), cBear = mat(0x1f262d), cSub = mat(0x9aa0a6), cPile = mat(0x7d858c), cBar = mat(0xd5dbe0);
    /* girders: Super-T outline extruded along each girder */
    var shape = new THREE.Shape(sc.P.map(function (q) { return new THREE.Vector2(q[0] / 1000, q[1] / 1000); }));
    g.spans.forEach(function (sp, k) {
      for (var i = 0; i < g.ng; i++) {
        var geo = new THREE.ExtrudeGeometry(shape, { depth: sp.Lg, bevelEnabled: false }), u = SHOW.util ? utilOf(i, k) : null;
        var mm = (i === ST.sel.gi && k === ST.sel.sk) ? cSel.clone() : u !== null ? mat(u > 1 ? 0xd9534f : u > 0.9 ? 0xe2b04a : 0x4cc38a) : cGir.clone();
        var me = new THREE.Mesh(geo, mm); me.rotation.y = Math.PI / 2; me.position.copy(P3(g.xAt(k, i, 0) - a, g.y[i], zs)); me.userData = { gi: i, sk: k, u: u };
        me.visible = SHOW.girders; root.add(me); V.girders.push(me);
        V.labels.push({ p: P3(g.xAt(k, i, 0.5), g.y[i], zs - 0.2), t: 'G' + (i + 1), on: k === 0 || g.spans.length < 4 });
      }
      var x0 = sp.x0 - a, x1 = sp.x0 + sp.L + a, eL = g.edgeL, eR = g.edgeR, T = g.t;
      var d = prism([[x0 + eL * T, eL], [x1 + eL * T, eL], [x1 + eR * T, eR], [x0 + eR * T, eR]], -t, 0, cDeck); d.visible = SHOW.deck; root.add(d);
      [[eL, eL + p.barrierW], [eR - p.barrierW, eR]].forEach(function (b) { var m = prism([[x0 + b[0] * T, b[0]], [x1 + b[0] * T, b[0]], [x1 + b[1] * T, b[1]], [x0 + b[1] * T, b[1]]], 0, 0.9, cBar); m.visible = SHOW.barriers; root.add(m); });
      [0, 1].forEach(function (fr) {
        var xc = sp.x0 + fr * sp.L, w = p.cgW / 2, ya = g.y[0], yb = g.y[g.ng - 1];
        var cg = prism([[xc - w + ya * T, ya], [xc + w + ya * T, ya], [xc + w + yb * T, yb], [xc - w + yb * T, yb]], zs + 0.1, -t, cX); cg.visible = SHOW.cross; root.add(cg);
        for (var i2 = 0; i2 < g.ng; i2++) { var xb = g.xAt(k, i2, fr), yy = g.y[i2]; var br = prism([[xb - 0.3, yy - 0.3], [xb + 0.3, yy - 0.3], [xb + 0.3, yy + 0.3], [xb - 0.3, yy + 0.3]], zb, zs, cBear); br.visible = SHOW.bearings; root.add(br); }
      });
      V.labels.push({ p: P3(sp.x0 + sp.L / 2 + eL * T, eL - 1.2, 0), t: 'Span ' + (k + 1) + ': ' + f(sp.L, 1) + ' m', on: true });
    });
    /* substructure: abutments at the ends, piers between spans (schematic proportions) */
    var eL2 = g.edgeL - 0.4, eR2 = g.edgeR + 0.4, T2 = g.t, line = function (xc, w, z0, z1, m) { return prism([[xc - w + eL2 * T2, eL2], [xc + w + eL2 * T2, eL2], [xc + w + eR2 * T2, eR2], [xc - w + eR2 * T2, eR2]], z0, z1, m); };
    var abut = [g.spans[0].x0, g.spans[g.spans.length - 1].x0 + g.spans[g.spans.length - 1].L];
    abut.forEach(function (xa, q) {
      var dir = q ? 1 : -1, hs = line(xa + dir * 0.2, 0.9, zh, zb, cSub); hs.visible = SHOW.sub; root.add(hs);
      var P = p.piles; for (var i = 0; i < P.n; i++) { var y = (i - (P.n - 1) / 2) * P.s, cy = new THREE.Mesh(new THREE.CylinderGeometry(P.D / 2000, P.D / 2000, P.Lf + 6, 20), cPile); cy.position.copy(P3(xa + dir * 0.2 + y * T2, y, zh - (P.Lf + 6) / 2)); cy.visible = SHOW.piles; root.add(cy); }
      V.labels.push({ p: P3(xa + dir * 0.2 + eR2 * T2, eR2 + 0.8, zh), t: 'Abutment ' + (q ? 'B' : 'A'), on: true });
    });
    for (var k2 = 0; k2 < g.spans.length - 1; k2++) {
      var xp = (g.spans[k2].x0 + g.spans[k2].L + g.spans[k2 + 1].x0) / 2, hd = line(xp, 0.8, zh, zb, cSub); hd.visible = SHOW.sub; root.add(hd);
      [-0.33, 0, 0.33].forEach(function (fy) { var y = fy * (g.edgeR - g.edgeL), c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, zh - zg, 24), cSub); c.position.copy(P3(xp + y * T2, y, (zh + zg) / 2)); c.visible = SHOW.sub; root.add(c); });
      V.labels.push({ p: P3(xp + g.edgeR * T2, g.edgeR + 0.8, zh), t: 'Pier ' + (k2 + 1), on: true });
    }
    /* ground, mesh overlay, width dimension */
    var gp = new THREE.Mesh(new THREE.PlaneGeometry(g.total + 60, g.W + 60), new THREE.MeshStandardMaterial({ color: 0x3b4a3f, transparent: true, opacity: 0.55, roughness: 1 })); gp.rotation.x = -Math.PI / 2; gp.position.set(g.total / 2, zg, 0); root.add(gp);
    if (SHOW.mesh) {
      var m = CORE.mesh(p, g, sc), pts = []; m.els.forEach(function (e) { var A1 = m.nodes[e.n1], B1 = m.nodes[e.n2]; [A1, B1].forEach(function (n) { var v = P3(n.x, n.y, 0.03); pts.push(v.x, v.y, v.z); }); });
      var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); root.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x39b6e3 })));
      var np = []; m.nodes.forEach(function (n) { var v = P3(n.x, n.y, 0.04); np.push(v.x, v.y, v.z); }); var ng2 = new THREE.BufferGeometry(); ng2.setAttribute('position', new THREE.Float32BufferAttribute(np, 3)); root.add(new THREE.Points(ng2, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18 })));
    }
    V.labels.push({ p: P3(g.total + g.edgeR * g.t + 1.5, 0, 0.3), t: 'Deck ' + f(g.W, 2) + ' m wide', on: true });
    V.labels.push({ p: P3(g.edgeL * g.t - 2, 0, zs), t: 'Skew ' + p.skew + '°', on: true });
    if (DF.G) root.visible = false;   /* the deflected shape replaces the solid model while it is shown */
    V.scene.add(root);
    V.box = { c: new THREE.Vector3(g.total / 2, zs / 2, 0), L: g.total, W: g.W, zg: zg };
    if (first) frame(V.view); else render();
  }
  function frame(v) {
    var b = V.box, c = b.c, d = Math.max(b.L * 0.95, b.W * 2.0, 30);
    var pos = { iso: [c.x - d * 0.55, c.y + d * 0.45, c.z + d * 0.85], plan: [c.x, c.y + d * 1.15, c.z + 0.001], elevation: [c.x, c.y + 1, c.z + d * 1.05], section: [c.x - d * 0.95, c.y + 0.5, c.z + 0.001] }[v];
    V.cam.position.set(pos[0], pos[1], pos[2]); if (V.ctl) { V.ctl.target.copy(c); V.ctl.update(); } else V.cam.lookAt(c);
    render();
  }
  function render() {
    if (!V) return; V.R.render(V.scene, V.cam);
    var w = V.el.clientWidth, h = V.el.clientHeight, html = '';
    if (SHOW.labels && !DF.G) V.labels.forEach(function (l) { if (!l.on) return; var q = l.p.clone().project(V.cam); if (q.z > 1 || q.x < -1.1 || q.x > 1.1 || q.y < -1.1 || q.y > 1.1) return; html += '<span class="lbl" style="left:' + ((q.x + 1) / 2 * w).toFixed(0) + 'px;top:' + ((1 - q.y) / 2 * h).toFixed(0) + 'px">' + esc(l.t) + '</span>'; });
    V.lbl.innerHTML = html;
  }
  function pickAt(e) {
    var r = V.R.domElement.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), rc = new THREE.Raycaster(); rc.setFromCamera(m, V.cam);
    var hit = rc.intersectObjects(V.girders.filter(function (o) { return o.visible; }), false)[0];
    if (!hit) { V.pick.hidden = true; return; }
    var u = hit.object.userData; ST.sel.gi = u.gi; ST.sel.sk = u.sk; build(true); pickPaint();
  }
  function pickPaint() {
    var g = CORE.geometry(ST.p), sp = g.spans[ST.sel.sk], A = U.A(), mid = '';
    if (!sp) { V.pick.hidden = true; return; }
    if (A && U.ok('combos')) { var gv = ANALYSIS.governing(A, 'M:' + ST.sel.sk + ':' + ST.sel.gi + ':' + Math.min(Math.round(A.m.n / 2), A.m.n - 1) + ':a', 'ULS', 'max'); if (gv) mid = '<div>ULS mid-span moment ' + f(gv.v) + ' kNm (' + esc(gv.id) + ')</div>'; }
    var u = utilOf(ST.sel.gi, ST.sel.sk);
    V.pick.innerHTML = '<b>Girder G' + (ST.sel.gi + 1) + (g.spans.length > 1 ? ', span ' + (ST.sel.sk + 1) : '') + '</b><div>' + esc(ST.p.girder) + ', ' + f(sp.Lg, 2) + ' m long, offset ' + f(g.y[ST.sel.gi], 2) + ' m</div>' + mid + (u !== null ? '<div>Highest design utilisation ' + u.toFixed(2) + '</div>' : '') +
      '<div class="row" style="margin-top:6px;gap:6px"><button class="chip" data-tab="design">Design</button><button class="chip" data-tab="analysis">Results</button></div>';
    V.pick.hidden = false;
  }


  /* ===== Deflected shape animation: static cases, vibration modes, an M1600 truck crossing. Drawn on the analysis frame
     (deck grillage, sill beams, piles), translations only, exaggerated by a scale shown on screen. ===== */
  var DF = { src: '', play: true, mul: 1, key: '', F: null, G: null, raf: 0, busy: false };
  var SRC = [['', 'Off'], ['DL', 'Dead load: girder + wet deck, then barriers + surfacing'], ['G12', 'Girder + wet deck (girder alone)'], ['SDL', 'Barriers + surfacing (composite)'],
    ['MV', 'M1600 truck crossing'], ['MVD', 'Dead load + M1600 truck crossing'], ['BRK', 'Braking (±)'], ['WT', 'Transverse wind, serviceability (±)'], ['TU', 'Uniform temperature (±)'], ['MODE', 'Vibration modes']];
  function frameModel() {   /* the analysis frame and its factorised stiffness, kept until any input changes */
    var p = ST.p, key = JSON.stringify(p); if (DF.F && DF.F.key === key) return DF.F;
    var g = CORE.geometry(p), sc = CORE.sections(p, g), m = CORE.mesh(p, g, sc), S = CORE.build(m), N = m.nodes.concat(m.subN || []);
    DF.F = { key: key, p: p, g: g, sc: sc, m: m, S: S, N: N, cache: {} }; return DF.F;
  }
  function vehicle(F, Xf) {   /* M1600 wheel loads [x, y, P] with the front axle at Xf, in the lane against the left kerb; minimum gap between groups 2 and 3 */
    var v = CORE.STD.M1600, a = v.axle_spacing_m, y0 = F.g.cwL + CORE.STD.laneW / 2, out = [], g0 = [0, 2 * a + v.gap_12_m], x;
    g0.push(g0[1] + 2 * a + v.gap_23_min_m); g0.push(g0[2] + 2 * a + v.gap_34_m);
    g0.forEach(function (q) { for (var i = 0; i < 3; i++) { x = Xf - q - i * a; [-1, 1].forEach(function (sd) { out.push([x, y0 + sd * v.track_m / 2, v.wheel_kN]); }); } });
    return out;
  }
  function solveLoads(F, wheels) {
    var R = new Float64Array(CORE.ND * F.m.nodes.length);
    wheels.forEach(function (w) { CORE.weights(F.m, F.g, w[0], w[1]).forEach(function (q) { R[CORE.ND * q[0]] -= w[2] * q[1]; }); });
    return CORE.solve(F.S, R);
  }
  function caseU(F, id) {   /* displacement vector of one static case */
    if (F.cache[id]) return F.cache[id];
    var p = F.p, g = F.g, m = F.m, u;
    if (id === 'G12') {   /* simply supported girder under its own weight and the wet slab, before the deck is composite: 5-term beam formula at each girder node */
      u = new Float64Array(F.S.nd);
      g.spans.forEach(function (sp, k) { var ga = CORE.girderAlone(p, g, F.sc, sp), w = ga.wG + ga.wD, L = ga.L, EI = F.sc.Eg * 1e3 * F.sc.I * 1e-12;
        m.nodes.forEach(function (n) { if (n.k !== k) return; var x = n.j / m.n * L; u[CORE.ND * n.id] = -w * x * (L * L * L - 2 * L * x * x + x * x * x) / (24 * EI); }); });
    } else if (id === 'SDL') u = CORE.solve(F.S, CORE.sdlLoads(p, m, g));
    else if (id === 'DL') { var a = caseU(F, 'G12'), b = caseU(F, 'SDL'); u = new Float64Array(F.S.nd); for (var i = 0; i < u.length; i++) u[i] = a[i] + (b[i] || 0); }
    else if (id === 'BRK') u = CORE.solve(F.S, CORE.hzLoads(m, g, p, 'x', function () { return p.hBrake || 0; }));
    else if (id === 'WT') u = CORE.solve(F.S, CORE.hzLoads(m, g, p, 'y', function (k) { return g.spans[k].L * (p.windTs || 0); }));
    else if (id === 'TU') u = CORE.solve(F.S, CORE.thermalLoads(m, p, p.dTuni || 0));
    return (F.cache[id] = u);
  }
  function compute(id) {   /* returns { frames: [U], kind, period (s of animation), info } */
    var F = frameModel(), ND = CORE.ND;
    if (id === 'MODE') {
      if (!F.cache.modes) F.cache.modes = CORE.modesF(F.S, CORE.frameMass(F.p, F.m, F.g, F.sc).Md, 12);
      var md = F.cache.modes[Math.min(DF.mode || 0, F.cache.modes.length - 1)], u = md.u, mx = 0;
      for (var i = 0; i < u.length; i++) if (i % ND === 0 || i % ND === 3 || i % ND === 4) mx = Math.max(mx, Math.abs(u[i]));
      return { frames: [u], kind: 'mode', period: 2, unit: 1 / mx, md: md };
    }
    if (id === 'MV' || id === 'MVD') {
      var base = id === 'MVD' ? caseU(F, 'DL') : null, fr = [], ax = [], len = F.g.total + 30;
      for (var X = -0.5; X <= len; X += 0.5) { var wh = vehicle(F, X), U2 = solveLoads(F, wh); if (base) for (var j = 0; j < U2.length; j++) U2[j] += base[j] || 0; fr.push(U2); ax.push(wh); }
      return { frames: fr, axles: ax, kind: 'moving', period: len / 6 };   /* about 6 m/s on screen */
    }
    return { frames: [caseU(F, id)], kind: id === 'BRK' || id === 'WT' || id === 'TU' ? 'pm' : 'ramp', period: 3 };
  }
  function vertexColour(c, r) { c.setHSL(0.62 * (1 - Math.min(1, r)), 0.85, 0.52); }
  function defDrop() { if (DF.G) { V.scene.remove(DF.G.grp); DF.G.grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); DF.G = null; } }
  function defBuild() {
    defDrop(); if (!DF.src) { if (V.root) V.root.visible = true; defHud(); render(); return; }
    DF.busy = true; defHud();
    setTimeout(function () {
      var F, R; try { F = frameModel(); R = compute(DF.src); } catch (e) { DF.busy = false; DF.err = e.message; defHud(); return; }
      DF.busy = false; DF.err = '';
      var N = F.N, ND = CORE.ND, nv = N.length, base = new Float32Array(3 * nv), pos = new Float32Array(3 * nv), col = new Float32Array(3 * nv), byId = [];
      N.forEach(function (n) { byId[n.id] = n; });
      for (var i = 0; i < nv; i++) { var n = byId[i], q = P3(n.x, n.y, n.z || 0); base[3 * i] = q.x; base[3 * i + 1] = q.y; base[3 * i + 2] = q.z; }
      pos.set(base);
      var tri = [], lin = [], ghost;
      F.g.spans.forEach(function (sp, k) { for (var a = 0; a < F.g.ng - 1; a++) for (var j = 0; j < F.m.n; j++) { var id = function (ii, jj) { return F.m.id[k + ':' + ii + ':' + jj]; }; tri.push(id(a, j), id(a + 1, j), id(a + 1, j + 1), id(a, j), id(a + 1, j + 1), id(a, j + 1)); } });
      F.m.els.concat(F.m.subE || []).forEach(function (e) { lin.push(e.n1, e.n2); });
      F.m.sup.forEach(function (s) { if (s.below !== undefined) lin.push(s.node, s.below); });
      var PA = new THREE.BufferAttribute(pos, 3), CA = new THREE.BufferAttribute(col, 3), grp = new THREE.Group();
      var gs = new THREE.BufferGeometry(); gs.setAttribute('position', PA); gs.setAttribute('color', CA); gs.setIndex(tri); gs.computeVertexNormals();
      grp.add(new THREE.Mesh(gs, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })));
      var gl = new THREE.BufferGeometry(); gl.setAttribute('position', PA); gl.setAttribute('color', CA); gl.setIndex(lin);
      grp.add(new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ vertexColors: true })));
      var g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.BufferAttribute(base, 3)); g0.setIndex(lin);
      ghost = new THREE.LineSegments(g0, new THREE.LineBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.35 })); grp.add(ghost);
      var wheels = [];
      if (R.axles) { var wm = new THREE.MeshStandardMaterial({ color: 0xf0b030, emissive: 0x553300 }); R.axles[0].forEach(function () { var b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.5), wm); grp.add(b); wheels.push(b); }); }
      /* scale: the largest translation over all frames drawn as 3 % of the longest span */
      var mx = 0, mw = 0, comp = [0, 0, 0];
      R.frames.forEach(function (u) { for (var i2 = 0; i2 < nv; i2++) { var w = Math.abs(u[ND * i2] || 0), ux = Math.abs(u[ND * i2 + 3] || 0), uy = Math.abs(u[ND * i2 + 4] || 0); mw = Math.max(mw, w); comp[0] = Math.max(comp[0], ux); comp[1] = Math.max(comp[1], uy); comp[2] = Math.max(comp[2], w); mx = Math.max(mx, w, ux, uy); } });
      var Lmax = Math.max.apply(null, F.g.spans.map(function (s2) { return s2.L; }));
      DF.G = { grp: grp, R: R, F: F, base: base, pos: pos, col: col, PA: PA, CA: CA, gs: gs, wheels: wheels, mx: mx, comp: comp, auto: mx > 0 ? 0.03 * Lmax / mx : 1, t0: performance.now() };
      if (V.root) V.root.visible = false; V.scene.add(grp); defHud(); tick();
    }, 20);
  }
  function tick() {
    cancelAnimationFrame(DF.raf); var G = DF.G; if (!G || !V.el.isConnected) return;
    var R = G.R, ND = CORE.ND, t = (performance.now() - G.t0) / 1000, ph = (t % R.period) / R.period, u, amp, c = new THREE.Color(), nv = G.pos.length / 3;
    if (!DF.play) ph = DF.ph || 0.25; else DF.ph = ph;
    if (R.kind === 'moving') { var k = Math.min(R.frames.length - 1, Math.floor(ph * R.frames.length)); u = R.frames[k]; amp = 1; G.k = k; }
    else { u = R.frames[0]; amp = R.kind === 'ramp' ? (1 - Math.cos(2 * Math.PI * ph)) / 2 : Math.sin(2 * Math.PI * ph); }
    var s = G.auto * DF.mul * amp, mw = G.mx || 1;
    for (var i = 0; i < nv; i++) { var w = u[ND * i] || 0, ux = u[ND * i + 3] || 0, uy = u[ND * i + 4] || 0, q = P3(ux * s, uy * s, w * s);
      G.pos[3 * i] = G.base[3 * i] + q.x; G.pos[3 * i + 1] = G.base[3 * i + 1] + q.y; G.pos[3 * i + 2] = G.base[3 * i + 2] + q.z;
      vertexColour(c, Math.sqrt(w * w + ux * ux + uy * uy) * Math.abs(amp) / mw); G.col[3 * i] = c.r; G.col[3 * i + 1] = c.g; G.col[3 * i + 2] = c.b; }
    G.PA.needsUpdate = true; G.CA.needsUpdate = true; G.gs.computeVertexNormals();
    if (G.wheels.length) R.axles[G.k].forEach(function (wl, j) { var z = 0; CORE.weights(G.F.m, G.F.g, wl[0], wl[1]).forEach(function (q) { z += q[1] * (u[ND * q[0]] || 0); }); var on = wl[0] >= -1 && wl[0] <= G.F.g.total + Math.abs(G.F.g.t) * G.F.g.W + 1; G.wheels[j].visible = on; G.wheels[j].position.copy(P3(wl[0], wl[1], z * s + 0.25)); });
    V.R.render(V.scene, V.cam); V.lbl.innerHTML = '';
    if (R.kind === 'moving' && DF.play && (t | 0) !== DF.lastT) { DF.lastT = t | 0; defHud(); }
    if (DF.play) DF.raf = requestAnimationFrame(tick);
  }
  function defHud() {
    if (!V.dh) { V.dh = document.createElement('div'); V.dh.className = 'pick'; V.dh.style.cssText = 'left:10px;right:auto;max-width:min(470px,62%)'; V.el.appendChild(V.dh);
      V.dh.addEventListener('change', function (e) { if (e.target.name === 'dsrc') { DF.src = e.target.value; defBuild(); } else if (e.target.name === 'dmode') { DF.mode = +e.target.value; defBuild(); } });
      V.dh.addEventListener('click', function (e) { var b = e.target.closest('[data-df]'); if (!b) return; var k = b.getAttribute('data-df'); if (k === 'play') { DF.play = !DF.play; if (DF.G) DF.G.t0 = performance.now() - (DF.ph || 0) * DF.G.R.period * 1000; tick(); } else DF.mul = +b.getAttribute('data-x'); defHud(); if (!DF.play) tick(); }); }
    var G = DF.G, h = '<b>Deflected shape</b> <select name="dsrc" aria-label="Load case to animate" style="margin-left:6px;max-width:100%">' + SRC.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === DF.src ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    if (DF.src === 'MODE') { var md = DF.F && DF.F.cache.modes; h += ' <select name="dmode" aria-label="Mode">' + (md || new Array(12).fill(0)).map(function (q, i) { return '<option value="' + i + '"' + (i === (DF.mode || 0) ? ' selected' : '') + '>Mode ' + (i + 1) + (md ? ' – ' + f(q.f, 2) + ' Hz' : '') + '</option>'; }).join('') + '</select>'; }
    if (DF.busy) h += '<div>Solving the frame…</div>';
    else if (DF.err) h += '<div style="color:#ff9b8f">' + esc(DF.err) + '</div>';
    else if (G) {
      var mm = function (v) { return f(v * 1000, 1) + ' mm'; }, R = G.R;
      h += '<div class="row" style="gap:6px;margin:6px 0"><button class="chip" data-df="play">' + (DF.play ? 'Pause' : 'Play') + '</button>' + [0.5, 1, 2, 5].map(function (x) { return '<button class="chip" data-df="mul" data-x="' + x + '" aria-pressed="' + (DF.mul === x) + '">×' + x + '</button>'; }).join('') + '<span style="opacity:.75">exaggeration ' + f(G.auto * DF.mul, 0) + '×</span></div>';
      if (R.kind === 'mode') h += '<div>Mode ' + ((DF.mode || 0) + 1) + ': ' + f(R.md.f, 3) + ' Hz, period ' + f(R.md.T, 3) + ' s. Shape normalised: amplitude has no physical size. Animation slowed to 2 s per cycle.</div>';
      else h += '<div>Largest movement: vertical ' + mm(G.comp[2]) + ', along ' + mm(G.comp[0]) + ', across ' + mm(G.comp[1]) + (R.kind === 'pm' ? ' (either direction)' : '') + '</div>';
      if (R.kind === 'moving') { var k = G.k || 0, X = R.axles[k][0][0], U2 = R.frames[k], wmin = 0; G.F.m.nodes.forEach(function (n) { wmin = Math.min(wmin, U2[CORE.ND * n.id]); }); h += '<div>Front axle at x = ' + f(X, 1) + ' m; deflection now ' + mm(-wmin) + '</div>'; }
      h += '<div style="opacity:.75;margin-top:4px">' + ({ G12: 'Short-term modulus, before composite action. Prestress camber is not included: see Stages, hog & temperature.', DL: 'Girder + wet deck on the girder alone, then barriers and surfacing on the composite frame. No prestress camber, creep or shrinkage.', SDL: 'On the composite frame with the bearings, sill beams, piles and soil springs.', MV: 'Wheel loads only (4 tri-axle groups, 60 kN wheels), lane against the left kerb, static: no dynamic allowance, no lane UDL.', MVD: 'Dead load as above, plus the M1600 wheel loads (static, no lane UDL).', BRK: p_('hBrake', 'kN per span along the bridge.'), WT: p_('windTs', 'kN/m across the bridge.'), TU: p_('dTuni', '°C uniform change of the deck.'), MODE: 'Modes of the whole frame with the deck and substructure mass (as on the Earthquake & modes page).' }[DF.src] || '') + ' Colour: size of the movement, blue small to red largest.</div>';
    } else h += '<div style="opacity:.75;margin-top:4px">Animate the deflected shape of the analysis frame under a load case, a vibration mode or a truck crossing.</div>';
    V.dh.innerHTML = h;
  }
  function p_(k, t) { return f(ST.p[k] || 0, 1) + ' ' + t; }

  U.V3 = { theme: function () {} };
  U.V3.snapshot = function (w, h) {   /* PNG data URL of the iso view; builds an off-screen viewer when the 3D page has not been opened */
    if (!V && !make()) return null;
    var host = null; if (!V.el.isConnected) { host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + (w || 1200) + 'px;height:' + (h || 700) + 'px'; host.appendChild(V.el); document.body.appendChild(host); hudPaint(); }
    var keep = V.view; size(); build(true); frame('iso'); var url = V.R.domElement.toDataURL('image/png'); V.view = keep;
    if (host) { host.remove(); }
    return url;
  };

  U.RENDER.model = function () {
    var p = ST.p, g = CORE.geometry(p);
    var h = '<div><h1 class="h1">3D bridge model</h1><p class="lede">Built from the same inputs as the grillage. Drag to rotate, scroll to zoom, right-drag to pan, click a girder to select it. Substructure proportions are schematic.</p></div>';
    h += '<div id="v3slot">' + (typeof THREE === 'undefined' ? '<div class="v3"><div class="fallback">The 3D viewer needs the three.js library, which did not load. The rest of the application works without it.</div></div>' : '') + '</div>';
    h += '<section class="card"><h3>Geometry ' + U.tag('ill') + '<span class="sub">changing a value rebuilds the model and the mesh and marks the analysis out of date</span></h3><div class="form">' +
      U.fld('spans', 'Span lengths', 'm', { text: true, tip: 'Comma-separated, e.g. 24, 28, 24' }) + U.fld('skew', 'Skew angle', '°', { min: 0, max: 45 }) + U.fld('ng', 'Number of girders', '', { min: 2, max: 14, step: 1 }) + U.fld('spacing', 'Girder spacing', 'm', { min: 1.3, max: 2.8 }) +
      U.fld('overhang', 'Deck overhang', 'm', { min: 0.3, max: 2 }) + U.fld('girder', 'Girder section', '', { options: Object.keys(SECLIB.SEC) }) + U.fld('slab', 'Deck slab', 'mm', { min: 150, max: 300 }) + U.fld('barrierW', 'Barrier width', 'm', { min: 0.3, max: 1 }) + U.fld('endDist', 'Bearing to girder end', 'm', { min: 0.2, max: 1 }) + '</div>' +
      '<p class="note">Deck ' + f(g.W, 2) + ' m wide, carriageway ' + f(g.cwR - g.cwL, 2) + ' m (' + g.lanes + ' lane' + (g.lanes === 1 ? '' : 's') + '), total length ' + f(g.total, 2) + ' m between end bearings. Girder spacing range limited to the standard top-flange widths.</p></section>';
    return h;
  };
  U.AFTER.model = function () {
    var slot = U.$('#v3slot'); if (!slot || typeof THREE === 'undefined') return;
    if (!V && !make()) return;
    slot.appendChild(V.el); hudPaint(); size(); build(false); if (V.pick && !V.pick.hidden) pickPaint();
    if (DF.src && (!DF.F || DF.F.key !== JSON.stringify(ST.p))) defBuild(); else { defHud(); if (DF.G) { V.root.visible = false; tick(); } }
  };
})();
