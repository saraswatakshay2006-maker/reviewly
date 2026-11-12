import { getCloudflareBindings } from "./cloudflare";
import { DEFAULT_PLATFORM_SETTINGS, migrateDBInPlace } from "./planSeed";
import type { DB } from "./types";

function emptyDB(): DB {
  return migrateDBInPlace({
    users: [],
    organizations: [],
    businesses: [],
    members: [],
    cards: [],
    sessions: [],
    events: [],
    feedback: [],
    plans: [],
    planFeatures: [],
    subscriptions: [],
    payments: [],
    paymentWebhookEvents: [],
    subscriptionAuditLogs: [],
    coupons: [],
    platformSettings: { ...DEFAULT_PLATFORM_SETTINGS },
    seq: {},
  });
}

const g = globalThis as unknown as {
  __reviewlyCache?: DB | null;
  __reviewlyFileMtime?: number | null;
  __reviewlyFileSize?: number | null;
  __reviewlyWriteQueue?: Promise<void>;
  __reviewlyD1Ready?: boolean;
};

interface NodeFsPromises {
  readFile(path: string, encoding: "utf8"): Promise<string>;
  mkdir(path: string, opts: { recursive: boolean }): Promise<void>;
  writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  stat(path: string): Promise<{ mtimeMs: number; size?: number }>;
}

interface NodePath {
  join(...parts: string[]): string;
}

function getNodeFs(): { fs: NodeFsPromises; path: NodePath } | null {
  if (typeof process === "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return null;
  }
  try {
    const proc = process as unknown as {
      getBuiltinModule?: (name: string) => unknown;
      versions?: { node?: string };
    };
    if (!proc.versions?.node || typeof proc.getBuiltinModule !== "function") {
      return null;
    }
    const fsMod = proc.getBuiltinModule("fs") as { promises?: NodeFsPromises } | undefined;
    const pathMod = proc.getBuiltinModule("path") as NodePath | undefined;
    if (fsMod?.promises && pathMod) {
      return { fs: fsMod.promises, path: pathMod };
    }
  } catch {
    // Non-Node environment
  }
  return null;
}

export type StorageMode = "d1" | "kv" | "local" | "memory";

export function getStorageMode(): StorageMode {
  const cf = getCloudflareBindings();
  if (cf?.DB) return "d1";
  if (cf?.REVIEWLY_KV) return "kv";
  if (getNodeFs()) return "local";
  return "memory";
}

async function loadFromD1(): Promise<DB | null> {
  const cf = getCloudflareBindings();
  if (!cf?.DB) return null;
  if (!g.__reviewlyD1Ready) {
    await cf.DB.prepare(
      "CREATE TABLE IF NOT EXISTS reviewly_store (id TEXT PRIMARY KEY, payload TEXT NOT NULL)"
    ).run();
    g.__reviewlyD1Ready = true;
  }
  const row = await cf.DB.prepare(
    "SELECT payload FROM reviewly_store WHERE id = ?"
  )
    .bind("main")
    .first<{ payload: string }>();
  if (!row?.payload) {
    const fresh = emptyDB();
    await cf.DB.prepare(
      "INSERT OR IGNORE INTO reviewly_store (id, payload) VALUES (?, ?)"
    )
      .bind("main", JSON.stringify(fresh))
      .run();
    const afterSeed = await cf.DB.prepare(
      "SELECT payload FROM reviewly_store WHERE id = ?"
    )
      .bind("main")
      .first<{ payload: string }>();
    return afterSeed?.payload ? (JSON.parse(afterSeed.payload) as DB) : fresh;
  }
  return JSON.parse(row.payload) as DB;
}

async function saveToD1(db: DB): Promise<boolean> {
  const cf = getCloudflareBindings();
  if (!cf?.DB) return false;
  await cf.DB.prepare(
    "INSERT OR REPLACE INTO reviewly_store (id, payload) VALUES (?, ?)"
  )
    .bind("main", JSON.stringify(db))
    .run();
  return true;
}

