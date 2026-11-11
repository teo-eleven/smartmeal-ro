# Pașii mici: pofte, sănătate, rețete

Planul mare, cu motivele și sursele, este în `docs/HEALTH_CRAVINGS_PLAN.md`. Aici e lista de lucru:
pași mici, unul câte unul, bifați pe măsură ce se termină.

## Deciziile tale (2026-10-30)

| Întrebare                   | Decizie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numele obiectivelor         | **Nume noi + boala ca informație** în descriere („Criterii folosite în ghidurile pentru…. Nu înlocuiește medicul.”)                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Validare externă            | **Dietetician autorizat + avocat.** Obiectivele se fac cât mai riguros, cu surse, ca să treacă de amândoi fără corecturi jenante                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Cont Apple                  | **Persoană fizică** (redeschisă 2026-11-11: se decide la G.0a, din cauza adresei publice de trader). Pe iOS, obiectivele de sănătate rămân ascunse                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| „Mâncare caldă & nutritivă” | **Redefinită strict**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Obiective noi               | **Fier, Puțină sare, Ovăz și orz (colesterol), Sarcină (filtru de siguranță)**, plus ce am mai propus: **Calciu și vitamina D**, **B12 pentru vegani** (mesaj de informare)                                                                                                                                                                                                                                                                                                                                                                                                   |
| Post                        | **Complet + parțial (miercuri și vineri) + dezlegare la pește**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Rețete noi                  | **70+**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Testare                     | **Completă la finalul fiecărei etape** (poarta de tester de mai jos)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Sync real                   | **Supabase local pe Mac** (Docker + Supabase CLI)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Temă vizuală (2026-11-02)   | **„Midnight Forest & Smoked Walnut”**: verde pădure, nuc afumat, crem și bronz, după imaginea trimisă (Etapa T). **Fundal: verde pădure întunecat**; aplicația rămâne în mod întunecat (varianta crem există în temă, verificată, dar nu se afișează). **Font titluri: Libre Caslon** (OFL). **Insignele magazinelor: pe paletă**, magazinul se recunoaște din nume. **Marginea de bronz: discretă**, doar pe cardurile importante (T.9). **Iconița: recolorată** (T.10). **Fotografii pentru toate rețetele**: Commons → Unsplash → AI (marcat „imagine ilustrativă”) (E.14) |
| Lansare (2026-11-11)        | Prima versiune în magazine după Etapele A + S; D, B, C, E, F vin ca actualizări                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

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

| #   | Pas                                                                                                                                                                                                                                                                                               | Unealtă                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 0.1 | ✅ Docker Desktop (instalat de Claude, pornit) și Supabase CLI (dependență npm, fără Homebrew)                                                                                                                                                                                                    | –                       |
| 0.2 | ✅ Supabase local (`npm run db:start` / `db:stop` / `db:reset` / `db:status`): migrările 0001–0010 aplicate pe Postgres 17, RLS activ pe toate cele 7 tabele, accesul anonim refuzat                                                                                                              | `database-migrations`   |
| 0.3 | ✅ `.env.test` cu cheile **locale** (ignorat de git, cheia de administrator fără `EXPO_PUBLIC_`); `http` permis doar spre 127.0.0.1/localhost, doar în dezvoltare, fără credențiale în adresă                                                                                                     | `security-reviewer`     |
| 0.4 | ✅ `npm run test:sync` pe baza locală: cont nou cu consimțământ, plan salvat pe telefon și deschis pe laptop, izolare între conturi și față de vizitatori, conflict între două dispozitive (0009); metodele serviciului nu mai depind de `this`                                                   | `tdd-guide`             |
| 0.5 | ✅ Notițe pe două dispozitive (scriere, editare, ștergere, limita de 2000 de caractere), mementouri (inclusiv dezabonarea prin email care nu se pierde), deconectare doar pe dispozitivul curent, ștergerea contului prin funcția de server (parolă greșită = nimic șters; corectă = tot dispare) | `tdd-guide`             |
| 0.6 | ✅ Teste E2E în browser (`npm run test:e2e`, port 8099), cu gardă automată contra serverului real                                                                                                                                                                                                 | `frontend-developer`    |
| 0.7 | ✅ Poarta de tester pe aplicația de azi: `docs/testing/BASELINE_REPORT.md`. Partea de sync real se adaugă după 0.2–0.5                                                                                                                                                                            | reviewerii + Playwright |
| 0.8 | ✅ CI pe GitHub (`.github/workflows/ci.yml`): la fiecare push rulează tipurile, lint-ul, testele SQL, Jest cu praguri de acoperire, E2E în browser **și sync-ul real** (Supabase pornit pe serverul GitHub, fără chei reale). `npm run db:env` scrie `.env.test` din baza locală                  | `security-reviewer`     |

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

