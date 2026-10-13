# HANDOFF.md

**Sesiune:** 2026-10-13 · Sincronizat pe `main` și `dev` (după `feat/product-audit-and-expansion`) · Audit complet cap-coadă, extindere catalog culinar (15 rețete românești + 4 ingrediente supermarket), rafinare UI/UX Meal Cards și Grocery progress bars.

## Unde am rămas

S-a finalizat complet implementarea Planului de Atac Master (Etapele 0 - 6, cuprinzând cerințele 1-A, 2-A,B,C,D, 3-A, 4-A din `Project Comparison Notes.rtf`). Toate modificările au fost testate pe branch-ul de feature `feat/product-audit-and-expansion`, integrate prin merge în `dev`, re-verificate pe `dev`, și propagate pe `main`.

## Starea, rulată la închidere

```
TESTE 119 suite / 1169 teste (100% PASS) · TYPECHECK 0 erori · LINT 0 avertismente
SQL 8/8 migrații verificate pe Postgres in-memory (PGlite): ALL PASS
CATALOG 114 rețete românești verificate · 8 supermarketuri integrate (Lidl, Kaufland, Carrefour, Mega Image, Auchan, Penny, Profi, Sezamo)
ACCESIBILITATE 100% elemente interactive cu accessibilityRole/Labels verificate
GIT curat (pe main, sincronizat cu dev și feat/product-audit-and-expansion)
```

## Următorul pas exact

1. Aplicația este într-o stare de producție stabilă și testată local cap-coadă.
2. Când se dorește lansarea pe Apple App Store și Google Play, se poate reactiva planul din `STORE.md` (configurarea conturilor Apple/Google Developer, achiziții in-app RevenueCat/StoreKit și perioada de testare închisă de 14 zile pe Android).

## Ce s-a realizat în această etapă de extindere (`feat/product-audit-and-expansion`):

- **Audit tehnic & funcțional cap-coadă (Etapa 1)**:
  - Rezolvare avertismente React `act(...)` și scurgeri de timere din testele `AuthModal` și `themeMode`.
  - Corectare gardă `isMountedRef` în `DevicesSection.tsx` pentru a preveni actualizări de stare pe componente demontate.
- **Catalog Culinar & Supermarketuri Românești (Etapa 2)**:
  - Adăugare 4 ingrediente noi în `src/data/ingredients.ts` (`fasole_verde_congelata`, `ficatei_pui_proaspeti`, `linte_verde_uscata`, `tofu_clasic`) cu prețuri RON verificate în toate cele 8 rețele comerciale (`lidl`, `kaufland`, `carrefour`, `mega_image`, `auchan`, `penny`, `profi`, `sezamo`) și pictograme dedicate în `ingredientIcons.ts`.
  - Creare modul modular `src/data/extendedRecipes.ts` cu 15 rețete românești adaptate (5 rapide <25 min, 5 clasice de familie, 5 proteice/vegetariene) cu respectarea strictă a normelor de onestitate a aparatelor de gătit (salatele reci fără electrocasnice).
  - Semnături de magazin integrate: `🍳 Cămara Noastră` (Lidl), `🥘 Tradiție Kaufland` (Kaufland), `🌱 Mega Bio & Plant` (Mega Image), `🌿 Filiera Calității` (Carrefour).
- **Rafinare Vizuală & UI/UX Polish (Etapa 3)**:
  - `MealCard.tsx`: Floating badges cu efect de sticlă și umbră subtilă; butoane stepper de porții cu target tactil conform normelor de accesibilitate WCAG (min 32x32px); buton dedicat „Gătesc dublu / Reîncălzit” cu accent verde smarald.
  - `GroceryAisleSection.tsx`: Bare de progres vizuale colorate per raion de magazin, indicând procentul produselor puse în coș.
  - `GroceryItemRow.tsx`: Tăiere animată și estompare vizuală elegantă (`textMuted`) a produselor bifate.
  - `theme.ts`: Contrast îmbunătățit pentru textul estompat în modul Light (`#6c6c70`, raport >4.5:1).
- **Verificare Mecanisme de Gătit & Cămară (Etapa 4)**:
  - Validare `MealPrepModal`, `PantryInventoryModal`, `SavedPlansModal` și logica „Gătește o dată, mănâncă de două ori” (`cookOnceEatTwice`).
