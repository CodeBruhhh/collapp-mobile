import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type College = Tables<'colleges'>;
export type Program = Tables<'programs'>;
export type Requirement = Tables<'requirements'>;

export type CollegeListItem = College & {
  programs: Pick<Program, 'id' | 'name' | 'deadline' | 'is_open'>[];
};

export type CollegeDetail = College & {
  programs: Program[];
  requirements: Requirement[];
};

export type CollegeFilters = { search?: string; region?: string | null };

/** Published colleges (RLS also hides drafts), ported from the web Browse Colleges page. */
export async function listColleges({ search, region }: CollegeFilters): Promise<CollegeListItem[]> {
  let query = supabase
    .from('colleges')
    .select('*, programs(id, name, deadline, is_open)')
    .eq('profile_status', 'published')
    .order('name');
  const term = search?.trim();
  if (term) query = query.ilike('name', `%${term.replace(/[%_]/g, '')}%`);
  if (region) query = query.eq('region', region);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCollege(id: string): Promise<CollegeDetail> {
  const { data, error } = await supabase
    .from('colleges')
    .select('*, programs(*), requirements(*)')
    .eq('id', id)
    .order('name', { referencedTable: 'programs' })
    .order('sort_order', { referencedTable: 'requirements' })
    .single();
  if (error) throw error;
  return data;
}

/** Requirements that apply to one program: college-wide ones plus program-specific ones. */
export function requirementsFor(college: CollegeDetail, programId: string | null): Requirement[] {
  return college.requirements.filter((r) => r.program_id === null || r.program_id === programId);
}

export async function listFollowedCollegeIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('college_id')
    .eq('student_id', userId);
  if (error) throw error;
  return data.map((f) => f.college_id);
}

export async function setFollowing(userId: string, collegeId: string, following: boolean) {
  const { error } = following
    ? await supabase.from('follows').insert({ student_id: userId, college_id: collegeId })
    : await supabase.from('follows').delete().eq('student_id', userId).eq('college_id', collegeId);
  if (error) throw error;
}

/** "Cebu City, Cebu" style location line. */
export function collegeLocation(c: Pick<College, 'city' | 'province' | 'region'>): string {
  return [c.city, c.province].filter(Boolean).join(', ') || c.region || 'Philippines';
}
