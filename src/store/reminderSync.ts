import { reminderScheduler } from '../services/reminderScheduler';
import { useAppStore } from './useAppStore';

/** Long enough to fold a burst of edits into one reschedule, short enough to feel instant. */
export const RESCHEDULE_DEBOUNCE_MS = 500;

/**
 * Keeps the phone's reminders in step with the plan and the reminder settings.
 *
 * The 2026-10-21 audit (F7): reminders were rescheduled only when a setting changed, so a new
 * plan kept naming last week's dishes and nothing ran after a restart; two quick changes could
 * also run two reschedules at once and leave duplicates. This one watcher reschedules after
 * hydration and on any change to either, debounced and strictly one after another.
 *
 * Returns the function that stops it.
 */
export function startReminderSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const run = () => {
    timer = null;
    // Read when it runs, not when it was asked: the latest plan and settings win.
    queue = queue
      .then(() => {
        const { reminders, currentPlan } = useAppStore.getState();
        return reminderScheduler.reschedule(reminders, currentPlan);
      })
      .catch((e) => console.warn('[reminderSync] Could not reschedule the reminders:', e));
  };

  const request = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, RESCHEDULE_DEBOUNCE_MS);
  };

  const unsubscribe = useAppStore.subscribe((state, previous) => {
    if (state.currentPlan !== previous.currentPlan || state.reminders !== previous.reminders) {
      request();
    }
  });
  request();

  return () => {
    unsubscribe();
    if (timer) clearTimeout(timer);
  };
}
