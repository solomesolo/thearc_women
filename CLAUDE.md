# The Arc Woman — Project Guide for Claude

## What This Project Is

A women's health personalization platform. Users take a survey, the system scores their biological signals and health areas, and delivers a personalized dashboard with insights, monitoring targets, and preventive strategies. Built by Anna Solovyova (Founder).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (custom `.tgz` install), React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, Framer Motion 12.34.3 |
| Auth | next-auth 4.24.13 (CredentialsProvider, JWT sessions) |
| ORM | Prisma 7.4.2 with `@prisma/adapter-pg` |
| Database | PostgreSQL via Supabase |
| Supabase SDK | `@supabase/supabase-js` 2.49.1 |
| Runtime | Node.js 20, webpack (`next dev --webpack`, NOT Turbopack) |

---

## Project Structure

```
app/                   Next.js App Router pages and API routes
components/            React components
  admin/               Article/knowledge admin UI
  blog/                Article cards, filters, templates
  dashboard/           Full dashboard UI (42 components, DashboardV3 is root)
  layout/              Header, Footer, Nav
  sections/            Homepage content sections (Hero, Founder, Journey, etc.)
  survey/              Survey flow components (Arc + standard variants)
  system/, system2/    Interactive demo/explainer pages
  ui/                  Base components (Button, Card, Input, etc.)
lib/                   Business logic and data access
  auth.ts              NextAuth config, credentials, getUserAccess()
  db.ts                Prisma singleton with lazy proxy
  dashboard/           getLatestDashboard.ts, mappers.ts, types.ts
  survey/              Survey schemas and Arc logic engine
  startingLensEngine/  Personalization scoring engine
prisma/                Schema and migrations
public/                Static assets (images, fonts)
scripts/               One-off scripts (scraping, backfill, migrations)
proxy.ts               Admin route protection (Next.js 16 middleware)
next.config.ts         Webpack config, Prisma externals, dev workarounds
```

---

## Running Locally

```bash
# One-time setup
npm ci
cp .env.example .env.local
npm run dev:bootstrap       # DB migrate + seed + backfill

# Daily dev
npm run dev                 # starts on http://localhost:3000
```

**Login credentials (local dev):**
- `demo@thearc.com` / `demo`
- `iron@test.com`, `stress@test.com`, `sugar@test.com`, `baseline@test.com` / `demo`

---

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service auth token |
| `NEXTAUTH_URL` | `http://127.0.0.1:3000` locally |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `DATABASE_URL` | Prisma primary DB connection |
| `DIRECT_URL` | Direct DB URL (bypasses pgbouncer for migrations) |
| `CREDENTIALS_PASSWORD` | Override default `"demo"` test password |

---

## Route Map

| Route | Description |
|---|---|
| `/` | Homepage (Hero, Journey, Founder sections) |
| `/login` | Credentials login |
| `/survey` | Health survey flow (redirects if no session) |
| `/dashboard` | Personalized health dashboard (requires auth) |
| `/blog` | Article list |
| `/blog/[slug]` | Article detail |
| `/assessment` | Assessment landing |
| `/system`, `/system2` | Interactive demo explainers |
| `/admin/*` | Content management (protected by proxy.ts JWT check) |
| `/api/dashboard` | Dashboard data API |
| `/api/survey` | Survey submission |
| `/api/auth/[...nextauth]` | NextAuth handlers |
| `/api/admin/*` | Article + knowledge CRUD |
| `/api/dev/profiles/apply` | Dev-only: apply fixture survey profiles |

---

## Authentication

- **Provider:** CredentialsProvider (email + password), hard-coded test accounts in `lib/auth.ts`
- **Session:** JWT, 30-day maxAge
- **Admin protection:** `proxy.ts` exports a `proxy` function (not `middleware`) — required by Next.js 16 naming convention. Guards `/admin` and `/admin/:path*`.
- **Server-side:** `getUserAccess()` in `lib/auth.ts` returns `{ isLoggedIn, isSubscriber }`

---

## Database / Prisma

`lib/db.ts` creates a singleton `PrismaClient` using `PrismaPg` adapter:
- Prefers `DIRECT_URL` (avoids pgbouncer connection limits on serverless)
- Falls back to `DATABASE_URL`, then `localhost:5432`
- Uses a **lazy proxy** pattern — the actual client is not initialized until first use, so dev server startup is not blocked even if DB is unreachable

---

## Dashboard Data Flow

```
User submits survey
  → /api/survey writes survey_responses to Supabase
  → scoring pipeline writes:
      user_hero_baseline, user_key_area_scores, user_signal_scores

GET /api/dashboard
  → lib/dashboard/getLatestDashboard.ts
  → queries Supabase for latest survey_response + all scored rows
  → lib/dashboard/mappers.ts transforms raw rows → DashboardPayload
  → returned to DashboardV3 component

DashboardV3 renders child components with typed DashboardPayload props
```

**Key dashboard types** (`lib/dashboard/types.ts`):
- `DashboardHero` — top-level baseline summary
- `DashboardKeyArea` — one of 11 health areas (sleep, stress, energy, recovery, hormones, cycle, metabolism, nutrition, cardiovascular, gut, skin_hair)
- `DashboardSignal` — individual biological signal score
- `DashboardPayload` — full response including hero, keyAreas[], signals[]

---

## Critical Webpack/Dev Config Notes

### Why `experimental.isolatedDevBuild: false`
Next.js 16 defaults `experimental.isolatedDevBuild: true`, which outputs dev builds to `.next/dev/` instead of `.next/`. The hot reloader cleans this directory at startup, then webpack's `afterEmit` assets are `SizeOnlySource` objects (`.source()` throws), so nothing gets written and all routes return 500. Setting `isolatedDevBuild: false` makes dev mode use `.next/` directly where webpack writes real files to disk.

### Why CJS aliases for Prisma
`@prisma/driver-adapter-utils` imports `{ Debug }` from `@prisma/debug` via ESM. Webpack's static analysis fails on the CJS `0 && (module.exports = {Debug,...})` export pattern. Aliases in `next.config.ts` force both packages to their `dist/index.js` (CJS) builds.

### Why framer-motion CJS alias
framer-motion 12.x has ESM circular dependencies that cause webpack to hang during compilation.

### `proxy.ts` vs `middleware.ts`
Next.js 16 renamed the middleware convention from `middleware.ts` → `proxy.ts`. The exported function must be named `proxy` (not `middleware`). Do not create `middleware.ts` alongside `proxy.ts` — it will throw a conflict error.

---

## Dev Fixture Profiles

`/api/dev/profiles/apply` (POST, dev-only) applies pre-built survey fixture data to simulate different user states:
- `baseline_low_signal` — healthy baseline, few signals
- `stress_sleep` — stress + sleep disruption pattern
- `iron_pattern` — iron deficiency signals
- `sugar_instability` — blood sugar pattern

Used with `components/survey/SurveyDevProfiles.tsx` for rapid dashboard testing.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | `next dev --webpack -p 3000` |
| `npm run dev:bootstrap` | `db:migrate` + `db:seed` + `backfill:sections-8-9` |
| `npm run dev:watchdog` | Auto-restarts dev server on health check failures (`scripts/dev_watchdog.mjs`) |
| `npm run build` | `next build --webpack` |
| `npm run scrape:pubmed` | Scrape PubMed for articles |
| `npm run process:articles` | Process scraped articles into DB |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Run Prisma seed script |
