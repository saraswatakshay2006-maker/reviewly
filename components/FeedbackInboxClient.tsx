"use client";

import { useMemo, useState, useTransition } from "react";
import type { FeedbackSubmission } from "@/lib/types";
import { updateFeedbackReplyAction } from "@/lib/actions";
import {
  CheckIcon,
  LockIcon,
  MessageSquareIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
} from "./Icons";

type FilterMode = "all" | "pending" | "replied" | "complaints";

export default function FeedbackInboxClient({
  items,
  businessName = "this business",
  canManageReplies = true,
  canUseAiDraft = false,
}: {
  items: FeedbackSubmission[];
  businessName?: string;
  canManageReplies?: boolean;
  canUseAiDraft?: boolean;
}) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((f) => !f.replyNote).length,
      replied: items.filter((f) => !!f.replyNote).length,
      complaints: items.filter((f) => f.complaint).length,
    }),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (filter === "pending" && f.replyNote) return false;
      if (filter === "replied" && !f.replyNote) return false;
      if (filter === "complaints" && !f.complaint) return false;
      if (q) {
        const hay = `${f.message} ${f.replyNote || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, query]);

  const tabs: { id: FilterMode; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "pending", label: "Needs note", count: counts.pending },
    { id: "replied", label: "Noted", count: counts.replied },
    { id: "complaints", label: "Flagged", count: counts.complaints },
  ];

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 rounded-xl bg-white border border-black/[0.08] p-1"
          role="tablist"
          aria-label="Filter private feedback"
        >
          {tabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-cobalt-600 text-white"
                    : "text-ink-secondary hover:text-ink hover:bg-surface-subtle"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`tabular-nums text-[11px] px-1.5 py-0.2 rounded ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-surface-subtle text-ink-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feedback or notes…"
            aria-label="Search private feedback"
            className="w-full min-h-[40px] rounded-control border border-black/[0.12] bg-white pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card bg-white border border-black/[0.09] p-10 text-center space-y-2">
          <MessageSquareIcon size={20} className="mx-auto text-ink-muted" />
          <p className="text-sm font-medium text-ink">
            No matching private feedback
          </p>
          <p className="text-xs text-ink-muted">
            Adjust your filter or search terms to view other submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              businessName={businessName}
              canManageReplies={canManageReplies}
              canUseAiDraft={canUseAiDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  item,
  businessName,
  canManageReplies,
  canUseAiDraft,
}: {
  item: FeedbackSubmission;
  businessName: string;
  canManageReplies: boolean;
  canUseAiDraft: boolean;
}) {
  const [note, setNote] = useState(item.replyNote || "");
  const [savedNotice, setSavedNotice] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAiDraft = async () => {
    setError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reply_draft",
          businessName,
          text: item.message,
          rating: item.rating,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not draft response");
      if (json.suggested) {
        setNote(json.suggested);
        setSavedNotice(false);
      }
    } catch (err) {
      setError((err as Error).message || "Could not generate response draft");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setError(null);
    setSavedNotice(false);
    startTransition(async () => {
      try {
        await updateFeedbackReplyAction(item.id, note);
        setSavedNotice(true);
        window.setTimeout(() => setSavedNotice(false), 2500);
      } catch (err) {
        setError((err as Error).message || "Could not save note");
      }
    });
  };

  return (
    <article className="rounded-card bg-white border border-black/[0.09] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {item.rating ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon
                    key={n}
                    size={12}
                    filled={n <= (item.rating ?? 0)}
                    className={
                      n <= (item.rating ?? 0) ? "text-amber-500" : "text-amber-200"
                    }
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-amber-900 tabular-nums">
                {item.rating}/5
              </span>
            </div>
          ) : (
            <span className="rounded-lg bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-secondary">
              No star rating
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <LockIcon size={12} />
            <span>Private · Never published</span>
          </span>

          {item.complaint && (
            <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
              Flagged complaint
            </span>
          )}
        </div>

        <time
          dateTime={item.createdAt}
          className="font-mono text-xs text-ink-muted tabular-nums"
        >
          {new Date(item.createdAt).toLocaleString()}
        </time>
      </div>

      <p className="text-sm sm:text-base text-ink leading-relaxed max-w-[70ch] whitespace-pre-wrap">
        {item.message}
      </p>

      {canManageReplies ? (
        <form
          onSubmit={handleSave}
          className="pt-4 border-t border-black/[0.07] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={`note-${item.id}`}
              className="block text-xs font-medium text-ink-secondary"
            >
              Internal team response note
            </label>
            {canUseAiDraft && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => void handleAiDraft()}
                className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700 disabled:opacity-50"
              >
                <SparklesIcon size={13} />
                <span>{aiLoading ? "Drafting…" : "AI draft response"}</span>
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id={`note-${item.id}`}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSavedNotice(false);
              }}
              placeholder="Record follow-up actions for your team…"
              className="flex-1 min-h-[40px] rounded-control border border-black/[0.13] bg-canvas/60 focus:bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
            />
            <button
              type="submit"
              disabled={isPending || !note.trim()}
              className="min-h-[40px] rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-45 shrink-0"
            >
              {isPending ? "Saving…" : "Save note"}
            </button>
          </div>

          {savedNotice && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckIcon size={13} />
              <span>Team note saved.</span>
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="pt-3 border-t border-black/[0.07] text-xs text-ink-muted">
          Team response tracking &amp; AI reply assistance unlock on the{" "}
          <strong className="font-medium text-ink">Growth</strong> plan and higher.
        </div>
      )}
    </article>
  );
}

