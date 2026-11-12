import { cookies } from "next/headers";
import { getEnv } from "./cloudflare";
import { getUserById } from "./repo";
import type { User } from "./types";

const SESSION_COOKIE = "akshay_session";
const DEFAULT_ORG_CODE_SHA256 =
  "c8a65abb6b73156247fbfd79be140fefe1c7b83aa9a727f95f248d890a7ce24d";
const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(new Uint8Array(digest));
}

/**
 * Server-only verification of the private organisation signup code.
 * The raw code is never bundled into client assets or logged.
 */
export async function verifyOrgSignupCode(candidate: string): Promise<boolean> {
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  const candidateHash = await sha256Hex(trimmed);
  const envOverride = getEnv("ORG_SIGNUP_CODE")?.trim();
  const expectedHash = envOverride
    ? await sha256Hex(envOverride)
    : DEFAULT_ORG_CODE_SHA256;
  return constantTimeEqualHex(candidateHash, expectedHash);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getEnv("SESSION_SECRET") || "akshay-dev-secret-change-me";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function pbkdf2Hex(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(saltHex),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return `pbkdf2:${toHex(new Uint8Array(derived))}`;
}

export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = toHex(saltBytes);
  const hash = await pbkdf2Hex(password, salt);
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (expectedHash.startsWith("pbkdf2:")) {
    const candidate = await pbkdf2Hex(password, salt);
    return constantTimeEqualHex(candidate, expectedHash);
  }

  // Legacy Node scrypt hashes (from existing local data/db.json)
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME !== "edge") {
    try {
      const nodeCrypto = getNodeModule<{
        scryptSync: (p: string, s: string, k: number) => Uint8Array;
      }>("crypto");
      if (nodeCrypto) {
        const hashHex = toHex(nodeCrypto.scryptSync(password, salt, 64));
        return constantTimeEqualHex(hashHex, expectedHash);
      }
    } catch {
      return false;
    }
  }
  return false;
}

export async function signSession(userId: string): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toHex(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const key = await getHmacKey();
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  const expectedHex = toHex(new Uint8Array(expectedSig));
  if (!constantTimeEqualHex(expectedHex, parts[2])) return null;

  const userId = parts[0];
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > 30 * 24 * 60 * 60 * 1000) return null;
  return userId;
}

/** Server-side: resolve the current user from the signed session cookie. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return getUserById(userId);
}

/** Server-side: resolve current user only when they hold super_admin role. */
export async function requireSuperAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") return null;
  return user;
}

export function isOwnerOrAdminRole(role: string): boolean {
  return role === "owner" || role === "business_admin" || role === "super_admin";
}

export function canManageOperationsRole(role: string): boolean {
  return (
    role === "owner" ||
    role === "business_admin" ||
    role === "branch_manager" ||
    role === "super_admin"
  );
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

function getNodeModule<T>(id: string): T | null {
  try {
    const proc = process as unknown as {
      getBuiltinModule?: (name: string) => T | undefined;
    };
    if (typeof proc.getBuiltinModule === "function") {
      return proc.getBuiltinModule(id) ?? null;
    }
  } catch {
    // Edge runtime
  }
  return null;
}
