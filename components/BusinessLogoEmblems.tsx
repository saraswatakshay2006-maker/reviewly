"use client";

import React from "react";

export type LogoEmblemType =
  | "gym"
  | "salon"
  | "restaurant"
  | "healthcare"
  | "automotive"
  | "hotel"
  | "retail"
  | "crest";

export interface LogoEmblemProps {
  type?: LogoEmblemType | string;
  category?: string;
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  size?: number; // default width/height
  isMini?: boolean; // for inside QR code
  className?: string;
}

/**
 * Automatically infers the best vector emblem based on category or name keywords
 */
export function inferEmblemType(category?: string, name?: string): LogoEmblemType {
  const text = `${category || ""} ${name || ""}`.toLowerCase();

  if (
    text.includes("gym") ||
    text.includes("fit") ||
    text.includes("workout") ||
    text.includes("train") ||
    text.includes("crossfit") ||
    text.includes("yoga") ||
    text.includes("sports") ||
    text.includes("muscle")
  ) {
    return "gym";
  }

  if (
    text.includes("salon") ||
    text.includes("spa") ||
    text.includes("beauty") ||
    text.includes("hair") ||
    text.includes("nail") ||
    text.includes("barber") ||
    text.includes("makeup")
  ) {
    return "salon";
  }

  if (
    text.includes("restaurant") ||
    text.includes("cafe") ||
    text.includes("food") ||
    text.includes("dining") ||
    text.includes("bistro") ||
    text.includes("bakery") ||
    text.includes("kitchen") ||
    text.includes("pizza") ||
    text.includes("burger")
  ) {
    return "restaurant";
  }

  if (
    text.includes("health") ||
    text.includes("clinic") ||
    text.includes("doctor") ||
    text.includes("dental") ||
    text.includes("dentist") ||
    text.includes("hospital") ||
    text.includes("med") ||
    text.includes("care")
  ) {
    return "healthcare";
  }

  if (
    text.includes("car") ||
    text.includes("auto") ||
    text.includes("motor") ||
    text.includes("garage") ||
    text.includes("repair") ||
    text.includes("wheel")
  ) {
    return "automotive";
  }

  if (
    text.includes("hotel") ||
    text.includes("resort") ||
    text.includes("stay") ||
    text.includes("inn") ||
    text.includes("suites")
  ) {
    return "hotel";
  }

  if (
    text.includes("retail") ||
    text.includes("shop") ||
    text.includes("store") ||
    text.includes("fashion") ||
    text.includes("boutique") ||
    text.includes("market")
  ) {
    return "retail";
  }

  return "gym"; // Default to gym (reference style) if unknown
}

/**
 * High-definition Vector Business Logo Emblems
 * Rendered at exact coordinates for both large header display and mini QR code center
 */
