-- Batch result release: representatives can hold admission decisions and send
-- them all at once (now or at a scheduled time), so every applicant to a
-- college hears back at the same moment. A held decision lives in
-- staged_decisions, which students cannot read; the application keeps its
-- current status until release, when the usual status trigger notifies them.

alter table public.colleges add column results_release_at timestamptz;

create table public.staged_decisions (
  application_id uuid primary key references public.applications (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  decision public.application_status not null check (decision in ('accepted', 'rejected')),
  final_program_id uuid references public.programs (id) on delete set null,
  decision_message text not null check (char_length(btrim(decision_message)) between 1 and 2000),
  staged_by uuid default auth.uid() references public.profiles (id) on delete set null,
  staged_at timestamptz not null default now(),
  constraint staged_decisions_program check ((decision = 'accepted') = (final_program_id is not null))
);
create index on public.staged_decisions (college_id);
create index on public.staged_decisions (final_program_id);
create index on public.staged_decisions (staged_by);

alter table public.staged_decisions enable row level security;

-- Reps of the college and admins only; written through the RPCs below.
create policy "staged_decisions: read own college, admin"
  on public.staged_decisions for select to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()));

grant select on public.staged_decisions to authenticated;
grant all on public.staged_decisions to service_role;

-- The same rules guard_application enforces for a rep's direct decision.
create or replace function private.decision_problem(
  p_app public.applications,
  p_decision public.application_status,
  p_final_program_id uuid,
  p_message text
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_app.status not in ('submitted', 'under_review', 'action_required') then
    return 'This application has already been decided';
  end if;
  if p_decision not in ('accepted', 'rejected') then
    return 'Invalid decision';
  end if;
  if coalesce(btrim(p_message), '') = '' then
    return 'Add a decision message for the student';
  end if;
  if p_decision = 'accepted' then
    if exists (
      select 1 from public.documents d
      where d.application_id = p_app.id and d.review_status <> 'approved'
    ) then
      return 'Approve every document before accepting';
    end if;
    if p_final_program_id is null
      or p_final_program_id not in (p_app.program_id, coalesce(p_app.second_program_id, p_app.program_id)) then
      return 'Choose the final program from the student''s choices';
    end if;
  end if;
  return null;
end;
$$;
revoke execute on function private.decision_problem(public.applications, public.application_status, uuid, text)
  from public, anon, authenticated;

-- RPC: hold (or update) a decision for the next release.
create or replace function public.stage_decision(
  p_application_id uuid,
  p_decision public.application_status,
  p_final_program_id uuid,
  p_message text
)
returns public.staged_decisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid := private.auth_college();
  v_app public.applications;
  v_problem text;
  v_row public.staged_decisions;
begin
  if v_college is null then
    raise exception 'Representatives only' using errcode = '42501';
  end if;
  select * into v_app from public.applications
  where id = p_application_id and college_id = v_college and status <> 'draft'
  for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  v_problem := private.decision_problem(v_app, p_decision, p_final_program_id, p_message);
  if v_problem is not null then
    raise exception '%', v_problem using errcode = '23514';
  end if;

  insert into public.staged_decisions
    (application_id, college_id, decision, final_program_id, decision_message, staged_by, staged_at)
  values (
    v_app.id, v_college, p_decision,
    case when p_decision = 'accepted' then p_final_program_id end,
    btrim(p_message), (select auth.uid()), now()
  )
  on conflict (application_id) do update set
    decision = excluded.decision,
    final_program_id = excluded.final_program_id,
    decision_message = excluded.decision_message,
    staged_by = excluded.staged_by,
    staged_at = excluded.staged_at
  returning * into v_row;

  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'application.decision_held', 'application', v_app.id,
          jsonb_build_object('decision', p_decision));
  return v_row;
end;
$$;
revoke execute on function public.stage_decision(uuid, public.application_status, uuid, text) from public, anon;
grant execute on function public.stage_decision(uuid, public.application_status, uuid, text) to authenticated;

