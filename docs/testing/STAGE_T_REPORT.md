# Raport de tester · Etapa T („Midnight Forest & Smoked Walnut”)

Data: 2026-11-04 · ramura `feat/forest-walnut-theme` · doar rezultate rulate efectiv.

## 1. Verificări automate

| Verificare                 | Rezultat                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `npm run typecheck`        | 0 erori                                                                    |
| `npm run lint`             | 0 erori, 9 avertismente vechi (P4)                                         |
| `npm run test:sql`         | toate trec                                                                 |
| Jest (logică + componente) | 1771 trec, 1 sărit                                                         |
| Acoperire totală           | 90.84 / 81.05 / 92.36 / 92.58 (instrucțiuni / ramuri / funcții / linii)    |
| Fișierele noi ale etapei   | 100% (typography, useTitleFont, pressedState, storeBadge, QuickActionsBar) |

## 2. Sync real pe Supabase local

`npm run test:sync`: 12 din 12. Conturi create și șterse automat; plan pe două dispozitive,
conflictul de versiuni, notițe, mementouri, deconectare, ștergerea contului.

## 3. Aplicația în browser (Playwright, 390 px)

`npm run test:e2e`: 7 din 7. Fluxul principal, fontul titlurilor încărcat cu adevărat,
axe cu toate regulile WCAG 2.1 A/AA pe 6 ecrane, conturul de focus bronz.
Capturi înainte/după pe 9 ecrane (bun venit, onboarding, sumar, paywall, tablă, card, rețetă,
cumpărături, cont): fără erori în pagină în ambele versiuni.

## 4. Teste adversariale

- Fontul care nu se încarcă sau se blochează: aplicația pornește după 3 s cu fontul sistemului.
- `withAlpha` cu coduri de culoare greșite: refuză, nu desenează `rgba(NaN)`.
- Contrastul pe straturi suprapuse (insigne bronz peste card, rând colorat, suprafață secundară).
- Gărzile încercate cu ocolișuri: culoare ascunsă într-o umbră, `accessibilityState` în `App.tsx`,
  `...titleFont` doar într-un comentariu. Toate trei găsite și închise.
- Testul axe și testul de font dovedite că pică pe date greșite (bronzul vechi, un font inexistent).

## 5. Review de cod

`code-reviewer` și `typescript-reviewer`: niciun CRITICAL sau HIGH. Reparate: `accessibilityState`
rămas în `App.tsx`, gaura din garda de culori, așteptarea nelimitată a fontului, așteptările
nelimitate din testul axe, `withAlpha` fără validare, tipul explicit pentru `pressedState`,
comentariile în garda de font, folderul de ieșire al `renderIcons`.
Lăsate cu motiv: `void triggerReload` (funcția își prinde singură erorile), rolul `dialog` pe
ecranul de încărcare (blochează aplicația de dedesubt, ARIA permite `aria-busy` pe dialog).

## 6. Observații în afara etapei

- Rețetele fără fotografie verificată (de ex. „Pui crocant la Air Fryer”) arată cardul generat,
  nu poza din `main`, care era a altei rețete. Decizie din auditul din 22 octombrie; se rezolvă
  în E.14 (o fotografie pentru fiecare rețetă).
- P1, P2, P5, P6 rămân pentru Etapa D.
