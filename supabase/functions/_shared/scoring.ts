// Rule-based, explainable scoring shared by ai-recommend and ai-score
// (SRS 3.1.1.2, 3.1.2.2). Plain TypeScript so it can be unit-tested outside Deno.
// Every score comes with human-readable reasons: AI output is advisory only (SPMP 3).

export type StudentInput = {
  strand: string | null;
  gpa: number | null;
  target_majors: string[];
  preferred_locations: string[];
  interests: string[];
  region: string | null;
};

export type ProgramInput = {
  id: string;
  name: string;
  description: string;
  strands: string[];
  min_gpa: number | null;
  deadline: string | null;
  is_open: boolean;
};

export type CollegeInput = { id: string; name: string; region: string | null };

export type Scored = { score: number; reasons: string[] };

const STOPWORDS = new Set([
  'bachelor', 'of', 'science', 'in', 'and', 'the', 'bs', 'ba', 'bsed', 'arts', 'major',
  'program', 'degree', 'with', 'for', 'a',
]);

/** Lowercase content words, e.g. "BS Computer Science" -> ["computer"]. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** How well a wish ("Computer Science") matches a program, 0..1. */
export function phraseMatch(wish: string, programText: string): number {
  const w = wish.toLowerCase().trim();
  const p = programText.toLowerCase();
  if (w && p.includes(w)) return 1;
  const wt = tokens(wish);
  if (!wt.length) return 0;
  const pt = new Set(tokens(programText));
  return wt.filter((t) => pt.has(t)).length / wt.length;
}

const INTEREST_KEYWORDS: Record<string, string[]> = {
  Technology: ['computer', 'information', 'technology', 'software', 'data', 'computing', 'it'],
  Business: ['business', 'accountancy', 'accounting', 'management', 'marketing', 'finance', 'economics', 'entrepreneurship'],
  Arts: ['fine', 'multimedia', 'music', 'theater', 'film', 'creative'],
  Science: ['biology', 'chemistry', 'physics', 'mathematics', 'marine', 'environmental'],
  Engineering: ['engineering'],
  Health: ['nursing', 'medical', 'pharmacy', 'health', 'therapy', 'medicine', 'nutrition'],
  Design: ['design', 'architecture', 'multimedia', 'interior'],
  Law: ['law', 'legal', 'political', 'criminology'],
  Education: ['education', 'teaching', 'elementary', 'secondary'],
  Media: ['communication', 'journalism', 'media', 'broadcasting'],
  Sports: ['sports', 'physical', 'exercise'],
  'Public Service': ['public', 'administration', 'political', 'social', 'criminology'],
};

/** Strands a program usually fits when the college didn't list any. */
const STRAND_HINTS: [RegExp, string[]][] = [
  [/engineer|computer|information tech|science|nursing|medical|pharmacy|architect|math|biology/i, ['STEM']],
  [/business|account|management|marketing|finance|entrepreneur|economics|hospitality|tourism/i, ['ABM']],
  [/education|communication|political|psychology|law|criminology|social|journalism|history/i, ['HUMSS']],
  [/fine arts|multimedia|design|architecture|music|film/i, ['Arts and Design']],
  [/information tech|computer/i, ['TVL - ICT']],
  [/hospitality|culinary|tourism/i, ['TVL - Home Economics']],
  [/physical education|sports/i, ['Sports']],
];

const pct = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 100);

function strandFit(student: StudentInput, program: ProgramInput): { value: number; reason?: string } {
  if (!student.strand) return { value: 0.5 };
  const strand = student.strand.toLowerCase();
  if (program.strands.length) {
    return program.strands.some((s) => s.toLowerCase() === strand)
      ? { value: 1, reason: `Your ${student.strand} strand is a preferred strand` }
      : { value: 0.2 };
  }
  const inferred = STRAND_HINTS.filter(([re]) => re.test(program.name)).flatMap(([, s]) => s);
  if (!inferred.length || student.strand === 'GAS') return { value: 0.6 };
  return inferred.some((s) => s.toLowerCase() === strand)
    ? { value: 0.85, reason: `${student.strand} prepares you well for this program` }
    : { value: 0.35 };
}

function academicFit(student: StudentInput, program: ProgramInput, baseline = 85) {
  if (student.gpa === null) return { value: 0.5 };
  const target = program.min_gpa ?? baseline;
  if (student.gpa >= target) {
    return {
      value: Math.min(1, 0.8 + (student.gpa - target) / 50),
      reason: program.min_gpa
        ? `Your average (${student.gpa}) meets the ${program.min_gpa} minimum`
        : `Strong general average (${student.gpa})`,
    };
  }
  return { value: Math.max(0, 0.7 - (target - student.gpa) / 10) };
}

