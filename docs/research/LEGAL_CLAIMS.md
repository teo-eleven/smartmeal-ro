# SmartMeal RO: obiective de sănătate, mențiuni nutriționale/de sănătate, dispozitive medicale, magazine de aplicații

Cercetare din 30.10.2026. **Nu sunt avocat.** Acesta este un rezumat documentat, nu o consultanță juridică. Locurile unde e nevoie de avocat sunt marcate cu **[AVOCAT]**, iar cele incerte cu **[INCERT]**.

Surse primare folosite (textele au fost descărcate și citite direct, nu din memorie):

- Reg. (CE) 1924/2006, versiunea consolidată RO din 13.12.2014 (textul oficial EUR-Lex găzduit de DSP București): https://dspb.ro/pdf/control-sanatate-publica/Regulament%20CE%20nr.%201924_2006.pdf . Pagina EUR-Lex: https://eur-lex.europa.eu/legal-content/RO/ALL/?uri=CELEX:32006R1924 (EUR-Lex a blocat descărcarea automată, așa că am verificat textul EN pe legislation.gov.uk: https://www.legislation.gov.uk/eur/2006/1924 ).
- Reg. (UE) 432/2012, anexa: https://www.legislation.gov.uk/eur/2012/432/annex (textul UE dinainte de Brexit; registrul UE actual: https://ec.europa.eu/food/food-feed-portal/screen/health-claims/eu-register ).
- Reg. (UE) 1169/2011, art. 7 și anexa XIII: https://www.legislation.gov.uk/eur/2011/1169/article/7 , https://www.legislation.gov.uk/eur/2011/1169/annex/XIII
- MDCG 2019-11 rev.1 (iunie 2025): https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511 ; Health apps declaration: https://support.google.com/googleplay/android-developer/answer/14738291
- Legea 256/2015 (dieteticieni): https://usv.ro/fisiere_utilizator/file/dsdu/documente/2021/legea%20256%20din%202015.pdf
- Legea 363/2007: https://legeaz.net/legea-363-2007-practici-incorecte-comercianti-consumatori/
- Raportul Ministerului Sănătății (ISS) despre controlul mențiunilor în 2024: https://ms.ro/media/documents/Raport_narativ_ISS_mentiuni_2024.docx

---

## 0. Pe scurt

1. **Nu e sigur că Reg. 1924/2006 se aplică direct unei aplicații de rețete.** Regulamentul acoperă mențiunile din „comunicări comerciale” despre „produse alimentare care urmează să fie livrate ca atare consumatorului final”. SmartMeal vinde un abonament, nu alimente. Totuși, recomand ca **regulamentul să fie standardul intern**, din trei motive:
   - ANPC (Legea 363/2007), Apple/Google și MDR judecă textele după aceleași idei: să nu inducă în eroare și să nu aibă scop medical.
   - Riscul crește imediat ce apar parteneriate cu retaileri, linkuri afiliate, mărci de produse sau meal-kit-uri.
   - E singurul vocabular „sigur” recunoscut oficial.

   **[AVOCAT]** pentru încadrarea exactă.

2. **Patru din cele cinci texte actuale sunt problematice:**
   - „Previne vârfurile de zahăr”, „Stabilizează insulina” și „Reduce inflamația cronică” atribuie efecte de prevenire sau tratament ale unei boli. Pentru alimente acest lucru e interzis (art. 7(3) din Reg. 1169/2011). Pentru aplicație, astfel de texte o pot transforma în dispozitiv medical (MDR).
   - „Sănătos pentru inimă — Protecție cardiovasculară” este o mențiune generală (art. 10(3)) fără o mențiune autorizată care să o însoțească.
   - Doar „Bogat în fibre” e în regulă, cu condiția să fie calculat corect (≥ 6 g/100 g sau ≥ 3 g/100 kcal).
3. **Calea sigură:**
   - etichete construite din **mențiunile nutriționale din anexa 1924/2006**, calculate per 100 g de preparat;
   - **mențiuni de sănătate autorizate** (Reg. 432/2012), formulate exact și numai când rețeta îndeplinește condițiile;
   - numele obiectivelor descriu **ce filtrăm** („mai puțină sare”), nu **ce vindecăm** („hipertensiune”);
   - disclaimer, surse citate, revizuire de către un dietetician autorizat;
   - **fără personalizare clinică**: fără valori de glicemie sau insulină folosite pentru a ajusta meniul, fără scoruri de risc.

---

## 1. Reg. (CE) 1924/2006: se aplică aplicației?

### 1.1 Domeniul de aplicare (text oficial)

- Art. 1(2): regulamentul „se aplică mențiunilor nutriționale și de sănătate formulate în comunicările comerciale, fie în etichetarea, prezentarea sau publicitatea produselor alimentare care urmează să fie livrate ca atare consumatorului final”. Se aplică și alimentelor destinate restaurantelor, spitalelor, școlilor, cantinelor și altor unități de alimentație colectivă. Surse: https://www.legislation.gov.uk/eur/2006/1924/article/1 (EN) și PDF-ul RO de mai sus, art. 1.
- Considerentul (4), RO: regulamentul „ar trebui să se aplice tuturor mențiunilor nutriționale și de sănătate făcute în comunicările comerciale, inclusiv, inter alia, în publicitatea generică la produse alimentare […]. Acesta nu ar trebui să se aplice mențiunilor formulate în comunicările cu caracter necomercial, cum ar fi orientările sau sfaturile alimentare emise de autoritățile și organismele publice competente în materie de sănătate, sau comunicărilor și informărilor cu caracter necomercial din presă și publicații științifice.” Se aplică și mărcilor care pot fi interpretate ca mențiuni.
- Definiții, art. 2(2):
  - „mențiune”: orice mesaj sau reprezentare, inclusiv imagini, grafice sau simboluri, care afirmă, sugerează sau implică faptul că un aliment are anumite caracteristici;
  - „mențiune nutrițională”: proprietăți nutriționale benefice datorate energiei sau nutrienților;
  - „mențiune de sănătate”: orice mențiune care „afirmă, sugerează sau implică faptul că există o relație” între un aliment sau un constituent al lui și sănătate;
  - „mențiune privind reducerea riscului de îmbolnăvire”: consumul „reduce semnificativ un factor de risc în dezvoltarea unei boli umane”.

  Sursa: https://www.legislation.gov.uk/eur/2006/1924/article/2

### 1.2 Analiză pentru SmartMeal [INCERT] [AVOCAT]

