-- The review queue at scale (rep app):
--   1. reviewer assignment on applications, changed only through assign_applications()
--   2. review_queue_items: one row per submitted application with everything the
--      queue filters, sorts and shows, so the app pages through it with PostgREST
--   3. review_queue_counts(): tab and quick-view counts for the current filters
--   4. program_seats(): admitted and held admissions against each program's slots
--   5. message_templates: saved decision and resubmission wording per college

-- 1. Reviewer assignment ------------------------------------------------------

alter table public.applications
  add column assigned_to uuid references public.profiles (id) on delete set null;
create index on public.applications (college_id, assigned_to);

-- Students can never set it, and reps change it through assign_applications()
-- (which validates the reviewer and writes the audit log).
create or replace function private.guard_application_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.in_workflow() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.assigned_to := null;
  elsif new.assigned_to is distinct from old.assigned_to then
    raise exception 'Use assign_applications to change the reviewer' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_application_assignment
  before insert or update on public.applications
  for each row execute function private.guard_application_assignment();

-- RPC: give applications to a reviewer of the caller's college (null = unassign).
create or replace function public.assign_applications(p_application_ids uuid[], p_assignee uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid := private.auth_college();
  v_ids uuid[];
begin
  if v_college is null then
    raise exception 'Representatives only' using errcode = '42501';
  end if;
  if p_assignee is not null and not exists (
    select 1 from public.profiles p
    where p.id = p_assignee and p.role = 'school_rep' and p.status = 'active'
      and p.college_id = v_college
  ) then
    raise exception 'Choose an active representative of your college' using errcode = '23514';
  end if;

  perform set_config('app.workflow', 'on', true);
  with changed as (
    update public.applications
    set assigned_to = p_assignee
    where id = any (p_application_ids)
      and college_id = v_college
      and status <> 'draft'
      and assigned_to is distinct from p_assignee
    returning id
  )
  select coalesce(array_agg(id), '{}') into v_ids from changed;
  perform set_config('app.workflow', 'off', true);

  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  select (select auth.uid()), 'application.assigned', 'application', id,
         jsonb_build_object('assignee', p_assignee)
  from unnest(v_ids) as id;
  return cardinality(v_ids);
end;
$$;
revoke execute on function public.assign_applications(uuid[], uuid) from public, anon;
grant execute on function public.assign_applications(uuid[], uuid) to authenticated;

-- Reps can't read each other's profiles under RLS; this lists only names.
create or replace function public.college_reviewers()
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), p.email)
  from public.profiles p
  where p.college_id = private.auth_college()
    and p.role = 'school_rep'
    and p.status = 'active'
  order by 2;
$$;
revoke execute on function public.college_reviewers() from public, anon;
grant execute on function public.college_reviewers() to authenticated;

-- 2. Queue view -----------------------------------------------------------------

-- security_invoker: the caller's RLS applies, so a rep sees only their college.
create view public.review_queue_items
with (security_invoker = true)
as
select
  a.id,
  a.college_id,
  a.status,
  a.submitted_at,
  a.decided_at,
  a.updated_at,
  a.program_id,
  a.second_program_id,
  a.student_id,
  a.assigned_to,
  s.first_name,
  s.last_name,
  btrim(coalesce(s.first_name, '') || ' ' || coalesce(s.last_name, '')) as student_name,
  p.name as program_name,
  sc.fit_score,
  d.total as documents_total,
  d.pending as documents_pending,
  d.approved as documents_approved,
  d.resubmit as documents_resubmit,
  d.ai_flags,
  m.missing as documents_missing,
  sd.decision as held_decision,
  -- Quick views. Undecided = submitted, under review or waiting on the student.
  (a.status in ('submitted', 'under_review', 'action_required')
    and sd.application_id is null
    and d.approved = d.total
    and m.missing = 0) as is_ready,
  (a.status in ('submitted', 'under_review', 'action_required')
    and (m.missing > 0 or d.resubmit > 0)) as is_missing,
  (a.status in ('submitted', 'under_review', 'action_required')
    and d.ai_flags > 0) as is_flagged,
  -- The student has waited a week for the college (not the other way round).
  (a.status in ('submitted', 'under_review')
    and sd.application_id is null
    and a.submitted_at < now() - interval '7 days') as is_waiting
