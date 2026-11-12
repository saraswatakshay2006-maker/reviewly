import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import {
  createUser,
  getOrganizationById,
  listUsersForOrg,
} from "@/lib/repo";
import {
  getPlanEntitlements,
  isSubscriptionActive,
  resolveSubscription,
} from "@/lib/subscriptions";

const addMemberSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["owner", "branch_manager", "staff"]).default("staff"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [org, members] = await Promise.all([
    getOrganizationById(user.organizationId),
    listUsersForOrg(user.organizationId),
  ]);
  const sub = org ? resolveSubscription(org) : null;
  const entitlements = sub ? getPlanEntitlements(sub) : null;
  return NextResponse.json({
    ok: true,
    members,
    teamLimit: entitlements?.teamLimit ?? 1,
    planLabel: entitlements?.label ?? "Starter",
  });
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actor.role !== "owner" && actor.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only workspace owners can add team members" },
      { status: 403 }
    );
  }

  const org = await getOrganizationById(actor.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const sub = resolveSubscription(org);
  if (actor.role !== "super_admin" && !isSubscriptionActive(sub)) {
    return NextResponse.json(
      { error: "Workspace subscription is expired or paused." },
      { status: 403 }
    );
  }

  const entitlements = getPlanEntitlements(sub);
  const existing = await listUsersForOrg(actor.organizationId);
  if (existing.length >= entitlements.teamLimit) {
    return NextResponse.json(
      {
        error: `Team member limit reached (${existing.length}/${entitlements.teamLimit} on ${entitlements.label}). Upgrade your plan to add more team members.`,
      },
      { status: 403 }
    );
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
