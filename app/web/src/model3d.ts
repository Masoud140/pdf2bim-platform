// 3D view of the integrated model (members by role, bearing links, supports), deformed under SW / SDL.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { h, fmt } from "./dom";

export interface ModelView {
  origin: [number, number, number];
  nodes: Record<string, [number, number, number, string]>;
  beams: [string, string, string, string?, (number | null)[]?][];   // n1, n2, role, member id, [E kN/m2, A, Iy, Iz, J, w kN/m]
  links: [string, string, string][];
  springs: string[]; fixed: string[];
  cases: Record<string, { u: Record<string, [number, number, number]>; applied_kN: number[]; equilibrium_residual_kN: number; total_kN?: number; T?: number;
    reactions: Record<string, number[]>; spring_forces: Record<string, number[]> }>;
  modes?: { n: number; T: number; f: number; eff: Record<string, number> }[]; modes_note?: string | null; mass_rule?: string;
  provisional_decisions: string[]; allow_proposed: boolean;
}

const ROLE_COL: Record<string, string> = { girder: "#2f6fb3", web: "#6f9fd0", slab: "#9aa5b1", midgap: "#9aa5b1", edge: "#5d6873", deck_end: "#5d6873",
  support_edge: "#5d6873", cross_girder: "#7b5ea7", sill: "#b06a2c", pile: "#6b7d2f", "rigid arms": "#c43c3c", bearing: "#d08b00" };
const roleColour = (r: string) => ROLE_COL[r] || "#888888";
const roleGroup = (r: string) => (r.toLowerCase().includes("rigid") ? "rigid arms" : r || "other");

