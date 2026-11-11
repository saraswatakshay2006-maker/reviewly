"use client";

import { useState } from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  GoogleGMark,
  NfcIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "./Icons";

type EntrySource = "nfc" | "qr";

export default function LandingInteractiveDemo() {
  const [source, setSource] = useState<EntrySource>("nfc");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [googleDraftOpen, setGoogleDraftOpen] = useState(false);
  const [draft, setDraft] = useState("coffee was great wait time at counter was a bit long");
  const [aiSuggested, setAiSuggested] = useState<string | null>(null);
  const [googleCopiedNotice, setGoogleCopiedNotice] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>("session_started · src=nfc");

  const switchSource = (next: EntrySource) => {
    setSource(next);
    setLastEvent(`session_started · src=${next}`);
  };

  const handleSelectRating = (n: number) => {
    setRating(n);
    setFeedbackSent(false);
    setGoogleCopiedNotice(false);
    setLastEvent(`rating_select · ${n}/5 · all options shown`);
  };

  const activeText = (aiSuggested ?? (googleDraftOpen ? draft : "")).trim();

  const handleGoogleDemo = async () => {
    if (activeText) {
      try {
        await navigator.clipboard.writeText(activeText);
      } catch {
        // Ignore clipboard errors in non-HTTPS demo frames
      }
      setGoogleCopiedNotice(true);
      setLastEvent(`google_click · copied draft text & opened official URL`);
    } else {
      setGoogleCopiedNotice(false);
      setLastEvent(`google_click · opened official review URL`);
    }
  };

  const handleAiPhrase = () => {
    const cleaned = draft.trim().replace(/\s+/g, " ");
    if (!cleaned) return;
    setAiSuggested(
      cleaned === "coffee was great wait time at counter was a bit long"
        ? "The coffee was great, though the wait time at the counter was a bit long."
        : `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}${/[.!?]$/.test(cleaned) ? "" : "."}`
    );
  };

  const handleSendDemoFeedback = () => {
    setFeedbackSent(true);
    setLastEvent(`feedback_submit · private to business`);
  };

  const displayStar = hoverRating ?? rating ?? 0;

  return (
    <div className="w-full max-w-[440px] mx-auto lg:ml-auto">
      {/* Entry source toggle bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div
          className="inline-flex rounded-xl bg-surface-subtle p-1 border border-black/[0.07]"
          role="tablist"
          aria-label="Simulated customer entry point"
        >
          <button
            type="button"
            role="tab"
            aria-selected={source === "nfc"}
            onClick={() => switchSource("nfc")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
              source === "nfc"
                ? "bg-white text-ink shadow-panel"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <NfcIcon size={14} className={source === "nfc" ? "text-cobalt-600" : ""} />
            <span>Tap NFC card</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === "qr"}
            onClick={() => switchSource("qr")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
              source === "qr"
                ? "bg-white text-ink shadow-panel"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <QrCodeIcon size={14} className={source === "qr" ? "text-cobalt-600" : ""} />
            <span>Scan table QR</span>
          </button>
        </div>

        <span className="text-xs font-medium text-ink-muted whitespace-nowrap">Interactive preview</span>
      </div>

      {/* Tactile device shell */}
      <div className="rounded-[24px] bg-surface-dark p-2.5 shadow-device border border-black/15">
        <div className="rounded-[18px] bg-white overflow-hidden">
          {/* Simulated compact URL & token bar */}
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] bg-canvas px-4 py-2.5 text-[11px] font-mono text-ink-muted">
            <span className="truncate">/r/harbor-roasters?src={source}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-sans font-medium text-emerald-700 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live flow
            </span>
          </div>

          {/* Business identity band */}
          <div className="px-6 pt-6 pb-5 text-center bg-gradient-to-b from-cobalt-50/75 to-white border-b border-black/[0.05]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cobalt-600 font-display text-lg font-bold text-white">
              H
            </div>
            <p className="font-display text-lg font-semibold text-ink">Harbor Roasters</p>
            <p className="text-xs text-ink-secondary mt-0.5">Specialty Café · Interactive Demo</p>
          </div>

          {/* Rating & non-gated actions */}
          <div className="px-6 py-5 space-y-4">
            {rating === null ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm font-medium text-ink">
                  How was your visit today?
                </p>
                <div
                  className="flex items-center justify-center gap-1.5"
                  role="radiogroup"
                  aria-label="Try rating 1 to 5 stars"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`Select ${n} star${n > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHoverRating(n)}
                      onClick={() => handleSelectRating(n)}
                      className="h-11 w-11 inline-flex items-center justify-center rounded-xl transition-transform hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-cobalt-600"
                    >
                      <StarIcon
                        size={28}
                        filled={n <= displayStar}
                        className={
                          n <= displayStar
                            ? "text-amber-500 transition-colors"
                            : "text-slate-300 transition-colors"
                        }
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ink-muted">
                  Click any star (1 or 5) — every rating unlocks the exact same options.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-panel-enter">
                <div className="flex items-center justify-between rounded-xl bg-canvas px-3.5 py-2.5 border border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon
                          key={n}
                          size={14}
                          filled={n <= rating}
                          className={n <= rating ? "text-amber-500" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-ink tabular-nums">
                      Rated {rating}/5
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRating(null);
                      setFeedbackOpen(false);
                      setFeedbackSent(false);
                    }}
                    className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                  >
                    Change
                  </button>
                </div>

                {/* Option 1: Official Google link + optional draft & copy */}
                <div className="rounded-xl border border-black/[0.09] p-3 space-y-2.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setGoogleDraftOpen((v) => !v)}
                    className="w-full flex items-center justify-between text-left text-xs font-medium text-ink-secondary hover:text-ink"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <SparklesIcon size={13} className="text-cobalt-600" />
                      <span>Draft &amp; polish wording for Google (optional)</span>
                    </span>
                    <span className="text-ink-muted">{googleDraftOpen ? "Hide" : "Open"}</span>
                  </button>

                  {googleDraftOpen && (
                    <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        aria-label="Demo Google review draft"
                        className="w-full rounded-lg border border-black/10 bg-canvas/50 px-3 py-2 text-xs text-ink outline-none focus:border-cobalt-600 resize-none"
                      />
                      {aiSuggested && (
                        <div className="rounded-lg border border-cobalt-200 bg-cobalt-50/70 p-2 space-y-1">
                          <p className="text-[11px] font-medium text-cobalt-700">
                            AI-assisted phrasing (editable)
                          </p>
                          <p className="text-xs text-ink">{aiSuggested}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAiPhrase}
                        className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                      >
                        <SparklesIcon size={13} />
                        <span>Polish wording (AI-assisted)</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleGoogleDemo()}
                    className="w-full flex items-center justify-between rounded-xl bg-cobalt-600 hover:bg-cobalt-700 text-white px-4 py-3 text-sm font-medium transition-colors active:scale-[0.99]"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white shrink-0">
                        <GoogleGMark size={14} />
                      </span>
                      <span>
                        {activeText
                          ? "Copy Text & Open Google Review"
                          : "Share Your Experience on Google"}
                      </span>
                    </span>
                    <ExternalLinkIcon size={15} className="opacity-85 shrink-0" />
                  </button>

                  {googleCopiedNotice && (
                    <p className="text-[11px] text-cobalt-800 bg-cobalt-50 border border-cobalt-200 rounded-lg px-2.5 py-1.5">
                      Draft copied — select {rating} {rating === 1 ? "star" : "stars"} on Google and paste.
                    </p>
                  )}
                </div>

                {/* Option 2: Private feedback */}
                <div className="rounded-xl border border-black/[0.1] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink hover:bg-canvas transition-colors"
                  >
                    <span>Send private feedback to Harbor Roasters</span>
                    <span className="text-xs text-ink-muted">{feedbackOpen ? "Hide" : "Open"}</span>
                  </button>

                  {feedbackOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-black/[0.06] bg-canvas/50">
                      {feedbackSent ? (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">
                          <CheckIcon size={14} />
                          <span>Delivered privately to owner inbox.</span>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={2}
                            aria-label="Demo private feedback message"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-cobalt-600 resize-none"
                          />
                          {aiSuggested && (
                            <div className="rounded-lg border border-cobalt-200 bg-cobalt-50/70 p-2.5 space-y-1.5">
                              <p className="text-[11px] font-medium text-cobalt-700">
                                AI-assisted suggestion (optional)
                              </p>
                              <p className="text-xs text-ink">{aiSuggested}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={handleAiPhrase}
                              className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                            >
                              <SparklesIcon size={13} />
                              <span>Clean up wording</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSendDemoFeedback}
                              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90"
                            >
                              Send privately
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheckIcon size={12} />
              <span>Powered by Reviewly · No gating at any rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live telemetry bar */}
      <div className="mt-3 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-ink-muted shrink-0">Event log</span>
        <code className="font-mono text-[11px] text-ink truncate">{lastEvent}</code>
      </div>
    </div>
  );
}