function interestFit(student: StudentInput, programText: string) {
  const words = new Set(tokens(programText));
  const hits = student.interests.filter((i) =>
    (INTEREST_KEYWORDS[i] ?? tokens(i)).some((k) => words.has(k)),
  );
  return {
    value: student.interests.length ? Math.min(1, hits.length / 2) : 0.5,
    reason: hits.length ? `Matches your interest in ${hits.slice(0, 2).join(' and ')}` : undefined,
  };
}

/** Recommendation match score, 0..100 (SRS 3.1.1.2). */
export function matchScore(
  student: StudentInput,
  program: ProgramInput,
  college: CollegeInput,
): Scored {
  const text = `${program.name} ${program.description}`;
  const reasons: string[] = [];

  // 35% — course/major preference
  const majorBest = student.target_majors.reduce(
    (best, m) => {
      const v = phraseMatch(m, text);
      return v > best.v ? { v, m } : best;
    },
    { v: 0, m: '' },
  );
  if (majorBest.v >= 0.5) reasons.push(`Matches your preferred course: ${majorBest.m}`);

  // 20% — strand
  const strand = strandFit(student, program);
  if (strand.reason) reasons.push(strand.reason);

  // 20% — location
  let location = 0.5;
  if (college.region && student.preferred_locations.length) {
    location = student.preferred_locations.includes(college.region) ? 1 : 0.15;
    if (location === 1) reasons.push(`In your preferred region (${college.region})`);
  } else if (college.region && student.region === college.region) {
    location = 0.8;
    reasons.push('Close to home');
  }

  // 15% — academics, 10% — interests
  const academic = academicFit(student, program);
  if (academic.reason) reasons.push(academic.reason);
  const interest = interestFit(student, text);
  if (interest.reason) reasons.push(interest.reason);

  const score =
    0.35 * majorBest.v + 0.2 * strand.value + 0.2 * location + 0.15 * academic.value + 0.1 * interest.value;
  return { score: pct(score), reasons };
}

export type ApplicationInput = {
  isFirstChoice: boolean;
  essay: string | null;
  requiredDocuments: number;
  submittedDocuments: number;
  approvedDocuments: number;
  followsCollege: boolean;
  otherActiveApplications: number;
};

/** Applicant fit and enrollment likelihood, 0..100 each (SRS 3.1.2.2). Advisory only. */
export function applicantScore(
  student: StudentInput,
  program: ProgramInput,
  college: CollegeInput,
  app: ApplicationInput,
): { fit: number; likelihood: number; breakdown: Record<string, number>; reasons: string[] } {
  const text = `${program.name} ${program.description}`;
  const reasons: string[] = [];

  const academic = academicFit(student, program);
  const strand = strandFit(student, program);
  const major = Math.max(0, ...student.target_majors.map((m) => phraseMatch(m, text)));
  const docs = app.requiredDocuments
    ? Math.min(1, (app.submittedDocuments + app.approvedDocuments) / (2 * app.requiredDocuments))
    : 1;
  const words = (app.essay ?? '').trim().split(/\s+/).filter(Boolean).length;
  const essay = words === 0 ? 0.4 : Math.min(1, 0.5 + words / 600);

  if (academic.reason) reasons.push(academic.reason);
  if (strand.reason) reasons.push(strand.reason);
  if (major >= 0.5) reasons.push('Program matches the course the student wants');
  if (docs === 1) reasons.push('All required documents approved');
  if (words >= 250) reasons.push('Substantial essay');

  const fit = 0.35 * academic.value + 0.2 * strand.value + 0.2 * major + 0.15 * docs + 0.1 * essay;

  const nearby = college.region && (student.region === college.region || student.preferred_locations.includes(college.region));
  if (app.isFirstChoice) reasons.push('Applied as first choice');
  if (nearby) reasons.push('Lives in or prefers this region');
  if (app.followsCollege) reasons.push('Follows the college');
  const competition = 1 / (1 + Math.max(0, app.otherActiveApplications) * 0.35);
  const likelihood =
    0.3 * (app.isFirstChoice ? 1 : 0.55) +
    0.25 * (nearby ? 1 : 0.4) +
    0.15 * (app.followsCollege ? 1 : 0.5) +
    0.3 * competition;

  return {
    fit: pct(fit),
    likelihood: pct(likelihood),
    breakdown: {
      academics: pct(academic.value),
      strand: pct(strand.value),
      course_match: pct(major),
      documents: pct(docs),
      essay: pct(essay),
      first_choice: app.isFirstChoice ? 100 : 55,
      proximity: nearby ? 100 : 40,
      competing_applications: app.otherActiveApplications,
    },
    reasons,
  };
}
