import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import {
  adminListAllStandeeThemes,
  adminUpsertStandeeTheme,
} from "@/lib/repo";

const themeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be valid 6-digit hex color"),
  }),
  isEnabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const themes = await adminListAllStandeeThemes();
  return NextResponse.json({ ok: true, themes }, { headers: { "Cache-Control": "no-store" } });
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

  const parsed = themeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid theme payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await adminUpsertStandeeTheme(parsed.data);
    return NextResponse.json({ ok: true, theme: updated });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Upsert failed" },
      { status: 500 }
    );
  }
}

