/** Personal notes per recipe id, kept on the phone (the cloud copy comes with stage 5). */
export type RecipeNotes = Readonly<Record<string, string>>;

/** Generous for a cooking note, small enough that storage stays light. */
export const MAX_NOTE_LENGTH = 2000;

function clean(text: string): string {
  return text.slice(0, MAX_NOTE_LENGTH);
}

/** Storage is untrusted: only non-empty text survives, cut to the limit. */
export function parseRecipeNotes(raw: unknown): RecipeNotes {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .filter(([, text]) => text.trim().length > 0)
      .map(([id, text]) => [id, clean(text)])
  );
}

/** A new set of notes with this one written; an emptied note is removed. */
export function withRecipeNote(notes: RecipeNotes, recipeId: string, text: string): RecipeNotes {
  const { [recipeId]: _previous, ...others } = notes;
  return text.trim().length > 0 ? { ...others, [recipeId]: clean(text) } : others;
}
