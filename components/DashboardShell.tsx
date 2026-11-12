"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import CopyButton from "./CopyButton";
import {
  ArrowUpRightIcon,
  CloseIcon,
  ClockIcon,
  CreditCardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "./Icons";
import { getSubscriptionHealth } from "@/lib/subscriptions";
import { RenewalCountdownBadge, RenewalDateTimeValue } from "./RenewalTimeText";
import type { OrganizationSubscription } from "@/lib/types";

interface DashboardShellProps {
  orgName: string;
  userName: string;
  userEmail: string;
  isSuperAdmin?: boolean;
  subscriptionPlan?: string;
  subscription?: OrganizationSubscription | null;
  serverNowMs?: number;
  businessSlug: string | null;
  businessName: string | null;
  pendingFeedbackCount: number;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export default function DashboardShell({
  orgName,
  userName,
  userEmail,
  isSuperAdmin = false,
  subscriptionPlan = "Starter",
  subscription = null,
  serverNowMs = 0,
  businessSlug,
  businessName,
  pendingFeedbackCount,
  signOutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [subscription?.renewalDate, subscription?.status]);

  const health = subscription
    ? getSubscriptionHealth(subscription, nowMs ?? serverNowMs)
    : null;
  const effectiveStatus = health?.effectiveStatus ?? "active";
  const isLive = health ? health.isUsable : true;
  const isExpired = health?.expired ?? false;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navItems = [
    { href: "/app", label: "Overview", icon: LayoutGridIcon, exact: true },
    {
      href: "/app/feedback",
      label: "Private feedback",
      icon: MessageSquareIcon,
      badge: pendingFeedbackCount > 0 ? pendingFeedbackCount : null,
    },
    { href: "/app/cards", label: "Cards & QR", icon: CreditCardIcon },
    { href: "/app/settings", label: "Business settings", icon: SettingsIcon },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const publicPath = businessSlug ? `/r/${businessSlug}` : null;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" aria-label="Reviewly home">
            <BrandMark size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-subtle"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Active Organization / Business Chip */}
        <div className="rounded-xl bg-canvas border border-black/[0.07] px-3.5 py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-ink-muted">Workspace</p>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                effectiveStatus === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : effectiveStatus === "trialing"
                  ? "bg-cobalt-50 text-cobalt-700"
                  : effectiveStatus === "past_due"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {subscriptionPlan}
              {effectiveStatus === "expired" ? " · Expired" : ""}
            </span>
          </div>
          <p className="text-sm font-semibold text-ink truncate">
            {businessName || orgName}
          </p>
          {businessName && businessName !== orgName && (
            <p className="text-xs text-ink-muted truncate">{orgName}</p>
          )}
          {subscription?.renewalDate && (
            <p
              className={`pt-1 flex items-center gap-1 text-[11px] ${
                isExpired
                  ? "text-red-700 font-medium"
                  : health?.expiringSoon
                  ? "text-amber-700 font-medium"
                  : "text-ink-muted"
              }`}
            >
              <ClockIcon size={11} className="shrink-0" />
              <span className="truncate">
                <RenewalCountdownBadge renewalDate={subscription.renewalDate} />
              </span>
            </p>
          )}
        </div>

        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between gap-2 rounded-control border border-cobalt-200 bg-cobalt-50/70 px-3 py-2 text-xs font-semibold text-cobalt-700 hover:bg-cobalt-50 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheckIcon size={15} className="text-cobalt-600" />
              <span>Super Admin Console</span>
            </span>
            <ArrowUpRightIcon size={13} />
          </Link>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`min-h-[42px] flex items-center justify-between gap-2.5 rounded-control px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-cobalt-50 text-cobalt-700 font-medium"
                    : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={17}
                    className={active ? "text-cobalt-600 shrink-0" : "text-ink-muted shrink-0"}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-cobalt-600 text-white text-[11px] font-medium tabular-nums">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-black/[0.07]">
        {publicPath && (
          <div className="rounded-xl border border-black/[0.08] bg-canvas p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-ink-secondary">
                Live review page
              </span>
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {isExpired ? "Expired" : "Paused"}
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-ink truncate">{publicPath}</p>
            <div className="flex items-center gap-1.5">
              <Link
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white border border-black/10 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle transition-colors"
              >
                <span>Open</span>
                <ArrowUpRightIcon size={13} />
              </Link>
              <CopyButton value={publicPath} label="Slug" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1.5 py-1">
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">{userName}</p>
            <p className="text-[11px] text-ink-muted truncate">{userEmail}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOutIcon size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:block w-64 shrink-0 bg-white border-r border-black/[0.08] sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="no-print lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-black/[0.08] px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="h-11 w-11 -ml-2 inline-flex items-center justify-center rounded-lg text-ink hover:bg-surface-subtle"
          >
            <MenuIcon size={20} />
          </button>
          <span className="font-display font-semibold text-sm text-ink truncate">
            {businessName || orgName}
          </span>
        </div>

        {publicPath && (
          <Link
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-canvas px-3 py-1.5 text-xs font-medium text-ink shrink-0"
          >
            <span>Live page</span>
            <ArrowUpRightIcon size={13} />
          </Link>
        )}
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-surface-dark/40 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full border-r border-black/10 shadow-elevated">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {!isLive && !isSuperAdmin && (
            <div
              role="alert"
              className="mb-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800 leading-relaxed"
            >
              {isExpired ? (
                <>
                  Your <strong>{subscriptionPlan}</strong> plan expired on{" "}
                  <strong className="font-semibold">
                    <RenewalDateTimeValue renewalDate={subscription?.renewalDate} />
                  </strong>
                  . Your customer review page is closed and workspace edits are paused until your SaaS administrator renews your plan.
                </>
              ) : (
                <>
                  Your workspace subscription ({subscriptionPlan}) is currently{" "}
                  <strong className="font-semibold">{effectiveStatus}</strong>. Profile edits, new card issuance, and public review intake are paused until reactivated by your SaaS administrator.
                </>
              )}
            </div>
          )}
          {isLive && health?.expiringSoon && !isSuperAdmin && (
            <div
              role="status"
              className="mb-6 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 leading-relaxed"
            >
              Your <strong>{subscriptionPlan}</strong> plan renews / expires on{" "}
              <strong className="font-semibold">
                <RenewalDateTimeValue renewalDate={subscription?.renewalDate} />
              </strong>{" "}
              (<RenewalCountdownBadge renewalDate={subscription?.renewalDate} />). Renew on time to keep your customer review page live.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

