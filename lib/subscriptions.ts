import type {
  BillingInterval,
  FeatureAvailabilityStatus,
  FeatureKey,
  OrganizationSubscription,
  PlanFeatureRecord,
  PlanRecord,
  PlatformBillingSettings,
  SubscriptionPlan,
  SubscriptionRecord,
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
  competitorTracking: boolean;
  apiAccess: boolean;
  externalGoogleReplySync: boolean;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  label: string;
  badge: string;
  tagline: string;
  monthlyPriceInr: number;
  annualPriceInr?: number | null;
  customPrice?: boolean;
  cardLimit: number;
  locationLimit: number;
  teamLimit: number;
  supportTier: string;
  features: PlanFeatureFlags;
  featureStatuses?: Partial<Record<FeatureKey, FeatureAvailabilityStatus>>;
  highlights: string[];
}

export const PLAN_DEFAULTS: Record<string, PlanDefinition> = {
  trial: {
    id: "trial",
    label: "14-Day Trial",
    badge: "Free evaluation",
    tagline: "Evaluate Reviewly with single-location NFC/QR and feedback tracking.",
    monthlyPriceInr: 0,
    annualPriceInr: null,
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
      competitorTracking: false,
      apiAccess: false,
      externalGoogleReplySync: false,
    },
    highlights: [
      "1 business location",
      "Up to 5 NFC / QR cards",
      "Digital review page & basic analytics",
      "Customer feedback collection",
      "1 user account",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    badge: "Entry plan",
    tagline: "For small shops, salons and single-location gyms.",
    monthlyPriceInr: 299,
    annualPriceInr: 2990,
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
      competitorTracking: false,
      apiAccess: false,
      externalGoogleReplySync: false,
    },
    highlights: [
      "1 business location",
      "NFC + QR review system (up to 10 active cards)",
      "Digital customer review page",
      "Basic review dashboard & tap/scan analytics",
      "Customer feedback collection",
      "1 total user account (business owner)",
      "Basic support",
    ],
  },
  growth: {
    id: "growth",
    label: "Growth",
    badge: "Most popular",
    tagline: "For established gyms, cafés, clinics and salons.",
    monthlyPriceInr: 799,
    annualPriceInr: 7990,
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
      competitorTracking: false,
      apiAccess: false,
      externalGoogleReplySync: false,
    },
    highlights: [
      "Everything in Starter",
      "Up to 3 business locations",
      "Up to 5 team members / users",
      "Up to 35 active NFC / QR cards",
      "Advanced review analytics",
      "Feedback monitoring & internal reply notes",
      "AI-assisted review & reply drafts",
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
    annualPriceInr: 14990,
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
      competitorTracking: false,
      apiAccess: false,
      externalGoogleReplySync: false,
    },
    highlights: [
      "Everything in Growth",
      "Up to 5 business locations",
      "Up to 10 team members / users",
      "Up to 100 active NFC / QR cards",
      "Branch-wise performance reports",
      "Exportable CSV reports",
      "Advanced branding (custom logo & colors)",
      "Priority assistance",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    badge: "Custom",
    tagline: "For franchises, agencies and large chains.",
    monthlyPriceInr: 0,
    annualPriceInr: null,
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
      competitorTracking: false,
      apiAccess: false,
      externalGoogleReplySync: false,
    },
    highlights: [
      "Everything in Pro",
      "Custom locations, team members & card limits",
      "White-label branding (removes Reviewly footer)",
      "Custom billing cycles & onboarding",
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
  { id: "expired", label: "Expired" },
  { id: "suspended", label: "Suspended" },
  { id: "cancelled", label: "Cancelled" },
];

export type EffectiveSubscriptionStatus = SubscriptionStatus;

