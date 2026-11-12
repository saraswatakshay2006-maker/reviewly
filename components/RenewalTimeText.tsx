"use client";

import { useEffect, useState } from "react";
import {
  formatSubscriptionCountdown,
  parseRenewalTimestamp,
} from "@/lib/subscriptions";

function formatUtcFallback(ts: number): string {
  return (
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(ts)) + " UTC"
  );
}

function formatLocalDateTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts));
}

export function RenewalDateTimeValue({
  renewalDate,
  fallback = "No expiry date set",
  className = "",
}: {
  renewalDate: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const ts = parseRenewalTimestamp(renewalDate);
  if (ts === null) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <time
      dateTime={new Date(ts).toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {mounted ? formatLocalDateTime(ts) : formatUtcFallback(ts)}
    </time>
  );
}

export function RenewalCountdownBadge({
  renewalDate,
  gracePeriodDays = 0,
  className = "",
}: {
  renewalDate: string | null | undefined;
  gracePeriodDays?: number;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [renewalDate]);

  if (nowMs === null) {
    const ts = parseRenewalTimestamp(renewalDate);
    return (
      <span className={className}>
        {ts === null ? "No fixed expiry date" : "Checking renewal time…"}
      </span>
    );
  }

  const { countdownLabel } = formatSubscriptionCountdown(
    renewalDate,
    nowMs,
    gracePeriodDays
  );
  return <span className={className}>{countdownLabel}</span>;
}