| #     | Pas                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Unealtă                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| T.1   | ✅ Paleta `FOREST_WALNUT_PALETTE` în `src/styles/theme.ts` + 19 teste: rolul fiecărei nuanțe și contrastul WCAG AA (text 11–14:1, minimul cerut e 4,5:1)                                                                                                                                                                                                                                                                                                          | `tdd-guide`                     |
| T.2   | ✅ Tema aplicată prin `getAppTheme` și prin stilurile web (sticlă, pastile, butoane), toate derivate din paletă; capturi înainte/după                                                                                                                                                                                                                                                                                                                             | `frontend-developer`            |
| T.3   | ✅ Accentul unic: jetoanele `primaryGradient` și `accentHighlight` înlocuiesc chihlimbarul vechi în 10 fișiere (butonul principal, barele de progres și buget, punctele de pas, nivelurile Medium/Premium, cartonașul activ); o gardă refuză întoarcerea celor 4 nuanțe vechi, ca hex sau rgba                                                                                                                                                                    | `react-specialist`, `tdd-guide` |
| T.4   | ✅ Onboarding: 33 de culori scrise direct → jetoane din temă. Jetoane noi, testate la contrast: `danger`/`dangerBg`/`onDanger` (alergeni, alcool, diete incompatibile; roșu armonizat, ≥ 4,5:1 și pe fundalul lui), `success`/`onSuccess`, `shadowColor`, `onBrand`. Gardă: `screens/onboarding` nu mai are voie cu nicio culoare proprie                                                                                                                         | `refactor-cleaner`, `tdd-guide` |
| T.5   | ✅ Tabla de mese și cardurile: ~50 de culori scrise direct → jetoane (12 fișiere). Jetoane noi, testate la contrast: `macro.*` (kcal, proteine, carbohidrați, grăsimi), `dangerGradient` (buget depășit), `successBorder`/`warningBorder`, `onPhoto`/`photoScrim` (text peste fotografii). Desertul trece de pe roz pe bronz. Garda acoperă acum 7 zone                                                                                                           | `refactor-cleaner`, `tdd-guide` |
| T.6a  | ✅ Detaliul rețetei: ~52 de culori → jetoane (11 fișiere). Jetoane noi: `heroScrim`, `photoPill`/`photoPillLight` (testat: text alb lizibil chiar și peste o fotografie albă), `overlay`, `dangerBorder`. „Favorit” salvie, „Nu-mi place” și sugestia de înlocuire coral, „Mănânc în oraș” ember                                                                                                                                                                  | `refactor-cleaner`, `tdd-guide` |
| T.6b  | ✅ Cele 10 ferestre: ~70 de culori → jetoane. Fundalul din spatele ferestrelor = `overlay`, macro pe săptămână = `macro.*` (aceleași ca pe carduri), ștergerea planului și alcoolul = `danger`, „Cel mai ieftin” = `success`. 15 culori statice erau deja suprascrise și au fost doar șterse. Garda acoperă 19 zone                                                                                                                                               | `refactor-cleaner`              |
| T.7a  | ✅ Componentele comune: ~110 culori → jetoane (14 fișiere). Raioanele de cumpărături primesc tonuri pe categorii din paletă (`theme.category`: salvie, coral, auriu, prună, ember, bronz, frost; testate ≥ 3:1 ca grafică), alergenul bifat = `danger`, „Îmi place”/„Pas” = salvie/coral, bara macro = `macro.*`. Garda acoperă 30 de zone                                                                                                                        | `refactor-cleaner`              |
| T.7b  | ✅ Cont și autentificare, încărcare, notificări, ecranul de eroare, paywall, dispozitive: ~85 de culori → jetoane (20 de fișiere). Mesajele de eroare/succes la conectare primesc `isDark`; fundalurile tuturor ferestrelor = `overlay`; acțiunile ireversibile (deconectare forțată, ștergere definitivă) = `danger`. Garda acoperă 47 de zone                                                                                                                   | `refactor-cleaner`              |
| T.7c  | ✅ Insignele magazinelor: un singur jeton `storeBadge` (nuc), culoarea mărcii rămâne pe punct. Garda acoperă tot `src`; excepții doar tema, culorile mărcilor și culorile de mâncare ale cardului de rezervă                                                                                                                                                                                                                                                      | `tdd-guide`                     |
| T.8   | ✅ Libre Caslon Text Bold (OFL, cu Ă Â Î Ș Ț) pe marcă, numele felurilor și titlurile a 21 de ecrane și ferestre; textul rămâne cu fontul sistemului. Garda `titleFontUsage` și testul e2e care verifică fontul încărcat în browser                                                                                                                                                                                                                               | `frontend-developer`            |
| T.9   | ✅ Contur bronz discret (`cardRim`, bronz 0.3 / 0.4) doar pe cardul de masă, rezumatul rețetei și sumarul de dinainte de generare; pe web prin `glass('card-rim')`. Măsurat: mai vizibil decât linia obișnuită, mai discret decât bordura puternică; garda ține conturul doar pe aceste trei carduri                                                                                                                                                              | `react-specialist`              |
| T.10  | ✅ Iconiță nouă (varianta A: farfurie bronz, tacâmuri crem, fundal pădure), desenată din `assets/source/mark.svg` cu `npm run icons`; iconița Android, ecranul de pornire și favicon-ul din aceeași sursă; culorile din `app.json` și încărcătorul web pe paletă, cu `theme-color`                                                                                                                                                                                | `frontend-developer`            |
| T.11  | ✅ Test e2e cu axe (regula de contrast) pe 6 ecrane; singura problemă găsită (bronz pe insigna bronz, 4.15) reparată la sursă: `primary` întunecat = bronzeGlow (varianta A aleasă), insigna luminoasă 0.10. Contur de focus bronz de 2 px în loc de albastrul browserului. Testul pică dovedit cu bronzul vechi. Restul problemelor axe (fără legătură cu culorile) notate P7–P9                                                                                 | `frontend-developer`            |
| T.11b | ✅ Accesibilitate dincolo de culori (P7–P9): `accessibilityState` (ignorat de react-native-web 0.21) → `aria-checked` / `aria-disabled` / `pressedState` în 54 de locuri; filele de conectare în `tablist`; pozele decorative cu `alt=""`; butoanele compuse numite după textul vizibil (WCAG 2.5.3), emoji ascunse de cititorul de ecran. Testul axe rulează acum toate regulile WCAG 2.1 A/AA pe 6 ecrane; gardă contra `accessibilityState` și poze fără `alt` | `frontend-developer`            |
| T.12  | ✅ Poarta de tester trecută (`docs/testing/STAGE_T_REPORT.md`): 1771 teste Jest, 12 sync, 7 e2e cu axe WCAG 2.1 AA, review fără CRITICAL/HIGH, reparațiile din review făcute. Capturi înainte/după pe 9 ecrane. **Tema aprobată de tine pe 2026-11-04**                                                                                                                                                                                                           |                                 |

