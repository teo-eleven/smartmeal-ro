/**
 * The name a person gives at sign-up ("Cum te numești?") and can change in Cont.
 *
 * Checked here with the same bound as the database (migration 0006: 1 to 60 characters after
 * trimming), so a name the server would refuse is caught with a sentence on the form instead.
 */
export const DISPLAY_NAME_MAX = 60;

const MISSING = 'Scrie cum te numești.';

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

export function normalizeDisplayName(raw: unknown): { name: string | null; error: string | null } {
  if (typeof raw !== 'string') return { name: null, error: MISSING };

  const name = raw.replace(CONTROL_CHARACTERS, '').replace(/\s+/g, ' ').trim();
  if (!name) return { name: null, error: MISSING };
  // Refused rather than cut: a name quietly shortened is a name the person did not type.
  if (name.length > DISPLAY_NAME_MAX) {
    return { name: null, error: `Numele poate avea cel mult ${DISPLAY_NAME_MAX} de caractere.` };
  }
  return { name, error: null };
}
