import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rateLimit";
import { addEvent, addFeedback, getSessionById } from "@/lib/repo";

const bodySchema = z.object({
  sessionId: z.string(),
  businessId: z.string(),
  message: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `feedback:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds), "Cache-Control": "no-store" },
      }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await getSessionById(parsed.data.sessionId);
  if (!session || session.businessId !== parsed.data.businessId) {
    return NextResponse.json({ error: "Unknown session" }, { status: 400 });
  }

  const access = await canAccessPublicReviewPage(session.businessId);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error:
          "Review page is unavailable because the subscription has expired or is paused.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (access.context && !access.context.featureFlags.privateFeedback) {
    return NextResponse.json(
      { error: "Customer feedback collection is disabled on this workspace's plan." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const feedback = await addFeedback({
    sessionId: session.id,
    businessId: session.businessId,
    organizationId: session.organizationId,
    message: parsed.data.message,
    rating: parsed.data.rating ?? null,
    complaint: false,
  });

  await addEvent({
    sessionId: session.id,
    businessId: session.businessId,
    organizationId: session.organizationId,
    type: "feedback_submit",
    rating: parsed.data.rating ?? null,
  });

  return NextResponse.json(
    { ok: true, feedback },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
