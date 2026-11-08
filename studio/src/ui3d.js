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
      var wall = line(xa + dir * 0.9, 0.35, zg, zh, cSub); wall.visible = SHOW.sub; root.add(wall);
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
    if (SHOW.labels) V.labels.forEach(function (l) { if (!l.on) return; var q = l.p.clone().project(V.cam); if (q.z > 1 || q.x < -1.1 || q.x > 1.1 || q.y < -1.1 || q.y > 1.1) return; html += '<span class="lbl" style="left:' + ((q.x + 1) / 2 * w).toFixed(0) + 'px;top:' + ((1 - q.y) / 2 * h).toFixed(0) + 'px">' + esc(l.t) + '</span>'; });
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
  };
})();
