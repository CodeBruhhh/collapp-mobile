/** 4-point spacing scale; use these steps only. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Squared-off corners; avatars stay round (they size their own radius). */
export const radius = {
  sm: 2,
  md: 4,
  lg: 4,
  pill: 4,
} as const;

/** Page rhythm: side gutter and the space between sections. */
export const rhythm = { gutter: 24, section: 28 } as const;

/** Minimum touch target in points (SRS 3.2.1 / 3.6.10). */
export const TOUCH_TARGET = 44;

/** Comfortable height for primary buttons and text fields. */
export const CONTROL_HEIGHT = 48;
