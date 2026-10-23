import { recipeNotesCloud } from '../services/recipeNotesCloud';
import { RecipeNotes } from '../utils/recipeNotes';

/** Typing pauses this long before a note goes to the account; one request per pause. */
export const NOTE_UPLOAD_DEBOUNCE_MS = 1000;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Sends a note to the account once typing has paused. `readNote` is called when the timer
 * fires, so the text sent is the latest, not the one from the keystroke that started it.
 */
export function queueNoteUpload(recipeId: string, readNote: () => string | null): void {
  const pending = timers.get(recipeId);
  if (pending) clearTimeout(pending);
  timers.set(
    recipeId,
    setTimeout(() => {
      timers.delete(recipeId);
      const text = readNote();
      if (text !== null) void recipeNotesCloud.save(recipeId, text);
    }, NOTE_UPLOAD_DEBOUNCE_MS)
  );
}

/** Drops uploads still waiting, e.g. when the account signs out of this phone. */
export function cancelNoteUploads(): void {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
}

/**
 * The account's notes merged into the phone's: a recipe noted only in the account appears
 * here; where both have one, the phone's stays, since it is the one just typed.
 */
export function mergeCloudNotes(local: RecipeNotes, cloud: RecipeNotes): RecipeNotes {
  return { ...cloud, ...local };
}
