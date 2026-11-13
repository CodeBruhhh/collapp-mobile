-- AI document checker/summarizer and essay feedback/summaries (Gemini via Edge
-- Functions). Every result is advisory: representatives still approve or flag
-- documents themselves. Results are written only by the service role.

create type public.ai_job_status as enum ('pending', 'done', 'failed', 'skipped');

-- One check per uploaded document; reset whenever the file is replaced.
create table public.document_ai_checks (
  document_id uuid primary key references public.documents (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  status public.ai_job_status not null default 'pending',
  -- pass = looks right, review = right kind but something to look at, fail = wrong or unrelated.
  verdict text check (verdict in ('pass', 'review', 'fail')),
  detected_type text check (char_length(detected_type) <= 200),
  relevant boolean,
  matches_requirement boolean,
  complete boolean,
  legible boolean,
  name_match text check (name_match in ('match', 'mismatch', 'not_found', 'not_applicable')),
  issues jsonb not null default '[]' check (jsonb_typeof(issues) = 'array'),
  -- [{label, value}] pulled from the document, e.g. school year, general average.
  key_details jsonb not null default '[]' check (jsonb_typeof(key_details) = 'array'),
  summary text check (char_length(summary) <= 2000),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  -- The storage_path that was checked, so a late result never lands on a replacement file.
  source_path text check (char_length(source_path) <= 500),
  model text check (char_length(model) <= 100),
  error text check (char_length(error) <= 500),
  attempts integer not null default 0,
  checked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint document_ai_checks_done check (status <> 'done' or verdict is not null)
);
create index on public.document_ai_checks (application_id);
create index document_ai_checks_retry_idx
  on public.document_ai_checks (updated_at) where status in ('pending', 'failed');

-- Summary for reviewers, generated when the application is submitted.
create table public.essay_ai_reviews (
  application_id uuid primary key references public.applications (id) on delete cascade,
  status public.ai_job_status not null default 'pending',
  essay_hash text check (char_length(essay_hash) = 64),
  summary text check (char_length(summary) <= 2000),
  key_points jsonb not null default '[]' check (jsonb_typeof(key_points) = 'array'),
  strengths jsonb not null default '[]' check (jsonb_typeof(strengths) = 'array'),
  improvements jsonb not null default '[]' check (jsonb_typeof(improvements) = 'array'),
  prompt_fit text check (prompt_fit in ('strong', 'partial', 'weak', 'no_prompt')),
  prompt_fit_note text check (char_length(prompt_fit_note) <= 500),
  word_count integer check (word_count >= 0),
  model text check (char_length(model) <= 100),
  error text check (char_length(error) <= 500),
  attempts integer not null default 0,
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Visibility follows the parent row's own RLS (the subquery runs as the caller):
-- students see checks on their files, reps on their college's submitted files.
alter table public.document_ai_checks enable row level security;
alter table public.essay_ai_reviews enable row level security;

create policy "document_ai_checks: read with document"
  on public.document_ai_checks for select to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id));

create policy "essay_ai_reviews: read with application"
  on public.essay_ai_reviews for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id));

grant select on public.document_ai_checks, public.essay_ai_reviews to authenticated;
grant all on public.document_ai_checks, public.essay_ai_reviews to service_role;

-- Daily per-user AI quota (free-tier model limits are shared by everyone) -----
create table private.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind ~ '^[a-z_]{2,40}$'),
  count integer not null default 0,
  primary key (user_id, day, kind)
);

-- Counts one use and says whether it is still within the limit. Service role only.
create or replace function public.consume_ai_quota(p_user uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into private.ai_usage (user_id, day, kind, count)
  values (p_user, current_date, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = private.ai_usage.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke execute on function public.consume_ai_quota(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer) to service_role;

-- Document checks: queued on upload and on every replacement ------------------
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
    attempts = 0, checked_at = null, updated_at = now();
  perform private.call_edge('ai-check-document', jsonb_build_object('document_id', new.id));
  return null;
end;
$$;
revoke execute on function private.request_document_check() from public, anon, authenticated;

create trigger request_document_check_on_insert
  after insert on public.documents
  for each row execute function private.request_document_check();

create trigger request_document_check_on_replace
  after update of storage_path, application_id on public.documents
  for each row
  when (old.storage_path is distinct from new.storage_path
        or old.application_id is distinct from new.application_id)
  execute function private.request_document_check();

-- Essay summaries: generated for reviewers once the application is submitted --
create or replace function private.request_essay_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'submitted' and old.status = 'draft'
     and coalesce(btrim(new.essay), '') <> '' then
    insert into public.essay_ai_reviews (application_id, status)
    values (new.id, 'pending')
    on conflict (application_id) do update set status = 'pending', error = null,
      attempts = 0, updated_at = now();
    perform private.call_edge('ai-essay', jsonb_build_object('application_id', new.id));
  end if;
  return null;
end;
$$;
revoke execute on function private.request_essay_review() from public, anon, authenticated;

create trigger request_essay_review
  after update of status on public.applications
  for each row execute function private.request_essay_review();

-- Retry transient failures (rate limits, timeouts) a few times ---------------
create or replace function private.retry_ai_jobs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select c.document_id from public.document_ai_checks c
    where c.status in ('pending', 'failed') and c.attempts < 3
      and c.updated_at < now() - interval '10 minutes'
    order by c.updated_at
    limit 10
  loop
    update public.document_ai_checks set updated_at = now() where document_id = v_id;
    perform private.call_edge('ai-check-document', jsonb_build_object('document_id', v_id));
    v_count := v_count + 1;
  end loop;

  for v_id in
    select r.application_id from public.essay_ai_reviews r
    where r.status in ('pending', 'failed') and r.attempts < 3
      and r.updated_at < now() - interval '10 minutes'
    order by r.updated_at
    limit 5
  loop
    update public.essay_ai_reviews set updated_at = now() where application_id = v_id;
    perform private.call_edge('ai-essay', jsonb_build_object('application_id', v_id));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke execute on function private.retry_ai_jobs() from public, anon, authenticated;

select cron.schedule('retry-ai-jobs', '*/15 * * * *', $$select private.retry_ai_jobs()$$);

-- "AI found a problem with your document" counts as an application update.
create or replace function private.notification_category(p_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_type = 'new_message' then 'messages'
    when p_type in ('application_status', 'document_review', 'new_application', 'document_ai_check')
      then 'application_updates'
    when p_type = 'deadline_reminder' then 'deadlines'
  end;
$$;
