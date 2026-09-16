# DECISIONS.md — Architecture & Technical Decision Records

This document records the foundational architectural decisions for Mise Romania. Each record details the context, evaluated alternatives, selected solution, rationale, accepted trade-offs, and falsification conditions.

---

## ADR-01: Multi-Platform Client Framework (Web $\rightarrow$ Mobile App Store / Google Play)

### Context
The project must launch first as a responsive Web Application, with the explicit requirement to release on Apple App Store and Google Play Store soon after without rewriting the frontend.

### Options Evaluated
1. **Expo / React Native (React Native for Web) [CHOSEN]**
   - *Pros:* Single codebase in TypeScript. True native rendering on iOS/Android and clean responsive HTML/DOM on Web. Expo Router provides modern file-based routing. Zero code rewrite needed when generating App Store/Play Store binaries via EAS Build.
   - *Cons:* Slightly heavier initial web bundle compared to raw Next.js; some CSS web quirks require platform-agnostic styling (e.g. flexbox only).
   - *Long-term issues:* Third-party web-only libraries occasionally require native wrappers or conditional code.
2. **Next.js (React) + Capacitor / Cordova**
   - *Pros:* Excellent desktop web performance, fast SSR/SSG.
   - *Cons:* On mobile devices, runs as a WebView (embedded browser), leading to sluggish touch interactions, non-native scrolling physics, and potential App Store rejection risks for simple web-wrapper apps.
   - *Long-term issues:* Clunky native device integration (haptics, background sync, offline caches).
3. **Flutter (Dart)**
   - *Pros:* Consistent UI across web and mobile, strong performance.
   - *Cons:* Heavy web payload (CanvasKit / Wasm), poorer web SEO and text-rendering performance, requires switching the stack to Dart instead of TypeScript.
   - *Long-term issues:* Harder to hire or migrate compared to the TypeScript/React ecosystem.

### Decision & Recommendation
**Choose Expo / React Native with TypeScript.**
*Core Reason:* It is the only modern framework that delivers true native mobile performance for iOS/Android while running seamlessly in modern web browsers from a single TypeScript repository.

### Falsification Condition
*What would make this decision wrong:* If our primary audience exclusively visited the app via desktop search engines requiring intensive server-side SEO rendering, or if we had a large pre-existing team of Dart/Flutter engineers.

---

## ADR-02: Styling and Design System

### Context
We need a modern, sleek UI matching the mobile aesthetic shown in the inspiration video (smooth rounded corners, badge tags, clean sliders, cheerful food imagery) that works identically on Web, iOS, and Android.

### Options Evaluated
1. **NativeWind v4 (Tailwind CSS for React Native) [CHOSEN]**
   - *Pros:* Standard utility classes (`rounded-2xl`, `bg-emerald-500`, `p-4`), compile-time optimization, zero runtime overhead on web, familiar to modern web developers.
   - *Cons:* Requires proper setup with Babel/Metro and Tailwind configuration.
   - *Long-term issues:* Must adhere to React Native supported styles (no CSS grid or arbitrary pseudo-selectors on native).
2. **StyleSheet.create (Pure React Native Styles)**
   - *Pros:* Zero external dependencies, built into core React Native.
   - *Cons:* Highly verbose, slower development velocity, no shared utility tokens.
   - *Long-term issues:* Maintenance bloat across tens of screen components.
3. **Tamagui or Gluestack UI**
   - *Pros:* Pre-styled accessible components.
   - *Cons:* Steep learning curve, frequent breaking changes, heavier setup.

### Decision & Recommendation
**Choose NativeWind v4 (Tailwind CSS) with Lucide Icons.**
*Core Reason:* Delivers maximum UI development velocity using industry-standard Tailwind classes across Web, iOS, and Android.

### Falsification Condition
*What would make this decision wrong:* If React Native styling performance on low-end Android devices suffered from Tailwind class compilation (NativeWind v4 compiles to native styles at build time, preventing this).

---

## ADR-03: AI Engine & Meal Generation Strategy

### Context
The app needs to suggest weekly meal plans fitting strict budgets, dietary restrictions, and kitchen appliances, as well as support an intelligent "Swap meal" function without wild nutritional/grammage hallucinations.

### Options Evaluated
1. **Hybrid: Structured Recipe DB + Google Gemini Flash via Serverless Proxy [CHOSEN]**
   - *Pros:* Recipes, ingredients, steps, and base macros are grounded in verified data. Gemini Flash is used for high-speed (<1.5s), cost-effective constraint satisfaction, intelligent swaps, and natural language tweaks. Gemini offers an extremely generous free/low-cost tier and native structured JSON output (`response_schema`).
   - *Cons:* Requires managing seed recipe records and proxying requests through a serverless function.
   - *Long-term issues:* Need to expand the database over time to maintain recipe novelty.
