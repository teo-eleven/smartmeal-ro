# SmartMeal RO — raport final după remediere

Auditul din 2026-10-21 (commit `c68a7b3`) și planul din `docs/REMEDIATION_PLAN.md`, încheiate pe 2026-10-23.

## PR-uri (merge în ordine, fiecare stă peste cel dinainte)

| PR | Etapa | Conținut |
|---|---|---|
| #9 | 1 · siguranță alimentară | alergeni ambigui marcați prudent, carne de porc ascunsă, keto cu plafon de carbohidrați |
| #10 | 2 · imagini | poze verificate (Wikimedia Commons), `expo-image` cu fallback, titluri și id-uri corectate cu alias-uri |
| #11 | 3 · date catalog | calorii calculate din ingrediente, unități convertite corect, catalogul spart pe fișiere |
| #12 | 4a · store și motor | coșul păstrează bifele, „în oraș” nu mai e cumpărat, store și motor sparte pe module |
| #13 | 4b · butoane și UI | confirmări și Undo, ferestre secvențiale pe iOS, accesibilitate, onboarding spart pe pași |
| #14 | 5 · sincronizare, AI, securitate | date golite la deconectare, conflicte în cloud, offline, Claude Haiku, CSP |
| (acesta) | 6 · dependențe | Expo SDK 58, audit, acoperire, E2E |

## Starea la final

- Teste: 1 152 logică (1 eval sărit fără cheie) + 493 componente, toate verzi; `npm run test:sql` verde.
- Acoperire: 90,6% instrucțiuni, 80,5% ramuri, 92% funcții, 92,3% linii.
- `tsc`, ESLint, `expo-doctor` (20/20) curate.
- E2E Playwright pe SDK 58: onboarding → paywall → meniu, card la 390 px, notițe, schimb cu impact în buget, Undo, cămară, listă — 0 erori în consolă.
- `npm audit --omit=dev`: 0 critice; 4 high dintr-o singură cauză fără versiune reparată (`node-forge` în unealta de build Expo, nelivrată).

## Ce ai de făcut pe proiectul Supabase și la publicare

1. `supabase db push` — migrațiile 0009 și 0010, **înainte** de noua versiune a aplicației.
2. Secretele funcțiilor (`ANTHROPIC_API_KEY`, `REVENUECAT_SECRET_KEY`, `ALLOWED_ORIGINS`, …) și deploy pentru toate funcțiile — `supabase/README.md`.
3. Șterge `proxy-gemini-plan` și `GEMINI_API_KEY` de pe proiect.
4. Web: publică ce produce `npm run build:web` (are CSP); la hosting adaugă header-ele `frame-ancestors 'none'` și `X-Frame-Options: DENY`.
5. Republică politica de confidențialitate (versiunea 2026-10-23, procesator Anthropic).
6. Build-uri native noi (SDK 58 schimbă codul nativ) și un test pe telefon: Face ID, ferestre pe iOS, tastatura pe fișa rețetei, deconectarea.

## Amânat sau rămas deschis (decizii luate)

- Spargerea `RecipeDetailModal`, `MealBoardScreen`, `MealCard` și a restului `supabase.ts` — refactor fără efect vizibil, amânat la cerere.
- Testing Library 14 (alt API de randare) — rămânem pe 13.3, compatibilă cu React 19.
- Punctele LOW din review-ul de securitate al etapei 5, listate în plan.
- Funcțiile Deno nu au rulat local (Deno lipsește); logica lor pură e testată din Jest. Evals-urile AI cer o cheie Anthropic.