**Riscuri anticipate și prevenire (Etapa T):**

- Culori noi scrise direct în ecrane, peste un an → testul din T.7 refuză orice cod de culoare nou în `src/`.
- O nuanță schimbată mai târziu care face un text greu de citit → testele de contrast din T.1 pică imediat.
- Web și telefon arată diferit (CSS-ul web are prioritate) → stilurile web sunt derivate din aceeași paletă (T.2).
- Fontul serif nu se încarcă (rețea slabă, primul start) → textul cade pe fontul sistemului, nu dispare (T.8).

Culorile pentru erori, succes și alergeni rămân ușor de recunoscut (roșu/verde), doar armonizate cu paleta. Siguranța e mai importantă decât estetica.

---

## Etapa A · Texte conforme, disclaimer, siguranță

Ramura: `feat/health-texts`. Obiectivele de sănătate nu se schimbă încă în spate, doar ce se afișează și cine le vede.

| #    | Pas                                                                                                                                                                                                                                                                                                                         | Unealtă                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| A.1  | ✅ Test `src/data/__tests__/healthClaims.test.ts`: fără promisiuni medicale (previne, tratează, vindecă, reduce, stabilizează, protejează, antiinflamator, cardio-protector) în obiective **și în titlurile/descrierile rețetelor**; fără nume de boli în numele și insignele obiectivelor. A găsit 5 obiective și 7 rețete | `tdd-guide`                      |
| A.2  | ✅ Nume și descrieri noi (aprobate): Stil mediteranean, Echilibrat, Atent la zaharuri, Bogat în fibre, Grăsimi bune, puțină sare; iconițe de mâncare în loc de 🩺/🩸; `benefitRo` (neafișat, plin de promisiuni) șters; cheile din cod neschimbate                                                                          | `typescript-pro`                 |
| A.2b | ✅ Cele 7 descrieri rescrise ca descrieri de mâncare, verificate pe ingrediente (de ex. „fără zahăr adăugat” la budinca de chia e adevărat; „fără carbohidrați” de la omletă, fals, a dispărut). Testul A.1 e verde                                                                                                         | `tdd-guide`                      |
| A.3  | ✅ Rândul „boala ca informație” sub fiecare descriere, cu „Nu înlocuiește medicul”                                                                                                                                                                                                                                             | `frontend-developer`             |
| A.4  | ✅ Componenta `HealthDisclaimer` (scurt și lung) + testul ei                                                                                                                                                                                                                                                                   | `react-specialist`               |
| A.5  | ✅ Disclaimerul pe ecranul obiectivelor (onboarding + filtre) și în detaliul rețetei                                                                                                                                                                                                                                           | `frontend-developer`             |
| A.6  | ✅ Disclaimerul lung în Filtre → „Despre obiectivele de sănătate” (nu există ecran Setări; decizia 1A) și în `docs/PRIVACY.md`                                                                                                                                                                                                                                                                         | `doc-updater`                    |
| A.7  | Întrebarea de siguranță la alegerea unui obiectiv (sarcină, rinichi, insulină, anticoagulante, tulburări de alimentație). Deciziile tale: **o singură întrebare Da/Nu**; „Da” blochează toate cele 5 obiective de sănătate („Fără porc” rămâne); răspunsul stă **doar pe telefon**, separat de preferințe | `tdd-guide`, `security-reviewer` |
| A.7a | ✅ Logica (`src/utils/healthSafety.ts`) și răspunsul salvat doar pe telefon (`src/store/healthSafetyStore.ts`, cheie proprie); citire eșuată = întrebăm din nou, salvare eșuată = „Da” blochează oricum | `tdd-guide` |
| A.7b | ✅ Întrebarea în onboarding, la prima bifă a unui obiectiv de sănătate; „Da” scoate obiectivele deja bifate | `frontend-developer` |
| A.7c | ✅ Întrebarea în Filtre; răspunsul se poate schimba; „Reia configuratorul” îl șterge | `frontend-developer` |
| A.7d | ✅ `PRIVACY.md`: obiectivele alese sunt date de sănătate și ajung în cloud cu contul; răspunsul la întrebare nu. Verificare cu `security-reviewer` | `security-reviewer`, `doc-updater` |
| A.7e-1 | ✅ O singură sursă pentru excepția „Fără porc” (`PORK_FREE_TAG`, `isHealthGoal` în `src/data/healthTags.ts`); refactor curat, comportament neschimbat | `tdd-guide` |
| A.7e-2 | ✅ „Da” se aplică peste tot, fail-closed: obiectivele de sănătate ajung la planificator doar după un „Nu” (`effectivePreferences`, `src/store/guardedEngine.ts`); cu „Da” sunt scoase la fiecare scriere (toggle, hydrate, cloud) | `tdd-guide` |
| A.7e-3 | ✅ Cine avea deja obiective dar n-a răspuns primește întrebarea o dată pe pornire (`ExistingGoalsSafetyPrompt`, în `App.tsx`): „Da” blochează și șterge obiectivele, „Nu” le lasă să se aplice de la următorul plan, închiderea nu salvează nimic | `tdd-guide` |
| A.7e-4 | ✅ Răspunsul se șterge odată cu contul: `clearLocalAccountData` (deconectare, alt cont, ștergerea contului) îl resetează în memorie și pe disc | `tdd-guide` |
| A.7e-5 | ✅ Corectitudine UI: obiectivele deja bifate se pot debifa după „Da”; `load()` nu mai suprascrie o scriere mai nouă; handler-ele citesc valorile curente și controalele sunt dezactivate până se citește răspunsul; întrebarea se închide odată cu Filtrele și stă lângă card, nu în ScrollView; curățenii și teste lipsă | `tdd-guide` |
| A.7e-6 | ✅ Căsuța de consimțământ la cont nou numește și obiectivele de sănătate; `PRIVACY.md` citează aceeași formulare (versiunea politicii rămâne neschimbată) | `tdd-guide` |
| A.7f-1 | ✅ Fără ferestre suprapuse: întrebarea de siguranță pentru obiectivele vechi așteaptă orice altă fereastră deschisă (`openWindowCount`, fără să se ascundă din cauza propriei ferestre) și merge înaintea ofertei Face ID, care așteaptă răspunsul sau închiderea (`useIsExistingGoalsSafetyDue`) | `tdd-guide` |
| A.7f-2 | ✅ Sugestiile din detaliul rețetei se recalculează când se schimbă răspunsul de siguranță (hook-ul se abonează la răspuns) | `tdd-guide` |
| A.7f-3 | ✅ Straturi: `src/utils` și `src/engine` nu mai importă din `src/store` (test de graniță `layering.test.ts`); `swapCandidates` e pur, iar `MealSwapModal` îi dă preferințele efective și se abonează la răspuns | `tdd-guide` |
| A.7f-4 | ✅ Ștergerea eșuată a răspunsului nu e moștenită de contul următor: dacă `removeItem` pică, se scrie un marcaj „unanswered”, citit ca „fără răspuns” după repornire | `tdd-guide` |
| A.7f-5 | ✅ `useHealthGoalToggle` păstrează randarea pură: referința cu valorile curente se scrie într-un `useLayoutEffect`, nu în timpul randării | `tdd-guide` |
| A.7g-1 | ✅ Oferta Face ID așteaptă întrebarea de siguranță doar unde aceasta e montată (`isSafetyPromptMounted` în `healthSafetyStore`, `useIsSafetyQuestionBlockingOffer`); pe paywall/onboarding oferta apare chiar dacă întrebarea e scadentă | `tdd-guide` |
| A.7g-2 | ✅ Fără citire de ref în selector: `useBlockingWindow(visible, id)` și `openWindowIds` în store; întrebarea scade doar propriul id din `openWindowCount`, independent de ordinea efectelor | `tdd-guide` |
| A.7g-3 | ✅ „Închis fără răspuns” ține tot lansarea: `isReminderDismissed` rămâne în memorie și nu se mai resetează la demontare; o relansare (store nou) întreabă din nou | `tdd-guide` |
| A.7h-1 | ✅ Oferta Face ID din shell așteaptă întrebarea de siguranță din primul commit: prop static `waitsForSafetyQuestion` doar pe `BiometricOptInPrompt` din shell; eliminate `isSafetyPromptMounted`, layout effect-ul și `useIsSafetyQuestionBlockingOffer`; test Profiler că Face ID nu e vizibil în niciun commit | `Minimal Change Engineer` |
| A.7h-2 | ✅ `windowClosed()` fără id nu mai scade numărul când toate ferestrele deschise au id; teste pentru deschidere/închidere și demontare cu id, `openWindowIds: []` resetat în `beforeEach` | `Minimal Change Engineer` |
| A.7h-3 | ✅ Teste oneste: „no re-show” redenumit ca regression guard (fără try/catch pe `screen.toJSON()`); testul de reset demontează/remontează (acoperă A.7g-3); „next launch asks again” verifică un modul proaspăt (`jest.isolateModules`) și că închiderea nu scrie în AsyncStorage | `Minimal Change Engineer` |
| A.8  | ✅ Comutatorul de platformă: pe iOS, obiectivele de sănătate sunt ascunse (filtrul „Fără porc” rămâne, e religios, nu medical). Un singur comutator, `areHealthGoalsAvailable()` în `src/utils/platformHealth.ts` (prin `platformOs`, Apple 1.4.1). Ascunse pe iOS: lista de obiective, titlurile, rândul cu afecțiunea, avertismentul scurt, linkul „Despre obiectivele de sănătate”, mesajul de blocare și întrebarea de siguranță (onboarding și Filtre), întrebarea pentru obiectivele vechi (Face ID nu o mai așteaptă), insignele de sănătate din rețetă (cu avertismentul), cardul de masă, rezumatul dinaintea generării și pasul „obiectivele tale de sănătate” din ecranul de generare. Planificatorul nu le aplică (`effectivePreferences`). Obiectivele salvate rămân în date: „Aplică”, onboarding-ul, pornirea rapidă și sync-ul le păstrează neschimbate | `react-specialist`, `Mobile App Builder` |
| A.8c-1 | ✅ Mesajul de reparare a preferințelor nu mai vorbește de sănătate pe iOS: „Verifică-ți preferințele” și „Nu am putut citi complet preferințele tale salvate, inclusiv „Fără porc”. Verifică-le din Filtre înainte să gătești.” (`preferenceRepairNotice.ts`); Android/web neschimbat | `Minimal Change Engineer` |
| A.8c-2 | ✅ Eticheta pasului 1 din onboarding: „Restricții & preferințe” pe iOS, „Restricții & Sănătate” în rest (`onboardingOptions.ts`, calculată la încărcare, platforma e fixă la build) | `Minimal Change Engineer` |
| A.8c-3 | ✅ Test de gardă (`src/services/__tests__/platformOs.test.ts`): `platformOs.ts` compilat cu `babel.config.js` și caller Metro ios/android returnează literalul platformei; pică dacă cineva rescrie `process.env.EXPO_OS` (verificat cu `const { EXPO_OS } = process.env`) | `Minimal Change Engineer` |
| A.8b-1 | ✅ Test roșu (`healthClaims.test.ts`): `BODY_FUNCTION_CLAIM` (antioxidant, energizant, glicemic, probiotic, microbiom, tranzit, digestie, detox, balonare, recuperare, odihnitor, sațietate, „sănătos” ca promisiune, „susțin”, „fără regrete” etc.) pe titlurile și descrierile rețetelor și un test nou pe cardurile de poftă (nume, descriere, stare, evidențieri, exemple); „somn” (peștele) și „hidratat” (chia) rămân permise | `Technical Writer` |
| A.8b-2 | ✅ Texte care descriu mâncarea, nu efecte pe corp: 9 rețete (smoothie bowl, fasole verde, salata de castraveți, chili, năut cu spanac, terci de ovăz, mixul de nuci, micul dejun la tigaie) și 11 câmpuri din cardurile de poftă; plus mențiuni nutriționale neverificate sau false scoase (tartine cu unt de arahide „bogat în proteine”, linte „sursă de fier”, cod „conținut caloric redus”, zinc, omega-3, grăsimi mononesaturate, „Fără zahăr rafinat” la deserturi, „Hidratare”, „Proteine pure”) și titlul chili-ului corectat („… porumb și cartofi”, rețeta n-are mărar; id-ul rămâne). Doar texte, niciun id sau cheie | `Technical Writer` |
| A.8b-3 | ✅ Cardurile de poftă promit doar ce verifică `moodTagHonesty.test.ts`: „Bogat în Proteine (>28g)”, „Peste 28g proteină”, „Cină Ușoară de Seară (<420 kcal)”, „Sub 420 kcal”; test nou care leagă numerele din card de praguri; `FoodMoodSwiper.component.test.tsx` actualizat (schimbare legitimă: eticheta s-a schimbat intenționat) | `Technical Writer` |
| A.8b-4 | ✅ Cardurile spun exact ce verifică testele (≥ 28 g, ≤ 420 kcal): „Bogat în Proteine (min. 28g)”, „Min. 28g proteină”, „Cină Ușoară de Seară (max. 420 kcal)”, „max. 420 kcal” în descriere, „Max. 420 kcal”; `moodTagHonesty.test.ts` verifică și formularea „min.”/„max.”; `FoodMoodSwiper.component.test.tsx` actualizat; titlul `light_dinner` din `docs/research/COOKBOOKS.md` aliniat | `Minimal Change Engineer` |
| A.9  | Utilizatorii iOS care au deja obiective salvate: se păstrează în date, dar nu se aplică pe iOS; mesaj o singură dată                                                                                                                                                                                                        | `tdd-guide`                      |
| A.10 | `STORE_LISTING.md`: fraza obligatorie Google (GP-26) + declarația „Nutrition and Weight Management” (GP-25); linkul EULA Apple în descriere (AS-34, LG-10); textele despre abonament și perioada de probă; prețul în lei (LG-11); scoatem „Gemini” (APP-13)                                                                 | `doc-updater`                    |
| A.12 | Texte de platformă: fără Android/Google Play pe iPhone și fără Apple pe Android (APP-6, AS-29); acordul de la cont fără obiectivele de sănătate pe iOS                                                                                                                                                                      | `Minimal Change Engineer`        |
| A.11 | Repararea CI (APP-14: Ubuntu 24.04, acțiuni Node 24): reparat 2026-11-11. Apoi **Poarta de tester**. Backlog: teste lente (BiometricOptInPrompt, DevicesSection, PaywallScreen), regula de lint react-hooks, verificarea pe iPhone a ferestrelor, folderul `.cursor/`                                                       | vezi mai sus                     |

