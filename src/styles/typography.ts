import type { TextStyle } from 'react-native';

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

/**
 * Loaded before the first screen renders (src/app/_layout.tsx). Each weight is
 * its own family: `fontWeight` does not select custom font files on Android.
 */
export const fonts = {
  serif: 'LibreBaskerville_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Semantic text styles; spread into a style and add the color. */
export const type = {
  /** Screen headings: "Platform overview", "Hello, Aaron". */
  display: { fontFamily: fonts.serif, fontSize: 27, lineHeight: 32, letterSpacing: -1.1 },
  /** Section headings. */
  heading: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, letterSpacing: -0.5 },
  /** Large figures set in the serif. */
  numeral: { fontFamily: fonts.serif, letterSpacing: -1 },
  /** Row titles. */
  title: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.medium, fontSize: 14 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  /** Small caps labels: badges, eyebrows. */
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;
