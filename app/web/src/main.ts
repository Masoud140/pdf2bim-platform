// PDF2BIM web app: projects, drawings, description values, model, analysis, design, run log.
import { api, Project, Run, ValueRow, Drawings, Meta } from "./api";
import { h, fmt, TAGS, tagChip, utilClass, table, empty } from "./dom";
import { modelViewer, ModelView } from "./model3d";

const app = document.getElementById("app")!;
const TABS: [string, string][] = [["overview", "Overview"], ["drawings", "Drawings"], ["values", "Bridge data"], ["model", "Model 3D"],
  ["analysis", "Analysis"], ["design", "Design checks"], ["run", "Run log & files"]];
let poll: number | undefined;

function route() {
  clearInterval(poll);
  const [path, q] = location.hash.replace(/^#/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(q || "");
  if (parts[0] === "p" && parts[1]) projectPage(decodeURIComponent(parts[1]), parts[2] || "overview", params).catch(fail);
  else home().catch(fail);
}
window.addEventListener("hashchange", route);
const fail = (e: Error) => { app.replaceChildren(h("div", { class: "page" }, h("div", { class: "alert bad" }, "Error: " + e.message))); };

function topbar(crumb?: string) {
  return h("header", { class: "top" }, h("a", { href: "#/", class: "brand" }, h("span", { class: "logo" }, "▱"), "PDF2BIM"),
    h("span", { class: "muted" }, "Bridge drawings → model → analysis → design"), crumb ? h("span", { class: "crumb" }, "/ ", crumb) : null);
}

function tagBar(tags: Record<string, number>) {
  const tot = Object.values(tags).reduce((a, b) => a + b, 0) || 1;
  return h("div", { class: "tagbar", title: TAGS.filter((t) => tags[t]).map((t) => `${t}: ${tags[t]}`).join("\n") },
    TAGS.filter((t) => tags[t]).map((t) => h("span", { class: `seg t-${t.replace(/[^A-Za-z]/g, "")}`, style: `width:${(100 * tags[t]) / tot}%` })));
}

// ---------------- home ----------------
async function home() {
  const ps = await api.projects();
  const form = h("form", { class: "card new", onsubmit: async (e: Event) => {
    e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); msg.textContent = "Creating…";
    try { const r = await api.create(fd); location.hash = `#/p/${r.id}/drawings`; } catch (err) { msg.textContent = (err as Error).message; }
  } },
  h("h3", {}, "New bridge"), h("p", { class: "muted small" }, "Upload the drawing set (PDF). The bridge description starts with every field Missing — Flagged; nothing is filled in automatically."),
  h("label", {}, "Bridge id", h("input", { name: "id", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9_-]*", placeholder: "e.g. BR27" })),
  h("label", {}, "Drawings (PDF)", h("input", { name: "drawings", type: "file", accept: "application/pdf", multiple: true })),
  h("button", { class: "btn primary", type: "submit" }, "Create"));
  const msg = h("div", { class: "small muted" }); form.append(msg);
  app.replaceChildren(topbar(), h("main", { class: "page" }, h("h1", {}, "Bridges"),
    h("div", { class: "grid cards" }, ps.map(projCard), form)));
}

function projCard(p: Project) {
  const tot = Object.values(p.tags).reduce((a, b) => a + b, 0);
  const run = p.last_run;
  return h("a", { class: "card proj", href: `#/p/${p.id}/overview` }, h("div", { class: "row between" }, h("h3", {}, p.id), h("span", { class: "pill" }, p.origin)),
    h("p", { class: "muted small clamp" }, p.name || "(name not extracted)"), tagBar(p.tags),
    h("div", { class: "kv small" }, h("span", {}, `${tot} values · ${p.tags["Missing-Flagged"] || 0} missing`), h("span", {}, `${p.drawings} drawing file(s)`),
      h("span", {}, run ? `last run ${run.id} — ${run.state}` : "not run in the app")));
}

// ---------------- project shell ----------------
async function projectPage(id: string, tab: string, params: URLSearchParams) {
  const ps = await api.projects(); const p = ps.find((x) => x.id === id);
  if (!p) throw new Error(`no project ${id}`);
  const nav = h("nav", { class: "tabs" }, TABS.map(([k, n]) => h("a", { href: `#/p/${id}/${k}`, class: k === tab ? "on" : "" }, n)));
  const body = h("section", { class: "tabbody" }, h("div", { class: "muted" }, "Loading…"));
  app.replaceChildren(topbar(id), h("main", { class: "page wide" }, h("div", { class: "row between" }, h("div", {}, h("h1", {}, id), h("p", { class: "muted" }, p.name || "")),
    h("div", { class: "row" }, h("a", { class: "btn ghost", href: api.descUrl(id) }, "Description JSON"))), nav, body));
  const views: Record<string, () => Promise<HTMLElement>> = { overview: () => overview(id), drawings: () => drawings(id, params), values: () => values(id),
    model: () => model(id), analysis: () => analysis(id), design: () => design(id), run: () => runTab(id) };
  body.replaceChildren(await (views[tab] || views.overview)());
}

function provenance(meta: Meta | null, extra?: string[]) {
  if (!meta) return null;
  const src = meta.source === "run" ? `App run ${meta.run}${meta.engine_commit ? ` · engine ${meta.engine_commit}` : ""}` : `Repository output ${meta.file} (commit ${meta.engine_commit || "?"})`;
  return h("div", { class: "alert warn small" }, h("b", {}, "INDICATIVE — not design-approved. "), `${src}. `,
    meta.allow_proposed !== false ? "Uses PROPOSED inputs (decisions not yet accepted by the engineer)" : "Accepted inputs only", extra && extra.length ? `: ${extra.join(", ")}.` : ".",
    " Standards values code-extracted, UNVERIFIED.");
}

// ---------------- overview ----------------
const PIPE = [["drawings", "Drawings"], ["values", "Bridge data"], ["geometry", "Geometry"], ["sections", "Sections"], ["model", "Model + SW/SDL"],
  ["mct", "MIDAS .mct"], ["actions", "Loads & combinations"], ["design", "Design checks"]];

async function overview(id: string) {
  const [run, vals, dr, mv, gc, ca] = await Promise.all([api.latest(id), api.values(id, true), api.drawings(id), api.result<ModelView>(id, "model_view.json"),
    api.result<Record<string, any>>(id, "girder_checks.json"), api.result<any>(id, "combined_actions.json")]);
  const tags: Record<string, number> = {}; vals.rows.forEach((r) => (tags[r.tag] = (tags[r.tag] || 0) + 1));
  const review = vals.rows.filter(needsReview).length;
  const st = (k: string) => k === "drawings" ? (dr.files.length ? "done" : "waiting") : k === "values" ? (tags["Missing-Flagged"] === vals.rows.length ? "waiting" : "done")
    : run?.steps.find((s) => s.key === k)?.state || "not run";
  const pipe = h("div", { class: "pipe" }, PIPE.map(([k, n], i) => [i ? h("span", { class: "arrow" }, "→") : null,
    h("a", { class: `stage s-${st(k).replace(/ /g, "")}`, href: `#/p/${id}/${k === "geometry" || k === "sections" || k === "mct" ? "run" : k === "actions" ? "analysis" : k}` },
      h("b", {}, n), h("span", { class: "small" }, st(k)))]));
  const allow = h("input", { type: "checkbox", checked: true }) as HTMLInputElement;
  const runBtn = h("button", { class: "btn primary", onclick: async () => { try { await api.run(id, allow.checked); location.hash = `#/p/${id}/run`; } catch (e) { alert((e as Error).message); } } }, "Run the chain");
  const g = gc.data ? girderSummary(gc.data) : null;
  const worst = g ? g.reduce((a, b) => (b.u > a.u ? b : a)) : null;
  const piles = ca.data ? Object.entries<any>(ca.data.schedule.piles).map(([k, v]) => ({ k, N: v.ULS?.N?.max, Ns: v.SLS?.N?.max })) : [];
  const pmax = piles.length ? piles.reduce((a, b) => (b.N > a.N ? b : a)) : null;
  const tiles = [
    tile("Bridge data", `${vals.rows.length} values`, `${tags["Direct"] || 0} Direct · ${tags["Calculated"] || 0} Calculated · ${tags["Missing-Flagged"] || 0} Missing`, `#/p/${id}/values`),
    tile("Needs review", String(review), "Missing, Assumed or proposed values", `#/p/${id}/values?review=1`, review ? "warn" : ""),
    tile("Self weight / SDL", mv.data ? `${fmt(-mv.data.cases.SW.applied_kN[2], 0)} / ${fmt(-(mv.data.cases.SDL.total_kN || 0), 0)} kN` : "—",
      mv.data ? `equilibrium residual ${mv.data.cases.SW.equilibrium_residual_kN.toExponential(1)} kN` : "run the chain", `#/p/${id}/model`),
    tile("Worst girder utilisation", worst ? fmt(worst.u, 2) : "—", worst ? `${worst.g} · ${worst.what}` : "no design results", `#/p/${id}/design`, worst ? utilClass(worst.u) : ""),
    tile("Max pile axial (ULS)", pmax ? `${fmt(pmax.N, 0)} kN` : "—", pmax ? `pile ${pmax.k} · SLS ${fmt(pmax.Ns, 0)} kN` : "no results", `#/p/${id}/analysis`),
  ];
  return h("div", {}, h("div", { class: "card" }, h("div", { class: "row between" }, h("h3", {}, "Pipeline"),
      h("div", { class: "row" }, h("label", { class: "small" }, allow, " use proposed inputs (provisional)"), runBtn)), pipe,
    h("p", { class: "small muted" }, run ? `Last run ${run.id}: ${run.state}${run.finished ? `, finished ${run.finished}` : ""}.` : "Not run in the app yet — results below (if any) are the outputs committed in the repository.")),
    h("div", { class: "grid tiles" }, tiles), provenance(gc.meta || mv.meta, mv.data?.provisional_decisions),
    h("div", { class: "card" }, h("h3", {}, "Data quality"), tagBar(tags), h("div", { class: "row wrap small" }, TAGS.filter((t) => tags[t]).map((t) => h("span", {}, tagChip(t), " ", tags[t])))));
}

const tile = (t: string, v: string, s: string, href: string, cls = "") => h("a", { class: `card tile ${cls}`, href }, h("div", { class: "small muted" }, t), h("div", { class: "big" }, v), h("div", { class: "small muted" }, s));
const needsReview = (r: ValueRow) => r.tag === "Missing-Flagged" || r.tag === "Assumed" || r.proposed || r.status === "proposed";

// ---------------- drawings ----------------
async function drawings(id: string, params: URLSearchParams) {
  const d: Drawings = await api.drawings(id);
  const up = h("form", { class: "row", onsubmit: async (e: Event) => { e.preventDefault(); await api.upload(id, new FormData(e.target as HTMLFormElement)); route(); } },
    h("input", { type: "file", name: "drawings", accept: "application/pdf", multiple: true }), h("button", { class: "btn" }, "Upload"));
  if (!d.files.length) return h("div", {}, empty("No drawings uploaded", "Upload the PDF drawing set. Drawings are stored in the app's data folder only (never committed to the repository)."), up);
  const docName = (did: string) => d.documents.find((x) => x.id === did)?.number || did;
  const pages = d.files.flatMap((f) => f.pages.map((p) => ({ file: f.file, ...p })));
  const want = params.get("doc");
  let cur = Math.max(0, want ? pages.findIndex((p) => p.documents.includes(want)) : 0);
  let zoom = 1;
  const img = h("img", { class: "sheet", alt: "drawing page" }) as HTMLImageElement;
  const title = h("div", { class: "small" });
  const list = h("div", { class: "pagelist" });
  const show = () => {
    const p = pages[cur];
    img.src = api.pageUrl(id, p.file, p.page, zoom > 1.5 ? 220 : 130); img.style.width = `${zoom * 100}%`;
    title.textContent = `${p.file} — page ${p.page} of ${pages.filter((x) => x.file === p.file).length}${p.documents.length ? " · " + p.documents.map(docName).join(", ") : ""}`;
    [...list.children].forEach((c, i) => c.classList.toggle("on", i === cur));
    (list.children[cur] as HTMLElement)?.scrollIntoView({ block: "nearest" });
  };
  pages.forEach((p, i) => list.append(h("button", { class: "pg", onclick: () => { cur = i; show(); } }, h("b", {}, `p${p.page}`), " ", p.documents.join(", ") || h("span", { class: "muted" }, p.file))));
  const z = (f: number) => () => { zoom = Math.min(4, Math.max(0.5, zoom * f)); show(); };
  const bar = h("div", { class: "toolbar" }, h("button", { class: "btn ghost", onclick: () => { cur = Math.max(0, cur - 1); show(); } }, "◀"),
    h("button", { class: "btn ghost", onclick: () => { cur = Math.min(pages.length - 1, cur + 1); show(); } }, "▶"),
    h("button", { class: "btn ghost", onclick: z(1 / 1.4) }, "−"), h("button", { class: "btn ghost", onclick: z(1.4) }, "+"),
    h("button", { class: "btn ghost", onclick: () => { zoom = 1; show(); } }, "Fit"), title);
  setTimeout(show);
  return h("div", {}, h("div", { class: "row between" }, h("span", { class: "small muted" }, `${pages.length} pages in ${d.files.length} file(s)`), up),
    h("div", { class: "drawings" }, list, h("div", { class: "sheetwrap" }, bar, h("div", { class: "sheetscroll" }, img))));
}

// ---------------- bridge data (description values) ----------------
async function values(id: string) {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const [{ rows, revision: rv }, dr] = await Promise.all([api.values(id, true), api.drawings(id)]);
  const revision = (rv as any)?.number ?? rv;
  const docFor = (s: string | null) => s ? dr.documents.find((d) => d.id === s || d.id.endsWith(s) || d.number?.endsWith(s))?.id : undefined;
  const groups = [...new Set(rows.map((r) => r.path.split(/[.[]/)[0]))];
  const state = { q: "", tag: "", group: "", review: params.get("review") === "1" };
  const counts: Record<string, number> = {}; rows.forEach((r) => (counts[r.tag] = (counts[r.tag] || 0) + 1));
  const tbody = h("tbody"); const cnt = h("span", { class: "small muted" });
  const draw = () => {
    const f = rows.filter((r) => (!state.tag || r.tag === state.tag) && (!state.group || r.path.startsWith(state.group)) && (!state.review || needsReview(r)) &&
      (!state.q || (r.path + " " + (r.note || "") + " " + fmt(r.value)).toLowerCase().includes(state.q)));
    cnt.textContent = `${f.length} of ${rows.length} values · description revision ${revision}`;
    tbody.replaceChildren(...f.slice(0, 1500).map((r) => { const did = docFor(r.sheet);
      return h("tr", { class: `r-${r.tag.replace(/[^A-Za-z]/g, "")}` }, h("td", { class: "mono" }, r.path), h("td", { class: "val" }, fmt(r.value)), h("td", {}, r.unit || ""),
        h("td", {}, tagChip(r.tag), r.proposed ? h("span", { class: "pill warn", title: `proposed override, decision ${r.decision}; drawing record: ${r.original_tag}` }, "proposed") : null),
        h("td", {}, did ? h("a", { href: `#/p/${id}/drawings?doc=${encodeURIComponent(did)}` }, r.sheet) : r.sheet || "", r.view ? h("div", { class: "small muted" }, r.view) : null),
        h("td", { class: "small" }, r.derivation ? h("div", {}, "= ", r.derivation) : null, r.note || "", r.replace_with ? h("div", { class: "muted" }, "needs: ", r.replace_with) : null),
        h("td", { class: "small" }, r.decision || "")); }));
  };
  const chips = h("div", { class: "row wrap" }, h("button", { class: "chip on", onclick: (e: Event) => pick("", e) }, `All ${rows.length}`),
    TAGS.filter((t) => counts[t]).map((t) => h("button", { class: "chip", onclick: (e: Event) => pick(t, e) }, tagChip(t), ` ${counts[t]}`)));
  const pick = (t: string, e: Event) => { state.tag = t; chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("on")); (e.currentTarget as HTMLElement).classList.add("on"); draw(); };
  const rev = h("input", { type: "checkbox", checked: state.review, onchange: (e: Event) => { state.review = (e.target as HTMLInputElement).checked; draw(); } });
  setTimeout(draw);
  return h("div", {}, h("div", { class: "card filters" }, chips, h("div", { class: "row wrap" },
      h("input", { type: "search", placeholder: "Search path, value or note", oninput: (e: Event) => { state.q = (e.target as HTMLInputElement).value.toLowerCase(); draw(); } }),
      h("select", { onchange: (e: Event) => { state.group = (e.target as HTMLSelectElement).value; draw(); } }, h("option", { value: "" }, "All sections"), groups.map((g) => h("option", { value: g }, g))),
      h("label", { class: "small" }, rev, " Needs review only"), cnt)),
    h("div", { class: "tablewrap tall" }, h("table", { class: "values" }, h("thead", {}, h("tr", {}, ["Path", "Value", "Unit", "Data source", "Sheet", "Note / derivation", "Decision"].map((x) => h("th", {}, x)))), tbody)));
}

// ---------------- model ----------------
async function model(id: string) {
  const r = await api.result<ModelView>(id, "model_view.json");
  if (!r.data) return empty("No model yet", h("span", {}, "Run the chain from the ", h("a", { href: `#/p/${id}/overview` }, "Overview"), " tab to build the integrated model."));
  return h("div", {}, provenance(r.meta, r.data.provisional_decisions), modelViewer(r.data));
}

// ---------------- analysis ----------------
async function analysis(id: string) {
  const [mv, ca] = await Promise.all([api.result<ModelView>(id, "model_view.json"), api.result<any>(id, "combined_actions.json")]);
  const out = h("div", {}, provenance(ca.meta || mv.meta, mv.data?.provisional_decisions));
  if (mv.data) {
    const m = mv.data;
    const gz = (c: string) => { let best = { n: "", z: 0 }; for (const [n, u] of Object.entries(m.cases[c].u)) if (m.nodes[n]?.[3] === "girder" && u[2] < best.z) best = { n, z: u[2] }; return best; };
    out.append(h("div", { class: "card" }, h("h3", {}, "Permanent load cases (unfactored)"), table(["Case", "Applied (kN)", "Max girder deflection (mm)", "Equilibrium residual (kN)"],
      Object.keys(m.cases).map((c) => [c === "SW" ? "Self weight" : "Superimposed dead load", fmt(-m.cases[c].applied_kN[2], 1), fmt(-gz(c).z * 1000, 1), m.cases[c].equilibrium_residual_kN.toExponential(2)]))));
  }
  if (!ca.data) { out.append(empty("No combined actions", "Run the chain to compute loads and AS 5100.2 combinations.")); return out; }
  const S = ca.data.schedule; const gov = (o: any, k: string) => h("span", { class: "small muted" }, o?.[k] || "");
  const cell = (v: any, g?: any) => h("td", {}, fmt(v, 0), g ? h("div", {}, g) : null);
  out.append(
    h("div", { class: "card" }, h("h3", {}, "Bearings — vertical / transverse / longitudinal (kN)"), table(["Bearing", "ULS V max", "ULS V min", "SLS V max", "SLS V min", "ULS H transverse ±", "ULS H longitudinal ±"],
      Object.entries<any>(S.bearings).map(([k, v]) => [k, cell(v.ULS.v.max, gov(v.ULS.v, "gmax")), cell(v.ULS.v.min, gov(v.ULS.v, "gmin")), cell(v.SLS.v.max), cell(v.SLS.v.min),
        `${fmt(v.ULS.tr.max, 0)} / ${fmt(v.ULS.tr.min, 0)}`, `${fmt(v.ULS.lon.max, 0)} / ${fmt(v.ULS.lon.min, 0)}`]), "num")),
    h("div", { class: "card" }, h("h3", {}, "Piles (kN, kN·m)"), table(["Pile", "ULS N max", "ULS N min", "SLS N max", "ULS M long.", "ULS M trans.", "ULS M resultant"],
      Object.entries<any>(S.piles).map(([k, v]) => [k, cell(v.ULS.N.max, gov(v.ULS.N, "gmax")), cell(v.ULS.N.min), cell(v.SLS.N.max), cell(v.ULS.Ml.abs, gov(v.ULS.Ml, "gov")), cell(v.ULS.Mt.abs, gov(v.ULS.Mt, "gov")),
        cell(ca.data.pile_resultants?.[k]?.resultant_upper)]), "num")),
    h("div", { class: "card" }, h("h3", {}, "Girders — design actions (kN, kN·m)"), table(["Girder", "ULS M sag", "ULS M hog", "ULS V", "ULS T", "SLS M sag"],
      Object.entries<any>(S.girders).sort().map(([k, v]) => [k, cell(v.ULS.M_sag.value, gov(v.ULS.M_sag, "gov")), cell(v.ULS.M_hog.value), cell(v.ULS.V.abs), cell(v.ULS.T.abs), cell(v.SLS.M_sag.value)]), "num")),
    h("div", { class: "card" }, h("h3", {}, "Sills / headstocks (kN·m, kN)"), table(["Support", "ULS My max", "ULS My min", "ULS Vz", "ULS T"],
      Object.entries<any>(S.sills).map(([k, v]) => [k, cell(v.ULS.My_max.value), cell(v.ULS.My_min.value), cell(v.ULS.Vz.abs), cell(v.ULS.T?.abs)]), "num")),
    h("p", { class: "small muted" }, `${ca.data.governing_rows?.length || 0} governing combination rows; ${ca.data.not_combined?.length || 0} actions not combined. Full schedule: `,
      h("a", { href: api.fileUrl(id, "combined_actions.md") }, "combined_actions.md")));
  return out;
}

// ---------------- design ----------------
interface GSum { g: string; u: number; what: string; uB: number; uS: number; uV: number; minFail: number }
function girderSummary(gc: Record<string, any>): GSum[] {
  return Object.keys(gc).filter((k) => gc[k]?.rows).sort().map((g) => {
    let uB = 0, uS = 0, uV = 0, minFail = 0;
    for (const r of gc[g].rows) { if (r.conf === "solid") { uV = Math.max(uV, r.shear?.u ?? 0); continue; } uB = Math.max(uB, r.sag?.uB ?? 0, r.hog?.uB ?? 0); uS = Math.max(uS, r.sag?.uS ?? 0, r.hog?.uS ?? 0); uV = Math.max(uV, r.shear?.u ?? 0); if (r.sag && r.sag.okMin === false) minFail++; }
    const m = Math.max(uB, uS, uV);
    return { g, u: m, what: m === uB ? "ULS bending" : m === uS ? "SLS stress" : "shear / torsion", uB, uS, uV, minFail };
  });
}

async function design(id: string) {
  const r = await api.result<Record<string, any>>(id, "girder_checks.json");
  if (!r.data) return empty("No design checks", "Run the chain to check the girders.");
  const gc = r.data; const sum = girderSummary(gc);
  const gs = sum.map((s) => s.g);
  const st = gc[gs[0]].rows.map((x: any) => x.t);
  const uc = (u: number | undefined) => h("td", { class: `uc ${utilClass(u)}` }, u === undefined ? "—" : fmt(u, 2));
  const heat = (key: string, label: string, f: (row: any) => number | undefined) => h("div", { class: "card" }, h("h3", {}, label),
    table(["Girder", ...st.map((t: number) => `t=${fmt(t, 2)}`)], gs.map((g) => [g, ...gc[g].rows.map((row: any) => uc(f(row)))]), "heat"));
  const detail = h("div");
  const sel = h("select", { onchange: (e: Event) => showG((e.target as HTMLSelectElement).value) }, gs.map((g) => h("option", { value: g }, g)));
  const showG = (g: string) => detail.replaceChildren(table(["t", "x (m)", "zone", "strands", "Ms*/Mal", "M*/φMu sag", "M*/φMu hog", "Muo ≥ 1.2Mcr", "shear/torsion u"],
    gc[g].rows.map((x: any) => [fmt(x.t, 2), fmt(x.x_m, 2), x.conf, x.n_strands ?? "", uc(x.sag?.uS), uc(x.sag?.uB), uc(x.hog?.uB),
      x.conf === "solid" || !x.sag ? h("span", { class: "muted" }, "n/a") : x.sag.okMin ? "ok" : h("b", { class: "bad" }, "FAIL"), uc(x.shear?.u)]), "num"),
    h("p", { class: "small muted" }, "Solid end zones: shear only (flexure / SLS not checked there)."));
  setTimeout(() => showG(gs[0]));
  const notes = (gc[gs[0]].notes || []) as string[];
  return h("div", {}, provenance(r.meta),
    h("div", { class: "card" }, h("h3", {}, "Summary — maximum utilisation per girder"), table(["Girder", "Governing", "ULS bending", "SLS stress", "Shear / torsion", "Minimum strength fails"],
      sum.map((s) => [s.g, h("td", { class: "left" }, h("b", {}, s.what)), uc(s.uB), uc(s.uS), uc(s.uV), s.minFail ? h("b", { class: "bad" }, String(s.minFail)) : "0"]), "num"),
      h("p", { class: "small muted" }, "Utilisation = action / capacity; > 1.00 red, > 0.90 amber. Stations at fractions t of the span.")),
    heat("uB", "ULS bending M*/φMu (sagging) along the girders", (x) => x.sag?.uB),
    heat("uV", "Shear / torsion utilisation along the girders", (x) => x.shear?.u),
    h("div", { class: "card" }, h("div", { class: "row between" }, h("h3", {}, "Station detail"), sel), detail),
    notes.length ? h("div", { class: "card small" }, h("h3", {}, "Method notes"), h("ul", {}, notes.map((n) => h("li", {}, n)))) : null,
    h("p", { class: "small muted" }, "Full report: ", h("a", { href: api.fileUrl(id, "girder_checks.md") }, "girder_checks.md")));
}

// ---------------- run log ----------------
async function runTab(id: string) {
  const box = h("div");
  const draw = (run: Run | null) => {
    if (!run) { box.replaceChildren(empty("No runs yet", h("span", {}, "Start one from the ", h("a", { href: `#/p/${id}/overview` }, "Overview"), "."))); return; }
    const pre = h("pre", { class: "log" }, run.log || "");
    box.replaceChildren(h("div", { class: "card" }, h("div", { class: "row between" }, h("h3", {}, `Run ${run.id} — ${run.state}`),
        h("span", { class: "small muted" }, `${run.allow_proposed ? "proposed inputs used (provisional)" : "accepted inputs only"} · engine ${run.engine_commit || "?"} · ${run.description}`)),
      table(["Step", "State", "Time (s)"], run.steps.map((s) => [s.title, h("span", { class: `state s-${s.state}` }, s.state), s.seconds ?? ""]))),
      h("div", { class: "card" }, h("h3", {}, "Files from this run"), h("div", { class: "row wrap" }, run.files.map((f) => h("a", { class: "btn ghost", href: api.fileUrl(id, f) }, f)))),
      h("div", { class: "card" }, h("h3", {}, "Log"), pre));
    pre.scrollTop = pre.scrollHeight;
    if (run.state !== "running") clearInterval(poll);
  };
  const first = await api.latest(id);
  draw(first);
  if (first?.state === "running") poll = window.setInterval(async () => draw(await api.latest(id)), 2500);
  return box;
}

route();
