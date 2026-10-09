-- CollApp core schema (SDD 4.1 / 4.2). Colleges are the tenants.

-- Park the hand-made mock tables in a non-API schema; their rows are copied
-- into the new tables at the end of this migration.
create schema if not exists legacy;
revoke all on schema legacy from anon, authenticated;
alter table if exists public.programs set schema legacy;
alter table if exists public.colleges set schema legacy;

create extension if not exists pg_trgm with schema extensions;

create type public.user_role as enum ('student', 'school_rep', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.publish_status as enum ('draft', 'published');
-- 'rejected' is not in SRS 3.2.2; tracked as a change request.
create type public.application_status as enum (
  'draft', 'submitted', 'under_review', 'accepted', 'action_required', 'rejected'
);
create type public.review_status as enum ('pending', 'approved', 'rejected', 'resubmit');
create type public.requirement_kind as enum ('document', 'essay');
create type public.post_type as enum ('news', 'event', 'scholarship', 'deadline');
create type public.thread_kind as enum ('student_rep', 'rep_admin');
create type public.scan_status as enum ('pending', 'clean', 'blocked');
create type public.sex as enum ('male', 'female', 'other');
create type public.device_platform as enum ('ios', 'android', 'web');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  logo_path text,
  website text check (website ~* '^https?://[^\s]+$'),
  region text check (char_length(region) <= 100),
  province text check (char_length(province) <= 100),
  city text check (char_length(city) <= 100),
  media_paths text[] not null default '{}' check (cardinality(media_paths) <= 10),
  profile_status public.publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  college_id uuid references public.colleges (id) on delete restrict,
  full_name text not null default '' check (char_length(full_name) <= 200),
  email text not null check (char_length(email) <= 320),
  avatar_path text,
  push_enabled boolean not null default true,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Reps always belong to exactly one college; nobody else does.
  constraint profiles_rep_college check ((role = 'school_rep') = (college_id is not null))
);

create table public.students (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 100),
  middle_name text check (char_length(middle_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  date_of_birth date check (date_of_birth > '1900-01-01'),
  sex public.sex,
  -- PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
  mobile text check (mobile ~ '^(\+63|0)9[0-9]{9}$'),
  -- { isInternational, country, region, province, city, street, zipCode }
  address jsonb not null default '{}' check (jsonb_typeof(address) = 'object'),
  -- { father: {name, occupation, contact}, mother: {...} }
  parents jsonb not null default '{}' check (jsonb_typeof(parents) = 'object'),
  senior_high_school text check (char_length(senior_high_school) <= 200),
  strand text check (char_length(strand) <= 100),
  -- General weighted average on the PH 0-100 scale.
  gpa numeric(5, 2) check (gpa between 0 and 100),
  target_majors text[] not null default '{}' check (cardinality(target_majors) <= 10),
  preferred_locations text[] not null default '{}' check (cardinality(preferred_locations) <= 10),
  interests text[] not null default '{}' check (cardinality(interests) <= 20),
  career_goals text check (char_length(career_goals) <= 1000),
  profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  degree text check (char_length(degree) <= 50),
  deadline date,
  -- PHP; numeric avoids float rounding on money.
  tuition_per_year numeric(12, 2) check (tuition_per_year >= 0),
  slots integer check (slots >= 0),
  essay_prompt text check (char_length(essay_prompt) <= 2000),
  prerequisites text check (char_length(prerequisites) <= 2000),
  min_gpa numeric(5, 2) check (min_gpa between 0 and 100),
  -- Preferred SHS strands; used by AI scoring.
  strands text[] not null default '{}' check (cardinality(strands) <= 20),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (college_id, name)
);

-- Dynamic requirement builder (SRS 3.1.2.1). program_id null = applies to every program.
create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  program_id uuid references public.programs (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 2 and 200),
  description text check (char_length(description) <= 1000),
  kind public.requirement_kind not null default 'document',
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (user_id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete restrict,
  second_program_id uuid references public.programs (id) on delete set null,
  status public.application_status not null default 'draft',
  essay text check (char_length(essay) <= 10000),
  submitted_at timestamptz,
  decided_at timestamptz,
  decision_message text check (char_length(decision_message) <= 2000),
  final_program_id uuid references public.programs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, program_id),
  constraint applications_distinct_choices check (second_program_id <> program_id),
  constraint applications_submitted_at check ((status = 'draft') = (submitted_at is null))
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  requirement_id uuid references public.requirements (id) on delete set null,
  label text not null check (char_length(btrim(label)) between 1 and 200),
  storage_path text not null unique check (char_length(storage_path) between 3 and 500),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  -- Raw uploads are capped at 5 MB; scans are compressed below 2 MB client-side (SRS 3.4).
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  review_status public.review_status not null default 'pending',
  review_notes text check (char_length(review_notes) <= 1000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  type public.post_type not null default 'news',
  title text not null check (char_length(btrim(title)) between 3 and 200),
  body text not null default '' check (char_length(body) <= 10000),
  media_path text,
  event_at timestamptz,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_published_at check ((status = 'published') = (published_at is not null))
);

create table public.follows (
  student_id uuid not null references public.students (user_id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, college_id)
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (user_id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  match_score numeric(5, 2) not null check (match_score between 0 and 100),
  reasons jsonb not null default '[]' check (jsonb_typeof(reasons) = 'array'),
  generated_at timestamptz not null default now(),
  unique (student_id, program_id)
);

create table public.ai_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  fit_score numeric(5, 2) not null check (fit_score between 0 and 100),
  enrollment_likelihood numeric(5, 2) not null check (enrollment_likelihood between 0 and 100),
  breakdown jsonb not null default '{}' check (jsonb_typeof(breakdown) = 'object'),
  explanation text check (char_length(explanation) <= 4000),
  generated_at timestamptz not null default now()
);

-- Formal hierarchical messaging (SRS 3.6.5): only student<->rep and rep<->admin threads exist.
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  kind public.thread_kind not null,
  college_id uuid not null references public.colleges (id) on delete cascade,
  student_id uuid references public.students (user_id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete cascade,
  subject text check (char_length(subject) <= 200),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint threads_shape check (
    (kind = 'student_rep' and student_id is not null and admin_id is null)
    or (kind = 'rep_admin' and admin_id is not null and student_id is null)
  ),
  unique nulls not distinct (kind, college_id, student_id, admin_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 4000),
  attachment_path text unique,
  attachment_name text check (char_length(attachment_name) <= 255),
  attachment_mime text check (char_length(attachment_mime) <= 100),
  scan_status public.scan_status,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_not_empty check (btrim(body) <> '' or attachment_path is not null),
  -- Attachment metadata travels together and every attachment gets scanned.
  constraint messages_attachment_shape check (
    (attachment_path is null and attachment_name is null and attachment_mime is null and scan_status is null)
    or (attachment_path is not null and attachment_name is not null and attachment_mime is not null and scan_status is not null)
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type ~ '^[a-z_]{2,50}$'),
  title text not null check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 1000),
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  token text primary key check (char_length(token) <= 255),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  platform public.device_platform not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action ~ '^[a-z_.]{2,80}$'),
  entity text not null check (entity ~ '^[a-z_]{2,50}$'),
  entity_id uuid,
  meta jsonb not null default '{}' check (jsonb_typeof(meta) = 'object'),
  created_at timestamptz not null default now()
);

