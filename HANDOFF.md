# HANDOFF.md

**Sesiune:** 2026-09-22 → 23 · ramura `audit/smartmeal-fixes` (22 commit-uri, pushed)
**PR:** https://github.com/teo-eleven/smartmeal-ro/pull/1 · `main` neatins

## Unde am rămas

Audit transversal peste Fazele 1-8, care erau deja implementate. 12 defecte găsite și reparate
(3 critice), plus cele 10 puncte din lista „ce merită construit", plus **toate constatările din
review-ul de închidere**. Testele au crescut de la 80 la 428. Nu a rămas nimic din listă nereparat.

## Următorul pas exact

**Faza 9 — privește aplicația.** `npm run web`, din cache gol: onboarding → plan → rețetă →
swap → cumpărături → planuri salvate.

Partea mecanică e acum acoperită de `src/__tests__/appJourney.component.test.tsx`, care
montează componenta reală și parcurge toate ecranele — deci nu vei găsi un ecran care nu
pornește. **Ce rămâne de verificat cu ochii: aspectul.** Dacă arată bine, dacă textele intră
în spațiu, dacă efectele „glass" sunt intacte după cele 36 de locuri atinse la refactorizare,
și dacă noile carduri de rețete arată apetisant.

## Ce e blocat

- **Deploy funcție edge Supabase** — cere CLI-ul Supabase, proiect legat și credențialele tale.
  Pașii: `supabase/README.md`. Funcția e acum securizată (rate limiting, plafoane, CORS
  configurabil prin `ALLOWED_ORIGINS`), deci se poate publica în siguranță.
- **Migrația `supabase/migrations/0001_user_meal_plans.sql`** — scrisă, **nerulată**.
  `supabase db push` sau din SQL editor. Include RLS; fără ea, cheia `anon` (publică prin design)
  ar putea citi planurile altora.
- **Verificarea vizuală** — extensia Claude in Chrome nu e conectată în sesiune.
- **Vulnerabilitățile npm — rezolvate** prin `overrides`, fără upgrade de SDK (ADR-09).
  23 → 6, iar cele 6 rămase sunt aceleași două probleme `image-size` (DoS prin imagini
  malformate, ar trebui să le pui tu în assets). `image-size` v2 rupe Metro, verificat.

## Din review — stare

**Toate reparate.** Ce a ieșit și ce s-a făcut:

| Problemă                                                                        | Sev.       | Stare                                                                   |
| ------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `restoreSavedPlan` ștergea alergiile declarate și servea mese care le conțineau | **critic** | reparat — alergii = uniune, mesele revalidate, notificare explicită     |
| `avoidedAllergens: null` în storage arunca tăcut toate preferințele salvate     | major      | reparat — listă validată, restul preferințelor păstrate                 |
| Sincronizarea cloud trimitea **emailul** în coloana `user_id` (uuid, cu RLS)    | major      | reparat — folosește id-ul autentificat; eșecurile sunt raportate        |
| Schema Supabase nu exista nicăieri în repo                                      | major      | scrisă ca migrație 0001, cu RLS și trigger                              |
| Funcție edge: CORS `*`, fără rate limiting, fără plafoane pe prompt             | major      | reparat — toate trei, plus validare server-side a răspunsului modelului |
| `hydrateStorage` pretindea „Setări restaurate" chiar când reparația nu reușise  | major      | reparat — reverifică după fiecare pas și spune dacă tot nu merge        |
| `setSupermarket` lăsa tăcut o rețetă pe care magazinul nu o are                 | major      | reparat — decizie extrasă în funcție pură testată + notificare          |
| `loadSavedPlans` valida doar `Array.isArray`                                    | minor      | reparat — intrările malformate sunt eliminate la citire                 |
| `PlanHeader` — `setTimeout` fără cleanup                                        | minor      | reparat, cu test pe unmount                                             |
| `quickStart` muta un obiect `const`                                             | minor      | reparat — imutabil                                                      |
| `selectOptimalDessertForDay` fără test                                          | minor      | 7 teste adăugate                                                        |
| Duplicare în `recipeVisual` și în stilurile celor două modale                   | minor      | extrase în `getCharacterfulIngredientIds` și `src/styles/sheet.ts`      |
| `INCOMPATIBLE_PAIRS` lista ambele direcții                                      | low        | normalizat                                                              |
| `PLAN.md` descria o arhitectură inexistentă                                     | doc        | marcat ca intenție istorică, cu tabel comparativ                        |

## Capcane

- **Nu rula `npm audit fix --force`** — urcă la Expo SDK 57 și anulează alinierea RN 0.76.9.
  Vulnerabilitățile sunt deja tratate prin `overrides` în `package.json`; nu le scoate.
- **Nu urca `image-size` la v2** — rupe `metro/src/Assets.js` (`getImageSize is not a function`).
  Build-ul de producție eșuează. Verificat.
- **Rulează migrația 0001 înainte de orice deploy cu cloud.** Fără RLS, cheia `anon` vede tot.
- **Setează `ALLOWED_ORIGINS`** în secretele Supabase la publicarea funcției edge; lăsat gol
  înseamnă CORS `*`, potrivit doar în dezvoltare.
- **`appliances: []` înseamnă „nu necesită niciun aparat"**, nu „lipsă date". Vezi ADR-08.
- **Alergiile sunt restricție dură pe ambele uși** — generare _și_ restaurare. Dacă adaugi o a
  treia cale prin care mesele ajung la utilizator, trece-o prin `makePlanSafeForPreferences`.
- Testele rulează în **două proiecte Jest**. Un test care importă `react-native` trebuie numit
  `*.component.test.tsx`, altfel cade în proiectul Node și nu găsește resolverul RN.
- `PLAN.md` pașii 1-11 sunt istorici. Starea reală: Step 12 și acest fișier.

## Unelte utile pe proiectul ăsta

- Agenții `code-reviewer` și `security-reviewer`, rulați pe `git diff <commit>..HEAD` — amândoi au
  găsit defectul de restaurare a planurilor, pe care eu îl ratasem. Merită rulați la fiecare
  închidere de sesiune.
- **Verificarea imaginilor cere ochi, nu cod de status.** Am raportat o dată „HTTP 200, totul bine"
  pentru poze care arătau căști audio la mâncare de fasole. Pillow e instalat; planșe de contact.
- `npm run test:coverage` — praguri în `jest.config.js`, pică dacă acoperirea scade sub 83% (instrucțiuni și linii).

## Întrebări pentru tine

Niciuna deschisă. Scratchpad-ul e curățat, ramura e pushed, PR-ul e deschis (#1).
Următoarea decizie e a ta, după ce te uiți prin aplicație: merge sau mai lucrăm la ea.
