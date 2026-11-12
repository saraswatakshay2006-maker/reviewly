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

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status !== "suspended" && status !== "cancelled";
}

export function createDefaultTrialSubscription(): OrganizationSubscription {
  const now = new Date();
  const renewal = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    plan: "trial",
    status: "trialing",
    monthlyPriceInr: PLAN_DEFAULTS.trial.monthlyPriceInr,
    cardLimit: PLAN_DEFAULTS.trial.cardLimit,
    renewalDate: renewal.toISOString().slice(0, 10),
    notes: "",
    updatedAt: now.toISOString(),
  };
}

