import { readDB, writeDB, uid } from "./db";
import { FEATURE_CATALOG, createSeedFeaturesForPlan } from "./planSeed";
import {
  formatSubscriptionCountdown,
  getExpiryNotificationBanner,
  mapPlanFeaturesToFlags,
  parseRenewalTimestamp,
  subscriptionRecordToOrgSummary,
  type ExpiryNotificationBanner,
  type PlanFeatureFlags,
} from "./subscriptions";
import type {
  DB,
  FeatureAvailabilityStatus,
  FeatureKey,
  Organization,
  PlanFeatureRecord,
  PlanRecord,
  PlatformBillingSettings,
  SubscriptionRecord,
  SubscriptionStatus,
} from "./types";

export interface ResolvedEntitlementContext {
  organization: Organization;
  subscription: SubscriptionRecord;
  plan: PlanRecord;
  featureRows: PlanFeatureRecord[];
  featureFlags: PlanFeatureFlags;
  featureStatuses: Partial<Record<FeatureKey, FeatureAvailabilityStatus>>;
  settings: PlatformBillingSettings;
  limits: {
    maxLocations: number; // -1 = unlimited
    maxTeamMembers: number; // -1 = unlimited
    maxCards: number; // -1 = unlimited
  };
  supportTier: string;
  effectiveStatus: SubscriptionStatus;
  expired: boolean;
  inGracePeriod: boolean;
  isUsable: boolean;
  remainingMs: number | null;
  remainingDays: number | null;
  countdownLabel: string;
  usage: {
    locations: number;
    teamMembers: number;
    activeCards: number;
  };
  warningBanner: ExpiryNotificationBanner | null;
}

const FEATURE_KEY_TO_FLAG: Record<FeatureKey, keyof PlanFeatureFlags> = {
  qr_nfc_enabled: "nfcAndQr",
  digital_review_page: "digitalReviewPage",
  basic_analytics: "tapAndScanAnalytics",
  customer_feedback: "privateFeedback",
  advanced_analytics: "advancedAnalytics",
  review_management: "feedbackMonitoringAndReplies",
  ai_review_response: "aiResponseAssist",
  feedback_insights: "feedbackInsights",
  monthly_reports: "monthlyReport",
  branch_reports: "branchReports",
  export_reports: "exportReports",
  advanced_branding: "customBranding",
  white_label: "whiteLabel",
  competitor_tracking: "competitorTracking",
  api_access: "apiAccess",
  external_google_reply_sync: "externalGoogleReplySync",
};

export function pickLatestOrgSubscription(
  db: DB,
  organizationId: string
): SubscriptionRecord | null {
  const subs = db.subscriptions.filter((s) => s.organizationId === organizationId);
  if (subs.length === 0) return null;
  // Prefer non-historical active/trial/past_due/latest updated subscription
  const priority: Record<SubscriptionStatus, number> = {
    active: 5,
    trialing: 4,
    past_due: 3,
    cancelled: 2,
    expired: 1,
    suspended: 0,
  };
  return [...subs].sort((a, b) => {
    const tDiff =
      Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
    if (Math.abs(tDiff) > 500) return tDiff;
    return (priority[b.status] ?? 0) - (priority[a.status] ?? 0);
  })[0];
}

export function evaluateSubscriptionHealth(
  sub: SubscriptionRecord,
  gracePeriodDays: number,
  nowMs: number = Date.now()
) {
  const countdown = formatSubscriptionCountdown(
    sub.currentPeriodEnd,
    nowMs,
    gracePeriodDays
  );
  const suspended = sub.status === "suspended";
  const cancelledBlocked = sub.status === "cancelled" && !sub.cancelAtPeriodEnd;
  const expired = sub.status === "expired" || countdown.expired;
  const isUsable = !suspended && !cancelledBlocked && !expired;
  const effectiveStatus: SubscriptionStatus = suspended
    ? "suspended"
    : cancelledBlocked
    ? "cancelled"
    : expired
    ? "expired"
    : sub.status;

  return {
    effectiveStatus,
    expired,
    inGracePeriod: countdown.inGracePeriod,
    isUsable,
    remainingMs: countdown.remainingMs,
    remainingDays: countdown.remainingDays,
    countdownLabel: countdown.countdownLabel,
  };
}

