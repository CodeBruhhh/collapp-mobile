-- Admin tools:
--   1. AI usage and health: an on/off switch and per-kind daily limits in
--      platform_settings, admin_ai_overview() and admin_retry_ai_jobs()
--   2. Access management: admin_set_user_role() (role and college changes) and
--      admin_set_college_suspended() (suspend a college and its representatives)
--   3. Campus feed moderation: content_reports filed by students through
--      report_content(), reviewed by admins through admin_moderation_queue()
--      and admin_moderate(); taken-down posts cannot be republished by reps
-- Every admin function is security definer and checks private.is_admin() itself.

-- 1. AI usage and health -------------------------------------------------------

-- Each value is a whole number of uses per person per day (0 turns that kind off).
create or replace function private.valid_ai_limits(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p) = 'object'
    and coalesce((
      select bool_and(
        jsonb_typeof(e.value) = 'number'
        and (e.value #>> '{}')::numeric between 0 and 1000
        and (e.value #>> '{}')::numeric = trunc((e.value #>> '{}')::numeric))
      from jsonb_each(p) e
    ), true);
$$;

alter table public.platform_settings
  add column ai_enabled boolean not null default true,
  add column ai_limits jsonb not null
    default '{"document_check": 30, "document_check_auto": 40, "essay_feedback": 15}'
    constraint platform_settings_ai_limits check (private.valid_ai_limits(ai_limits));

-- Audit the new switches alongside the existing ones.
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
            'featured_college_ids', jsonb_build_array(old.featured_college_ids, new.featured_college_ids),
            'ai_enabled', jsonb_build_array(old.ai_enabled, new.ai_enabled),
            'ai_limits', jsonb_build_array(old.ai_limits, new.ai_limits)));
  return null;
end;
$$;

drop trigger if exists audit_platform_settings on public.platform_settings;
create trigger audit_platform_settings
  after update on public.platform_settings
  for each row
  when (old.applications_open is distinct from new.applications_open
        or old.maintenance_mode is distinct from new.maintenance_mode
        or old.featured_college_ids is distinct from new.featured_college_ids
        or old.ai_enabled is distinct from new.ai_enabled
        or old.ai_limits is distinct from new.ai_limits)
  execute function private.audit_platform_settings();

-- Everything the AI monitor shows, in one round trip.
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
      select jsonb_build_object('enabled', s.ai_enabled, 'limits', s.ai_limits)
      from public.platform_settings s),
    -- Uses today, per kind (document_check, document_check_auto, essay_feedback).
    'today', (
      select coalesce(jsonb_object_agg(t.kind, t.n), '{}'::jsonb)
      from (
        select u.kind, sum(u.count)::integer as n
        from private.ai_usage u
        where u.day = current_date
        group by u.kind
      ) t),
    -- All uses per day for the last 14 days, oldest first, zero-filled.
    'daily', (
      select jsonb_agg(jsonb_build_object('day', d.day::date, 'count', coalesce(u.n, 0))
                       order by d.day)
      from generate_series(current_date - 13, current_date, interval '1 day') as d(day)
      left join (
        select u.day, sum(u.count)::integer as n
        from private.ai_usage u
        where u.day > current_date - 14
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
        where u.day = current_date
        order by u.count desc
        limit 6
      ) t)
  );
end;
$$;
revoke execute on function public.admin_ai_overview() from public, anon;
grant execute on function public.admin_ai_overview() to authenticated;

-- Re-run recent failed or skipped AI jobs now, even ones out of automatic attempts.
create or replace function public.admin_retry_ai_jobs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  if not (select s.ai_enabled from public.platform_settings s) then
    raise exception 'Turn AI checks back on before retrying' using errcode = '22023';
  end if;

  for v_id in
    select c.document_id from public.document_ai_checks c
    where c.status in ('failed', 'skipped') and c.updated_at > now() - interval '3 days'
    order by c.updated_at desc
    limit 20
  loop
    update public.document_ai_checks set attempts = 0, updated_at = now() where document_id = v_id;
    perform private.call_edge('ai-check-document', jsonb_build_object('document_id', v_id));
    v_count := v_count + 1;
  end loop;

  for v_id in
    select r.application_id from public.essay_ai_reviews r
    where r.status in ('failed', 'skipped') and r.updated_at > now() - interval '3 days'
    order by r.updated_at desc
    limit 10
  loop
    update public.essay_ai_reviews set attempts = 0, updated_at = now() where application_id = v_id;
    perform private.call_edge('ai-essay', jsonb_build_object('application_id', v_id));
    v_count := v_count + 1;
  end loop;

  insert into public.audit_logs (actor_id, action, entity, meta)
  values ((select auth.uid()), 'ai.jobs_retried', 'ai', jsonb_build_object('count', v_count));
  return v_count;
