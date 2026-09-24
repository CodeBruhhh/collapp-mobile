/** Simulates network latency so loading states are visible during development. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * DEV ONLY: the student the app pretends to be until Auth is built.
 * Replace with the Supabase session's user id.
 */
export function getCurrentStudentId(): string {
  return 'student-demo';
}
