# HANDOFF.md

**Sesiune:** 2026-09-25 · `main` · pregătită pentru magazine, în limita a ce se poate face din cod

## Unde am rămas

Toate cele 20 de defecte din review sunt reparate (sesiunea anterioară). Apoi: configurația
completă pentru App Store și Google Play, imaginile de aplicație, politica de confidențialitate,
și o rundă de întărire a securității pe client și pe server.

## Starea, rulată la închidere

```
TESTE 89 suite / 738 teste · TYPECHECK 0 · LINT 0
COVERAGE 87,47 / 68,85 / 87,99 / 88,97 — toate pragurile trecute
BUNDLE 0 chei, 0 cârlige de depanare
GIT curat
```

## Următorul pas exact

**`STORE.md`, secțiunea 1.** Rulează `supabase db push` și publică cele trei funcții edge.
Până atunci butonul de ștergere a contului există în aplicație dar nu are ce apela, iar fără
migrația 0001 nu există RLS.

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
  scurse. Verificată pe telefon *și* de setat în Supabase (vezi `STORE.md` §1).
- **Mementouri**: unul pe fiecare zi de gătit, cu numele felului din plan, și unul săptămânal
  pentru cumpărături. Programate **local**, deci merg fără internet și nu colectează niciun
  token de notificare. Migrația **0003** ține alegerea, nu mementoul, ca să urmeze contul pe
  alt telefon.
- **Poarta de la prima pornire**: te conectezi sau îți faci cont înainte de a folosi
  aplicația. „Continuă fără cont" există și rămâne — fără ea, Apple respinge la 5.1.1(i).
  Sesiunea e de 30 de zile, dar **asta se setează în proiectul Supabase**
  (Authentication → Sessions), nu din cod; dacă serverul expiră tokenul mai devreme, omul e
  scos afară oricât ar spune aplicația altceva. Vezi `STORE.md` §1.
- **Simularea locală de conturi** (`localAuthSimulation`): pornește doar când *nu* există
  Supabase configurat **și** mediul nu e `production`. Ține o amprentă, nu parola. Codul de
  resetare e fix, `123456`, ca să poți parcurge fluxul fără email.
- **Mementouri pe email, la 2–7 zile** (implicit 3): comutatorul apare doar cu cont, fiindcă
  fără cont n-ar avea unde trimite. Migrația **0004** ține frecvența și ultima trimitere;
  funcția edge `send-reminder-emails` le trimite prin Resend, apărată de `x-cron-secret`.
  **Nu trimite nimic până nu faci pașii din `STORE.md` §1b** — până atunci comutatorul doar
  salvează alegerea, ceea ce e în regulă: la lansare preferința omului există deja.

## Ce e blocat — doar de tine

1. **`supabase db push`** (acum patru migrații) și publicarea celor trei funcții edge.
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

1. Îți trebuie un formular web de ștergere a contului, pentru cerința Google Play, sau e
   suficientă adresa de email din politică?
2. Cel mai slab fișier rămas e `OnboardingWizard` la 72%, iar restul sunt servicii care cer
   Supabase real ca să fie testate cinstit. Mai insistăm sau ne oprim aici cu testele?
