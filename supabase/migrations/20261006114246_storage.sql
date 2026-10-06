-- Storage buckets (SRS 3.1.1.3, 3.1.4.3). Object paths start with the owning
-- id so policies can scope by folder:
--   documents/{user_id}/...      private, student uploads
--   attachments/{thread_id}/...  private, message attachments
--   college-media/{college_id}/... public, logos/brochures/post images
--   avatars/{user_id}/...        public, profile pictures

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 5242880,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('attachments', 'attachments', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('college-media', 'college-media', true, 5242880,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- documents ------------------------------------------------------------------
create policy "documents: owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documents: owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documents: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documents: reps read submitted files of their college"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1
      from public.documents d
      join public.applications a on a.id = d.application_id
      where d.storage_path = name
        and a.college_id = (select private.auth_college())
        and a.status <> 'draft'
    )
  );

create policy "documents: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (select private.is_admin()));

-- attachments ----------------------------------------------------------------
create or replace function private.can_access_thread_folder(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.threads t
    where t.id::text = p_folder and private.can_access_thread(t.id)
  );
$$;
revoke execute on function private.can_access_thread_folder(text) from public, anon;
grant execute on function private.can_access_thread_folder(text) to authenticated;

create policy "attachments: participants read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and (private.can_access_thread_folder((storage.foldername(name))[1]) or (select private.is_admin()))
  );

create policy "attachments: participants upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and private.can_access_thread_folder((storage.foldername(name))[1])
  );

-- college-media (public read via public URL) ---------------------------------
create policy "college-media: reps and admins upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'college-media'
    and ((storage.foldername(name))[1] = (select private.auth_college())::text or (select private.is_admin()))
  );

create policy "college-media: reps and admins update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'college-media'
    and ((storage.foldername(name))[1] = (select private.auth_college())::text or (select private.is_admin()))
  );

create policy "college-media: reps and admins delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'college-media'
    and ((storage.foldername(name))[1] = (select private.auth_college())::text or (select private.is_admin()))
  );

-- avatars (public read via public URL) ---------------------------------------
create policy "avatars: owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Seed: standard PH admission requirements (ported from the web app's
-- availableRequirements) for every existing college.
insert into public.requirements (college_id, label, description, kind, is_required, sort_order)
select c.id, r.label, r.description, 'document', r.is_required, r.sort_order
from public.colleges c
cross join (values
  ('High School Transcript (Form 138)', 'Latest report card or transcript of records', true, 1),
  ('PSA Birth Certificate', 'Clear scan of your PSA-issued birth certificate', true, 2),
  ('Certificate of Good Moral Character', 'Issued by your senior high school', true, 3),
  ('2x2 ID Photo', 'Recent photo with white background', true, 4),
  ('Letter of Recommendation', 'From a teacher or guidance counselor', false, 5)
) as r(label, description, is_required, sort_order)
where not exists (select 1 from public.requirements x where x.college_id = c.id);