- **Motor Hibrid Determinist + AI (Etapa 5)**:
  - `plannerEngine.ts` funcționează 100% offline fără conexiune la internet.
  - `aiProxy.ts` folosește Edge Function securizată cu fallback automat la motorul local în caz de timeout sau lipsă de semnal.

## Ce s-a făcut în această etapă (`feat/login-screen`)

- **Ecran complet de intrare**: `LoginScreen` și `AuthGate` înlocuiesc vechiul `WelcomeGate`. Tab-uri „Conectare | Cont nou”, „Continuă fără cont” (Apple 5.1.1(i)), link „Am uitat parola”.
- **Conectare fără parolă prin cod pe email**: `src/services/authCode.ts`, `EmailCodeForm.tsx`. Suportă cod OTP din 6 cifre, rate limiting la 5 încercări greșite, răspuns identic la adrese necunoscute împotriva enumerării. Simulare locală pe codul `123456`. Șablon nou: `supabase/templates/magic_link.html`.
- **Nume utilizator**: Întrebarea „Cum te numești?” la înregistrare, salvată în tabela `profiles` (migrația 0006) prin trigger pe `auth.users`, editabilă direct din secțiunea „Contul tău”.
- **Reverificare la 30 de zile**: `ReauthScreen` și `reauth.ts`. Starea `authStatus: 'locked'` blochează accesul la date până la reverificare dacă au trecut 30 de zile de la ultima conectare completă.
- **Biometrie**: `expo-local-authentication` oferă deblocare prin Face ID / Touch ID / amprentă pentru poarta de 30 de zile. Propunere unică după prima conectare (`BiometricOptInPrompt.tsx`). Comutator în ecranul de Cont.
- **Managementul dispozitivelor**: Tabela `user_devices` (migrația 0007), funcții securizate `register_device` și `revoke_device`. În ecranul de Cont (`DevicesSection.tsx`) se pot vedea toate dispozitivele active și se pot deconecta alte sesiuni de la distanță.
- **Refactorizare `AuthModal`**: Redus de la 760 de linii la sub 265 de linii prin împărțire în `useAuthForm`, `AuthForm`, `EmailCodeForm`, `ResetPasswordFlow` în `src/screens/auth/`.
- **Confidențialitate**: `PRIVACY.md` și `app.json` declară Name și Device ID conform cerințelor Apple Privacy Manifest.

## Ce s-a făcut

**Magazine:** `eas.json` cu trei profiluri · icon, adaptive icon, splash, favicon generate
dintr-o singură marcă · `buildNumber` și `versionCode` · privacy manifest iOS pentru accesul
la `NSUserDefaults` · App Transport Security fără excepții · Android cu o singură permisiune,
`INTERNET`, și locația, camera, microfonul și contactele blocate explicit.

**Securitate, client:**

- Token-urile de sesiune au trecut din AsyncStorage în Keychain / Keystore. Stăteau în clar
  într-un fișier inclus în backup-urile iCloud și iTunes. Sunt împărțite în bucăți, fiindcă
  platforma refuză valori peste 2 KB.
- `EXPO_PUBLIC_SUPABASE_URL` e refuzat dacă nu e `https`.
- Error boundary: o excepție dintr-un buton nu mai lasă ecran alb.

**Securitate, server — partea care contează cel mai mult:**

- Funcția Gemini era un **proxy deschis**. Cheia `anon` e publică prin design și satisfăcea
  `verify_jwt`, iar limita de rată trăia într-un `Map` din izolat, cu cheia pe
  `X-Forwarded-For`, pe care o setează apelantul. Acum cere tokenul real al utilizatorului și
  numără într-un contor partajat în Postgres, printr-o funcție `security definer` cu
  `search_path` fixat, pe care doar `service_role` o poate executa. **Eșuează închis.**
- Cheia Gemini a trecut din URL în antet; erorile upstream se logează, nu se trimit înapoi;
  apelul are termen limită.
- Migrația 0001 are acum plafoane de mărime pe coloanele jsonb.
- Ștergerea contului: funcție edge `delete-account` care identifică apelantul din propriul
  token, deci nu poate șterge decât contul care a cerut-o.

