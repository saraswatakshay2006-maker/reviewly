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
  listCardsForBusiness,
  listStandeeThemes,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import CardsHubClient, { type CardTab } from "@/components/CardsHubClient";
import LocationSwitcher from "@/components/LocationSwitcher";
import SubscriptionLockedGate from "@/components/SubscriptionLockedGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string; tab?: string }>;
}) {
  noStore();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz, tab: requestedTab } = await searchParams;
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
            Cards &amp; Standees Studio
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Design Smart NFC PVC Cards, Tabletop A6 Standees, and manage NFC tokens.
          </p>
        </div>
        <SubscriptionLockedGate
          sectionName="Cards & Standees Studio"
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
          Configure a business first to manage NFC cards, review standees, and QR displays.
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

  const [cardsPerBiz, cards, standeeDesign, themes] = await Promise.all([
    Promise.all(businesses.map((b) => listCardsForBusiness(b.id))),
    listCardsForBusiness(business.id),
    getStandeeDesignForBusiness(business.id),
    listStandeeThemes(),
  ]);

  const orgActiveCards = cardsPerBiz
    .flat()
    .filter((c) => c.status === "active").length;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const appUrl = (getEnv("NEXT_PUBLIC_APP_URL") || `${proto}://${host}`).replace(/\/$/, "");

  const maxCards = ctx?.limits.maxCards ?? 10;
  const initialTab: CardTab =
    requestedTab === "standee" || requestedTab === "tokens" || requestedTab === "card"
      ? requestedTab
      : "card";

  // Safe non-null design fallback
  const initialDesign = standeeDesign || {
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
    headline: "Loved Our Service?",
    mainHeadline: "Review Us",
    supportingText:
      "Your feedback helps us grow and serve you better!",
    footerText: "Thank You!",
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
      <div className="no-print pb-5 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Cards &amp; Standees Studio
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Design Smart PVC Tap Cards, Tabletop A6 Standees, and issue physical NFC tokens.
          </p>
        </div>
        {ctx && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs text-ink-secondary self-start sm:self-auto tabular-nums">
            <span className="font-medium text-ink">{ctx.plan.name}:</span>
            <span>
              {orgActiveCards} / {maxCards < 0 ? "Unlimited" : maxCards} active cards
            </span>
          </div>
        )}
      </div>

      <LocationSwitcher
        businesses={businesses}
        activeBusinessId={business.id}
        basePath="/app/cards"
      />

      <CardsHubClient
        business={business}
        initialDesign={initialDesign}
        themes={themes}
        cards={cards}
        appUrl={appUrl}
        initialTab={initialTab}
      />
    </div>
  );
}
