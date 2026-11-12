"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatBillingIntervalLabel,
  getPlanEntitlements,
  getSubscriptionHealth,
  type EffectiveSubscriptionStatus,
} from "@/lib/subscriptions";
import type { BillingInterval, OrganizationSubscription } from "@/lib/types";
import {
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "./Icons";
import { RenewalCountdownBadge, RenewalDateTimeValue } from "./RenewalTimeText";

export interface PlanFeatureDisplayItem {
  key: string;
  label: string;
  enabled: boolean;
  implemented: boolean;
  availabilityStatus?: string;
}

const STATUS_META: Record<
  EffectiveSubscriptionStatus,
  { label: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  trialing: {
    label: "Trialing",
    badgeClass: "bg-cobalt-50 text-cobalt-700 border-cobalt-200",
  },
  past_due: {
    label: "Past Due",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  expired: {
    label: "Expired",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  suspended: {
    label: "Suspended",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-surface-subtle text-ink-muted border-black/[0.1]",
  },
};

export default function PlanInfoCard({
  subscription,
  activeCards,
  locationCount = 1,
  teamCount = 1,
  orgName,
  planLabel,
  supportTier,
  billingInterval,
  paymentStatus,
  planHighlights,
  featureItems,
  gracePeriodDays = 0,
  compact = false,
  serverNowMs,
}: {
  subscription: OrganizationSubscription;
  activeCards: number;
  locationCount?: number;
  teamCount?: number;
  orgName?: string;
  planLabel?: string;
  supportTier?: string;
  billingInterval?: BillingInterval;
  paymentStatus?: string;
  planHighlights?: string[];
  featureItems?: PlanFeatureDisplayItem[];
  gracePeriodDays?: number;
  compact?: boolean;
  serverNowMs?: number;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [subscription.renewalDate, subscription.status]);

  const effectiveNow =
    nowMs ?? serverNowMs ?? Date.parse(subscription.updatedAt) ?? 0;
  const health = getSubscriptionHealth(
    subscription,
    effectiveNow,
    gracePeriodDays
  );
  const planMeta = getPlanEntitlements(subscription);
  const effectiveLabel = planLabel || planMeta.label;
  const effectiveSupport = supportTier || planMeta.supportTier;
  const effectiveInterval =
    billingInterval ?? subscription.billingInterval ?? "monthly";
  const locLimit = subscription.locationLimit ?? planMeta.locationLimit;
  const teamLimit = subscription.teamLimit ?? planMeta.teamLimit;
  const cardLimit = subscription.cardLimit ?? planMeta.cardLimit;
  const statusMeta = STATUS_META[health.effectiveStatus];
  const displayHighlights =
    planHighlights && planHighlights.length > 0
      ? planHighlights
      : planMeta.highlights;

  const priceText =
    subscription.plan === "enterprise" && subscription.monthlyPriceInr === 0
      ? "Custom pricing"
      : subscription.monthlyPriceInr > 0
        ? `₹${subscription.monthlyPriceInr.toLocaleString("en-IN")} / ${
            effectiveInterval === "annual"
              ? "yr"
              : effectiveInterval === "custom"
                ? "custom"
                : "mo"
          }`
        : subscription.plan === "trial"
          ? "Free trial"
          : "₹0 / mo";

  const sourceBadge =
    paymentStatus === "MANUAL"
      ? "Managed by Super Admin"
      : paymentStatus === "SUCCESS"
        ? "Verified payment"
        : subscription.plan === "trial"
          ? "Free trial"
          : null;

  return (
    <section
      aria-label="Subscription plan and renewal details"
      className={`rounded-card border bg-white shadow-panel overflow-hidden ${
        !health.isUsable
          ? "border-red-200"
          : health.expiringSoon
            ? "border-amber-200"
            : "border-black/[0.09]"
      }`}
    >
      <div className={compact ? "p-4 sm:p-5 space-y-4" : "p-5 sm:p-6 space-y-4"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                !health.isUsable
                  ? "bg-red-50 text-red-600"
                  : health.expiringSoon
                    ? "bg-amber-50 text-amber-700"
                    : "bg-cobalt-50 text-cobalt-600"
              }`}
            >
              {!health.isUsable ? (
                <LockIcon size={18} />
              ) : (
                <ShieldCheckIcon size={18} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base font-semibold text-ink">
                  {effectiveLabel} Plan
                </h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
                <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-ink-secondary">
                  {effectiveSupport}
                </span>
                {sourceBadge && (
                  <span className="rounded-md bg-canvas border border-black/[0.07] px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                    {sourceBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {orgName ? `${orgName} · ` : ""}
                {priceText} · {formatBillingIntervalLabel(effectiveInterval)}
                {subscription.notes ? ` · ${subscription.notes}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                health.isUsable
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  health.isUsable ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span>
                {health.isUsable
                  ? "Customer review page live"
                  : health.expired
                    ? "Review page closed (Plan expired)"
                    : `Review page paused (${statusMeta.label})`}
              </span>
            </div>
            <Link
              href="/app/billing"
              className={`inline-flex items-center rounded-control px-3 py-1.5 text-xs font-semibold transition-colors ${
                health.isUsable
                  ? "border border-black/[0.12] bg-canvas hover:bg-surface-subtle text-ink"
                  : "bg-cobalt-600 hover:bg-cobalt-700 text-white"
              }`}
            >
              {health.isUsable ? "Manage billing" : "Renew plan"}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
              <CalendarIcon size={13} />
              <span>Renewal / Expiry time</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-ink mt-1">
              <RenewalDateTimeValue
                renewalDate={subscription.renewalDate}
                fallback="Ongoing (no expiry set)"
              />
            </p>
          </div>

          <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
              <ClockIcon size={13} />
              <span>Time remaining</span>
            </p>
            <p
              className={`text-xs sm:text-sm font-semibold mt-1 tabular-nums ${
                health.expired
                  ? "text-red-700"
                  : health.expiringSoon
                    ? "text-amber-700"
                    : "text-ink"
              }`}
            >
              <RenewalCountdownBadge
                renewalDate={subscription.renewalDate}
                gracePeriodDays={gracePeriodDays}
              />
            </p>
          </div>

          <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
              <BuildingIcon size={13} />
              <span>Locations</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-ink mt-1 tabular-nums">
              {locationCount} / {locLimit < 0 ? "Unlimited" : locLimit}
            </p>
          </div>

          <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
              <UsersIcon size={13} />
              <span>Team accounts</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-ink mt-1 tabular-nums">
              {teamCount} / {teamLimit < 0 ? "Unlimited" : teamLimit}
            </p>
          </div>

          <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-ink-muted flex items-center gap-1.5">
              <CreditCardIcon size={13} />
              <span>NFC / QR cards</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-ink mt-1 tabular-nums">
              {activeCards} / {cardLimit < 0 ? "Unlimited" : `${cardLimit} active`}
            </p>
          </div>
        </div>

        {!compact && featureItems && featureItems.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-medium text-ink-muted">
              Plan entitlements (synced with Super Admin configuration):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {featureItems.map((feat) => {
                const activeNow = health.isUsable && feat.enabled;
                return (
                  <span
                    key={feat.key}
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] ${
                      activeNow
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                        : !feat.implemented
                          ? "border-amber-200/80 bg-amber-50/40 text-amber-900"
                          : "border-black/[0.07] bg-canvas text-ink-muted"
                    }`}
                  >
                    {activeNow ? (
                      <CheckIcon size={11} className="text-emerald-600 shrink-0" />
                    ) : (
                      <LockIcon size={11} className="text-ink-muted shrink-0" />
                    )}
                    <span>{feat.label}</span>
                    {!feat.implemented && (
                      <span className="text-[10px] opacity-80">
                        ({(feat.availabilityStatus || "coming_soon").replace("_", " ")})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          !compact &&
          displayHighlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {displayHighlights.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1 rounded-md border border-black/[0.07] bg-canvas px-2.5 py-1 text-[11px] text-ink-secondary"
                >
                  <CheckIcon size={11} className="text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          )
        )}

        {!health.isUsable && (
          <div
            role="status"
            className="rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 text-xs text-red-800 leading-relaxed"
          >
            {health.expired ? (
              <>
                Your <strong>{effectiveLabel}</strong> plan expired on{" "}
                <strong className="font-semibold">
                  <RenewalDateTimeValue renewalDate={subscription.renewalDate} />
                </strong>
                . Customers opening your review link or scanning QR / NFC cards see the paused notice, and workspace tools are locked until you renew in{" "}
                <Link href="/app/billing?tab=upgrade" className="underline font-semibold">
                  Subscription &amp; Billing
                </Link>{" "}
                or your SaaS administrator extends access.
              </>
            ) : (
              <>
                Your subscription status is currently <strong>{statusMeta.label}</strong>. Customer review intake and workspace tools are locked until renewed or reactivated.
              </>
            )}
          </div>
        )}

        {health.isUsable && health.expiringSoon && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed"
          >
            Renewal reminder: your <strong>{effectiveLabel}</strong> plan expires on{" "}
            <strong className="font-semibold">
              <RenewalDateTimeValue renewalDate={subscription.renewalDate} />
            </strong>{" "}
            (<RenewalCountdownBadge renewalDate={subscription.renewalDate} gracePeriodDays={gracePeriodDays} />). Renew before this time to keep your customer review page live.
          </div>
        )}
      </div>
    </section>
  );
}
