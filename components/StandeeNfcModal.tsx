"use client";

import React from "react";
import CopyButton from "./CopyButton";
import { ArrowUpRightIcon, CloseIcon, NfcIcon, ShieldCheckIcon } from "./Icons";

export interface StandeeNfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfcUrl: string;
  businessName: string;
}

export default function StandeeNfcModal({
  isOpen,
  onClose,
  nfcUrl,
  businessName,
}: StandeeNfcModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-black/10 shadow-2xl p-6 sm:p-7 overflow-hidden text-ink"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-black/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cobalt-50 text-cobalt-600 flex items-center justify-center border border-cobalt-100">
              <NfcIcon size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                How to Program Your NFC Standee
              </h2>
              <p className="text-xs text-ink-muted">
                One-time setup for {businessName}&apos;s tabletop tap experience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Important Clarification Alert */}
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-amber-950">
            <ShieldCheckIcon size={15} className="text-amber-700 shrink-0" />
            <span>Important Physical Standee Note</span>
          </p>
          <p className="mt-1">
            Downloading or printing the A6 paper design does not physically encode data into an NFC chip. Your acrylic standee contains an embedded or stick-on NFC tag (NTAG213 / NTAG215). You program that chip once in 30 seconds using the free app below.
          </p>
        </div>

        {/* Target NFC URL Section */}
        <div className="mt-4 p-3.5 rounded-xl bg-canvas border border-black/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Your Business NFC Target URL
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Ready to Program
            </span>
          </div>
          <p className="font-mono text-xs text-ink break-all select-all font-semibold bg-white p-2.5 rounded-lg border border-black/[0.08]">
            {nfcUrl}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <CopyButton value={nfcUrl} label="Copy NFC URL" className="flex-1" />
            <a
              href={nfcUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-semibold text-ink transition-colors"
            >
              <span>Test Link</span>
              <ArrowUpRightIcon size={13} />
            </a>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
            30-Second Setup Guide
          </h3>
          <ol className="space-y-2.5 text-xs text-ink-secondary list-decimal list-inside">
            <li className="leading-relaxed">
              <strong className="text-ink">Install NFC Tools:</strong> Download the free{" "}
              <span className="font-semibold text-cobalt-700">NFC Tools</span> app from the Apple App Store (iOS) or Google Play Store (Android).
            </li>
            <li className="leading-relaxed">
              <strong className="text-ink">Add URL Record:</strong> Open the app &rarr; tap{" "}
              <span className="font-semibold text-ink">Write</span> &rarr; tap{" "}
              <span className="font-semibold text-ink">Add a record</span> &rarr; select{" "}
              <span className="font-semibold text-ink">URL / URI</span>.
            </li>
            <li className="leading-relaxed">
              <strong className="text-ink">Paste Your Link:</strong> Paste your copied NFC URL above and tap{" "}
              <span className="font-semibold text-ink">OK</span>.
            </li>
            <li className="leading-relaxed">
              <strong className="text-ink">Write to Standee:</strong> Tap{" "}
              <span className="font-semibold text-ink">Write / 1 Byte</span> and hold the top back of your smartphone against the acrylic standee&apos;s &ldquo;TAP&rdquo; zone.
            </li>
            <li className="leading-relaxed">
              <strong className="text-ink">Done:</strong> A checkmark will appear! Anyone tapping their phone against the standee will now instantly open your review page.
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-black/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

