-- Phase 5: realtime messaging, attachment scanning and push notifications
-- (SRS 3.1.4, 3.6.5; SDD 5). Database events call Edge Functions through
-- pg_net; the shared secret is generated here inside Vault and never leaves
-- the database (functions verify it with verify_webhook_secret()).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Realtime: RLS still applies to postgres_changes subscribers.
alter publication supabase_realtime add table public.messages, public.threads, public.notifications;

-- Webhook secret --------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'edge_webhook_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'edge_webhook_secret',
      'Authenticates database-triggered Edge Function calls'
    );
  end if;
end;
$$;

create or replace function public.verify_webhook_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'edge_webhook_secret' and decrypted_secret = p_secret
  );
$$;
revoke execute on function public.verify_webhook_secret(text) from public, anon, authenticated;
grant execute on function public.verify_webhook_secret(text) to service_role;

-- Fire-and-forget POST to an Edge Function (async; never blocks the writer).
create or replace function private.call_edge(p_function text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://wuwrbrlcyvstacdxmigx.supabase.co/functions/v1/' || p_function,
    body := p_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'edge_webhook_secret')
    ),
    timeout_milliseconds := 5000
  );
end;
$$;
revoke execute on function private.call_edge(text, jsonb) from public, anon, authenticated;

-- Push dispatch: only when the recipient opted in and has a device.
create or replace function private.on_notification_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    join public.push_tokens t on t.user_id = p.id
    where p.id = new.user_id and p.push_enabled and p.status = 'active'
  ) then
    perform private.call_edge('dispatch-push', jsonb_build_object('notification_id', new.id));
  end if;
  return null;
end;
$$;

create trigger on_notification_created
  after insert on public.notifications
  for each row execute function private.on_notification_created();

-- Attachment scan: every new attachment is checked server-side.
create or replace function private.on_attachment_sent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.call_edge('scan-attachment', jsonb_build_object('message_id', new.id));
  return null;
end;
$$;

create trigger on_attachment_sent
  after insert on public.messages
  for each row when (new.attachment_path is not null)
  execute function private.on_attachment_sent();

-- Participants may download an attachment only after it passed the scan;
-- the uploader can always see their own file. Admins keep audit access.
create or replace function private.can_read_attachment(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    where m.attachment_path = p_name
      and private.can_access_thread(m.thread_id)
      and (m.scan_status = 'clean' or m.sender_id = (select auth.uid()))
  );
$$;
revoke execute on function private.can_read_attachment(text) from public, anon;
grant execute on function private.can_read_attachment(text) to authenticated;

alter policy "attachments: participants read" on storage.objects
  using (
    bucket_id = 'attachments'
    and (private.can_read_attachment(name) or (select private.is_admin()))
  );

-- Push tokens move with the device: a token signs in as whoever uses the phone.
create or replace function public.register_push_token(p_token text, p_platform public.device_platform)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_token !~ '^ExponentPushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid push token' using errcode = '22023';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, (select auth.uid()), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;
revoke execute on function public.register_push_token(text, public.device_platform) from public, anon;
grant execute on function public.register_push_token(text, public.device_platform) to authenticated;

-- Inbox: the caller's threads with counterpart, last message and unread count.
-- security invoker: RLS decides which threads and names are visible.
create or replace function public.my_threads()
returns table (
  id uuid,
  kind public.thread_kind,
  college_id uuid,
  college_name text,
  college_logo_path text,
  student_id uuid,
  student_name text,
  subject text,
  last_message_at timestamptz,
  last_message text,
  last_sender_id uuid,
  unread_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.id, t.kind, t.college_id, c.name, c.logo_path, t.student_id,
    nullif(btrim(concat_ws(' ', s.first_name, s.last_name)), ''),
    t.subject, t.last_message_at,
    case when lm.id is null then null
         when btrim(lm.body) <> '' then left(lm.body, 140)
         else 'Attachment: ' || lm.attachment_name end,
    lm.sender_id,
    (select count(*)::integer from public.messages m
      where m.thread_id = t.id and m.read_at is null and m.sender_id <> (select auth.uid()))
  from public.threads t
  join public.colleges c on c.id = t.college_id
  left join public.students s on s.user_id = t.student_id
  left join lateral (
    select m.id, m.body, m.attachment_name, m.sender_id from public.messages m
    where m.thread_id = t.id order by m.created_at desc limit 1
  ) lm on true
  where private.can_access_thread(t.id)
  order by t.last_message_at desc;
$$;
revoke execute on function public.my_threads() from public, anon;
grant execute on function public.my_threads() to authenticated;

-- Deadline reminders (SRS 3.1.4.2): 7, 3 and 1 day(s) before a program closes,
-- for students still holding a draft. Idempotent per application and day mark.
create or replace function private.send_deadline_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.notifications (user_id, type, title, body, data)
  select a.student_id, 'deadline_reminder',
         case when p.deadline - current_date = 1 then 'Application closes tomorrow'
              else 'Application closes in ' || (p.deadline - current_date) || ' days' end,
         'Finish your ' || p.name || ' application to ' || c.name,
         jsonb_build_object('application_id', a.id, 'days', p.deadline - current_date)
  from public.applications a
  join public.programs p on p.id = a.program_id
  join public.colleges c on c.id = a.college_id
  where a.status = 'draft'
    and p.is_open
    and p.deadline - current_date in (7, 3, 1)
    and not exists (
      select 1 from public.notifications n
      where n.user_id = a.student_id and n.type = 'deadline_reminder'
        and n.data ->> 'application_id' = a.id::text
        and (n.data ->> 'days')::integer = p.deadline - current_date
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function private.send_deadline_reminders() from public, anon, authenticated;

-- 00:00 UTC = 8:00 AM Philippine time.
select cron.schedule('deadline-reminders', '0 0 * * *', $$select private.send_deadline_reminders()$$);

create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;
create index if not exists messages_unread_idx
  on public.messages (thread_id) where read_at is null;
