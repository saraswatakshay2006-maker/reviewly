import { NextResponse } from "next/server";
import { getBusinessBySlug } from "@/lib/repo";
import { getEnv } from "@/lib/cloudflare";



export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const origin = getEnv("NEXT_PUBLIC_APP_URL") || new URL(req.url).origin;
  const target = `${origin.replace(/\/$/, "")}/r/${slug}?src=qr`;

  try {
    // Use pure-JS core + SVG renderer so QR generation works on Edge runtime without canvas/pngjs/fs
    const QRCore = (await import("qrcode/lib/core/qrcode")).default ?? (await import("qrcode/lib/core/qrcode"));
    const SvgTag = (await import("qrcode/lib/renderer/svg-tag")).default ?? (await import("qrcode/lib/renderer/svg-tag"));
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
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "QR generation failed" },
      { status: 500 }
    );
  }
}