**Riscuri anticipate și prevenire (Etapa A)**

- _Date deja salvate:_ utilizatorii au obiective salvate pe cheile vechi (`diabetic_friendly` etc.). Cheile din cod nu se schimbă, doar textele; un test verifică că toate cheile vechi au încă un text.
- _Texte care revin:_ o rețetă nouă (Etapa E, 70+) poate aduce iar „reduce glicemia”. Testul A.1 rulează pe tot catalogul, deci pică la prima frază de acest fel.
- _Răspunsul la întrebarea de siguranță (A.7)_ e o dată de sănătate: rămâne doar pe telefon, niciodată în sync; un test de sync verifică că nu ajunge în baza de date.
- _iOS (A.8–A.9):_ cine are deja obiective pe iPhone nu pierde datele; doar nu se aplică, cu un mesaj o singură dată, care nu reapare după repornire.
- _Textele trec pe la dietetician și jurist (Etapa G):_ păstrez toate textele într-un singur fișier, ca revizia lor să fie o singură listă.

---

## Etapa S · Pregătire magazine

Ramura: `feat/store-ready`. Versiunea 1.0 iese după A + S.

| #    | Pas                                                                                                                                                                                                                                 | Unealtă                                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| S.1  | Termeni și condiții în română, cu link la EULA standard Apple (APP-1, LG-12, LG-13, AS-34); avocatul le revizuiește la G.3                                                                                                          | `Technical Writer`                                    |
| S.2  | `PRIVACY.md` completă: operatorul, RevenueCat, transferurile în SUA (SCC/DPF), regiunea Supabase confirmată, retenția cu regulă de inactivitate, funcția AI (APP-3, LG-15–18, LG-23)                                                | `Privacy Engineer`                                    |
| S.3  | Contact și suport în aplicație; paginile web de ștergere și dezabonare completate (APP-2, AS-53, GP-24)                                                                                                                             | `Mobile App Builder`                                  |
| S.4  | Ștergerea contului completă: clientul RevenueCat, lista corectă pe web, avertizarea despre abonament pe fiecare platformă (APP-7, GP-24, AS-40)                                                                                     | `tdd-guide`, `security-reviewer`                      |
| S.5  | Ecranul de abonament: buton de închidere vizibil, prețul mai vizibil decât perioada de probă, „Gestionează abonamentul” și „Restaurează” și în Cont (GP-27, AS-33, AS-35)                                                           | `Payments & Billing Engineer`                         |
| S.6  | Retragerea acordului pentru datele de sănătate, fără ștergerea contului (APP-8, AS-39)                                                                                                                                              | `tdd-guide`, `Privacy Engineer`                       |
| S.7  | Configurare nativă: manifestul de confidențialitate iOS complet, `AD_ID` blocat, `expo-notifications` în `plugins`, `expo-dev-client`, `CFBundleDevelopmentRegion=ro` (APP-4, APP-10, AS-12, AS-14, AS-19, GP-18)                   | `Mobile Release Engineer`                             |
| S.8  | Ecranele „Credite foto” și „Licențe open-source” (APP-9, LG-26, LG-27, AS-49)                                                                                                                                                       | `Mobile App Builder`                                  |
| S.9  | Nota „sugestie generată de AI” la schimbarea mesei (APP-12, LG-25)                                                                                                                                                                  | `Minimal Change Engineer`                             |
| S.10 | Teste tehnice: Android 16 (edge-to-edge, înapoi predictiv, tabletă), iOS 27 redimensionabil, iPad în compatibilitate, IPv6; verificarea build-ului: targetSdk 36, 16 KB, Billing v8, 64-bit (GP-9–13, GP-20, AS-9–11, AS-22, AS-23) | `Mobile Release Engineer`, `Test Automation Engineer` |
| S.11 | `STORE.md` actualizat: variabilele de producție, Data safety, App Privacy, rating de vârstă nou, categoria Food & Drink, notițele pentru recenzent în engleză, contul demo și sandbox (APP-5, GP-23, GP-29–31, AS-45–47, AS-54)     | `doc-updater`                                         |
| S.12 | Documente GDPR: registrul de prelucrări, DPIA scurtă, procedura de incident (LG-19, LG-20, LG-22)                                                                                                                                   | `Privacy Engineer`                                    |
| S.13 | Capturi de ecran cu poze proprii, preț în lei, fără logouri de supermarket (GP-34, GP-35, AS-50, AS-51, LG-11, LG-26)                                                                                                               | `UI Designer`, `Visual Storyteller`                   |
| S.14 | **Poarta de tester**                                                                                                                                                                                                                | vezi mai sus                                          |

