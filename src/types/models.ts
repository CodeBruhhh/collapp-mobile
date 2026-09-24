// Shapes follow the SDD data dictionary (section 4.2). Field names are camelCase
// here; map from snake_case when the Supabase queries replace the mock services.

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'action_required';

export interface Program {
  id: string;
  collegeId: string;
  name: string;
  /** ISO date string. */
  deadline: string;
}

export interface College {
  id: string;
  name: string;
  /** Display text, e.g. "Cebu City, Cebu". */
  location: string;
  /** Broad area used by the location filter. */
  region: string;
  description: string;
  /** Enrolled students; used to rank "Popular" universities. */
  studentCount: number;
  /** Home screen filter chips, e.g. "Engineering", "Top Universities". */
  categories: string[];
  programs: Program[];
}

export interface Application {
  id: string;
  collegeId: string;
  programId: string;
  status: ApplicationStatus;
  /** ISO date string, null while still a draft. */
  submittedAt: string | null;
}

export interface ApplicationView extends Application {
  college: College;
  program: Program;
}

export interface RecommendedCollege {
  college: College;
  /** 0-100, produced by the AI Exploration Engine. */
  matchScore: number;
}

export type PostType = 'news' | 'event' | 'scholarship' | 'deadline';

export interface FeedPost {
  id: string;
  collegeId: string;
  collegeName: string;
  type: PostType;
  title: string;
  body: string;
  /** ISO date string. */
  postedAt: string;
}
