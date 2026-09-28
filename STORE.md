# Publicarea în App Store și Google Play

Tot ce trebuie făcut, în ordine. Ce e bifat e gata în repo; ce nu, cere o acțiune de la tine.

## 0. Ordinea lansării — citește asta întâi

Codul e gata. Ce a rămas cere conturile, banii sau datele tale, iar un pas durează **cel
puțin 14 zile** și nu poate fi grăbit. Ordinea de mai jos îl pornește cât mai devreme.

| Pas | Ce | Cât durează | Unde |
| --- | --- | --- | --- |
| 1 | Conturi de dezvoltator: Apple (99 USD/an), Google Play (25 USD o dată) | 1–3 zile (verificarea identității) | §11 |
| 2 | Supabase: migrații, funcții, șabloane de email, setări | ~1 oră | §1 |
| 3 | Completezi datele operatorului în `PRIVACY.md`, `delete-account.html`, `unsubscribe.html` și le publici pe domeniul tău | ~1 oră | §3, §6 |
| 4 | Variabilele EAS și primul build de producție | ~1 oră + build | §4 |
| 5 | **Google: test închis cu 12 testeri, 14 zile consecutive** | **minim 14 zile** | §11 |
| 6 | Apple: TestFlight, statut de trader DSA, cont demo pentru recenzie, trimitere | 1–3 zile de review | §11 |
| 7 | Google: ceri accesul la producție după cele 14 zile, apoi trimiți | câteva zile | §11 |

**Pe iOS poți ajunge în magazin în ~1 săptămână. Pe Android, nu mai devreme de ~3
săptămâni**, din cauza pasului 5. Pornește testul închis imediat după primul build.

---

## 1. Backend — înainte de orice build

Fără pasul ăsta aplicația pornește, dar contul și sincronizarea nu funcționează, iar datele
nu sunt protejate.

- [ ] `supabase login` și `supabase link --project-ref <ref>`
- [ ] `supabase db push` — rulează migrațiile **0001** (tabela planurilor, RLS, limite de
      mărime), **0002** (limita de rată partajată pentru AI), **0003** (mementourile),
      **0004** (mementourile pe email: frecvența și ultima trimitere) și
      **0005** (acordul de la crearea contului, înghețat într-o tabelă pe care utilizatorul
      n-o poate modifica)
- [ ] Authentication → Sign In / Providers → Email: activează **Confirm email**
- [ ] Authentication → **Email Templates**, lipește șabloanele din repo:
      - **Reset Password** ← `supabase/templates/recovery.html`. **Obligatoriu.** Șablonul
        implicit trimite un *link*, iar aplicația cere un *cod* (`{{ .Token }}`). Cu șablonul
        implicit, nimeni nu-și poate reseta parola.
      - **Confirm signup** ← `supabase/templates/confirmation.html`
      - subiectele sunt scrise în comentariul din capul fiecărui fișier
- [ ] lungimea codului (Email OTP Length) poate rămâne cum e: aplicația acceptă între 6 și
      10 cifre
- [ ] Authentication → URL Configuration → **Site URL** = adresa publică a site-ului tău, nu
      `localhost`. Linkul de confirmare a contului acolo duce după confirmare
- [ ] **trimite-ți singur o resetare** și parcurge-o cap-coadă în aplicație înainte de lansare
- [ ] Authentication → Policies: ridică lungimea minimă a parolei la **10** (aplicația o
      verifică deja pe telefon, dar serverul trebuie să fie de acord)
- [ ] `supabase secrets set GEMINI_API_KEY=<cheia>`
- [ ] `supabase secrets set ALLOWED_ORIGINS=https://domeniul-tau.ro`
- [ ] `supabase functions deploy proxy-gemini-plan`
- [ ] `supabase functions deploy delete-account` — **obligatorie**, altfel butonul de ștergere
      a contului din aplicație nu are ce apela, iar submisia e respinsă
