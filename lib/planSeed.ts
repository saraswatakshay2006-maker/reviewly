import type {
  DB,
  FeatureAvailabilityStatus,
  FeatureKey,
  PlanFeatureRecord,
  PlanRecord,
  PlatformBillingSettings,
  SubscriptionRecord,
} from "./types";
import { calculateSubscriptionPeriod } from "./subscriptions";

export const FEATURE_CATALOG: {
  key: FeatureKey;
  label: string;
  description: string;
  implemented: boolean;
  defaultUnavailableStatus: Exclude<FeatureAvailabilityStatus, "active">;
}[] = [
  {
    key: "qr_nfc_enabled",
    label: "NFC + QR review system",
    description: "Dynamic NFC card token routing and downloadable QR counter stands.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "digital_review_page",
    label: "Digital customer review page",
    description: "Branded customer rating experience with Google link and private feedback.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "basic_analytics",
    label: "Tap, scan & rating dashboard",
    description: "First-party visits, NFC taps, QR scans, and rating distribution.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "customer_feedback",
    label: "Customer feedback collection",
    description: "Private feedback intake inbox isolated per organization.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "advanced_analytics",
    label: "Advanced review analytics",
    description: "Device breakdown, channel conversion percentages, and detailed trends.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "review_management",
    label: "Feedback monitoring & reply notes",
    description: "Internal team reply tracking and pending follow-up queues.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "ai_review_response",
    label: "AI-assisted review & reply drafts",
    description: "Uses OpenAI / smart templates for customer review drafts and team replies.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "feedback_insights",
    label: "Customer feedback insights",
    description: "Follow-up coverage rate, complaint counts, and frequent keyword themes.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "monthly_reports",
    label: "Monthly performance reports",
    description: "Month-over-month UTC summary comparing visits, scans, and clicks.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "branch_reports",
    label: "Branch-wise performance reports",
    description: "Multi-location side-by-side branch comparison table.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "export_reports",
    label: "Exportable CSV reports",
    description: "Downloadable branch summary and private feedback CSV exports.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "advanced_branding",
    label: "Advanced branding",
    description: "Custom business logo URL and brand color theming on public review pages.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "white_label",
    label: "White-label branding",
    description: "Removes Reviewly footer attribution from public review pages.",
    implemented: true,
    defaultUnavailableStatus: "unavailable",
  },
  {
    key: "competitor_tracking",
    label: "Competitor tracking",
    description: "External competitor rating benchmarking (not yet connected).",
    implemented: false,
    defaultUnavailableStatus: "coming_soon",
  },
  {
    key: "api_access",
    label: "Developer API access",
    description: "Public token-based REST API keys (integration required).",
    implemented: false,
    defaultUnavailableStatus: "integration_required",
  },
  {
    key: "external_google_reply_sync",
    label: "Google Business Profile auto-sync",
    description: "Requires official Google Business Profile OAuth app verification.",
    implemented: false,
    defaultUnavailableStatus: "integration_required",
  },
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformBillingSettings = {
  gracePeriodDays: 0,
  reminderDays: [7, 3, 1],
  annualBillingEnabled: true,
  taxRatePercent: 0,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SEED_TS = "2026-01-01T00:00:00.000Z";

export const DEFAULT_PLAN_RECORDS: PlanRecord[] = [
  {
    id: "trial",
    slug: "trial",
    name: "14-Day Trial",
    badge: "Free evaluation",
    description: "Evaluate Reviewly with single-location NFC/QR and feedback tracking.",
    monthlyPriceInr: 0,
    annualPriceInr: null,
    customPrice: false,
    currency: "INR",
    billingIntervalOptions: ["monthly"],
    maxLocations: 1,
    maxTeamMembers: 1,
    maxCards: 5,
    supportTier: "Basic support",
    trialDays: 14,
    isActive: false,
    isPopular: false,
    sortOrder: 0,
    highlights: [
      "1 business location",
      "Up to 5 NFC / QR cards",
      "Digital review page & basic analytics",
      "Customer feedback collection",
      "1 user account",
    ],
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  },
  {
    id: "starter",
    slug: "starter",
    name: "Starter",
    badge: "Entry plan",
    description: "For small shops, salons and single-location gyms.",
    monthlyPriceInr: 299,
    annualPriceInr: 2990,
    customPrice: false,
    currency: "INR",
    billingIntervalOptions: ["monthly", "annual"],
    maxLocations: 1,
    maxTeamMembers: 1,
    maxCards: 10,
    supportTier: "Basic support",
    trialDays: 14,
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    highlights: [
      "1 business location",
      "NFC + QR review system (up to 10 active cards)",
      "Digital customer review page",
      "Basic review dashboard & tap/scan analytics",
      "Customer feedback collection",
      "1 total user account (business owner)",
      "Basic support",
    ],
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  },
  {
    id: "growth",
    slug: "growth",
    name: "Growth",
    badge: "Most popular",
    description: "For established gyms, cafés, clinics and salons.",
    monthlyPriceInr: 799,
    annualPriceInr: 7990,
    customPrice: false,
    currency: "INR",
    billingIntervalOptions: ["monthly", "annual"],
    maxLocations: 3,
    maxTeamMembers: 5,
    maxCards: 35,
    supportTier: "Priority support",
    trialDays: 14,
    isActive: true,
    isPopular: true,
    sortOrder: 2,
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
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  },
  {
    id: "pro",
    slug: "pro",
    name: "Pro",
    badge: "Advanced plan",
    description: "For multi-branch businesses and larger operations.",
    monthlyPriceInr: 1499,
    annualPriceInr: 14990,
    customPrice: false,
    currency: "INR",
    billingIntervalOptions: ["monthly", "annual"],
    maxLocations: 5,
    maxTeamMembers: 10,
    maxCards: 100,
    supportTier: "Priority assistance",
    trialDays: 14,
    isActive: true,
    isPopular: false,
    sortOrder: 3,
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
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  },
  {
    id: "enterprise",
    slug: "enterprise",
    name: "Enterprise",
    badge: "Custom",
    description: "For franchises, agencies and large chains.",
    monthlyPriceInr: 0,
    annualPriceInr: null,
    customPrice: true,
    currency: "INR",
    billingIntervalOptions: ["custom", "monthly", "annual"],
    maxLocations: 25,
    maxTeamMembers: 50,
    maxCards: 999,
    supportTier: "Dedicated support",
    trialDays: 14,
    isActive: true,
    isPopular: false,
    sortOrder: 4,
    highlights: [
      "Everything in Pro",
      "Custom locations, team members & card limits",
      "White-label branding (removes Reviewly footer)",
      "Custom billing cycles & onboarding",
      "Dedicated support",
    ],
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  },
];

const ENABLED_BY_DEFAULT: Record<string, FeatureKey[]> = {
  trial: [
    "qr_nfc_enabled",
    "digital_review_page",
    "basic_analytics",
    "customer_feedback",
    "review_management",
  ],
  starter: [
    "qr_nfc_enabled",
    "digital_review_page",
    "basic_analytics",
    "customer_feedback",
  ],
  growth: [
    "qr_nfc_enabled",
    "digital_review_page",
    "basic_analytics",
    "customer_feedback",
    "advanced_analytics",
    "review_management",
    "ai_review_response",
    "feedback_insights",
    "monthly_reports",
  ],
  pro: [
    "qr_nfc_enabled",
    "digital_review_page",
    "basic_analytics",
    "customer_feedback",
    "advanced_analytics",
    "review_management",
    "ai_review_response",
    "feedback_insights",
    "monthly_reports",
    "branch_reports",
    "export_reports",
    "advanced_branding",
  ],
  enterprise: [
    "qr_nfc_enabled",
    "digital_review_page",
    "basic_analytics",
    "customer_feedback",
    "advanced_analytics",
    "review_management",
    "ai_review_response",
    "feedback_insights",
    "monthly_reports",
    "branch_reports",
    "export_reports",
    "advanced_branding",
    "white_label",
  ],
};

export function createSeedFeaturesForPlan(planId: string): PlanFeatureRecord[] {
  const enabledKeys = new Set(ENABLED_BY_DEFAULT[planId] ?? ENABLED_BY_DEFAULT.starter);
  return FEATURE_CATALOG.map((meta) => {
    const enabled = meta.implemented && enabledKeys.has(meta.key);
    return {
      id: `${planId}:${meta.key}`,
      planId,
      featureKey: meta.key,
      enabled,
      availabilityStatus: enabled
        ? "active"
        : meta.implemented
        ? "unavailable"
        : meta.defaultUnavailableStatus,
      configurationJson: null,
      updatedAt: SEED_TS,
    };
  });
}

function normalizeRenewalEnd(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T23:59:59.999Z`;
  const ts = Date.parse(t);
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}

/**
 * Idempotently upgrades older DB snapshots in place without removing or
 * overwriting existing organizations, businesses, users, cards, or events.
 */
export function migrateDBInPlace(db: DB): DB {
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.organizations)) db.organizations = [];
  if (!Array.isArray(db.businesses)) db.businesses = [];
  if (!Array.isArray(db.members)) db.members = [];
  if (!Array.isArray(db.cards)) db.cards = [];
  if (!Array.isArray(db.sessions)) db.sessions = [];
  if (!Array.isArray(db.events)) db.events = [];
  if (!Array.isArray(db.feedback)) db.feedback = [];
  if (!db.seq || typeof db.seq !== "object") db.seq = {};

  if (!Array.isArray(db.plans)) db.plans = [];
  if (!Array.isArray(db.planFeatures)) db.planFeatures = [];
  if (!Array.isArray(db.subscriptions)) db.subscriptions = [];
  if (!Array.isArray(db.payments)) db.payments = [];
  if (!Array.isArray(db.paymentWebhookEvents)) db.paymentWebhookEvents = [];
  if (!Array.isArray(db.subscriptionAuditLogs)) db.subscriptionAuditLogs = [];
  if (!Array.isArray(db.coupons)) db.coupons = [];
  if (!db.platformSettings || typeof db.platformSettings !== "object") {
    db.platformSettings = { ...DEFAULT_PLATFORM_SETTINGS };
  }
  if (typeof db.platformSettings.gracePeriodDays !== "number") {
    db.platformSettings.gracePeriodDays = 0;
  }
  if (!Array.isArray(db.platformSettings.reminderDays)) {
    db.platformSettings.reminderDays = [7, 3, 1];
  }
  if (typeof db.platformSettings.annualBillingEnabled !== "boolean") {
    db.platformSettings.annualBillingEnabled = true;
  }
  if (typeof db.platformSettings.taxRatePercent !== "number") {
    db.platformSettings.taxRatePercent = 0;
  }

  // Ensure default 5 plans exist without clobbering Super Admin edits to existing plans.
  const existingPlanIds = new Set(db.plans.map((p) => p.id));
  for (const seedPlan of DEFAULT_PLAN_RECORDS) {
    if (!existingPlanIds.has(seedPlan.id)) {
      db.plans.push({
        ...seedPlan,
        billingIntervalOptions: [...seedPlan.billingIntervalOptions],
        highlights: [...seedPlan.highlights],
      });
    }
  }

  // Ensure every plan has rows for every known feature key.
  const existingFeatureKey = new Set(
    db.planFeatures.map((pf) => `${pf.planId}:${pf.featureKey}`)
  );
  for (const plan of db.plans) {
    const defaults = createSeedFeaturesForPlan(plan.id);
    for (const row of defaults) {
      if (!existingFeatureKey.has(`${row.planId}:${row.featureKey}`)) {
        db.planFeatures.push(row);
        existingFeatureKey.add(`${row.planId}:${row.featureKey}`);
      }
    }
  }

  // Backfill normalized SubscriptionRecord entries for existing organizations
  const anchorDefaultExpiryIso = (
    startAt: string,
    planId: string,
    trialDays: number
  ): string => {
    const startMs = Date.parse(startAt);
    const baseMs = Number.isFinite(startMs) ? startMs : Date.now();
    const days = planId === "trial" ? Math.max(1, trialDays || 14) : 30;
    return new Date(baseMs + days * 86_400_000).toISOString();
  };

  const isClientOrg = (orgId: string): boolean => {
    const orgUsers = db.users.filter((u) => u.organizationId === orgId);
    if (orgUsers.length === 0) return true;
    return !orgUsers.every((u) => u.role === "super_admin");
  };

  const orgsWithSub = new Set(db.subscriptions.map((s) => s.organizationId));
  for (const org of db.organizations) {
    if (orgsWithSub.has(org.id)) continue;
    const legacy = org.subscription;
    const planId = legacy?.plan || "starter";
    const plan =
      db.plans.find((p) => p.id === planId) ??
      db.plans.find((p) => p.id === "starter") ??
      DEFAULT_PLAN_RECORDS[1];
    const primaryBiz = db.businesses.find((b) => b.organizationId === org.id);
    const startAt = org.createdAt || new Date().toISOString();
    let endIso = normalizeRenewalEnd(legacy?.renewalDate);
    if (endIso === null && planId !== "enterprise" && isClientOrg(org.id)) {
      endIso = anchorDefaultExpiryIso(startAt, planId, plan.trialDays);
    }
    const nowMs = Date.now();
    const isPastEnd =
      endIso !== null &&
      nowMs >= Date.parse(endIso) + db.platformSettings.gracePeriodDays * 86_400_000;
    const baseStatus = legacy?.status || "active";
    const status =
      baseStatus === "suspended" || baseStatus === "cancelled"
        ? baseStatus
        : isPastEnd
        ? "expired"
        : baseStatus;

    const overrides: SubscriptionRecord["customOverrides"] = {};
    let hasOverrides = false;
    if (
      legacy?.locationLimit !== undefined &&
      legacy.locationLimit !== plan.maxLocations
    ) {
      overrides.maxLocations = legacy.locationLimit;
      hasOverrides = true;
    }
    if (legacy?.teamLimit !== undefined && legacy.teamLimit !== plan.maxTeamMembers) {
      overrides.maxTeamMembers = legacy.teamLimit;
      hasOverrides = true;
    }
    if (legacy?.cardLimit !== undefined && legacy.cardLimit !== plan.maxCards) {
      overrides.maxCards = legacy.cardLimit;
      hasOverrides = true;
    }

    const subRec: SubscriptionRecord = {
      id: `sub_${org.id}`,
      organizationId: org.id,
      businessId: primaryBiz?.id ?? null,
      planId,
      status,
      paymentStatus: planId === "trial" ? "NONE" : "MANUAL",
      billingInterval: legacy?.billingInterval ?? "monthly",
      amountInr: legacy?.monthlyPriceInr ?? plan.monthlyPriceInr,
      currency: "INR",
      startAt,
      currentPeriodStart: startAt,
      currentPeriodEnd: endIso,
      cancelledAt: baseStatus === "cancelled" ? legacy?.updatedAt || startAt : null,
      cancelAtPeriodEnd: false,
      trialStart: planId === "trial" ? startAt : null,
      trialEnd: planId === "trial" ? endIso : null,
      gatewaySubscriptionId: null,
      customOverrides: hasOverrides ? overrides : null,
      notes: legacy?.notes ?? "",
      createdAt: startAt,
      updatedAt: legacy?.updatedAt || startAt,
    };
    db.subscriptions.push(subRec);
  }

  // Ensure previously auto-backfilled client subscriptions or trials without an expiry date
  // receive a finite cycle end unless Super Admin explicitly cleared expiry or assigned Enterprise.
  const nowCheckMs = Date.now();
  const graceMs = Math.max(0, db.platformSettings.gracePeriodDays) * 86_400_000;
  for (const sub of db.subscriptions) {
    if (sub.currentPeriodEnd !== null || sub.planId === "enterprise") continue;
    if (sub.status === "suspended" || sub.status === "cancelled") continue;
    if (!isClientOrg(sub.organizationId)) continue;
    const isAutoBackfill = sub.id === `sub_${sub.organizationId}` || sub.planId === "trial";
    if (!isAutoBackfill) continue;
    const hasAdminExpiryOverride = db.subscriptionAuditLogs.some(
      (l) =>
        l.organizationId === sub.organizationId &&
        (l.action === "admin_set_custom_expiry" || l.action === "admin_update_subscription")
    );
    if (hasAdminExpiryOverride) continue;
    const plan = db.plans.find((p) => p.id === sub.planId);
    const anchorIso = sub.currentPeriodStart || sub.startAt || sub.createdAt;
    const endIso = anchorDefaultExpiryIso(anchorIso, sub.planId, plan?.trialDays ?? 14);
    sub.currentPeriodEnd = endIso;
    if (sub.planId === "trial" && !sub.trialEnd) {
      sub.trialEnd = endIso;
    }
    const endMs = Date.parse(endIso);
    if (Number.isFinite(endMs) && nowCheckMs >= endMs + graceMs) {
      sub.status = "expired";
    }
  }

  // Idempotently repair previously purchased or activated annual subscriptions whose cycle
  // was accidentally set to ~30 days (<= 45 days) unless an admin intentionally shortened it.
  const MAX_MISDATED_ANNUAL_MS = 45 * 86_400_000;
  for (const sub of db.subscriptions) {
    if (sub.billingInterval !== "annual") continue;
    if (sub.status === "suspended" || sub.status === "cancelled") continue;
    if (!sub.currentPeriodEnd) continue;
    if (!isClientOrg(sub.organizationId)) continue;
    const anchorIso = sub.currentPeriodStart || sub.startAt || sub.createdAt;
    const anchorMs = Date.parse(anchorIso);
    const endMs = Date.parse(sub.currentPeriodEnd);
    if (!Number.isFinite(anchorMs) || !Number.isFinite(endMs)) continue;
    if (endMs - anchorMs > MAX_MISDATED_ANNUAL_MS) continue;

    const alreadyRepaired = db.subscriptionAuditLogs.some(
      (l) =>
        l.organizationId === sub.organizationId &&
        l.subscriptionId === sub.id &&
        (l.action === "migration_repaired_annual_expiry" ||
          l.action === "admin_set_custom_expiry" ||
          l.action === "admin_expire_now")
    );
    if (alreadyRepaired) continue;

    const repairedPeriod = calculateSubscriptionPeriod(anchorMs, "annual");
    const previousEnd = sub.currentPeriodEnd;
    sub.currentPeriodEnd = repairedPeriod.currentPeriodEndIso;
    if (Date.parse(repairedPeriod.currentPeriodEndIso) + graceMs > nowCheckMs) {
      sub.status = "active";
    }
    sub.updatedAt = new Date(nowCheckMs).toISOString();
    db.subscriptionAuditLogs.unshift({
      id: `audit_repair_annual_${sub.id}`,
      organizationId: sub.organizationId,
      subscriptionId: sub.id,
      businessId: sub.businessId ?? null,
      adminId: "system_migration",
      actorEmail: "system@reviewly",
      action: "migration_repaired_annual_expiry",
      previousValues: {
        billingInterval: sub.billingInterval,
        currentPeriodStart: anchorIso,
        currentPeriodEnd: previousEnd,
      },
      newValues: {
        billingInterval: sub.billingInterval,
        currentPeriodStart: repairedPeriod.currentPeriodStartIso,
        currentPeriodEnd: repairedPeriod.currentPeriodEndIso,
      },
      reason: "Automatically repaired mis-dated annual subscription whose initial cycle was <= 45 days.",
      createdAt: new Date(nowCheckMs).toISOString(),
    });
  }

  return db;
}

