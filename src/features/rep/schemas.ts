import { z } from 'zod';

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v));

/** Institution profile (web: schoolRepOnboardingSchema / editCollegeSchema). */
export const institutionSchema = z.object({
  name: z.string().trim().min(3, 'Use at least 3 characters').max(200),
  description: z.string().trim().min(20, 'Write at least a short paragraph').max(5000),
  website: z
    .string()
    .trim()
    .regex(/^(https?:\/\/\S+)?$/, 'Start with http:// or https://')
    .transform((v) => (v === '' ? null : v)),
  region: z.string({ error: 'Select a region' }).min(1, 'Select a region'),
  province: z.string().nullable(),
  city: z.string().nullable(),
});

const optionalNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      message,
    )
    .transform((v) => (v === '' ? null : Number(v)));

export const programSchema = z.object({
  name: z.string().trim().min(2, 'Enter the program name').max(200),
  degree: nullableText(50),
  description: z.string().trim().max(5000),
  deadline: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use the format YYYY-MM-DD')
    .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Enter a real date')
    .transform((v) => (v === '' ? null : v)),
  tuition_per_year: optionalNumber(0, 10_000_000, 'Enter an amount in pesos'),
  slots: optionalNumber(0, 100_000, 'Enter a whole number').refine(
    (v) => v === null || Number.isInteger(v),
    'Enter a whole number',
  ),
  min_gpa: optionalNumber(60, 100, 'Use the 60–100 scale'),
  strands: z.array(z.string()),
  essay_prompt: nullableText(2000),
  prerequisites: nullableText(2000),
  is_open: z.boolean(),
});

export const requirementSchema = z.object({
  label: z.string().trim().min(2, 'Name the requirement').max(200),
  description: nullableText(1000),
  kind: z.enum(['document', 'essay']),
  is_required: z.boolean(),
  program_id: z.string().nullable(),
});

export const postSchema = z.object({
  type: z.enum(['news', 'event', 'scholarship', 'deadline']),
  title: z.string().trim().min(3, 'Add a title').max(200),
  body: z.string().trim().min(10, 'Write a few sentences').max(10000),
  event_at: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use the format YYYY-MM-DD')
    .transform((v) => (v === '' ? null : `${v}T00:00:00+08:00`)),
});

/** Standard PH admission requirements (web: availableRequirements). */
export const STANDARD_REQUIREMENTS = [
  'High School Transcript (Form 138)',
  'PSA Birth Certificate',
  'Letter of Recommendation',
  'Certificate of Good Moral Character',
  'College Entrance Exam Result',
  '2x2 ID Photo',
] as const;
