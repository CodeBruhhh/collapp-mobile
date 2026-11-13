-- The API roles only need the privileges granted in api_grants. TRUNCATE ignores
-- row level security and TRIGGER and REFERENCES are never used by the app, so
-- remove all three from existing tables and from tables created later.

revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

alter default privileges in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;