- [ ] Authentication → Sessions: pune durata sesiunii pe **30 de zile**. Aplicația nu poate
      decide asta singură — ține de proiectul Supabase, iar dacă serverul expiră tokenul mai
      devreme, utilizatorul e scos afară oricât de mult ar spune aplicația altceva
- [ ] în `.env`: `EXPO_PUBLIC_SUPABASE_URL` (obligatoriu `https://`) și
      `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] pune o **alertă de buget** pe proiectul Google Cloud pentru cheia Gemini

Cheia `service_role` nu se pune niciodată în `.env` și nu ajunge niciodată în client.
Supabase o injectează singur în funcțiile edge.

### 1b. Mementourile pe email — se pornesc la lansare

Codul e scris și testat, dar nu trimite nimic până nu faci pașii ăștia. Până atunci
comutatorul din aplicație salvează alegerea și atât, ceea ce e în regulă: la prima trimitere
preferința omului există deja.

- [ ] cont [Resend](https://resend.com) și un domeniu verificat. Fără domeniu verificat
      emailurile ajung în spam sau sunt respinse
- [ ] `supabase secrets set RESEND_API_KEY=<cheia>`
- [ ] `supabase secrets set REMINDER_FROM='SmartMeal RO <noreply@domeniul-tau.ro>'`
- [ ] `supabase secrets set APP_URL=https://domeniul-tau.ro`
- [ ] `supabase secrets set CRON_SECRET=<un șir lung, aleator>` — funcția refuză orice apel
      care nu vine cu el în antetul `x-cron-secret`. Generează-l cu
      `openssl rand -base64 32`, nu din cap
- [ ] `supabase secrets set UNSUBSCRIBE_SECRET=<alt șir lung, aleator>` — **alt** șir decât
      `CRON_SECRET`, tot cu `openssl rand -base64 32`. Semnează linkurile de dezabonare.
      **Fără el funcția nu trimite nimic**: un email recurent fără link de dezabonare ar
      contrazice politica de confidențialitate
- [ ] `supabase functions deploy send-reminder-emails --no-verify-jwt` (o cheamă cron-ul, nu
      un utilizator; poarta e `x-cron-secret`)
- [ ] `supabase functions deploy unsubscribe-reminders --no-verify-jwt` (îl apasă cine citește
      emailul, fără să fie logat; poarta e semnătura din link)
- [ ] completează `ENDPOINT` în `public/unsubscribe.html` cu
      `https://<ref>.supabase.co/functions/v1/unsubscribe-reminders`
- [ ] programează-o zilnic, din SQL editor:

```sql
select cron.schedule(
  'smartmeal-reminder-emails',
  '0 8 * * *',
  $$select net.http_post(
      url := 'https://<ref>.supabase.co/functions/v1/send-reminder-emails',
      headers := '{"x-cron-secret":"<același șir>"}'::jsonb
  )$$
);
```

Rulează în fiecare zi, dar trimite doar cui i-a trecut intervalul ales (2–7 zile) de la
ultimul email — asta decide `reminders_due_for_email()` din migrația 0004, nu orarul cron.
`mark_reminder_email_sent()` se apelează **numai** după ce Resend confirmă, deci o pană de
email nu consumă intervalul.

- [ ] trimite-ți primul email ție, cu contul tău, și citește-l cap-coadă — inclusiv varianta
      text — înainte de a-l lăsa să plece către utilizatori reali
- [ ] în același email apasă **linkul de dezabonare** și apoi butonul „Dezabonare" al
      clientului de email (Gmail îl afișează lângă expeditor). Ambele trebuie să oprească
      emailurile; verifică în tabela `user_reminders` că `email_enabled` a devenit `false`

**Dezabonarea, pe scurt.** Linkul din email duce la `unsubscribe.html` pe domeniul tău, unde
omul apasă un buton. Pagina nu stă în funcția edge, fiindcă Supabase transformă răspunsurile
HTML în text simplu pe `*.supabase.co` dacă proiectul nu are domeniu propriu. Nimic nu se
dezabonează la simpla deschidere a linkului: filtrele antispam deschid automat linkurile și ar
dezabona oameni fără voia lor.

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
eas init            # leagă proiectul de contul tău Expo

