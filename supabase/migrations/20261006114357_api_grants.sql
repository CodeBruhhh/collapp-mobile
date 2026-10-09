-- Explicit Data API privileges. This project does not auto-grant new tables to
-- the API roles, so grant only what each RLS policy set needs.
-- anon gets nothing: every CollApp screen requires sign-in.

grant usage on schema public to authenticated, service_role;

-- Edge Functions (AI scoring, push dispatch, admin tools) use the service role.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant select on
  public.colleges, public.profiles, public.students, public.programs,
  public.requirements, public.applications, public.documents, public.posts,
  public.follows, public.ai_recommendations, public.ai_scores, public.threads,
  public.messages, public.notifications, public.push_tokens, public.audit_logs,
  public.platform_settings
to authenticated;

grant insert, update, delete on
  public.programs, public.requirements, public.applications, public.documents,
  public.posts, public.push_tokens
to authenticated;

grant insert, update, delete on public.colleges to authenticated;      -- admin-only via RLS
grant insert, update on public.students to authenticated;
grant insert, delete on public.follows to authenticated;
grant update on public.profiles, public.platform_settings to authenticated;
grant update, delete on public.notifications to authenticated;
grant insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
-- threads are created through start_thread(); audit_logs and AI tables are server-written.
