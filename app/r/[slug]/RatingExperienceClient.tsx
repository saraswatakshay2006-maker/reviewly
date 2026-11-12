"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getContrastInk, normalizeHex } from "@/lib/color";
import { parseRenewalTimestamp } from "@/lib/subscriptions";
import {
  extractOpeningKey,
  generateUniqueBusinessReview,
  getHighlightOptions,
  type ReviewLength,
} from "@/lib/reviewGenerator";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  GoogleGMark,
  RefreshIcon,
  SparklesIcon,
  StarIcon,
} from "@/components/Icons";

type Stage = "rating" | "thankyou";

const RATING_LABELS: Record<number, string> = {
  1: "Needs attention",
  2: "Below expectations",
  3: "Okay",
  4: "Good",
  5: "Great",
};

const LENGTH_OPTIONS: { id: ReviewLength; label: string }[] = [
  { id: "short", label: "Quick" },
  { id: "medium", label: "Standard" },
  { id: "detailed", label: "Detailed" },
];

export default function RatingExperienceClient({
  businessId,
  businessName,
  businessCategory = "Other",
  businessAddress = "",
  businessDescription = "",
  sessionId,
  primaryColor,
  googleReviewUrl,
  expiresAtIso = null,
  gracePeriodDays = 0,
}: {
  businessId: string;
  businessName: string;
  businessCategory?: string;
  businessAddress?: string;
  businessDescription?: string;
  sessionId: string;
  primaryColor: string;
  googleReviewUrl: string;
  expiresAtIso?: string | null;
  gracePeriodDays?: number;
}) {
  const [expiredLocked, setExpiredLocked] = useState(false);
  const [stage, setStage] = useState<Stage>("rating");
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const endMs = parseRenewalTimestamp(expiresAtIso);
    const cutoffMs =
      endMs !== null ? endMs + Math.max(0, gracePeriodDays) * 86_400_000 : null;
    const checkLocalExpiry = () => {
      if (cutoffMs !== null && Date.now() >= cutoffMs) {
        setExpiredLocked(true);
        return true;
      }
      return false;
    };
    if (checkLocalExpiry()) return;

    let lastServerCheck = 0;
    const checkServerStatus = async (force = false) => {
      if (checkLocalExpiry()) return;
      const now = Date.now();
      if (!force && now - lastServerCheck < 5000) return;
      lastServerCheck = now;
      try {
        const res = await fetch(
          `/api/public/review-status?businessId=${encodeURIComponent(businessId)}`,
          { cache: "no-store" }
        );
        if (res.status === 403 || res.status === 404) {
          setExpiredLocked(true);
        }
      } catch {
        // Offline/transient error stays handled on next interaction
      }
    };

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void checkServerStatus();
      }
    };

    const msLeft = cutoffMs !== null ? cutoffMs - Date.now() : null;
    const timeoutId =
      msLeft !== null && msLeft <= 2_147_483_647
        ? window.setTimeout(checkLocalExpiry, msLeft + 50)
        : null;
    const intervalId = window.setInterval(checkLocalExpiry, 15_000);
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [businessId, expiresAtIso, gracePeriodDays]);

  // Auto-generated unique business-oriented review state
  const [draftOpen, setDraftOpen] = useState(true);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [reviewLength, setReviewLength] = useState<ReviewLength>("medium");
  const [googleDraft, setGoogleDraft] = useState("");
  const [userEditedDraft, setUserEditedDraft] = useState(false);
  const [googleAiLoading, setGoogleAiLoading] = useState(false);
  const [googleCopied, setGoogleCopied] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);

  const avoidDraftsRef = useRef<string[]>([]);
  const avoidOpeningsRef = useRef<string[]>([]);

  const highlightOptions = useMemo(
    () =>
      getHighlightOptions({
        businessName,
        category: businessCategory,
        description: businessDescription,
      }),
    [businessName, businessCategory, businessDescription]
  );

  const brandHex = normalizeHex(primaryColor, "#1A4BE0");
  const brandInk = getContrastInk(brandHex);

  const rememberDraft = (text: string, openingKey?: string) => {
    const clean = text.trim();
    if (!clean) return;
    avoidDraftsRef.current = [...avoidDraftsRef.current.slice(-11), clean];
    avoidOpeningsRef.current = [
      ...avoidOpeningsRef.current.slice(-11),
      openingKey || extractOpeningKey(clean),
    ];
  };

  const generateLocalDraft = (
    ratingValue: number,
    highlights: string[],
    length: ReviewLength
  ) => {
    const res = generateUniqueBusinessReview({
      businessName,
      category: businessCategory,
      address: businessAddress,
      description: businessDescription,
      rating: ratingValue,
      highlights,
      length,
      avoidDrafts: avoidDraftsRef.current,
      avoidOpenings: avoidOpeningsRef.current,
    });
    rememberDraft(res.text, res.openingKey);
    return res.text;
  };

  const recordEvent = async (
    type: "rating_select" | "google_click",
    rating?: number
  ) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessId,
          type,
          rating: rating ?? null,
        }),
      });
      if (res.status === 403) {
        setExpiredLocked(true);
      }
    } catch {
      // Analytics must never interrupt the customer flow
    }
  };

  const selectStar = (n: number) => {
    setSelected(n);
    void recordEvent("rating_select", n);
    if (!userEditedDraft || !googleDraft.trim()) {
      const fresh = generateLocalDraft(n, selectedHighlights, reviewLength);
      setGoogleDraft(fresh);
      setUserEditedDraft(false);
    }
    setDraftOpen(true);
    setGoogleOpened(false);
    setStage("thankyou");
  };

  const requestNewUniqueDraft = async (
    highlights = selectedHighlights,
    length = reviewLength
  ) => {
    const ratingVal = selected ?? 5;
    setGoogleAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          businessId,
          sessionId,
          businessName,
          category: businessCategory,
          address: businessAddress,
          description: businessDescription,
          rating: ratingVal,
          highlights,
          length,
          avoidDrafts: avoidDraftsRef.current,
          avoidOpenings: avoidOpeningsRef.current,
        }),
      });
      if (res.status === 403) {
        setExpiredLocked(true);
        return;
      }
      const data = await res.json();
      if (data.ok && typeof data.suggested === "string" && data.suggested.trim()) {
        rememberDraft(data.suggested, data.openingKey);
        setGoogleDraft(data.suggested);
        setUserEditedDraft(false);
        return;
      }
    } catch {
      // Fall back cleanly to instant client engine below
    } finally {
      setGoogleAiLoading(false);
    }

    const fallback = generateLocalDraft(ratingVal, highlights, length);
    setGoogleDraft(fallback);
    setUserEditedDraft(false);
  };

  const requestPolishDraft = async () => {
    if (!googleDraft.trim()) return;
    setGoogleAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "polish",
          businessId,
          sessionId,
          text: googleDraft,
        }),
      });
      if (res.status === 403) {
        setExpiredLocked(true);
        return;
      }
      const data = await res.json();
      if (data.ok && typeof data.suggested === "string" && data.suggested.trim()) {
        setGoogleDraft(data.suggested);
      }
    } catch {
      // Keep customer's own draft if phrasing helper is unavailable
    } finally {
      setGoogleAiLoading(false);
    }
  };

  const toggleHighlight = (chip: string) => {
    const exists = selectedHighlights.includes(chip);
    const next = exists
      ? selectedHighlights.filter((h) => h !== chip)
      : [...selectedHighlights.slice(-2), chip];
    setSelectedHighlights(next);
    if (!userEditedDraft) {
      const fresh = generateLocalDraft(selected ?? 5, next, reviewLength);
      setGoogleDraft(fresh);
    }
  };

  const changeLength = (nextLen: ReviewLength) => {
    setReviewLength(nextLen);
    if (!userEditedDraft) {
      const fresh = generateLocalDraft(selected ?? 5, selectedHighlights, nextLen);
      setGoogleDraft(fresh);
    }
  };

  const activeGoogleText = googleDraft.trim();

  const copyText = async (text: string) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      setGoogleCopied(true);
      window.setTimeout(() => setGoogleCopied(false), 3500);
      return true;
    } catch {
      return false;
    }
  };

  const handleGoogle = async () => {
    if (!googleReviewUrl) return;
    if (activeGoogleText) {
      await copyText(activeGoogleText);
    }
    setGoogleOpened(true);
    void recordEvent("google_click", selected ?? undefined);
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  const activeDisplay = hovered ?? selected ?? 0;

  if (expiredLocked) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-center space-y-2">
        <span className="inline-flex items-center rounded-full bg-white border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
          Service paused
        </span>
        <h2 className="font-display text-base font-semibold text-ink">
          Review page temporarily unavailable
        </h2>
        <p className="text-xs text-ink-secondary leading-relaxed">
          This business&apos;s review service is currently paused. Please contact the business directly for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {stage === "rating" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-ink">How was your experience?</p>

          <div
            className="flex items-center justify-center gap-1.5"
            role="radiogroup"
            aria-label="Rate your experience from 1 to 5 stars"
            onMouseLeave={() => setHovered(null)}
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const isLit = n <= activeDisplay;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={selected === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHovered(n)}
                  onClick={() => selectStar(n)}
                  className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-transparent hover:bg-amber-50/80 hover:border-amber-200/70 transition-all duration-150 hover:scale-105 active:scale-95"
                >
                  <StarIcon
                    size={30}
                    filled={isLit}
                    className={
                      isLit
                        ? "text-amber-500 transition-colors"
                        : "text-slate-300 transition-colors"
                    }
                  />
                </button>
              );
            })}
          </div>

          <div className="h-5 flex items-center justify-center">
            {hovered ? (
              <span className="text-xs font-medium text-ink-secondary">
                {hovered} / 5 · {RATING_LABELS[hovered]}
              </span>
            ) : (
              <span className="text-xs text-ink-muted">
                Tap a star — every rating sees the same options.
              </span>
            )}
          </div>
        </div>
      )}

      {stage === "thankyou" && (
        <div className="flex flex-col gap-4 animate-panel-enter">
          <div className="rounded-xl bg-canvas border border-black/[0.07] px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon
                    key={n}
                    size={15}
                    filled={n <= (selected ?? 0)}
                    className={
                      n <= (selected ?? 0) ? "text-amber-500" : "text-slate-200"
                    }
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-ink tabular-nums">
                You rated {selected} {selected === 1 ? "star" : "stars"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStage("rating")}
              className="text-xs font-medium text-ink-secondary hover:text-ink underline underline-offset-2"
            >
              Change
            </button>
          </div>

          {/* Public Google Review Card */}
          <div className="rounded-xl border border-black/[0.1] bg-white overflow-hidden">
            {googleReviewUrl ? (
              <div className="p-3.5 space-y-3">
                {/* Auto-generated, unique, business-tailored review helper */}
                <div>
                  <button
                    type="button"
                    onClick={() => setDraftOpen((v) => !v)}
                    aria-expanded={draftOpen}
                    className="w-full flex items-center justify-between gap-2 text-left text-xs font-medium text-ink hover:text-cobalt-700 py-0.5"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <SparklesIcon size={13} className="text-cobalt-600" />
                      <span>Quick review starter (editable for Google)</span>
                    </span>
                    <ChevronDownIcon
                      size={14}
                      className={`shrink-0 text-ink-muted transition-transform ${
                        draftOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {draftOpen && (
                    <div className="mt-2.5 space-y-2.5 pt-2.5 border-t border-black/[0.06] animate-panel-enter">
                      {/* Quick highlight selector chips tailored to this business */}
                      {(selected ?? 5) >= 4 && highlightOptions.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-ink-muted">
                              Tap highlights to personalize:
                            </span>
                            <div className="inline-flex items-center rounded-lg bg-canvas p-0.5 border border-black/[0.07]">
                              {LENGTH_OPTIONS.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => changeLength(opt.id)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                                    reviewLength === opt.id
                                      ? "bg-white text-ink shadow-panel"
                                      : "text-ink-muted hover:text-ink"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {highlightOptions.map((chip) => {
                              const active = selectedHighlights.includes(chip);
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => toggleHighlight(chip)}
                                  aria-pressed={active}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                                    active
                                      ? "bg-cobalt-50 border-cobalt-300 text-cobalt-700"
                                      : "bg-canvas border-black/[0.08] text-ink-secondary hover:bg-surface-subtle"
                                  }`}
                                >
                                  {chip}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <label htmlFor="google-draft-input" className="sr-only">
                        Editable starter review draft to copy to Google
                      </label>
                      <textarea
                        id="google-draft-input"
                        value={googleDraft}
                        onChange={(e) => {
                          setGoogleDraft(e.target.value);
                          setUserEditedDraft(true);
                        }}
                        rows={4}
                        placeholder="Write or generate a genuine review in your own words…"
                        className="w-full rounded-xl border border-black/[0.13] bg-canvas/50 focus:bg-white p-3 text-sm text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15 resize-none leading-relaxed"
                      />

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => void requestNewUniqueDraft()}
                            disabled={googleAiLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-cobalt-200 bg-cobalt-50/70 hover:bg-cobalt-50 px-2.5 py-1.5 text-xs font-medium text-cobalt-700 transition-colors disabled:opacity-50"
                          >
                            <RefreshIcon
                              size={12}
                              className={googleAiLoading ? "animate-spin" : ""}
                            />
                            <span>
                              {googleAiLoading ? "Writing…" : "New unique draft"}
                            </span>
                          </button>

                          {userEditedDraft && googleDraft.trim().length > 3 && (
                            <button
                              type="button"
                              onClick={() => void requestPolishDraft()}
                              disabled={googleAiLoading}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-secondary hover:bg-surface-subtle transition-colors disabled:opacity-50"
                            >
                              <SparklesIcon size={12} className="text-cobalt-600" />
                              <span>Polish edits</span>
                            </button>
                          )}

                          {googleDraft.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setGoogleDraft("");
                                setUserEditedDraft(true);
                              }}
                              className="rounded-lg px-2 py-1.5 text-xs text-ink-muted hover:text-ink"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {activeGoogleText && (
                          <button
                            type="button"
                            onClick={() => void copyText(activeGoogleText)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-ink ml-auto"
                          >
                            {googleCopied ? (
                              <>
                                <CheckIcon size={13} className="text-emerald-700" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-ink-muted leading-snug">
                        Tailored to {businessName} &amp; your {selected}-star rating — edit freely so it matches your real visit.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  className="w-full min-h-[48px] rounded-xl px-4 py-3 font-medium text-sm flex items-center justify-between gap-3 text-left transition-opacity hover:opacity-95 active:scale-[0.99]"
                  style={{ backgroundColor: brandHex, color: brandInk }}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <span className="h-7 w-7 rounded-lg bg-white inline-flex items-center justify-center shrink-0">
                      <GoogleGMark size={15} />
                    </span>
                    <span className="leading-snug">
                      {activeGoogleText
                        ? "Copy Review & Open Google"
                        : "Share Your Experience on Google"}
                    </span>
                  </span>
                  <ExternalLinkIcon size={16} className="shrink-0 opacity-85" />
                </button>

                {googleOpened && (
                  <div
                    role="status"
                    className="rounded-lg bg-cobalt-50 border border-cobalt-200 px-3 py-2 text-xs text-cobalt-900 leading-relaxed"
                  >
                    {googleCopied || activeGoogleText
                      ? `Your review is copied. Inside Google, tap ${selected} ${
                          selected === 1 ? "star" : "stars"
                        } and paste your review.`
                      : `Google opened in a new tab — select ${selected} ${
                          selected === 1 ? "star" : "stars"
                        } directly on Google to post.`}
                  </div>
                )}

                <p className="text-[11px] text-ink-muted leading-snug">
                  Google requires customers to select their star rating and paste or write their review directly inside Google&apos;s page.
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-ink-muted text-center">
                Google review link has not been configured for this business yet.
              </div>
            )}
          </div>

          <PrivateFeedback
            businessId={businessId}
            businessName={businessName}
            sessionId={sessionId}
            rating={selected}
            brandHex={brandHex}
            brandInk={brandInk}
            initialDraft={userEditedDraft ? activeGoogleText : ""}
            onExpired={() => setExpiredLocked(true)}
          />
        </div>
      )}
    </div>
  );
}

function PrivateFeedback({
  businessId,
  businessName,
  sessionId,
  rating,
  brandHex,
  brandInk,
  initialDraft,
  onExpired,
}: {
  businessId: string;
  businessName: string;
  sessionId: string;
  rating: number | null;
  brandHex: string;
  brandInk: string;
  initialDraft?: string;
  onExpired?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !message.trim() && initialDraft) {
        setMessage(initialDraft);
      }
      return next;
    });
  };

  const submit = async (text: string) => {
    if (!text.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessId,
          message: text,
          rating,
        }),
      });
      if (res.status === 403) {
        onExpired?.();
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const requestAiAssist = async () => {
    if (!message.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "polish",
          businessId,
          sessionId,
          text: message,
        }),
      });
      if (res.status === 403) {
        onExpired?.();
        return;
      }
      const data = await res.json();
      if (data.ok && data.suggested) {
        setSuggestion(data.suggested);
      }
    } catch {
      // Keep user's original text if phrasing assist is unreachable
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-black/[0.12] bg-white overflow-hidden">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="w-full min-h-[48px] px-4 py-3 text-left text-sm font-medium text-ink hover:bg-canvas transition-colors flex items-center justify-between gap-2"
      >
        <span>Share private feedback with {businessName}</span>
        <ChevronDownIcon
          size={16}
          className={`text-ink-muted shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-black/[0.07] bg-canvas/50 animate-panel-enter">
          <p className="text-xs text-ink-secondary leading-relaxed">
            Private and optional — only {businessName} can read this. No personal contact details required.
          </p>

          {status === "done" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2.5 text-sm text-emerald-900">
              <CheckIcon size={17} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Thank you — your feedback was delivered privately.</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Only the team at {businessName} can see this note.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="sr-only" htmlFor="private-feedback-input">
                  Private feedback message
                </label>
                <textarea
                  id="private-feedback-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="What stood out during your visit? What could be improved?"
                  className="w-full rounded-xl border border-black/[0.14] bg-white p-3 text-sm text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15 resize-none"
                />
              </div>

              {suggestion !== null && (
                <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cobalt-700">
                      <SparklesIcon size={13} />
                      <span>AI-assisted suggestion — edit or discard freely</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuggestion(null)}
                      className="text-xs text-ink-muted hover:text-ink"
                    >
                      Discard
                    </button>
                  </div>
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    rows={3}
                    aria-label="Editable AI-assisted suggestion"
                    className="w-full rounded-lg border border-cobalt-200 bg-white p-2.5 text-sm text-ink outline-none focus:border-cobalt-600 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMessage(suggestion);
                        setSuggestion(null);
                      }}
                      className="text-xs font-medium text-cobalt-700 hover:text-cobalt-800 underline underline-offset-2"
                    >
                      Apply to message
                    </button>
                    <span className="text-ink-muted text-xs">·</span>
                    <button
                      type="button"
                      onClick={() => void submit(suggestion)}
                      disabled={status === "loading" || !suggestion.trim()}
                      className="text-xs font-medium text-ink hover:underline underline-offset-2 disabled:opacity-40"
                    >
                      Send suggestion directly
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => void submit(message)}
                  disabled={status === "loading" || !message.trim()}
                  className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-95 disabled:opacity-40"
                  style={{ backgroundColor: brandHex, color: brandInk }}
                >
                  {status === "loading" ? "Sending…" : "Send private feedback"}
                </button>

                {suggestion === null && message.trim().length > 3 && (
                  <button
                    type="button"
                    onClick={() => void requestAiAssist()}
                    disabled={aiLoading}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-cobalt-700 hover:bg-cobalt-50 transition-colors disabled:opacity-50"
                  >
                    <SparklesIcon size={13} />
                    <span>
                      {aiLoading ? "Refining phrasing…" : "Help me phrase it (AI-assisted)"}
                    </span>
                  </button>
                )}
              </div>

              {status === "error" && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  Could not deliver feedback right now. Please try again.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