-- Single-row platform settings.
create table public.platform_settings (
  id boolean primary key default true check (id),
  applications_open boolean not null default true,
  maintenance_mode boolean not null default false,
  featured_college_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.platform_settings default values;

-- Indexes: every foreign key plus the common filters (SRS 3.4: < 500 ms).
create index on public.profiles (college_id);
create index on public.profiles (role);
create index on public.programs (college_id);
create index on public.requirements (college_id);
create index on public.requirements (program_id);
create index on public.applications (student_id);
create index on public.applications (college_id, status);
create index on public.applications (program_id);
create index on public.applications (second_program_id);
create index on public.applications (final_program_id);
create index on public.documents (owner_id);
create index on public.documents (application_id);
create index on public.documents (requirement_id);
create index on public.documents (reviewed_by);
create index on public.posts (college_id, status, published_at desc);
create index on public.posts (author_id);
create index on public.follows (college_id);
create index on public.ai_recommendations (college_id);
create index on public.ai_recommendations (program_id);
create index on public.threads (college_id);
create index on public.threads (student_id);
create index on public.threads (admin_id);
create index on public.messages (thread_id, created_at);
create index on public.messages (sender_id);
create index on public.notifications (user_id, created_at desc);
create index on public.push_tokens (user_id);
create index on public.audit_logs (actor_id);
create index on public.audit_logs (created_at desc);
create index colleges_name_trgm on public.colleges using gin (name extensions.gin_trgm_ops);
create index programs_name_trgm on public.programs using gin (name extensions.gin_trgm_ops);

create trigger set_updated_at before update on public.colleges for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.programs for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.applications for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.posts for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.push_tokens for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.platform_settings for each row execute function public.set_updated_at();

-- Every sign-up becomes a student. Reps/admins are promoted server-side only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Turn RLS on everywhere; policies come in the next migration.
alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.programs enable row level security;
alter table public.requirements enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_scores enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;

-- Carry the mock data over as seed content (published so students can browse it).
insert into public.colleges (id, name, description, region, province, city, profile_status)
select
  c.id,
  btrim(c.name),
  coalesce(c.description, ''),
  case c.region
    when 'Manila' then 'NCR - National Capital Region'
    when 'Cebu' then 'Region VII - Central Visayas'
    when 'Bohol' then 'Region VII - Central Visayas'
    when 'Davao' then 'Region XI - Davao Region'
    else c.region
  end,
  nullif(btrim(split_part(c.location, ',', 2)), ''),
  nullif(btrim(split_part(c.location, ',', 1)), ''),
  'published'
from legacy.colleges c;

insert into public.programs (id, college_id, name, deadline)
select p.id, p.college_id, btrim(p.name), p.deadline
from legacy.programs p
where p.college_id in (select id from public.colleges);
