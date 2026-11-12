interface BucketEntry {
  count: number;
  resetAt: number;
}

const g = globalThis as unknown as {
  __reviewlyRateLimit?: Map<string, BucketEntry>;
};

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  if (!g.__reviewlyRateLimit) {
    g.__reviewlyRateLimit = new Map();
  }
  const store = g.__reviewlyRateLimit;
  const now = Date.now();
  const existing = store.get(params.key);

  if (!existing || now >= existing.resetAt) {
    store.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
    };
  }

  if (existing.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

