// Moving loads tab (P9.7): lane layouts (AS 5100.2 sweep or engineer-defined), influence lines, and the governing lane
// layout + load positions behind every girder M / V and bearing envelope value, from the run's traffic.json.
import { api, ValueRow, Meta } from "./api";
import { h, fmt, empty, table, tagChip } from "./dom";

interface State { value: number; layout: number[]; factors: [number, number][]; loads: [number, number, number, number, number][] }
interface Traffic {
  models: string[]; lane_width: number; lane_factors: number[]; layout_mode: string; layouts: number[][]; carriageways: [number, number][];
  settings: Record<string, unknown>; vehicles: Record<string, Record<string, number>>; grid: number[]; il_offsets: number[];
  responses: { key: string; kind: string; ch: number; o: number; girder: string }[];
  states: Record<string, Record<string, { max: State | null; min: State | null }>>; il: Record<string, number[][]>;
  plan: { girders: Record<string, { id: number; a: [number, number]; b: [number, number] }[]>; bearings: { id: string; ch: number; o: number; girder: string }[]; deck: [number, number][] };
}
const KIND: Record<string, [string, string]> = { M: ["Bending moment", "kN·m"], V: ["Shear force", "kN"], R: ["Bearing reaction", "kN"] };
const sel = { model: "", key: "", side: "max" as "max" | "min" };

