# Naukari — personal job application tracker

One place to save job links (LinkedIn, Glassdoor, Instahyre, careers pages), track application status, manage recruiters, keep notes, schedule follow-ups and interviews, and reuse recruiter message templates. Works on desktop and phone.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase Postgres · Vercel

## How it works

- **Login:** single user, credentials come from env vars (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). A signed, httpOnly session cookie (30 days) is checked in `proxy.ts` and again in every server action.
- **Database access:** only from the server, using the Supabase **secret** key (`lib/supabase.ts`, marked `server-only`). RLS is enabled on every table with **no policies**, so the public publishable/anon key can't read or write anything.
- **Data model** (`supabase/migrations/001_init.sql`):
  - `jobs`: listing, status, dates, notes
  - `contacts`: recruiters
  - `job_contacts`: many-to-many link between jobs and recruiters
  - `activities`: one timeline for notes, status changes, outreach, follow-ups and interviews
  - `templates`: recruiter messages with `{name}`, `{company}` and `{role}` placeholders
- No scraping or job-board APIs. You paste the link and enter the details yourself.

## Project layout

```
app/login/                 sign-in page
app/(app)/                 authenticated pages (dashboard, jobs, contacts, follow-ups, templates, settings)
app/api/export/[table]/    CSV export
components/                shared UI (forms, lists, timeline, dialogs); components/ui = shadcn
lib/actions/               server actions (all mutations, zod-validated)
lib/data.ts                server-side queries
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
npm run db:new add_referral_column    # creates supabase/migrations/<timestamp>_add_referral_column.sql
# write the SQL, e.g.  alter table public.jobs add column referred_by text;
npm run db:push -- --dry-run          # preview
npm run db:push                       # apply (each file runs once; history is tracked in the database)
npm run db:status                     # local files vs. applied
```

Remember to enable RLS on any new table (`alter table … enable row level security;`) so the public key can't reach it.

## Deploy to Vercel

1. Push to GitHub (`main`).
2. Vercel → **Add New → Project** → import the repo. The framework is auto-detected and no build settings are needed.
3. Under **Environment Variables**, add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` and `APP_TIMEZONE`. `SUPABASE_DB_URL` is not needed there.
4. **Deploy.** Open the `*.vercel.app` URL on your laptop and phone. Every push to `main` redeploys automatically.

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
