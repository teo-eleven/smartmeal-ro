# SmartMeal RO: obiective de sănătate, reguli verificabile automat

Cercetare făcută pe 2026-10-30. Am folosit doar surse oficiale sau academice (WHO, EFSA/UE, NHS/NICE, NIH/ODS/NHLBI/NIDDK, AHA, ADA, ESC, WCRF, Monash, Harvard, FDA, ISSN).

## 0. Convenții (de citit înainte de tabele)

**Marcaje de încredere** pentru fiecare număr:

- **[V]**: am verificat cifra direct pe sursa oficială sau în citatul ei, în timpul acestei cercetări.
- **[S]**: cifra apare în mai multe rezumate secundare care citează sursa oficială. Pagina primară n-am putut-o deschide (403/captcha), așa că trebuie verificată înainte de lansare.
- **[M]**: cifra vine din cunoștințele mele despre sursă. N-a apărut în căutări, deci trebuie verificată obligatoriu.
- **[D]**: cifra este o derivare, nu un prag publicat. Formula este scrisă explicit.

**Ipoteza de bază pentru pragurile „pe masă principală” [D]:** o zi are 3 mese principale plus 1 gustare, iar o masă principală dă aproximativ 30–35% din energia zilei. La 2000 kcal/zi asta înseamnă 600–700 kcal pe masă. Ca regulă generală, prag pe masă ≈ ținta zilnică × 0,30–0,33. Unde rotunjesc, rotunjesc în jos pentru limite și în sus pentru minime. Planificatorul trebuie să lucreze cu nutrienții **per porție servită** (suma ingredientelor × grame / nr. porții).

**Pragurile UE pentru mențiuni nutriționale [V].** Sunt pe 100 g sau 100 kcal, nu pe porție. Le folosim ca densitate minimă, iar unele etichete ale aplicației („bogat în fibre”, „sărac în sare”) seamănă cu mențiunile reglementate. Sursa este Reg. (CE) 1924/2006, Anexa: https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en

| Mențiune                              | Condiție                                                          |
| ------------------------------------- | ----------------------------------------------------------------- |
| Sursă de fibre                        | ≥ 3 g/100 g sau ≥ 1,5 g/100 kcal                                  |
| Bogat în fibre                        | ≥ 6 g/100 g sau ≥ 3 g/100 kcal                                    |
| Sărac în sodiu/sare                   | ≤ 0,12 g sodiu/100 g                                              |
| Foarte sărac în sodiu                 | ≤ 0,04 g sodiu/100 g                                              |
| Sărac în grăsimi saturate             | AGS + trans ≤ 1,5 g/100 g (solide) și ≤ 10% din energie           |
| Sărac în zaharuri                     | ≤ 5 g/100 g                                                       |
| Sursă de proteine / bogat în proteine | ≥ 12% / ≥ 20% din energie din proteine                            |
| Sursă de omega-3                      | ≥ 0,3 g ALA sau ≥ 40 mg EPA+DHA per 100 g și per 100 kcal         |
| Bogat în omega-3                      | ≥ 0,6 g ALA sau ≥ 80 mg EPA+DHA per 100 g și per 100 kcal         |
| Sursă de vitamină/mineral             | „cantitate semnificativă” (Dir. 90/496): 15% din VNR la 100 g [M] |
| Bogat în vitamină/mineral             | 2 × „sursă de”                                                    |

**Valorile nutriționale de referință (VNR) din Reg. (UE) 1169/2011, Anexa XIII [M]:** fier 14 mg, calciu 800 mg, vitamina C 80 mg, B12 2,5 µg, vitamina D 5 µg, potasiu 2000 mg. Sursa: https://eur-lex.europa.eu/eli/reg/2011/1169/oj

**Ținte zilnice generale folosite în derivări:**

| Nutrient                         | Țintă zilnică                                                                | Sursă                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sodiu                            | < 2000 mg (≈ 5 g sare) [V-rez.]                                              | WHO, _Guideline: sodium intake for adults and children_ (2012): https://www.who.int/publications/i/item/9789241504836 |
| Zaharuri libere                  | < 10% din energie, ideal < 5% (≈ 50 g, respectiv 25 g la 2000 kcal) [V-rez.] | WHO _Guideline: sugars intake_ (2015): https://www.who.int/publications/i/item/9789241549028                          |
| Zahăr adăugat (AHA)              | ≤ 25 g femei / ≤ 36 g bărbați [V]                                            | https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sugar/how-much-sugar-is-too-much                     |
| Grăsimi saturate (general)       | < 10% din energie (≈ 22 g la 2000 kcal) [S]                                  | ESC 2021 Prevention (doi:10.1093/eurheartj/ehab484); WHO                                                              |
| Grăsimi saturate (risc CV / LDL) | 5–6% din energie, ≈ 13 g la 2000 kcal [V]                                    | AHA: https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/saturated-fats                             |
| Fibre                            | 25 g/zi AI adulți [M]                                                        | EFSA 2010, DRV carbohidrați și fibre: https://www.efsa.europa.eu/en/efsajournal/pub/1462                              |
| Fibre (diabet)                   | 14 g/1000 kcal [S]                                                           | ADA Standards of Care 2026, Secț. 5: https://diabetesjournals.org/care/issue/49/Supplement_1                          |
| Proteine                         | PRI 0,83 g/kg/zi [V]                                                         | EFSA: https://www.efsa.europa.eu/en/press/news/120209                                                                 |
| Potasiu                          | ≥ 3510 mg/zi [M]                                                             | WHO _Guideline: potassium intake_ (2012): https://www.who.int/publications/i/item/9789241504829                       |

---

## 1. `diabetic_friendly` (diabet de tip 2 / prediabet)

**Recomandare de redenumire:** „glicemie echilibrată / blood_sugar_friendly”. Detalii în secțiunea 9 (Siguranță).

**Ce arată dovezile:**

