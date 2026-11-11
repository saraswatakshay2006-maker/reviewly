import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addEvent, addFeedback, getSessionById } from "@/lib/repo";

const bodySchema = z.object({
  sessionId: z.string(),
  businessId: z.string(),
  message: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getSessionById(parsed.data.sessionId);
  if (!session || session.businessId !== parsed.data.businessId) {
    return NextResponse.json({ error: "Unknown session" }, { status: 400 });
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

  return NextResponse.json({ ok: true, feedback }, { status: 201 });
}