# .env nu ajunge la EAS (e în .gitignore). Cheile de producție se pun aici, o singură dată.
# Cheia anon e publică prin design; service_role nu se pune NICIODATĂ aici.
eas env:set --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co
eas env:set --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <cheia anon>
eas env:list --environment production   # verifică

eas build --platform android --profile production
eas build --platform ios --profile production
```

**Build-ul de producție se oprește singur dacă lipsesc cheile** (`app.config.js`). Altfel
aplicația ar ieși cu ecranul de cont afișat și logarea imposibilă, adică primul lucru pe care
l-ar încerca recenzentul. Mesajul de eroare spune exact ce comandă lipsește.

## 5. Ce declari în formularele magazinelor

Răspunde exact așa — corespunde cu ce face codul:

| Întrebare                    | Răspuns                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colectați date?              | Da                                                                                                                                                                 |
| Ce tip                       | **Contact Info → Email Address** și **Health & Fitness → Health** (alergiile și restricțiile alimentare)                                                           |
| Legate de identitate?        | Da, dacă utilizatorul își face cont                                                                                                                                |
| Folosite pentru urmărire?    | **Nu**                                                                                                                                                             |
| Folosite pentru publicitate? | **Nu**                                                                                                                                                             |
| Partajate cu terți?          | Doar procesatori: Supabase (găzduire), Google Gemini (sugestii AI, fără date de identificare) și Resend (livrarea mementourilor pe email, numai dacă sunt pornite) |
| Ștergerea contului           | Da, din aplicație: ecranul de cont → „Șterge contul și datele mele"                                                                                                |
| Notificări                   | Locale, programate pe telefon. Nu există push de pe server, deci nu se colectează token-uri de notificare                                                          |

Google Play cere în plus o **adresă web** de la care se poate cere ștergerea contului fără
reinstalarea aplicației, cu numele aplicației exact ca în listare. Pagina e gata:
`public/delete-account.html`, servită la `https://domeniul-tau.ro/delete-account.html`.

- [ ] completează `CONTACT_EMAIL` în pagină — aceeași adresă ca în `PRIVACY.md`. Până atunci
      pagina arată doar ruta din aplicație și spune că adresa lipsește
- [ ] pune URL-ul în Play Console → **Data safety** → Account deletion

Ruta pe email e acceptată explicit de Google. N-am făcut formular cu autentificare pe web:
ar fi încă o suprafață de login de securizat și încă o pagină pe care o poate copia cineva
care vrea să fure parole, iar butonul din aplicație șterge deja pe loc.

**Ce se promite pe pagină trebuie să fie adevărat:** ștergerea completă în cel mult 30 de
zile. Când vine un email, ștergi contul din Supabase → Authentication → Users; tabelele au
`on delete cascade`, deci planurile și mementourile pleacă odată cu el.

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

