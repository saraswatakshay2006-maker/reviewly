"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Business, StandeeDesign, StandeeTheme, ReviewCard } from "@/lib/types";
import StandeeDesignerClient from "./StandeeDesignerClient";
import NfcCardStudio from "./NfcCardStudio";
import CardsStudioClient from "./CardsStudioClient";
import {
  CreditCardIcon,
  SparklesIcon,
  QrCodeIcon,
} from "./Icons";

export type CardTab = "card" | "standee" | "tokens";

export default function CardsHubClient({
  business,
  initialDesign,
  themes,
  cards,
  appUrl,
  initialTab = "card",
}: {
  business: Business;
  initialDesign: StandeeDesign;
  themes: StandeeTheme[];
  cards: ReviewCard[];
  appUrl: string;
  initialTab?: CardTab;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as CardTab | null;
  const [activeTab, setActiveTab] = useState<CardTab>(
    tabParam === "standee" || tabParam === "tokens" || tabParam === "card"
      ? tabParam
      : initialTab
  );

  useEffect(() => {
    if (tabParam && (tabParam === "standee" || tabParam === "tokens" || tabParam === "card")) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: CardTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeCards = cards.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Visual Navigation Tabs */}
      <div className="no-print border-b border-black/[0.09] pb-px">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Card Studio Sections">
          <button
            type="button"
            onClick={() => handleTabChange("card")}
            className={`group inline-flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === "card"
                ? "border-cobalt-600 text-cobalt-600 font-semibold"
                : "border-transparent text-ink-secondary hover:text-ink hover:border-black/20"
            }`}
          >
            <CreditCardIcon size={16} />
            <span>Smart NFC Review Card</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                activeTab === "card"
                  ? "bg-cobalt-100 text-cobalt-700"
                  : "bg-surface-subtle text-ink-muted"
              }`}
            >
              PVC CR80
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("standee")}
            className={`group inline-flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === "standee"
                ? "border-cobalt-600 text-cobalt-600 font-semibold"
                : "border-transparent text-ink-secondary hover:text-ink hover:border-black/20"
            }`}
          >
            <SparklesIcon size={16} />
            <span>A6 Tabletop Standee</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                activeTab === "standee"
                  ? "bg-cobalt-100 text-cobalt-700"
                  : "bg-surface-subtle text-ink-muted"
              }`}
            >
              105 × 148 mm
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("tokens")}
            className={`group inline-flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeTab === "tokens"
                ? "border-cobalt-600 text-cobalt-600 font-semibold"
                : "border-transparent text-ink-secondary hover:text-ink hover:border-black/20"
            }`}
          >
            <QrCodeIcon size={16} />
            <span>Hardware Tokens & Setup</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                activeTab === "tokens"
                  ? "bg-cobalt-100 text-cobalt-700"
                  : "bg-surface-subtle text-ink-muted"
              }`}
            >
              {activeCards} active
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "card" && (
        <NfcCardStudio
          business={business}
          themes={themes}
          appUrl={appUrl}
        />
      )}

      {activeTab === "standee" && (
        <StandeeDesignerClient
          business={business}
          initialDesign={initialDesign}
          themes={themes}
          appUrl={appUrl}
        />
      )}

      {activeTab === "tokens" && (
        <CardsStudioClient
          business={business}
          cards={cards}
          appUrl={appUrl}
        />
      )}
    </div>
  );
}
