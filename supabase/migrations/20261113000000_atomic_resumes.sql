-- Atomic resume writes are independent of optional legacy cleanup.
begin;

-- Both resume RPCs take the same transaction-scoped advisory lock. This serializes
-- selection and upload registration, including two simultaneous first uploads.
-- SECURITY INVOKER preserves caller permissions/RLS; only the server's service
-- role can execute these functions. The existing partial unique index is retained.
create function public.set_primary_resume(p_resume_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(1312904523, 1);

  -- Validate and lock the target before demoting anything; deletion must wait.
  perform 1 from public.resumes where id = p_resume_id for update;
  if not found then
    raise exception 'Resume not found' using errcode = 'P0002';
  end if;

  update public.resumes set is_primary = false where is_primary and id <> p_resume_id;
  update public.resumes set is_primary = true where id = p_resume_id;
end;
$$;

create function public.register_resume(
  p_name text,
  p_storage_path text,
  p_size_bytes integer,
  p_make_primary boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
  should_be_primary boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(1312904523, 1);
  should_be_primary := coalesce(p_make_primary, false)
    or not exists (select 1 from public.resumes);

  if should_be_primary then
    update public.resumes set is_primary = false where is_primary;
  end if;

  -- If insertion fails, the transaction also rolls back the previous demotion.
  insert into public.resumes (name, storage_path, size_bytes, is_primary)
  values (p_name, p_storage_path, p_size_bytes, should_be_primary)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.set_primary_resume(uuid) from public, anon, authenticated;
revoke all on function public.register_resume(text, text, integer, boolean) from public, anon, authenticated;
grant execute on function public.set_primary_resume(uuid) to service_role;
grant execute on function public.register_resume(text, text, integer, boolean) to service_role;

commit;
