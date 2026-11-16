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
  exportTwoUpA4Pdf,
  exportTwoUpA4Png,
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
import { ALL_LOGO_EMBLEMS, inferEmblemType, type LogoEmblemType } from "./BusinessLogoEmblems";

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
  const [viewMode, setViewMode] = useState<"flat" | "3d" | "a4" | "compare">("flat");
  const [activeTab, setActiveTab] = useState<"theme" | "logo" | "colors" | "content" | "print">("theme");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<
    "pdf" | "png" | "svg" | "a4-pdf" | "a4-png" | null
  >(null);
  const [emblemCategory, setEmblemCategory] = useState<string>("All");
  const [emblemSearch, setEmblemSearch] = useState<string>("");

  const activeEmblemId =
    design.emblemType ||
    inferEmblemType(design.tagline, design.businessName);
  const currentEmblem =
    ALL_LOGO_EMBLEMS.find((e) => e.id === activeEmblemId) ||
    ALL_LOGO_EMBLEMS[0];

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

  // 2-Up A4 PDF Export (2x A6 Side-by-Side at top of A4 sheet at 600 DPI Ultra-HD)
  const handleDownloadTwoUpA4Pdf = async () => {
    if (!svgRef.current) return;
    setIsExporting("a4-pdf");
    try {
      await exportTwoUpA4Pdf(
        svgRef.current,
        design,
        `${business.publicSlug}-2up-a4-standees`,
        {
          bleed: design.bleedEnabled,
          cropMarks: design.cropMarks,
        }
      );
    } catch (err) {
      alert(`2-Up A4 PDF export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(null);
    }
  };

  // 2-Up A4 PNG Export (2x A6 Side-by-Side at top of A4 sheet at 300 DPI Ultra-HD)
  const handleDownloadTwoUpA4Png = async () => {
    if (!svgRef.current) return;
    setIsExporting("a4-png");
    try {
      await exportTwoUpA4Png(
        svgRef.current,
        `${business.publicSlug}-2up-a4-standees-300dpi`,
        { bleed: design.bleedEnabled }
      );
    } catch (err) {
      alert(`2-Up A4 PNG export failed: ${(err as Error).message}`);
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

          {/* Download 2-Up A4 PDF (2x A6 Side-by-Side at top of A4) */}
          <button
            type="button"
            onClick={handleDownloadTwoUpA4Pdf}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            title="Export 2x A6 standees side-by-side at the top of a single A4 sheet at 600 DPI press quality"
          >
            {isExporting === "a4-pdf" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <PrinterIcon size={14} />
            )}
            <span>{isExporting === "a4-pdf" ? "Building A4…" : "2-Up A4 PDF"}</span>
            <span className="ml-0.5 rounded bg-white/20 px-1 py-0.2 text-[10px] font-bold">
              2x A6
            </span>
          </button>

          {/* Download Single A6 PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control bg-ink hover:bg-black text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Export single A6 PDF (105 × 148 mm)"
          >
            {isExporting === "pdf" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <PrinterIcon size={14} />
            )}
            <span>{isExporting === "pdf" ? "PDF…" : "A6 PDF"}</span>
          </button>

          {/* 2-Up A4 PNG Button */}
          <button
            type="button"
            onClick={handleDownloadTwoUpA4Png}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink transition-colors disabled:opacity-50"
            title="Download 2-Up A4 sheet as 300 DPI high-res PNG"
          >
            {isExporting === "a4-png" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <DownloadIcon size={14} />
            )}
            <span>2-Up A4 PNG</span>
          </button>

          {/* High-Res Single PNG Button */}
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink transition-colors disabled:opacity-50"
            title="Download single A6 PNG (300 DPI)"
          >
            {isExporting === "png" ? (
              <RefreshIcon size={14} className="animate-spin" />
            ) : (
              <DownloadIcon size={14} />
            )}
            <span>A6 PNG</span>
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
          <div className="flex rounded-xl bg-surface-subtle p-1 border border-black/[0.08] overflow-x-auto gap-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`flex-1 min-w-[65px] py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "theme"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Themes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("logo")}
              className={`flex-1 min-w-[95px] py-2 px-1 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === "logo"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <span>{design.logoUrl ? "🖼️" : currentEmblem?.icon || "🏷️"}</span>
              <span>Logo &amp; Emblem</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("colors")}
              className={`flex-1 min-w-[65px] py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "colors"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Colors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("content")}
              className={`flex-1 min-w-[65px] py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "content"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("print")}
              className={`flex-1 min-w-[65px] py-2 px-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "print"
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Print
            </button>
          </div>

          {/* TAB 1: PRESET THEMES (7 Presets + Custom) */}
          {activeTab === "theme" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              {/* Active Brand Identity Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-black/[0.08] bg-surface-subtle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-black/10 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {design.logoUrl ? "🖼️" : currentEmblem?.icon || "👑"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">
                      {design.logoUrl ? "Custom Logo Active" : (currentEmblem?.label || "Brand Vector Emblem")}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      Renders in header wave &amp; QR code center
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("logo")}
                  className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 bg-white px-2.5 py-1.5 rounded-lg border border-black/10 shadow-xs shrink-0"
                >
                  Change Logo &rarr;
                </button>
              </div>

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

          {/* TAB 2: LOGO & BRAND EMBLEM */}
          {activeTab === "logo" && (
            <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Business Logo &amp; Brand Emblem
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Appears in the prominent top wave banner and the high-contrast QR code center badge.
                </p>
              </div>

              {/* Active Selection Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-black/[0.08] bg-surface-subtle">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    {design.logoUrl ? "🖼️" : currentEmblem?.icon || "👑"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">
                      {design.logoUrl ? "Custom Image Logo Active" : `${currentEmblem?.label || "Brand Vector Emblem"} Active`}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {design.logoUrl ? "Uploaded brand image file" : (currentEmblem?.desc || "High-definition vector emblem")}
                    </p>
                  </div>
                </div>
                {design.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setDesign((p) => ({ ...p, logoUrl: "" }))}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 bg-white px-2.5 py-1.5 rounded-lg border border-red-200 shadow-2xs shrink-0"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              {/* Upload Custom Logo Section */}
              <div className="p-3.5 rounded-xl border border-black/[0.08] bg-canvas space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink">
                    Upload Custom Image Logo
                  </label>
                  <span className="text-[10px] text-ink-muted">PNG, JPG, or SVG (max 2MB)</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs text-ink-secondary file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-ink file:shadow-2xs hover:file:bg-surface-subtle"
                  />
                  {design.logoUrl && (
                    <span className="text-[11px] text-emerald-600 font-bold shrink-0">
                      ✓ Image Loaded
                    </span>
                  )}
                </div>
              </div>

              {/* Or Choose From 28 Vector Emblems */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink">
                    Or Select Vector Brand Emblem
                  </label>
                  <span className="text-[10px] text-ink-muted">
                    {ALL_LOGO_EMBLEMS.length} professional emblems
                  </span>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {[
                    "All",
                    "Universal Monograms",
                    "Wellness & Health",
                    "Food & Hospitality",
                    "Services & Retail",
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEmblemCategory(cat)}
                      className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                        emblemCategory === cat
                          ? "bg-cobalt-600 text-white font-semibold shadow-2xs"
                          : "bg-surface-subtle text-ink-secondary hover:bg-black/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div>
                  <input
                    type="text"
                    value={emblemSearch}
                    onChange={(e) => setEmblemSearch(e.target.value)}
                    placeholder="Search industry emblems (e.g. cafe, dental, legal, crest, gym)..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-black/15 bg-white text-ink placeholder:text-ink-muted focus:outline-cobalt-600"
                  />
                </div>

                {/* Emblems Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {ALL_LOGO_EMBLEMS.filter((e) => {
                    const matchesCat =
                      emblemCategory === "All" || e.category === emblemCategory;
                    const q = emblemSearch.trim().toLowerCase();
                    const matchesSearch =
                      !q ||
                      e.label.toLowerCase().includes(q) ||
                      e.desc.toLowerCase().includes(q) ||
                      e.id.toLowerCase().includes(q);
                    return matchesCat && matchesSearch;
                  }).map((emblem) => {
                    const isSelected =
                      activeEmblemId === emblem.id && !design.logoUrl;

                    return (
                      <button
                        key={emblem.id}
                        type="button"
                        onClick={() =>
                          setDesign((p) => ({
                            ...p,
                            emblemType: emblem.id,
                            logoUrl: "",
                          }))
                        }
                        className={`text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-cobalt-600 bg-cobalt-50/80 text-cobalt-950 ring-2 ring-cobalt-600/25 font-semibold shadow-xs"
                            : "border-black/[0.08] bg-white hover:bg-surface-subtle text-ink"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0">{emblem.icon}</span>
                            <span className="text-xs truncate">{emblem.label}</span>
                          </div>
                          {isSelected && (
                            <span className="h-4 w-4 rounded-full bg-cobalt-600 text-white flex items-center justify-center text-[10px] shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-muted mt-1 truncate">
                          {emblem.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM COLOR PICKERS & HEX INPUTS */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-ink">
                      Business Tagline
                    </label>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Hidden on A6 Print
                    </span>
                  </div>
                  <input
                    type="text"
                    value={design.tagline}
                    onChange={(e) =>
                      setDesign((p) => ({ ...p, tagline: e.target.value }))
                    }
                    className="w-full text-xs font-medium text-ink px-3 py-2 rounded-lg border border-black/15 bg-white focus:outline-cobalt-600"
                    placeholder="e.g. FITNESS • TRAINING • WELLNESS"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">
                    Retained for digital business records; omitted from the physical A6 print for maximum brand cleanliness and large typography.
                  </p>
                </div>

                {/* Brand Logo & Emblem Shortcut */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-black/[0.08] bg-canvas">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-black/10 flex items-center justify-center text-lg shrink-0">
                      {design.logoUrl ? "🖼️" : currentEmblem?.icon || "👑"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {design.logoUrl ? "Custom Logo Active" : (currentEmblem?.label || "Brand Vector Emblem")}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">
                        Top wave header &amp; QR center badge
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("logo")}
                    className="text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 bg-white px-2.5 py-1.5 rounded-lg border border-black/10 shadow-xs shrink-0"
                  >
                    Edit Logo &rarr;
                  </button>
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

              {/* 2-Up A4 Sheet Print Feature Box */}
              <div className="p-4 rounded-xl border border-cobalt-200 bg-cobalt-50/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cobalt-600 text-white shrink-0">
                      <PrinterIcon size={16} />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-ink">
                        2-Up A4 Sheet Print (Side-by-Side)
                      </h3>
                      <p className="text-[11px] text-ink-muted">
                        Prints 2x A6 standees across the top of an A4 sheet (210 × 148 mm).
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cobalt-700 bg-cobalt-100 px-2 py-0.5 rounded-full border border-cobalt-200 shrink-0">
                    600 DPI Ultra-HD
                  </span>
                </div>

                <div className="text-[11px] text-ink-secondary space-y-1 bg-white p-2.5 rounded-lg border border-cobalt-100">
                  <p className="font-semibold text-ink flex items-center gap-1">
                    <span>✂️</span>
                    <span>Ready-to-Cut Commercial Guidelines:</span>
                  </p>
                  <p>• Dashed vertical cut line down the center (105 mm)</p>
                  <p>• Dashed horizontal cut line across the page (148 mm)</p>
                  <p>• Bottom half is 100% clean blank paper — reuse it in your printer or for notes</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadTwoUpA4Pdf}
                    disabled={isExporting !== null}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {isExporting === "a4-pdf" ? (
                      <RefreshIcon size={14} className="animate-spin" />
                    ) : (
                      <PrinterIcon size={14} />
                    )}
                    <span>{isExporting === "a4-pdf" ? "Exporting…" : "Download 2-Up A4 PDF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTwoUpA4Png}
                    disabled={isExporting !== null}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-control border border-cobalt-300 bg-white hover:bg-cobalt-50 text-xs font-semibold text-cobalt-800 transition-colors disabled:opacity-50"
                  >
                    {isExporting === "a4-png" ? (
                      <RefreshIcon size={14} className="animate-spin" />
                    ) : (
                      <DownloadIcon size={14} />
                    )}
                    <span>A4 PNG</span>
                  </button>
                </div>
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
                onClick={() => setViewMode("a4")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "a4"
                    ? "bg-white text-ink shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                📄 2-Up A4 Sheet
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

          {/* VIEW MODE 3: 2-UP A4 SHEET PREVIEW (2x Side-by-Side Standees at Top) */}
          {viewMode === "a4" && (
            <div className="rounded-card bg-surface-subtle border border-black/[0.09] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[580px] shadow-panel overflow-hidden">
              {/* Floating Sheet Controls */}
              <div className="w-full max-w-[560px] flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span>📄</span>
                  <span>A4 Sheet (210 × 297 mm) · 2x Standees at Top</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadTwoUpA4Pdf}
                    disabled={isExporting !== null}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cobalt-600 hover:bg-cobalt-700 text-white text-[11px] font-bold shadow-2xs"
                  >
                    <PrinterIcon size={12} />
                    <span>Download A4 PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTwoUpA4Png}
                    disabled={isExporting !== null}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-black/15 bg-white hover:bg-surface-subtle text-ink text-[11px] font-semibold shadow-2xs"
                  >
                    <DownloadIcon size={12} />
                    <span>A4 PNG</span>
                  </button>
                </div>
              </div>

              {/* Realistic A4 White Paper Container */}
              <div className="w-full max-w-[560px] aspect-[210/297] rounded-lg shadow-2xl border border-black/10 bg-white p-3 flex flex-col justify-between relative overflow-hidden select-none">
                {/* Top Half: 2 A6 Standees Side by Side */}
                <div className="relative w-full aspect-[210/148] flex border border-black/10 rounded-sm overflow-hidden bg-white shadow-xs">
                  {/* Standee 1 (Left: 0 to 105 mm) */}
                  <div className="w-1/2 h-full border-r border-dashed border-slate-400 relative">
                    <StandeeArtwork
                      design={design}
                      qrDataUrl={qrDataUrl}
                      publicUrl={qrTargetUrl}
                      nfcUrl={nfcTargetUrl}
                      showBleed={false}
                      showCropMarks={false}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                      Standee #1
                    </div>
                  </div>

                  {/* Standee 2 (Right: 105 to 210 mm) */}
                  <div className="w-1/2 h-full relative">
                    <StandeeArtwork
                      design={design}
                      qrDataUrl={qrDataUrl}
                      publicUrl={qrTargetUrl}
                      nfcUrl={nfcTargetUrl}
                      showBleed={false}
                      showCropMarks={false}
                    />
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                      Standee #2
                    </div>
                  </div>

                  {/* Center Vertical Cut Guide Badge */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-between items-center pointer-events-none py-1">
                    <span className="bg-slate-800 text-white text-[8px] font-bold px-1 rounded shadow-xs">
                      ✂ 105 mm
                    </span>
                    <span className="bg-slate-800 text-white text-[8px] font-bold px-1 rounded shadow-xs">
                      ✂ CUT
                    </span>
                  </div>
                </div>

                {/* Horizontal Cut Guideline Bar */}
                <div className="my-1.5 flex items-center gap-2 text-slate-500 text-[10px] font-semibold">
                  <span className="shrink-0">✂ CUT LINE (148 mm Trim)</span>
                  <div className="flex-1 border-t-2 border-dashed border-slate-400" />
                  <span className="shrink-0">✂</span>
                </div>

                {/* Bottom Half: 100% Clean Blank Paper (Reusable - Zero Ink Printed) */}
                <div className="flex-1 rounded-md border-2 border-dashed border-slate-200 bg-white p-4 flex flex-col items-center justify-center text-center select-none">
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <span className="text-xl">📄</span>
                    <span className="text-[11px] font-bold text-slate-600">
                      Clean Blank Paper (210 × 149 mm · A5)
                    </span>
                    <p className="text-[10px] text-slate-400 max-w-[320px] leading-tight">
                      No ink is printed here. Once trimmed along the cut line, reload this pristine blank half back into your printer or reuse it for notes.
                    </p>
                  </div>
                </div>
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

