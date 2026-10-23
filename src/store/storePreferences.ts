import { SUPERMARKETS } from '../data/supermarkets';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import {
  getAlternativeRecipes,
  isSupermarketCompatible,
  selectOptimalDessertForDay,
} from '../engine/plannerEngine';
import { storageService } from '../services/storage';
import {
  Allergen,
  Appliance,
  DayOfWeek,
  DietType,
  FoodTier,
  HealthGoalTag,
  MealPlan,
  MealSlot,
  MoodTag,
  SupermarketId,
  UserPreferences,
} from '../types';
import { areDietsCompatible, isBaseDiet, isModifierDiet } from '../utils/dietCompatibility';
import {
  collectMealsFromDays,
  getActiveExtraProductIds,
  getActiveExtraProducts,
  mergePurchased,
} from './cart';

import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { buildInfeasibleNotice, pickStoreCompatibleReplacement } from './planSafety';
import {
  applyPreferenceStep,
  applyPreferencesWithRebuild,
  recalculateCartForPreferences,
  rebuildKeepingUndo,
  rejectIfInfeasible,
} from './storeTransforms';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

const EXTRA_SLOTS: readonly MealSlot[] = ['snack', 'dessert'];

/** True when the week already has exactly these main meals, with no per-day override. */
function hasBaseSlots(prefs: UserPreferences, baseSlots: MealSlot[]): boolean {
  if (prefs.dailyMealSlots) return false;
  const current = prefs.mealSlots.filter((slot) => !EXTRA_SLOTS.includes(slot));
  return current.length === baseSlots.length && baseSlots.every((slot) => current.includes(slot));
}

