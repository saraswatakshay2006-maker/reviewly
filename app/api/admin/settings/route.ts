import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import {
  getPlatformSettings,
  updatePlatformSettingsAdmin,
} from "@/lib/billing";

const settingsSchema = z.object({
  gracePeriodDays: z.number().int().min(0).max(90).optional(),
  reminderDays: z.array(z.number().int().min(1).max(60)).max(10).optional(),
  annualBillingEnabled: z.boolean().optional(),
  taxRatePercent: z.number().min(0).max(50).optional(),
});

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await getPlatformSettings();
  return NextResponse.json(
    { ok: true, settings },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid platform settings" }, { status: 400 });
  }

  const settings = await updatePlatformSettingsAdmin(parsed.data);
  revalidatePath("/app/billing");
  revalidatePath("/r/[slug]");
  return NextResponse.json(
    { ok: true, settings },
    { headers: { "Cache-Control": "no-store" } }
  );
}

