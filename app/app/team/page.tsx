import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById, listUsersForOrg } from "@/lib/repo";
import {
  getPlanEntitlements,
  isSubscriptionActive,
  resolveSubscription,
} from "@/lib/subscriptions";
import TeamManagementClient from "@/components/TeamManagementClient";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [org, members] = await Promise.all([
    getOrganizationById(user.organizationId),
    listUsersForOrg(user.organizationId),
  ]);
  const sub = org ? resolveSubscription(org) : null;
  const entitlements = sub ? getPlanEntitlements(sub) : null;
  const isPlanUsable = sub ? isSubscriptionActive(sub) : true;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-black/[0.08]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Team members
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Manage admins, branch managers, and staff accounts inside {org?.name || "your workspace"}.
        </p>
      </div>

      <TeamManagementClient
        initialMembers={members}
        currentUserId={user.id}
        canManage={user.role === "owner" || user.role === "super_admin"}
        teamLimit={entitlements?.teamLimit ?? 1}
        planLabel={entitlements?.label ?? "Starter"}
        isPlanUsable={isPlanUsable}
      />
    </div>
  );
}
