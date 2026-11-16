import React, { forwardRef } from "react";
import type { StandeeDesign } from "@/lib/types";
import BusinessLogoEmblems, {
  inferEmblemType,
  type LogoEmblemType,
} from "./BusinessLogoEmblems";

export interface StandeeArtworkProps {
  design: StandeeDesign;
  qrDataUrl: string;
  publicUrl?: string;
  nfcUrl?: string;
  showBleed?: boolean;
  showCropMarks?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Single Source of Truth Vector Artwork for the A6 Standee.
 * Matches the physical tabletop standee design:
 * - A6 Portrait dimensions: 105mm × 148mm
 * - Native 300 DPI canvas: 1240 × 1748 px (trim)
 * - 3mm bleed support: 1311 × 1819 px
 * - Top & bottom swooping dynamic curved waves
 * - "Loved Our Service?" + "Review Us" with radiant golden bursts
 * - 5 golden decorative stars
 * - Side-by-side soft mint QR Scan & NFC Tap panels with central "OR" separator
 * - Hand holding phone tapping NFC target vector
 * - 3 bottom value icons: Star, Heart, Growth Chart
 * - Signature cursive "Thank You!" footer banner
 * - High-definition geometricPrecision text & vector rendering for ultra-crisp print quality
 * - Dynamic business logo / Gym Dumbbell emblem fallback
 */
export const StandeeArtwork = forwardRef<SVGSVGElement, StandeeArtworkProps>(
  function StandeeArtwork(
    {
      design,
      qrDataUrl,
      publicUrl: _publicUrl,
      nfcUrl: _nfcUrl,
      showBleed = false,
      showCropMarks = false,
      className = "",
      style = {},
    },
    ref
  ) {
    const { colors } = design;

    // A6 300 DPI dimensions
    const trimWidth = 1240;
    const trimHeight = 1748;
    const bleedPx = 35.5; // ~3mm at 300 DPI

    const viewBox = showBleed
      ? `-${bleedPx} -${bleedPx} ${trimWidth + bleedPx * 2} ${trimHeight + bleedPx * 2}`
      : `0 0 ${trimWidth} ${trimHeight}`;

    // Color mappings
    const primary = colors.primary || "#063F32";
    const secondary = colors.secondary || "#12805A";
    const accent = colors.accent || "#D9A441";
    // Lime accent curve matching the reference (calculated or fallback)
    const limeAccent =
      primary === "#063F32" || primary === "#0B4636"
        ? "#8AC240"
        : colors.accent || "#D9A441";

    const businessName = (design.businessName || "FITZONE GYM").toUpperCase();
    const tagline = (
      design.tagline || "FITNESS • TRAINING • WELLNESS"
    ).toUpperCase();
    const headline1 = design.headline || "Loved Our Service?";
    const headline2 = design.mainHeadline || "Review Us";
    const supportingText =
      design.supportingText ||
      "Your feedback helps us grow and serve you better!";
    const footerText = design.footerText || "Thank You!";

    // Dynamic font sizing for long business names
    const nameLength = businessName.length;
    const nameFontSize =
      nameLength > 28 ? 34 : nameLength > 20 ? 40 : nameLength > 14 ? 46 : 50;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        className={className}
        textRendering="geometricPrecision"
        shapeRendering="geometricPrecision"
        imageRendering="optimizeQuality"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          userSelect: "none",
          WebkitFontSmoothing: "antialiased",
          ...style,
        }}
      >
        <defs>
          <style>{`
            .standee-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              text-rendering: geometricPrecision;
              -webkit-font-smoothing: antialiased;
            }
          `}</style>

          {/* Subtle drop shadow filters */}
          <filter id="soft-card-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="12"
              floodColor="#063F32"
              floodOpacity="0.08"
            />
          </filter>
          <filter id="pill-shadow" x="-10%" y="-15%" width="120%" height="130%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="5"
              floodColor="#000000"
              floodOpacity="0.18"
            />
          </filter>
          <filter id="or-badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="#000000"
              floodOpacity="0.25"
            />
          </filter>

