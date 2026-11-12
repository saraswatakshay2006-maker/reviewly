import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Enforce strict zero-caching across Cloudflare CDN, proxies, and browsers
 * for subscription-gated customer review pages, NFC/QR redirects, dashboards, and APIs.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, must-revalidate, max-age=0"
  );
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export const config = {
  matcher: [
    "/r/:path*",
    "/review/:path*",
    "/t/:path*",
    "/app/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};