export async function movingLoads(id: string, provenance: (m: Meta | null) => HTMLElement | null, who: () => string, nameInput: () => HTMLElement, rerender: () => void): Promise<HTMLElement> {
  const [T, { rows: vals }] = await Promise.all([api.result<Traffic>(id, "traffic.json"), api.values(id, true)]);
  const out = h("div", {}, provenance(T.meta));
  // --- lane layouts (description input) ---
  const lay = vals.filter((r) => r.path.startsWith("loads.lane_layouts.rows"));
  const cw = vals.filter((r) => r.path === "deck.carriageway_left" || r.path === "deck.carriageway_right" || r.path.startsWith("deck.carriageways"));
  const newRows: { name: string; lanes: string }[] = [];
  const list = h("tbody");
  const drawLay = () => list.replaceChildren(
    ...lay.map((r) => { const c = r.value as { name?: string; lanes?: string }; return h("tr", {}, h("td", {}, c?.name ?? ""), h("td", { class: "mono" }, c?.lanes ?? ""), h("td", {}, tagChip(r.tag)), h("td", { class: "small muted" }, r.path)); }),
    ...newRows.map((n, i) => h("tr", { class: "r-Inputuser" }, h("td", {}, n.name), h("td", { class: "mono" }, n.lanes), h("td", {}, h("span", { class: "pill warn" }, "new, not saved")), h("td", {}, h("button", { class: "btn ghost small", onclick: () => { newRows.splice(i, 1); drawLay(); } }, "remove")))));
  const nm = h("input", { placeholder: "layout name, e.g. two lanes left", size: 22 }) as HTMLInputElement;
  const ln = h("input", { placeholder: "lane left edges, m from the control line, e.g. -6.2, -3.0", size: 36 }) as HTMLInputElement;
  const why = h("input", { placeholder: "reason (recorded with the decision)", size: 32 }) as HTMLInputElement;
  const msg = h("div", { class: "small" });
  const add = () => { if (!nm.value.trim() || !ln.value.trim()) { msg.textContent = "Give the layout a name and its lane left edges."; return; } newRows.push({ name: nm.value.trim(), lanes: ln.value.trim() }); nm.value = ""; ln.value = ""; msg.textContent = ""; drawLay(); };
  const save = async (andRun: boolean) => {
    if (!newRows.length) { msg.textContent = "Nothing to save."; return; }
    msg.textContent = "Saving…";
    try { const r = await api.saveBatch(id, { by: who(), reason: why.value || "lane layouts entered on the Moving loads tab", items: [], new_rows: newRows.map((n) => ({ table: "loads.lane_layouts", cells: n })) });
      msg.textContent = `Saved as ${r.decision} (${r.changed} values).`; newRows.length = 0;
      if (andRun) { await api.run(id, true); msg.textContent += " Run started: the traffic envelope now uses these layouts."; } else setTimeout(rerender, 900);
    } catch (e) { msg.textContent = (e as Error).message; }
  };
  out.append(h("div", { class: "card" }, h("h3", {}, "Lane layouts"),
    h("p", { class: "small muted" }, "AS 5100.2 standard design lanes of ", h("b", {}, fmt(T.data?.lane_width ?? 3.2, 1), " m"), " placed across the carriageway. With no layouts entered the engine sweeps the lane set across the carriageway at the sweep step and envelopes every position (MIDAS \"lane sweep\"); layouts entered here replace the sweep, each row being one lane set the envelope checks (MIDAS lane sets). Carriageway: ",
      cw.map((r) => h("span", { class: "chipline" }, h("span", { class: "mono" }, r.path.replace("deck.", "")), " ", fmt(r.value), " ", tagChip(r.tag))), ". Accompanying lane factors ", (T.data?.lane_factors || []).join(" / "), " (standards entry, unverified)."),
    h("div", { class: "tablewrap" }, h("table", { class: "values" }, h("thead", {}, h("tr", {}, ["Layout", "Lane left edges (m)", "Data source", ""].map((x) => h("th", {}, x)))), list)),
    h("div", { class: "row wrap" }, nm, ln, h("button", { class: "btn ghost", onclick: add }, "Add layout"), why, nameInput(), h("button", { class: "btn primary", onclick: () => save(false) }, "Save"), h("button", { class: "btn", onclick: () => save(true) }, "Save and re-run"), msg)));
  setTimeout(drawLay);
  if (!T.data) { out.append(empty("No moving-load results yet", "Run the chain: the actions step writes the lane layouts, governing load positions and influence lines (traffic.json).")); return out; }
  const D = T.data;
  // --- pick a response ---
  if (!sel.model || !D.models.includes(sel.model)) sel.model = D.models[0];
  const keys = D.responses; if (!sel.key || !keys.some((r) => r.key === sel.key)) sel.key = keys.filter((r) => r.kind === "M").reduce((b, r) => ((D.states[sel.model][r.key]?.max?.value ?? -1e99) > (D.states[sel.model][b.key]?.max?.value ?? -1e99) ? r : b), keys[0]).key;   // start at the largest sagging moment
  const body = h("div");
  const draw = () => {
    const R = keys.find((r) => r.key === sel.key)!, st = D.states[sel.model]?.[sel.key]?.[sel.side];
    const seg = (name: string, opts: [string, string][], cur: string, on: (v: string) => void) => h("div", { class: "row wrap small" }, h("span", { class: "muted" }, name), opts.map(([v, l]) => h("button", { class: "chip" + (v === cur ? " on" : ""), onclick: () => { on(v); draw(); } }, l)));
    const girders = [...new Set(keys.map((r) => r.girder))];
    const ofG = keys.filter((r) => r.girder === R.girder && r.kind === R.kind).sort((a, b) => a.ch - b.ch);
    const what = `${KIND[R.kind][0]} ${R.kind === "R" ? "at bearing " + R.key.replace(":R", "") : "of " + R.girder + " at ch " + fmt(R.ch, 2)}`;
    const head = h("div", { class: "card" }, h("h3", {}, "Governing load position"),
      seg("Vehicle", D.models.map((m) => [m, m]), sel.model, (v) => (sel.model = v)),
      seg("Quantity", Object.keys(KIND).filter((k) => keys.some((r) => r.kind === k)).map((k) => [k, KIND[k][0]]), R.kind, (v) => { sel.key = (keys.find((r) => r.kind === v && r.girder === R.girder) || keys.find((r) => r.kind === v))!.key; }),
      seg("Side", [["max", "Maximum"], ["min", "Minimum"]], sel.side, (v) => (sel.side = v as "max")),
      seg("Girder", girders.map((g) => [g, g]), R.girder, (v) => { sel.key = (keys.find((r) => r.girder === v && r.kind === R.kind) || keys.find((r) => r.girder === v))!.key; }),
      R.kind !== "R" ? h("div", { class: "row wrap small" }, h("span", { class: "muted" }, "Station"), h("select", { onchange: (e: Event) => { sel.key = (e.target as HTMLSelectElement).value; draw(); } },
        ofG.map((r) => h("option", { value: r.key, selected: r.key === sel.key }, `ch ${fmt(r.ch, 2)} (${r.key.split(":")[1]})`)))) : null);
    if (!st) { body.replaceChildren(head, empty("No state", `The run has no ${sel.side} state for ${what}.`)); return; }
    const kpi = (l: string, v: string, s: string) => h("div", { class: "card tile" }, h("div", { class: "small muted" }, l), h("div", { class: "big" }, v), h("div", { class: "small muted" }, s));
    const nWheel = st.loads.filter((L) => L[2] > 1).length;
    const kpis = h("div", { class: "grid tiles" }, kpi(what, fmt(st.value, 1) + " " + KIND[R.kind][1], `${sel.model} characteristic (DLA and lane factors, no load factor)`),
      kpi("Lane layout", `${D.layouts.findIndex((L) => L.length === st.layout.length && L.every((a, i) => Math.abs(a - st.layout[i]) < 1e-3)) + 1 || "?"} of ${D.layouts.length}`, `${D.layout_mode}: lane left edges ${st.layout.map((a) => fmt(a, 2)).join(", ")} m`),
      kpi("Loads", `${nWheel} wheel points`, `${st.loads.length - nWheel} patterned UDL bands; factors ${st.factors.map((f) => f[1]).join(" / ")}`));
    body.replaceChildren(head, kpis, h("div", { class: "card" }, plan(D, R, st)), h("div", { class: "card" }, h("h3", {}, "Lane ranking"), table(["Lane left edge (m)", "Accompanying factor"], st.factors.map((f) => [fmt(f[0], 2), fmt(f[1], 2)]), "num")),
      h("div", { class: "card" }, h("h3", {}, "Influence lines"), h("p", { class: "small muted" }, `${what} per 1 kN moving along each lane centre of the first layout (offsets ${D.il_offsets.map((o) => fmt(o, 2)).join(", ")} m); dashed lines mark the wheel positions of the governing state.`), ilChart(D, R, st)));
  };
  out.append(body); setTimeout(draw);
  return out;
}

