import { z } from 'zod';

// Stricter than Supabase Auth's default (6 characters); raise the dashboard
// minimum to match if the policy changes.
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

// Supabase's Email OTP Length is configurable (6-10 digits); accept any of them.
export const OTP_MAX_LENGTH = 10;
const otpCode = z.string().regex(/^[0-9]{6,10}$/, 'Enter the code from your email');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(200),
    email,
    password,
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, 'Accept the Terms and Privacy Policy to continue'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const verifySchema = z.object({
  code: otpCode,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    code: otpCode,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
