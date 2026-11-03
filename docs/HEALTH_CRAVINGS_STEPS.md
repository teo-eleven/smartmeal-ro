# Pașii mici: pofte, sănătate, rețete

Planul mare, cu motivele și sursele, este în `docs/HEALTH_CRAVINGS_PLAN.md`. Aici e lista de lucru:
pași mici, unul câte unul, bifați pe măsură ce se termină.

## Deciziile tale (2026-10-30)

| Întrebare                   | Decizie                                                                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numele obiectivelor         | **Nume noi + boala ca informație** în descriere („Criterii folosite în ghidurile pentru…. Nu înlocuiește medicul.”)                                                                                                                                   |
| Validare externă            | **Dietetician autorizat + avocat.** Obiectivele se fac cât mai riguros, cu surse, ca să treacă de amândoi fără corecturi jenante                                                                                                                      |
| Cont Apple                  | **Persoană fizică.** Pe iOS, obiectivele de sănătate sunt ascunse până există firmă                                                                                                                                                                   |
| „Mâncare caldă & nutritivă” | **Redefinită strict**                                                                                                                                                                                                                                 |
| Obiective noi               | **Fier, Puțină sare, Ovăz și orz (colesterol), Sarcină (filtru de siguranță)**, plus ce am mai propus: **Calciu și vitamina D**, **B12 pentru vegani** (mesaj de informare)                                                                           |
| Post                        | **Complet + parțial (miercuri și vineri) + dezlegare la pește**                                                                                                                                                                                       |
| Rețete noi                  | **70+**                                                                                                                                                                                                                                               |
| Testare                     | **Completă la finalul fiecărei etape** (poarta de tester de mai jos)                                                                                                                                                                                  |
| Sync real                   | **Supabase local pe Mac** (Docker + Supabase CLI)                                                                                                                                                                                                     |
| Temă vizuală (2026-11-02)   | **„Midnight Forest & Smoked Walnut”**: verde pădure, nuc afumat, crem și bronz, după imaginea trimisă (Etapa T). **Fundal: verde pădure întunecat**; aplicația rămâne în mod întunecat (varianta crem există în temă, verificată, dar nu se afișează) |

Amânate, cu motiv: low-FODMAP (datele Monash sunt proprietare), gută (nu există date deschise despre purine). Nu le oferim deloc: diabet gestațional, boală de rinichi, warfarină, IMAO, tulburări de alimentație.

## Cum lucrăm

- **Un pas = o bucată mică**, testată și salvată într-un commit local. După fiecare pas îți spun în 2–3 rânduri ce s-a schimbat și pornesc următorul doar cu OK-ul tău.
- **O etapă = o ramură.** Push și PR doar cu acordul tău (`/pr`).
- **Teste întâi** pentru logică (`tdd-guide`): testul care pică, apoi codul.
- Uneltele din starter kit apar la fiecare pas, în coloana „Unealtă”.
- Cost: fiecare pas e mic, dar planul are ~75 de pași. Etapa E (70+ rețete) e cea mai mare. La începutul fiecărei etape îți spun cât estimez.
- **Riscuri anticipate și prevenire:** fiecare etapă are o secțiune cu ce s-ar putea strica peste 6–12 luni (date deja salvate, conexiune slabă, apăsări duble, schimbări de dependințe) și ce am pus în cod ca să nu se întâmple.
- **Întrebări cu răspuns scurt:** fiecare întrebare are variante numerotate (1A, 1B…), cu cea recomandată marcată; poți răspunde „1A, 2B” sau „ACCEPT RECOMANDĂRILE”.
- **Când pică ceva:** raport scurt de cauză: de ce s-a întâmplat, ce garanție adăugăm ca să nu se repete, ce altceva ar putea fi afectat, apoi testele reluate.
- **Doar rezultate reale:** raportez numai teste rulate cu adevărat, cu cifrele lor. Niciun rezultat „simulat”.

## Poarta de tester (la finalul fiecărei etape)

Intru în rolul de tester și verific **etapa nouă + tot ce exista înainte**. Etapa nu se închide până nu trece tot.

1. **Verificări automate:** `npm run typecheck`, `npm run lint`, `npm run test:sql`, testele de logică, testele de componente (`--maxWorkers=2`), plus acoperire ≥ 80% pe fișierele noi (`/test-coverage`, `/quality-gate`).
2. **Sync real pe Supabase local** (suita construită în Etapa 0), pe conturi de test create și șterse automat:
   - cont nou și confirmarea consimțămintelor;
   - salvarea și încărcarea planului pe două „dispozitive”;
   - conflictul de versiuni (CAS, migrarea 0009);
   - notițele rețetelor (migrarea 0010), mementourile, preferințele noi;
   - deconectarea care șterge datele de pe telefon și ștergerea contului.
