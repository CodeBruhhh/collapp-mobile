import { z } from 'zod';

import type { Json } from '@/types/database';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/** `colleges.theme`: a college page's colours (see the college_theme migration). */
export const collegeThemeSchema = z.object({
  primary: hex,
  secondary: hex,
  accent: hex,
  /** 'logo' follows the logo (re-picked when it changes); 'custom' was edited by a rep. */
  source: z.enum(['logo', 'custom']).optional(),
  /** The logo's other main colours, offered as quick choices. */
  palette: z.array(hex).max(8).optional(),
});

export type CollegeTheme = z.infer<typeof collegeThemeSchema>;

/** A stored theme, or null for CollApp's own colours (also when it is malformed). */
export function parseCollegeTheme(value: Json | null | undefined): CollegeTheme | null {
  const result = collegeThemeSchema.safeParse(value);
  return result.success ? result.data : null;
}