          {/* Top wave gradient */}
          <linearGradient id="top-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="70%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>

          {/* Bottom wave gradient */}
          <linearGradient id="bottom-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondary} />
            <stop offset="40%" stopColor={primary} />
            <stop offset="100%" stopColor={primary} />
          </linearGradient>

          {/* Soft mint panel background gradient */}
          <linearGradient id="mint-panel-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4FAF7" />
            <stop offset="100%" stopColor="#EBF5F0" />
          </linearGradient>
        </defs>

        {/* ----------------- BLEED BACKGROUND (WHEN ACTIVE) ----------------- */}
        {showBleed && (
          <rect
            x={-bleedPx}
            y={-bleedPx}
            width={trimWidth + bleedPx * 2}
            height={trimHeight + bleedPx * 2}
            fill="#FFFFFF"
          />
        )}

        {/* ----------------- BASE CANVAS (TRIM) ----------------- */}
        <rect x="0" y="0" width={trimWidth} height={trimHeight} fill="#FFFFFF" />

        {/* =================================================================== */}
        {/* TOP SECTION — SWOOPING CURVED WAVE HEADER WITH BUSINESS BRANDING    */}
        {/* =================================================================== */}
        <g id="top-wave-header">
          {/* Layer 1: Lime/Accent accent wave curve */}
          <path
            d="M -10 -10 L 1250 -10 L 1250 145 C 960 215, 680 200, 320 195 C 160 192, 50 165, -10 155 Z"
            fill={limeAccent}
            opacity="0.95"
          />

          {/* Layer 2: Main Dark Forest Green swooping wave */}
          <path
            d="M -10 -10 L 1250 -10 L 1250 125 C 960 195, 680 180, 320 175 C 160 172, 50 145, -10 135 Z"
            fill="url(#top-wave-grad)"
          />

          {/* Subtle wave highlight curve */}
          <path
            d="M -10 -10 L 550 -10 C 400 90, 180 150, -10 140 Z"
            fill="#FFFFFF"
            opacity="0.06"
          />

          {/* Logo / Monogram Icon in Top Wave (Wide, Prominent, Exactly Like Reference) */}
          <g id="top-logo-group" transform="translate(620, 62)">
            <BusinessLogoEmblems
              type={design.emblemType}
              category={design.tagline || ""}
              businessName={businessName}
              logoUrl={design.logoUrl}
              primaryColor={primary}
              accentColor={limeAccent}
              size={112}
            />
          </g>

          {/* Business Name inside Top Wave (No Tagline on A6 Print as Requested) */}
          <text
            x="620"
            y="142"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize={nameFontSize}
            letterSpacing="2.5"
            textRendering="geometricPrecision"
          >
            {businessName}
          </text>
        </g>