3. **Aplicația pornită în browser** (Playwright), pe fluxurile reale:
   - onboarding complet, generare, schimbare de masă, lista de cumpărături, detaliul rețetei, setări;
   - capturi de ecran la 390 px lățime (telefon), ca să prind textele care ies din card.
4. **Teste adversariale, unde etapa le atinge:** date corupte sau vechi, valori la limită, apăsări duble, conexiune pierdută, încercări de ocolire a regulilor (alt cont, adrese sau texte trucate).
5. **Review de cod:** `code-reviewer` + `typescript-reviewer`. `security-reviewer` intră când etapa atinge date de sănătate, onboarding, sync sau cont.
6. **Raport de tester în română:** ce a trecut, ce a picat (cu dovada), ce am reparat. Problemele se repară cu `debugger` înainte de închidere.
7. **Documentație:** `doc-updater` actualizează planul și README-ul. Bifez pașii aici.

---

## Etapa 0 · Pregătirea testării (o dată, înaintea tuturor)

Ramura: `chore/test-harness`

| #   | Pas                                                                                                                                                                                                                                                                                               | Unealtă                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 0.1 | ✅ Docker Desktop (instalat de Claude, pornit) și Supabase CLI (dependență npm, fără Homebrew)                                                                                                                                                                                                    | –                                  |
| 0.2 | ✅ Supabase local (`npm run db:start` / `db:stop` / `db:reset` / `db:status`): migrările 0001–0010 aplicate pe Postgres 17, RLS activ pe toate cele 7 tabele, accesul anonim refuzat                                                                                                              | `database-migrations`              |
| 0.3 | ✅ `.env.test` cu cheile **locale** (ignorat de git, cheia de administrator fără `EXPO_PUBLIC_`); `http` permis doar spre 127.0.0.1/localhost, doar în dezvoltare, fără credențiale în adresă                                                                                                     | `security-reviewer`                |
| 0.4 | ✅ `npm run test:sync` pe baza locală: cont nou cu consimțământ, plan salvat pe telefon și deschis pe laptop, izolare între conturi și față de vizitatori, conflict între două dispozitive (0009); metodele serviciului nu mai depind de `this`                                                   | `tdd-guide`                        |
| 0.5 | ✅ Notițe pe două dispozitive (scriere, editare, ștergere, limita de 2000 de caractere), mementouri (inclusiv dezabonarea prin email care nu se pierde), deconectare doar pe dispozitivul curent, ștergerea contului prin funcția de server (parolă greșită = nimic șters; corectă = tot dispare) | `tdd-guide`                        |
| 0.6 | ✅ Teste E2E în browser (`npm run test:e2e`, port 8099), cu gardă automată contra serverului real                                                                                                                                                                                                 | `frontend-developer`               |
| 0.7 | ✅ Poarta de tester pe aplicația de azi: `docs/testing/BASELINE_REPORT.md`. Partea de sync real se adaugă după 0.2–0.5                                                                                                                                                                            | reviewerii + Playwright            |
| 0.8 | CI pe GitHub (Actions): la fiecare push rulează tipurile, lint-ul, testele SQL, Jest și E2E; sync-ul real rămâne local (cere Docker)                                                                                                                                                              | `doc-updater`, `security-reviewer` |

---

## Etapa T · Tema „Midnight Forest & Smoked Walnut”

Ramura: `feat/forest-walnut-theme`. Paleta extrasă din imaginea trimisă (eșantioane măsurate pe pixeli):

| Rol                                 | Nuanță             | Cod de pornire                               |
| ----------------------------------- | ------------------ | -------------------------------------------- |
| Fundal deschis                      | crem               | `#DDD1C1` (carduri mai deschise, ~`#F3ECE1`) |
| Fundal întunecat, titluri pe crem   | verde pădure adânc | `#1E2114`                                    |
| Suprafețe verzi                     | verde pădure mediu | `#474C3D`                                    |
| Accent principal (butoane)          | nuc afumat         | `#845B43` → `#64402C` → `#583925`            |
| Linii fine, insigne, text pe închis | bronz / șampanie   | `#B08868`                                    |

