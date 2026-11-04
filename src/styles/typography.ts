/**
 * Libre Caslon Text (SIL Open Font License) for titles: the brand name, dish names and the
 * title of each screen and window. Body text stays in the system font. The font is loaded
 * once, at start, by useTitleFont.
 *
 * Spread into a title style in place of its fontWeight: the file is already Bold, and a
 * fontWeight on top of a custom family makes Android fall back to the system font.
 */
export const titleFont = {
  fontFamily: 'LibreCaslonText_700Bold',
  fontWeight: 'normal',
} as const;
