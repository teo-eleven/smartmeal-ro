# SmartMeal RO 🇷🇴

> **Planificator săptămânal de mese și generator de liste inteligente de cumpărături pentru România.**  
> Inspirat de conceptul vizual _Mise_, adaptat 100% pentru piața românească (Lidl, Kaufland, Carrefour, Mega Image, prețuri în LEI/RON, rețete verificate și împărțire pe raioane fizice de supermarket).

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
- **Testare**: Jest, cu babel în două proiecte (logica în Node, componentele cu preset-ul
  React Native). Pragurile de acoperire sunt în `jest.config.js`.
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

Configurația de bază pentru magazine este pregătită în `app.json` și `eas.json`:
- **iOS Bundle Identifier**: `ro.smartmeal.app` (suport iPhone, Privacy Manifests configurate conform politicilor Apple)
- **Android Package**: `ro.smartmeal.app` (adaptive icons, permisiuni și ținte de build)

Pentru pașii de build prin EAS:
```bash
npx eas-cli build --platform android
npx eas-cli build --platform ios
```

Pentru ghidul complet de publicare în Apple App Store și Google Play, consultă [docs/STORE.md](docs/STORE.md).

---

## 📚 Documentație

Toate detaliile tehnice, deciziile arhitecturale și ghidurile de publicare sunt organizate în directorul `docs/`:

* 🏛️ **[docs/DECISIONS.md](docs/DECISIONS.md)** — Architectural Decision Records (ADR-uri detaliate pentru tehnologiile alese, gestionarea stării, persistență și arhetipuri culinare).
* 🛒 **[docs/STORE.md](docs/STORE.md)** — Ghidul pas cu pas pentru lansarea în Apple App Store și Google Play (conturi, pași de verificare, 14 zile test închis Android).
* 📝 **[docs/STORE_LISTING.md](docs/STORE_LISTING.md)** — Textele promoționale, descrierile și cuvintele cheie pregătite pentru formularele magazinelor.
* 🔒 **[docs/PRIVACY.md](docs/PRIVACY.md)** — Politica de confidențialitate și conformitatea GDPR pentru procesarea datelor.
* 🖼️ **[docs/generateBackdrops.md](docs/generateBackdrops.md)** — Instrucțiuni pentru generarea și optimizarea imaginilor de fundal ale rețetelor.

---

## 📂 Structura Proiectului

```
smartmeal-ro/
├── App.tsx                      # Componenta principală cu navigare și dashboard
├── config/                      # Configurație validată și variabile de mediu
├── docs/                        # Documentație de arhitectură, confidențialitate și magazine
├── public/                      # Pagini statice (delete-account, unsubscribe, landing)
├── scripts/                     # Scripturi de mentenanță și verificare migrații
├── src/
│   ├── components/              # Componente UI reutilizabile (MealCard, MacroBar, etc.)
│   ├── data/                    # Catalogul românesc (supermarketuri, ingrediente, rețete)
│   ├── engine/                  # Solver matematic de buget, agregator coș și planificator
│   ├── screens/                 # Ecrane: Onboarding, MealBoard, Grocery, RecipeModal, Auth
│   ├── services/                # Storage local, Supabase Sync și AI Proxy
│   ├── store/                   # Store global Zustand cu auto-persistență
│   ├── styles/                  # Sistemul vizual (Luxury Warm Forest, teme, glass)
│   └── types/                   # Definiții de tipuri TypeScript
├── supabase/
│   ├── functions/               # Supabase Edge Functions (Gemini Flash proxy, email reminders)
│   └── migrations/              # Migrații SQL (tabele utilizator, rate limit, securitate)
└── assets/                      # Iconițe, imagini adaptive și fundaluri rețete
```

---

## 📄 Licență

MIT © 2026 SmartMeal RO.
