import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import {
  deleteCouponAdmin,
  listCouponsAdmin,
  upsertCouponAdmin,
} from "@/lib/billing";

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(32),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().int().min(1).max(1_000_000),
  eligiblePlans: z.array(z.string()).default([]),
  maxRedemptions: z.number().int().min(1).max(1_000_000).nullable().default(null),
  expiresAt: z.string().max(40).nullable().default(null),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const coupons = await listCouponsAdmin();
  return NextResponse.json(
    { ok: true, coupons },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = couponSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coupon details" }, { status: 400 });
  }

  try {
    const coupon = await upsertCouponAdmin(parsed.data);
    return NextResponse.json(
      { ok: true, coupon },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
  }
  try {
    await deleteCouponAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