**Riscuri anticipate și prevenire (Etapa S):**

- _Apple 5.1.1(ix):_ datele sensibile de sănătate ar trebui trimise de o firmă. Dacă suntem respinși pe asta, soluția e SRL-ul (G.0a).
- _Regula 2.5.19:_ obiectivele ascunse pe iOS nu se pornesc prin EAS Update. OTA doar pentru reparații.
- _Linkuri legale lipsă:_ fără ele, butoanele de pe ecranul de abonament ajung ascunse. Prevenire: `assertProductionEnv` refuză build-ul de producție fără linkuri.
- _Întreținerea anuală:_ target API până la 31 aug, Billing v8 expiră 31 aug 2027, iOS 27 SDK din aprilie 2027, pagini de 16 KB din 1 feb 2027. Lista e în `docs/LAUNCH_PLAN.md`.

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

| #     | Pas                                                                                                                                                                              | Unealtă                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| E.1   | Postul: `fastingLevel` calculat din ingrediente (`strict`, `fish_allowed`, `none`) + teste pe 10 rețete                                                                          | `tdd-guide`                          |
| E.2   | Preferința `fastingMode` (oprit / tot timpul / miercuri și vineri) + validare + sync (preferințele noi trec prin `parseUserPreferences`)                                         | `tdd-guide`, `security-reviewer`     |
| E.3   | Dezlegarea la pește (comutator separat)                                                                                                                                          | `tdd-guide`                          |
| E.4   | Planificatorul respectă postul pe zilele alese + test pe o săptămână                                                                                                             | `tdd-guide`                          |
| E.5   | Ecranul: comutatorul „De post” în onboarding și în filtre                                                                                                                        | `frontend-developer`                 |
| E.6   | Lotul 1: **10 rețete de post** (fasole bătută, iahnie, linte, plachie, sarmale de post…)                                                                                         | `tdd-guide` (testele de catalog)     |
| E.7   | Lotul 2: **11 paste** (pomodoro, aglio olio, pasta e fagioli, paste cu ton…)                                                                                                     |                                      |
| E.8   | Lotul 3: **11 salate și bowl-uri** (linte cu feta, tabbouleh, năut, niçoise de buget…)                                                                                           |                                      |
| E.9   | Lotul 4: **9 picante / mexicane** (burrito bowl, tacos de pui, huevos rancheros…)                                                                                                |                                      |
| E.10  | Lotul 5: **8 grătar** (frigărui, kofta, fajitas, tandoori la cuptor, ceafă cu mujdei), toate și la tigaia grill                                                                  |                                      |
| E.11  | Lotul 6: **8 fast-food de casă** (shaorma, „KFC” la cuptor, egg fried rice…)                                                                                                     |                                      |
| E.12  | Lotul 7: **8 pește ieftin și leguminoase** (cod, merluciu, macrou, năut), ca să avem mai puțin pui și somon                                                                      |                                      |
| E.13  | Lotul 8: **7 clasice românești lipsă** (ciorbă de fasole cu tarhon, zamă, gulaș…), verificate ca idee după Sanda Marin și Radu Anton Roman                                       |                                      |
| E.14a | Fotografii, sursa 1: **Wikimedia Commons** (credit afișat), pentru cele **13 rețete fără poză** de azi și pentru rețetele noi; fiecare poză trebuie să arate exact acel preparat | `verify-render`                      |
| E.14b | Sursa 2: **Unsplash** (cheie gratuită de dezvoltator, ținută doar local, niciodată în git), pentru ce n-a acoperit Commons                                                       | `security-reviewer`, `verify-render` |
| E.14c | Sursa 3: **imagini generate cu AI** (serviciul tău), marcate „imagine ilustrativă” în aplicație, pentru ce a rămas                                                               | `verify-render`                      |
| E.14d | Test: **fiecare rețetă are fotografie**. Cardul desenat din ingrediente rămâne doar rezervă când poza nu se încarcă, cu culori naturale de mâncare                               | `tdd-guide`                          |
| E.15  | Raport: poftele și obiectivele noi pe catalog (câte rețete are fiecare)                                                                                                          | –                                    |
| E.16  | **Poarta de tester**                                                                                                                                                             |                                      |

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
| G.0a | Forma juridică și adresa publică (LG-3, LG-30, GP-1, GP-5, AS-2, AS-3): persoană fizică, PFA sau SRL; adresa la un sediu virtual sau de domiciliere | tu + avocat   |
| G.0b | Taxe și TVA înainte de primul încasament (LG-4, LG-5, LG-6, AS-4, GP-8): categoria de venit, Declarația unică, cod TVA art. 317 (formularul 700) și D390, taxare inversă D301, W-8BEN | contabil      |
| G.0c | Marca „SmartMeal” (LG-29): conflict posibil cu „SmartMeal AI”, „SmartMeal” și „SMART MEAL PLANNER”; decizia înainte de listări și de domeniu | avocat        |
| G.1 | Găsești un dietetician autorizat (Colegiul Dieteticienilor din România)                    | tu            |
| G.2 | Îi trimiți fișa din C.12 / F.9; eu aplic corecturile                                       | tu + eu       |
| G.3 | Avocat: textele finale, Reg. 1924/2006, încadrarea MDR; revizuiește și Termenii (LG-12) și răspunde la întrebările din `docs/research/STORE_REQUIREMENTS.md` §6 | tu            |
| G.4 | Eu aplic observațiile avocatului; obiectivele rămân ascunse până la ambele avize           | eu            |
| G.5 | `LAUNCH_PLAN.md`: contul Apple și Google după decizia G.0a (persoană fizică sau firmă); DSA trader cu adresa, telefonul și emailul publice; sănătate ascunsă pe iOS; dacă Apple respinge pe 5.1.1(ix), firma e planul B | `doc-updater` |

