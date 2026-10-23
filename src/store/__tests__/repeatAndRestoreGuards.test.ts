import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';
import { getRecipeAllergens } from '../../utils/allergenFilter';

/**
 * The 2026-10-21 audit: "3 Mese" pressed while already active regenerated the week and threw
 * away manual swaps, "Restaurează" replaced the current plan with no way back, and a double
 * tap on "Salvează" stored the same plan twice.
 */

const store = () => useAppStore.getState();

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

describe('„3 Mese” apăsat din nou', () => {
  test('nu regenerează meniul când are deja trei mese pe zi', () => {
    store().setMealsPerDayCount(3);
    const planBefore = store().currentPlan;

    store().setMealsPerDayCount(3);

    expect(store().currentPlan).toBe(planBefore);
  });

  test('schimbă meniul când numărul de mese chiar se schimbă', () => {
    const planBefore = store().currentPlan;

    store().setMealsPerDayCount(3);

    expect(store().currentPlan).not.toBe(planBefore);
    expect(store().preferences.mealSlots).toEqual(
      expect.arrayContaining(['breakfast', 'lunch', 'dinner'])
    );
  });
});

describe('„Restaurează” se poate anula', () => {
  test('planul înlocuit rămâne disponibil pentru Undo', () => {
    store().saveCurrentPlan('Săptămâna 1');
    const savedId = store().savedPlans[0].id;
    store().generatePlan();
    const planBefore = store().currentPlan;

    store().restoreSavedPlan(savedId);

    expect(store().lastDiscardedPlan?.plan).toBe(planBefore);
  });

  test('Undo după restaurare aduce înapoi planul de dinainte', () => {
    store().saveCurrentPlan('Săptămâna 1');
    const savedId = store().savedPlans[0].id;
    store().generatePlan();
    const planBefore = store().currentPlan;

    store().restoreSavedPlan(savedId);
    store().undoReset();

    expect(store().currentPlan).toBe(planBefore);
  });
});

describe('„Salvează” apăsat de două ori', () => {
  test('același plan nu se salvează de două ori', () => {
    const countBefore = store().savedPlans.length;

    store().saveCurrentPlan('A');
    store().saveCurrentPlan('A');

    expect(store().savedPlans).toHaveLength(countBefore + 1);
  });
});

describe('refacerea meniului la schimbarea numărului de mese se poate anula', () => {
  test('meniul de dinainte, cu modificările manuale, rămâne disponibil pentru Undo', () => {
    const planBefore = store().currentPlan;

    store().setMealsPerDayCount(3);

    expect(store().lastDiscardedPlan).toMatchObject({ reason: 'rebuild', plan: planBefore });
  });

  test('Undo aduce înapoi și numărul de mese de dinainte', () => {
    const slotsBefore = store().preferences.mealSlots;

    store().setMealsPerDayCount(3);
    store().undoReset();

    expect(store().preferences.mealSlots).toEqual(slotsBefore);
  });

  test('schimbarea unei alergii nu oferă Undo, ca protecția să nu dispară pe nesimțite', () => {
    store().dismissUndo();

    store().toggleAvoidedAllergen('oua');

    expect(store().lastDiscardedPlan).toBeNull();
  });
});

/**
 * Review of stage 4b: an allergy added while an older menu was still held for Undo came
 * back out with it. Undo now keeps today's protections and re-checks the menu it restores.
 */
describe('Undo nu șterge o alergie adăugată între timp', () => {
  test('după refacere + alergie nouă, Undo păstrează alergia și nu aduce mese cu ea', () => {
    store().setMealsPerDayCount(3);
    store().toggleAvoidedAllergen('oua');

    store().undoReset();

    expect(store().preferences.avoidedAllergens).toContain('oua');
    const withEggs = store()
      .currentPlan!.days.flatMap((d) => d.meals)
      .filter((m) => getRecipeAllergens(m.recipe).includes('oua'));
    expect(withEggs.map((m) => m.recipe.id)).toEqual([]);
  });
});
