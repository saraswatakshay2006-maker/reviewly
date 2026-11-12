import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { listPlansWithFeatures, upsertPlanAdmin } from "@/lib/billing";

const planSchema = z.object({
  id: z.string().max(40).optional(),
  slug: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  badge: z.string().max(40).optional(),
  description: z.string().max(300),
  monthlyPriceInr: z.number().int().min(0).max(10_000_000),
  annualPriceInr: z.number().int().min(0).max(100_000_000).nullable().optional(),
  customPrice: z.boolean().optional(),
  billingIntervalOptions: z.array(z.enum(["monthly", "annual", "custom"])).optional(),
  maxLocations: z.number().int().min(-1).max(10_000),
  maxTeamMembers: z.number().int().min(-1).max(50_000),
  maxCards: z.number().int().min(-1).max(100_000),
  supportTier: z.string().min(1).max(60),
  trialDays: z.number().int().min(0).max(365).optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  highlights: z.array(z.string().max(160)).max(25).optional(),
  razorpayMonthlyPlanId: z.string().max(80).nullable().optional(),
  razorpayAnnualPlanId: z.string().max(80).nullable().optional(),
  features: z.record(z.boolean()).optional(),
});

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const plans = await listPlansWithFeatures(true);
  return NextResponse.json(
    { ok: true, plans },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = planSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid plan payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const out = await upsertPlanAdmin(parsed.data);
    revalidatePath("/");
    revalidatePath("/app/billing");
    return NextResponse.json(
      { ok: true, ...out },
      { status: out.isNew ? 201 : 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