**Pentru dietetician (Etapa G)** — rămase neschimbate în A.8b, de verificat cu valorile calculate (estimările mele, nu ale aplicației):

- C1 `healthSpecialtyRecipes.ts` somon cu turmeric: „Somon bogat în omega-3” (pragul: EPA+DHA ≥ 80 mg/100 g; probabil atins).
- C2 `extendedRecipes.ts` păstrăv la cuptor: „O cină ușoară, bogată în omega-3.” (același prag; probabil atins).
- C3 `healthSpecialtyRecipes.ts` budincă de chia: „bogată în fibre, fără zahăr adăugat” (~3,9 g fibre/100 kcal ≥ 3; „fără zahăr adăugat” e adevărat).
- C4 `healthSpecialtyRecipes.ts` omletă: „Mic dejun proteic” (~20 g proteine; formulare vagă).
- C5 `extendedRecipes.ts` salata de ton: „concentrat în proteine” (probabil ≥ 20 % din energie).
- „sățios / sățioasă” (mai multe descrieri, „🥣 Sățios”, „Proteic & Sățios”): sațietatea e tehnic o mențiune de funcție, dar în română e cuvânt culinar.
- „🥑 Grăsimi bune” (cardul de salate): aceeași formulare ca obiectivul „Grăsimi bune, puțină sare”.
- „Bogat în Proteine” e o mențiune reglementată (≥ 20 % din energie din proteine); testul verifică doar ≥ 28 g pe porție.
- `src/utils/dietCompatibility.ts:52`: „grăsimi sănătoase” (în afara catalogului; nu e verificat de test).

---

## Ordinea

**0 → T → A → S → lansare 1.0 → D → B → C → E → F**, cu G pornit acum: G.0a–c înainte de conturile din magazine, iar dieteticianul are nevoie de fișa din C.12.

Testul închis Google (12 testeri × 14 zile, GP-4) pornește cu primul build după A + S, în paralel cu D. E drumul critic.
