# SmartMeal RO 🇷🇴

> **Planificator săptămânal de mese și generator de liste inteligente de cumpărături pentru România.**  
> Inspirat de conceptul vizual *Mise*, adaptat 100% pentru piața românească (Lidl, Kaufland, Carrefour, Mega Image, prețuri în LEI/RON, rețete verificate și împărțire pe raioane fizice de supermarket).

---

## 🌟 Caracteristici Principale

1. **Guest-First & Zero Fricțiune**:
   - Poți genera un meniu săptămânal și o listă completă de cumpărături direct, fără a fi obligat să-ți creezi un cont.
   - Datele sunt persistate local prin `@react-native-async-storage/async-storage`.
   - Sincronizare opțională în cloud via Supabase pentru utilizare simultană pe telefon și laptop.

2. **Wizard Interactiv de Onboarding (7 Pași)**:
   - 🏬 **Supermarket preferat**: Lidl, Kaufland, Carrefour, Mega Image.
   - 👥 **Număr de persoane**: 1 - 10 porții cu recalculare dinamică a gramajelor.
   - 📅 **Zile de gătit**: Selectare flexibilă (Luni – Duminică).
   - 💰 **Slider de buget**: Ghidaj dinamic al pragului minim sustenabil (`calculateMinimumViableBudget`).
   - 🏷️ **Mood-uri culinare**: Mese rapide (<25 min), Low Calorie, Favoritele familiei, High Protein etc.
   - 🥗 **Restricții dietetice**: Omnivor, Vegetarian, Vegan, Pescatarian.
   - 🍳 **Electrocasnice disponibile**: Aragaz/Plită, Cuptor, Air Fryer, Cuptor cu microunde.

3. **Planificator Săptămânal & Schimb Inteligent (Meal Board & Swap)**:
   - Sumar financiar: Buget țintă vs. Cost rețete vs. Cost total la casă (ambalaje întregi).
   - Detaliu complet rețetă: Valori nutriționale (kcal, proteine, carbohidrați, grăsimi), ingrediente scalate, instrucțiuni pas cu pas și notițe personale.
   - Schimb inteligent de mese (**AI Smart Swap**): Posibilitate de schimbare instantanee manuală sau asistată de **Google Gemini Flash** cu justificare culinară în limba română.

4. **Listă de Cumpărături Agregată pe Raioane Reale (Grocery Checklist)**:
   - Calculează cantitatea exactă necesară vs. pachete întregi de cumpărat din magazin (ex: Ai nevoie de 100g mazăre $\rightarrow$ Cumperi 1 pachet de 500g).
   - Împărțire pe 7 raioane fizice: Legume & Fructe, Carne & Pește, Lactate, Cămară & Mirodenii, Conserve & Sosuri, Panificație, Congelate.
   - Bife interactive cu tăiere text și contor de progres în timp real.
   - Comutator „Exclude ingrediente de bază din cămară” (deduce sarea, uleiul, făina și condimentele uzuale din costul coșului).

---

## 🛠️ Tehnologii Folosite

- **Framework**: Expo SDK 52 / React Native (TypeScript)
- **Web Runtime**: React Native for Web (`expo start --web --port 8081`)
- **State Management**: Zustand v5 cu persistență offline hibridă
- **Storage**: `@react-native-async-storage/async-storage`
- **Backend & Cloud Sync**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Engine**: Google Gemini Flash (Structured JSON via Supabase Edge Function sau API Proxy)
- **Testare**: Jest + `ts-jest` (100% teste unitare și de integrare end-to-end)
- **Linting & Stil**: ESLint + Prettier + TypeScript strict mode

---

## 🚀 Rulare și Dezvoltare Locală

### 1. Instalare dependențe
```bash
npm install
```

### 2. Configurare variabile de mediu
Copiază fișierul `.env.example` în `.env`:
```bash
cp .env.example .env
```
Configurația de bază funcționează complet offline chiar și fără chei externe. Opțional, poți adăuga:
- `EXPO_PUBLIC_GEMINI_API_KEY`: Cheia Google Gemini pentru sugestii AI.
- `EXPO_PUBLIC_SUPABASE_URL` și `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Pentru sincronizare cloud.

### 3. Pornire aplicație Web (Port 8081)
```bash
npm run web
```
Aplicația se va deschide pe: `http://localhost:8081`.

### 4. Rulare Teste Automate
```bash
npm test                 # toate testele (logică + componente)
npm run test:components  # doar testele de componente
npm run test:coverage    # cu raport de acoperire (praguri în jest.config.js: 83/83/84/62)
```

Testele rulează în două proiecte Jest: logica (motor, store, date) în Node, iar componentele
cu preset-ul `react-native`, care are nevoie de resolverul propriu pentru modulele specifice
platformei.

### 5. Verificare TypeScript și Linting
```bash
npm run lint
npm run typecheck
```

---

## 📱 Export pentru iOS & Android

**Aplicația nu poate fi încă trimisă în magazine.** Identificatorii de pachet există:
- **iOS Bundle Identifier**: `ro.smartmeal.app`
- **Android Package**: `ro.smartmeal.app`

Dar lipsesc fișiere obligatorii, iar `eas build` nu are ce citi fără ele:

| Lipsește | De ce e obligatoriu |
| --- | --- |
| `assets/icon.png` (1024×1024) | fără el se livrează iconița implicită Expo |
| `assets/splash.png` | ecranul de pornire |
| `assets/adaptive-icon.png` | cerut de Android |
| `eas.json` | `eas build` nu pornește fără profiluri |
| `ios.buildNumber`, `android.versionCode` | cerute la fiecare urcare |
| politică de confidențialitate (URL public) | cerută de ambele magazine |
| `ios.privacyManifests` | cerut de Apple din mai 2024 pentru AsyncStorage |

După ce există toate, comenzile sunt:
```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

Migrația `supabase/migrations/0001_user_meal_plans.sql` și funcțiile edge
(`proxy-gemini-plan`, `delete-account`) trebuie publicate înainte de orice build cu cloud
activ — vezi `supabase/README.md`.

---

## 📂 Structura Proiectului

```
smartmeal-ro/
├── App.tsx                      # Componenta principală cu navigare și dashboard
├── config/                      # Configurație validată și variabile de mediu
├── src/
│   ├── components/              # Componente UI reutilizabile (MealCard, MacroBar, etc.)
│   ├── data/                    # Catalogul românesc (supermarketuri, ingrediente, rețete)
│   ├── engine/                  # Solver matematic de buget, agregator coș și planificator
│   ├── screens/                 # Ecrane: Onboarding, MealBoard, Grocery, RecipeModal, Auth
│   ├── services/                # Storage local, Supabase Sync și AI Proxy
│   ├── store/                   # Store global Zustand cu auto-persistență
│   └── types/                   # Definiții de tipuri TypeScript
├── supabase/
│   └── functions/               # Supabase Edge Function proxy pentru Gemini Flash
└── __tests__/                   # Teste de integrare end-to-end
```

---

## 📄 Licență
MIT © 2026 SmartMeal RO.
