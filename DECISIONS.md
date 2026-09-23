# DECISIONS.md — Architecture & Technical Decision Records

> **Notă, 2026-09-23.** `SPEC.md`, `PLAN.md` și agentul de prompturi pentru fotografii
> (`scripts/recipeImageAgent.ts`, `src/services/recipeVisualAgent.ts`) au fost șterse din repo.
> ADR-urile de mai jos sunt păstrate neatinse, ca înregistrare a ceea ce era adevărat când au
> fost luate deciziile — deci referirile lor la acele fișiere sunt istorice, nu legături vii.
> Starea curentă a proiectului este în `HANDOFF.md`.

This document records the foundational architectural decisions for Mise Romania. Each record details the context, evaluated alternatives, selected solution, rationale, accepted trade-offs, and falsification conditions.

---

## ADR-01: Multi-Platform Client Framework (Web $\rightarrow$ Mobile App Store / Google Play)

### Context
The project must launch first as a responsive Web Application, with the explicit requirement to release on Apple App Store and Google Play Store soon after without rewriting the frontend.

### Options Evaluated
1. **Expo / React Native (React Native for Web) [CHOSEN]**
   - *Pros:* Single codebase in TypeScript. True native rendering on iOS/Android and clean responsive HTML/DOM on Web. Expo Router provides modern file-based routing. Zero code rewrite needed when generating App Store/Play Store binaries via EAS Build.
   - *Cons:* Slightly heavier initial web bundle compared to raw Next.js; some CSS web quirks require platform-agnostic styling (e.g. flexbox only).
   - *Long-term issues:* Third-party web-only libraries occasionally require native wrappers or conditional code.
2. **Next.js (React) + Capacitor / Cordova**
   - *Pros:* Excellent desktop web performance, fast SSR/SSG.
   - *Cons:* On mobile devices, runs as a WebView (embedded browser), leading to sluggish touch interactions, non-native scrolling physics, and potential App Store rejection risks for simple web-wrapper apps.
   - *Long-term issues:* Clunky native device integration (haptics, background sync, offline caches).
3. **Flutter (Dart)**
   - *Pros:* Consistent UI across web and mobile, strong performance.
   - *Cons:* Heavy web payload (CanvasKit / Wasm), poorer web SEO and text-rendering performance, requires switching the stack to Dart instead of TypeScript.
   - *Long-term issues:* Harder to hire or migrate compared to the TypeScript/React ecosystem.

### Decision & Recommendation
**Choose Expo / React Native with TypeScript.**
*Core Reason:* It is the only modern framework that delivers true native mobile performance for iOS/Android while running seamlessly in modern web browsers from a single TypeScript repository.

### Falsification Condition
*What would make this decision wrong:* If our primary audience exclusively visited the app via desktop search engines requiring intensive server-side SEO rendering, or if we had a large pre-existing team of Dart/Flutter engineers.

---

## ADR-02: Styling and Design System

### Context
We need a modern, sleek UI matching the mobile aesthetic shown in the inspiration video (smooth rounded corners, badge tags, clean sliders, cheerful food imagery) that works identically on Web, iOS, and Android.

### Options Evaluated
1. **NativeWind v4 (Tailwind CSS for React Native) [CHOSEN]**
   - *Pros:* Standard utility classes (`rounded-2xl`, `bg-emerald-500`, `p-4`), compile-time optimization, zero runtime overhead on web, familiar to modern web developers.
   - *Cons:* Requires proper setup with Babel/Metro and Tailwind configuration.
   - *Long-term issues:* Must adhere to React Native supported styles (no CSS grid or arbitrary pseudo-selectors on native).
2. **StyleSheet.create (Pure React Native Styles)**
   - *Pros:* Zero external dependencies, built into core React Native.
   - *Cons:* Highly verbose, slower development velocity, no shared utility tokens.
   - *Long-term issues:* Maintenance bloat across tens of screen components.
3. **Tamagui or Gluestack UI**
   - *Pros:* Pre-styled accessible components.
   - *Cons:* Steep learning curve, frequent breaking changes, heavier setup.

### Decision & Recommendation
**Choose NativeWind v4 (Tailwind CSS) with Lucide Icons.**
*Core Reason:* Delivers maximum UI development velocity using industry-standard Tailwind classes across Web, iOS, and Android.

