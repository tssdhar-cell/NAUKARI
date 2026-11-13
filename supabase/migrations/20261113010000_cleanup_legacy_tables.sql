-- Retire unused tracker/editor tables without deleting historical user data.
-- Keep this migration transactional: both the safety checks and DROP must commit together.
begin;

-- Prevent a writer from inserting between the emptiness check and DROP.
lock table public.activities, public.job_contacts, public.jobs, public.contacts,
  public.resume_sources, public.resume_docs in access exclusive mode;

do $$
declare
  legacy_table text;
  has_data boolean;
begin
  foreach legacy_table in array array[
    'activities', 'job_contacts', 'jobs', 'contacts', 'resume_sources', 'resume_docs'
  ] loop
    execute format('select exists (select 1 from public.%I)', legacy_table) into has_data;
    if has_data then
      raise exception 'Cleanup stopped: public.% contains data. Back up and explicitly archive its data before retrying.', legacy_table;
    end if;
  end loop;
end;
$$;

-- No CASCADE: an unexpected view/FK/dependency must stop cleanup for review.
-- Drop child tables before their parents. RLS remains enabled on every retained table.
drop table public.activities restrict;
drop table public.job_contacts restrict;
drop table public.jobs restrict;
drop table public.contacts restrict;
drop table public.resume_sources restrict;
drop table public.resume_docs restrict;

commit;