export default function BusinessLogoEmblems({
  type,
  category = "",
  businessName = "",
  logoUrl,
  primaryColor = "#063F32",
  accentColor = "#8AC240",
  size = 180,
  isMini = false,
  className = "",
}: LogoEmblemProps) {
  // 1. If custom logo image URL is provided, display it
  if (logoUrl && logoUrl.trim().length > 0) {
    if (isMini) {
      return (
        <image
          href={logoUrl}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
          className={className}
        />
      );
    }
    return (
      <g className={className}>
        <image
          href={logoUrl}
          x={-size / 2}
          y={-size / 4}
          width={size}
          height={size / 2}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }

  // 2. Determine emblem type
  const emblemType: LogoEmblemType =
    (type as LogoEmblemType) || inferEmblemType(category, businessName);

  // Mini mode (inside QR code center)
  if (isMini) {
    return renderMiniEmblem(emblemType, primaryColor, accentColor);
  }

  // Full header emblem mode
  switch (emblemType) {
    case "gym":
      return <GymDumbbellEmblem accentColor={accentColor} />;
    case "salon":
      return <SalonBeautyEmblem accentColor={accentColor} />;
    case "restaurant":
      return <RestaurantDiningEmblem accentColor={accentColor} />;
    case "healthcare":
      return <HealthcareClinicEmblem accentColor={accentColor} />;
    case "automotive":
      return <AutomotiveCarEmblem accentColor={accentColor} />;
    case "hotel":
      return <HotelLuxuryEmblem accentColor={accentColor} />;
    case "retail":
      return <RetailShoppingEmblem accentColor={accentColor} />;
    case "crest":
    default:
      return (
        <MonogramCrestEmblem
          businessName={businessName}
          accentColor={accentColor}
        />
      );
  }
}

/**
 * GYM & FITNESS DUMBBELL EMBLEM (Exact match to reference image)
 * Features wide barbell shaft, grip rings, dual rounded vertical weight plates,
 * and collar clips in crisp white and lime accent.
 */
export function GymDumbbellEmblem({
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Central Barbell Shaft */}
      <rect
        x="-32"
        y="-3.5"
        width="64"
        height="7"
        rx="3.5"
        fill="#FFFFFF"
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
      />

      {/* Center Knurling Grips */}
      <rect x="-14" y="-4.5" width="4" height="9" rx="1.5" fill={accentColor} />
      <rect x="10" y="-4.5" width="4" height="9" rx="1.5" fill={accentColor} />

      {/* --- LEFT WEIGHT PLATES --- */}
      {/* Inner collar clamp */}
      <rect x="-35" y="-7" width="3.5" height="14" rx="1.5" fill={accentColor} />

      {/* Main Heavy Weight Plate (Large Inner) */}
      <rect
        x="-45"
        y="-22"
        width="8"
        height="44"
        rx="3.5"
        fill="#FFFFFF"
      />
      <rect
        x="-43"
        y="-18"
        width="4"
        height="36"
        rx="2"
        fill={accentColor}
        opacity="0.85"
      />

      {/* Outer Weight Plate (Slightly Smaller) */}
      <rect
        x="-55"
        y="-17"
        width="7"
        height="34"
        rx="3"
        fill="#FFFFFF"
      />

      {/* Outer Cap Bar End */}
      <rect x="-60" y="-5" width="5" height="10" rx="2" fill="#FFFFFF" />

      {/* --- RIGHT WEIGHT PLATES --- */}
      {/* Inner collar clamp */}
      <rect x="31.5" y="-7" width="3.5" height="14" rx="1.5" fill={accentColor} />

      {/* Main Heavy Weight Plate (Large Inner) */}
      <rect
        x="37"
        y="-22"
        width="8"
        height="44"
        rx="3.5"
        fill="#FFFFFF"
      />
      <rect
        x="39"
        y="-18"
        width="4"
        height="36"
        rx="2"
        fill={accentColor}
        opacity="0.85"
      />

      {/* Outer Weight Plate (Slightly Smaller) */}
      <rect
        x="48"
        y="-17"
        width="7"
        height="34"
        rx="3"
        fill="#FFFFFF"
      />

      {/* Outer Cap Bar End */}
      <rect x="55" y="-5" width="5" height="10" rx="2" fill="#FFFFFF" />
    </g>
  );
}

/**
 * SALON & BEAUTY EMBLEM
 */
export function SalonBeautyEmblem({
  accentColor = "#D9A441",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Left Scissor Blade */}
      <path
        d="M -16 18 C -22 18, -26 12, -26 6 C -26 0, -20 -4, -14 -4 C -8 -4, -4 0, 0 8 L 24 -20 L 28 -18 L 4 12 C 6 16, 2 22, -6 22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Right Scissor Blade */}
      <path
        d="M -16 -18 C -22 -18, -26 -12, -26 -6 C -26 0, -20 4, -14 4 C -8 4, -4 0, 0 -8 L 24 20 L 28 18 L 4 -12 C 6 -16, 2 -22, -6 -22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Pivot Screw */}
      <circle cx="2" cy="0" r="3.5" fill={accentColor} />
      {/* Sparkle Glint */}
      <polygon points="34,-14 36,-6 44,-4 36,-2 34,6 32,-2 24,-4 32,-6" fill={accentColor} />
    </g>
  );
}

/**
 * RESTAURANT & DINING EMBLEM
 */
export function RestaurantDiningEmblem({
  accentColor = "#D9A441",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Chef Hat / Cloche Dome */}
      <path
        d="M -22 6 C -30 2, -30 -14, -18 -18 C -14 -28, 14 -28, 18 -18 C 30 -14, 30 2, 22 6 Z"
        fill="#FFFFFF"
      />
      <rect x="-22" y="8" width="44" height="6" rx="2" fill={accentColor} />
      {/* Fork & Knife crossed below */}
      <line x1="-24" y1="18" x2="24" y2="18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="18" r="4" fill={accentColor} />
    </g>
  );
}

/**
 * HEALTHCARE & MEDICAL EMBLEM
 */
export function HealthcareClinicEmblem({
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Clean Stethoscope Heart Shape */}
      <path
        d="M 0 16 C -18 4, -26 -8, -14 -18 C -4 -24, 0 -14, 0 -14 C 0 -14, 4 -24, 14 -18 C 26 -8, 18 4, 0 16 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Center Medical Cross */}
      <rect x="-4" y="-8" width="8" height="16" rx="2" fill={accentColor} />
      <rect x="-8" y="-4" width="16" height="8" rx="2" fill={accentColor} />
    </g>
  );
}

/**
 * AUTOMOTIVE EMBLEM
 */
