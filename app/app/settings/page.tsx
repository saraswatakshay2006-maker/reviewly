import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  listBusinessesForOrg,
  getBusinessById,
  getOrganizationById,
  listCardsForBusiness,
} from "@/lib/repo";
import { resolveSubscription } from "@/lib/subscriptions";
import PlanInfoCard from "@/components/PlanInfoCard";
import BusinessSettingsForm from "./BusinessSettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [org, businesses] = await Promise.all([
    getOrganizationById(user.organizationId),
    listBusinessesForOrg(user.organizationId),
  ]);
  const business = businesses[0] ? await getBusinessById(businesses[0].id) : null;
  const sub = org ? resolveSubscription(org) : null;
  const cards = business ? await listCardsForBusiness(business.id) : [];
  const activeCards = cards.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-black/[0.08]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Business settings
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Configure your customer review page identity, brand color, and official Google link.
        </p>
      </div>

      {sub && (
        <PlanInfoCard
          subscription={sub}
          activeCards={activeCards}
          orgName={org?.name}
          compact
          serverNowMs={Date.now()}
        />
      )}

      <BusinessSettingsForm orgId={user.organizationId} initial={business} />
    </div>
  );
}
