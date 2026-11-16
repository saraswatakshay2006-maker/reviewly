import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/cloudflare";
import {
  getOrganizationEntitlements,
  syncExpiredSubscriptions,
} from "@/lib/entitlements";
import {
  getBusinessById,
  getStandeeDesignForBusiness,
  listStandeeThemes,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import LocationSwitcher from "@/components/LocationSwitcher";
import SubscriptionLockedGate from "@/components/SubscriptionLockedGate";
import StandeeDesignerClient from "@/components/StandeeDesignerClient";
import type { StandeeDesign } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function StandeePage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string }>;
}) {
  noStore();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz } = await searchParams;
  await syncExpiredSubscriptions(user.organizationId);

  const [ctx, locState] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    resolveActiveBusinessForOrg(user.organizationId, requestedBiz),
  ]);

  const { businesses, active } = locState;
  const business = active ? await getBusinessById(active.id) : null;
  const isUsable = ctx ? ctx.isUsable : true;

  if (!isUsable && ctx) {
    return (
      <div className="space-y-6">
        <div className="no-print pb-5 border-b border-black/[0.08]">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Custom Review Standee Designer
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Design and download print-ready A6 tabletop standees with QR and NFC.
          </p>
        </div>
        <SubscriptionLockedGate
          sectionName="Custom Review Standee Designer"
          planName={ctx.plan.name}
          effectiveStatus={ctx.effectiveStatus}
          renewalDate={ctx.subscription.currentPeriodEnd}
          isSuperAdmin={user.role === "super_admin"}
          statsSummary={`${businesses.length} location${businesses.length === 1 ? "" : "s"}`}
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="rounded-card bg-white border border-black/[0.09] p-10 text-center max-w-lg mx-auto">
        <p className="text-sm font-medium text-ink">
          Configure a business first to customize tabletop review standees.
        </p>
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 mt-4 rounded-control bg-cobalt-600 px-4 py-2 text-xs font-medium text-white"
        >
          Go to settings
        </Link>
      </div>
    );
  }

  const [standeeDesign, themes] = await Promise.all([
    getStandeeDesignForBusiness(business.id),
    listStandeeThemes(),
  ]);

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const appUrl = (
    getEnv("NEXT_PUBLIC_APP_URL") || `${proto}://${host}`
  ).replace(/\/$/, "");

  // Safe non-null design fallback
  const initialDesign: StandeeDesign = standeeDesign || {
    id: `standee_${business.id}`,
    businessId: business.id,
    organizationId: business.organizationId,
    themeId: themes[0]?.id || "forest-green-gold",
    colors: themes[0]?.colors || {
      primary: "#063F32",
      secondary: "#12805A",
      accent: "#D9A441",
      background: "#FFFFFF",
      text: "#17211D",
    },
    businessName: business.name,
    tagline:
      business.description ||
      `${business.category ? business.category.toUpperCase() : "PREMIUM"} • SERVICE • EXCELLENCE`,
    logoUrl: business.logoUrl || "",
    headline: "LOVE OUR SERVICE?",
    mainHeadline: "SHARE YOUR EXPERIENCE",
    supportingText:
      "Your honest feedback helps us improve and serve you better.",
    footerText: "THANK YOU!",
    qrScanLabel: "SCAN",
    qrScanInstruction: "Scan the QR code with your phone",
    nfcTapLabel: "TAP",
    nfcTapInstruction: "Tap your NFC-enabled phone here",
    benefit1: "Share Your Experience",
    benefit2: "Help Us Improve",
    benefit3: "Support Our Growth",
    bleedEnabled: false,
    cropMarks: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {businesses.length > 1 && (
        <div className="flex items-center justify-between pb-2">
          <LocationSwitcher
            businesses={businesses}
            activeBusinessId={business.id}
            basePath="/app/standee"
          />
        </div>
      )}

      <StandeeDesignerClient
        business={business}
        initialDesign={initialDesign}
        themes={themes}
        appUrl={appUrl}
      />
    </div>
  );
}
