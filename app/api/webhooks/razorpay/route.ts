import { NextRequest, NextResponse } from "next/server";
import { processRazorpayWebhookEvent } from "@/lib/billing";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const valid = await verifyRazorpayWebhookSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = String(payload.event || "unknown");
  const headerEventId = req.headers.get("x-razorpay-event-id");
  const fallbackEntityId =
    ((payload.payload as Record<string, { entity?: { id?: string } }> | undefined)
      ?.payment?.entity?.id ||
      (payload.payload as Record<string, { entity?: { id?: string } }> | undefined)
        ?.order?.entity?.id ||
      "") +
    ":" +
    eventType;
  const externalEventId =
    headerEventId?.trim() || String(payload.event_id || fallbackEntityId);

  if (!externalEventId) {
    return NextResponse.json({ error: "Missing event identifier" }, { status: 400 });
  }

  const result = await processRazorpayWebhookEvent({
    externalEventId,
    eventType,
    payload,
  });

  return NextResponse.json(
    { ok: true, ...result },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

