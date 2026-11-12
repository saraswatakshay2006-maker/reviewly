import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import { calculateCheckoutQuote } from "@/lib/billing";

const quoteSchema = z.object({
  planId: z.string().min(1),
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
  couponCode: z.string().max(40).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerOrAdminRole(user.role)) {
    return NextResponse.json(
      { error: "Only workspace owners or admins can preview billing quotes." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
  }

  try {
    const quote = await calculateCheckoutQuote({
      organizationId: user.organizationId,
      planId: parsed.data.planId,
      billingInterval: parsed.data.billingInterval,
      couponCode: parsed.data.couponCode ?? null,
    });
    return NextResponse.json(
      { ok: true, quote },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
}

