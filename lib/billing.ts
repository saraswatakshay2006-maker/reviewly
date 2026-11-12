import { readDB, writeDB, uid } from "./db";
import {
  FEATURE_CATALOG,
  createSeedFeaturesForPlan,
} from "./planSeed";
import {
  evaluateSubscriptionHealth,
  pickLatestOrgSubscription,
} from "./entitlements";
import {
  buildPlanDefinitionFromRecord,
  computeLimitUsage,
  parseRenewalTimestamp,
  subscriptionRecordToOrgSummary,
} from "./subscriptions";
import type {
  BillingInterval,
  CouponRecord,
  CustomEntitlementOverrides,
  DB,
  FeatureKey,
  PaymentRecord,
  PlanFeatureRecord,
  PlanRecord,
  PlatformBillingSettings,
  SubscriptionAuditLogRecord,
  SubscriptionRecord,
  SubscriptionStatus,
} from "./types";

function addBillingPeriodIso(
  baseMs: number,
  interval: BillingInterval
): string {
  if (interval === "annual") {
    const d = new Date(baseMs);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    return d.toISOString();
  }
  // Monthly and custom intervals default to a 30-day UTC billing period
  return new Date(baseMs + 30 * 86_400_000).toISOString();
}

export async function listPlansWithFeatures(includeInactive = false) {
  return readDB((db) =>
    db.plans
      .filter((p) => includeInactive || p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((plan) => ({
        ...plan,
        features: db.planFeatures.filter((pf) => pf.planId === plan.id),
        definition: buildPlanDefinitionFromRecord(plan, db.planFeatures),
      }))
  );
}

export async function getPlatformSettings(): Promise<PlatformBillingSettings> {
  return readDB((db) => ({ ...db.platformSettings }));
}

export async function updatePlatformSettingsAdmin(params: {
  gracePeriodDays?: number;
  reminderDays?: number[];
  annualBillingEnabled?: boolean;
  taxRatePercent?: number;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    if (typeof params.gracePeriodDays === "number") {
      db.platformSettings.gracePeriodDays = Math.max(
        0,
        Math.min(90, Math.floor(params.gracePeriodDays))
      );
    }
    if (Array.isArray(params.reminderDays)) {
      db.platformSettings.reminderDays = Array.from(
        new Set(
          params.reminderDays
            .map((d) => Math.floor(Number(d)))
            .filter((d) => Number.isFinite(d) && d >= 1 && d <= 60)
        )
      ).sort((a, b) => b - a);
    }
    if (typeof params.annualBillingEnabled === "boolean") {
      db.platformSettings.annualBillingEnabled = params.annualBillingEnabled;
    }
    if (typeof params.taxRatePercent === "number") {
      db.platformSettings.taxRatePercent = Math.max(
        0,
        Math.min(50, Math.round(params.taxRatePercent * 100) / 100)
      );
    }
    db.platformSettings.updatedAt = nowIso;
    return { ...db.platformSettings };
  });
}

