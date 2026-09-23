# PLAN.md — Implementation Roadmap & Execution Plan

This document outlines the step-by-step vertical implementation plan for **Mise Romania**.
Spikes are executed first to retire core technical risks, followed by sequential vertical slices where each step leaves the application in a runnable, verifiable state.


> **Notă de actualitate (2026-09-23).** Pașii 1-11 de mai jos sunt planul original, scris
> înainte de implementare. **Arhitectura descrisă în ei nu este cea construită.** Ce există
> în realitate:
>
> | Planificat | Construit |
> |---|---|
> | Expo Router, `app/_layout.tsx`, `app/(tabs)/*` | Navigare prin stare în `App.tsx`, ecrane în `src/screens/` |
> | NativeWind / Tailwind, `tailwind.config.js` | `StyleSheet` + tema „glass" din `src/styles/theme.ts` |
> | `src/constants/theme.ts` | `src/styles/theme.ts` |
> | `src/components/ApplianceGrid.tsx` | `src/components/ApplianceSelector.tsx` |
> | `spikes/gemini_spike.ts` | Nu există; AI-ul a fost validat direct în `src/services/aiProxy.ts` |
> | `src/components/DesktopWrapper.tsx` | `src/hooks/useResponsive.ts` |
> | `metro.config.js` | Configurația implicită Expo |
>
> Pașii rămân aici ca istoric al intenției. **Pentru starea reală, vezi Step 12 și `HANDOFF.md`.**

---

## Overview of Implementation Phases

```
[Spike 1: AI JSON Verification] ──┐
                                   ├──> [Phase 1: Project Foundation] ──> [Phase 2: Data Catalog]
[Spike 2: Expo + Tailwind Web]   ──┘                                             │
                                                                                 v
                                                                   [Phase 3: Budget Solver Engine]
                                                                                 │
                                                                                 v
                                                                   [Phase 4: 7-Step Onboarding]
                                                                                 │
                                                                                 v
                                                                   [Phase 5: Meal Plan Board]
                                                                                 │
                                                                                 v
                                                                   [Phase 6: Recipe & Swap Modal]
                                                                                 │
                                                                                 v
                                                                   [Phase 7: Grocery Checklist]
                                                                                 │
                                                                                 v
                                                                   [Phase 8: Offline Storage & Sync]
                                                                                 │
                                                                                 v
                                                                   [Phase 9: End-to-End QA]
```

---

## Step 1: Spike 1 — Gemini Flash Structured JSON & Swap Validation
- **What is built:** A standalone validation script testing Google Gemini Flash with `response_schema` (structured JSON mode). Tests whether the model can reliably select/swap recipes matching budget, dietary restrictions, and kitchen appliances in Romanian without hallucinations.
- **Files touched:**
  - `spikes/gemini_spike.ts`
  - `spikes/test_recipes.json`
- **Dependencies:** None.
- **How it's tested:** Execute `npx ts-node spikes/gemini_spike.ts` with test constraints; verify valid JSON response under 2.0 seconds with exact field validation.
- **Tool / Subagent:** Subagent (`research` or `self`) / Terminal `run_command`.
- **Can run in parallel:** YES (in parallel with Step 2).

---

## Step 2: Spike 2 — Expo Web + NativeWind Styling Compatibility Check
- **What is built:** A minimal Expo TypeScript app configured with NativeWind v4 (Tailwind CSS) to verify crisp rendering, mobile viewport centering on desktop, and fast reload on Web.
- **Files touched:**
  - `package.json`
  - `tailwind.config.js`
  - `metro.config.js`
  - `App.tsx`
- **Dependencies:** None.
- **How it's tested:** Start dev server with `npx expo start --web` and verify rendering on `http://localhost:8081` without CSS compilation errors.
- **Tool / Subagent:** Subagent (`self`) / Terminal `run_command`.
- **Can run in parallel:** YES (in parallel with Step 1).

---

## Step 3: Phase 1 — Project Architecture & Foundation
- **What is built:** Production Expo project structure with TypeScript, Expo Router (file-based navigation), Lucide React Native icons, safe area context, and Zustand store skeleton.
- **Files touched:**
  - `app/_layout.tsx`
  - `app/index.tsx`
  - `src/types/index.ts`
  - `src/store/useAppStore.ts`
  - `src/constants/theme.ts`
- **Dependencies:** Successful Spikes 1 & 2.
- **How it's tested:** App loads with clean base layout, showing a branded loading state and router shell.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO (foundational dependency).

---

## Step 4: Phase 2 — Verified Romanian Recipe & Grocery Data Catalog
- **What is built:** A comprehensive, typed seed database containing 35+ verified recipes adapted for the Romanian market (ingredients, grams, prep time, calories, macros, appliance tags, mood tags) and supermarket pack models (standard quantities and realistic RON prices for Lidl, Kaufland, Carrefour, Mega Image).
- **Files touched:**
  - `src/data/recipes.ts`
  - `src/data/supermarkets.ts`
  - `src/data/ingredients.ts`
  - `src/data/pantryStaples.ts`
