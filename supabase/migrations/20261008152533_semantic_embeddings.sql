-- Semantic matching for the AI engine (SRS 3.1.1.2, 3.1.2.2): gte-small sentence
-- embeddings (384 dims) generated inside Edge Functions. Kept in separate,
-- server-only tables so API payloads never carry vectors.
create extension if not exists vector with schema extensions;

create table public.program_embeddings (
  program_id uuid primary key references public.programs (id) on delete cascade,
  embedding extensions.vector(384) not null,
  -- SHA-256 of the embedded text; re-embed only when the program text changes.
  source_hash text not null check (char_length(source_hash) = 64),
  updated_at timestamptz not null default now()
);

create table public.student_embeddings (
  user_id uuid primary key references public.students (user_id) on delete cascade,
  embedding extensions.vector(384) not null,
  source_hash text not null check (char_length(source_hash) = 64),
  updated_at timestamptz not null default now()
);

-- RLS on with no policies: only the service role (Edge Functions) can read/write.
alter table public.program_embeddings enable row level security;
alter table public.student_embeddings enable row level security;
grant all on public.program_embeddings, public.student_embeddings to service_role;