Codurile exacte se ajustează în T.1 doar cât e nevoie pentru contrastul cerut de accesibilitate (WCAG AA).

| #    | Pas                                                                                                                                                                                                                                                                                                                                                     | Unealtă                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| T.1  | ✅ Paleta `FOREST_WALNUT_PALETTE` în `src/styles/theme.ts` + 19 teste: rolul fiecărei nuanțe și contrastul WCAG AA (text 11–14:1, minimul cerut e 4,5:1)                                                                                                                                                                                                | `tdd-guide`                     |
| T.2  | ✅ Tema aplicată prin `getAppTheme` și prin stilurile web (sticlă, pastile, butoane), toate derivate din paletă; capturi înainte/după                                                                                                                                                                                                                   | `frontend-developer`            |
| T.3  | ✅ Accentul unic: jetoanele `primaryGradient` și `accentHighlight` înlocuiesc chihlimbarul vechi în 10 fișiere (butonul principal, barele de progres și buget, punctele de pas, nivelurile Medium/Premium, cartonașul activ); o gardă refuză întoarcerea celor 4 nuanțe vechi, ca hex sau rgba                                                          | `react-specialist`, `tdd-guide` |
| T.4  | ✅ Onboarding: 33 de culori scrise direct → jetoane din temă. Jetoane noi, testate la contrast: `danger`/`dangerBg`/`onDanger` (alergeni, alcool, diete incompatibile; roșu armonizat, ≥ 4,5:1 și pe fundalul lui), `success`/`onSuccess`, `shadowColor`, `onBrand`. Gardă: `screens/onboarding` nu mai are voie cu nicio culoare proprie               | `refactor-cleaner`, `tdd-guide` |
| T.5  | ✅ Tabla de mese și cardurile: ~50 de culori scrise direct → jetoane (12 fișiere). Jetoane noi, testate la contrast: `macro.*` (kcal, proteine, carbohidrați, grăsimi), `dangerGradient` (buget depășit), `successBorder`/`warningBorder`, `onPhoto`/`photoScrim` (text peste fotografii). Desertul trece de pe roz pe bronz. Garda acoperă acum 7 zone | `refactor-cleaner`, `tdd-guide` |
| T.6  | Lotul 3: detaliul rețetei și ferestrele (cămară, magazine, macro, planuri)                                                                                                                                                                                                                                                                              | `refactor-cleaner`              |
| T.7  | Lotul 4: restul ecranelor; un test care interzice culori noi scrise direct în `src/`                                                                                                                                                                                                                                                                    | `tdd-guide`                     |
| T.8  | Fontul serif pentru titluri, ca în imagine (alegi din variante; doar fonturi cu licență liberă OFL); textul obișnuit rămâne lizibil, fără serif                                                                                                                                                                                                         | `frontend-developer`            |
| T.9  | Motivul „margine de bronz”: linie fină bronz pe carduri și pe fereastra rețetei, discret                                                                                                                                                                                                                                                                | `react-specialist`              |
| T.10 | Iconița, ecranul de pornire și culoarea barei de sistem (`app.json`)                                                                                                                                                                                                                                                                                    | `frontend-developer`            |
| T.11 | Verificarea contrastului pe ecranele reale (axe în Playwright)                                                                                                                                                                                                                                                                                          | `frontend-developer`            |
| T.12 | **Poarta de tester** + capturile înainte/după, ca să aprobi tema                                                                                                                                                                                                                                                                                        |                                 |

**Riscuri anticipate și prevenire (Etapa T):**

- Culori noi scrise direct în ecrane, peste un an → testul din T.7 refuză orice cod de culoare nou în `src/`.
- O nuanță schimbată mai târziu care face un text greu de citit → testele de contrast din T.1 pică imediat.
- Web și telefon arată diferit (CSS-ul web are prioritate) → stilurile web sunt derivate din aceeași paletă (T.2).
- Fontul serif nu se încarcă (rețea slabă, primul start) → textul cade pe fontul sistemului, nu dispare (T.8).

Culorile pentru erori, succes și alergeni rămân ușor de recunoscut (roșu/verde), doar armonizate cu paleta. Siguranța e mai importantă decât estetica.

---

## Etapa A · Texte conforme, disclaimer, siguranță

Ramura: `feat/health-texts`. Obiectivele de sănătate nu se schimbă încă în spate, doar ce se afișează și cine le vede.

