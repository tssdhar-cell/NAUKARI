# Naukari — personal job finder

A launchpad for the daily job hunt. Saved job-site searches open with one tap, outreach templates are a click away, and your resume versions (plus the LaTeX source) live in one place. Works on desktop and phone.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres + Storage) · Vercel

## Features

- **Boards** — one per job site (LinkedIn, Naukri, Indeed…). Each board holds **tabs**: saved search URLs with your filters baked in. Tap a tab to open it in a new browser tab; the app remembers when you last opened it so you can see what's left in today's sweep. *Duplicate* a tab, change the keywords (LinkedIn links get a Keywords field), save.
- **Templates** — a notebook of messages you send to recruiters (LinkedIn notes, emails). Copy with one click.
- **Resume** — upload PDF versions (private Supabase Storage), preview, download, mark one as primary. Keep the LaTeX source in the app; edit it, then *Open in Overleaf* to compile and upload the new PDF.

No scraping, no job-board APIs. You set up searches on the sites themselves and save the links.

## How it works

- **Login:** single user, credentials from env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). A signed, httpOnly session cookie (30 days) is checked in `proxy.ts` and again in every server action and API route.
- **Data access:** only from the server, with the Supabase **secret** key (`lib/supabase.ts`, marked `server-only`). Row-level security is enabled on every table with no policies, and the `resumes` storage bucket is private, so public keys can't read anything. PDFs are streamed through `app/api/resumes/[id]` after a session check.
- **Schema** (`supabase/migrations/`): `boards`, `searches`, `resumes`, `resume_sources`, `templates`. The earlier tracker tables (`jobs`, `contacts`, `job_contacts`, `activities`) are kept but unused.

## Project layout

```
app/login/                 sign-in page
app/(app)/                 boards (home), templates, resume, settings
app/api/resumes/           PDF upload (POST) and download/preview (GET /[id])
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
| `npm run db:new <name>` | New empty migration file |
| `npm run db:push` | Apply pending migrations to Supabase |
| `npm run db:status` | Show migration status |
