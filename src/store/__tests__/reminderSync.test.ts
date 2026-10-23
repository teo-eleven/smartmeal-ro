import { useAppStore } from '../useAppStore';
import { startReminderSync, RESCHEDULE_DEBOUNCE_MS } from '../reminderSync';
import { reminderScheduler } from '../../services/reminderScheduler';
import { asSubscriber } from '../../__tests__/helpers/subscriber';
import { DEFAULT_REMINDERS } from '../../types';

jest.mock('../../services/reminderScheduler', () => ({
  reminderScheduler: {
    reschedule: jest.fn(async () => 1),
    cancelAll: jest.fn(async () => undefined),
  },
}));

/**
 * The 2026-10-21 audit (F7): reminders were rescheduled only when a setting changed, so a new
 * plan kept naming last week's dishes, and nothing ran after a restart; two quick changes
 * could also run two reschedules at once and leave duplicates.
 */
const reschedule = reminderScheduler.reschedule as jest.Mock;
const store = () => useAppStore.getState();
let stop: () => void = () => undefined;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  asSubscriber();
  useAppStore.setState({ reminders: { ...DEFAULT_REMINDERS, cookingEnabled: true } });
  store().quickStart();
});

afterEach(() => {
  stop();
  jest.useRealTimers();
});

test('la pornire programează o dată, cu planul curent', async () => {
  stop = startReminderSync();

  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);

  expect(reschedule).toHaveBeenCalledTimes(1);
  expect(reschedule).toHaveBeenCalledWith(store().reminders, store().currentPlan);
});

test('un plan nou reprogramează, cu felurile noi', async () => {
  stop = startReminderSync();
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);
  reschedule.mockClear();

  store().generatePlan();
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);

  expect(reschedule).toHaveBeenCalledTimes(1);
  expect(reschedule.mock.calls[0][1]).toBe(store().currentPlan);
});

test('multe schimbări rapide dau o singură reprogramare, cu starea finală', async () => {
  stop = startReminderSync();
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);
  reschedule.mockClear();

  store().updateReminders({ cookingTime: '18:00' });
  store().updateReminders({ cookingTime: '18:30' });
  store().updateReminders({ cookingTime: '19:00' });
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);

  expect(reschedule).toHaveBeenCalledTimes(1);
  expect(reschedule.mock.calls[0][0].cookingTime).toBe('19:00');
});

test('o reprogramare nu începe până nu s-a terminat cea dinainte', async () => {
  let finishFirst: () => void = () => undefined;
  reschedule.mockImplementationOnce(
    () => new Promise<number>((resolve) => (finishFirst = () => resolve(1)))
  );
  stop = startReminderSync();
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);

  store().updateReminders({ cookingTime: '20:00' });
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);
  expect(reschedule).toHaveBeenCalledTimes(1);

  finishFirst();
  await jest.advanceTimersByTimeAsync(0);
  expect(reschedule).toHaveBeenCalledTimes(2);
});

test('o schimbare care nu atinge planul sau mementourile nu reprogramează', async () => {
  stop = startReminderSync();
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);
  reschedule.mockClear();

  useAppStore.setState({ activeNotice: null, openWindowCount: 1 });
  await jest.advanceTimersByTimeAsync(RESCHEDULE_DEBOUNCE_MS);

  expect(reschedule).not.toHaveBeenCalled();
});