2. **100% Generative LLM (Pure Prompt Generation)**
   - *Pros:* Zero database to curate; infinite recipe variety.
   - *Cons:* High risk of hallucinations (e.g., cooking raw chicken in 5 minutes, nonsensical grocery weights, impossible price estimates), higher latency (5-10s per plan), and continuous API costs.
   - *Long-term issues:* User frustration when grocery lists don't match store packages.
3. **Pure Hardcoded Heuristics (Zero AI)**
   - *Pros:* Zero API costs, instant execution, works 100% offline.
   - *Cons:* Static, repetitive meal plans, robotic swaps, unable to handle nuanced user requests (e.g. "I want something spicier for dinner").
   - *Long-term issues:* Feels like a static spreadsheet rather than a modern smart assistant.

### Decision & Recommendation
**Choose Hybrid: Curated PostgreSQL/Local Recipe Database + Google Gemini Flash.**
*Core Reason:* Grounds financial and nutritional calculations in verified reality while using Gemini Flash for rapid, natural personalization and swaps.

### Falsification Condition
*What would make this decision wrong:* If internet latency or API availability degraded to the point where users could not generate a plan, or if zero budget existed for serverless operations.

---

## ADR-04: Backend, Database & Authentication

### Context
The app needs to persist recipes, store packaging models, support guest users locally, and allow authenticated users to sync plans across web and mobile.

### Options Evaluated
1. **Supabase (PostgreSQL, Auth, Edge Functions) [CHOSEN]**
   - *Pros:* Relational PostgreSQL perfectly models many-to-many recipe-ingredient relationships. Supabase Edge Functions securely host Gemini API keys. Generous free tier, instant RESTful endpoints, built-in Auth (Google/Email), and battle-tested React Native client.
   - *Cons:* Requires managing remote Supabase project configuration.
   - *Long-term issues:* Vendor locking to Supabase infrastructure (mitigated because it's open-source Postgres).
2. **Firebase (Firestore & Cloud Functions)**
   - *Pros:* Deep Google ecosystem, strong offline SDK.
   - *Cons:* NoSQL document model makes relational grocery calculations (summing ingredients, grouping by aisle, calculating pack fractions) awkward and expensive in read ops.
   - *Long-term issues:* Cost spikes with document queries.
3. **Local-Only Storage (AsyncStorage / SQLite) with Zero Backend**
   - *Pros:* Maximum simplicity, zero operating cost.
   - *Cons:* Exposes Gemini API keys directly in client bundles (or requires users to provide their own key); impossible to sync between a laptop browser and a smartphone.
   - *Long-term issues:* Must rewrite state layers when adding accounts later.

### Decision & Recommendation
**Choose Supabase (PostgreSQL + Edge Functions + Auth) paired with local AsyncStorage caching.**
*Core Reason:* PostgreSQL is the ideal relational engine for recipe and grocery inventory, while Edge Functions provide a secure proxy for AI calls and effortless multi-device sync.

### Falsification Condition
*What would make this decision wrong:* If offline-only isolation without any server setup was an uncompromisable requirement for MVP.

---

## ADR-05: Supermarket Pricing & Packaging Strategy

### Context
In Romania, major supermarkets (Lidl, Kaufland, Carrefour, Mega Image) do not provide open, public, real-time pricing APIs. Scraping is blocked by anti-bot measures and breaks continually.

### Options Evaluated
1. **Reference Pack Catalog (Standard Packaging & Average Unit Prices) [CHOSEN]**
   - *Pros:* Predictable, zero external points of failure, deterministic offline calculations. Distinguishes between recipe requirement (e.g., 80g peas) and store package (e.g., 500g bag at 6.50 RON).
   - *Cons:* Prices are accurate market estimates rather than live aisle-scanned prices to the penny.
   - *Long-term issues:* Requires periodic batch updates (e.g. monthly review of baseline staple prices).
2. **Live Scraping of Delivery Apps (Bringo / Sezamo / Glovo)**
   - *Pros:* Real-time prices.
   - *Cons:* Extremely fragile; IP blocks, Cloudflare Captchas, high latency during plan generation, frequent markup discrepancies between delivery platforms and physical shelf prices.
   - *Long-term issues:* High maintenance burden debugging broken scrapers.
3. **Flat Theoretical Per-Gram Pricing**
   - *Pros:* Simple math (e.g., 10g garlic = 0.15 RON).
   - *Cons:* Misleads the user into thinking their weekly grocery bill will be 60 RON, when in reality they must buy whole heads of garlic, a bag of rice, and a bottle of oil costing 120 RON.

### Decision & Recommendation
**Choose Reference Pack Catalog with minimum packaging logic and pantry staples toggle.**
*Core Reason:* It provides honest, realistic shopping basket totals while maintaining 100% system reliability without fragile scraper dependencies.

### Falsification Condition
*What would make this decision wrong:* If a supermarket opened an official, free public API with real-time stock and checkout capabilities.
