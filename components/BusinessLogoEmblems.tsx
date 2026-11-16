"use client";

import React from "react";
import {
  type LogoEmblemType,
  type EmblemCatalogItem,
  ALL_LOGO_EMBLEMS,
  getBusinessInitials,
  getBusinessHash,
  inferEmblemType,
} from "@/lib/logoEmblems";

export * from "@/lib/logoEmblems";

export interface LogoEmblemProps {
  type?: LogoEmblemType | string;
  category?: string;
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  size?: number;
  isMini?: boolean;
  className?: string;
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
  let resolvedType: LogoEmblemType =
    (type as LogoEmblemType) || inferEmblemType(category, businessName);

  if (resolvedType === "crest") {
    resolvedType = "universal_crest";
  }

  // Mini mode (inside QR code center)
  if (isMini) {
    return renderMiniEmblem(resolvedType, businessName, primaryColor, accentColor);
  }

  // Full header emblem mode
  switch (resolvedType) {
    case "gym":
      return <GymDumbbellEmblem accentColor={accentColor} />;
    case "dental":
      return <DentalToothEmblem accentColor={accentColor} />;
    case "healthcare":
      return <HealthcareClinicEmblem accentColor={accentColor} />;
    case "legal":
      return <LegalJusticeEmblem accentColor={accentColor} />;
    case "restaurant":
      return <RestaurantDiningEmblem accentColor={accentColor} />;
    case "cafe":
      return <CafeCoffeeEmblem accentColor={accentColor} />;
    case "bakery":
      return <BakeryArtisanEmblem accentColor={accentColor} />;
    case "salon":
      return <SalonBeautyEmblem accentColor={accentColor} />;
    case "spa":
      return <SpaLotusEmblem accentColor={accentColor} />;
    case "tech":
      return <TechMatrixEmblem accentColor={accentColor} />;
    case "realestate":
      return <RealEstateRoofEmblem accentColor={accentColor} />;
    case "finance":
      return <FinancePillarEmblem accentColor={accentColor} />;
    case "automotive":
      return <AutomotiveCarEmblem accentColor={accentColor} />;
    case "hotel":
      return <HotelLuxuryEmblem accentColor={accentColor} />;
    case "retail":
      return <RetailShoppingEmblem accentColor={accentColor} />;
    case "jewelry":
      return <JewelryDiamondEmblem accentColor={accentColor} />;
    case "pet":
      return <PetPawEmblem accentColor={accentColor} />;
    case "cleaning":
      return <CleaningShineEmblem accentColor={accentColor} />;
    case "photography":
      return <PhotographyLensEmblem accentColor={accentColor} />;
    case "construction":
      return <ConstructionCompassEmblem accentColor={accentColor} />;
    case "education":
      return <EducationGradEmblem accentColor={accentColor} />;
    case "travel":
      return <TravelCompassEmblem accentColor={accentColor} />;
    case "music":
      return <MusicSoundEmblem accentColor={accentColor} />;
    case "security":
      return <SecurityShieldEmblem accentColor={accentColor} />;
    case "universal_shield":
      return <UniversalShieldEmblem businessName={businessName} accentColor={accentColor} />;
    case "universal_star":
      return <UniversalStarEmblem businessName={businessName} accentColor={accentColor} />;
    case "universal_hexagon":
      return <UniversalHexagonEmblem businessName={businessName} accentColor={accentColor} />;
    case "universal_crest":
    default:
      return <UniversalCrestEmblem businessName={businessName} accentColor={accentColor} />;
  }
}

