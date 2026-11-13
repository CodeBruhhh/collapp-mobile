import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

/** Surface the Edge Function's own `{ error }` message instead of a generic HTTP error. */
async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
  return data as T;
}

type RecommendResult = { count: number; generated_at: string; pending: number };

/** Each call embeds a few new programs (Edge CPU limit); these extra passes finish the rest. */
const MAX_EMBED_PASSES = 5;

/** Re-run the AI Exploration Engine for the signed-in student (SRS 3.1.1.2). */
export async function refreshRecommendations() {
  let result = await invoke<RecommendResult>('ai-recommend');
  for (let pass = 1; pass < MAX_EMBED_PASSES && result.pending > 0; pass++) {
    result = await invoke<RecommendResult>('ai-recommend');
  }
  return result;
}

export async function listRecommendations(userId: string) {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select(
      `id, match_score, reasons, generated_at,
       college:colleges(id, name, city, province, region, logo_path),
       program:programs(id, name, deadline, is_open)`,
    )
    .eq('student_id', userId)
    .order('match_score', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({ ...r, reasons: (r.reasons as string[] | null) ?? [] }));
}
export type Recommendation = Awaited<ReturnType<typeof listRecommendations>>[number];

/** Ask the AI Applicant Scoring function to (re)score one application (SRS 3.1.2.2). */
export function scoreApplication(applicationId: string) {
  return invoke<{ ok: boolean; fit_score?: number; enrollment_likelihood?: number }>('ai-score', {
    applicationId,
  });
}

// AI document checker & summarizer -------------------------------------------

export type DocumentCheckVerdict = 'pass' | 'review' | 'fail';
export type KeyDetail = { label: string; value: string };
export type DocumentCheck = Omit<
  Tables<'document_ai_checks'>,
  'issues' | 'key_details' | 'verdict'
> & {
  verdict: DocumentCheckVerdict | null;
  issues: string[];
  key_details: KeyDetail[];
};

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

const asDetails = (v: unknown): KeyDetail[] =>
  Array.isArray(v)
    ? v.filter((d): d is KeyDetail => typeof d?.label === 'string' && typeof d?.value === 'string')
    : [];

/** AI checks for every document of one application (RLS: owner, its college's reps, admins). */
export async function listDocumentChecks(applicationId: string): Promise<DocumentCheck[]> {
  const { data, error } = await supabase
    .from('document_ai_checks')
    .select('*')
    .eq('application_id', applicationId);
  if (error) throw error;
  return data.map((c) => ({
    ...c,
    verdict: (c.verdict as DocumentCheckVerdict | null) ?? null,
    issues: asStrings(c.issues),
    key_details: asDetails(c.key_details),
  }));
}

/** Run the checker again on one document (owner or reviewing rep). */
export function recheckDocument(documentId: string) {
  return invoke<{ ok: boolean }>('ai-check-document', { documentId });
}

// AI essay feedback & summaries ------------------------------------------------

export type PromptFit = 'strong' | 'partial' | 'weak' | 'no_prompt';

/** Coaching for a student while drafting; returned directly, never stored. */
export type EssayFeedback = {
  summary: string | null;
  key_points: string[];
  strengths: string[];
  improvements: string[];
  language_fixes: { original: string; suggestion: string }[];
  prompt_fit: PromptFit;
  prompt_fit_note: string | null;
  word_count: number;
};

export function getEssayFeedback(essay: string, prompt: string | null) {
  return invoke<EssayFeedback>('ai-essay', { essay, prompt });
}

/** Stored summary of a submitted essay, for reviewers. */
export type EssayReview = Omit<
  Tables<'essay_ai_reviews'>,
  'key_points' | 'strengths' | 'improvements' | 'prompt_fit'
> & {
  key_points: string[];
  strengths: string[];
  improvements: string[];
  prompt_fit: PromptFit | null;
};

export async function getEssayReview(applicationId: string): Promise<EssayReview | null> {
  const { data, error } = await supabase
    .from('essay_ai_reviews')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    key_points: asStrings(data.key_points),
    strengths: asStrings(data.strengths),
    improvements: asStrings(data.improvements),
    prompt_fit: (data.prompt_fit as PromptFit | null) ?? null,
  };
}

/** Staff: (re)generate the stored summary of a submitted essay. */
export function regenerateEssayReview(applicationId: string) {
  return invoke<{ ok: boolean }>('ai-essay', { applicationId });
}
