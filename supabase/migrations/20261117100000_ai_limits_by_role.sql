-- AI limits per role, shown to the people they apply to:
--   * platform_settings.ai_limits becomes { student: {...}, school_rep: {...} };
--     administrators are never limited (their uses are still counted)
--   * days follow Philippine time, so limits reset at midnight in Manila
--   * use_ai_quota() never counts past the limit, refund_ai_quota() gives a use
--     back when the AI call fails, and an automatic document check is charged
--     once per uploaded file (retries are free)
--   * reps' "Summarize with AI" / "Regenerate" is limited (essay_summary)
--   * my_ai_usage(): the caller's own uses and limits for today

-- Philippine calendar day -----------------------------------------------------

create or replace function private.ai_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Manila')::date;
$$;

-- When today's limits reset (next midnight in Manila).
create or replace function private.ai_next_reset()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((private.ai_today() + 1)::timestamp at time zone 'Asia/Manila');
$$;

alter table private.ai_usage alter column day set default private.ai_today();

-- Limits per role ---------------------------------------------------------------

create or replace function private.ai_default_limits()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{
    "student": {"document_check_auto": 40, "document_check": 30, "essay_feedback": 15},
    "school_rep": {"document_check": 100, "essay_summary": 50}
  }'::jsonb;
$$;

alter table public.platform_settings drop constraint platform_settings_ai_limits;

