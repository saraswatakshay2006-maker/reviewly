import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteOrgMember,
  getOrganizationById,
  updateOrgMemberRole,
} from "@/lib/repo";
import { isSubscriptionActive, resolveSubscription } from "@/lib/subscriptions";

const patchSchema = z.object({
  role: z.enum(["owner", "branch_manager", "staff"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actor.role !== "owner" && actor.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only workspace owners can manage team roles" },
      { status: 403 }
    );
  }

  const org = await getOrganizationById(actor.organizationId);
  if (org && actor.role !== "super_admin" && !isSubscriptionActive(resolveSubscription(org))) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const member = await updateOrgMemberRole(
      actor.organizationId,
      id,
      actor.id,
      parsed.data.role
    );
    return NextResponse.json({ ok: true, member });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actor.role !== "owner" && actor.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only workspace owners can remove team members" },
      { status: 403 }
    );
  }

  const org = await getOrganizationById(actor.organizationId);
  if (org && actor.role !== "super_admin" && !isSubscriptionActive(resolveSubscription(org))) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    await deleteOrgMember(actor.organizationId, id, actor.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
