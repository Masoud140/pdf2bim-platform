// 3D view of the integrated model (members by role, bearing links, supports), deformed under SW / SDL.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { h, fmt } from "./dom";

export interface ModelView {
  origin: [number, number, number];
  nodes: Record<string, [number, number, number, string]>;
  beams: [string, string, string][];
  links: [string, string, string][];
  springs: string[]; fixed: string[];
  cases: Record<string, { u: Record<string, [number, number, number]>; applied_kN: number[]; equilibrium_residual_kN: number; total_kN?: number;
    reactions: Record<string, number[]>; spring_forces: Record<string, number[]> }>;
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
  for (const [a, b, r] of [...mv.beams, ...mv.links]) { const g = roleGroup(r); if (!byRole.has(g)) byRole.set(g, []); byRole.get(g)!.push([a, b]); }
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
  }
  build();
  camera.position.set(size * 0.7, size * 0.45, size * 0.7); controls.update();

  const legend = h("div", { class: "legend" }, h("div", { class: "legend-title" }, "Members"),
    [...byRole.keys()].sort().map((g) => h("label", {}, h("input", { type: "checkbox", checked: true, onchange: (e: Event) => { groups.get(g)!.visible = (e.target as HTMLInputElement).checked; } }),
      h("span", { class: "sw", style: `background:${roleColour(g)}` }), `${g} (${byRole.get(g)!.length})`)),
    h("label", {}, h("span", { class: "sw dot", style: "background:#c43c3c" }), `supports / springs (${mv.fixed.length + mv.springs.length})`));
  const info = h("div", { class: "muted small" });
  const scaleIn = h("input", { type: "range", min: 0, max: 400, value: 100 }) as HTMLInputElement;
  const caseSel = h("select", {}, h("option", { value: "" }, "Undeformed"), Object.keys(mv.cases).map((c) => h("option", { value: c }, `Deformed — ${c === "SW" ? "self weight" : "superimposed dead load"}`))) as HTMLSelectElement;
  const upd = () => {
    cs = caseSel.value || null;
    if (cs) { const m = maxU(cs); scale = (0.04 * size) / Math.max(m, 1e-9) * (+scaleIn.value / 100);
      info.textContent = `max displacement ${fmt(m * 1000, 1)} mm · drawn × ${fmt(scale, 0)}`; } else { scale = 0; info.textContent = `${ids.length} nodes · ${mv.beams.length} members · ${mv.links.length} bearing links`; }
    build();
  };
  caseSel.onchange = upd; scaleIn.oninput = upd; upd();
  const views: [string, () => void][] = [["3D", () => camera.position.set(size * 0.55, size * 0.35, size * 0.55)], ["Plan", () => camera.position.set(0, size * 0.9, 0.001)],
    ["Elevation", () => camera.position.set(0, 0, size * 0.9)], ["Section", () => camera.position.set(size * 0.9, 0, 0)]];
  const bar = h("div", { class: "toolbar" }, caseSel, h("label", { class: "small" }, "scale ", scaleIn), views.map(([n, f]) => h("button", { class: "btn ghost", onclick: () => { f(); controls.target.set(0, 0, 0); controls.update(); } }, n)), info);
  wrap.append(bar, h("div", { class: "viewer-body" }, canvasBox, legend));

  const ro = new ResizeObserver(() => { const w = canvasBox.clientWidth, hh = canvasBox.clientHeight; renderer.setSize(w, hh); camera.aspect = w / Math.max(hh, 1); camera.updateProjectionMatrix(); });
  ro.observe(canvasBox);
  let alive = true;
  const loop = () => { if (!alive) return; if (!wrap.isConnected && wrap.dataset.mounted) { alive = false; renderer.dispose(); ro.disconnect(); return; }
    if (wrap.isConnected) wrap.dataset.mounted = "1"; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return wrap;
}
