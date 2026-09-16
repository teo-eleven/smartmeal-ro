/**
 * Core Domain Types for SmartMeal RO
 */

export type SupermarketId = 'lidl' | 'kaufland' | 'carrefour' | 'mega_image';

export type AisleCategory =
  | 'produce' // Legume și fructe
  | 'meat_fish' // Carne și pește
  | 'dairy' // Lactate și ouă
  | 'pantry' // Cămară, făină, orez, condimente
  | 'bakery' // Pâine și panificație
  | 'canned_sauces' // Conserve și sosuri
  | 'frozen'; // Congelate

export type Appliance = 'hob' | 'oven' | 'air_fryer' | 'microwave';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';

export type MoodTag =
  | 'speedy' // Mese rapide (<25 min)
  | 'low_calorie' // Sub 550 kcal / porție
  | 'family_fav' // Favoritele familiei
  | 'healthy_comfort' // Mâncare caldă & nutritivă
  | 'fakeaway' // Stil restaurant / fast food acasă
  | 'high_protein' // Peste 35g proteine / porție
  | 'romanian_classic'; // Tradiționale românești

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type MeasurementUnit = 'g' | 'ml' | 'buc' | 'lingura' | 'lingurita' | 'legatura';

export interface Supermarket {
  id: SupermarketId;
  name: string;
  tagline: string;
  brandColor: string;
  accentColor: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: AisleCategory;
  isPantryStaple: boolean;
  standardPackSize: number;
  unit: MeasurementUnit;
  typicalPriceRon: Record<SupermarketId, number>;
}

export interface RecipeIngredient {
  ingredientId: string;
  amountPerServing: number;
  unit: MeasurementUnit;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface RecipeNutrition {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  dietType: DietType;
  appliances: Appliance[];
  moodTags: MoodTag[];
  nutritionPerServing: RecipeNutrition;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  imageUrl?: string;
}

export interface UserPreferences {
  supermarketId: SupermarketId;
  peopleCount: number;
  cookingDays: DayOfWeek[];
  budgetRon: number;
  moodTags: MoodTag[];
  dietType: DietType;
  appliances: Appliance[];
  excludePantryStaples: boolean;
}

export interface MealPlanDay {
  dayOfWeek: DayOfWeek;
  recipe: Recipe;
  servings: number;
  estimatedCostRon: number;
}

export interface MealPlan {
  id: string;
  createdAt: string;
  supermarketId: SupermarketId;
  peopleCount: number;
  totalBudgetRon: number;
  totalRecipeCostRon: number;
  totalCartCostRon: number;
  days: MealPlanDay[];
}

export interface GroceryListItem {
  ingredientId: string;
  name: string;
  category: AisleCategory;
  isPantryStaple: boolean;
  neededAmount: number;
  unit: MeasurementUnit;
  packsToBuy: number;
  packSize: number;
  estimatedPriceRon: number;
  isPurchased: boolean;
}
