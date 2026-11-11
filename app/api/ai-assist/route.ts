import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/cloudflare";



const bodySchema = z.object({
  text: z.string().min(1).max(2000),
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
  // Normalize unambiguous standalone first-person pronouns & contractions
  t = t
    .replace(/\bi\b/g, "I")
    .replace(/\bi['’](m|ve|ll|d)\b/gi, (_, suffix) => `I'${suffix.toLowerCase()}`);
  // Capitalize start of string and sentence boundaries
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, ch) => `${prefix}${ch.toUpperCase()}`);
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t;
}

async function llmRephrase(input: string): Promise<string> {
  const key = getEnv("OPENAI_API_KEY");
  if (!key) return localRephrase(input);

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
            "Improve the grammar, clarity and readability of the customer's own review text. Preserve the author's actual meaning and opinions exactly — do NOT add praise the author did not express, do NOT add claims about the business, do NOT add keywords or recommendation language. Return only the improved text, unchanged in meaning.",
        },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) return localRephrase(input);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return typeof text === "string" && text.trim()
    ? text.trim()
    : localRephrase(input);
}

export async function POST(req: NextRequest) {
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

  const suggested = await llmRephrase(parsed.data.text);

  return NextResponse.json({
    ok: true,
    suggested,
    aiAssisted: true,
    note: "AI-assisted suggestion — editable and optional. Nothing is shared unless you choose to.",
  });
}