end;
$$;
revoke execute on function public.admin_retry_ai_jobs() from public, anon;
grant execute on function public.admin_retry_ai_jobs() to authenticated;

-- 2. Access management -----------------------------------------------------------

-- Change someone's role, or move a representative to another college.
create or replace function public.admin_set_user_role(
  p_user uuid,
  p_role public.user_role,
  p_college uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.profiles;
  v_college uuid := case when p_role = 'school_rep' then p_college end;
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;

  select * into v_old from public.profiles where id = p_user for update;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if p_role = 'school_rep' then
    if v_college is null then
      raise exception 'Choose the college this representative belongs to' using errcode = '22023';
    end if;
    if not exists (select 1 from public.colleges c where c.id = v_college) then
      raise exception 'College not found' using errcode = 'P0002';
    end if;
  end if;

  if v_old.role = p_role and v_old.college_id is not distinct from v_college then
    return;
  end if;

  -- A staff account must never own applications it could review.
  if v_old.role = 'student' and p_role <> 'student' and exists (
    select 1 from public.applications a where a.student_id = p_user and a.status <> 'draft'
  ) then
    raise exception 'This student has submitted applications, so they cannot become staff'
      using errcode = '23514';
  end if;

  -- Leaving a college: hand back the applications assigned to them there.
  if v_old.role = 'school_rep' and v_old.college_id is distinct from v_college then
    perform set_config('app.workflow', 'on', true);
    update public.applications set assigned_to = null where assigned_to = p_user;
    perform set_config('app.workflow', 'off', true);
  end if;

  -- audit_profile_change records the change.
  update public.profiles set role = p_role, college_id = v_college where id = p_user;
end;
$$;
revoke execute on function public.admin_set_user_role(uuid, public.user_role, uuid) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.user_role, uuid) to authenticated;

alter table public.colleges add column suspended_at timestamptz;

-- A suspended college stays hidden until an admin reinstates it.
create or replace function private.guard_college_suspension()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.suspended_at is not null and new.profile_status = 'published' then
    raise exception 'Reinstate this college before publishing it' using errcode = '23514';
  end if;
  if (select auth.uid()) is not null and not private.is_admin()
     and new.suspended_at is distinct from old.suspended_at then
    raise exception 'Only administrators can suspend a college' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_college_suspension
  before update on public.colleges
  for each row execute function private.guard_college_suspension();

-- Suspend: hide the college and suspend its active representatives.
-- Reinstate: reactivate exactly the representatives that suspension affected;
-- the college stays a draft until an admin publishes it again.
create or replace function public.admin_set_college_suspended(p_college uuid, p_suspended boolean)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college public.colleges;
  v_rep_ids uuid[];
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  select * into v_college from public.colleges where id = p_college for update;
  if not found then
    raise exception 'College not found' using errcode = 'P0002';
  end if;

  if p_suspended then
    if v_college.suspended_at is not null then
      return 0;
    end if;
    select coalesce(array_agg(p.id), '{}') into v_rep_ids
    from public.profiles p
    where p.college_id = p_college and p.role = 'school_rep' and p.status = 'active';

    update public.colleges
    set suspended_at = now(), profile_status = 'draft'
    where id = p_college;
    update public.profiles set status = 'suspended' where id = any (v_rep_ids);

    insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
    values ((select auth.uid()), 'college.suspended', 'college', p_college,
            jsonb_build_object('name', v_college.name, 'rep_ids', to_jsonb(v_rep_ids)));
  else
    if v_college.suspended_at is null then
      return 0;
    end if;
    select coalesce(array_agg(value::uuid), '{}') into v_rep_ids
    from (
      select l.meta -> 'rep_ids' as ids
      from public.audit_logs l
      where l.action = 'college.suspended' and l.entity_id = p_college
      order by l.created_at desc
      limit 1
    ) last_suspension, jsonb_array_elements_text(last_suspension.ids);

    update public.colleges set suspended_at = null where id = p_college;
    update public.profiles
    set status = 'active'
    where id = any (v_rep_ids) and college_id = p_college and role = 'school_rep';

    insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
    values ((select auth.uid()), 'college.reinstated', 'college', p_college,
            jsonb_build_object('name', v_college.name, 'rep_ids', to_jsonb(v_rep_ids)));
  end if;
  return coalesce(array_length(v_rep_ids, 1), 0);
