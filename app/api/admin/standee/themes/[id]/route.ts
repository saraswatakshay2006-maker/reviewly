import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import {
  adminSetDefaultStandeeTheme,
  adminToggleStandeeTheme,
} from "@/lib/repo";
import { writeDB } from "@/lib/db";

const patchSchema = z.object({
  action: z.enum(["toggle_enabled", "set_default"]),
  isEnabled: z.boolean().optional(),
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
    return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "toggle_enabled") {
      const theme = await adminToggleStandeeTheme(
        id,
        parsed.data.isEnabled ?? true
      );
      return NextResponse.json({ ok: true, theme });
    } else if (parsed.data.action === "set_default") {
      const theme = await adminSetDefaultStandeeTheme(id);
      return NextResponse.json({ ok: true, theme });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Action failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await writeDB((db) => {
      if (!db.standeeThemes) return { ok: false, error: "No themes found" };
      const theme = db.standeeThemes.find((t) => t.id === id);
      if (!theme) throw new Error("Theme not found");
      if (theme.isPreset) {
        throw new Error("Official preset themes cannot be deleted.");
      }
      db.standeeThemes = db.standeeThemes.filter((t) => t.id !== id);
      return { ok: true, deletedId: id };
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Delete failed" },
      { status: 400 }
    );
  }
}