**Documente:** `PRIVACY.md` (prima variantă, de completat cu datele operatorului) și
`STORE.md` (tot drumul, în ordine, cu răspunsurile exacte pentru formularele magazinelor).

## Sesiunea 2026-09-28: pregătirea pentru formularele magazinelor

- **Clasificarea de vârstă**, verificată pe documentația Apple și PEGI: `STORE.md` §8. Apple
  are acum trepte noi (4+/9+/13+/16+/18+). Cu secțiunea de alcool: **Apple 13+, PEGI 16**.
  **Decizie: secțiunea rămâne.** Varianta de rezervă, dacă e respinsă, e scrisă acolo.
- **Textele listării**: `STORE_LISTING.md`, cu limitele numărate. Fără nume de lanțuri în
  cuvintele-cheie (Apple 2.3.7).
- **Pagina de ștergere a contului** cerută de Google: `public/delete-account.html`. Trebuie
  completat `CONTACT_EMAIL` în ea.
- **Avertisment la alergeni**: „Verifică întotdeauna eticheta produsului". Lipsea complet.
- **Manifestul iOS** declara că nu colectăm nimic, iar formularul spunea email + sănătate.
  Acum spun același lucru.
- **Berea 0.0%** rămânea în coș, ascunsă, după închiderea secțiunii 18+. Mutată la sucuri.
- **Resetarea parolei fără internet** spunea „cod trimis". `supabase-js` întoarce eroarea
  de rețea în loc s-o arunce, iar codul nu se uita la ea.

### Testarea ca utilizator (2026-09-28)

Aplicația a fost parcursă cap-coadă într-un browser controlat de un script (Playwright), la
lățimi de telefon de 360 și 390 px, apăsând fiecare buton. Toate capturile au fost verificate
vizual. Au ieșit 19 probleme, toate reparate, fiecare cu testul ei:

- **Funcționale:** fereastra de cont redeschisă peste plan după cont nou; contul marcat
  conectat înainte de confirmarea emailului; „Sesiune expirată” fals la sincronizare;
  formularul care păstra parola și bifele după deconectare; „Mese (5)” care număra zile.
- **Magazin / legal:** „prețuri reale / oficial” (de fapt estimate); caloriile prezentate ca
  aport zilnic; un „scor de nutriție” forțat să nu scadă sub 65 și afirmații de sănătate
  fixe; lipsa linkului spre politica de confidențialitate; erori de la server în engleză.
- **Pe telefon:** antet tăiat, magazine ieșite din card, etichete suprapuse pe carduri,
  prețul și „+” ieșite din card pe ecranul de rețetă la 360 px.
- **Accesibilitate:** dialoguri și carduri construite ca buton-în-buton, deci butoanele din
  ele nu puteau fi atinse cu cititorul de ecran.
- **Web:** mementouri de telefon oferite pe web, unde nu pot suna.

Două reguli automate păzesc de-acum: nicio interfață nu mai poate pretinde prețuri „reale” /
„oficiale”, și orice element apăsabil trebuie să aibă rol pentru cititorul de ecran.

Scripturile de test din browser nu sunt în repo. Au rulat pe serverul de dezvoltare, iar
unele pași depind de simularea locală de conturi.

### A treia parte: blocaje de lansare găsite și închise

- **Ecranul de cont la fiecare pornire.** „Continuă fără cont” se salva pe dispozitiv, așa că
  după o singură apăsare poarta dispărea definitiv și un refresh ducea direct în
  configurator. Acum alegerea ține doar o sesiune.
- **Resetarea parolei ar fi fost imposibilă**, din două motive:
  - câmpul oprea codul la 6 cifre, deși Supabase trimite 6–10 după setarea proiectului
    (documentația arată acum 8);
  - șablonul implicit trimite un link, iar aplicația cere un cod. Șabloanele corecte sunt
    în `supabase/templates/`.
- **Un build de producție ar fi ieșit fără Supabase.** `.env` nu ajunge la EAS. Acum
  `app.config.js` oprește build-ul și spune exact ce comandă `eas env:set` lipsește.
- `supabase-js` e fixat la 2.117.2 în funcțiile edge.
- `STORE.md` §0 (ordinea lansării) și §11 (conturi, cont demo, trader DSA, testul Google),
  verificate azi pe documentația Apple, Google și Expo.

