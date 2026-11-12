export type Role =
  | "owner"
  | "business_admin"
  | "branch_manager"
  | "staff"
  | "super_admin";

export type SubscriptionPlan =
  | "trial"
  | "starter"
  | "growth"
  | "pro"
  | "enterprise"
  | (string & {});

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "expired"
  | "suspended"
  | "cancelled";

export type BillingInterval = "monthly" | "annual" | "custom";

export type FeatureKey =
  | "qr_nfc_enabled"
  | "digital_review_page"
  | "basic_analytics"
  | "customer_feedback"
  | "advanced_analytics"
  | "review_management"
  | "ai_review_response"
  | "feedback_insights"
  | "monthly_reports"
  | "branch_reports"
  | "export_reports"
  | "advanced_branding"
  | "white_label"
  | "competitor_tracking"
  | "api_access"
  | "external_google_reply_sync";

export type FeatureAvailabilityStatus =
  | "active"
  | "unavailable"
  | "coming_soon"
  | "integration_required";

export interface PlanRecord {
  id: string;
  slug: string;
  name: string;
  badge: string;
  description: string;
  monthlyPriceInr: number;
  annualPriceInr: number | null;
  customPrice: boolean;
  currency: string;
  billingIntervalOptions: BillingInterval[];
  maxLocations: number; // -1 means explicit unlimited
  maxTeamMembers: number; // -1 means explicit unlimited
  maxCards: number; // -1 means explicit unlimited
  supportTier: string;
  trialDays: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  highlights: string[];
  razorpayMonthlyPlanId?: string | null;
  razorpayAnnualPlanId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatureRecord {
  id: string;
  planId: string;
  featureKey: FeatureKey;
  enabled: boolean;
  availabilityStatus: FeatureAvailabilityStatus;
  configurationJson: Record<string, unknown> | null;
  updatedAt: string;
}

export interface CustomEntitlementOverrides {
  maxLocations?: number;
  maxTeamMembers?: number;
  maxCards?: number;
  features?: Partial<Record<FeatureKey, boolean>>;
  supportTier?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface SubscriptionRecord {
  id: string;
  organizationId: string;
  businessId: string | null;
  planId: string;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus | "NONE" | "MANUAL";
  billingInterval: BillingInterval;
  amountInr: number;
  currency: string;
  startAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  cancelAtPeriodEnd: boolean;
  trialStart: string | null;
  trialEnd: string | null;
  gatewaySubscriptionId: string | null;
  customOverrides?: CustomEntitlementOverrides | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  businessId: string | null;
  subscriptionId: string;
  planId: string;
  billingInterval: BillingInterval;
  couponCode: string | null;
  discountAmountInr: number;
  taxAmountInr: number;
  amountInr: number;
  currency: string;
  gateway: "razorpay" | "manual";
  gatewayPaymentId: string | null;
  gatewayOrderId: string | null;
  status: PaymentStatus;
  paymentMethod: string | null;
  invoiceNumber: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookEventRecord {
  id: string;
  provider: "razorpay";
  externalEventId: string;
  eventType: string;
  processingStatus: "processed" | "ignored" | "failed";
  payloadSummary: string;
  receivedAt: string;
  processedAt: string;
}

export interface SubscriptionAuditLogRecord {
  id: string;
  subscriptionId: string;
  organizationId: string;
  businessId: string | null;
  adminId: string | null;
  actorEmail: string | null;
  action: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  reason: string;
  createdAt: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  eligiblePlans: string[];
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformBillingSettings {
  gracePeriodDays: number;
  reminderDays: number[];
  annualBillingEnabled: boolean;
  taxRatePercent: number;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: Role;
  organizationId: string;
  createdAt: string;
}

export interface OrganizationSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyPriceInr: number;
  cardLimit: number;
  locationLimit?: number;
  teamLimit?: number;
  renewalDate: string | null;
  billingInterval?: BillingInterval;
  notes: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  subscription?: OrganizationSubscription;
}

export interface Business {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  address: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  welcomeMessage: string;
  googleReviewUrl: string;
  publicSlug: string;
  createdAt: string;
}

export interface Member {
  id: string;
  businessId: string;
  userId: string;
  role: Role;
  branchId: string | null;
  createdAt: string;
}

export interface ReviewCard {
  id: string;
  businessId: string;
  branchId: string | null;
  token: string;
  status: "active" | "inactive" | "lost" | "retired";
  chipType: "NTAG213" | "NTAG215" | "QR";
  label: string;
  createdAt: string;
}

export interface CustomerSession {
  id: string;
  businessId: string;
  organizationId: string;
  token: string | null;
  scanType: "nfc" | "qr" | "direct";
  deviceType: string;
  visitedAt: string;
}

export type EventType = "rating_select" | "google_click" | "feedback_submit";

export interface Event {
  id: string;
  sessionId: string;
  businessId: string;
  organizationId: string;
  type: EventType;
  rating: number | null;
  createdAt: string;
}

export interface FeedbackSubmission {
  id: string;
  sessionId: string | null;
  businessId: string;
  organizationId: string;
  message: string;
  rating: number | null;
  complaint: boolean;
  replyNote: string | null;
  createdAt: string;
}

export interface DB {
  users: User[];
  organizations: Organization[];
  businesses: Business[];
  members: Member[];
  cards: ReviewCard[];
  sessions: CustomerSession[];
  events: Event[];
  feedback: FeedbackSubmission[];
  plans: PlanRecord[];
  planFeatures: PlanFeatureRecord[];
  subscriptions: SubscriptionRecord[];
  payments: PaymentRecord[];
  paymentWebhookEvents: PaymentWebhookEventRecord[];
  subscriptionAuditLogs: SubscriptionAuditLogRecord[];
  coupons: CouponRecord[];
  platformSettings: PlatformBillingSettings;
  seq: Record<string, number>;
}
