import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import {
  getOrganizationEntitlements,
  syncExpiredSubscriptions,
} from "@/lib/entitlements";
import { listUsersForOrg } from "@/lib/repo";
import SubscriptionLockedGate from "@/components/SubscriptionLockedGate";
import TeamManagementClient from "@/components/TeamManagementClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TeamPage() {
  noStore();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await syncExpiredSubscriptions(user.organizationId);
  const [ctx, members] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    listUsersForOrg(user.organizationId),
  ]);
  const isPlanUsable = ctx ? ctx.isUsable : true;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-black/[0.08]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Team members
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Manage business admins, branch managers, and staff accounts inside{" "}
          {ctx?.organization.name || "your workspace"}.
        </p>
      </div>

      {!isPlanUsable && ctx ? (
        <SubscriptionLockedGate
          sectionName="Team Management"
          planName={ctx.plan.name}
          effectiveStatus={ctx.effectiveStatus}
          renewalDate={ctx.subscription.currentPeriodEnd}
          isSuperAdmin={user.role === "super_admin"}
          statsSummary={`${members.length} team account${members.length === 1 ? "" : "s"}`}
        />
      ) : (
        <TeamManagementClient
          initialMembers={members}
          currentUserId={user.id}
          canManage={isOwnerOrAdminRole(user.role)}
          teamLimit={ctx?.limits.maxTeamMembers ?? 1}
          planLabel={ctx?.plan.name ?? "Starter"}
          isPlanUsable={isPlanUsable}
        />
      )}
    </div>
  );
}