| #    | Pas                                                                                                                                                                                                                     | Unealtă                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| A.1  | Test: niciun text de obiectiv nu conține „previne / tratează / vindecă / reduce / stabilizează / protecție”                                                                                                             | `tdd-guide`                      |
| A.2  | Nume și descrieri noi în `healthTags.ts`: „Atent la zaharuri”, „Echilibrat”, „Grăsimi bune, puțină sare”, „Stil mediteranean”, „Bogat în fibre”; cheile din cod rămân                                                   | `typescript-pro`                 |
| A.3  | Rândul „boala ca informație” sub fiecare descriere, cu „Nu înlocuiește medicul”                                                                                                                                         | `frontend-developer`             |
| A.4  | Componenta `HealthDisclaimer` (scurt și lung) + testul ei                                                                                                                                                               | `react-specialist`               |
| A.5  | Disclaimerul pe ecranul obiectivelor (onboarding + filtre) și în detaliul rețetei                                                                                                                                       | `frontend-developer`             |
| A.6  | Disclaimerul lung în Setări și în `docs/PRIVACY.md`                                                                                                                                                                     | `doc-updater`                    |
| A.7  | Întrebarea de siguranță la alegerea unui obiectiv (sarcină, rinichi, insulină, anticoagulante, tulburări de alimentație). Un „da” afișează mesajul și blochează obiectivele riscante. Răspunsul nu se salvează în cloud | `tdd-guide`, `security-reviewer` |
| A.8  | Comutatorul de platformă: pe iOS, obiectivele de sănătate sunt ascunse (filtrul „Fără porc” rămâne, e religios, nu medical)                                                                                             | `react-specialist`               |
| A.9  | Utilizatorii iOS care au deja obiective salvate: se păstrează în date, dar nu se aplică pe iOS; mesaj o singură dată                                                                                                    | `tdd-guide`                      |
| A.10 | `STORE_LISTING.md`: fraza obligatorie Google + declarația „Nutrition and Weight Management”                                                                                                                             | `doc-updater`                    |
| A.11 | **Poarta de tester**                                                                                                                                                                                                    | vezi mai sus                     |

---

## Etapa D · Pofte: condiții vs gusturi

Ramura: `feat/cravings-constraints`

| #    | Pas                                                                                                                                                     | Unealtă              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| D.1  | Constantele `CONSTRAINT_CRAVINGS` și `FLAVOUR_CRAVINGS` + test că fiecare poftă e în exact o grupă                                                      | `tdd-guide`          |
| D.2  | Test: cu „Rapid”, toate mesele au ≤ 25 min când există destule rețete (pică azi)                                                                        | `tdd-guide`          |
| D.3  | Filtrul de condiții în `eligibility.ts` / `slotPicker.ts`; trece D.2                                                                                    | `typescript-pro`     |
| D.4  | Test + cod: când nu sunt destule rețete, relaxare controlată și notă în plan („2 mese de 30 min”)                                                       | `tdd-guide`          |
| D.5  | Afișarea notei pe tablă (componenta de notificări existentă)                                                                                            | `frontend-developer` |
| D.6  | Redefinirea strictă a „Mâncare caldă & nutritivă” în `moodTags.ts` (cald, gătit, cu legume, fără prăjit) + test de acoperire (țintă 20–35% din catalog) | `tdd-guide`          |
| D.7  | Același număr de pofte peste tot: onboarding și filtrele rapide folosesc aceleași limite                                                                | `react-specialist`   |
| D.7b | Fără repetiții: nu două preparate pe aceeași bază în zile la rând, iar „Regenerează” aduce alte mese (P1, P2 din raportul de reper)                     | `tdd-guide`          |
| D.8  | Raport: câte rețete are fiecare poftă înainte și după                                                                                                   | –                    |
| D.9  | **Poarta de tester**                                                                                                                                    |                      |

---

## Etapa B · Date nutriționale complete

Ramura: `feat/nutrient-data`. Invizibilă, dar toate etapele următoare stau pe ea.

