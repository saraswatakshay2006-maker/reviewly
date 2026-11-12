import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { canAccessPublicReviewPage } from "@/lib/entitlements";
import { createSession, getBusinessBySlug } from "@/lib/repo";
import { getContrastInk, normalizeHex, rgbaFromHex } from "@/lib/color";
import RatingExperienceClient from "./RatingExperienceClient";
import PlatformSignature from "@/components/PlatformSignature";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const hdrs = await headers();
  const { slug } = await params;
  const { src } = await searchParams;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const access = await canAccessPublicReviewPage(business.id);
  const entitlements = access.context;

  if (!access.allowed) {
    return (
      <main className="min-h-screen flex flex-col bg-canvas">
        <div className="flex-1 w-full max-w-[460px] mx-auto px-4 py-12 flex items-center justify-center">
          <section
            aria-label="Review service unavailable"
            className="w-full rounded-[22px] bg-white border border-black/[0.09] shadow-elevated p-8 text-center space-y-3"
          >
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-800">
              Service paused
            </span>
            <h1 className="font-display text-xl font-semibold text-ink">
              Review page temporarily unavailable
            </h1>
            <p className="text-sm text-ink-secondary leading-relaxed">
              This business&apos;s review service is currently paused. Please contact the business directly for assistance.
            </p>
            <p className="pt-2 text-xs font-medium text-ink-muted">
              {business.name}
            </p>
          </section>
        </div>
        {!entitlements?.featureFlags.whiteLabel && (
          <footer className="py-5 px-4 border-t border-black/[0.06] bg-white/80">
            <PlatformSignature />
          </footer>
        )}
      </main>
    );
  }

  const ua = hdrs.get("user-agent") || "";
  const deviceType = /iPhone|Android|Mobile/i.test(ua) ? "mobile" : "desktop";

  // A fresh customer session is created per visit. scanType derives from where the
  // customer came from (NFC tap, QR scan, or direct link).
  const scanType = src === "nfc" ? "nfc" : src === "qr" ? "qr" : "direct";
  const session = await createSession({
    businessId: business.id,
    organizationId: business.organizationId,
    token: null,
    scanType,
    deviceType,
  });

  const brandHex = normalizeHex(business.primaryColor, "#1A4BE0");
  const brandInk = getContrastInk(brandHex);
  const softWash = rgbaFromHex(brandHex, 0.08);
  const borderTint = rgbaFromHex(brandHex, 0.16);

  return (
    <main className="min-h-screen flex flex-col bg-canvas">
      <div className="flex-1 w-full max-w-[440px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        <article className="w-full rounded-[22px] bg-white border border-black/[0.09] shadow-elevated overflow-hidden">
          {/* Business Identity Header */}
          <div
            className="px-6 pt-8 pb-6 text-center border-b"
            style={{
              background: `linear-gradient(180deg, ${softWash} 0%, #FFFFFF 100%)`,
              borderColor: borderTint,
            }}
          >
            {entitlements?.featureFlags.customBranding &&
            /^https?:\/\//i.test(business.logoUrl || "") ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="mx-auto mb-3.5 h-16 w-16 rounded-2xl object-cover border border-black/10 bg-white shadow-panel"
              />
            ) : (
              <div
                className="mx-auto mb-3.5 h-16 w-16 rounded-2xl flex items-center justify-center font-display text-2xl font-bold shadow-panel"
                style={{ backgroundColor: brandHex, color: brandInk }}
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              {business.name}
            </h1>
            <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap text-xs text-ink-secondary">
              <span className="inline-flex items-center rounded-md bg-surface-subtle px-2.5 py-0.5 font-medium text-ink">
                {business.category}
              </span>
              {business.address && (
                <span className="text-ink-muted truncate max-w-[240px]">
                  {business.address}
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <p className="text-center text-sm text-ink-secondary leading-relaxed text-pretty">
              {business.welcomeMessage ||
                `We'd love to hear about your experience at ${business.name}.`}
            </p>

            <RatingExperienceClient
              businessId={business.id}
              businessName={business.name}
              businessCategory={business.category}
              businessAddress={business.address}
              businessDescription={business.description}
              sessionId={session.id}
              primaryColor={brandHex}
              googleReviewUrl={business.googleReviewUrl}
            />
          </div>
        </article>
      </div>

      {!entitlements?.featureFlags.whiteLabel && (
        <footer className="py-5 px-4 border-t border-black/[0.06] bg-white/80">
          <PlatformSignature />
        </footer>
      )}
    </main>
  );
}
