import {
  checkPlanFeasibility as engineCheckPlanFeasibility,
  generateMealPlan as engineGenerateMealPlan,
  getAlternativeRecipes as engineGetAlternativeRecipes,
  getEligibleDessertRecipes as engineGetEligibleDessertRecipes,
  getEligibleRecipes as engineGetEligibleRecipes,
  selectOptimalDessertForDay as engineSelectOptimalDessertForDay,
} from '../engine/plannerEngine';
import { GenerateMealPlanOptions } from '../engine/plannerConstants';
import { DayOfWeek, MealPlan, MealSlot, Recipe, UserPreferences } from '../types';
import { HealthSafetyAnswer, effectivePreferences } from '../utils/healthSafety';
import { useHealthSafetyStore } from './healthSafetyStore';

/**
 * The planner as the store may call it (A.7e-2). The engine stays pure; this is the boundary
 * where the health safety answer decides which preferences it sees: health goals reach it only
 * after a "no". The answer is read at call time, so a call can never use a stale one.
 */
export const currentSafetyAnswer = (): HealthSafetyAnswer => useHealthSafetyStore.getState().answer;

const seenByPlanner = (preferences: UserPreferences): UserPreferences =>
  effectivePreferences(preferences, currentSafetyAnswer());

export const generateMealPlan = (
  preferences: UserPreferences,
  options?: GenerateMealPlanOptions
): MealPlan => engineGenerateMealPlan(seenByPlanner(preferences), options);

export const checkPlanFeasibility = (preferences: UserPreferences) =>
  engineCheckPlanFeasibility(seenByPlanner(preferences));

export const getEligibleRecipes = (preferences: UserPreferences): Recipe[] =>
  engineGetEligibleRecipes(seenByPlanner(preferences));

export const getEligibleDessertRecipes = (preferences: UserPreferences): Recipe[] =>
  engineGetEligibleDessertRecipes(seenByPlanner(preferences));

export const getAlternativeRecipes = (
  current: Recipe,
  preferences: UserPreferences,
  slot?: MealSlot
): Recipe[] => engineGetAlternativeRecipes(current, seenByPlanner(preferences), slot);

export const selectOptimalDessertForDay = (
  dayOfWeek: DayOfWeek,
  plan: MealPlan,
  preferences: UserPreferences
): Recipe | null => engineSelectOptimalDessertForDay(dayOfWeek, plan, seenByPlanner(preferences));
