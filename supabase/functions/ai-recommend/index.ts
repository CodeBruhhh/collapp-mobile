// AI Exploration Engine (SRS 3.1.1.2, SDD 5): ranks open programs for the calling
// student and stores them in ai_recommendations. Rule-based and explainable (SPMP R4).
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
  if (caller.role !== 'student') return json({ error: 'Students only' }, 403);

  const { data: s, error: studentError } = await admin
    .from('students')
    .select('strand, gpa, target_majors, preferred_locations, interests, address, profile_complete')
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
    .select('id, name, region, programs(id, name, description, strands, min_gpa, deadline, is_open)')
    .eq('profile_status', 'published');
  if (collegeError) return json({ error: collegeError.message }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const ranked = colleges
    .flatMap((college) =>
      college.programs
        .filter((p) => p.is_open && (!p.deadline || p.deadline >= today))
        .map((program) => ({
          college,
          program,
          ...matchScore(
            student,
            { ...program, min_gpa: program.min_gpa === null ? null : Number(program.min_gpa) },
            college,
          ),
        })),
    )
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

  return json({ count: top.length, generated_at: generatedAt });
});
