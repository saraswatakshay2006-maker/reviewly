import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rateLimit";
import { addEvent, getSessionById } from "@/lib/repo";

const bodySchema = z.object({
  sessionId: z.string(),
  businessId: z.string(),
  type: z.enum(["rating_select", "google_click", "feedback_submit"]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `events:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Cache-Control": "no-store" } }
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

  const { sessionId, businessId, type, rating } = parsed.data;
  const session = await getSessionById(sessionId);
  if (!session || session.businessId !== businessId) {
    return NextResponse.json({ error: "Unknown session" }, { status: 400 });
  }

  const access = await canAccessPublicReviewPage(businessId);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error:
          "Review page is unavailable because the subscription has expired or is paused.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const ev = await addEvent({
    sessionId,
    businessId,
    organizationId: session.organizationId,
    type,
    rating: rating ?? null,
  });

  return NextResponse.json(
    { ok: true, event: ev },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
