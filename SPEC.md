# SPEC.md — Smart Meal Planning & Grocery Budgeting App ("Mise Romania")

## 1. Problem Statement
Planning healthy, varied, and affordable dinners is a major daily friction point for individuals, couples, and families. People often:
- Struggle with meal inspiration and fall back onto expensive takeout.
- Overspend at supermarkets due to unplanned shopping and buying random ingredients without a coherent weekly strategy.
- Generate food waste by buying single-use ingredients that spoil before being consumed.
- Lack visibility into how their weekly dinner plan maps directly to real-world supermarket pack sizes and specific cooking appliances (e.g., air fryer, oven).

**Mise Romania** solves this by generating a tailored weekly meal plan and an aggregated, categorized supermarket grocery list that strictly adheres to the user's budget, available kitchen appliances, dietary needs, cooking days, and household size.

---

## 2. Target Users & Personas
- **Primary Market:** Romania (supermarkets: Lidl, Kaufland, Carrefour, Mega Image). Currency: LEI (RON).
- **Target Personas:**
  1. *Busy Professionals & Couples:* Want fast (20-30 min) recipes, healthy macros, and air fryer/oven compatibility with minimal cognitive overhead.
  2. *Budget-Conscious Individuals & Students:* Need to cap weekly food spending strictly at a target figure (e.g., 150-250 RON) without sacrificing nutrition.
  3. *Small Families (3-4 people):* Need scalable portions, simple comfort food, and zero duplicate shopping.
- **Technical Literacy:** Casual mobile/web users. Frictionless UX is paramount; onboarding must feel like a lightweight interactive quiz.

---

## 3. Scope: In-Scope (MVP) vs. Non-Goals

### In-Scope (MVP)
1. **Interactive 7-Step Onboarding Wizard:**
   - Step 1: Supermarket selection (Lidl, Kaufland, Carrefour, Mega Image).
   - Step 2: Household size counter (1 to 6 people).
   - Step 3: Cooking days selector (custom selection of weekdays/weekend).
   - Step 4: Weekly budget slider with dynamic real-time minimum guidance based on selected days and people.
   - Step 5: Meal mood/style selector (up to 3: Speedy Meals, Low Calorie, Family Favorites, Healthy Comfort, Fakeaway, High Protein, Romanian Staples).
   - Step 6: Dietary restrictions (None, Vegetarian, Vegan, Pescatarian).
   - Step 7: Available kitchen appliances (Microwave, Hob, Air Fryer, Oven).
2. **Deterministic & AI-Enhanced Meal Plan Generator:**
   - Generates meals matching selected cooking days, appliances, and dietary filters.
   - Total estimated package cost stays strictly under or equal to the designated budget.
3. **Weekly Meal Board:**
   - Day-by-day meal cards displaying image/icon, recipe title, mood tag, preparation time, portions, and estimated meal cost.
   - "Rebuild plan" button to regenerate the entire week.
4. **Recipe Details & Meal Swap:**
   - Nutritional overview: Calories (kcal), protein (g), carbs (g), fat (g).
   - Scaled ingredient list based on number of persons.
   - Step-by-step cooking directions.
   - "Swap this meal" feature: intelligently replaces a single meal with an alternative of equivalent cost and compatibility.
5. **Aggregated Grocery Checklist:**
   - Consolidated ingredient list grouped by supermarket aisles/categories (Legume & Fructe / Produce, Carne & Pește / Meat, Cămară & Condimente / Pantry, Lactate / Dairy, Sosuri & Conserve / Tins & Sauces).
   - Differentiates required recipe quantity (e.g., "Mazăre: 100g necesar") from standard store packaging (e.g., "Pachet 500g").
   - Interactive checkboxes to strike through items while walking through the store.
   - Basic pantry staples toggle ("Am deja în cămară: sare, piper, ulei").
6. **Guest-First & Offline Resilience:**
   - Works immediately without forcing sign-up.
   - Persists state locally (`AsyncStorage`) so the grocery checklist functions in supermarket basements with zero mobile reception.
   - Optional Supabase authentication (Email/Google) for multi-device synchronization.

### Non-Goals (Explicitly Out of Scope for MVP)
- **No live automated retail checkout / grocery delivery APIs** (no Bringo, Glovo, or Sezamo automated cart creation).
- **No in-app subscriptions, paywalls, or payment gateway integration** in MVP.
- **No social feed, community comments, or public profile sharing.**
- **No multi-country localization or multi-currency conversions** (strictly Romania & RON for MVP).
- **No camera receipt scanning / OCR barcode scanner** in MVP.

---

## 4. Data Model (Text Specification)

### Entities & Relationships
1. **Supermarket:**
   - `id`, `name` (Lidl, Kaufland, Carrefour, Mega Image), `logo_url`, `is_active`.
2. **Ingredient:**
   - `id`, `name` (e.g., Piept de pui, Orez basmati, Sos de soia), `category` (Produce, Meat, Dairy, Pantry, Sauces, Bakery), `is_pantry_staple` (boolean).
3. **StoreProductPack (Supermarket Packaging Unit):**
   - `id`, `ingredient_id`, `supermarket_id`, `pack_quantity` (e.g., 500), `unit` (g, ml, buc), `typical_price_ron` (e.g., 18.50).
