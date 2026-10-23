import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

/**
 * S5, S6 and S7 from the 2026-10-21 audit: edits that reached the wrong meal or forgot what
 * they replaced.
 */

const store = () => useAppStore.getState();
const dayOf = (dayOfWeek: string) =>
  store().currentPlan!.days.find((d) => d.dayOfWeek === dayOfWeek)!;

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

/** Cooks the first day's dinner twice, so the next day holds a leftover in the dinner slot. */
function cookDoubleFirstDinner() {
  const [today, tomorrow] = store().currentPlan!.days;
  const dinner = today.meals.find((m) => m.slot === 'dinner') ?? today.meals[0];
  const replacedTomorrow = tomorrow.meals.find((m) => m.slot === dinner.slot);
  store().cookDoubleFor(today.dayOfWeek, dinner.id);
  return { today, tomorrow, dinner, replacedTomorrow };
}

describe('„în oraș” atinge doar masa aleasă (S7)', () => {
  test('cu ID-ul mesei, nu se comută și restul din același slot', () => {
    const { tomorrow, dinner } = cookDoubleFirstDinner();
    const leftover = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.isLeftover);
    expect(leftover).toBeDefined();
    store().addExtraMealToDay(tomorrow.dayOfWeek, 'dessert');
    const dessert = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.slot === 'dessert')!;

    store().toggleEatOut(tomorrow.dayOfWeek, dessert.slot, dessert.id);

    const after = dayOf(tomorrow.dayOfWeek);
    expect(after.meals.find((m) => m.id === dessert.id)!.isEatenOut).toBe(true);
    expect(after.meals.find((m) => m.id === leftover!.id)!.isEatenOut).toBeFalsy();
    expect(dinner).toBeDefined();
  });

  test('doar cu slotul, se comută masa gătită din slot, nu restul', () => {
    const { tomorrow, dinner } = cookDoubleFirstDinner();

    store().toggleEatOut(tomorrow.dayOfWeek, dinner.slot);

    const leftovers = dayOf(tomorrow.dayOfWeek).meals.filter((m) => m.isLeftover);
    leftovers.forEach((m) => expect(m.isEatenOut).toBeFalsy());
  });
});

describe('„anulează gătit dublu” readuce masa înlocuită (S5)', () => {
  test('ziua următoare primește înapoi rețeta pe care o avea', () => {
    const { tomorrow, dinner, replacedTomorrow } = cookDoubleFirstDinner();
    expect(replacedTomorrow).toBeDefined();
    const leftover = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.isLeftover)!;

    store().undoCookDouble(tomorrow.dayOfWeek, leftover.id);

    const restored = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.slot === dinner.slot)!;
    expect(restored.isLeftover).toBeFalsy();
    expect(restored.recipe.id).toBe(replacedTomorrow!.recipe.id);
  });
});

describe('porțiile unui rest nu umflă costul zilei (S6)', () => {
  test('schimbarea porțiilor la un rest îl lasă la cost 0', () => {
    const { tomorrow } = cookDoubleFirstDinner();
    const leftover = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.isLeftover)!;

    store().setMealServings(tomorrow.dayOfWeek, leftover.id, leftover.servings + 2);

    const after = dayOf(tomorrow.dayOfWeek).meals.find((m) => m.id === leftover.id)!;
    expect(after.estimatedCostRon).toBe(0);
  });

  test('schimbarea porțiilor la o masă „în oraș” o lasă la cost 0', () => {
    const day = store().currentPlan!.days[2];
    const meal = day.meals[0];
    store().toggleEatOut(day.dayOfWeek, meal.slot, meal.id);

    store().setMealServings(day.dayOfWeek, meal.id, meal.servings + 2);

    expect(dayOf(day.dayOfWeek).meals.find((m) => m.id === meal.id)!.estimatedCostRon).toBe(0);
  });
});