export function AutomotiveCarEmblem({
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Car Silhouette Front View */}
      <path
        d="M -24 8 L -18 -12 C -16 -18, 16 -18, 18 -12 L 24 8 C 26 12, 24 16, 18 16 L -18 16 C -24 16, -26 12, -24 8 Z"
        fill="#FFFFFF"
      />
      {/* Windshield */}
      <path d="M -14 -10 L -12 -3 L 12 -3 L 14 -10 Z" fill={accentColor} />
      {/* Headlights */}
      <circle cx="-16" cy="8" r="3.5" fill={accentColor} />
      <circle cx="16" cy="8" r="3.5" fill={accentColor} />
    </g>
  );
}

/**
 * HOTEL & LUXURY EMBLEM
 */
export function HotelLuxuryEmblem({
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Imperial 5-Point Crown */}
      <path
        d="M -26 10 L -28 -10 L -14 0 L 0 -16 L 14 0 L 28 -10 L 26 10 Z"
        fill="#FFFFFF"
      />
      <rect x="-26" y="12" width="52" height="5" rx="2" fill={accentColor} />
      <circle cx="0" cy="-18" r="2.5" fill={accentColor} />
      <circle cx="-28" cy="-12" r="2.5" fill={accentColor} />
      <circle cx="28" cy="-12" r="2.5" fill={accentColor} />
    </g>
  );
}

/**
 * RETAIL & SHOPPING EMBLEM
 */
export function RetailShoppingEmblem({
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Shopping Bag Handle */}
      <path
        d="M -10 -4 C -10 -16, 10 -16, 10 -4"
        fill="none"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Shopping Bag Body */}
      <path
        d="M -18 -4 L 18 -4 L 22 18 L -22 18 Z"
        fill="#FFFFFF"
        rx="2"
      />
      {/* Accent Star inside bag */}
      <polygon points="0,2 2,7 8,7 3,11 5,16 0,13 -5,16 -3,11 -8,7 -2,7" fill={accentColor} />
    </g>
  );
}

/**
 * MONOGRAM CREST EMBLEM
 */
export function MonogramCrestEmblem({
  businessName = "RV",
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  businessName?: string;
  accentColor?: string;
  scale?: number;
}) {
  const initials = businessName
    ? businessName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "RV";

  return (
    <g transform={`scale(${scale})`}>
      <circle cx="0" cy="0" r="20" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="0" cy="0" r="16" fill={accentColor} opacity="0.3" />
      <text
        x="0"
        y="6"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="1"
      >
        {initials}
      </text>
    </g>
  );
}

/**
 * Helper to render mini emblem inside QR code center badge
 */
function renderMiniEmblem(
  type: LogoEmblemType,
  primaryColor: string,
  accentColor: string
) {
  switch (type) {
    case "gym":
      return (
        <g transform="scale(0.55)">
          <rect x="-18" y="-2.5" width="36" height="5" rx="2" fill={primaryColor} />
          <rect x="-24" y="-12" width="6" height="24" rx="2" fill={primaryColor} />
          <rect x="-30" y="-8" width="5" height="16" rx="2" fill={primaryColor} />
          <rect x="18" y="-12" width="6" height="24" rx="2" fill={primaryColor} />
          <rect x="25" y="-8" width="5" height="16" rx="2" fill={primaryColor} />
          <circle cx="0" cy="0" r="2.5" fill={accentColor} />
        </g>
      );
    case "salon":
      return (
        <g transform="scale(0.55)">
          <path
            d="M -12 12 L 12 -12 M -12 -12 L 12 12"
            stroke={primaryColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="3" fill={accentColor} />
        </g>
      );
    case "restaurant":
      return (
        <g transform="scale(0.55)">
          <path
            d="M -10 -12 C -10 0, 0 12, 0 12 C 0 12, 10 0, 10 -12 Z"
            fill={primaryColor}
          />
          <circle cx="0" cy="-6" r="3" fill={accentColor} />
        </g>
      );
    case "healthcare":
      return (
        <g transform="scale(0.55)">
          <rect x="-4" y="-12" width="8" height="24" rx="2" fill={primaryColor} />
          <rect x="-12" y="-4" width="24" height="8" rx="2" fill={primaryColor} />
        </g>
      );
    case "automotive":
      return (
        <g transform="scale(0.55)">
          <circle cx="0" cy="0" r="12" fill="none" stroke={primaryColor} strokeWidth="3" />
          <circle cx="0" cy="0" r="4" fill={accentColor} />
        </g>
      );
    case "hotel":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,-12 4,-3 14,-3 6,3 9,12 0,6 -9,12 -6,3 -14,-3 -4,-3" fill={primaryColor} />
        </g>
      );
    case "retail":
    case "crest":
    default:
      return (
        <g transform="scale(0.55)">
          <circle cx="0" cy="0" r="12" fill={primaryColor} />
          <circle cx="0" cy="0" r="4" fill={accentColor} />
        </g>
      );
  }
}