4. **Recipe:**
   - `id`, `title`, `description`, `prep_time_minutes`, `cook_time_minutes`, `calories_per_serving`, `protein_grams`, `carbs_grams`, `fat_grams`, `diet_type` (Omnivore, Vegetarian, Vegan, Pescatarian), `required_appliances` (array: Oven, Air Fryer, Hob, Microwave), `mood_tags` (array), `image_url`.
5. **RecipeIngredient:**
   - `id`, `recipe_id`, `ingredient_id`, `quantity_per_serving`, `unit`.
6. **RecipeStep:**
   - `id`, `recipe_id`, `step_number`, `instruction_ro`.
7. **MealPlan:**
   - `id`, `user_id` (nullable for guests), `supermarket_id`, `people_count`, `cooking_days` (array), `budget_ron`, `actual_cost_ron`, `created_at`.
8. **MealPlanDay:**
   - `id`, `meal_plan_id`, `day_of_week` (Monday..Sunday), `recipe_id`.
9. **GroceryListItem:**
   - `id`, `meal_plan_id`, `ingredient_id`, `category`, `total_needed_qty`, `pack_to_buy_qty`, `unit`, `estimated_cost_ron`, `is_staple`, `is_purchased` (boolean).

---

## 5. Core User Flows
1. **Onboarding & Configuration:**
   - User opens web/app $\rightarrow$ 7-step wizard captures: Supermarket $\rightarrow$ Portions $\rightarrow$ Days $\rightarrow$ Budget $\rightarrow$ Mood $\rightarrow$ Diet $\rightarrow$ Appliances $\rightarrow$ Taps "Generează Meniu".
2. **Plan Synthesis:**
   - Engine filters recipes matching diet and appliances.
   - Selects high-compatibility recipes fitting mood preferences.
   - Calculates aggregated packaging requirement and total cost.
   - If cost > budget: substitutes with economical alternatives or surfaces warning.
3. **Plan Review & Swap:**
   - User reviews the 7-day schedule.
   - Tapping any recipe opens full detail modal (macros, ingredients, directions).
   - Tapping "Schimbă rețeta" queries Gemini Flash/Engine for alternative recipes that fit the remaining budget and constraints.
4. **Shopping in Supermarket:**
   - User navigates to "Listă Cumpărături" tab.
   - Toggle "Exclude ingrediente de bază din cămară" updates total cost.
   - User ticks off items in aisle order; checked state is persisted immediately offline.

---

## 6. Non-Functional Requirements
- **Performance:** Onboarding step transitions < 100ms. Plan generation < 3 seconds.
- **Offline Reliability:** Grocery checklist and weekly meals must remain fully accessible and editable without an active internet connection.
- **Security:** Google Gemini API keys must never be exposed to the client bundle. All AI requests proxy through a secure backend/edge function.
- **Responsiveness:** Fluid display on mobile viewport (360px - 430px) as well as desktop browser viewports (centered clean mobile container).
- **Codebase Portability:** Written in Expo/React Native TypeScript so that iOS and Android binaries can be built via EAS without UI rewriting.

---

## 7. Edge Cases & Resilience
- **Unrealistically Low Budget:** Dynamic budget floor prevents setting impossible numbers without a clear warning. If forced, engine picks staple-heavy recipes (rice, legumes, root vegetables) and displays an alert indicating the budget gap.
- **Missing Appliances:** Hard exclusion. A user with only a Microwave and Hob will never be assigned an Air Fryer or Oven recipe.
- **Network Loss During Shopping:** Local storage (`AsyncStorage`) acts as the client-side master record for item checkboxes; syncs to Supabase on reconnect.
- **Duplicate Items in Aggregation:** Ingredients across multiple meals (e.g., onions used in Monday and Thursday) are combined into single grocery line items with total required weight and minimum pack count.

---

## 8. Definition of Done (MVP Acceptance Criteria)
- [ ] 7-step onboarding flow functions smoothly with back navigation, state preservation, and dynamic budget hints.
- [ ] Seed database loaded with 35+ verified Romanian-adapted recipes and realistic supermarket ingredient prices in RON.
- [ ] Weekly meal plan successfully generated under budget constraint for any valid combination of 1-7 days.
- [ ] Recipe detail screen displays accurate macro breakdown, portion scaling, and instructions.
- [ ] "Swap meal" successfully substitutes a selected recipe without exceeding budget limits.
- [ ] Grocery list groups ingredients correctly by aisle category and converts recipe amounts into whole store packages.
- [ ] Checklist functions offline (checked items persist across browser reloads / app restarts).
- [ ] Cross-platform verified: runs cleanly on Web browser and mobile preview (Expo).

---

## 9. Assumptions List
- **PRESUMPTION 1:** Retail prices in the seed catalog represent average market estimates for Romanian supermarkets in 2026 and do not require live scraping in MVP.
- **PRESUMPTION 2:** Common household pantry staples (salt, pepper, basic cooking oil, tap water) are assumed available unless explicitly unflagged by the user.
- **PRESUMPTION 3:** Supabase Free Tier is sufficient for database storage, edge function execution, and initial user authentication.
