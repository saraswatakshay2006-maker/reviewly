import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addEvent, getSessionById } from "@/lib/repo";

const bodySchema = z.object({
  sessionId: z.string(),
  businessId: z.string(),
  type: z.enum(["rating_select", "google_click", "feedback_submit"]),
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

  const { sessionId, businessId, type, rating } = parsed.data;
  const session = await getSessionById(sessionId);
  if (!session || session.businessId !== businessId) {
    return NextResponse.json({ error: "Unknown session" }, { status: 400 });
  }

  const ev = await addEvent({
    sessionId,
    businessId,
    organizationId: session.organizationId,
    type,
    rating: rating ?? null,
  });

  return NextResponse.json({ ok: true, event: ev }, { status: 201 });
}
