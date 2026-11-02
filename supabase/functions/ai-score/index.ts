// AI Applicant Scoring (SRS 3.1.2.2, SDD 5): institutional fit and predicted
// enrollment likelihood for one application, saved to ai_scores. Advisory only:
// students may trigger scoring of their own submission but never see the result.
// Called by the database (submit, document review, profile edits) with the
// webhook secret, or by a signed-in rep/admin from the app (Recalculate).
// Deployed with verify_jwt off because database calls carry no user JWT; both
// paths are authenticated below.
import {
  cosine,
  programEmbeddings,
  programText,
  semanticStrength,
  studentEmbedding,
  studentText,
} from '../_shared/embeddings.ts';
import { adminClient, corsHeaders, getCaller, json, type Caller } from '../_shared/http.ts';
import { applicantScore } from '../_shared/scoring.ts';
import { isFromDatabase } from '../_shared/webhook.ts';

const ACTIVE = ['submitted', 'under_review', 'action_required'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = adminClient();
  const fromDatabase = await isFromDatabase(req, admin);
  const caller: Caller | null = fromDatabase ? null : await getCaller(req, admin);
  if (!fromDatabase && !caller) return json({ error: 'Not signed in' }, 401);

  const body = await req.json().catch(() => null);
  const raw = body?.applicationId ?? body?.application_id;
  const applicationId = typeof raw === 'string' ? raw : null;
  if (!applicationId) return json({ error: 'applicationId is required' }, 400);

  const { data: app, error } = await admin
    .from('applications')
    .select(
      `id, status, student_id, college_id, program_id, second_program_id, essay,
       college:colleges(id, name, region),
       program:programs!applications_program_id_fkey(id, name, description, prerequisites, strands, min_gpa, deadline, is_open),
       documents(review_status, requirement_id)`,
    )
    .eq('id', applicationId)
    .single();
  if (error || !app) return json({ error: 'Application not found' }, 404);

  const allowed =
    fromDatabase ||
    caller?.role === 'admin' ||
    (caller?.role === 'school_rep' && caller.collegeId === app.college_id) ||
    (caller?.role === 'student' && caller.id === app.student_id);
  if (!allowed) return json({ error: 'Not allowed' }, 403);
  // Decided applications keep the score they were decided on.
  if (!ACTIVE.includes(app.status)) {
    return json({ error: 'Only applications under consideration are scored' }, 400);
  }

  const [{ data: s }, { data: requirements }, { count: follows }, { count: others }] =
    await Promise.all([
      admin
        .from('students')
        .select('strand, gpa, target_majors, preferred_locations, interests, career_goals, address')
        .eq('user_id', app.student_id)
        .single(),
      admin
        .from('requirements')
        .select('id, program_id, kind')
        .eq('college_id', app.college_id)
        .eq('is_required', true),
      admin
        .from('follows')
        .select('college_id', { count: 'exact', head: true })
        .eq('student_id', app.student_id)
        .eq('college_id', app.college_id),
      admin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', app.student_id)
        .neq('id', app.id)
        .in('status', ['submitted', 'under_review', 'action_required', 'accepted']),
    ]);
  if (!s || !app.program || !app.college)
    return json({ error: 'Incomplete application data' }, 400);

  const applicable = (requirements ?? []).filter(
    (r) => r.program_id === null || r.program_id === app.program_id,
  );
  const required = applicable.filter((r) => r.kind === 'document');
  const essayRequired = applicable.some((r) => r.kind === 'essay');
  // One entry per requirement (best status wins); flagged documents earn nothing.
  const rank: Record<string, number> = { approved: 3, pending: 2, resubmit: 1, rejected: 0 };
  const best = new Map<string, string>();
  for (const d of app.documents) {
    if (!d.requirement_id || !required.some((r) => r.id === d.requirement_id)) continue;
    const prev = best.get(d.requirement_id);
    if (prev === undefined || (rank[d.review_status] ?? 0) > (rank[prev] ?? 0)) {
      best.set(d.requirement_id, d.review_status);
    }
  }
  const statuses = [...best.values()];
  const approvedDocuments = statuses.filter((st) => st === 'approved').length;
  const submittedDocuments = statuses.filter((st) => st === 'approved' || st === 'pending').length;

  // Semantic course match from the embedding model; rules only if it fails.
  let semantic: number | undefined;
  try {
    const studentVector = await studentEmbedding(admin, app.student_id, studentText(s));
    const programVector = (
      await programEmbeddings(admin, [{ id: app.program.id, text: programText(app.program) }])
    ).vectors.get(app.program.id);
    if (studentVector && programVector) {
      semantic = semanticStrength(cosine(studentVector.vector, programVector));
    }
  } catch (e) {
    console.error('embedding failed, using rule-based score only', e);
  }

  const result = applicantScore(
    {
      strand: s.strand,
      gpa: s.gpa === null ? null : Number(s.gpa),
      target_majors: s.target_majors,
      preferred_locations: s.preferred_locations,
      interests: s.interests,
      region: (s.address as { region?: string } | null)?.region ?? null,
    },
    { ...app.program, min_gpa: app.program.min_gpa === null ? null : Number(app.program.min_gpa) },
    app.college,
    {
      essay: app.essay,
      essayRequired,
      requiredDocuments: required.length,
      submittedDocuments,
      approvedDocuments,
      followsCollege: (follows ?? 0) > 0,
      otherActiveApplications: others ?? 0,
    },
    semantic,
  );

  const { error: upsertError } = await admin.from('ai_scores').upsert(
    {
      application_id: app.id,
      fit_score: result.fit,
      enrollment_likelihood: result.likelihood,
      breakdown: { ...result.breakdown, reasons: result.reasons },
      explanation: result.reasons.join(' · ') || null,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'application_id' },
  );
  if (upsertError) return json({ error: upsertError.message }, 500);

  // Scores are staff-only; students (and the database) just learn that scoring ran.
  return !caller || caller.role === 'student'
    ? json({ ok: true })
    : json({ ok: true, fit_score: result.fit, enrollment_likelihood: result.likelihood });
});
