// Public base URL of the R2 bucket holding the archive — a custom domain bound to
// the oxrinz-archive bucket. Every collection lives under its own prefix inside it.
const R2_BASE = 'https://archive.oxri.nz';

// In dev, scripts/serve-local.sh mirrors that same key layout off local disk, so the
// browser works without waiting on an upload.
const LOCAL_BASE = 'http://localhost:8792';

export const ARCHIVE_BASE = import.meta.env.DEV ? LOCAL_BASE : R2_BASE;

export type Entry = [name: string, w: number, h: number, size: number];

export interface Collection {
  id: string;
  title: string;
  note: string | null;
  generated: string;
  count: number;
  bytes: number;
  cover: string | null;
}

export interface Manifest extends Collection {
  /** Relative directory path -> its images. Root directory is the empty string. */
  dirs: Record<string, Entry[]>;
}

export interface Item {
  name: string;
  dir: string;
  path: string;
  w: number;
  h: number;
  size: number;
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const fullUrl = (collection: string, path: string) =>
  `${ARCHIVE_BASE}/${encodeURIComponent(collection)}/full/${encodePath(path)}`;

export const thumbUrl = (collection: string, path: string) =>
  `${ARCHIVE_BASE}/${encodeURIComponent(collection)}/thumb/${encodePath(path)}.webp`;

export async function loadIndex(fetcher: typeof fetch = fetch): Promise<Collection[]> {
  const response = await fetcher('/archive/index.json');
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export async function loadManifest(id: string, fetcher: typeof fetch = fetch): Promise<Manifest> {
  const response = await fetcher(`/archive/${encodeURIComponent(id)}.json`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

export function itemsIn(manifest: Manifest, dir: string): Item[] {
  return (manifest.dirs[dir] ?? []).map(([name, w, h, size]) => ({
    name,
    dir,
    path: dir ? `${dir}/${name}` : name,
    w,
    h,
    size
  }));
}

export function allItems(manifest: Manifest): Item[] {
  return Object.keys(manifest.dirs).flatMap((dir) => itemsIn(manifest, dir));
}

/** Immediate subdirectories of `dir`, with a recursive image count for each. */
export function subdirs(manifest: Manifest, dir: string): { name: string; path: string; count: number }[] {
  const prefix = dir ? `${dir}/` : '';
  const children = new Map<string, number>();

  for (const key of Object.keys(manifest.dirs)) {
    if (key === dir || !key.startsWith(prefix)) continue;
    const name = key.slice(prefix.length).split('/')[0];
    if (!name || children.has(name)) continue;

    const childPrefix = `${prefix}${name}`;
    let count = 0;
    for (const [other, entries] of Object.entries(manifest.dirs)) {
      if (other === childPrefix || other.startsWith(`${childPrefix}/`)) count += entries.length;
    }
    children.set(name, count);
  }

  return [...children.entries()]
    .map(([name, count]) => ({ name, path: `${prefix}${name}`, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export function crumbs(dir: string): { name: string; path: string }[] {
  if (!dir) return [];
  const parts = dir.split('/');
  return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
