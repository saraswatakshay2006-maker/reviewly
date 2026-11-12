import { readDB, writeDB, uid } from "./db";
import {
  createDefaultTrialSubscription,
  isSubscriptionActive,
  resolveSubscription,
} from "./subscriptions";
import type {
  Business,
  CustomerSession,
  Event,
  FeedbackSubmission,
  Member,
  Organization,
  OrganizationSubscription,
  ReviewCard,
  Role,
  User,
} from "./types";

// ---------- Users ----------
export const createUser = (u: Omit<User, "id" | "createdAt">) =>
  writeDB((db) => {
    const email = u.email.trim();
    if (db.users.some((x) => x.email.trim().toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    const user: User = { ...u, email, id: uid(), createdAt: new Date().toISOString() };
    db.users.push(user);
    return user;
  });

export const getUserByEmail = (email: string) =>
  readDB((db) => {
    const clean = email.trim().toLowerCase();
    return db.users.find((x) => x.email.trim().toLowerCase() === clean) ?? null;
  });

export const countUsers = () => readDB((db) => db.users.length);

export const countSuperAdmins = () =>
  readDB((db) => db.users.filter((u) => u.role === "super_admin").length);

export const getUserById = (id: string) =>
  readDB((db) => db.users.find((x) => x.id === id) ?? null);

// ---------- Organizations ----------
export const createOrganization = (
  name: string,
  slug: string,
  subscription?: Partial<OrganizationSubscription>
) =>
  writeDB((db) => {
    const baseSub = createDefaultTrialSubscription();
    const org: Organization = {
      id: uid(),
      name,
      slug,
      createdAt: new Date().toISOString(),
      subscription: subscription ? { ...baseSub, ...subscription } : baseSub,
    };
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

// ---------- Super Admin SaaS Management ----------
export interface SafeUserView {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export const updateOrganizationSubscription = (
  orgId: string,
  patch: Partial<OrganizationSubscription> & { name?: string }
) =>
  writeDB((db) => {
    const org = db.organizations.find((o) => o.id === orgId);
    if (!org) throw new Error("Organization not found");
    if (patch.name !== undefined && patch.name.trim()) {
      org.name = patch.name.trim();
    }
    const current = resolveSubscription(org);
    const { name: _ignored, ...subPatch } = patch;
    org.subscription = {
      ...current,
      ...subPatch,
      updatedAt: new Date().toISOString(),
    };
    return org;
  });

export const deleteOrganizationCascade = (orgId: string, actingUserId: string) =>
  writeDB((db) => {
    const org = db.organizations.find((o) => o.id === orgId);
    if (!org) throw new Error("Organization not found");

    const orgUsers = db.users.filter((u) => u.organizationId === orgId);
    if (orgUsers.some((u) => u.id === actingUserId)) {
      throw new Error("Cannot delete the workspace you are signed into");
    }
    const superAdmins = db.users.filter((u) => u.role === "super_admin");
    const deletingAllSupers =
      superAdmins.length > 0 &&
      superAdmins.every((u) => u.organizationId === orgId);
    if (deletingAllSupers) {
      throw new Error("Cannot remove the last super admin organization");
    }

    const bizIds = new Set(
      db.businesses.filter((b) => b.organizationId === orgId).map((b) => b.id)
    );
    const userIds = new Set(orgUsers.map((u) => u.id));

    db.organizations = db.organizations.filter((o) => o.id !== orgId);
    db.users = db.users.filter((u) => u.organizationId !== orgId);
    db.businesses = db.businesses.filter((b) => b.organizationId !== orgId);
    db.members = db.members.filter(
      (m) => !bizIds.has(m.businessId) && !userIds.has(m.userId)
    );
    db.cards = db.cards.filter((c) => !bizIds.has(c.businessId));
    db.sessions = db.sessions.filter((s) => s.organizationId !== orgId);
    db.events = db.events.filter((e) => e.organizationId !== orgId);
    db.feedback = db.feedback.filter((f) => f.organizationId !== orgId);
    return { deletedOrgId: orgId };
  });

export const updateUserAdmin = (
  userId: string,
  patch: { role?: Role; name?: string; passwordHash?: string; salt?: string }
) =>
  writeDB((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (patch.role && patch.role !== "super_admin" && user.role === "super_admin") {
      const superCount = db.users.filter((u) => u.role === "super_admin").length;
      if (superCount <= 1) {
        throw new Error("Cannot demote the last super admin");
      }
    }
    if (patch.name !== undefined && patch.name.trim()) {
      user.name = patch.name.trim();
    }
    if (patch.role) user.role = patch.role;
    if (patch.passwordHash && patch.salt) {
      user.passwordHash = patch.passwordHash;
      user.salt = patch.salt;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
    };
  });

export const deleteUserAdmin = (userId: string, actingUserId: string) =>
  writeDB((db) => {
    if (userId === actingUserId) {
      throw new Error("Cannot delete your own active super admin account");
    }
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.role === "super_admin") {
      const superCount = db.users.filter((u) => u.role === "super_admin").length;
      if (superCount <= 1) {
        throw new Error("Cannot delete the last super admin");
      }
    }
    db.users = db.users.filter((u) => u.id !== userId);
    db.members = db.members.filter((m) => m.userId !== userId);
    return { deletedUserId: userId };
  });

export const deleteFeedbackAdmin = (feedbackId: string) =>
  writeDB((db) => {
    const before = db.feedback.length;
    db.feedback = db.feedback.filter((f) => f.id !== feedbackId);
    if (db.feedback.length === before) throw new Error("Feedback not found");
    return { deletedFeedbackId: feedbackId };
  });

export const updateBusinessAdmin = (
  businessId: string,
  patch: Partial<
    Pick<
      Business,
      | "name"
      | "category"
      | "address"
      | "description"
      | "googleReviewUrl"
      | "welcomeMessage"
    >
  >
) =>
  writeDB((db) => {
    const biz = db.businesses.find((b) => b.id === businessId);
    if (!biz) throw new Error("Business not found");
    Object.assign(biz, patch);
    return biz;
  });

export const getSaasSnapshot = () =>
  readDB((db) => {
    const orgMap = new Map(db.organizations.map((o) => [o.id, o]));
    const bizMap = new Map(db.businesses.map((b) => [b.id, b]));

    const organizations = db.organizations
      .map((org) => {
        const sub = resolveSubscription(org);
        const orgUsers = db.users
          .filter((u) => u.organizationId === org.id)
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          }));
        const orgBusinesses = db.businesses.filter((b) => b.organizationId === org.id);
        const bizIds = new Set(orgBusinesses.map((b) => b.id));
        const orgCards = db.cards.filter((c) => bizIds.has(c.businessId));
        const activeCards = orgCards.filter((c) => c.status === "active").length;
        const orgSessions = db.sessions.filter((s) => s.organizationId === org.id);
        const orgEvents = db.events.filter((e) => e.organizationId === org.id);
        const orgFeedback = db.feedback.filter((f) => f.organizationId === org.id);
        const ratings = orgEvents
          .filter((e) => e.type === "rating_select" && e.rating != null)
          .map((e) => e.rating as number);

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt,
          subscription: sub,
          users: orgUsers,
          businesses: orgBusinesses,
          stats: {
            totalCards: orgCards.length,
            activeCards,
            sessions: orgSessions.length,
            googleClicks: orgEvents.filter((e) => e.type === "google_click").length,
            feedbackCount: orgFeedback.length,
            ratingCount: ratings.length,
            averageRating: ratings.length
              ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
              : null,
          },
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const users: SafeUserView[] = db.users
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        organizationId: u.organizationId,
        organizationName: orgMap.get(u.organizationId)?.name || "Unknown Workspace",
        createdAt: u.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const cards = db.cards
      .map((c) => {
        const biz = bizMap.get(c.businessId);
        return {
          ...c,
          businessName: biz?.name || "Unknown Business",
          businessSlug: biz?.publicSlug || "",
          organizationName: biz
            ? orgMap.get(biz.organizationId)?.name || "Unknown Workspace"
            : "Unknown Workspace",
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const feedback = db.feedback
      .map((f) => ({
        ...f,
        businessName: bizMap.get(f.businessId)?.name || "Unknown Business",
        organizationName: orgMap.get(f.organizationId)?.name || "Unknown Workspace",
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const recentEvents = db.events
      .slice(-40)
      .reverse()
      .map((e) => ({
        ...e,
        businessName: bizMap.get(e.businessId)?.name || "Unknown Business",
        organizationName: orgMap.get(e.organizationId)?.name || "Unknown Workspace",
      }));

    const clientOrgs = organizations.filter(
      (o) => !o.users.every((u) => u.role === "super_admin") || o.businesses.length > 0
    );

    const summary = {
      totalOrgs: clientOrgs.length,
      activeOrgs: clientOrgs.filter(
        (o) => isSubscriptionActive(o.subscription) && o.subscription.status === "active"
      ).length,
      trialOrgs: clientOrgs.filter(
        (o) => isSubscriptionActive(o.subscription) && o.subscription.status === "trialing"
      ).length,
      pausedOrPastDueOrgs: clientOrgs.filter(
        (o) =>
          !isSubscriptionActive(o.subscription) ||
          o.subscription.status === "past_due"
      ).length,
      mrrInr: clientOrgs
        .filter(
          (o) =>
            isSubscriptionActive(o.subscription) &&
            ["active", "trialing", "past_due"].includes(o.subscription.status)
        )
        .reduce((sum, o) => sum + (o.subscription.monthlyPriceInr || 0), 0),
      totalUsers: db.users.length,
      totalBusinesses: db.businesses.length,
      totalCards: db.cards.length,
      activeCards: db.cards.filter((c) => c.status === "active").length,
      totalSessions: db.sessions.length,
      totalGoogleClicks: db.events.filter((e) => e.type === "google_click").length,
      totalFeedback: db.feedback.length,
    };

    return {
      summary,
      organizations,
      users,
      businesses: db.businesses.map((b) => ({
        ...b,
        organizationName: orgMap.get(b.organizationId)?.name || "Unknown Workspace",
      })),
      cards,
      feedback,
      recentEvents,
    };
  });

export const exportSanitizedBackup = () =>
  readDB((db) => ({
    exportedAt: new Date().toISOString(),
    organizations: db.organizations.map((o) => ({
      ...o,
      subscription: resolveSubscription(o),
    })),
    users: db.users.map(({ passwordHash: _ph, salt: _s, ...safe }) => safe),
    businesses: db.businesses,
    members: db.members,
    cards: db.cards,
    sessions: db.sessions,
    events: db.events,
    feedback: db.feedback,
  }));
