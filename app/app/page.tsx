import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  listBusinessesForOrg,
  analyticsForBusiness,
  getBusinessById,
  getOrganizationById,
  listCardsForBusiness,
} from "@/lib/repo";
import { isSubscriptionActive, resolveSubscription } from "@/lib/subscriptions";
import CopyButton from "@/components/CopyButton";
import PlanInfoCard from "@/components/PlanInfoCard";
import {

  ArrowUpRightIcon,
  BarChartIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  MonitorIcon,
  NfcIcon,
  QrCodeIcon,
  SettingsIcon,
  SmartphoneIcon,
  StarIcon,
} from "@/components/Icons";


export default async function DashboardOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [org, businesses] = await Promise.all([
    getOrganizationById(user.organizationId),
    listBusinessesForOrg(user.organizationId),
  ]);
  const sub = org ? resolveSubscription(org) : null;
  const nowMs = Date.now();
  const isPlanUsable = sub ? isSubscriptionActive(sub, nowMs) : true;

  if (businesses.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-2">
        {sub && (
          <PlanInfoCard
            subscription={sub}
            activeCards={0}
            orgName={org?.name}
            serverNowMs={nowMs}
          />
        )}
        <div className="rounded-card bg-white border border-black/[0.09] p-8 sm:p-12 shadow-panel">
          <div className="h-11 w-11 rounded-xl bg-cobalt-50 text-cobalt-600 flex items-center justify-center mb-5">
            <SettingsIcon size={20} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
            Configure your first business
          </h1>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed max-w-lg">
            Set your business name, brand color, and official Google review link to generate your customer landing page, QR code, and NFC card tokens.
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
            {[
              { step: "1", title: "Business profile", desc: "Name, slug, and Google URL" },
              { step: "2", title: "Cards & QR", desc: "Generate tap tokens & print QR" },
              { step: "3", title: "Live telemetry", desc: "Track scans & private notes" },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-black/[0.08] bg-canvas p-3.5"
              >
                <span className="font-mono text-xs font-semibold text-cobalt-600">
                  0{item.step}
                </span>
                <p className="text-sm font-medium text-ink mt-1">{item.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/app/settings"
            className="inline-flex items-center justify-center gap-2 mt-7 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-5 py-3 text-sm font-medium text-white transition-colors"
          >
            <span>Set up business profile</span>
            <ArrowUpRightIcon size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const business = await getBusinessById(businesses[0].id);
  if (!business) redirect("/app/settings");
  const [a, cards] = await Promise.all([
    analyticsForBusiness(business.id),
    listCardsForBusiness(business.id),
  ]);
  const activeCards = cards.filter((c) => c.status === "active").length;

  const directVisits = Math.max(0, a.totalSessions - a.scans);
  const totalRatings = Object.values(a.ratingDistribution).reduce((x, y) => x + y, 0);
  const totalDevices = Object.values(a.devices).reduce((x, y) => x + y, 0);
  const clickRate =
    a.totalSessions > 0
      ? Math.round((a.googleClicks / a.totalSessions) * 100)
      : 0;
  const publicPath = `/r/${business.publicSlug}`;

  const kpis = [
    {
      label: "Total visits",
      value: a.totalSessions,
      sub: `${a.scans} via NFC or QR`,
      highlight: false,
    },
    {
      label: "Average rating",
      value: a.averageRating !== null ? a.averageRating.toFixed(1) : "—",
      sub:
        a.ratingInteractions > 0
          ? `Across ${a.ratingInteractions} rating${a.ratingInteractions === 1 ? "" : "s"}`
          : "No ratings recorded yet",
      isRating: true,
    },
    {
      label: "Google link clicks",
      value: a.googleClicks,
      sub:
        a.totalSessions > 0
          ? `${clickRate}% of visits · clicks only`
          : "Clicks only, never claimed submitted",
      highlight: true,
    },
    {
      label: "Private feedback",
      value: a.feedbackSubmissions,
      sub: "Visible only to your team",
      href: "/app/feedback",
    },
  ];

  const channels = [
    {
      label: "NFC card taps",
      count: a.nfcScans,
      icon: NfcIcon,
      pct: a.totalSessions ? Math.round((a.nfcScans / a.totalSessions) * 100) : 0,
    },
    {
      label: "QR code scans",
      count: a.qrScans,
      icon: QrCodeIcon,
      pct: a.totalSessions ? Math.round((a.qrScans / a.totalSessions) * 100) : 0,
    },
    {
      label: "Direct link visits",
      count: directVisits,
      icon: ExternalLinkIcon,
      pct: a.totalSessions ? Math.round((directVisits / a.totalSessions) * 100) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/[0.08]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              {business.name}
            </h1>
            <span className="rounded-md bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
              {business.category}
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            First-party customer activity across NFC cards, QR stands, and direct links.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CopyButton value={publicPath} label="Copy path" />
          <Link
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-control px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
              isPlanUsable
                ? "bg-cobalt-600 hover:bg-cobalt-700 text-white"
                : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            <span>{isPlanUsable ? "Open live page" : "Review page closed"}</span>
            <ArrowUpRightIcon size={15} />
          </Link>
        </div>
      </div>

      {/* Plan & Renewal Info */}
      {sub && (
        <PlanInfoCard
          subscription={sub}
          activeCards={activeCards}
          orgName={org?.name}
          serverNowMs={nowMs}
        />
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-card bg-white border border-black/[0.09] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-secondary">{k.label}</p>
              {k.isRating && a.averageRating !== null && (
                <StarIcon size={15} filled className="text-amber-500 shrink-0" />
              )}
            </div>
            <p
              className={`font-display text-3xl font-semibold tabular-nums mt-3 ${
                k.highlight ? "text-cobalt-600" : "text-ink"
              }`}
            >
              {k.value}
            </p>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <p className="text-xs text-ink-muted leading-snug">{k.sub}</p>
              {k.href && (
                <Link
                  href={k.href}
                  className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700 shrink-0"
                >
                  Open
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Entry Channels */}
      <div className="grid sm:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const Icon = ch.icon;
          return (
            <div
              key={ch.label}
              className="rounded-panel bg-white border border-black/[0.08] px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-surface-subtle text-ink-secondary flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-ink-secondary truncate">{ch.label}</p>
                  <p className="text-lg font-semibold text-ink tabular-nums leading-tight mt-0.5">
                    {ch.count}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-ink-muted tabular-nums">
                {ch.pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Rating Distribution & Devices */}
      <div className="grid lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">
                Rating distribution
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                All ratings receive equal access to Google and private feedback.
              </p>
            </div>
            <span className="font-mono text-xs text-ink-muted tabular-nums">
              {totalRatings} total
            </span>
          </div>

          {totalRatings === 0 ? (
            <div className="rounded-xl bg-canvas border border-black/[0.06] p-6 text-center space-y-2">
              <BarChartIcon size={20} className="mx-auto text-ink-muted" />
              <p className="text-sm font-medium text-ink">No ratings recorded yet</p>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Open your live review page or scan your counter QR code to test a customer rating.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = a.ratingDistribution[r] || 0;
                const pct = totalRatings ? Math.round((count / totalRatings) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <div className="w-12 flex items-center gap-1 text-xs font-medium text-ink tabular-nums shrink-0">
                      <span>{r}</span>
                      <StarIcon size={12} filled className="text-amber-500" />
                    </div>
                    <div
                      className="flex-1 h-2.5 rounded-full bg-surface-subtle overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${r} stars: ${count} ratings (${pct}%)`}
                    >
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs font-mono text-ink-secondary tabular-nums shrink-0">
                      {count} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-card bg-white border border-black/[0.09] p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Device breakdown
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Captured per visit session on page load.
            </p>

            {totalDevices === 0 ? (
              <p className="text-sm text-ink-muted mt-6">No session device data yet.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {Object.entries(a.devices).map(([device, count]) => {
                  const pct = Math.round((count / totalDevices) * 100);
                  const isMobile = device.toLowerCase() === "mobile";
                  return (
                    <div key={device} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 font-medium text-ink capitalize">
                          {isMobile ? (
                            <SmartphoneIcon size={15} className="text-cobalt-600" />
                          ) : (
                            <MonitorIcon size={15} className="text-ink-secondary" />
                          )}
                          <span>{device}</span>
                        </span>
                        <span className="font-mono text-xs text-ink-secondary tabular-nums">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isMobile ? "bg-cobalt-600" : "bg-ink-secondary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.07] flex items-center justify-between text-xs">
            <span className="text-ink-muted">NFC / QR cards</span>
            <Link
              href="/app/cards"
              className="inline-flex items-center gap-1 font-medium text-cobalt-600 hover:text-cobalt-700"
            >
              <CreditCardIcon size={13} />
              <span>Manage tokens</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">
            Recent activity
          </h2>
          <span className="text-xs text-ink-muted">Latest 12 events</span>
        </div>

        {a.recentEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            No customer events recorded yet. Share your QR code or test your live page to see events stream here.
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {a.recentEvents.map((e, i) => {
              const isGoogle = e.type === "google_click";
              const isFeedback = e.type === "feedback_submit";
              return (
                <li
                  key={`${e.at}-${i}`}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm hover:bg-canvas/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0 ${
                        isGoogle
                          ? "bg-cobalt-50 text-cobalt-600"
                          : isFeedback
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {isGoogle ? (
                        <ExternalLinkIcon size={15} />
                      ) : isFeedback ? (
                        <MessageSquareIcon size={15} />
                      ) : (
                        <StarIcon size={15} filled />
                      )}
                    </span>
                    <div>
                      <p className="font-medium text-ink">
                        {isGoogle
                          ? "Google review link clicked"
                          : isFeedback
                          ? "Private feedback submitted"
                          : `Customer rated ${e.rating} out of 5`}
                      </p>
                      {e.rating !== null && (isGoogle || isFeedback) && (
                        <p className="text-xs text-ink-muted tabular-nums">
                          Associated rating: {e.rating} / 5 stars
                        </p>
                      )}
                    </div>
                  </div>

                  <time
                    dateTime={e.at}
                    className="font-mono text-xs text-ink-muted tabular-nums pl-11 sm:pl-0"
                  >
                    {new Date(e.at).toLocaleString()}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
