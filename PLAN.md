# PLAN.md — Plan de Atac Master: SmartMeal RO

Acest document reprezintă planul unificat și complet de implementare și audit pentru **SmartMeal RO**, combinând specificațiile inițiale de produs, noile funcționalități de autentificare/securitate, cerințele din `Project Comparison Notes.rtf` și deciziile utilizatorului (Răspunsuri 1-A, 2-A,B,C,D, 3-A, 4-A).

> **Notă:** Lansarea în App Store și Google Play este exclusă intenționat din acest plan și rămâne documentată în `STORE.md` pentru o etapă ulterioară.

---

## Principii de Lucru (Conform `Project Comparison Notes.rtf`)
1. **Faci exact ce se cere, nimic în plus.** Fără refactorizări nesolicitate sau cod placeholder (`TODO`).
2. **Totul rulează local.** Fără dependențe exterioare netestate; motorul funcționează 100% offline.
3. **Pași verticali și livrabili:** Fiecare pas lasă aplicația într-o stare care compilează, rulează și trece testele.
4. **Testele primele:** Nicio modificare de logică fără acoperire prin teste automate.
5. **Flux Git protejat:** Branch local de lucru $\rightarrow$ Verificare locală $\rightarrow$ Merge în `dev` $\rightarrow$ Teste pe `dev` $\rightarrow$ Merge în `main`. Niciun commit direct în `dev` sau `main`.
6. **Raportare strict sinceră:** Rezultatele testelor sunt raportate exact așa cum ies, fără înfrumusețare.

---

## Structura Etapelor de Implementare

```
[Etapa 0: Sincronizare Git & dev/main]
                  │
                  v
[Etapa 1: Audit Tehnic & Funcțional Cap-Coadă (2-D)]
                  │
                  v
[Etapa 2: Catalog Culinar, Ingrediente, Prețuri & Imagini (2-A)]
                  │
                  v
[Etapa 3: Rafinare Vizuală & UI/UX Polish (2-B)]
                  │
                  v
[Etapa 4: Funcționalități de Gătit & Cămară (2-C)]
                  │
                  v
[Etapa 5: Motor Hibrid Determinist + AI (3-A)]
                  │
                  v
[Etapa 6: Verificare Finală & Închidere Sesiune]
```

---

## ETAPA 0: Sincronizarea Git și Stabilirea Arhitecturii de Branch-uri (Răspuns 1-A)

- **Obiectiv:** Crearea branch-ului `dev`, unificarea muncii testate de pe `feat/login-screen` în `dev` și `main`, și deschiderea unui branch curat de feature.
- **Pasul 0.1: Creare branch `dev` din `main`.**
- **Pasul 0.2: Merge `feat/login-screen` în `dev`.**
  - Rulare verificări pe `dev`: `npm run typecheck`, `npm run test:sql`, `npm test`.
- **Pasul 0.3: Merge `dev` în `main`.**
  - Asigură că producția (`main`) conține toate cele 14 commit-uri testate (login complet, cod OTP, Face ID, dispozitive, documentație).
- **Pasul 0.4: Creare branch de lucru:** `feat/product-audit-and-expansion` pornind din `dev`.
- **Livrabil:** Branch-urile `main` și `dev` sincronizate, spațiul de lucru comutat pe noul branch de dezvoltare.

---

## ETAPA 1: Audit Tehnic și Funcțional Cap-Coadă (Răspuns 2-D)

- **Obiectiv:** Verificarea completă, de la zero, a fiecărui ecran și mecanism din aplicație pentru a găsi orice bug, regresie sau inconsistență.
- **Pasul 1.1: Audit Flux Principal de Utilizator (Guest & Onboarding):**
  - Pornire curată fără sesiune existentă (`guest`).
  - Parcurgerea wizard-ului în 7 pași (Supermarket $\rightarrow$ Porții $\rightarrow$ Zile $\rightarrow$ Slider Buget $\rightarrow$ Mood-uri $\rightarrow$ Dietă $\rightarrow$ Electrocasnice).
  - Verificare validări: prevenire buget imposibil sub limita minimă sustenabilă (`calculateMinimumViableBudget`).