| #    | Pas                                                                                                                                                                                                    | Unealtă                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| B.1  | Tipurile noi: `NutritionPer100g` cu sodiu, grăsimi saturate/mono/poli, zaharuri, fier, vitamina C, calciu, vitamina D, B12, potasiu, ALA, EPA, DHA, beta-glucani                                       | `typescript-pro`                  |
| B.2  | Test de completitudine: fiecare ingredient are toate câmpurile (pică acum)                                                                                                                             | `tdd-guide`                       |
| B.3  | Scriptul de import din USDA FoodData Central (CC0), cu maparea ingredient → cod FDC salvată în repo                                                                                                    | `python-pro` sau `typescript-pro` |
| B.4  | Import pe grupe: legume și fructe                                                                                                                                                                      | –                                 |
| B.5  | Import: carne, pește, ouă                                                                                                                                                                              | –                                 |
| B.6  | Import: lactate și brânzeturi (telemea și cașcaval după CIQUAL, dacă licența e confirmată)                                                                                                             | `deep-research`                   |
| B.7  | Import: cereale, leguminoase, paste, pâine, uleiuri, condimente; B.2 trece                                                                                                                             | –                                 |
| B.8  | Verificare manuală pe eșantion: 15 ingrediente comparate cu sursa, în raport                                                                                                                           | –                                 |
| B.9  | Flag-urile de ingredient: tip de carne, pește gras, mercur, integral/rafinat, leguminoasă, nuci și semințe, ulei de măsline, zahăr adăugat, crud, pasteurizare (da/nu/necunoscut), alcool, ficat, post | `tdd-guide`                       |
| B.10 | `computeRecipeNutrition` întoarce toți nutrienții + greutatea porției (fibrele nu se mai pierd)                                                                                                        | `tdd-guide`                       |
| B.11 | „Nutriție” din detaliul rețetei: fibre, sare și zaharuri (ce se vede de fapt)                                                                                                                          | `frontend-developer`              |
| B.12 | **Poarta de tester**                                                                                                                                                                                   |                                   |

---

## Etapa C · Obiective calculate automat

Ramura: `feat/health-rules`

| #    | Pas                                                                                                              | Unealtă                       |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| C.1  | `src/engine/healthRules.ts`: structura regulii (prag, sursa, porție vs 100 g) + teste pentru „Bogat în fibre”    | `tdd-guide`, `code-architect` |
| C.2  | Regula „Atent la zaharuri” + teste la limită (sub, exact, peste)                                                 | `tdd-guide`                   |
| C.3  | Regula „Grăsimi bune, puțină sare”                                                                               | `tdd-guide`                   |
| C.4  | Regula „Stil mediteranean” (scor după MEDAS)                                                                     | `tdd-guide`                   |
| C.5  | Regula „Echilibrat” (SOP)                                                                                        | `tdd-guide`                   |
| C.6  | Fail-closed: o valoare lipsă = fără etichetă + test                                                              | `tdd-guide`                   |
| C.7  | `getRecipeHealthTags` trece pe reguli; etichetele scrise de mână dispar din catalog                              | `refactor-cleaner`            |
| C.8  | Raportul de diferențe: ce rețete câștigă sau pierd fiecare etichetă. **Ți-l arăt înainte de commit**             | –                             |
| C.9  | Insignele legale per 100 g („Sursă de / Bogat în fibre”, „Puțină sare”, „Puține zaharuri”) separate de obiective | `tdd-guide`                   |
| C.10 | Butonul „De ce?” în detaliul rețetei, cu cifrele care au decis eticheta                                          | `react-specialist`            |
| C.11 | Regulile săptămânale în generator: pește ≥ 2, leguminoase ≥ 3, carne roșie ≤ 500 g, procesată ≈ 0                | `tdd-guide`                   |
| C.12 | Fișa pentru dietetician (`docs/health/DIETITIAN_REVIEW.md`): fiecare regulă cu pragul, sursa și exemple          | `doc-updater`                 |
| C.13 | **Poarta de tester**                                                                                             |                               |

---

## Etapa E · 70+ rețete noi și postul

Ramura: `feat/recipes-and-fasting`. Rețete scrise de noi, după preparatele-tip din `docs/research/COOKBOOKS.md` §3.