export async function upsertPlanAdmin(params: {
  id?: string;
  slug: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceInr: number;
  annualPriceInr?: number | null;
  customPrice?: boolean;
  billingIntervalOptions?: BillingInterval[];
  maxLocations: number;
  maxTeamMembers: number;
  maxCards: number;
  supportTier: string;
  trialDays?: number;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  highlights?: string[];
  razorpayMonthlyPlanId?: string | null;
  razorpayAnnualPlanId?: string | null;
  features?: Partial<Record<FeatureKey, boolean>>;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    const cleanSlug = params.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!cleanSlug) throw new Error("Plan slug is required");

    const targetId = params.id?.trim() || cleanSlug;
    let plan = db.plans.find((p) => p.id === targetId);
    const isNew = !plan;

    if (params.isPopular) {
      for (const p of db.plans) {
        if (p.id !== targetId) p.isPopular = false;
      }
    }

    if (!plan) {
      if (db.plans.some((p) => p.slug === cleanSlug)) {
        throw new Error(`A plan with slug "${cleanSlug}" already exists.`);
      }
      plan = {
        id: targetId,
        slug: cleanSlug,
        name: params.name.trim(),
        badge: params.badge?.trim() || "Plan",
        description: params.description.trim(),
        monthlyPriceInr: Math.max(0, Math.round(params.monthlyPriceInr)),
        annualPriceInr:
          params.annualPriceInr !== undefined && params.annualPriceInr !== null
            ? Math.max(0, Math.round(params.annualPriceInr))
            : null,
        customPrice: Boolean(params.customPrice),
        currency: "INR",
        billingIntervalOptions: params.billingIntervalOptions?.length
          ? params.billingIntervalOptions
          : params.customPrice
          ? ["custom", "monthly", "annual"]
          : ["monthly", "annual"],
        maxLocations: Math.trunc(params.maxLocations),
        maxTeamMembers: Math.trunc(params.maxTeamMembers),
        maxCards: Math.trunc(params.maxCards),
        supportTier: params.supportTier.trim() || "Standard support",
        trialDays: Math.max(0, Math.trunc(params.trialDays ?? 14)),
        isActive: params.isActive,
        isPopular: Boolean(params.isPopular),
        sortOrder:
          typeof params.sortOrder === "number"
            ? params.sortOrder
            : db.plans.length + 1,
        highlights:
          params.highlights?.filter((h) => h.trim()).map((h) => h.trim()) || [],
        razorpayMonthlyPlanId: params.razorpayMonthlyPlanId?.trim() || null,
        razorpayAnnualPlanId: params.razorpayAnnualPlanId?.trim() || null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.plans.push(plan);
      const seedRows = createSeedFeaturesForPlan(plan.id);
      db.planFeatures.push(...seedRows);
    } else {
      plan.name = params.name.trim();
      if (params.badge !== undefined) plan.badge = params.badge.trim();
      plan.description = params.description.trim();
      plan.monthlyPriceInr = Math.max(0, Math.round(params.monthlyPriceInr));
      plan.annualPriceInr =
        params.annualPriceInr !== undefined && params.annualPriceInr !== null
          ? Math.max(0, Math.round(params.annualPriceInr))
          : null;
      if (params.customPrice !== undefined) plan.customPrice = params.customPrice;
      if (params.billingIntervalOptions?.length) {
        plan.billingIntervalOptions = params.billingIntervalOptions;
      }
      plan.maxLocations = Math.trunc(params.maxLocations);
      plan.maxTeamMembers = Math.trunc(params.maxTeamMembers);
      plan.maxCards = Math.trunc(params.maxCards);
      plan.supportTier = params.supportTier.trim() || plan.supportTier;
      if (typeof params.trialDays === "number") {
        plan.trialDays = Math.max(0, Math.trunc(params.trialDays));
      }
      plan.isActive = params.isActive;
      if (params.isPopular !== undefined) plan.isPopular = params.isPopular;
      if (typeof params.sortOrder === "number") plan.sortOrder = params.sortOrder;
      if (params.highlights) {
        plan.highlights = params.highlights
          .filter((h) => h.trim())
          .map((h) => h.trim());
      }
      if (params.razorpayMonthlyPlanId !== undefined) {
        plan.razorpayMonthlyPlanId = params.razorpayMonthlyPlanId?.trim() || null;
      }
      if (params.razorpayAnnualPlanId !== undefined) {
        plan.razorpayAnnualPlanId = params.razorpayAnnualPlanId?.trim() || null;
      }
      plan.updatedAt = nowIso;
    }

    if (params.features) {
      for (const meta of FEATURE_CATALOG) {
        if (params.features[meta.key] === undefined) continue;
        // Safety rule: never enable unimplemented placeholder integrations falsely
        const requested = Boolean(params.features[meta.key]);
        const finalEnabled = meta.implemented ? requested : false;
        const status = finalEnabled
          ? "active"
          : meta.implemented
          ? "unavailable"
          : meta.defaultUnavailableStatus;

        let row = db.planFeatures.find(
          (pf) => pf.planId === plan!.id && pf.featureKey === meta.key
        );
        if (!row) {
          row = {
            id: `${plan.id}:${meta.key}`,
            planId: plan.id,
            featureKey: meta.key,
            enabled: finalEnabled,
            availabilityStatus: status,
            configurationJson: null,
            updatedAt: nowIso,
          };
          db.planFeatures.push(row);
        } else {
          row.enabled = finalEnabled;
          row.availabilityStatus = status;
          row.updatedAt = nowIso;
        }
      }
    }

    return {
      isNew,
      plan,
      features: db.planFeatures.filter((pf) => pf.planId === plan!.id),
    };
  });
}

