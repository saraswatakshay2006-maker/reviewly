"use client";

import React from "react";
import { StandeeArtwork } from "./StandeeArtwork";
import type { StandeeDesign, StandeeTheme } from "@/lib/types";

export interface StandeeThemeComparisonProps {
  themes: StandeeTheme[];
  currentDesign: StandeeDesign;
  qrDataUrl: string;
  publicUrl?: string;
  nfcUrl?: string;
  onSelectTheme: (theme: StandeeTheme) => void;
}

export default function StandeeThemeComparison({
  themes,
  currentDesign,
  qrDataUrl,
  publicUrl,
  nfcUrl,
  onSelectTheme,
}: StandeeThemeComparisonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            Theme Palette Comparison
          </h3>
          <p className="text-xs text-ink-muted">
            Preview your business standee across all professionally curated color themes. Click any theme to apply it instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {themes.map((theme) => {
          const isSelected =
            currentDesign.themeId === theme.id &&
            currentDesign.colors.primary.toLowerCase() ===
              theme.colors.primary.toLowerCase();

          // Transient design for comparison tile
          const comparisonDesign: StandeeDesign = {
            ...currentDesign,
            themeId: theme.id,
            colors: { ...theme.colors },
          };

          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`group relative rounded-xl border p-3 cursor-pointer transition-all duration-200 bg-white hover:shadow-lg ${
                isSelected
                  ? "border-cobalt-600 ring-2 ring-cobalt-500/20 shadow-md"
                  : "border-black/[0.08] hover:border-black/20"
              }`}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink truncate">
                  {theme.name}
                </span>
                {isSelected ? (
                  <span className="rounded bg-cobalt-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-ink-muted group-hover:text-cobalt-600">
                    Apply &rarr;
                  </span>
                )}
              </div>

              {/* Color Swatch Dots */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: theme.colors.primary }}
                  title={`Primary: ${theme.colors.primary}`}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title={`Secondary: ${theme.colors.secondary}`}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: theme.colors.accent }}
                  title={`Accent: ${theme.colors.accent}`}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: theme.colors.text }}
                  title={`Text: ${theme.colors.text}`}
                />
              </div>

              {/* Scaled-down Live Artwork Preview */}
              <div className="w-full aspect-[105/148] rounded-lg overflow-hidden border border-black/[0.06] bg-canvas shadow-xs group-hover:shadow-md transition-shadow">
                <StandeeArtwork
                  design={comparisonDesign}
                  qrDataUrl={qrDataUrl}
                  publicUrl={publicUrl}
                  nfcUrl={nfcUrl}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
