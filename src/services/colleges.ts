import { COLLEGES, MATCH_SCORES } from '@/data/mockData';
import type { College, RecommendedCollege } from '@/types/models';

import { delay } from './mockApi';

// Each function below maps to a Supabase query later. Screens only depend on
// these signatures, so swapping the implementation should not touch the UI.

export function listColleges(): Promise<College[]> {
  return delay(COLLEGES);
}

/** Colleges ranked by AI match score, best first. */
export function getRecommendations(): Promise<RecommendedCollege[]> {
  const ranked = COLLEGES.map((college) => ({
    college,
    matchScore: MATCH_SCORES[college.id] ?? 0,
  })).sort((a, b) => b.matchScore - a.matchScore);
  return delay(ranked);
}