from public.applications a
left join public.students s on s.user_id = a.student_id
join public.programs p on p.id = a.program_id
left join public.ai_scores sc on sc.application_id = a.id
left join public.staged_decisions sd on sd.application_id = a.id
cross join lateral (
  select
    count(*)::int as total,
    count(*) filter (where doc.review_status = 'pending')::int as pending,
    count(*) filter (where doc.review_status = 'approved')::int as approved,
    count(*) filter (where doc.review_status = 'resubmit')::int as resubmit,
    count(*) filter (
      where doc.review_status = 'pending' and c.verdict in ('review', 'fail')
    )::int as ai_flags
  from public.documents doc
  left join public.document_ai_checks c on c.document_id = doc.id
  where doc.application_id = a.id
) d
cross join lateral (
  -- Required documents with no file (e.g. a requirement added after submission).
  select count(*)::int as missing
  from public.requirements r
  where r.college_id = a.college_id
    and r.kind = 'document'
    and r.is_required
    and (r.program_id is null or r.program_id = a.program_id)
    and not exists (
      select 1 from public.documents doc
      where doc.application_id = a.id and doc.requirement_id = r.id
    )
) m
where a.status <> 'draft';

grant select on public.review_queue_items to authenticated;

-- 3. Counts -------------------------------------------------------------------------

-- Tab counts (narrowed by the chosen quick view) and quick-view counts, for the
-- caller's college with the same program, reviewer and search filters as the list.
-- p_assignee: null = anyone, 'me', 'none' (unassigned) or a reviewer's id.
create or replace function public.review_queue_counts(
  p_program_id uuid default null,
  p_assignee text default null,
  p_search text default null,
  p_view text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select i.*
    from public.review_queue_items i
    where i.college_id = (select private.auth_college())
      and (p_program_id is null or i.program_id = p_program_id)
      and (
        p_assignee is null
        or (p_assignee = 'me' and i.assigned_to = (select auth.uid()))
        or (p_assignee = 'none' and i.assigned_to is null)
        or (p_assignee not in ('me', 'none') and i.assigned_to::text = p_assignee)
      )
      and (
        coalesce(btrim(p_search), '') = ''
        or i.student_name ilike '%' || replace(replace(btrim(p_search), '%', ''), '_', '') || '%'
      )
  ),
  v as (
    select * from q
    where p_view is null
      or (p_view = 'ready' and is_ready)
      or (p_view = 'missing' and is_missing)
      or (p_view = 'flagged' and is_flagged)
      or (p_view = 'waiting' and is_waiting)
  )
  select jsonb_build_object(
    'status', (
      select jsonb_build_object(
        'all', count(*),
        'new', count(*) filter (where status = 'submitted'),
        'review', count(*) filter (where status = 'under_review'),
        'resubmission', count(*) filter (where status = 'action_required'),
        'accepted', count(*) filter (where status = 'accepted'),
        'rejected', count(*) filter (where status = 'rejected')
      ) from v
    ),
    'views', (
      select jsonb_build_object(
        'ready', count(*) filter (where is_ready),
        'missing', count(*) filter (where is_missing),
        'flagged', count(*) filter (where is_flagged),
        'waiting', count(*) filter (where is_waiting)
      ) from q
    )
  );
$$;
revoke execute on function public.review_queue_counts(uuid, text, text, text) from public, anon;
grant execute on function public.review_queue_counts(uuid, text, text, text) to authenticated;

-- 4. Seats ----------------------------------------------------------------------------

-- Admissions sent and held against each program's slots (null = no limit set).
create or replace function public.program_seats()
returns table (program_id uuid, slots integer, admitted integer, held integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.slots,
    (select count(*)::int from public.applications a
      where a.final_program_id = p.id and a.status = 'accepted'),
    (select count(*)::int from public.staged_decisions s
      where s.final_program_id = p.id and s.decision = 'accepted')
  from public.programs p
  where p.college_id = (select private.auth_college());
$$;
revoke execute on function public.program_seats() from public, anon;
grant execute on function public.program_seats() to authenticated;

-- 5. Message templates --------------------------------------------------------------

-- Shared by a college's reps. Placeholders such as {first_name} are filled in the app.
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  kind text not null check (kind in ('admit', 'decline', 'resubmit')),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Resubmission requests become document review notes (max 1000 characters).
  constraint message_templates_resubmit_length check (kind <> 'resubmit' or char_length(body) <= 1000)
);
create index on public.message_templates (college_id, kind);
create index on public.message_templates (created_by);

create trigger set_updated_at before update on public.message_templates
  for each row execute function public.set_updated_at();

alter table public.message_templates enable row level security;

create policy "message_templates: own college reps"
  on public.message_templates for all to authenticated
  using (college_id = (select private.auth_college()))
  with check (college_id = (select private.auth_college()));

grant select, insert, update, delete on public.message_templates to authenticated;
grant all on public.message_templates to service_role;
