# Implementation Roadmap — Akshay Review & Reputation Platform

Guiding principles: **lean, low-cost MVP for a small founder-led team; no overengineering; no fake data or fabricated
research.** The plan is additive — each phase ships value and leaves room to grow without a rebuild.

---

## Phase 1 — Foundation (brand + account plumbing)

**Deliverables**
- Marketing site (brand-first, trust-focused copy; never "cheap card"; never implies Google verification).
- Brand identity kit: logo direction, premium palette, typography, voice, platform signature asset.
- Auth (Supabase Auth), business registration, business profile setup (name, category, address).
- `organizations`, `businesses`, `users`, `business_members` schema + RLS.

**Dependencies:** none (greenfield).
**Complexity:** Medium. **Estimated effort:** ~2–3 weeks (1–2 engineers).
**Acceptance criteria**
- A user can sign up and register a business profile with validation.
- RLS tests prove a user cannot see another business's data.
- Marketing site passes brand + performance checks (no fabricated stats).
**Risks:** scope creep on branding; auth friction. Mitigate: templated brand system; OTP/magic-link to start.

---

## Phase 2 — Review Experience (the core customer journey)

**Deliverables**
- Public landing page `GET /r/:slug` (logo, name, category, welcome, signature, fast/mobile-first).
- Interactive 1–5 rating component with equal access at every rating.
- "Share Your Experience on Google" → opens owner-configured official review URL (new tab; no submission claims).
- Optional private feedback form (post to inbox).
- QR generation (same functionality as NFC) + `customer_sessions`/`rating_interactions`/`review_link_clicks`/
  `feedback_submissions`.

**Dependencies:** Phase 1 (business settings).
**Complexity:** High (this is the product). **Estimated effort:** ~3–4 weeks.
**Acceptance criteria**
- All five ratings show both the Google option and private feedback (compliance test asserts no gating).
- Landing page TTI <2.5s on mid-tier 3G.
- Google click never claims submission and never alters Google's composer.
**Risks:** rendering perf; compliance drift. Mitigate: performance budget + Playwright compliance suite.

---

## Phase 3 — NFC Ecosystem

**Deliverables**
- `nfc_cards` + `nfc_tokens`; unique secure URLs (`/t/<cardId>`) resolving server-side.
- Card activation/replacement/reassignment; redirect management **without rewriting tags**.
- Card programming workflow + NFC compatibility testing (NTAG213/215, Android/iPhone).
- QR fallback printed on cards/stands.

**Dependencies:** Phase 2 (slug resolution).
**Complexity:** Medium. **Estimated effort:** ~2 weeks.
**Acceptance criteria**
- Changing a business's Google review destination updates the landing page without touching the physical card.
- NFC tap and QR scan land on the same URL with identical functionality.
- Tokens are high-entropy and not enumerable.
**Risks:** hardware variance. Mitigate: device matrix + documented QC.

---

## Phase 4 — Business Dashboard

**Deliverables**
- Overview: NFC scans, QR scans, unique page visits (where privacy rules permit), rating interactions, Google-button
  clicks, private feedback submissions, device breakdown, daily/weekly/monthly, campaign performance.
- Feedback inbox with categories, date filters, search, export, response notes, complaint flag.
- Business settings UI (landing customizations, link management), multi-card view.
- **Clear separation:** link-clicks labeled as clicks; published reviews shown only if an authorized source provides them.

**Dependencies:** Phase 2 analytics events + Phase 3 cards.
**Complexity:** High. **Estimated effort:** ~3 weeks.
**Acceptance criteria**
- Metrics computed from first-party events; distinct click-vs-published metric.
- Feedback isolated per tenant (RLS tested).
**Risks:** analytics overbuild. Mitigate: ship aggregated Postgres views first.

---

## Phase 5 — Monetization

**Deliverables**
- `subscriptions` + `payments`; plan gating (Starter/Growth/Pro); usage limits; payment provider integration; billing UI.
- One-time card sale + replacement fee flows.

**Dependencies:** Phase 4 (value visible).
**Complexity:** Medium. **Estimated effort:** ~2–3 weeks.
**Acceptance criteria**
- Plan enforcement prevents over-usage; payments record correctly; invoices generated.
- **Pricing validated through pilots** — proposed numbers in PRD §18 are starting points, not market claims.
**Risks:** pricing mismatch. Mitigate: pricing pilots + annual discount.

---

## Phase 6 — Expansion

**Deliverables**
- Multi-branch support (branch manager role, per-branch analytics).
- Advanced reporting; white-label options; domain/portfolio view for agencies.
- Additional integrations (future: WhatsApp workflows, kiosks, widgets, review-response management, loyalty).

**Dependencies:** all prior phases.
**Complexity:** High. **Estimated effort:** ongoing.
**Acceptance criteria**
- Branch-level RLS and dashboards; white-label branding applied without breaking the platform signature rules.
**Risks:** multi-tenancy edge cases. Mitigate: branch-level RLS tests.

---

## Testing Strategy

- **Unit:** validation, AI-assist prompt constraints, analytics aggregation.
- **Integration:** API + RLS tenant-isolation tests.
- **E2E (Playwright):** full journey — tap/scan → rate 1–5 → both options shown → Google link opens → private feedback.
- **Compliance suite:** asserts (a) equal access at every rating, (b) no "submitted" language, (c) no auto-publish,
  (d) AI text always labeled and editable.
- **Performance:** landing page budget; rate-limit tests.
- **Manual hardware:** NFC Android/iPhone, QR fallback, token reassignment without reflashing.

---

## Risk & Mitigation Summary

| Risk | Mitigation |
|---|---|
| Google review-link policy changes | official links only, no automation, monitor policy |
| LLM hallucination/injection | constrained prompts, label+edit, server-side, never auto-publish |
| Low India SaaS willingness-to-pay | hybrid hardware+software, pricing pilots, annual plans |
| Competitor copying | anti-gating stance + compliance + brand as moat |
| NFC hardware quality/stock | multiple suppliers, QC, NTAG213/215 |
| Data breach/PII | minimal data, RLS, audit, DPDP readiness |
| 3G performance | SSR/static, weight budget, optimization |

---

## Launch & Go-to-Market (recap)

- Beta with 20–30 local businesses in one city; early-bird pricing; collect testimonials + unit economics.
- Direct sales + WhatsApp/phone support + local Google Business Profile communities.
- Marketing site states honestly: we never gate reviews, never fabricate, never auto-post.
- Revenue first: hardware + Starter subscriptions, then Growth/Pro.
