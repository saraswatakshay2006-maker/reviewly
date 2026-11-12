import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { applyAdminSubscriptionAction } from "@/lib/billing";
import { listBusinessesForOrg } from "@/lib/repo";

const actionSchema = z.object({
  organizationId: z.string().min(1),
  action: z.enum([
    "activate_manual",
    "extend",
    "change_plan",
    "suspend",
    "reactivate",
    "grant_trial",
    "set_custom_expiry",
    "assign_enterprise",
    "update_entitlements",
    "cancel",
  ]),
  reason: z.string().max(500).default(""),
  planId: z.string().max(40).optional(),
  billingInterval: z.enum(["monthly", "annual", "custom"]).optional(),
  amountInr: z.number().min(0).max(10_000_000).optional(),
  extendDays: z.number().int().min(1).max(3650).optional(),
  customExpiryIso: z.string().max(60).nullable().optional(),
  cancelImmediately: z.boolean().optional(),
  customOverrides: z
    .object({
      maxLocations: z.number().int().min(-1).max(10_000).optional(),
      maxTeamMembers: z.number().int().min(-1).max(50_000).optional(),
      maxCards: z.number().int().min(-1).max(100_000).optional(),
      supportTier: z.string().max(60).optional(),
      features: z.record(z.boolean()).optional(),
    })
    .nullable()
    .optional(),
});

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

  const parsed = actionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription action payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await applyAdminSubscriptionAction({
      ...parsed.data,
      adminId: admin.id,
      adminEmail: admin.email,
    });
    const businesses = await listBusinessesForOrg(parsed.data.organizationId);
    revalidatePath("/admin");
    revalidatePath("/app");
    revalidatePath("/app/billing");
    revalidatePath("/app/cards");
    revalidatePath("/app/feedback");
    revalidatePath("/app/team");
    revalidatePath("/app/settings");
    for (const biz of businesses) {
      revalidatePath(`/r/${biz.publicSlug}`);
    }
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
