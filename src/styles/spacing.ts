/** 4-point spacing scale; use these steps only. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Minimum touch target in points (SRS 3.2.1 / 3.6.10). */
export const TOUCH_TARGET = 44;

/** Comfortable height for primary buttons and text fields. */
export const CONTROL_HEIGHT = 48;
