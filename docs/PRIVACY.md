# Politica de confidențialitate — SmartMeal RO

**Ultima actualizare:** 17 noiembrie 2026 (versiunea `2026-11-17`)
**Operator:** *[completează: nume / firmă, adresă, email de contact]*

Aceasta este o primă variantă, scrisă pe ce face aplicația azi. **Citește-o și
completează câmpurile marcate înainte s-o publici** — răspunderea legală e a operatorului,
nu a documentului.

---

## Pe scurt

SmartMeal RO îți planifică mesele săptămânii și îți face lista de cumpărături. Funcționează
**integral fără cont**. Dacă nu te autentifici, nimic din ce introduci nu părăsește telefonul.

Nu folosim reclame. Nu folosim analitice. Nu urmărim comportamentul tău. Nu vindem și nu
transmitem date către brokeri sau agenții de publicitate.

## Ce date prelucrăm

### Pe dispozitivul tău, întotdeauna

- preferințele alimentare: **dieta, alergiile declarate, obiectivele de sănătate alese**,
  aparatele de bucătărie, numărul de
  persoane, bugetul, magazinul preferat
- planul săptămânal generat și lista de cumpărături
- ce ai marcat că ai deja în cămară, ce rețete ți-au plăcut și pe care nu vrei să le mai vezi
- preferința de temă (luminoasă / întunecată)

Acestea sunt stocate local. Le poți șterge oricând din aplicație, prin „Reia configuratorul".

