"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Business, StandeeTheme, StandeeColors } from "@/lib/types";
import NfcCardArtwork from "./NfcCardArtwork";
import StandeeNfcModal from "./StandeeNfcModal";
import CopyButton from "./CopyButton";
import {
  generateStandeeQrDataUrl,
  exportCardPng,
  exportCardPdf,
} from "@/lib/standeeExport";
import {
  CreditCardIcon,
  DownloadIcon,
  NfcIcon,
  PrinterIcon,
  RotateIcon,
  SparklesIcon,
} from "./Icons";

export default function NfcCardStudio({
  business,
  themes,
  appUrl,
}: {
  business: Business;
  themes: StandeeTheme[];
  appUrl: string;
}) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [tagline, setTagline] = useState(
    business.category ? `${business.category} · TAP TO REVIEW` : "TAP PHONE HERE TO REVIEW"
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    themes[0]?.id || "forest-green-gold"
  );
  const [colors, setColors] = useState<StandeeColors>(
    themes[0]?.colors || {
      primary: "#063F32",
      secondary: "#12805A",
      accent: "#D9A441",
      background: "#FFFFFF",
      text: "#17211D",
    }
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showNfcGuide, setShowNfcGuide] = useState<boolean>(false);

  const frontSvgRef = useRef<SVGSVGElement | null>(null);
  const backSvgRef = useRef<SVGSVGElement | null>(null);

  const reviewTargetUrl = `${appUrl}/r/${business.publicSlug}?src=nfc`;

  // Generate QR code for the review URL
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const url = await generateStandeeQrDataUrl(reviewTargetUrl, "#111827");
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [reviewTargetUrl]);

  // Apply theme preset
  const handleSelectTheme = (theme: StandeeTheme) => {
    setSelectedThemeId(theme.id);
    setColors({ ...theme.colors });
  };

  const handleExportPng = async (side: "front" | "back") => {
    const svgEl =
      side === "front"
        ? (document.getElementById("nfc-front-svg") as unknown as SVGSVGElement)
        : (document.getElementById("nfc-back-svg") as unknown as SVGSVGElement);
    if (!svgEl) return;
    setIsExporting(true);
    try {
      await exportCardPng(svgEl, `${business.publicSlug}-nfc-card-${side}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    const frontEl = document.getElementById(
      "nfc-front-svg"
    ) as unknown as SVGSVGElement;
    const backEl = document.getElementById(
      "nfc-back-svg"
    ) as unknown as SVGSVGElement;
    if (!frontEl) return;
    setIsExporting(true);
    try {
      await exportCardPdf(
        frontEl,
        backEl,
        `${business.publicSlug}-nfc-card-print`
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="rounded-xl border border-black/[0.08] bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cobalt-600 text-white">
              <CreditCardIcon size={16} />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">
              Smart NFC PVC Review Card Designer
            </h2>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              CR80 Standard (85.6 × 54 mm)
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Recreate the physical Google Tap Review Card. Instant 5-second customer feedback for counters, tables, or sales teams.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNfcGuide(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-surface-subtle hover:bg-black/[0.05] text-xs font-semibold text-ink transition-colors"
          >
            <NfcIcon size={14} className="text-cobalt-600" />
            <span>How to Program NFC Tag</span>
          </button>
          <CopyButton value={reviewTargetUrl} label="Copy Review URL" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive 3D Card Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-card bg-surface-dark/95 border border-white/10 p-6 sm:p-8 text-center text-white relative shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: colors.accent }}
            />
            <div
              className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: colors.secondary }}
            />

            {/* View Side Toggle */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-xs font-mono tracking-wider text-slate-300 uppercase">
                {activeSide === "front" ? "Front Side (NFC Tap & Google Stars)" : "Back Side (Camera QR Code)"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveSide((s) => (s === "front" ? "back" : "front"))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all shadow-xs cursor-pointer"
              >
                <RotateIcon size={13} />
                <span>Flip to {activeSide === "front" ? "Back" : "Front"}</span>
              </button>
            </div>

            {/* Card Frame with 3D Depth */}
            <div className="max-w-[460px] mx-auto transition-transform duration-300 hover:scale-[1.02] filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]">
              {activeSide === "front" ? (
                <NfcCardArtwork
                  id="nfc-front-svg"
                  businessName={business.name}
                  tagline={tagline}
                  logoUrl={business.logoUrl || undefined}
                  emblemType={(business as any).standeeDesign?.emblemType}
                  qrDataUrl={qrDataUrl}
                  colors={colors}
                  side="front"
                  reviewUrl={reviewTargetUrl}
                />
              ) : (
                <NfcCardArtwork
                  id="nfc-back-svg"
                  businessName={business.name}
                  tagline={tagline}
                  logoUrl={business.logoUrl || undefined}
                  emblemType={(business as any).standeeDesign?.emblemType}
                  qrDataUrl={qrDataUrl}
                  colors={colors}
                  side="back"
                  reviewUrl={reviewTargetUrl}
                />
              )}
            </div>

            {/* Hidden Off-Screen Rendering for Dual-Side PDF generation */}
            <div className="sr-only">
              <NfcCardArtwork
                id="nfc-front-svg"
                businessName={business.name}
                tagline={tagline}
                logoUrl={business.logoUrl || undefined}
                emblemType={(business as any).standeeDesign?.emblemType}
                qrDataUrl={qrDataUrl}
                colors={colors}
                side="front"
                reviewUrl={reviewTargetUrl}
              />
              <NfcCardArtwork
                id="nfc-back-svg"
                businessName={business.name}
                tagline={tagline}
                logoUrl={business.logoUrl || undefined}
                emblemType={(business as any).standeeDesign?.emblemType}
                qrDataUrl={qrDataUrl}
                colors={colors}
                side="back"
                reviewUrl={reviewTargetUrl}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-6 relative z-10">
              Interactive 3D PVC Card Preview · Actual size: standard 85.6 × 54 mm (Credit Card Size)
            </p>
          </div>

          {/* Quick Export Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <PrinterIcon size={15} />
              <span>{isExporting ? "Generating PDF…" : "Download Print PDF"}</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExportPng("front")}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-ink px-4 py-2 text-xs sm:text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <DownloadIcon size={14} />
              <span>Front PNG (300 DPI)</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExportPng("back")}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-ink px-4 py-2 text-xs sm:text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <DownloadIcon size={14} />
              <span>Back PNG (300 DPI)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls & Color Themes */}
        <div className="lg:col-span-5 space-y-5">
          {/* Color Palettes */}
          <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
                <SparklesIcon size={14} className="text-cobalt-600" />
                <span>Card Color Themes</span>
              </h3>
              <span className="text-[11px] text-ink-muted">
                {themes.length} Presets
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {themes.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-cobalt-600 bg-cobalt-50/40 ring-2 ring-cobalt-600/20 shadow-xs"
                        : "border-black/[0.08] bg-white hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-ink truncate">
                      {theme.name}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers */}
            <div className="pt-3 border-t border-black/[0.07] space-y-3">
              <p className="text-xs font-medium text-ink">Fine-tune Colors</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                    Primary
                  </label>
                  <div className="flex items-center gap-1 border border-black/10 rounded-lg p-1 bg-white">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => {
                        setSelectedThemeId("custom");
                        setColors({ ...colors, primary: e.target.value });
                      }}
                      className="h-6 w-6 rounded border-0 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-ink-muted uppercase">
                      {colors.primary}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                    Secondary
                  </label>
                  <div className="flex items-center gap-1 border border-black/10 rounded-lg p-1 bg-white">
                    <input
                      type="color"
                      value={colors.secondary}
                      onChange={(e) => {
                        setSelectedThemeId("custom");
                        setColors({ ...colors, secondary: e.target.value });
                      }}
                      className="h-6 w-6 rounded border-0 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-ink-muted uppercase">
                      {colors.secondary}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                    Accent
                  </label>
                  <div className="flex items-center gap-1 border border-black/10 rounded-lg p-1 bg-white">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => {
                        setSelectedThemeId("custom");
                        setColors({ ...colors, accent: e.target.value });
                      }}
                      className="h-6 w-6 rounded border-0 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[10px] text-ink-muted uppercase">
                      {colors.accent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Details Customizer */}
          <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-ink">
              Card Content
            </h3>
            <div>
              <label
                htmlFor="card-tagline"
                className="block text-xs font-medium text-ink-secondary mb-1.5"
              >
                Card Subtitle / Tagline
              </label>
              <input
                id="card-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={45}
                placeholder="e.g. TAP PHONE HERE TO REVIEW"
                className="w-full min-h-[40px] rounded-control border border-black/[0.13] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15"
              />
            </div>

            <div className="rounded-lg bg-surface-subtle p-3 text-[11px] text-ink-secondary space-y-1">
              <p className="font-medium text-ink">
                Ready for standard plastic card printers:
              </p>
              <p>
                The generated PDF and 300 DPI PNG can be sent directly to any PVC/plastic card printer or manufacturer (Zebra, Evolis, Magicard, or online printers).
              </p>
            </div>
          </div>
        </div>
      </div>

      <StandeeNfcModal
        isOpen={showNfcGuide}
        onClose={() => setShowNfcGuide(false)}
        nfcUrl={reviewTargetUrl}
        businessName={business.name}
      />
    </div>
  );
}
