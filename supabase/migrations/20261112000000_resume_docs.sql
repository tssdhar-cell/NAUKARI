-- Structured resume documents edited in the app; the PDF is generated from `data`.
-- resume_sources (LaTeX) is left in place, unused.

create table public.resume_docs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger resume_docs_set_updated_at
  before update on public.resume_docs
  for each row execute function public.set_updated_at();

alter table public.resume_docs enable row level security;
revoke all on public.resume_docs from anon, authenticated;