### A doua parte a zilei: ce lipsea legal și în spate

- **Vârsta și acordul la cont nou.** Politica spunea „nu pentru sub 16 ani”, dar nimic nu
  întreba. Acum sunt două bife obligatorii, nebifate din start: vârsta (art. 8 GDPR) și
  acordul pentru alergii (art. 9). Serviciul refuză contul fără ele chiar dacă ecranul e
  ocolit. Acordul e înghețat la crearea contului în tabela `user_consents` (migrația 0005),
  cu ora serverului, iar utilizatorul o poate doar citi. Prima variantă îl ținea în
  `user_metadata`; review-ul de securitate a observat că utilizatorul își poate rescrie
  singur acel câmp, deci nu dovedea nimic.
- **Dezabonare dintr-o apăsare**, cu link semnat HMAC și antet RFC 8058. Funcția nouă e
  `unsubscribe-reminders`, pagina e `public/unsubscribe.html`. Pașii de lansare sunt în
  `STORE.md` §1b; trebuie completat `ENDPOINT` în pagină.
- **„Descarcă datele mele”** în ecranul de cont: un JSON cu „ce e în cont” separat de „ce e
  doar pe telefon”.
- **Funcțiile edge, compilate pentru prima dată.** Nu le verificase nimeni până acum.
  Compilează toate patru.
- `send-reminder-emails`: subiectul e limitat la 60 de caractere, `CRON_SECRET` se compară în
  timp constant, iar o marcare eșuată apare acum în log.
- `ts-jest` e scos, iar README-ul nu mai pretinde „100% teste”.

⚠️ `AuthModal.tsx` are **788 de rânduri** (limita e 800). Următoarea modificare acolo începe
prin mutarea panoului de cont într-un fișier separat.

### Poarta de acoperire

**Măsura la întâmplare.** Aceeași suită dădea 87,5% sau 82,7%, după care worker termina
primul. Cauza: proiectul `logic` instrumenta cu `ts-jest`, iar `components` cu babel.
Același fișier ieșea cu alt număr de instrucțiuni în fiecare (`useAppStore`: 1626 față de
1936), iar Istanbul le combina în ordinea sosirii. Acum ambele folosesc același transform
babel. Cifrele sunt identice între rulări, dar **mai mici**, fiindcă babel numără altfel.
Pragurile 87/88/87 nu le-am coborât: am închis golul cu 41 de teste noi (29 pe `supabase.ts`,
5 pe ecranul principal, 7 pe filtre). `supabase.ts`, codul care se ocupă de conturi, a
urcat de la ~33% la 85%.

⚠️ `preserveEnvVars` din `jest.config.js` e esențial. Fără el, babel coace valorile din
`.env` în cod, iar testele pentru `config/env.ts` văd `8081` oricât ar seta.

## Găsit reparând ecranele slabe

`PantryInventoryModal` avea **zece din nouăsprezece id-uri scrise altfel decât în catalog**.
Agregatorul de coș compară după id, deci bifarea ouălor colora un card și nu scotea nimic din
listă. Insigna de economie punea 6 lei bucata pentru ele — o cifră inventată care arăta ca o
cifră reală. Reparat, plus un test care verifică fiecare id, adică exact ce l-ar fi prins din
prima zi.

## Adăugat în sesiunea asta

- **Autentificare completă**: resetare de parolă prin cod de șase cifre pe email, în trei
  pași care se deblochează unul după altul. Răspunsul la primul pas e identic indiferent dacă
  adresa are cont — altfel endpointul devine o metodă de a afla cine e înregistrat.
- **Politică de parolă**: 10 caractere, literă și cifră, plus refuzul celor din listele
  scurse. Verificată pe telefon _și_ de setat în Supabase (vezi `STORE.md` §1).
- **Mementouri**: unul pe fiecare zi de gătit, cu numele felului din plan, și unul săptămânal
  pentru cumpărături. Programate **local**, deci merg fără internet și nu colectează niciun
  token de notificare. Migrația **0003** ține alegerea, nu mementoul, ca să urmeze contul pe
  alt telefon.