- ADA nu stabilește un procent ideal de carbohidrați și nici un tipar alimentar unic. Accentul cade pe calitatea carbohidraților: surse bogate în fibre, minim procesate, cu legume, leguminoase, cereale integrale și fructe întregi. Recomandă și minimizarea zahărului adăugat și a cerealelor rafinate. Tiparele mediteranean, DASH, cu carbohidrați reduși și vegetarian sunt toate acceptabile [S]. Sursa: ADA Standards of Care in Diabetes—2026, Secț. 5 „Facilitating Positive Health Behaviors…”, Diabetes Care 49(Suppl 1): https://diabetesjournals.org/care/issue/49/Supplement_1 ; comunicat: https://diabetes.org/newsroom/press-releases/american-diabetes-association-releases-standards-care-diabetes-2026
- Ținta de fibre este de cel puțin 14 g/1000 kcal (≈ 25–38 g/zi). Aporturi de peste 35 g/zi pot aduce un beneficiu glicemic suplimentar [S]. Aceeași sursă ADA, plus https://professionaleducation.diabetes.org/Listing/2025-2030-Dietary-Guidelines-and-Modern-Diabetes-Care-Spotlight-on-Protein-and-Dietary-Fiber-24946
- Indicele glicemic: alimentele cu IG ≤ 55 sunt „low GI”. Leguminoasele, pastele și majoritatea fructelor au IG mic, cu valori constante între țări [V]. Sursa: Atkinson et al., _International tables of glycemic index and glycemic load values 2021_, **Am J Clin Nutr** 114:1625 (nu Diabetes Care, acolo a apărut ediția din 2008), doi:10.1093/ajcn/nqab233 ; https://nutrition.org/ajcn-publishes-international-tables-of-glycemic-index-and-glycemic-load-values-2021-a-systematic-review/
- Clasificarea pe aliment: IG ≥ 70 este ridicat. Încărcătura glicemică (GL) per porție: ≤ 10 mică, ≥ 20 mare [M] (convenția Universității din Sydney, aceeași grupă de autori): https://glycemicindex.com

**Reguli pe masă principală:**

