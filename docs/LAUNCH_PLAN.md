# Plan de lansare: App Store și Google Play

Foaia de parcurs în ordine, de la Mac-ul gol până la aplicația din magazine. Detaliile
fiecărui pas tehnic sunt în `docs/STORE.md` (secțiunile §1–§11); aici e ordinea, ce instalezi,
ce conturi îți faci, cât costă și cât durează.

> **Regula care decide calendarul:** pe Google Play, un cont personal nou trebuie să ruleze un
> **test închis cu 12 testeri, 14 zile la rând**, înainte să poată publica. Pornește-l cât mai
> devreme. Pe iOS ajungi în magazin în ~1–2 săptămâni; pe Android nu mai devreme de ~3.

---

## Faza 0 · Ce instalezi pe Mac (o seară)

Verificat pe 2026-10-24: ai Node 24 și Java 21; **nu** ai Xcode, Android Studio sau EAS CLI.

| Ce                 | De ce                                        | Obligatoriu?                         | Cum                                                                                                                      |
| ------------------ | -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **EAS CLI**        | build-urile în cloud, trimiterea în magazine | **da**                               | `npm install -g eas-cli`                                                                                                 |
| **Xcode** (~15 GB) | simulatorul de iPhone pe Mac                 | recomandat                           | App Store → Xcode, apoi `sudo xcode-select -s /Applications/Xcode.app` și deschide-l o dată ca să instaleze componentele |
| **Android Studio** | emulatorul de Android pe Mac                 | opțional, dacă ai un telefon Android | developer.android.com/studio → Device Manager → creează un Pixel                                                         |
| Telefonul tău      | aplicația reală, pe hardware adevărat        | recomandat                           | Android: instalezi APK-ul din linkul EAS. iPhone: cere contul Apple (Faza 1)                                             |

**Nu** ai nevoie de Expo Go: aplicația are module native (plăți RevenueCat, Face ID, stocare
securizată) care nu există în Expo Go. Folosim un **development build** (Faza 2).

---

## Faza 1 · Conturile (ziua 1; verificările durează 1–3 zile)

Pornește-le pe toate în prima zi, ca așteptările să curgă în paralel.

| Cont                            | Cost                                  | Pentru ce                                                                                     | Atenție                                                                                        |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Expo** (expo.dev)             | gratuit                               | EAS Build și Submit                                                                           | planul gratuit are ~30 de build-uri/lună, suficient                                            |
| **Apple Developer Program**     | **99 USD/an**                         | iPhone real, TestFlight, App Store                                                            | ca persoană fizică, numele tău apare ca vânzător; pentru firmă trebuie număr D-U-N-S (durează) |
| **Google Play Console**         | **25 USD o dată**                     | Google Play                                                                                   | verificarea identității poate dura câteva zile                                                 |
| **RevenueCat** (revenuecat.com) | gratuit până la ~2 500 USD venit/lună | abonamentul de 9,99 €/lună                                                                    | detalii în Faza 4                                                                              |
| **Supabase**                    | gratuit la început                    | contul, sincronizarea, funcțiile                                                              | proiect în regiunea UE                                                                         |
| **Anthropic Console**           | plătești ce consumi                   | sugestiile AI (Claude Haiku)                                                                  | pune o **limită de cheltuieli**                                                                |
| **Domeniu + hosting**           | ~10–15 €/an                           | politica de confidențialitate și pagina de ștergere a contului, cerute de **ambele** magazine | orice hosting static merge (Netlify, Vercel, Cloudflare Pages)                                 |
| Resend                          | gratuit la început                    | mementourile pe email                                                                         | opțional la lansare                                                                            |

---

## Faza 2 · Vezi aplicația pe telefon și editeaz-o live (ziua 1–2)

**Ce fac eu (Claude) când îmi spui:**

- instalez `expo-dev-client` (lipsește acum; profilul `development` din `eas.json` îl cere);
- adaug în `eas.json` un profil `development-simulator` pentru simulatorul de iPhone.

**Ce faci tu:**

```bash
eas login            # contul Expo
eas init             # leagă proiectul de cont (o singură dată)

# Android: build în cloud (~15 min), primești un link/QR pentru APK, îl instalezi pe telefon
eas build --profile development --platform android

# iPhone, în simulator (gratuit, fără cont Apple; cere Xcode din Faza 0)
eas build --profile development-simulator --platform ios

# iPhone real: cere contul Apple; înregistrezi telefonul o dată
eas device:create
eas build --profile development --platform ios
```

**Editare live:** după ce build-ul e instalat o dată, rulezi `npx expo start --dev-client`
pe Mac și deschizi aplicația pe telefon (aceeași rețea Wi-Fi). **Orice modificare de cod apare
în 1–2 secunde (Fast Refresh)**, fără build nou. Build nou trebuie doar când adaugi un modul
nativ sau schimbi `app.json`.

---

## Faza 3 · Backend-ul de producție (~1 oră) → `STORE.md` §1

În ordinea asta:

1. `supabase link`, apoi `supabase db push` (toate migrațiile, inclusiv **0009 și 0010**);
2. setările de autentificare și șabloanele de email din §1;
3. secretele și deploy pentru funcții (`supabase/README.md` → _Secretele funcțiilor_);
4. ștergi vechea funcție Gemini (`supabase functions delete proxy-gemini-plan`).

---

## Faza 4 · Abonamentul (~2–3 ore, plus aprobarea produselor)

Aplicația așteaptă în RevenueCat un **entitlement `premium`** și o **ofertă curentă cu un
pachet lunar** (`src/services/subscription.ts`, `subscriptionParse.ts`).

