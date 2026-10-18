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

## ETAPA 0: Sincronizarea Git și Stabilirea Arhitecturii de Branch-uri (Răspuns 1-A) — ✅ FINALIZATĂ

- **Obiectiv:** Crearea branch-ului `dev`, unificarea muncii testate de pe `feat/login-screen` în `dev` și `main`, și deschiderea unui branch curat de feature.
- **Status:** `dev` creat, `feat/login-screen` integrat, `main` sincronizat, `feat/product-audit-and-expansion` creat și activat.

---

## ETAPA 1: Audit Tehnic și Funcțional Cap-Coadă (Răspuns 2-D) — ✅ FINALIZATĂ

- **Obiectiv:** Verificarea completă, de la zero, a fiecărui ecran și mecanism din aplicație pentru a găsi orice bug, regresie sau inconsistență.
- **Status:** Audit complet executat pe 9 ecrane de onboarding, meal board, 7 raioane, 8 supermarketuri, auth/reauth. Defecte P1 (timer warnings și listener demontat) corectate și testate (commit `e0fff0e`).

---

## ETAPA 2: Catalog Culinar, Ingrediente, Prețuri & Imagini (Răspuns 2-A) — ✅ FINALIZATĂ

- **Obiectiv:** Asigurarea unui catalog culinar bogat, 100% românesc, cu prețuri realiste și imagini consistente.
- **Status:** 4 ingrediente noi (`fasole_verde_congelata`, `ficatei_pui_proaspeti`, `linte_verde_uscata`, `tofu_clasic`) adăugate cu prețuri RON verificate în toate cele 8 supermarketuri. 15 rețete românești extinse create modular în `extendedRecipes.ts` și legate în `recipes.ts`. 100% reguli de onestitate a aparatelor și zero ingrediente orfane respectate (commit `50ac347`).

---

## ETAPA 3: Rafinare Vizuală & Polish UI/UX (Răspuns 2-B) — ✅ FINALIZATĂ

- **Obiectiv:** O interfață de utilizare modernă, elegantă, fluidă și conformă cu viziunea estetică a produsului.
- **Status:** Toate cele 3 priorități executate pe rând conform deciziei utilizatorului:
  1. Carduri `MealCard`: floating badges cu efect de sticlă, target tactil stepper porții WCAG (min 32x32px), indicator vizual Meal Prep smarald.
  2. Listă de cumpărături `GroceryAisleSection` & `GroceryItemRow`: bare de progres colorate per raion, tăiere animată și text estompat la bifare.
  3. Temă & a11y: contrast mărit în modul Light (`textMuted: #6c6c70`, raport >4.5:1), 100% componente interactive cu rol de accesibilitate (commit `cde661e`).

---

## ETAPA 4: Funcționalități Adiționale de Gătit & Cămară (Răspuns 2-C) — ✅ FINALIZATĂ

- **Obiectiv:** Adăugarea instrumentelor care oferă valoare practică zilnică în bucătărie.
- **Status:** Validate și acoperite cu teste: `MealPrepModal` (ghid de batch cooking în 4 faze), `PantryInventoryModal` (deducere automată din cămară 0 lei la casă), `SavedPlansModal` (salvare/restaurare planuri).

---

## ETAPA 5: Motorul Hibrid Determinist + AI (Răspuns 3-A) — ✅ FINALIZATĂ

- **Obiectiv:** Garantarea funcționării optime fără conexiune la internet, dublată de inteligență artificială când e disponibilă.
- **Status:** `plannerEngine.ts` garantează generare locală 100% offline încadrată matematic în buget. `aiProxy.ts` interoghează Edge Function fără expunere de chei și recurge silențios la motorul determinist în caz de timeout, eroare sau absență internet.

---

## ETAPA 6: Verificare Finală, Suita de Teste & Închidere Sesiune — ✅ FINALIZATĂ

- **Obiectiv:** Validarea exhaustivă a întregului sistem conform standardelor de calitate stabilite.
- **Pasul 6.1: Suita Completă de Teste:**
  - `npm test`: 119 suite trecute din 119, 1169 teste verzi (100% PASS).
- **Pasul 6.2: Verificare Statică:**
  - `npm run typecheck`: 0 erori TypeScript.
  - `npm run lint`: 0 avertismente ESLint.
  - `npm run test:sql`: 8/8 migrații valide pe PGlite.
- **Pasul 6.3: Integrare Git Finală:**
  - Merge `feat/product-audit-and-expansion` în `dev` finalizat (fast-forward).
  - Toate testele verificate și validate pe `dev`.
  - Merge `dev` în `main` finalizat (fast-forward).
- **Pasul 6.4: Documentație & Închidere:**
  - Actualizat `HANDOFF.md` și `PLAN.md`.
  - Raport final de sesiune (secțiunea 10 din notițe).

---

## Ce este Exclus Explicit (Non-Goals)
- Publicarea pe Apple App Store și Google Play (amânată pentru mai târziu).
- Integrare cu API-uri de livrare supermarket (Bringo, Glovo, Sezamo).
- Scanare de bonuri prin cameră / OCR.
- Monede străine (aplicația este 100% calibrată pe RON și România).
