"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import StorageModeNotice from "@/components/StorageModeNotice";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", orgName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create workspace. Check your details and try again.");
        return;
      }
      router.push("/app/settings");
      router.refresh();
    } catch {
      setError("Network error while connecting. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full min-h-[44px] rounded-control border border-black/[0.14] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/15";

  return (
    <div className="rounded-card bg-white border border-black/[0.09] p-7 sm:p-8 shadow-panel">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
          Create your workspace
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Set up your business review page, QR stand, and NFC cards.
        </p>
      </div>

      <StorageModeNotice />

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="orgName">
            Business or workspace name
          </label>
          <input
            id="orgName"
            className={field}
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            placeholder="Harbor Roasters"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            autoComplete="name"
            className={field}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Akshay"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={field}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@business.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${field} pr-11`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
            >
              {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
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
          {loading ? "Creating workspace…" : "Create workspace"}
        </button>
      </form>

      <p className="text-sm text-ink-secondary mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-cobalt-600 hover:text-cobalt-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
