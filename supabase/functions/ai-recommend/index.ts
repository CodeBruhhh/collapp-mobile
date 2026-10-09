// AI Exploration Engine (SRS 3.1.1.2, SDD 5): ranks open programs for the calling
// student and stores them in ai_recommendations. Hybrid: gte-small embeddings for
// semantic course matching + explainable rules for strand, grades and location.
import {
  cosine,
  embed,
  EMBED_BUDGET,
  programEmbeddings,
  programText,
  semanticStrength,
  studentEmbedding,
  studentText,
} from '../_shared/embeddings.ts';
import { adminClient, corsHeaders, getCaller, json } from '../_shared/http.ts';
import { matchScore, type StudentInput } from '../_shared/scoring.ts';

const MAX_RESULTS = 12;
const MAX_PER_COLLEGE = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: 'Not signed in' }, 401);
  const body = await req.json().catch(() => ({}));

  // Staff diagnostic: raw model similarity for text pairs, used to calibrate the
  // similarity band in _shared/embeddings.ts. Does not touch student data.
  if (Array.isArray(body?.compare)) {
    if (caller.role === 'student') return json({ error: 'Staff only' }, 403);
    const pairs = (body.compare as unknown[]).filter(
      (p): p is [string, string] =>
        Array.isArray(p) && p.length === 2 && p.every((t) => typeof t === 'string'),
    );
    const texts = [...new Set(pairs.flat())];
    if (texts.length > EMBED_BUDGET) {
      return json({ error: `At most ${EMBED_BUDGET} distinct texts per call` }, 400);
    }
    const vectors = new Map<string, number[]>();
    for (const t of texts) vectors.set(t, await embed(t));
    const results = [];
    for (const [a, b] of pairs) {
      const similarity = cosine(vectors.get(a)!, vectors.get(b)!);
      results.push({
        a,
        b,
        similarity: Number(similarity.toFixed(4)),
        strength: semanticStrength(similarity),
      });
    }
    return json({ results });
  }

  if (caller.role !== 'student') return json({ error: 'Students only' }, 403);

  const { data: s, error: studentError } = await admin
    .from('students')
    .select(
      'strand, gpa, target_majors, preferred_locations, interests, career_goals, address, profile_complete',
    )
    .eq('user_id', caller.id)
    .single();
  if (studentError || !s?.profile_complete) {
    return json({ error: 'Complete your academic profile first' }, 400);
  }
  const student: StudentInput = {
    strand: s.strand,
    gpa: s.gpa === null ? null : Number(s.gpa),
    target_majors: s.target_majors,
    preferred_locations: s.preferred_locations,
    interests: s.interests,
    region: (s.address as { region?: string } | null)?.region ?? null,
  };

  const { data: colleges, error: collegeError } = await admin
    .from('colleges')
    .select(
      'id, name, region, programs(id, name, description, prerequisites, strands, min_gpa, deadline, is_open)',
    )
    .eq('profile_status', 'published');
  if (collegeError) return json({ error: collegeError.message }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const candidates = colleges.flatMap((college) =>
    college.programs
      .filter((p) => p.is_open && (!p.deadline || p.deadline >= today))
      .map((program) => ({ college, program })),
  );

  // Semantic signal; if the model is unavailable, fall back to rules only.
  // Programs over this request's embedding budget are scored by rules for now
  // and reported as `pending`; the app calls again to finish them.
  let semantic = new Map<string, number>();
  let pending = 0;
  try {
    const studentVector = await studentEmbedding(admin, caller.id, studentText(s));
    if (studentVector) {
      const programs = await programEmbeddings(
        admin,
        candidates.map(({ program }) => ({ id: program.id, text: programText(program) })),
        EMBED_BUDGET - (studentVector.fresh ? 1 : 0),
      );
      pending = programs.pending;
      semantic = new Map(
        [...programs.vectors].map(([id, v]) => [
          id,
          semanticStrength(cosine(studentVector.vector, v)),
        ]),
      );
    }
  } catch (e) {
    console.error('embedding failed, using rule-based scores only', e);
  }

  const ranked = candidates
    .map(({ college, program }) => ({
      college,
      program,
      ...matchScore(
        student,
        { ...program, min_gpa: program.min_gpa === null ? null : Number(program.min_gpa) },
        college,
        semantic.get(program.id),
      ),
    }))
    .sort((a, b) => b.score - a.score);

  // Keep the list varied: at most two programs per college.
  const perCollege = new Map<string, number>();
  const top = ranked
    .filter((r) => {
      const n = perCollege.get(r.college.id) ?? 0;
      if (n >= MAX_PER_COLLEGE) return false;
      perCollege.set(r.college.id, n + 1);
      return true;
    })
    .slice(0, MAX_RESULTS);

  const generatedAt = new Date().toISOString();
  await admin.from('ai_recommendations').delete().eq('student_id', caller.id);
  if (top.length) {
    const { error: insertError } = await admin.from('ai_recommendations').insert(
      top.map((r) => ({
        student_id: caller.id,
        college_id: r.college.id,
        program_id: r.program.id,
        match_score: r.score,
        reasons: r.reasons,
        generated_at: generatedAt,
      })),
    );
    if (insertError) return json({ error: insertError.message }, 500);
  }

  return json({ count: top.length, generated_at: generatedAt, pending });
});
