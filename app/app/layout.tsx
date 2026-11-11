import { redirect } from "next/navigation";
import { getCurrentUser, sessionCookieName } from "@/lib/auth";
import {
  listBusinessesForOrg,
  getOrganizationById,
  feedbackForBusiness,
} from "@/lib/repo";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const org = await getOrganizationById(user.organizationId);
  const businesses = await listBusinessesForOrg(user.organizationId);
  const primaryBiz = businesses[0] ?? null;

  let pendingFeedbackCount = 0;
  if (primaryBiz) {
    const items = await feedbackForBusiness(primaryBiz.id);
    pendingFeedbackCount = items.filter((f) => !f.replyNote).length;
  }

  async function signOutAction() {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete(sessionCookieName());
    redirect("/login");
  }

  return (
    <DashboardShell
      orgName={org?.name || "My Workspace"}
      userName={user.name}
      userEmail={user.email}
      businessSlug={primaryBiz?.publicSlug ?? null}
      businessName={primaryBiz?.name ?? null}
      pendingFeedbackCount={pendingFeedbackCount}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}
