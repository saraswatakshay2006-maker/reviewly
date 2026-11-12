"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BrandMark from "./BrandMark";
import {
  ArrowUpRightIcon,
  CheckIcon,
  DownloadIcon,
  LogOutIcon,
  RefreshIcon,
  SearchIcon,
  ShieldCheckIcon,
  StarIcon,
} from "./Icons";
import {
  PLAN_DEFAULTS,
  SUBSCRIPTION_STATUSES,
  getSubscriptionHealth,
  parseRenewalTimestamp,
  type EffectiveSubscriptionStatus,
} from "@/lib/subscriptions";
import { RenewalCountdownBadge } from "./RenewalTimeText";
import type {
  OrganizationSubscription,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/types";

export interface AdminSnapshot {
  summary: {
    totalOrgs: number;
    activeOrgs: number;
    trialOrgs: number;
    pausedOrPastDueOrgs: number;
    mrrInr: number;
    totalUsers: number;
    totalBusinesses: number;
    totalCards: number;
    activeCards: number;
    totalSessions: number;
    totalGoogleClicks: number;
    totalFeedback: number;
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    subscription: OrganizationSubscription;
    users: {
      id: string;
      name: string;
      email: string;
      role: Role;
      createdAt: string;
    }[];
    businesses: {
      id: string;
      name: string;
      category: string;
      address: string;
      description: string;
      googleReviewUrl: string;
      welcomeMessage: string;
      publicSlug: string;
    }[];
    stats: {
      totalCards: number;
      activeCards: number;
      sessions: number;
      googleClicks: number;
      feedbackCount: number;
      ratingCount: number;
      averageRating: number | null;
    };
  }[];
  users: {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string;
    organizationName: string;
    createdAt: string;
  }[];
  businesses: {
    id: string;
    organizationId: string;
    organizationName: string;
    name: string;
    category: string;
    address: string;
    description: string;
    welcomeMessage: string;
    googleReviewUrl: string;
    publicSlug: string;
    createdAt: string;
  }[];
  cards: {
    id: string;
    businessId: string;
    token: string;
    status: "active" | "inactive" | "lost" | "retired";
    chipType: "NTAG213" | "NTAG215" | "QR";
    label: string;
    createdAt: string;
    businessName: string;
    businessSlug: string;
    organizationName: string;
  }[];
  feedback: {
    id: string;
    businessId: string;
    organizationId: string;
    message: string;
    rating: number | null;
    replyNote: string | null;
    createdAt: string;
    businessName: string;
    organizationName: string;
  }[];
  recentEvents: {
    id: string;
    type: string;
    rating: number | null;
    createdAt: string;
    businessName: string;
    organizationName: string;
  }[];
}

type AdminTab = "clients" | "users" | "businesses" | "activity";

const STATUS_BADGE: Record<EffectiveSubscriptionStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trialing: "bg-cobalt-50 text-cobalt-700 border-cobalt-200",
  past_due: "bg-amber-50 text-amber-800 border-amber-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-surface-subtle text-ink-muted border-black/[0.08]",
};

