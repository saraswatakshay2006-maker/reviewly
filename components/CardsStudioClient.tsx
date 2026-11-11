"use client";

import { useState, useTransition } from "react";
import type { Business, ReviewCard } from "@/lib/types";
import { createCardAction, retireCardAction } from "@/lib/actions";
import { getContrastInk, normalizeHex } from "@/lib/color";
import CopyButton from "./CopyButton";
import PlatformSignature from "./PlatformSignature";
import {
  ArrowUpRightIcon,
  CreditCardIcon,
  DownloadIcon,
  NfcIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
} from "./Icons";

export default function CardsStudioClient({
  business,
  cards,
  appUrl,
}: {
  business: Business;
  cards: ReviewCard[];
  appUrl: string;
}) {
  const [label, setLabel] = useState("");
  const [chipType, setChipType] = useState<"NTAG213" | "NTAG215" | "QR">("NTAG213");
  const [showRetired, setShowRetired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [retiringId, setRetiringId] = useState<string | null>(null);

  const qrSvgPath = `/api/qr/${business.publicSlug}`;
  const qrTargetUrl = `${appUrl}/r/${business.publicSlug}?src=qr`;

  const brandHex = normalizeHex(business.primaryColor, "#1A4BE0");
  const brandInk = getContrastInk(brandHex);

  const activeCards = cards.filter((c) => c.status === "active");
  const retiredCards = cards.filter((c) => c.status !== "active");
  const visibleCards = showRetired ? cards : activeCards;

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("businessId", business.id);
    fd.set("label", label.trim() || "Counter NFC Card");
    fd.set("chipType", chipType);

    startCreate(async () => {
      try {
        await createCardAction(fd);
        setLabel("");
      } catch (err) {
        setError((err as Error).message || "Could not create card");
      }
    });
  };

  const handleRetire = (id: string) => {
    setRetiringId(id);
    startCreate(async () => {
      try {
        await retireCardAction(id);
      } catch (err) {
        setError((err as Error).message || "Could not retire card");
      } finally {
        setRetiringId(null);
      }
    });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left: Card Inventory & Creation */}
      <div className="no-print lg:col-span-7 space-y-5">
        {/* Create Card Panel */}
        <form
          onSubmit={handleCreate}
          className="rounded-card bg-white border border-black/[0.09] p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">
                Issue new card or stand token
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Program the generated <code className="font-mono">/t/&lt;token&gt;</code> URL onto any NFC tag.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label
                htmlFor="card-label"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Placement label
              </label>
              <input
                id="card-label"
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Front counter, Table 4"
                className="w-full min-h-[42px] rounded-control border border-black/[0.13] bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
              />
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="card-chip"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Hardware type
              </label>
              <select
                id="card-chip"
                name="chipType"
                value={chipType}
                onChange={(e) =>
                  setChipType(e.target.value as "NTAG213" | "NTAG215" | "QR")
                }
                className="w-full min-h-[42px] rounded-control border border-black/[0.13] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
              >
                <option value="NTAG213">NTAG213 (NFC)</option>
                <option value="NTAG215">NTAG215 (NFC)</option>
                <option value="QR">QR Stand</option>
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <PlusIcon size={15} />
            <span>{isCreating && !retiringId ? "Creating token…" : "Create card token"}</span>
          </button>
        </form>

        {/* Card List */}
        <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink">
                Issued tokens
              </h2>
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-mono text-ink-secondary tabular-nums">
                {activeCards.length} active
              </span>
            </div>

            {retiredCards.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRetired((v) => !v)}
                className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
              >
                {showRetired
                  ? "Hide retired"
                  : `Show retired (${retiredCards.length})`}
              </button>
            )}
          </div>

          {visibleCards.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <CreditCardIcon size={20} className="mx-auto text-ink-muted" />
              <p className="text-sm font-medium text-ink">No active card tokens</p>
              <p className="text-xs text-ink-muted">
                Create your first NFC or QR token above to start tracking tap sources.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {visibleCards.map((c) => {
                const tapPath = `/t/${c.token}`;
                const fullTapUrl = `${appUrl}${tapPath}`;
                const isActive = c.status === "active";
                return (
                  <li
                    key={c.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-surface-dark text-white"
                            : "bg-surface-subtle text-ink-muted"
                        }`}
                      >
                        {c.chipType === "QR" ? (
                          <QrCodeIcon size={17} />
                        ) : (
                          <NfcIcon size={17} />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-ink truncate">
                            {c.label || "Untitled card"}
                          </p>
                          <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-mono text-ink-secondary">
                            {c.chipType}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-surface-subtle text-ink-muted"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-ink-muted truncate">
                          {tapPath}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-13 sm:pl-0">
                      <CopyButton value={fullTapUrl} label="Copy URL" />
                      {isActive && (
                        <>
                          <a
                            href={tapPath}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-ink transition-colors"
                          >
                            <span>Test</span>
                            <ArrowUpRightIcon size={12} />
                          </a>
                          <button
                            type="button"
                            disabled={retiringId === c.id}
                            onClick={() => handleRetire(c.id)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {retiringId === c.id ? "Retiring…" : "Retire"}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Right: Printable QR Counter Stand */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-card bg-white border border-black/[0.1] overflow-hidden shadow-panel">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: brandHex, color: brandInk }}
          >
            <div className="min-w-0">
              <p className="font-display font-semibold text-base truncate">
                {business.name}
              </p>
              <p className="text-xs opacity-85 truncate">{business.category}</p>
            </div>
            <QrCodeIcon size={20} className="shrink-0 opacity-90" />
          </div>

          <div className="p-6 sm:p-8 text-center space-y-4">
            <p className="font-display text-lg font-semibold text-ink">
              Share your experience
            </p>
            <p className="text-xs text-ink-secondary max-w-xs mx-auto leading-relaxed">
              Scan with your phone camera to rate your visit, open our Google page, or send private feedback.
            </p>

            <div className="inline-block rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSvgPath}
                alt={`QR code for ${business.name}`}
                width={200}
                height={200}
                className="mx-auto block"
              />
            </div>

            <p className="font-mono text-[11px] text-ink-muted break-all">
              /r/{business.publicSlug}?src=qr
            </p>

            <div className="pt-3 border-t border-black/[0.06]">
              <PlatformSignature compact />
            </div>
          </div>
        </div>

        <div className="no-print grid grid-cols-3 gap-2">
          <a
            href={qrSvgPath}
            download={`${business.publicSlug}-qr.svg`}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 py-2 text-xs font-medium text-white transition-colors"
          >
            <DownloadIcon size={14} />
            <span>SVG</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-3 py-2 text-xs font-medium text-ink transition-colors"
          >
            <PrinterIcon size={14} />
            <span>Print</span>
          </button>

          <CopyButton
            value={qrTargetUrl}
            label="Copy QR URL"
            className="min-h-[42px] !rounded-control"
          />
        </div>
      </div>
    </div>
  );
}

