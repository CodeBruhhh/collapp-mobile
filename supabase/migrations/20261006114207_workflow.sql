-- Business rules enforced in the database: column guards, the application
-- state machine, submission, notifications, audit logging and thread creation.
-- `app.workflow = on` marks updates made by these trusted functions.

create or replace function private.in_workflow()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('app.workflow', true), '') = 'on';
$$;

-- profiles: only admins (or the service role) change role, tenant, status, email.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
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

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

-- applications: per-role column rules + state machine (SRS 3.2.2).
create or replace function private.guard_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := private.auth_role();
begin
  if not exists (
    select 1 from public.programs p where p.id = new.program_id and p.college_id = new.college_id
  ) then
    raise exception 'The selected program is not offered by this college' using errcode = '23514';
  end if;
  if new.second_program_id is not null and not exists (
    select 1 from public.programs p where p.id = new.second_program_id and p.college_id = new.college_id
  ) then
    raise exception 'The second-choice program is not offered by this college' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' or (select auth.uid()) is null or private.in_workflow() then
    return new;
  end if;

  if v_role = 'student' then
    if new.status is distinct from old.status
      or new.student_id is distinct from old.student_id
      or new.college_id is distinct from old.college_id
      or new.submitted_at is distinct from old.submitted_at
      or new.decided_at is distinct from old.decided_at
      or new.decision_message is distinct from old.decision_message
      or new.final_program_id is distinct from old.final_program_id then
      raise exception 'Use submit to change the application status' using errcode = '42501';
    end if;
    if old.status <> 'draft' and (
      new.program_id is distinct from old.program_id
      or new.second_program_id is distinct from old.second_program_id
      or new.essay is distinct from old.essay
    ) then
      raise exception 'Submitted applications can only receive document resubmissions' using errcode = '42501';
    end if;

  elsif v_role = 'school_rep' then
    if new.student_id is distinct from old.student_id
      or new.college_id is distinct from old.college_id
      or new.program_id is distinct from old.program_id
      or new.second_program_id is distinct from old.second_program_id
      or new.essay is distinct from old.essay
      or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Representatives can only review applications' using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      if old.status in ('accepted', 'rejected') then
        raise exception 'This application has already been decided' using errcode = '42501';
      end if;
      if new.status in ('draft', 'submitted') then
        raise exception 'Invalid status change' using errcode = '23514';
      end if;
      if new.status = 'accepted' then
        if exists (
          select 1 from public.documents d
          where d.application_id = new.id and d.review_status <> 'approved'
        ) then
          raise exception 'Approve every document before accepting' using errcode = '23514';
        end if;
        if new.final_program_id is null
          or new.final_program_id not in (new.program_id, coalesce(new.second_program_id, new.program_id)) then
          raise exception 'Choose the final program from the student''s choices' using errcode = '23514';
        end if;
      end if;
      if new.status in ('accepted', 'rejected') then
        if coalesce(btrim(new.decision_message), '') = '' then
          raise exception 'Add a decision message for the student' using errcode = '23514';
        end if;
        new.decided_at := now();
      end if;
    end if;

  else
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger guard_application
  before insert or update on public.applications
  for each row execute function private.guard_application();

-- documents: owners manage files, reps manage review fields only.
create or replace function private.guard_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or private.in_workflow() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := v_uid;
    new.review_status := 'pending';
    new.review_notes := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    if new.storage_path not like v_uid::text || '/%' then
      raise exception 'Files must be stored in your own folder' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.owner_id = v_uid then
    if new.owner_id is distinct from old.owner_id
      or new.review_status is distinct from old.review_status
      or new.review_notes is distinct from old.review_notes
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'Only representatives can review documents' using errcode = '42501';
    end if;
    if old.application_id is not null and new.application_id is distinct from old.application_id then
      raise exception 'This document is already attached to an application' using errcode = '42501';
    end if;
    if new.storage_path is distinct from old.storage_path then
      if old.review_status = 'approved' then
        raise exception 'Approved documents cannot be replaced' using errcode = '42501';
      end if;
      if new.storage_path not like v_uid::text || '/%' then
        raise exception 'Files must be stored in your own folder' using errcode = '42501';
      end if;
      -- A replacement goes back into the review queue.
      new.review_status := 'pending';
      new.review_notes := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
    end if;
  else
    if new.owner_id is distinct from old.owner_id
      or new.application_id is distinct from old.application_id
      or new.requirement_id is distinct from old.requirement_id
      or new.label is distinct from old.label
      or new.storage_path is distinct from old.storage_path
      or new.mime_type is distinct from old.mime_type
      or new.size_bytes is distinct from old.size_bytes then
      raise exception 'Representatives can only review documents' using errcode = '42501';
    end if;
    if new.review_status = 'resubmit' and coalesce(btrim(new.review_notes), '') = '' then
      raise exception 'Tell the student what to fix before requesting a resubmission' using errcode = '23514';
    end if;
    new.reviewed_by := v_uid;
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger guard_document
  before insert or update on public.documents
  for each row execute function private.guard_document();

