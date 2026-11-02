import { radius } from './spacing';

/** Non-color parts of a theme: corner shapes and the heading face. */
export interface ThemeTokens {
  radius: Record<keyof typeof radius, number>;
  /** Literary face for screen and section headings; system font when unset. */
  headingFont?: string;
  /** Editorial layout: ruled ledgers, outlined badges, the tab indicator. */
  editorial: boolean;
}

export const defaultTokens: ThemeTokens = { radius, editorial: false };

/** Squared-off corners for the editorial look; avatars stay round (they size their own radius). */
export const editorialTokens: ThemeTokens = {
  radius: { sm: 2, md: 4, lg: 4, pill: 4 },
  editorial: true,
};

/** Editorial page rhythm: side gutter and the space between sections. */
export const editorialSpace = { gutter: 24, section: 28 } as const;
