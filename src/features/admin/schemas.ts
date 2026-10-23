import { z } from 'zod';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? undefined : v));

/** Mirrors supabase/functions/admin-create-college (ported from the web addCollegeSchema). */
export const createCollegeSchema = z.object({
  name: z.string().trim().min(3, 'Enter the college name').max(200),
  description: z.string().trim().max(5000),
  website: z
    .string()
    .trim()
    .regex(/^(https?:\/\/\S+)?$/, 'Start the website with http:// or https://')
    .transform((v) => (v === '' ? undefined : v)),
  region: optional(100),
  province: optional(100),
  city: optional(100),
  repName: z.string().trim().min(2, "Enter the representative's full name").max(200),
  repEmail: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  repPassword: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
});