-- Keep the application status in step with document reviews.
create or replace function private.sync_application_after_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.application_status;
begin
  if new.application_id is null or new.review_status is not distinct from old.review_status then
    return null;
  end if;

  select a.status into v_status from public.applications a where a.id = new.application_id;
  perform set_config('app.workflow', 'on', true);

  if new.review_status = 'resubmit' and v_status in ('submitted', 'under_review') then
    update public.applications set status = 'action_required' where id = new.application_id;
  elsif v_status = 'action_required' and not exists (
    select 1 from public.documents d
    where d.application_id = new.application_id and d.review_status = 'resubmit'
  ) then
    update public.applications set status = 'under_review' where id = new.application_id;
  elsif v_status = 'submitted' and new.review_status in ('approved', 'rejected') then
    update public.applications set status = 'under_review' where id = new.application_id;
  end if;

  perform set_config('app.workflow', 'off', true);
  return null;
end;
$$;

create trigger sync_application_after_review
  after update of review_status on public.documents
  for each row execute function private.sync_application_after_review();

-- posts: stamp published_at when a post goes live.
create or replace function private.stamp_post_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger stamp_post_published
  before insert or update on public.posts
  for each row execute function private.stamp_post_published();

-- messages: recipients may only set read_at; bump thread activity on send.
create or replace function private.guard_message_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.thread_id is distinct from old.thread_id
    or new.sender_id is distinct from old.sender_id
    or new.body is distinct from old.body
    or new.attachment_path is distinct from old.attachment_path
    or new.attachment_name is distinct from old.attachment_name
    or new.attachment_mime is distinct from old.attachment_mime
    or new.scan_status is distinct from old.scan_status
    or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_message_update
  before update on public.messages
  for each row execute function private.guard_message_update();

create or replace function private.on_message_sent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread public.threads;
  v_sender text;
begin
  -- New attachments always start unscanned.
  update public.threads set last_message_at = new.created_at where id = new.thread_id
  returning * into v_thread;
  select p.full_name into v_sender from public.profiles p where p.id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, data)
  select r.id, 'new_message', 'New message from ' || coalesce(nullif(v_sender, ''), 'CollApp'),
         left(coalesce(nullif(new.body, ''), 'Sent an attachment'), 140),
         jsonb_build_object('thread_id', new.thread_id, 'message_id', new.id)
  from public.profiles r
  where r.id <> new.sender_id
    and r.status = 'active'
    and (
      (v_thread.kind = 'student_rep' and (r.id = v_thread.student_id
        or (r.role = 'school_rep' and r.college_id = v_thread.college_id)))
      or (v_thread.kind = 'rep_admin' and (r.id = v_thread.admin_id
        or (r.role = 'school_rep' and r.college_id = v_thread.college_id)))
    );
  return null;
end;
$$;

create trigger on_message_sent
  after insert on public.messages
  for each row execute function private.on_message_sent();

create or replace function private.default_message_scan_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.attachment_path is not null then
    new.scan_status := 'pending';
  end if;
  return new;
end;
$$;

create trigger default_message_scan_status
  before insert on public.messages
  for each row execute function private.default_message_scan_status();

-- Notifications + audit on application status changes.
create or replace function private.on_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_college text;
begin
  if new.status is not distinct from old.status then
    return null;
  end if;

  select c.name into v_college from public.colleges c where c.id = new.college_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), 'application.status_changed', 'application', new.id,
          jsonb_build_object('from', old.status, 'to', new.status));

  if new.status = 'submitted' then
    insert into public.notifications (user_id, type, title, body, data)
    select p.id, 'new_application', 'New application', 'A student applied to ' || v_college,
           jsonb_build_object('application_id', new.id)
    from public.profiles p
    where p.role = 'school_rep' and p.college_id = new.college_id and p.status = 'active';
  else
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.student_id,
      'application_status',
      case new.status
        when 'under_review' then 'Application under review'
        when 'accepted' then 'You''ve been accepted!'
        when 'rejected' then 'Application decision available'
        when 'action_required' then 'Action required on your application'
        else 'Application updated'
      end,
      v_college,
      jsonb_build_object('application_id', new.id, 'status', new.status)
    );
  end if;
  return null;
end;
$$;

create trigger on_application_status_change
  after update of status on public.applications
  for each row execute function private.on_application_status_change();

create or replace function private.on_document_reviewed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.review_status is not distinct from old.review_status or new.review_status = 'pending' then
    return null;
  end if;
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.owner_id,
    'document_review',
    case new.review_status
      when 'approved' then 'Document approved'
      when 'rejected' then 'Document rejected'
      else 'Please resubmit a document'
    end,
    new.label || coalesce(': ' || new.review_notes, ''),
    jsonb_build_object('document_id', new.id, 'application_id', new.application_id,
                       'status', new.review_status)
  );
  return null;
end;
$$;

create trigger on_document_reviewed
  after update of review_status on public.documents
  for each row execute function private.on_document_reviewed();

