"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import type { Business, StandeeDesign, StandeeTheme } from "@/lib/types";
import { StandeeArtwork } from "./StandeeArtwork";
import Standee3DMockup from "./Standee3DMockup";
import StandeeThemeComparison from "./StandeeThemeComparison";
import StandeeNfcModal from "./StandeeNfcModal";
import CopyButton from "./CopyButton";
import {
  generateStandeeQrDataUrl,
  exportStandeePdf,
  exportStandeePng,
  exportStandeeSvg,
} from "@/lib/standeeExport";
import {
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  NfcIcon,
  PrinterIcon,
  QrCodeIcon,
  RefreshIcon,
  RotateIcon,
  SaveIcon,
  SparklesIcon,
} from "./Icons";

export interface StandeeDesignerClientProps {
  business: Business;
  initialDesign: StandeeDesign;
  themes: StandeeTheme[];
  appUrl: string;
}

export default function StandeeDesignerClient({
  business,
  initialDesign,
  themes,
  appUrl,
}: StandeeDesignerClientProps) {
  // Live mutable design state
  const [design, setDesign] = useState<StandeeDesign>(initialDesign);
  const [viewMode, setViewMode] = useState<"flat" | "3d" | "compare">("flat");
  const [activeTab, setActiveTab] = useState<"theme" | "colors" | "content" | "print">("theme");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<"pdf" | "png" | "svg" | null>(null);

  // Hidden/rendered SVG ref for canvas rendering and PDF export
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Real destination URLs
  const cleanAppUrl = appUrl.replace(/\/$/, "");
  const qrTargetUrl = `${cleanAppUrl}/r/${business.publicSlug}?src=standee_qr`;
  const nfcTargetUrl = `${cleanAppUrl}/r/${business.publicSlug}?src=standee_nfc`;

  // Generate QR code data URL whenever target URL or text color changes
  useEffect(() => {
    let active = true;
    generateStandeeQrDataUrl(qrTargetUrl, design.colors.text).then((dataUrl) => {
      if (active) {
        setQrDataUrl(dataUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [qrTargetUrl, design.colors.text]);

  // Handle color change (automatically marks as custom if it differs from preset)
  const handleColorChange = (key: keyof StandeeDesign["colors"], val: string) => {
    setDesign((prev) => ({
      ...prev,
      themeId: "custom",
      colors: {
        ...prev.colors,
        [key]: val,
      },
    }));
  };

  // Handle preset theme selection
  const handleSelectTheme = (theme: StandeeTheme) => {
    setDesign((prev) => ({
      ...prev,
      themeId: theme.id,
      colors: { ...theme.colors },
    }));
    // When selected in compare view, switch back to flat view to see full details
    if (viewMode === "compare") {
      setViewMode("flat");
    }
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDesign((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save design to database via API
  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    startSave(async () => {
      try {
        const res = await fetch(`/api/standee/${business.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(design),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to save standee design");
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError((err as Error).message || "Save failed");
      }
    });
  };

  // Reset design to default
  const handleReset = async () => {
    if (!confirm("Reset this standee design back to default platform theme and business branding?")) {
      return;
    }
    setSaveError(null);
    startSave(async () => {
      try {
        const res = await fetch(`/api/standee/${business.id}/reset`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Reset failed");
        // Reload fresh default design from GET
        const refetch = await fetch(`/api/standee/${business.id}`);
        const data = await refetch.json();
        if (data.design) {
          setDesign(data.design);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err) {
        setSaveError((err as Error).message || "Reset failed");
      }
    });
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!svgRef.current) return;
    setIsExporting("pdf");
    try {
      await exportStandeePdf(
        svgRef.current,
        design,
        `${business.publicSlug}-a6-standee`,
        {
          bleed: design.bleedEnabled,
          cropMarks: design.cropMarks,
        }
      );
    } catch (err) {
      alert(`PDF export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(null);
    }
  };

  // PNG Export
  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    setIsExporting("png");
    try {
      await exportStandeePng(
        svgRef.current,
        `${business.publicSlug}-a6-standee-300dpi`,
        { bleed: design.bleedEnabled }
      );
    } catch (err) {
      alert(`PNG export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(null);
    }
  };

  // SVG Export
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    setIsExporting("svg");
    try {
      exportStandeeSvg(svgRef.current, `${business.publicSlug}-a6-standee`);
    } catch (err) {
      alert(`SVG export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cobalt-50 text-cobalt-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border border-cobalt-200">
              Marketing Tools
            </span>
            <span className="text-xs text-ink-muted">A6 Portrait (105 × 148 mm)</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1 tracking-tight">
            Custom Review Standee Designer
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Design, preview, and download your 300 DPI print-ready tabletop review standee with side-by-side QR scan and NFC tap.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink transition-colors disabled:opacity-50"
            title="Reset to default theme and branding"
          >
            <RotateIcon size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-control text-xs font-semibold text-white transition-all shadow-sm ${
              saveSuccess
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-cobalt-600 hover:bg-cobalt-700"
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : saveSuccess ? (
              <CheckIcon size={14} />
            ) : (
              <SaveIcon size={14} />
            )}
            <span>{isSaving ? "Saving…" : saveSuccess ? "Saved!" : "Save Design"}</span>
          </button>

          <div className="h-5 w-px bg-black/10 mx-1 hidden sm:block" />

          {/* Download PDF Main CTA */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-ink hover:bg-black text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting === "pdf" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <PrinterIcon size={14} />
            )}
            <span>{isExporting === "pdf" ? "Generating PDF…" : "Download A6 PDF"}</span>
          </button>

          {/* High-Res PNG Button */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink transition-colors disabled:opacity-50"
          >
            {isExporting === "png" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <DownloadIcon size={14} />
            )}
            <span>PNG</span>
          </button>

          {/* SVG Button */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink transition-colors disabled:opacity-50"
          >
            <DownloadIcon size={14} />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Save Notification / Feedback */}
      {saveSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5">
            <CheckIcon size={14} />
            Standee design successfully saved for {business.name}.
          </span>
          <span className="text-[11px] text-emerald-700">Persisted per business location</span>
        </div>
      )}
      {saveError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 font-medium">
          {saveError}
        </div>
      )}

      {/* Two-Panel Designer Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* ================================================================= */}
        {/* LEFT PANEL: Customization Controls (Cols 5 on desktop)             */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Controls Navigation Tabs */}
          <div className="flex rounded-xl bg-surface-subtle p-1 border border-black/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "theme"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Themes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("colors")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "colors"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Custom Colors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("content")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "content"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("print")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "print"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Print Setup
            </button>
          </div>

          {/* TAB 1: PRESET THEMES (7 Presets + Custom) */}
          {activeTab === "theme" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-sm font-bold text-ink">
                    Select Curated Theme
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Click any theme to instantly update the live preview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("compare")}
                  className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 flex items-center gap-1"
                >
                  <EyeIcon size={13} />
                  <span>Compare All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {themes.map((theme) => {
                  const isSelected =
                    design.themeId === theme.id &&
                    design.colors.primary.toLowerCase() ===
                      theme.colors.primary.toLowerCase();

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleSelectTheme(theme)}
                      className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                        isSelected
                          ? "border-cobalt-600 bg-cobalt-50/40 ring-2 ring-cobalt-500/20 shadow-xs"
                          : "border-black/[0.08] hover:border-black/20 hover:bg-surface-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full mb-2">
                        <span className="text-xs font-bold text-ink truncate">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-cobalt-600 text-white flex items-center justify-center text-[10px] shrink-0">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* 4-Color Swatch Pill */}
                      <div className="flex items-center gap-1.5 w-full">
                        <span
                          className="h-4 flex-1 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.colors.primary }}
                          title={`Primary: ${theme.colors.primary}`}
                        />
                        <span
                          className="h-4 flex-1 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.colors.secondary }}
                          title={`Secondary: ${theme.colors.secondary}`}
                        />
                        <span
                          className="h-4 flex-1 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.colors.accent }}
                          title={`Accent: ${theme.colors.accent}`}
                        />
                        <span
                          className="h-4 flex-1 rounded-sm border border-black/10"
                          style={{ backgroundColor: theme.colors.text }}
                          title={`Text: ${theme.colors.text}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Theme Switcher Card */}
              <div className="pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab("colors")}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    design.themeId === "custom"
                      ? "border-cobalt-600 bg-cobalt-50/40 ring-2 ring-cobalt-500/20"
                      : "border-dashed border-black/20 hover:border-black/30 hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-black/10 flex items-center justify-center text-ink-muted">
                      <SparklesIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Custom Brand Palette</p>
                      <p className="text-[11px] text-ink-muted">
                        Customize each HEX color manually with color pickers
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-cobalt-600">
                    Edit &rarr;
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR PICKERS & HEX INPUTS */}
          {activeTab === "colors" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Custom Brand Colors
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Pick colors or type exact HEX values. Updates the live preview immediately without page reload.
                </p>
              </div>

              <div className="space-y-3">
                {/* Primary Color */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={design.colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Primary Color</p>
                      <p className="text-[11px] text-ink-muted truncate">
                        Header, headlines, primary pills
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={design.colors.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    maxLength={7}
                    className="font-mono text-xs font-semibold text-ink uppercase w-24 px-2 py-1.5 rounded-md border border-black/15 bg-white text-center focus:outline-cobalt-600"
                  />
                </div>

                {/* Secondary Color */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={design.colors.secondary}
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Secondary Color</p>
                      <p className="text-[11px] text-ink-muted truncate">
                        Tagline, badges, supporting lines
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={design.colors.secondary}
                    onChange={(e) => handleColorChange("secondary", e.target.value)}
                    maxLength={7}
                    className="font-mono text-xs font-semibold text-ink uppercase w-24 px-2 py-1.5 rounded-md border border-black/15 bg-white text-center focus:outline-cobalt-600"
                  />
                </div>

                {/* Accent Color */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={design.colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Accent Color</p>
                      <p className="text-[11px] text-ink-muted truncate">
                        5 Stars, OR divider, gold frames
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={design.colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    maxLength={7}
                    className="font-mono text-xs font-semibold text-ink uppercase w-24 px-2 py-1.5 rounded-md border border-black/15 bg-white text-center focus:outline-cobalt-600"
                  />
                </div>

                {/* Background Color */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={design.colors.background}
                      onChange={(e) => handleColorChange("background", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Card Background</p>
                      <p className="text-[11px] text-ink-muted truncate">
                        Standee paper backdrop (usually #FFFFFF)
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={design.colors.background}
                    onChange={(e) => handleColorChange("background", e.target.value)}
                    maxLength={7}
                    className="font-mono text-xs font-semibold text-ink uppercase w-24 px-2 py-1.5 rounded-md border border-black/15 bg-white text-center focus:outline-cobalt-600"
                  />
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={design.colors.text}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-black/10 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">Text Color</p>
                      <p className="text-[11px] text-ink-muted truncate">
                        Body copy, QR modules, instructions
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={design.colors.text}
                    onChange={(e) => handleColorChange("text", e.target.value)}
                    maxLength={7}
                    className="font-mono text-xs font-semibold text-ink uppercase w-24 px-2 py-1.5 rounded-md border border-black/15 bg-white text-center focus:outline-cobalt-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT & BRANDING */}
          {activeTab === "content" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Branding &amp; Content Text
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Automatically populated with your business info. Edit freely below.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={design.businessName}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, businessName: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="e.g. FITZONE GYM"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Business Tagline
                  </label>
                  <input
                    type="text"
                    value={design.tagline}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, tagline: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="e.g. FITNESS • TRAINING • WELLNESS"
                  />
                </div>

                {/* Logo Upload or URL */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-ink-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface-subtle file:text-ink hover:file:bg-black/5"
                    />
                    {design.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setDesign((p) => ({ ...p, logoUrl: "" }))}
                        className="text-[11px] text-red-600 hover:underline shrink-0"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Leave blank to automatically use a luxury monogram badge with your initials.
                  </p>
                </div>

                {/* Pre-Headline */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Invitation Pre-Headline
                  </label>
                  <input
                    type="text"
                    value={design.headline}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, headline: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="LOVE OUR SERVICE?"
                  />
                </div>

                {/* Main Headline */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Main Headline
                  </label>
                  <input
                    type="text"
                    value={design.mainHeadline}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, mainHeadline: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="SHARE YOUR EXPERIENCE"
                  />
                </div>

                {/* Supporting Text */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Supporting Text
                  </label>
                  <textarea
                    rows={2}
                    value={design.supportingText}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, supportingText: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600 resize-none"
                    placeholder="Your honest feedback helps us improve and serve you better."
                  />
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={design.footerText}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, footerText: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="THANK YOU!"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRINT & DESTINATIONS */}
          {activeTab === "print" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Print Specs &amp; NFC Setup
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Configure printer margins, crop marks, and NFC programming.
                </p>
              </div>

              {/* Bleed & Crop Marks Toggles */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-xl border border-black/[0.08] bg-canvas cursor-pointer hover:bg-surface-subtle transition-colors">
                  <div>
                    <p className="text-xs font-bold text-ink">3mm Commercial Bleed</p>
                    <p className="text-[11px] text-ink-muted">
                      Adds 3mm bleed margin (111 × 154 mm) for print shops.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(design.bleedEnabled)}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, bleedEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-cobalt-600 focus:ring-cobalt-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-black/[0.08] bg-canvas cursor-pointer hover:bg-surface-subtle transition-colors">
                  <div>
                    <p className="text-xs font-bold text-ink">Printer Crop Marks</p>
                    <p className="text-[11px] text-ink-muted">
                      Displays professional corner cut lines on the exported PDF.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(design.cropMarks)}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, cropMarks: e.target.checked }))
                    }
                    className="h-4 w-4 rounded text-cobalt-600 focus:ring-cobalt-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Dynamic QR & NFC URL Destination Details */}
              <div className="space-y-3 pt-3 border-t border-black/[0.06]">
                {/* QR Destination */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-surface-subtle space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                      <QrCodeIcon size={14} className="text-cobalt-600" />
                      <span>Dynamic QR Destination</span>
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Auto-generated
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ink break-all select-all">
                    {qrTargetUrl}
                  </p>
                  <CopyButton value={qrTargetUrl} label="Copy QR URL" className="w-full text-xs" />
                </div>

                {/* NFC Destination */}
                <div className="p-3 rounded-xl border border-black/[0.08] bg-surface-subtle space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                      <NfcIcon size={14} className="text-cobalt-600" />
                      <span>NFC Tap Destination</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNfcModalOpen(true)}
                      className="text-[11px] font-semibold text-cobalt-600 hover:underline"
                    >
                      How to program &rarr;
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-ink break-all select-all">
                    {nfcTargetUrl}
                  </p>
                  <div className="flex items-center gap-2">
                    <CopyButton value={nfcTargetUrl} label="Copy NFC URL" className="flex-1 text-xs" />
                    <button
                      type="button"
                      onClick={() => setIsNfcModalOpen(true)}
                      className="px-3 py-1.5 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-semibold text-ink"
                    >
                      Guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Live A6 Standee Preview (Cols 7 on desktop)          */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-black/[0.09] shadow-xs">
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-black/[0.06]">
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "flat"
                    ? "bg-white text-ink shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Flat A6 Print
              </button>
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "3d"
                    ? "bg-white text-ink shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                3D Tabletop Mockup
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "compare"
                    ? "bg-white text-ink shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Compare Palettes
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-ink-muted">
                105 × 148 mm · 300 DPI
              </span>
            </div>
          </div>

          {/* VIEW MODE 1: FLAT A6 PRINT DESIGN (100% Vector Live Preview) */}
          {viewMode === "flat" && (
            <div className="rounded-card bg-surface-subtle border border-black/[0.09] p-4 sm:p-8 flex items-center justify-center min-h-[580px] shadow-panel overflow-hidden">
              <div className="w-full max-w-[430px] aspect-[105/148] rounded-xl overflow-hidden shadow-2xl border border-black/[0.08] bg-white transition-all">
                <StandeeArtwork
                  ref={svgRef}
                  design={design}
                  qrDataUrl={qrDataUrl}
                  publicUrl={qrTargetUrl}
                  nfcUrl={nfcTargetUrl}
                  showBleed={Boolean(design.bleedEnabled)}
                  showCropMarks={Boolean(design.cropMarks)}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE 2: 3D TABLETOP MOCKUP */}
          {viewMode === "3d" && (
            <div className="rounded-card bg-surface-subtle border border-black/[0.09] p-4 sm:p-8 flex items-center justify-center min-h-[580px] shadow-panel overflow-hidden">
              <div className="w-full">
                <Standee3DMockup
                  design={design}
                  qrDataUrl={qrDataUrl}
                  publicUrl={qrTargetUrl}
                  nfcUrl={nfcTargetUrl}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE 3: PALETTE COMPARISON */}
          {viewMode === "compare" && (
            <div className="rounded-card bg-surface-subtle border border-black/[0.09] p-5 shadow-panel">
              <StandeeThemeComparison
                themes={themes}
                currentDesign={design}
                qrDataUrl={qrDataUrl}
                publicUrl={qrTargetUrl}
                nfcUrl={nfcTargetUrl}
                onSelectTheme={handleSelectTheme}
              />
            </div>
          )}

          {/* Hidden reference SVG for offscreen canvas export when in 3D or compare view */}
          <div className="sr-only" aria-hidden="true">
            <StandeeArtwork
              ref={svgRef}
              design={design}
              qrDataUrl={qrDataUrl}
              publicUrl={qrTargetUrl}
              nfcUrl={nfcTargetUrl}
              showBleed={Boolean(design.bleedEnabled)}
              showCropMarks={Boolean(design.cropMarks)}
            />
          </div>
        </div>
      </div>

      {/* NFC Activation Instructions Modal */}
      <StandeeNfcModal
        isOpen={isNfcModalOpen}
        onClose={() => setIsNfcModalOpen(false)}
        nfcUrl={nfcTargetUrl}
        businessName={business.name}
      />
    </div>
  );
}

