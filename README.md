# Akshay Review & Reputation Platform

A **Customer Trust & Experience Technology** platform — not a "cheap NFC card vendor." NFC/QR cards are the entry
point; the product is the multi-tenant SaaS ecosystem behind them (landing pages, compliant Google-review redirection,
private feedback, analytics, dashboard).

This repository contains **both** the product documentation and a **fully working MVP application**.

---

## What's in the repo

| Path | Purpose |
|---|---|
| `docs/PRD.md` | Full Product Requirements Document (all 24 sections) |
| `docs/ARCHITECTURE.md` | MVP architecture, tech stack, multi-tenancy, DB schema, APIs, security |
| `docs/IMPLEMENTATION_ROADMAP.md` | Phased build roadmap, testing, risks, GTM |
| `app/` | The runnable Next.js application (the SaaS) |
| `lib/` | Data layer, auth, domain logic |
| `data/db.json` | Local persisted store (created at first run) |

---

## Running the app (zero external credentials required)

```bash
npm install
npm run dev
```

Open http://localhost:3000

The app is fully self-contained — it needs no Supabase account, no API keys, and no database server. Everything
persists to `data/db.json`.

### Demo flow
1. **Sign up** at `/signup` (creates your workspace).
2. **Create a business** under Settings: set a slug (e.g. `brewbloom`), a welcome message, brand color, and your
   official Google write-a-review link.
3. **Open your public page** at `/r/<slug>` — rate 1–5, see the Google option and private feedback at every rating.
4. **Dashboard** at `/app`: overview metrics, rating distribution, device breakdown, recent activity, private feedback
   inbox, and card/QR management.
5. **NFC/QR** — `GET /t/<cardId>` resolves a card token to your review page (server-side, so changing your Google link
   never requires reflashing a card). A downloadable QR code is on the Cards page.

---

## How the compliant behavior is implemented

- **No gating:** after selecting any rating, the customer UI always renders both the Google button and the private
  feedback panel — there is no code path that changes options based on rating.
- **No claimed submissions:** the Google button only `window.open`s the owner-configured official URL. The analytics
  records a **Google link click**, never "a review was submitted." The dashboard labels the metric accordingly.
- **AI-assisted text:** the `/api/ai-assist` endpoint returns a suggestion that is editable, deletable, labeled
  "AI-assisted", and never auto-published. With `OPENAI_API_KEY` set it uses the LLM; otherwise it uses a local
  meaning-preserving cleanup.
- **Private feedback:** collects no mandatory PII (free text only, no contact fields).
- **Platform signature:** a subtle "Powered by Reviewly" footer on every customer page that never overpowers the
  client's brand and never implies Google verification.

---

## Deploying on Cloudflare Pages (`*.pages.dev`)

All API routes and dynamic App Router pages run on the **Edge runtime** (`Web Crypto` auth, pure-JS SVG QR codes, and a multi-backend store in `lib/db.ts`).

### Option 1: Git Integration (recommended — works directly from Windows or any OS)
1. Push this repository to GitHub.
2. In the **Cloudflare Dashboard**, go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Use these exact build settings:
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
4. Under **Settings → Functions → Compatibility flags**, add `nodejs_compat` to both **Production** and **Preview**.
5. *(Recommended for persistent storage)* Under **Settings → Functions → Bindings**, create and bind either:
   - **Cloudflare D1 database** named `DB` (the app auto-creates its table on first request — zero manual SQL needed), **or**
   - **Cloudflare KV namespace** named `REVIEWLY_KV`.
   - Without a binding, the app still runs cleanly in ephemeral isolate memory for preview testing.
6. *(Optional)* Add `SESSION_SECRET` (random 32+ char string) and `OPENAI_API_KEY` under **Settings → Environment variables**.

### Option 2: Linux / macOS CLI
- On Linux/macOS (or inside WSL with Node installed):
  ```bash
  npm run pages:deploy
  ```
- Note: `@cloudflare/next-on-pages` calls Vercel's Linux build step internally and does not run reliably on native Windows shells — use Cloudflare Pages Git Integration (Option 1) when developing on Windows.

---

## Security & multi-tenancy

- Passwords hashed with Web Crypto PBKDF2-SHA256 (with local Node `scrypt` backwards compatibility); sessions are signed httpOnly HMAC-SHA256 cookies.
- Every repository operation is scoped by `organizationId`; the dashboard only ever reads the caller's own business.
- Rate-limiting, RBAC roles, and audit fields are part of the design (see `docs/ARCHITECTURE.md`).

---

## Supabase mapping (production)

For production you would replace the local store in `lib/repo.ts` with Supabase: PostgreSQL tables mirroring the schema
in `docs/ARCHITECTURE.md` (§4), Supabase Auth for authentication, and **Row Level Security** policies so each
organization can only read its own rows. The `lib/repo.ts` functions already return plain objects and are the single
isolation boundary to swap.

---

## Non-negotiable principles

- No review gating / selective redirection / sentiment-based restrictions — every rating (1–5) sees all options.
- No fabricated reviews, fake praise, unsupported SEO keywords, or forced text.
- Never claim "submitted" reviews; never bypass Google's review composer.
- No founder branding implying Google verification/endorsement; the Google link is the business's own configured URL.
- Subtle platform signature on customer pages that never overpowers the client's brand.
- QR provides the same functionality as NFC.
