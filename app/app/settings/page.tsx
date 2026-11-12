import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getOrganizationById,
  listCardsForBusiness,
  listUsersForOrg,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import { getPlanEntitlements, resolveSubscription } from "@/lib/subscriptions";
import PlanInfoCard from "@/components/PlanInfoCard";
import { BuildingIcon, PlusIcon } from "@/components/Icons";
import BusinessSettingsForm from "./BusinessSettingsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string; new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz, new: newParam } = await searchParams;

  const [org, locState, members] = await Promise.all([
    getOrganizationById(user.organizationId),
    resolveActiveBusinessForOrg(user.organizationId, requestedBiz),
    listUsersForOrg(user.organizationId),
  ]);

  const sub = org ? resolveSubscription(org) : null;
  const entitlements = sub ? getPlanEntitlements(sub) : null;
  const { businesses, active } = locState;

  const canAddMoreLocations = entitlements
    ? businesses.length < entitlements.locationLimit
    : false;
  const isCreatingNew = newParam === "1" && canAddMoreLocations;
  const formTarget = isCreatingNew ? null : active;

  const cardsPerBiz = await Promise.all(
    businesses.map((b) => listCardsForBusiness(b.id))
  );
  const activeCards = cardsPerBiz
    .flat()
    .filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Business settings
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Configure your customer review page identity, brand color, and official Google link.
          </p>
        </div>

        {entitlements && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-md bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-ink tabular-nums">
              {businesses.length} / {entitlements.locationLimit} locations
            </span>
            {canAddMoreLocations && businesses.length > 0 && (
              <Link
                href="/app/settings?new=1"
                className="inline-flex items-center gap-1.5 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <PlusIcon size={14} />
                <span>Add location</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {businesses.length > 0 && (
        <div className="rounded-panel bg-white border border-black/[0.08] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted pr-1">
              <BuildingIcon size={14} />
              <span>Locations:</span>
            </span>
            {businesses.map((b) => {
              const selected = !isCreatingNew && formTarget?.id === b.id;
              return (
                <Link
                  key={b.id}
                  href={`/app/settings?biz=${encodeURIComponent(b.id)}`}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-cobalt-600 text-white"
                      : "bg-canvas border border-black/[0.08] text-ink-secondary hover:text-ink"
                  }`}
                >
                  {b.name}
                </Link>
              );
            })}
            {isCreatingNew && (
              <span className="rounded-lg bg-cobalt-50 border border-cobalt-200 px-2.5 py-1 text-xs font-semibold text-cobalt-700">
                New location
              </span>
            )}
          </div>

          {!canAddMoreLocations && entitlements && (
            <span className="text-[11px] text-ink-muted">
              Location limit reached on {entitlements.label} — upgrade for more branches.
            </span>
          )}
        </div>
      )}

      {sub && (
        <PlanInfoCard
          subscription={sub}
          activeCards={activeCards}
          locationCount={businesses.length}
          teamCount={members.length}
          orgName={org?.name}
          compact
          serverNowMs={Date.now()}
        />
      )}

      <BusinessSettingsForm
        key={formTarget?.id ?? "new-location"}
        orgId={user.organizationId}
        initial={formTarget}
        canUseCustomBranding={entitlements?.features.customBranding ?? false}
        whiteLabel={entitlements?.features.whiteLabel ?? false}
      />
    </div>
  );
}
