import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import {
  deleteOrganizationCascade,
  updateOrganizationSubscription,
} from "@/lib/repo";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.string().min(1).max(40).optional(),
  status: z
    .enum(["trialing", "active", "past_due", "expired", "suspended", "cancelled"])
    .optional(),
  monthlyPriceInr: z.number().min(0).max(10_000_000).optional(),
  cardLimit: z.number().int().min(-1).max(100_000).optional(),
  locationLimit: z.number().int().min(-1).max(10_000).optional(),
  teamLimit: z.number().int().min(-1).max(50_000).optional(),
  renewalDate: z.string().max(40).nullable().optional(),
  notes: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const org = await updateOrganizationSubscription(id, parsed.data);
    return NextResponse.json({ ok: true, organization: org });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const out = await deleteOrganizationCascade(id, admin.id);
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