/* =================================================================== */
/* 1. GYM & FITNESS DUMBBELL EMBLEM (Exact Reference Photo Match)      */
/* =================================================================== */
export function GymDumbbellEmblem({
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <rect
        x="-32"
        y="-3.5"
        width="64"
        height="7"
        rx="3.5"
        fill="#FFFFFF"
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
      />
      <rect x="-14" y="-4.5" width="4" height="9" rx="1.5" fill={accentColor} />
      <rect x="10" y="-4.5" width="4" height="9" rx="1.5" fill={accentColor} />
      {/* Left Plates */}
      <rect x="-35" y="-7" width="3.5" height="14" rx="1.5" fill={accentColor} />
      <rect x="-45" y="-22" width="8" height="44" rx="3.5" fill="#FFFFFF" />
      <rect x="-43" y="-18" width="4" height="36" rx="2" fill={accentColor} opacity="0.85" />
      <rect x="-55" y="-17" width="7" height="34" rx="3" fill="#FFFFFF" />
      <rect x="-60" y="-5" width="5" height="10" rx="2" fill="#FFFFFF" />
      {/* Right Plates */}
      <rect x="31.5" y="-7" width="3.5" height="14" rx="1.5" fill={accentColor} />
      <rect x="37" y="-22" width="8" height="44" rx="3.5" fill="#FFFFFF" />
      <rect x="39" y="-18" width="4" height="36" rx="2" fill={accentColor} opacity="0.85" />
      <rect x="48" y="-17" width="7" height="34" rx="3" fill="#FFFFFF" />
      <rect x="55" y="-5" width="5" height="10" rx="2" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 2. DENTAL TOOTH EMBLEM (Crown, Roots, Sparkle Glint)                 */
/* =================================================================== */
export function DentalToothEmblem({
  accentColor = "#38BDF8",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Tooth Body Outline & Fill */}
      <path
        d="M -18 -18 C -26 -12, -26 6, -16 20 C -12 26, -6 26, -5 14 C -4 4, 4 4, 5 14 C 6 26, 12 26, 16 20 C 26 6, 26 -12, 18 -18 C 10 -24, -10 -24, -18 -18 Z"
        fill="#FFFFFF"
      />
      {/* Enamel Contour Line */}
      <path
        d="M -12 -12 C -6 -16, 6 -16, 12 -12"
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Center Shine Ring */}
      <ellipse cx="0" cy="0" rx="4" ry="7" fill={accentColor} opacity="0.75" />
      {/* Sparkle Glint */}
      <polygon points="26,-18 28,-12 34,-10 28,-8 26,-2 24,-8 18,-10 24,-12" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 3. HEALTHCARE & MEDICAL EMBLEM                                      */
/* =================================================================== */
export function HealthcareClinicEmblem({
  accentColor = "#EF4444",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M 0 16 C -18 4, -26 -8, -14 -18 C -4 -24, 0 -14, 0 -14 C 0 -14, 4 -24, 14 -18 C 26 -8, 18 4, 0 16 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="-4" y="-8" width="8" height="16" rx="2" fill={accentColor} />
      <rect x="-8" y="-4" width="16" height="8" rx="2" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 4. LEGAL & LAW SCALES OF JUSTICE                                    */
/* =================================================================== */
export function LegalJusticeEmblem({
  accentColor = "#D9A441",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Central Column & Finial */}
      <circle cx="0" cy="-22" r="3.5" fill={accentColor} />
      <line x1="0" y1="-20" x2="0" y2="18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <rect x="-14" y="16" width="28" height="4" rx="2" fill={accentColor} />
      {/* Cross Beam */}
      <line x1="-26" y1="-14" x2="26" y2="-14" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      {/* Left Pan */}
      <line x1="-26" y1="-14" x2="-32" y2="0" stroke={accentColor} strokeWidth="1.5" />
      <line x1="-26" y1="-14" x2="-20" y2="0" stroke={accentColor} strokeWidth="1.5" />
      <path d="M -34 0 Q -26 8 -18 0 Z" fill="#FFFFFF" />
      {/* Right Pan */}
      <line x1="26" y1="-14" x2="20" y2="0" stroke={accentColor} strokeWidth="1.5" />
      <line x1="26" y1="-14" x2="32" y2="0" stroke={accentColor} strokeWidth="1.5" />
      <path d="M 18 0 Q 26 8 34 0 Z" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 5. RESTAURANT & DINING EMBLEM                                       */
/* =================================================================== */
export function RestaurantDiningEmblem({
  accentColor = "#F59E0B",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Cloche Dome */}
      <path
        d="M -22 6 C -30 2, -30 -14, -18 -18 C -14 -28, 14 -28, 18 -18 C 30 -14, 30 2, 22 6 Z"
        fill="#FFFFFF"
      />
      <rect x="-22" y="8" width="44" height="5" rx="2" fill={accentColor} />
      <line x1="-20" y1="17" x2="20" y2="17" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="17" r="3.5" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 6. CAFE & COFFEE EMBLEM                                             */
/* =================================================================== */
export function CafeCoffeeEmblem({
  accentColor = "#D97706",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Coffee Cup Body */}
      <path
        d="M -16 -4 L 16 -4 L 13 14 C 13 18, -13 18, -13 14 Z"
        fill="#FFFFFF"
      />
      {/* Handle */}
      <path
        d="M 16 -1 C 24 -1, 24 10, 14 10"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Saucer */}
      <rect x="-20" y="18" width="40" height="4" rx="2" fill={accentColor} />
      {/* Steam Wisps */}
      <path
        d="M -7 -8 Q -10 -14 -6 -20"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 0 -8 Q -3 -16 1 -22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 7 -8 Q 4 -14 8 -20"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/* =================================================================== */
/* 7. BAKERY ARTISAN EMBLEM                                            */
/* =================================================================== */
export function BakeryArtisanEmblem({
  accentColor = "#FBBF24",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Bread Loaf & Croissant Dome */}
      <ellipse cx="0" cy="2" rx="24" ry="14" fill="#FFFFFF" />
      {/* Artisan Slits */}
      <path d="M -12 -3 Q -10 5 -7 7" stroke={accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 0 -5 Q 0 5 0 7" stroke={accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 12 -3 Q 10 5 7 7" stroke={accentColor} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Wheat Sprig Accent */}
      <path d="M -22 -16 Q -12 -12 0 -18 Q 12 -12 22 -16" stroke={accentColor} strokeWidth="2.5" fill="none" />
    </g>
  );
}

/* =================================================================== */
/* 8. SALON & BEAUTY EMBLEM                                            */
/* =================================================================== */
export function SalonBeautyEmblem({
  accentColor = "#F472B6",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M -16 18 C -22 18, -26 12, -26 6 C -26 0, -20 -4, -14 -4 C -8 -4, -4 0, 0 8 L 24 -20 L 28 -18 L 4 12 C 6 16, 2 22, -6 22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M -16 -18 C -22 -18, -26 -12, -26 -6 C -26 0, -20 4, -14 4 C -8 4, -4 0, 0 -8 L 24 20 L 28 18 L 4 -12 C 6 -16, 2 -22, -6 -22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="2" cy="0" r="3.5" fill={accentColor} />
      <polygon points="34,-14 36,-6 44,-4 36,-2 34,6 32,-2 24,-4 32,-6" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 9. SPA & WELLNESS LOTUS EMBLEM                                      */
/* =================================================================== */
export function SpaLotusEmblem({
  accentColor = "#34D399",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Center Lotus Petal */}
      <path d="M 0 -22 C -8 -8, -8 8, 0 16 C 8 8, 8 -8, 0 -22 Z" fill="#FFFFFF" />
      {/* Left Petal */}
      <path d="M -3 14 C -16 12, -26 0, -18 -12 C -14 -2, -6 6, -3 14 Z" fill={accentColor} opacity="0.9" />
      {/* Right Petal */}
      <path d="M 3 14 C 16 12, 26 0, 18 -12 C 14 -2, 6 6, 3 14 Z" fill={accentColor} opacity="0.9" />
      {/* Water Droplet Base */}
      <circle cx="0" cy="22" r="3" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 10. TECH & IT MATRIX EMBLEM                                         */
/* =================================================================== */
export function TechMatrixEmblem({
  accentColor = "#38BDF8",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Isometric Cube */}
      <polygon points="0,-22 22,-10 0,2 -22,-10" fill="#FFFFFF" opacity="0.95" />
      <polygon points="0,2 22,-10 22,14 0,26" fill={accentColor} opacity="0.9" />
      <polygon points="0,2 -22,-10 -22,14 0,26" fill="#FFFFFF" opacity="0.7" />
      {/* Core Circuit Center Node */}
      <circle cx="0" cy="2" r="3.5" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 11. REAL ESTATE ROOFLINE EMBLEM                                     */
/* =================================================================== */
export function RealEstateRoofEmblem({
  accentColor = "#F59E0B",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Pitched Roof Gable */}
      <path
        d="M -26 2 L 0 -18 L 26 2 L 20 2 L 0 -12 L -20 2 Z"
        fill="#FFFFFF"
      />
      {/* Chimney */}
      <rect x="12" y="-14" width="5" height="10" fill={accentColor} />
      {/* Modern Building / Front Door */}
      <rect x="-14" y="2" width="28" height="18" fill="#FFFFFF" rx="2" />
      <rect x="-4" y="8" width="8" height="12" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 12. FINANCE & ACCOUNTING PILLAR EMBLEM                              */
/* =================================================================== */
export function FinancePillarEmblem({
  accentColor = "#10B981",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Pediment Roof */}
      <polygon points="0,-20 -22,-10 22,-10" fill="#FFFFFF" />
      {/* 3 Classical Pillars */}
      <rect x="-18" y="-7" width="6" height="20" rx="1" fill="#FFFFFF" />
      <rect x="-3" y="-7" width="6" height="20" rx="1" fill={accentColor} />
      <rect x="12" y="-7" width="6" height="20" rx="1" fill="#FFFFFF" />
      {/* Pedestal Base */}
      <rect x="-24" y="15" width="48" height="5" rx="2" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 13. AUTOMOTIVE SPEED EMBLEM                                         */
/* =================================================================== */
export function AutomotiveCarEmblem({
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M -24 8 L -18 -12 C -16 -18, 16 -18, 18 -12 L 24 8 C 26 12, 24 16, 18 16 L -18 16 C -24 16, -26 12, -24 8 Z"
        fill="#FFFFFF"
      />
      <path d="M -14 -10 L -12 -3 L 12 -3 L 14 -10 Z" fill={accentColor} />
      <circle cx="-16" cy="8" r="3.5" fill={accentColor} />
      <circle cx="16" cy="8" r="3.5" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 14. HOTEL & LUXURY CROWN EMBLEM                                     */
/* =================================================================== */
export function HotelLuxuryEmblem({
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
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

/* =================================================================== */
/* 15. RETAIL & SHOPPING EMBLEM                                        */
/* =================================================================== */
export function RetailShoppingEmblem({
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M -10 -4 C -10 -16, 10 -16, 10 -4"
        fill="none"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M -18 -4 L 18 -4 L 22 18 L -22 18 Z" fill="#FFFFFF" />
      <polygon points="0,2 2,7 8,7 3,11 5,16 0,13 -5,16 -3,11 -8,7 -2,7" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 16. JEWELRY & DIAMOND GEM EMBLEM                                    */
/* =================================================================== */
export function JewelryDiamondEmblem({
  accentColor = "#67E8F9",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Brilliant Diamond Pavilion & Crown */}
      <polygon points="0,22 -24,-4 -14,-18 14,-18 24,-4" fill="#FFFFFF" />
      <polygon points="0,22 -8,-4 8,-4" fill={accentColor} opacity="0.85" />
      <polygon points="-8,-4 0,-18 8,-4" fill="#FFFFFF" opacity="0.9" />
      <line x1="-24" y1="-4" x2="24" y2="-4" stroke={accentColor} strokeWidth="2" />
    </g>
  );
}

/* =================================================================== */
/* 17. PET CARE PAW EMBLEM                                             */
/* =================================================================== */
export function PetPawEmblem({
  accentColor = "#F472B6",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Heart-shaped main metacarpal pad */}
      <path
        d="M 0 16 C -12 6, -16 -4, -8 -10 C -2 -14, 0 -6, 0 -6 C 0 -6, 2 -14, 8 -10 C 16 -4, 12 6, 0 16 Z"
        fill="#FFFFFF"
      />
      {/* 4 Toe Pads */}
      <ellipse cx="-16" cy="-12" rx="4.5" ry="6" transform="rotate(-25 -16 -12)" fill={accentColor} />
      <ellipse cx="-6" cy="-18" rx="4.5" ry="6" fill="#FFFFFF" />
      <ellipse cx="6" cy="-18" rx="4.5" ry="6" fill="#FFFFFF" />
      <ellipse cx="16" cy="-12" rx="4.5" ry="6" transform="rotate(25 16 -12)" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 18. CLEANING & SPARKLE EMBLEM                                       */
/* =================================================================== */
export function CleaningShineEmblem({
  accentColor = "#38BDF8",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Big Center Sparkle */}
      <polygon points="0,-22 4,-6 20,0 4,6 0,22 -4,6 -20,0 -4,-6" fill="#FFFFFF" />
      {/* Left Mini Sparkle */}
      <polygon points="-18,-14 -15,-7 -8,-5 -15,-3 -18,4 -21,-3 -28,-5 -21,-7" fill={accentColor} />
      {/* Right Mini Sparkle */}
      <polygon points="18,10 20,15 26,17 20,19 18,24 16,19 10,17 16,15" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 19. PHOTOGRAPHY LENS APERTURE EMBLEM                                */
/* =================================================================== */
export function PhotographyLensEmblem({
  accentColor = "#F59E0B",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <circle cx="0" cy="0" r="20" fill="none" stroke="#FFFFFF" strokeWidth="4" />
      {/* Iris Aperture Blades */}
      <circle cx="0" cy="0" r="14" fill="none" stroke={accentColor} strokeWidth="3" />
      <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
      {/* Camera Body Prism Outline */}
      <rect x="-24" y="-12" width="48" height="24" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.4" />
    </g>
  );
}

/* =================================================================== */
/* 20. CONSTRUCTION & ARCHITECTURE EMBLEM                              */
/* =================================================================== */
export function ConstructionCompassEmblem({
  accentColor = "#F97316",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Architect Compass */}
      <circle cx="0" cy="-18" r="3.5" fill={accentColor} />
      <line x1="0" y1="-18" x2="-18" y2="18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="0" y1="-18" x2="18" y2="18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="-10" y1="2" x2="10" y2="2" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

/* =================================================================== */
/* 21. EDUCATION & COACHING GRADUATION CAP                             */
/* =================================================================== */
export function EducationGradEmblem({
  accentColor = "#FBBF24",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Mortarboard Rhombus Top */}
      <polygon points="0,-18 24,-8 0,2 -24,-8" fill="#FFFFFF" />
      {/* Skull Cap Base */}
      <path d="M -14 -2 L -14 10 C -14 16, 14 16, 14 10 L 14 -2" fill="#FFFFFF" opacity="0.9" />
      {/* Tassel */}
      <path d="M 0 -8 L 18 0 L 20 14" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="15" r="2.5" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 22. TRAVEL & TOURS COMPASS ROSE                                     */
/* =================================================================== */
export function TravelCompassEmblem({
  accentColor = "#38BDF8",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <circle cx="0" cy="0" r="20" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* 4-Point Compass Star */}
      <polygon points="0,-22 4,-4 22,0 4,4 0,22 -4,4 -22,0 -4,-4" fill="#FFFFFF" />
      <polygon points="0,-22 0,0 22,0" fill={accentColor} opacity="0.8" />
      <polygon points="0,22 0,0 -22,0" fill={accentColor} opacity="0.8" />
    </g>
  );
}

/* =================================================================== */
/* 23. MUSIC & SOUND EMBLEM                                            */
/* =================================================================== */
export function MusicSoundEmblem({
  accentColor = "#A855F7",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Beamed Eighth Notes */}
      <ellipse cx="-12" cy="10" rx="6" ry="4.5" transform="rotate(-20 -12 10)" fill="#FFFFFF" />
      <ellipse cx="12" cy="4" rx="6" ry="4.5" transform="rotate(-20 12 4)" fill="#FFFFFF" />
      <line x1="-8" y1="8" x2="-8" y2="-14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="-20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <polygon points="-9,-14 17,-20 17,-14 -9,-8" fill={accentColor} />
    </g>
  );
}

/* =================================================================== */
/* 24. SECURITY & GUARD EMBLEM                                         */
/* =================================================================== */
export function SecurityShieldEmblem({
  accentColor = "#22C55E",
  scale = 1.35,
}: {
  accentColor?: string;
  scale?: number;
}) {
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M 0 -22 L 20 -14 L 20 4 C 20 16, 0 24, 0 24 C 0 24, -20 16, -20 4 L -20 -14 Z"
        fill="#FFFFFF"
      />
      {/* Central Padlock */}
      <path d="M -6 -4 C -6 -10, 6 -10, 6 -4" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
      <rect x="-8" y="-4" width="16" height="12" rx="2" fill={accentColor} />
      <circle cx="0" cy="2" r="2" fill="#FFFFFF" />
    </g>
  );
}

/* =================================================================== */
/* 25. UNIVERSAL MONOGRAM CREST (Royal Laurel Wreath & Initials)        */
/* =================================================================== */
export function UniversalCrestEmblem({
  businessName = "HQ",
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  businessName?: string;
  accentColor?: string;
  scale?: number;
}) {
  const initials = getBusinessInitials(businessName);
  return (
    <g transform={`scale(${scale})`}>
      {/* Laurel Wreath Left Side */}
      <path
        d="M -16 16 C -26 10, -28 -8, -18 -18 C -22 -10, -20 4, -10 14 Z"
        fill={accentColor}
        opacity="0.9"
      />
      {/* Laurel Wreath Right Side */}
      <path
        d="M 16 16 C 26 10, 28 -8, 18 -18 C 22 -10, 20 4, 10 14 Z"
        fill={accentColor}
        opacity="0.9"
      />
      {/* Center Royal Medallion */}
      <circle cx="0" cy="0" r="18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="0" cy="0" r="14" fill={accentColor} opacity="0.25" />
      {/* Royal 3-Star Finial */}
      <polygon points="0,-22 1.5,-18 5,-18 2,-16 3,-12 0,-14 -3,-12 -2,-16 -5,-18 -1.5,-18" fill={accentColor} />
      <text
        x="0"
        y="6"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="1"
      >
        {initials}
      </text>
    </g>
  );
}

/* =================================================================== */
/* 26. UNIVERSAL HERALDIC SHIELD (Faceted Coat of Arms & Initials)      */
/* =================================================================== */
export function UniversalShieldEmblem({
  businessName = "HQ",
  accentColor = "#38BDF8",
  scale = 1.35,
}: {
  businessName?: string;
  accentColor?: string;
  scale?: number;
}) {
  const initials = getBusinessInitials(businessName);
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M 0 -22 L 20 -14 L 20 4 C 20 16, 0 24, 0 24 C 0 24, -20 16, -20 4 L -20 -14 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 0 -20 L 18 -13 L 18 4 C 18 15, 0 22, 0 22 Z"
        fill={accentColor}
        opacity="0.85"
      />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="14"
        letterSpacing="1"
      >
        {initials}
      </text>
    </g>
  );
}

/* =================================================================== */
/* 27. UNIVERSAL 5-STAR QUALITY MEDALLION (Rope Trim & Initials)        */
/* =================================================================== */
export function UniversalStarEmblem({
  businessName = "HQ",
  accentColor = "#FFB800",
  scale = 1.35,
}: {
  businessName?: string;
  accentColor?: string;
  scale?: number;
}) {
  const initials = getBusinessInitials(businessName);
  return (
    <g transform={`scale(${scale})`}>
      <circle cx="0" cy="0" r="22" fill="#FFFFFF" />
      <circle cx="0" cy="0" r="18" fill="none" stroke={accentColor} strokeWidth="3" />
      <circle cx="0" cy="0" r="15" fill={accentColor} opacity="0.25" />
      {/* 5 Tiny Stars on Upper Arc */}
      {[-2, -1, 0, 1, 2].map((i) => {
        const rad = ((i * 24 - 90) * Math.PI) / 180;
        const x = Math.cos(rad) * 11;
        const y = Math.sin(rad) * 11;
        return <circle key={i} cx={x} cy={y} r="1.5" fill={accentColor} />;
      })}
      <text
        x="0"
        y="7"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="14"
        letterSpacing="1"
      >
        {initials}
      </text>
    </g>
  );
}

/* =================================================================== */
/* 28. UNIVERSAL GEOMETRIC HEXAGON (Tech-Forward Interlock & Initials)  */
/* =================================================================== */
export function UniversalHexagonEmblem({
  businessName = "HQ",
  accentColor = "#8AC240",
  scale = 1.35,
}: {
  businessName?: string;
  accentColor?: string;
  scale?: number;
}) {
  const initials = getBusinessInitials(businessName);
  return (
    <g transform={`scale(${scale})`}>
      <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" fill="#FFFFFF" />
      <polygon
        points="0,-18 15,-9 15,9 0,18 -15,9 -15,-9"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
      />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="14"
        letterSpacing="1"
      >
        {initials}
      </text>
    </g>
  );
}

/* =================================================================== */
/* MINI EMBLEM FOR INSIDE QR CODE CENTER (36px high-contrast badge)    */
/* =================================================================== */
function renderMiniEmblem(
  type: LogoEmblemType,
  businessName: string,
  primaryColor: string,
  accentColor: string
) {
  const initials = getBusinessInitials(businessName);

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
    case "dental":
      return (
        <g transform="scale(0.55)">
          <path
            d="M -12 -12 C -18 -8, -18 4, -12 14 C -8 18, -4 18, -3 10 C -2 3, 2 3, 3 10 C 4 18, 8 18, 12 14 C 18 4, 18 -8, 12 -12 Z"
            fill={primaryColor}
          />
          <circle cx="0" cy="0" r="3" fill={accentColor} />
        </g>
      );
    case "healthcare":
      return (
        <g transform="scale(0.55)">
          <rect x="-4" y="-14" width="8" height="28" rx="2" fill={primaryColor} />
          <rect x="-14" y="-4" width="28" height="8" rx="2" fill={primaryColor} />
          <circle cx="0" cy="0" r="3" fill={accentColor} />
        </g>
      );
    case "legal":
      return (
        <g transform="scale(0.55)">
          <line x1="-16" y1="-8" x2="16" y2="-8" stroke={primaryColor} strokeWidth="3" />
          <line x1="0" y1="-12" x2="0" y2="14" stroke={primaryColor} strokeWidth="3" />
          <circle cx="-16" cy="4" r="5" fill={accentColor} />
          <circle cx="16" cy="4" r="5" fill={accentColor} />
        </g>
      );
    case "restaurant":
      return (
        <g transform="scale(0.55)">
          <path d="M -14 4 C -18 0, -18 -12, 0 -14 C 18 -12, 18 0, 14 4 Z" fill={primaryColor} />
          <rect x="-14" y="6" width="28" height="4" rx="1" fill={accentColor} />
        </g>
      );
    case "cafe":
      return (
        <g transform="scale(0.55)">
          <path d="M -12 -2 L 12 -2 L 10 10 C 10 14, -10 14, -10 10 Z" fill={primaryColor} />
          <rect x="-14" y="14" width="28" height="3" rx="1" fill={accentColor} />
        </g>
      );
    case "bakery":
      return (
        <g transform="scale(0.55)">
          <ellipse cx="0" cy="0" rx="16" ry="10" fill={primaryColor} />
          <line x1="-6" y1="-4" x2="-6" y2="4" stroke={accentColor} strokeWidth="2" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke={accentColor} strokeWidth="2" />
          <line x1="6" y1="-4" x2="6" y2="4" stroke={accentColor} strokeWidth="2" />
        </g>
      );
    case "salon":
      return (
        <g transform="scale(0.55)">
          <path d="M -12 12 L 12 -12 M -12 -12 L 12 12" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="0" r="3" fill={accentColor} />
        </g>
      );
    case "spa":
      return (
        <g transform="scale(0.55)">
          <path d="M 0 -14 C -6 -6, -6 6, 0 12 C 6 6, 6 -6, 0 -14 Z" fill={primaryColor} />
          <circle cx="-10" cy="2" r="4" fill={accentColor} />
          <circle cx="10" cy="2" r="4" fill={accentColor} />
        </g>
      );
    case "tech":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,-16 16,-8 0,0 -16,-8" fill={primaryColor} />
          <polygon points="0,0 16,-8 16,10 0,18" fill={accentColor} />
          <polygon points="0,0 -16,-8 -16,10 0,18" fill={primaryColor} opacity="0.7" />
        </g>
      );
    case "realestate":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,-14 16,0 12,0 0,-10 -12,0 -16,0" fill={primaryColor} />
          <rect x="-10" y="0" width="20" height="14" fill={primaryColor} />
          <rect x="-3" y="4" width="6" height="10" fill={accentColor} />
        </g>
      );
    case "finance":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,-14 -16,-6 16,-6" fill={primaryColor} />
          <rect x="-12" y="-4" width="4" height="14" fill={primaryColor} />
          <rect x="-2" y="-4" width="4" height="14" fill={accentColor} />
          <rect x="8" y="-4" width="4" height="14" fill={primaryColor} />
          <rect x="-16" y="12" width="32" height="4" fill={primaryColor} />
        </g>
      );
    case "automotive":
      return (
        <g transform="scale(0.55)">
          <circle cx="0" cy="0" r="14" fill="none" stroke={primaryColor} strokeWidth="3.5" />
          <circle cx="0" cy="0" r="4" fill={accentColor} />
        </g>
      );
    case "hotel":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,-14 4,-4 14,-4 6,2 9,12 0,6 -9,12 -6,2 -14,-4 -4,-4" fill={primaryColor} />
          <circle cx="0" cy="-6" r="2.5" fill={accentColor} />
        </g>
      );
    case "jewelry":
      return (
        <g transform="scale(0.55)">
          <polygon points="0,16 -16,-2 -10,-12 10,-12 16,-2" fill={primaryColor} />
          <polygon points="0,16 -5,-2 5,-2" fill={accentColor} />
        </g>
      );
    case "pet":
      return (
        <g transform="scale(0.55)">
          <circle cx="0" cy="4" r="8" fill={primaryColor} />
          <circle cx="-10" cy="-6" r="4" fill={accentColor} />
          <circle cx="-3" cy="-10" r="4" fill={primaryColor} />
          <circle cx="4" cy="-10" r="4" fill={primaryColor} />
          <circle cx="11" cy="-6" r="4" fill={accentColor} />
        </g>
      );
    case "retail":
    case "universal_crest":
    case "universal_shield":
    case "universal_star":
    case "universal_hexagon":
    case "crest":
    default:
      return (
        <g transform="scale(0.65)">
          <circle cx="0" cy="0" r="15" fill={primaryColor} />
          <circle cx="0" cy="0" r="13" fill="none" stroke={accentColor} strokeWidth="1.5" />
          <text
            x="0"
            y="4.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="10"
            letterSpacing="0.5"
          >
            {initials}
          </text>
        </g>
      );
  }
}
