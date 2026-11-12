import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword, isOwnerOrAdminRole } from "@/lib/auth";
import { canInviteTeamMember, getOrganizationEntitlements } from "@/lib/entitlements";
import { createUser, listUsersForOrg } from "@/lib/repo";

const addMemberSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z
    .enum(["owner", "business_admin", "branch_manager", "staff"])
    .default("staff"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [ctx, members] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    listUsersForOrg(user.organizationId),
  ]);
  return NextResponse.json(
    {
      ok: true,
      members,
      teamLimit: ctx?.limits.maxTeamMembers ?? 1,
      planLabel: ctx?.plan.name ?? "Starter",
      isUsable: ctx?.isUsable ?? false,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerOrAdminRole(actor.role)) {
    return NextResponse.json(
      { error: "Only workspace owners or business admins can add team members" },
      { status: 403 }
    );
  }

  const ctx = await getOrganizationEntitlements(actor.organizationId);
  if (!ctx) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  if (actor.role !== "super_admin" && !ctx.isUsable) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  if (actor.role !== "super_admin") {
    const inviteCheck = await canInviteTeamMember(actor.organizationId, "org");
    if (!inviteCheck.allowed) {
      return NextResponse.json(
        {
          error:
            inviteCheck.reason ||
            `Team member limit reached (${inviteCheck.used}/${inviteCheck.limit} on ${inviteCheck.planName}). Upgrade your plan to add more team members.`,
        },
        { status: 403 }
      );
    }
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = addMemberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid name, email, and 8+ character password." },
      { status: 400 }
    );
  }

  const { hash, salt } = await hashPassword(parsed.data.password);
  try {
    const created = await createUser({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      role: parsed.data.role,
      organizationId: actor.organizationId,
    });
    return NextResponse.json(
      {
        ok: true,
        member: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Could not add team member" },
      { status: 409 }
    );
  }
}
