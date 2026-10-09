import type { z } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Validate `values` and return either the parsed data or the first error per field. */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { data: z.output<S>; errors: null } | { data: null; errors: FieldErrors<z.input<S>> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return { data: null, errors: errors as FieldErrors<z.input<S>> };
}

/** Turn Supabase/Postgres/unknown errors into a message fit for an alert. */
export function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
