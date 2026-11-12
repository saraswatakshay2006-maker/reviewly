import { redirect } from "next/navigation";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import { getOrganizationEntitlements } from "@/lib/entitlements";
import { listUsersForOrg } from "@/lib/repo";
import TeamManagementClient from "@/components/TeamManagementClient";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [ctx, members] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    listUsersForOrg(user.organizationId),
  ]);

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

      <TeamManagementClient
        initialMembers={members}
        currentUserId={user.id}
        canManage={isOwnerOrAdminRole(user.role)}
        teamLimit={ctx?.limits.maxTeamMembers ?? 1}
        planLabel={ctx?.plan.name ?? "Starter"}
        isPlanUsable={ctx ? ctx.isUsable : true}
      />
    </div>
  );
}