Tot pe dispozitiv, separat de preferințe și fără să ajungă vreodată în cloud, păstrăm câteva
semne tehnice: răspunsul la întrebarea de siguranță (mai jos), faptul că ai văzut mesajul
despre obiectivele de sănătate de pe iPhone (un simplu „văzut", fără alte date) și, dacă ai
ales „Nu, doar pe acest dispozitiv" la sincronizarea obiectivelor, lista obiectivelor pentru
care ai ales asta, ca să nu te întrebăm de două ori.

- **Pe web**, datele de pe dispozitiv, inclusiv răspunsul la întrebarea de siguranță, stau în
  `localStorage`-ul browserului. Nu sunt criptate; oricine are acces la browserul tău le poate
  citi. Pe telefon sunt în spațiul de stocare al aplicației.
- **Dacă sesiunea ta expiră**, răspunsul și datele locale rămân pe telefon până se conectează
  alt cont; atunci sunt șterse, ca să nu ajungă la altcineva. Dacă te deconectezi tu, sunt
  șterse imediat.

### În cloud, **numai dacă îți faci cont**

- **adresa de email**, pentru autentificare și, dacă o ceri, pentru mementouri
- planul, lista de cumpărături și preferințele de mai sus, ca să le regăsești pe alt telefon
- alegerea ta privind mementourile: dacă le vrei, la ce oră, și la câte zile pe email
- **numele** pe care ni-l dai la crearea contului, ca să te salutăm; îl poți schimba din Cont
- **lista dispozitivelor** conectate la cont: un identificator aleator al instalării, tipul (iPhone, Android, browser) și când a fost folosit ultima dată, ca să poți deconecta un dispozitiv din Cont → Dispozitive

Parola nu ne este niciodată vizibilă: autentificarea e gestionată de Supabase, care stochează
doar o amprentă criptografică a ei.

### Date privind sănătatea

**Alergiile și restricțiile alimentare declarate sunt date privind sănătatea**, categorie
specială conform art. 9 GDPR. Le prelucrăm exclusiv ca să nu-ți propunem mâncare pe care nu o
poți mânca. Nu sunt folosite în niciun alt scop și nu sunt transmise nimănui în scop
comercial.

- **Fără cont**, rămân doar pe telefonul tău și nu ajung niciodată la noi.
- **Cu cont**, le păstrăm pe baza **consimțământului tău explicit**, pe care îl dai bifând
  căsuța dedicată la crearea contului. Împreună cu contul păstrăm data acordului și
  versiunea acestei politici pe care ai acceptat-o.
- Îți retragi acordul ștergând contul, din același ecran, oricând.

**Obiectivele de sănătate alese** (de exemplu „Atent la zaharuri”) sunt și ele date privind
sănătatea, pentru că pot arăta o afecțiune. Le folosim doar ca să alegem rețete potrivite
obiectivului tău, nu în alt scop.

- **Fără cont**, rămân doar pe telefonul tău.
- **Cu cont**, se sincronizează în cloud, împreună cu preferințele tale, **numai dacă ai
  acceptat asta**. Contul păstrează ce text ai văzut la creare: la Android și pe web căsuța
  acoperă „alergiile, dieta și obiectivele mele de sănătate”, iar pe iPhone, unde obiectivele
  nu sunt disponibile, doar „alergiile și dieta mea”. Dacă acordul din cont nu include
  obiectivele, aplicația te întreabă **o singură dată**, înainte de prima trimitere a unui
  obiectiv, dacă să le sincronizeze. „Da, sincronizează” se înregistrează în cont, cu data și
  versiunea acestei politici. „Nu, doar pe acest dispozitiv” înseamnă că preferințele se
  sincronizează fără obiective, iar obiectivele rămân pe telefon; nu te mai întrebăm decât
  dacă bifezi un obiectiv nou.
- **Pe iPhone**, obiectivele de sănătate din cont nu sunt încărcate pe telefon, nu sunt
  afișate și nu sunt niciodată modificate: când salvezi de pe iPhone, obiectivele salvate de
  pe alt dispozitiv rămân în cont exact cum erau. „Fără carne de porc” nu e obiectiv de
  sănătate și se sincronizează normal.
- Regula e aplicată și de server: un cont al cărui acord nu include obiectivele nu poate
  păstra obiective în cloud, indiferent de aplicația care le trimite.

**Întrebarea de siguranță.** Înainte de primul obiectiv de sănătate, aplicația te întreabă o
dată, cu da sau nu, dacă ești însărcinată sau alăptezi, ai boală de rinichi, iei insulină,
sulfoniluree, anticoagulante sau antidepresive IMAO, ori ai sau ai avut o tulburare de
alimentație. Dacă răspunzi „Da”, cele cinci obiective de sănătate sunt blocate.

- Răspunsul rămâne **doar pe telefonul tău**, separat de preferințe. Nu se sincronizează în
  cloud și nu apare în exportul de date.
- Îl ștergi cu „Reia Configuratorul Complet (de la zero)”. Dacă ai răspuns „Da” din greșeală,
  apasă „Am răspuns greșit”.

### Obiectivele de sănătate nu sunt sfat medical

Obiectivele din aplicație (de exemplu „Atent la zaharuri”, „Grăsimi bune, puțină sare”) descriu
ce este în farfurie, nu efectul asupra unei afecțiuni. În aplicație, textul de mai jos se
deschide din Filtre → „Despre obiectivele de sănătate”.

> SmartMeal oferă planificare de mese și informații nutriționale pentru un stil de viață sănătos. Criteriile fiecărui obiectiv se bazează pe surse publice (de exemplu avizele EFSA și regulamentele UE privind mențiunile nutriționale și de sănătate). Valorile nutriționale sunt estimate pe baza ingredientelor și pot varia. Aplicația nu înlocuiește consultul medical și nu stabilește tratamente. Nu modifica medicația sau dieta prescrisă fără acordul medicului. Contează o alimentație variată și echilibrată și un stil de viață sănătos. În caz de urgență sună la 112.

## Ce NU colectăm

Locație. Contacte. Cameră sau microfon. Identificatori de publicitate. Istoric de navigare.
Date de plată. Aplicația cere o singură permisiune Android: accesul la internet.

## Cui transmitem date

| Cui | Ce | De ce |
| --- | --- | --- |
| **Supabase** (găzduire UE) | email, plan, preferințe | doar dacă ai cont; stocare și autentificare |
| **Anthropic** (Claude) | id-uri de rețete (rețeta de înlocuit și lista rețetelor candidate), preferințele planului și, dacă o scrii, dorința ta pentru înlocuire, **fără email și fără date de identificare** | doar când apeși explicit „Întreabă AI" pentru o sugestie de înlocuire |
| **Resend** (livrare de email) | adresa de email și conținutul mementoului | doar dacă ai pornit mementourile pe email |

Cererea către Anthropic pleacă de pe serverul nostru, nu de pe telefonul tău, și nu conține
adresa ta de email sau vreun identificator al contului.

Mementourile de pe telefon sunt programate **local**, pe dispozitiv: nu colectăm niciun token
de notificare și nu trece nimic prin serverele noastre pentru ele. Mementourile pe email sunt
oprite din start și se trimit numai după ce le pornești tu. Fiecare email are un link de
dezabonare care le oprește dintr-o apăsare, fără să intri în aplicație, iar clientul tău de
email îți arată și propriul buton „Dezabonare".

## Cât păstrăm datele

Local: până le ștergi tu sau dezinstalezi aplicația.
În cloud: până îți ștergi contul. Planul, numele și lista dispozitivelor se șterg automat odată cu el.

## Drepturile tale

Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție și portabilitate.

- **Ștergerea contului și a datelor** se face direct din aplicație: ecranul de cont →
  „Șterge contul și datele mele". Ștergerea e definitivă și imediată.
- **O copie a datelor tale** (acces și portabilitate) o descarci direct din aplicație:
  ecranul de cont → „Descarcă datele mele". Primești un fișier JSON în care e separat ce
  păstrăm noi în cont de ce există doar pe telefonul tău.
- Pentru orice altceva, scrie-ne la *[completează adresa de email]*. Răspundem în cel mult
  30 de zile.
- Poți depune plângere la **ANSPDCP** (Autoritatea Națională de Supraveghere a Prelucrării
  Datelor cu Caracter Personal), www.dataprotection.ro.

## Copii

Contul se poate crea doar după ce confirmi că ai cel puțin 16 ani, vârsta de la care, în
România, îți poți da singur acordul pentru prelucrarea datelor (art. 8 GDPR). Confirmarea e o
declarație, nu o verificare a actelor. Dacă aflăm că un cont aparține cuiva sub 16 ani, îl
ștergem.

## Securitate

Toate comunicațiile folosesc HTTPS. Datele din cloud sunt izolate pe utilizator prin
row-level security: fiecare cont poate citi și scrie exclusiv propriile date. Token-urile de
autentificare se păstrează în seiful sistemului de operare (Keychain pe iOS, Keystore pe
Android), nu în fișiere obișnuite.

Niciun sistem nu e perfect sigur. Dacă descoperi o problemă de securitate, scrie-ne la
*[completează adresa de email]* înainte s-o faci publică.

## Modificări

Dacă schimbăm ceva important, actualizăm data și versiunea de sus și le scriem pe email
celor care au cont, înainte ca schimbarea să se aplice.