### Falsification Condition
*What would make this decision wrong:* If React Native styling performance on low-end Android devices suffered from Tailwind class compilation (NativeWind v4 compiles to native styles at build time, preventing this).

---

## ADR-03: AI Engine & Meal Generation Strategy

### Context
The app needs to suggest weekly meal plans fitting strict budgets, dietary restrictions, and kitchen appliances, as well as support an intelligent "Swap meal" function without wild nutritional/grammage hallucinations.

### Options Evaluated
1. **Hybrid: Structured Recipe DB + Google Gemini Flash via Serverless Proxy [CHOSEN]**
   - *Pros:* Recipes, ingredients, steps, and base macros are grounded in verified data. Gemini Flash is used for high-speed (<1.5s), cost-effective constraint satisfaction, intelligent swaps, and natural language tweaks. Gemini offers an extremely generous free/low-cost tier and native structured JSON output (`response_schema`).
   - *Cons:* Requires managing seed recipe records and proxying requests through a serverless function.
   - *Long-term issues:* Need to expand the database over time to maintain recipe novelty.
2. **100% Generative LLM (Pure Prompt Generation)**
   - *Pros:* Zero database to curate; infinite recipe variety.
   - *Cons:* High risk of hallucinations (e.g., cooking raw chicken in 5 minutes, nonsensical grocery weights, impossible price estimates), higher latency (5-10s per plan), and continuous API costs.
   - *Long-term issues:* User frustration when grocery lists don't match store packages.
3. **Pure Hardcoded Heuristics (Zero AI)**
   - *Pros:* Zero API costs, instant execution, works 100% offline.
   - *Cons:* Static, repetitive meal plans, robotic swaps, unable to handle nuanced user requests (e.g. "I want something spicier for dinner").
   - *Long-term issues:* Feels like a static spreadsheet rather than a modern smart assistant.

### Decision & Recommendation
**Choose Hybrid: Curated PostgreSQL/Local Recipe Database + Google Gemini Flash.**
*Core Reason:* Grounds financial and nutritional calculations in verified reality while using Gemini Flash for rapid, natural personalization and swaps.

### Falsification Condition
*What would make this decision wrong:* If internet latency or API availability degraded to the point where users could not generate a plan, or if zero budget existed for serverless operations.

---

## ADR-04: Backend, Database & Authentication

### Context
The app needs to persist recipes, store packaging models, support guest users locally, and allow authenticated users to sync plans across web and mobile.

