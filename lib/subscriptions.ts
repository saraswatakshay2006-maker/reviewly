import type {
  OrganizationSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./types";

export interface PlanFeatureFlags {
  nfcAndQr: boolean;
  digitalReviewPage: boolean;
  tapAndScanAnalytics: boolean;
  privateFeedback: boolean;
  advancedAnalytics: boolean;
  feedbackMonitoringAndReplies: boolean;
  aiResponseAssist: boolean;
  feedbackInsights: boolean;
  monthlyReport: boolean;
  branchReports: boolean;
  exportReports: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  label: string;
  badge: string;
  tagline: string;
  monthlyPriceInr: number;
  customPrice?: boolean;
  cardLimit: number;
  locationLimit: number;
  teamLimit: number;
  supportTier: string;
  features: PlanFeatureFlags;
  highlights: string[];
}

export const PLAN_DEFAULTS: Record<SubscriptionPlan, PlanDefinition> = {
  trial: {
    id: "trial",
    label: "14-Day Trial",
    badge: "Free evaluation",
    tagline: "Evaluate Reviewly with single-location NFC/QR and feedback tracking.",
    monthlyPriceInr: 0,
    cardLimit: 5,
    locationLimit: 1,
    teamLimit: 1,
    supportTier: "Basic support",
    features: {
      nfcAndQr: true,
      digitalReviewPage: true,
      tapAndScanAnalytics: true,
      privateFeedback: true,
      advancedAnalytics: false,
      feedbackMonitoringAndReplies: true,
      aiResponseAssist: false,
      feedbackInsights: false,
      monthlyReport: false,
      branchReports: false,
      exportReports: false,
      customBranding: false,
      whiteLabel: false,
    },
    highlights: [
      "1 business location",
      "Up to 5 NFC / QR cards",
      "Digital review page & basic analytics",
      "Customer feedback collection",
      "1 admin account",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    badge: "Entry plan",
    tagline: "For small shops, salons and single-location gyms.",
    monthlyPriceInr: 299,
    cardLimit: 10,
    locationLimit: 1,
    teamLimit: 1,
    supportTier: "Basic support",
    features: {
      nfcAndQr: true,
      digitalReviewPage: true,
      tapAndScanAnalytics: true,
      privateFeedback: true,
      advancedAnalytics: false,
      feedbackMonitoringAndReplies: false,
      aiResponseAssist: false,
      feedbackInsights: false,
      monthlyReport: false,
      branchReports: false,
      exportReports: false,
      customBranding: false,
      whiteLabel: false,
    },
    highlights: [
      "1 business location",
      "NFC + QR review system (up to 10 active cards)",
      "Digital review page",
      "Basic review dashboard",
      "Tap and scan analytics",
      "Customer feedback collection",
      "1 admin account",
      "Basic support",
    ],
  },
  growth: {
    id: "growth",
    label: "Growth",
    badge: "Most popular",
    tagline: "For established gyms, cafés, clinics and salons.",
    monthlyPriceInr: 799,
    cardLimit: 35,
    locationLimit: 3,
    teamLimit: 5,
    supportTier: "Priority support",
    features: {
      nfcAndQr: true,
      digitalReviewPage: true,
      tapAndScanAnalytics: true,
      privateFeedback: true,
      advancedAnalytics: true,
      feedbackMonitoringAndReplies: true,
      aiResponseAssist: true,
      feedbackInsights: true,
      monthlyReport: true,
      branchReports: false,
      exportReports: false,
      customBranding: false,
      whiteLabel: false,
    },
    highlights: [
      "Everything in Starter",
      "Up to 3 business locations",
      "Up to 5 team members",
      "Up to 35 active NFC / QR cards",
      "Advanced review analytics",
      "Feedback monitoring & internal reply notes",
      "AI-assisted review & reply responses",
      "Customer feedback insights",
      "Monthly performance report",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    badge: "Advanced plan",
    tagline: "For multi-branch businesses and larger operations.",
    monthlyPriceInr: 1499,
    cardLimit: 100,
    locationLimit: 5,
    teamLimit: 10,
    supportTier: "Priority assistance",
    features: {
      nfcAndQr: true,
      digitalReviewPage: true,
      tapAndScanAnalytics: true,
      privateFeedback: true,
      advancedAnalytics: true,
      feedbackMonitoringAndReplies: true,
      aiResponseAssist: true,
      feedbackInsights: true,
      monthlyReport: true,
      branchReports: true,
      exportReports: true,
      customBranding: true,
      whiteLabel: false,
    },
    highlights: [
      "Everything in Growth",
      "Up to 5 business locations",
      "Up to 10 team members",
      "Up to 100 active NFC / QR cards",
      "Branch-wise performance reports",
      "Exportable CSV reports",
      "Advanced branding (custom logo & brand color)",
      "Priority assistance",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    badge: "Custom",
    tagline: "For franchises, agencies and large chains.",
    monthlyPriceInr: 0,
    customPrice: true,
    cardLimit: 999,
    locationLimit: 25,
    teamLimit: 50,
    supportTier: "Dedicated support",
    features: {
      nfcAndQr: true,
      digitalReviewPage: true,
      tapAndScanAnalytics: true,
      privateFeedback: true,
      advancedAnalytics: true,
      feedbackMonitoringAndReplies: true,
      aiResponseAssist: true,
      feedbackInsights: true,
      monthlyReport: true,
      branchReports: true,
      exportReports: true,
      customBranding: true,
      whiteLabel: true,
    },
    highlights: [
      "Everything in Pro",
      "Custom business locations & team limits",
      "White-label branding (removes Reviewly footer)",
      "Custom NFC / QR card capacity",
      "Dedicated support",
    ],
  },
};

export const PUBLIC_PRICING_PLANS: SubscriptionPlan[] = [
  "starter",
  "growth",
  "pro",
  "enterprise",
];

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
}): Required<OrganizationSubscription> {
  if (org.subscription) {
    const def = PLAN_DEFAULTS[org.subscription.plan] ?? PLAN_DEFAULTS.starter;
    return {
      ...org.subscription,
      locationLimit: org.subscription.locationLimit ?? def.locationLimit,
      teamLimit: org.subscription.teamLimit ?? def.teamLimit,
    };
  }
  const starter = PLAN_DEFAULTS.starter;
  return {
    plan: "starter",
    status: "active",
    monthlyPriceInr: starter.monthlyPriceInr,
    cardLimit: starter.cardLimit,
    locationLimit: starter.locationLimit,
    teamLimit: starter.teamLimit,
    renewalDate: null,
    notes: "",
    updatedAt: org.createdAt,
  };
}

export function getPlanEntitlements(
  sub: Pick<
    OrganizationSubscription,
    "plan" | "cardLimit" | "locationLimit" | "teamLimit" | "monthlyPriceInr"
  >
): PlanDefinition {
  const def = PLAN_DEFAULTS[sub.plan] ?? PLAN_DEFAULTS.starter;
  return {
    ...def,
    monthlyPriceInr: sub.monthlyPriceInr ?? def.monthlyPriceInr,
    cardLimit: sub.cardLimit || def.cardLimit,
    locationLimit: sub.locationLimit ?? def.locationLimit,
    teamLimit: sub.teamLimit ?? def.teamLimit,
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
  const trial = PLAN_DEFAULTS.trial;
  return {
    plan: "trial",
    status: "trialing",
    monthlyPriceInr: trial.monthlyPriceInr,
    cardLimit: trial.cardLimit,
    locationLimit: trial.locationLimit,
    teamLimit: trial.teamLimit,
    renewalDate: renewal.toISOString(),
    notes: "",
    updatedAt: now.toISOString(),
  };
}