async function loadFromKV(): Promise<DB | null> {
  const cf = getCloudflareBindings();
  if (!cf?.REVIEWLY_KV) return null;
  const raw = (await cf.REVIEWLY_KV.get("reviewly_db", "text")) as string | null;
  if (raw) return JSON.parse(raw) as DB;
  const fresh = emptyDB();
  await cf.REVIEWLY_KV.put("reviewly_db", JSON.stringify(fresh));
  return fresh;
}

async function saveToKV(db: DB): Promise<boolean> {
  const cf = getCloudflareBindings();
  if (!cf?.REVIEWLY_KV) return false;
  await cf.REVIEWLY_KV.put("reviewly_db", JSON.stringify(db));
  return true;
}

async function load(): Promise<DB> {
  // 1. Cloudflare D1 (strongly consistent across edge isolates)
  const d1 = await loadFromD1();
  if (d1) return migrateDBInPlace(d1);

  // 2. Cloudflare KV
  const kv = await loadFromKV();
  if (kv) return migrateDBInPlace(kv);

  // 3. Local Node.js JSON store (data/db.json)
  const node = getNodeFs();
  if (node) {
    const dbPath = node.path.join(process.cwd(), "data", "db.json");
    try {
      const st = await node.fs.stat(dbPath);
      const size = typeof st.size === "number" ? st.size : null;
      if (
        g.__reviewlyCache &&
        g.__reviewlyFileMtime === st.mtimeMs &&
        g.__reviewlyFileSize === size
      ) {
        return migrateDBInPlace(g.__reviewlyCache);
      }
      const raw = await node.fs.readFile(dbPath, "utf8");
      g.__reviewlyCache = migrateDBInPlace(JSON.parse(raw) as DB);
      g.__reviewlyFileMtime = st.mtimeMs;
      g.__reviewlyFileSize = size;
      return g.__reviewlyCache;
    } catch {
      g.__reviewlyCache = emptyDB();
      await persist(g.__reviewlyCache);
      return g.__reviewlyCache;
    }
  }

  // 4. Ephemeral edge-memory fallback when deployed on Cloudflare without D1/KV bound
  g.__reviewlyCache = emptyDB();
  return g.__reviewlyCache;
}

async function persist(db: DB): Promise<void> {
  g.__reviewlyCache = db;
  if (await saveToD1(db)) return;
  if (await saveToKV(db)) return;

  const node = getNodeFs();
  if (node) {
    const dataDir = node.path.join(process.cwd(), "data");
    const dbPath = node.path.join(dataDir, "db.json");
    await node.fs.mkdir(dataDir, { recursive: true });
    const tmp = `${dbPath}.tmp`;
    await node.fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await node.fs.rename(tmp, dbPath);
    try {
      const st = await node.fs.stat(dbPath);
      g.__reviewlyFileMtime = st.mtimeMs;
      g.__reviewlyFileSize = typeof st.size === "number" ? st.size : null;
    } catch {
      g.__reviewlyFileMtime = null;
      g.__reviewlyFileSize = null;
    }
  }
}

/** Run a read-only transaction. */
export async function readDB<T>(fn: (db: DB) => T): Promise<T> {
  const db = await load();
  return fn(db);
}

/** Run a write transaction atomically (serialized). */
export function writeDB<T>(fn: (db: DB) => T): Promise<T> {
  const run = async (): Promise<T> => {
    const db = await load();
    const result = fn(db);
    await persist(db);
    return result;
  };
  const queue = g.__reviewlyWriteQueue ?? Promise.resolve();
  const p = queue.then(run, run);
  g.__reviewlyWriteQueue = p.then(
    () => undefined,
    () => undefined
  );
  return p;
}

export function uid(): string {
  return crypto.randomUUID();
}

export async function resetDB(): Promise<void> {
  const fresh = emptyDB();
  await persist(fresh);
}
