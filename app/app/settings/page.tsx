import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listBusinessesForOrg, getBusinessById } from "@/lib/repo";
import BusinessSettingsForm from "./BusinessSettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await listBusinessesForOrg(user.organizationId);
  const business = businesses[0] ? await getBusinessById(businesses[0].id) : null;

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

      <BusinessSettingsForm orgId={user.organizationId} initial={business} />
    </div>
  );
}
