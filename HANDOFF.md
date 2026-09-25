# HANDOFF.md

**Sesiune:** 2026-09-25 · `main` · toate defectele din review-ul de ieri sunt reparate

## Unde am rămas

Review-ul de ieri a scos 8 defecte critice, 6 majore și 6 minore. **Toate sunt reparate**,
fiecare cu testul care l-ar fi prins. Testele au crescut de la 600 la 655.

Cele 8 critice nu erau opt bug-uri independente: aveau aceeași formă — **o verificare valida
un nume și apoi avea încredere într-un corp**. S-au închis cu două piese comune (ADR-18), nu
cu opt petice.

## Starea, rulată la închidere

```
TESTE 82 suite / 655 teste · TYPECHECK 0 · LINT 0 · BUILD web 1,4 MB
COVERAGE 87,45 / 66,71 / 86,32 / 88,21 — toate pragurile trecute
GIT curat
```

## Următorul pas exact

**Pregătirea pentru magazine.** Nu mai e nimic de reparat în cod; lipsesc fișiere. Prima
acțiune concretă: pune un `assets/icon.png` de 1024×1024 și referă-l din `app.json`.
Lista completă e în `README.md`, la secțiunea de deploy.

## Ce s-a reparat

**Cele două piese comune:**

- `src/utils/preferencesValidation.ts` — `parseUserPreferences` verifică fiecare câmp față de
  catalogul lui, la toate cele trei granițe neîncrezute (storage local, rând din cloud,
  formate vechi ale aplicației). A închis singur: dieta trimisă ca șir care dezactiva complet
  dieta (90 de rețete eligibile pentru vegan, 25 cu carne), numărul negativ de persoane care
  arunca dintr-un buton, cantitatea nenumerică din cămară care ștergea tăcut un produs din
  listă, și alergiile nevalidate din cloud.
- **Rețetele se rezolvă prin `RECIPES_MAP[id]`** în ambele porți de siguranță. Un id pe care
  catalogul nu-l cunoaște e refuzat, nu inserat.

**Restul, pe teme:**

- Hidratarea aplică mereu versiunea verificată, nu doar când a înlocuit ceva; o masă
  nelizibilă nu mai costă preferințele și utilizatorul e anunțat.
- `isRecipeMatchingDiets` e acum `switch` cu `default: return false`.
- Mesele reîncălzite: nu mai pot fi schimbate, nu mai sunt cotate de comparația de magazine,
  costul rămâne zero peste tot, gătitul dublu nu mai compune, anularea folosește identitatea.
- Surplusul așteaptă planul următor în `pendingPantryStock`, deci nu mai golește lista din
  care cumperi acum; „+ Plan Nou" nu mai șterge cămara și ce a învățat planificatorul.
- O singură definiție a unei rețete permise — respinsele și disponibilitatea în magazin sunt
  respectate și la înlocuirea directă, și pe scara de relaxare.
- Rezumatul nutrițional numără toate mesele, nu doar felul principal (raporta o treime).
- Hook-ul de depanare care expunea magazinul pe `window` e în spatele `__DEV__`; verificat în
  bundle: 0 potriviri.
- Ștergerea contului există, cu funcția edge `delete-account`.
- `lucide-react-native` scos: 31 MB, nefolosit.

## Ce e blocat — doar de tine

1. **Fișierele pentru magazine**: icon, splash, adaptive icon, `eas.json`, `buildNumber`,
   `versionCode`, politică de confidențialitate, `ios.privacyManifests`. Tabelul complet e în
   `README.md`.
2. **Rulează migrația `0001_user_meal_plans.sql`** — scrisă, nerulată. Fără RLS, cheia `anon`
   ar vedea planurile altora.
3. **Publică `proxy-gemini-plan` și `delete-account`** și setează `ALLOWED_ORIGINS`. Pașii:
   `supabase/README.md`. Fără `delete-account` publicată, butonul din aplicație există dar
   nu are ce apela.

## Capcane

- **`parseUserPreferences` e acum parte din definiția tipului.** Un câmp nou pe
  `UserPreferences` care nu e adăugat și în validator va fi tăcut aruncat la următoarea
  încărcare. Direcția e sigură, dar e o obligație reală (ADR-18).
- **Nimic nu are voie să insereze o rețetă care nu vine din `RECIPES_MAP`.**
- **Orice loc care adună mese trebuie să sară peste `meal.isLeftover`**, și orice loc care
  le prețuiește trebuie să le dea zero.
- Alergiile și dieta sunt restricții dure pe șase uși; toate trec acum prin
  `makePlanSafeForPreferences` sau `describeUnsafeRecipe`.
- Testele rulează în două proiecte Jest; un test care importă `react-native` trebuie numit
  `*.component.test.tsx`.
- `__DEV__` nu există în proiectul Jest de logică — de-aia garda e `typeof __DEV__ !== 'undefined'`.

## Unelte

- `code-reviewer` și `security-reviewer` în paralel pe tot proiectul au găsit 14 defecte pe
  care eu le ratasem. **Dar unul a raportat 433 teste când realitatea era 600**, iar una
  dintre afirmațiile lui nu s-a reprodus. Verifică fiecare afirmație prin rulare.
- Testul-sondă care rulează fiecare acțiune și verifică invarianții după fiecare rămâne cea
  mai productivă tehnică.

## Întrebări pentru tine

1. Îți pregătesc `eas.json` și structura de `assets/` cu locurile pentru icon și splash, ca
   să nu-ți rămână decât să pui imaginile?
2. Scriu o primă variantă de politică de confidențialitate, pe care s-o revizuiești?
