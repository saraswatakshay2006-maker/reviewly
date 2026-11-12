"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  LockIcon,
  RefreshIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "./Icons";
import type { CheckoutQuote } from "@/lib/billing";
import type {
  BillingInterval,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (resp: Record<string, unknown>) => void) => void;
    };
  }
}

export interface BillingOverviewPayload {
  razorpayConfigured: boolean;
  organization: { id: string; name: string; slug: string };
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: SubscriptionStatus;
    effectiveStatus: SubscriptionStatus;
    paymentStatus: string;
    billingInterval: BillingInterval;
    amountInr: number;
    startAt: string;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    expired: boolean;
    inGracePeriod: boolean;
    isUsable: boolean;
    remainingDays: number | null;
    countdownLabel: string;
    supportTier: string;
  };
  limits: {
    locations: {
      used: number;
      limit: number;
      isUnlimited: boolean;
      atOrOverLimit: boolean;
      overLimit: boolean;
      percent: number;
    };
    teamMembers: {
      used: number;
      limit: number;
      isUnlimited: boolean;
      atOrOverLimit: boolean;
      overLimit: boolean;
      percent: number;
    };
    cards: {
      used: number;
      limit: number;
      isUnlimited: boolean;
      atOrOverLimit: boolean;
      overLimit: boolean;
      percent: number;
    };
  };
  currentFeatures: {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
    implemented: boolean;
    availabilityStatus: string;
  }[];
  plans: {
    id: string;
    slug: string;
    name: string;
    badge: string;
    description: string;
    monthlyPriceInr: number;
    annualPriceInr: number | null;
    customPrice: boolean;
    maxLocations: number;
    maxTeamMembers: number;
    maxCards: number;
    supportTier: string;
    isPopular: boolean;
    highlights: string[];
  }[];
  payments: {
    id: string;
    planId: string;
    planName: string;
    billingInterval: BillingInterval;
    couponCode: string | null;
    discountAmountInr: number;
    taxAmountInr: number;
    amountInr: number;
    gateway: "razorpay" | "manual";
    gatewayPaymentId: string | null;
    gatewayOrderId: string | null;
    status: PaymentStatus;
    paymentMethod: string | null;
    invoiceNumber: string | null;
    failureReason: string | null;
    paidAt: string | null;
    createdAt: string;
  }[];
  settings: {
    gracePeriodDays: number;
    reminderDays: number[];
    annualBillingEnabled: boolean;
    taxRatePercent: number;
  };
}

type BillingTab = "plan" | "usage" | "upgrade" | "history" | "invoices";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trialing: "bg-cobalt-50 text-cobalt-700 border-cobalt-200",
  past_due: "bg-amber-50 text-amber-800 border-amber-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-surface-subtle text-ink-muted border-black/10",
};