| Regulă                                   | Prag                                                                                   | Sursă / justificare                                                                                                                                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carbohidrați disponibili (total − fibre) | ≤ 60 g/porție (ideal 30–60 g)                                                          | [D] ADA nu dă un număr. Intervalul 45–60 g/masă este folosit pe scară largă în numărarea carbohidraților (CDC Diabetes Meal Planning [M], https://www.cdc.gov/diabetes/healthy-eating/diabetes-meal-planning.html). Supa-cremă cu crutoane de 70 g iese din filtru. |
| Fibre                                    | ≥ 8 g/porție **și** ≥ 1,4 g/100 kcal                                                   | [D] 14 g/1000 kcal din ADA = 1,4 g/100 kcal. La o masă de 600 kcal rezultă ≈ 8,4 g.                                                                                                                                                                                 |
| Zaharuri libere/adăugate                 | ≤ 5 g/porție                                                                           | [D] Limita ideală WHO < 5% (≈ 25 g/zi) ÷ 3 mese ≈ 8 g. Am redus la 5 g pentru că ADA cere „minimizare” și ca să rămână loc pentru gustare.                                                                                                                          |
| GL estimată a mesei                      | ≤ 20 (penalizare peste 20)                                                             | [M]/[D] Pragul „GL mare” de la nivel de aliment, aplicat ca plafon pentru masă. Necesită IG pe ingredient.                                                                                                                                                          |
| Cereală principală                       | Integrală sau leguminoasă (nu pâine albă, orez alb sau cartof piure ca bază dominantă) | ADA [S]: alegerea carbohidraților bogați în fibre și minim procesați                                                                                                                                                                                                |
| Proteine                                 | ≥ 20 g/porție                                                                          | [D] Încetinesc golirea gastrică. Am ales pragul ca să fie compatibil cu regula de sațietate de la scădere în greutate. Nu există prag ADA.                                                                                                                          |
| Grăsimi saturate                         | ≤ 7 g/porție                                                                           | [D] < 10% energie ≈ 22 g/zi ÷ 3. ADA pune accent și pe riscul cardiovascular.                                                                                                                                                                                       |

**Pe săptămână:** leguminoase ≥ 3 ori [D, din tiparul mediteranean, vezi §2]; cel mult 1 desert/zi; nicio băutură îndulcită.

---

## 2. `anti_inflammatory`

**Ce arată dovezile:** Nu există un ghid clinic pentru o „dietă antiinflamatoare”. Cea mai bună aproximare este tiparul mediteranean: fructe, legume, leguminoase, cereale integrale, nuci și semințe, ulei de măsline, pește gras de cel puțin 2 ori/săptămână, cel puțin 5 porții de legume și fructe pe zi. Carbohidrații rafinați, grăsimile saturate, carnea roșie și cea procesată sunt asociate cu inflamație mai mare [V]. Harvard Health precizează că dovezile sunt „în creștere” și că niciun aliment nu este un remediu. Sursa: https://www.health.harvard.edu/staying-healthy/fight-inflammation-with-food ; https://www.health.harvard.edu/staying-healthy/foods-that-fight-inflammation

- PREDIMED a folosit chestionarul MEDAS cu 14 puncte (Schröder et al., J Nutr 2011;141:1140, doi:10.3945/jn.110.135566) [V, doar existența și validarea]. Pragurile itemilor [M], de verificat în articol: ulei de măsline ≥ 4 linguri/zi; legume ≥ 2 porții/zi; fructe ≥ 3/zi; carne roșie/procesată < 1 porție/zi; unt/smântână < 1/zi; băuturi îndulcite < 1/zi; leguminoase ≥ 3/săpt.; pește/fructe de mare ≥ 3/săpt.; dulciuri comerciale < 3/săpt.; nuci ≥ 3/săpt.; preferință pentru carne albă față de roșie; sofrito ≥ 2/săpt.
- ESC 2021 recomandă dieta mediteraneană sau una similară, pe bază de plante [V-rez.]: https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/CVD-Prevention-in-clinical-practice

**Reguli pe masă:**

| Regulă                      | Prag                                                                                     | Sursă                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Carne procesată             | 0 (exclusă)                                                                              | WCRF [V]: https://www.wcrf.org/diet-activity-and-cancer/cancer-prevention-recommendations/limit-red-and-processed-meat/ ; Harvard [V] |
| Zaharuri libere             | ≤ 5 g/porție                                                                             | [D] din WHO < 5%                                                                                                                      |
| Cereale rafinate ca bază    | interzise (orez alb, făină albă, cartof prăjit nu pot fi „baza” rețetei)                 | Harvard [V]                                                                                                                           |
| Grăsimi saturate            | ≤ 5 g/porție și ≤ 10% din energia mesei                                                  | [D] AHA 13 g/zi ÷ 3 ≈ 4,3 g; am rotunjit la 5 g pentru că nu e un obiectiv strict cardiac                                             |
| Sursă de grăsime            | uleiul principal este de măsline sau de rapiță, sau grăsimea vine din nuci/semințe/pește | MEDAS [M]                                                                                                                             |
| Grupe vegetale              | ≥ 2 din {legume ≥ 150 g, leguminoase, cereală integrală, nuci/semințe}                   | [D] din MEDAS și „≥ 5 porții/zi” (Harvard)                                                                                            |
| Fibre                       | ≥ 6 g/porție                                                                             | [D] 25 g/zi EFSA ÷ 3 ≈ 8 g; am relaxat la 6 g                                                                                         |
| Omega-3 (bonus, nu filtru)  | EPA+DHA ≥ 250 mg sau ALA ≥ 1 g pe porție → scor mai mare                                 | [D] din pragurile UE „sursă de omega-3” (40 mg EPA+DHA/100 kcal × 600 kcal ≈ 240 mg; 0,3 g ALA/100 kcal × … rotunjit)                 |
| Scor mediteranean pe rețetă | ≥ 3 din 5 puncte din regulile de mai sus                                                 | [D] adaptare MEDAS pe rețetă (MEDAS original e pe persoană/săptămână)                                                                 |

**Pe săptămână [M/D]:** pește ≥ 2 ori (dintre care ≥ 1 pește gras); leguminoase ≥ 3; nuci ≥ 3; carne roșie ≤ 350–500 g gătită (WCRF [V]); carne procesată ≈ 0.

---

## 3. `pcos_friendly`

**Ce arată dovezile:** Ghidul internațional PCOS 2023 (Monash/ESHRE, Teede et al., Hum Reprod 2023;38:1655, doi:10.1093/humrep/dead156) spune:

- Principiile generale de alimentație sănătoasă se aplică tuturor femeilor cu PCOS, toată viața [S].
- „Există dovezi limitate sau inexistente că un anumit tip de dietă izoenergetică este superior altuia” [S]. Sursa este adaptarea olandeză oficială a ghidului: https://richtlijnendatabase.nl/richtlijn/adaptatietraject_internationale_richtlijn_pcos/leefstijl/dieetinterventies.html ; și Thieme 2023: https://thieme-connect.de/products/ejournals/html/10.1055/s-0043-1777116
- Pentru scădere în greutate (IMC ≥ 25): un deficit de 30% sau de 500–750 kcal/zi, ajustat individual [S].
- Accent pe evitarea stigmatizării legate de greutate și pe evitarea dietelor restrictive [S]. Sursa: https://www.monash.edu/medicine/news/latest/2023-articles/australia-leads-the-world-with-a-new-international-guideline-to-improve-the-health-of-women-with-polycystic-ovary-syndrome
- Concluzie: o etichetă „PCOS” cu reguli speciale (IG mic, fără lactate, fără gluten) **nu are susținere din ghid**. Apărabil este doar profilul „cardiometabolic” general, adică aceleași reguli ca la glicemie, plus fibre și proteine.

**Reguli pe masă (= `diabetic_friendly` relaxat):**

| Regulă                                                    | Prag                                                                                                  | Sursă                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Carbohidrați disponibili                                  | ≤ 60 g                                                                                                | [D] ca la §1 (insulinorezistența este frecventă în PCOS) |
| Fibre                                                     | ≥ 7 g                                                                                                 | [D]                                                      |
| Proteine                                                  | ≥ 20 g                                                                                                | [D]                                                      |
| Zaharuri libere                                           | ≤ 5 g                                                                                                 | [D] din WHO                                              |
| Grăsimi saturate                                          | ≤ 7 g                                                                                                 | [D] din < 10%                                            |
| **Nu** excludem lactatele/glutenul și **nu** impunem keto | n/a                                                                                                   | Ghid 2023 [S]: nicio compoziție nu este superioară       |
| Calorii                                                   | **nu** se impune deficit implicit. Doar dacă utilizatoarea alege și obiectivul de scădere în greutate | Ghid 2023 [S] (deficit doar la cerere, IMC ≥ 25)         |

Recomandare de produs: păstrăm eticheta, dar textul explicativ trebuie să spună „model alimentar echilibrat recomandat în ghidurile PCOS”, nu „tratează PCOS”.

---

## 4. `high_fiber`

**Ce arată dovezile:** AI la EFSA este 25 g/zi pentru adulți [M] (https://www.efsa.europa.eu/en/efsajournal/pub/1462). ESC 2012 recomanda 30–45 g/zi [S]. Pragurile UE: „sursă” 3 g/100 g sau 1,5 g/100 kcal; „bogat” 6 g/100 g sau 3 g/100 kcal [V].

**De ce nu aplicăm direct „6 g/100 g” pe o masă:** o porție de 400 g ar avea nevoie de 24 g fibre, iar o masă de 600 kcal la 3 g/100 kcal ar avea nevoie de 18 g. Pe mâncăruri gătite cu apă, aproape nicio rețetă nu atinge asta. Varianta realistă și apărabilă: densitatea UE de „sursă de fibre”, plus un minim absolut pe porție.

| Regulă                            | Prag                                                                                                   | Sursă                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Fibre per porție                  | **≥ 8 g** (minim absolut 6 g ca prag de urgență)                                                       | [D] 25 g/zi (EFSA) ÷ 3 ≈ 8,3 g                                                       |
| Densitate                         | **≥ 1,5 g/100 kcal**                                                                                   | UE „sursă de fibre” [V]                                                              |
| Etichetă afișată „bogat în fibre” | doar dacă ≥ 3 g/100 kcal **sau** ≥ 6 g/100 g                                                           | UE „bogat în fibre” [V]. Folosim exact pragul legal ca să nu facem o mențiune falsă. |
| Proveniența fibrelor              | ≥ 50% din fibre din legume, leguminoase, cereale integrale sau nuci (nu din tărâțe sau fibre adăugate) | [D] calitate, în linia ADA/Harvard                                                   |

Exemplul tău (un fel cu 3 g de fibre) iese din filtru la oricare dintre reguli.

---

## 5. `heart_healthy` (+ candidatul `ldl_lowering` / colesterol mare)

**Ce arată dovezile:**

- AHA: grăsimi saturate 5–6% din energie (≈ 13 g/zi la 2000 kcal) pentru cine trebuie să-și scadă colesterolul [V]. Sursa: https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/saturated-fats
- AHA, sodiu: < 2300 mg/zi, ideal ≤ 1500 mg pentru cei cu HTA, diabet sau BCR și pentru cei peste 51 de ani [S]. Sursa: https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/how-much-sodium-should-i-eat-per-day
- ESC 2021: AGS < 10% din energie; trans minim; sare < 5 g/zi; pește 1–2 ori/săpt.; carne roșie ≤ 350–500 g/săpt.; alcool ≤ 100 g/săpt.; tipar mediteranean [S]. Sursa: https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/CVD-Prevention-in-clinical-practice ; rezumat: https://edepot.wur.nl/706585
- ESC/EAS 2025 dislipidemii: dietă săracă în AGS, bogată în cereale integrale, legume, fructe și pește. **Nu** recomandă suplimente (drojdie roșie de orez etc.) [V-rez.]. Sursa: https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/All-ESC-Practice-Guidelines/Dyslipidaemias
- Beta-glucanul din ovăz în doză de 3 g/zi scade LDL (EFSA). Mențiunea este permisă pe alimente care dau ≥ 1 g pe porție [V]. Sursa: https://www.efsa.europa.eu/en/efsajournal/pub/1885 ; Reg. (UE) 1160/2011
- Steroli/stanoli vegetali 1,5–3 g/zi scad LDL [M]. Reg. (UE) 432/2012 / 384/2010. Doza vine de obicei din produse îmbogățite, irelevantă pentru rețete.

**Reguli pe masă `heart_healthy`:**

| Regulă                                                        | Prag                                                | Sursă                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Grăsimi saturate                                              | **≤ 4 g/porție** și ≤ 7% din energia mesei          | [D] AHA 13 g/zi ÷ 3 = 4,3 g                                                                                                                |
| Sodiu                                                         | **≤ 600 mg/porție**                                 | [D] WHO 2000 mg/zi × 0,30. Telemeaua (de obicei peste 1000 mg Na/100 g [M]) iese din filtru prin calcul, fără regulă specială.             |
| Carne procesată                                               | 0                                                   | ESC/WCRF [V/S]                                                                                                                             |
| Grăsimi trans (ex. margarină hidrogenată, untură industrială) | 0 ingrediente marcate                               | ESC 2021 [S]                                                                                                                               |
| Fibre                                                         | ≥ 6 g                                               | [D]                                                                                                                                        |
| Sursă de grăsime                                              | predominant nesaturată (raport (MUFA+PUFA)/AGS ≥ 2) | [D] AHA 2017 Presidential Advisory recomandă înlocuirea AGS cu PUFA/MUFA [M]: https://www.ahajournals.org/doi/10.1161/CIR.0000000000000510 |
| Prăjit în baie de ulei                                        | exclus (ex. nachos, șnițel)                         | [D] proxy pentru densitate energetică și grăsimi oxidate. Nachos cu 41 g de grăsime ies oricum prin regula de AGS/energie.                 |

**Reguli pe masă `ldl_lowering` (candidat nou):** cele de mai sus, cu AGS **≤ 3 g** [D, pragul inferior de 5% din AHA: 11 g/zi ÷ 3], plus bonus pentru ≥ 1 g beta-glucan (ovăz/orz) sau ≥ 1 porție de leguminoase. Colesterolul alimentar nu este criteriu separat: ghidurile recente pun accent pe AGS [M].

**Pe săptămână:** pește ≥ 2 porții, de preferat gras (AHA [M], ESC [S], Harvard [V]); leguminoase ≥ 3; carne roșie ≤ 350–500 g gătită (WCRF [V]: https://www.wcrf.org/diet-activity-and-cancer/cancer-prevention-recommendations/limit-red-and-processed-meat/).

---

## 6. `pork_free`

Obiectiv de preferință sau religios, nu de sănătate. Regula este pur pe ingrediente: exclude orice ingredient cu `species = pork`. Lista trebuie să prindă și formele ascunse: untură, slănină, bacon, jumări, șorici, cârnați/mici/salam mixte (porc+vită), parizer, șuncă, gelatină de porc, piftie, caltaboș, toba, „bulion de oase” nespecificat. Recomand un câmp `animal_species[]` pe ingredient și tratarea valorii „necunoscut” ca porc (fail-closed). Nu există praguri numerice și nici sursă clinică.

---

## 7. Obiective candidate

### 7.1 `iron_rich` (anemie feriprivă / prevenție)

**Dovezi:**

- RDA în SUA: 18 mg/zi pentru femei 19–50 de ani, 8 mg pentru bărbați și pentru femei peste 51 [S]. Vegetarienii au nevoie de ≈ 1,8 ori mai mult, pentru că fierul non-hem se absoarbe mai slab [V]. Sursa: https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/ ; https://ods.od.nih.gov/factsheets/ExerciseandAthleticPerformance-HealthProfessional/
- EFSA: PRI de 16 mg/zi pentru femei la premenopauză [V], 11 mg pentru bărbați [M]. EFSA **nu** stabilește valori separate pentru vegetarieni [V-rez.]. Sursa: https://www.efsa.europa.eu/en/efsajournal/pub/4254
- Fierul hem (carne, pește) se absoarbe mai bine. Vitamina C și carnea cresc absorbția fierului non-hem; ceaiul/cafeaua (polifenoli), calciul și fitații o scad [V-rez. ODS].
- Anemia **se diagnostichează și se tratează medical**, adesea cu suplimente. Meniul doar sprijină.

| Regulă                                              | Prag                               | Sursă                                                                                                |
| --------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Fier per porție                                     | ≥ 4,5 mg                           | [D] VNR 14 mg × 0,33 ≈ 4,6 mg. Echivalează cu „sursă de fier” pe porție (15% VNR = 2,1 mg/100 g [M]) |
| Dacă fierul este majoritar non-hem                  | vitamina C ≥ 25 mg în aceeași masă | [D] ≈ 30% din VNR 80 mg [M]. ODS: vitamina C crește absorbția [S]                                    |
| Fără ceai/cafea în aceeași masă (doar notă afișată) | n/a                                | ODS [S]                                                                                              |
| Bonus fier hem                                      | ≥ 1 mg fier hem/porție             | [D]. Estimare hem = 40% din fierul din carne/pește/pasăre, convenția Monsen 1978 [M]                 |

Pe săptămână: carne roșie slabă până la limita WCRF (≤ 500 g), plus leguminoase ≥ 4 porții [D].

### 7.2 `b12_vegan` (B12 pentru vegani/vegetarieni)

**Dovezi:** RDA 2,4 µg (adulți), 2,6 µg în sarcină [S, ODS]. EFSA AI 4 µg/zi [M] (https://www.efsa.europa.eu/en/efsajournal/pub/4150). B12 apare natural doar în alimente de origine animală. Veganii trebuie să ia alimente fortificate sau supliment [S]. Sursa: https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/

| Regulă                        | Prag                                                                                                                                                                               | Sursă       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| B12 pe zi (meniu vegetarian)  | ≥ 4 µg din toate mesele                                                                                                                                                            | EFSA AI [M] |
| Meniu vegan                   | aplicația **nu poate** garanta B12 din alimente nefortificate. Afișează mesajul obligatoriu „Dieta vegană necesită B12 din supliment sau alimente fortificate; discută cu medicul” | ODS [S]     |
| Bonus ingrediente fortificate | drojdie inactivă fortificată, băuturi vegetale fortificate                                                                                                                         | ODS [S]     |

Concluzie: este mai bine ca „alertă nutrițională” decât ca obiectiv de filtrare.

### 7.3 `low_sodium` / hipertensiune (DASH)

**Dovezi:**

- DASH la 2000 kcal: cereale 6–8 porții/zi; legume 4–5; fructe 4–5; lactate slabe 2–3; carne/pește ≤ 6 (porții de 28 g); grăsimi 2–3; nuci/semințe/leguminoase 4–5 pe săptămână; dulciuri ≤ 5 pe săptămână; sodiu 2300 mg. 1500 mg scade tensiunea și mai mult [V]. Sursa: https://www.nhlbi.nih.gov/education/dash-eating-plan
- WHO: sodiu < 2000 mg [V-rez.], potasiu ≥ 3510 mg [M].

| Regulă             | Prag                                                                                                                                                                    | Sursă                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Sodiu per porție   | **≤ 500 mg**                                                                                                                                                            | [D] 1500 mg ÷ 3 (NHLBI/AHA)                                                                                        |
| Densitate sodiu    | ≤ 0,12 g/100 g (= „sărac în sodiu” UE) ca bonus de etichetă                                                                                                             | UE [V]                                                                                                             |
| Potasiu per porție | ≥ 1000 mg (bonus, nu filtru)                                                                                                                                            | [D] WHO 3510 ÷ 3 ≈ 1170 [M]                                                                                        |
| Ingrediente sărate | max. 1 dintre: brânză sărată (telemea, feta), mezel, murături, conservă nedesalinizată, cub/supă instant, sos de soia                                                   | [D] proxy până avem sodiu complet                                                                                  |
| **Avertisment**    | potasiu ridicat + medicamente IECA/sartani/diuretice care economisesc potasiu sau boală renală = risc de hiperkaliemie. Sărurile „light” cu KCl nu se recomandă automat | NIDDK [V]: https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/eating-nutrition |

### 7.4 `low_fodmap` (sindrom de colon iritabil)

**Dovezi:** Dieta low-FODMAP are 3 faze: eliminare 2–6 săptămâni, reintroducere, personalizare. Se face ideal cu un dietetician [S]. Nu este o dietă pe termen lung. Grupele cu FODMAP mult: fructani/GOS (grâu, secară, ceapă, usturoi, leguminoase), lactoză (lapte; brânzeturile maturate și untul au puțină), polioli (mere, pere, ciuperci, îndulcitori), fructoză în exces (miere, mango, sirop de porumb) [V]. Conținutul variază cu procesarea: leguminoasele din conservă, clătite, au mai puțin [V]. Sursa: https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/ ; https://www.monashfodmap.com/blog/food-processing-and-fodmaps-what-you/

- **Pragurile pe porție sunt date proprietare Monash**, nu publice (detalii la §8).

| Regulă                                       | Prag                                                                                                                                                               | Sursă                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Exclude ingrediente din lista Monash publică | ceapă, usturoi (inclusiv praf), grâu/secară ca bază, leguminoase uscate, lapte/iaurt/smântână nedelactozate, mere, pere, mango, miere, ciuperci, conopidă, polioli | Monash [V]                           |
| Permite                                      | ulei infuzat cu usturoi (fructanii nu sunt liposolubili [M]), partea verde de la ceapa verde [M], brânzeturi maturate, linte la conservă ≤ porție mică [M]         | Monash                               |
| Formulare                                    | „fără declanșatori FODMAP frecvenți”, nu „low-FODMAP certificat”                                                                                                   | Certificarea este o marcă Monash [S] |

Riscul este moderat. Restricția prelungită reduce diversitatea microbiotei și aportul de fibre [M], deci limitează meniul la 6 săptămâni și pune un mesaj „pentru reintroducere consultă un dietetician”.

### 7.5 `pregnancy_safe` (filtru de **siguranță**, nu obiectiv de sănătate)

**Dovezi (NHS) [V]**, sursa: https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/

- **De evitat:** lapte/smântână/iaurt/unt nepasteurizate; ficat și produse din ficat (vitamina A); carne crudă sau insuficient gătită; vânat; pește crud, sushi cu pește crud, fructe de mare crude; pește-spadă, rechin, marlin; ouă crude (excepția „British Lion” nu se aplică în RO, deci tratăm toate ouăle crude ca excluse: maioneză de casă, tiramisu, mousse); ceai cu rădăcină de lemn-dulce; alcool (cel mai sigur zero).
- **Doar gătite până fierb:** brânzeturi moi cu coajă albă (brie, camembert, chèvre) și cele moi cu mucegai albastru; mezeluri crude-uscate (salam, chorizo, prosciutto); somon afumat la rece; creveți gătiți reci.
- **Limite:** ton ≤ 4 conserve sau 2 fripturi pe săptămână; pește gras ≤ 2 porții pe săptămână; cofeină ≤ 200 mg/zi (cafea instant ≈ 100 mg, ceai ≈ 75 mg); ceai de plante ≤ 4 căni/zi.
- Acid folic 400 µg/zi ca supliment până în săptămâna 12 [M]: https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/

| Regulă                                             | Prag                                                                                                                                                 | Sursă                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Ingrediente interzise                              | flag `pregnancy_avoid` = 0 în rețetă                                                                                                                 | NHS [V]                  |
| Brânză                                             | `pasteurized = true` sau brânza e gătită în rețetă (copt/fiert). Brânza de burduf, telemeaua artizanală sau „de țară” cu status necunoscut = exclusă | NHS [V]; [D] fail-closed |
| Pește gras                                         | ≤ 2/săpt.; ton ≤ 2 porții/săpt.; spadă/rechin/marlin 0                                                                                               | NHS [V]                  |
| Cofeină (dacă rețeta are cafea/ceai/cacao)         | ≤ 200 mg/zi pe tot meniul                                                                                                                            | NHS [V]                  |
| Alcool în rețetă (inclusiv vin la gătit, tiramisu) | 0                                                                                                                                                    | NHS [V]                  |

### 7.6 `gout_friendly` / acid uric mare

**Dovezi:** Ghidul ACR 2020 (FitzGerald et al., Arthritis Care Res 2020) recomandă condiționat limitarea alcoolului, a purinelor și a siropului de porumb bogat în fructoză. Certitudinea dovezilor e scăzută sau foarte scăzută, iar dieta este **adjuvant** la tratamentul hipouricemiant [S]. Sursa: https://pmc.ncbi.nlm.nih.gov/articles/PMC10563586/table/T7 . Mayo/NIAMS: limitează organele, carnea roșie, fructele de mare (hamsii, sardine, midii, scoici, creveți), berea și spirtoasele, sucurile îndulcite și sucurile de fructe [V]. Surse: https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/gout-diet/art-20048524 ; https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take

| Regulă                                  | Prag                        | Sursă                                                                                                                                                            |
| --------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organe (ficat, rinichi, splină, creier) | 0                           | Mayo/NIAMS [V]                                                                                                                                                   |
| Hamsii, sardine, midii, scoici, creveți | 0                           | NIAMS/Mayo [V]                                                                                                                                                   |
| Carne roșie                             | ≤ 1 masă/zi, ≤ 120 g/porție | [D]                                                                                                                                                              |
| Bere/alcool în rețetă, sucuri îndulcite | 0                           | ACR [S]                                                                                                                                                          |
| Purine pe porție (când există date)     | ≤ 200 mg                    | [M] categoriile Kaneko et al. 2014 (Biol Pharm Bull 37:709): „foarte mare” > 300 mg/100 g, „mare” 200–300 mg/100 g. Pragul pe porție este [D] și trebuie validat |

Riscul este mediu. Ar fi acceptabil cu disclaimer și redenumit „sărac în purine”. Fără date de purine, putem implementa doar regulile pe ingrediente.

### 7.7 `weight_loss`

**Dovezi:** Planul NHS de 12 săptămâni: 1400 kcal/zi femei, 1900 kcal/zi bărbați; deficit ≈ 600 kcal; 0,5–1 kg pe săptămână [S]. Sursa: https://www.nhs.uk/better-health/lose-weight/ ; evaluare PHE: https://assets.publishing.service.gov.uk/media/61265801e90e070541075822/Evaluation_of_the_NHS_App_PHE_Report_25Aug2020.pdf

| Regulă                     | Prag                                                                                               | Sursă                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Energie per porție         | ≤ 450 kcal (femei) / ≤ 600 kcal (bărbați)                                                          | [D] (1400 − gustare 100) ÷ 3 ≈ 430; (1900 − 150) ÷ 3 ≈ 580          |
| Proteine                   | ≥ 25 g                                                                                             | [D] sațietate și menținerea masei musculare (ISSN 20–40 g/masă [V]) |
| Fibre                      | ≥ 6 g                                                                                              | [D]                                                                 |
| Zaharuri libere            | ≤ 5 g                                                                                              | [D] WHO                                                             |
| Plafon de siguranță zilnic | **nu** sub 1200 kcal (F) / 1500 kcal (M) fără supraveghere medicală                                | [S], cifră neconfirmată pe nhs.uk                                   |
| Blocaj                     | IMC < 18,5, vârstă < 18, sarcină/alăptare, istoric de tulburări alimentare → obiectiv indisponibil | [D] siguranță (vezi §9)                                             |

### 7.8 `high_protein` / masă musculară

**Dovezi:** ISSN 2017: 1,4–2,0 g/kg/zi pentru persoane active; 0,25 g/kg sau 20–40 g per doză, la 3–4 ore; 700–3000 mg leucină per doză [V]. Sursa: https://pubmed.ncbi.nlm.nih.gov/28642676/ . Pentru populația generală, EFSA dă PRI 0,83 g/kg [V].

| Regulă              | Prag                                                                                     | Sursă                                       |
| ------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------- |
| Proteine per porție | ≥ 30 g                                                                                   | ISSN 20–40 g [V]; [D] mijlocul intervalului |
| Densitate           | ≥ 20% din energie din proteine                                                           | UE „bogat în proteine” [V]                  |
| Calitate            | ≥ 1 sursă completă (ouă, lactate, carne, pește, soia) sau combinație cereală+leguminoasă | [M]                                         |
| Avertisment         | boală renală cronică → obiectiv blocat (vezi §9)                                         | NIDDK [V]                                   |

### 7.9 `bone_health` (osteoporoză: calciu + vitamina D)

**Dovezi:** EFSA, calciu: PRI 950 mg/zi la adulți peste 25 de ani [V] (https://www.efsa.europa.eu/en/efsajournal/pub/4101). SUA: 1000 mg, 1200 mg pentru femei peste 51 [M] (ODS Calcium). Vitamina D: RDA SUA 15 µg (600 UI), 20 µg peste 70 de ani [S] (https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/). AI EFSA 15 µg [M] (https://www.efsa.europa.eu/en/efsajournal/pub/4547). Puține alimente au vitamina D (pește gras, ouă, alimente fortificate). De obicei e nevoie de soare sau supliment [M].

| Regulă             | Prag                                                                             | Sursă                                             |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| Calciu per porție  | ≥ 300 mg                                                                         | [D] 950 ÷ 3 ≈ 317                                 |
| Vitamina D (bonus) | ≥ 2,5 µg/porție                                                                  | [D] ≈ 15% din 15 µg; în practică pește gras/ouă   |
| Proteine           | ≥ 20 g                                                                           | [D]                                               |
| Sodiu              | ≤ 600 mg                                                                         | [D] sodiul crește pierderea urinară de calciu [M] |
| Mesaj              | „Vitamina D se obține greu doar din alimente; întreabă medicul despre supliment” | ODS [S]                                           |

### 7.10 `gestational_diabetes`: **nu îl oferim ca obiectiv**

NICE NG3: toate femeile cu diabet gestațional trebuie trimise la dietetician; se recomandă alimente cu IG mic [S]. Sursa: https://www.nice.org.uk/guidance/ng3/ifp/chapter/If-you-have-been-diagnosed-with-gestational-diabetes . Țintele sunt individuale, sub monitorizare glicemică, adesea cu insulină. Riscurile sunt cetoza, hipoglicemia și restricția energetică pentru făt. Aplicația ar trebui doar să combine `pregnancy_safe` cu „glicemie echilibrată”, cu mesaj obligatoriu „urmează planul dieteticianului tău”.

### 7.11 Prea medicale sau riscante pentru aplicație (nu le oferim)

| Afecțiune                                                                                  | De ce nu                                                                                                                                                                                       | Sursă                                                                                                       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Boală cronică de rinichi                                                                   | Restricțiile de proteine, potasiu, fosfor și lichide depind de stadiu și analize. Meniurile „bogate în proteine” sau DASH (bogate în potasiu) pot face rău. NIDDK cere dietetician specializat | https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/eating-nutrition [V] |
| Warfarină / antagoniști de vitamina K                                                      | Contează ca aportul de vitamina K să rămână **constant**, nu să fie evitat. Un meniu care alternează săptămâni cu spanac/kale și fără ele poate destabiliza INR-ul                             | [S] pharmacytimes; NIH MedlinePlus [M]: https://medlineplus.gov/druginfo/meds/a682277.html                  |
| IMAO (antidepresive) / linezolid                                                           | Tiramina (brânzeturi maturate, mezeluri curate/afumate, varză murată, soia fermentată) poate da criză hipertensivă                                                                             | [S]; Mayo [M]: https://www.mayoclinic.org/diseases-conditions/depression/expert-answers/maois/faq-20058035  |
| Grepfrut + statine (simvastatină, atorvastatină), unii blocanți de calciu, imunosupresoare | Furanocumarinele cresc nivelul medicamentului                                                                                                                                                  | FDA [V-rez.]: https://www.fda.gov/consumers/consumer-updates/grapefruit-juice-and-some-drugs-dont-mix       |
| Diabet tip 1 / tip 2 pe insulină sau sulfoniluree                                          | Doza se potrivește cu carbohidrații. O masă cu „mai puțini carbohidrați” decât de obicei poate duce la hipoglicemie                                                                            | NHS/UK: 15–20 g carbohidrați rapizi la hipo [S]                                                             |
| Diabet gestațional                                                                         | vezi 7.10                                                                                                                                                                                      | NICE NG3 [S]                                                                                                |
| Boală celiacă / alergii severe                                                             | Contaminarea încrucișată și etichetarea ingredientelor comerciale nu pot fi garantate de o aplicație de rețete                                                                                 | [D] răspundere juridică                                                                                     |
| Tulburări de comportament alimentar                                                        | Numărarea caloriilor și deficitul pot agrava boala                                                                                                                                             | [D]; ghid NICE ED [M]                                                                                       |
| Copii < 18, vârstnici fragili, oncologie, post-bariatric                                   | Necesar individual                                                                                                                                                                             | [D]                                                                                                         |

---

## 8. Câmpuri noi în baza de ingrediente și surse de date

### 8.1 Câmpuri necesare (per 100 g, în plus față de kcal/proteine/carbohidrați/grăsimi/fibre)

| Câmp                                                                                                                                                                                                                                                                                        | Pentru                     | FDC SR Legacy/Foundation                                                                                     | CIQUAL                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `sodium_mg`                                                                                                                                                                                                                                                                                 | heart, HTA, bone           | da [M]                                                                                                       | da (sare + sodiu) [V/M]                      |
| `sat_fat_g`, `mufa_g`, `pufa_g`, `trans_fat_g`                                                                                                                                                                                                                                              | heart, LDL, anti-infl.     | da (trans: parțial) [M]                                                                                      | da, acizi grași [M]                          |
| `sugars_total_g`                                                                                                                                                                                                                                                                            | toate                      | da [M]                                                                                                       | da [V]                                       |
| `free_sugar_flag` / `added_sugar_g`                                                                                                                                                                                                                                                         | diabet, anti-infl., WL     | **nu** în SR Legacy. Calculăm din ingrediente: zahăr, miere, siropuri, gemuri, sucuri = 100% zaharuri libere | n/a                                          |
| `fe_mg` + `heme_fraction`                                                                                                                                                                                                                                                                   | iron                       | fier da; hem nu → regula 40% pentru carne/pește [M]                                                          | fier da [M]                                  |
| `vit_c_mg`                                                                                                                                                                                                                                                                                  | iron                       | da                                                                                                           | da                                           |
| `ca_mg`, `vit_d_ug`                                                                                                                                                                                                                                                                         | bone                       | da                                                                                                           | da                                           |
| `b12_ug`                                                                                                                                                                                                                                                                                    | b12                        | da                                                                                                           | da                                           |
| `k_mg`, `p_mg`                                                                                                                                                                                                                                                                              | HTA (și blocare BCR)       | da                                                                                                           | da                                           |
| `epa_g`, `dha_g`, `ala_g` (20:5 n-3, 22:6 n-3, 18:3 n-3)                                                                                                                                                                                                                                    | anti-infl., heart          | da [M]                                                                                                       | da [M]                                       |
| `vit_k_ug`                                                                                                                                                                                                                                                                                  | doar avertisment warfarină | da                                                                                                           | parțial [M]                                  |
| `caffeine_mg`                                                                                                                                                                                                                                                                               | sarcină                    | da (cafea/ceai/cacao) [M]                                                                                    | n/a                                          |
| `gi` (+ sursa valorii)                                                                                                                                                                                                                                                                      | diabet, PCOS               | nu                                                                                                           | nu → Atkinson 2021                           |
| `purine_mg` sau `purine_class`                                                                                                                                                                                                                                                              | gută                       | nu                                                                                                           | nu → literatură (Kaneko 2014)                |
| `fodmap_class` (low / moderate / high + grupă)                                                                                                                                                                                                                                              | IBS                        | nu                                                                                                           | nu → doar listă publică Monash, fără praguri |
| Flag-uri: `processed_meat`, `red_meat`, `organ_meat`, `oily_fish`, `high_mercury_fish`, `raw_or_undercooked`, `unpasteurized`/`pasteurized_unknown`, `alcohol`, `species[]`, `whole_grain`, `refined_grain`, `legume`, `nut_seed`, `olive_oil`, `deep_fried`, `tyramine_high`, `grapefruit` | reguli pe ingrediente      | manual (curatoriat), nu există în baze                                                                       | —                                            |

### 8.2 Surse de date și licențe

| Sursă                                                | Licență                                                                                                | Observații                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **USDA FoodData Central**                            | **Domeniu public, CC0 1.0** [V]; USDA cere citarea sursei                                              | https://fdc.nal.usda.gov/ . 5 tipuri: Foundation, SR Legacy, FNDDS (Survey), Experimental, Branded [V]. Cea mai completă bază gratuită pentru micronutrienți. Zahărul adăugat lipsește; există în FPED (USDA ARS), separat [M].                                                                                                                 |
| **CIQUAL (ANSES, Franța)**                           | Open data, gratuit [V]. Licence Ouverte / Etalab [M, verifică pe pagina de descărcare]                 | https://ciqual.anses.fr/ ; https://www.anses.fr/en/content/ciqual-nutritional-composition-table . 3484 alimente [V]. Mutată pe recherche.data.gouv.fr [V]. CALNUT = versiunea cu valori lipsă completate [V]. Alimentele sunt mai apropiate de cele europene (brânzeturi, mezeluri, pâine).                                                     |
| **EuroFIR FoodEXplorer**                             | Membership / acces cu abonament [M]                                                                    | Agregă bazele naționale (26 de organizații) [V]: https://www.eurofir.org/about_eurofir/ . Necesită contract, deci nu este potrivit pentru MVP.                                                                                                                                                                                                  |
| **România**                                          | **N-am găsit o tabelă națională deschisă de compoziție**                                               | Există doar proiectul IBA București (bază electronică pentru produse românești analizate; acces neclar) [V-rez.]. Ghidul MS „Reguli pentru o alimentație sănătoasă” este din 2006 [V]: https://www.fao.org/nutrition/education/dietary-guidelines/regions/romania/en . Republica Moldova are din 2024 o bază cu peste 1500 de produse [V-rez.]. |
| **Tabelele internaționale IG 2021** (Atkinson, AJCN) | Articol de jurnal (Oxford/ASN). Licența suplimentului **de verificat**; poate fi open access CC-BY [M] | ≈ 4000 de alimente; tabelul 1 ISO ≈ 2100 [V]. Valorile numerice (fapte) pot fi preluate cu citare, dar tabelul ca bază de date poate fi protejat (drept sui-generis UE asupra bazelor de date). Cere confirmare juridică.                                                                                                                       |
| **Monash FODMAP**                                    | **Proprietar / comercial** [S]                                                                         | Pragurile pe porție sunt doar în aplicația Monash. Certificarea „Low FODMAP Certified” este o marcă [S]: https://www.monash.edu/monash-innovation/impact/licensing/low-fodmap . Pentru date: contact cu biroul de licențiere Monash. Fără licență folosim doar listele publice de alimente.                                                     |
| **Purine**                                           | Nu există o bază oficială deschisă                                                                     | Kaneko et al. 2014, Biol Pharm Bull (≈ 270 de alimente) [M]. Licența jurnalului trebuie verificată.                                                                                                                                                                                                                                             |

---

## 9. Siguranță, poziționare, disclaimer

### 9.1 Principii

1. **Aplicația nu tratează, nu diagnostichează, nu înlocuiește dieteticianul.** Reg. (UE) 1169/2011, art. 7(3) interzice să atribui unui aliment proprietatea de a preveni, trata sau vindeca o boală [M]: https://eur-lex.europa.eu/eli/reg/2011/1169/oj . Dacă software-ul este destinat „tratării sau ameliorării unei boli”, poate fi încadrat ca dispozitiv medical conform MDR 2017/745 (regula 11 pentru software) [M]: https://eur-lex.europa.eu/eli/reg/2017/745/oj . **Recomand o verificare juridică.** Practic: etichetele să descrie **proprietăți ale meniului** („mai puțini carbohidrați rafinați”, „sărac în sare”), nu boli („pentru diabetici”).
   - Redenumiri propuse: `diabetic_friendly` → „Glicemie echilibrată”; `pcos_friendly` → „Echilibru metabolic (potrivit ghidurilor PCOS)”; `heart_healthy` → „Prietenos cu inima: puține grăsimi saturate și puțină sare”; `anti_inflammatory` → „Model mediteranean”.
2. **Fail-closed:** dacă un ingredient nu are o valoare (sodiu necunoscut, pasteurizare necunoscută), rețeta **nu** primește eticheta.
3. Etichetele care seamănă cu mențiuni UE („bogat în fibre”, „sărac în sare”) se afișează **doar** la pragurile legale [V].
4. Autoverificare obligatorie la onboarding: „Ești însărcinată sau alăptezi? Ai boală de rinichi? Iei anticoagulante (warfarină/acenocumarol), antidepresive IMAO, insulină sau sulfoniluree? Ai sau ai avut o tulburare de alimentație?”. Un „da” blochează obiectivele riscante sau afișează un avertisment. Nu stocăm diagnostice mai mult decât e nevoie; acestea sunt date de sănătate, categorie specială GDPR art. 9 → consimțământ explicit [M].

### 9.2 Text de disclaimer propus (RO)

> **SmartMeal oferă sugestii generale de meniu pentru adulți sănătoși, bazate pe recomandări publice de alimentație (OMS, EFSA, ghiduri medicale europene și internaționale). Nu este un serviciu medical, nu pune diagnostice și nu tratează nicio boală.** Obiectivele de sănătate (de ex. „Glicemie echilibrată”, „Prietenos cu inima”) descriu compoziția meniului, nu efectul lui asupra unei afecțiuni. Valorile nutriționale sunt estimări calculate din baze de date publice și pot diferi de produsele pe care le cumperi. Dacă ai diabet, boală de rinichi, boală de inimă, ești însărcinată sau alăptezi, iei medicamente cu interacțiuni alimentare (de ex. anticoagulante, antidepresive IMAO, statine) ori ai o tulburare de alimentație, **discută orice schimbare de dietă cu medicul sau cu un dietetician autorizat** (Colegiul Dieteticienilor din România). În caz de urgență sună la 112.

Mesaje contextuale scurte:

- Glicemie: „Dacă folosești insulină sau sulfoniluree, nu reduce carbohidrații fără acordul medicului: risc de hipoglicemie.”
- Sarcină: „Meniul exclude alimentele pe care NHS le recomandă evitate în sarcină. Nu înlocuiește sfatul medicului tău obstetrician.”
- Vegan: „Vitamina B12 nu se găsește în alimente vegetale nefortificate; ai nevoie de supliment sau de alimente fortificate.”
- Proteine/sodiu-potasiu: „Nu folosi acest obiectiv dacă ai boală de rinichi.”

### 9.3 Situații în care o sugestie de meniu poate face rău (reguli de blocare)

| Situație                                       | Ce poate merge prost                                                                                                                                                                          | Regulă în aplicație                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Sarcină                                        | listerioză (brânză nepasteurizată, pește afumat la rece, pateu), toxoplasmoză (carne crudă), teratogenitate prin vitamina A (ficat), mercur (spadă, rechin, marlin), alcool, cofeină > 200 mg | `pregnancy_safe` impus automat; brânza cu status necunoscut se exclude [V NHS]   |
| Diabet tratat cu insulină/sulfoniluree         | hipoglicemie dacă meniul are mult mai puțini carbohidrați decât de obicei                                                                                                                     | fără mod „low-carb” sub 30 g/masă; mesaj [S]                                     |
| BCR                                            | hiperkaliemie (DASH, salată de fasole, banane, sare cu KCl), încărcare proteică                                                                                                               | blochează `high_protein` și `low_sodium` cu bonus de K [V NIDDK]                 |
| Warfarină                                      | variații mari ale vitaminei K săptămână de săptămână                                                                                                                                          | avertisment; opțional, aplicația menține vitamina K constantă pe săptămână [S]   |
| IMAO                                           | criză hipertensivă prin tiramină                                                                                                                                                              | exclude `tyramine_high` [S]                                                      |
| Statine, ciclosporină, unii blocanți de calciu | grepfrut/pomelo                                                                                                                                                                               | exclude `grapefruit` dacă utilizatorul declară medicația [V-rez. FDA]            |
| Tulburări de alimentație, IMC < 18,5, minori   | deficit caloric, obsesie pentru cifre                                                                                                                                                         | blochează `weight_loss`; ascunde caloriile [D]                                   |
| Alergii/celiachie                              | reacții                                                                                                                                                                                       | doar filtru de alergeni pe ingrediente; mesaj „verifică eticheta produselor” [D] |

---

## 10. Pe scurt: ce schimbăm în planificator

1. Calcul pe porție (sodiu, AGS, zaharuri libere, fibre, carbohidrați disponibili, proteine) și reguli `hard` (filtru) sau `soft` (scor).
2. Etichete derivate automat din nutrienți, nu atribuite manual. Cele manuale rămân doar pentru flag-urile de ingredient (procesat, integral, crud, nepasteurizat, specie).
3. Reguli săptămânale în generator: pește ≥ 2 (oily ≥ 1), leguminoase ≥ 3, carne roșie ≤ 500 g gătită, carne procesată ≈ 0, sarcină: pește gras ≤ 2 și ton ≤ 2.
4. Date: import FDC (CC0) pentru micronutrienți. CIQUAL ca a doua sursă pentru alimentele europene (licența de confirmat). IG din Atkinson 2021, cu verificare juridică. FODMAP doar ca listă publică. Purine doar prin reguli pe ingrediente.
5. Redenumirea etichetelor medicale, disclaimer, întrebări de siguranță la onboarding, fail-closed.
