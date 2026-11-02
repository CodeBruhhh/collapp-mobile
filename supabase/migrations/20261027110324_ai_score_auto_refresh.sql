-- Keep AI applicant scores current (SRS 3.1.2.2). The score used to be computed
-- once, from the phone, at submission; now the database asks ai-score to
-- recompute whenever an input changes. Calls are async (pg_net) and carry the
-- Vault webhook secret (see private.call_edge). Decided applications keep the
-- score they were decided on.

create or replace function private.request_ai_score(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.call_edge('ai-score', jsonb_build_object('application_id', p_application_id));
end;
$$;
revoke execute on function private.request_ai_score(uuid) from public, anon, authenticated;

-- 1. Submission (and re-entering review after a resubmission).
create or replace function private.score_on_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('submitted', 'under_review', 'action_required')
     and old.status is distinct from new.status then
    perform private.request_ai_score(new.id);
  end if;
  return null;
end;
$$;

create trigger score_on_application_status
  after update of status on public.applications
  for each row execute function private.score_on_application_status();

-- 2. A document is reviewed or replaced.
create or replace function private.score_on_document_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.application_id is not null and exists (
    select 1 from public.applications a
    where a.id = new.application_id
      and a.status in ('submitted', 'under_review', 'action_required')
  ) then
    perform private.request_ai_score(new.application_id);
  end if;
  return null;
end;
$$;

create trigger score_on_document_change
  after update of review_status, storage_path on public.documents
  for each row
  when (old.review_status is distinct from new.review_status
        or old.storage_path is distinct from new.storage_path)
  execute function private.score_on_document_change();

-- 3. The student edits what the score is based on.
create or replace function private.score_on_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application uuid;
begin
  for v_application in
    select a.id from public.applications a
    where a.student_id = new.user_id
      and a.status in ('submitted', 'under_review', 'action_required')
  loop
    perform private.request_ai_score(v_application);
  end loop;
  return null;
end;
$$;

create trigger score_on_student_profile
  after update of strand, gpa, target_majors, preferred_locations, interests, career_goals, address
  on public.students
  for each row
  when (old.strand is distinct from new.strand
        or old.gpa is distinct from new.gpa
        or old.target_majors is distinct from new.target_majors
        or old.preferred_locations is distinct from new.preferred_locations
        or old.interests is distinct from new.interests
        or old.career_goals is distinct from new.career_goals
        or old.address is distinct from new.address)
  execute function private.score_on_student_profile();
