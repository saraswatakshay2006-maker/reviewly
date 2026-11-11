export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

export interface KVNamespaceLike {
  get(key: string, type?: "text" | "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

export interface CloudflareBindings {
  DB?: D1DatabaseLike;
  REVIEWLY_KV?: KVNamespaceLike;
  SESSION_SECRET?: string;
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  [key: string]: unknown;
}

/**
 * Reads Cloudflare Pages / Workers runtime bindings when running on Cloudflare,
 * returning null cleanly when running locally on Node.js.
 */
export function getCloudflareBindings(): CloudflareBindings | null {
  try {
    const sym = Symbol.for("__cloudflare-request-context__");
    const ctx = (globalThis as Record<symbol, unknown>)[sym] as
      | { env?: CloudflareBindings }
      | undefined;
    return ctx?.env ?? null;
  } catch {
    return null;
  }
}

export function getEnv(name: string): string | undefined {
  const cf = getCloudflareBindings();
  const cfVal = cf?.[name];
  if (typeof cfVal === "string" && cfVal.length > 0) return cfVal;
  if (typeof process !== "undefined" && process.env) {
    const pVal = process.env[name];
    if (typeof pVal === "string" && pVal.length > 0) return pVal;
  }
  return undefined;
}