create or replace function private.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status
    or new.college_id is distinct from old.college_id then
    insert into public.audit_logs (actor_id, action, entity, entity_id, meta)
    values ((select auth.uid()), 'profile.access_changed', 'profile', new.id,
            jsonb_build_object('role', jsonb_build_array(old.role, new.role),
                               'status', jsonb_build_array(old.status, new.status),
                               'college_id', jsonb_build_array(old.college_id, new.college_id)));
  end if;
  return null;
end;
$$;

create trigger audit_profile_change
  after update on public.profiles
  for each row execute function private.audit_profile_change();

-- RPC: submit a draft application (SRS 3.6.3: online only, server-validated).
create or replace function public.submit_application(p_application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.applications;
  v_missing text;
begin
  if private.auth_role() is distinct from 'student' then
    raise exception 'Only students can submit applications' using errcode = '42501';
  end if;

  select * into v_app from public.applications
  where id = p_application_id and student_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if v_app.status <> 'draft' then
    raise exception 'This application has already been submitted' using errcode = '23514';
  end if;
  if not (select s.applications_open from public.platform_settings s) then
    raise exception 'Applications are currently closed' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.colleges c where c.id = v_app.college_id and c.profile_status = 'published'
  ) then
    raise exception 'This college is not accepting applications' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.programs p
    where p.id = v_app.program_id
      and (not p.is_open or (p.deadline is not null and p.deadline < current_date))
  ) then
    raise exception 'Applications for this program are closed' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.students s where s.user_id = v_app.student_id and s.profile_complete
  ) then
    raise exception 'Complete your academic profile first' using errcode = '23514';
  end if;

  select string_agg(r.label, ', ' order by r.sort_order, r.label) into v_missing
  from public.requirements r
  where r.college_id = v_app.college_id
    and r.is_required
    and (r.program_id is null or r.program_id = v_app.program_id)
    and (
      (r.kind = 'document' and not exists (
        select 1 from public.documents d where d.application_id = v_app.id and d.requirement_id = r.id
      ))
      or (r.kind = 'essay' and coalesce(btrim(v_app.essay), '') = '')
    );
  if v_missing is not null then
    raise exception 'Missing requirements: %', v_missing using errcode = '23514';
  end if;

  perform set_config('app.workflow', 'on', true);
  update public.applications
  set status = 'submitted', submitted_at = now()
  where id = v_app.id
  returning * into v_app;
  perform set_config('app.workflow', 'off', true);

  return v_app;
end;
$$;

-- RPC: open (or reuse) a formal thread. Only the allowed pairs can be created
-- (SRS 3.6.5): student->college, rep->student who engaged, rep<->admin.
create or replace function public.start_thread(
  p_college_id uuid default null,
  p_student_id uuid default null,
  p_admin_id uuid default null,
  p_subject text default null
)
returns public.threads
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role := private.auth_role();
  v_uid uuid := (select auth.uid());
  v_kind public.thread_kind;
  v_college uuid;
  v_student uuid;
  v_admin uuid;
  v_thread public.threads;
begin
  if v_role = 'student' then
    if p_college_id is null or not exists (
      select 1 from public.colleges c where c.id = p_college_id and c.profile_status = 'published'
    ) then
      raise exception 'Choose a college to contact' using errcode = '23514';
    end if;
    if not exists (select 1 from public.students s where s.user_id = v_uid) then
      insert into public.students (user_id) values (v_uid);
    end if;
    v_kind := 'student_rep'; v_college := p_college_id; v_student := v_uid;

  elsif v_role = 'school_rep' then
    v_college := private.auth_college();
    if p_student_id is not null then
      if not exists (
        select 1 from public.applications a
        where a.student_id = p_student_id and a.college_id = v_college and a.status <> 'draft'
      ) then
        raise exception 'You can only message students who applied to your college' using errcode = '42501';
      end if;
      v_kind := 'student_rep'; v_student := p_student_id;
    else
      select p.id into v_admin from public.profiles p
      where p.role = 'admin' and p.status = 'active'
        and (p_admin_id is null or p.id = p_admin_id)
      order by p.created_at
      limit 1;
      if v_admin is null then
        raise exception 'No administrator is available' using errcode = 'P0002';
      end if;
      v_kind := 'rep_admin';
    end if;

  elsif v_role = 'admin' then
    if p_college_id is null or not exists (select 1 from public.colleges c where c.id = p_college_id) then
      raise exception 'Choose a college to contact' using errcode = '23514';
    end if;
    v_kind := 'rep_admin'; v_college := p_college_id; v_admin := v_uid;

  else
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  insert into public.threads (kind, college_id, student_id, admin_id, subject)
  values (v_kind, v_college, v_student, v_admin, nullif(btrim(p_subject), ''))
  on conflict (kind, college_id, student_id, admin_id) do update set kind = excluded.kind
  returning * into v_thread;
  return v_thread;
end;
$$;

revoke execute on function public.submit_application(uuid) from public, anon;
grant execute on function public.submit_application(uuid) to authenticated;
revoke execute on function public.start_thread(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.start_thread(uuid, uuid, uuid, text) to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