| #    | Pas                                                                                                                                        | Unealtă                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| E.1  | Postul: `fastingLevel` calculat din ingrediente (`strict`, `fish_allowed`, `none`) + teste pe 10 rețete                                    | `tdd-guide`                      |
| E.2  | Preferința `fastingMode` (oprit / tot timpul / miercuri și vineri) + validare + sync (preferințele noi trec prin `parseUserPreferences`)   | `tdd-guide`, `security-reviewer` |
| E.3  | Dezlegarea la pește (comutator separat)                                                                                                    | `tdd-guide`                      |
| E.4  | Planificatorul respectă postul pe zilele alese + test pe o săptămână                                                                       | `tdd-guide`                      |
| E.5  | Ecranul: comutatorul „De post” în onboarding și în filtre                                                                                  | `frontend-developer`             |
| E.6  | Lotul 1: **10 rețete de post** (fasole bătută, iahnie, linte, plachie, sarmale de post…)                                                   | `tdd-guide` (testele de catalog) |
| E.7  | Lotul 2: **11 paste** (pomodoro, aglio olio, pasta e fagioli, paste cu ton…)                                                               |                                  |
| E.8  | Lotul 3: **11 salate și bowl-uri** (linte cu feta, tabbouleh, năut, niçoise de buget…)                                                     |                                  |
| E.9  | Lotul 4: **9 picante / mexicane** (burrito bowl, tacos de pui, huevos rancheros…)                                                          |                                  |
| E.10 | Lotul 5: **8 grătar** (frigărui, kofta, fajitas, tandoori la cuptor, ceafă cu mujdei), toate și la tigaia grill                            |                                  |
| E.11 | Lotul 6: **8 fast-food de casă** (shaorma, „KFC” la cuptor, egg fried rice…)                                                               |                                  |
| E.12 | Lotul 7: **8 pește ieftin și leguminoase** (cod, merluciu, macrou, năut), ca să avem mai puțin pui și somon                                |                                  |
| E.13 | Lotul 8: **7 clasice românești lipsă** (ciorbă de fasole cu tarhon, zamă, gulaș…), verificate ca idee după Sanda Marin și Radu Anton Roman |                                  |
| E.14 | Fotografiile din Wikimedia Commons, cu credit, sau cardul generat; verificate                                                              | `verify-render`                  |
| E.15 | Raport: poftele și obiectivele noi pe catalog (câte rețete are fiecare)                                                                    | –                                |
| E.16 | **Poarta de tester**                                                                                                                       |                                  |

Fiecare lot e un pas: rețetele se scriu, testele de catalog (alergeni, porc, unități, nutriție, post, obiective) trec, apoi commit.

---

## Etapa F · Obiective noi

Ramura: `feat/new-health-goals`. Ascunse pe iOS, ca restul (decizia ta).

| #    | Pas                                                                                                                         | Unealtă                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| F.1  | „Bogat în fier”: fier ≥ 4,5 mg/porție, + vitamina C ≥ 25 mg când fierul e vegetal                                           | `tdd-guide`                      |
| F.2  | „Puțină sare”: sodiu ≤ 500 mg/porție                                                                                        | `tdd-guide`                      |
| F.3  | „Cu ovăz și orz”: beta-glucani ≥ 1 g/porție + grăsimi nesaturate                                                            | `tdd-guide`                      |
| F.4  | „Calciu și vitamina D”: calciu ≥ 300 mg/porție                                                                              | `tdd-guide`                      |
| F.5  | Sarcina, ca filtru de siguranță: excluderile NHS, pasteurizarea necunoscută exclusă, pește gras ≤ 2 și ton ≤ 2 pe săptămână | `tdd-guide`, `security-reviewer` |
| F.6  | Sarcina e dată de sănătate: consimțământ explicit (GDPR art. 9), ca la celelalte obiective                                  | `security-reviewer`              |
| F.7  | B12 pentru vegani: mesaj de informare când dieta e vegană                                                                   | `frontend-developer`             |
| F.8  | Ecranele: obiectivele noi în onboarding și filtre, cu „boala ca informație” și disclaimerul                                 | `frontend-developer`             |
| F.9  | Fișa pentru dietetician, completată cu obiectivele noi                                                                      | `doc-updater`                    |
| F.10 | **Poarta de tester**                                                                                                        |                                  |

---

## Etapa G · Validare externă (în paralel, fără cod)

| #   | Pas                                                                                        | Cine          |
| --- | ------------------------------------------------------------------------------------------ | ------------- |
| G.1 | Găsești un dietetician autorizat (Colegiul Dieteticienilor din România)                    | tu            |
| G.2 | Îi trimiți fișa din C.12 / F.9; eu aplic corecturile                                       | tu + eu       |
| G.3 | Avocat: textele finale, Reg. 1924/2006, încadrarea MDR                                     | tu            |
| G.4 | Eu aplic observațiile avocatului; obiectivele rămân ascunse până la ambele avize           | eu            |
| G.5 | `LAUNCH_PLAN.md`: cont Apple pe persoană fizică, sănătate ascunsă pe iOS, firmă mai târziu | `doc-updater` |

---

## Ordinea

**0 → T → A → D → B → C → E → F**, cu G pornit cât mai devreme (dieteticianul are nevoie de fișa din C.12).