- **Dependencies:** Step 3.
- **How it's tested:** Unit test (`npm test -- dataCatalog.test.ts`) ensuring all recipes have valid ingredient links, positive nutritional values, and non-empty cooking steps.
- **Tool / Subagent:** Subagent (`research` / `self` for data structuring).
- **Can run in parallel:** YES (delegable to a dedicated subagent while Step 5 skeleton is prepared).

---

## Step 5: Phase 3 — Budget Solver & Meal Plan Core Engine
- **What is built:** Deterministic mathematical constraint solver that accepts user inputs (days, people count, budget, appliances, diet, mood) and selects recipes whose total package purchase cost is $\le$ target budget. Includes dynamic budget floor calculation function: `calculateMinimumViableBudget(people, days)`.
- **Files touched:**
  - `src/engine/plannerEngine.ts`
  - `src/engine/budgetCalculator.ts`
  - `src/engine/groceryAggregator.ts`
  - `src/engine/__tests__/plannerEngine.test.ts`
- **Dependencies:** Step 4.
- **How it's tested:** Automated test suite simulating 50 random user constraint configurations; verifies zero budget overruns and zero appliance constraint violations.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 6: Phase 4 — 7-Step Interactive Onboarding Wizard
- **What is built:** Visual, step-by-step questionnaire mirroring the inspiration video UX:
  1. Supermarket selector with Romanian retail logos/badges.
  2. Cooking for counter (`- 2 + people`).
  3. Day of week picker (custom multiple selection with auto-count).
  4. Weekly budget slider with live "Recomandat: ~X lei" floor indicator.
  5. Mood selector (multi-select up to 3: Speedy, Low Calorie, Family Favs, etc.).
  6. Dietary restrictions (Single/multi-choice: Vegetarian, Vegan, Pescatarian, None).
  7. Appliance kitchen visual selector (Hob, Oven, Air Fryer, Microwave).
  8. Animated "Generare Plan..." loading screen matching "Mise" style.
- **Files touched:**
  - `src/screens/onboarding/OnboardingWizard.tsx`
  - `src/screens/onboarding/steps/*.tsx`
  - `src/components/BudgetSlider.tsx`
  - `src/components/ApplianceGrid.tsx`
- **Dependencies:** Step 5.
- **How it's tested:** Manual step-through in browser and mobile preview; verify state is accurately captured in Zustand.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 7: Phase 5 — Weekly Meal Plan Board
- **What is built:** Primary meal schedule screen displaying:
  - Header with total weekly cost vs. budget (e.g. `42.20 lei / 56 lei`).
  - Day-by-day vertical feed of meal cards with badges: recipe title, mood tag, preparation time, portion count, and meal cost.
  - Floating bottom navigation: "Mese", "Listă Cumpărături", "Preferințe".
  - "Reconstruiește planul" action button.
- **Files touched:**
  - `app/(tabs)/meals.tsx`
  - `src/components/MealCard.tsx`
  - `src/components/PlanHeader.tsx`
- **Dependencies:** Step 6.
- **How it's tested:** Verify meal cards render accurately for all chosen cooking days with proper monetary sums.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 8: Phase 6 — Recipe Detail View & Intelligent Meal Swap Modal
- **What is built:** Full-screen or modal sheet when tapping any meal card:
  - Nutritional macro banner: kcal, time, servings, carbs, protein, fat.
  - Ingredients list scaled to chosen person count.
  - Step-by-step numbered cooking instructions.
  - Personal note field ("Adaugă notiță la această rețetă").
  - "Schimbă acest preparat" button triggering an alternative recommendation modal preserving the remaining budget constraint.
- **Files touched:**
  - `src/screens/RecipeDetailModal.tsx`
  - `src/screens/MealSwapModal.tsx`
  - `src/components/MacroBar.tsx`
- **Dependencies:** Step 7.
- **How it's tested:** Tap meal $\rightarrow$ inspect recipe $\rightarrow$ trigger swap $\rightarrow$ confirm new meal updates the daily card and recalculates total budget.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 9: Phase 7 — Aggregated Grocery Checklist with Aisles & Pack Units
- **What is built:** Full grocery shopping experience:
  - Automatic aggregation of identical ingredients across multiple meals.
  - Categorization into store aisles: Legume & Fructe (Produce), Carne & Pește (Meat & Fish), Cămară & Mirodenii (Pantry & Spices), Sosuri & Conserve (Tins & Sauces), Lactate (Dairy).
  - Explicit display of recipe requirement vs store packaging (e.g., "Mazăre: 100g necesar $\rightarrow$ Cumperi: 1 pachet 500g").
  - Progress header: `0 / 33 produse bifate`.
  - Interactive checkboxes with strikethrough animation.
  - "Exclude ingrediente de bază din cămară" switch to deduct salt, oil, and basic spices from shopping cost.
- **Files touched:**
  - `app/(tabs)/grocery.tsx`
  - `src/components/GroceryAisleSection.tsx`
  - `src/components/GroceryItemRow.tsx`
  - `src/components/PantryStapleToggle.tsx`
