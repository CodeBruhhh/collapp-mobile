-- Per-category push preferences (SRS 3.1.4.4, SDD screen 18). In-app
-- notifications are always recorded; these only decide which ones also go out
-- as a push. profiles.push_enabled stays the master switch.
alter table public.profiles
  add column notification_prefs jsonb not null
    default '{"messages": true, "application_updates": true, "deadlines": true}'
    constraint profiles_notification_prefs_shape check (
      jsonb_typeof(notification_prefs) = 'object'
      and notification_prefs ?& array['messages', 'application_updates', 'deadlines']
      and jsonb_typeof(notification_prefs -> 'messages') = 'boolean'
      and jsonb_typeof(notification_prefs -> 'application_updates') = 'boolean'
      and jsonb_typeof(notification_prefs -> 'deadlines') = 'boolean'
      -- no other keys
      and notification_prefs - array['messages', 'application_updates', 'deadlines'] = '{}'::jsonb
    );

-- Which preference a notification type falls under (null = always pushed).
create or replace function private.notification_category(p_type text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_type = 'new_message' then 'messages'
    when p_type in ('application_status', 'document_review', 'new_application') then 'application_updates'
    when p_type = 'deadline_reminder' then 'deadlines'
  end;
$$;

create or replace function private.on_notification_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_category text := private.notification_category(new.type);
begin
  if exists (
    select 1 from public.profiles p
    join public.push_tokens t on t.user_id = p.id
    where p.id = new.user_id
      and p.push_enabled
      and p.status = 'active'
      and (v_category is null or coalesce((p.notification_prefs ->> v_category)::boolean, true))
  ) then
    perform private.call_edge('dispatch-push', jsonb_build_object('notification_id', new.id));
  end if;
  return null;
end;
$$;
