/**
 * The name a person gives at sign-up ("Cum te numești?") and can change in Cont.
 *
 * Checked here with the same bound as the database (migration 0006: 1 to 60 characters after
 * trimming), so a name the server would refuse is caught with a sentence on the form instead.
 */
export const DISPLAY_NAME_MAX = 60;

const MISSING = 'Scrie cum te numești.';

/**
 * Control and format characters: newlines and tabs (already folded into spaces by then),
 * zero-width spaces, and the direction overrides that can make a name render as other text.
 */
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;

/**
 * Text as a person sees it: whitespace folded to single spaces, invisible and direction
 * characters gone. For names shown to the account's owner, whoever typed them.
 */
export function cleanVisibleText(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(INVISIBLE, '').replace(/ {2,}/g, ' ').trim();
}

/** Cut to `max` characters as the database counts them, never through an emoji. */
export function cutToCharacters(text: string, max: number): string {
  return [...text].slice(0, max).join('');
}

export function normalizeDisplayName(raw: unknown): { name: string | null; error: string | null } {
  if (typeof raw !== 'string') return { name: null, error: MISSING };

  // Whitespace first, so a line break between two words becomes a space and not nothing.
  const name = cleanVisibleText(raw);
  if (!name) return { name: null, error: MISSING };
  // Refused rather than cut: a name quietly shortened is a name the person did not type.
  // Counted in characters as the database counts them, so an emoji is one, not two.
  if ([...name].length > DISPLAY_NAME_MAX) {
    return { name: null, error: `Numele poate avea cel mult ${DISPLAY_NAME_MAX} de caractere.` };
  }
  return { name, error: null };
}