export async function listCouponsAdmin() {
  return readDB((db) =>
    [...db.coupons].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function upsertCouponAdmin(params: {
  id?: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  eligiblePlans: string[];
  maxRedemptions: number | null;
  expiresAt: string | null;
  isActive: boolean;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    const cleanCode = params.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) throw new Error("Coupon code is required");
    if (params.discountValue <= 0) throw new Error("Discount must be positive");
    if (params.discountType === "percent" && params.discountValue > 95) {
      throw new Error("Percent discount cannot exceed 95%");
    }

    let existing = params.id
      ? db.coupons.find((c) => c.id === params.id)
      : db.coupons.find((c) => c.code === cleanCode);

    if (existing) {
      existing.code = cleanCode;
      existing.discountType = params.discountType;
      existing.discountValue = Math.round(params.discountValue);
      existing.eligiblePlans = params.eligiblePlans;
      existing.maxRedemptions = params.maxRedemptions;
      existing.expiresAt = params.expiresAt || null;
      existing.isActive = params.isActive;
      existing.updatedAt = nowIso;
      return existing;
    }

    const coupon: CouponRecord = {
      id: `cpn_${uid()}`,
      code: cleanCode,
      discountType: params.discountType,
      discountValue: Math.round(params.discountValue),
      eligiblePlans: params.eligiblePlans,
      maxRedemptions: params.maxRedemptions,
      redemptionCount: 0,
      expiresAt: params.expiresAt || null,
      isActive: params.isActive,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.coupons.push(coupon);
    return coupon;
  });
}

export async function deleteCouponAdmin(id: string) {
  return writeDB((db) => {
    const before = db.coupons.length;
    db.coupons = db.coupons.filter((c) => c.id !== id);
    if (db.coupons.length === before) throw new Error("Coupon not found");
    return { deletedId: id };
  });
}

export function evaluateCouponInDB(
  db: DB,
  params: { code?: string | null; planId: string; amountInr: number; nowMs?: number }
): {
  valid: boolean;
  coupon: CouponRecord | null;
  discountAmountInr: number;
  error?: string;
} {
  const raw = params.code?.trim().toUpperCase();
  if (!raw) {
    return { valid: true, coupon: null, discountAmountInr: 0 };
  }
  const coupon = db.coupons.find((c) => c.code === raw);
  if (!coupon || !coupon.isActive) {
    return { valid: false, coupon: null, discountAmountInr: 0, error: "Invalid or inactive coupon code." };
  }
  const nowMs = params.nowMs ?? Date.now();
  if (coupon.expiresAt && nowMs >= Date.parse(coupon.expiresAt)) {
    return { valid: false, coupon: null, discountAmountInr: 0, error: "This coupon code has expired." };
  }
  if (
    coupon.maxRedemptions !== null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return { valid: false, coupon: null, discountAmountInr: 0, error: "Coupon redemption limit reached." };
  }
  if (
    coupon.eligiblePlans.length > 0 &&
    !coupon.eligiblePlans.includes(params.planId)
  ) {
    return {
      valid: false,
      coupon: null,
      discountAmountInr: 0,
      error: "Coupon is not valid for the selected plan.",
    };
  }
  const discount =
    coupon.discountType === "percent"
      ? Math.round((params.amountInr * coupon.discountValue) / 100)
      : coupon.discountValue;
  const clamped = Math.max(0, Math.min(params.amountInr - 1, discount));
  return { valid: true, coupon, discountAmountInr: clamped };
}

export interface CheckoutQuote {
  planId: string;
  planName: string;
  billingInterval: BillingInterval;
  baseAmountInr: number;
  prorationCreditInr: number;
  couponCode: string | null;
  discountAmountInr: number;
  taxRatePercent: number;
  taxAmountInr: number;
  totalAmountInr: number;
  actionType: "renew" | "upgrade" | "downgrade" | "activate";
  downgradeWarnings: string[];
  couponError?: string;
}

export async function calculateCheckoutQuote(params: {
  organizationId: string;
  planId: string;
  billingInterval: "monthly" | "annual";
  couponCode?: string | null;
  nowMs?: number;
}): Promise<CheckoutQuote> {
  return readDB((db) => {
    const nowMs = params.nowMs ?? Date.now();
    const org = db.organizations.find((o) => o.id === params.organizationId);
    if (!org) throw new Error("Organization not found");

    const plan = db.plans.find(
      (p) => (p.id === params.planId || p.slug === params.planId) && p.isActive
    );
    if (!plan) throw new Error("Selected plan is unavailable.");
    if (plan.customPrice) {
      throw new Error(
        "Enterprise custom plans require custom billing setup by Super Admin."
      );
    }

    const useAnnual =
      params.billingInterval === "annual" &&
      db.platformSettings.annualBillingEnabled &&
      plan.annualPriceInr !== null &&
      plan.annualPriceInr > 0;
    const effectiveInterval: BillingInterval = useAnnual ? "annual" : "monthly";
    const baseAmountInr = useAnnual
      ? (plan.annualPriceInr as number)
      : plan.monthlyPriceInr;
    if (baseAmountInr <= 0) {
      throw new Error("Selected plan does not have an online checkout price.");
    }

    const currentSub = pickLatestOrgSubscription(db, org.id);
    const currentPlan = currentSub
      ? db.plans.find((p) => p.id === currentSub.planId)
      : null;

    let actionType: CheckoutQuote["actionType"] = "activate";
    let prorationCreditInr = 0;

    if (currentSub) {
      const currentHealth = evaluateSubscriptionHealth(
        currentSub,
        db.platformSettings.gracePeriodDays,
        nowMs
      );
      if (currentSub.planId === plan.id) {
        actionType = "renew";
      } else if (
        currentPlan &&
        plan.monthlyPriceInr > (currentSub.amountInr || currentPlan.monthlyPriceInr)
      ) {
        actionType = "upgrade";
        // Mid-cycle unused balance credit if upgrading an active paid subscription
        if (
          currentHealth.isUsable &&
          currentSub.status === "active" &&
          currentSub.amountInr > 0 &&
          currentSub.currentPeriodEnd
        ) {
          const endMs = parseRenewalTimestamp(currentSub.currentPeriodEnd);
          const startMs = Date.parse(currentSub.currentPeriodStart);
          if (endMs && Number.isFinite(startMs) && endMs > nowMs && endMs > startMs) {
            const unusedRatio = Math.min(1, (endMs - nowMs) / (endMs - startMs));
            prorationCreditInr = Math.max(
              0,
              Math.min(baseAmountInr - 1, Math.floor(currentSub.amountInr * unusedRatio))
            );
          }
        }
      } else if (
        currentPlan &&
        plan.monthlyPriceInr < (currentPlan.monthlyPriceInr || currentSub.amountInr)
      ) {
        actionType = "downgrade";
      }
    }

    const afterProration = Math.max(1, baseAmountInr - prorationCreditInr);
    const cpn = evaluateCouponInDB(db, {
      code: params.couponCode,
      planId: plan.id,
      amountInr: afterProration,
      nowMs,
    });

    const taxableAmount = Math.max(1, afterProration - cpn.discountAmountInr);
    const taxRatePercent = db.platformSettings.taxRatePercent || 0;
    const taxAmountInr = Math.round((taxableAmount * taxRatePercent) / 100);
    const totalAmountInr = Math.max(1, taxableAmount + taxAmountInr);

    // Check resource limit warnings when switching/downgrading (never deletes data)
    const bizCount = db.businesses.filter((b) => b.organizationId === org.id).length;
    const teamCount = db.users.filter((u) => u.organizationId === org.id).length;
    const bizIds = new Set(
      db.businesses.filter((b) => b.organizationId === org.id).map((b) => b.id)
    );
    const activeCards = db.cards.filter(
      (c) => bizIds.has(c.businessId) && c.status === "active"
    ).length;

    const downgradeWarnings: string[] = [];
    if (plan.maxLocations >= 0 && bizCount > plan.maxLocations) {
      downgradeWarnings.push(
        `You currently have ${bizCount} locations, which exceeds ${plan.name}'s limit of ${plan.maxLocations}. Existing data stays intact, but adding new locations will be blocked.`
      );
    }
    if (plan.maxTeamMembers >= 0 && teamCount > plan.maxTeamMembers) {
      downgradeWarnings.push(
        `You currently have ${teamCount} team accounts, exceeding ${plan.name}'s limit of ${plan.maxTeamMembers}. Existing members stay intact, but inviting new members will be blocked.`
      );
    }
    if (plan.maxCards >= 0 && activeCards > plan.maxCards) {
      downgradeWarnings.push(
        `You currently have ${activeCards} active NFC/QR cards, exceeding ${plan.name}'s limit of ${plan.maxCards}.`
      );
    }

    return {
      planId: plan.id,
      planName: plan.name,
      billingInterval: effectiveInterval,
      baseAmountInr,
      prorationCreditInr,
      couponCode: cpn.valid && cpn.coupon ? cpn.coupon.code : null,
      discountAmountInr: cpn.discountAmountInr,
      taxRatePercent,
      taxAmountInr,
      totalAmountInr,
      actionType,
      downgradeWarnings,
      ...(cpn.error ? { couponError: cpn.error } : {}),
    };
  });
}

export async function createPendingPaymentRecord(params: {
  organizationId: string;
  planId: string;
  billingInterval: BillingInterval;
  couponCode: string | null;
  discountAmountInr: number;
  taxAmountInr: number;
  amountInr: number;
  gatewayOrderId: string;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    const sub = pickLatestOrgSubscription(db, params.organizationId);
    const primaryBiz = db.businesses.find(
      (b) => b.organizationId === params.organizationId
    );
    const rec: PaymentRecord = {
      id: `pay_${uid()}`,
      organizationId: params.organizationId,
      businessId: primaryBiz?.id ?? sub?.businessId ?? null,
      subscriptionId: sub?.id ?? `sub_${params.organizationId}`,
      planId: params.planId,
      billingInterval: params.billingInterval,
      couponCode: params.couponCode,
      discountAmountInr: params.discountAmountInr,
      taxAmountInr: params.taxAmountInr,
      amountInr: params.amountInr,
      currency: "INR",
      gateway: "razorpay",
      gatewayPaymentId: null,
      gatewayOrderId: params.gatewayOrderId,
      status: "PENDING",
      paymentMethod: null,
      invoiceNumber: null,
      failureReason: null,
      paidAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.payments.push(rec);
    return rec;
  });
}

function nextInvoiceNumber(db: DB, nowIso: string): string {
  const year = nowIso.slice(0, 4);
  const key = `invoice_${year}`;
  const next = (db.seq[key] ?? 0) + 1;
  db.seq[key] = next;
  return `INV-${year}-${String(next).padStart(4, "0")}`;
}

function applySuccessfulPaymentActivationInTx(params: {
  db: DB;
  payment: PaymentRecord;
  gatewayPaymentId: string;
  paymentMethod?: string | null;
  actorEmail?: string | null;
  source: "verify_api" | "webhook";
  nowMs?: number;
}) {
  const { db, payment, gatewayPaymentId } = params;
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // Idempotency guard: if payment was already finalized as SUCCESS with this ID, do nothing twice
  if (payment.status === "SUCCESS") {
    const currentSub = db.subscriptions.find(
      (s) => s.id === payment.subscriptionId || s.organizationId === payment.organizationId
    );
    return { alreadyFinalized: true, payment, subscription: currentSub ?? null };
  }

  payment.status = "SUCCESS";
  payment.gatewayPaymentId = gatewayPaymentId;
  payment.paymentMethod = params.paymentMethod || payment.paymentMethod || "razorpay";
  payment.invoiceNumber = payment.invoiceNumber || nextInvoiceNumber(db, nowIso);
  payment.failureReason = null;
  payment.paidAt = nowIso;
  payment.updatedAt = nowIso;

  if (payment.couponCode) {
    const coupon = db.coupons.find((c) => c.code === payment.couponCode);
    if (coupon) {
      coupon.redemptionCount += 1;
      coupon.updatedAt = nowIso;
    }
  }

  const org = db.organizations.find((o) => o.id === payment.organizationId);
  if (!org) throw new Error("Organization not found");

  const plan = db.plans.find((p) => p.id === payment.planId);
  if (!plan) throw new Error("Plan not found");

  let sub = pickLatestOrgSubscription(db, org.id);
  const primaryBiz = db.businesses.find((b) => b.organizationId === org.id);
  const agreedPriceInr =
    payment.billingInterval === "annual" && plan.annualPriceInr
      ? plan.annualPriceInr
      : plan.monthlyPriceInr;

  const prevSnapshot = sub
    ? {
        planId: sub.planId,
        status: sub.status,
        amountInr: sub.amountInr,
        currentPeriodEnd: sub.currentPeriodEnd,
      }
    : null;

  // Determine renewal vs fresh start anchor
  const existingEndMs = parseRenewalTimestamp(sub?.currentPeriodEnd);
  const isSamePlanRenewalBeforeExpiry =
    sub &&
    sub.planId === plan.id &&
    sub.status === "active" &&
    existingEndMs !== null &&
    existingEndMs > nowMs;

  const periodStartMs = nowMs;
  const anchorForEndMs = isSamePlanRenewalBeforeExpiry ? (existingEndMs as number) : nowMs;
  const newPeriodEndIso = addBillingPeriodIso(
    anchorForEndMs,
    payment.billingInterval
  );

  let auditAction = "subscription_renewed";
  if (!sub) {
    sub = {
      id: `sub_${uid()}`,
      organizationId: org.id,
      businessId: primaryBiz?.id ?? null,
      planId: plan.id,
      status: "active",
      paymentStatus: "SUCCESS",
      billingInterval: payment.billingInterval,
      amountInr: agreedPriceInr,
      currency: "INR",
      startAt: nowIso,
      currentPeriodStart: new Date(periodStartMs).toISOString(),
      currentPeriodEnd: newPeriodEndIso,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
      gatewaySubscriptionId: null,
      customOverrides: null,
      notes: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.subscriptions.push(sub);
    auditAction = "payment_verified_activation";
  } else {
    const oldPlan = db.plans.find((p) => p.id === sub!.planId);
    if (sub.planId === "trial") {
      auditAction = "trial_converted";
    } else if (oldPlan && plan.monthlyPriceInr > oldPlan.monthlyPriceInr) {
      auditAction = "payment_verified_upgrade";
    } else if (oldPlan && plan.monthlyPriceInr < oldPlan.monthlyPriceInr) {
      auditAction = "plan_downgraded";
    }

    sub.planId = plan.id;
    sub.status = "active";
    sub.paymentStatus = "SUCCESS";
    sub.billingInterval = payment.billingInterval;
    sub.amountInr = agreedPriceInr;
    sub.currentPeriodStart = new Date(periodStartMs).toISOString();
    sub.currentPeriodEnd = newPeriodEndIso;
    sub.cancelledAt = null;
    sub.cancelAtPeriodEnd = false;
    // Reset fixed overrides on self-serve plan change so new plan's DB limits apply
    if (plan.id !== "enterprise") {
      sub.customOverrides = null;
    }
    sub.updatedAt = nowIso;
  }

  org.subscription = subscriptionRecordToOrgSummary(sub, plan);

  db.subscriptionAuditLogs.push({
    id: uid(),
    subscriptionId: sub.id,
    organizationId: org.id,
    businessId: sub.businessId,
    adminId: null,
    actorEmail: params.actorEmail || params.source,
    action: auditAction,
    previousValues: prevSnapshot,
    newValues: {
      planId: sub.planId,
      status: sub.status,
      amountInr: sub.amountInr,
      billingInterval: sub.billingInterval,
      currentPeriodEnd: sub.currentPeriodEnd,
      paymentId: payment.id,
      gatewayPaymentId,
      source: params.source,
    },
    reason: `Verified Razorpay payment (${payment.invoiceNumber}) via ${params.source}.`,
    createdAt: nowIso,
  });

  return { alreadyFinalized: false, payment, subscription: sub };
}

export async function finalizeVerifiedPayment(params: {
  organizationId?: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  paymentMethod?: string | null;
  actorEmail?: string | null;
  source?: "verify_api" | "webhook";
  nowMs?: number;
}) {
  return writeDB((db) => {
    const payment = db.payments.find(
      (p) =>
        p.gatewayOrderId === params.gatewayOrderId &&
        (!params.organizationId || p.organizationId === params.organizationId)
    );
    if (!payment) {
      throw new Error("Pending payment order not found");
    }
    return applySuccessfulPaymentActivationInTx({
      db,
      payment,
      gatewayPaymentId: params.gatewayPaymentId,
      paymentMethod: params.paymentMethod,
      actorEmail: params.actorEmail,
      source: params.source || "verify_api",
      nowMs: params.nowMs,
    });
  });
}

export async function markPaymentFailed(params: {
  organizationId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  failureReason: string;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    const payment = db.payments.find(
      (p) =>
        (params.gatewayOrderId && p.gatewayOrderId === params.gatewayOrderId) ||
        (params.gatewayPaymentId && p.gatewayPaymentId === params.gatewayPaymentId)
    );
    if (!payment) return null;
    if (params.organizationId && payment.organizationId !== params.organizationId) {
      return null;
    }
    // Never overwrite a previously finalized SUCCESS payment
    if (payment.status === "SUCCESS") return payment;
    payment.status = "FAILED";
    if (params.gatewayPaymentId) payment.gatewayPaymentId = params.gatewayPaymentId;
    payment.failureReason = params.failureReason.slice(0, 300);
    payment.updatedAt = nowIso;
    return payment;
  });
}

export async function processRazorpayWebhookEvent(params: {
  externalEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  nowMs?: number;
}): Promise<{ duplicate: boolean; status: string; detail?: string }> {
  return writeDB((db) => {
    const nowMs = params.nowMs ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // Enforce idempotency on (provider, externalEventId)
    const existingEvent = db.paymentWebhookEvents.find(
      (e) =>
        e.provider === "razorpay" && e.externalEventId === params.externalEventId
    );
    if (existingEvent) {
      return {
        duplicate: true,
        status: existingEvent.processingStatus,
        detail: "Duplicate webhook event ignored idempotently.",
      };
    }

    const payloadObj = params.payload as {
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            method?: string;
            status?: string;
            error_description?: string;
            error_reason?: string;
          };
        };
        order?: {
          entity?: { id?: string; amount_paid?: number; status?: string };
        };
        refund?: {
          entity?: { id?: string; payment_id?: string; amount?: number };
        };
        subscription?: {
          entity?: { id?: string };
        };
      };
    };

    const paymentEntity = payloadObj.payload?.payment?.entity;
    const orderEntity = payloadObj.payload?.order?.entity;
    const refundEntity = payloadObj.payload?.refund?.entity;

    let processingStatus: "processed" | "ignored" | "failed" = "ignored";
    let detail = `Event ${params.eventType} recorded.`;

    if (
      params.eventType === "payment.captured" ||
      params.eventType === "order.paid" ||
      params.eventType === "subscription.charged"
    ) {
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const gatewayPaymentId = paymentEntity?.id || `wh_${params.externalEventId}`;
      const matched = orderId
        ? db.payments.find((p) => p.gatewayOrderId === orderId)
        : undefined;

      if (matched) {
        const expectedPaise = Math.round(matched.amountInr * 100);
        const receivedPaise =
          typeof paymentEntity?.amount === "number"
            ? paymentEntity.amount
            : typeof orderEntity?.amount_paid === "number"
            ? orderEntity.amount_paid
            : expectedPaise;

        if (receivedPaise < expectedPaise) {
          processingStatus = "failed";
          detail = `Captured amount (${receivedPaise}) is below order amount (${expectedPaise}).`;
        } else {
          applySuccessfulPaymentActivationInTx({
            db,
            payment: matched,
            gatewayPaymentId,
            paymentMethod: paymentEntity?.method || "razorpay",
            actorEmail: "webhook@razorpay",
            source: "webhook",
            nowMs,
          });
          processingStatus = "processed";
          detail = `Order ${orderId} confirmed via webhook.`;
        }
      } else {
        detail = `No local pending payment matched order ${orderId ?? "unknown"}.`;
      }
    } else if (params.eventType === "payment.failed") {
      const orderId = paymentEntity?.order_id;
      const matched = orderId
        ? db.payments.find((p) => p.gatewayOrderId === orderId)
        : undefined;
      if (matched && matched.status !== "SUCCESS") {
        matched.status = "FAILED";
        matched.gatewayPaymentId = paymentEntity?.id || matched.gatewayPaymentId;
        matched.failureReason =
          paymentEntity?.error_description ||
          paymentEntity?.error_reason ||
          "Payment failed at gateway";
        matched.updatedAt = nowIso;
        processingStatus = "processed";
        detail = `Order ${orderId} marked FAILED.`;
      }
    } else if (
      params.eventType === "refund.created" ||
      params.eventType === "payment.refunded"
    ) {
      const gwPaymentId = refundEntity?.payment_id || paymentEntity?.id;
      const matched = gwPaymentId
        ? db.payments.find((p) => p.gatewayPaymentId === gwPaymentId)
        : undefined;
      if (matched) {
        const refundedPaise = refundEntity?.amount ?? Math.round(matched.amountInr * 100);
        matched.status =
          refundedPaise < Math.round(matched.amountInr * 100)
            ? "PARTIALLY_REFUNDED"
            : "REFUNDED";
        matched.updatedAt = nowIso;
        processingStatus = "processed";
        detail = `Payment ${gwPaymentId} marked ${matched.status}.`;
      }
    }

    db.paymentWebhookEvents.push({
      id: `wh_${uid()}`,
      provider: "razorpay",
      externalEventId: params.externalEventId,
      eventType: params.eventType,
      processingStatus,
      payloadSummary: detail,
      receivedAt: nowIso,
      processedAt: nowIso,
    });

    return { duplicate: false, status: processingStatus, detail };
  });
}

