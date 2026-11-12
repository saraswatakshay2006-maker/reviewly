import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PlatformSignature from "@/components/PlatformSignature";
import LandingInteractiveDemo from "@/components/LandingInteractiveDemo";
import { PLAN_DEFAULTS, PUBLIC_PRICING_PLANS } from "@/lib/subscriptions";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CreditCardIcon,
  LockIcon,
  NfcIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  StarIcon,
} from "@/components/Icons";

export default function HomePage() {
  const complianceRules = [
    {
      title: "Zero review gating",
      detail:
        "Every customer rating from 1 to 5 stars renders the exact same options. There is no conditional branching that hides Google or filters unhappy visits.",
    },
    {
      title: "Outbound link opening only",
      detail:
        "Tapping the Google action opens your business's official write-a-review link in a new tab. Reviewly tracks outbound link clicks and never claims a review was submitted.",
    },
    {
      title: "Optional AI grammar cleanup",
      detail:
        "When a customer requests phrasing help, text cleanup preserves original meaning without adding praise or keywords. Suggestions stay clearly labeled and editable.",
    },
    {
      title: "No mandatory PII harvested",
      detail:
        "Private feedback collects free-text thoughts only — no forced names, phone numbers, email addresses, or tracking walls.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Navigation */}
      <header className="sticky top-0 z-20 h-[72px] bg-white border-b border-black/[0.08]">
        <div className="max-w-6xl mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0" aria-label="Reviewly Home">
            <BrandMark />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6">
            <a
              href="#workflow"
              className="hidden md:inline-block text-sm font-medium text-ink-secondary hover:text-ink transition-colors whitespace-nowrap"
            >
              Architecture
            </a>
            <a
              href="#compliance"
              className="hidden md:inline-block text-sm font-medium text-ink-secondary hover:text-ink transition-colors whitespace-nowrap"
            >
              Compliance
            </a>
            <a
              href="#pricing"
              className="hidden md:inline-block text-sm font-medium text-ink-secondary hover:text-ink transition-colors whitespace-nowrap"
            >
              Plans
            </a>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-ink-secondary hover:text-ink px-2 sm:px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
            >
              Create workspace
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-black/[0.07] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold text-ink leading-[1.06] tracking-[-0.03em] text-balance">
                Make every genuine customer experience easier to share.
              </h1>

              <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl text-pretty">
                A tap on an NFC card or a scan of a tabletop QR opens your branded customer page — with your official Google review link and private feedback available equally at every rating.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-control bg-cobalt-600 hover:bg-cobalt-700 px-6 py-3.5 text-sm font-medium text-white transition-colors"
                >
                  Create workspace
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-control border border-black/[0.14] bg-white hover:bg-canvas px-6 py-3.5 text-sm font-medium text-ink transition-colors"
                >
                  Sign in to dashboard
                </Link>
              </div>

              <div className="pt-4 border-t border-black/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-ink-secondary">
                <div className="flex items-center gap-2">
                  <NfcIcon size={15} className="text-cobalt-600 shrink-0" />
                  <span>NTAG213 / 215 &amp; SVG QR</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon size={15} className="text-cobalt-600 shrink-0" />
                  <span>Zero gating on 1–5 stars</span>
                </div>
                <div className="flex items-center gap-2">
                  <LockIcon size={15} className="text-cobalt-600 shrink-0" />
                  <span>Org-isolated multi-tenancy</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <LandingInteractiveDemo />
            </div>
          </div>
        </section>

        {/* Architecture & Product Flow */}
        <section id="workflow" className="py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-[-0.025em] text-balance">
                Physical touchpoints backed by a multi-tenant workspace.
              </h2>
              <p className="mt-3 text-base text-ink-secondary leading-relaxed">
                Cards and printed QR stands point to dynamic server tokens, so updating your Google destination or welcome message never requires reprogramming hardware.
              </p>
            </div>

            {/* Row 1: Featured Dynamic Hardware Split */}
            <div className="rounded-card bg-white border border-black/[0.09] overflow-hidden grid lg:grid-cols-12">
              <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-cobalt-700 bg-cobalt-50 px-2.5 py-1 rounded-md">
                    <CreditCardIcon size={14} />
                    <span>Dynamic token resolution</span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-ink tracking-tight">
                    One permanent tap token per card or table stand.
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                    Every physical NFC chip encodes <code className="font-mono text-xs bg-surface-subtle px-1.5 py-0.5 rounded">/t/&lt;token&gt;</code>. Server-side routing records scan medium (<code className="font-mono text-xs bg-surface-subtle px-1.5 py-0.5 rounded">nfc</code> vs <code className="font-mono text-xs bg-surface-subtle px-1.5 py-0.5 rounded">qr</code>) and sends guests straight to your live page.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-ink-secondary">
                  <span className="rounded-lg border border-black/[0.08] bg-canvas px-3 py-1.5">Retire lost cards instantly</span>
                  <span className="rounded-lg border border-black/[0.08] bg-canvas px-3 py-1.5">Print-ready SVG QR export</span>
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-subtle/70 border-t lg:border-t-0 lg:border-l border-black/[0.07] p-7 sm:p-10 flex items-center justify-center">
                <div className="w-full max-w-md space-y-3">
                  {/* Tactile matte NFC card preview */}
                  <div className="rounded-2xl bg-surface-dark text-white p-6 shadow-elevated flex items-center justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-mono text-slate-300">NTAG215 · ACTIVE</span>
                      </div>
                      <div>
                        <p className="font-display text-lg font-semibold">Front Reception Desk</p>
                        <p className="text-xs font-mono text-slate-400 mt-1">/t/tok_9a48f21e8c</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <NfcIcon size={22} className="text-cobalt-200" />
                    </div>
                  </div>

                  {/* Resolution bar */}
                  <div className="rounded-xl bg-white border border-black/[0.08] px-4 py-3 flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-2 font-medium text-ink">
                      <QrCodeIcon size={15} className="text-cobalt-600" />
                      <span>Resolves to /r/your-business</span>
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      307 Redirect
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Two Asymmetric Operational Panels */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left 5 cols: Equal Path Matrix */}
              <div className="lg:col-span-5 rounded-card bg-white border border-black/[0.09] p-7 sm:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-2.5">
                  <h3 className="font-display text-xl font-semibold text-ink tracking-tight">
                    Identical options at every rating
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Whether a customer taps 1 star or 5 stars, the UI renders your Google review link and the private feedback drawer side by side.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { rating: 5, label: "5-star visit" },
                    { rating: 2, label: "2-star visit" },
                  ].map((row) => (
                    <div
                      key={row.rating}
                      className="rounded-xl border border-black/[0.08] bg-canvas p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon
                              key={s}
                              size={13}
                              filled={s <= row.rating}
                              className={s <= row.rating ? "text-amber-500" : "text-slate-300"}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-ink-secondary">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium">
                        <span className="rounded bg-cobalt-50 text-cobalt-700 px-2 py-0.5">Google</span>
                        <span className="rounded bg-white border border-black/10 text-ink px-2 py-0.5">Private</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 7 cols: Real Operate Dashboard Fragment */}
              <div className="lg:col-span-7 rounded-card bg-white border border-black/[0.09] overflow-hidden flex flex-col">
                <div className="p-7 sm:p-8 pb-5 space-y-2">
                  <h3 className="font-display text-xl font-semibold text-ink tracking-tight">
                    First-party telemetry and private inbox
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Track NFC vs QR scans, device split, rating distribution, and team response notes on private feedback without exposing customer data publicly.
                  </p>
                </div>

                <div className="mt-auto bg-surface-subtle/60 border-t border-black/[0.07] p-6 sm:px-8">
                  <div className="rounded-xl bg-white border border-black/[0.09] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-secondary">Workspace telemetry schema</span>
                      <span className="text-[11px] font-mono text-ink-muted">org-scoped · RBAC</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-canvas p-3 border border-black/[0.05]">
                        <p className="text-[11px] text-ink-muted">Entry channel</p>
                        <p className="text-sm font-semibold text-ink mt-1">NFC &amp; QR</p>
                      </div>
                      <div className="rounded-lg bg-canvas p-3 border border-black/[0.05]">
                        <p className="text-[11px] text-ink-muted">Ratings tracked</p>
                        <p className="text-sm font-semibold text-ink mt-1">1 to 5 stars</p>
                      </div>
                      <div className="rounded-lg bg-canvas p-3 border border-black/[0.05]">
                        <p className="text-[11px] text-ink-muted">Outbound event</p>
                        <p className="text-sm font-semibold text-cobalt-600 mt-1">Google click</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-black/[0.07] p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink truncate">
                          Private feedback arrives directly in your team inbox
                        </p>
                        <p className="text-[11px] text-ink-muted mt-0.5">Internal response notes stay visible only to staff</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                        <CheckIcon size={11} />
                        Private
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Specification Ledger */}
        <section id="compliance" className="py-16 sm:py-24 bg-white border-t border-black/[0.07]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-[-0.025em] text-balance">
                Transparent by architecture, not by policy PDF.
              </h2>
              <p className="text-base text-ink-secondary leading-relaxed">
                Platform trust breaks when software hides negative experiences or invents metrics. Reviewly encodes compliance directly into the UI and event model.
              </p>
            </div>

            <div className="lg:col-span-7 divide-y divide-black/[0.09] border-t border-b border-black/[0.09]">
              {complianceRules.map((rule) => (
                <div key={rule.title} className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                  <h3 className="sm:w-52 shrink-0 text-sm font-semibold text-ink">
                    {rule.title}
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{rule.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SaaS Plans */}
        <section id="pricing" className="py-16 sm:py-24 border-t border-black/[0.07]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-[-0.025em] text-balance">
                Plans built for single shops to multi-branch chains.
              </h2>
              <p className="text-base text-ink-secondary leading-relaxed">
                Start with a 14-day trial workspace. Every feature listed below is active and enforced inside Reviewly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {PUBLIC_PRICING_PLANS.map((planId) => {
                const plan = PLAN_DEFAULTS[planId];
                const isPopular = planId === "growth";
                return (
                  <div
                    key={plan.id}
                    className={`rounded-card bg-white p-6 flex flex-col justify-between gap-6 ${
                      isPopular
                        ? "border-2 border-cobalt-600 shadow-elevated"
                        : "border border-black/[0.09] shadow-panel"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isPopular
                              ? "bg-cobalt-600 text-white"
                              : "bg-surface-subtle text-ink-secondary"
                          }`}
                        >
                          {plan.badge}
                        </span>
                        <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">
                          {plan.label}
                        </span>
                      </div>

                      <div>
                        {plan.customPrice ? (
                          <p className="font-display text-3xl font-semibold text-ink">
                            Custom
                          </p>
                        ) : (
                          <p className="font-display text-3xl font-semibold text-ink tabular-nums">
                            ₹{plan.monthlyPriceInr.toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-ink-muted">
                              {" "}
                              /month
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                          {plan.tagline}
                        </p>
                      </div>

                      <ul className="space-y-2 pt-3 border-t border-black/[0.07]">
                        {plan.highlights.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-start gap-2 text-xs text-ink-secondary leading-snug"
                          >
                            <CheckIcon
                              size={14}
                              className="text-cobalt-600 shrink-0 mt-0.5"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href="/signup"
                      className={`inline-flex items-center justify-center rounded-control px-4 py-2.5 text-xs font-medium transition-colors ${
                        isPopular
                          ? "bg-cobalt-600 hover:bg-cobalt-700 text-white"
                          : "border border-black/[0.13] bg-canvas hover:bg-surface-subtle text-ink"
                      }`}
                    >
                      {plan.customPrice ? "Request custom workspace" : "Start 14-day trial"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing Architectural CTA */}
        <section className="bg-surface-dark text-white py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-2.5">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-balance">
                Launch your customer review page in minutes.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Configure your brand color, connect your official Google review link, and print your QR code or assign NFC card tokens.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-control bg-cobalt-500 hover:bg-cobalt-600 px-6 py-3.5 text-sm font-medium text-white transition-colors"
              >
                <span>Create workspace</span>
                <ArrowUpRightIcon size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-control border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-black/[0.08] py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <BrandMark size="sm" />
          <PlatformSignature compact />
          <div className="flex items-center gap-5 text-xs font-medium text-ink-secondary">
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/signup" className="hover:text-ink">Create workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
