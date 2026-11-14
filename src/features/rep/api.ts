import { objectPath, removeFile, uploadFile, type LocalFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database';

// Every query here is also scoped by RLS to the rep's own college (SRS 3.5.1).

export type Post = Tables<'posts'>;

export async function getMyCollege(collegeId: string) {
  const { data, error } = await supabase
    .from('colleges')
    .select('*, programs(*), requirements(*)')
    .eq('id', collegeId)
    .order('name', { referencedTable: 'programs' })
    .order('sort_order', { referencedTable: 'requirements' })
    .single();
  if (error) throw error;
  return data;
}
export type RepCollege = Awaited<ReturnType<typeof getMyCollege>>;

export async function updateCollege(id: string, changes: TablesUpdate<'colleges'>) {
  const { error } = await supabase.from('colleges').update(changes).eq('id', id);
  if (error) throw error;
}

/** Replace the college logo in the public media bucket. */
export async function uploadCollegeLogo(
  college: { id: string; logo_path: string | null },
  file: LocalFile,
) {
  const path = objectPath(college.id, file.mimeType);
  await uploadFile('college-media', path, file);
  await updateCollege(college.id, { logo_path: path });
  if (college.logo_path) await removeFile('college-media', college.logo_path);
}

export async function saveProgram(program: TablesInsert<'programs'> & { id?: string }) {
  const { id, ...fields } = program;
  const { error } = id
    ? await supabase.from('programs').update(fields).eq('id', id)
    : await supabase.from('programs').insert(fields);
  if (error) throw error;
}

export async function deleteProgram(id: string) {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) {
    // programs referenced by applications are protected by a foreign key
    if (error.code === '23503') {
      throw new Error('Students have applied to this program. Close it instead of deleting it.');
    }
    throw error;
  }
}

export async function saveRequirement(req: TablesInsert<'requirements'> & { id?: string }) {
  const { id, ...fields } = req;
  const { error } = id
    ? await supabase.from('requirements').update(fields).eq('id', id)
    : await supabase.from('requirements').insert(fields);
  if (error) throw error;
}

export async function deleteRequirement(id: string) {
  const { error } = await supabase.from('requirements').delete().eq('id', id);
  if (error) throw error;
}

export async function listPosts(collegeId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function savePost(post: TablesInsert<'posts'> & { id?: string }) {
  const { id, ...fields } = post;
  const { error } = id
    ? await supabase.from('posts').update(fields).eq('id', id)
    : await supabase.from('posts').insert(fields);
  if (error) throw error;
}

export async function deletePost(post: Post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw error;
  if (post.media_path) await removeFile('college-media', post.media_path);
}

export async function uploadPostImage(collegeId: string, file: LocalFile): Promise<string> {
  return uploadFile('college-media', objectPath(`${collegeId}/posts`, file.mimeType), file);
}

export async function getApplicant(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `*,
      student:students(*, profile:profiles(email, full_name, avatar_path)),
      program:programs!applications_program_id_fkey(id, name),
      second_program:programs!applications_second_program_id_fkey(id, name),
      final_program:programs!applications_final_program_id_fkey(id, name),
      documents(*),
      ai_score:ai_scores(fit_score, enrollment_likelihood, explanation)`,
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
export type ApplicantDetail = Awaited<ReturnType<typeof getApplicant>>;

export async function reviewDocument(
  id: string,
  review_status: Enums<'review_status'>,
  review_notes: string | null,
) {
  const { error } = await supabase
    .from('documents')
    .update({ review_status, review_notes })
    .eq('id', id);
  if (error) throw error;
}

export async function setApplicationStatus(
  id: string,
  changes: {
    status: Enums<'application_status'>;
    decision_message?: string | null;
    final_program_id?: string | null;
  },
) {
  const { error } = await supabase.from('applications').update(changes).eq('id', id);
  if (error) throw error;
}

// Batch result release ------------------------------------------------------

/** Decisions held for the next release (never visible to students), with the student's name. */
export async function listStagedDecisions(collegeId: string) {
  const { data, error } = await supabase
    .from('staged_decisions')
    .select('*, application:applications(student:students(first_name, last_name))')
    .eq('college_id', collegeId)
    .order('staged_at');
  if (error) throw error;
  return data;
}
export type StagedDecision = Awaited<ReturnType<typeof listStagedDecisions>>[number];

/** Hold a decision for the next release; validated like a direct decision. */
export async function stageDecision(input: {
  applicationId: string;
  decision: 'accepted' | 'rejected';
  finalProgramId: string | null;
  message: string;
}) {
  const { error } = await supabase.rpc('stage_decision', {
    p_application_id: input.applicationId,
    p_decision: input.decision,
    p_final_program_id: input.finalProgramId,
    p_message: input.message,
  });
  if (error) throw error;
}

export async function unstageDecision(applicationId: string) {
  const { error } = await supabase.rpc('unstage_decision', { p_application_id: applicationId });
  if (error) throw error;
}

export type ReleaseResult = {
  released: number;
  failed: { application_id: string; error: string }[];
};

/** Send every held decision now (or only the given ones). */
export async function releaseDecisions(applicationIds?: string[]): Promise<ReleaseResult> {
  const { data, error } = await supabase.rpc(
    'release_decisions',
    applicationIds ? { p_application_ids: applicationIds } : {},
  );
  if (error) throw error;
  return data as ReleaseResult;
}

/** Schedule the automatic release, or clear it with null. */
export async function scheduleRelease(releaseAt: Date | null) {
  const { error } = await supabase.rpc('schedule_decision_release', {
    p_release_at: releaseAt ? releaseAt.toISOString() : null,
  });
  if (error) throw error;
}

/** The queue's status tabs (ported from the web rep dashboard). */
export type ApplicantFilter = 'all' | 'new' | 'review' | 'resubmission' | 'accepted' | 'rejected';

/** ai_scores is one-to-one; PostgREST may return it as an object or a one-item array. */
export function firstOf<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export function studentName(s: { first_name: string; last_name: string } | null | undefined) {
  return [s?.first_name, s?.last_name].filter(Boolean).join(' ') || 'Student';
}
