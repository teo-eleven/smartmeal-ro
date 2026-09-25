import * as Notifications from 'expo-notifications';
import { DEFAULT_REMINDERS, MealPlan, ReminderSettings } from '../types';

/**
 * Turns reminder settings into notifications the phone will fire on its own.
 *
 * Scheduled locally rather than pushed from a server: a phone knows what time it is with no
 * signal, and a cooking reminder that needs a connection fails on exactly the evening it
 * matters. Nothing here talks to the network.
 *
 * Every reschedule cancels what this app scheduled before. Notifications survive restarts
 * and reinstall-less updates, so adding without cancelling is how a user ends up with four
 * copies of the same nudge.
 */

/** Marks the notifications this module owns, so cancelling never touches anyone else's. */
const OWNED = 'smartmeal-reminder';

const DAY_NAMES = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** `expo-notifications` numbers weekdays 1-7 from Sunday; ours are 0-6 from Monday. */
function toExpoWeekday(mondayBased: number): number {
  return ((mondayBased + 1) % 7) + 1;
}

export const reminderScheduler = {
  /**
   * Asks for permission, once. Returns false when the user declines, which is a normal
   * answer and not an error: the app keeps working, it just stays quiet.
   */
  async ensurePermission(): Promise<boolean> {
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted) return true;
      if (!existing.canAskAgain) return false;

      const asked = await Notifications.requestPermissionsAsync();
      return asked.granted;
    } catch (e) {
      console.warn('[reminderScheduler] Could not read notification permission:', e);
      return false;
    }
  },

  /** Removes every reminder this app scheduled, leaving anything else alone. */
  async cancelAll(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((n) => n.content.data?.source === OWNED)
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );
    } catch (e) {
      console.warn('[reminderScheduler] Could not clear old reminders:', e);
    }
  },

  /**
   * Rebuilds the schedule from the settings and the current plan.
   *
   * The cooking reminder names the dish, because "gătești ceva la 17:30" is a worse reminder
   * than "azi: sarmale". It only fires on days the plan actually has a meal for.
   */
  async reschedule(
    settings: ReminderSettings = DEFAULT_REMINDERS,
    plan: MealPlan | null
  ): Promise<number> {
    await this.cancelAll();

    if (!settings.cookingEnabled && !settings.shoppingEnabled) return 0;
    if (!(await this.ensurePermission())) return 0;

    let scheduled = 0;

    if (settings.cookingEnabled && plan) {
      const at = parseTime(settings.cookingTime);
      if (at) {
        for (let index = 0; index < plan.days.length; index += 1) {
          const day = plan.days[index];
          const dinner = day.meals.find((m) => m.slot === 'dinner') ?? day.meals[0];
          if (!dinner) continue;

          const body = dinner.isLeftover
            ? `Azi doar reîncălzești: ${dinner.recipe.title}.`
            : `Azi gătești: ${dinner.recipe.title}. Îți ia ${
                dinner.recipe.prepTimeMinutes + dinner.recipe.cookTimeMinutes
              } de minute.`;

          try {
            await Notifications.scheduleNotificationAsync({
              content: { title: 'E timpul să pui masa', body, data: { source: OWNED } },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: toExpoWeekday(index % 7),
                hour: at.hour,
                minute: at.minute,
              },
            });
            scheduled += 1;
          } catch (e) {
            console.warn('[reminderScheduler] Could not schedule a cooking reminder:', e);
          }
        }
      }
    }

    if (settings.shoppingEnabled) {
      const at = parseTime(settings.shoppingTime);
      if (at) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Ziua de cumpărături',
              body: `E ${DAY_NAMES[settings.shoppingWeekday] ?? 'ziua'} — lista te așteaptă în aplicație.`,
              data: { source: OWNED },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: toExpoWeekday(settings.shoppingWeekday),
              hour: at.hour,
              minute: at.minute,
            },
          });
          scheduled += 1;
        } catch (e) {
          console.warn('[reminderScheduler] Could not schedule the shopping reminder:', e);
        }
      }
    }

    return scheduled;
  },
};
