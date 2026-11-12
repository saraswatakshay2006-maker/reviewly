"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon } from "./Icons";
import type { PlanRecord } from "@/lib/types";

export default function PublicPricingSection({
  plans,
}: {
  plans: PlanRecord[];
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="py-16 sm:py-24 border-t border-black/[0.07]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-[-0.025em] text-balance">
              Plans built for single shops to multi-branch chains.
            </h2>
            <p className="text-base text-ink-secondary leading-relaxed">
              Start with a 14-day trial workspace. Every feature listed below is active and enforced inside Reviewly.
            </p>
          </div>

          <div
            className="inline-flex items-center rounded-control border border-black/[0.1] bg-white p-1 self-start"
            role="group"
            aria-label="Billing interval toggle"
          >
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                interval === "monthly"
                  ? "bg-cobalt-600 text-white"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("annual")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                interval === "annual"
                  ? "bg-cobalt-600 text-white"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              Yearly (1 Year · Save 17%)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isPopular = plan.isPopular;
            const annualPrice = plan.annualPriceInr ?? 0;
            const showAnnual = interval === "annual" && annualPrice > 0;
            const displayAmount = showAnnual
              ? annualPrice
              : plan.monthlyPriceInr;
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
                      {plan.isPopular ? "Most popular" : plan.badge || "Plan"}
                    </span>
                    <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {plan.name}
                    </span>
                  </div>

                  <div>
                    {plan.customPrice ? (
                      <p className="font-display text-3xl font-semibold text-ink">
                        Custom
                      </p>
                    ) : (
                      <div>
                        <p className="font-display text-3xl font-semibold text-ink tabular-nums">
                          ₹{displayAmount.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-ink-muted">
                            {" "}
                            {showAnnual ? "/year (12 months)" : "/month"}
                          </span>
                        </p>
                        {annualPrice > 0 && !showAnnual && (
                          <p className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                            or ₹{annualPrice.toLocaleString("en-IN")} / year
                          </p>
                        )}
                        {showAnnual && plan.monthlyPriceInr > 0 && (
                          <p className="text-[11px] text-emerald-700 font-medium mt-0.5 tabular-nums">
                            Full 1-year validity (₹{Math.round(annualPrice / 12).toLocaleString("en-IN")}/mo equiv.)
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="rounded-lg bg-canvas border border-black/[0.06] px-3 py-2 text-[11px] text-ink-secondary space-y-0.5">
                    <p>
                      <strong className="text-ink">
                        {plan.maxLocations < 0 ? "Unlimited" : plan.maxLocations}
                      </strong>{" "}
                      location{plan.maxLocations === 1 ? "" : "s"} ·{" "}
                      <strong className="text-ink">
                        {plan.maxTeamMembers < 0 ? "Unlimited" : plan.maxTeamMembers}
                      </strong>{" "}
                      user{plan.maxTeamMembers === 1 ? "" : "s"}
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
                  href={`/signup?plan=${encodeURIComponent(plan.id)}&interval=${interval}`}
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
  );
}
