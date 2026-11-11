"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/lib/types";
import { saveBusinessAction } from "@/lib/actions";
import { getContrastInk, normalizeHex, rgbaFromHex } from "@/lib/color";
import {
  extractOpeningKey,
  generateUniqueBusinessReview,
  getHighlightOptions,
} from "@/lib/reviewGenerator";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  GoogleGMark,
  RefreshIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "@/components/Icons";

const CATEGORIES = [
  "Gym",
  "Restaurant",
  "Café",
  "Salon",
  "Clinic",
  "Hotel",
  "Coaching Institute",
  "Retail",
  "Other",
];

const SWATCHES = [
  { name: "Cobalt", hex: "#1A4BE0" },
  { name: "Slate Ink", hex: "#0D1321" },
  { name: "Forest", hex: "#047857" },
  { name: "Amber Ochre", hex: "#B45309" },
  { name: "Crimson", hex: "#BE123C" },
];

export default function BusinessSettingsForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: Business | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [slug, setSlug] = useState(initial?.publicSlug || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [welcomeMessage, setWelcomeMessage] = useState(
    initial?.welcomeMessage || ""
  );
  const [primaryColor, setPrimaryColor] = useState(
    normalizeHex(initial?.primaryColor, "#1A4BE0")
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initial?.googleReviewUrl || ""
  );
  const [placeIdInput, setPlaceIdInput] = useState("");
  const [showPlaceHelper, setShowPlaceHelper] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [sampleReview, setSampleReview] = useState("");
  const seenSamplesRef = useRef<string[]>([]);
  const seenOpeningsRef = useRef<string[]>([]);

  const refreshSampleReview = (resetHistory = false) => {
    if (resetHistory) {
      seenSamplesRef.current = [];
      seenOpeningsRef.current = [];
    }
    const res = generateUniqueBusinessReview({
      businessName: name.trim() || "Your Business",
      category,
      address,
      description,
      rating: 5,
      length: "medium",
      avoidDrafts: seenSamplesRef.current,
      avoidOpenings: seenOpeningsRef.current,
    });
    seenSamplesRef.current = [...seenSamplesRef.current.slice(-7), res.text];
    seenOpeningsRef.current = [
      ...seenOpeningsRef.current.slice(-7),
      res.openingKey || extractOpeningKey(res.text),
    ];
    setSampleReview(res.text);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshSampleReview(true);
    }, 150);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, category, address, description]);

  const detectedChips = getHighlightOptions({
    businessName: name.trim() || "Your Business",
    category,
    description,
  }).slice(0, 4);

  const autoGenerateSlug = () => {
    const generated =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24) || "my-business";
    setSlug(generated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveBusinessAction(fd);
        setMessage("Business settings saved.");
        router.refresh();
      } catch (err) {
        setError((err as Error).message || "Could not save settings.");
      }
    });
  };

  const field =
    "w-full min-h-[42px] rounded-control border border-black/[0.13] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/65 outline-none transition-colors focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15 disabled:bg-surface-subtle disabled:text-ink-muted";
  const label = "block text-xs font-medium text-ink-secondary mb-1.5";

  const previewHex = normalizeHex(primaryColor, "#1A4BE0");
  const previewInk = getContrastInk(previewHex);
  const previewWash = rgbaFromHex(previewHex, 0.09);

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] p-6 sm:p-8 space-y-5"
      >
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="businessId" value={initial?.id || ""} />
        <input type="hidden" name="primaryColor" value={previewHex} />

        <div>
          <label htmlFor="biz-name" className={label}>
            Business name
          </label>
          <input
            id="biz-name"
            className={field}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Harbor Roasters"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="biz-category" className={label}>
              Category
            </label>
            <select
              id="biz-category"
              className={field}
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="biz-slug" className="text-xs font-medium text-ink-secondary">
                Landing page slug
              </label>
              {!initial && (
                <button
                  type="button"
                  onClick={autoGenerateSlug}
                  className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                >
                  Auto-generate
                </button>
              )}
            </div>
            <input
              id="biz-slug"
              className={`${field} font-mono text-xs`}
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={!!initial}
              placeholder="harborroasters"
            />
            {initial && (
              <p className="text-[11px] text-ink-muted mt-1">
                Slug stays fixed so printed QR codes keep working.
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="biz-address" className={label}>
            Address (shown subtly below business title &amp; used for local context)
          </label>
          <input
            id="biz-address"
            className={field}
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="12 MG Road, Bengaluru"
          />
        </div>

        <div>
          <label htmlFor="biz-description" className={label}>
            Specialties, services &amp; keywords (helps auto-generate business-oriented reviews)
          </label>
          <textarea
            id="biz-description"
            className={`${field} resize-none`}
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Strength training, cardio zone, personal coaching, evening batches"
          />
          <p className="text-[11px] text-ink-muted mt-1">
            Separate highlights with commas — customers get quick topic chips and unique SEO-friendly starter reviews grounded in what your business actually offers.
          </p>
        </div>

        <div>
          <label htmlFor="biz-welcome" className={label}>
            Welcome message for customers
          </label>
          <textarea
            id="biz-welcome"
            className={`${field} resize-none`}
            name="welcomeMessage"
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="We'd love to hear about your experience."
          />
        </div>

        <div>
          <label className={label}>Brand color (customer page &amp; QR stand)</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              aria-label="Custom brand color picker"
              value={previewHex}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-12 rounded-lg border border-black/15 cursor-pointer bg-white p-0.5"
            />
            <span className="font-mono text-xs text-ink-secondary bg-surface-subtle px-2.5 py-1.5 rounded-md">
              {previewHex.toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5">
              {SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  title={sw.name}
                  aria-label={`Select ${sw.name} color`}
                  onClick={() => setPrimaryColor(sw.hex)}
                  className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                    previewHex.toUpperCase() === sw.hex.toUpperCase()
                      ? "ring-2 ring-cobalt-600 ring-offset-2 border-white"
                      : "border-black/15"
                  }`}
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">
            Button contrast adapts automatically to remain legible on every color.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="biz-google" className="text-xs font-medium text-ink-secondary">
              Official Google write-a-review link
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPlaceHelper((v) => !v)}
                className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
              >
                {showPlaceHelper ? "Hide Place ID builder" : "Use Place ID"}
              </button>
              {googleReviewUrl && (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
                >
                  <span>Test link</span>
                  <ExternalLinkIcon size={12} />
                </a>
              )}
            </div>
          </div>
          <input
            id="biz-google"
            type="url"
            className={`${field} font-mono text-xs`}
            name="googleReviewUrl"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
          />

          {googleReviewUrl.includes("google.com/maps/place/") && (
            <p className="mt-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 leading-relaxed">
              Tip: A Google Maps <code className="font-mono">/maps/place/</code> URL opens your listing pin rather than the review composer popup. Paste your direct <code className="font-mono">g.page/r/.../review</code> link or build a <code className="font-mono">writereview?placeid=</code> link above.
            </p>
          )}

          {showPlaceHelper && (
            <div className="mt-2.5 rounded-xl border border-black/[0.1] bg-canvas p-3.5 space-y-2">
              <label htmlFor="place-id-helper" className="block text-xs font-medium text-ink">
                Build direct write-a-review link from Google Place ID
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="place-id-helper"
                  value={placeIdInput}
                  onChange={(e) => setPlaceIdInput(e.target.value)}
                  placeholder="ChIJ..."
                  className="flex-1 min-h-[38px] rounded-lg border border-black/[0.13] bg-white px-3 py-1.5 font-mono text-xs text-ink outline-none focus:border-cobalt-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = placeIdInput.trim();
                    if (!clean) return;
                    setGoogleReviewUrl(
                      `https://search.google.com/local/writereview?placeid=${encodeURIComponent(clean)}`
                    );
                    setShowPlaceHelper(false);
                  }}
                  className="min-h-[38px] rounded-lg bg-ink px-3.5 py-1.5 text-xs font-medium text-white hover:bg-ink/90 shrink-0"
                >
                  Apply link
                </button>
              </div>
              <p className="text-[11px] text-ink-muted">
                Creates <code className="font-mono">https://search.google.com/local/writereview?placeid=...</code> which opens Google&apos;s review box directly.
              </p>
            </div>
          )}

          <p className="text-[11px] text-ink-muted mt-1.5">
            Reviewly opens this official link in a new tab (and copies any customer-drafted review text to their clipboard) — we never alter Google&apos;s composer or submit reviews on a customer&apos;s behalf.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-control border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800"
          >
            <CheckIcon size={15} />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-control border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {isPending
              ? "Saving…"
              : initial
              ? "Save changes"
              : "Create business"}
          </button>

          {initial && (
            <a
              href={`/r/${initial.publicSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
            >
              <span>Open /r/{initial.publicSlug}</span>
              <ArrowUpRightIcon size={14} />
            </a>
          )}
        </div>
      </form>

      {/* Right: Live Mobile Preview */}
      <aside className="lg:col-span-5 lg:sticky lg:top-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-secondary">
            Live customer page preview
          </p>
          <span className="text-[11px] font-mono text-ink-muted">
            /r/{slug || "your-slug"}
          </span>
        </div>

        <div className="rounded-[24px] bg-surface-dark p-2.5 shadow-device">
          <div className="rounded-[18px] bg-white overflow-hidden">
            <div
              className="px-5 pt-7 pb-5 text-center border-b border-black/[0.06]"
              style={{
                background: `linear-gradient(180deg, ${previewWash} 0%, #FFFFFF 100%)`,
              }}
            >
              <div
                className="mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center font-display text-xl font-bold shadow-panel"
                style={{ backgroundColor: previewHex, color: previewInk }}
              >
                {(name.trim() || "B").charAt(0).toUpperCase()}
              </div>
              <p className="font-display text-lg font-semibold text-ink truncate">
                {name.trim() || "Your Business Name"}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-secondary">
                <span className="rounded bg-surface-subtle px-2 py-0.5 font-medium text-ink">
                  {category}
                </span>
                {address.trim() && (
                  <span className="text-ink-muted truncate max-w-[160px]">
                    {address.trim()}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-center text-xs text-ink-secondary leading-relaxed">
                {welcomeMessage.trim() ||
                  `We'd love to hear about your experience at ${name.trim() || "our business"}.`}
              </p>

              <div className="flex items-center justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon
                    key={n}
                    size={22}
                    filled={n <= 4}
                    className={n <= 4 ? "text-amber-500" : "text-slate-300"}
                  />
                ))}
              </div>

              <div
                className="w-full rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between"
                style={{ backgroundColor: previewHex, color: previewInk }}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-white inline-flex items-center justify-center">
                    <GoogleGMark size={12} />
                  </span>
                  <span>Share Your Experience on Google</span>
                </span>
                <ExternalLinkIcon size={13} className="opacity-80" />
              </div>

              <div className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-medium text-ink text-center">
                Share private feedback with {name.trim() || "the business"}
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-center gap-1 text-[10px] text-ink-muted">
                <ShieldCheckIcon size={11} />
                <span>Powered by Reviewly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Auto-Generated Review Tester */}
        <div className="rounded-card bg-white border border-black/[0.09] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
              <SparklesIcon size={14} className="text-cobalt-600" />
              <span>Unique auto-review preview</span>
            </span>
            <button
              type="button"
              onClick={() => refreshSampleReview(false)}
              className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
            >
              <RefreshIcon size={12} />
              <span>New variation</span>
            </button>
          </div>

          <p className="rounded-lg bg-canvas border border-black/[0.06] p-3 text-xs text-ink-secondary leading-relaxed">
            {sampleReview || "Generating a tailored review sample for this business…"}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {detectedChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-surface-subtle border border-black/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-ink-secondary"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted leading-snug">
            Each customer gets a fresh, editable draft built around your business name, category, location, and selected highlight chips.
          </p>
        </div>
      </aside>
    </div>
  );
}
