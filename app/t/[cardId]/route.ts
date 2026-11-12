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
  if (!access.allowed) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Review page temporarily unavailable: subscription expired or paused" },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }
    const safeName = business.name
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Review page temporarily unavailable — ${safeName}</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; color: #18181b; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .card { max-width: 440px; width: 100%; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
      .pill { display: inline-block; font-size: 11px; font-weight: 600; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 999px; margin-bottom: 14px; }
      h1 { font-size: 19px; margin: 0 0 8px; }
      p { font-size: 14px; color: #52525b; line-height: 1.55; margin: 0; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="pill">Service paused</div>
      <h1>Review page temporarily unavailable</h1>
      <p>The review page for <strong>${safeName}</strong> is currently inactive because the business subscription needs renewal. Please contact the business directly.</p>
    </main>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 403,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...NO_CACHE_HEADERS,
      },
    });
  }
  const url = `/r/${business.publicSlug}?src=nfc`;
  const res = NextResponse.redirect(new URL(url, req.url));
  for (const [k, v] of Object.entries(NO_CACHE_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}
