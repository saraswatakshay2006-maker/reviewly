import { redirect } from "next/navigation";
import { getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import { getOwnerBillingOverview } from "@/lib/billing";
import { syncExpiredSubscriptions } from "@/lib/entitlements";
import { isRazorpayConfigured } from "@/lib/razorpay";
import BillingPortalClient from "@/components/BillingPortalClient";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tab } = await searchParams;
  await syncExpiredSubscriptions(user.organizationId);
  const overview = await getOwnerBillingOverview(user.organizationId);
  if (!overview) redirect("/app");

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-black/[0.08]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Subscription &amp; Billing
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          View your plan limits, upgrade or renew your subscription, and download verified payment invoices.
        </p>
      </div>

      <BillingPortalClient
        initialOverview={{
          razorpayConfigured: isRazorpayConfigured(),
          ...overview,
        }}
        canManageBilling={isOwnerOrAdminRole(user.role)}
        initialTab={tab || "plan"}
      />
    </div>
  );
}

