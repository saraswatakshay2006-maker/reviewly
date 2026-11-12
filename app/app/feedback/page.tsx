import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationEntitlements } from "@/lib/entitlements";
import {
  feedbackForBusiness,
  feedbackInsightsForBusiness,
  getBusinessById,
  resolveActiveBusinessForOrg,
} from "@/lib/repo";
import FeedbackInboxClient from "@/components/FeedbackInboxClient";
import LocationSwitcher from "@/components/LocationSwitcher";
import { ArrowUpRightIcon, MessageSquareIcon } from "@/components/Icons";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ biz?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { biz: requestedBiz } = await searchParams;
  const [ctx, locState] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    resolveActiveBusinessForOrg(user.organizationId, requestedBiz),
  ]);
  const { businesses, active } = locState;
  const business = active ? await getBusinessById(active.id) : null;

  if (!business) {
    return (
      <div className="rounded-card bg-white border border-black/[0.09] p-10 text-center max-w-lg mx-auto">
        <p className="text-sm font-medium text-ink">
          Configure your business first to receive private feedback.
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

  const isUsable = ctx ? ctx.isUsable : true;
  const showInsights = isUsable && (ctx?.featureFlags.feedbackInsights ?? false);
  const canManageReplies =
    isUsable && (ctx?.featureFlags.feedbackMonitoringAndReplies ?? false);
  const canUseAiDraft =
    isUsable && (ctx?.featureFlags.aiResponseAssist ?? false);

  const [feedback, insights] = await Promise.all([
    feedbackForBusiness(business.id),
    showInsights ? feedbackInsightsForBusiness(business.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/[0.08]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Private feedback
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Honest customer notes shared directly with {business.name} — never published.
          </p>
        </div>

        <Link
          href={`/r/${business.publicSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-3.5 py-2 text-xs font-medium text-ink transition-colors self-start sm:self-auto"
        >
          <span>Preview customer form</span>
          <ArrowUpRightIcon size={14} />
        </Link>
      </div>

      <LocationSwitcher
        businesses={businesses}
        activeBusinessId={business.id}
        basePath="/app/feedback"
      />

      {showInsights && insights && insights.total > 0 && (
        <section
          aria-label="Customer feedback insights"
          className="rounded-card bg-white border border-black/[0.09] p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-ink">
              Customer feedback insights
            </h2>
            <span className="rounded-md bg-cobalt-50 px-2 py-0.5 text-[11px] font-medium text-cobalt-700">
              {ctx?.plan.name} analytics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
              <p className="text-[11px] text-ink-muted">Follow-up coverage</p>
              <p className="text-base font-semibold text-ink mt-0.5 tabular-nums">
                {insights.replyCoveragePct}%{" "}
                <span className="text-xs font-normal text-ink-muted">
                  ({insights.noted}/{insights.total})
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
              <p className="text-[11px] text-ink-muted">Needs reply note</p>
              <p className="text-base font-semibold text-ink mt-0.5 tabular-nums">
                {insights.pending}
              </p>
            </div>
            <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
              <p className="text-[11px] text-ink-muted">Avg feedback rating</p>
              <p className="text-base font-semibold text-ink mt-0.5 tabular-nums">
                {insights.avgFeedbackRating !== null
                  ? `${insights.avgFeedbackRating} / 5`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-canvas border border-black/[0.06] px-3.5 py-2.5">
              <p className="text-[11px] text-ink-muted">Flagged complaints</p>
              <p className="text-base font-semibold text-ink mt-0.5 tabular-nums">
                {insights.flagged}
              </p>
            </div>
          </div>

          {insights.topThemes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-ink-muted mr-1">Frequent keywords:</span>
              {insights.topThemes.map((t) => (
                <span
                  key={t.word}
                  className="rounded-full bg-surface-subtle border border-black/[0.07] px-2.5 py-0.5 text-[11px] text-ink-secondary"
                >
                  {t.word} ({t.count})
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {!showInsights && isUsable && (
        <div className="rounded-card bg-white border border-black/[0.09] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-secondary">
            Customer feedback insights, team reply notes, and AI reply drafts are available on Growth and Pro plans.
          </p>
          <Link
            href="/app/billing?tab=upgrade"
            className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700"
          >
            Explore Plans
          </Link>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="rounded-card bg-white border border-black/[0.09] p-10 sm:p-14 text-center space-y-3">
          <div className="mx-auto h-11 w-11 rounded-xl bg-surface-subtle text-ink-muted flex items-center justify-center">
            <MessageSquareIcon size={20} />
          </div>
          <h2 className="font-display text-lg font-semibold text-ink">
            No private feedback yet
          </h2>
          <p className="text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
            When customers choose &ldquo;Share private feedback&rdquo; on your review page, their notes appear here with optional internal team follow-ups.
          </p>
        </div>
      ) : (
        <FeedbackInboxClient
          items={feedback}
          businessName={business.name}
          canManageReplies={canManageReplies}
          canUseAiDraft={canUseAiDraft}
        />
      )}
    </div>
  );
}
