import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import { cancelOrganizationSubscription } from "@/lib/billing";
import { listBusinessesForOrg } from "@/lib/repo";

const cancelSchema = z.object({
  immediate: z.boolean().default(false),
  reason: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerOrAdminRole(user.role)) {
    return NextResponse.json(
      { error: "Only workspace owners or admins can cancel subscriptions." },
      { status: 403 }
    );
  }

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    // default body allowed
  }

  const parsed = cancelSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const subscription = await cancelOrganizationSubscription({
      organizationId: user.organizationId,
      actorEmail: user.email,
      immediate: parsed.data.immediate,
      reason: parsed.data.reason,
    });
    const businesses = await listBusinessesForOrg(user.organizationId);
    revalidatePath("/app");
    revalidatePath("/app/billing");
    for (const b of businesses) {
      revalidatePath(`/r/${b.publicSlug}`);
    }
    return NextResponse.json(
      { ok: true, subscription },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

