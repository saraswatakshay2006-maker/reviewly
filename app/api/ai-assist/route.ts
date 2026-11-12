import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/cloudflare";
import { getOrganizationEntitlements } from "@/lib/entitlements";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rateLimit";
import {
  extractOpeningKey,
  generateUniqueBusinessReview,
  type ReviewGenerationContext,
} from "@/lib/reviewGenerator";

const bodySchema = z.object({
  mode: z.enum(["generate", "polish", "reply_draft"]).optional(),
  text: z.string().max(2000).optional(),
  businessName: z.string().min(1).max(120).optional(),
  category: z.string().max(80).optional(),
  address: z.string().max(240).optional(),
  description: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  highlights: z.array(z.string().max(60)).max(8).optional(),
  length: z.enum(["short", "medium", "detailed"]).optional(),
  avoidDrafts: z.array(z.string().max(600)).max(20).optional(),
  avoidOpenings: z.array(z.string().max(80)).max(20).optional(),
});

/**
 * Meaning-preserving rephrase. Uses OpenAI when OPENAI_API_KEY is set, otherwise
 * falls back to local grammar cleanup. Never fabricates experiences or praise.
 */
function localRephrase(input: string): string {
  let t = input
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])([^\s\d"'])/g, "$1 $2")
    .trim();
  t = t
    .replace(/\bi\b/g, "I")
    .replace(/\bi['’](m|ve|ll|d)\b/gi, (_, suffix) => `I'${suffix.toLowerCase()}`);
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, ch) => `${prefix}${ch.toUpperCase()}`);
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t;
}

async function llmRephrase(input: string): Promise<{ text: string; engine: "ai" | "smart-template" }> {
  const key = getEnv("OPENAI_API_KEY");
  if (!key) return { text: localRephrase(input), engine: "smart-template" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Improve the grammar, clarity and readability of the customer's own review text. Preserve the author's actual meaning and opinions exactly — do NOT add praise the author did not express, do NOT add claims about the business, and do NOT invent experiences. Return only the improved text.",
          },
          { role: "user", content: input },
        ],
      }),
    });

    if (!res.ok) return { text: localRephrase(input), engine: "smart-template" };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      return { text: text.trim(), engine: "ai" };
    }
  } catch {
    // Fallback cleanly
  }
  return { text: localRephrase(input), engine: "smart-template" };
}

async function llmGenerateUniqueReview(
  ctx: ReviewGenerationContext
): Promise<{ text: string; engine: "ai" | "smart-template"; highlightsUsed: string[]; openingKey: string }> {
  const localFallback = () => {
    const out = generateUniqueBusinessReview(ctx);
    return {
      text: out.text,
      engine: "smart-template" as const,
      highlightsUsed: out.highlightsUsed,
      openingKey: out.openingKey,
    };
  };

  const key = getEnv("OPENAI_API_KEY");
  if (!key) return localFallback();

  const rating = ctx.rating ?? 5;
  const length = ctx.length ?? "medium";
  const lengthGuide =
    length === "short"
      ? "1-2 short natural sentences (around 20-32 words)"
      : length === "detailed"
      ? "3-4 grounded sentences (around 50-75 words)"
      : "2-3 natural sentences (around 35-55 words)";

  const avoidOpeningsText =
    ctx.avoidOpenings && ctx.avoidOpenings.length > 0
      ? `NEVER start with any of these openings: ${ctx.avoidOpenings.join(" | ")}.`
      : "";
  const avoidDraftsText =
    ctx.avoidDrafts && ctx.avoidDrafts.length > 0
      ? `Produce a completely fresh structure and wording distinct from previous drafts:\n${ctx.avoidDrafts
          .slice(-4)
          .map((d, i) => `${i + 1}. ${d}`)
          .join("\n")}`
      : "";

  const userPrompt = [
    `Business Name: ${ctx.businessName}`,
    ctx.category ? `Category: ${ctx.category}` : null,
    ctx.address ? `Location/Address: ${ctx.address}` : null,
    ctx.description ? `Business Specialties & Details: ${ctx.description}` : null,
    `Customer Selected Rating: ${rating} out of 5 stars`,
    ctx.highlights && ctx.highlights.length > 0
      ? `Customer Focus Highlights: ${ctx.highlights.join(", ")}`
      : null,
    `Target Length: ${lengthGuide}`,
    avoidOpeningsText || null,
    avoidDraftsText || null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.95,
        messages: [
          {
            role: "system",
            content:
              "Write ONE unique, genuine, human-sounding Google review draft tailored specifically to the provided business, star rating, and selected focus highlights. Rules:\n" +
              "1) Match sentiment honestly to the star rating (5=warm/positive, 4=appreciative/solid, 3=balanced/mixed, 1-2=calm/constructive).\n" +
              "2) Naturally include the business name, a relevant service/category phrase, and clean area/landmark from the address for organic local SEO — NEVER keyword-stuff or sound like an ad.\n" +
              "3) Sound relatable and real (no robotic phrases like 'hidden gem', 'look no further', 'top-notch establishment', 'exceeded all expectations').\n" +
              "4) Never output quotes, star emojis, hashtags, labels, or explanations — return ONLY the review paragraph.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) return localFallback();
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) return localFallback();

    const cleaned = raw.trim().replace(/^["']|["']$/g, "");
    const openingKey = extractOpeningKey(cleaned);
    const isRepeatOpening = (ctx.avoidOpenings ?? []).some(
      (o) => o.toLowerCase() === openingKey
    );
    const isExactDup = (ctx.avoidDrafts ?? []).some(
      (d) => d.trim().toLowerCase() === cleaned.toLowerCase()
    );
    if (isRepeatOpening || isExactDup) return localFallback();

    return {
      text: cleaned,
      engine: "ai",
      highlightsUsed: ctx.highlights ?? [],
      openingKey,
    };
  } catch {
    return localFallback();
  }
}

async function generateBusinessReplyDraft(params: {
  businessName: string;
  customerText: string;
  rating: number | null | undefined;
}): Promise<{ text: string; engine: "ai" | "smart-template" }> {
  const { businessName, customerText, rating } = params;
  const fallback = () => {
    const cleanSnippet = customerText.trim().slice(0, 140);
    if (rating !== null && rating !== undefined && rating <= 3) {
      return `Thank you for sharing candid feedback with ${businessName}. Follow-up: review "${cleanSnippet}" with the team, address the concern promptly, and reach out if the guest wants to follow up.`;
    }
    if (rating !== null && rating !== undefined && rating >= 4) {
      return `Thank you for visiting ${businessName} and sharing your feedback! Internal note: share this positive feedback ("${cleanSnippet}") with the floor staff and thank the customer.`;
    }
    return `Thank you for taking a moment to share feedback with ${businessName}. Follow-up logged for the team regarding: "${cleanSnippet}".`;
  };

  const key = getEnv("OPENAI_API_KEY");
  if (!key) return { text: fallback(), engine: "smart-template" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Draft a concise, practical internal follow-up and customer reply suggestion (2 sentences max) for a local business owner responding to private customer feedback. Stay factual to the feedback message without inventing promises.",
          },
          {
            role: "user",
            content: `Business: ${businessName}\nRating: ${rating ?? "not given"}\nFeedback: ${customerText}`,
          },
        ],
      }),
    });
    if (!res.ok) return { text: fallback(), engine: "smart-template" };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      return { text: text.trim(), engine: "ai" };
    }
  } catch {
    // Fallback cleanly
  }
  return { text: fallback(), engine: "smart-template" };
}

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `ai:${ip}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many AI assist requests. Please wait a moment." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const d = parsed.data;
  const effectiveMode = d.mode ?? (d.text?.trim() ? "polish" : "generate");

  if (effectiveMode === "reply_draft") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ctx = await getOrganizationEntitlements(user.organizationId);
    if (ctx && user.role !== "super_admin") {
      if (!ctx.isUsable) {
        return NextResponse.json(
          { error: "Subscription expired or paused." },
          { status: 403 }
        );
      }
      if (!ctx.featureFlags.aiResponseAssist) {
        return NextResponse.json(
          { error: "AI-assisted response drafts require the Growth plan or higher." },
          { status: 403 }
        );
      }
    }
    const rawFeedback = d.text?.trim() || "";
    if (!rawFeedback) {
      return NextResponse.json(
        { error: "Feedback text is required to draft a response" },
        { status: 400 }
      );
    }
    const reply = await generateBusinessReplyDraft({
      businessName: d.businessName || "our business",
      customerText: rawFeedback,
      rating: d.rating,
    });
    return NextResponse.json({
      ok: true,
      suggested: reply.text,
      engine: reply.engine,
    });
  }

  if (effectiveMode === "polish") {
    const rawText = d.text?.trim() || "";
    if (!rawText) {
      return NextResponse.json({ error: "Review text is required to polish" }, { status: 400 });
    }
    const { text: suggested, engine } = await llmRephrase(rawText);
    return NextResponse.json({
      ok: true,
      suggested,
      engine,
      aiAssisted: true,
      note: "AI-assisted wording — editable and optional. Nothing is shared unless you choose to.",
    });
  }

  if (!d.businessName) {
    return NextResponse.json(
      { error: "businessName is required to generate a business-specific review" },
      { status: 400 }
    );
  }

  const generated = await llmGenerateUniqueReview({
    businessName: d.businessName,
    category: d.category,
    address: d.address,
    description: d.description,
    rating: d.rating,
    highlights: d.highlights,
    length: d.length,
    avoidDrafts: d.avoidDrafts,
    avoidOpenings: d.avoidOpenings,
  });

  return NextResponse.json({
    ok: true,
    suggested: generated.text,
    highlightsUsed: generated.highlightsUsed,
    openingKey: generated.openingKey,
    engine: generated.engine,
    aiAssisted: true,
    note: "Editable starter draft tailored to this business — customize freely so it matches your visit.",
  });
}
