"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
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
  getOrganizationById,
  listCardsForBusiness,
} from "@/lib/repo";
import { isSubscriptionActive, resolveSubscription } from "@/lib/subscriptions";
import { generateCardToken } from "@/lib/tokens";

async function assertWorkspaceWritable(organizationId: string, role: string) {
  if (role === "super_admin") return null;
  const org = await getOrganizationById(organizationId);
  if (!org) return null;
  const sub = resolveSubscription(org);
  if (!isSubscriptionActive(sub)) {
    throw new Error(
      "Your workspace subscription is expired, paused, or cancelled. Contact your administrator to renew or reactivate."
    );
  }
  return sub;
}

export async function saveBusinessAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertWorkspaceWritable(user.organizationId, user.role);

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const welcomeMessage = String(formData.get("welcomeMessage") || "").trim();
  const primaryColor = String(formData.get("primaryColor") || "#1A4BE0");
  const googleReviewUrl = String(formData.get("googleReviewUrl") || "").trim();
  const businessId = String(formData.get("businessId") || "");
  const slug = String(formData.get("slug") || "").trim();

  if (!name) throw new Error("Business name is required");

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
      });
    }
  } else {
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24) ||
      "business";
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
    await addMember(biz.id, user.id, "owner");
  }

  revalidatePath("/app");
  revalidatePath("/app/cards");
  revalidatePath("/app/settings");
  if (activeSlug) revalidatePath(`/r/${activeSlug}`);
}

export async function createCardAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sub = await assertWorkspaceWritable(user.organizationId, user.role);

  const businessId = String(formData.get("businessId") || "");
  const business = await getBusinessById(businessId);
  if (!business || business.organizationId !== user.organizationId) {
    throw new Error("Business not found");
  }

  if (sub) {
    const existingCards = await listCardsForBusiness(business.id);
    const activeCount = existingCards.filter((c) => c.status === "active").length;
    if (activeCount >= sub.cardLimit) {
      throw new Error(
        `Active card limit reached (${sub.cardLimit} on your current plan). Ask your administrator to upgrade your plan.`
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
}

export async function retireCardAction(cardId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await listBusinessesForOrg(user.organizationId);
  const businessIds = new Set(businesses.map((b) => b.id));
  const { listCardsForBusiness } = await import("@/lib/repo");

  for (const bizId of businessIds) {
    const cards = await listCardsForBusiness(bizId);
    if (cards.some((c) => c.id === cardId)) {
      await updateCardStatus(cardId, "retired");
      revalidatePath("/app/cards");
      return;
    }
  }
  throw new Error("Card not found");
}

export async function updateFeedbackReplyAction(feedbackId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trimmed = note.trim();
  if (!trimmed) return;

  const businesses = await listBusinessesForOrg(user.organizationId);
  for (const biz of businesses) {
    const items = await feedbackForBusiness(biz.id);
    if (items.some((f) => f.id === feedbackId)) {
      await updateFeedbackReply(feedbackId, trimmed);
      revalidatePath("/app/feedback");
      return;
    }
  }
  throw new Error("Feedback entry not found");
}