-- RPC: take a held decision back out of the batch.
create or replace function public.unstage_decision(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid := private.auth_college();
begin
  if v_college is null then
    raise exception 'Representatives only' using errcode = '42501';
  end if;
  delete from public.staged_decisions
  where application_id = p_application_id and college_id = v_college;
  if found then
    insert into public.audit_logs (actor_id, action, entity, entity_id)
    values ((select auth.uid()), 'application.decision_unheld', 'application', p_application_id);
  end if;
end;
$$;
revoke execute on function public.unstage_decision(uuid) from public, anon;
grant execute on function public.unstage_decision(uuid) to authenticated;

-- Applies held decisions for one college (all of them, or the given ones).
-- Each is re-validated; one that no longer qualifies stays held and is reported.
create or replace function private.release_staged(p_college uuid, p_application_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.staged_decisions;
  v_app public.applications;
  v_problem text;
  v_released integer := 0;
  v_failed jsonb := '[]';
begin
  for r in
    select s.* from public.staged_decisions s
    where s.college_id = p_college
      and (p_application_ids is null or s.application_id = any (p_application_ids))
    order by s.staged_at
  loop
    select * into v_app from public.applications where id = r.application_id for update;
    v_problem := private.decision_problem(v_app, r.decision, r.final_program_id, r.decision_message);
    if v_problem is not null then
      v_failed := v_failed || jsonb_build_array(
        jsonb_build_object('application_id', r.application_id, 'error', v_problem));
      continue;
    end if;

    -- Validated above, so the trusted workflow path applies it directly.
    perform set_config('app.workflow', 'on', true);
    update public.applications
    set status = r.decision,
        decision_message = r.decision_message,
        final_program_id = r.final_program_id,
        decided_at = now()
    where id = r.application_id;
    perform set_config('app.workflow', 'off', true);

    delete from public.staged_decisions where application_id = r.application_id;
    v_released := v_released + 1;
  end loop;

  return jsonb_build_object('released', v_released, 'failed', v_failed);
end;
$$;
revoke execute on function private.release_staged(uuid, uuid[]) from public, anon, authenticated;

-- RPC: release held decisions now. Releasing everything also clears the schedule.
create or replace function public.release_decisions(p_application_ids uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid := private.auth_college();
  v_result jsonb;
begin
  if v_college is null then
    raise exception 'Representatives only' using errcode = '42501';
  end if;
  v_result := private.release_staged(v_college, p_application_ids);
  if p_application_ids is null then
    update public.colleges set results_release_at = null where id = v_college;
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'application.decisions_released', 'college', v_college, v_result);
  return v_result;
end;
$$;
revoke execute on function public.release_decisions(uuid[]) from public, anon;
grant execute on function public.release_decisions(uuid[]) to authenticated;

-- RPC: set (or clear, with null) when held decisions go out automatically.
create or replace function public.schedule_decision_release(p_release_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid := private.auth_college();
begin
  if v_college is null then
    raise exception 'Representatives only' using errcode = '42501';
  end if;
  if p_release_at is not null and p_release_at < now() + interval '5 minutes' then
    raise exception 'Pick a release time at least 5 minutes from now' using errcode = '22023';
  end if;
  update public.colleges set results_release_at = p_release_at where id = v_college;
  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'application.release_scheduled', 'college', v_college,
          jsonb_build_object('release_at', p_release_at));
end;
$$;
revoke execute on function public.schedule_decision_release(timestamptz) from public, anon;
grant execute on function public.schedule_decision_release(timestamptz) to authenticated;

-- Scheduled releases, checked every 5 minutes.
create or replace function private.release_due_decisions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college uuid;
  v_result jsonb;
  v_count integer := 0;
begin
  for v_college in
    select c.id from public.colleges c
    where c.results_release_at is not null and c.results_release_at <= now()
    for update
  loop
    v_result := private.release_staged(v_college, null);
    update public.colleges set results_release_at = null where id = v_college;
    insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
    values (null, 'application.decisions_released', 'college', v_college,
            v_result || jsonb_build_object('scheduled', true));
    v_count := v_count + (v_result ->> 'released')::integer;
  end loop;
  return v_count;
end;
$$;
revoke execute on function private.release_due_decisions() from public, anon, authenticated;

select cron.schedule('release-due-decisions', '*/5 * * * *', $$select private.release_due_decisions()$$);

-- A decision sent directly (not through the batch) replaces any held one.
create or replace function private.clear_staged_on_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('accepted', 'rejected') then
    delete from public.staged_decisions where application_id = new.id;
  end if;
  return null;
end;
$$;
revoke execute on function private.clear_staged_on_decision() from public, anon, authenticated;

create trigger clear_staged_on_decision
  after update of status on public.applications
  for each row
  when (old.status is distinct from new.status)
  execute function private.clear_staged_on_decision();
