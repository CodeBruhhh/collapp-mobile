-- Campus feed: reactions and comments on published posts, and auto-follow when
-- a student starts an application. "Saved" colleges and followed colleges are
-- the same thing (public.follows).

create type public.post_reaction as enum ('like', 'love', 'care', 'haha', 'wow', 'sad');

-- One reaction per student per post; changing it updates the row.
create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  student_id uuid not null references public.students (user_id) on delete cascade,
  reaction public.post_reaction not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, student_id)
);
create index on public.post_reactions (student_id);
create trigger set_updated_at before update on public.post_reactions
  for each row execute function public.set_updated_at();

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.students (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.post_comments (post_id, created_at);
create index on public.post_comments (author_id);

alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;

-- True when the caller is a student and the post is live.
create or replace function private.student_can_engage(p_post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.auth_role() = 'student'
    and exists (select 1 from public.posts p where p.id = p_post and p.status = 'published');
$$;
revoke execute on function private.student_can_engage(uuid) from public, anon;
grant execute on function private.student_can_engage(uuid) to authenticated;

-- True when the caller is a rep of the post's college, or an admin.
create or replace function private.can_moderate_post(p_post uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.posts p
      where p.id = p_post and p.college_id = private.auth_college()
    );
$$;
revoke execute on function private.can_moderate_post(uuid) from public, anon;
grant execute on function private.can_moderate_post(uuid) to authenticated;

-- post_reactions: students manage their own; counts come from post_engagement().
create policy "post_reactions: read own"
  on public.post_reactions for select to authenticated
  using (student_id = (select auth.uid()));

create policy "post_reactions: insert own"
  on public.post_reactions for insert to authenticated
  with check (student_id = (select auth.uid()) and private.student_can_engage(post_id));

create policy "post_reactions: update own"
  on public.post_reactions for update to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()) and private.student_can_engage(post_id));

create policy "post_reactions: delete own"
  on public.post_reactions for delete to authenticated
  using (student_id = (select auth.uid()));

-- post_comments: other students read through post_comments_list(), which hides
-- the author's id and full name.
create policy "post_comments: read own, moderators"
  on public.post_comments for select to authenticated
  using (author_id = (select auth.uid()) or private.can_moderate_post(post_id));

create policy "post_comments: insert own"
  on public.post_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and private.student_can_engage(post_id));

create policy "post_comments: delete own, moderators"
  on public.post_comments for delete to authenticated
  using (author_id = (select auth.uid()) or private.can_moderate_post(post_id));

grant select, insert, update, delete on public.post_reactions to authenticated;
grant select, insert, delete on public.post_comments to authenticated;
grant all on public.post_reactions, public.post_comments to service_role;

-- Reaction counts, comment count and the caller's reaction for a list of posts.
-- security definer: students cannot read each other's rows, only these totals.
create or replace function public.post_engagement(p_post_ids uuid[])
returns table (
  post_id uuid,
  counts jsonb,
  comment_count integer,
  my_reaction public.post_reaction
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(
      (select jsonb_object_agg(r.reaction, r.total)
       from (
         select pr.reaction, count(*) as total
         from public.post_reactions pr
         where pr.post_id = p.id
         group by pr.reaction
       ) r),
      '{}'::jsonb
    ),
    (select count(*)::integer from public.post_comments c where c.post_id = p.id),
    (select pr.reaction from public.post_reactions pr
      where pr.post_id = p.id and pr.student_id = (select auth.uid()))
  from public.posts p
  where p.id = any (p_post_ids)
    and (p.status = 'published' or private.can_moderate_post(p.id));
$$;
revoke execute on function public.post_engagement(uuid[]) from public, anon;
grant execute on function public.post_engagement(uuid[]) to authenticated;

-- Comments on a post, oldest first. Returns a short display name ("Maria S.")
-- and the public avatar only: students stay private from each other, and
-- applicants may be minors.
create or replace function public.post_comments_list(p_post_id uuid)
returns table (
  id uuid,
  post_id uuid,
  body text,
  created_at timestamptz,
  author_name text,
  author_avatar_path text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from (
    select
      c.id,
      c.post_id,
      c.body,
      c.created_at,
      coalesce(
        nullif(
          btrim(concat_ws(' ',
            nullif(split_part(btrim(s.first_name), ' ', 1), ''),
            nullif(upper(left(btrim(s.last_name), 1)) || '.', '.')
          )),
          ''
        ),
        'Student'
      ) as author_name,
      pr.avatar_path as author_avatar_path,
      c.author_id = (select auth.uid()) as is_mine
    from public.post_comments c
    join public.posts p on p.id = c.post_id
    join public.students s on s.user_id = c.author_id
    join public.profiles pr on pr.id = c.author_id
    where c.post_id = p_post_id
      and (p.status = 'published' or private.can_moderate_post(p.id))
    order by c.created_at desc
    limit 200
  ) latest
  order by latest.created_at;
$$;
revoke execute on function public.post_comments_list(uuid) from public, anon;
grant execute on function public.post_comments_list(uuid) to authenticated;

-- Starting an application follows that college. Students can unfollow later.
create or replace function private.follow_on_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.follows (student_id, college_id)
  values (new.student_id, new.college_id)
  on conflict do nothing;
  return new;
end;
$$;
revoke execute on function private.follow_on_application() from public, anon, authenticated;

create trigger follow_on_application
  after insert on public.applications
  for each row execute function private.follow_on_application();