**App Store Connect**

- [ ] creezi aplicația (bundle id `ro.smartmeal.app`);
- [ ] _Subscriptions_ → un grup → produsul lunar, **9,99 €**, cu ofertă introductivă **7 zile gratuit**;
- [ ] _Agreements, Tax and Banking_: semnezi acordul pentru aplicații plătite și completezi banca și taxele (fără ele produsele nu funcționează);
- [ ] _Users and Access_ → _Sandbox testers_: un cont de test pentru plăți.

**Google Play Console**

- [ ] creezi aplicația (package `ro.smartmeal.app`) și urci un prim build (Faza 6; Play nu permite produse înainte de primul upload);
- [ ] _Monetize_ → _Subscriptions_ → produsul lunar, _base plan_ 9,99 €, ofertă _free trial_ 7 zile;
- [ ] _Payments profile_ completat.

**RevenueCat**

- [ ] un proiect, cu cele două aplicații (iOS și Android, același bundle/package);
- [ ] iOS: cheia _In-App Purchase_ din App Store Connect; Android: un _service account_ Google cu acces la Play Console (ghidul RevenueCat te duce pas cu pas);
- [ ] _Entitlements_ → `premium`; _Products_ → cele două produse, atașate la `premium`;
- [ ] _Offerings_ → `default` (curentă) → pachetul **Monthly** cu ambele produse;
- [ ] cheile publice în EAS:
      `eas env:set --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_...`
      `eas env:set --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_...`;
- [ ] cheia **secretă** doar în Supabase: `supabase secrets set REVENUECAT_SECRET_KEY=sk_...`
      (o folosește `proxy-ai-swap` ca să verifice abonamentul; nu o pune niciodată în aplicație).

---

## Faza 5 · Partea legală și conținutul (1–2 seri) → `STORE.md` §3, §5, §8–§10

- [ ] completezi operatorul și emailul în `PRIVACY.md`, `public/delete-account.html` și `public/unsubscribe.html`;
- [ ] publici site-ul cu `npm run build:web` (are CSP) pe domeniul tău; la hosting pui header-ele `frame-ancestors 'none'` și `X-Frame-Options: DENY`;
- [ ] textele listării (`STORE_LISTING.md`), capturile de ecran (§9), clasificarea de vârstă (§8) și formularele de date (§5);
- [ ] contul demo pentru recenzenți (§11).

---

## Faza 6 · Build-urile de producție și testarea (~1 oră + build)

1. variabilele EAS de producție (`STORE.md` §4: Supabase, politica de confidențialitate, RevenueCat);
2. `eas build --platform android --profile production` și `eas build --platform ios --profile production`;
3. **iOS:** build-ul ajunge în **TestFlight**; îl instalezi și parcurgi: cont nou, resetare parolă, abonament de test (sandbox), ștergere cont, deconectare;
4. **Android:** urci build-ul pe un **test închis** și **pornești cele 14 zile cu 12 testeri imediat**.

---

## Faza 7 · Trimiterea → `STORE.md` §11

- **Apple:** statutul de trader DSA (fără el nu apari în UE) → _Submit for Review_ (1–3 zile).
- **Google:** după cele 14 zile ceri accesul la producție, apoi trimiți (câteva zile).

---

## Calendarul pe scurt

| Ziua  | Ce                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 1     | Faza 0 + toate conturile din Faza 1 + primul development build pe telefon (Faza 2)                       |
| 2–3   | Faza 3 (backend) + Faza 4 (abonamentul)                                                                  |
| 3–5   | Faza 5 (legal, texte, capturi) + Faza 6 (build-uri de producție, TestFlight, **pornești testul Google**) |
| ~7–10 | Trimiți la Apple → **App Store**                                                                         |
| ~21+  | Google: cele 14 zile s-au încheiat → **Google Play**                                                     |

## Costuri

| Ce                                 | Cost                                  |
| ---------------------------------- | ------------------------------------- |
| Apple Developer Program            | 99 USD/an                             |
| Google Play Console                | 25 USD o dată                         |
| Domeniu                            | ~10–15 €/an                           |
| Expo, RevenueCat, Supabase, Resend | gratuit la început                    |
| Anthropic (AI)                     | după consum, cu limită setată de tine |

## Cine ce face

| Eu (Claude) pot                                                                                | Tu trebuie                                                                   |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `expo-dev-client`, profilurile din `eas.json`, orice modificare de cod (apare live pe telefon) | conturile, plățile, verificarea identității                                  |
| să pornesc build-urile EAS și să citesc erorile                                                | `eas login`, `supabase login` (parolele nu trec prin mine)                   |
| capturi din simulatorul de iPhone (`xcrun simctl`), după ce ai Xcode                           | deciziile legale: operator, trader DSA, politica de confidențialitate        |
| textele listării, verificarea formularelor, ghidarea pas cu pas                                | cheile din RevenueCat, Anthropic, Supabase (le setezi tu în EAS și Supabase) |

## Decizii de produs înainte de lansare (opțional)

- configurarea pornește cu poftele „rapid” și „favoritele familiei” deja bifate, ceea ce diluează alegerile utilizatorului;
- poftele foarte largi („rapid”, „puține calorii”, „cald și sănătos”) schimbă puțin meniul; ar putea conta mai mult cele rare;
- refactorizările amânate (`RecipeDetailModal`, `MealBoardScreen`, `MealCard`, `supabase.ts`) nu blochează lansarea.
