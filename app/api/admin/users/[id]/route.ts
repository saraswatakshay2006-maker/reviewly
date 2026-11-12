import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, requireSuperAdmin } from "@/lib/auth";
import { deleteUserAdmin, updateUserAdmin } from "@/lib/repo";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["owner", "branch_manager", "staff", "super_admin"]).optional(),
  newPassword: z.string().min(8).max(128).optional(),
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
    let passwordPatch: { passwordHash?: string; salt?: string } = {};
    if (parsed.data.newPassword) {
      const { hash, salt } = await hashPassword(parsed.data.newPassword);
      passwordPatch = { passwordHash: hash, salt };
    }
    const user = await updateUserAdmin(id, {
      name: parsed.data.name,
      role: parsed.data.role,
      ...passwordPatch,
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not found") ? 404 : 400 }
    );
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
    const out = await deleteUserAdmin(id, admin.id);
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not found") ? 404 : 400 }
    );
  }
}
