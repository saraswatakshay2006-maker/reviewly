"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canManageOperationsRole, getCurrentUser, isOwnerOrAdminRole } from "@/lib/auth";
import {
  createBusiness,
  updateBusiness,
  getBusinessById,
  addMember,
  createCard,
  updateCardStatus,
  listBusinessesForOrg,
  feedbackForBusiness,
  updateFeedbackReply,
  listCardsForBusiness,
} from "@/lib/repo";
import {
  canCreateLocation,
  checkResourceLimit,
  getOrganizationEntitlements,
} from "@/lib/entitlements";
import { generateCardToken } from "@/lib/tokens";

async function assertWorkspaceWritable(organizationId: string, role: string) {
  const ctx = await getOrganizationEntitlements(organizationId);
  if (role === "super_admin") return ctx;
  if (!ctx || !ctx.isUsable) {
    throw new Error(
      "Your workspace subscription is expired, paused, or cancelled. Visit Subscription & Billing to renew."
    );
  }
  return ctx;
}

export async function saveBusinessAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isOwnerOrAdminRole(user.role)) {
    throw new Error("Only workspace owners or admins can configure business locations.");
  }
  const ctx = await assertWorkspaceWritable(user.organizationId, user.role);

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const welcomeMessage = String(formData.get("welcomeMessage") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "#1A4BE0");
  const googleReviewUrl = String(formData.get("googleReviewUrl") || "").trim();
  const rawLogoUrl = String(formData.get("logoUrl") || "").trim();
  const businessId = String(formData.get("businessId") || "");
  const slug = String(formData.get("slug") || "").trim();

  if (!name) throw new Error("Business name is required");

  let safeLogoUrl: string | undefined;
  if (rawLogoUrl === "") {
    safeLogoUrl = "";
  } else {
    if (user.role !== "super_admin" && ctx && !ctx.featureFlags.customBranding) {
      throw new Error(
        "Custom brand logo requires the Pro or Enterprise plan."
      );
    }
    if (!/^https?:\/\//i.test(rawLogoUrl)) {
      throw new Error("Logo URL must start with http:// or https://");
    }
    safeLogoUrl = rawLogoUrl;
  }

  let activeSlug = slug;
  if (businessId) {
    const existing = await getBusinessById(businessId);
    if (existing && existing.organizationId === user.organizationId) {
      activeSlug = existing.publicSlug;
      await updateBusiness(businessId, {
        name,
        category,
        address,
        description,
        welcomeMessage,
        primaryColor,
        googleReviewUrl,
        ...(safeLogoUrl !== undefined ? { logoUrl: safeLogoUrl } : {}),
      });
    }
  } else {
    if (user.role !== "super_admin") {
      const locCheck = await canCreateLocation(user.organizationId, "org");
      if (!locCheck.allowed) {
        throw new Error(
          locCheck.reason ||
            `Business location limit reached (${locCheck.limit}). Upgrade your plan to add more locations.`
        );
      }
    }

    const baseSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24) ||
      "business";
    const { getBusinessBySlug } = await import("@/lib/repo");
    let finalSlug = baseSlug;
    if (await getBusinessBySlug(finalSlug)) {
      finalSlug = `${baseSlug.slice(0, 18)}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    activeSlug = finalSlug;
    const biz = await createBusiness(user.organizationId, {
      name,
      category,
      address,
      description,
      primaryColor,
      welcomeMessage,
      googleReviewUrl,
      publicSlug: finalSlug,
    });
    if (safeLogoUrl) {
      await updateBusiness(biz.id, { logoUrl: safeLogoUrl });
    }
    await addMember(biz.id, user.id, user.role);
  }

  revalidatePath("/app");
  revalidatePath("/app/cards");
  revalidatePath("/app/feedback");
  revalidatePath("/app/settings");
  revalidatePath("/app/billing");
  if (activeSlug) revalidatePath(`/r/${activeSlug}`);
}

export async function createCardAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageOperationsRole(user.role)) {
    throw new Error("Insufficient permissions to create NFC/QR cards.");
  }
  await assertWorkspaceWritable(user.organizationId, user.role);

  const businessId = String(formData.get("businessId") || "");
  const business = await getBusinessById(businessId);
  if (!business || business.organizationId !== user.organizationId) {
    throw new Error("Business not found");
  }

  if (user.role !== "super_admin") {
    const cardCheck = await checkResourceLimit(
      user.organizationId,
      "cards",
      Date.now(),
      "org"
    );
    if (!cardCheck.allowed) {
      throw new Error(
        cardCheck.reason ||
          `Active card limit reached (${cardCheck.limit}). Upgrade your plan to add more cards.`
      );
    }
  }

  const label = String(formData.get("label") || "").trim() || "Counter NFC Card";
  const rawChip = String(formData.get("chipType") || "NTAG213");
  const chipType: "NTAG213" | "NTAG215" | "QR" =
    rawChip === "NTAG215" || rawChip === "QR" ? rawChip : "NTAG213";

  await createCard(business.id, {
    token: generateCardToken(),
    chipType,
    label,
  });

  revalidatePath("/app/cards");
  revalidatePath("/app");
  revalidatePath("/app/billing");
}

export async function retireCardAction(cardId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageOperationsRole(user.role)) {
    throw new Error("Insufficient permissions to retire NFC/QR cards.");
  }
  await assertWorkspaceWritable(user.organizationId, user.role);

  const businesses = await listBusinessesForOrg(user.organizationId);
  const businessIds = new Set(businesses.map((b) => b.id));

  for (const bizId of businessIds) {
    const cards = await listCardsForBusiness(bizId);
    if (cards.some((c) => c.id === cardId)) {
      await updateCardStatus(cardId, "retired");
      revalidatePath("/app/cards");
      revalidatePath("/app");
      return;
    }
  }
  throw new Error("Card not found");
}

export async function updateFeedbackReplyAction(feedbackId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageOperationsRole(user.role)) {
    throw new Error("Insufficient permissions to update feedback notes.");
  }
  const ctx = await assertWorkspaceWritable(user.organizationId, user.role);
  if (
    user.role !== "super_admin" &&
    ctx &&
    !ctx.featureFlags.feedbackMonitoringAndReplies
  ) {
    throw new Error(
      "Feedback monitoring & team reply notes require the Growth plan or higher."
    );
  }

  const trimmed = note.trim();
  if (!trimmed) return;

  const businesses = await listBusinessesForOrg(user.organizationId);
  for (const biz of businesses) {
    const items = await feedbackForBusiness(biz.id);
    if (items.some((f) => f.id === feedbackId)) {
      await updateFeedbackReply(feedbackId, trimmed);
      revalidatePath("/app/feedback");
      revalidatePath("/app");
      return;
    }
  }
  throw new Error("Feedback entry not found");
}
