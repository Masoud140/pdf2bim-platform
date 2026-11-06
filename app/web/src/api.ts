// Typed calls to the Python API (app/server.py).
export interface Project { id: string; name: string | null; origin: string; revision: number | null; tags: Record<string, number>; drawings: number;
  last_run: { id: string; state: string; started: string; finished: string | null } | null }
export interface Step { key: string; title: string; state: string; seconds?: number }
export interface Run { id: string; state: string; revision?: number; allow_proposed: boolean; started: string; finished: string | null; engine_commit: string | null;
  description: string; steps: Step[]; log: string; files: string[] }
export interface ValueRow { path: string; value: unknown; unit: string | null; tag: string; status: string; sheet: string | null; view: string | null;
  note: string | null; derivation: string | null; decision: string | null; proposed: boolean; original_tag: string | null; replace_with: string | null }
export interface Decision { id: string; key: string; by: string; date: string; reason: string; evidence: string[]; affects: string[];
  values: { path: string; value: unknown; tag: string }[]; outputs: string[] }
export interface Meta { source: "run" | "repository"; run?: string; file?: string; allow_proposed?: boolean; engine_commit?: string | null }
export interface Result<T> { meta: Meta | null; data: T | null }
export interface Page { page: number; documents: string[]; w: number; h: number }
export interface Settings { api_key_set: boolean; api_key_hint: string | null; from_env: boolean; model: string }
export interface Extraction { id: string; state: string; started: string; finished: string | null; log: string[]; report: string | null;
  summary: { values: number; conflicts: number; rejected: number; failed: number; documents: number; usage: Record<string, number> } | null }
export interface Drawings { files: { file: string; pages: Page[] }[]; documents: { id: string; number: string; revision: string; title?: string }[] }

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).replace(/<[^>]+>/g, " ").trim().slice(0, 300)}`);
  return r.json() as Promise<T>;
}
const base = (id: string) => `/api/projects/${encodeURIComponent(id)}`;
// Read-only snapshot (published copy): GETs read pre-exported JSON files next to the page (app/export_static.py).
export const STATIC: { taken: string; commit: string } | null = (window as any).PDF2BIM_STATIC || null;
export const staticKey = (url: string) => url.replace(/^\//, "").replace(/\?/g, "__").replace(/=/g, "-").replace(/&/g, "__") + ".json";
const fetch = (url: string, init?: RequestInit): Promise<Response> => {
  if (!STATIC) return window.fetch(url, init);
  if (init?.method && init.method !== "GET") return Promise.reject(new Error("This online copy is read-only. Upload drawings and run the chain in the app on your computer."));
  return window.fetch("data/" + staticKey(url));
};

export const api = {
  projects: () => fetch("/api/projects").then((r) => j<Project[]>(r)),
  create: (fd: FormData) => fetch("/api/projects", { method: "POST", body: fd }).then((r) => j<{ id: string }>(r)),
  values: (id: string, allow: boolean) => fetch(`${base(id)}/values?allow_proposed=${allow ? 1 : 0}`).then((r) => j<{ revision: number; rows: ValueRow[] }>(r)),
  drawings: (id: string) => fetch(`${base(id)}/drawings`).then((r) => j<Drawings>(r)),
  upload: (id: string, fd: FormData) => fetch(`${base(id)}/drawings`, { method: "POST", body: fd }).then((r) => j<{ saved: string[] }>(r)),
  pageUrl: (id: string, file: string, page: number, dpi: number) => `${base(id)}/drawings/${encodeURIComponent(file)}/${page}.png?dpi=${dpi}`,
  run: (id: string, allow: boolean) => fetch(`${base(id)}/runs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allow_proposed: allow }) }).then((r) => j<{ id: string }>(r)),
  latest: (id: string) => fetch(`${base(id)}/runs/latest`).then((r) => j<Run | null>(r)),
  result: <T>(id: string, name: string) => fetch(`${base(id)}/results/${name}`).then((r) => j<Result<T>>(r)),
  decisions: (id: string) => fetch(`${base(id)}/decisions`).then((r) => j<{ revision: number; items: Decision[] }>(r)),
  decide: (id: string, did: string, body: { by: string; accept: boolean; note?: string }) =>
    fetch(`${base(id)}/decisions/${did}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<{ message: string }>(r)),
  enterValue: (id: string, body: Record<string, unknown>) =>
    fetch(`${base(id)}/values`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<{ decision: string; message: string }>(r)),
  verification: (id: string) => fetch(`${base(id)}/verification`).then((r) => j<{ meta: Meta | null; printed: { item: string; reference: number; platform: number | null; unit: string; source: string; note: string | null; governing?: string; piles?: { pile: string; platform: number | null }[] }[];
    midas_runs: { run: string; title: string; text: string }[] }>(r)),
  revisions: (id: string) => fetch(`${base(id)}/revisions`).then((r) => j<{ number: number; created: string | null; author: string | null; note: string | null; current: boolean }[]>(r)),
  revDiff: (id: string, a: number, b: number) => fetch(`${base(id)}/revisions/${a}/${b}`).then((r) => j<{ rows: { path: string; from: unknown; from_tag: string | null; from_status: string | null;
    to: unknown; to_tag: string | null; to_status: string | null; proposals_added: number; decision: string | null }[] }>(r)),
  saveBatch: (id: string, body: { by: string; reason: string; items: { path: string; value: unknown }[]; new_rows: { table: string; cells: Record<string, unknown> }[] }) =>
    fetch(`${base(id)}/values/batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<{ decision: string; changed: number; message: string }>(r)),
  settings: () => fetch("/api/settings").then((r) => j<Settings>(r)),
  saveSettings: (body: { api_key?: string; model?: string }) => fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => j<Settings>(r)),
  extract: (id: string, pages?: string) => fetch(`${base(id)}/extract`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pages ? { pages } : {}) }).then((r) => j<{ id: string }>(r)),
  extractLatest: (id: string) => fetch(`${base(id)}/extract/latest`).then((r) => j<Extraction | null>(r)),
  fileUrl: (id: string, name: string): string | null => (STATIC ? null : `${base(id)}/files/${encodeURIComponent(name)}`),
  descUrl: (id: string): string | null => (STATIC ? null : `${base(id)}/description.json`),
};
