(function () {
  const D = JSON.parse(document.getElementById('model-data').textContent);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const $ = (id) => document.getElementById(id);
  const f0 = (v) => Math.round(v).toLocaleString('en-AU');
  const f2 = (v) => Number(v).toFixed(2);

  /* ---------- tabs ---------- */
  const tabs = [['tab-model', 'p-model', 'model'], ['tab-design', 'p-design', 'design'], ['tab-traffic', 'p-traffic', 'traffic'], ['tab-hog', 'p-hog', 'camber'], ['tab-section', 'p-section', 'section'], ['tab-sub', 'p-sub', 'supports'], ['tab-loads', 'p-loads', 'loads']];
  const D2 = JSON.parse(document.getElementById('model-data2').textContent);
  function show(k) { tabs.forEach(([t, p, n]) => { const on = n === k; $(t).setAttribute('aria-selected', on); $(p).hidden = !on; }); if (k === 'model') resize(); if (window.__redraw && window.__redraw[k]) window.__redraw[k](); }
  tabs.forEach(([t, , n]) => $(t).addEventListener('click', () => show(n)));
  $('meta').textContent += ' · description revision ' + D.rev;

  /* ---------- result options ---------- */
  D.modes.forEach((m, i) => { const o = document.createElement('option'); o.value = 'm' + i; o.textContent = 'Mode ' + (i + 1) + ', T = ' + m.T.toFixed(3) + ' s (animated)'; $('res').appendChild(o); });

  /* ---------- groups ---------- */
  const G = [
    { k: 'girder', label: 'Super-T girders', roles: ['girder'], c: '--r-girder', on: true },
    { k: 'web', label: 'Girder web members', roles: ['web'], c: '--r-girder', on: true, dim: .55 },
    { k: 'slab', label: 'Deck slab strips', roles: ['slab', 'midgap', 'deck_end'], c: '--r-slab', on: true },
    { k: 'edge', label: 'Deck edges', roles: ['edge'], c: '--r-edge', on: true },
    { k: 'cross', label: 'End cross girders', roles: ['cross_girder'], c: '--r-cross', on: true },
    { k: 'sill', label: 'Sill beams', roles: ['sill'], c: '--r-sill', on: true },
    { k: 'pile', label: 'Piles', roles: ['pile'], c: '--r-pile', on: true },
    { k: 'rigid', label: 'Rigid offsets', roles: ['rigid', 'rigid_sill_pile', 'rigid_sill_seat', 'rigid_girder_bearing'], c: '--r-rigid', on: false },
    { k: 'bearing', label: 'Elastomeric bearings', links: true, c: '--r-link', on: true }
  ];
  const segOf = {};
  G.forEach(g => { segOf[g.k] = g.links ? D.links.map(l => [l[0], l[1]]) : D.members.filter(m => g.roles.includes(m[2])).map(m => [m[0], m[1]]); });
  const rolesBox = $('roles');
  G.forEach(g => {
    const l = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = g.on; cb.id = 'role-' + g.k;
    cb.addEventListener('change', () => { g.on = cb.checked; if (g.obj) g.obj.visible = g.on; if (g.ghost) g.ghost.visible = g.on && state.res !== 'none'; });
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = 'var(' + g.c + ')';
    const t = document.createElement('span'); t.textContent = g.label;
    const n = document.createElement('span'); n.className = 'n'; n.textContent = segOf[g.k].length;
    l.append(cb, sw, t, n); rolesBox.appendChild(l);
  });

  /* ---------- three.js ---------- */
  const stage = $('stage');
  if (!window.THREE) { stage.innerHTML = '<div class="err">The 3D library did not load. Reload the page to try again.</div>'; }
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  stage.insertBefore(renderer.domElement, stage.firstChild);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
  const ctl = new THREE.OrbitControls(cam, renderer.domElement); ctl.enableDamping = true;
  const P = (p) => new THREE.Vector3(p[0], p[2], -p[1]);           // E, N, z  ->  three (x, y up, z)
  const base = D.nodes.map(P);
  const state = { res: 'none', scale: 200, t0: performance.now() };

  function makeLines(segs, color, opacity) {
    const pos = new Float32Array(segs.length * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    return new THREE.LineSegments(g, m);
  }
  function writePos(obj, segs, pts) {
    const a = obj.geometry.attributes.position.array;
    segs.forEach((s, i) => { const p = pts[s[0]], q = pts[s[1]]; a.set([p.x, p.y, p.z, q.x, q.y, q.z], i * 6); });
    obj.geometry.attributes.position.needsUpdate = true; obj.geometry.computeBoundingSphere();
  }
  G.forEach(g => {
    g.obj = makeLines(segOf[g.k], css(g.c), g.dim || 1); g.obj.visible = g.on; scene.add(g.obj);
    g.ghost = makeLines(segOf[g.k], css('--muted'), .18); g.ghost.visible = false; scene.add(g.ghost); writePos(g.ghost, segOf[g.k], base);
  });
  const sprPos = new Float32Array(D.springs.length * 3);
  D.springs.forEach((n, i) => sprPos.set([base[n].x, base[n].y, base[n].z], i * 3));
  const sprG = new THREE.BufferGeometry(); sprG.setAttribute('position', new THREE.BufferAttribute(sprPos, 3));
  const spr = new THREE.Points(sprG, new THREE.PointsMaterial({ color: css('--r-pile'), size: 3, sizeAttenuation: false })); scene.add(spr);

  function recolor() {
    scene.background = new THREE.Color(css('--canvas'));
    G.forEach(g => { g.obj.material.color.set(css(g.c)); g.ghost.material.color.set(css('--muted')); });
    spr.material.color.set(css('--r-pile'));
  }
  recolor();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor); } catch (e) {}
  new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const box = new THREE.Box3().setFromPoints(base); const ctr = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3()).length();
  function view(k) {
    const d = size * 1.05;
    const dir = { iso: [0.75, 0.55, 0.9], plan: [0.0001, 1, 0.0001], elev: [0, 0.05, 1], sec: [1, 0.05, 0] }[k];
    cam.position.set(ctr.x + dir[0] * d, ctr.y + dir[1] * d, ctr.z + dir[2] * d); ctl.target.copy(ctr); ctl.update();
  }
  ['iso', 'plan', 'elev', 'sec'].forEach(k => $('v-' + k).addEventListener('click', () => view(k)));
  view('iso');

  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();

  function field() {
    if (state.res === 'sw') return D.sw; if (state.res === 'sdl') return D.sdl;
    if (state.res[0] === 'm') return D.modes[Number(state.res.slice(1))].u; return null;
  }
  function maxAbs(u) { let m = 0; u.forEach(v => { m = Math.max(m, Math.hypot(v[0], v[1], v[2])); }); return m; }
  function info() {
    const kv = $('rkv'); kv.innerHTML = '';
    const add = (k, v) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; kv.append(dt, dd); };
    add('Nodes / members', D.nodes.length + ' / ' + D.members.length);
    add('Bearings / springs', D.links.length + ' / ' + D.springs.length);
    const u = field();
    if (state.res === 'sw') { add('Total self weight', f0(D.sw_total) + ' kN'); add('Max deflection', (maxAbs(u) * 1000).toFixed(1) + ' mm'); }
    else if (state.res === 'sdl') add('Max deflection', (maxAbs(u) * 1000).toFixed(1) + ' mm');
    else if (u) { const m = D.modes[Number(state.res.slice(1))]; add('Period', m.T.toFixed(3) + ' s'); add('Mass in X / Y / Z', [m.eff.X, m.eff.Y, m.eff.Z].map(v => (v * 100).toFixed(0) + '%').join(' / ')); }
  }
  function updScale() {
    const u = field(); const v = Math.pow(10, Number($('sc').value));
    if (u && state.res[0] === 'm') { const m = maxAbs(u) || 1; state.scale = v / 100 * (size * 0.04) / m * 100 / 200; $('scv').textContent = '×' + f0(v / 2); }
    else { state.scale = v; $('scv').textContent = '×' + f0(v); }
  }
  $('res').addEventListener('change', () => { state.res = $('res').value; G.forEach(g => g.ghost.visible = g.on && state.res !== 'none'); updScale(); info(); });
  $('sc').addEventListener('input', updScale);
  updScale(); info();

  const pts = base.map(p => p.clone());
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now) {
    const u = field();
    let s = state.scale;
    if (u && state.res[0] === 'm' && !reduce) s *= Math.sin((now - state.t0) / 1000 * 2 * Math.PI * 0.6);
    for (let i = 0; i < base.length; i++) { if (u) { const d = u[i]; pts[i].set(base[i].x + s * d[0], base[i].y + s * d[2], base[i].z - s * d[1]); } else pts[i].copy(base[i]); }
    G.forEach(g => { if (g.on) writePos(g.obj, segOf[g.k], pts); });
    ctl.update(); renderer.render(scene, cam); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- design ---------- */
  const girders = Array.from(new Set(D.design.map(r => r.g)));
  let cur = girders[0];
  const gsel = $('gsel');
  girders.forEach(g => { const b = document.createElement('button'); b.textContent = g; b.id = 'gs-' + g; b.addEventListener('click', () => { cur = g; drawDesign(); }); gsel.appendChild(b); });
  function svgEl(t, a) { const e = document.createElementNS('http://www.w3.org/2000/svg', t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function drawDesign() {
    girders.forEach(g => $('gs-' + g).setAttribute('aria-pressed', g === cur));
    $('gname').textContent = cur;
    const rows = D.design.filter(r => r.g === cur).sort((a, b) => a.t - b.t);
    const box = $('gchart'); box.innerHTML = '';
    const W = Math.max(300, box.clientWidth || 500), H = 230, m = { l: 34, r: 12, t: 10, b: 26 };
    const X = (t) => m.l + t * (W - m.l - m.r), Y = (v) => H - m.b - v / 1.1 * (H - m.t - m.b);
    const s = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Bending use along ' + cur });
    [0, .2, .4, .6, .8, 1].forEach(v => { s.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: css('--line') })); const t = svgEl('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = v.toFixed(1); s.appendChild(t); });
    s.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: Y(1), y2: Y(1), stroke: css('--bad'), 'stroke-dasharray': '2 3' }));
    [[0, 'End A'], [.5, 'Midspan'], [1, 'End B']].forEach(([v, l]) => { const t = svgEl('text', { x: X(v), y: H - 8, 'text-anchor': v === 0 ? 'start' : v === 1 ? 'end' : 'middle' }); t.textContent = l; s.appendChild(t); });
    const path = (k) => rows.map((r, i) => (i ? 'L' : 'M') + X(r.t).toFixed(1) + ' ' + Y(r[k]).toFixed(1)).join(' ');
    s.appendChild(svgEl('path', { d: path('uB'), fill: 'none', stroke: css('--accent'), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    s.appendChild(svgEl('path', { d: path('uS'), fill: 'none', stroke: css('--r-cross'), 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }));
    rows.forEach(r => { s.appendChild(svgEl('circle', { cx: X(r.t), cy: Y(r.uB), r: 3, fill: css('--accent') })); });
    const pk = rows.reduce((a, b) => (b.uB > a.uB ? b : a), rows[0]);
    const lt = svgEl('text', { x: X(pk.t), y: Y(pk.uB) - 8, 'text-anchor': 'middle' }); lt.textContent = 'ULS ' + f2(pk.uB); lt.setAttribute('fill', css('--fg')); s.appendChild(lt);
    box.appendChild(s);
    const tb = $('gtab').querySelector('tbody'); tb.innerHTML = '';
    rows.forEach(r => {
      const tr = tb.insertRow();
      const cell = (v, cls) => { const td = tr.insertCell(); if (cls) { const p = document.createElement('span'); p.className = 'pill ' + cls; p.textContent = v; td.appendChild(p); } else td.textContent = v; };
      cell((r.t * 100).toFixed(0) + '%'); cell(f2(r.x)); cell(f0(r.Mnc)); cell(f0(r.Ms)); cell(f2(r.soffit) + (r.uncr ? '' : ' cracked')); cell(f0(r.Mdec)); cell(f0(r.Mal));
      cell(f2(r.uS), r.uS <= 1 ? 'ok' : 'bad'); cell(f0(r.Mcr)); cell(f0(r.Muo) + ' ≥ ' + f0(r.Muomin), r.okMin ? 'ok' : 'bad'); cell(f0(r.Mu)); cell(f0(r.phiMu)); cell(f2(r.uB), r.uB <= 1 ? (r.uB > .9 ? 'warn' : 'ok') : 'bad');
    });
  }
  drawDesign();
  $('tab-design').addEventListener('click', drawDesign);

  /* ---------- supports ---------- */
  const bt = $('btab').querySelector('tbody');
  Object.entries(D.bearings).forEach(([k, v]) => { const tr = bt.insertRow(); tr.insertCell().textContent = k; const st = tr.insertCell(); const p = document.createElement('span'); p.className = 'pill ' + (v.vmin < 0 ? 'bad' : 'ok'); p.textContent = v.vmin < 0 ? 'uplift' : 'compression'; st.appendChild(p); tr.insertCell().textContent = f0(v.vmax); tr.insertCell().textContent = f0(v.vmin); });
  function drawPiles() {
    const box = $('pchart'); box.innerHTML = '';
    const rows = Object.entries(D.piles);
    const W = Math.max(300, box.clientWidth || 500), H = 230, m = { l: 46, r: 10, t: 18, b: 24 };
    const mx = Math.ceil(Math.max(...rows.map(r => r[1])) / 500) * 500;
    const bw = (W - m.l - m.r) / rows.length;
    const Y = (v) => H - m.b - v / mx * (H - m.t - m.b);
    const s = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Pile moment resultants' });
    for (let v = 0; v <= mx; v += 500) { s.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: css('--line') })); const t = svgEl('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = f0(v); s.appendChild(t); }
    rows.forEach(([k, v], i) => {
      const w = Math.min(32, bw * .6), x = m.l + i * bw + (bw - w) / 2;
      s.appendChild(svgEl('rect', { x, y: Y(v), width: w, height: Y(0) - Y(v), rx: 4, fill: css(k[0] === 'A' ? '--accent' : '--r-sill') }));
      const t = svgEl('text', { x: x + w / 2, y: Y(v) - 5, 'text-anchor': 'middle' }); t.textContent = f0(v); s.appendChild(t);
      const l = svgEl('text', { x: x + w / 2, y: H - 7, 'text-anchor': 'middle' }); l.textContent = k; s.appendChild(l);
    });
    box.appendChild(s);
  }
  drawPiles();
  $('tab-sub').addEventListener('click', drawPiles);
  
  window.__redraw = { design: drawDesign, supports: drawPiles };
  const kvFill = (el, pairs) => { el.innerHTML = ''; pairs.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; el.append(dt, dd); }); };
  const rowsTo = (tb, rows) => { tb.innerHTML = ''; rows.forEach(r => { const tr = tb.insertRow(); r.forEach(v => { tr.insertCell().textContent = v; }); }); };

  /* ---------- moving loads ---------- */
  const TR = D2.traffic;
  TR.cases.forEach((c, i) => { const o = document.createElement('option'); o.value = i; o.textContent = c.model + ' · ' + c.target; $('tcase').appendChild(o); });
  const gLines = D.members.filter(m => m[2] === 'girder').map(m => [D.nodes[m[0]], D.nodes[m[1]]]);
  const eLines = D.members.filter(m => m[2] === 'edge').map(m => [D.nodes[m[0]], D.nodes[m[1]]]);
  function drawTraffic() {
    const c = TR.cases[Number($('tcase').value || 0)], box = $('tplan'); box.innerHTML = '';
    const all = gLines.flat().concat(eLines.flat()).map(p => [p[0], p[1]]).concat(c.lanes.flatMap(l => l.poly));
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const W = Math.max(320, box.clientWidth || 700), pad = 14, sc = (W - 2 * pad) / (x1 - x0), H = (y1 - y0) * sc + 2 * pad;
    const X = (x) => pad + (x - x0) * sc, Y = (y) => pad + (y1 - y) * sc;
    const sv = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Traffic load position, plan' });
    c.lanes.forEach((l, k) => {
      sv.appendChild(svgEl('path', { d: 'M' + l.poly.map(p => X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('L') + 'Z', fill: css('--accent'), 'fill-opacity': .1 + .12 * l.f, stroke: css('--accent'), 'stroke-opacity': .5 }));
      const mid = l.poly[Math.floor(l.poly.length / 4)]; const t = svgEl('text', { x: X(mid[0]), y: Y(mid[1]) + 4, 'text-anchor': 'middle' }); t.textContent = 'lane factor ' + l.f; sv.appendChild(t);
    });
    eLines.forEach(([a, b]) => sv.appendChild(svgEl('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: css('--r-edge'), 'stroke-width': 1.5 })));
    gLines.forEach(([a, b]) => sv.appendChild(svgEl('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: css('--r-girder'), 'stroke-width': 2 })));
    const big = c.loads.filter(p => p[2] > 5), small = c.loads.filter(p => p[2] <= 5);
    small.forEach(p => sv.appendChild(svgEl('circle', { cx: X(p[0]), cy: Y(p[1]), r: 1.2, fill: css('--muted') })));
    const pm = Math.max(1, ...big.map(p => p[2]));
    big.forEach(p => sv.appendChild(svgEl('circle', { cx: X(p[0]), cy: Y(p[1]), r: 2.5 + 4 * p[2] / pm, fill: css('--bad'), 'fill-opacity': .85 })));
    box.appendChild(sv);
    const udl = small.reduce((a, p) => a + p[2], 0), wheels = big.reduce((a, p) => a + p[2], 0);
    kvFill($('tkv'), [['Extreme value', f0(c.value) + ' ' + c.unit], ['Lanes loaded', String(c.lanes.length)], ['Wheel loads (with DLA, lane factors)', f0(wheels) + ' kN'], ['Lane UDL on the patterned length', f0(udl) + ' kN'], ['Lane layouts searched', String(TR.layouts)], ['Lane width', TR.lane_width + ' m']]);
  }
  $('tcase').addEventListener('change', drawTraffic);
  const vk = [['wheel_kN', 'Wheel load', 'kN'], ['track_m', 'Wheel track', 'm'], ['axle_spacing_m', 'Axle spacing in a group', 'm'], ['gap_12_m', 'Gap between groups 1-2', 'm'], ['gap_23_min_m', 'Gap 2-3 (minimum, variable)', 'm'], ['gap_34_m', 'Gap between groups 3-4', 'm'], ['udl_kN_per_m', 'Lane UDL', 'kN/m'], ['dla', 'Dynamic load allowance', '']];
  rowsTo($('vtab').querySelector('tbody'), vk.map(([k, l, u]) => [l, u, String(TR.models.M1600[k]), String(TR.models.S1600[k])]));
  $('tnote').textContent = 'For every response the platform sweeps both vehicles along influence surfaces of the integrated model in ' + TR.settings.dc_m + ' m steps, tries ' + TR.layouts + ' lane layouts across the carriageway with lateral shifts of the vehicle within its lane, patterns the UDL on the adverse spans, ranks the loaded lanes and applies lane factors ' + TR.lane_factors.join(' / ') + '. The state shown is the one that produces the extreme; its other actions are the concurrent ones used in the combinations.';
  drawTraffic();

  /* ---------- prestress and camber ---------- */
  const HG = D2.hog, hgs = Object.keys(HG);
  let hcur = hgs[0];
  hgs.forEach(g => { const b = document.createElement('button'); b.textContent = g; b.id = 'hs-' + g; b.addEventListener('click', () => { hcur = g; drawHog(); }); $('hsel').appendChild(b); });
  const gcol = (i) => css(['--r-girder', '--r-cross', '--r-sill', '--r-edge'][i % 4]);
  function lineChart(box, series, opt) {
    box.innerHTML = '';
    const W = Math.max(300, box.clientWidth || 500), H = 230, m = { l: 46, r: 12, t: 12, b: 28 };
    const xsA = series.flatMap(s => s.pts.map(p => p[0])), ysA = series.flatMap(s => s.pts.map(p => p[1]));
    const xmin = opt.xmin ?? Math.min(...xsA), xmax = Math.max(...xsA), ymin = opt.ymin ?? Math.min(0, ...ysA), ymax = Math.max(...ysA) * 1.08;
    const fx = opt.log ? (v) => Math.log10(v + 1) : (v) => v;
    const X = (v) => m.l + (fx(v) - fx(xmin)) / (fx(xmax) - fx(xmin)) * (W - m.l - m.r), Y = (v) => H - m.b - (v - ymin) / (ymax - ymin) * (H - m.t - m.b);
    const sv = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': opt.label });
    const ty = opt.yt || 5; for (let i = 0; i <= ty; i++) { const v = ymin + (ymax - ymin) * i / ty; sv.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: css('--line') })); const t = svgEl('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = f0(v); sv.appendChild(t); }
    (opt.xticks || []).forEach(v => { const t = svgEl('text', { x: X(v), y: H - 8, 'text-anchor': 'middle' }); t.textContent = opt.xfmt ? opt.xfmt(v) : v; sv.appendChild(t); });
    series.forEach(s => {
      sv.appendChild(svgEl('path', { d: s.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' '), fill: 'none', stroke: s.c, 'stroke-width': s.w || 2, 'stroke-dasharray': s.dash || '', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (s.label) { const e = s.pts[s.pts.length - 1]; const t = svgEl('text', { x: X(e[0]) - 4, y: Y(e[1]) - 6, 'text-anchor': 'end' }); t.textContent = s.label; t.setAttribute('fill', s.c); sv.appendChild(t); }
    });
    box.appendChild(sv);
  }
  function drawHog() {
    hgs.forEach(g => $('hs-' + g).setAttribute('aria-pressed', g === hcur));
    lineChart($('hchart'), hgs.map((g, i) => ({ c: gcol(i), pts: HG[g].times.map(q => [q.t, q.hog_mm]), label: g })), { log: true, xmin: 0, xticks: [0, 7, 28, 100, 365, 3650], xfmt: v => v === 0 ? 'transfer' : v + ' d', label: 'Midspan hog, mm' });
    const h = HG[hcur];
    lineChart($('pchart2'), [{ c: css('--muted'), dash: '5 4', pts: h.profile.map(q => [q.x_m, q.P_transfer]), label: 'transfer' }, { c: css('--accent'), pts: h.profile.map(q => [q.x_m, q.P_final]), label: '10 years' }],
      { xmin: 0, xticks: [0, h.L_m / 4, h.L_m / 2, 3 * h.L_m / 4, h.L_m].map(v => Math.round(v * 10) / 10), xfmt: v => v + ' m', label: 'Prestress force along ' + hcur });
    $('hname').textContent = hcur;
    const I = h.inputs;
    kvFill($('hkv'), [['Method', h.method + ' time-step'], ['Strands', h.n_strands + ' × ' + h.Ap + ' mm², MBL ' + h.mbl + ' kN'], ['Jacking', (h.jacking * 100).toFixed(0) + '% MBL, ' + h.P0_strand + ' kN per strand'], ['Girder length', h.L_m.toFixed(3) + ' m'],
      ["f'c / f'cp", I.fc + ' / ' + I.fci + ' MPa'], ['Ec at transfer / 28 d', f0(I.Ect) + ' / ' + f0(I.Ec) + ' MPa'], ['Transfer age', I.tau + ' d'], ['Deck cast after transfer', I.pour + ' d'], ['SDL applied', I.sidlA + ' d'],
      ['k4 / chi', I.k4 + ' / ' + I.chi], ['Wet deck / SDL', f2(I.wd) + ' / ' + f2(I.sidl) + ' kN/m'], ['Deck differential shrinkage', h.eps_dsh == null ? '—' : h.eps_dsh + ' × 10⁻⁶']]);
    rowsTo($('htab').querySelector('tbody'), HG[hgs[0]].times.map((q, k) => [q.label, 'mm', ...hgs.map(g => f2(HG[g].times[k].hog_mm))]));
  }
  drawHog();
  window.__redraw.camber = drawHog;

  /* ---------- section ---------- */
  const SC = D2.section;
  function drawSection() {
    const box = $('schart'); box.innerHTML = '';
    const top = SC.tD + SC.haunch, D_ = SC.D, Dt = top + D_;
    const x0 = -SC.deck_left - 60, x1 = SC.deck_right + 60;
    const W = Math.max(300, box.clientWidth || 500), pad = 16, sc = (W - 2 * pad) / (x1 - x0), H = Dt * sc + 2 * pad + 14;
    const X = (x) => pad + (x - x0) * sc, Y = (d) => pad + d * sc;
    const sv = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Composite section' });
    sv.appendChild(svgEl('rect', { x: X(-SC.deck_left), y: Y(0), width: (SC.deck_left + SC.deck_right) * sc, height: SC.tD * sc, fill: css('--r-slab'), 'fill-opacity': .35, stroke: css('--r-slab') }));
    sv.appendChild(svgEl('path', { d: 'M' + SC.outline.map(p => X(p[0]).toFixed(1) + ' ' + Y(top + D_ - p[1]).toFixed(1)).join('L') + 'Z', fill: css('--r-girder'), 'fill-opacity': .14, stroke: css('--r-girder'), 'stroke-width': 1.2 }));
    const ly = Array.from(new Set(SC.bars.map(b => b.y_from_soffit)));
    ly.forEach(y => sv.appendChild(svgEl('line', { x1: X(-400), x2: X(400), y1: Y(Dt - y), y2: Y(Dt - y), stroke: css('--r-cross'), 'stroke-dasharray': '3 3' })));
    SC.strands.forEach(t => { if (t.x == null) return; sv.appendChild(svgEl('circle', { cx: X(t.x), cy: Y(Dt - t.y_from_soffit), r: Math.max(1.6, 7.6 * sc), fill: css('--bad') })); });
    const yc = SC.composite.yc_from_top; sv.appendChild(svgEl('line', { x1: X(x0 + 60), x2: X(x1 - 60), y1: Y(yc), y2: Y(yc), stroke: css('--muted'), 'stroke-dasharray': '1 3' }));
    const t = svgEl('text', { x: X(x1 - 60), y: Y(yc) - 4, 'text-anchor': 'end' }); t.textContent = 'centroid ' + f0(yc) + ' below deck top'; sv.appendChild(t);
    const t2 = svgEl('text', { x: X(0), y: H - 4, 'text-anchor': 'middle' }); t2.textContent = 'deck ' + f0((SC.deck_left + SC.deck_right)) + ' wide × ' + f0(SC.tD) + ', girder ' + f0(D_) + ' deep'; sv.appendChild(t2);
    box.appendChild(sv);
    const P = SC.params, Cp = SC.composite, Mt = SC.materials, St = SC.stress;
    kvFill($('skv'), [['Overall depth D', f0(P.D) + ' mm'], ['Soffit width / web', f0(P.bw) + ' / ' + f0(P.tw) + ' mm'], ['Top flange thickness', f0(P.ttf) + ' mm'], ['Deck slab / haunch', f0(SC.tD) + ' / ' + f0(SC.haunch) + ' mm'],
      ["f'c girder / deck", Mt.fc_girder + ' / ' + Mt.fc_deck + ' MPa'], ['Composite area', (Cp.A_mm2 / 1e6).toFixed(3) + ' m² (girder modulus)'], ['Composite I', (Cp.I_mm4 / 1e12).toFixed(4) + ' m⁴'],
      ['Mean effective prestress', f0(SC.sp_mean) + ' MPa'], ['Girder alone: top / soffit', f2(St.girder_alone_top) + ' / ' + f2(St.girder_alone_bot) + ' MPa'], ['At Ms*: deck top / soffit', f2(St.deck_top_Ms) + ' / ' + f2(St.soffit_Ms) + ' MPa'],
      ['M* / N*', f0(St.Mu) + ' kN·m / ' + f0(St.Nu) + ' kN'], ['φMu', f0(St.phiMu) + ' kN·m']]);
    const grp = {}; SC.strands.forEach(s => { const k = 'Strands ' + s.y_from_soffit; grp[k] = grp[k] || [s.y_from_soffit, 0, 'ø15.2 (' + s.A + ' mm²)']; grp[k][1]++; });
    SC.bars.forEach(b => { const k = 'Bars ' + b.y_from_soffit + ' ' + b.d; grp[k] = grp[k] || [b.y_from_soffit, 0, 'N' + b.d]; grp[k][1] += (b.n || 1); });
    rowsTo($('stab').querySelector('tbody'), Object.entries(grp).sort((a, b) => a[1][0] - b[1][0]).map(([k, v]) => [k.split(' ')[0], f0(v[0]), String(v[1]), v[2]]));
    $('smiss').textContent = 'Still missing for the design checks: ' + SC.missing.filter(x => !/fpb|effective prestress/.test(x)).join('; ') + '. Strand and bar layout are placeholders (D-1).';
    const nb = $('nmchart'); nb.innerHTML = '';
    const pts = SC.nm.filter(q => isFinite(q.N) && isFinite(q.M));
    const W2 = Math.max(300, nb.clientWidth || 500), H2 = 240, m = { l: 52, r: 12, t: 12, b: 28 };
    const Ms = pts.map(q => q.M).concat([0, St.Mu]), Ns = pts.map(q => -q.N).concat([0, -St.Nu]);
    const mx0 = Math.min(...Ms), mx1 = Math.max(...Ms) * 1.05, n0 = Math.min(...Ns) * 1.05, n1 = Math.max(...Ns) * 1.05;
    const X2 = (v) => m.l + (v - mx0) / (mx1 - mx0) * (W2 - m.l - m.r), Y2 = (v) => H2 - m.b - (v - n0) / (n1 - n0) * (H2 - m.t - m.b);
    const sv2 = svgEl('svg', { viewBox: `0 0 ${W2} ${H2}`, width: '100%', role: 'img', 'aria-label': 'N-M interaction' });
    for (let i = 0; i <= 4; i++) { const v = n0 + (n1 - n0) * i / 4; sv2.appendChild(svgEl('line', { x1: m.l, x2: W2 - m.r, y1: Y2(v), y2: Y2(v), stroke: css('--line') })); const tt = svgEl('text', { x: m.l - 6, y: Y2(v) + 4, 'text-anchor': 'end' }); tt.textContent = f0(v); sv2.appendChild(tt); }
    for (let i = 0; i <= 4; i++) { const v = mx0 + (mx1 - mx0) * i / 4; const tt = svgEl('text', { x: X2(v), y: H2 - 8, 'text-anchor': 'middle' }); tt.textContent = f0(v); sv2.appendChild(tt); }
    sv2.appendChild(svgEl('path', { d: pts.map((q, i) => (i ? 'L' : 'M') + X2(q.phi * q.M).toFixed(1) + ' ' + Y2(-q.phi * q.N).toFixed(1)).join(' '), fill: css('--accent'), 'fill-opacity': .12, stroke: css('--accent'), 'stroke-width': 1.5 }));
    sv2.appendChild(svgEl('path', { d: pts.map((q, i) => (i ? 'L' : 'M') + X2(q.M).toFixed(1) + ' ' + Y2(-q.N).toFixed(1)).join(' '), fill: 'none', stroke: css('--muted'), 'stroke-dasharray': '4 3' }));
    sv2.appendChild(svgEl('circle', { cx: X2(St.Mu), cy: Y2(-St.Nu), r: 4.5, fill: css('--bad') }));
    const tl = svgEl('text', { x: X2(St.Mu) + 7, y: Y2(-St.Nu) - 6 }); tl.textContent = 'M* ' + f0(St.Mu); tl.setAttribute('fill', css('--fg')); sv2.appendChild(tl);
    const ax = svgEl('text', { x: m.l, y: m.t + 2 }); ax.textContent = 'N compression (kN) ↑ · M (kN·m) →'; sv2.appendChild(ax);
    nb.appendChild(sv2);
  }
  drawSection();
  window.__redraw.section = drawSection;
  window.__redraw.traffic = drawTraffic;

  /* ---------- loads ---------- */
  const CB = D2.combos;
  rowsTo($('ltab').querySelector('tbody'), CB.on.map(a => [a, CB.sources[a] || CB.sources[a.slice(0, 2)] || '']));
  kvFill($('ckv'), [['ULS rows generated', f0(CB.rows.ULS)], ['SLS rows generated', f0(CB.rows.SLS)], ['Actions taking part', String(CB.on.length)], ['Load factors', 'AS 5100.2, unverified code extracts']]);
  rowsTo($('ntab').querySelector('tbody'), CB.not_combined.map(x => [x[0], x[1]]));

  const hash = location.hash.slice(1); if (tabs.some(t => t[2] === hash)) show(hash);
})();
