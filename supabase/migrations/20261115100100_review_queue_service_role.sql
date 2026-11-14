-- Server-side tools (Edge Functions, admin scripts) use the service role, which
-- needs its own grant on the review queue view; the app's role already has one.
grant select on public.review_queue_items to service_role;
