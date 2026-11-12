import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { getBusinessBySlug } from "@/lib/repo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const access = await canAccessPublicReviewPage(business.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Review page is unavailable because the subscription is inactive." },
      { status: 403, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  const origin = getEnv("NEXT_PUBLIC_APP_URL") || new URL(req.url).origin;
  const target = `${origin.replace(/\/$/, "")}/r/${slug}?src=qr`;

  try {
    // Use pure-JS core + SVG renderer so QR generation works on Edge runtime without canvas/pngjs/fs
    const QRCore =
      (await import("qrcode/lib/core/qrcode")).default ??
      (await import("qrcode/lib/core/qrcode"));
    const SvgTag =
      (await import("qrcode/lib/renderer/svg-tag")).default ??
      (await import("qrcode/lib/renderer/svg-tag"));
    const qrData = QRCore.create(target, { errorCorrectionLevel: "M" });
    const svg = SvgTag.render(qrData, {
      margin: 1,
      width: 512,
      color: { dark: "#0D1321", light: "#ffffff" },
    });
    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "QR generation failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
