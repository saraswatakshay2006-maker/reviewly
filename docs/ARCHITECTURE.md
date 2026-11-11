# MVP Architecture — Akshay Review & Reputation Platform

## 1. System Architecture Overview

```
                         ┌─────────────────────────────────────────────┐
                         │        Next.js app (Vercel)                 │
                         │  App Router · TypeScript · Tailwind        │
                         │                                             │
                         │  Public: /r/:slug  /t/:cardId  /feedback    │
                         │  Private: /app/... (dashboard)              │
                         │  API Routes (Route Handlers) + Server Actions│
                         └──────────────┬───────────────┬──────────────┘
                                        │               │
                     Supabase client (RLS)│        Server-side AI (LLM)
                                        ▼               ▼
                         ┌──────────────────────┐   ┌──────────────────┐
                         │ Supabase             │   │ LLM API (server) │
                         │  · PostgreSQL        │   │ (key-protected)  │
                         │  · Auth (JWT)        │   └──────────────────┘
                         │  · Storage (logos)   │
                         │  · RLS enforced      │
                         └──────────────────────┘
```

**Why this shape:** a single Next.js app for both the public customer experience and the private dashboard keeps the
MVP cheap and deployable as one unit. Supabase gives managed Postgres, auth, storage, and — critically — **Row Level
Security** out of the box. The LLM is called only server-side so the key never ships to the browser.

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | SSR/static for fast public pages |
| Backend | Next.js Route Handlers + Server Actions | Zod validation on every boundary |
| Database | Supabase PostgreSQL | managed Postgres |
| Auth | Supabase Auth (email/OTP, later social) | JWT sessions |
| Storage | Supabase Storage | logos, optional assets (Cloudinary later) |
| AI | Server-side LLM API | review assistance only |
| Analytics | First-party events → Postgres aggregated views | privacy-conscious; no ad cookies |
| Deployment | Vercel | env-based config, CI/CD |
| Email | Provider (e.g., Resend) via env | transactional |

No microservices in the MVP. Design boundaries (analytics, AI, billing) are isolated so they can be extracted later
without a rebuild.

---

## 3. Multi-Tenancy & Row Level Security

**Tenant model:** `organization_id` is the tenant key. A business belongs to an organization; branches belong to a
business.

- Every tenant-owned table carries `organization_id` (and often `business_id`).
- **RLS policies** restrict rows to the caller's organization/business.
- Roles: `super_admin` (platform), `owner`, `branch_manager`, `staff`.
- Auth: Supabase Auth JWT carries `role` and `organization_id` (via custom claims/metadata).
- Policy pattern (example):

```sql
create policy "business_rows_for_org" on businesses
for select using (organization_id = (auth.jwt()->>'organization_id')::uuid);
```

One business can never read another's rows: the DB enforces it, not just the app.

---

## 4. Database Schema

> Table names per the master PRD. Types are PostgreSQL; PKs UUIDv7 (or `gen_random_uuid()`);
> `created_at`/`updated_at` timestamptz on all tables. Tenant tables carry `organization_id` and RLS.

### 4.1 users
- `id uuid PK`, `email text unique not null`, `phone text`, `name text`, `created_at`, `updated_at`
- RLS: user sees own row.

### 4.2 organizations
- `id uuid PK`, `name text not null`, `slug text unique`, `created_at`
- RLS: only members / super_admin.

### 4.3 businesses
- `id uuid PK`, `organization_id uuid FK→organizations not null`, `name text not null`,
  `category text`, `address text`, `description text`, `logo_url text`, `primary_color text`,
  `welcome_message text`, `created_at`
- Index: `(organization_id)`; unique `(organization_id, name)`.
- RLS: by `organization_id`.

### 4.4 branches
- `id uuid PK`, `business_id uuid FK→businesses not null`, `name text not null`, `address text`, `created_at`
- Index: `(business_id)`.
- RLS: via business's organization.

### 4.5 business_members
- `id uuid PK`, `business_id uuid FK`, `user_id uuid FK→users`, `role text check (role in
  ('owner','branch_manager','staff'))`, `branch_id uuid null FK→branches`, `created_at`
- Unique `(business_id, user_id)`.
- RLS: member can act if their row grants access.

### 4.6 business_settings
- `id uuid PK`, `business_id uuid FK unique`, `google_review_url text`,
  `allow_private_feedback boolean default true`, `allow_ai_assist boolean default true`,
  `public_slug text unique` (the `/r/<slug>`), `updated_at`
- `google_review_url` validated at write (official Google write-a-review host) and allow-listed at redirect time.
- RLS: by organization.

### 4.7 nfc_cards
- `id uuid PK`, `business_id uuid FK`, `branch_id uuid null`, `token text unique not null` (high-entropy),
  `status text check (status in ('active','inactive','lost','retired'))`, `chip_type text` (NTAG213/215),
  `purchase_batch text null`, `created_at`
- Index: `token`, `(business_id)`.
- RLS: by organization.
- **Redirect management:** destination resolves from `business_settings` at request time — changing the Google link
  never requires reflashing cards.

### 4.8 nfc_tokens
- `id uuid PK`, `card_id uuid FK→nfc_cards`, `token text unique`, `issued_at`, `expires_at null`
- RLS: by organization.
- Purpose: allow token rotation without rewriting the chip.

### 4.9 qr_codes
- `id uuid PK`, `business_id uuid FK`, `nfc_card_id uuid null FK`, `code text unique`,
  `target_url text` (resolves to same `/r/<slug>`), `created_at`