function plan(D: Traffic, R: Traffic["responses"][number], st: State): HTMLElement {
  const ch = D.plan.deck.map((p) => p[0]), os = D.plan.deck.map((p) => p[1]);
  const c0 = Math.min(...ch) - 1, c1 = Math.max(...ch) + 1, o0 = Math.min(...os) - 0.8, o1 = Math.max(...os) + 0.8;
  const W = 1000, k = (W - 60) / (c1 - c0), Hn = Math.max(220, Math.min(520, (o1 - o0) * k)), ex = Hn / ((o1 - o0) * k), H = Hn + 50;
  const X = (c: number) => 30 + (c - c0) * k, Y = (o: number) => 20 + (o1 - o) * k * ex;
  const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", `0 0 ${W} ${H}`); s.setAttribute("class", "plan"); s.setAttribute("role", "img");
  const el = (t: string, a: Record<string, string | number>, title?: string) => { const e = document.createElementNS(ns, t); for (const [kk, v] of Object.entries(a)) e.setAttribute(kk, String(v)); if (title) { const tt = document.createElementNS(ns, "title"); tt.textContent = title; e.append(tt); } s.append(e); return e; };
  // carriageways and lanes of the governing layout
  for (const [a, b] of D.carriageways) el("rect", { x: X(c0 + 1), y: Y(b), width: (c1 - c0 - 2) * k, height: (b - a) * k * ex, fill: "none", stroke: "#8a96a3", "stroke-dasharray": "4 3" });
  st.layout.forEach((a, i) => { const f = st.factors.find((q) => Math.abs(q[0] - a) < 1e-3)?.[1] || 0;
    el("rect", { x: X(c0 + 1), y: Y(a + D.lane_width), width: (c1 - c0 - 2) * k, height: D.lane_width * k * ex, fill: f ? "#c98a2b" : "#8a96a3", opacity: f ? 0.1 + 0.12 * f : 0.06, stroke: "#c98a2b" }, `lane ${i + 1}: ${a} to ${(a + D.lane_width).toFixed(2)} m${f ? ", factor " + f : ", not adverse"}`);
    const t = el("text", { x: X(c0 + 1) + 6, y: Y(a + D.lane_width / 2) + 4, "font-size": 11, fill: "#c98a2b" }); t.textContent = `lane ${i + 1}${f ? " × " + f : ""}`; });
  // UDL bands then girders, bearings, wheels
  for (const L of st.loads) if (L[2] <= 1) el("rect", { x: X(L[3] - 0.125), y: Y(L[1]), width: Math.max(1, (L[4] - L[3] + 0.25) * k), height: Math.max(1, (L[1] - L[0]) * k * ex), fill: "#c98a2b", opacity: 0.3 }, `patterned UDL ch ${L[3]}–${L[4]} m, offsets ${L[0]}–${L[1]} m`);
  for (const [g, mem] of Object.entries(D.plan.girders)) for (const m of mem) { const on = g === R.girder && R.kind !== "R" && Math.abs(m.a[0] - R.ch) < 1e-6 || g === R.girder && R.kind !== "R" && Math.abs(m.b[0] - R.ch) < 1e-6;
    el("line", { x1: X(m.a[0]), y1: Y(m.a[1]), x2: X(m.b[0]), y2: Y(m.b[1]), stroke: on ? "#13202c" : "#0b7aa3", "stroke-width": on ? 5 : 2.5 }, `${g} member ${m.id}`); }
  for (const b of D.plan.bearings) { const on = R.kind === "R" && R.key.startsWith(b.id + ":"); el("path", { d: `M${X(b.ch)} ${Y(b.o) + 3}l-6 10h12z`, fill: on ? "#13202c" : "#b3261e" }, `bearing ${b.id}`); }
  for (const L of st.loads) if (L[2] > 1) el("circle", { cx: X(L[3]), cy: Y(L[0]), r: 3 + 2 * Math.sqrt(L[2] / 60), fill: "#b3261e", opacity: 0.85, stroke: "#fff" }, `${L[2]} kN at ch ${L[3]}, offset ${L[0]}`);
  for (const [g, mem] of Object.entries(D.plan.girders)) { const m = mem[0]; const t = el("text", { x: 4, y: Y(m.a[1]) + 4, "font-size": 11 }); t.textContent = g; }
  const foot = el("text", { x: W - 8, y: H - 6, "text-anchor": "end", "font-size": 11, fill: "#5b6770" }); foot.textContent = `chainage along the bridge, m · offsets from the control line (right +)${ex !== 1 ? " · transverse scale × " + ex.toFixed(2) : ""} · red dots: wheel loads (size ∝ load) · bands: patterned UDL`;
  return h("div", { class: "tablewrap" }, s as unknown as HTMLElement);
}

