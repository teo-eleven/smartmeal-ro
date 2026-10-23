import { UserPreferences } from '../types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  budgetRon: 150,
  moodTags: ['speedy', 'family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

/** One portion is the floor; beyond a dozen the pack-size maths stops being meaningful. */
/** Keeps the archive from growing without bound in local storage. */
export const MAX_SAVED_PLANS = 20;

/**
 * Date.now() alone collides when two plans are saved inside the same millisecond, and two
 * entries sharing an id means deleting one deletes both. The counter makes ids unique.
 */
let savedPlanCounter = 0;
export function nextSavedPlanId(): string {
  savedPlanCounter += 1;
  return `saved-${Date.now()}-${savedPlanCounter}`;
}
export const MIN_MEAL_SERVINGS = 1;
export const MAX_MEAL_SERVINGS = 12;

/** Minimum time the reload overlay stays up, so it reads as feedback rather than a flicker. */
export const DEFAULT_RELOAD_MS = 650;
