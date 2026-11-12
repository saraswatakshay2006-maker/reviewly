import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/cloudflare";
import {
  getBusinessById,
  getOrganizationById,
  listCardsForBusiness,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import { PLAN_DEFAULTS, resolveSubscription } from "@/lib/subscriptions";
import CardsStudioClient from "@/components/CardsStudioClient";
import LocationSwitcher from "@/components/LocationSwitcher";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz } = await searchParams;
  const [org, locState] = await Promise.all([
    getOrganizationById(user.organizationId),
    resolveActiveBusinessForOrg(user.organizationId, requestedBiz),
  ]);
  const { businesses, active } = locState;
  const business = active ? await getBusinessById(active.id) : null;
  const sub = org ? resolveSubscription(org) : null;

  if (!business) {
    return (
      <div className="rounded-card bg-white border border-black/[0.09] p-10 text-center max-w-lg mx-auto">
        <p className="text-sm font-medium text-ink">
          Configure a business first to manage NFC cards and QR stands.
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

  const cardsPerBiz = await Promise.all(
    businesses.map((b) => listCardsForBusiness(b.id))
  );
  const orgActiveCards = cardsPerBiz
    .flat()
    .filter((c) => c.status === "active").length;
  const cards = await listCardsForBusiness(business.id);
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const appUrl = (getEnv("NEXT_PUBLIC_APP_URL") || `${proto}://${host}`).replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <div className="no-print pb-5 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Cards &amp; QR studio
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Issue dynamic NFC card tokens and download or print your counter QR stand.
          </p>
        </div>
        {sub && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-xs text-ink-secondary self-start sm:self-auto tabular-nums">
            <span className="font-medium text-ink">{PLAN_DEFAULTS[sub.plan].label}:</span>
            <span>
              {orgActiveCards} / {sub.cardLimit} active cards
            </span>
          </div>
        )}
      </div>

      <LocationSwitcher
        businesses={businesses}
        activeBusinessId={business.id}
        basePath="/app/cards"
      />

      <CardsStudioClient business={business} cards={cards} appUrl={appUrl} />
    </div>
  );
}
