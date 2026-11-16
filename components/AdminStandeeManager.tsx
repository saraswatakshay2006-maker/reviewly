"use client";

import React, { useState } from "react";
import type { Business, StandeeDesign, StandeeTheme } from "@/lib/types";
import { StandeeArtwork } from "./StandeeArtwork";
import {
  CheckIcon,
  CloseIcon,
  EyeIcon,
  PlusIcon,
  RefreshIcon,
  SparklesIcon,
} from "./Icons";

export interface AdminStandeeManagerProps {
  initialThemes: StandeeTheme[];
  designs: StandeeDesign[];
  businesses: { id: string; name: string; publicSlug: string; organizationName: string }[];
  onRefresh?: () => void;
}

export default function AdminStandeeManager({
  initialThemes,
  designs,
  businesses,
  onRefresh,
}: AdminStandeeManagerProps) {
  const [themes, setThemes] = useState<StandeeTheme[]>(initialThemes);
  const [previewTheme, setPreviewTheme] = useState<StandeeTheme | null>(null);
  const [editingTheme, setEditingTheme] = useState<StandeeTheme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // New Theme Form State
  const [newTheme, setNewTheme] = useState({
    name: "",
    description: "",
    primary: "#0D2C54",
    secondary: "#1B4965",
    accent: "#EAA221",
    background: "#FFFFFF",
    text: "#1A1A1A",
  });

  const showToast = (type: "ok" | "err", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Toggle Theme Enabled/Disabled
  const handleToggle = async (theme: StandeeTheme) => {
    setLoadingId(theme.id);
    try {
      const res = await fetch(`/api/admin/standee/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_enabled",
          isEnabled: !theme.isEnabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle theme");
      setThemes((prev) =>
        prev.map((t) =>
          t.id === theme.id ? { ...t, isEnabled: !t.isEnabled } : t
        )
      );
      showToast("ok", `Theme "${theme.name}" ${!theme.isEnabled ? "enabled" : "disabled"}`);
      onRefresh?.();
    } catch (err) {
      showToast("err", (err as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  // Set Default Theme
  const handleSetDefault = async (theme: StandeeTheme) => {
    setLoadingId(theme.id);
    try {
      const res = await fetch(`/api/admin/standee/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_default" }),
      });
      if (!res.ok) throw new Error("Failed to set default theme");
      setThemes((prev) =>
        prev.map((t) => ({ ...t, isDefault: t.id === theme.id }))
      );
      showToast("ok", `"${theme.name}" set as platform default theme`);
      onRefresh?.();
    } catch (err) {
      showToast("err", (err as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  // Delete Custom Theme
  const handleDeleteTheme = async (theme: StandeeTheme) => {
    if (theme.isPreset) {
      alert("Official preset themes cannot be deleted.");
      return;
    }
    if (!confirm(`Delete custom palette "${theme.name}"?`)) return;

    setLoadingId(theme.id);
    try {
      const res = await fetch(`/api/admin/standee/themes/${theme.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete theme");
      setThemes((prev) => prev.filter((t) => t.id !== theme.id));
      showToast("ok", `Palette "${theme.name}" deleted`);
      onRefresh?.();
    } catch (err) {
      showToast("err", (err as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  // Save New or Edited Palette
  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingTheme
      ? {
          id: editingTheme.id,
          name: editingTheme.name.trim(),
          description: editingTheme.description?.trim(),
          colors: editingTheme.colors,
        }
      : {
          name: newTheme.name.trim(),
          description: newTheme.description?.trim(),
          colors: {
            primary: newTheme.primary,
            secondary: newTheme.secondary,
            accent: newTheme.accent,
            background: newTheme.background,
            text: newTheme.text,
          },
        };

    if (!payload.name) {
      alert("Please enter a theme name");
      return;
    }

    try {
      const res = await fetch("/api/admin/standee/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      const saved = await res.json();
      if (editingTheme) {
        setThemes((prev) => prev.map((t) => (t.id === saved.theme.id ? saved.theme : t)));
        setEditingTheme(null);
        showToast("ok", "Palette updated successfully");
      } else {
        setThemes((prev) => [...prev, saved.theme]);
        setIsCreating(false);
        setNewTheme({
          name: "",
          description: "",
          primary: "#0D2C54",
          secondary: "#1B4965",
          accent: "#EAA221",
          background: "#FFFFFF",
          text: "#1A1A1A",
        });
        showToast("ok", "New palette created");
      }
      onRefresh?.();
    } catch (err) {
      showToast("err", (err as Error).message);
    }
  };

  // Map business designs
  const bizMap = new Map(businesses.map((b) => [b.id, b]));

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold ${
            statusMsg.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.08]">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            A6 Standee Templates &amp; Color Palettes
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage available tabletop standee color themes, configure defaults, and inspect business-wise generated standees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setEditingTheme(null);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusIcon size={14} />
          <span>Add New Palette</span>
        </button>
      </div>

      {/* PALETTES TABLE / GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const isDefault = theme.isDefault;
          const isEnabled = theme.isEnabled;

          return (
            <div
              key={theme.id}
              className={`rounded-2xl border p-4 bg-white transition-all shadow-xs flex flex-col justify-between ${
                isDefault
                  ? "border-cobalt-500 ring-2 ring-cobalt-500/20"
                  : isEnabled
                  ? "border-black/[0.09]"
                  : "border-black/[0.06] bg-surface-subtle opacity-75"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-ink truncate">
                        {theme.name}
                      </h3>
                      {theme.isPreset && (
                        <span className="text-[10px] font-semibold text-ink-muted bg-surface-subtle px-1.5 py-0.2 rounded border border-black/10">
                          Preset
                        </span>
                      )}
                      {isDefault && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Platform Default
                        </span>
                      )}
                    </div>
                    {theme.description && (
                      <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">
                        {theme.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface-subtle text-ink-muted"
                    }`}
                  >
                    {isEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Color Swatch Bars */}
                <div className="grid grid-cols-5 gap-1.5 my-3">
                  <div className="text-center">
                    <div
                      className="h-8 rounded-md border border-black/10 shadow-xs mb-1"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span className="font-mono text-[9px] text-ink-muted block truncate">
                      {theme.colors.primary}
                    </span>
                    <span className="text-[8px] text-ink-muted block uppercase">Pri</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-8 rounded-md border border-black/10 shadow-xs mb-1"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <span className="font-mono text-[9px] text-ink-muted block truncate">
                      {theme.colors.secondary}
                    </span>
                    <span className="text-[8px] text-ink-muted block uppercase">Sec</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-8 rounded-md border border-black/10 shadow-xs mb-1"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <span className="font-mono text-[9px] text-ink-muted block truncate">
                      {theme.colors.accent}
                    </span>
                    <span className="text-[8px] text-ink-muted block uppercase">Acc</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-8 rounded-md border border-black/10 shadow-xs mb-1"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <span className="font-mono text-[9px] text-ink-muted block truncate">
                      {theme.colors.background}
                    </span>
                    <span className="text-[8px] text-ink-muted block uppercase">Bg</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-8 rounded-md border border-black/10 shadow-xs mb-1"
                      style={{ backgroundColor: theme.colors.text }}
                    />
                    <span className="font-mono text-[9px] text-ink-muted block truncate">
                      {theme.colors.text}
                    </span>
                    <span className="text-[8px] text-ink-muted block uppercase">Txt</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme(theme)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle text-[11px] font-semibold text-ink"
                  >
                    <EyeIcon size={12} />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTheme(theme);
                      setIsCreating(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle text-[11px] font-semibold text-ink"
                  >
                    Edit HEX
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isDefault && isEnabled && (
                    <button
                      type="button"
                      disabled={loadingId === theme.id}
                      onClick={() => handleSetDefault(theme)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-cobalt-600 hover:bg-cobalt-50"
                    >
                      Make Default
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={loadingId === theme.id || isDefault}
                    onClick={() => handleToggle(theme)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold ${
                      isEnabled
                        ? "text-amber-700 hover:bg-amber-50"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {isEnabled ? "Disable" : "Enable"}
                  </button>

                  {!theme.isPreset && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTheme(theme)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PALETTE MODAL */}
      {(isCreating || editingTheme) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-black/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
              <h3 className="font-display text-base font-bold text-ink">
                {editingTheme ? `Edit Palette: ${editingTheme.name}` : "Create New Color Palette"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTheme(null);
                }}
                className="p-1 rounded text-ink-muted hover:text-ink"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTheme} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Palette Name
                </label>
                <input
                  type="text"
                  required
                  value={editingTheme ? editingTheme.name : newTheme.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingTheme) setEditingTheme({ ...editingTheme, name: val });
                    else setNewTheme({ ...newTheme, name: val });
                  }}
                  placeholder="e.g. Emerald & Champagne"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-black/15 bg-white font-medium text-ink focus:outline-cobalt-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingTheme ? editingTheme.description || "" : newTheme.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingTheme) setEditingTheme({ ...editingTheme, description: val });
                    else setNewTheme({ ...newTheme, description: val });
                  }}
                  placeholder="Short theme summary"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-black/15 bg-white font-medium text-ink focus:outline-cobalt-600"
                />
              </div>

              {/* Color Fields */}
              <div className="space-y-2 pt-1">
                {(["primary", "secondary", "accent", "background", "text"] as const).map(
                  (colKey) => {
                    const currentVal = editingTheme
                      ? editingTheme.colors[colKey]
                      : newTheme[colKey];

                    return (
                      <div
                        key={colKey}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg border border-black/[0.08] bg-canvas"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (editingTheme) {
                                setEditingTheme({
                                  ...editingTheme,
                                  colors: { ...editingTheme.colors, [colKey]: val },
                                });
                              } else {
                                setNewTheme({ ...newTheme, [colKey]: val });
                              }
                            }}
                            className="w-7 h-7 rounded border border-black/10 cursor-pointer p-0.5 bg-white"
                          />
                          <span className="text-xs font-semibold text-ink capitalize">
                            {colKey}
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={7}
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (editingTheme) {
                              setEditingTheme({
                                ...editingTheme,
                                colors: { ...editingTheme.colors, [colKey]: val },
                              });
                            } else {
                              setNewTheme({ ...newTheme, [colKey]: val });
                            }
                          }}
                          className="font-mono text-xs font-semibold text-ink uppercase w-20 px-1.5 py-1 rounded border border-black/15 text-center bg-white"
                        />
                      </div>
                    );
                  }
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTheme(null);
                  }}
                  className="px-4 py-2 rounded-control border border-black/10 bg-white hover:bg-surface-subtle text-xs font-medium text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-control bg-cobalt-600 hover:bg-cobalt-700 text-xs font-semibold text-white shadow-xs"
                >
                  Save Palette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAND PREVIEW MODAL */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-black/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Preview: {previewTheme.name}
                </h3>
                <p className="text-xs text-ink-muted">A6 Tabletop Standee (105 × 148 mm)</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="p-1 rounded text-ink-muted hover:text-ink"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="w-full max-w-[340px] mx-auto aspect-[105/148] rounded-xl overflow-hidden shadow-xl border border-black/10">
              <StandeeArtwork
                design={{
                  id: "preview",
                  businessId: "preview",
                  organizationId: "preview",
                  themeId: previewTheme.id,
                  colors: { ...previewTheme.colors },
                  businessName: "SAMPLE BUSINESS",
                  tagline: "LUXURY • SERVICE • EXCELLENCE",
                  logoUrl: "",
                  headline: "LOVE OUR SERVICE?",
                  mainHeadline: "SHARE YOUR EXPERIENCE",
                  supportingText: "Your honest feedback helps us improve and serve you better.",
                  footerText: "THANK YOU!",
                  qrScanLabel: "SCAN",
                  qrScanInstruction: "Scan the QR code with your phone",
                  nfcTapLabel: "TAP",
                  nfcTapInstruction: "Tap your NFC-enabled phone here",
                  benefit1: "Share Your Experience",
                  benefit2: "Help Us Improve",
                  benefit3: "Support Our Growth",
                  createdAt: "",
                  updatedAt: "",
                }}
                qrDataUrl=""
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="px-4 py-2 rounded-control bg-cobalt-600 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESSES CUSTOMIZED STANDEES LIST */}
      <div className="rounded-card bg-white border border-black/[0.09] p-5 space-y-3 shadow-sm">
        <h3 className="font-display text-sm font-bold text-ink">
          Business Standees Generated Across Workspaces ({designs.length})
        </h3>
        {designs.length === 0 ? (
          <p className="text-xs text-ink-muted py-2">
            No businesses have customized standees yet. Each business uses the platform default theme until customized.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {designs.map((d) => {
              const biz = bizMap.get(d.businessId);
              return (
                <div key={d.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">
                      {d.businessName || biz?.name || d.businessId}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      Workspace: {biz?.organizationName || "Unknown"} · Theme: {d.themeId}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: d.colors.primary }}
                      title={`Primary: ${d.colors.primary}`}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: d.colors.accent }}
                      title={`Accent: ${d.colors.accent}`}
                    />
                    <span className="text-[11px] text-ink-muted font-mono ml-1">
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