# Funcțiile edge rulează pe Deno, nu în Jest. Deno nu trebuie instalat: vine din npm.
for f in supabase/functions/*/index.ts; do npx --yes deno check "$f" || exit 1; done
npx --yes deno test supabase/functions/_shared/
```

Toate trebuie să iasă curate. Pragurile de acoperire sunt în `jest.config.js`; dacă pică,
adaugă teste, nu coborî pragul.

## 8. Clasificarea de vârstă

Verificată pe 2026-09-28 pe documentația Apple (App Store Connect → Age ratings values and
definitions) și pe criteriile PEGI. **Apple a schimbat sistemul**: treptele sunt acum 4+, 9+,
13+, 16+, 18+. Vechile 12+ și 17+ se aplică doar sub OS 26. Recitește pagina înainte de
completare, fiindcă regulile se mai schimbă.

Ce contează la noi: **secțiunea de băuturi alcoolice** (9 produse cu alcool, cu mărci și
prețuri, ascunse după un comutator „18+"), plus **caloriile și macronutrienții** afișați la
fiecare rețetă.

### Apple — ce bifezi

| Întrebare din chestionar                              | Răspuns        | De ce                                                                              | Treaptă |
| ----------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------- | ------- |
| Alcohol, Tobacco, or Drug Use or References           | **Infrequent** | 9 produse, ascunse implicit; apar doar la cerere                                   | **13+** |
| Health or Wellness Topics                             | **Da**         | calorii, macronutrienți, diete (vegan, keto etc.)                                  | 9+      |
| Medical or Treatment Information                      | **None**       | filtrăm rețete; nu dăm diagnostic, tratament sau dozaj                             | —       |
| Unrestricted Web Access                               | **Nu**         | nu există browser în aplicație                                                     | —       |
| User-Generated Content                                | **Nu**         | nimic nu se publică între utilizatori                                              | —       |
| Messaging and Chat                                    | **Nu**         |                                                                                    | —       |
| Advertising                                           | **Nu**         |                                                                                    | —       |
| Gambling / Simulated Gambling / Loot Boxes            | **Nu**         |                                                                                    | —       |
| Contests                                              | **None**       |                                                                                    | —       |
| Age Assurance                                         | **Nu**         | comutatorul „18+" e o declarație, nu o verificare — nu-l prezenta drept verificare | —       |
| Parental Controls                                     | **Nu**         |                                                                                    | —       |
| Toate celelalte (violență, sex, limbaj, horror, arme) | **None**       |                                                                                    | —       |

**Rezultat: 13+.** Treapta finală e cea mai mare dintre cele atinse. Fără secțiunea de
alcool ar fi **9+**, din cauza caloriilor.

⚠️ „Infrequent" e o apreciere, nu o regulă. Dacă cel care face review-ul consideră că un raft
întreg de bere și vin e „Frequent", aplicația urcă la **18+**. Nu răspunde „None" ca să scapi
de treaptă: o declarație falsă e motiv de respingere la guideline 2.3.6.

### Google Play — chestionarul IARC → PEGI în România

Google nu-ți dă o treaptă direct. Completezi chestionarul IARC, iar el emite eticheta pentru
fiecare țară; în România aceasta e PEGI.

| Ce declari                                                          | Răspuns                                                                                                                                                                                                         |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipul aplicației                                                    | **All other app types**. Opțiunile sunt doar Game / Social or communication / All other app types. „Reference, News, or Educational" e altceva: e categorie de magazin, pentru Wikipedia sau aplicații de vreme |
| Referințe la alcool, tutun sau droguri                              | **Da, alcool**                                                                                                                                                                                                  |
| Vânzare sau facilitarea vânzării de alcool                          | **Nu**. Aplicația face listă de cumpărături, nu vinde și nu trimite spre un magazin online                                                                                                                      |
| Violență, sex, limbaj, jocuri de noroc                              | **Nu**                                                                                                                                                                                                          |
| Interacțiune între utilizatori, conținut generat, partajare locație | **Nu**                                                                                                                                                                                                          |
| Cumpărături digitale                                                | **Nu**                                                                                                                                                                                                          |

**Rezultat așteptat: PEGI 16.** Criteriul PEGI e categoric: **PEGI 12 nu permite deloc
referințe la alcool sau tutun**, iar descriptorul pentru alcool/droguri înseamnă întotdeauna
PEGI 16 sau 18. Fără secțiunea de alcool: **PEGI 3**.

### Regula care ține pe amândouă

Apple: „apps that encourage minors to consume [alcohol] will be rejected". Google: „depicting
or encouraging the use or sale of alcohol **to minors** is not allowed". Cu o clasificare de
13+ la Apple și 16+ la Google, aplicația e deschisă pentru minori. Comutatorul „18+" se
bifează dintr-un deget și nu verifică nimic. **Asta e riscul real**, mai mult decât
treapta în sine.

### Decizia: secțiunea rămâne (2026-09-28)

|                             | Apple                     | Google (PEGI) | Risc de politică               |
| --------------------------- | ------------------------- | ------------- | ------------------------------ |
| **Păstrată — asta am ales** | 13+ (sau 18+ după review) | 16            | comutatorul nu verifică vârsta |
| Scoasă, variantă de rezervă | 9+                        | 3             | niciunul                       |

Ca să treacă review-ul cu ea înăuntru:

- **Pune în „Notes for Review"** (App Store Connect) și în răspunsul la chestionarul Google:
  „Secțiunea de băuturi alcoolice e ascunsă implicit și apare doar dacă utilizatorul o
  activează dintr-un comutator marcat 18+. Aplicația nu vinde alcool și nu trimite spre magazine online;
  produsele intră doar pe lista de cumpărături." Toate trei afirmațiile sunt adevărate în cod.
- **Nu declara „Age Assurance"** la Apple — comutatorul nu e o verificare, iar o declarație
  falsă cântărește mai mult decât treapta.
- Dacă ești respins la **Apple 1.4.3** (alcool și minori) sau la politica Google de conținut
  restricționat, varianta de rezervă e o schimbare de o linie: nu mai randa categoria
  `drink_alcoholic` în `OnboardingWizard`. Testul din `src/data/__tests__/retailProducts.test.ts`
  garantează că nimic din categoria aceea nu rămâne atunci în coș.

Berea Cooler 0.0% a fost mutată la băuturi răcoritoare. Stătea sub eticheta de alcool, deci
era ascunsă de comutator, dar având `isAlcoholic: false` nu era scoasă din coș odată cu el.

## 9. Capturi de ecran și grafică

Nu le pot face eu. Cer un simulator sau un telefon real, iar capturile se fac cu **date
reale** din aplicație, nu machete — Apple respinge capturile care nu arată aplicația
(guideline 2.3.3).

### Apple

| Dispozitiv  | Dimensiune (portret) | Obligatoriu?                                                                                   |
| ----------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| iPhone 6.9" | 1320 × 2868          | **da**, între 1 și 10 capturi, JPG sau PNG                                                     |
| iPad 13"    | 2064 × 2752          | **da**, obligatoriu dacă aplicația rulează pe iPad — iar `app.json` are `supportsTablet: true` |

Apple scalează singur capturile pentru ecranele mai mici. Deschide pagina „Screenshot
specifications" din App Store Connect Help înainte de upload: acolo e lista completă de
dimensiuni acceptate pentru fiecare ecran. Simulatoarele potrivite sunt
**iPhone 16 Pro Max** și **iPad Pro 13" (M4)**; captura se face cu ⌘S.

⚠️ `supportsTablet: true` înseamnă că recenzentul va testa **și pe iPad**. Dacă aplicația
arată întinsă sau goală pe iPad, e respinsă (guideline 4.0). Ori o verifici pe simulatorul
de iPad, ori pui `supportsTablet: false` și nu mai ai nevoie nici de capturile de iPad.

### Google Play

| Ce                    | Dimensiune                                                                                                                                                                             | Obligatoriu?                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Capturi telefon       | minim 2 ca să publici; **minim 4, la cel puțin 1080 × 1920, portret 9:16**, ca aplicația să poată fi recomandată. Latura lungă nu poate depăși dublul celei scurte. PNG/JPG, max. 8 MB | **da** — fă direct 4                          |
| Grafică de prezentare | **1024 × 500**, PNG sau JPG, fără transparență                                                                                                                                         | **da**                                        |
| Icon                  | 512 × 512, PNG pe 32 de biți                                                                                                                                                           | **da** (din `assets/icon.png`, redimensionat) |

### Ce să prinzi, în ordine (primele 3 se văd fără derulare)

1. **Meniul săptămânal generat**, cu costul total în antet: „planul săptămânii în buget"
2. **Lista de cumpărături**, grupată pe raioane, cu câteva produse bifate
3. **Comparația între magazine**: același coș, prețuri diferite
4. **Alergiile**, cu avertismentul vizibil — arată că filtrul e luat în serios
5. **Cămara**: bifezi ce ai acasă, iar coșul scade
6. **Mementourile**

Nu pune secțiunea de alcool în capturi, indiferent ce decizi la §8. O captură cu bere într-o
aplicație clasificată 13+ e exact lucrul pe care îl caută recenzentul.

Grafica de prezentare de 1024×500 e o imagine de marcă, nu o captură. O poți face din
`assets/icon.png` pe fundalul verde `#16a34a`, cu textul „Mese pe o săptămână, în bugetul
tău". Imaginile din `assets/` sunt generate, așa că înlocuiește-le când ai identitate vizuală
și refă și graficul.

## 10. Textele listării

Sunt în `STORE_LISTING.md`, gata de copiat, cu limitele de caractere verificate.

## 11. Conturile și trimiterea

Verificat pe 2026-09-28 în documentația Apple și Google. Regulile de aici se schimbă des,
așa că recitește paginile citate înainte de fiecare pas.

### Conturile de dezvoltator

- [ ] **Apple Developer Program**, 99 USD/an: developer.apple.com/programs. Ca persoană
      fizică, numele tău apare ca vânzător în App Store
- [ ] **Google Play Console**, 25 USD o dată: play.google.com/console. Verificarea identității
      poate dura câteva zile

### Contul demo pentru recenzie (ambele magazine)

Recenzenții testează și partea de cont. Fără credențiale, Apple respinge la guideline 2.1.

- [ ] după ce Supabase e configurat, fă-ți din aplicație un cont **de producție** doar pentru
      recenzie, de exemplu `review@domeniul-tau.ro`, confirmă-i emailul și generează-i un
      plan ca să nu arate gol
- [ ] **Apple:** App Store Connect → aplicația → App Review Information → bifezi
      *Sign-in required*, pui adresa și parola
- [ ] **Google:** Play Console → App content → **App access** → declari că unele funcții cer
      logare și pui aceleași credențiale
- [ ] **Notes for Review** (Apple), text de copiat:

```
The app works fully without an account: tap "Continuă fără cont" on the first screen.
An account adds sync between devices, email reminders and data export; use the demo
credentials above to review it. Password reset sends a numeric code by email.
The alcoholic drinks section is hidden by default and appears only if the user turns
on a switch marked 18+. The app does not sell alcohol and links to no store; products
only go on the user's own shopping list. Prices are estimates.
```

### Apple

- [ ] App Store Connect → Business → **statutul de trader (Digital Services Act)**. Fără el,
      aplicația **nu apare în UE, deci nici în România**. Dacă ești trader, adresa, telefonul
      și emailul tău devin **publice** pe pagina aplicației. Alege în cunoștință de cauză
- [ ] build-ul de producție ajunge în TestFlight; instalează-l pe telefonul tău și parcurge
      poarta, un cont nou, resetarea parolei și ștergerea contului
- [ ] completezi listarea (`STORE_LISTING.md`), capturile (§9), clasificarea (§8) și
      confidențialitatea (§5), apoi *Submit for Review*

### Google Play — testul închis obligatoriu

Conturile personale create după 13 noiembrie 2023 **nu pot publica direct**. Întâi rulează un
test închis cu **cel puțin 12 testeri, înscriși fără întrerupere 14 zile**. Abia apoi poți
cere accesul la producție.

- [ ] Testing → **Closed testing** → creezi un track și încarci build-ul `.aab`
- [ ] adaugi testerii prin adresele lor Gmail, iar fiecare acceptă invitația din linkul primit
- [ ] **12 oameni care rămân înscriși 14 zile la rând.** Cine iese și intră din nou o ia de
      la capăt. Ia câțiva în plus, pentru siguranță
- [ ] după 14 zile: Dashboard → **Apply for production**. Google întreabă ce ai aflat din
      test, așa că notează-ți pe parcurs ce ți-au raportat testerii
- [ ] după aprobare: Production → încarci același build și trimiți

`eas.json` trimite build-urile Android pe track-ul `internal`, util pentru testele tale. Testul
închis de mai sus e **alt** track (Closed testing) și îl alegi în Play Console.
