import { readDB, writeDB, uid } from "./db";
import type {
  Business,
  CustomerSession,
  Event,
  FeedbackSubmission,
  Member,
  Organization,
  ReviewCard,
  Role,
  User,
} from "./types";

// ---------- Users ----------
export const createUser = (u: Omit<User, "id" | "createdAt">) =>
  writeDB((db) => {
    if (db.users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    const user: User = { ...u, id: uid(), createdAt: new Date().toISOString() };
    db.users.push(user);
    return user;
  });

export const getUserByEmail = (email: string) =>
  readDB((db) => db.users.find((x) => x.email.toLowerCase() === email.toLowerCase()) ?? null);

export const getUserById = (id: string) =>
  readDB((db) => db.users.find((x) => x.id === id) ?? null);

// ---------- Organizations ----------
export const createOrganization = (name: string, slug: string) =>
  writeDB((db) => {
    const org: Organization = { id: uid(), name, slug, createdAt: new Date().toISOString() };
    db.organizations.push(org);
    return org;
  });

export const getOrganizationBySlug = (slug: string) =>
  readDB((db) => db.organizations.find((x) => x.slug === slug) ?? null);

export const getOrganizationById = (id: string) =>
  readDB((db) => db.organizations.find((x) => x.id === id) ?? null);

// ---------- Businesses ----------
export const listBusinessesForOrg = (organizationId: string) =>
  readDB((db) => db.businesses.filter((b) => b.organizationId === organizationId));

export const getBusinessById = (id: string) =>
  readDB((db) => db.businesses.find((b) => b.id === id) ?? null);

export const getBusinessBySlug = (slug: string) =>
  readDB((db) => db.businesses.find((b) => b.publicSlug === slug) ?? null);

export const createBusiness = (
  orgId: string,
  data: { name: string; category: string; address: string; description: string; primaryColor: string; welcomeMessage: string; googleReviewUrl: string; publicSlug: string },
) =>
  writeDB((db) => {
    if (db.businesses.some((b) => b.publicSlug === data.publicSlug)) {
      throw new Error("Public slug already in use");
    }
    const biz: Business = { ...data, id: uid(), organizationId: orgId, logoUrl: "", createdAt: new Date().toISOString() };
    db.businesses.push(biz);
    return biz;
  });

export const updateBusiness = (id: string, patch: Partial<Business>) =>
  writeDB((db) => {
    const biz = db.businesses.find((b) => b.id === id);
    if (!biz) throw new Error("Business not found");
    Object.assign(biz, patch);
    return biz;
  });

// ---------- Members (business_members) ----------
export const addMember = (businessId: string, userId: string, role: Role) =>
  writeDB((db) => {
    if (db.members.some((m) => m.businessId === businessId && m.userId === userId)) {
      throw new Error("Member already exists");
    }
    const member: Member = { id: uid(), businessId, userId, role, branchId: null, createdAt: new Date().toISOString() };
    db.members.push(member);
    return member;
  });

export const getMember = (businessId: string, userId: string) =>
  readDB((db) => db.members.find((m) => m.businessId === businessId && m.userId === userId) ?? null);

export const listMembersForBusiness = (businessId: string) =>
  readDB((db) => db.members.filter((m) => m.businessId === businessId));

// ---------- Cards ----------
export const createCard = (businessId: string, data: { token: string; chipType: ReviewCard["chipType"]; label: string }) =>
  writeDB((db) => {
    const card: ReviewCard = { id: uid(), businessId, branchId: null, status: "active", createdAt: new Date().toISOString(), ...data };
    db.cards.push(card);
    return card;
  });

export const listCardsForBusiness = (businessId: string) =>
  readDB((db) => db.cards.filter((c) => c.businessId === businessId));

export const getCardByToken = (token: string) =>
  readDB((db) => db.cards.find((c) => c.token === token) ?? null);

export const updateCardStatus = (id: string, status: ReviewCard["status"]) =>
  writeDB((db) => {
    const card = db.cards.find((c) => c.id === id);
    if (!card) throw new Error("Card not found");
    card.status = status;
    return card;
  });

// ---------- Sessions ----------
export const createSession = (data: { businessId: string; organizationId: string; token: string | null; scanType: CustomerSession["scanType"]; deviceType: string }) =>
  writeDB((db) => {
    const s: CustomerSession = { id: uid(), visitedAt: new Date().toISOString(), ...data };
    db.sessions.push(s);
    return s;
  });

export const getSessionById = (id: string) =>
  readDB((db) => db.sessions.find((s) => s.id === id) ?? null);

// ---------- Events ----------
export const addEvent = (data: { sessionId: string; businessId: string; organizationId: string; type: Event["type"]; rating: number | null }) =>
  writeDB((db) => {
    const ev: Event = { id: uid(), createdAt: new Date().toISOString(), ...data };
    db.events.push(ev);
    return ev;
  });

/** Aggregated analytics for a business, computed from first-party events. */
export const analyticsForBusiness = (businessId: string) => {
  const view = readDB((db) => {
    const sessions = db.sessions.filter((s) => s.businessId === businessId);
    const events = db.events.filter((e) => e.businessId === businessId);
    const feedback = db.feedback.filter((f) => f.businessId === businessId);

    const ratings = events.filter((e) => e.type === "rating_select" && e.rating != null).map((e) => e.rating as number);
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) ratingDistribution[r] += 1;

    const byType = (t: Event["type"]) => events.filter((e) => e.type === t).length;

    return {
      totalSessions: sessions.length,
      scans: sessions.filter((s) => s.scanType !== "direct").length,
      nfcScans: sessions.filter((s) => s.scanType === "nfc").length,
      qrScans: sessions.filter((s) => s.scanType === "qr").length,
      googleClicks: byType("google_click"),
      feedbackSubmissions: feedback.length,
      ratingInteractions: byType("rating_select"),
      averageRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      ratingDistribution,
      devices: sessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
        return acc;
      }, {}),
      recentEvents: events.slice(-12).reverse().map((e) => ({ type: e.type, rating: e.rating, at: e.createdAt })),
    };
  });

  return view;
};

// ---------- Feedback ----------
export const addFeedback = (data: { sessionId: string | null; businessId: string; organizationId: string; message: string; rating: number | null; complaint: boolean }) =>
  writeDB((db) => {
    const f: FeedbackSubmission = { id: uid(), replyNote: null, createdAt: new Date().toISOString(), ...data };
    db.feedback.push(f);
    return f;
  });

export const feedbackForBusiness = (businessId: string) =>
  readDB((db) =>
    db.feedback
      .filter((f) => f.businessId === businessId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

export const updateFeedbackReply = (id: string, replyNote: string) =>
  writeDB((db) => {
    const f = db.feedback.find((x) => x.id === id);
    if (!f) throw new Error("Feedback not found");
    f.replyNote = replyNote;
    return f;
  });