export function mapPlanFeaturesToFlags(
  rows: PlanFeatureRecord[],
  overrides?: Partial<Record<FeatureKey, boolean>> | null
): {
  flags: PlanFeatureFlags;
  statuses: Partial<Record<FeatureKey, FeatureAvailabilityStatus>>;
} {
  const byKey = new Map(rows.map((r) => [r.featureKey, r]));
  const isEnabled = (k: FeatureKey, fallback = false) => {
    if (overrides && typeof overrides[k] === "boolean") {
      return Boolean(overrides[k]);
    }
    return byKey.get(k)?.enabled ?? fallback;
  };
  const statuses: Partial<Record<FeatureKey, FeatureAvailabilityStatus>> = {};
  for (const r of rows) {
    statuses[r.featureKey] = r.availabilityStatus;
  }

  return {
    flags: {
      nfcAndQr: isEnabled("qr_nfc_enabled", true),
      digitalReviewPage: isEnabled("digital_review_page", true),
      tapAndScanAnalytics: isEnabled("basic_analytics", true),
      privateFeedback: isEnabled("customer_feedback", true),
      advancedAnalytics: isEnabled("advanced_analytics", false),
      feedbackMonitoringAndReplies: isEnabled("review_management", false),
      aiResponseAssist: isEnabled("ai_review_response", false),
      feedbackInsights: isEnabled("feedback_insights", false),
      monthlyReport: isEnabled("monthly_reports", false),
      branchReports: isEnabled("branch_reports", false),
      exportReports: isEnabled("export_reports", false),
      customBranding: isEnabled("advanced_branding", false),
      whiteLabel: isEnabled("white_label", false),
      competitorTracking: isEnabled("competitor_tracking", false),
      apiAccess: isEnabled("api_access", false),
      externalGoogleReplySync: isEnabled("external_google_reply_sync", false),
    },
    statuses,
  };
}

export function buildPlanDefinitionFromRecord(
  plan: PlanRecord,
  featureRows: PlanFeatureRecord[]
): PlanDefinition {
  const { flags, statuses } = mapPlanFeaturesToFlags(
    featureRows.filter((f) => f.planId === plan.id)
  );
  return {
    id: plan.id,
    label: plan.name,
    badge: plan.badge,
    tagline: plan.description,
    monthlyPriceInr: plan.monthlyPriceInr,
    annualPriceInr: plan.annualPriceInr,
    customPrice: plan.customPrice,
    cardLimit: plan.maxCards,
    locationLimit: plan.maxLocations,
    teamLimit: plan.maxTeamMembers,
    supportTier: plan.supportTier,
    features: flags,
    featureStatuses: statuses,
    highlights: plan.highlights,
  };
}

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
      billingInterval: org.subscription.billingInterval ?? "monthly",
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
    billingInterval: "monthly",
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
    cardLimit: sub.cardLimit ?? def.cardLimit,
    locationLimit: sub.locationLimit ?? def.locationLimit,
    teamLimit: sub.teamLimit ?? def.teamLimit,
  };
}

