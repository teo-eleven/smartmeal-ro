import {
  Allergen,
  Appliance,
  DayOfWeek,
  DietType,
  FoodTier,
  GroceryListItem,
  HealthGoalTag,
  MealPlan,
  MealSlot,
  MoodTag,
  Recipe,
  ReminderSettings,
  SavedPlan,
  SupermarketId,
  UserPreferences,
} from '../types';

export type ActiveView = 'onboarding' | 'generating' | 'meals' | 'grocery';

/** Actions destructive enough to require an explicit yes before they run. */
export type ConfirmActionId = 'reset_onboarding' | 'apply_cloud_plan';

/** Everything needed to put a reset week back exactly as it was. */
export interface DiscardedPlan {
  plan: MealPlan;
  groceryItems: GroceryListItem[];
  preferences: UserPreferences;
}

export interface SystemNotice {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface AppState {
  // Navigation & Progress
  currentStep: number;
  maxVisitedStep: number;
  totalSteps: number;
  activeView: ActiveView;
  isHydrated: boolean;
  userEmail: string | null;
  /**
   * Whether the sign-in gate should be showing.
   *
   * `checking` until the stored session has been read, so the gate never flashes in front of
   * somebody who is already signed in. `guest` is a deliberate choice the user made, not an
   * absence of one -- the app works fully without an account. `locked` is a signed-in
   * account last verified more than thirty days ago (services/reauth.ts): the session is
   * still valid, but the app waits for Face ID, the password or an emailed code.
   */
  authStatus: 'checking' | 'signedIn' | 'guest' | 'locked';
  continueAsGuest: () => Promise<void>;
  /**
   * The only way out of `locked`: it opens the app if, and only if, the keychain holds a
   * verification inside the month (services/reauth.ts). Every sign-in service records one,
   * so a real sign-in unlocks and nothing else does.
   */
  unlock: () => Promise<void>;
  /** Locks a signed-in app that has been open, or in the background, past the month. */
  recheckLock: () => Promise<void>;
  /** "Deconectează-te" at the monthly lock: ends the session and goes back to the login. */
  signOutToLogin: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  isReloading: boolean;
  reloadConfig: {
    title?: string;
    subtitle?: string;
    icon?: string;
    steps?: string[];
  } | null;
  triggerReload: (
    opts?: {
      title?: string;
      subtitle?: string;
      icon?: string;
      steps?: string[];
      durationMs?: number;
    },
    task?: () => Promise<void> | void
  ) => Promise<void>;

  // Pending confirmation for a destructive action
  confirmRequest: ConfirmActionId | null;
  /** A plan fetched from the cloud, waiting for the user to accept replacing the local one. */
  pendingCloudPlan: PendingCloudPlan | null;
  requestConfirm: (action: ConfirmActionId) => void;
  cancelConfirm: () => void;
  confirmPending: () => void;

  // System Informative Notice
  activeNotice: SystemNotice | null;
  /** Notices raised while another was on screen, shown in order as each is dismissed. */
  noticeQueue: SystemNotice[];
  showNotice: (
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success'
  ) => void;
  clearNotice: () => void;

  // Domain State
  preferences: UserPreferences;
  currentPlan: MealPlan | null;
  groceryItems: GroceryListItem[];

  // Plan library & one-step undo for the destructive reset
  savedPlans: SavedPlan[];
  lastDiscardedPlan: DiscardedPlan | null;
  saveCurrentPlan: (name: string) => void;
  restoreSavedPlan: (savedPlanId: string) => void;
  deleteSavedPlan: (savedPlanId: string) => void;
  undoReset: () => void;
  dismissUndo: () => void;

  // Actions
  setSupermarket: (id: SupermarketId) => void;
  setPeopleCount: (count: number) => void;
  toggleCookingDay: (day: DayOfWeek) => void;
  setCookingDays: (days: DayOfWeek[]) => void;
  setBudget: (budget: number) => void;
  toggleMoodTag: (tag: MoodTag) => void;
  setMoodTags: (tags: MoodTag[]) => void;
  toggleDietType: (diet: DietType) => void;
  togglePantryItem: (ingredientId: string) => void;
  setPantryInventory: (items: string[]) => void;
  carryOverSurplus: () => void;
  toggleDislikedRecipe: (recipeId: string) => void;
  cookDoubleFor: (dayOfWeek: DayOfWeek, mealId: string) => void;
  undoCookDouble: (dayOfWeek: DayOfWeek, mealId: string) => void;
  toggleFavouriteRecipe: (recipeId: string) => void;
  toggleAvoidedAllergen: (allergen: Allergen) => void;
  toggleHealthGoalTag: (tag: HealthGoalTag) => void;
  setHealthGoalTags: (tags: HealthGoalTag[]) => void;
  setSnackTastePreference: (preference: 'sweet' | 'savory' | 'both') => void;
  toggleAppliance: (appliance: Appliance) => void;
  setExcludePantryStaples: (exclude: boolean) => void;
  setMealSlots: (slots: MealSlot[]) => void;
  setMealsPerDayCount: (count: 1 | 2 | 3) => void;
  setDailyMealSlots: (
    dailySlots: Partial<Record<DayOfWeek, MealSlot[]>>,
    count?: 1 | 2 | 3
  ) => void;
  setFoodTier: (tier: FoodTier) => void;
  addExtraMealToDay: (dayOfWeek: DayOfWeek, slot: 'dessert') => void;
  removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => void;
  setMealServings: (dayOfWeek: DayOfWeek, mealId: string, servings: number) => void;

  // Retail Snacks & Drinks Actions
  toggleSnackProduct: (productId: string) => void;
  toggleDrinkProduct: (productId: string) => void;
  setIncludeAlcohol: (include: boolean) => void;

  // Wizard Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  quickStart: () => void;

  // Plan Operations
  /** True when a plan was generated; false when the preferences allow none (a notice says why). */
  generatePlan: () => boolean;
  reshufflePlan: () => void;
  updatePreferencesAndRebuild: (newPrefs: Partial<UserPreferences>) => void;
  replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe, slot?: MealSlot) => void;
  /** By meal id when given; otherwise the first meal cooked in that slot (never a leftover). */
  toggleEatOut: (dayOfWeek: DayOfWeek, slot?: MealSlot, mealId?: string) => void;
  toggleGroceryItem: (ingredientId: string) => void;
  /** Ticks or unticks every item still to be bought, in one write. */
  setAllPurchased: (purchased: boolean) => void;
  setActiveView: (view: 'onboarding' | 'generating' | 'meals' | 'grocery') => void;

  // Persistence & Sync Actions
  hydrateStorage: () => Promise<void>;
  setUserEmail: (email: string | null) => void;
  syncWithCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  reminders: ReminderSettings;
  updateReminders: (patch: Partial<ReminderSettings>) => void;
  loadRemindersFromCloud: () => Promise<void>;
}

/** A cloud row that has been read and checked, held while the user decides on it. */
export interface PendingCloudPlan {
  plan: MealPlan;
  preferences: UserPreferences | null;
  updatedAt: string | null;
}
