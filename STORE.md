# Publicarea în App Store și Google Play

Tot ce trebuie făcut, în ordine. Ce e bifat e gata în repo; ce nu, cere o acțiune de la tine.

---

## 1. Backend — înainte de orice build

Fără pasul ăsta aplicația pornește, dar contul și sincronizarea nu funcționează, iar datele
nu sunt protejate.

- [ ] `supabase login` și `supabase link --project-ref <ref>`
- [ ] `supabase db push` — rulează migrațiile **0001** (tabela planurilor, RLS, limite de
      mărime), **0002** (limita de rată partajată pentru AI) și **0003** (mementourile)
- [ ] în Supabase → Authentication → Email: activează **Confirm email** și verifică șablonul
      de recuperare a parolei. Codul de șase cifre din email e ce tastează utilizatorul
      înapoi în aplicație
- [ ] Authentication → Policies: ridică lungimea minimă a parolei la **10** (aplicația o
      verifică deja pe telefon, dar serverul trebuie să fie de acord)
- [ ] `supabase secrets set GEMINI_API_KEY=<cheia>`
- [ ] `supabase secrets set ALLOWED_ORIGINS=https://domeniul-tau.ro`
- [ ] `supabase functions deploy proxy-gemini-plan`
- [ ] `supabase functions deploy delete-account` — **obligatorie**, altfel butonul de ștergere
      a contului din aplicație nu are ce apela, iar submisia e respinsă
- [ ] în `.env`: `EXPO_PUBLIC_SUPABASE_URL` (obligatoriu `https://`) și
      `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] pune o **alertă de buget** pe proiectul Google Cloud pentru cheia Gemini

Cheia `service_role` nu se pune niciodată în `.env` și nu ajunge niciodată în client.
Supabase o injectează singur în funcțiile edge.

## 2. Configurația aplicației — gata

- [x] `eas.json` cu profiluri development / preview / production
- [x] `app.json`: icon, splash, adaptive icon, favicon
- [x] `ios.bundleIdentifier` și `android.package`: `ro.smartmeal.app`
- [x] `ios.buildNumber` și `android.versionCode` (production le incrementează singur)
- [x] `ios.privacyManifests` — declară accesul la `NSUserDefaults` (motiv `CA92.1`), cerut de
      Apple din mai 2024
- [x] `NSAppTransportSecurity` fără excepții — tot traficul e https
- [x] `ITSAppUsesNonExemptEncryption: false` — aplicația nu implementează criptografie proprie
- [x] Android cere o singură permisiune, `INTERNET`; locația, camera, microfonul și contactele
      sunt blocate explicit ca să nu le adauge vreo dependență

**Imaginile sunt generate, nu desenate de un om.** Sunt curate și corect dimensionate, dar
înlocuiește-le când ai identitate vizuală: `assets/icon.png` (1024×1024),
`assets/adaptive-icon.png` (1024×1024, marca în treimea din mijloc),
`assets/splash.png`, `assets/favicon.png`.

## 3. Politica de confidențialitate

- [x] `PRIVACY.md` — prima variantă, scrisă pe ce colectează aplicația de fapt
- [ ] **completează** operatorul, adresa și emailul de contact
- [ ] publică-o la un URL public și stabil; ambele magazine cer link-ul
- [ ] citește-o o dată cap-coadă — răspunderea e a operatorului, nu a documentului

## 4. Build

```bash
npm install -g eas-cli
eas login
eas build:configure

eas build --platform android --profile production
eas build --platform ios --profile production
```

Pentru iOS îți trebuie cont Apple Developer (99 USD/an). Pentru Android, cont Google Play
Console (25 USD, o dată).

## 5. Ce declari în formularele magazinelor

Răspunde exact așa — corespunde cu ce face codul:

| Întrebare | Răspuns |
| --- | --- |
| Colectați date? | Da |
| Ce tip | **Contact Info → Email Address** și **Health & Fitness → Health** (alergiile și restricțiile alimentare) |
| Legate de identitate? | Da, dacă utilizatorul își face cont |
| Folosite pentru urmărire? | **Nu** |
| Folosite pentru publicitate? | **Nu** |
| Partajate cu terți? | Doar procesatori: Supabase (găzduire) și Google Gemini (sugestii AI, fără date de identificare) |
| Ștergerea contului | Da, din aplicație: ecranul de cont → „Șterge contul și datele mele" |
| Notificări | Locale, programate pe telefon. Nu există push de pe server, deci nu se colectează token-uri de notificare |

Google Play cere în plus o **adresă web** de la care se poate cere ștergerea contului. Pune un
formular sau adresa de email din politică.

## 6. Găzduirea versiunii web

Dacă publici și varianta web, serverul trebuie să trimită anteturile astea. Nu pot fi setate
din aplicație — se pun în configurația gazdei (Vercel, Netlify, nginx).

```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://<ref>.supabase.co;
  img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none';
  frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Pe web, sesiunea stă în `localStorage`, fiindcă browserul nu are seif. Politica de conținut
de mai sus e ce o protejează — nu sări peste ea.

## 7. Înainte de fiecare urcare

```bash
npm run typecheck && npm run lint && npm test
```

Toate trei trebuie să iasă curate. Pragurile de acoperire sunt în `jest.config.js`; dacă pică,
adaugă teste, nu coborî pragul.
