# Naukari — personal job finder

A launchpad for the daily job hunt. Saved job-site searches open with one tap, outreach templates are a click away, and your resume PDF versions live in one place. Works on desktop and phone.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres + Storage) · Vercel

## Features

- **Boards** — one per job site (LinkedIn, Naukri, Indeed…). Each board holds **tabs**: saved search URLs with your filters baked in. Tap a tab to open it in a new browser tab; the app remembers when you last opened it so you can see what's left in today's sweep. *Duplicate* a tab, change the keywords (LinkedIn links get a Keywords field), save.
- **Templates** — a notebook of messages you send to recruiters (LinkedIn notes, emails). Copy with one click.
- **Resume** — upload PDF versions (private Supabase Storage), preview, download, rename, delete, and mark the one you usually send as primary.

No scraping, no job-board APIs. You set up searches on the sites themselves and save the links.

## How it works

- **Login:** single user, credentials from env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). A signed, httpOnly session cookie (30 days) is checked in `proxy.ts` and again in every server action and API route.
- **Data access:** only from the server, with the Supabase **secret** key (`lib/supabase.ts`, marked `server-only`). Row-level security is enabled on every table with no policies, and the `resumes` storage bucket is private, so public keys can't read anything. PDFs are streamed through `app/api/resumes/[id]` after a session check.
- **Schema** (`supabase/migrations/`): `boards`, `searches`, `resumes` (PDF versions), `templates`. The cleanup migration removes six unused tracker/editor tables only when they are empty. Audit timestamps on retained tables stay in place.
- **Primary resume:** server-only RPCs register uploads and change the primary in a database transaction. Both take the same advisory transaction lock; the partial unique index also enforces at most one primary. Invalid targets or failed inserts preserve the previous primary. The RPCs use caller permissions and are executable only by the server's `service_role` (and the database owner).

## Project layout

```
app/login/                 sign-in page
app/(app)/                 boards (home), templates, resume, settings
app/api/resumes/           PDF upload (POST) and download/preview (GET /[id])
lib/resume-storage.ts      stores a PDF in the private bucket + resumes row
components/                shared UI; components/ui = shadcn
lib/actions/               server actions (all mutations, zod-validated)
lib/data.ts                server-side queries
lib/linkedin.ts            saved-search URL helpers (keywords, cleanup, filter labels)
lib/session*.ts, proxy.ts  auth
supabase/migrations/       SQL migrations, applied with npm run db:push
scripts/db.mjs             wrapper around the Supabase CLI
```

## Local setup

1. **Env:** copy `.env.example` to `.env.local` and fill in the values.
   - `SUPABASE_SECRET_KEY` is under Supabase → Settings → API Keys → Secret keys.
   - `SUPABASE_DB_URL` is under Supabase → **Connect** → Connection String → **Session pooler**, with your database password filled in.
2. Install, create the tables, and run:
   ```bash
   npm install
   npm run db:push  # applies supabase/migrations/* to the database
   npm run dev      # http://localhost:3000
   ```

## Changing the database

Never edit an applied migration. Add a new one instead:

```bash
npm run db:new add_something            # creates supabase/migrations/<timestamp>_add_something.sql
# write the SQL, e.g.  alter table public.searches add column notes text;
npm run db:push -- --dry-run            # preview
npm run db:push                         # apply (each file runs once; history is tracked in the database)
npm run db:status                       # local files vs. applied
```

Enable RLS on any new table (`alter table … enable row level security;`) so the public key can't reach it.

### Cleanup migration rollout

Two new, ordered migrations keep resume reliability independent of optional cleanup; historical migrations are unchanged. Apply `20261113000000_atomic_resumes.sql` **before deploying the updated application**, which requires `set_primary_resume` and `register_resume`. The existing application remains compatible with that migration during rollout. `20261113010000_cleanup_legacy_tables.sql` runs afterward as a separate transaction. A cleanup failure leaves the RPC migration committed, so populated legacy tables do not block deploying the application after confirming the RPC migration succeeded.