export async function cancelOrganizationSubscription(params: {
  organizationId: string;
  actorEmail: string;
  immediate?: boolean;
  reason?: string;
}) {
  return writeDB((db) => {
    const nowIso = new Date().toISOString();
    const org = db.organizations.find((o) => o.id === params.organizationId);
    if (!org) throw new Error("Workspace not found");
    const sub = pickLatestOrgSubscription(db, org.id);
    if (!sub) throw new Error("Subscription not found");

    const prev = {
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
    };

    sub.status = "cancelled";
    sub.cancelledAt = nowIso;
    sub.cancelAtPeriodEnd = !params.immediate;
    if (params.immediate) {
      sub.currentPeriodEnd = nowIso;
    }
    sub.updatedAt = nowIso;

    const plan = db.plans.find((p) => p.id === sub.planId);
    org.subscription = subscriptionRecordToOrgSummary(sub, plan);

    db.subscriptionAuditLogs.push({
      id: uid(),
      subscriptionId: sub.id,
      organizationId: org.id,
      businessId: sub.businessId,
      adminId: null,
      actorEmail: params.actorEmail,
      action: params.immediate ? "owner_cancelled_immediate" : "owner_cancelled_period_end",
      previousValues: prev,
      newValues: {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
      },
      reason:
        params.reason?.trim() ||
        (params.immediate
          ? "Cancelled immediately by owner"
          : "Cancelled at end of billing cycle by owner"),
      createdAt: nowIso,
    });

    return sub;
  });
}

