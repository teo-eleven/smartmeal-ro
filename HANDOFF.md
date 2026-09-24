# HANDOFF.md

**Sesiune:** 2026-09-24 · `main` @ 7ac7ba8 · PR #1–#7 toate fuzionate

## Unde am rămas

Sesiune de închidere: review complet pe tot proiectul, eu plus doi agenți, cu fiecare
afirmație verificată empiric de mine înainte de a fi acceptată. **Nu s-a reparat nimic** —
regula 1 a protocolului. Aplicația rulează și toate porțile automate sunt verzi, dar review-ul
a scos 8 defecte critice care nu erau vizibile din teste.

## Starea, rulată la închidere

```
TESTE 75 suite / 600 teste · TYPECHECK 0 · LINT 0 · BUILD web 1,4 MB
COVERAGE 88,14 / 66,57 / 86,74 / 89,50 — toate pragurile trecute
GIT curat, 0 necommise · AUDIT 6 high, doar lanțul Metro (ADR-09)
```

## Următorul pas exact

**Reparațiile de mai jos, în ordinea listată.** Prima acțiune concretă:
`src/store/useAppStore.ts:2794` — pune `__DEV__ &&` în fața expunerii pe `window`. E o linie
și închide cea mai largă gaură.

## Din review — nimic reparat, toate confirmate de mine prin rulare

### Critice — siguranța alimentară și datele

| # | Fișier:linie | Ce se întâmplă |
| - | ------------ | -------------- |
| 1 | `useAppStore.ts:2794` | Tot magazinul e expus pe `window` **în bundle-ul livrat** (verificat în `dist/`), păzit doar de `typeof window`, nu de `__DEV__`. Orice script din pagină citește alergiile (date de sănătate) și le poate șterge. |
| 2 | `useAppStore.ts:869` + `storage.ts:35` | O singură masă malformată în storage pornește aplicația ca **omnivor fără nicio alergie**, cu arhiva goală și **fără niciun avertisment**. `isWellFormedPlan` nu se uită în interiorul mesei; excepția e prinsă de un catch care aruncă tot ce citise. |
| 3 | `plannerEngine.ts:78` + `dietCompatibility.ts:97` | `dietTypes` ca **șir** în loc de listă dezactivează complet dieta: 90 de rețete eligibile pentru vegan, 25 cu carne. `.length > 0` e adevărat și pentru un string. Plus: o dietă necunoscută permite tot — nu există `default: return false`. |
| 4 | `useAppStore.ts:257` | `makePlanSafeForPreferences` validează **id-ul** rețetei și returnează **corpul** venit din storage. Un plan cu id legitim dar ingrediente modificate trece intact: am servit unt de arahide unui profil cu alergie la arahide, fără notificare. |
| 5 | `useAppStore.ts:2692` | `replaceMealWithRecipe` verifică obiectul primit, nu catalogul. O rețetă inventată, cu instrucțiuni arbitrare, ajunge pe tablă. |
| 6 | `plannerEngine.ts:777` + `useAppStore.ts:2717` | Schimbarea unei mese reîncălzite păstrează `isLeftover` pe felul **nou**: cardul zice „reîncălzit de ieri", arată alt preparat, iar ingredientele lui **nu se cumpără deloc**. Butonul „Schimbă" e activ pe reîncălziri. |
| 7 | `useAppStore.ts:526` | `applyCloudPlan` adoptă preferințele din cloud nevalidate. `peopleCount: -3` aruncă din `onPress`, fără error boundary → ecran alb. |
| 8 | — | **Nu există ștergere de cont.** Obligatorie la Apple (5.1.1v) din 2022 și la Google Play. Contul ține alergii — date de sănătate sub GDPR art. 9. Respingere garantată la submisie. |

### Majore

- `useAppStore.ts:1598` — **surplusul se aplică săptămânii curente.** După „pune în cămară",
  prima reagregare scade stocul din lista pentru care **încă n-ai cumpărat**: coș 123,40 → 68,46,
  cinci produse dispar din listă în mijlocul cumpărăturilor. Funcția e azi în minus.
