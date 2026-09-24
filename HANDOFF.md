# HANDOFF.md

**Sesiune:** 2026-09-22 → 23 · ramura `fix/food-safety-and-cart-integrity`
**Ramura anterioară:** `audit/smartmeal-fixes` (PR #1) · `main` neatins

## Unde am rămas

Code review pe **toată** aplicația, nu doar pe diferența sesiunii: eu întâi, apoi doi agenți
(`code-reviewer` și `security-reviewer`) în paralel, iar la final am verificat empiric fiecare
afirmație a lor înainte s-o accept. Au ieșit 9 defecte reale. **Toate sunt reparate**, fiecare
cu testul care l-ar fi prins. Apoi a fost cablată sincronizarea descendentă din cloud (ADR-11),
iar cardurile de rețetă au fost aduse pe un singur șablon (ADR-14). Teste: 434 → 526.

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

- **Sincronizarea merge acum în ambele sensuri** (ADR-11). Din ecranul de cont: „⬆ Urcă
  planul de aici" și „⬇ Adu planul de pe alt dispozitiv". Ce trebuie știut despre regula de
  conflict: nimic local nu se suprascrie fără confirmare, planul înlocuit rămâne recuperabil
  cu Anulează, alergiile sunt **uniunea** celor două dispozitive, iar planul descărcat trece
  prin `makePlanSafeForPreferences` cu coșul recalculat local.
  **Ce a rămas nefăcut:** nu se declanșează automat la pornire sau la autentificare. E o
  alegere, nu o scăpare — vezi ADR-11 pentru de ce comparația automată de timp ar minți.
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

- **Orice agregare a coșului ia acum 6 argumente**, nu 5: s-a adăugat `pantryStock`. Și
  **orice loc care adună mese trebuie să sară peste `meal.isLeftover`**, altfel ingredientele
  unei mese reîncălzite se cumpără de două ori.
- **Alergiile și dieta sunt restricții dure pe cinci uși**: generare, restaurare, hidratare,
  `replaceMealWithRecipe` și **descărcarea din cloud**. Dacă adaugi a șasea cale prin care o
  masă ajunge la utilizator, trece-o prin `makePlanSafeForPreferences` sau
  `describeUnsafeRecipe`.
- **Datele din cloud sunt la fel de neîncrezute ca storage-ul local** — același
  `isWellFormedPlan`. Un rând scris de o versiune mai veche a aplicației nu trebuie să poată
  strica dispozitivul ăsta.
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
  bine" pentru poze care arătau căști audio la mâncare de fasole. A doua oară, o poză corectă
  ca preparat arăta piure lângă o rețetă cu varză — deci nu e destul să fie felul potrivit,
  trebuie să fie și ingredientele potrivite. Un test nu poate verifica asta. Din ADR-14 nu se
  mai afișează nicio fotografie clară, deci regula se aplică acum doar fundalurilor.
- **Întreabă ce înseamnă „bine" înainte să repari o problemă vizuală.** Am reparat patru
  defecte reale (registru greșit, două arhetipuri greșite, raportul cardului) înainte să aflu
  că se cerea de fapt consecvență, nu corectitudine bucată cu bucată. Patru reparații corecte
  la altă problemă decât a lui tot înseamnă eșec.
- **Cardul de rețetă arată centrul vertical al pozei** (`resizeMode="cover"`), nu toată poza.
  Când judeci o fotografie, judec-o pe banda din mijloc, la raportul cardului — nu ca imagine
  de sine stătătoare. Raportul e acum fixat prin `aspectRatio` (ADR-13); înainte era înălțime
  fixă, ceea ce făcea din fiecare poză o fâșie de 7:1 pe desktop.
- `npm run test:coverage` — praguri în `jest.config.js`. Acum: 88,04 instrucțiuni / 66,27
  ramuri / 86,68 funcții / 89,34 linii. Când pică, adaugă
  teste — nu coborî pragul. Ecranele cu cea mai slabă acoperire, deci cele mai profitabile
  de atacat: `PantryInventoryModal` (22%), `GroceryScreen` (29%), `SnacksAndDrinksModal` (45%).

## Ce s-a construit după audit

Patru funcții noi, fiecare cu testele ei:

- **Surplusul din ambalaje se reportează în cămară** (ADR-15). Coșul cumpără pachete întregi,
  deci o săptămână care cere 270 g de orez cumpără un kil. Restul intră acum în `pantryStock`
  și se scade din lista următoare. Măsurat: săptămâna 1 costă 425 lei, săptămâna 2 costă 246.
- **Planificatorul ține minte.** Deget în jos = filtru dur, ca dieta și alergenii, refuzat
  dacă ar goli catalogul. Deget în sus = punctaj, niciodată o portiță peste o regulă.
- **Gătesc o dată, mănânc de două ori.** Porție dublă într-o zi, a doua zi doar reîncălzită.
  Masa reîncălzită e sărită de **toate** cele 16 locuri care construiesc lista de cumpărături.
- **Catalogul a crescut de la 82 la 100 de rețete** (ADR-16), toate cele 18 noi fiind vegane
  **și** fără gluten — exact cele două diete care aveau sub 7 feluri pe slot și forțau
  repetiții. Acum orice dietă are cel puțin 8 per slot, iar `noRepeats.test.ts` verifică pe
  toate șase dietele că nu se repetă nimic: nici în aceeași zi, nici în zile consecutive,
  nici în toată săptămâna.
- **Interfață:** comutator de temă (sistem / luminoasă / întunecată, ținut minte), vedere pe
  săptămână lângă cea zi-cu-zi, mod cumpărături cu rânduri mari și ecran ținut aprins.

## Ce a mai rămas, și pentru cine

Doar lucruri care cer credențialele tale:

0. **Două fundaluri lipsă: `salad` și `wrap`.** Cele 5 rețete din acele arhetipuri rămân pe
   gradient, vizibil diferite de restul. Nu le pot rezolva eu: nu există nicio fotografie
   sursă din acele categorii, iar împrumutul din alt arhetip e exact greșeala pe care ADR-07
   o interzice. Îți trebuie două poze — o salată și un wrap — trecute prin aceeași
   prelucrare ca celelalte (`scripts/generateBackdrops.md`).
1. **Rulează migrația `0001_user_meal_plans.sql`.** Fără ea nu există RLS, iar cheia `anon`
   (publică prin design) ar putea citi planurile altora. Obligatoriu înainte de orice deploy
   cu cloud activ.
2. **Publică funcția edge și setează `ALLOWED_ORIGINS`.** Pașii: `supabase/README.md`.

## Întrebări pentru tine

Niciuna deschisă. Sincronizarea descendentă e cablată cu regula din ADR-11; dacă vrei să se
declanșeze automat la autentificare, în loc de un buton, adaugă întâi un `updatedAt` real pe
`MealPlan` — fără el, orice comparație automată de timp alege greșit.
