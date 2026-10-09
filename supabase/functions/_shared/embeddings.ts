// Semantic similarity with Supabase's built-in gte-small model (runs inside the
// Edge Function: no external API, no key, ₱0). Vectors are cached in Postgres.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const session = new Supabase.ai.Session('gte-small');

/**
 * New embeddings per request. Inference counts against the Edge Function CPU
 * limit (~16 in one request kills the worker); cached vectors cost nothing.
 */
export const EMBED_BUDGET = 6;

export async function embed(text: string): Promise<number[]> {
  const output = await session.run(text, { mean_pool: true, normalize: true });
  return Array.from(output as ArrayLike<number>);
}

/** Vectors are normalized, so the dot product is the cosine similarity. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/**
 * gte-small scores every student/program pair in a narrow band. Measured with
 * the staff `compare` diagnostic (Oct 8, 2026): unrelated 0.79–0.815 (Software
 * vs Nursing/Accountancy), adjacent ~0.84 (Nursing vs Pharmacy), matching
 * 0.855–0.88 (Software vs IT/CS, Nursing vs Nursing). Map that band onto 0..1
 * so it can share weights with the rule-based signals.
 */
export const SIM_FLOOR = 0.815;
export const SIM_CEIL = 0.875;
export function semanticStrength(similarity: number): number {
  return Math.max(0, Math.min(1, (similarity - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR)));
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

const parseVector = (v: unknown): number[] =>
  typeof v === 'string' ? (JSON.parse(v) as number[]) : (v as number[]);

export function studentText(s: {
  target_majors: string[];
  interests: string[];
  career_goals?: string | null;
  strand: string | null;
}): string {
  return [
    s.target_majors.length ? `Wants to study ${s.target_majors.join(', ')}.` : '',
    s.interests.length ? `Interested in ${s.interests.join(', ')}.` : '',
    s.career_goals ? `Career goal: ${s.career_goals}.` : '',
    s.strand ? `Senior high school strand: ${s.strand}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function programText(p: {
  name: string;
  description?: string | null;
  prerequisites?: string | null;
}): string {
  return [p.name, p.description, p.prerequisites].filter(Boolean).join('. ');
}

/**
 * Cached embedding for one student, recomputed when their profile text changes.
 * `fresh` is true when the model ran (it used one unit of EMBED_BUDGET).
 */
export async function studentEmbedding(
  admin: SupabaseClient,
  userId: string,
  text: string,
): Promise<{ vector: number[]; fresh: boolean } | null> {
  if (!text) return null;
  const hash = await sha256(text);
  const { data } = await admin
    .from('student_embeddings')
    .select('embedding, source_hash')
    .eq('user_id', userId)
    .maybeSingle();
  if (data?.source_hash === hash) return { vector: parseVector(data.embedding), fresh: false };

  const vector = await embed(text);
  await admin.from('student_embeddings').upsert({
    user_id: userId,
    embedding: JSON.stringify(vector),
    source_hash: hash,
    updated_at: new Date().toISOString(),
  });
  return { vector, fresh: true };
}

/**
 * Cached embeddings for many programs; new or edited programs are embedded, at
 * most `budget` of them. The rest are left out of `vectors` and counted in
 * `pending`, so the caller can score them by rules now and retry later.
 */
export async function programEmbeddings(
  admin: SupabaseClient,
  programs: { id: string; text: string }[],
  budget = EMBED_BUDGET,
): Promise<{ vectors: Map<string, number[]>; pending: number }> {
  const result = new Map<string, number[]>();
  if (!programs.length) return { vectors: result, pending: 0 };

  const { data: cached } = await admin
    .from('program_embeddings')
    .select('program_id, embedding, source_hash')
    .in(
      'program_id',
      programs.map((p) => p.id),
    );
  const byId = new Map((cached ?? []).map((c) => [c.program_id as string, c]));

  const stale: {
    program_id: string;
    embedding: string;
    source_hash: string;
    updated_at: string;
  }[] = [];
  let pending = 0;
  for (const p of programs) {
    const hash = await sha256(p.text);
    const hit = byId.get(p.id);
    if (hit?.source_hash === hash) {
      result.set(p.id, parseVector(hit.embedding));
      continue;
    }
    if (stale.length >= budget) {
      pending++;
      continue;
    }
    const vector = await embed(p.text);
    result.set(p.id, vector);
    stale.push({
      program_id: p.id,
      embedding: JSON.stringify(vector),
      source_hash: hash,
      updated_at: new Date().toISOString(),
    });
  }
  if (stale.length) await admin.from('program_embeddings').upsert(stale);
  return { vectors: result, pending };
}
