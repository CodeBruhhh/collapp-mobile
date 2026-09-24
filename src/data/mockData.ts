import type { Application, College, FeedPost, Program } from '@/types/models';

// SAMPLE DATA ONLY. Institutions are fictional. Dates are relative to "today"
// so the demo never goes stale.
const DAY_MS = 86_400_000;
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY_MS).toISOString();

function programs(collegeId: string, list: [string, number][]): Program[] {
  return list.map(([name, deadlineInDays], i) => ({
    id: `${collegeId}-p${i + 1}`,
    collegeId,
    name,
    deadline: daysFromNow(deadlineInDays),
  }));
}

export const COLLEGES: College[] = [
  {
    id: 'col-1',
    name: 'Lapu Coastal University',
    location: 'Lapu-Lapu City, Cebu',
    region: 'Cebu',
    description: 'A coastal campus known for maritime studies and applied technology programs.',
    studentCount: 12_400,
    categories: ['Engineering', 'Top Universities'],
    programs: programs('col-1', [
      ['BS Computer Engineering', 21],
      ['BS Information Technology', 21],
      ['BS Marine Engineering', 35],
    ]),
  },
  {
    id: 'col-2',
    name: 'Visayan State College',
    location: 'Cebu City, Cebu',
    region: 'Cebu',
    description: 'A public college with strong nursing, education, and accountancy tracks.',
    studentCount: 18_200,
    categories: ['Health', 'Business', 'Liberal Arts'],
    programs: programs('col-2', [
      ['BS Nursing', 14],
      ['BS Elementary Education', 28],
      ['BS Accountancy', 28],
    ]),
  },
  {
    id: 'col-3',
    name: 'Mactan Institute of Engineering',
    location: 'Mandaue City, Cebu',
    region: 'Cebu',
    description: 'Engineering-focused institute with industry partnerships and on-site labs.',
    studentCount: 9_800,
    categories: ['Engineering', 'Top Universities'],
    programs: programs('col-3', [
      ['BS Electronics Engineering', 10],
      ['BS Civil Engineering', 10],
      ['BS Computer Science', 18],
    ]),
  },
  {
    id: 'col-4',
    name: 'Bohol Heritage University',
    location: 'Tagbilaran City, Bohol',
    region: 'Bohol',
    description: 'A small university built around tourism, hospitality, and communication.',
    studentCount: 4_300,
    categories: ['Business', 'Liberal Arts'],
    programs: programs('col-4', [
      ['BS Tourism Management', 40],
      ['BS Hospitality Management', 40],
      ['AB Communication', 45],
    ]),
  },
  {
    id: 'col-5',
    name: 'Davao Highlands College',
    location: 'Davao City, Davao del Sur',
    region: 'Davao',
    description: 'Science and agriculture programs with a research-oriented approach.',
    studentCount: 7_600,
    categories: ['Science'],
    programs: programs('col-5', [
      ['BS Agriculture', 30],
      ['BS Biology', 30],
      ['BS Information Systems', 5],
    ]),
  },
  {
    id: 'col-6',
    name: 'Metro Manila Polytechnic',
    location: 'Manila, Metro Manila',
    region: 'Manila',
    description: 'Large polytechnic with architecture, industrial engineering, and data programs.',
    studentCount: 26_500,
    categories: ['Engineering', 'Science', 'Top Universities'],
    programs: programs('col-6', [
      ['BS Architecture', 25],
      ['BS Industrial Engineering', 25],
      ['BS Data Science', 3],
    ]),
  },
];

export const APPLICATIONS: Application[] = [
  { id: 'app-1', collegeId: 'col-1', programId: 'col-1-p1', status: 'under_review', submittedAt: daysFromNow(-10) },
  { id: 'app-2', collegeId: 'col-3', programId: 'col-3-p3', status: 'accepted', submittedAt: daysFromNow(-25) },
  { id: 'app-3', collegeId: 'col-6', programId: 'col-6-p3', status: 'action_required', submittedAt: daysFromNow(-6) },
  { id: 'app-4', collegeId: 'col-5', programId: 'col-5-p3', status: 'draft', submittedAt: null },
  { id: 'app-5', collegeId: 'col-3', programId: 'col-3-p1', status: 'submitted', submittedAt: daysFromNow(-2) },
];

/** Output of the AI Exploration Engine (AI_Recommendations table), 0-100. */
export const MATCH_SCORES: Record<string, number> = {
  'col-3': 94,
  'col-1': 91,
  'col-6': 84,
  'col-5': 76,
  'col-4': 62,
  'col-2': 58,
};

export const FEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    collegeId: 'col-6',
    collegeName: 'Metro Manila Polytechnic',
    type: 'deadline',
    title: 'BS Data Science deadline moved up',
    body: 'Applicants must complete their document uploads earlier than announced. Check your application for missing items.',
    postedAt: daysFromNow(-1),
  },
  {
    id: 'post-2',
    collegeId: 'col-3',
    collegeName: 'Mactan Institute of Engineering',
    type: 'scholarship',
    title: 'Engineering scholarship now open',
    body: 'Partial tuition grants are available for incoming engineering students with a strong math background.',
    postedAt: daysFromNow(-2),
  },
  {
    id: 'post-3',
    collegeId: 'col-1',
    collegeName: 'Lapu Coastal University',
    type: 'event',
    title: 'Campus open house this Saturday',
    body: 'Tour the labs, meet faculty, and talk to current students about life on campus.',
    postedAt: daysFromNow(-3),
  },
  {
    id: 'post-4',
    collegeId: 'col-5',
    collegeName: 'Davao Highlands College',
    type: 'news',
    title: 'New research lab opens for undergraduates',
    body: 'The new lab gives second-year students early access to hands-on research projects.',
    postedAt: daysFromNow(-5),
  },
];
