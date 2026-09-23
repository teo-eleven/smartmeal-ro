# HANDOFF.md

**Sesiune:** 2026-09-22 → 23 · ramura `audit/smartmeal-fixes` (18 commit-uri, **nimic pushed**, `main` neatins)

## Unde am rămas

Audit transversal peste Fazele 1-8, care erau deja implementate. Am găsit și reparat 12 defecte
(3 critice), am adăugat cele 10 puncte din lista „ce merită construit", și am dus testele de la
80 la 384. Aplicația rulează, build-ul de producție trece, totul e commis.

## Următorul pas exact

**Faza 9 / Step 11 — verificare end-to-end manuală.** `npm run web`, apoi parcurge din cache gol:
onboarding → generare plan → detaliu rețetă → swap → listă cumpărături. **Niciun om n-a dat click
prin aplicație după schimbările de azi** — toată verificarea de până acum e automată. Începe cu
`src/screens/onboarding/OnboardingWizard.tsx`, pasul 1 („Sari peste întrebări").

## Ce e blocat

- **Deploy funcție edge Supabase** — cere CLI-ul Supabase, proiect legat și credențialele contului.
  Pașii: `supabase/README.md`. Până atunci AI-ul folosește selecția deterministă (funcționează).
- **Verificarea vizuală** — extensia Claude in Chrome nu e conectată în sesiune.
- **Cele 23 de vulnerabilități npm** — toate tranzitive prin tooling-ul de build (Metro, Expo CLI,
  tar, postcss), niciuna în codul livrat. Cer Expo SDK 52 → 57. Decizie: nu se atacă acum.

## Din review — rămase nereparate

Reparat azi (aprobat de tine): restaurarea planurilor salvate ștergea alergiile declarate și
servea mese care le conțineau; `null` în storage arunca tăcut toate preferințele salvate.

| Fișier                                                       | Sev.                        | Problemă                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/store/useAppStore.ts` — `setSupermarket`                | major                       | Dacă nu există alternativă compatibilă cu noul magazin, rețeta incompatibilă **rămâne tăcut** în plan. `if (chosen)` eșuează fără notificare. Netestat cazul „zero alternative".                                                                              |
| `src/services/storage.ts` — `loadSavedPlans`                 | minor                       | Validează doar `Array.isArray`, nu forma intrărilor. `restoreSavedPlan` refuză acum elegant intrările corupte, dar sursa rămâne nevalidată.                                                                                                                   |
| `src/components/PlanHeader.tsx:30`                           | minor                       | `setTimeout(2400ms)` fără cleanup → update de state pe componentă demontată dacă utilizatorul navighează în acel interval.                                                                                                                                    |
| `src/store/useAppStore.ts` — `quickStart`                    | minor                       | Mută `quickPrefs.budgetRon` prin atribuire directă. Încalcă regula de imutabilitate din `CLAUDE.md`, singurul loc din fișier care o face.                                                                                                                     |
| `src/engine/plannerEngine.ts` — `selectOptimalDessertForDay` | minor                       | 7 reguli de scor, apelată din 4 locuri, **fără test dedicat**. Preexistentă, nu din sesiunea asta.                                                                                                                                                            |
| `src/utils/recipeVisual.ts:151` și `:266`                    | minor                       | Derivarea „ingrediente semnificative" duplicată în două funcții.                                                                                                                                                                                              |
| `StoreComparisonModal` / `SavedPlansModal`                   | minor                       | Stiluri `backdrop`/`sheet` copiate identic.                                                                                                                                                                                                                   |
| `supabase/functions/proxy-gemini-plan`                       | major _(înainte de deploy)_ | CORS `*`, fără rate limiting, fără plafon pe `candidateRecipeIds`/`userPrompt`, autentificare doar cu cheia `anon` care e publică prin design. Odată deployat, oricine poate consuma cota Gemini plătită de tine. **De rezolvat înainte de deploy, nu după.** |
| `src/utils/dietCompatibility.ts:56`                          | low                         | `INCOMPATIBLE_PAIRS` listează ambele direcții, deși comparația e simetrică.                                                                                                                                                                                   |

## Capcane

- **Nu rula `npm audit fix --force`** — urcă la Expo SDK 57 și anulează alinierea RN 0.76.9 făcută
  la începutul sesiunii. Aplicația se rupe.
- **Schema Supabase nu există în repo.** `src/services/supabase.ts:106,138` așteaptă tabelul
  `user_meal_plans` (`user_id`, `plan_data`, `grocery_items`, `updated_at`, unic pe `user_id`).
  Nicio migrație, niciun `.sql`. Trebuie scrisă înainte de orice deploy cu cloud.
- **Preferințele nu se sincronizează în cloud** — doar planul și lista. Pe alt dispozitiv,
  **alergiile nu te urmează**. Preexistent, dar acum contează mai mult.
- **`appliances: []` înseamnă „nu necesită niciun aparat"**, nu „lipsă date". Vezi ADR-08.
- Testele rulează în **două proiecte Jest**. Un test care importă `react-native` trebuie numit
  `*.component.test.tsx`, altfel cade în proiectul Node și nu găsește resolverul RN.
- `PLAN.md` pașii 1-11 descriu Expo Router, NativeWind și `spikes/` — **nu există**. Aplicația
  folosește `src/screens/` cu StyleSheet. Nu te lua după ei.

## Unelte utile pe proiectul ăsta

- Agenții `code-reviewer` și `security-reviewer` — rulați pe `git diff <commit>..HEAD` au găsit
  amândoi defectul de restaurare a planurilor, pe care eu îl ratasem. Merită rulați la fiecare
  închidere de sesiune.
- **Verificarea imaginilor cere ochi, nu cod de status.** Am raportat o dată „HTTP 200, totul bine"
  pentru poze care arătau căști audio la mâncare de fasole. Descarcă și privește (Pillow e instalat,
  planșe de contact în scratchpad).
- Jest cu `--coverage` are praguri în `jest.config.js` (80% instrucțiuni și linii); pică dacă scad.

## Întrebări pentru tine

1. **`setSupermarket` cu zero alternative** — lăsăm rețeta incompatibilă cu avertisment, sau
   refuzăm schimbarea magazinului (ca la combinațiile imposibile)?
2. **Funcția edge** — o securizăm înainte de deploy (rate limiting + plafoane), sau o lăsăm
   nedeployată până există un plan de cost?
3. **Sincronizarea preferințelor în cloud** — o adăugăm? Fără ea, alergiile rămân pe un dispozitiv.
4. **Fișiere de lucru în scratchpad** (16, inclusiv backup la `.env` și `package-lock.json`) —
   le șterg? `.env` nu e în git, deci backup-ul e singura copie.