end;
$$;
revoke execute on function public.admin_set_college_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_college_suspended(uuid, boolean) to authenticated;

-- 3. Campus feed moderation --------------------------------------------------------

alter table public.posts
  add column taken_down_at timestamptz,
  add column takedown_reason text check (char_length(takedown_reason) <= 500);

-- Only admins take posts down or bring them back; reps cannot republish them.
create or replace function private.guard_post_takedown()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.taken_down_at := null;
    new.takedown_reason := null;
    return new;
  end if;
  if new.taken_down_at is distinct from old.taken_down_at
     or new.takedown_reason is distinct from old.takedown_reason then
    raise exception 'Only administrators can take posts down or restore them' using errcode = '42501';
  end if;
  if new.taken_down_at is not null and new.status = 'published' then
    raise exception 'A CollApp administrator removed this post, so it cannot be republished'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_post_takedown
  before insert or update on public.posts
  for each row execute function private.guard_post_takedown();

create type public.report_status as enum ('open', 'dismissed', 'actioned');

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target text not null check (target in ('post', 'comment')),
  post_id uuid not null references public.posts (id) on delete cascade,
  comment_id uuid references public.post_comments (id) on delete set null,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text not null
    check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details text check (char_length(details) <= 500),
  -- The comment text or post title when it was reported (kept after removal).
  snapshot text not null check (char_length(snapshot) <= 1000),
  comment_author_id uuid references public.profiles (id) on delete set null,
  status public.report_status not null default 'open',
  resolution text
    check (resolution in ('dismissed', 'comment_removed', 'post_taken_down', 'author_suspended')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint content_reports_post_target check (target = 'comment' or comment_id is null),
  constraint content_reports_resolved check ((status = 'open') = (resolved_at is null))
);
-- One open report per person per post or comment.
create unique index content_reports_open_once
  on public.content_reports (reporter_id, target, post_id, comment_id) nulls not distinct
  where status = 'open';
create index content_reports_queue_idx on public.content_reports (status, created_at desc);
create index on public.content_reports (post_id);
create index on public.content_reports (comment_id);
create index on public.content_reports (reporter_id);
create index on public.content_reports (comment_author_id);
create index on public.content_reports (resolved_by);

-- Reports are only read and written through the functions below.
alter table public.content_reports enable row level security;
create policy "content_reports: admin read"
  on public.content_reports for select to authenticated
  using ((select private.is_admin()));
grant select on public.content_reports to authenticated;
grant all on public.content_reports to service_role;

-- Whoever deletes a reported comment (its author, a rep or an admin) settles its reports.
create or replace function private.resolve_reports_on_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.content_reports
  set status = 'actioned', resolution = 'comment_removed',
      resolved_by = (select auth.uid()), resolved_at = now()
  where comment_id = old.id and status = 'open';
  return old;
end;
$$;

create trigger resolve_reports_on_comment_delete
  before delete on public.post_comments
  for each row execute function private.resolve_reports_on_comment_delete();

