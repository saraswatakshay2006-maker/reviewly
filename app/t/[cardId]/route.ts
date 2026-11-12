import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { getCardByToken, getBusinessById } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Cloudflare-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * NFC token resolution. A physical card's NFC payload points here. We resolve the
 * token server-side to the business's public landing page - so changing a
 * business's review destination or slug never requires rewriting / reflashing the
 * card. The ?src=nfc flag records the scan as an NFC tap (QR uses ?src=qr).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const wantsJson = req.headers.get("accept")?.includes("application/json");
  const card = await getCardByToken(cardId);
  if (!card || card.status !== "active") {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Card not found or inactive" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }
    notFound();
  }
  const business = await getBusinessById(card.businessId);
  if (!business) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }
    notFound();
  }
  const access = await canAccessPublicReviewPage(business.id);
  if (wantsJson && !access.allowed) {
    return NextResponse.json(
      { error: "Review page temporarily unavailable: subscription expired or paused" },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }
  const url = `/r/${business.publicSlug}?src=nfc`;
  const res = NextResponse.redirect(new URL(url, req.url));
  for (const [k, v] of Object.entries(NO_CACHE_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}