### Options Evaluated
1. **Supabase (PostgreSQL, Auth, Edge Functions) [CHOSEN]**
   - *Pros:* Relational PostgreSQL perfectly models many-to-many recipe-ingredient relationships. Supabase Edge Functions securely host Gemini API keys. Generous free tier, instant RESTful endpoints, built-in Auth (Google/Email), and battle-tested React Native client.
   - *Cons:* Requires managing remote Supabase project configuration.
   - *Long-term issues:* Vendor locking to Supabase infrastructure (mitigated because it's open-source Postgres).
2. **Firebase (Firestore & Cloud Functions)**
   - *Pros:* Deep Google ecosystem, strong offline SDK.
   - *Cons:* NoSQL document model makes relational grocery calculations (summing ingredients, grouping by aisle, calculating pack fractions) awkward and expensive in read ops.
   - *Long-term issues:* Cost spikes with document queries.
3. **Local-Only Storage (AsyncStorage / SQLite) with Zero Backend**
   - *Pros:* Maximum simplicity, zero operating cost.
   - *Cons:* Exposes Gemini API keys directly in client bundles (or requires users to provide their own key); impossible to sync between a laptop browser and a smartphone.
   - *Long-term issues:* Must rewrite state layers when adding accounts later.

### Decision & Recommendation
**Choose Supabase (PostgreSQL + Edge Functions + Auth) paired with local AsyncStorage caching.**
*Core Reason:* PostgreSQL is the ideal relational engine for recipe and grocery inventory, while Edge Functions provide a secure proxy for AI calls and effortless multi-device sync.

### Falsification Condition
*What would make this decision wrong:* If offline-only isolation without any server setup was an uncompromisable requirement for MVP.

---

## ADR-05: Supermarket Pricing & Packaging Strategy

### Context
In Romania, major supermarkets (Lidl, Kaufland, Carrefour, Mega Image) do not provide open, public, real-time pricing APIs. Scraping is blocked by anti-bot measures and breaks continually.

### Options Evaluated
1. **Reference Pack Catalog (Standard Packaging & Average Unit Prices) [CHOSEN]**
   - *Pros:* Predictable, zero external points of failure, deterministic offline calculations. Distinguishes between recipe requirement (e.g., 80g peas) and store package (e.g., 500g bag at 6.50 RON).
   - *Cons:* Prices are accurate market estimates rather than live aisle-scanned prices to the penny.
   - *Long-term issues:* Requires periodic batch updates (e.g. monthly review of baseline staple prices).
2. **Live Scraping of Delivery Apps (Bringo / Sezamo / Glovo)**
   - *Pros:* Real-time prices.
   - *Cons:* Extremely fragile; IP blocks, Cloudflare Captchas, high latency during plan generation, frequent markup discrepancies between delivery platforms and physical shelf prices.
   - *Long-term issues:* High maintenance burden debugging broken scrapers.
3. **Flat Theoretical Per-Gram Pricing**
   - *Pros:* Simple math (e.g., 10g garlic = 0.15 RON).
   - *Cons:* Misleads the user into thinking their weekly grocery bill will be 60 RON, when in reality they must buy whole heads of garlic, a bag of rice, and a bottle of oil costing 120 RON.

### Decision & Recommendation
**Choose Reference Pack Catalog with minimum packaging logic and pantry staples toggle.**
*Core Reason:* It provides honest, realistic shopping basket totals while maintaining 100% system reliability without fragile scraper dependencies.

### Falsification Condition
*What would make this decision wrong:* If a supermarket opened an official, free public API with real-time stock and checkout capabilities.

---

## ADR-06: Budget as a Hard Planning Constraint

### Context
`SPEC.md` requires that the total package cost stays at or below the user's budget, and acceptance criterion 128 assumes this holds. An audit on 2026-09-22 measured the opposite: the same preferences produced an identical 275.61 lei cart whether the budget was 80 lei or 900 lei. `budgetRon` was validated, stored, displayed and used to draw the gauge, but never entered recipe selection — it appeared only as a small `- portionCost * 0.2` tie-breaker in the scoring function.

### Options Evaluated
1. **Incremental replacement of the priciest meal [CHOSEN]**
   - *Pros:* Touches only the meals that actually cause the overrun, so the week keeps its variety and character. Stops as soon as the cart fits. Predictable and easy to explain to the user ("am înlocuit 3 mese").
   - *Cons:* Greedy, so not provably the cheapest possible basket. Recomputes the whole cart after each swap.
2. **Automatic food-tier downgrade (premium → medium → basic)**
   - *Pros:* Strong, fast effect; one regeneration.
   - *Cons:* Changes the character of every meal at once, including those that were already affordable. The user explicitly chose a tier; silently overriding it is worse than replacing a few dishes.
3. **Warn only, never change the plan**
   - *Pros:* Least invasive, no risk of degrading a plan the user liked.
   - *Cons:* Leaves the budget decorative, which is the defect being fixed.

### Decision & Recommendation
**Greedy incremental replacement**, in `optimizeDaysForBudget` (`src/engine/plannerEngine.ts`). While the cart exceeds the budget, replace the single priciest meal with the cheapest alternative that is still legal for its slot, recomputing the real cart cost each time. Diet, allergens, appliances and slot suitability are never relaxed to save money. Repetition stays capped at two per week so cost-cutting cannot collapse the week onto one cheap dish.

When even the cheapest legal plan exceeds the budget, the plan is still returned, and `MealPlan.budgetStatus` reports the honest floor so the UI can state it rather than pretend.

### Accepted Trade-off
The result is a good plan within budget, not a provably optimal one. A true optimiser (knapsack / ILP) would cost far more complexity than the problem justifies at this catalog size.

### Falsification Condition
*What would make this decision wrong:* If the catalog grew large enough that greedy swapping regularly produced carts noticeably above what a solver would find, or if users reported that the swapped-in meals felt arbitrary.

---

## ADR-07: Recipe Imagery — Generated Cards Instead of Stock Photography

### Context
Recipe cards pulled photographs from `AUTHENTIC_RECIPE_VISUAL_REGISTRY`, 74 Unsplash ids that had never been visually checked, and labelled them "Rețetă Autentică". Downloading and inspecting all 82: 15 had a correct local photograph, 4 urls returned HTML rather than an image, and of the remainder roughly a third showed something else entirely — a photograph of headphones on "Mâncărică de fasole", a chocolate milkshake on hummus, a fried egg on vegan pancakes.

The root problem is not the particular ids. Stock libraries have no photograph of mămăligă, bulz or ciorbă rădăuțeană, so any id chosen for those dishes is a guess, and guessing is what produced the headphones.

### Options Evaluated
1. **Generated card built from the recipe's own data [CHOSEN]**
   - *Pros:* Cannot show something the dish does not contain, because it is derived from the ingredient list. Loads instantly, works offline, no external dependency, consistent look.
   - *Cons:* Not photography. Less appetising than a good food photo would be.
2. **One curated photo per dish archetype (soup, stew, pasta …)**
   - *Pros:* Still looks like a food app; never absurd.
   - *Cons:* Several dishes share one image, and it is still not a photo of *your* dinner. Honest labelling required.
3. **Leave it, fix the worst ids**
   - *Cons:* Unverifiable at the root; the next person adding a recipe repeats the mistake.

### Decision & Recommendation
**`src/components/RecipeVisual.tsx`**: a real photograph where one of that dish exists in `assets/recipes`, otherwise a card generated from the recipe — a gradient chosen by dish archetype, the pictograms of its characteristic ingredients, their names, and the cooking time. `SPEC.md` line 39 asks for "image/icon", so this satisfies the spec.

The 74-entry registry, the 82 `imageUrl` values, and the "AI Dish Studio" / "Rețetă Autentică" badges were removed. A source badge now appears only where a real photograph exists. The prompt builder in `recipeVisualAgent` is kept, since that is what generates the local photographs.

### Accepted Trade-off
The app looks more illustrative and less photographic until more local photographs are produced. Deliberate: a wrong photograph is worse than an honest illustration, especially when it contradicts a dietary claim (an egg on a vegan recipe).

### Falsification Condition
*What would make this decision wrong:* If a verified photograph existed for every catalog dish, or if user testing showed the generated cards measurably hurt appetite appeal and trust more than a mismatched photo does.

---

## ADR-08: An Empty Appliance List Means "Needs No Appliance"

### Context
Six dishes that are never cooked (salads, wraps, yoghurt bowls, chia pudding, guacamole, hummus) declared `appliances: ['hob']` with `cookTimeMinutes: 0`. Because appliances are a hard constraint, that untrue declaration hid them from anyone without a hob, for no reason.

### Decision & Recommendation
`appliances: []` now means the dish needs no appliance, and `hasRequiredAppliances` already treated an empty list as satisfied. The catalog test asserts both directions: nothing uncooked may demand an appliance, and anything cooked must declare how.

### Accepted Trade-off
A kitchen with only a microwave is now a feasible setup rather than a blocked one, since such a user really can make avocado toast and overnight oats. The "combinație imposibilă" guard added earlier still exists but fires far more rarely — it is now a safety net rather than a common path.

### Falsification Condition
*What would make this decision wrong:* If users with minimal kitchens found a plan of four no-cook dishes worse than being told the combination does not work.

---

## ADR-09: Patching Build-Tooling Vulnerabilities Without an SDK Upgrade

### Context
`npm audit` reported 23 affected packages, 34 advisories, across `tar`, `@xmldom/xmldom`,
`postcss`, `image-size` and `uuid`. `npm audit fix` refused all of them and `--force` proposed
Expo SDK 52 → 57 and react-native 0.76 → 0.87, which would undo the version alignment this
branch had just made and rewrite the app's foundation.

This was first reported as "requires an SDK upgrade". That conclusion came from what
`npm audit fix` printed, not from what was actually possible.

### What the advisories actually reach
None of the five packages appear in the shipped bundle. Grepping the 1.2 MB production export
for each returns zero hits. They are build tooling: `tar` inside the Expo CLI and npm's cache,
`@xmldom/xmldom` inside `@expo/plist` for generating an iOS plist during prebuild (this project
has never ejected), `postcss` and `image-size` inside Metro, `uuid` inside Expo's telemetry.

So the exposure is a developer's machine during a build, not a user's device.

### Options Evaluated
1. **npm `overrides` pinning patched versions [CHOSEN]**
   - *Pros:* Fixes the advisories in place. Expo and react-native stay where they are. Reversible
     by deleting four lines.
   - *Cons:* Forces versions the parent packages were not tested against, so each one has to be
     verified by actually building, not by trusting the resolver.
2. **Expo SDK 52 → 57**
   - *Pros:* Everything moves to supported versions at once.
   - *Cons:* Five major SDK versions and a react-native major. A project of its own, with its own
     testing, for a class of issue that never reaches users.
3. **Accept and document**
   - *Cons:* Leaves a permanently red `npm audit`, which trains people to ignore it.

### Decision & Recommendation
Override `tar` to 7.5.22, `@xmldom/xmldom` to 0.9.12, `postcss` to 8.5.28 and `uuid` to 11.1.1.
Verified after installing: 428 tests, typecheck, lint, a successful production web export and a
serving dev bundle.

**`image-size` is deliberately not overridden.** Its v2 changes the export shape and breaks
`metro/src/Assets.js` with `getImageSize is not a function`; the production build fails outright.
Found by building, not by reading changelogs.

### Accepted Trade-off
Six advisories remain, all the same two `image-size` issues: denial of service through malformed
ICNS, JXL or HEIF files. Exploiting them requires placing a crafted image into this repository's
own assets, which is not a threat model that applies to a bundler processing our own photographs.
They clear on their own when Metro eventually moves to image-size v2.

### Falsification Condition
*What would make this decision wrong:* if one of the overridden majors turned out to break
something the build does not exercise — an EAS build, or a prebuild for the app stores, neither of
which has been run here. Both should be tried before the first store submission.

---

## ADR-10: The gluten-free diet is derived from the allergen data, not its own list

**Status:** Accepted · 2026-09-23

### Context
`isRecipeMatchingDiets` decided "Fără Gluten" from `GLUTEN_INGREDIENT_MARKERS`, a hand-written
list of ingredient id fragments. `INGREDIENT_ALLERGENS` in `src/data/allergens.ts` separately
decided what carries the `gluten` allergen. Two lists, maintained by hand, for one fact.

They drifted. The diet list never learned about `fulgi_ovaz`, `sos_soia` or `bors_proaspat`,
which the allergen map tags correctly. A user who picked the diet — described in the app as
"ideal pentru sensibilitate" — but did not separately tick the gluten allergen was served
gluten: measured at roughly three meals per generated week, in all eight mood configurations.

### Options
1. **Add the three missing ingredients to the diet list**
   - *Pros:* One line each. Nothing else moves.
   - *Cons:* Leaves two lists to keep in step, which is what failed. The next ingredient added
     to one and not the other reopens exactly this hole.
2. **Derive the diet check from `getIngredientAllergens`** *(chosen)*
   - *Pros:* One source of truth. Adding an ingredient to the allergen map protects both the
     allergy and the diet at once. Deletes the duplicated list outright.
   - *Cons:* Couples the diet filter to the allergen data — which is the intent, not a cost.
3. **Keep both and add a test that they agree**
   - *Cons:* Detects the drift instead of preventing it, and still needs two edits per ingredient.

### Decision
Option 2. `GLUTEN_INGREDIENT_MARKERS` is gone.

Before changing anything, both directions were measured: the allergen map proved a strict
superset of the marker list, so no recipe that used to be excluded became allowed. Both
directions are now asserted in `src/utils/__tests__/glutenConsistency.test.ts`, along with a
check that the diet still leaves enough recipes for a full week.

### Falsification Condition
*What would make this decision wrong:* if the diet and the allergy ever needed to disagree on
purpose — say a "reduced gluten" tier that permits oats for the non-coeliac. That is a different
product decision, and it would need its own field on the ingredient, not a second list.
