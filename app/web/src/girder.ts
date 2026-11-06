// Girder editor (P9.3): edit a Super-T type's section, strands, bars, fitments and zones; save as one engineer
// decision (Input-user, accepted by the same person); run the chain again; see the checks. The preview below only
// draws what was entered; every engineering number comes from the run (girder_checks.json).
import { api, ValueRow, STATIC } from "./api";
import { h, fmt, empty, utilClass, table } from "./dom";

type Cells = Record<string, unknown>;
export interface GSum { g: string; u: number; what: string; uB: number; uS: number; uV: number; minFail: number }
export function girderSummary(gc: Record<string, any>): GSum[] {
  return Object.keys(gc).filter((k) => gc[k]?.rows).sort().map((g) => {
    let uB = 0, uS = 0, uV = 0, minFail = 0;
    for (const r of gc[g].rows) { if (r.conf === "solid") { uV = Math.max(uV, r.shear?.u ?? 0); continue; } uB = Math.max(uB, r.sag?.uB ?? 0, r.hog?.uB ?? 0); uS = Math.max(uS, r.sag?.uS ?? 0, r.hog?.uS ?? 0); uV = Math.max(uV, r.shear?.u ?? 0); if (r.sag && r.sag.okMin === false) minFail++; }
    const m = Math.max(uB, uS, uV);
    return { g, u: m, what: m === uB ? "ULS bending" : m === uS ? "SLS stress" : "shear / torsion", uB, uS, uV, minFail };
  });
}

const SCALARS: [string, string][] = [["depth", "Depth"], ["top_flange_width", "Top flange width"], ["concrete_28d", "f'c girder"], ["concrete_transfer", "f'cp at transfer"],
  ["jacking_ratio", "Jacking stress / fpb"], ["haunch", "Haunch"], ["transfer_supports", "Support from end at transfer"], ["age_at_transfer", "Age at transfer"],
  ["age_at_erection", "Age at erection"], ["age_deck_cast", "Age when deck cast"]];
const TABLES: [string, string, string[], string][] = [
  ["strand_pattern", "Tendons (one row per strand; untick 'on' to remove a strand)", ["y", "x", "diameter", "debond_left", "debond_right", "on"], "y, x from the soffit / centreline (mm); debond lengths from each end (mm)"],
  ["bars", "Longitudinal reinforcement", ["y", "diameter", "number", "from", "to"], "y (mm) from the soffit; from / to (m) along the girder"],
  ["fitments", "Shear / torsion fitments", ["from", "to", "diameter", "legs", "spacing"], "from / to (m) along the girder; spacing (mm)"],
  ["zones", "Solid end blocks / open zones", ["from", "to", "kind"], "kind: solid_end_A | solid_end_B | open"],
  ["deck_bars", "Deck reinforcement acting with the girder", ["face", "diameter", "spacing", "cover"], "mm"],
  ["shape", "Section shape parameters (Super-T library keys)", ["key", "name", "value", "unit"], "only 'value' is normally edited"]];
const store = { get: (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private window */ } } };