Back up the database first. The cleanup migration locks the six legacy tables (`jobs`, `contacts`, `job_contacts`, `activities`, `resume_sources`, `resume_docs`) and aborts if any contains data. Archive any retained historical data explicitly before retrying; cleanup never deletes populated tables. It uses `DROP ... RESTRICT`, so unexpected dependencies also abort and roll back that migration. It retains all four active tables, their RLS settings, indexes, and audit columns. No migration is applied merely by building or running tests.

### Database validation

Application behavior tests run without a database:

```bash
node --test tests/db-actions.test.mjs
```

They execute the actual TypeScript action/storage modules with mocked I/O, covering authenticated single-RPC selection, failure propagation, correct upload metadata, and uploaded-file cleanup after registration failure.

Run the migrations and SQL regression checks in disposable embedded PostgreSQL without connecting to Supabase:

```bash
npm install --prefix node_modules/.audit-tools --no-save --package-lock=false @electric-sql/pglite
node scripts/test-db.mjs
```

The optional test dependency lives under ignored `node_modules`; it does not change the app manifest or lockfile. The runner bootstraps Supabase-style roles and the bucket metadata table in memory. It verifies cleanup refuses existing data and unexpected dependencies, retained RLS, RPC execution permissions, first-upload selection, primary switching, invalid-target preservation, and rollback after a failed insert. It also attempts both RPCs as `anon` and `authenticated` and expects denial.

For a **disposable local Supabase database** with all migrations already applied, the same SQL regression script can run directly:

```bash
psql -v ON_ERROR_STOP=1 "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/resumes.sql
```

The SQL test temporarily locks and clears the local resume table inside a transaction and rolls fixture changes back. Do not run it against production. Embedded PostgreSQL is single-connection; simultaneous requests contending for the advisory lock require a separate multi-session local Postgres/Supabase check. These tests do not validate remote Supabase Storage or deployment configuration.

### UI validation and performance scope

With Node.js 22.21 or later, run the unit tests, lint, and production build:

```bash
npm test
npm run lint
npm run build
```

Run browser regressions against the production build using installed Microsoft Edge:

```bash
npm install --prefix node_modules/.audit-tools --no-save --package-lock=false --ignore-scripts playwright @electric-sql/pglite
npm run test:ui
```

The browser runner starts its own app server with synthetic credentials and a local mock Supabase server. It never uses the real database. It verifies filtering, incremental rendering, optimistic opened-status updates and failure rollback without list refetches, lazy editors, mobile dialog scrolling, template expansion, deferred PDF previews, selection fallback after deletion, login protection, and 44px touch controls. Set `TEST_BROWSER_CHANNEL=chrome` to use installed Google Chrome instead of Edge. The optional test dependencies stay inside ignored `node_modules`; app dependencies and the lockfile are unchanged.

Lists render in batches with explicit “Show more” controls, but server queries still fetch whole collections. Requested PDFs still use the authenticated, uncached server download route; previews are not loaded until requested and are unmounted on mobile. These changes have behavioral regression coverage, not production latency or Core Web Vitals benchmarks. Server pagination and PDF streaming remain future optimizations.

## Deploy to Vercel

1. Push to GitHub (`main`).
2. Vercel → **Add New → Project** → import the repo. The framework is auto-detected; no build settings needed.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` (and optionally `APP_TIMEZONE`). `SUPABASE_DB_URL` is **not** needed there.
4. **Deploy.** Every push to `main` redeploys automatically. If the link asks for a Vercel login, use the production domain (Settings → Domains) or turn off *Deployment Protection → Vercel Authentication*.

**Changing the password:** edit `ADMIN_PASSWORD` in Vercel → Settings → Environment Variables, then redeploy. Changing `SESSION_SECRET` signs everyone out.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checks too) |
| `npm run lint` | ESLint |
| `npm test` | Unit and mocked-I/O regression tests |
| `npm run test:db` | SQL regressions in disposable embedded PostgreSQL (optional dependency above) |
| `npm run test:ui` | Browser regressions against an existing production build (optional dependency above) |
| `npm run db:new <name>` | New empty migration file |
| `npm run db:push` | Apply pending migrations to Supabase |
| `npm run db:status` | Show migration status |
