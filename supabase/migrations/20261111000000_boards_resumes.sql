-- Pivot: job *finder*. Boards of saved search links, resume versions, LaTeX source.
-- The tracker tables (jobs, contacts, job_contacts, activities) are left in place for later.

-- ---------------------------------------------------------------------------
-- boards: LinkedIn, Naukri, Indeed, …
-- ---------------------------------------------------------------------------
create table public.boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  home_url    text check (home_url is null or char_length(home_url) <= 2000),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- searches: one saved URL = one tab under a board
-- ---------------------------------------------------------------------------
create table public.searches (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references public.boards (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  url             text not null check (char_length(url) between 1 and 4000),
  last_opened_at  timestamptz,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index searches_board_id_idx on public.searches (board_id, sort_order, created_at);

create trigger searches_set_updated_at
  before update on public.searches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- resumes: PDF versions stored in the private "resumes" storage bucket
-- ---------------------------------------------------------------------------
create table public.resumes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  storage_path  text not null unique,
  size_bytes    int not null check (size_bytes > 0),
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);

-- at most one primary resume
create unique index resumes_one_primary_idx on public.resumes (is_primary) where is_primary;

-- ---------------------------------------------------------------------------
-- resume_sources: editable LaTeX source files
-- ---------------------------------------------------------------------------
create table public.resume_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger resume_sources_set_updated_at
  before update on public.resume_sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Private storage bucket for the PDFs (8 MB max, PDF only).
-- storage.objects already has RLS with no public policies → only the secret key can reach it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 8388608, array['application/pdf']);

-- ---------------------------------------------------------------------------
-- RLS on, no policies, no grants for public roles
-- ---------------------------------------------------------------------------
alter table public.boards         enable row level security;
alter table public.searches       enable row level security;
alter table public.resumes        enable row level security;
alter table public.resume_sources enable row level security;

revoke all on public.boards, public.searches, public.resumes, public.resume_sources
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed: the user's first LinkedIn search (past 24h, under 10 applicants)
-- ---------------------------------------------------------------------------
with b as (
  insert into public.boards (name, home_url, sort_order)
  values ('LinkedIn', 'https://www.linkedin.com/jobs/', 0)
  returning id
)
insert into public.searches (board_id, name, url)
select id, 'AI Engineer · past 24h · under 10 applicants',
       'https://www.linkedin.com/jobs/search-results/?keywords=AI%20Engineer&f_TPR=r86400&f_EA=true'
from b;
