"use client";

import React from "react";
import type { StandeeColors } from "@/lib/types";

export interface NfcCardArtworkProps {
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  qrDataUrl: string;
  colors: StandeeColors;
  side: "front" | "back";
  reviewUrl: string;
  id?: string;
}

/**
 * Standard CR80 PVC Smart NFC Review Card Artwork.
 * Dimensions: 85.6mm × 53.98mm (standard credit/debit card format).
 * Native SVG canvas viewBox: 1011 × 638 (matching 300 DPI print resolution).
 */
export default function NfcCardArtwork({
  businessName,
  tagline = "CUSTOMER EXPERIENCE",
  logoUrl,
  qrDataUrl,
  colors,
  side,
  reviewUrl,
  id = "nfc-card-artwork",
}: NfcCardArtworkProps) {
  const primary = colors.primary || "#063F32";
  const secondary = colors.secondary || "#12805A";
  const accent = colors.accent || "#D9A441";
  const bg = colors.background || "#FFFFFF";
  const textColor = colors.text || "#17211D";

  const initials = businessName
    ? businessName
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "RV";

  if (side === "front") {
    return (
      <svg
        id={id}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1011 638"
        className="w-full h-auto block select-none"
        style={{ aspectRatio: "1011 / 638" }}
      >
        <defs>
          {/* Card background gradient */}
          <linearGradient id={`${id}-front-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="55%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>

          {/* Accent gold gradient */}
          <linearGradient id={`${id}-accent-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#FFF2B2" />
          </linearGradient>

          {/* Subtle noise/mesh overlay */}
          <radialGradient id={`${id}-glow`} cx="75%" cy="30%" r="60%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </radialGradient>

          {/* Gold EMV Chip gradient */}
          <linearGradient id={`${id}-chip`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D77F" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA7A1E" />
          </linearGradient>

          <clipPath id={`${id}-card-corner`}>
            <rect x="0" y="0" width="1011" height="638" rx="38" ry="38" />
          </clipPath>
        </defs>

        {/* Card Body */}
        <g clipPath={`url(#${id}-card-corner)`}>
          {/* Base fill */}
          <rect x="0" y="0" width="1011" height="638" fill={`url(#${id}-front-bg)`} />
          <rect x="0" y="0" width="1011" height="638" fill={`url(#${id}-glow)`} />

          {/* Subtle curved decorative ribbon */}
          <path
            d="M -100 638 C 300 500, 600 650, 1111 400 L 1111 638 Z"
            fill={accent}
            opacity="0.12"
          />
          <path
            d="M 600 -100 C 750 200, 850 350, 1111 450 L 1111 -100 Z"
            fill={secondary}
            opacity="0.25"
          />

          {/* Outer Border Stroke */}
          <rect
            x="2"
            y="2"
            width="1007"
            height="634"
            rx="36"
            ry="36"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            opacity="0.5"
          />

          {/* Top Bar: Business Logo + Business Name & NFC Symbol */}
          <g transform="translate(60, 56)">
            {/* Logo or Monogram */}
            {logoUrl ? (
              <image
                href={logoUrl}
                x="0"
                y="0"
                width="72"
                height="72"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <g>
                <circle cx="36" cy="36" r="36" fill={accent} opacity="0.2" />
                <circle
                  cx="36"
                  cy="36"
                  r="34"
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.5"
                />
                <text
                  x="36"
                  y="45"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                  fontSize="24"
                  letterSpacing="1"
                >
                  {initials}
                </text>
              </g>
            )}

            {/* Business Text */}
            <text
              x="92"
              y="32"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="bold"
              fontSize="30"
              letterSpacing="0.5"
            >
              {businessName.length > 24 ? businessName.slice(0, 23) + "…" : businessName}
            </text>
            <text
              x="92"
              y="58"
              fill={accent}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="600"
              fontSize="14"
              letterSpacing="2.5"
            >
              {tagline.toUpperCase()}
            </text>

            {/* Contactless / NFC Radiating Waves (Top Right) */}
            <g transform="translate(810, 0)">
              <circle cx="20" cy="36" r="6" fill={accent} />
              <path
                d="M 32 20 A 22 22 0 0 1 32 52"
                fill="none"
                stroke={accent}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 46 10 A 38 38 0 0 1 46 62"
                fill="none"
                stroke={accent}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 60 0 A 54 54 0 0 1 60 72"
                fill="none"
                stroke={accent}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>
          </g>

          {/* Center Left: Metallic Smart Chip Vector */}
          <g transform="translate(70, 210)">
            <rect
              x="0"
              y="0"
              width="96"
              height="74"
              rx="12"
              fill={`url(#${id}-chip)`}
              stroke="#8B6508"
              strokeWidth="2"
            />
            {/* Chip Circuit Cutouts */}
            <path
              d="M 0 37 L 36 37 M 60 37 L 96 37 M 48 0 L 48 24 M 48 50 L 48 74 M 28 0 C 28 24, 68 24, 68 0 M 28 74 C 28 50, 68 50, 68 74"
              fill="none"
              stroke="#8B6508"
              strokeWidth="2"
              opacity="0.8"
            />
            <rect
              x="36"
              y="24"
              width="24"
              height="26"
              rx="4"
              fill="none"
              stroke="#8B6508"
              strokeWidth="2"
            />
          </g>

          {/* Center Main: TAP PHONE HERE TO REVIEW */}
          <g transform="translate(505, 300)">
            {/* Glowing NFC Ring / Radar */}
            <circle cx="0" cy="-20" r="54" fill={accent} opacity="0.1" />
            <circle
              cx="0"
              cy="-20"
              r="46"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <circle cx="0" cy="-20" r="36" fill={accent} opacity="0.2" />

            {/* NFC Phone Icon Vector */}
            <g transform="translate(-18, -38)">
              <rect
                x="0"
                y="0"
                width="36"
                height="40"
                rx="6"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <line x1="12" y1="34" x2="24" y2="34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              {/* Waves inside phone */}
              <path
                d="M 12 12 A 8 8 0 0 1 24 12"
                fill="none"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 8 7 A 14 14 0 0 1 28 7"
                fill="none"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Pill Callout */}
            <rect
              x="-180"
              y="38"
              width="360"
              height="44"
              rx="22"
              fill={`url(#${id}-accent-grad)`}
            />
            <text
              x="0"
              y="67"
              textAnchor="middle"
              fill="#111827"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="18"
              letterSpacing="2"
            >
              TAP PHONE HERE TO REVIEW
            </text>

            <text
              x="0"
              y="106"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="500"
              fontSize="14"
              opacity="0.9"
            >
              Hold phone near card · Opens review page in seconds
            </text>
          </g>

          {/* Bottom Bar: Google 5 Stars + Brand Footer */}
          <g transform="translate(60, 520)">
            {/* Google 'G' icon badge */}
            <rect x="0" y="0" width="46" height="46" rx="10" fill="#FFFFFF" />
            <path
              d="M 23 14 C 29 14, 32 17, 34 19 L 29 24 C 27 22, 25 21, 23 21 C 18 21, 15 25, 15 29 C 15 33, 18 37, 23 37 C 27 37, 29 35, 30 32 L 23 32 L 23 26 L 37 26 C 37 34, 32 43, 23 43 C 14 43, 8 36, 8 29 C 8 21, 14 14, 23 14 Z"
              fill="#4285F4"
            />
            {/* Colored google accents */}
            <circle cx="34" cy="22" r="3" fill="#EA4335" />
            <circle cx="28" cy="38" r="3" fill="#34A853" />
            <circle cx="16" cy="36" r="3" fill="#FBBC05" />

            {/* Review on Google text */}
            <text
              x="60"
              y="22"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="bold"
              fontSize="18"
            >
              Review Us On Google
            </text>

            {/* 5 Golden Stars */}
            <g transform="translate(60, 28)">
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d="M 12 0 L 15.5 7.5 L 24 8.7 L 18 14.5 L 19.5 23 L 12 19 L 4.5 23 L 6 14.5 L 0 8.7 L 8.5 7.5 Z"
                  fill="#FFD700"
                  transform={`translate(${i * 26}, 0) scale(0.9)`}
                />
              ))}
            </g>

            {/* Card Model & Smart NFC Chip Brand Mark (Bottom Right) */}
            <g transform="translate(740, 16)">
              <rect
                x="0"
                y="0"
                width="150"
                height="28"
                rx="6"
                fill="#000000"
                opacity="0.3"
              />
              <text
                x="75"
                y="19"
                textAnchor="middle"
                fill={accent}
                fontFamily="system-ui, -apple-system, monospace"
                fontWeight="bold"
                fontSize="12"
                letterSpacing="1.5"
              >
                SMART NFC CARD
              </text>
            </g>
          </g>
        </g>
      </svg>
    );
  }

  // BACK SIDE ARTWORK
  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1011 638"
      className="w-full h-auto block select-none"
      style={{ aspectRatio: "1011 / 638" }}
    >
      <defs>
        <linearGradient id={`${id}-back-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B2228" />
          <stop offset="100%" stopColor="#0B0E11" />
        </linearGradient>

        <clipPath id={`${id}-back-corner`}>
          <rect x="0" y="0" width="1011" height="638" rx="38" ry="38" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-back-corner)`}>
        {/* Dark Sleek Base */}
        <rect x="0" y="0" width="1011" height="638" fill={`url(#${id}-back-bg)`} />

        {/* Magnetic stripe styling for ultra-realistic card look */}
        <rect x="0" y="44" width="1011" height="84" fill="#050709" />
        <rect x="0" y="44" width="1011" height="3" fill={accent} opacity="0.6" />
        <rect x="0" y="125" width="1011" height="3" fill={accent} opacity="0.6" />

        {/* Outer Border */}
        <rect
          x="2"
          y="2"
          width="1007"
          height="634"
          rx="36"
          ry="36"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          opacity="0.3"
        />

        {/* Left Side: Real Dynamic QR Code Container */}
        <g transform="translate(68, 168)">
          {/* Crisp White QR Container */}
          <rect
            x="0"
            y="0"
            width="340"
            height="340"
            rx="20"
            fill="#FFFFFF"
            filter="drop-shadow(0px 8px 24px rgba(0,0,0,0.5))"
          />

          {/* Real Dynamic QR code */}
          {qrDataUrl && (
            <image
              href={qrDataUrl}
              x="20"
              y="20"
              width="300"
              height="300"
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* Under QR helper */}
          <rect
            x="40"
            y="360"
            width="260"
            height="32"
            rx="16"
            fill={accent}
          />
          <text
            x="170"
            y="381"
            textAnchor="middle"
            fill="#111827"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="bold"
            fontSize="13"
            letterSpacing="1"
          >
            SCAN WITH CAMERA
          </text>
        </g>

        {/* Right Side: Instructions & Business Slug */}
        <g transform="translate(460, 175)">
          <text
            x="0"
            y="30"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="bold"
            fontSize="28"
            letterSpacing="0.5"
          >
            No NFC? No problem!
          </text>
          <text
            x="0"
            y="60"
            fill="#A0AEC0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16"
          >
            Scan the QR code with any smartphone camera.
          </text>

          {/* 3 Steps */}
          <g transform="translate(0, 95)">
            {/* Step 1 */}
            <circle cx="16" cy="16" r="16" fill={secondary} />
            <text x="16" y="22" textAnchor="middle" fill="#FFFFFF" fontWeight="bold" fontSize="14">
              1
            </text>
            <text x="44" y="22" fill="#FFFFFF" fontWeight="600" fontSize="16">
              Hold phone near card or scan QR code
            </text>

            {/* Step 2 */}
            <g transform="translate(0, 50)">
              <circle cx="16" cy="16" r="16" fill={secondary} />
              <text x="16" y="22" textAnchor="middle" fill="#FFFFFF" fontWeight="bold" fontSize="14">
                2
              </text>
              <text x="44" y="22" fill="#FFFFFF" fontWeight="600" fontSize="16">
                Tap the review notification link
              </text>
            </g>

            {/* Step 3 */}
            <g transform="translate(0, 100)">
              <circle cx="16" cy="16" r="16" fill={secondary} />
              <text x="16" y="22" textAnchor="middle" fill="#FFFFFF" fontWeight="bold" fontSize="14">
                3
              </text>
              <text x="44" y="22" fill="#FFFFFF" fontWeight="600" fontSize="16">
                Rate your 5-star experience!
              </text>
            </g>
          </g>

          {/* Direct link badge */}
          <g transform="translate(0, 255)">
            <rect
              x="0"
              y="0"
              width="480"
              height="44"
              rx="10"
              fill="#111827"
              stroke={accent}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x="20"
              y="28"
              fill="#E2E8F0"
              fontFamily="monospace"
              fontSize="14"
            >
              {reviewUrl.length > 50 ? reviewUrl.slice(0, 48) + "…" : reviewUrl}
            </text>
          </g>
        </g>

        {/* Footer brand strip */}
        <g transform="translate(68, 595)">
          <text
            x="0"
            y="0"
            fill="#718096"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="12"
          >
            Powered by Reviewly Smart NFC Experience · ISO/IEC 14443 Type A NFC
          </text>
        </g>
      </g>
    </svg>
  );
}