- **Dependencies:** Step 8.
- **How it's tested:** Check off items; reload browser / restart app; verify checked state remains 100% intact.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 10: Phase 8 — Offline-First Persistence & Supabase Integration
- **What is built:**
  - Offline-first storage using `@react-native-async-storage/async-storage` for guest mode.
  - Supabase client initialization.
  - Supabase Edge Function (`proxy-gemini-plan`) to host the Gemini API key securely for AI-assisted meal generation and custom swaps.
  - Optional Auth modal (Sign in with Google / Email) to synchronize plans across devices.
- **Files touched:**
  - `src/services/storage.ts`
  - `src/services/supabase.ts`
  - `supabase/functions/proxy-gemini-plan/index.ts`
  - `src/screens/AuthModal.tsx`
- **Dependencies:** Step 9.
- **How it's tested:** Disconnect network in browser DevTools; verify the entire grocery list and meal cards operate offline seamlessly. Test Edge Function endpoint via curl.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 11: Phase 9 — End-to-End Verification & Multi-Platform Check
- **What is built:** Final polish, edge case testing (impossible budgets, boundary people counts, empty appliances), responsive layout checks on desktop browser viewports and mobile screens, and preparation of EAS build config for future app store deployment.
- **Files touched:**
  - `app.json`
  - `src/components/DesktopWrapper.tsx`
- **Dependencies:** Step 10.
- **How it's tested:** Complete manual walk-through from clean browser cache: Onboarding $\rightarrow$ Plan generation $\rightarrow$ Recipe inspection $\rightarrow$ Swap $\rightarrow$ Grocery shopping checklist completion.
- **Tool / Subagent:** Parent agent (`self`).
- **Can run in parallel:** NO.

---

## Step 12: Audit Pass — Correctness, Safety and Trust (unplanned, 2026-09-22)

Not part of the original roadmap. Phases 1–8 were already implemented when this pass
started; it audited them end to end and fixed what it found. Phase 9 (Step 11) is still
outstanding.

### Done — implemented, tested and committed
- [x] **Budget is a real constraint.** `optimizeDaysForBudget` in `src/engine/plannerEngine.ts`.
      Measured before: identical 275.61 lei cart at any budget. See ADR-06.
- [x] **Diet, appliance and allergen constraints hold on every path.** The relaxation ladder in
      `pickBestRecipeForSlot` used to drop the appliance filter: 252 violations across 72
      generated plans, now 0 across 126 combinations (`hardConstraints.test.ts`).
- [x] **The app can no longer be locked out.** Preferences are persisted only after a
      successful rebuild; `checkPlanFeasibility` answers without throwing; `hydrateStorage`
      repairs a stored state that cannot produce a plan.
- [x] **Cart and pantry stay consistent.** `pantryInventory` was passed in 1 of 14 aggregation
      calls; plan totals excluded chosen snacks (6.99 lei gap); `extraProducts` was never set.
- [x] **Allergens** as a hard constraint (`src/utils/allergenFilter.ts`, `src/data/allergens.ts`),
      plus gluten detection gaps closed (`faina_grau`, `pesmet`, `biscuiti`, `chifle`, `lipii`).
- [x] **Vegan catalog is usable.** The one recipe tagged for vegan breakfast/dessert contained
      honey. Fixed, plus 8 new vegan recipes and 3 plant-based staples.
- [x] **Recipe imagery no longer shows the wrong dish.** See ADR-07.
- [x] **Supermarket basket comparison** (`src/engine/storeComparator.ts`).
- [x] **Per-meal servings, saved-plan library, undo on reset, quick start, live feasibility meter.**
- [x] **AI no longer needs a client-side provider key.** Requests go through the Supabase edge
      function; model output is validated against the offered candidates.
- [x] **Accessibility**: 0 → 91 annotated controls, with real roles for checkboxes and switches.
- [x] **Component test project** added; coverage 80.9% statements / 81.3% lines, enforced in
      `jest.config.js`.

### Închise după review-ul de închidere (2026-09-23)
- [x] Restaurarea unui plan salvat nu mai coboară protecțiile (alergii, dietă, aparate).
- [x] Schema Supabase scrisă ca migrație, cu RLS. Sincronizarea folosea emailul drept `user_id`.
- [x] Funcția edge securizată: rate limiting, plafoane pe prompt, CORS configurabil.
- [x] Restul constatărilor de review (validare storage, timer, imutabilitate, duplicări, teste).

### Outstanding after this pass
- [ ] **Step 11 / Phase 9 — End-to-end verification.** Never run. No human has clicked through
      the app since these changes; all verification so far is automated.
- [ ] **Migrația 0001 e scrisă dar nerulată** (`supabase/migrations/0001_user_meal_plans.sql`).
      `supabase db push` înainte de orice deploy cu cloud.
- [ ] **Edge function not deployed.** Needs the Supabase CLI and account credentials; steps are
      in `supabase/README.md`.
- [x] **PLAN.md architecture drift** — marcat ca intenție istorică, cu tabel comparativ la început.
- [x] **Vulnerabilitățile npm** — rezolvate prin `overrides`, fără upgrade de SDK. 23 → 6;
      cele 6 rămase sunt `image-size`, a cărui v2 rupe Metro. Vezi ADR-09.
