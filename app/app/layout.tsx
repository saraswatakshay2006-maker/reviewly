import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser, sessionCookieName } from "@/lib/auth";
import {
  getOrganizationEntitlements,
  syncExpiredSubscriptions,
} from "@/lib/entitlements";
import { feedbackForBusiness, listBusinessesForOrg } from "@/lib/repo";
import { subscriptionRecordToOrgSummary } from "@/lib/subscriptions";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await syncExpiredSubscriptions(user.organizationId);
  const [ctx, businesses] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    listBusinessesForOrg(user.organizationId),
  ]);
  const primaryBiz = businesses[0] ?? null;

  const feedbackLists = await Promise.all(
    businesses.map((b) => feedbackForBusiness(b.id))
  );
  const pendingFeedbackCount = feedbackLists
    .flat()
    .filter((f) => !f.replyNote).length;

  const subSummary = ctx
    ? subscriptionRecordToOrgSummary(ctx.subscription, ctx.plan)
    : null;

  async function signOutAction() {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete(sessionCookieName());
    redirect("/login");
  }

  return (
    <DashboardShell
      orgName={ctx?.organization.name || "My Workspace"}
      userName={user.name}
      userEmail={user.email}
      isSuperAdmin={user.role === "super_admin"}
      subscriptionPlan={ctx?.plan.name || "Starter"}
      subscription={subSummary}
      gracePeriodDays={ctx?.settings.gracePeriodDays ?? 0}
      warningBanner={ctx?.warningBanner ?? null}
      cancelAtPeriodEnd={ctx?.subscription.cancelAtPeriodEnd ?? false}
      serverNowMs={Date.now()}
      businessSlug={primaryBiz?.publicSlug ?? null}
      businessName={primaryBiz?.name ?? null}
      pendingFeedbackCount={pendingFeedbackCount}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}