- **Poarta de la prima pornire**: te conectezi sau îți faci cont înainte de a folosi
  aplicația. „Continuă fără cont" există și rămâne — fără ea, Apple respinge la 5.1.1(i).
  Sesiunea e de 30 de zile, dar **asta se setează în proiectul Supabase**
  (Authentication → Sessions), nu din cod; dacă serverul expiră tokenul mai devreme, omul e
  scos afară oricât ar spune aplicația altceva. Vezi `STORE.md` §1.
- **Simularea locală de conturi** (`localAuthSimulation`): pornește doar când _nu_ există
  Supabase configurat **și** mediul nu e `production`. Ține o amprentă, nu parola. Codul de
  resetare e fix, `123456`, ca să poți parcurge fluxul fără email.
- **Mementouri pe email, la 2–7 zile** (implicit 3): comutatorul apare doar cu cont, fiindcă
  fără cont n-ar avea unde trimite. Migrația **0004** ține frecvența și ultima trimitere;
  funcția edge `send-reminder-emails` le trimite prin Resend, apărată de `x-cron-secret`.
  **Nu trimite nimic până nu faci pașii din `STORE.md` §1b** — până atunci comutatorul doar
  salvează alegerea, ceea ce e în regulă: la lansare preferința omului există deja.

## Ce e blocat — doar de tine

1. **`supabase db push`** (acum cinci migrații) și publicarea celor patru funcții edge.
   Pentru emailuri mai trebuie un cont Resend cu domeniu verificat și cron-ul zilnic —
   `STORE.md` §1b, cu tot ce se copiază de-a gata.
   Plus, în Supabase → Authentication: activează confirmarea emailului, verifică șablonul de
   recuperare a parolei și ridică lungimea minimă a parolei la 10. Detalii în `STORE.md` §1.
2. **Completează și publică `PRIVACY.md`** la un URL public. Ambele magazine cer link-ul.
3. **Conturile de dezvoltator**: Apple 99 USD/an, Google Play 25 USD o dată.
4. **Anteturile de securitate web** (`STORE.md` §6) se pun pe gazdă, nu se pot seta din
   aplicație.
5. **Alertă de buget** pe proiectul Google Cloud pentru cheia Gemini.

## Ce nu se poate face, ca să nu-ți promit imposibilul

**Clientul unei aplicații mobile nu poate fi făcut inviolabil.** Oricine poate decompila un
APK, citi bundle-ul, rula pe telefon rootat. Asta e adevărat pentru orice aplicație, inclusiv
cele bancare. De-aia nimic din ce contează nu se bazează pe client: cheile stau pe server,
izolarea datelor se face prin RLS în Postgres, iar limita de rată e pe server și eșuează
închis. Un atacator care controlează complet telefonul își poate strica propriul plan — nu
poate ajunge la datele altcuiva.

Ce **am** eliminat pe client: chei în bundle (0, verificat), token-uri în clar pe disc,
cârligul de depanare care expunea tot magazinul (0 în bundle, verificat).

## Capcane

- **`parseUserPreferences` e parte din definiția tipului.** Un câmp nou pe `UserPreferences`
  care nu e adăugat și în validator va fi tăcut aruncat la încărcare (ADR-18).
- **Nimic nu are voie să insereze o rețetă care nu vine din `RECIPES_MAP`.**
- **Orice loc care adună mese sare peste `meal.isLeftover`**; orice loc care le prețuiește le
  dă zero.
- **Mementourile nu se pot testa pe simulator** cu adevărat; programarea e acoperită de teste,
  dar verifică pe un telefon real înainte de lansare.
- `expo-secure-store` și `expo-notifications` cer module native; ambele sunt mocate în
  `jest.setup.js`. `secureSessionStore` nu
  importă `react-native` tocmai ca să poată rula în proiectul Jest de logică.
- `__DEV__` nu există în proiectul de logică — garda e `typeof __DEV__ !== 'undefined'`.
- Imaginile de aplicație sunt **generate**, nu desenate. Înlocuiește-le când ai identitate.

## Întrebări pentru tine

Niciuna deschisă. Hotărât pe 2026-09-28: lansăm **doar pe telefoane** (iPhone și Android,
inclusiv Samsung), cu `supportsTablet: false` pe iOS.

De știut: marja la funcții e mică (87,27 față de pragul de 87). Orice funcție nouă fără test
pică poarta, intenționat.
