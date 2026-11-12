"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, CheckIcon, SearchIcon } from "./Icons";
import { FEATURE_CATALOG } from "@/lib/planSeed";
import {
  calculateSubscriptionPeriod,
  type PlanDefinition,
} from "@/lib/subscriptions";
import type {
  BillingInterval,
  CouponRecord,
  CustomEntitlementOverrides,
  FeatureKey,
  PaymentRecord,
  PlanFeatureRecord,
  PlanRecord,
  PlatformBillingSettings,
  SubscriptionAuditLogRecord,
  SubscriptionStatus,
} from "@/lib/types";

export interface AdminPlanView extends PlanRecord {
  features: PlanFeatureRecord[];
  definition: PlanDefinition;
}

export interface AdminSubscriptionView {
  id: string;
  organizationId: string;
  organizationName: string;
  businessId: string | null;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  planId: string;
  planName: string;
  amountInr: number;
  billingInterval: BillingInterval;
  status: string;
  rawStatus: SubscriptionStatus;
  paymentStatus: string;
  startAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  remainingDays: number | null;
  countdownLabel: string;
  isUsable: boolean;
  customOverrides: CustomEntitlementOverrides | null;
  notes: string;
  updatedAt: string;
}

export interface AdminPaymentView extends PaymentRecord {
  organizationName: string;
  businessName: string;
  planName: string;
}

export interface AdminAuditLogView extends SubscriptionAuditLogRecord {
  organizationName: string;
}

export interface AdminSubscriptionAnalytics {
  totalSubscribedBusinesses: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  mrrInr: number;
  arrInr: number;
  monthlyRevenueInr: number;
  annualRevenueInr: number;
  paymentSuccessRatePct: number;
  successfulTransactions: number;
  failedTransactions: number;
  planDistribution: {
    planId: string;
    planName: string;
    count: number;
    activeCount: number;
  }[];
  upgradeCount: number;
  downgradeCount: number;
  trialToPaidConversionPct: number;
  churnRatePct: number;
}

export type AdminOrgSummary = {
  id: string;
  name: string;
  slug: string;
  users: { id: string; name: string; email: string }[];
  businesses: { id: string; name: string; publicSlug: string }[];
  stats: { activeCards: number; totalCards: number };
};

type BillingSubTab =
  | "analytics"
  | "plans"
  | "subscriptions"
  | "access"
  | "payments"
  | "coupons"
  | "settings";

const SUB_STATUS_PILL: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trialing: "bg-cobalt-50 text-cobalt-700 border-cobalt-200",
  past_due: "bg-amber-50 text-amber-800 border-amber-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-surface-subtle text-ink-muted border-black/[0.08]",
};

const PAY_STATUS_PILL: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  PARTIALLY_REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

function fmtLimit(n: number) {
  return n < 0 ? "Unlimited" : String(n);
}