- RLS: by organization.

### 4.10 customer_sessions
- `id uuid PK`, `business_id uuid FK`, `token text null`, `scan_type text check (scan_type in ('nfc','qr'))`,
  `visited_at timestamptz default now()`, `device_type text`, `referrer text`
- **No PII** stored by default.
- Index: `(business_id, visited_at)`.
- RLS: by organization.

### 4.11 rating_interactions
- `id uuid PK`, `session_id uuid FK→customer_sessions`, `business_id uuid FK`, `rating smallint check
  (rating between 1 and 5)`, `created_at`
- Index: `(business_id, created_at)`.
- RLS: by organization.

### 4.12 feedback_submissions
- `id uuid PK`, `session_id uuid FK`, `business_id uuid FK`, `rating smallint null`, `message text`,
  `category text null`, `reply_note text null` (owner-only), `complaint boolean default false`, `created_at`
- RLS: by organization. Owner/branch_manager can read; staff scoped by branch.

### 4.13 review_link_clicks
- `id uuid PK`, `session_id uuid FK`, `business_id uuid FK`, `rating smallint null`, `clicked_at`
- Index: `(business_id, clicked_at)`.
- RLS: by organization.
- **Semantic:** this records a *click*, never a submitted review. No "mark as review" column.

### 4.14 subscriptions
- `id uuid PK`, `organization_id uuid FK`, `plan text`, `status text`, `current_period_start`, `current_period_end`,
  `created_at`
- RLS: by organization (+ super_admin).

### 4.15 payments
- `id uuid PK`, `organization_id uuid FK`, `subscription_id uuid FK`, `amount_cents integer`, `currency text`,
  `provider text`, `provider_ref text`, `status text`, `created_at`
- RLS: by organization.

### 4.16 audit_logs
- `id uuid PK`, `organization_id uuid null`, `user_id uuid null`, `actor_role text`, `action text`, `entity text`,
  `entity_id uuid null`, `metadata jsonb`, `created_at`
- RLS: super_admin and organization admins only.

### Relationships summary
- organizations 1—N businesses
- businesses 1—N branches
- businesses 1—1 business_settings
- businesses 1—N nfc_cards / qr_codes / customer_sessions / rating_interactions / feedback_submissions / review_link_clicks
- organizations 1—N members (business_members links users→businesses)
- organizations 1—N subscriptions →1—N payments

---

## 5. API Specification

### Public (customer-facing)
| Method | Route | Purpose |
|---|---|---|
| GET | `/r/:slug` | Public landing page (SSR) for a business |
| GET | `/t/:cardId` | NFC token resolution → redirect to `/r/:slug` (server-side) |
| POST | `/api/feedback` | Create a private feedback submission (rate-limited, optional) |
| POST | `/api/ai-assist` | Server-side review phrasing suggestion; **never auto-publishes** |
| POST | `/api/events` | Record first-party events (rating select, google click, scan) |

### Private (dashboard, authed + RLS)
| Method | Route | Purpose |
|---|---|---|
| REST | `/api/business/*` | CRUD business/profile/logo/settings |
| REST | `/api/cards/*` | NFC card management (activate, replace, reassign) |
| REST | `/api/qr/*` | Generate/list QR codes |
| REST | `/api/analytics/*` | Aggregations (scans, ratings, clicks, feedback, devices) |
| REST | `/api/feedback/*` | Inbox read/respond/export |
| REST | `/api/members/*` | Team/RBAC management |
| REST | `/api/subscription/*` | Plans/payments (Phase 5) |

**Validation:** Zod schemas on all inputs. **Safe redirect:** only allow-listed Google hosts when opening Google.

---

## 6. Security Architecture

- **Auth:** Supabase Auth; JWT sessions; secure, httpOnly cookies.
- **RLS:** enforced on every tenant table; app never trusts client-side role alone.
- **RBAC matrix:** super_admin > owner > branch_manager > staff (staff scoped to branch).
- **Rate limiting:** auth, public token resolution, feedback submit, AI assist (e.g., per-IP/per-business).
- **Input validation:** Zod at all boundaries; length limits; sanitize stored text.
- **Token safety:** NFC/QR tokens are high-entropy UUIDs; not enumerable; resolved server-side (no client-side logic).
- **Secrets:** LLM key, DB/Service keys only in server env; never bundled client-side.
- **Audit:** privileged actions logged (entity, actor, metadata).
- **Backups & recovery:** Supabase standard backups + tested restore procedure.
- **Logging/privacy:** no PII in URLs or logs; personal data minimized.

---

## 7. Analytics Design (first-party, privacy-conscious)

- Events: `page_view`, `scan(nfc|qr)`, `rating_select`, `google_click`, `feedback_submit`.
- Stored in Postgres; aggregated into daily/weekly/monthly views.
- **Clarity:** dashboard metric = "Google review button clicks." A published-review count is shown **only** if an official,
  authorized source supplies it; otherwise the UI states it is not tracked.
- No third-party ad scripts; no cross-site tracking; device breakdown from UA/pointer hints.

---

## 8. Scaling & Evolution Notes

- Public landing pages are SSR/static-friendly; a CDN cache can be added later without code changes to the journey.
- Analytics events can move to a dedicated store (e.g., ClickHouse/Postgres partitions) behind the same API.
- AI assist is isolated in one module → can be swapped/versioned independently.
- Adding multi-branch, white-label, and billing are additive (schema already supports branches/org).
