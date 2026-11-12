import Link from "next/link";
import { ArrowUpRightIcon, LockIcon, ShieldCheckIcon } from "./Icons";
import { RenewalCountdownBadge, RenewalDateTimeValue } from "./RenewalTimeText";
import type { EffectiveSubscriptionStatus } from "@/lib/subscriptions";

export default function SubscriptionLockedGate({
  sectionName,
  planName,
  effectiveStatus,
  renewalDate,
  isSuperAdmin = false,
  statsSummary,
}: {
  sectionName: string;
  planName: string;
  effectiveStatus: EffectiveSubscriptionStatus;
  renewalDate: string | null;
  isSuperAdmin?: boolean;
  statsSummary?: string;
}) {
  const heading =
    effectiveStatus === "suspended"
      ? `${sectionName} locked — workspace suspended`
      : effectiveStatus === "cancelled"
        ? `${sectionName} locked — subscription cancelled`
        : `${sectionName} locked — ${planName} plan expired`;

  const description =
    effectiveStatus === "suspended"
      ? "Access to workspace operations and your public customer review page (/r/[slug]) has been paused by the platform administrator. Existing business data and history are safely preserved."
      : effectiveStatus === "cancelled"
        ? "This subscription is cancelled. Workspace operations and your public customer review page (/r/[slug]) are locked until you reactivate or choose a plan."
        : "Your subscription period has ended. Both your public customer review page (/r/[slug]) and workspace operations are locked until you renew or upgrade your plan.";

  return (
    <section
      aria-label={`${sectionName} locked`}
      className="rounded-card border border-red-200 bg-white p-6 sm:p-8 shadow-panel space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
          <LockIcon size={22} />
        </div>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 uppercase tracking-wide">
              {effectiveStatus.replace("_", " ")}
            </span>
            {renewalDate && (
              <span className="text-xs font-medium text-red-700">
                <RenewalCountdownBadge renewalDate={renewalDate} />
              </span>
            )}
          </div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-ink">
            {heading}
          </h2>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-2xl">
            {description}
          </p>
          {renewalDate && (
            <p className="text-xs text-ink-muted">
              Period ended / renewal timestamp:{" "}
              <strong className="text-ink">
                <RenewalDateTimeValue renewalDate={renewalDate} />
              </strong>
            </p>
          )}
          {statsSummary && (
            <p className="text-xs font-medium text-ink-secondary pt-1">
              Preserved workspace data: {statsSummary}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/app/billing?tab=upgrade"
          className="inline-flex items-center gap-1.5 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors"
        >
          <span>Renew or Upgrade Plan</span>
          <ArrowUpRightIcon size={15} />
        </Link>
        <Link
          href="/app/billing"
          className="inline-flex items-center rounded-control border border-black/[0.12] bg-canvas hover:bg-surface-subtle px-4 py-2.5 text-xs sm:text-sm font-medium text-ink transition-colors"
        >
          View Plan, Payments &amp; Invoices
        </Link>
        {isSuperAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-control border border-cobalt-200 bg-cobalt-50 px-3.5 py-2.5 text-xs font-semibold text-cobalt-700 hover:bg-cobalt-100 transition-colors"
          >
            <ShieldCheckIcon size={14} />
            <span>Manage in Super Admin</span>
          </Link>
        )}
      </div>
    </section>
  );
}

