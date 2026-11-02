import { FOREST_WALNUT_PALETTE as P, getAppTheme } from '../theme';

/**
 * The "Midnight Forest & Smoked Walnut" theme: forest green, smoked walnut, cream and a
 * bronze rim. These tests pin which tone plays which role, and that every text the screens
 * draw stays readable (WCAG 2.1 AA) on every surface it is drawn on.
 */

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BODY_TEXT = 4.5;
const LARGE_TEXT_OR_ICON = 3;
const HEX = /^#[0-9A-F]{6}$/;

describe('the palette', () => {
  test('every tone is a solid #RRGGBB colour', () => {
    Object.values(P).forEach((tone) => expect(tone).toMatch(HEX));
  });

  test('dark mode is the forest, light mode is the cream', () => {
    expect(getAppTheme(true).background).toBe(P.forestNight);
    expect(getAppTheme(false).background).toBe(P.cream);
  });

  test('buttons are walnut on cream and bronze on the forest', () => {
    expect(getAppTheme(false).primary).toBe(P.walnut);
    expect(getAppTheme(true).primary).toBe(P.bronzeLight);
  });
});

describe.each([
  ['dark', true],
  ['light', false],
])('%s mode stays readable', (_name, isDark) => {
  const t = getAppTheme(isDark);
  const surfaces = { background: t.background, card: t.card, surface: t.surfaceSecondary };

  test.each(Object.entries(surfaces))('body text on the %s', (_surface, colour) => {
    expect(contrast(t.text, colour)).toBeGreaterThanOrEqual(BODY_TEXT);
    expect(contrast(t.textMuted, colour)).toBeGreaterThanOrEqual(BODY_TEXT);
  });

  test.each(Object.entries(surfaces))('hints and icons on the %s', (_surface, colour) => {
    expect(contrast(t.textSubtle, colour)).toBeGreaterThanOrEqual(LARGE_TEXT_OR_ICON);
    expect(contrast(t.primary, colour)).toBeGreaterThanOrEqual(LARGE_TEXT_OR_ICON);
  });

  test('a button label on the button', () => {
    expect(contrast(t.primaryText, t.primary)).toBeGreaterThanOrEqual(BODY_TEXT);
  });

  test('the primary gradient is two palette tones, and its label reads on both ends', () => {
    const tones: string[] = Object.values(P);
    expect(t.primaryGradient).toHaveLength(2);
    t.primaryGradient.forEach((stop) => {
      expect(tones).toContain(stop);
      expect(contrast(t.primaryText, stop)).toBeGreaterThanOrEqual(BODY_TEXT);
    });
  });

  test('the bright accent reads as text on a card', () => {
    expect(contrast(t.accentHighlight, t.card)).toBeGreaterThanOrEqual(BODY_TEXT);
  });

  test('success and warning messages on a card', () => {
    expect(contrast(t.successText, t.card)).toBeGreaterThanOrEqual(BODY_TEXT);
    expect(contrast(t.warningText, t.card)).toBeGreaterThanOrEqual(BODY_TEXT);
  });
});