export function modelViewer(mv: ModelView): HTMLElement {
  const wrap = h("div", { class: "viewer3d" });
  const canvasBox = h("div", { class: "canvasbox" });
  const groups = new Map<string, THREE.LineSegments>();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const css = getComputedStyle(document.documentElement);
  scene.background = new THREE.Color(css.getPropertyValue("--canvas").trim() || "#f6f7f9");
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  canvasBox.append(renderer.domElement);

  // three: x = E, y = up (RL), z = -N
  const ids = Object.keys(mv.nodes);
  const P = (id: string, cs: string | null, s: number) => {
    const n = mv.nodes[id]; const u = cs ? mv.cases[cs]?.u[id] : null;
    return [n[0] + (u ? u[0] * s : 0), n[2] + (u ? u[2] * s : 0), -(n[1] + (u ? u[1] * s : 0))];
  };
  const bb = new THREE.Box3();
  ids.forEach((i) => bb.expandByPoint(new THREE.Vector3(...(P(i, null, 0) as [number, number, number]))));
  const ctr = bb.getCenter(new THREE.Vector3()); const size = bb.getSize(new THREE.Vector3()).length();

  const byRole = new Map<string, [string, string][]>();
  const segOf = new Map<string, number[]>();           // per role group: index into mv.beams (>= 0) or -1 - link index
  [...mv.beams, ...mv.links].forEach(([a, b, r], i) => { const g = roleGroup(r); if (!byRole.has(g)) { byRole.set(g, []); segOf.set(g, []); }
    byRole.get(g)!.push([a, b]); segOf.get(g)!.push(i < mv.beams.length ? i : -1 - (i - mv.beams.length)); });
  let cs: string | null = null; let scale = 0;
  const maxU = (c: string) => Math.max(...Object.values(mv.cases[c].u).map((u) => Math.hypot(u[0], u[1], u[2])));
  function build() {
    for (const [g, segs] of byRole) {
      const pos = new Float32Array(segs.length * 6);
      segs.forEach(([a, b], k) => { pos.set(P(a, cs, scale), k * 6); pos.set(P(b, cs, scale), k * 6 + 3); });
      let L = groups.get(g);
      if (!L) {
        L = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: roleColour(g) }));
        scene.add(L); groups.set(g, L);
      }
      L.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3)); L.geometry.computeBoundingSphere();
      L.position.set(-ctr.x, -ctr.y, -ctr.z);
    }
    const sup = [...mv.fixed, ...mv.springs];
    const old = scene.getObjectByName("supports"); if (old) scene.remove(old);
    const pts = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(sup.flatMap((i) => P(i, cs, scale))), 3)),
      new THREE.PointsMaterial({ color: "#c43c3c", size: 0.35 }));
    pts.name = "supports"; pts.position.set(-ctr.x, -ctr.y, -ctr.z); scene.add(pts);
    drawPick();
  }
  // member pick: click a member to see its nodes, length and properties
  let picked: number | null = null;
  const pickBox = h("div", { class: "muted small pick" }, "Click a member for its properties.");
  function drawPick() {
    const old = scene.getObjectByName("pick"); if (old) scene.remove(old);
    if (picked === null) return;
    const [a, b] = picked >= 0 ? mv.beams[picked] : mv.links[-1 - picked];
    const L = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array([...P(a, cs, scale), ...P(b, cs, scale)]), 3)),
      new THREE.LineBasicMaterial({ color: "#ff2d95", depthTest: false }));
    L.name = "pick"; L.renderOrder = 9; L.position.set(-ctr.x, -ctr.y, -ctr.z); scene.add(L);
  }
  function showPick() {
    if (picked === null) { pickBox.textContent = "Click a member for its properties."; return; }
    const isBeam = picked >= 0;
    const m = isBeam ? mv.beams[picked] : mv.links[-1 - picked];
    const [a, b] = m; const na = mv.nodes[a], nb = mv.nodes[b];
    const L = Math.hypot(na[0] - nb[0], na[1] - nb[1], na[2] - nb[2]);
    const pr = (isBeam && m[4]) || [];
    const u = (n: string) => { const v = cs && !mv.cases[cs].T ? mv.cases[cs].u[n] : null; return v ? ` · ${fmt(v[2] * 1000, 1)} mm vertical` : ""; };
    const sci = (v: number | null | undefined, f = 1) => (v == null ? "—" : (v * f).toPrecision(4));
    pickBox.replaceChildren(h("div", { class: "legend-title" }, isBeam ? `Member ${m[3] ?? picked} — ${m[2] || "member"}` : `Bearing link — ${m[2]}`),
      h("div", {}, `nodes ${a} (${na[3] || "node"})${u(a)} → ${b} (${nb[3] || "node"})${u(b)}`),
      h("div", {}, `length ${fmt(L, 3)} m`),
      isBeam && pr.length ? h("div", {}, `E ${sci(pr[0], 1e-3)} MPa · A ${sci(pr[1])} m² · Iy ${sci(pr[2])} m⁴ · Iz ${sci(pr[3])} m⁴ · J ${sci(pr[4])} m⁴ · w ${sci(pr[5])} kN/m`) : "",
      h("div", { class: "muted" }, "Iy about the solver's local y (vertical bending), as the MIDAS export; values as built, not editable here."));
  }
  build();
  camera.position.set(size * 0.7, size * 0.45, size * 0.7); controls.update();

  const legend = h("div", { class: "legend" }, h("div", { class: "legend-title" }, "Members"),
    [...byRole.keys()].sort().map((g) => h("label", {}, h("input", { type: "checkbox", checked: true, onchange: (e: Event) => { groups.get(g)!.visible = (e.target as HTMLInputElement).checked; } }),
      h("span", { class: "sw", style: `background:${roleColour(g)}` }), `${g} (${byRole.get(g)!.length})`)),
    h("label", {}, h("span", { class: "sw dot", style: "background:#c43c3c" }), `supports / springs (${mv.fixed.length + mv.springs.length})`));
  const info = h("div", { class: "muted small" });
  const scaleIn = h("input", { type: "range", min: 0, max: 400, value: 100 }) as HTMLInputElement;
  const caseSel = h("select", {}, h("option", { value: "" }, "Undeformed"), Object.keys(mv.cases).map((c) => h("option", { value: c }, c === "SW" ? "Deformed — self weight" : c === "SDL" ? "Deformed — superimposed dead load" : `${c} — T = ${mv.cases[c].T} s`))) as HTMLSelectElement;
  const upd = () => {
    cs = caseSel.value || null;
    if (cs) { const m = maxU(cs); scale = (0.04 * size) / Math.max(m, 1e-9) * (+scaleIn.value / 100);
      info.textContent = mv.cases[cs].T ? `mode shape (mass-normalised) · drawn × ${fmt(scale, 0)}` : `max displacement ${fmt(m * 1000, 1)} mm · drawn × ${fmt(scale, 0)}`; } else { scale = 0; info.textContent = `${ids.length} nodes · ${mv.beams.length} members · ${mv.links.length} bearing links`; }
    build();
  };
  caseSel.onchange = () => { upd(); showPick(); }; scaleIn.oninput = upd; upd();
  const ray = new THREE.Raycaster(); let down: [number, number] | null = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;   // a drag orbits, a click picks
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    ray.params.Line = { threshold: size * 0.004 };
    const vis = [...groups.entries()].filter(([, L]) => L.visible);
    const hit = ray.intersectObjects(vis.map(([, L]) => L), false)[0];
    if (hit && hit.index != null) { const g = vis.find(([, L]) => L === hit.object)![0]; picked = segOf.get(g)![Math.floor(hit.index / 2)]; } else picked = null;
    drawPick(); showPick();
  });
  const views: [string, () => void][] = [["3D", () => camera.position.set(size * 0.55, size * 0.35, size * 0.55)], ["Plan", () => camera.position.set(0, size * 0.9, 0.001)],
    ["Elevation", () => camera.position.set(0, 0, size * 0.9)], ["Section", () => camera.position.set(size * 0.9, 0, 0)]];
  const bar = h("div", { class: "toolbar" }, caseSel, h("label", { class: "small" }, "scale ", scaleIn), views.map(([n, f]) => h("button", { class: "btn ghost", onclick: () => { f(); controls.target.set(0, 0, 0); controls.update(); } }, n)), info);
  legend.append(pickBox);
  wrap.append(bar, h("div", { class: "viewer-body" }, canvasBox, legend));

  const ro = new ResizeObserver(() => { const w = canvasBox.clientWidth, hh = canvasBox.clientHeight; renderer.setSize(w, hh); camera.aspect = w / Math.max(hh, 1); camera.updateProjectionMatrix(); });
  ro.observe(canvasBox);
  let alive = true;
  const loop = () => { if (!alive) return; if (!wrap.isConnected && wrap.dataset.mounted) { alive = false; renderer.dispose(); ro.disconnect(); return; }
    if (wrap.isConnected) wrap.dataset.mounted = "1"; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return wrap;
}
