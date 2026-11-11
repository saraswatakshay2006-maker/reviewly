import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  listBusinessesForOrg,
  getBusinessById,
  feedbackForBusiness,
} from "@/lib/repo";
import FeedbackInboxClient from "@/components/FeedbackInboxClient";
import { ArrowUpRightIcon, MessageSquareIcon } from "@/components/Icons";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await listBusinessesForOrg(user.organizationId);
  const business = businesses[0] ? await getBusinessById(businesses[0].id) : null;

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

  const feedback = await feedbackForBusiness(business.id);

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
        <FeedbackInboxClient items={feedback} />
      )}
    </div>
  );
}