function toLocalDatetimeInputValue(raw: string | null | undefined): string {
  const ts = parseRenewalTimestamp(raw);
  if (ts === null) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function AdminDashboardClient({
  initialData,
  currentAdminId,
  adminName,
  adminEmail,
  signOutAction,
}: {
  initialData: AdminSnapshot;
  currentAdminId: string;
  adminName: string;
  adminEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const [data, setData] = useState<AdminSnapshot>(initialData);
  const [tab, setTab] = useState<AdminTab>("clients");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EffectiveSubscriptionStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  const reload = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json);
      }
    } catch {
      notify("err", "Could not refresh platform data.");
    } finally {
      setRefreshing(false);
    }
  };

  const q = query.trim().toLowerCase();

  const filteredOrgs = useMemo(() => {
    return data.organizations.filter((o) => {
      if (statusFilter !== "all") {
        const eff = getSubscriptionHealth(o.subscription).effectiveStatus;
        if (eff !== statusFilter && o.subscription.status !== statusFilter) {
          return false;
        }
      }
      if (!q) return true;
      const haystack = [
        o.name,
        o.slug,
        ...o.users.map((u) => `${u.name} ${u.email}`),
        ...o.businesses.map((b) => `${b.name} ${b.publicSlug} ${b.category}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data.organizations, q, statusFilter]);

  const filteredUsers = useMemo(() => {
    if (!q) return data.users;
    return data.users.filter((u) =>
      `${u.name} ${u.email} ${u.organizationName} ${u.role}`
        .toLowerCase()
        .includes(q)
    );
  }, [data.users, q]);

  const filteredBusinesses = useMemo(() => {
    if (!q) return data.businesses;
    return data.businesses.filter((b) =>
      `${b.name} ${b.category} ${b.address} ${b.publicSlug} ${b.organizationName}`
        .toLowerCase()
        .includes(q)
    );
  }, [data.businesses, q]);

  const filteredCards = useMemo(() => {
    if (!q) return data.cards;
    return data.cards.filter((c) =>
      `${c.label} ${c.token} ${c.businessName} ${c.organizationName} ${c.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [data.cards, q]);

  const filteredFeedback = useMemo(() => {
    if (!q) return data.feedback;
    return data.feedback.filter((f) =>
      `${f.message} ${f.businessName} ${f.organizationName} ${f.replyNote || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [data.feedback, q]);

  const { summary } = data;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 bg-white border-b border-black/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" aria-label="Reviewly home">
              <BrandMark size="sm" />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt-50 border border-cobalt-200 px-2.5 py-1 text-[11px] font-semibold text-cobalt-700">
              <ShieldCheckIcon size={12} />
              <span>Super Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors disabled:opacity-50"
            >
              <RefreshIcon size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/api/admin/overview?export=1"
              className="inline-flex items-center gap-1.5 rounded-control border border-black/[0.12] bg-white hover:bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors"
            >
              <DownloadIcon size={13} />
              <span className="hidden sm:inline">Export JSON</span>
            </a>

            <Link
              href="/app"
              className="hidden md:inline-flex items-center gap-1 rounded-control border border-black/[0.12] bg-canvas hover:bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink transition-colors"
            >
              <span>Workspace</span>
              <ArrowUpRightIcon size={13} />
            </Link>

            <div className="hidden lg:block text-right pl-2 border-l border-black/[0.08]">
              <p className="text-xs font-medium text-ink leading-tight">{adminName}</p>
              <p className="text-[11px] text-ink-muted leading-tight">{adminEmail}</p>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="h-9 w-9 inline-flex items-center justify-center rounded-control border border-black/[0.1] text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOutIcon size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {toast && (
          <div
            role="status"
            className={`rounded-control border px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${
              toast.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.type === "ok" && <CheckIcon size={14} />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Executive SaaS KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-card bg-white border border-black/[0.09] p-5 shadow-panel">
            <p className="text-xs font-medium text-ink-muted">Client Organizations</p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 tabular-nums">
              {summary.totalOrgs}
            </p>
            <p className="text-xs text-ink-secondary mt-1 tabular-nums">
              {summary.activeOrgs} active · {summary.trialOrgs} trial · {summary.pausedOrPastDueOrgs} flagged
            </p>
          </div>

          <div className="rounded-card bg-white border border-black/[0.09] p-5 shadow-panel">
            <p className="text-xs font-medium text-ink-muted">Monthly Recurring Revenue</p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-cobalt-700 mt-1.5 tabular-nums">
              ₹{summary.mrrInr.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-ink-secondary mt-1">
              Across active &amp; billing workspaces
            </p>
          </div>

          <div className="rounded-card bg-white border border-black/[0.09] p-5 shadow-panel">
            <p className="text-xs font-medium text-ink-muted">Businesses &amp; Cards</p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 tabular-nums">
              {summary.totalBusinesses}
            </p>
            <p className="text-xs text-ink-secondary mt-1 tabular-nums">
              {summary.activeCards} active / {summary.totalCards} total NFC &amp; QR cards
            </p>
          </div>

          <div className="rounded-card bg-white border border-black/[0.09] p-5 shadow-panel">
            <p className="text-xs font-medium text-ink-muted">SaaS Engagement</p>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1.5 tabular-nums">
              {summary.totalSessions}
            </p>
            <p className="text-xs text-ink-secondary mt-1 tabular-nums">
              {summary.totalGoogleClicks} Google clicks · {summary.totalFeedback} feedback notes
            </p>
          </div>
        </section>

        {/* Search & Tab Controls */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-card bg-white border border-black/[0.09] p-1">
            {[
              { id: "clients" as const, label: `Clients & Subscriptions (${data.organizations.length})` },
              { id: "users" as const, label: `Users (${data.users.length})` },
              { id: "businesses" as const, label: `Businesses & Cards (${data.businesses.length})` },
              { id: "activity" as const, label: `Feedback & Logs (${data.feedback.length})` },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === item.id
                    ? "bg-cobalt-600 text-white"
                    : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tab === "clients" && (
              <select
                aria-label="Filter by subscription status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | EffectiveSubscriptionStatus)
                }
                className="min-h-[38px] rounded-control border border-black/[0.12] bg-white px-3 text-xs font-medium text-ink outline-none focus:border-cobalt-600"
              >
                <option value="all">All statuses</option>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="expired">Expired</option>
              </select>
            )}

            <div className="relative flex-1 md:w-64">
              <SearchIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workspace, email, slug…"
                className="w-full min-h-[38px] rounded-control border border-black/[0.12] bg-white pl-8 pr-3 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-cobalt-600"
              />
            </div>
          </div>
        </section>

        {/* Tab 1: Clients & Subscriptions */}
        {tab === "clients" && (
          <section className="space-y-4">
            {filteredOrgs.length === 0 ? (
              <div className="rounded-card bg-white border border-black/[0.09] p-10 text-center text-sm text-ink-secondary">
                No matching client workspaces found.
              </div>
            ) : (
              filteredOrgs.map((org) => (
                <ClientOrganizationCard
                  key={org.id}
                  org={org}
                  isCurrentAdminOrg={org.users.some((u) => u.id === currentAdminId)}
                  onSaved={async (msg) => {
                    notify("ok", msg);
                    await reload();
                  }}
                  onError={(msg) => notify("err", msg)}
                />
              ))
            )}
          </section>
        )}

        {/* Tab 2: Users & Access */}
        {tab === "users" && (
          <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
                    <th className="py-3 px-4 font-medium">User</th>
                    <th className="py-3 px-4 font-medium">Workspace</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Reset Password</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06]">
                  {filteredUsers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isSelf={u.id === currentAdminId}
                      onSaved={async (msg) => {
                        notify("ok", msg);
                        await reload();
                      }}
                      onError={(msg) => notify("err", msg)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 3: Businesses & Cards */}
        {tab === "businesses" && (
          <section className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-display text-base font-semibold text-ink">
                Client Businesses ({filteredBusinesses.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredBusinesses.map((biz) => (
                  <BusinessEditorCard
                    key={biz.id}
                    biz={biz}
                    onSaved={async (msg) => {
                      notify("ok", msg);
                      await reload();
                    }}
                    onError={(msg) => notify("err", msg)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-base font-semibold text-ink">
                All Issued NFC &amp; QR Cards ({filteredCards.length})
              </h2>
              <div className="rounded-card bg-white border border-black/[0.09] overflow-hidden shadow-panel">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/[0.08] bg-canvas/70 text-ink-muted">
                        <th className="py-3 px-4 font-medium">Label</th>
                        <th className="py-3 px-4 font-medium">Business</th>
                        <th className="py-3 px-4 font-medium">Type</th>
                        <th className="py-3 px-4 font-medium">Token</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                      {filteredCards.map((c) => (
                        <CardRow
                          key={c.id}
                          card={c}
                          onSaved={async (msg) => {
                            notify("ok", msg);
                            await reload();
                          }}
                          onError={(msg) => notify("err", msg)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Feedback & Activity */}
        {tab === "activity" && (
          <section className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <h2 className="font-display text-base font-semibold text-ink">
                Private Feedback Across SaaS ({filteredFeedback.length})
              </h2>
              {filteredFeedback.length === 0 ? (
                <div className="rounded-card bg-white border border-black/[0.09] p-8 text-center text-xs text-ink-secondary">
                  No private feedback submissions recorded yet.
                </div>
              ) : (
                filteredFeedback.map((fb) => (
                  <FeedbackAdminCard
                    key={fb.id}
                    item={fb}
                    onDeleted={async (msg) => {
                      notify("ok", msg);
                      await reload();
                    }}
                    onError={(msg) => notify("err", msg)}
                  />
                ))
              )}
            </div>

            <div className="lg:col-span-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-ink">
                Latest Platform Events ({data.recentEvents.length})
              </h2>
              <div className="rounded-card bg-white border border-black/[0.09] divide-y divide-black/[0.06] overflow-hidden">
                {data.recentEvents.length === 0 ? (
                  <p className="p-6 text-xs text-ink-secondary text-center">
                    No customer events logged yet.
                  </p>
                ) : (
                  data.recentEvents.map((ev) => (
                    <div key={ev.id} className="px-4 py-3 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">
                          {ev.businessName}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate">
                          {ev.type.replace("_", " ")}
                          {ev.rating ? ` · ${ev.rating}★` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-ink-muted shrink-0">
                        {ev.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ClientOrganizationCard({
  org,
  isCurrentAdminOrg,
  onSaved,
  onError,
}: {
  org: AdminSnapshot["organizations"][number];
  isCurrentAdminOrg: boolean;
  onSaved: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>(org.subscription.plan);
  const [status, setStatus] = useState<SubscriptionStatus>(org.subscription.status);
  const [price, setPrice] = useState<number>(org.subscription.monthlyPriceInr);
  const [cardLimit, setCardLimit] = useState<number>(org.subscription.cardLimit);
  const [locationLimit, setLocationLimit] = useState<number>(
    org.subscription.locationLimit ?? PLAN_DEFAULTS[org.subscription.plan].locationLimit
  );
  const [teamLimit, setTeamLimit] = useState<number>(
    org.subscription.teamLimit ?? PLAN_DEFAULTS[org.subscription.plan].teamLimit
  );
  const [renewalDate, setRenewalDate] = useState<string>(() =>
    toLocalDatetimeInputValue(org.subscription.renewalDate)
  );
  const [notes, setNotes] = useState<string>(org.subscription.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const renewalIsoPreview = useMemo(() => {
    if (!renewalDate.trim()) return null;
    const parsed = new Date(renewalDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }, [renewalDate]);

  const health = getSubscriptionHealth({
    ...org.subscription,
    status,
    renewalDate: renewalIsoPreview,
  });

  const handlePlanChange = (nextPlan: SubscriptionPlan) => {
    setPlan(nextPlan);
    setPrice(PLAN_DEFAULTS[nextPlan].monthlyPriceInr);
    setCardLimit(PLAN_DEFAULTS[nextPlan].cardLimit);
    setLocationLimit(PLAN_DEFAULTS[nextPlan].locationLimit);
    setTeamLimit(PLAN_DEFAULTS[nextPlan].teamLimit);
  };

  const saveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let nextRenewalIso: string | null = null;
      if (renewalDate.trim()) {
        const dt = new Date(renewalDate);
        if (Number.isNaN(dt.getTime())) {
          throw new Error("Invalid renewal date & time.");
        }
        nextRenewalIso = dt.toISOString();
      }
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          status,
          monthlyPriceInr: Number(price) || 0,
          cardLimit: Math.max(1, Number(cardLimit) || 1),
          locationLimit: Math.max(1, Number(locationLimit) || 1),
          teamLimit: Math.max(1, Number(teamLimit) || 1),
          renewalDate: nextRenewalIso,
          notes: notes.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      await onSaved(`Updated subscription for ${org.name}.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const purgeOrganization = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await onSaved(`Deleted workspace ${org.name} and its data.`);
    } catch (err) {
      onError((err as Error).message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    "w-full min-h-[38px] rounded-control border border-black/[0.12] bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-5 sm:p-6 shadow-panel space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-black/[0.07]">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display text-lg font-semibold text-ink truncate">
              {org.name}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[health.effectiveStatus]}`}
            >
              {PLAN_DEFAULTS[plan].label} · {health.effectiveStatus.replace("_", " ")}
            </span>
            {renewalIsoPreview && (
              <span
                className={`text-[11px] font-medium ${
                  health.expired ? "text-red-700" : "text-ink-muted"
                }`}
              >
                <RenewalCountdownBadge renewalDate={renewalIsoPreview} />
              </span>
            )}
            {isCurrentAdminOrg && (
              <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-medium text-ink-secondary">
                Your admin workspace
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted truncate">
            Slug: <span className="font-mono">{org.slug}</span> · Owners:{" "}
            {org.users.map((u) => `${u.name} (${u.email})`).join(", ") || "None"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary tabular-nums">
          <span>
            Locations: <strong className="text-ink">{org.businesses.length}</strong>/{locationLimit}
          </span>
          <span>
            Team: <strong className="text-ink">{org.users.length}</strong>/{teamLimit}
          </span>
          <span>
            Cards: <strong className="text-ink">{org.stats.activeCards}</strong>/{cardLimit}
          </span>
          <span>
            Visits: <strong className="text-ink">{org.stats.sessions}</strong>
          </span>
          <span>
            Google clicks: <strong className="text-ink">{org.stats.googleClicks}</strong>
          </span>
          <span>
            Avg rating:{" "}
            <strong className="text-ink">
              {org.stats.averageRating !== null ? `${org.stats.averageRating}★` : "—"}
            </strong>
          </span>
          {org.businesses[0] && (
            <Link
              href={`/r/${org.businesses[0].publicSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-cobalt-600 hover:text-cobalt-700"
            >
              <span>/r/{org.businesses[0].publicSlug}</span>
              <ArrowUpRightIcon size={12} />
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={saveSubscription} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Plan
          </label>
          <select
            value={plan}
            onChange={(e) => handlePlanChange(e.target.value as SubscriptionPlan)}
            className={inputCls}
          >
            {(Object.keys(PLAN_DEFAULTS) as SubscriptionPlan[]).map((key) => (
              <option key={key} value={key}>
                {PLAN_DEFAULTS[key].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
            className={inputCls}
          >
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Price (₹ / mo)
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={`${inputCls} tabular-nums`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Card Limit
          </label>
          <input
            type="number"
            min={1}
            value={cardLimit}
            onChange={(e) => setCardLimit(Number(e.target.value))}
            className={`${inputCls} tabular-nums`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Locations Limit
          </label>
          <input
            type="number"
            min={1}
            value={locationLimit}
            onChange={(e) => setLocationLimit(Number(e.target.value))}
            className={`${inputCls} tabular-nums`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Team Accounts Limit
          </label>
          <input
            type="number"
            min={1}
            value={teamLimit}
            onChange={(e) => setTeamLimit(Number(e.target.value))}
            className={`${inputCls} tabular-nums`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Renewal / Expiry Time
          </label>
          <input
            type="datetime-local"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Billing Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paid UPI / invoice ref"
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[38px] rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save subscription"}
          </button>

          {!isCurrentAdminOrg && (
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <span className="text-[11px] font-medium text-red-700">
                    Delete org + all users/cards/feedback?
                  </span>
                  <button
                    type="button"
                    onClick={() => void purgeOrganization()}
                    disabled={deleting}
                    className="rounded-control bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Confirm purge"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-ink-muted hover:text-ink px-2 py-1"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Delete workspace
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onSaved,
  onError,
}: {
  user: AdminSnapshot["users"][number];
  isSelf: boolean;
  onSaved: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveUser = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { role };
      if (newPassword.trim()) payload.newPassword = newPassword.trim();
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setNewPassword("");
      await onSaved(`Updated user ${user.email}.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await onSaved(`Removed user ${user.email}.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className="py-3 px-4">
        <p className="font-medium text-ink">{user.name}</p>
        <p className="text-[11px] text-ink-muted">{user.email}</p>
      </td>
      <td className="py-3 px-4 text-ink-secondary">{user.organizationName}</td>
      <td className="py-3 px-4">
        <select
          aria-label={`Role for ${user.email}`}
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as Role)}
          className="min-h-[34px] rounded-control border border-black/[0.12] bg-white px-2.5 text-xs text-ink outline-none focus:border-cobalt-600 disabled:bg-canvas"
        >
          <option value="owner">owner</option>
          <option value="branch_manager">branch_manager</option>
          <option value="staff">staff</option>
          <option value="super_admin">super_admin</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Optional new password (8+)"
          minLength={8}
          className="w-44 min-h-[34px] rounded-control border border-black/[0.12] bg-white px-2.5 text-xs text-ink placeholder:text-ink-muted/70 outline-none focus:border-cobalt-600"
        />
      </td>
      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
        <button
          type="button"
          onClick={() => void saveUser()}
          disabled={saving}
          className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={() => void removeUser()}
            disabled={saving}
            className="rounded-control border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}

function BusinessEditorCard({
  biz,
  onSaved,
  onError,
}: {
  biz: AdminSnapshot["businesses"][number];
  onSaved: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(biz.name);
  const [category, setCategory] = useState(biz.category);
  const [address, setAddress] = useState(biz.address);
  const [description, setDescription] = useState(biz.description || "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(biz.googleReviewUrl);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          address,
          description,
          googleReviewUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      await onSaved(`Updated business ${name}.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full min-h-[36px] rounded-control border border-black/[0.12] bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-cobalt-600";

  return (
    <form onSubmit={save} className="rounded-card bg-white border border-black/[0.09] p-5 space-y-3 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-ink-muted">{biz.organizationName}</p>
          <p className="font-mono text-xs text-cobalt-700">/r/{biz.publicSlug}</p>
        </div>
        <Link
          href={`/r/${biz.publicSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-cobalt-600 hover:text-cobalt-700"
        >
          <span>Open</span>
          <ArrowUpRightIcon size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <input value={name} onChange={(e) => setName(e.target.value)} className={cls} placeholder="Business name" required />
        <input value={category} onChange={(e) => setCategory(e.target.value)} className={cls} placeholder="Category" required />
      </div>
      <input value={address} onChange={(e) => setAddress(e.target.value)} className={cls} placeholder="Address / area" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} className={cls} placeholder="Specialties & keywords" />
      <input value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} className={`${cls} font-mono`} placeholder="Google review link" />

      <button
        type="submit"
        disabled={saving}
        className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save business data"}
      </button>
    </form>
  );
}

function CardRow({
  card,
  onSaved,
  onError,
}: {
  card: AdminSnapshot["cards"][number];
  onSaved: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const changeStatus = async (status: "active" | "inactive" | "lost" | "retired") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      await onSaved(`Card ${card.label} marked ${status}.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className="py-3 px-4 font-medium text-ink">{card.label}</td>
      <td className="py-3 px-4 text-ink-secondary">
        {card.businessName}{" "}
        <span className="text-ink-muted">({card.organizationName})</span>
      </td>
      <td className="py-3 px-4 font-mono">{card.chipType}</td>
      <td className="py-3 px-4 font-mono text-ink-muted">/t/{card.token}</td>
      <td className="py-3 px-4">
        <select
          aria-label={`Status for ${card.label}`}
          value={card.status}
          disabled={saving}
          onChange={(e) =>
            void changeStatus(e.target.value as "active" | "inactive" | "lost" | "retired")
          }
          className="min-h-[32px] rounded-control border border-black/[0.12] bg-white px-2 text-xs text-ink outline-none focus:border-cobalt-600"
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="lost">lost</option>
          <option value="retired">retired</option>
        </select>
      </td>
    </tr>
  );
}

function FeedbackAdminCard({
  item,
  onDeleted,
  onError,
}: {
  item: AdminSnapshot["feedback"][number];
  onDeleted: (msg: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await onDeleted("Feedback entry removed.");
    } catch (err) {
      onError((err as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-4 space-y-2 shadow-panel">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-ink truncate">{item.businessName}</span>
          {item.rating !== null && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <StarIcon size={11} filled className="text-amber-500" />
              {item.rating}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-ink-muted">
            {item.createdAt.slice(0, 10)}
          </span>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={deleting}
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      <p className="text-xs text-ink-secondary leading-relaxed">{item.message}</p>
      {item.replyNote && (
        <p className="rounded-lg bg-canvas px-3 py-2 text-[11px] text-ink-muted">
          Team note: {item.replyNote}
        </p>
      )}
    </div>
  );
}

