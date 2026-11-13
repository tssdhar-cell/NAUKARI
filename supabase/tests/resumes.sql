-- LOCAL disposable Supabase database only, after applying all migrations.
-- psql -v ON_ERROR_STOP=1 "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/resumes.sql
-- All fixture changes roll back. This script temporarily locks and clears resumes.
begin;
lock table public.resumes in access exclusive mode;

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array['jobs', 'contacts', 'job_contacts', 'activities', 'resume_sources', 'resume_docs'] loop
    if to_regclass('public.' || relation_name) is not null then
      raise exception 'Legacy table remains: %', relation_name;
    end if;
  end loop;
  foreach relation_name in array array['boards', 'searches', 'resumes', 'templates'] loop
    if not exists (select 1 from pg_class where oid = to_regclass('public.' || relation_name) and relrowsecurity) then
      raise exception 'RLS not enabled: %', relation_name;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.set_primary_resume(uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.set_primary_resume(uuid)', 'execute')
    or has_function_privilege('anon', 'public.register_resume(text,text,integer,boolean)', 'execute')
    or has_function_privilege('authenticated', 'public.register_resume(text,text,integer,boolean)', 'execute') then
    raise exception 'Public roles must not execute resume RPCs';
  end if;
  if not has_function_privilege('service_role', 'public.set_primary_resume(uuid)', 'execute')
    or not has_function_privilege('service_role', 'public.register_resume(text,text,integer,boolean)', 'execute') then
    raise exception 'Service role must execute resume RPCs';
  end if;
end;
$$;

delete from public.resumes;
set local role service_role;

do $$
declare
  first_id uuid;
  second_id uuid;
begin
  first_id := public.register_resume('First', 'test-first.pdf', 10, false);
  if not (select is_primary from public.resumes where id = first_id) then
    raise exception 'First upload must become primary';
  end if;
  second_id := public.register_resume('Second', 'test-second.pdf', 20, false);
  if (select is_primary from public.resumes where id = second_id) then
    raise exception 'Second upload must retain existing primary';
  end if;
  perform public.set_primary_resume(second_id);
  if (select count(*) from public.resumes where is_primary) <> 1
    or not (select is_primary from public.resumes where id = second_id) then
    raise exception 'Selection must atomically switch primary';
  end if;
  perform public.set_primary_resume(second_id); -- idempotent

  begin
    perform public.set_primary_resume('00000000-0000-0000-0000-000000000000');
    raise exception 'Missing target unexpectedly accepted';
  exception when no_data_found then
    null;
  end;
  if not (select is_primary from public.resumes where id = second_id) then
    raise exception 'Missing target must preserve primary';
  end if;

  begin
    perform public.register_resume('Duplicate', 'test-first.pdf', 30, true);
    raise exception 'Duplicate path unexpectedly accepted';
  exception when unique_violation then
    null;
  end;
  if not (select is_primary from public.resumes where id = second_id) then
    raise exception 'Failed insert must roll back primary demotion';
  end if;

  perform public.register_resume('Third', 'test-third.pdf', 30, true);
  if (select count(*) from public.resumes where is_primary) <> 1
    or not (select is_primary from public.resumes where storage_path = 'test-third.pdf') then
    raise exception 'Explicit primary upload must switch primary';
  end if;
end;
$$;

rollback;
