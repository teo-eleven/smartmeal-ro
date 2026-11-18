# Raport de tester · Etapa A (texte conforme, disclaimer, siguranță)

Data: 2026-11-18 · ramura `feat/stage-a-finish` (A.1–A.8 sunt deja în `main` prin PR #22) ·
doar rezultate rulate efectiv.

## 1. Verificări automate

| Verificare                 | Rezultat                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`        | 0 erori                                                                                                      |
| `npm run lint`             | 0 erori, 0 avertismente (cele 9 vechi reparate în poartă)                           |
| `npm run test:sql`         | toate trec (94 de verificări, inclusiv migrările 0011 și 0012)                                               |
| Jest (logică + componente) | 2191 trec, 1 sărit, 0 picate                                                                                 |
| Acoperire totală           | 91.46 / 81.80 / 93.00 / 93.20 (instrucțiuni / ramuri / funcții / linii)                                      |
| Fișierele noi ale etapei   | 90–100% (siguranță, mesaje, disclaimere, platformă, generator păzit); `preferenceRepairNotice.ts` 72% → 100% |

O rulare completă a picat o dată pe `reminderSettings.test.ts` (990 s, cât Mac-ul a fost în repaus).
Fișierul trece 3 din 3 separat (~1,4 s), iar suita completă rulată imediat după trece integral (12 s).

## 2. Sync real pe Supabase local

`npm run test:sync`: **46 din 46** (5 suite). Pe lângă cele 12 de dinainte:

- răspunsul de siguranță nu apare în niciun tabel al contului; indicatorul de pe iPhone nici el;
- după un „Da”, obiectivele venite din cloud sunt blocate, iar generatorul aplică doar „Fără porc”;
- delogarea, schimbarea contului și ștergerea contului curăță răspunsul și indicatorul de pe iPhone;
- acordul unui cont nou are versiunea politicii și dacă a inclus obiectivele;
- fără acord pentru obiective, aplicația întreabă o dată înainte să le sincronizeze; „Nu” le ține pe telefon;
- baza de date refuză singură obiectivele unui cont fără acord, chiar de la un client care le trimite;
- iPhone-ul nu încarcă și nu modifică obiectivele din cont; Android le vede neatinse;
- fără rețea: nimic nu se trimite, nimic nu se blochează; după revenire se salvează curat.

Notă de mediu: la prima rulare a picat ștergerea contului (503). Containerul de funcții al bazei
locale se oprise; după repornire, testul trece. Înaintea oricărei rulări de sync verificăm acum
că funcțiile răspund (401).

## 3. Aplicația în browser (Playwright, 390 px)

`npm run test:e2e`: **17 din 17**. Etapa A are 10 teste: obiectivele cu rândul „Relevant dacă…”,
disclaimerul scurt și lung, întrebarea de siguranță pe toate drumurile, Filtrele, rețeta cu și fără
insigne, textele de pe carduri („min. 28g”, „max. 420 kcal”, fără „Detox”/„energizant”), textul
neutru de pe ecranul de abonament, spațiul din antetul rețetei, axe pe toate ecranele noi
(0 probleme). Testele noi au trecut 80 din 80 rulate de 10 ori la rând.
Capturi în `docs/testing/screens/stage-a/`.

## 4. Teste adversariale

60 de teste noi (`etapaAStorageAdversarial`, `etapaAAdversarial`, `etapaAAdversarial.sync`):
răspuns de siguranță corupt (10 variante, inclusiv 2 MB), indicator corupt, stocare care cedează
la citire/salvare/ștergere, apăsări duble pe obiective și butoane, Filtre deschise/închise repede,
conturi diferite pe același telefon, sesiune expirată, iPhone simulat pe fiecare cale, 4000 de
gustări, trei fusuri orare. Un bug găsit și reparat: obiectivele dublate nu erau eliminate.

## 5. Review de cod

`code-reviewer` și `security-reviewer` pe toată etapa: niciun CRITICAL sau HIGH. Două runde de
reparații (cât prevede regula), toate închise:

| Găsit                                                               | Reparat                                          |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| Pornirea rapidă ștergea alergiile, dieta și „Fără porc” (bug vechi) | le păstrează pe orice platformă                  |
| „Anulează” după resetare readucea obiective blocate                 | respectă răspunsul curent                        |
| Rezumatul dinainte de generare arăta obiective neaplicate           | doar cele care se aplică                         |
| Mesajul de pe iPhone pomenea alte platforme                         | „…Preferințele tale sunt păstrate în cont.”      |
| Acordul nu spunea dacă a inclus obiectivele                         | migrarea 0011 + întrebare o singură dată         |
| iPhone-ul aducea și retrimitea obiective ascunse                    | iPhone-ul nu le atinge                           |
| Acordul verificat doar în aplicație                                 | migrarea 0012: baza de date le scoate fără acord |
| Implicit „trimite” la salvare                                       | câmpul e obligatoriu                             |
| Acord fără versiunea politicii                                      | refuzat                                          |
| Generatorul putea fi folosit fără protecție                         | regulă de lint, cu excepțiile verificate         |
| `PRIVACY.md` imprecis                                               | actualizat; versiunea politicii `2026-11-17`     |

Tot în poartă: testele lente reparate la cauză (mesajele de eroare uriașe din `waitFor`), regula
`react-hooks` (5 avertismente reparate la rădăcină, inclusiv un bug Face ID), butonul din Filtre
și cardul de masă pentru cititorul de ecran, spațiul din antetul rețetei, titlul ascuns scos,
costul pe porție readus (o regresie prinsă de tester), prețurile cu virgulă peste tot.

## 6. Observații pentru etapele următoare

- Câmpurile de operator din `PRIVACY.md` așteaptă decizia G.0a.
- La lansare: schimbările de fond ale politicii se anunță pe email deținătorilor de cont.

**Concluzie: Etapa A trece poarta de tester.**
