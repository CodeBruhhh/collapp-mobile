-- Row Level Security (SRS 3.5.1, 3.6.4, 3.6.5).
-- Role and tenant are read from profiles on every check, so suspensions and
-- role changes take effect immediately (no stale JWT claims).

create schema if not exists private;
grant usage on schema private to authenticated;

-- Role of the signed-in user; null when signed out or suspended.
create or replace function private.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.status = 'active';
$$;

-- Tenant (college) of the signed-in rep; null for everyone else.
create or replace function private.auth_college()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.college_id
  from public.profiles p
  where p.id = (select auth.uid()) and p.status = 'active' and p.role = 'school_rep';
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.auth_role() = 'admin', false);
$$;

-- A rep may see a student once that student has engaged with the rep's college.
create or replace function private.rep_can_see_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    where a.student_id = p_student
      and a.college_id = private.auth_college()
      and a.status <> 'draft'
  ) or exists (
    select 1 from public.threads t
    where t.student_id = p_student and t.college_id = private.auth_college()
  );
$$;

-- Students see the reps of colleges they applied to or messaged.
create or replace function private.student_can_see_college_staff(p_college uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.auth_role() = 'student' and (
    exists (
      select 1 from public.applications a
      where a.student_id = (select auth.uid()) and a.college_id = p_college
    ) or exists (
      select 1 from public.threads t
      where t.student_id = (select auth.uid()) and t.college_id = p_college
    )
  );
$$;

-- Thread participants: student<->reps of one college, or reps<->one admin.
-- Student<->student threads cannot exist (threads_shape), so this also blocks P2P.
create or replace function private.can_access_thread(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.threads t
    where t.id = p_thread and (
      t.college_id = private.auth_college()
      or (t.kind = 'student_rep' and t.student_id = (select auth.uid()) and private.auth_role() = 'student')
      or (t.kind = 'rep_admin' and t.admin_id = (select auth.uid()) and private.is_admin())
    )
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- profiles ------------------------------------------------------------------
create policy "profiles: read self, related staff/students, admin"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin())
    or (role = 'student' and private.rep_can_see_student(id))
    or (role = 'school_rep' and private.student_can_see_college_staff(college_id))
    or (role = 'admin' and (select private.auth_role()) = 'school_rep')
  );

create policy "profiles: update self"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin update"
  on public.profiles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- students ------------------------------------------------------------------
create policy "students: read self, reps of engaged colleges, admin"
  on public.students for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or private.rep_can_see_student(user_id)
  );

create policy "students: create own"
  on public.students for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.auth_role()) = 'student');

create policy "students: update own"
  on public.students for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- colleges ------------------------------------------------------------------
create policy "colleges: read published, own, admin"
  on public.colleges for select to authenticated
  using (
    profile_status = 'published'
    or id = (select private.auth_college())
    or (select private.is_admin())
  );

create policy "colleges: rep or admin update"
  on public.colleges for update to authenticated
  using (id = (select private.auth_college()) or (select private.is_admin()))
  with check (id = (select private.auth_college()) or (select private.is_admin()));

create policy "colleges: admin insert"
  on public.colleges for insert to authenticated
  with check ((select private.is_admin()));

create policy "colleges: admin delete"
  on public.colleges for delete to authenticated
  using ((select private.is_admin()));

-- programs & requirements: visible when the college is; editable by its reps.
create policy "programs: read with college"
  on public.programs for select to authenticated
  using (exists (select 1 from public.colleges c where c.id = college_id));

create policy "programs: rep or admin insert"
  on public.programs for insert to authenticated
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "programs: rep or admin update"
  on public.programs for update to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()))
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "programs: rep or admin delete"
  on public.programs for delete to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "requirements: read with college"
  on public.requirements for select to authenticated
  using (exists (select 1 from public.colleges c where c.id = college_id));

create policy "requirements: rep or admin insert"
  on public.requirements for insert to authenticated
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "requirements: rep or admin update"
  on public.requirements for update to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()))
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "requirements: rep or admin delete"
  on public.requirements for delete to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()));

-- applications --------------------------------------------------------------
-- Reps never see drafts; column-level rules live in the workflow guard trigger.
create policy "applications: read own, own college, admin"
  on public.applications for select to authenticated
  using (
    student_id = (select auth.uid())
    or (college_id = (select private.auth_college()) and status <> 'draft')
    or (select private.is_admin())
  );

create policy "applications: student creates draft"
  on public.applications for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and status = 'draft'
    and (select private.auth_role()) = 'student'
  );

