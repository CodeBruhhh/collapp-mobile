-- Admin console (SDD screens 27-31, SRS 3.1.3): dashboard statistics, RLS
-- oversight, push broadcasts, and audit coverage for platform settings.
-- Every function checks private.is_admin() itself: they are security definer.

-- Dashboard numbers in one round trip (SDD 27).
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users', (
      select jsonb_build_object(
        'student', count(*) filter (where role = 'student'),
        'school_rep', count(*) filter (where role = 'school_rep'),
        'admin', count(*) filter (where role = 'admin'),
        'suspended', count(*) filter (where status = 'suspended'))
      from public.profiles),
    'colleges', (
      select jsonb_build_object(
        'published', count(*) filter (where profile_status = 'published'),
        'draft', count(*) filter (where profile_status = 'draft'))
      from public.colleges),
    'applications', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.applications group by status) s),
    'messages_last_7_days', (
      select count(*) from public.messages where created_at > now() - interval '7 days'),
    'blocked_attachments', (
      select count(*) from public.messages where scan_status = 'blocked'),
    -- Submissions per week for the last 8 weeks, oldest first, zero-filled.
    'weekly_submissions', (
      select jsonb_agg(jsonb_build_object('week', w.week, 'count', coalesce(c.n, 0)) order by w.week)
      from generate_series(
        date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week'
      ) as w(week)
      left join (
        select date_trunc('week', submitted_at) as week, count(*) as n
        from public.applications
        where submitted_at is not null
        group by 1
      ) c on c.week = w.week)
  );
end;
$$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Tenant / RLS oversight (SDD 29): every API table, whether RLS is on, and its policies.
create or replace function public.admin_rls_overview()
returns table (table_name text, rls_enabled boolean, policy_count integer, policies text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;

  return query
  select c.relname::text,
         c.relrowsecurity,
         count(p.policyname)::integer,
         coalesce(array_agg(p.policyname::text order by p.policyname)
                    filter (where p.policyname is not null), '{}')
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  left join pg_catalog.pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
  where n.nspname = 'public' and c.relkind = 'r'
  group by c.relname, c.relrowsecurity
  order by c.relname;
end;
$$;
revoke execute on function public.admin_rls_overview() from public, anon;
grant execute on function public.admin_rls_overview() to authenticated;

-- Push broadcast (SDD 31): one notification per active recipient; the existing
-- notifications trigger delivers pushes to those who allow them.
create or replace function public.admin_broadcast(
  p_title text,
  p_body text,
  p_audience text default 'all'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 3 and 120 then
    raise exception 'The title must be 3 to 120 characters' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then
    raise exception 'The message must be 1 to 1000 characters' using errcode = '22023';
  end if;
  if p_audience not in ('all', 'student', 'school_rep', 'admin') then
    raise exception 'Unknown audience' using errcode = '22023';
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  select p.id, 'broadcast', btrim(p_title), btrim(p_body),
         jsonb_build_object('audience', p_audience)
  from public.profiles p
  where p.status = 'active'
    and (p_audience = 'all' or p.role::text = p_audience);
  get diagnostics v_count = row_count;

  insert into public.audit_logs (actor_id, action, entity, meta)
  values ((select auth.uid()), 'notification.broadcast', 'notification',
          jsonb_build_object('title', btrim(p_title), 'body', btrim(p_body),
                             'audience', p_audience, 'recipients', v_count));
  return v_count;
end;
$$;
revoke execute on function public.admin_broadcast(text, text, text) from public, anon;
grant execute on function public.admin_broadcast(text, text, text) to authenticated;

-- Admins cannot lock themselves out (suspend or demote their own account).
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if private.is_admin() then
    if new.id = (select auth.uid())
      and (new.role is distinct from old.role or new.status is distinct from old.status) then
      raise exception 'You cannot change your own role or status' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role
    or new.college_id is distinct from old.college_id
    or new.status is distinct from old.status
    or new.email is distinct from old.email then
    raise exception 'You cannot change role, college, status or email' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Audit platform switches and college publishing decisions.
create or replace function private.audit_platform_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, meta)
  values ((select auth.uid()), 'platform.settings_changed', 'platform_settings',
          jsonb_build_object(
            'applications_open', jsonb_build_array(old.applications_open, new.applications_open),
            'maintenance_mode', jsonb_build_array(old.maintenance_mode, new.maintenance_mode),
            'featured_college_ids', jsonb_build_array(old.featured_college_ids, new.featured_college_ids)));
  return null;
end;
$$;

create trigger audit_platform_settings
  after update on public.platform_settings
  for each row
  when (old.applications_open is distinct from new.applications_open
        or old.maintenance_mode is distinct from new.maintenance_mode
        or old.featured_college_ids is distinct from new.featured_college_ids)
  execute function private.audit_platform_settings();

create or replace function private.audit_college_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'college.status_changed', 'college', new.id,
          jsonb_build_object('from', old.profile_status, 'to', new.profile_status));
  return null;
end;
$$;

create trigger audit_college_status
  after update of profile_status on public.colleges
  for each row
  when (old.profile_status is distinct from new.profile_status)
  execute function private.audit_college_status();

create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);
