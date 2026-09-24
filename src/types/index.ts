/**
 * Core Domain Types for SmartMeal RO
 */

export type SupermarketId =
  'lidl' | 'kaufland' | 'carrefour' | 'mega_image' | 'auchan' | 'penny' | 'profi' | 'sezamo';

export type AisleCategory =
  | 'produce' // Legume și fructe
  | 'meat_fish' // Carne și pește
  | 'dairy' // Lactate și ouă
  | 'pantry' // Cămară, făină, orez, condimente
  | 'bakery' // Pâine și panificație
  | 'canned_sauces' // Conserve și sosuri
  | 'frozen' // Congelate
  | 'snacks' // Ronțăieli & Dulciuri de magazin
  | 'beverages' // Băuturi Răcoritoare (apă, suc, ceai)
  | 'alcohol'; // Băuturi Alcoolice (bere, vin, spumant)

export type Appliance = 'hob' | 'oven' | 'air_fryer' | 'microwave';

/** Declarable allergens the ingredient catalog can actually contain. */
export type Allergen =
  | 'gluten'
  | 'lactate'
  | 'oua'
  | 'peste'
  | 'crustacee'
  | 'nuci'
  | 'arahide'
  | 'soia'
  | 'susan'
  | 'mustar';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'gluten_free' | 'keto';

export type MoodTag =
  | 'speedy' // Mese rapide (<25 min)
  | 'low_calorie' // Sub 550 kcal / porție
  | 'family_fav' // Favoritele familiei
  | 'healthy_comfort' // Mâncare caldă & nutritivă
  | 'fakeaway' // Stil restaurant / fast food acasă
  | 'high_protein' // Peste 35g proteine / porție
  | 'romanian_classic' // Tradiționale românești
  | 'soups_stews' // Ciorbe & Supe calde de casă
  | 'pasta_italian' // Paste & Italienești
  | 'grill_meat' // Grătar & Cărnuri fragede
  | 'spicy_fiesta' // Condimentat, picant & Mexican
  | 'light_dinner' // Cină ușoară de seară (<400 kcal)
  | 'fresh_salad' // Salate crocante & Fresh Bowls
  | 'sweet_treat'; // Desert & Dulce de casă

export type DayOfWeek =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

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
  /**
   * Only ever a photograph of THIS dish. Left unset for recipes without one: the card then
   * renders from the recipe's own ingredients rather than a stock photo of something else.
   */
  imageUrl?: string;
  suitableSlots?: MealSlot[];
  tier?: FoodTier;
  availableSupermarkets?: SupermarketId[];
  storeSignature?: SupermarketId;
  storeBadgeLabel?: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type FoodTier = 'basic' | 'medium' | 'premium';

export type RetailProductCategory =
  'snack_savory' | 'snack_sweet' | 'drink_soft' | 'drink_alcoholic';

export interface RetailProduct {
  id: string;
  name: string;
  brand: string;
  category: RetailProductCategory;
  categoryLabelRo: string;
  packageSize: string; // ex: "140g", "2L", "bax 6x2L", "doză 500ml", "750ml"
  icon: string;
  typicalPriceRon: Record<SupermarketId, number>;
  isAlcoholic?: boolean;
}

export interface PlannedMeal {
  id: string;
  slot: MealSlot;
  slotLabelRo: string;
  recipe: Recipe;
  servings: number;
  estimatedCostRon: number;
}

export interface UserPreferences {
  supermarketId: SupermarketId;
  peopleCount: number;
  cookingDays: DayOfWeek[];
  budgetRon: number;
  moodTags: MoodTag[];
  dietType: DietType;
  dietTypes?: DietType[]; // up to 2 compatible diets
  appliances: Appliance[];
  excludePantryStaples: boolean;
  /** Ingredients the user says they have plenty of; treated as fully covering any need. */
  pantryInventory?: string[];
  /**
   * Amounts already at home, in each ingredient's own unit. Filled by carrying the surplus
   * of a finished week forward, so a 1 kg bag bought for 270 g is not bought again.
   */
  pantryStock?: Record<string, number>;
  /**
   * Dishes the user rejected. A hard filter like diet and allergens, because "never again"
   * has to mean it — which is why rejecting one is refused when it would empty the catalog.
   */
  dislikedRecipeIds?: string[];
  /** Dishes the user liked. A strong preference in the scoring, never a licence to break a rule. */
  favouriteRecipeIds?: string[];
  /** Allergens to exclude entirely. Treated as a hard constraint, never relaxed. */
  avoidedAllergens?: Allergen[];
  mealSlots: MealSlot[];
  foodTier?: FoodTier;
  selectedSnackIds?: string[];
  selectedDrinkIds?: string[];
  includeAlcohol?: boolean;
}

export interface MealPlanDay {
  dayOfWeek: DayOfWeek;
  meals: PlannedMeal[];
  recipe: Recipe;
  servings: number;
  estimatedCostRon: number;
}

export interface BudgetStatus {
  isWithinBudget: boolean;
  /** Cheapest cart the planner could reach without breaking diet, appliance or slot rules. */
  minimumAchievableRon: number;
  /** How many meals were downgraded to fit the budget. 0 means the budget was never binding. */
  swapsApplied: number;
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
  extraProducts?: RetailProduct[];
  budgetStatus?: BudgetStatus;
}

/** A plan the user chose to keep, with the answers it was generated from. */
export interface SavedPlan {
  id: string;
  name: string;
  savedAt: string;
  plan: MealPlan;
  preferences: UserPreferences;
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
  isFromPantry?: boolean; // Ingredient already available at home
  /** How much of the need was covered by what is already at home. */
  fromStockAmount?: number;
  /** What will still be in the cupboard once this week is cooked. */
  leftoverAmount?: number;
}

export interface MealPrepPhase {
  phaseNumber: number;
  title: string;
  durationMinutes: number;
  icon: string;
  description: string;
  tasks: { id: string; instruction: string; completed?: boolean }[];
}

export interface WeeklyMacroSummaryData {
  averageDailyCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  balanceScore: number; // 0-100
  balanceRating: string;
}
