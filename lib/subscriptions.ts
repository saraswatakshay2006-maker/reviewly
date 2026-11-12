import type {
  OrganizationSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./types";

export const PLAN_DEFAULTS: Record<
  SubscriptionPlan,
  { label: string; monthlyPriceInr: number; cardLimit: number }
> = {
  trial: { label: "14-Day Trial", monthlyPriceInr: 0, cardLimit: 5 },
  starter: { label: "Starter", monthlyPriceInr: 999, cardLimit: 10 },
  growth: { label: "Growth", monthlyPriceInr: 2499, cardLimit: 35 },
  pro: { label: "Pro", monthlyPriceInr: 4999, cardLimit: 100 },
  enterprise: { label: "Enterprise", monthlyPriceInr: 9999, cardLimit: 999 },
};

export const SUBSCRIPTION_STATUSES: {
  id: SubscriptionStatus;
  label: string;
}[] = [
  { id: "trialing", label: "Trialing" },
  { id: "active", label: "Active" },
  { id: "past_due", label: "Past Due" },
  { id: "suspended", label: "Suspended" },
  { id: "cancelled", label: "Cancelled" },
];

export type EffectiveSubscriptionStatus = SubscriptionStatus | "expired";

export function resolveSubscription(org: {
  createdAt: string;
  subscription?: OrganizationSubscription;
}): OrganizationSubscription {
  if (org.subscription) return org.subscription;
  return {
    plan: "starter",
    status: "active",
    monthlyPriceInr: PLAN_DEFAULTS.starter.monthlyPriceInr,
    cardLimit: PLAN_DEFAULTS.starter.cardLimit,
    renewalDate: null,
    notes: "",
    updatedAt: org.createdAt,
  };
}

/**
 * Parses `renewalDate` (either full ISO timestamp or legacy `YYYY-MM-DD` date)
 * into a UTC epoch millisecond timestamp representing the exact expiry moment.
 */
export function parseRenewalTimestamp(
  renewalDate: string | null | undefined
): number | null {
  if (!renewalDate) return null;
  const trimmed = renewalDate.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const endOfDay = Date.parse(`${trimmed}T23:59:59.999Z`);
    return Number.isFinite(endOfDay) ? endOfDay : null;
  }
  const ts = Date.parse(trimmed);
  return Number.isFinite(ts) ? ts : null;
}

export function isSubscriptionExpired(
  sub: Pick<OrganizationSubscription, "renewalDate">,
  nowMs: number = Date.now()
): boolean {
  const expiresAt = parseRenewalTimestamp(sub.renewalDate);
  return expiresAt !== null && nowMs > expiresAt;
}

export function isSubscriptionActive(
  subOrStatus: SubscriptionStatus | OrganizationSubscription,
  nowMs: number = Date.now()
): boolean {
  if (typeof subOrStatus === "string") {
    return subOrStatus !== "suspended" && subOrStatus !== "cancelled";
  }
  return (
    subOrStatus.status !== "suspended" &&
    subOrStatus.status !== "cancelled" &&
    !isSubscriptionExpired(subOrStatus, nowMs)
  );
}

export function formatSubscriptionCountdown(
  renewalDate: string | null | undefined,
  nowMs: number = Date.now()
): {
  hasExpiry: boolean;
  expired: boolean;
  expiresAtMs: number | null;
  remainingMs: number | null;
  countdownLabel: string;
} {
  const expiresAtMs = parseRenewalTimestamp(renewalDate);
  if (expiresAtMs === null) {
    return {
      hasExpiry: false,
      expired: false,
      expiresAtMs: null,
      remainingMs: null,
      countdownLabel: "No fixed expiry date",
    };
  }

  const remainingMs = expiresAtMs - nowMs;
  if (remainingMs <= 0) {
    const elapsedMs = Math.abs(remainingMs);
    const totalMinutes = Math.floor(elapsedMs / 60_000);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    const remMinutes = totalMinutes % 60;

    let countdownLabel = "Expired just now";
    if (days >= 1) {
      countdownLabel = `Expired ${days}d ${remHours}h ago`;
    } else if (totalHours >= 1) {
      countdownLabel = `Expired ${totalHours}h ${remMinutes}m ago`;
    } else if (totalMinutes >= 1) {
      countdownLabel = `Expired ${totalMinutes}m ago`;
    }

    return {
      hasExpiry: true,
      expired: true,
      expiresAtMs,
      remainingMs,
      countdownLabel,
    };
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMinutes = totalMinutes % 60;

  let countdownLabel: string;
  if (days >= 1) {
    countdownLabel = `${days}d ${remHours}h remaining`;
  } else if (totalHours >= 1) {
    countdownLabel = `${totalHours}h ${remMinutes}m remaining`;
  } else {
    countdownLabel = `${Math.max(1, totalMinutes)}m remaining`;
  }

  return {
    hasExpiry: true,
    expired: false,
    expiresAtMs,
    remainingMs,
    countdownLabel,
  };
}

export function getSubscriptionHealth(
  sub: OrganizationSubscription,
  nowMs: number = Date.now()
) {
  const pausedByAdmin =
    sub.status === "suspended" || sub.status === "cancelled";
  const countdown = formatSubscriptionCountdown(sub.renewalDate, nowMs);
  const expired = countdown.expired;
  const isUsable = !pausedByAdmin && !expired;
  const effectiveStatus: EffectiveSubscriptionStatus = pausedByAdmin
    ? sub.status
    : expired
    ? "expired"
    : sub.status;
  const expiringSoon =
    isUsable &&
    countdown.remainingMs !== null &&
    countdown.remainingMs <= 3 * 24 * 60 * 60 * 1000;

  return {
    effectiveStatus,
    pausedByAdmin,
    isUsable,
    expiringSoon,
    ...countdown,
  };
}

export function createDefaultTrialSubscription(): OrganizationSubscription {
  const now = new Date();
  const renewal = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    plan: "trial",
    status: "trialing",
    monthlyPriceInr: PLAN_DEFAULTS.trial.monthlyPriceInr,
    cardLimit: PLAN_DEFAULTS.trial.cardLimit,
    renewalDate: renewal.toISOString(),
    notes: "",
    updatedAt: now.toISOString(),
  };
}
