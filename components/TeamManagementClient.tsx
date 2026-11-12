"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { CheckIcon, PlusIcon, UsersIcon } from "./Icons";

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

type AssignableRole = "owner" | "business_admin" | "branch_manager" | "staff";

const ASSIGNABLE_ROLES: {
  id: AssignableRole;
  label: string;
}[] = [
  { id: "business_admin", label: "Business Admin" },
  { id: "branch_manager", label: "Business Manager" },
  { id: "staff", label: "Business Staff" },
  { id: "owner", label: "Business Owner" },
];

export default function TeamManagementClient({
  initialMembers,
  currentUserId,
  canManage,
  teamLimit,
  planLabel,
  isPlanUsable,
}: {
  initialMembers: TeamMemberItem[];
  currentUserId: string;
  canManage: boolean;
  teamLimit: number;
  planLabel: string;
  isPlanUsable: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMemberItem[]>(initialMembers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isUnlimited = teamLimit < 0;
  const atLimit = !isUnlimited && members.length >= teamLimit;
  const overLimit = !isUnlimited && members.length > teamLimit;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add team member");
      setMembers((prev) => [...prev, json.member]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setNotice(`Added ${json.member.name} to your workspace team.`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    nextRole: AssignableRole
  ) => {
    setError(null);
    setNotice(null);
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update role");
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
      );
      setNotice("Updated team member role.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    setError(null);
    setNotice(null);
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not remove member");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setNotice("Removed team member from workspace.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const inputCls =
    "w-full min-h-[40px] rounded-control border border-black/[0.13] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15";

  return (
    <div className="space-y-6">
      {canManage && (
        <section className="rounded-card bg-white border border-black/[0.09] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">
                Add team member
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Grant branch managers or staff access to view analytics, manage QR/NFC cards, and respond to feedback.
              </p>
            </div>
            <span className="rounded-md bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink tabular-nums">
              {members.length} / {isUnlimited ? "Unlimited" : teamLimit} seats ({planLabel})
            </span>
          </div>

          {!isPlanUsable ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 flex flex-wrap items-center justify-between gap-2">
              <span>
                Your subscription is expired or paused. Renew your plan to add or update team members.
              </span>
              <Link
                href="/app/billing"
                className="rounded-control bg-red-700 hover:bg-red-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Renew Plan
              </Link>
            </div>
          ) : atLimit ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
              <span>
                {overLimit
                  ? `You currently have ${members.length} accounts (plan limit: ${teamLimit} on ${planLabel}). Existing members remain intact, but new invitations are blocked.`
                  : `You have used all ${teamLimit} team seat${teamLimit === 1 ? "" : "s"} included in your ${planLabel} plan. Upgrade to Growth (up to 5) or Pro (up to 10) for more seats.`}
              </span>
              <Link
                href="/app/billing?tab=upgrade"
                className="rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Explore Plans
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Full name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Riya Sharma"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Work email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="riya@business.in"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">
                  Temporary password (8+ chars)
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputCls}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as AssignableRole)
                    }
                    className={inputCls}
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  <PlusIcon size={14} />
                  <span>{submitting ? "Adding…" : "Add"}</span>
                </button>
              </div>
            </form>
          )}

          {notice && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckIcon size={14} />
              <span>{notice}</span>
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </section>
      )}

      <section className="rounded-card bg-white border border-black/[0.09] overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UsersIcon size={16} className="text-cobalt-600" />
            <h2 className="font-display text-base font-semibold text-ink">
              Workspace accounts ({members.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-black/[0.06]">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const isAdmin = m.role === "super_admin";
            return (
              <div
                key={m.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-ink truncate">
                      {m.name}
                    </p>
                    {isSelf && (
                      <span className="rounded bg-cobalt-50 px-1.5 py-0.5 text-[10px] font-medium text-cobalt-700">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted truncate">{m.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManage && !isSelf && !isAdmin && isPlanUsable ? (
                    <>
                      <select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        disabled={busyId === m.id}
                        onChange={(e) =>
                          void handleRoleChange(
                            m.id,
                            e.target.value as AssignableRole
                          )
                        }
                        className="min-h-[34px] rounded-control border border-black/[0.12] bg-white px-2.5 text-xs text-ink outline-none focus:border-cobalt-600"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => void handleRemove(m.id)}
                        className="min-h-[34px] rounded-control border border-red-200 bg-red-50 hover:bg-red-100 px-3 text-xs font-medium text-red-700 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="rounded-md bg-surface-subtle px-2.5 py-1 text-xs font-medium text-ink-secondary capitalize">
                      {m.role.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

