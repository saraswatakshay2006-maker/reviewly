import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/cloudflare";
import {
  listBusinessesForOrg,
  getBusinessById,
  listCardsForBusiness,
} from "@/lib/repo";
import CardsStudioClient from "@/components/CardsStudioClient";



export default async function CardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await listBusinessesForOrg(user.organizationId);
  const business = businesses[0] ? await getBusinessById(businesses[0].id) : null;

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

  const cards = await listCardsForBusiness(business.id);
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const appUrl = (getEnv("NEXT_PUBLIC_APP_URL") || `${proto}://${host}`).replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <div className="no-print pb-5 border-b border-black/[0.08]">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Cards &amp; QR studio
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Issue dynamic NFC card tokens and download or print your counter QR stand.
        </p>
      </div>

      <CardsStudioClient business={business} cards={cards} appUrl={appUrl} />
    </div>
  );
}