/**
 * Parses `renewalDate` / `currentPeriodEnd` (ISO timestamp or legacy `YYYY-MM-DD`)
 * into UTC epoch ms representing the authoritative expiry timestamp.
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
  sub: Pick<OrganizationSubscription, "renewalDate"> & {
    status?: SubscriptionStatus;
  },
  nowMs: number = Date.now(),
  gracePeriodDays: number = 0
): boolean {
  if (sub.status === "expired") return true;
  const expiresAt = parseRenewalTimestamp(sub.renewalDate);
  if (expiresAt === null) return false;
  const graceMs = Math.max(0, gracePeriodDays) * 24 * 60 * 60 * 1000;
  return nowMs >= expiresAt + graceMs;
}

export function isSubscriptionActive(
  subOrStatus:
    | SubscriptionStatus
    | (Pick<OrganizationSubscription, "status" | "renewalDate"> & {
        cancelAtPeriodEnd?: boolean;
      }),
  nowMs: number = Date.now(),
  gracePeriodDays: number = 0
): boolean {
  if (typeof subOrStatus === "string") {
    return (
      subOrStatus !== "suspended" &&
      subOrStatus !== "cancelled" &&
      subOrStatus !== "expired"
    );
  }
  if (subOrStatus.status === "suspended" || subOrStatus.status === "expired") {
    return false;
  }
  if (subOrStatus.status === "cancelled" && !subOrStatus.cancelAtPeriodEnd) {
    return false;
  }
  return !isSubscriptionExpired(subOrStatus, nowMs, gracePeriodDays);
}

export function formatSubscriptionCountdown(
  renewalDate: string | null | undefined,
  nowMs: number = Date.now(),
  gracePeriodDays: number = 0
): {
  hasExpiry: boolean;
  expired: boolean;
  inGracePeriod: boolean;
  expiresAtMs: number | null;
  graceEndsAtMs: number | null;
  remainingMs: number | null;
  remainingDays: number | null;
  countdownLabel: string;
} {
  const expiresAtMs = parseRenewalTimestamp(renewalDate);
  if (expiresAtMs === null) {
    return {
      hasExpiry: false,
      expired: false,
      inGracePeriod: false,
      expiresAtMs: null,
      graceEndsAtMs: null,
      remainingMs: null,
      remainingDays: null,
      countdownLabel: "No fixed expiry date",
    };
  }

  const graceMs = Math.max(0, gracePeriodDays) * 24 * 60 * 60 * 1000;
  const graceEndsAtMs = expiresAtMs + graceMs;
  const rawRemainingMs = expiresAtMs - nowMs;
  const effectiveRemainingMs = graceEndsAtMs - nowMs;
  const inGracePeriod = rawRemainingMs <= 0 && effectiveRemainingMs > 0;

  if (effectiveRemainingMs <= 0) {
    const elapsedMs = Math.abs(rawRemainingMs);
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
      inGracePeriod: false,
      expiresAtMs,
      graceEndsAtMs,
      remainingMs: rawRemainingMs,
      remainingDays: 0,
      countdownLabel,
    };
  }

  const targetRemaining = inGracePeriod ? effectiveRemainingMs : rawRemainingMs;
  const totalMinutes = Math.ceil(targetRemaining / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMinutes = totalMinutes % 60;

  let countdownLabel: string;
  if (inGracePeriod) {
    countdownLabel =
      days >= 1
        ? `Grace period: ${days}d ${remHours}h left`
        : `Grace period: ${Math.max(1, totalHours)}h left`;
  } else if (days >= 1) {
    countdownLabel = `${days}d ${remHours}h remaining`;
  } else if (totalHours >= 1) {
    countdownLabel = `${totalHours}h ${remMinutes}m remaining`;
  } else {
    countdownLabel = `${Math.max(1, totalMinutes)}m remaining`;
  }

  return {
    hasExpiry: true,
    expired: false,
    inGracePeriod,
    expiresAtMs,
    graceEndsAtMs,
    remainingMs: targetRemaining,
    remainingDays: Math.max(0, Math.ceil(targetRemaining / 86_400_000)),
    countdownLabel,
  };
}

export function getSubscriptionHealth(
  sub: OrganizationSubscription & { cancelAtPeriodEnd?: boolean },
  nowMs: number = Date.now(),
  gracePeriodDays: number = 0
) {
  const pausedByAdmin = sub.status === "suspended";
  const cancelledImmediately =
    sub.status === "cancelled" && !sub.cancelAtPeriodEnd;
  const countdown = formatSubscriptionCountdown(
    sub.renewalDate,
    nowMs,
    gracePeriodDays
  );
  const expired = sub.status === "expired" || countdown.expired;
  const isUsable = !pausedByAdmin && !cancelledImmediately && !expired;
  const effectiveStatus: EffectiveSubscriptionStatus = pausedByAdmin
    ? "suspended"
    : cancelledImmediately
    ? "cancelled"
    : expired
    ? "expired"
    : sub.status;
  const expiringSoon =
    isUsable &&
    countdown.remainingMs !== null &&
    countdown.remainingMs <= 7 * 24 * 60 * 60 * 1000;

  return {
    effectiveStatus,
    pausedByAdmin,
    cancelledImmediately,
    isUsable,
    expiringSoon,
    ...countdown,
    expired,
  };
}

export interface ExpiryNotificationBanner {
  level: "error" | "warning" | "info" | "success";
  code:
    | "expired"
    | "suspended"
    | "cancelled"
    | "grace_period"
    | "expires_1d"
    | "expires_3d"
    | "expires_7d"
    | "days_remaining"
    | "renewed";
  title: string;
  message: string;
}

export function getExpiryNotificationBanner(params: {
  subscription: OrganizationSubscription & { cancelAtPeriodEnd?: boolean };
  planName?: string | null;
  settings?: Partial<PlatformBillingSettings> | null;
  lastPaidAt?: string | null;
  nowMs?: number;
}): ExpiryNotificationBanner | null {
  const nowMs = params.nowMs ?? Date.now();
  const graceDays = params.settings?.gracePeriodDays ?? 0;
  const health = getSubscriptionHealth(params.subscription, nowMs, graceDays);

  if (health.effectiveStatus === "suspended") {
    return {
      level: "error",
      code: "suspended",
      title: "Account suspended",
      message:
        "This workspace and its public customer review page have been suspended by the platform administrator. Contact support or review billing.",
    };
  }

  if (health.effectiveStatus === "expired" || health.effectiveStatus === "cancelled") {
    return {
      level: "error",
      code: health.effectiveStatus === "cancelled" ? "cancelled" : "expired",
      title:
        health.effectiveStatus === "cancelled"
          ? "Subscription cancelled"
          : "Subscription expired — public review page disabled",
      message:
        "Your public customer review page is paused and paid operations are locked. Your historical data is safe. Renew your plan to reactivate immediately.",
    };
  }

  if (health.inGracePeriod) {
    return {
      level: "warning",
      code: "grace_period",
      title: "In grace period — renew now to avoid downtime",
      message: `${health.countdownLabel}. After the grace window ends, your public review page will close automatically.`,
    };
  }

  if (health.hasExpiry && health.remainingMs !== null) {
    const daysLeft = health.remainingDays ?? 0;
    const planLabel = params.planName?.trim() || "subscription";
    const daysLabel =
      daysLeft === 0 ? "Expires today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    const reminders = [...(params.settings?.reminderDays ?? [7, 3, 1])].sort(
      (a, b) => a - b
    );
    for (const r of reminders) {
      if (daysLeft <= r) {
        const code = r <= 1 ? "expires_1d" : r <= 3 ? "expires_3d" : "expires_7d";
        return {
          level: r <= 1 ? "error" : "warning",
          code,
          title:
            daysLeft <= 1
              ? `${daysLeft === 0 ? "Subscription expires today" : "1 day left on your " + planLabel + " plan"}`
              : `${daysLeft} days left on your ${planLabel} plan`,
          message:
            `${health.countdownLabel}. Renew before expiry or your public customer review page will close automatically.`,
        };
      }
    }

    if (params.lastPaidAt) {
      const paidAgeMs = nowMs - Date.parse(params.lastPaidAt);
      if (Number.isFinite(paidAgeMs) && paidAgeMs >= 0 && paidAgeMs <= 48 * 60 * 60 * 1000) {
        return {
          level: "success",
          code: "renewed",
          title: `Subscription active — ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left on your ${planLabel} plan`,
          message:
            "Payment verified. Your public customer review page and paid entitlements remain live until expiry.",
        };
      }
    }

    return {
      level: "info",
      code: "days_remaining",
      title: `${daysLabel} on your ${planLabel} plan`,
      message: `${health.countdownLabel}. Your public customer review page stays open until expiry and closes automatically once expired.`,
    };
  }

  if (params.lastPaidAt) {
    const paidAgeMs = nowMs - Date.parse(params.lastPaidAt);
    if (Number.isFinite(paidAgeMs) && paidAgeMs >= 0 && paidAgeMs <= 48 * 60 * 60 * 1000) {
      return {
        level: "success",
        code: "renewed",
        title: "Subscription active",
        message: "Recent payment verified. Your public review pages and paid entitlements are active.",
      };
    }
  }

  return null;
}

export function subscriptionRecordToOrgSummary(
  rec: SubscriptionRecord,
  plan?: PlanRecord | null
): OrganizationSubscription {
  const def = PLAN_DEFAULTS[rec.planId] ?? PLAN_DEFAULTS.starter;
  const maxLocations = rec.customOverrides?.maxLocations ?? plan?.maxLocations ?? def.locationLimit;
  const maxTeamMembers = rec.customOverrides?.maxTeamMembers ?? plan?.maxTeamMembers ?? def.teamLimit;
  const maxCards = rec.customOverrides?.maxCards ?? plan?.maxCards ?? def.cardLimit;
  return {
    plan: rec.planId,
    status: rec.status,
    monthlyPriceInr: rec.amountInr,
    cardLimit: maxCards,
    locationLimit: maxLocations,
    teamLimit: maxTeamMembers,
    renewalDate: rec.currentPeriodEnd,
    billingInterval: rec.billingInterval,
    notes: rec.notes,
    updatedAt: rec.updatedAt,
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
    billingInterval: "monthly",
    notes: "",
    updatedAt: now.toISOString(),
  };
}

export function formatBillingIntervalLabel(interval: BillingInterval): string {
  if (interval === "annual") return "Yearly";
  if (interval === "custom") return "Custom";
  return "Monthly";
}

export function computeLimitUsage(used: number, limit: number): {
  used: number;
  limit: number;
  isUnlimited: boolean;
  atOrOverLimit: boolean;
  overLimit: boolean;
  percent: number;
} {
  const isUnlimited = limit < 0;
  if (isUnlimited) {
    return {
      used,
      limit,
      isUnlimited: true,
      atOrOverLimit: false,
      overLimit: false,
      percent: 0,
    };
  }
  const safeLimit = Math.max(0, limit);
  const percent =
    safeLimit === 0 ? 100 : Math.min(100, Math.round((used / safeLimit) * 100));
  return {
    used,
    limit: safeLimit,
    isUnlimited: false,
    atOrOverLimit: used >= safeLimit,
    overLimit: used > safeLimit,
    percent,
  };
}
