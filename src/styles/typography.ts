/** Type scale: 12 / 14 / 16 / 18 / 24, plus 28 for the few display headings. */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  display: 28,
} as const;

/** Comfortable reading line heights for multi-line text. */
export const lineHeight = {
  sm: 20,
  md: 24,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
