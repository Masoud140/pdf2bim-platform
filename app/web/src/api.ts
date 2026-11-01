// Typed calls to the Python API (app/server.py).
export interface Project { id: string; name: string | null; origin: string; revision: number | null; tags: Record<string, number>; drawings: number;
  last_run: { id: string; state: string; started: string; finished: string | null } | null }
export interface Step { key: string; title: string; state: string; seconds?: number }
export interface Run { id: string; state: string; allow_proposed: boolean; started: string; finished: string | null; engine_commit: string | null;
  description: string; steps: Step[]; log: string; files: string[] }
export interface ValueRow { path: string; value: unknown; unit: string | null; tag: string; status: string; sheet: string | null; view: string | null;
  note: string | null; derivation: string | null; decision: string | null; proposed: boolean; original_tag: string | null; replace_with: string | null }
export interface Meta { source: "run" | "repository"; run?: string; file?: string; allow_proposed?: boolean; engine_commit?: string | null }
export interface Result<T> { meta: Meta | null; data: T | null }
export interface Page { page: number; documents: string[]; w: number; h: number }
export interface Drawings { files: { file: string; pages: Page[] }[]; documents: { id: string; number: string; revision: string; title?: string }[] }

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).replace(/<[^>]+>/g, " ").trim().slice(0, 300)}`);
  return r.json() as Promise<T>;
}
const base = (id: string) => `/api/projects/${encodeURIComponent(id)}`;

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
  fileUrl: (id: string, name: string) => `${base(id)}/files/${encodeURIComponent(name)}`,
  descUrl: (id: string) => `${base(id)}/description.json`,
};