const PAY_BADGE: Record<PaymentStatus, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
  PARTIALLY_REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Ongoing / No fixed expiry";
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPortalClient({
  initialOverview,
  canManageBilling,
  initialTab = "plan",
}: {
  initialOverview: BillingOverviewPayload;
  canManageBilling: boolean;
  initialTab?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<BillingOverviewPayload>(initialOverview);
  const validTab = (["plan", "usage", "upgrade", "history", "invoices"].includes(
    initialTab
  )
    ? initialTab
    : "plan") as BillingTab;
  const [tab, setTab] = useState<BillingTab>(validTab);
  const [interval, setInterval] = useState<"monthly" | "annual">(
    initialOverview.subscription.billingInterval === "annual"
      ? "annual"
      : "monthly"
  );
  const [couponCode, setCouponCode] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
  };

  const reloadOverview = useCallback(async () => {
    const res = await fetch("/api/billing/overview", { cache: "no-store" });
    const json = await res.json();
    if (res.ok && json.ok) {
      setData(json);
    }
    router.refresh();
  }, [router]);

  const fetchQuote = useCallback(
    async (planId: string, billInterval: "monthly" | "annual", code: string) => {
      setSelectedPlanId(planId);
      setLoadingQuote(true);
      setToast(null);
      try {
        const res = await fetch("/api/billing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            billingInterval: billInterval,
            couponCode: code.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not calculate quote");
        setQuote(json.quote);
      } catch (e) {
        setQuote(null);
        notify("err", (e as Error).message);
      } finally {
        setLoadingQuote(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedPlanId) {
      void fetchQuote(selectedPlanId, interval, couponCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]);

  const startRazorpayCheckout = async () => {
    if (!quote || !canManageBilling) return;
    setCheckingOut(true);
    setToast(null);
    try {
      const orderRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: quote.planId,
          billingInterval: interval,
          couponCode: couponCode.trim() || null,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderJson.error || "Could not create checkout order");
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error(
          "Could not load Razorpay Checkout script. Check your network connection."
        );
      }

      const rzp = new window.Razorpay({
        key: orderJson.keyId,
        amount: orderJson.amountPaise,
        currency: orderJson.currency,
        name: "Reviewly",
        description: `${quote.planName} (${interval})`,
        order_id: orderJson.orderId,
        prefill: orderJson.prefill,
        theme: { color: "#1A4BE0" },
        handler: async (response: Record<string, unknown>) => {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(
                verifyJson.error || "Payment verification failed"
              );
            }
            setQuote(null);
            setSelectedPlanId(null);
            setCouponCode("");
            await reloadOverview();
            setTab("plan");
            notify(
              "ok",
              `Payment verified! Your ${quote.planName} subscription is now active.`
            );
          } catch (err) {
            notify("err", (err as Error).message);
          } finally {
            setCheckingOut(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCheckingOut(false);
          },
        },
      });

      rzp.on("payment.failed", async (resp: Record<string, unknown>) => {
        const errMeta = resp.error as { description?: string } | undefined;
        await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderJson.orderId,
            failed: true,
            failureReason: errMeta?.description || "Payment failed in checkout",
          }),
        }).catch(() => {});
        setCheckingOut(false);
        await reloadOverview();
        notify("err", errMeta?.description || "Payment failed.");
      });

      rzp.open();
    } catch (e) {
      setCheckingOut(false);
      notify("err", (e as Error).message);
    }
  };

  const handleCancelSubscription = async () => {
    if (!canManageBilling) return;
    if (
      !window.confirm(
        "Cancel your subscription at the end of the current billing period? You will retain access until the paid-through date."
      )
    ) {
      return;
    }
    setCancelling(true);
    setToast(null);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel subscription");
      await reloadOverview();
      notify(
        "ok",
        "Subscription marked to cancel at period end. Access stays active until your expiry date."
      );
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const sub = data.subscription;
  const startMs = Date.parse(sub.currentPeriodStart);
  const endMs = sub.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) : NaN;
  const cycleProgressPct =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
      ? Math.max(
          0,
          Math.min(100, Math.round(((Date.now() - startMs) / (endMs - startMs)) * 100))
        )
      : 0;

  const invoices = data.payments.filter(
    (p) =>
      p.status === "SUCCESS" ||
      p.status === "REFUNDED" ||
      p.status === "PARTIALLY_REFUNDED"
  );

  const subTabs: { id: BillingTab; label: string }[] = [
    { id: "plan", label: "My Plan" },
    { id: "usage", label: "Usage & Limits" },
    { id: "upgrade", label: "Upgrade / Renew" },
    { id: "history", label: `Payment History (${data.payments.length})` },
    { id: "invoices", label: `Invoices (${invoices.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] pb-3">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-control px-3.5 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-cobalt-600 text-white"
                : "bg-white border border-black/[0.09] text-ink-secondary hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void reloadOverview()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-control border border-black/[0.09] bg-white px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink"
        >
          <RefreshIcon size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {toast && (
        <div
          role={toast.type === "err" ? "alert" : "status"}
          className={`rounded-card border px-4 py-3 text-xs font-medium ${
            toast.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.text}
        </div>
      )}

      {!data.razorpayConfigured && (
        <div className="rounded-card border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
          Online Razorpay checkout requires{" "}
          <code className="font-mono">RAZORPAY_KEY_ID</code>,{" "}
          <code className="font-mono">RAZORPAY_KEY_SECRET</code>, and{" "}
          <code className="font-mono">RAZORPAY_WEBHOOK_SECRET</code> to be set in environment variables.
        </div>
      )}

      {/* TAB 1: MY PLAN */}
      {tab === "plan" && (
        <div className="space-y-5">
          {sub.isUsable && sub.remainingDays !== null && (
            <div
              className={`rounded-card border px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-2 ${
                sub.remainingDays <= 3
                  ? "border-amber-200 bg-amber-50/80 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/70 text-emerald-900"
              }`}
            >
              <span>
                <strong>
                  {sub.remainingDays === 1 ? "1 day left" : `${sub.remainingDays} days left`}
                </strong>{" "}
                in your current {sub.planName} period
                {sub.currentPeriodEnd ? ` (renews/expires ${fmtDate(sub.currentPeriodEnd)})` : ""}.
                After expiry, your public review page stops automatically until renewed.
              </span>
              <span className="font-semibold tabular-nums">
                {sub.countdownLabel}
              </span>
            </div>
          )}

          {!sub.isUsable && (
            <div className="rounded-card border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-900 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Subscription expired</strong> — your public customer review page is paused until you renew or upgrade below.
              </span>
            </div>
          )}

          <section className="rounded-card bg-white border border-black/[0.09] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Current Plan
                </p>
                <div className="flex items-center gap-2.5 flex-wrap mt-1">
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    {sub.planName}
                  </h2>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      STATUS_STYLES[sub.effectiveStatus]
                    }`}
                  >
                    {sub.effectiveStatus.replace("_", " ")}
                  </span>
                  {sub.cancelAtPeriodEnd && sub.isUsable && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                      Cancels on {fmtDate(sub.currentPeriodEnd)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-secondary mt-1 tabular-nums">
                  {sub.amountInr > 0
                    ? `₹${sub.amountInr.toLocaleString("en-IN")} / ${
                        sub.billingInterval === "annual" ? "year" : "month"
                      }`
                    : sub.planId === "trial"
                    ? "Free 14-day evaluation trial"
                    : "Custom plan pricing"}
                  {" · "}
                  {sub.supportTier}
                </p>
              </div>

              {canManageBilling && (
                <div className="flex flex-wrap items-center gap-2">
                  {sub.planId !== "trial" && sub.planId !== "enterprise" && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab("upgrade");
                        void fetchQuote(sub.planId, interval, couponCode);
                      }}
                      className="rounded-control border border-black/[0.12] bg-canvas hover:bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-ink"
                    >
                      Renew current plan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTab("upgrade")}
                    className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-semibold text-white"
                  >
                    {sub.isUsable ? "Upgrade Plan" : "Renew / Reactivate"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <CalendarIcon size={12} />
                  <span>Start Date</span>
                </p>
                <p className="text-sm font-semibold text-ink mt-1">
                  {fmtDate(sub.startAt)}
                </p>
              </div>
              <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <CalendarIcon size={12} />
                  <span>Expires / Renews On</span>
                </p>
                <p className="text-sm font-semibold text-ink mt-1">
                  {fmtDate(sub.currentPeriodEnd)}
                </p>
              </div>
              <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <ClockIcon size={12} />
                  <span>Days Left / Time Remaining</span>
                </p>
                <p
                  className={`text-sm font-semibold mt-1 tabular-nums ${
                    sub.expired ? "text-red-700" : "text-ink"
                  }`}
                >
                  {sub.isUsable && sub.currentPeriodEnd && sub.remainingDays !== null
                    ? `${sub.remainingDays} ${sub.remainingDays === 1 ? "day" : "days"} left`
                    : sub.countdownLabel}
                </p>
                {sub.isUsable && sub.currentPeriodEnd && (
                  <p className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                    {sub.countdownLabel}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <ShieldCheckIcon size={12} />
                  <span>Billing Cycle</span>
                </p>
                <p className="text-sm font-semibold text-ink mt-1 capitalize">
                  {sub.billingInterval}
                </p>
              </div>
            </div>

            {sub.currentPeriodEnd && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Current cycle elapsed</span>
                  <span className="tabular-nums">{cycleProgressPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sub.expired ? "bg-red-500" : "bg-cobalt-600"
                    }`}
                    style={{ width: `${cycleProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {canManageBilling && sub.isUsable && sub.status === "active" && !sub.cancelAtPeriodEnd && (
              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  Need to stop automatic future billing? Cancelling preserves your access through {fmtDate(sub.currentPeriodEnd)}.
                </p>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancelSubscription()}
                  className="text-xs font-medium text-red-600 hover:text-red-700 shrink-0 disabled:opacity-50"
                >
                  {cancelling ? "Cancelling…" : "Cancel subscription"}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-card bg-white border border-black/[0.09] p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-ink">
              Feature Entitlements ({sub.planName})
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.currentFeatures.map((f) => (
                <div
                  key={f.key}
                  className={`rounded-xl border px-3.5 py-3 flex items-start justify-between gap-3 ${
                    f.enabled
                      ? "bg-canvas border-black/[0.07]"
                      : "bg-surface-subtle/50 border-black/[0.05] opacity-80"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-ink">{f.label}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{f.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      f.enabled
                        ? "bg-emerald-50 text-emerald-700"
                        : f.availabilityStatus === "coming_soon"
                        ? "bg-amber-50 text-amber-800"
                        : f.availabilityStatus === "integration_required"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-surface-subtle text-ink-muted"
                    }`}
                  >
                    {f.enabled
                      ? "Active"
                      : f.availabilityStatus === "coming_soon"
                      ? "Coming soon"
                      : f.availabilityStatus === "integration_required"
                      ? "Integration required"
                      : "Upgrade required"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: USAGE & LIMITS */}
      {tab === "usage" && (
        <section className="rounded-card bg-white border border-black/[0.09] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Resource Usage &amp; Plan Limits
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Live usage counters for {data.organization.name} on {sub.planName}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab("upgrade")}
              className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3.5 py-2 text-xs font-semibold text-white"
            >
              Upgrade Plan
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: "Business Locations",
                icon: BuildingIcon,
                metric: data.limits.locations,
                hint: "Starter: 1 · Growth: 3 · Pro: 5",
              },
              {
                label: "Team Members",
                icon: UsersIcon,
                metric: data.limits.teamMembers,
                hint: "Starter: 1 · Growth: 5 · Pro: 10",
              },
              {
                label: "Active NFC / QR Cards",
                icon: CreditCardIcon,
                metric: data.limits.cards,
                hint: "Starter: 10 · Growth: 35 · Pro: 100",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 space-y-3 ${
                    item.metric.overLimit
                      ? "border-red-200 bg-red-50/40"
                      : item.metric.atOrOverLimit
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-black/[0.08] bg-canvas"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                      <Icon size={14} className="text-cobalt-600" />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink tabular-nums">
                      {item.metric.used} /{" "}
                      {item.metric.isUnlimited ? "Unlimited" : item.metric.limit}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white border border-black/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.metric.overLimit
                          ? "bg-red-500"
                          : item.metric.atOrOverLimit
                          ? "bg-amber-500"
                          : "bg-cobalt-600"
                      }`}
                      style={{
                        width: item.metric.isUnlimited
                          ? "20%"
                          : `${item.metric.percent}%`,
                      }}
                    />
                  </div>
                  {item.metric.overLimit ? (
                    <p className="text-[11px] font-medium text-red-700">
                      Exceeds current plan limit by {item.metric.used - item.metric.limit}. Existing records are preserved, but new additions are blocked.
                    </p>
                  ) : item.metric.atOrOverLimit ? (
                    <p className="text-[11px] font-medium text-amber-800">
                      Limit reached ({item.hint}). Upgrade to expand.
                    </p>
                  ) : (
                    <p className="text-[11px] text-ink-muted">{item.hint}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: UPGRADE / RENEW */}
      {tab === "upgrade" && (
        <div className="space-y-6">
          <div className="rounded-card bg-white border border-black/[0.09] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {data.settings.annualBillingEnabled && (
                <div className="inline-flex rounded-control border border-black/[0.1] bg-canvas p-1">
                  <button
                    type="button"
                    onClick={() => setInterval("monthly")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      interval === "monthly"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-muted"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval("annual")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      interval === "annual"
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-muted"
                    }`}
                  >
                    Yearly Billing
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code (optional)"
                className="min-h-[36px] rounded-control border border-black/[0.12] bg-canvas px-3 text-xs text-ink outline-none focus:border-cobalt-600"
              />
              {selectedPlanId && (
                <button
                  type="button"
                  onClick={() =>
                    void fetchQuote(selectedPlanId, interval, couponCode)
                  }
                  className="min-h-[36px] rounded-control border border-black/[0.12] bg-white px-3 text-xs font-semibold text-ink hover:bg-surface-subtle"
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.plans.map((p) => {
              const isCurrent = p.id === sub.planId && sub.isUsable;
              const price =
                interval === "annual" && p.annualPriceInr
                  ? p.annualPriceInr
                  : p.monthlyPriceInr;
              return (
                <div
                  key={p.id}
                  className={`rounded-card bg-white p-5 flex flex-col justify-between gap-5 ${
                    p.isPopular
                      ? "border-2 border-cobalt-600 shadow-elevated"
                      : "border border-black/[0.09] shadow-panel"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          p.isPopular
                            ? "bg-cobalt-600 text-white"
                            : "bg-surface-subtle text-ink-secondary"
                        }`}
                      >
                        {p.isPopular ? "Most popular" : p.badge}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Current
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {p.name}
                      </h3>
                      {p.customPrice ? (
                        <p className="font-display text-2xl font-semibold text-ink mt-1">
                          Custom pricing
                        </p>
                      ) : (
                        <p className="font-display text-2xl font-semibold text-ink tabular-nums mt-1">
                          ₹{price.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-ink-muted">
                            /{interval === "annual" && p.annualPriceInr ? "year" : "mo"}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="text-[11px] text-ink-secondary space-y-1 pt-2 border-t border-black/[0.06]">
                      <p>
                        Locations:{" "}
                        <strong className="text-ink">
                          {p.maxLocations < 0 ? "Unlimited" : p.maxLocations}
                        </strong>{" "}
                        · Users:{" "}
                        <strong className="text-ink">
                          {p.maxTeamMembers < 0 ? "Unlimited" : p.maxTeamMembers}
                        </strong>
                      </p>
                      {p.highlights.slice(0, 5).map((h) => (
                        <p key={h} className="flex items-start gap-1.5">
                          <CheckIcon
                            size={12}
                            className="text-cobalt-600 shrink-0 mt-0.5"
                          />
                          <span>{h}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {p.customPrice ? (
                    <div className="rounded-control border border-black/[0.1] bg-canvas px-3 py-2 text-center text-xs font-medium text-ink-secondary">
                      Contact Super Admin for custom Enterprise terms
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canManageBilling || loadingQuote}
                      onClick={() => void fetchQuote(p.id, interval, couponCode)}
                      className={`min-h-[38px] rounded-control px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        p.isPopular
                          ? "bg-cobalt-600 hover:bg-cobalt-700 text-white"
                          : "border border-black/[0.12] bg-canvas hover:bg-surface-subtle text-ink"
                      }`}
                    >
                      {isCurrent ? "Renew Plan" : `Select ${p.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {quote && (
            <section className="rounded-card bg-white border-2 border-cobalt-600 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-ink">
                  Order Summary — {quote.planName} ({quote.billingInterval})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setQuote(null);
                    setSelectedPlanId(null);
                  }}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  Close
                </button>
              </div>

              {quote.couponError && (
                <p className="text-xs font-medium text-red-600">
                  {quote.couponError}
                </p>
              )}

              {quote.downgradeWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Lower plan limit notice:</p>
                  {quote.downgradeWarnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-canvas border border-black/[0.06] p-4 space-y-2 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Plan price</span>
                  <span className="font-medium text-ink">
                    ₹{quote.baseAmountInr.toLocaleString("en-IN")}
                  </span>
                </div>
                {quote.prorationCreditInr > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Unused cycle proration credit</span>
                    <span>-₹{quote.prorationCreditInr.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {quote.discountAmountInr > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon ({quote.couponCode})</span>
                    <span>-₹{quote.discountAmountInr.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {quote.taxAmountInr > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">
                      Tax / GST ({quote.taxRatePercent}%)
                    </span>
                    <span>₹{quote.taxAmountInr.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-black/[0.08] text-sm font-semibold text-ink">
                  <span>Total payable</span>
                  <span>₹{quote.totalAmountInr.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={checkingOut || !data.razorpayConfigured}
                onClick={() => void startRazorpayCheckout()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <LockIcon size={15} />
                <span>
                  {checkingOut
                    ? "Opening Razorpay…"
                    : `Pay ₹${quote.totalAmountInr.toLocaleString("en-IN")} with Razorpay`}
                </span>
              </button>
            </section>
          )}
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {tab === "history" && (
        <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden">
          {data.payments.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-muted">
              No online payment transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-canvas text-ink-muted">
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Transaction ID</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] tabular-nums">
                  {data.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 text-ink-secondary">
                        {fmtDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-ink">
                        {p.gatewayPaymentId || p.gatewayOrderId || p.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-ink">
                        {p.planName} ({p.billingInterval})
                      </td>
                      <td className="py-3 px-4 uppercase text-ink-secondary">
                        {p.paymentMethod || p.gateway}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink">
                        ₹{p.amountInr.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            PAY_BADGE[p.status]
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === "SUCCESS" || p.invoiceNumber ? (
                          <a
                            href={`/api/billing/invoices/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-cobalt-600 hover:text-cobalt-700"
                          >
                            <span>{p.invoiceNumber || "View"}</span>
                            <ArrowUpRightIcon size={12} />
                          </a>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: INVOICES */}
      {tab === "invoices" && (
        <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-muted">
              No invoices available yet. Invoices are issued automatically once a Razorpay payment succeeds.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {inv.invoiceNumber || inv.id} · {inv.planName} Plan
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                      Paid on {fmtDate(inv.paidAt || inv.createdAt)} · ₹
                      {inv.amountInr.toLocaleString("en-IN")} ({inv.billingInterval})
                    </p>
                  </div>
                  <a
                    href={`/api/billing/invoices/${inv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-control border border-black/[0.12] bg-canvas hover:bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-ink"
                  >
                    <span>Open / Print Invoice</span>
                    <ArrowUpRightIcon size={13} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