-- Student reports a live post or another student's comment.
create or replace function public.report_content(
  p_post uuid,
  p_comment uuid default null,
  p_reason text default 'other',
  p_details text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post public.posts;
  v_comment public.post_comments;
  v_target text := case when p_comment is null then 'post' else 'comment' end;
  v_snapshot text;
  v_first boolean;
begin
  if private.auth_role() is distinct from 'student' then
    raise exception 'Only students can report posts and comments' using errcode = '42501';
  end if;
  if p_reason not in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other') then
    raise exception 'Choose a reason' using errcode = '22023';
  end if;

  select * into v_post from public.posts where id = p_post and status = 'published';
  if not found then
    raise exception 'This post is no longer available' using errcode = 'P0002';
  end if;
  v_snapshot := v_post.title;

  if p_comment is not null then
    select * into v_comment from public.post_comments where id = p_comment and post_id = p_post;
    if not found then
      raise exception 'This comment was already removed' using errcode = 'P0002';
    end if;
    if v_comment.author_id = (select auth.uid()) then
      raise exception 'You cannot report your own comment' using errcode = '22023';
    end if;
    v_snapshot := v_comment.body;
  end if;

  if (select count(*) from public.content_reports r
      where r.reporter_id = (select auth.uid()) and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'You have sent a lot of reports today. Try again tomorrow.' using errcode = '22023';
  end if;

  -- Already reported by this student and still open: nothing more to do.
  if exists (
    select 1 from public.content_reports r
    where r.reporter_id = (select auth.uid()) and r.status = 'open'
      and r.target = v_target and r.post_id = p_post
      and r.comment_id is not distinct from p_comment
  ) then
    return;
  end if;

  v_first := not exists (
    select 1 from public.content_reports r
    where r.status = 'open' and r.target = v_target and r.post_id = p_post
      and r.comment_id is not distinct from p_comment
  );

  insert into public.content_reports
    (target, post_id, comment_id, reporter_id, reason, details, snapshot, comment_author_id)
  values (v_target, p_post, p_comment, (select auth.uid()), p_reason,
          nullif(left(btrim(coalesce(p_details, '')), 500), ''),
          left(v_snapshot, 1000), v_comment.author_id);

  -- Tell the admins once per reported item, not once per report.
  if v_first then
    insert into public.notifications (user_id, type, title, body, data)
    select p.id, 'content_report',
           case when v_target = 'comment' then 'A comment was reported' else 'A post was reported' end,
           left(v_snapshot, 140),
           jsonb_build_object('post_id', p_post, 'comment_id', p_comment)
    from public.profiles p
    where p.role = 'admin' and p.status = 'active';
  end if;
end;
$$;
revoke execute on function public.report_content(uuid, uuid, text, text) from public, anon;
grant execute on function public.report_content(uuid, uuid, text, text) to authenticated;

-- Reported items, one entry per post or comment, newest activity first.
create or replace function public.admin_moderation_queue(p_status text default 'open')
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

  return (
    select coalesce(jsonb_agg(to_jsonb(q) order by q.last_reported_at desc), '[]'::jsonb)
    from (
      select
        r.target,
        r.post_id,
        r.comment_id,
        count(*)::integer as report_count,
        array_agg(distinct r.reason) as reasons,
        (array_remove(array_agg(r.details order by r.created_at desc), null))[1:3] as details,
        (array_agg(r.snapshot order by r.created_at desc))[1] as snapshot,
        min(r.created_at) as first_reported_at,
        max(r.created_at) as last_reported_at,
        (array_agg(r.resolution order by r.resolved_at desc nulls last))[1] as resolution,
        max(r.resolved_at) as resolved_at,
        (array_agg(rp.full_name order by r.resolved_at desc nulls last))[1] as resolved_by_name,
        p.title as post_title,
        p.status as post_status,
        p.taken_down_at,
        p.takedown_reason,
        c.name as college_name,
        r.comment_id is not null and exists (
          select 1 from public.post_comments pc where pc.id = r.comment_id
        ) as comment_exists,
        (array_agg(r.comment_author_id))[1] as author_id,
        (array_agg(ap.full_name))[1] as author_name,
        (array_agg(ap.email))[1] as author_email,
        (array_agg(ap.status))[1] as author_status
      from public.content_reports r
      join public.posts p on p.id = r.post_id
      join public.colleges c on c.id = p.college_id
      left join public.profiles ap on ap.id = r.comment_author_id
      left join public.profiles rp on rp.id = r.resolved_by
      where case when p_status = 'open' then r.status = 'open' else r.status <> 'open' end
        and (p_status = 'open' or r.resolved_at > now() - interval '30 days')
      group by r.target, r.post_id, r.comment_id, p.id, c.id
      order by max(r.created_at) desc
      limit 100
    ) q
  );
end;
$$;
revoke execute on function public.admin_moderation_queue(text) from public, anon;
grant execute on function public.admin_moderation_queue(text) to authenticated;

-- Act on a reported item. Returns how many reports it settled.
--   dismiss         nothing wrong: close the reports
--   remove_comment  delete the comment (its reports close as comment_removed)
--   suspend_author  delete the comment and suspend the student who wrote it
--   take_down_post  hide the post from students; its college's reps are told why
--   restore_post    publish a taken-down post again
create or replace function public.admin_moderate(
  p_post uuid,
  p_comment uuid,
  p_action text,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_post public.posts;
  v_author uuid;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
  v_count integer := 0;
  v_ids uuid[];
begin
  if not private.is_admin() then
    raise exception 'Administrators only' using errcode = '42501';
  end if;
  select * into v_post from public.posts where id = p_post for update;
  if not found then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;

  if p_action = 'dismiss' then
    update public.content_reports
    set status = 'dismissed', resolution = 'dismissed', resolved_by = v_admin, resolved_at = now()
    where status = 'open' and post_id = p_post
      and target = case when p_comment is null then 'post' else 'comment' end
      and comment_id is not distinct from p_comment;
    get diagnostics v_count = row_count;

  elsif p_action in ('remove_comment', 'suspend_author') then
    if p_comment is null then
      raise exception 'Choose a comment' using errcode = '22023';
    end if;
    select pc.author_id into v_author from public.post_comments pc
    where pc.id = p_comment and pc.post_id = p_post;
    if v_author is null then
      select r.comment_author_id into v_author from public.content_reports r
      where r.comment_id = p_comment and r.comment_author_id is not null
      limit 1;
    end if;

    if p_action = 'suspend_author' then
      if v_author is null then
        raise exception 'The author of this comment is no longer known' using errcode = 'P0002';
      end if;
      update public.profiles set status = 'suspended'
      where id = v_author and role = 'student' and status = 'active';
    end if;

    -- Deleting the comment clears comment_id on its reports, so note them first.
    select coalesce(array_agg(r.id), '{}') into v_ids
    from public.content_reports r
    where r.comment_id = p_comment and r.status = 'open';
    delete from public.post_comments where id = p_comment;
    update public.content_reports
    set status = 'actioned',
        resolution = case when p_action = 'suspend_author' then 'author_suspended' else 'comment_removed' end,
        resolved_by = v_admin,
        resolved_at = now()
    where id = any (v_ids);
    get diagnostics v_count = row_count;

  elsif p_action = 'take_down_post' then
    update public.posts
    set status = 'draft', taken_down_at = now(), takedown_reason = v_note
    where id = p_post;
    -- Hiding the post hides its comments too, so every open report on it is settled.
    update public.content_reports
    set status = 'actioned', resolution = 'post_taken_down', resolved_by = v_admin, resolved_at = now()
    where status = 'open' and post_id = p_post;
    get diagnostics v_count = row_count;

    insert into public.notifications (user_id, type, title, body, data)
    select p.id, 'post_taken_down', 'A post was removed by CollApp',
           left(v_post.title || coalesce(': ' || v_note, ''), 300),
           jsonb_build_object('post_id', p_post)
    from public.profiles p
    where p.college_id = v_post.college_id and p.role = 'school_rep' and p.status = 'active';

  elsif p_action = 'restore_post' then
    if v_post.taken_down_at is null then
      raise exception 'This post was not taken down' using errcode = '22023';
    end if;
    update public.posts
    set taken_down_at = null, takedown_reason = null, status = 'published'
    where id = p_post;

  else
    raise exception 'Unknown moderation action' using errcode = '22023';
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values (v_admin,
          'moderation.' || p_action,
          case when p_comment is null then 'post' else 'post_comment' end,
          coalesce(p_comment, p_post),
          jsonb_build_object('post_id', p_post, 'post_title', v_post.title,
                             'comment_id', p_comment, 'author_id', v_author,
                             'note', v_note, 'reports', v_count));
  return v_count;
end;
$$;
revoke execute on function public.admin_moderate(uuid, uuid, text, text) from public, anon;
grant execute on function public.admin_moderate(uuid, uuid, text, text) to authenticated;

-- Dashboard numbers: add open reports and today's AI uses -------------------------
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
      select coalesce(sum(u.count), 0)::integer from private.ai_usage u where u.day = current_date),
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