create policy "applications: student edits draft or action_required"
  on public.applications for update to authenticated
  using (student_id = (select auth.uid()) and status in ('draft', 'action_required'))
  with check (student_id = (select auth.uid()));

create policy "applications: rep reviews own college"
  on public.applications for update to authenticated
  using (college_id = (select private.auth_college()) and status <> 'draft')
  with check (college_id = (select private.auth_college()));

create policy "applications: student deletes draft"
  on public.applications for delete to authenticated
  using (student_id = (select auth.uid()) and status = 'draft');

-- documents -----------------------------------------------------------------
create policy "documents: read own, own college, admin"
  on public.documents for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select private.is_admin())
    or exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.college_id = (select private.auth_college())
        and a.status <> 'draft'
    )
  );

create policy "documents: owner insert"
  on public.documents for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      application_id is null
      or exists (
        select 1 from public.applications a
        where a.id = application_id
          and a.student_id = (select auth.uid())
          and a.status in ('draft', 'action_required')
      )
    )
  );

create policy "documents: owner update"
  on public.documents for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "documents: rep review"
  on public.documents for update to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.college_id = (select private.auth_college())
      and a.status <> 'draft'
  ))
  with check (exists (
    select 1 from public.applications a
    where a.id = application_id and a.college_id = (select private.auth_college())
  ));

create policy "documents: owner delete unreviewed"
  on public.documents for delete to authenticated
  using (owner_id = (select auth.uid()) and review_status <> 'approved');

-- posts ---------------------------------------------------------------------
create policy "posts: read published, own college, admin"
  on public.posts for select to authenticated
  using (
    (status = 'published' and exists (select 1 from public.colleges c where c.id = college_id))
    or college_id = (select private.auth_college())
    or (select private.is_admin())
  );

create policy "posts: rep insert"
  on public.posts for insert to authenticated
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "posts: rep update"
  on public.posts for update to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()))
  with check (college_id = (select private.auth_college()) or (select private.is_admin()));

create policy "posts: rep delete"
  on public.posts for delete to authenticated
  using (college_id = (select private.auth_college()) or (select private.is_admin()));

-- follows -------------------------------------------------------------------
create policy "follows: read own"
  on public.follows for select to authenticated
  using (student_id = (select auth.uid()));

create policy "follows: insert own"
  on public.follows for insert to authenticated
  with check (student_id = (select auth.uid()));

create policy "follows: delete own"
  on public.follows for delete to authenticated
  using (student_id = (select auth.uid()));

-- AI outputs: written only by Edge Functions (service role) -------------------
create policy "ai_recommendations: read own, admin"
  on public.ai_recommendations for select to authenticated
  using (student_id = (select auth.uid()) or (select private.is_admin()));

-- Fit scores are advisory and staff-only; students never see them.
create policy "ai_scores: read own college, admin"
  on public.ai_scores for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.applications a
      where a.id = application_id and a.college_id = (select private.auth_college())
    )
  );

-- threads & messages: created via RPC only (next migration) -----------------
create policy "threads: participants and admin read"
  on public.threads for select to authenticated
  using (private.can_access_thread(id) or (select private.is_admin()));

-- Admins can read every message for compliance review (SRS 3.1.3).
create policy "messages: participants and admin read"
  on public.messages for select to authenticated
  using (private.can_access_thread(thread_id) or (select private.is_admin()));

create policy "messages: participants send as themselves"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.can_access_thread(thread_id));

-- Only recipients mark messages read; the guard trigger limits it to read_at.
create policy "messages: recipients mark read"
  on public.messages for update to authenticated
  using (sender_id <> (select auth.uid()) and private.can_access_thread(thread_id))
  with check (sender_id <> (select auth.uid()) and private.can_access_thread(thread_id));

-- notifications & push tokens ----------------------------------------------
create policy "notifications: read own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: update own"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: delete own"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "push_tokens: read own"
  on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()));

create policy "push_tokens: insert own"
  on public.push_tokens for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "push_tokens: update own"
  on public.push_tokens for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "push_tokens: delete own"
  on public.push_tokens for delete to authenticated
  using (user_id = (select auth.uid()));

-- audit & settings ----------------------------------------------------------
create policy "audit_logs: admin read"
  on public.audit_logs for select to authenticated
  using ((select private.is_admin()));

create policy "platform_settings: read"
  on public.platform_settings for select to authenticated
  using (true);

create policy "platform_settings: admin update"
  on public.platform_settings for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
