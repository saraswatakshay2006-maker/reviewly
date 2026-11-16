"use client";

import React, { useState } from "react";
import { StandeeArtwork } from "./StandeeArtwork";
import type { StandeeDesign } from "@/lib/types";

export interface Standee3DMockupProps {
  design: StandeeDesign;
  qrDataUrl: string;
  publicUrl?: string;
  nfcUrl?: string;
}

export default function Standee3DMockup({
  design,
  qrDataUrl,
  publicUrl,
  nfcUrl,
}: Standee3DMockupProps) {
  const [rotY, setRotY] = useState(-8);
  const [rotX, setRotX] = useState(6);
  const [acrylicBase, setAcrylicBase] = useState<"clear" | "wood" | "black">("clear");

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* 3D Perspective Scene */}
      <div
        className="relative w-full max-w-[420px] aspect-[105/148] flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        {/* Soft Tabletop Ambient Shadow */}
        <div
          className="absolute -bottom-8 w-[88%] h-12 rounded-[50%] blur-xl opacity-60 transition-all duration-300 pointer-events-none"
          style={{
            background:
              acrylicBase === "wood"
                ? "radial-gradient(ellipse at center, rgba(80,45,20,0.6) 0%, rgba(0,0,0,0) 70%)"
                : "radial-gradient(ellipse at center, rgba(15,23,42,0.5) 0%, rgba(0,0,0,0) 70%)",
            transform: `translate(${rotY * 1.5}px, 0px) scale(${1 + Math.abs(rotY) * 0.01})`,
          }}
        />

        {/* Realistic Tabletop Surface Reflection Plane */}
        <div
          className="absolute -bottom-5 w-[85%] h-6 rounded-full blur-md opacity-30 pointer-events-none"
          style={{
            backgroundColor: design.colors.primary,
            transform: `translate(${rotY * 1.2}px, 0px)`,
          }}
        />

        {/* The 3D Acrylic Standee Container */}
        <div
          className="relative w-full h-full rounded-2xl transition-transform duration-200 ease-out will-change-transform shadow-2xl"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(0.5deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Acrylic Glass Bevel / Clear Edge Border (Outer Protective Casing) */}
          <div
            className="absolute -inset-2.5 rounded-[22px] pointer-events-none border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-[0.5px]"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 35%, rgba(0,0,0,0.04) 70%, rgba(255,255,255,0.3) 100%)",
              boxShadow:
                "inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.1), 0 25px 40px -10px rgba(0,0,0,0.35)",
            }}
          />

          {/* The Inner Print Artwork */}
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-inner">
            <StandeeArtwork
              design={design}
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
              nfcUrl={nfcUrl}
            />

            {/* Specular Diagonal Glass Glare Reflection */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-80"
              style={{
                background:
                  "linear-gradient(125deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.25) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.35) 100%)",
              }}
            />

            {/* Secondary Realistic Highlight Edge */}
            <div
              className="absolute top-0 right-0 w-1/3 h-full pointer-events-none opacity-20"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)",
              }}
            />
          </div>

          {/* Tabletop Stand Base (Clear Acrylic, Mahogany Wood, or Matte Black) */}
          <div
            className="absolute -bottom-6 -left-3 -right-3 h-8 rounded-lg shadow-xl flex items-center justify-center transition-all duration-300"
            style={{
              transform: "translateZ(12px)",
              background:
                acrylicBase === "wood"
                  ? "linear-gradient(180deg, #8B5A2B 0%, #5C3A1E 60%, #3D2314 100%)"
                  : acrylicBase === "black"
                  ? "linear-gradient(180deg, #334155 0%, #1E293B 60%, #0F172A 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(235,240,248,0.7) 45%, rgba(200,215,230,0.85) 100%)",
              border:
                acrylicBase === "clear"
                  ? "1px solid rgba(255,255,255,0.9)"
                  : "1px solid rgba(0,0,0,0.3)",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.6)",
            }}
          >
            {/* Base Slot Line */}
            <div
              className="w-4/5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  acrylicBase === "clear"
                    ? "rgba(100,116,139,0.35)"
                    : "rgba(0,0,0,0.4)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3D Mockup Controls */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs">
        {/* Base Style Toggles */}
        <div className="inline-flex rounded-lg border border-black/10 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setAcrylicBase("clear")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              acrylicBase === "clear"
                ? "bg-cobalt-600 text-white shadow-xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Clear Acrylic
          </button>
          <button
            type="button"
            onClick={() => setAcrylicBase("wood")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              acrylicBase === "wood"
                ? "bg-cobalt-600 text-white shadow-xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Mahogany Wood
          </button>
          <button
            type="button"
            onClick={() => setAcrylicBase("black")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              acrylicBase === "black"
                ? "bg-cobalt-600 text-white shadow-xs"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            Matte Noir
          </button>
        </div>

        {/* Angle Reset / Quick Rotate */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRotY(-14);
              setRotX(8);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle font-medium text-ink transition-colors"
          >
            Angle Left
          </button>
          <button
            type="button"
            onClick={() => {
              setRotY(0);
              setRotX(4);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle font-medium text-ink transition-colors"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => {
              setRotY(14);
              setRotX(8);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-black/10 bg-white hover:bg-surface-subtle font-medium text-ink transition-colors"
          >
            Angle Right
          </button>
        </div>
      </div>
    </div>
  );
}