- `useAppStore.ts:2226` — `resetOnboarding` șterge `pantryStock`, `dislikedRecipeIds` și
  `favouriteRecipeIds`. „+ Plan Nou" distruge exact ce trebuia să plătească.
- `WeeklyMacroModal.tsx:42` — rezumatul nutrițional citește doar `day.recipe`, deci raportează
  **o treime** din realitate (2780 kcal în loc de 7550), pe un ecran prezentat ca ghidaj.
- `storeComparator.ts:44` — singurul loc din 24 care **nu** filtrează reîncălzirile. La mine
  diferența a fost 0 (rotunjirea pe ambalaje a absorbit-o), dar codul e greșit și apare la
  gospodării mari.
- `storage.ts:56` — `loadPreferences` e singurul cititor fără verificare de formă.
- `groceryAggregator.ts:98` — un `pantryStock` nenumeric face `NaN` și șterge tăcut un produs
  din listă.

### Minore

- `useAppStore.ts:282` — costul unei mese reîncălzite nu e păstrat la 0 când planul e
  revalidat: afișează 10,56 lei pentru ceva ce nu se cumpără. **Găsit de mine.**
- `useAppStore.ts:1463` — „gătesc dublu" se poate apăsa la nesfârșit: 6 apăsări → 128 porții.
- `useAppStore.ts:1502` — `undoCookDouble` caută sursa după id, nu după identitate: poate
  înjumătăți altă masă.
- `lucide-react-native` — **31 MB, nefolosit nicăieri**, 0 potriviri în bundle.

## Ce e blocat — deploy în magazine

**Aplicația nu poate fi trimisă la niciun magazin.** Nu lipsește curățenie, lipsesc fișiere:

- **icon, splash, adaptive icon** — `assets/` are doar fundaluri de rețete; ar porni cu
  iconița implicită Expo
- **`eas.json`** — nu există, deci `eas build` n-are ce citi
- **`ios.buildNumber` / `android.versionCode`** — absente
- **politică de confidențialitate** — nicăieri; obligatorie la ambele magazine
- **`ios.privacyManifests`** — cerut de Apple din mai 2024 pentru AsyncStorage

`README.md:93` susține că „configurația este deja pregătită pentru build-uri native prin EAS".
**Nu e adevărat** — e afirmația care costă cel mai mult din tot repo-ul.

Rămân blocate și: migrația `0001` scrisă dar **nerulată**, funcția edge nepublicată,
`ALLOWED_ORIGINS` nesetat.

## Capcane

- **Alergiile și dieta sunt restricții dure pe șase uși.** Trei dintre ele (hidratare, cloud,
  restaurare) trec prin `makePlanSafeForPreferences`, care azi validează doar id-ul.
- **Orice agregare a coșului ia 6 argumente** și **orice loc care adună mese trebuie să sară
  peste `meal.isLeftover`.** Un loc din 24 nu o face; de-aia a apărut defectul.
- Testele rulează în **două proiecte Jest**; un test care importă `react-native` trebuie numit
  `*.component.test.tsx`.
- `npm run test:coverage` — praguri în `jest.config.js`. Nu le coborî; adaugă teste.
- `README.md:76` spune prag 80%; real e 83/83/84/62.

## Unelte

- `code-reviewer` și `security-reviewer` rulați în paralel pe tot proiectul: împreună au găsit
  14 defecte pe care eu le ratasem. **Dar unul a raportat 433 teste / 51 suite când realitatea
  e 600 / 75** — cifră greșită, deci i-am verificat fiecare afirmație. Una (slot greșit la
  gătitul dublu) nu s-a reprodus la mine. **Verifică întotdeauna, nu prelua.**
- Tehnica cea mai productivă rămâne testul-sondă care rulează fiecare acțiune și verifică
  invarianții după fiecare.

## Întrebări pentru tine

1. Reparăm cele 8 critice într-o sesiune dedicată? Ordinea propusă: 1 → 2 → 3 → 4 → 6 → 5 → 7 → 8.
2. Scot `lucide-react-native`?
3. Pregătesc lista completă pentru deploy (icon, splash, `eas.json`, versiuni, politică)?
