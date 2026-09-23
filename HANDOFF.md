# HANDOFF.md

**Sesiune:** 2026-09-22 → 23 · ramura `fix/food-safety-and-cart-integrity`
**Ramura anterioară:** `audit/smartmeal-fixes` (PR #1) · `main` neatins

## Unde am rămas

Code review pe **toată** aplicația, nu doar pe diferența sesiunii: eu întâi, apoi doi agenți
(`code-reviewer` și `security-reviewer`) în paralel, iar la final am verificat empiric fiecare
afirmație a lor înainte s-o accept. Au ieșit 9 defecte reale. **Toate sunt reparate**, fiecare
cu testul care l-ar fi prins. Teste: 434 → 496.

## Următorul pas exact

**Privește aplicația cu ochii.** `npm run web`, din cache gol: onboarding → plan → rețetă →
swap → cumpărături → planuri salvate.

Partea mecanică e acoperită de `src/__tests__/appJourney.component.test.tsx`, care montează
componenta reală și trece prin toate ecranele — nu vei găsi un ecran care nu pornește. **Ce
rămâne de verificat cu ochii: aspectul.** Dacă textele intră în spațiu, dacă efectele „glass"
sunt intacte, și dacă noile carduri de rețete arată apetisant.

## Ce am găsit și am reparat în review-ul ăsta

| #   | Ce era                                                                      | Sev.       | Cum am dovedit-o                                          |
| --- | --------------------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| 1   | Dieta „Fără Gluten" avea propria listă de ingrediente, divergentă           | **CRITIC** | ~3 mese cu gluten / plan, în toate cele 8 configurații    |
| 2   | `hydrateStorage` nu revalida planul încărcat față de preferințe             | **CRITIC** | 7 mese cu alergenul declarat, 13 contra dietei, fără notă |
| 3   | `swapMeal` lăsa totalul coșului desincronizat de listă                      | MAJOR      | antet 469,15 lei vs listă 461,81 lei                      |
| 4   | Un `CURRENT_PLAN` corupt ștergea arhiva de planuri **și** preferințele      | MAJOR      | 5 forme de corupție, toate pierdeau tot                   |
| 5   | Alergii ilizibile → mesaj despre fezabilitatea planului, care n-avea treabă | MAJOR      | text reprodus la hidratare                                |
| 6   | 7 setări ale wizardului nu reconstruiau planul peste un plan viu            | MEDIU      | aripioare de pui rămâneau după trecerea la vegetarian     |
| 7   | `replaceMealWithRecipe` accepta orice rețetă, fără verificare proprie       | MEDIU      | capcană pentru următorul apelant, nu gaură vie azi        |
| 8   | Sugestia AI rămânea pe ecran la redeschiderea pentru altă zi                | MINOR      | test de componentă care pică fără reparație               |
| 9   | `ALLOWED_ORIGINS` lipsea din pașii de deploy → CORS `*`                     | MINOR      | absent din `supabase/README.md`                           |

## Trei afirmații ale agenților pe care **nu** le-am acceptat

Le-am verificat și nu stau în picioare. Sunt aici ca să nu fie reinvestigate:

- **„Testul de invarianți al repo-ului nu are assert"** — era fișierul meu de diagnostic din
  sesiune (`src/__review__/`, netracked, șters). Agentul l-a citit ca fiind cod al proiectului.
- **„`restoreSavedPlan` poate lăsa zile fără mese"** — nereproductibil. Cea mai strictă
  combinație atinsă din UI (vegan + toți cei 14 alergeni) lasă tot 8 rețete eligibile;
  catalogul nu se golește niciodată. Gardă defensivă lipsă, nu defect viu.
- **„Ingrediente fără preț apar gratis în listă"** — golul nu există: toate cele 94 de
  ingrediente au preț la toate cele 8 magazine.

## Ce e blocat / incomplet

- **Sincronizarea în cloud e doar în sus.** `cloudSyncService.loadMealPlan` este scrisă și
  testată, dar **nu o apelează nimic din aplicație**. Un al doilea dispozitiv nu primește
  niciodată planul. Nu am cablat-o: descărcarea peste un plan local cere o decizie de
  rezolvare a conflictelor (cine câștigă, ce se întâmplă cu alergiile divergente), care e
  proiectare de produs, nu reparație de bug. Când o faci, trece planul descărcat prin
  `makePlanSafeForPreferences`, ca la hidratare.
- **Deploy funcție edge Supabase** — cere CLI-ul, proiect legat și credențialele tale.
  Pașii: `supabase/README.md`, acum cu `ALLOWED_ORIGINS` inclus.
- **Migrația `supabase/migrations/0001_user_meal_plans.sql`** — scrisă, **nerulată**.
  Include RLS; fără ea, cheia `anon` (publică prin design) ar putea citi planurile altora.
- **Limitarea de rată a funcției edge e în memorie**, deci se resetează la reciclarea
  izolatului și nu se coordonează între instanțe. E scris în comentariul funcției. Dacă
  ajunge la trafic real, mută-o într-un depozit partajat.
- **Verificarea vizuală** — extensia Claude in Chrome nu e conectată în sesiune.
- **Vulnerabilitățile npm — 6 high rămase**, aceleași două probleme `image-size`, doar în
  lanțul Metro (ADR-09). Reverificat pe build-ul acestei ramuri: niciunul dintre cele patru
  pachete și nicio cheie nu apar în bundle-ul livrat de 1,2 MB.

## Capcane

- **Alergiile și dieta sunt restricții dure pe patru uși**: generare, restaurare, **hidratare**
  și `replaceMealWithRecipe`. Dacă adaugi a cincea cale prin care o masă ajunge la utilizator,
  trece-o prin `makePlanSafeForPreferences` sau `describeUnsafeRecipe`.
- **Nu reintroduce o a doua listă de ingrediente pentru gluten.** Vezi ADR-10. Sursa unică e
  `INGREDIENT_ALLERGENS` din `src/data/allergens.ts`.
- **Orice agregare a coșului ia 5 argumente**, nu 3: magazin, excludePantryStaples, **extra**
  și **cămară**. `swapMealInPlan` era singura care le omitea pe ultimele două.
- **`applyPreferenceStep` păstrează onboardingul neatins** — reconstruiește doar dacă există
  deja un plan. Nu-l înlocui cu `applyPreferencesWithRebuild` direct: poarta de fezabilitate
  a acestuia ar bloca stările intermediare din wizard.
- **Nu rula `npm audit fix --force`** — urcă la Expo SDK 57 și anulează alinierea RN 0.76.9.
- **Nu urca `image-size` la v2** — rupe `metro/src/Assets.js`. Verificat.
- **`appliances: []` înseamnă „nu necesită niciun aparat"**, nu „lipsă date". Vezi ADR-08.
- Testele rulează în **două proiecte Jest**. Un test care importă `react-native` trebuie numit
  `*.component.test.tsx`, altfel cade în proiectul Node și nu găsește resolverul RN.
- `PLAN.md` și `SPEC.md` au fost șterse pe 2026-09-23 (erau istorice). Starea reală a
  proiectului e în acest fișier; motivele deciziilor, în `DECISIONS.md`.

## Unelte utile pe proiectul ăsta

- **Scrie un test-sondă care rulează fiecare acțiune și verifică invarianții după fiecare.**
  Așa am găsit 3 din cele 9 în câteva minute, inclusiv două pe care ambii agenți le rataseră.
  Nu ține fișierul în repo dacă nu are assert — sau pune-i assert și lasă-l.
- Agenții `code-reviewer` și `security-reviewer` rulați în paralel pe tot proiectul: împreună
  au găsit 6 din 9, iar unul singur a găsit cel mai grav defect (glutenul). **Dar 3 din
  afirmațiile lor erau false.** Verifică fiecare afirmație empiric înainte s-o accepți.
- **Verificarea imaginilor cere ochi, nu cod de status.** Am raportat o dată „HTTP 200, totul
  bine" pentru poze care arătau căști audio la mâncare de fasole.
- `npm run test:coverage` — praguri în `jest.config.js`. Acum: 85,21 instrucțiuni / 64,18
  ramuri / 84,03 funcții / 85,87 linii. **Funcțiile sunt la 0,03% peste prag**, deci prima
  funcție netestată pe care o adaugi face poarta roșie. Când se întâmplă, adaugă teste — nu
  coborî pragul. Ecranele cu cea mai slabă acoperire, deci cele mai profitabile de atacat:
  `PantryInventoryModal` (22%), `GroceryScreen` (29%), `SnacksAndDrinksModal` (45%).

## Întrebări pentru tine

Niciuna deschisă din review. Singura decizie care te așteaptă e **sincronizarea descendentă**:
o vrei cablată, și cu ce regulă de conflict?
