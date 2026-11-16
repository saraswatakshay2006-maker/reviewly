import React, { forwardRef } from "react";
import type { StandeeDesign } from "@/lib/types";

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
 * Rendered at 300 DPI native resolution:
 * Trim size: 1240 × 1748 px (105mm × 148mm)
 * Bleed size: 1311 × 1819 px (111mm × 154mm with 3mm bleed)
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

    // Compute initials fallback if logo is not provided
    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase() || "RV";
    };

    const initials = getInitials(design.businessName || "My Business");

    // Dynamic font sizing for long business names
    const nameLength = (design.businessName || "").length;
    const nameFontSize =
      nameLength > 28 ? 30 : nameLength > 20 ? 36 : nameLength > 14 ? 42 : 46;

    // Helper for wrapping long supporting text into 2 balanced lines
    const supportingText =
      design.supportingText ||
      "Your honest feedback helps us improve and serve you better.";
    const midPoint = Math.floor(supportingText.length / 2);
    let splitIdx = supportingText.lastIndexOf(" ", midPoint);
    if (splitIdx === -1 || splitIdx < 15) {
      splitIdx = supportingText.indexOf(" ", midPoint);
    }
    const supLine1 =
      splitIdx > 0 ? supportingText.slice(0, splitIdx) : supportingText;
    const supLine2 = splitIdx > 0 ? supportingText.slice(splitIdx + 1) : "";

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        className={className}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          userSelect: "none",
          ...style,
        }}
      >
        <defs>
          {/* Subtle drop shadows */}
          <filter id="card-soft-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="8"
              floodColor={colors.primary}
              floodOpacity="0.08"
            />
          </filter>
          <filter id="pill-shadow" x="-10%" y="-15%" width="120%" height="130%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="#000000"
              floodOpacity="0.15"
            />
          </filter>
          <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="5"
              floodColor={colors.accent}
              floodOpacity="0.4"
            />
          </filter>

          {/* Gradients */}
          <linearGradient id="header-accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
            <stop offset="50%" stopColor={colors.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="gold-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="50%" stopColor="#FFF8E7" />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>

          <radialGradient id="nfc-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.25" />
            <stop offset="70%" stopColor={colors.secondary} stopOpacity="0.08" />
            <stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </radialGradient>

          {/* Clip path for circular logo */}
          <clipPath id="logo-circle-clip">
            <circle cx="620" cy="115" r="54" />
          </clipPath>
        </defs>

        {/* ----------------- BLEED BACKGROUND (IF ACTIVE) ----------------- */}
        {showBleed && (
          <rect
            x={-bleedPx}
            y={-bleedPx}
            width={trimWidth + bleedPx * 2}
            height={trimHeight + bleedPx * 2}
            fill={colors.background}
          />
        )}

        {/* ----------------- BASE CANVAS (TRIM) ----------------- */}
        <rect
          x="0"
          y="0"
          width={trimWidth}
          height={trimHeight}
          fill={colors.background}
        />

        {/* Luxury Outer Border / Frame */}
        <rect
          x="28"
          y="28"
          width={trimWidth - 56}
          height={trimHeight - 56}
          rx="24"
          fill="none"
          stroke={colors.primary}
          strokeWidth="3.5"
          opacity="0.85"
        />
        <rect
          x="40"
          y="40"
          width={trimWidth - 80}
          height={trimHeight - 80}
          rx="18"
          fill="none"
          stroke={colors.accent}
          strokeWidth="1.75"
          opacity="0.8"
        />

        {/* Corner Corner Ornaments */}
        {[
          { x: 44, y: 44 },
          { x: trimWidth - 44, y: 44 },
          { x: 44, y: trimHeight - 44 },
          { x: trimWidth - 44, y: trimHeight - 44 },
        ].map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill={colors.accent}
          />
        ))}

        {/* =================================================================== */}
        {/* TOP SECTION — BUSINESS BRANDING                                    */}
        {/* =================================================================== */}

        {/* Top Header Arch / Accent Bar */}
        <path
          d="M 40 40 L 40 70 Q 620 95 1200 70 L 1200 40 Z"
          fill={colors.primary}
          opacity="0.06"
        />

        {/* Business Logo or Initials Monogram Badge */}
        <g id="brand-logo-section">
          {/* Outer glow ring */}
          <circle
            cx="620"
            cy="115"
            r="60"
            fill="none"
            stroke={colors.accent}
            strokeWidth="2.5"
            opacity="0.75"
          />
          <circle
            cx="620"
            cy="115"
            r="54"
            fill={colors.primary}
            opacity="0.08"
          />

          {design.logoUrl ? (
            <image
              href={design.logoUrl}
              x="566"
              y="61"
              width="108"
              height="108"
              clipPath="url(#logo-circle-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <g>
              <circle cx="620" cy="115" r="54" fill={colors.primary} />
              <text
                x="620"
                y="126"
                textAnchor="middle"
                fill={colors.accent}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="800"
                fontSize="36"
                letterSpacing="2"
              >
                {initials}
              </text>
            </g>
          )}

          {/* Inner metallic trim ring */}
          <circle
            cx="620"
            cy="115"
            r="54"
            fill="none"
            stroke={colors.accent}
            strokeWidth="3"
          />
        </g>

        {/* Business Name */}
        <text
          x="620"
          y="218"
          textAnchor="middle"
          fill={colors.primary}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize={nameFontSize}
          letterSpacing="2.5"
        >
          {(design.businessName || "BUSINESS NAME").toUpperCase()}
        </text>

        {/* Business Tagline */}
        <text
          x="620"
          y="256"
          textAnchor="middle"
          fill={colors.secondary}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="17"
          letterSpacing="3.5"
          opacity="0.9"
        >
          {(
            design.tagline || "FITNESS • TRAINING • WELLNESS"
          ).toUpperCase()}
        </text>

        {/* Decorative Divider with Center Diamond */}
        <g id="header-divider">
          <line
            x1="220"
            y1="284"
            x2="590"
            y2="284"
            stroke={colors.accent}
            strokeWidth="1.5"
            opacity="0.65"
          />
          <polygon
            points="620,277 627,284 620,291 613,284"
            fill={colors.accent}
          />
          <line
            x1="650"
            y1="284"
            x2="1020"
            y2="284"
            stroke={colors.accent}
            strokeWidth="1.5"
            opacity="0.65"
          />
        </g>

        {/* =================================================================== */}
        {/* MIDDLE SECTION — REVIEW INVITATION                                 */}
        {/* =================================================================== */}

        {/* Pre-Headline: LOVE OUR SERVICE? */}
        <text
          x="620"
          y="336"
          textAnchor="middle"
          fill={colors.accent}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="24"
          letterSpacing="4"
        >
          {(design.headline || "LOVE OUR SERVICE?").toUpperCase()}
        </text>

        {/* Main Headline: SHARE YOUR EXPERIENCE */}
        <text
          x="620"
          y="392"
          textAnchor="middle"
          fill={colors.primary}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="50"
          letterSpacing="1.5"
        >
          {(design.mainHeadline || "SHARE YOUR EXPERIENCE").toUpperCase()}
        </text>

        {/* 5 Crisp Decorative Gold Stars */}
        <g id="decorative-five-stars">
          {[-2, -1, 0, 1, 2].map((offset) => {
            const cx = 620 + offset * 56;
            const cy = 440;
            return (
              <polygon
                key={offset}
                points={`
                  ${cx},${cy - 19}
                  ${cx + 5.8},${cy - 5.8}
                  ${cx + 20},${cy - 5.8}
                  ${cx + 9.5},${cy + 3.8}
                  ${cx + 13.5},${cy + 17.5}
                  ${cx},${cy + 8.5}
                  ${cx - 13.5},${cy + 17.5}
                  ${cx - 9.5},${cy + 3.8}
                  ${cx - 20},${cy - 5.8}
                  ${cx - 5.8},${cy - 5.8}
                `}
                fill={colors.accent}
                stroke={colors.secondary}
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* Supporting Text */}
        <text
          x="620"
          y="492"
          textAnchor="middle"
          fill={colors.text}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="500"
          fontSize="22"
          opacity="0.85"
        >
          {supLine1}
        </text>
        {supLine2 && (
          <text
            x="620"
            y="522"
            textAnchor="middle"
            fill={colors.text}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
            fontSize="22"
            opacity="0.85"
          >
            {supLine2}
          </text>
        )}

        {/* =================================================================== */}
        {/* CENTRAL SECTION — SCAN AND TAP SIDE BY SIDE (CORE REQUIREMENT)    */}
        {/* =================================================================== */}

        {/* LEFT PANEL: QR SCAN */}
        <g id="panel-qr-scan">
          {/* Outer Box */}
          <rect
            x="70"
            y="560"
            width="495"
            height="640"
            rx="28"
            fill="#FFFFFF"
            stroke={colors.primary}
            strokeWidth="2.5"
            filter="url(#card-soft-shadow)"
          />
          <rect
            x="76"
            y="566"
            width="483"
            height="628"
            rx="24"
            fill="none"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Top Pill: SCAN with Mini QR Glyph */}
          <rect
            x="217"
            y="584"
            width="200"
            height="50"
            rx="25"
            fill={colors.primary}
            filter="url(#pill-shadow)"
          />
          <rect
            x="220"
            y="587"
            width="194"
            height="44"
            rx="22"
            fill="none"
            stroke={colors.accent}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Mini QR Icon in Pill */}
          <g transform="translate(240, 597) scale(0.95)">
            <rect width="9" height="9" x="0" y="0" rx="1.5" fill={colors.accent} />
            <rect width="9" height="9" x="15" y="0" rx="1.5" fill={colors.accent} />
            <rect width="9" height="9" x="0" y="15" rx="1.5" fill={colors.accent} />
            <rect width="5" height="5" x="17" y="17" rx="1" fill={colors.accent} />
          </g>

          <text
            x="328"
            y="618"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="22"
            letterSpacing="3"
          >
            {(design.qrScanLabel || "SCAN").toUpperCase()}
          </text>

          {/* Pure White Container Behind QR for 100% Optical Scanning */}
          <rect
            x="132"
            y="656"
            width="370"
            height="370"
            rx="22"
            fill="#FFFFFF"
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {/* Dynamic Real Scannable QR Code */}
          {qrDataUrl && (
            <image
              href={qrDataUrl}
              x="147"
              y="671"
              width="340"
              height="340"
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* Instruction Text Below QR */}
          <text
            x="317"
            y="1068"
            textAnchor="middle"
            fill={colors.primary}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="0.5"
          >
            {design.qrScanInstruction || "Scan the QR code with your phone"}
          </text>

          {/* Small Phone Camera Hint */}
          <g transform="translate(317, 1114)">
            <rect
              x="-80"
              y="-18"
              width="160"
              height="32"
              rx="16"
              fill={colors.primary}
              opacity="0.08"
            />
            <circle cx="-55" cy="-2" r="6" fill={colors.secondary} />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill={colors.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="14"
              letterSpacing="1"
            >
              CAMERA / QR APP
            </text>
          </g>
        </g>

        {/* CENTER DIVIDER: Small Circular "OR" Separator */}
        <g id="center-or-divider">
          {/* Vertical hairline connector line */}
          <line
            x1="620"
            y1="600"
            x2="620"
            y2="835"
            stroke={colors.accent}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Center OR Badge */}
          <circle
            cx="620"
            cy="880"
            r="38"
            fill={colors.primary}
            stroke={colors.accent}
            strokeWidth="3.5"
            filter="url(#badge-glow)"
          />
          <circle
            cx="620"
            cy="880"
            r="31"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.4"
          />
          <text
            x="620"
            y="888"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="21"
            letterSpacing="1.5"
          >
            OR
          </text>

          <line
            x1="620"
            y1="925"
            x2="620"
            y2="1160"
            stroke={colors.accent}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.8"
          />
        </g>

        {/* RIGHT PANEL: NFC TAP */}
        <g id="panel-nfc-tap">
          {/* Outer Box */}
          <rect
            x="675"
            y="560"
            width="495"
            height="640"
            rx="28"
            fill="#FFFFFF"
            stroke={colors.primary}
            strokeWidth="2.5"
            filter="url(#card-soft-shadow)"
          />
          <rect
            x="681"
            y="566"
            width="483"
            height="628"
            rx="24"
            fill="none"
            stroke={colors.accent}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Top Pill: TAP with Mini NFC Glyph */}
          <rect
            x="822"
            y="584"
            width="200"
            height="50"
            rx="25"
            fill={colors.primary}
            filter="url(#pill-shadow)"
          />
          <rect
            x="825"
            y="587"
            width="194"
            height="44"
            rx="22"
            fill="none"
            stroke={colors.accent}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Mini NFC Contactless Wave in Pill */}
          <g
            transform="translate(850, 597) scale(0.95)"
            stroke={colors.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M4 18 A 12 12 0 0 1 4 4" />
            <path d="M9 16 A 8 8 0 0 1 9 6" />
            <path d="M14 14 A 4 4 0 0 1 14 8" />
          </g>

          <text
            x="933"
            y="618"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="22"
            letterSpacing="3"
          >
            {(design.nfcTapLabel || "TAP").toUpperCase()}
          </text>

          {/* Central NFC Target Graphic Area */}
          <g id="nfc-target-illustration" transform="translate(922.5, 840)">
            {/* Background Radial Glow */}
            <circle cx="0" cy="0" r="165" fill="url(#nfc-pulse)" />

            {/* Glowing Concentric Radio Waves */}
            <circle
              cx="0"
              cy="0"
              r="150"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.55"
            />
            <circle
              cx="0"
              cy="0"
              r="120"
              fill="none"
              stroke={colors.secondary}
              strokeWidth="2.5"
              opacity="0.65"
            />
            <circle
              cx="0"
              cy="0"
              r="90"
              fill={colors.primary}
              fillOpacity="0.05"
              stroke={colors.accent}
              strokeWidth="3"
            />

            {/* Smartphone Tapping Silhouette (Tilted at 12°) */}
            <g transform="translate(0, 10) rotate(-12)">
              {/* Phone Body */}
              <rect
                x="-52"
                y="-90"
                width="104"
                height="175"
                rx="18"
                fill="#FFFFFF"
                stroke={colors.primary}
                strokeWidth="4"
                filter="url(#pill-shadow)"
              />
              {/* Screen Inner Bezel */}
              <rect
                x="-44"
                y="-78"
                width="88"
                height="150"
                rx="12"
                fill={colors.primary}
                fillOpacity="0.06"
              />
              {/* Phone Camera Notch */}
              <rect
                x="-14"
                y="-84"
                width="28"
                height="5"
                rx="2.5"
                fill={colors.primary}
                opacity="0.7"
              />
              {/* Phone Home Bar */}
              <line
                x1="-18"
                y1="64"
                x2="18"
                y2="64"
                stroke={colors.primary}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* NFC Contactless Waves Emanating from Top of Phone */}
              <g
                transform="translate(0, -96)"
                stroke={colors.accent}
                strokeLinecap="round"
                fill="none"
              >
                <path
                  d="M -36 -12 A 40 40 0 0 1 36 -12"
                  strokeWidth="3.5"
                  opacity="0.9"
                />
                <path
                  d="M -24 -24 A 30 30 0 0 1 24 -24"
                  strokeWidth="4"
                  opacity="1"
                />
                <path
                  d="M -12 -34 A 20 20 0 0 1 12 -34"
                  strokeWidth="4.5"
                  opacity="1"
                />
              </g>

              {/* Official NFC Symbol inside phone screen */}
              <g
                transform="translate(0, -4) scale(1.3)"
                stroke={colors.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              >
                <path d="M -10 12 L -10 -12 L 0 4 L 0 -12" />
                <path d="M 0 4 A 7 7 0 0 0 8 12 L 10 12" />
              </g>
            </g>
          </g>

          {/* Instruction Text Below NFC */}
          <text
            x="922"
            y="1068"
            textAnchor="middle"
            fill={colors.primary}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="21"
            letterSpacing="0.5"
          >
            {design.nfcTapInstruction || "Tap your NFC-enabled phone here"}
          </text>

          {/* Small Phone NFC Compatibility Hint */}
          <g transform="translate(922, 1114)">
            <rect
              x="-90"
              y="-18"
              width="180"
              height="32"
              rx="16"
              fill={colors.primary}
              opacity="0.08"
            />
            <circle cx="-65" cy="-2" r="6" fill={colors.accent} />
            <text
              x="5"
              y="4"
              textAnchor="middle"
              fill={colors.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="14"
              letterSpacing="1"
            >
              IPHONE &amp; ANDROID
            </text>
          </g>
        </g>

        {/* =================================================================== */}
        {/* BOTTOM SECTION — BENEFITS & THANK YOU FOOTER                       */}
        {/* =================================================================== */}

        {/* Benefit 1: Share Experience */}
        <g id="benefit-1" transform="translate(240, 1260)">
          <circle
            cx="0"
            cy="0"
            r="28"
            fill={colors.primary}
            fillOpacity="0.08"
            stroke={colors.accent}
            strokeWidth="2"
          />
          {/* Star Vector */}
          <polygon
            points="0,-12 3.5,-3.5 12,-3.5 5,2 7.5,10.5 0,5.5 -7.5,10.5 -5,2 -12,-3.5 -3.5,-3.5"
            fill={colors.accent}
          />
          <text
            x="0"
            y="48"
            textAnchor="middle"
            fill={colors.text}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="18"
          >
            {design.benefit1 || "Share Your Experience"}
          </text>
        </g>

        {/* Benefit 2: Help Us Improve */}
        <g id="benefit-2" transform="translate(620, 1260)">
          <circle
            cx="0"
            cy="0"
            r="28"
            fill={colors.primary}
            fillOpacity="0.08"
            stroke={colors.accent}
            strokeWidth="2"
          />
          {/* Heart / Thumbs up icon */}
          <path
            d="M -7 -6 A 4.5 4.5 0 0 1 0 -2 A 4.5 4.5 0 0 1 7 -6 A 4.5 4.5 0 0 1 7 1 L 0 9 L -7 1 A 4.5 4.5 0 0 1 -7 -6 Z"
            fill={colors.accent}
          />
          <text
            x="0"
            y="48"
            textAnchor="middle"
            fill={colors.text}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="18"
          >
            {design.benefit2 || "Help Us Improve"}
          </text>
        </g>

        {/* Benefit 3: Support Our Growth */}
        <g id="benefit-3" transform="translate(1000, 1260)">
          <circle
            cx="0"
            cy="0"
            r="28"
            fill={colors.primary}
            fillOpacity="0.08"
            stroke={colors.accent}
            strokeWidth="2"
          />
          {/* Growth Rocket / Trending Up */}
          <path
            d="M -8 7 L 3 -4 L 8 -4 L 8 1 L -3 12 Z M 3 -4 L 7 -8 L 8 -4 Z"
            fill={colors.accent}
          />
          <text
            x="0"
            y="48"
            textAnchor="middle"
            fill={colors.text}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="18"
          >
            {design.benefit3 || "Support Our Growth"}
          </text>
        </g>

        {/* Elegant Footer Divider */}
        <line
          x1="120"
          y1="1350"
          x2="1120"
          y2="1350"
          stroke="url(#header-accent-grad)"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Branded Footer: THANK YOU! */}
        <text
          x="620"
          y="1420"
          textAnchor="middle"
          fill={colors.primary}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="44"
          letterSpacing="4"
        >
          {(design.footerText || "THANK YOU!").toUpperCase()}
        </text>

        {/* Subtle Decorative Leaves / Flairs beside THANK YOU! */}
        <g stroke={colors.accent} strokeWidth="2" fill="none" opacity="0.8">
          <path d="M 420 1408 Q 390 1400 370 1412 M 420 1408 Q 395 1416 380 1424" />
          <path d="M 820 1408 Q 850 1400 870 1412 M 820 1408 Q 845 1416 860 1424" />
        </g>

        {/* Platform or Custom Branding Signature */}
        <text
          x="620"
          y="1660"
          textAnchor="middle"
          fill={colors.text}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="15"
          letterSpacing="2"
          opacity="0.45"
        >
          POWERED BY REVIEWLY • VERIFIED SMART STAND
        </text>

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