        {/* =================================================================== */}
        {/* MIDDLE SECTION — REVIEW INVITATION WITH RADIANT SPARKS & STARS      */}
        {/* =================================================================== */}
        <g id="review-invitation-section" transform="translate(620, 275)">
          {/* Sub-headline: Loved Our Service? */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#1A2E26"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="800"
            fontSize="38"
            letterSpacing="0.5"
            textRendering="geometricPrecision"
          >
            {headline1}
          </text>

          {/* Main Huge Headline: Review Us with Radiant Bursts */}
          <g transform="translate(0, 64)">
            {/* Left Golden Radiant Sparks */}
            <g transform="translate(-235, -20)" stroke="#F5A623" strokeWidth="4.5" strokeLinecap="round">
              {/* Top ray */}
              <line x1="-30" y1="-18" x2="-6" y2="-6" />
              {/* Middle ray */}
              <line x1="-38" y1="0" x2="-10" y2="0" strokeWidth="5" stroke="#FFB800" />
              {/* Bottom ray */}
              <line x1="-30" y1="18" x2="-6" y2="6" />
            </g>

            {/* "Review Us" text */}
            <text
              x="0"
              y="18"
              textAnchor="middle"
              fill={primary}
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="82"
              letterSpacing="1"
              textRendering="geometricPrecision"
            >
              {headline2}
            </text>

            {/* Right Golden Radiant Sparks */}
            <g transform="translate(235, -20)" stroke="#F5A623" strokeWidth="4.5" strokeLinecap="round">
              {/* Top ray */}
              <line x1="6" y1="-6" x2="30" y2="-18" />
              {/* Middle ray */}
              <line x1="10" y1="0" x2="38" y2="0" strokeWidth="5" stroke="#FFB800" />
              {/* Bottom ray */}
              <line x1="6" y1="6" x2="30" y2="18" />
            </g>
          </g>

          {/* 5 Solid Golden Decorative Stars */}
          <g id="decorative-five-stars" transform="translate(0, 128)">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const cx = offset * 54;
              const cy = 0;
              return (
                <polygon
                  key={offset}
                  points={`
                    ${cx},${cy - 22}
                    ${cx + 6.8},${cy - 6.8}
                    ${cx + 23},${cy - 6.8}
                    ${cx + 11},${cy + 4.5}
                    ${cx + 15.5},${cy + 20.5}
                    ${cx},${cy + 10}
                    ${cx - 15.5},${cy + 20.5}
                    ${cx - 11},${cy + 4.5}
                    ${cx - 23},${cy - 6.8}
                    ${cx - 6.8},${cy - 6.8}
                  `}
                  fill="#FFB800"
                />
              );
            })}
          </g>

          {/* Supporting Text */}
          <text
            x="0"
            y="172"
            textAnchor="middle"
            fill="#4A5568"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="600"
            fontSize="23"
            letterSpacing="0.3"
            textRendering="geometricPrecision"
          >
            {supportingText}
          </text>
        </g>

        {/* =================================================================== */}
        {/* CENTRAL SECTION — SCAN AND TAP SIDE BY SIDE (EXACT TO REFERENCE)   */}
        {/* =================================================================== */}

        {/* LEFT PANEL: QR SCAN */}
        <g id="panel-qr-scan" transform="translate(42, 485)">
          {/* Pale Mint Container Box */}
          <rect
            x="0"
            y="0"
            width="540"
            height="715"
            rx="34"
            fill="url(#mint-panel-grad)"
            stroke="#D6EBE2"
            strokeWidth="2"
            filter="url(#soft-card-shadow)"
          />

          {/* Crisp White Container Behind QR with Soft Shadow */}
          <rect
            x="30"
            y="26"
            width="480"
            height="480"
            rx="26"
            fill="#FFFFFF"
            filter="drop-shadow(0px 4px 14px rgba(0,0,0,0.07))"
          />

          {/* 4 Green Corner Viewfinder / Scanner Brackets */}
          <g stroke={primary} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Top-Left */}
            <path d="M 42 76 L 42 38 L 76 38" />
            {/* Top-Right */}
            <path d="M 464 38 L 498 38 L 498 76" />
            {/* Bottom-Left */}
            <path d="M 42 464 L 42 502 L 76 502" />
            {/* Bottom-Right */}
            <path d="M 464 502 L 498 502 L 498 464" />
          </g>

          {/* Dynamic Real Scannable QR Code - Max Large Size for Distance Scanning (+75% Area) */}
          {qrDataUrl && (
            <image
              href={qrDataUrl}
              x="48"
              y="44"
              width="444"
              height="444"
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* Center Brand Badge on QR Code */}
          <circle cx="270" cy="266" r="40" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
          {/* Matching Mini Logo / Dumbbell Emblem inside QR */}
          <g transform="translate(270, 266)">
            <BusinessLogoEmblems
              type={design.emblemType}
              category={design.tagline || ""}
              businessName={businessName}
              logoUrl={design.logoUrl}
              primaryColor={primary}
              accentColor={limeAccent}
              size={46}
              isMini={true}
            />
          </g>

          {/* Solid Green Pill Button: [—] SCAN */}
          <g transform="translate(145, 532)">
            <rect
              x="0"
              y="0"
              width="250"
              height="58"
              rx="29"
              fill={primary}
              filter="url(#pill-shadow)"
            />
            {/* Viewfinder scanner icon */}
            <g transform="translate(38, 17)" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 0 6 L 0 0 L 6 0" />
              <path d="M 18 0 L 24 0 L 24 6" />
              <path d="M 0 16 L 0 22 L 6 22" />
              <path d="M 18 22 L 24 22 L 24 16" />
              <line x1="4" y1="11" x2="20" y2="11" strokeWidth="2" />
            </g>
            <text
              x="146"
              y="37"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="25"
              letterSpacing="2.5"
              textRendering="geometricPrecision"
            >
              SCAN
            </text>
          </g>

          {/* Instruction Text Below Pill */}
          <text
            x="270"
            y="628"
            textAnchor="middle"
            fill="#1A202C"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="23"
            letterSpacing="0.2"
            textRendering="geometricPrecision"
          >
            Scan the QR code
          </text>
          <text
            x="270"
            y="658"
            textAnchor="middle"
            fill="#1A202C"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="23"
            letterSpacing="0.2"
            textRendering="geometricPrecision"
          >
            with your phone
          </text>
        </g>

        {/* CENTER DIVIDER: Hairline with Circular "OR" Badge */}
        <g id="center-or-divider">
          {/* Vertical hairline top line */}
          <line
            x1="620"
            y1="520"
            x2="620"
            y2="795"
            stroke="#CBD5E1"
            strokeWidth="2"
          />

          {/* Center Dark Green "OR" Circle */}
          <circle
            cx="620"
            cy="830"
            r="36"
            fill={primary}
            filter="url(#or-badge-shadow)"
          />
          <text
            x="620"
            y="838"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="900"
            fontSize="21"
            letterSpacing="1"
            textRendering="geometricPrecision"
          >
            OR
          </text>

          {/* Vertical hairline bottom line */}
          <line
            x1="620"
            y1="865"
            x2="620"
            y2="1140"
            stroke="#CBD5E1"
            strokeWidth="2"
          />
        </g>

        {/* RIGHT PANEL: NFC TAP */}
        <g id="panel-nfc-tap" transform="translate(658, 485)">
          {/* Pale Mint Container Box */}
          <rect
            x="0"
            y="0"
            width="540"
            height="715"
            rx="34"
            fill="url(#mint-panel-grad)"
            stroke="#D6EBE2"
            strokeWidth="2"
            filter="url(#soft-card-shadow)"
          />

          {/* NFC Contactless Target Rings & Phone Tap Illustration */}
          <g id="nfc-target-area" transform="translate(270, 266)">
            {/* Outer Circular Ring (Enlarged to 400px diameter) */}
            <circle
              cx="0"
              cy="0"
              r="200"
              fill="none"
              stroke={primary}
              strokeWidth="12"
              opacity="0.95"
            />

            {/* Concentric Radiating NFC Waves (Prominent, thick) */}
            <g
              transform="translate(-90, 0)"
              stroke={primary}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M -50 -70 A 90 90 0 0 0 -50 70" />
              <path d="M -24 -50 A 64 64 0 0 0 -24 50" />
              <path d="M 2 -30 A 38 38 0 0 0 2 30" strokeWidth="10" />
            </g>

            {/* Hand Holding Smartphone Vector (Scaled up 1.28x for maximum visibility) */}
            <g transform="translate(48, -6) rotate(12) scale(1.28)">
              {/* Smartphone Body */}
              <rect
                x="-42"
                y="-75"
                width="84"
                height="145"
                rx="14"
                fill="#FFFFFF"
                stroke="#1A202C"
                strokeWidth="4"
                filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))"
              />
              {/* Phone Screen Bezel */}
              <rect
                x="-36"
                y="-66"
                width="72"
                height="126"
                rx="8"
                fill="#F8FAFC"
              />
              {/* Phone Camera Dot */}
              <circle cx="0" cy="-70" r="2.5" fill="#1A202C" />

              {/* NFC Wave Symbol on Phone Screen */}
              <circle cx="0" cy="-6" r="14" fill="none" stroke={primary} strokeWidth="2.5" />
              <path
                d="M -7 -6 L -7 6 M 7 -6 L 7 6 M -7 0 L 7 0"
                stroke={primary}
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Hand Vector Gripping Phone */}
              <g stroke="#1A202C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF">
                {/* Thumb across bottom front */}
                <path d="M 40 22 C 30 18, 10 18, -4 28 C -14 36, -8 44, 4 42 C 16 40, 30 38, 44 42" />
                {/* Index finger wrapping behind */}
                <path d="M 42 -15 C 55 -15, 64 -8, 62 4 C 60 16, 48 24, 42 22" />
                {/* Outer hand palm & wrist */}
                <path d="M 44 40 C 58 48, 70 65, 80 82" />
                <path d="M 62 4 C 75 18, 88 45, 96 68" />
              </g>
            </g>
          </g>

          {/* Solid Green Pill Button: ))) TAP */}
          <g transform="translate(145, 532)">
            <rect
              x="0"
              y="0"
              width="250"
              height="58"
              rx="29"
              fill={primary}
              filter="url(#pill-shadow)"
            />
            {/* NFC Waves Icon in Pill */}
            <g
              transform="translate(38, 18)"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M 2 18 A 12 12 0 0 1 2 4" />
              <path d="M 7 15 A 8 8 0 0 1 7 7" />
              <path d="M 12 12 A 4 4 0 0 1 12 10" />
            </g>
            <text
              x="146"
              y="37"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="900"
              fontSize="25"
              letterSpacing="2.5"
              textRendering="geometricPrecision"
            >
              TAP
            </text>
          </g>

          {/* Instruction Text Below Pill */}
          <text
            x="270"
            y="628"
            textAnchor="middle"
            fill="#1A202C"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="23"
            letterSpacing="0.2"
            textRendering="geometricPrecision"
          >
            Tap your NFC
          </text>
          <text
            x="270"
            y="658"
            textAnchor="middle"
            fill="#1A202C"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontWeight="700"
            fontSize="23"
            letterSpacing="0.2"
            textRendering="geometricPrecision"
          >
            enabled phone here
          </text>
        </g>

        {/* =================================================================== */}
        {/* BOTTOM SECTION — 3 BENEFITS & SIGNATURE SWOOPING "THANK YOU!" WAVE  */}
        {/* =================================================================== */}

        {/* 3 Benefits with Hairline Vertical Dividers */}
        <g id="bottom-benefits" transform="translate(620, 1260)">
          {/* Benefit 1: Star Outline — Share Your Experience */}
          <g transform="translate(-360, 0)">
            {/* Outline Star */}
            <path
              d="M 0 -22 L 6 -7 L 22 -6 L 10 5 L 14 20 L 0 11 L -14 20 L -10 5 L -22 -6 L -6 -7 Z"
              fill="none"
              stroke="#1A2E26"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <text
              x="0"
              y="45"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Share Your
            </text>
            <text
              x="0"
              y="72"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Experience
            </text>
          </g>

          {/* Divider 1 */}
          <line x1="-180" y1="-15" x2="-180" y2="75" stroke="#CBD5E1" strokeWidth="2" />

          {/* Benefit 2: Heart Outline — Help Us Improve */}
          <g transform="translate(0, 0)">
            {/* Outline Heart */}
            <path
              d="M 0 16 C -18 2, -22 -14, -11 -20 C -4 -24, 0 -17, 0 -17 C 0 -17, 4 -24, 11 -20 C 22 -14, 18 2, 0 16 Z"
              fill="none"
              stroke="#1A2E26"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <text
              x="0"
              y="45"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Help Us
            </text>
            <text
              x="0"
              y="72"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Improve
            </text>
          </g>

          {/* Divider 2 */}
          <line x1="180" y1="-15" x2="180" y2="75" stroke="#CBD5E1" strokeWidth="2" />

          {/* Benefit 3: Growth Bar Chart with Trending Arrow — Support Our Growth */}
          <g transform="translate(360, 0)">
            {/* Bar Chart Bars */}
            <rect x="-18" y="4" width="8" height="14" rx="2" fill={limeAccent} />
            <rect x="-6" y="-6" width="8" height="24" rx="2" fill={secondary} />
            <rect x="6" y="-16" width="8" height="34" rx="2" fill={primary} />
            {/* Upward Trending Arrow */}
            <path
              d="M -22 10 L 16 -18 M 8 -18 L 18 -18 L 18 -8"
              stroke={primary}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <text
              x="0"
              y="45"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Support
            </text>
            <text
              x="0"
              y="72"
              textAnchor="middle"
              fill="#1A202C"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              fontWeight="800"
              fontSize="22"
              textRendering="geometricPrecision"
            >
              Our Growth
            </text>
          </g>
        </g>

        {/* BOTTOM SWOOPING CURVED WAVE BANNER WITH "Thank You!" SCRIPT */}
        <g id="bottom-wave-footer">
          {/* Layer 1: Lime Accent Wave Line on top crest */}
          <path
            d="M -10 1620 C 250 1560, 500 1650, 850 1580 C 1020 1545, 1150 1575, 1250 1610 L 1250 1760 L -10 1760 Z"
            fill={limeAccent}
            opacity="0.95"
          />

          {/* Layer 2: Main Deep Forest Green Wave */}
          <path
            d="M -10 1635 C 250 1580, 500 1670, 850 1600 C 1020 1565, 1150 1595, 1250 1625 L 1250 1760 L -10 1760 Z"
            fill="url(#bottom-wave-grad)"
          />

          {/* Layer 3: Secondary swooping accent curve */}
          <path
            d="M -10 1660 C 250 1620, 500 1700, 850 1640 C 1020 1610, 1150 1630, 1250 1650 L 1250 1760 L -10 1760 Z"
            fill={primary}
            opacity="0.5"
          />

          {/* "Thank You!" Cursive Script Vector Text */}
          <g transform="translate(620, 1698)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, sans-serif"
              fontStyle="italic"
              fontWeight="700"
              fontSize="84"
              letterSpacing="2"
              textRendering="geometricPrecision"
            >
              {footerText}
            </text>
            {/* Signature Underline Flourish */}
            <path
              d="M -160 16 Q 0 30 160 16"
              stroke={limeAccent}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </g>
        </g>

        {/* =================================================================== */}
        {/* OPTIONAL PRINTER CROP MARKS (WHEN BLEED IS ENABLED)                */}
        {/* =================================================================== */}
        {showCropMarks && showBleed && (
          <g stroke="#1F2937" strokeWidth="1.5">
            {/* Top-Left */}
            <line x1="0" y1={-bleedPx} x2="0" y2="-10" />
            <line x1={-bleedPx} y1="0" x2="-10" y2="0" />

            {/* Top-Right */}
            <line x1={trimWidth} y1={-bleedPx} x2={trimWidth} y2="-10" />
            <line x1={trimWidth + 10} y1="0" x2={trimWidth + bleedPx} y2="0" />

            {/* Bottom-Left */}
            <line x1="0" y1={trimHeight + 10} x2="0" y2={trimHeight + bleedPx} />
            <line x1={-bleedPx} y1={trimHeight} x2="-10" y2={trimHeight} />

            {/* Bottom-Right */}
            <line
              x1={trimWidth}
              y1={trimHeight + 10}
              x2={trimWidth}
              y2={trimHeight + bleedPx}
            />
            <line
              x1={trimWidth + 10}
              y1={trimHeight}
              x2={trimWidth + bleedPx}
              y2={trimHeight}
            />
          </g>
        )}
      </svg>
    );
  }
);