function buildContextFromDB(
  db: DB,
  org: Organization,
  nowMs: number
): ResolvedEntitlementContext | null {
  const pickedSub = pickLatestOrgSubscription(db, org.id);
  const sub: SubscriptionRecord | null = pickedSub ? { ...pickedSub } : null;
  if (!sub) return null;

  // Defensive sync: if legacy org.subscription was explicitly locked/expired more recently
  // (e.g., concurrent write or external migration), never allow stale sub to bypass lock.
  if (org.subscription) {
    const legacyUpdatedMs = Date.parse(org.subscription.updatedAt || "");
    const recUpdatedMs = Date.parse(sub.updatedAt || sub.createdAt || "");
    const legacyEndMs = parseRenewalTimestamp(org.subscription.renewalDate);
    const recEndMs = parseRenewalTimestamp(sub.currentPeriodEnd);
    const legacyMoreRecent =
      Number.isFinite(legacyUpdatedMs) &&
      Number.isFinite(recUpdatedMs) &&
      legacyUpdatedMs > recUpdatedMs + 500;
    if (legacyMoreRecent) {
      sub.status = org.subscription.status;
      sub.currentPeriodEnd = org.subscription.renewalDate ?? null;
    } else if (
      (org.subscription.status === "expired" ||
        org.subscription.status === "suspended" ||
        org.subscription.status === "cancelled") &&
      sub.status !== org.subscription.status &&
      (recEndMs === null || (legacyEndMs !== null && legacyEndMs <= recEndMs))
    ) {
      sub.status = org.subscription.status;
    }
  }

  const plan =
    db.plans.find((p) => p.id === sub.planId || p.slug === sub.planId) ??
    db.plans.find((p) => p.id === "starter") ??
    db.plans[0];
  if (!plan) return null;

  const settings = db.platformSettings;
  const featureRows = db.planFeatures.filter((pf) => pf.planId === plan.id);
  const { flags, statuses } = mapPlanFeaturesToFlags(
    featureRows.length > 0 ? featureRows : createSeedFeaturesForPlan(plan.id),
    sub.customOverrides?.features ?? null
  );

  // Enforce implementation safety: never claim an unimplemented feature as active
  for (const meta of FEATURE_CATALOG) {
    if (!meta.implemented) {
      flags[FEATURE_KEY_TO_FLAG[meta.key]] = false;
      statuses[meta.key] = meta.defaultUnavailableStatus;
    }
  }

  const health = evaluateSubscriptionHealth(sub, settings.gracePeriodDays, nowMs);

  const orgBusinesses = db.businesses.filter((b) => b.organizationId === org.id);
  const bizIds = new Set(orgBusinesses.map((b) => b.id));
  const teamMembers = db.users.filter((u) => u.organizationId === org.id).length;
  const activeCards = db.cards.filter(
    (c) => bizIds.has(c.businessId) && c.status === "active"
  ).length;

  const latestPaid = db.payments
    .filter((p) => p.organizationId === org.id && p.status === "SUCCESS")
    .sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt))[0];

  const orgSummary = subscriptionRecordToOrgSummary(sub, plan);
  const warningBanner = getExpiryNotificationBanner({
    subscription: { ...orgSummary, cancelAtPeriodEnd: sub.cancelAtPeriodEnd },
    planName: plan.name,
    settings,
    lastPaidAt: latestPaid?.paidAt ?? null,
    nowMs,
  });

  return {
    organization: org,
    subscription: sub,
    plan,
    featureRows,
    featureFlags: flags,
    featureStatuses: statuses,
    settings,
    limits: {
      maxLocations: sub.customOverrides?.maxLocations ?? plan.maxLocations,
      maxTeamMembers: sub.customOverrides?.maxTeamMembers ?? plan.maxTeamMembers,
      maxCards: sub.customOverrides?.maxCards ?? plan.maxCards,
    },
    supportTier: sub.customOverrides?.supportTier ?? plan.supportTier,
    ...health,
    usage: {
      locations: orgBusinesses.length,
      teamMembers,
      activeCards,
    },
    warningBanner,
  };
}

/**
 * Transitions stale active/trialing/past_due subscriptions to status="expired"
 * in storage once `nowMs >= currentPeriodEnd + gracePeriodDays` while keeping all
 * business, card, feedback, session, and payment records completely intact.
 */
