import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "400 700",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "400 600",
  variable: "--font-mono",
  display: "swap",
});

const hostGrotesk = localFont({
  src: "./fonts/host-grotesk-latin.woff2",
  weight: "400 700",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reviewly — Customer Trust & Experience Technology",
  description:
    "NFC and QR customer review infrastructure with zero gating, official Google link routing, private feedback, and transparent analytics.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F7F9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${hostGrotesk.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