export async function girderEditor(id: string, rerender: () => void): Promise<HTMLElement> {
  const [vals, secs, checks] = await Promise.all([api.values(id, true), api.result<any>(id, "sections.json"), api.result<any>(id, "girder_checks.json")]);
  const rows = vals.rows;
  const types = [...new Set(rows.map((r) => /^superstructure\.supert_types\[([^\]]+)\]/.exec(r.path)?.[1]).filter(Boolean))] as string[];
  if (!types.length) return empty("No Super-T girder types in the bridge data", "Read or enter the girder drawings first.");
  const members = rows.filter((r) => /\.type_ref$/.test(r.path)).map((r) => ({ m: /members\[([^\]]+)\]/.exec(r.path)?.[1] || "", t: String(r.value) }));
  const wrap = h("div");
  let cur = types[0];
  const show = () => {
    const pre = `superstructure.supert_types[${cur}]`;
    const mine = rows.filter((r) => r.path.startsWith(pre + "."));
    const sc: Record<string, { row: ValueRow; input: HTMLInputElement }> = {};
    const tb: Record<string, { rows: { row: ValueRow | null; cells: Cells; inputs: Record<string, HTMLInputElement> }[] }> = {};
    const prev = h("div", { class: "card" });
    const usedBy = members.filter((x) => x.t === cur).map((x) => x.m);
    // scalars
    const scal = h("div", { class: "grid tiles" }, SCALARS.map(([k, label]) => {
      const r = mine.find((x) => x.path === `${pre}.${k}`);
      if (!r) return null;
      const inp = h("input", { value: r.value === null || r.value === undefined ? "" : String(r.value), size: 9, disabled: !!STATIC }) as HTMLInputElement;
      sc[k] = { row: r, input: inp };
      return h("label", { class: "card tile" }, h("div", { class: "small muted" }, `${label}${r.unit ? " (" + r.unit + ")" : ""}`), inp, h("div", { class: "small muted" }, r.tag));
    }));
    // tables
    const tables = TABLES.map(([k, title, cols, hint]) => {
      const trs = mine.filter((r) => r.path.startsWith(`${pre}.${k}.rows[`)).sort((a, b) => +(/rows\[(\d+)\]/.exec(a.path)![1]) - +(/rows\[(\d+)\]/.exec(b.path)![1]));
      tb[k] = { rows: [] };
      const body = h("tbody");
      const addRow = (row: ValueRow | null, cells: Cells) => {
        const inputs: Record<string, HTMLInputElement> = {};
        const tr = h("tr", {}, cols.map((c) => {
          const v = cells[c];
          const inp = (c === "on" ? h("input", { type: "checkbox", checked: v !== false, disabled: !!STATIC, onchange: drawPreview })
            : h("input", { value: v === null || v === undefined ? "" : String(v), size: c === "kind" || c === "name" || c === "face" || c === "key" ? 12 : 7, disabled: !!STATIC, oninput: drawPreview })) as HTMLInputElement;
          inputs[c] = inp; return h("td", {}, inp);
        }), h("td", { class: "small muted" }, row ? row.tag : "new"));
        tb[k].rows.push({ row, cells, inputs }); body.append(tr);
      };
      trs.forEach((r) => addRow(r, { ...(r.value as Cells || {}) }));
      return h("details", { class: "card", open: k === "strand_pattern" || k === "fitments" }, h("summary", {}, h("b", {}, title), h("span", { class: "small muted" }, `  ${trs.length} row(s) · ${hint}`)),
        h("div", { class: "tablewrap" }, h("table", { class: "edit" }, h("thead", {}, h("tr", {}, cols.map((c) => h("th", {}, c)), h("th", {}, "tag"))), body)),
        STATIC ? null : h("button", { class: "btn ghost", onclick: () => { const last = tb[k].rows[tb[k].rows.length - 1]; addRow(null, last ? { ...readCells(last.inputs, cols) } : {}); drawPreview(); } }, "+ Add row"));
    });
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    function readCells(inputs: Record<string, HTMLInputElement>, cols: string[]): Cells {
      const o: Cells = {};
      for (const c of cols) {
        const i = inputs[c];
        if (c === "on") o[c] = i.checked;
        else if (["kind", "name", "face", "key", "unit"].includes(c)) { if (i.value.trim()) o[c] = i.value.trim(); }
        else { const n = num(i.value); if (n !== null) o[c] = n; }
      }
      return o;
    }
    // preview: the computed outline of a girder of this type (last run) + the strands as entered now
    function drawPreview() {
      const sp = tb.strand_pattern?.rows || [];
      const st = sp.map((r) => readCells(r.inputs, ["y", "x", "diameter", "debond_left", "debond_right", "on"]));
      const g = usedBy.find((m) => secs.data?.girders?.[m]);
      const S = g ? secs.data.girders[g] : null;
      const mid = S ? S.stations[Math.floor(S.stations.length / 2)] : null;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const pts: number[][] = mid ? [...mid.outline] : st.map((s) => [Number(s.x) || 0, Number(s.y) || 0]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs, -300) - 120, x1 = Math.max(...xs, 300) + 120, y0 = Math.min(...ys, 0) - 120, y1 = Math.max(...ys, 300) + 120;
      svg.setAttribute("viewBox", `${x0} ${-y1} ${x1 - x0} ${y1 - y0}`); svg.setAttribute("class", "secsvg");
      const P = (poly: number[][]) => poly.map((p) => `${p[0].toFixed(1)},${(-p[1]).toFixed(1)}`).join(" ");
      let on = 0, deb = 0, ysum = 0;
      const dots = st.map((s) => {
        const x = Number(s.x), y = Number(s.y), r = (Number(s.diameter) || 15.2) * 1.6;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return "";
        const isOn = s.on !== false, d = (Number(s.debond_left) || 0) > 0 || (Number(s.debond_right) || 0) > 0;
        if (isOn) { on++; ysum += y; if (d) deb++; }
        return `<circle cx="${x}" cy="${-y}" r="${r}" class="${!isOn ? "st-off" : d ? "st-deb" : "st-on"}"/>`;
      }).join("");
      svg.innerHTML = (mid ? `<polygon points="${P(mid.outline)}" class="sec-girder" fill-rule="evenodd"/>` : "") + dots;
      prev.replaceChildren(h("h3", {}, `${cur} — tendon layout preview`), svg,
        h("div", { class: "row wrap small" }, h("span", { class: "legend-dot st-on" }, "bonded"), h("span", { class: "legend-dot st-deb" }, "debonded at an end"), h("span", { class: "legend-dot st-off" }, "off")),
        h("p", { class: "small" }, `${on} strands on (${deb} debonded at an end) · centroid of the strands ${on ? fmt(ysum / on, 0) : "—"} mm above the soffit (preview of what is entered; checks come from the run).`),
        h("p", { class: "small muted" }, S ? `Outline: ${g} at midspan from the last run (${S.type}). Used by ${usedBy.join(", ") || "—"}.` : "No computed outline yet: run the chain."));
    }
    // last checks for the girders of this type
    const sum = girderSummary(checks.data || {}).filter((x) => usedBy.includes(x.g));
    const c = (u: number) => h("td", { class: `uc ${utilClass(u)}` }, fmt(u, 2));
    const last = sum.map((x) => [x.g, c(x.uB), c(x.uS), c(x.uV)]);
    // save
    const by = h("input", { placeholder: "your name", value: store.get("pdf2bim.name"), size: 16, oninput: (e: Event) => store.set("pdf2bim.name", (e.target as HTMLInputElement).value) }) as HTMLInputElement;
    const why = h("input", { placeholder: "reason, e.g. option B: 44 strands, N12 fitments @100 at the ends", size: 50 }) as HTMLInputElement;
    const msg = h("div", { class: "small" });
    const collect = () => {
      const items: { path: string; value: unknown }[] = []; const new_rows: { table: string; cells: Cells }[] = [];
      for (const [k, { row, input }] of Object.entries(sc)) {
        const v = num(input.value);
        if (input.value.trim() !== "" && Number.isNaN(v as number)) throw new Error(`${k}: not a number`);
        if (v !== null && v !== row.value) items.push({ path: row.path, value: v });
      }
      for (const [k, , cols] of TABLES) for (const r of tb[k]?.rows || []) {
        const c = readCells(r.inputs, cols);
        if (Object.values(c).some((x) => typeof x === "number" && Number.isNaN(x))) throw new Error(`${k}: a cell is not a number`);
        if (!r.row) { if (Object.keys(c).length) new_rows.push({ table: `${pre}.${k}`, cells: c }); }
        else if (JSON.stringify(c) !== JSON.stringify(Object.fromEntries(cols.filter((x) => (r.row!.value as Cells || {})[x] !== undefined).map((x) => [x, (r.row!.value as Cells)[x]])))) items.push({ path: r.row.path, value: { ...(r.row.value as Cells || {}), ...c } });
      }
      return { items, new_rows };
    };
    const save = async (andRun: boolean) => {
      msg.textContent = "";
      try {
        const ch = collect();
        if (!ch.items.length && !ch.new_rows.length) { if (!andRun) { msg.textContent = "Nothing changed."; return; } }
        else { const r = await api.saveBatch(id, { by: by.value, reason: why.value, ...ch }); msg.textContent = `Saved as ${r.decision} (${r.changed} values, accepted by ${by.value}).`; }
        if (andRun) { await api.run(id, true); msg.textContent += " Analysis and checks running — see the progress below; results open in Design checks when done."; watch(); }
        else setTimeout(rerender, 900);
      } catch (e) { msg.textContent = (e as Error).message; }
    };
    const runBox = h("div", { class: "small" });
    const watch = async () => {
      const r = await api.latest(id);
      if (!r) return;
      runBox.replaceChildren(h("div", {}, `Run ${r.id}: ${r.state}`), h("div", { class: "row wrap" }, r.steps.map((s) => h("span", { class: `chip st-${s.state}` }, `${s.title.split(" (")[0]}: ${s.state}`))));
      if (r.state === "running") setTimeout(watch, 3000); else if (r.state === "done") location.hash = `#/p/${id}/design`;
    };
    wrap.replaceChildren(
      h("div", { class: "row between wrap" }, h("div", { class: "row" }, h("b", {}, "Girder type "), h("select", { onchange: (e: Event) => { cur = (e.target as HTMLSelectElement).value; show(); } },
        types.map((t) => h("option", { value: t, selected: t === cur }, t))), h("span", { class: "small muted" }, `used by ${usedBy.join(", ") || "—"}`))),
      h("div", { class: "grid two" }, h("div", {}, h("div", { class: "card" }, h("h3", {}, "Section and materials"), scal), last.length ? h("div", { class: "card" }, h("h3", {}, "Last run: maximum utilisation"),
        table(["Girder", "ULS bending", "SLS stress", "Shear / torsion"], last)) : null), prev),
      ...tables,
      STATIC ? h("p", { class: "small muted" }, "Read-only copy: edit and run in the app on your computer.")
        : h("div", { class: "card sticky-save" }, h("div", { class: "row wrap" }, by, why, h("button", { class: "btn", onclick: () => save(false) }, "Save"), h("button", { class: "btn primary", onclick: () => save(true) }, "Save and run")),
          h("p", { class: "small muted" }, "Saving records every changed value under your name as one decision (tag Input-user) and keeps the previous revision. The drawing values stay in the record’s history."), msg, runBox));
    drawPreview();
  };
  show();
  return wrap;
}
