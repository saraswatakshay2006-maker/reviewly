import { getEnv } from "./cloudflare";

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqualHex(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x.length === 0 || x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) {
    diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  }
  return diff === 0;
}

export async function hmacSha256Hex(
  secret: string,
  payload: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(new Uint8Array(sig));
}

export function getRazorpayPublicKeyId(): string | null {
  return (
    getEnv("RAZORPAY_KEY_ID")?.trim() ||
    getEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID")?.trim() ||
    null
  );
}

export function getRazorpaySecret(): string | null {
  return getEnv("RAZORPAY_KEY_SECRET")?.trim() || null;
}

export function getRazorpayWebhookSecret(): string | null {
  return getEnv("RAZORPAY_WEBHOOK_SECRET")?.trim() || null;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayPublicKeyId() && getRazorpaySecret());
}

export async function createRazorpayOrder(params: {
  amountInr: number;
  currency?: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}> {
  const keyId = getRazorpayPublicKeyId();
  const keySecret = getRazorpaySecret();
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  const amountPaise = Math.round(params.amountInr * 100);
  if (amountPaise < 100) {
    throw new Error("Razorpay order amount must be at least ₹1.");
  }

  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: params.currency || "INR",
      receipt: params.receipt.slice(0, 40),
      notes: params.notes,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    status?: string;
    error?: { description?: string; reason?: string };
  };

  if (!res.ok || !data.id) {
    throw new Error(
      data?.error?.description ||
        data?.error?.reason ||
        `Razorpay order creation failed (HTTP ${res.status})`
    );
  }

  return {
    id: data.id,
    amount: data.amount ?? amountPaise,
    currency: data.currency ?? "INR",
    receipt: data.receipt ?? params.receipt,
    status: data.status ?? "created",
  };
}

export async function createRazorpaySubscription(params: {
  gatewayPlanId: string;
  totalCount?: number;
  notes: Record<string, string>;
}): Promise<{ id: string; status: string }> {
  const keyId = getRazorpayPublicKeyId();
  const keySecret = getRazorpaySecret();
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: params.gatewayPlanId,
      total_count: params.totalCount ?? 12,
      customer_notify: 1,
      notes: params.notes,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    error?: { description?: string };
  };

  if (!res.ok || !data.id) {
    throw new Error(
      data?.error?.description ||
        `Razorpay subscription creation failed (HTTP ${res.status})`
    );
  }

  return { id: data.id, status: data.status ?? "created" };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  method?: string;
  order_id?: string;
} | null> {
  const keyId = getRazorpayPublicKeyId();
  const keySecret = getRazorpaySecret();
  if (!keyId || !keySecret) return null;

  try {
    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      id: string;
      status: string;
      amount: number;
      method?: string;
      order_id?: string;
    };
  } catch {
    return null;
  }
}

export async function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const secret = getRazorpaySecret();
  if (!secret || !params.orderId || !params.paymentId || !params.signature) {
    return false;
  }
  const expected = await hmacSha256Hex(
    secret,
    `${params.orderId}|${params.paymentId}`
  );
  return constantTimeEqualHex(expected, params.signature);
}

export async function verifyRazorpaySubscriptionSignature(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const secret = getRazorpaySecret();
  if (!secret || !params.subscriptionId || !params.paymentId || !params.signature) {
    return false;
  }
  const expected = await hmacSha256Hex(
    secret,
    `${params.paymentId}|${params.subscriptionId}`
  );
  return constantTimeEqualHex(expected, params.signature);
}

export async function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const webhookSecret = getRazorpayWebhookSecret();
  if (!webhookSecret || !signature) return false;
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  return constantTimeEqualHex(expected, signature);
}