export async function syncExpiredSubscriptions(
  organizationId?: string,
  nowMs: number = Date.now()
): Promise<number> {
  const hasPending = await readDB((db) => {
    const graceMs = Math.max(0, db.platformSettings.gracePeriodDays) * 86_400_000;
    for (const sub of db.subscriptions) {
      if (organizationId && sub.organizationId !== organizationId) continue;
      if (
        sub.status === "suspended" ||
        sub.status === "expired" ||
        (sub.status === "cancelled" && !sub.cancelAtPeriodEnd)
      ) {
        continue;
      }
      const endMs = parseRenewalTimestamp(sub.currentPeriodEnd);
      if (endMs !== null && nowMs >= endMs + graceMs) {
        return true;
      }
    }
    return false;
  });

  if (!hasPending) return 0;

  return writeDB((db) => {
    let transitioned = 0;
    const graceMs = Math.max(0, db.platformSettings.gracePeriodDays) * 86_400_000;
    const nowIso = new Date(nowMs).toISOString();

    for (const sub of db.subscriptions) {
      if (organizationId && sub.organizationId !== organizationId) continue;
      if (
        sub.status === "suspended" ||
        sub.status === "expired" ||
        (sub.status === "cancelled" && !sub.cancelAtPeriodEnd)
      ) {
        continue;
      }
      const endMs = parseRenewalTimestamp(sub.currentPeriodEnd);
      if (endMs !== null && nowMs >= endMs + graceMs) {
        const prevStatus = sub.status;
        sub.status = "expired";
        sub.updatedAt = nowIso;
        const org = db.organizations.find((o) => o.id === sub.organizationId);
        if (org?.subscription) {
          org.subscription.status = "expired";
          org.subscription.updatedAt = nowIso;
        }
        db.subscriptionAuditLogs.push({
          id: uid(),
          subscriptionId: sub.id,
          organizationId: sub.organizationId,
          businessId: sub.businessId,
          adminId: null,
          actorEmail: "system@reviewly.internal",
          action: "auto_expired",
          previousValues: { status: prevStatus, currentPeriodEnd: sub.currentPeriodEnd },
          newValues: { status: "expired", gracePeriodDays: db.platformSettings.gracePeriodDays },
          reason: "Subscription period ended automatically.",
          createdAt: nowIso,
        });
        transitioned += 1;
      }
    }
    return transitioned;
  });
}

export async function getOrganizationEntitlements(
  organizationId: string,
  nowMs: number = Date.now()
): Promise<ResolvedEntitlementContext | null> {
  const ctx = await readDB((db) => {
    const org = db.organizations.find((o) => o.id === organizationId);
    if (!org) return null;
    return buildContextFromDB(db, org, nowMs);
  });

  if (
    ctx &&
    ctx.expired &&
    ctx.subscription.status !== "expired" &&
    ctx.subscription.status !== "suspended"
  ) {
    const transitioned = await syncExpiredSubscriptions(organizationId, nowMs);
    if (transitioned > 0) {
      return readDB((db) => {
        const org = db.organizations.find((o) => o.id === organizationId);
        if (!org) return ctx;
        return buildContextFromDB(db, org, nowMs) ?? ctx;
      });
    }
  }
  return ctx;
}

export async function getBusinessSubscription(
  businessId: string,
  nowMs: number = Date.now()
): Promise<SubscriptionRecord | null> {
  const ctx = await getBusinessEntitlements(businessId, nowMs);
  return ctx?.subscription ?? null;
}

export async function getBusinessEntitlements(
  businessId: string,
  nowMs: number = Date.now()
): Promise<ResolvedEntitlementContext | null> {
  const orgId = await readDB((db) => {
    const biz = db.businesses.find((b) => b.id === businessId);
    return biz?.organizationId ?? null;
  });
  if (!orgId) return null;
  return getOrganizationEntitlements(orgId, nowMs);
}

export async function isBusinessSubscriptionActive(
  businessId: string,
  nowMs: number = Date.now()
): Promise<boolean> {
  const ctx = await getBusinessEntitlements(businessId, nowMs);
  if (!ctx) return false;
  return ctx.isUsable;
}

export async function isOrgSubscriptionActive(
  organizationId: string,
  nowMs: number = Date.now()
): Promise<boolean> {
  const ctx = await getOrganizationEntitlements(organizationId, nowMs);
  if (!ctx) return false;
  return ctx.isUsable;
}

export async function hasFeatureAccess(
  businessId: string,
  featureKey: FeatureKey,
  nowMs: number = Date.now()
): Promise<{
  allowed: boolean;
  reason?: string;
  availabilityStatus?: FeatureAvailabilityStatus;
  context: ResolvedEntitlementContext | null;
}> {
  const ctx = await getBusinessEntitlements(businessId, nowMs);
  if (!ctx) {
    return { allowed: false, reason: "Business subscription not found", context: null };
  }
  if (!ctx.isUsable) {
    return {
      allowed: false,
      reason: "Subscription is expired, suspended, or cancelled.",
      context: ctx,
    };
  }
  const meta = FEATURE_CATALOG.find((f) => f.key === featureKey);
  if (meta && !meta.implemented) {
    return {
      allowed: false,
      reason: `${meta.label}: ${meta.defaultUnavailableStatus.replace("_", " ")}`,
      availabilityStatus: meta.defaultUnavailableStatus,
      context: ctx,
    };
  }
  const flagName = FEATURE_KEY_TO_FLAG[featureKey];
  const enabled = Boolean(ctx.featureFlags[flagName]);
  return {
    allowed: enabled,
    reason: enabled
      ? undefined
      : `${meta?.label ?? featureKey} is not included in the ${ctx.plan.name} plan.`,
    availabilityStatus: ctx.featureStatuses[featureKey] ?? (enabled ? "active" : "unavailable"),
    context: ctx,
  };
}