- **Argumente că NU se aplică direct:** SmartMeal nu pune pe piață alimente. Rețeta e un set de instrucțiuni, iar preparatul e făcut de utilizator din ingrediente cumpărate de el. Nu am găsit niciun ghid oficial (Comisie, EFSA, autoritate națională) care să trateze explicit aplicațiile de rețete. Ghidul britanic spune că regulamentul „only applies to claims made in a commercial context” și menționează ca exemple etichetarea, publicitatea „print, broadcast, internet or direct mail”, pliantele și meniurile ( https://www.gov.uk/government/publications/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-1924-2006-on-nutrition-and-health-claims-made-on-foods/nutrition-and-health-claims-guidance-to-compliance-with-regulation-ec-19242006 , secțiunile 3.4–3.8). Ghidul e din Marea Britanie, deci are doar valoare orientativă în UE.
- **Argumente că SE POATE aplica:**
  - Aplicația e o activitate comercială cu abonament plătit.
  - CJUE interpretează larg atât domeniul, cât și noțiunea de „mențiune de sănătate”:
    - **C-19/15 Innova Vital (14.07.2016)**: regulamentul se aplică și comunicărilor adresate doar profesioniștilor din sănătate. Contează destinația alimentului, nu publicul comunicării. Surse: https://lexgo.be/en/news-and-articles/3793-regulation-on-nutrition-and-health-claims-also-applicable-to-b2b-communications , https://foodcomplianceinternational.com/industry-insight/news/993-health-claims-regulation-applies-to-communications-to-health-professionals-eu-court-rules (ECLI:EU:C:2016:563, de verificat pe curia.europa.eu).
    - **C-544/10 Deutsches Weintor (06.09.2012)**: „ușor digerabil” este mențiune de sănătate. Relația cu sănătatea se interpretează larg și cuprinde și menținerea stării de sănătate. Sursa: comunicatul CJUE https://curia.europa.eu/jcms/upload/docs/application/pdf/2012-09/cp120112en.pdf
  - Dacă aplicația are **linkuri către produse sau retaileri, mărci de ingrediente, coș de cumpărături sau meal-kit**, etichetele devin aproape sigur comunicări comerciale despre alimente.
- **Chiar dacă 1924/2006 nu se aplică**, rămân:
  - **Legea 363/2007 / Directiva 2005/29**: practica e înșelătoare dacă induce în eroare cu privire la „avantajele” sau „rezultatele care se pot obţine din utilizarea sa” (art. 6(1) lit. b, https://legeaz.net/legea-363-2007-practici-incorecte-comercianti-consumatori/art-6-practici-comerciale-inselatoare-practici-comerciale-incorecte ). Anexa 1 pct. 17 interzice în orice situație „Falsa afirmaţie că produsul poate vindeca boli, disfuncţii sau malformaţii” ( https://legeaz.net/legea-363-2007-practici-incorecte-comercianti-consumatori/anexa-nr-1 ).
  - **MDR**: un scop de „prevenire/tratament/ameliorare a bolii” declarat în marketing poate face din aplicație un dispozitiv medical (vezi §3).
  - Politicile Apple/Google (vezi §4).
- **Cine controlează în România:** Ministerul Sănătății (Inspecția Sanitară de Stat), ANPC și ANSVSA. Baza legală e HG 723/2011 și Ordinul comun MS/ANPC/ANSVSA nr. 1705/45/29/2011-2012 privind controlul pe piață al mențiunilor. În 2024, ISS a controlat 5.503 produse, a găsit 255 neconforme și a dat 145 de sancțiuni (70 de amenzi, 288.400 lei). Controlul a vizat etichete de produse, nu aplicații. Sursa: https://ms.ro/media/documents/Raport_narativ_ISS_mentiuni_2024.docx

### 1.3 Cele patru tipuri de mențiuni

| Tip                                   | Exemplu                                                                                                            | Regim                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nutrițională                          | „Bogat în fibre”, „Conținut scăzut de sodiu/sare”                                                                  | Permisă doar dacă e în anexa 1924/2006 și sunt îndeplinite condițiile (art. 8)                                                                                                                                                                                                                                  |
| De sănătate, funcție (art. 13)        | „Fierul contribuie la formarea normală a globulelor roșii și a hemoglobinei”                                       | Permisă doar cu textul autorizat în Reg. 432/2012 și cu condițiile de utilizare (art. 10(1))                                                                                                                                                                                                                    |
| Generală / nespecifică (art. 10(3))   | „Sănătos pentru inimă”, „bun pentru imunitate”                                                                     | Permisă doar dacă e **însoțită** de o mențiune specifică autorizată                                                                                                                                                                                                                                             |
| Reducerea riscului de boală (art. 14) | „Beta-glucanul din ovăz reduce colesterolul. Colesterolul ridicat este un factor de risc pentru boala coronariană” | Autorizare individuală. Formularea și condițiile sunt fixe                                                                                                                                                                                                                                                      |
| Medicinală (interzisă la alimente)    | „previne/tratează/vindecă diabetul”, „stabilizează insulina în SOP”                                                | Art. 7(3) din Reg. 1169/2011: informațiile despre alimente „shall not attribute to any food the property of preventing, treating or curing a human disease, nor refer to such properties”. Art. 7(4) extinde regula la publicitate și prezentare. Sursa: https://www.legislation.gov.uk/eur/2011/1169/article/7 |

Alte cerințe din 1924/2006:

- **Art. 10(2)**: o mențiune de sănătate trebuie însoțită de: (a) o declarație despre importanța unei diete variate și echilibrate și a unui stil de viață sănătos; (b) cantitatea și modul de consum necesare pentru efect; (c) când e cazul, o mențiune pentru persoanele care ar trebui să evite alimentul; (d) un avertisment dacă excesul e riscant. Sursa: https://www.legislation.gov.uk/eur/2006/1924/article/10
- **Art. 12**: sunt interzise mențiunile care (a) sugerează că sănătatea poate fi afectată dacă nu consumi alimentul; (b) se referă la ritmul sau cantitatea pierderii în greutate; (c) se referă la „recomandări ale unor medici sau profesioniști din domeniul sănătății”, cu excepția asociațiilor naționale de profil și a organizațiilor caritabile din domeniul sănătății. Sursa: https://www.legislation.gov.uk/eur/2006/1924/article/12

  Consecință practică: nu asociați numele unui dietetician anume cu o mențiune despre un aliment („recomandat de dr. X”). Formularea „Conținutul aplicației e revizuit de un dietetician autorizat” descrie serviciul, nu un aliment, și e mai sigură. **[INCERT]**

### 1.4 Condiții de utilizare pentru mențiunile nutriționale (anexa 1924/2006, text RO oficial)

Toate valorile sunt **per 100 g sau 100 ml de produs**, nu per porție. Pentru rețete trebuie calculate per 100 g de preparat gata.

| Mențiunea (titlul oficial RO)                   | Condiția (citat din anexă)                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VALOARE ENERGETICĂ SCĂZUTĂ                      | „nu conține mai mult de 40 kcal (170 kJ)/100 g în cazul solidelor sau mai mult de 20 kcal (80 kJ)/100 ml în cazul lichidelor”                                                                                                                                                                                                                            |
| CONȚINUT REDUS DE GRĂSIMI (= _low fat_)         | „nu conține mai mult de 3 g grăsimi per 100 g în cazul solidelor sau 1,5 g grăsimi per 100 ml în cazul lichidelor (1,8 g grăsimi per 100 ml pentru laptele semidegresat)”                                                                                                                                                                                |
| FĂRĂ GRĂSIMI                                    | „maxim 0,5 g grăsimi per 100 g sau 100 ml” („X% fără grăsimi” e interzis)                                                                                                                                                                                                                                                                                |
| CONȚINUT REDUS DE GRĂSIMI SATURATE (= _low_)    | „suma acizilor grași saturați și a acizilor grași trans din produs nu depășește 1,5 g per 100 g în cazul solidelor sau 0,75 g/100 ml în cazul lichidelor și în ambele cazuri […] nu trebuie să asigure mai mult de 10 % energie”                                                                                                                         |
| CONȚINUT REDUS DE ZAHARURI (= _low sugars_)     | „nu conține mai mult de 5 g zaharuri per 100 g în cazul solidelor sau 2,5 g zaharuri per 100 ml în cazul lichidelor”                                                                                                                                                                                                                                     |
| FĂRĂ ZAHARURI                                   | „nu conține mai mult de 0,5 g zaharuri per 100 g sau 100 ml”                                                                                                                                                                                                                                                                                             |
| FĂRĂ ADAOS DE ZAHARURI                          | fără mono- sau dizaharide adăugate și fără alt aliment folosit pentru îndulcire. Dacă există zaharuri naturale: „CONȚINE ZAHARURI PREZENTE ÎN MOD NATURAL”                                                                                                                                                                                               |
| CONȚINUT SCĂZUT DE SODIU/SARE                   | „nu conține mai mult de 0,12 g sodiu sau valoarea echivalentă de sare, per 100 g sau per 100 ml”                                                                                                                                                                                                                                                         |
| CONȚINUT FOARTE SCĂZUT DE SODIU/SARE            | „nu conține mai mult de 0,04 g sodiu sau valoarea echivalentă de sare, per 100 g sau per 100 ml”                                                                                                                                                                                                                                                         |
| FĂRĂ SODIU / FĂRĂ SARE                          | „nu conține mai mult de 0,005 g sodiu […] per 100 g”                                                                                                                                                                                                                                                                                                     |
| FĂRĂ ADAOS DE SODIU/SARE                        | fără sodiu/sare adăugate și „nu conține mai mult de 0,12 g sodiu […] per 100 g sau 100 ml”                                                                                                                                                                                                                                                               |
| SURSĂ DE FIBRE                                  | „cel puțin 3 g fibre per 100 g sau cel puțin 1,5 g fibre per 100 kcal”                                                                                                                                                                                                                                                                                   |
| BOGAT ÎN FIBRE                                  | „cel puțin 6 g fibre per 100 g sau cel puțin 3 g fibre per 100 kcal”                                                                                                                                                                                                                                                                                     |
| SURSĂ DE PROTEINE                               | „cel puțin 12 % din valoarea energetică a produsului alimentar o reprezintă proteinele”                                                                                                                                                                                                                                                                  |
| BOGAT ÎN PROTEINE                               | „cel puțin 20 % din valoarea energetică” vine din proteine                                                                                                                                                                                                                                                                                               |
| SURSĂ DE [vitamină/mineral]                     | „cel puțin o cantitate semnificativă, astfel cum este definită în anexa la Directiva 90/496/CEE”. Azi definiția e în anexa XIII partea A pct. 2 din Reg. 1169/2011: **15 % din VNR per 100 g** (alimente), 7,5 % per 100 ml (băuturi) sau 15 % per porție (ambalaje cu o singură porție). Sursa: https://www.legislation.gov.uk/eur/2011/1169/annex/XIII |
| BOGAT ÎN [vitamină/mineral]                     | „cel puțin de două ori valoarea cerută pentru mențiunea «sursă de»”, adică 30 % VNR/100 g                                                                                                                                                                                                                                                                |
| SURSĂ DE ACIZI GRAȘI OMEGA 3                    | „cel puțin 0,3 g acid alfa-linolenic per 100 g și per 100 kcal sau cel puțin 40 mg sumă de acid eicosapentaenoic și acid docosahexaenoic per 100 g și per 100 kcal”                                                                                                                                                                                      |
| BOGAT ÎN ACIZI GRAȘI OMEGA 3                    | „cel puțin 0,6 g acid alfa-linolenic per 100 g și per 100 kcal sau cel puțin 80 mg sumă de [EPA+DHA] per 100 g și per 100 kcal”                                                                                                                                                                                                                          |
| BOGAT ÎN LIPIDE MONONESATURATE / POLINESATURATE | ≥ 45 % din acizii grași sunt de tipul respectiv **și** acestea dau > 20 % din energie                                                                                                                                                                                                                                                                    |
| BOGAT ÎN LIPIDE NESATURATE                      | ≥ 70 % din acizii grași sunt nesaturați **și** dau > 20 % din energie                                                                                                                                                                                                                                                                                    |
| CONȚINUT REDUS DE [nutrient] (= _reduced_)      | reducere de ≥ 30 % față de un produs similar (sodiu: 25 %; micronutrienți: 10 % din VNR)                                                                                                                                                                                                                                                                 |

Atenție la traducerea RO: titlul oficial „CONȚINUT REDUS DE GRĂSIMI/ZAHARURI” înseamnă _low_ (prag absolut). „CONȚINUT REDUS DE [nutrient]” înseamnă _reduced_ (−30 % față de un produs similar). În textul fiecărei condiții apare „conținut scăzut”. Pentru claritate, în aplicație folosiți **„Conținut scăzut de …”** pentru pragurile absolute.

VNR utile pentru praguri (anexa XIII, Reg. 1169/2011):

| Nutrient     | VNR      | „Sursă de” (≥ 15 %/100 g) | „Bogat în” (≥ 30 %/100 g) |
| ------------ | -------- | ------------------------- | ------------------------- |
| Fier         | 14 mg    | 2,1 mg                    | 4,2 mg                    |
| Vitamina C   | 80 mg    | 12 mg                     | 24 mg                     |
| Acid folic   | 200 µg   | 30 µg                     | 60 µg                     |
| Potasiu      | 2.000 mg | 300 mg                    | 600 mg                    |
| Vitamina B12 | 2,5 µg   | 0,375 µg                  | 0,75 µg                   |
| Calciu       | 800 mg   | 120 mg                    | 240 mg                    |
| Vitamina D   | 5 µg     | 0,75 µg                   | 1,5 µg                    |
| Magneziu     | 375 mg   | 56,25 mg                  | 112,5 mg                  |
| Zinc         | 10 mg    | 1,5 mg                    | 3 mg                      |

Mențiuni care **nu** sunt în anexă și deci nu sunt permise dacă 1924/2006 se aplică:

- „indice glicemic scăzut”, „low carb”, „keto”, „antiinflamator”, „detox”, „alcalin” **[INCERT pentru „low carb”/„IG scăzut”]**.

Profilurile nutriționale din art. 4 nu au fost adoptate nici azi. Ca regulă internă prudentă, nu puneți mențiuni pe rețete foarte bogate în sare, zahăr sau grăsimi saturate **[INCERT]**.

---

## 2. Reg. (UE) 432/2012: mențiuni autorizate utile pentru obiectivele aplicației

Formulările sunt citate din anexa 432/2012 ( https://www.legislation.gov.uk/eur/2012/432/annex ). Traducerea RO trebuie preluată **cuvânt cu cuvânt** din versiunea RO a regulamentului de pe EUR-Lex ( https://eur-lex.europa.eu/legal-content/RO/TXT/?uri=CELEX:32012R0432 ) sau din registrul UE. Traducerile de mai jos sunt orientative **[INCERT – verificați textul RO oficial]**.

### Colesterol / inimă

| Mențiune autorizată (EN)                                                                                                                                                | Condiții                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| „Beta-glucans contribute to the maintenance of normal blood cholesterol levels”                                                                                         | ≥ 1 g beta-glucani din ovăz, tărâțe de ovăz, orz sau tărâțe de orz **per porție cuantificată**. Consumatorul trebuie informat că efectul apare la **3 g/zi**                                                  |
| „Replacing saturated fats with unsaturated fats in the diet contributes to the maintenance of normal blood cholesterol levels” (la fel și pentru acid oleic, MUFA/PUFA) | Doar pentru alimente care îndeplinesc „BOGAT ÎN LIPIDE NESATURATE”                                                                                                                                            |
| „ALA contributes to the maintenance of normal blood cholesterol levels”                                                                                                 | Cel puțin „sursă de omega-3” (ALA). Efect la **2 g ALA/zi**                                                                                                                                                   |
| „Linoleic acid contributes to the maintenance of normal blood cholesterol levels”                                                                                       | ≥ 1,5 g LA/100 g și /100 kcal. Efect la 10 g/zi                                                                                                                                                               |
| „EPA and DHA contribute to the normal function of the heart”                                                                                                            | Cel puțin „sursă de omega-3” (EPA+DHA). Efect la **250 mg EPA+DHA/zi**                                                                                                                                        |
| „Walnuts contribute to the improvement of the elasticity of blood vessels”                                                                                              | 30 g nuci/zi, cu informarea consumatorului                                                                                                                                                                    |
| Pectine, guma guar, glucomanan (colesterol)                                                                                                                             | 6 g, 10 g, respectiv 4 g pe zi, plus avertisment de sufocare. Greu de atins cu rețete obișnuite                                                                                                               |
| Art. 14, ovăz: „Oat beta-glucan has been shown to lower/reduce blood cholesterol. High cholesterol is a risk factor in the development of coronary heart disease”       | Reg. (UE) 1160/2011, 3 g/zi, ≥ 1 g per porție **[INCERT – verificați în registrul UE]**. Ca mențiune de reducere a riscului, se aplică și art. 14(2): trebuie precizat că boala are mai mulți factori de risc |

### Tensiune arterială

| Mențiune                                                                                 | Condiții                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| „Reducing consumption of sodium contributes to the maintenance of normal blood pressure” | Doar alimente cu cel puțin „CONȚINUT SCĂZUT DE SODIU/SARE” (≤ 0,12 g Na/100 g) sau cu sodiu redus |
| „Potassium contributes to the maintenance of normal blood pressure”                      | Cel puțin „sursă de potasiu” (≥ 300 mg/100 g)                                                     |

### Fier / „anemie” (nu folosiți cuvântul „anemie” ca promisiune de efect)

| Mențiune                                                                                                             | Condiții                                        |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| „Iron contributes to normal formation of red blood cells and haemoglobin”                                            | Cel puțin „sursă de fier” (≥ 2,1 mg/100 g)      |
| „Iron contributes to normal oxygen transport in the body”; „…to the reduction of tiredness and fatigue”              | La fel                                          |
| „Vitamin C increases iron absorption”                                                                                | Cel puțin „sursă de vitamina C” (≥ 12 mg/100 g) |
| „Vitamin B12 contributes to normal red blood cell formation”; „Folate contributes to normal blood formation”         | Cel puțin „sursă de” B12 / folat                |
| „Copper contributes to normal iron transport in the body”; „Riboflavin contributes to the normal metabolism of iron” | Cel puțin „sursă de” cupru / riboflavină        |

### Glicemie (diabet / SOP)

| Mențiune                                                                                                                                   | Condiții                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| „Consumption of beta-glucans from oats or barley as part of a meal contributes to the reduction of the blood glucose rise after that meal” | ≥ **4 g beta-glucani din ovăz/orz pentru fiecare 30 g carbohidrați disponibili** per porție cuantificată. Prag mare, rar atins                                                           |
| „Consumption of foods containing fructose leads to a lower blood glucose rise compared to foods containing sucrose or glucose”             | Glucoza/zaharoza **înlocuite cu fructoză** în alimente îndulcite, cu o reducere de ≥ 30 %. Nu e potrivită pentru rețete și nu e recomandabilă pentru mesaje către diabetici **[opinie]** |
| „Consumption of foods/drinks containing <sugar replacer> instead of sugar induces a lower blood glucose rise…”                             | Zaharurile înlocuite cu îndulcitorii enumerați, cu reducerea minimă cerută pentru „conținut redus de zaharuri”                                                                           |
| „Chromium contributes to the maintenance of normal blood glucose levels”                                                                   | Cel puțin „sursă de crom trivalent”. Greu de calculat din rețete                                                                                                                         |
| Arabinoxilan din endosperm de grâu, alfa-ciclodextrină, pectine, HPMC (glicemie postprandială)                                             | Ingrediente și cantități specifice. Practic inaplicabile pentru rețete casnice                                                                                                           |

**Concluzie:** nu există o mențiune autorizată de tipul „menține glicemia stabilă” pentru o masă obișnuită. Pentru obiectivul de glicemie rămân mențiunile nutriționale („conținut scăzut de zaharuri”, „fără adaos de zaharuri”, „bogat în fibre”) și descrieri factuale (de ex. „X g carbohidrați per porție”).

### Fibre / digestie (posibil relevante pentru IBS, dar fără a menționa IBS)

- „Oat grain fibre contributes to an increase in faecal bulk”, „Barley grain fibre…”, „Wheat bran fibre contributes to an increase in faecal bulk”: doar alimente cu „BOGAT ÎN FIBRE” din fibra respectivă.
- „Wheat bran fibre contributes to an acceleration of intestinal transit”: bogat în fibră de tărâțe de grâu, efect la ≥ 10 g/zi.
- „Rye fibre contributes to normal bowel function”: bogat în fibră de secară.
- Pentru IBS nu există nicio mențiune autorizată.

### Sarcină

- „Folate contributes to maternal tissue growth during pregnancy”: cel puțin „sursă de folat” (≥ 30 µg/100 g).
- Mențiunile de tip art. 14 despre acidul folic și defectele de tub neural sunt pentru acid folic **suplimentar** (suplimente). Nu sunt potrivite pentru rețete **[INCERT – verificați registrul]**.

### Imunitate (relevantă pentru textul „Antiinflamator”)

- „Vitamin C contributes to the normal function of the immune system”, „Vitamin B12 …”, „Copper …”, „Zinc …”: fiecare cere cel puțin „sursă de” nutrientul respectiv.
- **Nu există** mențiuni autorizate de tip „reduce inflamația” sau „susține articulațiile” pentru alimente obișnuite.

Reguli generale pentru mențiunile de sănătate:

- Respectați art. 10(2): mesajul despre dietă variată, cantitatea necesară și, când e cazul, avertismentul.
- Mențiunile pentru botanice aflate „on hold” (curcuma, ghimbir etc.) **nu** sunt autorizate. Nu le folosiți ca bază pentru eticheta „antiinflamator”.

---

## 3. Dispozitive medicale: Reg. (UE) 2017/745 (MDR) și MDCG 2019-11 rev.1

### 3.1 Textele relevante

- Ce face software-ul să fie (sau nu) MDSW, cu citate din MDCG 2019-11 rev.1 (iunie 2025, PDF-ul de mai sus):
  - „Intended purpose” se stabilește din „the data supplied by the manufacturer on the label, in the instructions for use or in **promotional or sales materials or statements**”. Deci **textele de marketing și din App Store contează**.
  - „software only intended for non-medical purposes […] such as […] **wellness or fitness apps, do not qualify as MDSW**.”
  - Decision step 4: „is the action for the benefit of individual patients?”. Nu sunt în această categorie aplicațiile care oferă doar „generic diagnostic or treatment pathways (not directed to individual patients), scientific literature, medical atlases, models and templates”.
  - Exemplu de MDSW din ghid: o aplicație pentru tulburări de alimentație care „reacts on different patient inputs related of the disease (diet, physical activity, body image, etc.)” ca să amelioreze simptomele. Arată că **dieta poate fi parte dintr-un MDSW** când scopul e tratarea sau ameliorarea unei boli.
  - Alte exemple de MDSW: recomandări de doză de insulină și aplicații care calculează fertilitatea.
- Rule 11 (Anexa VIII MDR): software-ul „intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa”, sau IIb/III în funcție de impact. „All other software is classified as class I.” Ghidul precizează că un software care previne riscul de boală analizând parametri fiziologici poate fi clasa IIa. Practic, un MDSW pentru nutriție în diabet ar fi probabil cel puțin clasa I, cel mai probabil IIa, deci cu organism notificat, marcaj CE, sistem de management al calității și evaluare clinică. **[INCERT – încadrarea exactă cere specialist în reglementare MDR]**
- Definiția de dispozitiv medical din MDR (art. 2(1)) acoperă scopuri precum diagnosticarea, **prevenirea**, monitorizarea, predicția, prognosticul, tratamentul sau **ameliorarea** unei boli. Formulări de tipul „previne vârfurile de zahăr la diabetici” sau „stabilizează insulina în SOP” descriu exact un scop medical. Text MDR: https://eur-lex.europa.eu/eli/reg/2017/745/oj

### 3.2 Când ar deveni SmartMeal dispozitiv medical (situații de risc)

- Spune că **previne, tratează, ameliorează sau gestionează** o boală (diabet, SOP, hipertensiune, IBS, anemie, diabet gestațional).
- Folosește **date clinice individuale** pentru a ajusta meniul, de exemplu:
  - glicemie, HbA1c, insulină, tensiune, feritină, simptome IBS;
  - calculează carbohidrați pentru doze de insulină;
  - generează alerte de tipul „glicemia ta e mare, mănâncă X”.
- Dă **scoruri de risc** sau sugerează un diagnostic („ai simptome de SOP”).
- Se prezintă ca **substitut** pentru dieta prescrisă de medic sau ca „terapie nutrițională”.

### 3.3 Ce păstrează aplicația în zona de wellness

- Scop declarat (în termeni, în App Store și pe site): _„SmartMeal te ajută să planifici mese și să alegi rețete după preferințe și criterii nutriționale (de ex. mai puține zaharuri, mai puțină sare, mai multe fibre). Nu este un dispozitiv medical și nu este destinat diagnosticării, prevenirii, monitorizării, tratamentului sau ameliorării vreunei boli.”_
- Filtrele se aplică pe **criterii nutriționale generale**, aceleași pentru toți cei care le aleg, nu pe parametri clinici individuali.
- Obiectivele au **nume nutriționale**, nu nume de boli. Dacă totuși păstrați o întrebare de onboarding de tipul „Ai un diagnostic de care trebuie să țină cont meniul?”, răspunsul ar trebui să ducă la **excluderi de siguranță** (de ex. fără alcool sau pește crud în sarcină) și la îndemnul de a consulta medicul, nu la un „plan terapeutic”. **[INCERT – zonă-limită, recomand avocat sau consultant MDR]**
- Fără câmpuri pentru valori de laborator sau glicemie. Dacă le adăugați vreodată, faceți întâi o analiză MDR.
- Disclaimer și trimitere la medic sau dietetician (vezi §6).

### 3.4 SUA (FDA), dacă publicați în App Store-ul american

- FDA a revizuit ghidul „General Wellness: Policy for Low Risk Devices” pe **6 ianuarie 2026**. Ghidul are două categorii de wellness:
  1. „maintaining or encouraging a general state of health or a healthy activity”;
  2. „helping to reduce the risk or impact of certain chronic diseases or conditions”, acolo unde e bine acceptat că stilul de viață sănătos contează.

  Ies din wellness produsele destinate „diagnosis, cure, mitigation, prevention, or treatment of a disease”, cele care „guide clinical management” și cele cu alerte orientate spre boală sau tratament. Surse: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices ; rezumat: https://troutman.com/insights/fdas-2026-guidance-on-general-wellness-devices-policy-for-low-risk-devices ; https://cov.com/en/news-and-insights/insights/2026/01/fda-issues-revised-guidance-on-general-wellness-products

- Categoria 2 permite în SUA formulări de tipul „un stil alimentar sănătos poate ajuta la reducerea riscului de hipertensiune”. **În UE asta nu e automat permis**: 1924/2006 și MDR sunt mai stricte. Nu copiați formulările americane în versiunea UE.
- Pentru publicitate, în SUA se aplică și FTC (afirmațiile de sănătate trebuie susținute științific) **[neverificat în detaliu]**.

---

## 4. Apple și Google

### 4.1 Apple App Store Review Guidelines (text actual, citat)

- **1.4.1 Medical**: „Medical apps that could provide inaccurate data or information, or that could be used for diagnosing or treating patients may be reviewed with greater scrutiny.” Mai departe: „Apps must clearly disclose data and methodology to support accuracy claims relating to health measurements…” și „Apps should remind users to check with a doctor in addition to using the app and before making medical decisions.” Dacă aplicația are aprobare de reglementare, se trimite linkul.
  - **Verificat:** textul actual 1.4.1 **nu cere explicit citarea surselor** pentru informațiile medicale. Cere doar metodologia pentru afirmațiile de acuratețe ale măsurătorilor și reamintirea de a consulta medicul. Citarea surselor rămâne totuși o bună practică și ajută la review.
- **1.4.2**: calculatoarele de doze de medicamente trebuie să provină de la entități aprobate. Relevant dacă ați adăuga vreodată calcule de carbohidrați pentru insulină: nu le adăugați.
- **5.1.1(ix)**: aplicațiile din domenii puternic reglementate, inclusiv „healthcare”, sau care cer informații sensibile „should be submitted by a legal entity that provides the services, and not by an individual developer”. Publicați SmartMeal de pe contul unei **firme** (SRL), nu de pe un cont individual. **[INCERT dacă o aplicație de nutriție intră aici; recomand oricum cont de firmă]**
- **5.1.1(ii)**: consimțământ, retragere ușoară și „Paid functionality must not be dependent on or require a user to grant access to this data.” Verificați că abonamentul nu e condiționat de acordul pentru datele de sănătate. Dacă obiectivele de sănătate nu pot funcționa fără date de sănătate, descrieți clar asta. **[INCERT – de discutat cu avocat GDPR]**
- **5.1.2(i)**: dezvăluirea partajării cu terți, „including with third-party AI”, cu permisiune explicită. Relevant dacă generați meniuri cu un LLM extern.
- **5.1.3 Health and Health Research**: datele de sănătate nu pot fi folosite pentru publicitate sau marketing. (ii): aplicațiile „may not store personal health information in iCloud”. Trebuie dezvăluite datele de sănătate colectate.
- **HealthKit (2.5.1, 5.1.2(vi), 5.1.3)**: doar dacă integrați HealthKit. Atunci datele nu pot fi folosite pentru marketing sau data mining.

### 4.2 Google Play

- **Health Content and Services** ( https://support.google.com/googleplay/android-developer/answer/16679511 ):
  - „All developers must complete the Health apps declaration form on the App content page”.
  - Aplicațiile reglementate ca dispozitiv medical trebuie să furnizeze „proof of approval, clearance or certification by the relevant authority upon request”.
  - **„Other health and medical apps must include a clear disclaimer in their app description indicating that the app is “not a medical device and does not diagnose, treat, cure, or prevent any medical condition.”** Puneți această frază, tradusă, în descrierea din Play Store.
  - „Apps must also remind users to consult a healthcare professional for medical advice, diagnosis, or treatment.”
  - **Health misinformation**: „We don't allow apps containing misleading health claims that contradict existing medical consensus”.
  - Nu există cerință explicită de citare a surselor.
- **Health apps declaration** ( https://support.google.com/googleplay/android-developer/answer/14738291 ):
  - Categoria potrivită este **„Nutrition and Weight Management”** (grupul Health and fitness): „Tools for tracking dietary intake, planning meals…”.
  - Dacă marketingul vorbește de diabet sau SOP, aplicația se apropie de categoria Medical „Diseases and Conditions Management” („managing acute or chronic physical conditions (such as diabetes…)”), care atrage mai multă atenție la review.
  - Declarația trebuie să fie **coerentă** cu descrierea din magazin.

---

## 5. România

### 5.1 ANPC / Legea 363/2007

- Art. 6(1): o practică e înșelătoare dacă „induce în eroare sau este susceptibilă să inducă în eroare consumatorul mediu”, inclusiv cu privire la „avantajele” sau „rezultatele care se pot obţine din utilizarea sa”.
- Anexa 1 pct. 17 (practică interzisă în orice situație): „Falsa afirmaţie că produsul poate vindeca boli, disfuncţii sau malformaţii.” Surse: https://legeaz.net/legea-363-2007-practici-incorecte-comercianti-consumatori/anexa-nr-1 și art. 6, link mai sus.
- Abonamentul de 9,99 € e un serviciu către consumatori, deci Legea 363/2007 se aplică sigur, indiferent dacă se aplică 1924/2006. „Previne vârfurile de zahăr” sau „Stabilizează insulina” pot fi considerate rezultate promise fără dovadă.
- Amenzi **[INCERT – textul a fost modificat de mai multe ori]**:
  - art. 15 (forma din Legea 130/2010): 5.000–50.000 lei, respectiv 10.000–100.000 lei pentru nerespectarea măsurilor ( https://legeaz.net/legea-363-2007-practici-incorecte-comercianti-consumatori/art-15-raspunderi-si-sanctiuni-competenta-sesizare-si-control );
  - alte surse indică 5.000–100.000 lei pentru practicile din anexa 1;
  - după transpunerea Directivei Omnibus 2019/2161 pot exista și amenzi raportate la cifra de afaceri.

  Verificați forma consolidată pe https://legislatie.just.ro . Din 27.09.2026 Legea 363/2007 a fost modificată din nou, mai ales pentru mențiunile de mediu și durabilitate ( https://infocons.ro/infocons-te-informeaza-autoritatea-nationala-pentru-protectia-consumatorilor-anpc-principalele-modificari-legislative-aplicabile-din-27-septembrie-2026/ ).

### 5.2 Dieteticieni: Legea 256/2015

- Art. 2(1): profesia de dietetician este „o profesie liberală, în domeniul sănătăţii umane, furnizoare de servicii conexe actului medical”.
- Art. 3(1): dieteticianul aplică știința nutriției „atât a celor sănătoase, cât şi a celor bolnave”.
- Art. 5(1): profesia „se exercită pe teritoriul României numai de către persoanele care au obţinut statutul de dietetician autorizat”. Art. 5(3) cere autorizație de liberă practică de la CDR, reînnoită la 5 ani (art. 6).
- Art. 10 lit. b): dieteticianul clinic are rolul de „a planifica, a educa, a supraveghea şi a evalua un plan de alimentaţie, conceput clinic”.

Sursa: https://usv.ro/fisiere_utilizator/file/dsdu/documente/2021/legea%20256%20din%202015.pdf

**Poate o aplicație să dea „regim alimentar” pentru o boală fără dietetician?** **[INCERT] [AVOCAT]**

- Legea reglementează persoanele care exercită profesia. Nu reglementează explicit software-ul și nu definește ca act rezervat simpla publicare de rețete sau informații generale de nutriție. În textul citit nu am găsit o infracțiune specifică de „exercitare fără drept” pentru aplicații. Răspunderea e trimisă la dreptul comun (art. 18 și următoarele).
- Dar un **„plan de alimentaţie conceput clinic”** pentru o persoană cu o boală seamănă mult cu activitatea rezervată dieteticianului clinic (și cu actul medical). O aplicație care pretinde că oferă „regim pentru diabet/SOP” se expune la: plângeri ale CDR, Colegiului Medicilor sau ANPC; posibil la art. 348 Cod penal („exercitarea fără drept a unei profesii”) dacă activitatea e privită ca exercitare a profesiei **[INCERT – neverificat textul actual]**; și la răspundere civilă pentru prejudicii.
- **Recomandare:** (1) nu prezentați meniurile ca „regim” sau „dietă terapeutică” pentru o boală; (2) implicați un **dietetician autorizat de CDR** care să revizuiască și să semneze criteriile fiecărui obiectiv; (3) ideal, oferiți opțional consultații cu un dietetician real (abonament premium), unde dieteticianul face actul profesional, nu aplicația.

### 5.3 Ce presupune colaborarea cu un dietetician autorizat (practică uzuală, nu o cerință legală)

1. **Verificarea autorizației**: autorizația de liberă practică CDR valabilă, eventual și apartenența la o asociație profesională. Nu am găsit un registru public online al CDR; cereți copia autorizației **[INCERT]**.
2. **Contract de prestări servicii (PFA sau cabinet)** care să cuprindă: revizuirea criteriilor nutriționale pentru fiecare obiectiv (praguri de sare, zahăr, fibre, proteine, porții), revizuirea textelor, a unui eșantion de rețete și a excluderilor de siguranță (sarcină: alcool, pește crud, brânzeturi nepasteurizate, ficat/vitamina A, cofeină; IBS; interacțiuni simple), revizuire la fiecare schimbare de conținut, răspundere și asigurare profesională (malpraxis), confidențialitate și cesiunea drepturilor de autor asupra textelor.
3. **Documentare internă**: pentru fiecare obiectiv, o fișă cu criteriile, sursa (ghid sau aviz EFSA), data revizuirii și semnătura dieteticianului. Fișele ajută la review-urile Apple/Google și la un eventual control ANPC.
4. **Afișare**: „Criteriile nutriționale au fost revizuite de [Nume], dietetician autorizat CDR (data)”. Evitați formulări de tipul „recomandat de dieteticianul X” lângă o mențiune despre un aliment (art. 12(c)) **[INCERT]**.
5. Pentru obiectivele mai clinice (diabet, SOP, sarcină, IBS), un consultant medic, de exemplu diabetolog sau medic de nutriție, poate valida excluderile de siguranță.

---

## 6. Recomandări practice

### 6.1 Vocabular

**Formulări de evitat** (riscul principal: medicinal, art. 7(3) Reg. 1169/2011, MDR, Legea 363 anexa 1 pct. 17, sau neautorizat):

- „previne”, „tratează”, „vindecă”, „combate”, „luptă împotriva”;
- „reduce inflamația”, „antiinflamator”;
- „stabilizează insulina/glicemia”, „controlează diabetul”;
- „scade colesterolul/tensiunea” (excepția: mențiunea art. 14 exactă pentru beta-glucanul din ovăz, cu toate condițiile);
- „protecție cardiovasculară”, „protejează inima”;
- „regim pentru diabet/SOP/hipertensiune”, „dietă terapeutică”, „plan de tratament”;
- „detox”, „alcalinizant”, „crește imunitatea”, „întărește imunitatea”, „arde grăsimi”;
- „slăbești X kg în Y zile” (art. 12(b));
- „IG scăzut”, „low carb”, „antiinflamator” ca etichetă (nu sunt în anexă) **[INCERT]**;
- „recomandat de medici”, „recomandat de dr. X” (art. 12(c)).

**Formulări permise, cu condiții:**

- Mențiuni nutriționale exacte, doar dacă pragul din §1.4 e atins per 100 g de preparat: „Bogat în fibre”, „Sursă de fibre”, „Conținut scăzut de sare”, „Conținut scăzut de zaharuri”, „Fără adaos de zaharuri”, „Sursă de fier”, „Bogat în proteine”, „Sursă de acizi grași omega 3”, „Conținut scăzut de grăsimi saturate”, „Bogat în lipide nesaturate”.
- Mențiuni de sănătate autorizate, doar cu condițiile din §2 și cu formularea oficială RO. Exemple: „Fierul contribuie la formarea normală a globulelor roșii și a hemoglobinei”, „Reducerea consumului de sodiu contribuie la menținerea tensiunii arteriale normale”.

**Formulări neutre, factuale** (descriu filtrul sau rețeta, nu un efect asupra sănătății):

- „X g carbohidrați / Y g fibre / Z mg sodiu per porție”;
- „Fără zahăr adăugat în rețetă”, „Mai puțină sare decât varianta clasică” (atenție: comparativ = „conținut redus” cere −25 % sodiu față de un produs similar; mai sigur: „fără sare adăugată la gătit”);
- „Selectat după criterii: …”.

### 6.2 Recomandare pentru numele obiectivelor (numele vizibil e cel mai riscant)

| Actual sau propus         | Nume recomandat                                                                                                                                                                                              | Criterii (de validat cu dieteticianul)                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Diabet & Glicemie Stabilă | **„Atent la zaharuri și carbohidrați”**                                                                                                                                                                      | ≤ 5 g zaharuri/100 g, fără adaos de zahăr, fibre ≥ 3 g/100 g, carbohidrați per porție afișați                                                                                                          |
| SOP                       | **„Echilibrat, cu proteine și fibre”**                                                                                                                                                                       | ≥ 20 % energie din proteine, sursă sau bogat în fibre, fără adaos de zahăr                                                                                                                             |
| Sănătos pentru Inimă      | **„Grăsimi bune, puțină sare”**                                                                                                                                                                              | Bogat în lipide nesaturate și/sau conținut scăzut de grăsimi saturate, sodiu ≤ 0,12 g/100 g                                                                                                            |
| Antiinflamator            | **„Stil mediteranean”** (descrie un model alimentar, nu un efect)                                                                                                                                            | Leguminoase, legume, pește gras, ulei de măsline, cereale integrale                                                                                                                                    |
| Anemie (nou)              | **„Bogat în fier”**                                                                                                                                                                                          | Sursă sau bogat în fier, plus o sursă de vitamina C în aceeași masă                                                                                                                                    |
| Colesterol (nou)          | **„Cu ovăz și orz” / „Grăsimi nesaturate”**                                                                                                                                                                  | ≥ 1 g beta-glucani per porție; lipide nesaturate                                                                                                                                                       |
| Hipertensiune (nou)       | **„Puțină sare”**                                                                                                                                                                                            | ≤ 0,12 g Na/100 g; sursă de potasiu                                                                                                                                                                    |
| IBS (nou)                 | **„Digestie ușoară / low-FODMAP”** **[INCERT – low-FODMAP e o intervenție dietetică pentru IBS, cel mai bine sub îndrumarea unui dietetician; recomand să fie lansat doar după revizuirea dieteticianului]** | Liste de ingrediente validate                                                                                                                                                                          |
| Sarcină (nou)             | **„Pentru perioada sarcinii” = filtru de siguranță**, nu de efect                                                                                                                                            | Excluderi: alcool, pește/carne/ouă crude, brânzeturi nepasteurizate, ficat, pești cu mercur ridicat, limită de cofeină (EFSA: 200 mg/zi în sarcină **[sursă de verificat pe EFSA]**); „sursă de folat” |

Dacă vreți neapărat să rămână cuvântul bolii pentru găsire ușoară, formulați-l ca **context informativ**, nu ca efect. Exemplu: în descriere, „Criterii folosite frecvent în ghidurile de alimentație pentru persoanele cu diabet de tip 2. Nu înlocuiește planul stabilit cu medicul.” **[INCERT – zonă-limită MDR/1924; avocat]**

### 6.3 Rescrierea celor cinci texte actuale

1. „Diabet & Glicemie Stabilă — Previne vârfurile de zahăr în sânge”
   → **„Atent la zaharuri — Rețete cu conținut scăzut de zaharuri și fără zahăr adăugat, bogate în fibre. Vezi carbohidrații per porție.”**
   Aplicați eticheta doar dacă rețeta are ≤ 5 g zaharuri/100 g. „Bogat în fibre” doar dacă are ≥ 6 g/100 g.
2. „Sănătos pentru Inimă — Protecție cardiovasculară”
   → **„Grăsimi bune, puțină sare — Rețete bogate în grăsimi nesaturate și cu conținut scăzut de sare.”**
   Opțional, ca mențiune specifică (necesară după art. 10(3) dacă păstrați „pentru inimă”): _„Înlocuirea grăsimilor saturate din alimentație cu grăsimi nesaturate contribuie la menținerea unui nivel normal al colesterolului din sânge.”_ plus _„Contează o alimentație variată și echilibrată și un stil de viață sănătos.”_ Doar pentru rețete „bogate în lipide nesaturate”.
3. „SOP — Stabilizează insulina”
   → **„Echilibrat — Mese cu proteine și fibre la fiecare masă, fără zahăr adăugat.”** Fără nicio referire la insulină.
4. „Antiinflamator — Reduce inflamația cronică, susține imunitatea și articulațiile”
   → **„Stil mediteranean — Legume, leguminoase, pește gras, ulei de măsline și cereale integrale.”**
   Dacă rețeta e sursă de vitamina C: _„Vitamina C contribuie la funcționarea normală a sistemului imunitar.”_ Pentru articulații nu există nicio mențiune autorizată pentru alimente obișnuite. Scoateți-o.
5. „Bogat în fibre”
   → **„Bogat în fibre”** (mențiune nutrițională permisă), afișat **doar** dacă rețeta are ≥ 6 g fibre/100 g sau ≥ 3 g/100 kcal. Între 3 și 6 g/100 g: „Sursă de fibre”. Afișați și valoarea: „X g fibre/porție”.

### 6.4 Disclaimer

**Scurt** (sub fiecare obiectiv și pe ecranul de rezultate):

> „Informații generale despre alimentație, nu sfat medical. SmartMeal nu este un dispozitiv medical și nu diagnostichează, nu tratează, nu vindecă și nu previne nicio boală. Dacă ai o afecțiune, ești însărcinată sau iei medicamente, discută cu medicul sau cu un dietetician autorizat înainte să îți schimbi alimentația.”

**Lung** (în Termeni și în „Despre obiectivele de sănătate”):

> „SmartMeal oferă planificare de mese și informații nutriționale pentru un stil de viață sănătos. Criteriile fiecărui obiectiv se bazează pe surse publice (de ex. avizele EFSA și regulamentele UE privind mențiunile nutriționale și de sănătate) și au fost revizuite de un dietetician autorizat [nume, nr. autorizație CDR, data]. Valorile nutriționale sunt estimate pe baza ingredientelor și pot varia. Aplicația nu înlocuiește consultul medical și nu stabilește tratamente. Nu modifica medicația sau dieta prescrisă fără acordul medicului. Contează o alimentație variată și echilibrată și un stil de viață sănătos.”

**Descrierea din magazine:**

- Play: obligatoriu „Această aplicație nu este un dispozitiv medical și nu diagnostichează, nu tratează, nu vindecă și nu previne nicio afecțiune medicală. Consultă un profesionist din domeniul sănătății pentru sfaturi medicale.”
- Apple: aceeași frază, plus reamintirea de a consulta medicul înainte de decizii medicale (1.4.1).

**Unde se afișează:**

1. la onboarding, când se alege obiectivul (o singură dată, cu buton „Am înțeles”);
2. sub fiecare insignă sau obiectiv, ca text scurt sau iconiță „i” cu detalii;
3. în ecranul fiecărei rețete cu mențiune de sănătate (art. 10(2): mesajul despre dietă variată și cantitatea necesară, de ex. „efectul apare la 3 g beta-glucani pe zi; această porție are 1,2 g”);
4. în Setări → „Despre obiectivele de sănătate”;
5. în Termeni și condiții și în descrierea din App Store / Play.

### 6.5 Cum citați sursele în aplicație

- Pentru fiecare obiectiv, o pagină „De unde vin criteriile”, cu: criteriile numerice, sursa cu link (de ex. „Reg. (CE) 1924/2006, anexa – Bogat în fibre: ≥ 6 g/100 g”; „Reg. (UE) 432/2012 – mențiunea despre fier”; avizul EFSA asociat, cu linkul din registrul UE), data ultimei revizuiri și numele dieteticianului.
- Insigna pe rețetă poate avea un „i” care afișează: pragul, valoarea calculată pentru rețetă (de ex. „7,1 g fibre/100 g”) și sursa.
- Surse publice recomandate (de verificat și ales cu dieteticianul):
  - registrul UE de mențiuni: https://ec.europa.eu/food/food-feed-portal/screen/health-claims/eu-register
  - pagina EFSA despre mențiuni: https://www.efsa.europa.eu/en/topics/topic/health-claims
  - valorile de referință EFSA (DRV Finder): https://multimedia.efsa.europa.eu/drvs/index.htm
  - fișa OMS despre sare: https://www.who.int/news-room/fact-sheets/detail/salt-reduction
  - ghidurile ESC (dislipidemii, hipertensiune), ADA Standards of Care (diabet) și NICE CG61 (IBS)

  Aceste surse nu au fost verificate în această cercetare **[INCERT]**. Atenție: un ghid clinic citat lângă o insignă **nu** transformă o mențiune neautorizată în una permisă. Ghidurile susțin **criteriile de filtrare**, nu promisiunile de efect.

- Țineți un **jurnal intern** al versiunilor criteriilor (cine, ce, când), util pentru Apple, Google, ANPC și MS.

### 6.6 Listă de verificare înainte de extindere

- [ ] Opinie de la un avocat (dreptul alimentar UE + protecția consumatorului RO) despre aplicabilitatea 1924/2006 și despre textele finale **[AVOCAT]**.
- [ ] Analiză scurtă de încadrare MDR (avocat sau consultant de reglementare) înainte de orice funcție cu date clinice sau de lansarea obiectivelor diabet/SOP/sarcină/IBS **[AVOCAT]**.
- [ ] Contract cu un dietetician autorizat CDR: criterii, texte, rețete, excluderi de siguranță.
- [ ] Calcul automat al mențiunilor **per 100 g de preparat** și ascunderea insignei când pragul nu e atins. Teste unitare pentru praguri.
- [ ] Copierea formulărilor RO oficiale din Reg. 432/2012 de pe EUR-Lex.
- [ ] Disclaimer în 5 locuri; fraza Google în descrierea Play; Health apps declaration = „Nutrition and Weight Management”.
- [ ] Cont de dezvoltator Apple pe firmă (5.1.1(ix)); abonamentul să nu fie condiționat de consimțământul pentru datele de sănătate (5.1.1(ii)) **[de verificat cu avocat GDPR]**.
- [ ] Marketingul (site, social media, reclame) să folosească același vocabular. Scopul declarat se stabilește și din materialele promoționale (MDR) și sunt evaluate și de ANPC.