- **Pasul 1.2: Audit Meal Board & Schimbare Rețete:**
  - Generare plan pe zilele selectate.
  - Deschidere detaliu rețetă (`RecipeDetailModal`): ingrediente scalate, instrucțiuni, calorii și macronutrienți.
  - Schimbare rețetă (`MealSwapModal`): înlocuire manuală și asistată de AI. Verificare că noua rețetă respectă dieta, electrocasnicele și plafonul de cost.
- **Pasul 1.3: Audit Listă de Cumpărături & Cămară:**
  - Agregare pe 7 raioane: Legume & Fructe, Carne & Pește, Lactate, Cămară, Conserve & Sosuri, Panificație, Congelate.
  - Verificare conversie cantitate necesară vs. ambalaje întregi de cumpărat.
  - Comutare „Exclude ingrediente de bază din cămară” și recalculare preț total.
  - Verificare bife interactive și persistență la reîncărcare.
- **Pasul 1.4: Audit Autentificare, Securitate & Sesiune:**
  - Înregistrare cont nou cu nume.
  - Conectare prin cod OTP pe email (simulare locală cu `123456`).
  - Testare poartă reverificare la 30 de zile (`ReauthScreen`) și simulare blocare.
  - Verificare listă dispozitive în ecranul de Cont și revocare sesiune.
- **Pasul 1.5: Centralizare Raport Audit:**
  - Clasificarea problemelor identificate: P0 (Blocant), P1 (Major), P2 (Minor).
  - Rezolvarea imediată a defectelor P0/P1 cu teste dedicate înainte de a trece la Etapa 2.

---

## ETAPA 2: Catalog Culinar, Ingrediente, Prețuri & Imagini (Răspuns 2-A)

- **Obiectiv:** Asigurarea unui catalog culinar bogat, 100% românesc, cu prețuri realiste și imagini consistente.
- **Pasul 2.1: Audit Integritate Bază de Date Rețete:**
  - Verificare ca fiecare rețetă din `src/data/recipes.ts` să aibă ID unic, link-uri valide spre ingrediente din `ingredients.ts`, tag-uri corecte de diete și electrocasnice.
  - Verificare gramaje și valori nutriționale pozitive și realiste.
- **Pasul 2.2: Extindere Rețete Tradiționale & Moderne Românești:**
  - Adăugare de noi rețete accesibile adaptate pieței din România:
    - Mese rapide (< 25 min) pentru zile încărcate.
    - Opțiuni consistente pentru familii și meniuri de weekend.
    - Opțiuni dedicate pentru vegetarieni și vegani (bogate în proteine vegetale).
- **Pasul 2.3: Actualizare Prețuri & Ambalaje Supermarket:**
  - Verificare modele de ambalaje pentru Lidl, Kaufland, Carrefour, Mega Image (`storePriceIndex.ts`, `retailProducts.ts`).
  - Asigurarea că prețurile în RON reflectă realitatea magazinelor și că rotunjirile la ambalaje întregi nu produc anomalii de calcul.
- **Pasul 2.4: Sistemul de Imagini și Vizualuri (`RecipeVisual`):**
  - Verificarea fiecărui fallback vizual și a backdrop-urilor generate.
  - Asigurarea unei afișări atractive, fără imagini lipsă sau erori de randare pe Web și mobil.

---

## ETAPA 3: Rafinare Vizuală & Polish UI/UX (Răspuns 2-B)

- **Obiectiv:** O interfață de utilizare modernă, elegantă, fluidă și conformă cu viziunea estetică a produsului.
- **Pasul 3.1: Consistență Temă & Culori:**
  - Verificare temă (Light, Dark, System) în toate ecranele și componentele modale.
  - Contrast conform normelor de lizibilitate, culori semnal pentru bugete și economii.
- **Pasul 3.2: Cardurile de Mese (`MealCard`):**
  - Rafinarea vizuală a cardurilor de masă pe Meal Board (timp, etichete de mood, cost estimat).
  - Micro-interacțiuni plăcute la apăsare, feedback haptic/vizual.
