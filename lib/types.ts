export type Role = "owner" | "branch_manager" | "staff" | "super_admin";

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

export type SubscriptionPlan = "trial" | "starter" | "growth" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export interface OrganizationSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyPriceInr: number;
  cardLimit: number;
  renewalDate: string | null;
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
  seq: Record<string, number>;
}
