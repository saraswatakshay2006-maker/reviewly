import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getOrganizationEntitlements,
  getPlanFeatureDisplayItems,
  syncExpiredSubscriptions,
} from "@/lib/entitlements";
import {
  listCardsForBusiness,
  listUsersForOrg,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import { subscriptionRecordToOrgSummary } from "@/lib/subscriptions";
import PlanInfoCard from "@/components/PlanInfoCard";
import SubscriptionLockedGate from "@/components/SubscriptionLockedGate";
import { BuildingIcon, PlusIcon } from "@/components/Icons";
import BusinessSettingsForm from "./BusinessSettingsForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string; new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz, new: newParam } = await searchParams;
  const nowMs = Date.now();
  await syncExpiredSubscriptions(user.organizationId, nowMs);

  const [ctx, locState, members] = await Promise.all([
    getOrganizationEntitlements(user.organizationId, nowMs),
    resolveActiveBusinessForOrg(user.organizationId, requestedBiz),
    listUsersForOrg(user.organizationId),
  ]);

  const { businesses, active } = locState;
  const maxLocations = ctx?.limits.maxLocations ?? 1;
  const isUnlimitedLocations = maxLocations < 0;
  const isPlanUsable = ctx ? ctx.isUsable : true;
  const canAddMoreLocations =
    isPlanUsable && (isUnlimitedLocations || businesses.length < maxLocations);
  const isCreatingNew = newParam === "1" && canAddMoreLocations;
  const formTarget = isCreatingNew ? null : active;

  const cardsPerBiz = await Promise.all(
    businesses.map((b) => listCardsForBusiness(b.id))
  );
  const activeCards = cardsPerBiz
    .flat()
    .filter((c) => c.status === "active").length;

  const subSummary = ctx
    ? subscriptionRecordToOrgSummary(ctx.subscription, ctx.plan)
    : null;

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

        {ctx && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="rounded-md bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-ink tabular-nums">
              {businesses.length} / {isUnlimitedLocations ? "Unlimited" : maxLocations} locations
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
            <Link
              href="/app/billing"
              className="inline-flex items-center rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors"
            >
              Subscription &amp; Billing
            </Link>
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

          {!canAddMoreLocations && ctx && (
            <span className="text-[11px] text-ink-muted">
              {!isPlanUsable ? (
                <>
                  Subscription paused —{" "}
                  <Link href="/app/billing" className="text-cobalt-600 font-medium">
                    renew plan
                  </Link>{" "}
                  to edit or add branches.
                </>
              ) : (
                <>
                  Location limit reached on {ctx.plan.name} —{" "}
                  <Link href="/app/billing?tab=upgrade" className="text-cobalt-600 font-medium">
                    upgrade for more branches
                  </Link>
                  .
                </>
              )}
            </span>
          )}
        </div>
      )}

      {subSummary && ctx && (
        <PlanInfoCard
          subscription={subSummary}
          activeCards={activeCards}
          locationCount={businesses.length}
          teamCount={members.length}
          orgName={ctx.organization.name}
          planLabel={ctx.plan.name}
          supportTier={ctx.supportTier}
          billingInterval={ctx.subscription.billingInterval}
          paymentStatus={ctx.subscription.paymentStatus}
          planHighlights={ctx.plan.highlights}
          featureItems={getPlanFeatureDisplayItems(ctx)}
          gracePeriodDays={ctx.settings.gracePeriodDays}
          compact
          serverNowMs={nowMs}
        />
      )}

      {!isPlanUsable && ctx ? (
        <SubscriptionLockedGate
          sectionName="Business Settings"
          planName={ctx.plan.name}
          effectiveStatus={ctx.effectiveStatus}
          renewalDate={ctx.subscription.currentPeriodEnd}
          isSuperAdmin={user.role === "super_admin"}
          statsSummary={`${businesses.length} location${businesses.length === 1 ? "" : "s"}, ${activeCards} active card${activeCards === 1 ? "" : "s"}`}
        />
      ) : (
        <BusinessSettingsForm
          key={formTarget?.id ?? "new-location"}
          orgId={user.organizationId}
          initial={formTarget}
          canUseCustomBranding={
            isPlanUsable && (ctx?.featureFlags.customBranding ?? false)
          }
          whiteLabel={isPlanUsable && (ctx?.featureFlags.whiteLabel ?? false)}
        />
      )}
    </div>
  );
}