- **Pasul 3.3: Experiența pe Lista de Cumpărături:**
  - Îmbunătățirea aspectului vizual al rândurilor de ingrediente (`GroceryItemRow`).
  - Animație sau stil subtil de tăiere text la bifare, bară de progres vizuală per raion și total.
- **Pasul 3.4: Responsivitate & Accesibilitate (a11y):**
  - Verificare comportament pe telefoane înguste (360px) și telefoane mari (430px), plus centrare estetică pe ecran de laptop/desktop.
  - Verificare etichete de accesibilitate pentru cititoare de ecran (Screen Readers).

---

## ETAPA 4: Funcționalități Adiționale de Gătit & Cămară (Răspuns 2-C)

- **Obiectiv:** Adăugarea instrumentelor care oferă valoare practică zilnică în bucătărie.
- **Pasul 4.1: Meal Prep & Gestionare Porții Rămase (Leftovers):**
  - Suport clar pentru „Gătește o dată, mănâncă de două ori” (identificarea meselor cu porții duplicate pentru a doua zi).
  - Ghidaj vizual pe Meal Board pentru zilele în care doar se reîncălzește mâncarea.
- **Pasul 4.2: Gestionarea Avansată a Cămării (`PantryInventoryModal`):**
  - Selectarea rapidă a ingredientelor deja prezente în casă (ulei, sare, piper, orez, făină, condimente).
  - Deducerea automată din lista de cumpărături și scăderea costului final.
- **Pasul 4.3: Istoric și Salvare Planuri Favorite (`SavedPlansModal`):**
  - Posibilitatea de a salva un meniu săptămânal reușit și de a-l reîncărca ulterior cu un singur tap.

---

## ETAPA 5: Motorul Hibrid Determinist + AI (Răspuns 3-A)

- **Obiectiv:** Garantarea funcționării optime fără conexiune la internet, dublată de inteligență artificială când e disponibilă.
- **Pasul 5.1: Motorul Determinist Local:**
  - Verificarea algoritmului matematic de încadrare în buget (`plannerEngine.ts`).
  - Garanția că nicio combinație de rețete nu depășește bugetul setat la costul de achiziție la casă.
- **Pasul 5.2: Proxy-ul Gemini Flash cu Fallback Sigur:**
  - Validarea răspunsurilor structurate JSON returnate de model.
  - Refuzul oricărui ID de rețetă care nu există în catalogul local (`RECIPES_MAP`).
  - Fallback instantaneu, silențios și transparent către selecția deterministă locală în caz de eroare de rețea, timeout sau lipsă cheie API.

---

## ETAPA 6: Verificare Finală, Suita de Teste & Închidere Sesiune

- **Obiectiv:** Validarea exhaustivă a întregului sistem conform standardelor de calitate stabilite.
- **Pasul 6.1: Suita Completă de Teste:**
  - Rulare `npm test` (toate cele peste 119 suite de teste).
  - Rulare `npm run test:coverage` (menținerea acoperirii peste pragurile stabilite: >87%).
- **Pasul 6.2: Verificare Statică:**
  - `npm run typecheck`: 0 erori TypeScript.
  - `npm run lint`: 0 avertismente/erori ESLint.
  - `npm run test:sql`: 8/8 migrații valide pe PGlite.
- **Pasul 6.3: Integrare Git Finală:**
  - Merge `feat/product-audit-and-expansion` în `dev`.
  - Verificare pe `dev`.
  - Merge `dev` în `main`.
- **Pasul 6.4: Documentație & Închidere:**
  - Actualizare `HANDOFF.md` și `DECISIONS.md`.
  - Raport final de sesiune (secțiunea 10 din notițe).

---

## Ce este Exclus Explicit (Non-Goals)
- Publicarea pe Apple App Store și Google Play (amânată pentru mai târziu).
- Integrare cu API-uri de livrare supermarket (Bringo, Glovo, Sezamo).
- Scanare de bonuri prin cameră / OCR.
- Monede străine (aplicația este 100% calibrată pe RON și România).