function ilChart(D: Traffic, R: Traffic["responses"][number], st: State): HTMLElement {
  const lines = D.il[R.key] || []; if (!lines.length) return h("p", { class: "muted small" }, "No influence line stored for this response.");
  const W = 1000, H = 280, px = 50, py = 20, g = D.grid, x0 = g[0], x1 = g[g.length - 1];
  const all = lines.flat(); let lo = Math.min(0, ...all), hi = Math.max(0, ...all); if (hi === lo) hi = lo + 1;
  const X = (c: number) => px + ((c - x0) / (x1 - x0)) * (W - px - 10), Y = (v: number) => py + ((hi - v) / (hi - lo)) * (H - py - 30);
  const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"); s.setAttribute("viewBox", `0 0 ${W} ${H}`); s.setAttribute("class", "plan");
  const el = (t: string, a: Record<string, string | number>) => { const e = document.createElementNS(ns, t); for (const [kk, v] of Object.entries(a)) e.setAttribute(kk, String(v)); s.append(e); return e; };
  el("line", { x1: px, x2: W - 10, y1: Y(0), y2: Y(0), stroke: "#8a96a3" }); el("line", { x1: px, x2: px, y1: py, y2: H - 30, stroke: "#8a96a3" });
  const cols = ["#0b7aa3", "#c98a2b", "#2e7d32", "#7b1fa2", "#b3261e", "#00838f", "#6d4c41"];
  lines.forEach((v, i) => { el("path", { d: v.map((y, j) => (j ? "L" : "M") + X(g[j]).toFixed(1) + " " + Y(y).toFixed(1)).join(""), fill: "none", stroke: cols[i % cols.length], "stroke-width": 1.6 });
    const t = el("text", { x: W - 12, y: py + 14 + 14 * i, "text-anchor": "end", "font-size": 11, fill: cols[i % cols.length] }); t.textContent = `lane centre ${fmt(D.il_offsets[i], 2)} m`; });
  const seen = new Set<number>();
  for (const L of st.loads) if (L[2] > 1 && !seen.has(L[3])) { seen.add(L[3]); el("line", { x1: X(L[3]), x2: X(L[3]), y1: py, y2: H - 30, stroke: "#b3261e", "stroke-dasharray": "3 3", opacity: 0.6 }); }
  [lo, 0, hi].forEach((v) => { const t = el("text", { x: px - 4, y: Y(v) + 4, "text-anchor": "end", "font-size": 11 }); t.textContent = fmt(v, 3); });
  [x0, (x0 + x1) / 2, x1].forEach((c) => { const t = el("text", { x: X(c), y: H - 12, "text-anchor": "middle", "font-size": 11 }); t.textContent = "ch " + fmt(c, 1); });
  const t = el("text", { x: px + 4, y: py + 12, "font-size": 11, fill: "#5b6770" }); t.textContent = `${KIND[R.kind][1]} per kN`;
  return h("div", { class: "tablewrap" }, s as unknown as HTMLElement);
}
