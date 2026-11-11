import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getCardByToken, getBusinessById } from "@/lib/repo";

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
        { status: 404 }
      );
    }
    notFound();
  }
  const business = await getBusinessById(card.businessId);
  if (!business) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }
    notFound();
  }
  const url = `/r/${business.publicSlug}?src=nfc`;
  return NextResponse.redirect(new URL(url, req.url));
}
