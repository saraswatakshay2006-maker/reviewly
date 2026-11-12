import { NextRequest, NextResponse } from "next/server";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { getBusinessBySlug } from "@/lib/repo";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Cloudflare-CDN-Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const businessIdParam = url.searchParams.get("businessId")?.trim();
  const slugParam = url.searchParams.get("slug")?.trim();

  let targetBusinessId = businessIdParam || null;
  if (!targetBusinessId && slugParam) {
    const biz = await getBusinessBySlug(slugParam);
    targetBusinessId = biz?.id ?? null;
  }

  if (!targetBusinessId) {
    return NextResponse.json(
      { allowed: false, reason: "Business not found" },
      { status: 404, headers: NO_CACHE_HEADERS }
    );
  }

  const access = await canAccessPublicReviewPage(targetBusinessId);
  if (!access.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        reason: access.reason || "Review page temporarily unavailable",
        status: access.context?.effectiveStatus ?? "expired",
      },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      allowed: true,
      expiresAt: access.context?.subscription.currentPeriodEnd ?? null,
    },
    { status: 200, headers: NO_CACHE_HEADERS }
  );
}
