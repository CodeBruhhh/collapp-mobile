import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a real date')
  .refine((v) => {
    const age = (Date.now() - Date.parse(v)) / (365.25 * 24 * 3600 * 1000);
    return age >= 12 && age <= 100;
  }, 'Check your date of birth');

/** Step 1 — personal information. Matches public.students columns. */
export const personalSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(1, 'Enter your last name').max(100),
  dateOfBirth: isoDate,
  sex: z.enum(['male', 'female', 'other'], 'Select one'),
  mobile: z
    .string()
    .trim()
    .regex(/^((\+63|0)9\d{9})?$/, 'Use 09XXXXXXXXX or +639XXXXXXXXX')
    .transform((v) => (v === '' ? null : v)),
});

/** Step 2 — permanent address (ported from the web onboarding form). */
export const addressSchema = z
  .object({
    isInternational: z.boolean(),
    region: z.string().nullable(),
    province: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().trim().max(100),
    street: z.string().trim().max(200),
    zipCode: z
      .string()
      .trim()
      .regex(/^(\d{4})?$/, 'PH zip codes have 4 digits'),
    fullAddress: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (v.isInternational) {
      if (!v.country)
        ctx.addIssue({ code: 'custom', path: ['country'], message: 'Enter your country' });
      if (!v.fullAddress)
        ctx.addIssue({ code: 'custom', path: ['fullAddress'], message: 'Enter your full address' });
      return;
    }
    if (!v.region)
      ctx.addIssue({ code: 'custom', path: ['region'], message: 'Select your region' });
    if (!v.province)
      ctx.addIssue({ code: 'custom', path: ['province'], message: 'Select your province' });
    if (!v.city) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Select your city' });
  });

/** Step 3 — academic background used by the AI exploration engine (SRS 3.1.1.2). */
export const academicSchema = z.object({
  seniorHighSchool: z.string().trim().min(2, 'Enter your senior high school').max(200),
  strand: z.string({ error: 'Select your strand' }).min(1, 'Select your strand'),
  gpa: z
    .string()
    .trim()
    .regex(/^\d{2,3}(\.\d{1,2})?$/, 'Enter your average, e.g. 92.5')
    .transform(Number)
    .pipe(z.number().min(60, 'Averages start at 60').max(100, 'The maximum is 100')),
  targetMajors: z.array(z.string()).min(1, 'Pick at least one').max(5, 'Pick up to 5'),
  preferredLocations: z.array(z.string()).max(5, 'Pick up to 5'),
  interests: z.array(z.string()).min(1, 'Pick at least one').max(8, 'Pick up to 8'),
  careerGoals: optionalText(1000),
});

export type AddressInput = z.input<typeof addressSchema>;