-- { role: { kind: whole number 0-1000 } } for students and representatives.
create or replace function private.valid_ai_limits(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p) = 'object'
    and coalesce((
      select bool_and(
        case
          when r.key not in ('student', 'school_rep') then false
          when jsonb_typeof(r.value) <> 'object' then false
          else coalesce((
            select bool_and(
              jsonb_typeof(k.value) = 'number'
              and (k.value #>> '{}')::numeric between 0 and 1000
              and (k.value #>> '{}')::numeric = trunc((k.value #>> '{}')::numeric))
            from jsonb_each(r.value) k
          ), true)
        end)
      from jsonb_each(p) r
    ), true);
$$;

-- Carry the flat limits over as the student limits; reps start with the defaults.
update public.platform_settings
set ai_limits = jsonb_build_object(
  'student', jsonb_build_object(
    'document_check_auto', coalesce((ai_limits ->> 'document_check_auto')::integer, 40),
    'document_check', coalesce((ai_limits ->> 'document_check')::integer, 30),
    'essay_feedback', coalesce((ai_limits ->> 'essay_feedback')::integer, 15)),
  'school_rep', private.ai_default_limits() -> 'school_rep')
where not (ai_limits ? 'student');

alter table public.platform_settings
  alter column ai_limits set default private.ai_default_limits(),
  add constraint platform_settings_ai_limits check (private.valid_ai_limits(ai_limits));

-- The daily limit for one role and kind; null = unlimited (administrators).
-- A kind a role does not use (e.g. essay_summary for students) is 0.
create or replace function private.ai_limit(p_role public.user_role, p_kind text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_role = 'admin' then null
    else coalesce(
      ((select s.ai_limits from public.platform_settings s) -> p_role::text ->> p_kind)::integer,
      (private.ai_default_limits() -> p_role::text ->> p_kind)::integer,
      0)
  end;
$$;

-- Counting uses ---------------------------------------------------------------------

-- Count one use if the person is still under their role's limit. Service role only.
-- Returns { allowed, used, limit } (limit null = unlimited).
create or replace function public.use_ai_quota(p_user uuid, p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_limit integer;
  v_count integer;
  v_day date := private.ai_today();
begin
  select p.role into v_role from public.profiles p where p.id = p_user;
  if not found then
    return jsonb_build_object('allowed', false, 'used', 0, 'limit', 0);
  end if;
  v_limit := private.ai_limit(v_role, p_kind);

  if v_limit is null then
    insert into private.ai_usage (user_id, day, kind, count)
    values (p_user, v_day, p_kind, 1)
    on conflict (user_id, day, kind) do update set count = private.ai_usage.count + 1
    returning count into v_count;
    return jsonb_build_object('allowed', true, 'used', v_count, 'limit', null);
  end if;

  if v_limit > 0 then
    insert into private.ai_usage (user_id, day, kind, count)
    values (p_user, v_day, p_kind, 1)
    on conflict (user_id, day, kind) do update set count = private.ai_usage.count + 1
      where private.ai_usage.count < v_limit
    returning count into v_count;
  end if;

  if v_count is null then
    select u.count into v_count from private.ai_usage u
    where u.user_id = p_user and u.day = v_day and u.kind = p_kind;
    return jsonb_build_object('allowed', false, 'used', coalesce(v_count, 0), 'limit', v_limit);
  end if;
  return jsonb_build_object('allowed', true, 'used', v_count, 'limit', v_limit);
end;
$$;
revoke execute on function public.use_ai_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.use_ai_quota(uuid, text) to service_role;

-- Give a use back when the AI call failed, so people only pay for results.
create or replace function public.refund_ai_quota(p_user uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.ai_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user and day = private.ai_today() and kind = p_kind;
$$;
revoke execute on function public.refund_ai_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_ai_quota(uuid, text) to service_role;

-- Older deployments call this; same rules (Manila day, never past the limit).
create or replace function public.consume_ai_quota(p_user uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_limit <= 0 then
    return false;
  end if;
  insert into private.ai_usage (user_id, day, kind, count)
  values (p_user, private.ai_today(), p_kind, 1)
  on conflict (user_id, day, kind) do update set count = private.ai_usage.count + 1
    where private.ai_usage.count < p_limit
  returning count into v_count;
  return v_count is not null;
end;
$$;

-- The signed-in person's own uses and limits for today.
create or replace function public.my_ai_usage()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := private.auth_role();
  v_kinds text[] := case v_role
    when 'student' then array['document_check_auto', 'document_check', 'essay_feedback']
    when 'school_rep' then array['document_check', 'essay_summary']
    else '{}'::text[]
  end;
begin
  return jsonb_build_object(
    'enabled', (select s.ai_enabled from public.platform_settings s),
    'resets_at', private.ai_next_reset(),
    'role', v_role,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'kind', t.kind,
               'used', coalesce(u.count, 0),
               'limit', private.ai_limit(v_role, t.kind)) order by t.ord), '[]'::jsonb)
      from unnest(v_kinds) with ordinality as t(kind, ord)
      left join private.ai_usage u
        on u.user_id = (select auth.uid()) and u.day = private.ai_today() and u.kind = t.kind));
end;
$$;
revoke execute on function public.my_ai_usage() from public, anon;
grant execute on function public.my_ai_usage() to authenticated;

-- Automatic checks: charged once per uploaded file -----------------------------------

alter table public.document_ai_checks
  add column quota_charged boolean not null default false;

create or replace function private.request_document_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.application_id is null then
    return null;
  end if;
  insert into public.document_ai_checks (document_id, application_id, status, source_path)
  values (new.id, new.application_id, 'pending', new.storage_path)
  on conflict (document_id) do update set
    application_id = excluded.application_id,
    status = 'pending',
    source_path = excluded.source_path,
    verdict = null, detected_type = null, relevant = null, matches_requirement = null,
    complete = null, legible = null, name_match = null, issues = '[]', key_details = '[]',
    summary = null, confidence = null, model = null, error = null,
    attempts = 0, quota_charged = false, checked_at = null, updated_at = now();
  perform private.call_edge('ai-check-document', jsonb_build_object('document_id', new.id));
  return null;
end;
$$;
revoke execute on function private.request_document_check() from public, anon, authenticated;

-- Admin monitor and dashboard count by the Manila day too --------------------------

create or replace function public.admin_ai_overview()
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
    'settings', (
      select jsonb_build_object('enabled', s.ai_enabled, 'limits', s.ai_limits,
                                'defaults', private.ai_default_limits(),
                                'resets_at', private.ai_next_reset())
      from public.platform_settings s),
    -- Uses today, per kind (document_check, document_check_auto, essay_feedback).
    'today', (
      select coalesce(jsonb_object_agg(t.kind, t.n), '{}'::jsonb)
      from (
        select u.kind, sum(u.count)::integer as n
        from private.ai_usage u
        where u.day = private.ai_today()
        group by u.kind
      ) t),
    -- All uses per day for the last 14 days, oldest first, zero-filled.
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d.day::date, 'count', coalesce(u.n, 0))
                       order by d.day)
      from generate_series(private.ai_today() - 13, private.ai_today(), interval '1 day') as d(day)
      left join (
        select u.day, sum(u.count)::integer as n
        from private.ai_usage u
        where u.day > private.ai_today() - 14
        group by u.day
      ) u on u.day = d.day::date),
    -- Document checks touched in the last 7 days.
    'documents', jsonb_build_object(
      'by_status', (
        select coalesce(jsonb_object_agg(x.status, x.n), '{}'::jsonb)
        from (
          select c.status, count(*)::integer as n
          from public.document_ai_checks c
          where c.updated_at > now() - interval '7 days'
          group by c.status
        ) x),
      'by_verdict', (
        select coalesce(jsonb_object_agg(x.verdict, x.n), '{}'::jsonb)
        from (
          select c.verdict, count(*)::integer as n
          from public.document_ai_checks c
          where c.status = 'done' and c.checked_at > now() - interval '7 days'
          group by c.verdict
        ) x)),
    'essays', (
      select coalesce(jsonb_object_agg(x.status, x.n), '{}'::jsonb)
      from (
        select r.status, count(*)::integer as n
        from public.essay_ai_reviews r
        where r.updated_at > now() - interval '7 days'
        group by r.status
      ) x),
    -- Which Gemini model produced each stored result (shows how often the fallback ran).
    'models', (
      select coalesce(jsonb_object_agg(x.model, x.n), '{}'::jsonb)
      from (
        select m.model, count(*)::integer as n
        from (
          select c.model from public.document_ai_checks c
          where c.status = 'done' and c.checked_at > now() - interval '7 days'
          union all
          select r.model from public.essay_ai_reviews r
          where r.status = 'done' and r.generated_at > now() - interval '7 days'
        ) m
        where m.model is not null
        group by m.model
      ) x),
    -- waiting: the cron job will still retry; gave_up: out of automatic attempts.
    'queue', jsonb_build_object(
      'waiting',
        (select count(*) from public.document_ai_checks c
          where c.status in ('pending', 'failed') and c.attempts < 3)
        + (select count(*) from public.essay_ai_reviews r
            where r.status in ('pending', 'failed') and r.attempts < 3),
      'gave_up',
        (select count(*) from public.document_ai_checks c
          where c.status = 'failed' and c.attempts >= 3)
        + (select count(*) from public.essay_ai_reviews r
            where r.status = 'failed' and r.attempts >= 3)),
    'recent_errors', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.occurred_at desc), '[]'::jsonb)
      from (
        select * from (
          select 'document' as kind, c.status::text as status, c.error, c.updated_at as occurred_at
          from public.document_ai_checks c
          where c.error is not null and c.status in ('failed', 'skipped')
          union all
          select 'essay', r.status::text, r.error, r.updated_at
          from public.essay_ai_reviews r
          where r.error is not null and r.status in ('failed', 'skipped')
        ) all_errors
        order by occurred_at desc
        limit 8
      ) e),
    -- Heaviest users today, to spot someone running into (or abusing) the limits.
    'top_users', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.count desc), '[]'::jsonb)
      from (
        select p.id, p.full_name, p.email, p.role, u.kind, u.count
        from private.ai_usage u
        join public.profiles p on p.id = u.user_id
        where u.day = private.ai_today()
        order by u.count desc
        limit 6
      ) t)
  );
end;
$$;


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
        'draft', count(*) filter (where profile_status = 'draft'),
        'suspended', count(*) filter (where suspended_at is not null))
      from public.colleges),
    'applications', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.applications group by status) s),
    'messages_last_7_days', (
      select count(*) from public.messages where created_at > now() - interval '7 days'),
    'blocked_attachments', (
      select count(*) from public.messages where scan_status = 'blocked'),
    'open_reports', (
      select count(*) from (
        select distinct r.target, r.post_id, r.comment_id
        from public.content_reports r where r.status = 'open'
      ) items),
    'ai_uses_today', (
      select coalesce(sum(u.count), 0)::integer from private.ai_usage u where u.day = private.ai_today()),
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


-- Same rule as earlier migrations: private helpers for signed-in users only.
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
