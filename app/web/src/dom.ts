// Small DOM helpers (no framework).
type Attrs = Record<string, string | number | boolean | null | undefined | ((e: Event) => void)>;
type Child = Node | string | number | null | undefined | false | Child[];

export function h(tag: string, attrs: Attrs = {}, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.replace(/^on/, ""), v as EventListener);
    else if (k === "class") el.className = String(v);
    else if (k === "html") el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  add(el, kids);
  return el;
}

function add(el: HTMLElement, kids: Child[]) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) add(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const fmt = (v: unknown, d = 0): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) && d === 0 ? v.toLocaleString("en-AU") : v.toLocaleString("en-AU", { maximumFractionDigits: d, minimumFractionDigits: d });
  if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${typeof x === "number" ? +x.toPrecision(6) : x}`).join(" · ");
  return String(v);
};

export const TAGS = ["Direct", "Calculated", "Confirmed-Engineer", "Input-user", "Standard-verify", "Model", "Assumed", "Missing-Flagged"];
export const tagChip = (t: string | null | undefined) => h("span", { class: `tag t-${(t || "none").replace(/[^A-Za-z]/g, "")}` }, t || "—");

export function utilClass(u: number | null | undefined): string {
  if (u === null || u === undefined || Number.isNaN(u)) return "u-na";
  return u > 1.0 ? "u-fail" : u > 0.9 ? "u-warn" : "u-ok";
}

export function table(head: (string | Node)[], rows: Child[][], cls = ""): HTMLElement {
  return h("div", { class: "tablewrap" }, h("table", { class: cls }, h("thead", {}, h("tr", {}, head.map((x) => h("th", {}, x)))),
    h("tbody", {}, rows.map((r) => h("tr", {}, r.map((c) => (c instanceof HTMLElement && c.tagName === "TD" ? c : h("td", {}, c))))))));
}

export const empty = (title: string, body: Child) => h("div", { class: "empty" }, h("h3", {}, title), h("p", {}, body));
