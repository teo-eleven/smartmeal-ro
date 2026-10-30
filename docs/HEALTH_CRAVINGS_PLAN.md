# Plan de atac: pofte, obiective de sănătate și rețete

Data: 2026-10-30. Pornește de la ramura `fix/craving-defaults` (peste PR #15).

Cercetarea completă, cu sursă la fiecare afirmație, este în:

- `docs/research/HEALTH_GUIDELINES.md`: ghiduri medicale (OMS, EFSA, ADA, AHA, DASH, ghidul PCOS 2023, NHS) traduse în reguli cu cifre;
- `docs/research/LEGAL_CLAIMS.md`: ce avem voie să scriem (Reg. 1924/2006, 432/2012, 1169/2011, MDR, Apple, Google, ANPC, Legea 256/2015);
- `docs/research/COOKBOOKS.md`: cărți de bucate, preparate-tip pe fiecare poftă, drepturi de autor, bucătăria de post.

Marcaje folosite în rapoarte: [V] verificat direct, [S] din surse secundare, [M] de verificat, [D] derivare calculată, [AVOCAT] cere opinie juridică.

---

## 1. Ce am constatat în cod (măsurat pe cele 148 de rețete)

**Obiectivele de sănătate sunt „de formă”.** Filtrul funcționează, dar etichetele sunt scrise de mână și nu se verifică cu nutriția:

| Obiectiv            | Rețete | Problemă găsită                                                                                                      |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `high_fiber`        | 27     | rețete cu 3–5 g fibre (chiftele de legume, salată caldă cu crutoane); 48 de rețete cu ≥ 6 g fibre **nu** au eticheta |
| `diabetic_friendly` | 35     | 19 au < 6 g fibre; supă cremă cu crutoane de 70 g carbohidrați; budincă cu zahăr (diabet sau SOP) |
| `heart_healthy`     | 43     | nachos cu guacamole (41 g grăsimi), telemea sărată; nu avem date despre sare și grăsimi saturate                     |
| `pcos_friendly`     | 33     | 23 au < 6 g fibre; omletă cu 35 g grăsimi                                                                            |
| `anti_inflammatory` | 44     | criteriu neclar; curry cu lapte de cocos (42 g grăsimi)                                                              |

- `src/data/ingredientNutrition.ts` are doar kcal, proteine, carbohidrați, grăsimi și fibre. `computeRecipeNutrition` (`src/engine/ingredientUnits.ts:67`) aruncă fibrele.
- Lipsesc sodiul, grăsimile saturate, zaharurile, fierul, vitamina C, calciul, B12 și omega-3, deci nicio regulă de sănătate serioasă nu se poate verifica azi.
- Textele din `src/data/healthTags.ts` („Previne vârfurile de zahăr”, „Stabilizează insulina”, „Reduce inflamația cronică”, „Protecție cardiovasculară”) sunt **afirmații medicale interzise** pentru alimente (Reg. 1169/2011 art. 7(3)) sau mențiuni de sănătate generale fără mențiune autorizată (Reg. 1924/2006 art. 10(3)). Apple și Google le pot respinge.

**Poftele largi nu aleg nimic.** `healthy_comfort` e pe 66% din rețete, `low_calorie` pe 57%, `speedy` pe 55%. Bonusul de +30 merge la jumătate din catalog, deci „Rapid” nu garantează mese rapide. La celălalt capăt, poftele concrete au prea puține rețete: `pasta_italian` 9, `grill_meat` 10, `fresh_salad` 11, `spicy_fiesta` 13.

**Deja făcut:** poftele nu mai sunt bifate din start (commit 7b2aeef).

---

## 2. Principiile planului

1. **Etichetele se calculează, nu se scriu de mână.** Fiecare obiectiv este o regulă cu cifre, cu sursa citată în cod. Rețeta primește eticheta doar dacă trece regula.
2. **Fail-closed.** Dacă lipsește o valoare (sodiu necunoscut, pasteurizare necunoscută), rețeta **nu** primește eticheta.
3. **Două niveluri, ca să respectăm și medicina, și legea:**
   - _Reguli interne pe porție_ pentru filtrare și clasare (din ghidurile medicale; nu se afișează ca promisiune);
   - _Insigne afișate_ care seamănă cu mențiuni UE („Bogat în fibre”, „Puțină sare”) **doar** când rețeta trece pragul legal **per 100 g** (anexa Reg. 1924/2006). Altfel afișăm doar cifra („9 g fibre/porție”), care e informație, nu mențiune.
4. **Descriem meniul, nu boala.** „Atent la zaharuri”, nu „Pentru diabetici”. Fără „previne”, „tratează”, „vindecă”, „reduce inflamația”.
5. **Rețete scrise de noi.** Din cărți luăm idei, combinații și tehnici (libere conform Legii 8/1996, art. 9). Nu luăm textul, fotografiile, colecția și nu facem scraping.

---

## 3. Etapele

Fiecare etapă: ramură proprie, teste întâi, commit local, push și PR doar cu acordul tău. Ordinea e aleasă ca primele etape să fie vizibile și să deblocheze lansarea.

### Etapa A · Texte conforme și disclaimer (mică, blochează lansarea)

**Ce se vede:** nume și descrieri noi pentru obiective, un disclaimer, o întrebare de siguranță la onboarding.

- Redenumire (cheile din cod rămân, ca datele salvate să nu se strice):

  | Acum                      | Nou (propunerea din `LEGAL_CLAIMS.md` §6.2–6.3)                                                             |
  | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
  | Diabet & Glicemie Stabilă | **Atent la zaharuri**: puține zaharuri, fără zahăr adăugat, multe fibre; carbohidrații per porție la vedere |
  | SOP (Ovare Polichistice)  | **Echilibrat**: proteine și fibre la fiecare masă, fără zahăr adăugat                                       |
  | Sănătos pentru Inimă      | **Grăsimi bune, puțină sare**                                                                               |
  | Antiinflamator            | **Stil mediteranean**: legume, leguminoase, pește, ulei de măsline, cereale integrale                       |
  | Bogat în fibre            | rămâne, dar afișat doar la pragul legal (vezi Etapa C)                                                      |

- Disclaimer scurt pe ecranul obiectivelor și în detaliul rețetei, iar varianta lungă în Setări și în politica de confidențialitate (text propus: `HEALTH_GUIDELINES.md` §9.2 și `LEGAL_CLAIMS.md` §6.4).
- Întrebare la onboarding, când alegi un obiectiv: „Ești însărcinată, ai boală de rinichi, iei insulină, anticoagulante sau ai o tulburare de alimentație?” Un „da” afișează un mesaj „discută cu medicul” și blochează obiectivele riscante. Nu stocăm răspunsul mai mult decât e nevoie (date de sănătate, GDPR art. 9).
- Fraza obligatorie Google în descrierea din magazin („not a medical device…”) și declarația „Health apps” → „Nutrition and Weight Management” în `docs/STORE_LISTING.md`.
- **Teste:** niciun text din catalogul de obiective nu conține „previne / tratează / vindecă / reduce / stabilizează”.

### Etapa B · Date nutriționale complete (fundația, invizibilă dar obligatorie)

- În `ingredientNutrition.ts`, pentru fiecare ingredient: sodiu, grăsimi saturate, mononesaturate și polinesaturate, zaharuri, fier, vitamina C, calciu, B12, potasiu și omega-3 (ALA, EPA, DHA). Sursa principală e **USDA FoodData Central (domeniu public CC0)**. CIQUAL (Franța) servește pentru brânzeturi și mezeluri europene, după ce confirmăm licența.
- Flag-uri pe ingrediente, puse de mână și verificate prin teste:
  - tipul de aliment: `processedMeat`, `redMeat`, `organMeat`, `oilyFish`, `highMercuryFish`, `wholeGrain`, `refinedGrain`, `legume`, `nutSeed`, `oliveOil`;
  - siguranță: `addedSugar`, `rawOrUndercooked`, `pasteurization: yes | no | unknown`, `alcohol`.
- `computeRecipeNutrition` întoarce toți nutrienții, plus greutatea porției în grame, necesară pentru pragurile per 100 g.
- **Teste:** fiecare ingredient din catalog are toate câmpurile (testul pică altfel), iar valorile se verifică pe 10 rețete alese.
- Cost estimat: cel mai mare volum de date din plan (~200+ ingrediente). Se face semi-automat, cu un script de import din FDC și o verificare manuală pe eșantion.

### Etapa C · Obiectivele calculate (aici devin „mănușă”)

Un modul nou, `src/engine/healthRules.ts`, conține câte o regulă pe obiectiv, cu pragurile ca constante și sursa în comentariu. `getRecipeHealthTags` folosește regulile în loc de etichetele scrise de mână.

Pragurile propuse pe porție de masă principală (detalii și surse în `HEALTH_GUIDELINES.md`; de validat cu dieteticianul):

| Obiectiv                  | Regulă pe porție                                                                                                                      | Sursă principală                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Atent la zaharuri         | carbohidrați disponibili ≤ 60 g, fibre ≥ 8 g, zaharuri libere ≤ 5 g, bază integrală sau leguminoase                                   | ADA Standards of Care 2026 (fibre 14 g/1000 kcal), OMS (zaharuri libere) |
| Grăsimi bune, puțină sare | grăsimi saturate ≤ 4 g, sodiu ≤ 600 mg, fără carne procesată, fără prăjit în baie de ulei                                             | AHA (~13 g/zi grăsimi saturate), OMS (< 2 g sodiu/zi), WCRF              |
| Bogat în fibre            | ≥ 8 g și ≥ 1,5 g/100 kcal                                                                                                             | EFSA (25 g/zi), Reg. 1924/2006                                           |
| Stil mediteranean         | fără carne procesată, fără cereale rafinate ca bază, zaharuri libere ≤ 5 g, grăsimi saturate ≤ 5 g, ≥ 2 grupe vegetale, bonus omega-3 | MEDAS / PREDIMED                                                         |
| Echilibrat (SOP)          | proteine ≥ 20% din energie, fibre ≥ 6 g, fără zahăr adăugat. Fără excluderi de lactate sau gluten: ghidul 2023 nu le susține          | Ghidul internațional PCOS 2023                                           |

- **Reguli pe săptămână** în generator, când obiectivul e activ: pește de cel puțin 2 ori (din care o dată pește gras), leguminoase de cel puțin 3 ori, carne roșie ≤ 350–500 g gătită, carne procesată aproape deloc (WCRF, AHA).
- **Insignele legale** se afișează doar la pragul per 100 g: „Sursă de fibre” (≥ 3 g) sau „Bogat în fibre” (≥ 6 g), „Puțină sare” (≤ 0,12 g sodiu), „Puține zaharuri” (≤ 5 g).
- În detaliul rețetei, un buton **„De ce?”** arată cifrele care au decis eticheta (de exemplu 9 g fibre, 410 mg sodiu, 3 g grăsimi saturate).
- **Raport de diferențe** la final: ce rețete câștigă sau pierd fiecare etichetă. Ți-l arăt înainte de commit.
- **Teste:** câte un test pe prag (exact la limită, peste și sub), plus regresii pentru nachos, supa cu crutoane și chiftele (azi etichetate greșit).

### Etapa D · Poftele: condiții vs gusturi

- **Condiții** (`speedy`, `low_calorie`, `light_dinner`, `high_protein`) devin filtru: când le alegi, toate mesele le respectă. Dacă nu există destule rețete, folosim scara de relaxare existentă din `slotPicker.ts` și afișăm un mesaj („Am pus 2 mese de 30 min, nu aveam destule rapide”).
- **Gusturi** (`romanian_classic`, `pasta_italian`, `spicy_fiesta`, `soups_stews`, `grill_meat`, `fresh_salad`, `fakeaway`, `sweet_treat`, `family_fav`) rămân bonus plus zi dedicată, ca acum.
- `healthy_comfort` (66% din catalog) primește o definiție strictă: fel cald, gătit, cu legume, fără prăjit. Dacă nici așa nu discriminează, propun să-l contopim cu „Stil mediteranean” sau să-l scoatem.
- Corectăm și inconsecvența existentă: onboarding-ul spune „fără limită”, dar Filtrele rapide cer minim 1 și maxim 5 pofte.
- **Teste:** cu „Rapid” ales, 100% din mese au ≤ 25 min, dacă există destule rețete; altfel apare mesajul.

### Etapa E · Rețete noi și post (vizibilă, cea mai apreciată de utilizatori)

- **Bucătăria de post:** flag `fasting: 'strict' | 'fish_allowed'` calculat din ingrediente, plus un comutator „De post” cu mod parțial (doar miercuri și vineri). Cercetarea arată că majoritatea românilor postesc parțial; e cea mai mare oportunitate locală.
- **~40–50 de rețete noi**, scrise de noi pe preparate-tip din `COOKBOOKS.md` §3, la Lidl/Kaufland, cu buget:

  | Categorie          | Acum   | Țintă | Exemple                                                             |
  | ------------------ | ------ | ----- | ------------------------------------------------------------------- |
  | `pasta_italian`    | 9      | ~20   | pomodoro cu unt și ceapă, aglio olio, pasta e fagioli, paste cu ton |
  | `fresh_salad`      | 11     | ~22   | linte cu feta, tabbouleh cu bulgur, năut, niçoise de buget          |
  | `spicy_fiesta`     | 13     | ~22   | burrito bowl, tacos de pui cu pico de gallo, huevos rancheros       |
  | `grill_meat`       | 10     | ~18   | frigărui, kofta, fajitas, tandoori la cuptor, ceafă cu mujdei       |
  | `fakeaway`         | 19     | ~26   | shaorma de casă, „KFC” la cuptor, egg fried rice                    |
  | post / leguminoase | puține | +10   | fasole bătută, iahnie, linte, plachie, sarmale de post              |

- Mai puțin pui, somon și ovăz; mai mult pește alb congelat, macrou, linte, năut și fasole. Sunt ieftine, au fibre și fier și se potrivesc la post.
- Clasicele românești se verifică cu Sanda Marin și Radu Anton Roman (ca idee, nu ca text).
- Fotografiile vin din Wikimedia Commons, ca în Etapa 2 a planului anterior; altfel, cardul generat din ingrediente.
- **Teste:** testele existente de catalog (alergeni, porc, unități, nutriție) acoperă automat rețetele noi.

### Etapa F · Obiective noi (după Etapele B–C și după dietetician)

Recomandate, în ordine:

1. **Bogat în fier**: ≥ 4,5 mg fier pe porție și, când fierul e vegetal, ≥ 25 mg vitamina C în aceeași masă. Are mențiuni autorizate (Reg. 432/2012).
2. **Puțină sare** (stil DASH): sodiu ≤ 500 mg pe porție.
3. **Cu ovăz și orz** (colesterol): ≥ 1 g beta-glucani pe porție, plus grăsimi nesaturate. Există mențiune autorizată.
4. **Sarcină**, ca **filtru de siguranță**, nu ca obiectiv. Exclude ficatul și pateul, peștele, carnea și ouăle crude, brânza nepasteurizată sau cu status necunoscut, peștii cu mercur mult și alcoolul. Limitează peștele gras la 2 ori pe săptămână (lista NHS).
5. **B12 pentru vegani**, ca mesaj de informare, nu ca filtru.

Amânate sau excluse: low-FODMAP (datele Monash sunt proprietare și e o intervenție pentru dietetician), guta (nu există date deschise despre purine), oasele (calciu și vitamina D, utilitate mică). **Nu le oferim deloc:** diabet gestațional, boală de rinichi, warfarină, IMAO, tulburări de alimentație.

### Etapa G · Validare externă (în paralel cu B–E; nu e cod)

- **Dietetician autorizat** (Colegiul Dieteticienilor din România), pe contract: validează pragurile, textele și excluderile și semnează o fișă cu data pentru fiecare obiectiv.
- **Avocat** (drept alimentar UE și protecția consumatorului), înainte de lansarea obiectivelor: confirmă textele, cât de mult ne afectează Reg. 1924/2006 și încadrarea MDR.
- **Cont Apple pe firmă:** regula 5.1.1(ix) cere ca aplicațiile din domeniul sănătății să fie publicate de o firmă, nu de o persoană fizică. Asta **schimbă Faza 1 din `LAUNCH_PLAN.md`**, unde contul era planificat ca persoană fizică. Contul de firmă cere număr D-U-N-S, care durează.

---

## 4. Ordine și dimensiune

| Etapă                               | Mărime          | Vizibil?      | Depinde de                                    |
| ----------------------------------- | --------------- | ------------- | --------------------------------------------- |
| A · texte și disclaimer             | mică            | da            | –                                             |
| B · date nutriționale               | mare (date)     | nu            | –                                             |
| C · obiective calculate             | medie           | da („De ce?”) | B                                             |
| D · pofte condiții/gusturi          | medie           | da            | – (merge în paralel cu B)                     |
| E · rețete noi și post              | mare (conținut) | da, mult      | B (ca rețetele noi să aibă nutriție completă) |
| F · obiective noi                   | medie           | da            | B, C, G                                       |
| G · dietetician, avocat, cont firmă | externă         | –             | –                                             |

Recomandare: **A și D întâi** (rapide, vizibile, A deblochează lansarea), apoi **B → C**, apoi **E**, iar la final **F**, după răspunsul dieteticianului.

---

## 5. Decizii pe care le ai de luat

1. Accepți numele noi ale obiectivelor (tabelul din Etapa A)? Alternativa: păstrăm cuvântul bolii doar ca text informativ, ceea ce e riscant juridic.
2. Angajezi un dietetician autorizat și ceri o opinie de la un avocat înainte de lansare? Recomand da, cel puțin pentru dietetician.
3. Treci contul Apple pe firmă (cerință Apple pentru aplicațiile de sănătate)?
4. „Mâncare caldă & nutritivă”: o redefinim strict, o contopim cu „Stil mediteranean” sau o scoatem?
5. Ce obiective noi vrei la lansare? Recomand: fier, puțină sare, post, plus sarcina ca filtru de siguranță.
6. Câte rețete noi în Etapa E? Recomand ~40–50 la început.
