import { objectPath, removeFile, uploadFile, type LocalFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Application = Tables<'applications'>;
export type ApplicationDocument = Tables<'documents'>;

const PROGRAM = 'id, name, deadline';

const LIST_SELECT = `*,
  college:colleges(id, name, city, province, region, logo_path),
  program:programs!applications_program_id_fkey(${PROGRAM}),
  documents(id, requirement_id, review_status)` as const;

const DETAIL_SELECT = `*,
  college:colleges(id, name, city, province, region, logo_path, requirements(*)),
  program:programs!applications_program_id_fkey(${PROGRAM}, essay_prompt),
  second_program:programs!applications_second_program_id_fkey(${PROGRAM}),
  final_program:programs!applications_final_program_id_fkey(id, name),
  documents(*)` as const;

export async function listMyApplications(userId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(LIST_SELECT)
    .eq('student_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}
export type MyApplication = Awaited<ReturnType<typeof listMyApplications>>[number];

export async function getApplication(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
export type ApplicationDetail = Awaited<ReturnType<typeof getApplication>>;

/** Requirements of this application's program (college-wide + program-specific). */
export function applicationRequirements(app: ApplicationDetail) {
  return (app.college?.requirements ?? [])
    .filter((r) => r.program_id === null || r.program_id === app.program_id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Start (or reuse) a draft for one program; mirrors the web app's one-per-choice rule. */
export async function createDraft(input: {
  studentId: string;
  collegeId: string;
  programId: string;
  secondProgramId: string | null;
}): Promise<Application> {
  const { data: existing } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', input.studentId)
    .eq('program_id', input.programId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: input.studentId,
      college_id: input.collegeId,
      program_id: input.programId,
      second_program_id: input.secondProgramId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDraft(
  id: string,
  changes: { program_id?: string; second_program_id?: string | null; essay?: string | null },
) {
  const { error } = await supabase.from('applications').update(changes).eq('id', id);
  if (error) throw error;
}

/** Delete a draft and the files uploaded for it (their rows cascade). */
export async function deleteDraft(app: { id: string; documents: { storage_path: string }[] }) {
  const { error } = await supabase.from('applications').delete().eq('id', app.id);
  if (error) throw error;
  await Promise.all(app.documents.map((d) => removeFile('documents', d.storage_path)));
}

/**
 * Upload a file for one requirement. Replacing an existing document keeps its
 * row (and history) and sends it back to "pending" review.
 */
export async function attachDocument(input: {
  userId: string;
  applicationId: string;
  requirementId: string | null;
  label: string;
  file: LocalFile;
  existing?: ApplicationDocument | null;
}) {
  const path = objectPath(input.userId, input.file.mimeType);
  await uploadFile('documents', path, input.file);

  const fileFields = {
    storage_path: path,
    mime_type: input.file.mimeType,
    size_bytes: input.file.size,
  };
  const { error } = input.existing
    ? await supabase.from('documents').update(fileFields).eq('id', input.existing.id)
    : await supabase.from('documents').insert({
        ...fileFields,
        application_id: input.applicationId,
        requirement_id: input.requirementId,
        label: input.label,
      });
  if (error) {
    await removeFile('documents', path);
    throw error;
  }
  if (input.existing) await removeFile('documents', input.existing.storage_path);
}

export async function removeDocument(doc: ApplicationDocument) {
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw error;
  await removeFile('documents', doc.storage_path);
}

/** Server-validated submission; fails with a readable reason (SRS 3.6.3). */
export async function submitApplication(id: string) {
  const { data, error } = await supabase.rpc('submit_application', { p_application_id: id });
  if (error) throw error;
  return data;
}
