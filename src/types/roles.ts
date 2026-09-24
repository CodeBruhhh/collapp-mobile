import type { Href } from 'expo-router';

/** Matches the `role` column on the Users table (SDD 4.2). */
export type Role = 'student' | 'school_rep' | 'admin';

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  school_rep: 'School Representative',
  admin: 'Administrator',
};

/** First screen each role lands on after signing in. */
export const ROLE_HOME: Record<Role, Href> = {
  student: '/student/home',
  school_rep: '/rep/dashboard',
  admin: '/admin/analytics',
};
