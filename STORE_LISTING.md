# Textele listării — App Store și Google Play

Gata de copiat. Limitele de caractere sunt numărate. Tot ce scrie aici descrie ce face codul
azi; dacă scoți sau adaugi o funcție, schimbă și textul, fiindcă o descriere care promite ce
nu există e motiv de respingere (Apple 2.3.1, Google „Misleading Claims").

---

## App Store

| Câmp                   | Text                                            | Limită  |
| ---------------------- | ----------------------------------------------- | ------- |
| **Name**               | SmartMeal RO                                    | 12 / 30 |
| **Subtitle**           | Meniul săptămânii, în buget                     | 27 / 30 |
| **Primary category**   | Food & Drink                                    |         |
| **Secondary category** | Lifestyle                                       |         |
| **Support URL**        | _[obligatoriu — o pagină cu adresa de contact]_ |         |
| **Privacy Policy URL** | _[URL-ul la care publici `PRIVACY.md`]_         |         |

**Keywords** (97 / 100). Fără spațiu după virgulă, fiindcă spațiile se numără:

```
planificator,retete,lista cumparaturi,mancare,gatit,alergii,vegan,economie,supermarket,cina,pranz
```

Nu pune aici **niciun nume de lanț** (Lidl, Kaufland…) și nici „meniu" sau „buget". Primele
sunt mărci ale altora, iar Apple respinge cuvintele-cheie cu mărci străine (2.3.7). Celelalte
sunt deja în nume și subtitlu, iar Apple le indexează de acolo, deci ar fi locuri irosite.

**Promotional text** (142 / 170). Se poate schimba oricând, fără review:

```
Spune-ne câți sunteți, ce buget ai și ce nu mănânci. Primești meniul săptămânii și lista de cumpărături, cu prețuri estimate la magazinul tău.
```

---

## Google Play

| Câmp                  | Text                                                       | Limită  |
| --------------------- | ---------------------------------------------------------- | ------- |
| **App name**          | SmartMeal RO: meniu și buget                               | 28 / 30 |
| **Short description** | Meniul săptămânii și lista de cumpărături, în bugetul tău. | 58 / 80 |
| **Category**          | Food & Drink                                               |         |
| **Contact email**     | _[obligatoriu, public]_                                    |         |
| **Privacy policy**    | _[același URL ca la Apple]_                                |         |

Google interzice în nume emoji, MAJUSCULE de efect și cuvinte precum „cel mai bun", „nr. 1"
sau „gratis". Numele de mai sus nu are niciuna.

---

## Descrierea completă (aceeași pe ambele, sub 4000 de caractere)

```
Ce gătim săptămâna asta, și cât ne costă?

SmartMeal RO îți face meniul pe o săptămână și lista de cumpărături care îi corespunde, la magazinul unde mergi de obicei. Spui câți sunteți, în ce zile gătești, ce buget ai și ce nu mănânci — restul e treaba aplicației.

CE PRIMEȘTI
• Un meniu pe zilele în care gătești: mic dejun, prânz, cină, gustare sau desert, după ce alegi
• Lista de cumpărături adunată din tot meniul, grupată pe raioane, cu cantitățile rotunjite la ambalajele reale
• Un cost estimat pentru toată săptămâna, ca să știi înainte de magazin dacă te încadrezi
• Comparația aceluiași coș între lanțuri, ca să vezi unde iese mai ieftin

DUPĂ CUM TRĂIEȘTI TU
• Diete: omnivor, vegetarian, vegan, pescetarian, fără gluten sau keto
• Alergii: excluzi rețetele care conțin alergenii pe care îi eviți
• Aparatele din bucătărie: dacă n-ai cuptor, nu primești rețete la cuptor
• Nu-ți place un fel? Îl schimbi cu altul, iar lista se actualizează singură
• Gătești dublu și mănânci a doua zi, iar porția de a doua zi nu se mai cumpără încă o dată

MAI PUȚINĂ RISIPĂ
• Bifezi ce ai deja în cămară, iar produsele acelea ies din coș
• Vezi ce rămâne din fiecare pachet după săptămâna respectivă

ORGANIZARE
• Modul de cumpărături: bifezi pe măsură ce pui în coș
• Trimiți lista cuiva sau o copiezi
• Salvezi meniurile care ți-au plăcut
• Mementouri pentru zilele de gătit și pentru ziua de cumpărături

CONTUL
Îți poți face cont ca să-ți regăsești meniul pe alt telefon. Contul se șterge oricând, din aplicație, împreună cu toate datele lui.

MAGAZINE
Lidl, Kaufland, Carrefour, Mega Image, Auchan, Penny, Profi și Sezamo.

DE ȘTIUT
Prețurile sunt estimative, calculate din prețuri obișnuite la raft. Nu sunt prețuri în timp real și nu includ promoțiile de moment, așa că la casă suma poate diferi.
Filtrul de alergeni lucrează pe rețetele din aplicație. Verifică întotdeauna eticheta produsului: rețetele diferă între mărci, iar urmele („poate conține") nu apar în ele. Aplicația nu înlocuiește sfatul medicului.
SmartMeal RO nu este afiliată cu niciunul dintre lanțurile de magazine menționate. Numele lor apar doar ca să știi pentru ce magazin e calculat coșul.
```

### Ce verifici înainte să lipești descrierea

- [ ] **Mementourile pe email** nu apar în descriere, și e intenționat: nu trimit nimic până
      nu faci `STORE.md` §1b. Adaugă un rând abia după ce primul email a plecat efectiv.
- [ ] **Sugestiile AI** („Întreabă AI") lipsesc tot intenționat. Funcționează doar cu cheia
      Gemini configurată pe server, iar dacă nu merge la review, un rând care o promite e
      motiv de respingere.
- [ ] **Băuturile.** Descrierea nu pomenește secțiunea de alcool. Dacă o păstrezi (`STORE.md`
      §8), nu o scoate în evidență nici aici, nici în capturi.
- [x] Dietele (6) și mesele (5) sunt copiate din `src/types/index.ts`, nu din memorie. Dacă
      adaugi una în cod, adaug-o și aici.

---

## „What's New" pentru prima versiune

```
Prima versiune. Meniul săptămânii, lista de cumpărături și costul estimat, pentru 8 lanțuri de magazine din România.
```