export async function checkResourceLimit(
  businessOrOrgId: string,
  resourceType: "locations" | "team_members" | "cards",
  nowMs: number = Date.now(),
  mode: "business" | "org" = "business"
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  isUnlimited: boolean;
  planName: string;
  reason?: string;
}> {
  const ctx =
    mode === "org"
      ? await getOrganizationEntitlements(businessOrOrgId, nowMs)
      : await getBusinessEntitlements(businessOrOrgId, nowMs);
  if (!ctx) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      isUnlimited: false,
      planName: "Unknown",
      reason: "Subscription not found.",
    };
  }
  if (!ctx.isUsable) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      isUnlimited: false,
      planName: ctx.plan.name,
      reason: "Subscription is expired, suspended, or cancelled. Renew to resume creating resources.",
    };
  }
  const used =
    resourceType === "locations"
      ? ctx.usage.locations
      : resourceType === "team_members"
      ? ctx.usage.teamMembers
      : ctx.usage.activeCards;
  const limit =
    resourceType === "locations"
      ? ctx.limits.maxLocations
      : resourceType === "team_members"
      ? ctx.limits.maxTeamMembers
      : ctx.limits.maxCards;
  const isUnlimited = limit < 0;
  const allowed = isUnlimited || used < limit;
  const label =
    resourceType === "locations"
      ? "business location"
      : resourceType === "team_members"
      ? "team member"
      : "active NFC / QR card";
  return {
    allowed,
    used,
    limit,
    isUnlimited,
    planName: ctx.plan.name,
    reason: allowed
      ? undefined
      : `Maximum ${label} limit reached (${used} / ${limit} on ${ctx.plan.name}). Upgrade your plan to add more.`,
  };
}

export async function canCreateLocation(
  businessOrOrgId: string,
  mode: "business" | "org" = "org",
  nowMs: number = Date.now()
) {
  return checkResourceLimit(businessOrOrgId, "locations", nowMs, mode);
}

export async function canInviteTeamMember(
  businessOrOrgId: string,
  mode: "business" | "org" = "org",
  nowMs: number = Date.now()
) {
  return checkResourceLimit(businessOrOrgId, "team_members", nowMs, mode);
}

export async function canAccessPublicReviewPage(
  businessId: string,
  nowMs: number = Date.now()
): Promise<{
  allowed: boolean;
  status: SubscriptionStatus | "missing";
  expired: boolean;
  reason?: string;
  context: ResolvedEntitlementContext | null;
}> {
  const ctx = await getBusinessEntitlements(businessId, nowMs);
  if (!ctx) {
    return {
      allowed: false,
      status: "missing",
      expired: true,
      reason: "No valid workspace subscription found.",
      context: null,
    };
  }
  if (!ctx.isUsable) {
    return {
      allowed: false,
      status: ctx.effectiveStatus,
      expired: ctx.expired,
      reason: ctx.expired
        ? "Subscription expired"
        : ctx.effectiveStatus === "suspended"
        ? "Subscription suspended"
        : "Subscription cancelled",
      context: ctx,
    };
  }
  const hasPage = ctx.featureFlags.digitalReviewPage;
  return {
    allowed: hasPage,
    status: ctx.effectiveStatus,
    expired: false,
    reason: hasPage ? undefined : "Digital review page is disabled on current plan.",
    context: ctx,
  };
}

export function getPlanFeatureDisplayItems(ctx: ResolvedEntitlementContext) {
  return FEATURE_CATALOG.map((meta) => {
    const flagName = FEATURE_KEY_TO_FLAG[meta.key];
    const enabled = meta.implemented
      ? Boolean(ctx.featureFlags[flagName])
      : false;
    return {
      key: meta.key,
      label: meta.label,
      enabled,
      implemented: meta.implemented,
      availabilityStatus: !meta.implemented
        ? meta.defaultUnavailableStatus
        : enabled
          ? "active"
          : "unavailable",
    };
  });
}

