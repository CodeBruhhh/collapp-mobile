import { z } from 'zod';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? undefined : v));

/** A representative's account fields, shared by both admin forms. */
const repFields = {
  repName: z.string().trim().min(2, "Enter the representative's full name").max(200),
  repEmail: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  repPassword: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
};

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
  ...repFields,
});

/** Mirrors supabase/functions/admin-create-rep. */
export const createRepSchema = z.object(repFields);

/** Mirrors supabase/functions/admin-create-admin. */
export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Enter the administrator's full name").max(200),
  email: repFields.repEmail,
  password: repFields.repPassword,
});

/** One daily AI limit: a whole number from 0 (off) to 1000. */
export const aiLimitSchema = z.coerce
  .number({ error: 'Enter a number' })
  .int('Use a whole number')
  .min(0, 'Use 0 or more')
  .max(1000, 'Use 1000 or less');
