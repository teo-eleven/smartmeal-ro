# Plan de remediere SmartMeal RO

Sursa: [raportul de audit din 21.10.2026](https://claude.ai/artifact/3YxWXKkweVbgfxDSRSqsrN), commit `c68a7b3`.
Status: **propus, așteaptă confirmare**.

## Decizii luate (16/16)

| #   | Subiect                | Decizie                                                                                                                                                                      |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Git                    | Un branch + un PR pe fiecare etapă                                                                                                                                           |
| 2   | Imagini                | Hibrid verificat: păstrez pozele corecte, înlocuiesc pozele greșite cu poze verificate vizual, iar unde nu găsesc una, folosesc cardul generat (ADR-07)                      |
| 3   | Fallback imagini       | `onError` + `expo-image` (cache pe disc)                                                                                                                                     |
| 4   | Refactor fișiere mari  | **În paralel**: fiecare fișier se sparge în etapa în care e atins                                                                                                            |
| 5   | `carne_tocata_amestec` | Considerată porc                                                                                                                                                             |
| 6   | Alergeni ambigui       | Lapte de cocos → nuci; tortilla chips → gluten; mousse-ul vegan primește ciocolată neagră fără lactate; **plus orice alt caz ambiguu găsit, tratat prudent și listat în PR** |
| 7   | Keto                   | Prag ≤ 20 g carbohidrați/porție **și** listă exactă de ingrediente interzise                                                                                                 |
| 8   | Calorii                | Recalcul automat din valori nutriționale la 100 g pentru toate ingredientele                                                                                                 |
| 9   | Deconectare            | Șterg datele contului local; întreb înainte dacă planul nu e urcat                                                                                                           |
| 10  | Conflict cloud         | Compare-and-swap pe `updated_at` + dialog „versiune mai nouă în cloud”                                                                                                       |
| 11  | Model AI               | Migrare proxy de la Gemini la **Claude Haiku** (`claude-haiku-5-5`)                                                                                                          |
| 12  | Swap                   | Sortare după impactul în buget + badge „+X lei / −X lei”                                                                                                                     |
| 13  | Cod mort               | Șterg cele 7 acțiuni, `WeekOverview` și `themeMode` complet (aplicația rămâne doar dark)                                                                                     |
| 14  | Titluri                | Corectez titlurile **și** ID-urile, cu migrare de date; șterg ghiveciul duplicat                                                                                             |
| 15  | npm audit              | Upgrade Expo SDK în etapa finală                                                                                                                                             |
| 16  | Notițe rețetă          | Salvate local **și** în cloud (migrare SQL 0009)                                                                                                                             |

## Reguli pentru fiecare etapă

1. Branch nou din `main` actualizat.
2. **TDD**: testul care reproduce bugul se scrie întâi și trebuie să pice (RED), apoi vine reparația (GREEN), apoi refactorul.
3. Gate înainte de commit: `npm run typecheck`, `npm run lint` (0 erori), `npm test` (toate trec) și `npm run test:sql` pentru etapele cu SQL.
4. Review: `code-reviewer` + `typescript-reviewer` pe diff; `security-reviewer` obligatoriu în etapele 1 și 5.
5. Commit-uri convenționale (`fix:`, `feat:`, `refactor:`, `test:`).
6. **Push și PR doar după confirmarea ta**, la fiecare etapă.
7. Rularea cap-coadă (Playwright, 390 px) se reia la finalul etapelor 2, 4b și 6.

---

## Etapa 1 · `fix/food-safety`: siguranță alimentară

**Agenți:** tdd-guide, typescript-pro, security-reviewer · **Mărime:** M

- [ ] Test: fiecare ingredient folosit într-o rețetă e mapat în `INGREDIENT_ALLERGENS` sau e pe lista explicită „fără alergeni”.
- [ ] Mapări noi: `file_cod_congelat`→pește, `pastrav_proaspat`→pește, `tofu_clasic`→soia, `lapte_migdale_fara_zahar`→nuci, `lapte_vegetal_ovaz`→gluten, `chifle_burger`→susan, `lapte_cocos`→nuci, `tortilla_chips_nachos`→gluten; scot susanul de la `naut_conserva`.
- [ ] Scanez manual toate cele 111 ingrediente pentru alte cazuri ambigue și le listez în PR.
- [ ] Flag explicit `containsPork` pe ingredient (cu `sunca_praga`, `carnaciori_oltenesti`, `carne_tocata_amestec`) în locul subșirurilor, plus test pe catalog: 0 rețete cu porc la `pork_free`.
- [ ] Mousse: ingredient nou `ciocolata_neagra_vegana`, cu prețuri estimate în 8 magazine marcate ca estimare în PR. Test: nicio rețetă vegană nu conține lactate, ouă sau miere.
- [ ] Keto: prag ≤ 20 g carbohidrați/porție + listă exactă (`faina_*`, `paine_*`, `chifle_*`, `lipii_*`, `zahar_*`, `fulgi_ovaz`, leguminoase, quinoa, fructe dulci, miere, cartofi, orez, paste, mălai).
- [ ] `parseUserPreferences` păstrează și validează `healthGoalTags`, `dailyMealSlots`, `pendingPantryStock`, `snackTastePreference`. `dietTypes` corupt declanșează notificare de reparare, nu devine „omnivore” în tăcere.
- [ ] `restoreSavedPlan` și `applyCloudPlan` pornesc de la preferințele curente și păstrează dieta cea mai strictă, reunind `dislikedRecipeIds` și `healthGoalTags`.
- [ ] `makePlanSafeForPreferences`: deserturile se verifică doar cu `getEligibleDessertRecipes`; o zi fără mese sigure nu mai păstrează rețeta-titlu nesigură.
- [ ] **Refactor în paralel:** extrag slice-ul `preferences` din `useAppStore.ts` și `utils/dietRules.ts` din `dietCompatibility.ts`.

## Etapa 2 · `fix/recipe-images`: imagini, titluri, ID-uri

**Agenți:** frontend-developer, react-specialist, code-reviewer · **Mărime:** L

- [ ] **Titluri și ID-uri:** corectez rețetele `aripioare_pui_airfryer`, `curcan_stirfry_legume_soia`, `chili_fasole_neagra_cartof_dulce`, `somon_salbatic_sparanghel_turmeric`, `tagliatelle_creveti_usturoi`, `omleta_ciuperci_branza_capra`, `tocanita_ciuperci_smantana` („cu mămăliguță” fără mălai), `ciorba_legume_lamaie` (leuștean lipsă) și `fasole_scazuta_afumatura` (vegană); șterg `ghiveci_calugaresc_legume`, care e duplicat.
- [ ] Migrare de ID-uri (`RECIPE_ID_ALIASES`) aplicată la hidratare, preluare din cloud și restaurare: favorite, dislike-uri, plan curent, planuri salvate. Plus test.
- [ ] Manifest de poze `src/data/recipePhotoManifest.ts`: `{ recipeId, photoId, verifiedBy, verifiedAt, credit }`. Doar pozele aprobate vizual intră în manifest.
- [ ] Caut și verific vizual înlocuitori pentru cele ~49 de poze greșite. Fiecare candidat trece printr-o planșă (contact sheet), iar dacă nu găsesc o poză bună, rețeta primește cardul generat.
- [ ] Inversez pozele smoothie ↔ bol cu năut; corectez fallback-ul `snack` și cardurile de onboarding (`ARCHETYPE_PHOTO_URLS`).
- [ ] `scripts/photoContactSheet.mjs` generează planșa etichetată. Testele pe șiruri se înlocuiesc cu „orice ID din hartă e în manifest”.
- [ ] `RecipeVisual` și `FoodMoodSwiper` trec pe `expo-image`, cu `onError` → backdrop local → gradient, și fundal de bază pe container.
- [ ] Potrivirea după cuvinte cheie: doar cuvinte întregi, ponderate pe începutul titlului (felul principal), cu teste pentru „Ovăz peste noapte”, „…cu mămăligă” și „…cu sos de iaurt”.
- [ ] Credit „Foto: Nume / Unsplash” în detaliul rețetei.
- [ ] ADR-10 în `docs/DECISIONS.md`: înlocuiește parțial ADR-07 și definește procesul de verificare obligatoriu.
- [ ] **Refactor în paralel:** spart `FoodMoodSwiper.tsx` (1169 linii) în hook-ul `useMoodCarousel` și componentele card, grid și controale.

## Etapa 3 · `fix/catalog-data`: nutriție, unități, etichete

**Agenți:** python-pro sau typescript-pro (scripturi), tdd-guide · **Mărime:** L

- [ ] `nutritionPer100g` (kcal, proteine, carbohidrați, grăsimi, fibre) pentru toate cele 111 ingrediente, din valori standard (sursa citată în cod).
- [ ] Kcal și macro pe porție calculate din gramaje. Test: suma ingredientelor e egală cu valoarea afișată (±5%).
- [ ] Unități: test care cere ca unitatea din rețetă să fie aceeași cu cea din catalog sau convertibilă; repar cele 26 de linii (avocado g→buc etc.); strat de conversie g↔buc↔legătură cu greutăți medii.
- [ ] Etichete recalculate: `high_protein` ≥ 28 g, `speedy` < 25 min, `light_dinner` ≤ 420 kcal pe noile valori; regex-urile de taguri devin pe cuvinte întregi (`/ton/`, `/tort/`).
- [ ] Mutarea `sweet_treat` pe rețete care nu apar niciodată ca desert.
- [ ] Verific că testele keto (Etapa 1) trec cu noii carbohidrați.
- [ ] **Refactor în paralel:** spart `recipes.ts` (3583 linii) pe categorii (`recipes/breakfast.ts`, `soups.ts`…).

## Etapa 4a · `fix/planner-store`: motor și store

**Agenți:** tdd-guide, typescript-pro, typescript-reviewer · **Mărime:** L

- [ ] Guard pentru zile fără mese (`dailyMealSlots: {monday: []}`) și pentru slot de desert fără candidați: fără TypeError.
- [ ] Un singur helper `collectMealsFromDays` (exclude resturile **și** mesele în oraș), folosit în toate cele ~10 agregări.
- [ ] `mergePurchased(prev, next)`: bifele supraviețuiesc reconstruirii coșului (B3).
- [ ] `budgetStatus` recalculat după swap și după adăugarea deserturilor; optimizarea de buget rulează după deserturi.
- [ ] Generare înainte de persistare în `updatePreferencesAndRebuild`; `generatePlan` întoarce succes sau eșec (S1).
- [ ] Jitter calculat o dată pe candidat, nu în comparator; `toggleEatOut` pe `meal.id` (S7); `undoCookDouble` restaurează masa înlocuită (S5); costul resturilor și al meselor în oraș nu se mai umflă (S6).
- [ ] Coadă de notificări în locul slotului unic (S9); acțiune `setAllPurchased` (S12); guard la re-intrare pentru sync și `triggerReload`.
- [ ] Șterg cele 7 acțiuni moarte și `themeMode`/`cycleThemeMode`, împreună cu testele lor.
- [ ] **Refactor în paralel:** `useAppStore.ts` (3540) spart în slice-uri (`planSlice`, `grocerySlice`, `cloudSlice`, `uiSlice`); `generateMealPlan` (~400 linii) spart în etape de pipeline; constante comune `constants/days.ts` și `utils/storeBadge.ts`.

## Etapa 4b · `fix/ui-buttons`: butoane și UI

**Agenți:** react-specialist, frontend-developer, code-reviewer · **Mărime:** L

- [x] B1 `BudgetSlider`: textul local e sursa de adevăr cât timp câmpul are focus; trimite valoarea la blur sau submit.
- [x] B2 `QuickFiltersModal`: resincronizare la deschidere.
- [x] `MealCard` încape la 390 px (butoane, macro, chip-uri, preț). Test de layout în Playwright.
- [x] Swap: candidați sortați după impactul în buget, cu badge „+X / −X lei”; AI-ul protejat cu request-id și `catch`.
- [x] Modalul de buget depășit reține ultimul cost refuzat în store, nu în componentă.
- [x] `GeneratingPlanModal`: callback stabil; swiper-ul cu guard de scroll corect, taste ignorate în inputuri și `useWindowDimensions`.
- [x] Confirmări: textul de reset corectat (există Undo); „Restaurează” se poate anula (Undo în loc de confirmare) și la golirea cămării; „3 Mese” activ nu mai regenerează; avertisment când se pierd modificări manuale (S2–S4).
- [x] Modale secvențiale pe iOS (notificări sub AuthModal sau RecipeDetail); `BiometricOptInPrompt` primește `onRequestClose` și suprimare completă.
- [x] Notițe: persistate local pe rețetă (partea de cloud vine în Etapa 5), resetate la schimbarea rețetei, cu evitare de tastatură; eticheta „Îmi place / Preferat ✓”.
- [x] Auth: protecție la dublu-tap prin `run()`, `catch` la reset și la verificarea codului, `onSubmitEditing`.
- [x] Accesibilitate: `accessibilityState` (`selected`/`checked`) pe tab-uri, segmente și bife; etichete fără emoji; butonul „✕” scos din Touchable-ul imbricat.
- [x] `UndoBanner`, `LoadingToast` și `InformativeNoticeModal`: animații corecte și cleanup.
- [x] Erorile înghițite din `GroceryScreen`, `MealBoardScreen` și `OnboardingWizard` devin mesaje vizibile.
- [x] Șterg `WeekOverview`; adaug selectori zustand (`useShallow`) și `React.memo` pe `MealCard`.
- [x] **Refactor în paralel:** `OnboardingWizard.tsx` (3125) devine o componentă pe pas + `useOnboardingState`.
- [ ] `RecipeDetailModal.tsx` (1665), `MealBoardScreen.tsx` (1174) și `MealCard.tsx` (929) sparte în subcomponente — **amânat** la cererea utilizatorului (cost mare, fără efect vizibil); de reluat când se lucrează oricum în ele.

## Etapa 5 · `fix/sync-backend`: sincronizări, AI, securitate

**Agenți:** backend-developer, ai-engineer (skill `claude-api`), security-reviewer · **Mărime:** L

- [ ] F1: identitatea vine din `getSession()` (offline-safe); `getUser()` cu timeout doar unde e nevoie de validare; mesajele disting „offline” de „deconectat”.
- [ ] F2: guard pentru „nu ai plan”; compare-and-swap pe `updated_at` (RPC `save_meal_plan_if_unchanged`) + dialog „versiune mai nouă în cloud”.
- [ ] F3: reminderele trimit doar câmpurile modificate (patch); se reîncarcă din cloud la hidratare și la revenirea în aplicație, deci dezabonarea e respectată.
- [ ] F4/F11: deconectarea și ștergerea contului golesc datele locale (inclusiv notițele `@smartmeal_recipe_notes`, adăugate în 4b) (cu confirmare dacă planul nu e urcat); mesaj despre anularea abonamentului din magazin.
- [ ] F6: simularea de abonament verifică și `NODE_ENV`; o eroare SDK tranzitorie nu mai arată paywall-ul.
- [ ] F7: reschedule după plan nou și după hidratare, serializat, cu debounce de 500 ms.
- [ ] F10: exportul raportează erorile pe secțiuni și include `display_name` și dispozitivele. F12: `secureSessionStore` raportează erorile de scriere.
- [ ] Notițe în cloud: migrarea `0010_user_recipe_notes.sql` (0009 a devenit salvarea condiționată a planului) (tabel + RLS doar pentru proprietar + grant-uri minime), teste în `test:sql`, export și ștergere la ștergerea contului.
- [ ] **Proxy AI → Claude Haiku:**
  - funcție nouă `proxy-ai-swap`;
  - `ANTHROPIC_API_KEY` din secretele Supabase;
  - `AI_MODEL` cu default `claude-haiku-5-5`;
  - răspuns structurat prin tool use, validat la granițe;
  - prompt caching pe system prompt;
  - câmpurile utilizatorului delimitate ca date;
  - flag `isFallback`, deci fallback-ul nu mai apare ca „AI”;
  - buget de timp server < timeout client;
  - 400 nu se mai contorizează în rate limit;
  - mesaj generic la 500;
  - evals înainte de schimbarea promptului (skill `eval-harness`).
- [ ] Securitate:
  - CORS închis implicit;
  - `delete-account` cere autentificare recentă (`iat` < 5 min sau reintroducerea parolei);
  - CSP pentru web (`public/index.html` + paginile statice, scripturile inline mutate în fișiere externe sau cu hash).
- [ ] `supabase/README.md`: deploy pentru toate funcțiile și lista de secrete.
- [ ] **Refactor în paralel:** `supabase.ts` spart pe domenii (`auth`, `plans`, `reminders`, `notes`).

## Etapa 6 · `chore/expo-sdk-upgrade`: dependențe și închidere

**Agenți:** debugger (dacă apar erori de build), code-reviewer · **Mărime:** M

- [ ] Upgrade Expo SDK 52 → cel mai recent stabil, cu `npx expo install --fix`.
- [ ] `npm audit --omit=dev`: 0 critice, iar high-urile rămase sunt justificate.
- [ ] Acoperire ≥ 87% instrucțiuni / 76% ramuri (pragul din `jest.config.js`), cu teste noi pentru ErrorBoundary, MealsPerDayModal, BudgetOverrunModal și BudgetSlider.
- [ ] Rulare completă Playwright + raport final de audit actualizat.

---

## Ce am nevoie de la tine (pe parcurs)

| Când          | Ce                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| La fiecare PR | Confirmarea pentru push și deschiderea PR-ului                                                                                              |
| Etapa 5       | Să setezi `ANTHROPIC_API_KEY` în secretele Supabase (eu nu văd și nu scriu cheia)                                                           |
| Etapa 5       | Să aplici migrarea 0009 și RPC-ul pe baza de date live (`supabase db push`) și să redeployezi funcțiile; eu le pregătesc și le testez local |
| Etapa 2       | Aprobarea planșei cu pozele noi înainte de commit                                                                                           |
| Etapa 1       | Aprobarea listei de alergeni ambigui adăugați                                                                                               |

## Riscuri

- **Etapa 3** schimbă caloriile, deci și bugetele minime și etichetele. Planurile utilizatorilor existenți se pot regenera diferit.
- **Etapele 4a și 4b** au refactor mare în paralel cu reparațiile. Risc crescut de regresii, atenuat de teste scrise întâi și de rularea cap-coadă.
- **Redenumirea ID-urilor (Etapa 2)** afectează datele din cloud. Alias-urile rămân permanent.
- **Migrarea pe Claude (Etapa 5)** e o schimbare de furnizor. Până la setarea cheii, aplicația cade pe fallback-ul local, ca acum.
- **Valorile nutriționale și prețurile ingredientelor noi** sunt estimări standard, marcate ca atare.
