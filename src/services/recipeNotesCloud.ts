import { signedInContext } from './authContext';
import { warnSafely } from './authErrors';
import { parseRecipeNotes, RecipeNotes } from '../utils/recipeNotes';

const TABLE = 'user_recipe_notes';
const READ_FAILED = 'Nu am putut citi notițele din cont.';
const SAVE_FAILED = 'Nu am putut salva notița în cont.';
const NOT_SIGNED_IN = 'Conectează-te ca notițele să ajungă și pe celelalte dispozitive.';

/**
 * Recipe notes in the account (migration 0010), so they follow it to a second phone. The
 * phone keeps its own copy (@smartmeal_recipe_notes) and stays the source while offline.
 * The local simulation has no table, so it keeps notes on the phone only.
 */
export const recipeNotesCloud = {
  async load(): Promise<{ notes: RecipeNotes; error: string | null }> {
    try {
      const context = await signedInContext();
      if (!context || context.kind !== 'cloud') return { notes: {}, error: null };
      const { data, error } = await context.client
        .from(TABLE)
        .select('recipe_id, note')
        .eq('user_id', context.user.id);
      if (error) {
        warnSafely(READ_FAILED, error);
        return { notes: {}, error: READ_FAILED };
      }
      // From the network: the same validation as the phone's own copy.
      const rows = Array.isArray(data) ? data : [];
      const raw = Object.fromEntries(
        rows
          .filter(
            (row): row is { recipe_id: string; note: unknown } => typeof row?.recipe_id === 'string'
          )
          .map((row) => [row.recipe_id, row.note])
      );
      return { notes: parseRecipeNotes(raw), error: null };
    } catch (e) {
      warnSafely(READ_FAILED, e);
      return { notes: {}, error: READ_FAILED };
    }
  },

  /** Writes the note, or deletes the row when the note was emptied. */
  async save(recipeId: string, text: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const context = await signedInContext();
      if (!context || context.kind !== 'cloud') return { success: false, error: NOT_SIGNED_IN };
      const table = context.client.from(TABLE);
      const { error } =
        text.trim().length > 0
          ? await table.upsert(
              { user_id: context.user.id, recipe_id: recipeId, note: text },
              { onConflict: 'user_id,recipe_id' }
            )
          : await table.delete().eq('user_id', context.user.id).eq('recipe_id', recipeId);
      if (error) {
        warnSafely(SAVE_FAILED, error);
        return { success: false, error: SAVE_FAILED };
      }
      return { success: true, error: null };
    } catch (e) {
      warnSafely(SAVE_FAILED, e);
      return { success: false, error: SAVE_FAILED };
    }
  },
};