export type AdminSubscriptionActionType =
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
  | "cancel";

export async function applyAdminSubscriptionAction(params: {
  organizationId: string;
  adminId: string;
  adminEmail: string;
  action: AdminSubscriptionActionType;
  reason: string;
  planId?: string;
  billingInterval?: BillingInterval;
  amountInr?: number;
  extendDays?: number;
  customExpiryIso?: string | null;
  cancelImmediately?: boolean;
  customOverrides?: CustomEntitlementOverrides | null;
}) {
  return writeDB((db) => {
    const cleanReason = params.reason.trim();
    if (params.action === "activate_manual" && cleanReason.length < 3) {
      throw new Error(
        "Manual subscription activation requires an administrator reason."
      );
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const org = db.organizations.find((o) => o.id === params.organizationId);
    if (!org) throw new Error("Organization not found");

    let sub = pickLatestOrgSubscription(db, org.id);
    const primaryBiz = db.businesses.find((b) => b.organizationId === org.id);
    if (!sub) {
      sub = {
        id: `sub_${uid()}`,
        organizationId: org.id,
        businessId: primaryBiz?.id ?? null,
        planId: "starter",
        status: "active",
        paymentStatus: "MANUAL",
        billingInterval: "monthly",
        amountInr: 299,
        currency: "INR",
        startAt: nowIso,
        currentPeriodStart: nowIso,
        currentPeriodEnd: new Date(nowMs + 30 * 86_400_000).toISOString(),
        cancelledAt: null,
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
        gatewaySubscriptionId: null,
        customOverrides: null,
        notes: "",
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.subscriptions.push(sub);
    }

    const prevSnapshot: Record<string, unknown> = {
      planId: sub.planId,
      status: sub.status,
      paymentStatus: sub.paymentStatus,
      amountInr: sub.amountInr,
      billingInterval: sub.billingInterval,
      currentPeriodEnd: sub.currentPeriodEnd,
      customOverrides: sub.customOverrides ?? null,
    };

    const targetPlan = params.planId
      ? db.plans.find((p) => p.id === params.planId)
      : db.plans.find((p) => p.id === sub!.planId);
    if (params.planId && !targetPlan) {
      throw new Error("Target plan not found");
    }

    switch (params.action) {
      case "activate_manual": {
        if (targetPlan) {
          sub.planId = targetPlan.id;
          sub.amountInr =
            typeof params.amountInr === "number"
              ? params.amountInr
              : targetPlan.monthlyPriceInr;
        }
        const days = Math.max(1, params.extendDays ?? 30);
        sub.status = "active";
        // Non-negotiable rule: manual activation never fakes a Razorpay payment
        sub.paymentStatus = "MANUAL";
        sub.cancelledAt = null;
        sub.cancelAtPeriodEnd = false;
        sub.currentPeriodStart = nowIso;
        sub.currentPeriodEnd =
          params.customExpiryIso ||
          new Date(nowMs + days * 86_400_000).toISOString();
        break;
      }
      case "extend": {
        const days = Math.max(1, Math.min(3650, params.extendDays ?? 30));
        const currentEndMs = parseRenewalTimestamp(sub.currentPeriodEnd);
        const anchorMs =
          currentEndMs && currentEndMs > nowMs ? currentEndMs : nowMs;
        sub.currentPeriodEnd = new Date(
          anchorMs + days * 86_400_000
        ).toISOString();
        if (sub.status === "expired" || sub.status === "past_due") {
          sub.status = sub.planId === "trial" ? "trialing" : "active";
        }
        break;
      }
      case "change_plan": {
        if (!targetPlan) throw new Error("Target plan required");
        sub.planId = targetPlan.id;
        sub.billingInterval = params.billingInterval ?? sub.billingInterval;
        sub.amountInr =
          typeof params.amountInr === "number"
            ? params.amountInr
            : sub.billingInterval === "annual" && targetPlan.annualPriceInr
            ? targetPlan.annualPriceInr
            : targetPlan.monthlyPriceInr;
        if (targetPlan.id !== "enterprise") {
          sub.customOverrides = null;
        }
        break;
      }
      case "suspend": {
        sub.status = "suspended";
        break;
      }
      case "reactivate": {
        sub.status = sub.planId === "trial" ? "trialing" : "active";
        sub.cancelledAt = null;
        sub.cancelAtPeriodEnd = false;
        const endMs = parseRenewalTimestamp(sub.currentPeriodEnd);
        if (endMs !== null && endMs <= nowMs) {
          const days = Math.max(1, params.extendDays ?? 30);
          sub.currentPeriodEnd = new Date(
            nowMs + days * 86_400_000
          ).toISOString();
        }
        break;
      }
      case "grant_trial": {
        const trialPlan = db.plans.find((p) => p.id === "trial");
        const days = Math.max(1, params.extendDays ?? trialPlan?.trialDays ?? 14);
        sub.planId = "trial";
        sub.status = "trialing";
        sub.paymentStatus = "NONE";
        sub.amountInr = 0;
        sub.trialStart = nowIso;
        sub.trialEnd = new Date(nowMs + days * 86_400_000).toISOString();
        sub.currentPeriodStart = nowIso;
        sub.currentPeriodEnd = sub.trialEnd;
        sub.cancelledAt = null;
        sub.cancelAtPeriodEnd = false;
        sub.customOverrides = null;
        break;
      }
      case "set_custom_expiry": {
        sub.currentPeriodEnd = params.customExpiryIso ?? null;
        const endMs = parseRenewalTimestamp(sub.currentPeriodEnd);
        if (endMs !== null && nowMs >= endMs) {
          sub.status = "expired";
        } else if (sub.status === "expired") {
          sub.status = sub.planId === "trial" ? "trialing" : "active";
        }
        break;
      }
      case "expire_now": {
        sub.status = "expired";
        sub.currentPeriodEnd = nowIso;
        sub.cancelAtPeriodEnd = false;
        break;
      }
      case "assign_enterprise": {
        const entPlan = db.plans.find((p) => p.id === "enterprise");
        sub.planId = entPlan?.id || "enterprise";
        sub.status = "active";
        sub.paymentStatus = "MANUAL";
        sub.billingInterval = params.billingInterval || "custom";
        sub.amountInr =
          typeof params.amountInr === "number" ? params.amountInr : sub.amountInr;
        sub.currentPeriodStart = nowIso;
        sub.currentPeriodEnd =
          params.customExpiryIso !== undefined
            ? params.customExpiryIso
            : new Date(nowMs + 365 * 86_400_000).toISOString();
        sub.customOverrides = params.customOverrides ?? sub.customOverrides ?? {};
        sub.cancelledAt = null;
        sub.cancelAtPeriodEnd = false;
        break;
      }
      case "update_entitlements": {
        sub.customOverrides = params.customOverrides ?? null;
        if (typeof params.amountInr === "number") {
          sub.amountInr = params.amountInr;
        }
        break;
      }
      case "cancel": {
        sub.status = "cancelled";
        sub.cancelledAt = nowIso;
        sub.cancelAtPeriodEnd = !params.cancelImmediately;
        if (params.cancelImmediately) {
          sub.currentPeriodEnd = nowIso;
        }
        break;
      }
    }

    if (cleanReason) {
      sub.notes = cleanReason;
    }
    sub.updatedAt = nowIso;

    const finalPlan = db.plans.find((p) => p.id === sub!.planId);
    org.subscription = subscriptionRecordToOrgSummary(sub, finalPlan);

    const logEntry: SubscriptionAuditLogRecord = {
      id: uid(),
      subscriptionId: sub.id,
      organizationId: org.id,
      businessId: sub.businessId,
      adminId: params.adminId,
      actorEmail: params.adminEmail,
      action: `admin_${params.action}`,
      previousValues: prevSnapshot,
      newValues: {
        planId: sub.planId,
        status: sub.status,
        paymentStatus: sub.paymentStatus,
        amountInr: sub.amountInr,
        billingInterval: sub.billingInterval,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        customOverrides: sub.customOverrides ?? null,
      },
      reason: cleanReason || `Admin action: ${params.action}`,
      createdAt: nowIso,
    };
    db.subscriptionAuditLogs.push(logEntry);

    return { subscription: sub, organization: org, auditLog: logEntry };
  });
}

export async function getOwnerBillingOverview(
  organizationId: string,
  nowMs: number = Date.now()
) {
  return readDB((db) => {
    const org = db.organizations.find((o) => o.id === organizationId);
    if (!org) return null;
    const sub = pickLatestOrgSubscription(db, organizationId);
    if (!sub) return null;

    const plan =
      db.plans.find((p) => p.id === sub.planId) ?? db.plans.find((p) => p.id === "starter")!;
    const settings = db.platformSettings;
    const health = evaluateSubscriptionHealth(sub, settings.gracePeriodDays, nowMs);

    const businesses = db.businesses.filter((b) => b.organizationId === organizationId);
    const bizIds = new Set(businesses.map((b) => b.id));
    const teamMembers = db.users.filter((u) => u.organizationId === organizationId).length;
    const activeCards = db.cards.filter(
      (c) => bizIds.has(c.businessId) && c.status === "active"
    ).length;

    const maxLocations = sub.customOverrides?.maxLocations ?? plan.maxLocations;
    const maxTeamMembers =
      sub.customOverrides?.maxTeamMembers ?? plan.maxTeamMembers;
    const maxCards = sub.customOverrides?.maxCards ?? plan.maxCards;

    const plans = db.plans
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        ...p,
        features: db.planFeatures.filter((pf) => pf.planId === p.id),
        definition: buildPlanDefinitionFromRecord(p, db.planFeatures),
      }));

    const payments = db.payments
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => ({
        ...p,
        planName: db.plans.find((pl) => pl.id === p.planId)?.name || p.planId,
      }));

    const currentFeatures = db.planFeatures
      .filter((pf) => pf.planId === plan.id)
      .map((pf) => {
        const meta = FEATURE_CATALOG.find((c) => c.key === pf.featureKey);
        const override = sub.customOverrides?.features?.[pf.featureKey];
        const enabled =
          meta?.implemented === false
            ? false
            : typeof override === "boolean"
            ? override
            : pf.enabled;
        return {
          key: pf.featureKey,
          label: meta?.label || pf.featureKey,
          description: meta?.description || "",
          enabled,
          implemented: meta?.implemented ?? true,
          availabilityStatus:
            meta?.implemented === false
              ? meta.defaultUnavailableStatus
              : enabled
              ? "active"
              : "unavailable",
        };
      });

    return {
      organization: { id: org.id, name: org.name, slug: org.slug },
      subscription: {
        ...sub,
        planName: plan.name,
        supportTier: sub.customOverrides?.supportTier ?? plan.supportTier,
        ...health,
      },
      limits: {
        locations: computeLimitUsage(businesses.length, maxLocations),
        teamMembers: computeLimitUsage(teamMembers, maxTeamMembers),
        cards: computeLimitUsage(activeCards, maxCards),
      },
      currentFeatures,
      plans,
      payments,
      settings,
    };
  });
}

export async function getPaymentInvoiceForOrg(
  paymentId: string,
  organizationId: string,
  isSuperAdmin = false
) {
  return readDB((db) => {
    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) return null;
    if (!isSuperAdmin && payment.organizationId !== organizationId) return null;
    const org = db.organizations.find((o) => o.id === payment.organizationId);
    const biz =
      (payment.businessId && db.businesses.find((b) => b.id === payment.businessId)) ||
      db.businesses.find((b) => b.organizationId === payment.organizationId) ||
      null;
    const plan = db.plans.find((p) => p.id === payment.planId) ?? null;
    const owner =
      db.users.find((u) => u.organizationId === payment.organizationId && u.role === "owner") ||
      db.users.find((u) => u.organizationId === payment.organizationId) ||
      null;
    return {
      payment,
      organization: org ? { id: org.id, name: org.name, slug: org.slug } : null,
      business: biz ? { id: biz.id, name: biz.name, address: biz.address } : null,
      plan: plan ? { id: plan.id, name: plan.name } : null,
      owner: owner ? { name: owner.name, email: owner.email } : null,
    };
  });
}
