-- Created by the dashboard's "auto-enable RLS" setting; it is only meant to run
-- as an event trigger, never through the API.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

-- TODO: merge the paired permissive UPDATE policies on profiles, applications
-- and documents into one policy each (advisor 0006, performance only).
