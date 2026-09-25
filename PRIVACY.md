# Politica de confidențialitate — SmartMeal RO

**Ultima actualizare:** 25 septembrie 2026
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

- preferințele alimentare: **dieta, alergiile declarate**, aparatele de bucătărie, numărul de
  persoane, bugetul, magazinul preferat
- planul săptămânal generat și lista de cumpărături
- ce ai marcat că ai deja în cămară, ce rețete ți-au plăcut și pe care nu vrei să le mai vezi
- preferința de temă (luminoasă / întunecată)

Acestea sunt stocate local. Le poți șterge oricând din aplicație, prin „Reia configuratorul".

### În cloud, **numai dacă îți faci cont**

- **adresa de email**, pentru autentificare și, dacă o ceri, pentru mementouri
- planul, lista de cumpărături și preferințele de mai sus, ca să le regăsești pe alt telefon
- alegerea ta privind mementourile: dacă le vrei, la ce oră, și la câte zile pe email

Parola nu ne este niciodată vizibilă: autentificarea e gestionată de Supabase, care stochează
doar o amprentă criptografică a ei.

### Date privind sănătatea

**Alergiile și restricțiile alimentare declarate sunt date privind sănătatea**, categorie
specială conform art. 9 GDPR. Le prelucrăm exclusiv ca să nu-ți propunem mâncare pe care nu o
poți mânca, **pe baza consimțământului tău explicit**, exprimat prin introducerea lor în
aplicație. Nu sunt folosite în niciun alt scop și nu sunt transmise nimănui în scop comercial.

## Ce NU colectăm

Locație. Contacte. Cameră sau microfon. Identificatori de publicitate. Istoric de navigare.
Date de plată. Aplicația cere o singură permisiune Android: accesul la internet.

## Cui transmitem date

| Cui | Ce | De ce |
| --- | --- | --- |
| **Supabase** (găzduire UE) | email, plan, preferințe | doar dacă ai cont; stocare și autentificare |
| **Google Gemini** | id-uri de rețete și preferințele planului, **fără email și fără date de identificare** | doar când apeși explicit „Întreabă AI" pentru o sugestie de înlocuire |
| **Resend** (livrare de email) | adresa de email și conținutul mementoului | doar dacă ai pornit mementourile pe email |

Cererea către Gemini pleacă de pe serverul nostru, nu de pe telefonul tău, și nu conține
adresa ta de email sau vreun identificator al contului.

Mementourile de pe telefon sunt programate **local**, pe dispozitiv: nu colectăm niciun token
de notificare și nu trece nimic prin serverele noastre pentru ele. Mementourile pe email sunt
oprite din start; se trimit numai după ce le pornești tu, se opresc din același loc, iar
fiecare email spune unde se opresc.

## Cât păstrăm datele

Local: până le ștergi tu sau dezinstalezi aplicația.
În cloud: până îți ștergi contul. Planul se șterge automat odată cu el.

## Drepturile tale

Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție și portabilitate.

- **Ștergerea contului și a datelor** se face direct din aplicație: ecranul de cont →
  „Șterge contul și datele mele". Ștergerea e definitivă și imediată.
- Pentru orice altceva, scrie-ne la *[completează adresa de email]*. Răspundem în cel mult
  30 de zile.
- Poți depune plângere la **ANSPDCP** (Autoritatea Națională de Supraveghere a Prelucrării
  Datelor cu Caracter Personal), www.dataprotection.ro.

## Copii

Aplicația nu se adresează copiilor sub 16 ani și nu colectăm cu bună știință datele lor.

## Securitate

Toate comunicațiile folosesc HTTPS. Datele din cloud sunt izolate pe utilizator prin
row-level security: fiecare cont poate citi și scrie exclusiv propriile date. Token-urile de
autentificare se păstrează în seiful sistemului de operare (Keychain pe iOS, Keystore pe
Android), nu în fișiere obișnuite.

Niciun sistem nu e perfect sigur. Dacă descoperi o problemă de securitate, scrie-ne la
*[completează adresa de email]* înainte s-o faci publică.

## Modificări

Dacă schimbăm ceva important, actualizăm data de sus și te anunțăm în aplicație.