export default function AdminSubscriptionSuite({
  analytics,
  plans,
  subscriptions,
  organizations,
  payments,
  auditLogs,
  coupons,
  platformSettings,
  onRefresh,
  onNotify,
}: {
  analytics: AdminSubscriptionAnalytics;
  plans: AdminPlanView[];
  subscriptions: AdminSubscriptionView[];
  organizations: AdminOrgSummary[];
  payments: AdminPaymentView[];
  auditLogs: AdminAuditLogView[];
  coupons: CouponRecord[];
  platformSettings: PlatformBillingSettings;
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<BillingSubTab>("subscriptions");

  return (
    <section className="space-y-5">
      {/* Sub-navigation for Subscription Management */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-card bg-white border border-black/[0.09] p-1.5">
        {(
          [
            { id: "subscriptions", label: `Subscriptions (${subscriptions.length})` },
            { id: "plans", label: `Plans & Pricing (${plans.length})` },
            { id: "access", label: "Business Access" },
            { id: "payments", label: `Payments (${payments.length})` },
            { id: "coupons", label: `Coupons (${coupons.length})` },
            { id: "analytics", label: "Subscription Analytics" },
            { id: "settings", label: "Trials & Platform Settings" },
          ] as { id: BillingSubTab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubTab(item.id)}
            className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === item.id
                ? "bg-ink text-white"
                : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {subTab === "analytics" && (
        <AnalyticsPanel analytics={analytics} auditLogs={auditLogs} />
      )}
      {subTab === "plans" && (
        <PlansManagerPanel
          plans={plans}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
      {subTab === "subscriptions" && (
        <SubscriptionsManagerPanel
          subscriptions={subscriptions}
          plans={plans}
          auditLogs={auditLogs}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
      {subTab === "access" && (
        <BusinessAccessPanel
          subscriptions={subscriptions}
          organizations={organizations}
          plans={plans}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
      {subTab === "payments" && (
        <PaymentsPanel
          payments={payments}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
      {subTab === "coupons" && (
        <CouponsPanel
          coupons={coupons}
          plans={plans}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
      {subTab === "settings" && (
        <PlatformSettingsPanel
          settings={platformSettings}
          onRefresh={onRefresh}
          onNotify={onNotify}
        />
      )}
    </section>
  );
}

/* ============================================================================
   1. Subscription Analytics (strictly DB-derived metrics)
   ========================================================================== */
function AnalyticsPanel({
  analytics,
  auditLogs,
}: {
  analytics: AdminSubscriptionAnalytics;
  auditLogs: AdminAuditLogView[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="MRR"
          value={`₹${analytics.mrrInr.toLocaleString("en-IN")}`}
          sub={`ARR: ₹${analytics.arrInr.toLocaleString("en-IN")}`}
          accent
        />
        <MetricCard
          label="Collected This Month"
          value={`₹${analytics.monthlyRevenueInr.toLocaleString("en-IN")}`}
          sub={`YTD: ₹${analytics.annualRevenueInr.toLocaleString("en-IN")}`}
        />
        <MetricCard
          label="Payment Success Rate"
          value={`${analytics.paymentSuccessRatePct}%`}
          sub={`${analytics.successfulTransactions} paid · ${analytics.failedTransactions} failed`}
        />
        <MetricCard
          label="Trial -> Paid Conversion"
          value={`${analytics.trialToPaidConversionPct}%`}
          sub={`Churn rate: ${analytics.churnRatePct}%`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MiniStat label="Active Paid" value={analytics.activeSubscriptions} />
        <MiniStat label="Active Trials" value={analytics.trialSubscriptions} />
        <MiniStat label="Expired" value={analytics.expiredSubscriptions} />
        <MiniStat label="Suspended" value={analytics.suspendedSubscriptions} />
        <MiniStat
          label="Upgrades / Downgrades"
          value={`${analytics.upgradeCount} / ${analytics.downgradeCount}`}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-panel">
          <h3 className="font-display text-sm font-semibold text-ink">
            Plan Distribution (DB Workspaces)
          </h3>
          <div className="space-y-3">
            {analytics.planDistribution.map((row) => {
              const total = Math.max(1, analytics.totalSubscribedBusinesses);
              const pct = Math.round((row.count / total) * 100);
              return (
                <div key={row.planId} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{row.planName}</span>
                    <span className="text-ink-muted tabular-nums">
                      {row.activeCount} usable / {row.count} total ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cobalt-600"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] p-5 space-y-3 shadow-panel">
          <h3 className="font-display text-sm font-semibold text-ink">
            Recent Subscription Audit Trail ({auditLogs.length})
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-ink-secondary py-6 text-center">
              No subscription changes audited yet.
            </p>
          ) : (
            <div className="divide-y divide-black/[0.06] max-h-96 overflow-y-auto">
              {auditLogs.slice(0, 40).map((log) => (
                <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">
                      {log.organizationName} ·{" "}
                      <span className="font-mono text-cobalt-700">{log.action}</span>
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted shrink-0">
                      {log.createdAt.slice(0, 16).replace("T", " ")} UTC
                    </span>
                  </div>
                  <p className="text-ink-secondary">
                    By {log.actorEmail} — Reason: {log.reason || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. Plans & Pricing CRUD with Feature Matrix + Confirmation Step
   ========================================================================== */
function PlansManagerPanel({
  plans,
  onRefresh,
  onNotify,
}: {
  plans: AdminPlanView[];
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(plans[0]?.id ?? "new");

  const activePlan = useMemo(
    () => plans.find((p) => p.id === selectedId) ?? null,
    [plans, selectedId]
  );

  return (
    <div className="grid lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">
            Configurable Plans
          </h3>
          <button
            type="button"
            onClick={() => setSelectedId("new")}
            className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 py-1.5 text-xs font-medium text-white"
          >
            + New Plan
          </button>
        </div>

        <div className="space-y-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left rounded-card border p-3.5 transition-colors ${
                selectedId === p.id
                  ? "border-cobalt-600 bg-cobalt-50/50"
                  : "border-black/[0.09] bg-white hover:bg-canvas"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-ink">{p.name}</span>
                  {p.isPopular && (
                    <span className="rounded-full bg-cobalt-600 text-white px-2 py-0.5 text-[10px] font-medium">
                      Most Popular
                    </span>
                  )}
                  {!p.isActive && (
                    <span className="rounded-full bg-surface-subtle text-ink-muted px-2 py-0.5 text-[10px]">
                      Hidden
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-ink">
                  {p.customPrice
                    ? "Custom"
                    : `₹${p.monthlyPriceInr.toLocaleString("en-IN")}/mo`}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Locs: {fmtLimit(p.maxLocations)} · Team: {fmtLimit(p.maxTeamMembers)} · Cards:{" "}
                {fmtLimit(p.maxCards)} · Support: {p.supportTier}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-8">
        <PlanEditorForm
          key={selectedId}
          plan={activePlan}
          onSaved={async (savedId, msg) => {
            onNotify("ok", msg);
            setSelectedId(savedId);
            await onRefresh();
          }}
          onError={(msg) => onNotify("err", msg)}
        />
      </div>
    </div>
  );
}

function PlanEditorForm({
  plan,
  onSaved,
  onError,
}: {
  plan: AdminPlanView | null;
  onSaved: (id: string, msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const isNew = !plan;
  const [slug, setSlug] = useState(plan?.slug ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [badge, setBadge] = useState(plan?.badge ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [monthlyPriceInr, setMonthlyPriceInr] = useState<number>(
    plan?.monthlyPriceInr ?? 999
  );
  const [annualPriceInr, setAnnualPriceInr] = useState<string>(
    plan?.annualPriceInr !== null && plan?.annualPriceInr !== undefined
      ? String(plan.annualPriceInr)
      : ""
  );
  const [customPrice, setCustomPrice] = useState(plan?.customPrice ?? false);
  const [maxLocations, setMaxLocations] = useState<number>(
    plan?.maxLocations ?? 1
  );
  const [maxTeamMembers, setMaxTeamMembers] = useState<number>(
    plan?.maxTeamMembers ?? 1
  );
  const [maxCards, setMaxCards] = useState<number>(plan?.maxCards ?? 5);
  const [supportTier, setSupportTier] = useState(
    plan?.supportTier ?? "Basic support"
  );
  const [trialDays, setTrialDays] = useState<number>(plan?.trialDays ?? 0);
  const [sortOrder, setSortOrder] = useState<number>(plan?.sortOrder ?? 50);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [isPopular, setIsPopular] = useState(plan?.isPopular ?? false);
  const [razorpayMonthlyPlanId, setRazorpayMonthlyPlanId] = useState(
    plan?.razorpayMonthlyPlanId ?? ""
  );
  const [razorpayAnnualPlanId, setRazorpayAnnualPlanId] = useState(
    plan?.razorpayAnnualPlanId ?? ""
  );
  const [highlightsText, setHighlightsText] = useState(
    (plan?.highlights ?? []).join("\n")
  );
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const def of FEATURE_CATALOG) {
      const existing = plan?.features.find((f) => f.featureKey === def.key);
      out[def.key] = def.implemented ? Boolean(existing?.enabled) : false;
    }
    return out;
  });
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);

  const performSave = async () => {
    setSaving(true);
    try {
      const endpoint = isNew ? "/api/admin/plans" : `/api/admin/plans/${plan.id}`;
      const method = isNew ? "POST" : "PATCH";
      const parsedAnnual =
        annualPriceInr.trim() === "" ? null : Math.max(0, Number(annualPriceInr));

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan?.id,
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          badge: badge.trim(),
          description: description.trim(),
          monthlyPriceInr: customPrice ? 0 : Math.max(0, Number(monthlyPriceInr) || 0),
          annualPriceInr: customPrice ? null : parsedAnnual,
          customPrice,
          billingIntervalOptions: customPrice
            ? ["custom"]
            : parsedAnnual !== null
              ? ["monthly", "annual"]
              : ["monthly"],
          maxLocations: Number(maxLocations),
          maxTeamMembers: Number(maxTeamMembers),
          maxCards: Number(maxCards),
          supportTier: supportTier.trim(),
          trialDays: Math.max(0, Number(trialDays) || 0),
          sortOrder: Math.max(0, Number(sortOrder) || 0),
          isActive,
          isPopular,
          razorpayMonthlyPlanId: razorpayMonthlyPlanId.trim() || null,
          razorpayAnnualPlanId: razorpayAnnualPlanId.trim() || null,
          highlights: highlightsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          features: featureFlags,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save plan");
      setConfirmSave(false);
      await onSaved(
        json.plan?.id || plan?.id || slug.trim().toLowerCase(),
        `${isNew ? "Created" : "Updated"} plan ${name.trim()}.`
      );
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full min-h-[36px] rounded-control border border-black/[0.12] bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-5 shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] pb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            {isNew ? "Create Subscription Plan" : `Edit ${plan.name}`}
          </h3>
          <p className="text-xs text-ink-muted">
            Changes update DB plans &amp; plan_features dynamically across landing, billing &amp; APIs.
          </p>
        </div>
        {!isNew && (
          <span className="font-mono text-[11px] rounded bg-canvas px-2 py-1 text-ink-secondary">
            id: {plan.id}
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Slug (unique key)
          </label>
          <input
            value={slug}
            disabled={!isNew}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="growth"
            className={`${cls} disabled:bg-canvas font-mono`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Display Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Growth"
            className={cls}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Badge Label
          </label>
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Most Popular"
            className={cls}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-ink-muted mb-1">
          Target Customers / Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cls}
        />
      </div>

      <div className="grid sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Monthly Price (₹)
          </label>
          <input
            type="number"
            min={0}
            disabled={customPrice}
            value={monthlyPriceInr}
            onChange={(e) => setMonthlyPriceInr(Number(e.target.value))}
            className={`${cls} tabular-nums disabled:bg-canvas`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Annual Price (₹/yr)
          </label>
          <input
            type="number"
            min={0}
            disabled={customPrice}
            value={annualPriceInr}
            onChange={(e) => setAnnualPriceInr(e.target.value)}
            placeholder="Optional"
            className={`${cls} tabular-nums disabled:bg-canvas`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Trial Days
          </label>
          <input
            type="number"
            min={0}
            value={trialDays}
            onChange={(e) => setTrialDays(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Sort Order
          </label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Max Locations (-1 = Unlimited)
          </label>
          <input
            type="number"
            min={-1}
            value={maxLocations}
            onChange={(e) => setMaxLocations(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Max Team (-1 = Unlimited)
          </label>
          <input
            type="number"
            min={-1}
            value={maxTeamMembers}
            onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Max Cards (-1 = Unlimited)
          </label>
          <input
            type="number"
            min={-1}
            value={maxCards}
            onChange={(e) => setMaxCards(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Support Tier
          </label>
          <input
            value={supportTier}
            onChange={(e) => setSupportTier(e.target.value)}
            className={cls}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Razorpay Monthly Plan ID (optional)
          </label>
          <input
            value={razorpayMonthlyPlanId}
            onChange={(e) => setRazorpayMonthlyPlanId(e.target.value)}
            placeholder="plan_..."
            className={`${cls} font-mono`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Razorpay Annual Plan ID (optional)
          </label>
          <input
            value={razorpayAnnualPlanId}
            onChange={(e) => setRazorpayAnnualPlanId(e.target.value)}
            placeholder="plan_..."
            className={`${cls} font-mono`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active (visible on pricing &amp; billing)</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
          />
          <span>Mark Most Popular</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={customPrice}
            onChange={(e) => setCustomPrice(e.target.checked)}
          />
          <span>Custom Enterprise Pricing (contact-based)</span>
        </label>
      </div>

      {/* Feature Matrix */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-ink">
          Feature Entitlements (Implemented vs. Integration-Required)
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {FEATURE_CATALOG.map((feat) => {
            const enabled = Boolean(featureFlags[feat.key]);
            return (
              <label
                key={feat.key}
                className={`flex items-start justify-between gap-2 rounded-control border p-2.5 text-xs ${
                  !feat.implemented
                    ? "border-black/[0.06] bg-canvas/80 opacity-75"
                    : enabled
                      ? "border-cobalt-200 bg-cobalt-50/40"
                      : "border-black/[0.08] bg-white"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-ink">{feat.label}</span>
                    {!feat.implemented && (
                      <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        {feat.defaultUnavailableStatus.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted">{feat.description}</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!feat.implemented}
                  checked={feat.implemented ? enabled : false}
                  onChange={(e) =>
                    setFeatureFlags((prev) => ({
                      ...prev,
                      [feat.key]: e.target.checked,
                    }))
                  }
                  className="mt-1 shrink-0"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-ink-muted mb-1">
          Marketing Bullet Highlights (one per line)
        </label>
        <textarea
          rows={4}
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
          className="w-full rounded-control border border-black/[0.12] bg-white p-2.5 text-xs text-ink outline-none focus:border-cobalt-600"
        />
      </div>

      {/* Confirmation gate before updating prices or limits */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.07]">
        {confirmSave ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-3 rounded-control border border-amber-200 bg-amber-50 p-3 text-xs">
            <span className="font-medium text-amber-900">
              Confirm updating {name || slug}? Active quotes &amp; entitlement checks will use these new limits and prices immediately.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void performSave()}
                disabled={saving}
                className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Yes, Confirm Plan Update"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                className="rounded-control border border-black/[0.12] bg-white px-3 py-1.5 text-xs font-medium text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmSave(true)}
            className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-medium text-white"
          >
            Review &amp; Save Plan
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   3. Subscriptions Management + 10 Audited Admin Actions + Enterprise Overrides
   ========================================================================== */
function SubscriptionsManagerPanel({
  subscriptions,
  plans,
  auditLogs,
  onRefresh,
  onNotify,
}: {
  subscriptions: AdminSubscriptionView[];
  plans: AdminPlanView[];
  auditLogs: AdminAuditLogView[];
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    subscriptions[0]?.organizationId ?? ""
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions.filter((s) => {
      if (filter === "annual" && s.billingInterval !== "annual") return false;
      if (filter === "monthly" && s.billingInterval !== "monthly") return false;
      if (
        !["all", "annual", "monthly"].includes(filter) &&
        s.status !== filter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.organizationName.toLowerCase().includes(q) ||
        s.businessName.toLowerCase().includes(q) ||
        s.ownerEmail.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q)
      );
    });
  }, [subscriptions, filter, search]);

  const activeSub = useMemo(
    () =>
      subscriptions.find((s) => s.organizationId === selectedOrgId) ??
      filtered[0] ??
      null,
    [subscriptions, filtered, selectedOrgId]
  );

  return (
    <div className="space-y-5">
      {/* Filter & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "trialing", label: "Trialing" },
            { id: "expired", label: "Expired" },
            { id: "suspended", label: "Suspended" },
            { id: "cancelled", label: "Cancelled" },
            { id: "past_due", label: "Past Due" },
            { id: "monthly", label: "Monthly" },
            { id: "annual", label: "Annual" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                filter === f.id
                  ? "bg-cobalt-600 text-white border-cobalt-600"
                  : "bg-white text-ink-secondary border-black/[0.1] hover:bg-canvas"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-72">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by workspace, owner, plan…"
            className="w-full min-h-[36px] rounded-control border border-black/[0.12] bg-white pl-8 pr-3 text-xs text-ink outline-none focus:border-cobalt-600"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
                  <th className="py-2.5 px-3 font-medium">Business / Owner</th>
                  <th className="py-2.5 px-3 font-medium">Plan &amp; Price</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Expiry</th>
                  <th className="py-2.5 px-3 font-medium text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-ink-muted"
                    >
                      No subscriptions match this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.id}
                      className={
                        activeSub?.organizationId === s.organizationId
                          ? "bg-cobalt-50/40"
                          : "hover:bg-canvas/60"
                      }
                    >
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-ink">
                          {s.organizationName}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate max-w-[190px]">
                          {s.ownerEmail}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <p className="font-medium text-ink">{s.planName}</p>
                        <p className="text-[11px] text-ink-muted tabular-nums">
                          ₹{s.amountInr.toLocaleString("en-IN")} · {s.billingInterval}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            SUB_STATUS_PILL[s.status] ?? SUB_STATUS_PILL.expired
                          }`}
                        >
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-ink-secondary">
                        <p className="font-mono">
                          {s.currentPeriodEnd
                            ? s.currentPeriodEnd.slice(0, 10)
                            : "No expiry"}
                        </p>
                        <p
                          className={
                            s.isUsable ? "text-ink-muted" : "text-red-600 font-medium"
                          }
                        >
                          {s.countdownLabel}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrgId(s.organizationId)}
                          className="rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-ink"
                        >
                          Actions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5">
          {activeSub ? (
            <SubscriptionActionPanel
              key={activeSub.organizationId + activeSub.updatedAt}
              sub={activeSub}
              plans={plans}
              orgAuditLogs={auditLogs.filter(
                (a) => a.organizationId === activeSub.organizationId
              )}
              onSuccess={async (msg) => {
                onNotify("ok", msg);
                await onRefresh();
              }}
              onError={(msg) => onNotify("err", msg)}
            />
          ) : (
            <div className="rounded-card bg-white border border-black/[0.09] p-8 text-center text-xs text-ink-muted">
              Select a workspace row to perform audited subscription actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toLocalDatetimeInputValue(raw: string | null | undefined): string {
  if (!raw) return "";
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function SubscriptionActionPanel({
  sub,
  plans,
  orgAuditLogs,
  onSuccess,
  onError,
}: {
  sub: AdminSubscriptionView;
  plans: AdminPlanView[];
  orgAuditLogs: AdminAuditLogView[];
  onSuccess: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [action, setAction] = useState<
    | "activate_manual"
    | "extend"
    | "change_plan"
    | "suspend"
    | "reactivate"
    | "grant_trial"
    | "set_custom_expiry"
    | "expire_now"
    | "assign_enterprise"
    | "update_entitlements"
    | "cancel"
  >("extend");
  const [planId, setPlanId] = useState(sub.planId);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    sub.billingInterval
  );
  const [amountInr, setAmountInr] = useState<number>(sub.amountInr);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [customExpiryLocal, setCustomExpiryLocal] = useState<string>(() =>
    toLocalDatetimeInputValue(sub.currentPeriodEnd)
  );
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [ovLoc, setOvLoc] = useState<string>(
    sub.customOverrides?.maxLocations !== undefined
      ? String(sub.customOverrides.maxLocations)
      : ""
  );
  const [ovTeam, setOvTeam] = useState<string>(
    sub.customOverrides?.maxTeamMembers !== undefined
      ? String(sub.customOverrides.maxTeamMembers)
      : ""
  );
  const [ovCards, setOvCards] = useState<string>(
    sub.customOverrides?.maxCards !== undefined
      ? String(sub.customOverrides.maxCards)
      : ""
  );
  const [ovSupport, setOvSupport] = useState<string>(
    sub.customOverrides?.supportTier ?? ""
  );
  const [ovWhiteLabel, setOvWhiteLabel] = useState<boolean>(
    Boolean(sub.customOverrides?.features?.white_label)
  );
  const [reason, setReason] = useState("");
  const [confirmManual, setConfirmManual] = useState(false);
  const [busy, setBusy] = useState(false);

  const needsPlan = [
    "activate_manual",
    "change_plan",
    "assign_enterprise",
  ].includes(action);
  const needsDays = ["extend", "grant_trial"].includes(action);
  const needsOverrides = [
    "assign_enterprise",
    "update_entitlements",
  ].includes(action);
  const requiresConfirmation = [
    "activate_manual",
    "suspend",
    "expire_now",
    "cancel",
    "assign_enterprise",
  ].includes(action);

  const submitAction = async () => {
    if (reason.trim().length < 3) {
      onError("Please provide an audit reason (at least 3 characters).");
      return;
    }
    if (requiresConfirmation && !confirmManual) {
      setConfirmManual(true);
      return;
    }

    setBusy(true);
    try {
      const customOverrides: CustomEntitlementOverrides = {};
      if (ovLoc.trim() !== "") customOverrides.maxLocations = Number(ovLoc);
      if (ovTeam.trim() !== "") customOverrides.maxTeamMembers = Number(ovTeam);
      if (ovCards.trim() !== "") customOverrides.maxCards = Number(ovCards);
      if (ovSupport.trim() !== "") customOverrides.supportTier = ovSupport.trim();
      if (ovWhiteLabel) customOverrides.features = { white_label: true };

      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: sub.organizationId,
          action,
          reason: reason.trim(),
          planId: needsPlan ? planId : undefined,
          billingInterval: needsPlan ? billingInterval : undefined,
          amountInr:
            action === "activate_manual" || action === "assign_enterprise"
              ? Number(amountInr)
              : undefined,
          extendDays: needsDays ? Number(extendDays) : undefined,
          customExpiryIso:
            action === "set_custom_expiry"
              ? customExpiryLocal
                ? new Date(customExpiryLocal).toISOString()
                : null
              : undefined,
          cancelImmediately: action === "cancel" ? cancelImmediately : undefined,
          customOverrides: needsOverrides ? customOverrides : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setConfirmManual(false);
      setReason("");
      await onSuccess(`Applied ${action.replace("_", " ")} on ${sub.organizationName}.`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cls =
    "w-full min-h-[36px] rounded-control border border-black/[0.12] bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-panel">
      <div className="border-b border-black/[0.07] pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-ink truncate">
            {sub.organizationName}
          </h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              SUB_STATUS_PILL[sub.status] ?? SUB_STATUS_PILL.expired
            }`}
          >
            {sub.status}
          </span>
        </div>
        <p className="text-[11px] text-ink-muted mt-0.5">
          Plan: {sub.planName} · Owner: {sub.ownerEmail} · {sub.countdownLabel}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Admin Action
          </label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as typeof action);
              setConfirmManual(false);
            }}
            className={cls}
          >
            <option value="extend">Extend Subscription (+ days)</option>
            <option value="activate_manual">Manual Activate (offline / invoice)</option>
            <option value="change_plan">Change Plan</option>
            <option value="grant_trial">Grant / Extend Free Trial (+ days)</option>
            <option value="set_custom_expiry">Set Custom Expiry Timestamp</option>
            <option value="expire_now">Expire Now (locks review page immediately)</option>
            <option value="assign_enterprise">Assign Custom Enterprise Deal</option>
            <option value="update_entitlements">Override Custom Limits / Entitlements</option>
            <option value="suspend">Suspend Subscription (blocks review page)</option>
            <option value="reactivate">Reactivate Suspended Subscription</option>
            <option value="cancel">Cancel Subscription</option>
          </select>
        </div>

        {needsPlan && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Target Plan
              </label>
              <select
                value={planId}
                onChange={(e) => {
                  const next = e.target.value;
                  setPlanId(next);
                  const found = plans.find((p) => p.id === next);
                  if (found) {
                    const annualPrice = found.annualPriceInr ?? 0;
                    setAmountInr(
                      billingInterval === "annual" && annualPrice > 0
                        ? annualPrice
                        : found.monthlyPriceInr
                    );
                  }
                }}
                className={cls}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.monthlyPriceInr}/mo{p.annualPriceInr && p.annualPriceInr > 0 ? ` · ₹${p.annualPriceInr}/yr` : ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Interval
              </label>
              <select
                value={billingInterval}
                onChange={(e) => {
                  const nextInterval = e.target.value as BillingInterval;
                  setBillingInterval(nextInterval);
                  const found = plans.find((p) => p.id === planId);
                  if (found) {
                    const annualPrice = found.annualPriceInr ?? 0;
                    setAmountInr(
                      nextInterval === "annual" && annualPrice > 0
                        ? annualPrice
                        : found.monthlyPriceInr
                    );
                  }
                }}
                className={cls}
              >
                <option value="monthly">Monthly (1 Month)</option>
                <option value="annual">Annual (1 Year)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        )}

        {(action === "activate_manual" || action === "change_plan") &&
          billingInterval !== "custom" && (
            <div className="rounded-control border border-cobalt-200 bg-cobalt-50/60 px-3 py-2 text-[11px] text-ink-secondary">
              Updated expiry preview:{" "}
              <strong className="text-ink">
                {new Date(
                  calculateSubscriptionPeriod(Date.now(), billingInterval).currentPeriodEndIso
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>{" "}
              ({billingInterval === "annual" ? "1 year cycle" : "1 month cycle"})
            </div>
          )}

        {(action === "activate_manual" || action === "assign_enterprise") && (
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Negotiated / Offline Amount (₹, never fabricates Razorpay row)
            </label>
            <input
              type="number"
              min={0}
              value={amountInr}
              onChange={(e) => setAmountInr(Number(e.target.value))}
              className={`${cls} tabular-nums`}
            />
          </div>
        )}

        {needsDays && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5 items-end">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Days to Add
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className={`${cls} tabular-nums`}
                />
              </div>
              <div className="flex gap-1.5 pb-1">
                {[7, 14, 30, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className="rounded border border-black/[0.12] px-2 py-1 text-[11px] hover:bg-canvas"
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
            {Number.isFinite(extendDays) && extendDays > 0 && (
              <div className="rounded-control border border-black/[0.08] bg-canvas px-3 py-1.5 text-[11px] text-ink-secondary">
                Updated expiry preview:{" "}
                <strong className="text-ink">
                  {(() => {
                    const currentEndMs = sub.currentPeriodEnd
                      ? Date.parse(sub.currentPeriodEnd)
                      : NaN;
                    const baseMs =
                      action === "extend" && Number.isFinite(currentEndMs)
                        ? Math.max(currentEndMs, Date.now())
                        : Date.now();
                    return new Date(
                      baseMs + Math.round(extendDays) * 86_400_000
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  })()}
                </strong>
              </div>
            )}
          </div>
        )}

        {action === "set_custom_expiry" && (
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Custom Expiry Date &amp; Time (local input to UTC ISO)
            </label>
            <input
              type="datetime-local"
              value={customExpiryLocal}
              onChange={(e) => setCustomExpiryLocal(e.target.value)}
              className={cls}
            />
          </div>
        )}

        {action === "cancel" && (
          <label className="flex items-center gap-2 text-xs text-ink">
            <input
              type="checkbox"
              checked={cancelImmediately}
              onChange={(e) => setCancelImmediately(e.target.checked)}
            />
            <span>Cancel immediately (otherwise cancels at period end)</span>
          </label>
        )}

        {needsOverrides && (
          <div className="rounded-control border border-black/[0.09] bg-canvas p-3 space-y-2.5">
            <p className="text-[11px] font-semibold text-ink">
              Enterprise / Custom Entitlement Overrides (-1 = Unlimited, blank = plan default)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={-1}
                placeholder="Max Locs"
                value={ovLoc}
                onChange={(e) => setOvLoc(e.target.value)}
                className={cls}
              />
              <input
                type="number"
                min={-1}
                placeholder="Max Team"
                value={ovTeam}
                onChange={(e) => setOvTeam(e.target.value)}
                className={cls}
              />
              <input
                type="number"
                min={-1}
                placeholder="Max Cards"
                value={ovCards}
                onChange={(e) => setOvCards(e.target.value)}
                className={cls}
              />
            </div>
            <input
              placeholder="Custom support tier (e.g. Dedicated Account Manager)"
              value={ovSupport}
              onChange={(e) => setOvSupport(e.target.value)}
              className={cls}
            />
            <label className="inline-flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={ovWhiteLabel}
                onChange={(e) => setOvWhiteLabel(e.target.checked)}
              />
              <span>Enable White-Label Branding</span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Mandatory Audit Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Bank NEFT verified / Goodwill 7-day extension"
            className={cls}
          />
        </div>

        {confirmManual ? (
          <div className="rounded-control border border-amber-200 bg-amber-50 p-3 space-y-2 text-xs">
            <p className="font-medium text-amber-900">
              Confirm executing <span className="font-mono">{action}</span> on{" "}
              <strong>{sub.organizationName}</strong>? This immediately affects billing status and customer review page access.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submitAction()}
                disabled={busy}
                className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy ? "Applying…" : "Confirm & Write Audit Log"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmManual(false)}
                className="rounded-control border border-black/[0.12] bg-white px-3 py-1.5 text-xs font-medium text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void submitAction()}
            disabled={busy}
            className="w-full rounded-control bg-cobalt-600 hover:bg-cobalt-700 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Applying…" : "Execute Audited Action"}
          </button>
        )}
      </div>

      {orgAuditLogs.length > 0 && (
        <div className="pt-3 border-t border-black/[0.07] space-y-2">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
            Workspace Audit History ({orgAuditLogs.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {orgAuditLogs.slice(0, 8).map((l) => (
              <div key={l.id} className="rounded bg-canvas px-2.5 py-1.5 text-[11px]">
                <span className="font-mono font-semibold text-ink">{l.action}</span>{" "}
                <span className="text-ink-muted">
                  ({l.createdAt.slice(0, 10)}) — {l.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. Business Access & Public Review Route Accessibility Matrix
   ========================================================================== */
function BusinessAccessPanel({
  subscriptions,
  organizations,
  plans,
  onRefresh,
  onNotify,
}: {
  subscriptions: AdminSubscriptionView[];
  organizations: AdminOrgSummary[];
  plans: AdminPlanView[];
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null);

  const quickToggle = async (sub: AdminSubscriptionView) => {
    const isSuspend = sub.isUsable;
    const reason = isSuspend
      ? "Super Admin suspended public review access"
      : "Super Admin restored business access (+30d)";
    setBusyOrgId(sub.organizationId);
    try {
      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: sub.organizationId,
          action: isSuspend ? "suspend" : "activate_manual",
          planId: sub.planId,
          reason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      onNotify(
        "ok",
        `${isSuspend ? "Paused" : "Restored"} public access for ${sub.organizationName}.`
      );
      await onRefresh();
    } catch (e) {
      onNotify("err", (e as Error).message);
    } finally {
      setBusyOrgId(null);
    }
  };

  return (
    <div className="rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
              <th className="py-3 px-4 font-medium">Workspace &amp; Businesses</th>
              <th className="py-3 px-4 font-medium">Plan &amp; Limits Usage</th>
              <th className="py-3 px-4 font-medium">Public /r/[slug] Gate</th>
              <th className="py-3 px-4 font-medium text-right">Quick Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {subscriptions.map((sub) => {
              const org = organizations.find((o) => o.id === sub.organizationId);
              const plan = plans.find((p) => p.id === sub.planId);
              const maxLoc =
                sub.customOverrides?.maxLocations ?? plan?.maxLocations ?? 1;
              const maxTeam =
                sub.customOverrides?.maxTeamMembers ?? plan?.maxTeamMembers ?? 1;
              const maxCards =
                sub.customOverrides?.maxCards ?? plan?.maxCards ?? 5;
              return (
                <tr key={sub.id}>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-ink">{sub.organizationName}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(org?.businesses ?? []).map((b) => (
                        <a
                          key={b.id}
                          href={`/r/${b.publicSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-cobalt-700 hover:underline"
                        >
                          <span>/r/{b.publicSlug}</span>
                          <ArrowUpRightIcon size={11} />
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-ink-secondary">
                    <p className="font-medium text-ink">{sub.planName}</p>
                    <p className="text-[11px]">
                      Locs {org?.businesses.length ?? 0}/{fmtLimit(maxLoc)} · Team{" "}
                      {org?.users.length ?? 0}/{fmtLimit(maxTeam)} · Cards{" "}
                      {org?.stats.activeCards ?? 0}/{fmtLimit(maxCards)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {sub.isUsable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckIcon size={11} /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                        Blocked ({sub.status})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      disabled={busyOrgId === sub.organizationId}
                      onClick={() => void quickToggle(sub)}
                      className={`rounded-control border px-3 py-1.5 text-[11px] font-medium disabled:opacity-50 ${
                        sub.isUsable
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {sub.isUsable ? "Suspend Access" : "Activate 30d"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   5. Payment Transactions & Refund/Status Reconciliation
   ========================================================================== */
function PaymentsPanel({
  payments,
  onRefresh,
  onNotify,
}: {
  payments: AdminPaymentView[];
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<
    "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED"
  >("REFUNDED");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const applyStatus = async (paymentId: string) => {
    if (reason.trim().length < 3) {
      onNotify("err", "Provide a refund / status audit reason.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: nextStatus, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setEditingId(null);
      setReason("");
      onNotify("ok", `Marked payment ${nextStatus}.`);
      await onRefresh();
    } catch (e) {
      onNotify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
              <th className="py-3 px-4 font-medium">Invoice / Date</th>
              <th className="py-3 px-4 font-medium">Workspace / Plan</th>
              <th className="py-3 px-4 font-medium">Razorpay IDs</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Reconcile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-ink-muted">
                  No payment records recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-mono font-medium text-ink">
                      {p.invoiceNumber || p.id.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {p.createdAt.slice(0, 16).replace("T", " ")}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-ink">{p.organizationName}</p>
                    <p className="text-[11px] text-ink-muted">
                      {p.planName} ({p.billingInterval})
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-ink-secondary">
                    <p>Order: {p.gatewayOrderId || "—"}</p>
                    <p>Pay: {p.gatewayPaymentId || "—"}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold tabular-nums text-ink">
                    ₹{p.amountInr.toLocaleString("en-IN")}
                    {p.discountAmountInr > 0 && (
                      <p className="text-[10px] font-normal text-emerald-700">
                        -{p.discountAmountInr} ({p.couponCode})
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        PAY_STATUS_PILL[p.status] ?? PAY_STATUS_PILL.PENDING
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.failureReason && (
                      <p className="text-[10px] text-red-600 mt-0.5 max-w-[160px] truncate">
                        {p.failureReason}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === p.id ? (
                      <div className="inline-flex flex-col gap-1.5 text-left min-w-[200px]">
                        <select
                          value={nextStatus}
                          onChange={(e) =>
                            setNextStatus(e.target.value as typeof nextStatus)
                          }
                          className="rounded border border-black/[0.12] px-2 py-1 text-[11px]"
                        >
                          <option value="REFUNDED">REFUNDED</option>
                          <option value="PARTIALLY_REFUNDED">
                            PARTIALLY_REFUNDED
                          </option>
                          <option value="FAILED">FAILED</option>
                        </select>
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Audit reason…"
                          className="rounded border border-black/[0.12] px-2 py-1 text-[11px]"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void applyStatus(p.id)}
                            className="rounded bg-cobalt-600 text-white px-2.5 py-1 text-[11px]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded border border-black/[0.12] px-2 py-1 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="rounded-control border border-black/[0.12] px-2.5 py-1 text-[11px] hover:bg-canvas"
                      >
                        Update status
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   6. Coupons & Promo Discounts CRUD
   ========================================================================== */
function CouponsPanel({
  coupons,
  plans,
  onRefresh,
  onNotify,
}: {
  coupons: CouponRecord[];
  plans: AdminPlanView[];
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat">(
    "percent"
  );
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: Number(discountValue),
          eligiblePlans: plans
            .filter((p) => !p.customPrice && p.slug !== "trial")
            .map((p) => p.slug),
          maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
          expiresAt: expiresAt.trim()
            ? new Date(expiresAt).toISOString()
            : null,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create coupon");
      setCode("");
      onNotify("ok", `Created coupon ${json.coupon.code}.`);
      await onRefresh();
    } catch (e) {
      onNotify("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removeCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onNotify("ok", "Deleted coupon.");
      await onRefresh();
    } catch (e) {
      onNotify("err", (e as Error).message);
    }
  };

  const cls =
    "w-full min-h-[36px] rounded-control border border-black/[0.12] bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <div className="grid lg:grid-cols-12 gap-5 items-start">
      <form
        onSubmit={createCoupon}
        className="lg:col-span-5 rounded-card bg-white border border-black/[0.09] p-5 space-y-3 shadow-panel"
      >
        <h3 className="font-display text-sm font-semibold text-ink">
          Create Promo Coupon
        </h3>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Coupon Code
          </label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LAUNCH20"
            className={`${cls} font-mono uppercase`}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Type
            </label>
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value as "percent" | "flat")
              }
              className={cls}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Value
            </label>
            <input
              type="number"
              min={1}
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className={cls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Max Redemptions
            </label>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
              className={cls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">
              Expires At (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={cls}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Coupon"}
        </button>
      </form>

      <div className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
              <th className="py-3 px-4 font-medium">Code</th>
              <th className="py-3 px-4 font-medium">Discount</th>
              <th className="py-3 px-4 font-medium">Usage</th>
              <th className="py-3 px-4 font-medium">Expires</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-muted">
                  No promo coupons created yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-mono font-semibold text-ink">
                    {c.code}
                  </td>
                  <td className="py-3 px-4">
                    {c.discountType === "percent"
                      ? `${c.discountValue}% off`
                      : `₹${c.discountValue} off`}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-ink-secondary">
                    {c.redemptionCount}
                    {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : " uses"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-ink-muted">
                    {c.expiresAt ? c.expiresAt.slice(0, 10) : "Never"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => void removeCoupon(c.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   7. Trial Management & Global Platform Billing Settings
   ========================================================================== */
function PlatformSettingsPanel({
  settings,
  onRefresh,
  onNotify,
}: {
  settings: PlatformBillingSettings;
  onRefresh: () => Promise<void>;
  onNotify: (type: "ok" | "err", msg: string) => void;
}) {
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(
    settings.gracePeriodDays
  );
  const [reminderDaysText, setReminderDaysText] = useState(
    settings.reminderDays.join(", ")
  );
  const [annualBillingEnabled, setAnnualBillingEnabled] = useState(
    settings.annualBillingEnabled
  );
  const [taxRatePercent, setTaxRatePercent] = useState<number>(
    settings.taxRatePercent
  );
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const reminderDays = reminderDaysText
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 60);

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gracePeriodDays: Math.max(0, Number(gracePeriodDays) || 0),
          reminderDays,
          annualBillingEnabled,
          taxRatePercent: Math.max(0, Number(taxRatePercent) || 0),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update settings");
      onNotify("ok", "Updated platform billing settings.");
      await onRefresh();
    } catch (e) {
      onNotify("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full min-h-[38px] rounded-control border border-black/[0.12] bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <form
      onSubmit={save}
      className="max-w-2xl rounded-card bg-white border border-black/[0.09] p-6 space-y-4 shadow-panel"
    >
      <div>
        <h3 className="font-display text-base font-semibold text-ink">
          Platform Expiry, Grace Period &amp; Billing Policy
        </h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Controls server-side expiry lock across `/r/[slug]`, `/t/[cardId]`, `/api/feedback`, `/api/events`, and `/api/qr/[slug]`.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Grace Period Days (0 = lock immediately at expiry)
          </label>
          <input
            type="number"
            min={0}
            max={90}
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Renewal Reminder Days Before Expiry (comma-separated)
          </label>
          <input
            value={reminderDaysText}
            onChange={(e) => setReminderDaysText(e.target.value)}
            placeholder="7, 3, 1"
            className={cls}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            GST / Tax Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={50}
            step="0.5"
            value={taxRatePercent}
            onChange={(e) => setTaxRatePercent(Number(e.target.value))}
            className={`${cls} tabular-nums`}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2 text-xs text-ink">
            <input
              type="checkbox"
              checked={annualBillingEnabled}
              onChange={(e) => setAnnualBillingEnabled(e.target.checked)}
            />
            <span>Enable annual billing discount option</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Platform Settings"}
      </button>
    </form>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-4 shadow-panel">
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <p
        className={`font-display text-2xl font-semibold mt-1 tabular-nums ${
          accent ? "text-cobalt-700" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-ink-secondary mt-1">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-control bg-white border border-black/[0.08] px-3.5 py-2.5">
      <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="font-display text-lg font-semibold text-ink tabular-nums">
        {value}
      </p>
    </div>
  );
}
