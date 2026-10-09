import { removeFile } from '@/lib/storage';
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