/** Preference setters: household, diet, allergies, kitchen, slots and tier. */
export function createPreferencesActions(set: SetState, _get: GetState) {
  return {
    setSupermarket: (id: SupermarketId) => {
      set((state) => {
        const nextPrefs = { ...state.preferences, supermarketId: id };
        void storageService.savePreferences(nextPrefs);

        if (state.currentPlan) {
          // Track recipe IDs used across the updated plan to avoid excessive duplication
          const usedRecipeIdsInWeek = new Set<string>();
          const strandedTitles: string[] = [];

          // Pre-populate with existing compatible meals
          state.currentPlan.days.forEach((day) => {
            day.meals.forEach((m) => {
              if (isSupermarketCompatible(m.recipe, id)) {
                usedRecipeIdsInWeek.add(m.recipe.id);
              }
            });
          });

          const updatedDays = state.currentPlan.days.map((day) => {
            const dayRecipeIds = new Set<string>();

            const updatedMeals = day.meals.map((m) => {
              let activeRecipe = m.recipe;

              // If recipe is NOT available at the newly selected supermarket, auto-swap it
              if (!isSupermarketCompatible(activeRecipe, id)) {
                if (m.slot === 'dessert') {
                  const optimalDessert = selectOptimalDessertForDay(
                    day.dayOfWeek,
                    state.currentPlan!,
                    nextPrefs
                  );
                  if (optimalDessert && isSupermarketCompatible(optimalDessert, id)) {
                    activeRecipe = optimalDessert;
                  }
                }

                if (!isSupermarketCompatible(activeRecipe, id)) {
                  const alternatives = getAlternativeRecipes(m.recipe, nextPrefs, m.slot);
                  const chosen = pickStoreCompatibleReplacement(
                    alternatives,
                    dayRecipeIds,
                    usedRecipeIdsInWeek
                  );
                  if (chosen) {
                    activeRecipe = chosen;
                  } else if (!strandedTitles.includes(activeRecipe.title)) {
                    // No legal substitute exists. Keep the dish rather than leave a gap, but
                    // the user has to know it is not stocked where they now shop.
                    strandedTitles.push(activeRecipe.title);
                  }
                }
              }

              dayRecipeIds.add(activeRecipe.id);
              usedRecipeIdsInWeek.add(activeRecipe.id);

              // Priced for the portions this meal actually books, not for the household size:
              // a doubled meal books four and was being charged for two. A reheated portion
              // costs nothing wherever you shop, because it is not in the cart at all.
              const cost = m.isLeftover
                ? 0
                : calculateRecipePortionCost(
                    activeRecipe,
                    m.servings,
                    id,
                    nextPrefs.excludePantryStaples
                  );

              return {
                ...m,
                recipe: activeRecipe,
                estimatedCostRon: cost,
              };
            });

            const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') ||
              updatedMeals[0] || {
                recipe: day.recipe,
                estimatedCostRon: day.estimatedCostRon,
              };
            const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

            return {
              ...day,
              recipe: primaryMeal.recipe,
              meals: updatedMeals,
              estimatedCostRon: Math.round(dayCostSum * 100) / 100,
            };
          });

          const allMealsToAggregate = collectMealsFromDays(updatedDays);

          const aggregated = aggregateGroceryList(
            allMealsToAggregate,
            id,
            nextPrefs.excludePantryStaples,
            getActiveExtraProductIds(nextPrefs),
            nextPrefs.pantryInventory || [],
            nextPrefs.pantryStock || {}
          );

          const cartItems = mergePurchased(state.groceryItems, aggregated.items);

          const updatedPlan: MealPlan = {
            ...state.currentPlan,
            supermarketId: id,
            totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
            totalCartCostRon: aggregated.totalCartCostRon,
            extraProducts: getActiveExtraProducts(nextPrefs),
            days: updatedDays,
          };

          void storageService.savePlanAndGrocery(updatedPlan, cartItems);

          return {
            preferences: nextPrefs,
            currentPlan: updatedPlan,
            groceryItems: cartItems,
            activeNotice:
              strandedTitles.length > 0
                ? {
                    id: Date.now().toString(),
                    title: 'Câteva rețete nu se găsesc aici',
                    message: `${SUPERMARKETS[id]?.name ?? 'Magazinul ales'} nu are ingredientele pentru: ${strandedTitles.slice(0, 3).join(', ')}${strandedTitles.length > 3 ? ' și altele' : ''}. Nu am găsit înlocuitori compatibili, așa că le-am păstrat în plan — le poți schimba manual.`,
                    type: 'warning',
                  }
                : state.activeNotice,
          };
        }

        return { preferences: nextPrefs };
      });
    },

    setPeopleCount: (count: number) => {
      set((state) => {
        if (count < 1) {
          const nextPrefs = { ...state.preferences, peopleCount: 1 };
          return {
            ...applyPreferenceStep(state, nextPrefs),
            activeNotice: {
              id: Date.now().toString(),
              title: 'Număr minim de persoane',
              message:
                'Planul alimentar necesită cel puțin o persoană pentru calibrarea ingredientelor și a bugetului.',
              type: 'info',
            },
          };
        }
        if (count > 10) {
          const nextPrefs = { ...state.preferences, peopleCount: 10 };
          return {
            ...applyPreferenceStep(state, nextPrefs),
            activeNotice: {
              id: Date.now().toString(),
              title: 'Număr maxim de persoane',
              message: 'Planul alimentar este calibrat pentru maximum 10 persoane per gospodărie.',
              type: 'info',
            },
          };
        }
        const nextPrefs = {
          ...state.preferences,
          peopleCount: count,
        };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    toggleCookingDay: (day: DayOfWeek) => {
      set((state) => {
        const current = state.preferences.cookingDays;
        const exists = current.includes(day);

        if (exists && current.length <= 1) {
          return {
            ...state,
            activeNotice: {
              id: Date.now().toString(),
              title: 'Cel puțin o zi de gătit',
              message:
                'Trebuie să păstrezi cel puțin o zi activă în planul săptămânal pentru a putea genera rețete.',
              type: 'info',
            },
          };
        }

        const daysOrder: DayOfWeek[] = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];

        const updated = exists ? current.filter((d) => d !== day) : [...current, day];
        const sorted = daysOrder.filter((d) => updated.includes(d));

        const nextPrefs = { ...state.preferences, cookingDays: sorted };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    setCookingDays: (days: DayOfWeek[]) => {
      if (days.length === 0) return;
      set((state) => {
        const daysOrder: DayOfWeek[] = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];
        const sorted = daysOrder.filter((d) => days.includes(d));
        const nextPrefs = { ...state.preferences, cookingDays: sorted };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    setBudget: (budget: number) => {
      set((state) => {
        const nextPrefs = {
          ...state.preferences,
          budgetRon: Math.max(20, Math.round(budget)),
        };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      });
    },

    toggleMoodTag: (tag: MoodTag) => {
      set((state) => {
        const current = state.preferences.moodTags;
        const exists = current.includes(tag);

        if (exists) {
          if (current.length <= 1) {
            return {
              ...state,
              activeNotice: {
                id: Date.now().toString(),
                title: 'Cel puțin o poftă',
                message:
                  'Meniul săptămânal are nevoie de cel puțin un stil culinar selectat pentru sugestii adecvate.',
                type: 'info',
              },
            };
          }
          const nextMoods = current.filter((t) => t !== tag);
          let nextSlots = state.preferences.mealSlots;
          if (tag === 'sweet_treat') {
            nextSlots = nextSlots.filter((s) => s !== 'dessert');
            if (nextSlots.length === 0) nextSlots = ['dinner'];
          }
          const nextPrefs = {
            ...state.preferences,
            moodTags: nextMoods,
            mealSlots: nextSlots,
          };
          void storageService.savePreferences(nextPrefs);
          return { preferences: nextPrefs };
        }

        const nextMoods = [...current, tag];
        let nextSlots = state.preferences.mealSlots;
        if (tag === 'sweet_treat' && !nextSlots.includes('dessert')) {
          nextSlots = [...nextSlots, 'dessert'];
        }
        const nextPrefs = { ...state.preferences, moodTags: nextMoods, mealSlots: nextSlots };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      });
    },

    setMoodTags: (tags: MoodTag[]) => {
      set((state) => {
        const hadSweetTreat = state.preferences.moodTags.includes('sweet_treat');
        const hasSweetTreat = tags.includes('sweet_treat');
        let nextSlots = state.preferences.mealSlots;
        if (!hadSweetTreat && hasSweetTreat && !nextSlots.includes('dessert')) {
          nextSlots = [...nextSlots, 'dessert'];
        } else if (hadSweetTreat && !hasSweetTreat) {
          nextSlots = nextSlots.filter((s) => s !== 'dessert');
          if (nextSlots.length === 0) nextSlots = ['dinner'];
        }

        const nextPrefs = {
          ...state.preferences,
          moodTags: tags.length > 0 ? tags : (['healthy_comfort'] as MoodTag[]),
          mealSlots: nextSlots,
        };
        void storageService.savePreferences(nextPrefs);
        // A plan needs at least one craving; say so instead of swapping one in silently.
        return tags.length > 0
          ? { preferences: nextPrefs }
          : {
              preferences: nextPrefs,
              activeNotice: {
                id: Date.now().toString(),
                title: 'Am păstrat o poftă',
                message:
                  'Meniul are nevoie de cel puțin o poftă, așa că am lăsat „Comfort food”. O poți schimba oricând.',
                type: 'info' as const,
              },
            };
      });
    },

    toggleDietType: (diet: DietType) => {
      set((state) => {
        const current =
          state.preferences.dietTypes && state.preferences.dietTypes.length > 0
            ? state.preferences.dietTypes
            : [state.preferences.dietType];

        // CASE 1: The user selected a BASE DIET (omnivore, vegetarian, vegan, pescatarian)
        if (isBaseDiet(diet)) {
          // If already selected as the only base diet, keep it
          if (current[0] === diet && current.length === 1) {
            return state;
          }

          // Keep existing modifiers that are compatible with the new base diet
          const existingModifiers = current.filter(isModifierDiet);
          const compatibleModifiers = existingModifiers.filter((m) => areDietsCompatible(diet, m));

          const nextDiets: DietType[] = [diet, ...compatibleModifiers];
          const nextPrefs: UserPreferences = {
            ...state.preferences,
            dietType: diet,
            dietTypes: nextDiets,
          };
          return applyPreferenceStep(state, nextPrefs);
        }

        // CASE 2: The user selected a MODIFIER DIET (gluten_free, keto)
        if (current.includes(diet)) {
          // Deselecting modifier: remove it cleanly
          const nextDiets = current.filter((d) => d !== diet);
          const primaryDiet = nextDiets.find(isBaseDiet) || 'omnivore';
          const nextPrefs: UserPreferences = {
            ...state.preferences,
            dietType: primaryDiet,
            dietTypes: nextDiets,
          };
          return applyPreferenceStep(state, nextPrefs);
        }

        // Adding modifier: check compatibility with the active base diet
        const baseDiet = current.find(isBaseDiet) || 'omnivore';
        if (!areDietsCompatible(baseDiet, diet)) {
          return {
            ...state,
            activeNotice: {
              id: Date.now().toString(),
              title: 'Dietă incompatibilă',
              message: `Opțiunea ${diet === 'keto' ? 'Low-Carb / Keto' : 'Fără Gluten'} nu este compatibilă cu alimentația ${baseDiet === 'vegan' ? 'Vegană' : baseDiet}.`,
              type: 'warning',
            },
          };
        }

        // Check max limits (1 base diet + up to 2 modifiers)
        const modifiers = current.filter(isModifierDiet);
        if (modifiers.length >= 2) {
          return {
            ...state,
            activeNotice: {
              id: Date.now().toString(),
              title: 'Limită restricții speciale',
              message: 'Poți combina maximum 2 restricții speciale simultan.',
              type: 'warning',
            },
          };
        }

        const nextDiets: DietType[] = [...current, diet];
        const nextPrefs: UserPreferences = {
          ...state.preferences,
          dietType: baseDiet,
          dietTypes: nextDiets,
        };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    togglePantryItem: (ingredientId: string) => {
      set((state) => {
        const current = state.preferences.pantryInventory || [];
        const updated = current.includes(ingredientId)
          ? current.filter((id) => id !== ingredientId)
          : [...current, ingredientId];

        return recalculateCartForPreferences(state, {
          ...state.preferences,
          pantryInventory: updated,
        });
      });
    },

    toggleAvoidedAllergen: (allergen: Allergen) => {
      set((state) => {
        const current = state.preferences.avoidedAllergens || [];
        const next = current.includes(allergen)
          ? current.filter((a) => a !== allergen)
          : [...current, allergen];

        const nextPrefs: UserPreferences = { ...state.preferences, avoidedAllergens: next };

        // Adding an allergy can empty the catalog; refuse rather than store a dead end.
        const rejection = current.includes(allergen) ? null : rejectIfInfeasible(nextPrefs);
        if (rejection) return rejection;

        return applyPreferencesWithRebuild(state, nextPrefs);
      });
    },

    toggleHealthGoalTag: (tag: HealthGoalTag) => {
      set((state) => {
        const current = state.preferences.healthGoalTags || [];
        const updated = current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag];
        const nextPrefs: UserPreferences = {
          ...state.preferences,
          healthGoalTags: updated,
        };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    setHealthGoalTags: (tags: HealthGoalTag[]) => {
      set((state) => {
        const nextPrefs: UserPreferences = {
          ...state.preferences,
          healthGoalTags: tags,
        };
        return applyPreferenceStep(state, nextPrefs);
      });
    },

    setSnackTastePreference: (preference: 'sweet' | 'savory' | 'both') => {
      set((state) => {
        const nextPrefs: UserPreferences = {
          ...state.preferences,
          snackTastePreference: preference,
        };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      });
    },

    setPantryInventory: (items: string[]) => {
      set((state) =>
        recalculateCartForPreferences(state, { ...state.preferences, pantryInventory: items })
      );
    },

    toggleAppliance: (appliance: Appliance) => {
      set((state) => {
        const current = state.preferences.appliances;
        const exists = current.includes(appliance);

        if (exists && current.length <= 1) {
          return {
            activeNotice: buildInfeasibleNotice(
              'Păstrează cel puțin un aparat de bucătărie — fără niciunul nu se pot propune rețete.'
            ),
          };
        }

        const updated = exists ? current.filter((a) => a !== appliance) : [...current, appliance];

        const nextPrefs = { ...state.preferences, appliances: updated };

        // Removing an appliance can empty the catalog; refuse instead of storing a dead end.
        const rejection = exists ? rejectIfInfeasible(nextPrefs) : null;
        if (rejection) return rejection;

        return applyPreferenceStep(state, nextPrefs);
      });
    },

    setMealSlots: (slots: MealSlot[]) => {
      const CANONICAL_ORDER: Record<string, number> = {
        breakfast: 1,
        lunch: 2,
        dinner: 3,
        snack: 4,
        dessert: 5,
      };
      const rawSlots: MealSlot[] = slots.length > 0 ? slots : ['dinner'];
      const safeSlots = [...rawSlots].sort(
        (a, b) => (CANONICAL_ORDER[a] ?? 99) - (CANONICAL_ORDER[b] ?? 99)
      );
      set((state) => {
        const nextPrefs = { ...state.preferences, mealSlots: safeSlots };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      });
    },

    setMealsPerDayCount: (count: 1 | 2 | 3) => {
      let baseSlots: MealSlot[] = ['dinner'];
      if (count === 2) {
        baseSlots = ['lunch', 'dinner'];
      } else if (count === 3) {
        baseSlots = ['breakfast', 'lunch', 'dinner'];
      }

      set((state) => {
        // Pressing the active count again used to regenerate the week and lose manual swaps.
        if (hasBaseSlots(state.preferences, baseSlots)) return state;
        // Preserve existing snack or dessert toggles if any
        const activeExtras = state.preferences.mealSlots.filter(
          (s) => s === 'snack' || s === 'dessert'
        );
        const combinedSlots: MealSlot[] = [...baseSlots, ...activeExtras];

        const nextPrefs = {
          ...state.preferences,
          mealSlots: combinedSlots,
          dailyMealSlots: undefined,
        };
        return rebuildKeepingUndo(state, nextPrefs);
      });
    },

    setDailyMealSlots: (dailySlots: Partial<Record<DayOfWeek, MealSlot[]>>, _count?: 1 | 2 | 3) => {
      set((state) => {
        const allSlotsUsed = new Set<MealSlot>();
        Object.values(dailySlots).forEach((slots) => {
          slots?.forEach((s) => allSlotsUsed.add(s));
        });
        const activeExtras = state.preferences.mealSlots.filter(
          (s) => s === 'snack' || s === 'dessert'
        );
        activeExtras.forEach((s) => allSlotsUsed.add(s));

        const CANONICAL_ORDER: Record<string, number> = {
          breakfast: 1,
          lunch: 2,
          dinner: 3,
          snack: 4,
          dessert: 5,
        };
        const combinedSlots: MealSlot[] = Array.from(allSlotsUsed).sort(
          (a, b) => (CANONICAL_ORDER[a] ?? 99) - (CANONICAL_ORDER[b] ?? 99)
        );

        const nextPrefs: UserPreferences = {
          ...state.preferences,
          dailyMealSlots: dailySlots,
          mealSlots: combinedSlots.length > 0 ? combinedSlots : ['dinner'],
        };
        return rebuildKeepingUndo(state, nextPrefs);
      });
    },

    setFoodTier: (tier: FoodTier) => {
      set((state) => {
        const nextPrefs = { ...state.preferences, foodTier: tier };
        return rebuildKeepingUndo(state, nextPrefs);
      });
    },
  } satisfies Partial<AppState>;
}
