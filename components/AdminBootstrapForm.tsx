"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import StorageModeNotice from "./StorageModeNotice";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "./Icons";

export default function AdminBootstrapForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    accessCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not initialize super admin.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while initializing super admin.");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full min-h-[44px] rounded-control border border-black/[0.14] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15";

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Reviewly home">
            <BrandMark />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cobalt-200 bg-cobalt-50 px-3 py-1 text-xs font-medium text-cobalt-700">
            <ShieldCheckIcon size={13} />
            <span>Super Admin Setup</span>
          </span>
        </div>

        <div className="rounded-card bg-white border border-black/[0.09] p-7 sm:p-8 shadow-panel">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
              Initialize SaaS Super Admin
            </h1>
            <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
              One-time setup to create the master administrator account for managing client subscriptions and platform data.
            </p>
          </div>

          <StorageModeNotice />

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="sa-name">
                Full name
              </label>
              <input
                id="sa-name"
                className={field}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Akshay"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="sa-email">
                Admin email
              </label>
              <input
                id="sa-email"
                type="email"
                autoComplete="email"
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="sa-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="sa-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`${field} pr-11`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="sa-code">
                Private access code
              </label>
              <div className="relative">
                <input
                  id="sa-code"
                  type={showCode ? "text" : "password"}
                  autoComplete="off"
                  className={`${field} pr-11`}
                  value={form.accessCode}
                  onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
                  placeholder="Enter private access code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  aria-label={showCode ? "Hide access code" : "Show access code"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle"
                >
                  {showCode ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-control border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Initializing…" : "Create Super Admin"}
            </button>
          </form>

          <p className="text-xs text-ink-muted mt-5 text-center">
            Already initialized?{" "}
            <Link href="/login" className="text-cobalt-600 hover:text-cobalt-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

