import { getEligibleRecipes } from '../plannerEngine';
import { useAppStore } from '../../store/useAppStore';
import { DietType, DayOfWeek, MealSlot, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DIETS: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'keto'];
const MAIN_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

const prefs = (diet: DietType): UserPreferences => ({
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: diet,
  dietTypes: [diet],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  pantryStock: {},
  avoidedAllergens: [],
  mealSlots: MAIN_SLOTS,
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
});

function planFor(diet: DietType, reshuffles: number) {
  useAppStore.setState({
    preferences: prefs(diet),
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
  for (let i = 0; i < reshuffles; i++) useAppStore.getState().reshufflePlan();
  return useAppStore.getState().currentPlan!;
}

/**
 * The variety rules were always right -- never repeat while an unused dish is available --
 * but a rule cannot invent food. Under a narrow diet the catalog held fewer dishes than the
 * week had meals, so a repeat was arithmetic, not a bug in the planner. These tests pin the
 * catalog at a size where the rules can actually be honoured.
 */
describe('catalogul e destul de mare cât să nu se repete nimic', () => {
  test.each(DIETS)('%s: fiecare slot are cel puțin 7 rețete pentru 7 zile', (diet) => {
    const eligible = getEligibleRecipes(prefs(diet));

    ([...MAIN_SLOTS, 'dessert'] as MealSlot[]).forEach((slot) => {
      const forSlot = eligible.filter((r) => !r.suitableSlots || r.suitableSlots.includes(slot));
      expect({ slot, count: forSlot.length }).toEqual({ slot, count: expect.any(Number) });
      expect(forSlot.length).toBeGreaterThanOrEqual(7);
    });
  });
});

describe('planurile generate nu repetă nimic', () => {
  test.each(DIETS)('%s: niciun fel nu apare de două ori în aceeași zi', (diet) => {
    for (let round = 0; round < 6; round++) {
      const plan = planFor(diet, round);
      plan.days.forEach((day) => {
        const ids = day.meals.map((m) => m.recipe.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
    }
  });

  test.each(DIETS)('%s: niciun fel nu apare în două zile la rând', (diet) => {
    for (let round = 0; round < 6; round++) {
      const plan = planFor(diet, round);
      for (let i = 0; i < plan.days.length - 1; i++) {
        const today = new Set(plan.days[i].meals.map((m) => m.recipe.id));
        const tomorrow = plan.days[i + 1].meals.map((m) => m.recipe.id);
        expect(tomorrow.filter((id) => today.has(id))).toEqual([]);
      }
    }
  });

  test.each(DIETS)('%s: niciun fel nu apare de două ori în toată săptămâna', (diet) => {
    for (let round = 0; round < 6; round++) {
      const plan = planFor(diet, round);
      const all = plan.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
      expect(new Set(all).size).toBe(all.length);
    }
  });
});
