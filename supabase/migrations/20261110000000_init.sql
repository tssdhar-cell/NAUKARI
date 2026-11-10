-- NAUKARI: personal job application tracker
-- Applied with `npm run db:push` (Supabase CLI). Do not edit after it has run; add a new migration instead.
--
-- Security model: the app talks to the database only from the server using the
-- secret key (which bypasses RLS). RLS is enabled on every table with NO
-- policies, so the public publishable/anon key cannot read or write anything.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  company       text not null check (char_length(company) between 1 and 200),
  title         text not null check (char_length(title) between 1 and 200),
  url           text check (url is null or char_length(url) <= 2000),
  platform      text not null default 'linkedin'
                check (platform in ('linkedin', 'glassdoor', 'instahyre', 'company_website', 'other')),
  location      text,
  description   text,
  experience    text,
  salary_range  text,
  status        text not null default 'saved'
                check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  date_added    date not null default current_date,
  date_applied  date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index jobs_status_idx on public.jobs (status);
create index jobs_platform_idx on public.jobs (platform);
create index jobs_date_added_idx on public.jobs (date_added desc);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contacts (recruiters, hiring managers, referrals)
-- ---------------------------------------------------------------------------
create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 200),
  company       text,
  designation   text,
  linkedin_url  text,
  email         text,
  phone         text,
  notes         text,
  status        text not null default 'not_contacted'
                check (status in ('not_contacted', 'contacted', 'responded', 'no_response', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index contacts_name_idx on public.contacts (name);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- job_contacts (many-to-many)
-- ---------------------------------------------------------------------------
create table public.job_contacts (
  job_id      uuid not null references public.jobs (id) on delete cascade,
  contact_id  uuid not null references public.contacts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (job_id, contact_id)
);

create index job_contacts_contact_id_idx on public.job_contacts (contact_id);

-- ---------------------------------------------------------------------------
-- activities: notes, status changes, recruiter outreach, follow-ups, interviews
-- ---------------------------------------------------------------------------
create table public.activities (
  id                 uuid primary key default gen_random_uuid(),
  job_id             uuid references public.jobs (id) on delete cascade,
  contact_id         uuid references public.contacts (id) on delete cascade,
  type               text not null
                     check (type in ('note', 'status_change', 'outreach', 'follow_up', 'interview')),
  title              text,
  body               text,
  method             text check (method is null or method in ('email', 'linkedin', 'phone', 'whatsapp', 'other')),
  response_received  boolean,
  due_date           date,          -- follow-up / interview date
  due_time           time,          -- optional interview time (local wall-clock)
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (job_id is not null or contact_id is not null)
);

create index activities_job_id_idx on public.activities (job_id, created_at desc);
create index activities_contact_id_idx on public.activities (contact_id, created_at desc);
create index activities_open_due_idx on public.activities (due_date)
  where completed_at is null and due_date is not null;

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- templates: reusable recruiter messages ({company}, {role}, {name})
-- ---------------------------------------------------------------------------
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: on, with no policies → public keys get nothing.
-- ---------------------------------------------------------------------------
alter table public.jobs         enable row level security;
alter table public.contacts     enable row level security;
alter table public.job_contacts enable row level security;
alter table public.activities   enable row level security;
alter table public.templates    enable row level security;

revoke all on public.jobs, public.contacts, public.job_contacts, public.activities, public.templates
  from anon, authenticated;
