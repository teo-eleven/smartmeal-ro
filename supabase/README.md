# Supabase — cloud sync & AI proxy

Aplicația funcționează complet **fără** Supabase (mod oaspete, planificare locală,
selecție deterministă de rețete). Pașii de mai jos activează cele două funcții opționale:
sincronizarea în cloud și swap-ul de rețete asistat de AI.

## De ce trece AI-ul prin Supabase

Orice variabilă `EXPO_PUBLIC_*` este **inclusă în bundle-ul livrat clientului** de către
Expo. O cheie de API pusă acolo poate fi citită de oricine folosește aplicația.

De aceea cheia Anthropic stă în secretele Supabase, iar clientul apelează funcția edge
`proxy-ai-swap` (Claude Haiku). Nu există și nu trebuie adăugată o cale alternativă cu cheie
în client.

## Activare

```bash
# 1. CLI-ul Supabase (nu e instalat implicit)
brew install supabase/tap/supabase

# 2. Autentificare și legarea proiectului
supabase login
supabase link --project-ref <project-ref>

# 3. Aplicarea migrațiilor în baza de date (0001 - 0010)
#    ÎNAINTE de a publica o versiune nouă a aplicației: 0009 (salvarea condiționată a
#    planului) e cerută de aplicația din etapa 5, altfel urcarea planului dă eroare.
supabase db push
# Verifică local oricând că toate migrațiile sunt valide: npm run test:sql

# 4. Secretele funcțiilor (vezi lista completă mai jos)
supabase secrets set ANTHROPIC_API_KEY=<cheia-ta>
supabase secrets set REVENUECAT_SECRET_KEY=<cheia-secretă-revenuecat>
supabase secrets set UNSUBSCRIBE_SECRET=<un-șir-aleator-lung>
supabase secrets set APP_URL=https://domeniul-tau.ro

# 5. Originile care au voie să apeleze funcțiile din browser. Nesetat = niciun site
#    (CORS închis implicit, niciodată '*'). Aplicațiile native nu trimit Origin.
supabase secrets set ALLOWED_ORIGINS=https://domeniul-tau.ro,https://www.domeniul-tau.ro

# 6. Publicarea tuturor funcțiilor
supabase functions deploy proxy-ai-swap
supabase functions deploy delete-account
supabase functions deploy send-reminder-emails
supabase functions deploy unsubscribe-reminders

# 7. Dacă proiectul avea vechea funcție Gemini, oprește-o și șterge-i cheia
supabase functions delete proxy-gemini-plan
supabase secrets unset GEMINI_API_KEY
```

### Migrațiile din `supabase/migrations/`
- **0001_user_meal_plans.sql**: Tabela planurilor de mese cu politici RLS și limite de dimensiune JSONB.
- **0002_ai_rate_limits.sql**: Limitare partajată a apelurilor către proxy-ul AI.
- **0003_user_reminders.sql**: Preferințe mementouri locale pe dispozitiv.
- **0004_email_reminders.sql**: Mementouri pe email, frecvență și urmărire livrări.
- **0005_user_consents.sql**: Consimțăminte GDPR înghețate la înregistrare.
- **0006_profiles.sql**: Tabela `profiles` cu `display_name` populat automat prin trigger din metadate la signup.
- **0007_user_devices.sql**: Tabela `user_devices` (istoric dispozitive, înregistrare sesiune și revocare la distanță).
- **0008_tighten_consent_grants.sql**: Restrângere drepturi pe tabela de consimțăminte.
- **0009_save_plan_if_unchanged.sql**: Salvarea planului doar dacă cloud-ul are versiunea văzută de telefon (fără suprascrieri tăcute între dispozitive).
- **0010_user_recipe_notes.sql**: Notițele la rețete, doar pentru proprietar, șterse odată cu contul.

### Secretele funcțiilor

| Secret | Folosit de | Obligatoriu |
|---|---|---|
| `ANTHROPIC_API_KEY` | `proxy-ai-swap` | da, pentru sugestiile AI |
| `AI_MODEL` | `proxy-ai-swap` | nu (implicit `claude-haiku-5-5`) |
| `REVENUECAT_SECRET_KEY` | `proxy-ai-swap` (verifică abonamentul) | da |
| `ALLOWED_ORIGINS` | `proxy-ai-swap`, `delete-account` | da pentru web; nesetat = niciun site |
| `UNSUBSCRIBE_SECRET` | `send-reminder-emails`, `unsubscribe-reminders` | da, pentru emailuri |
| `APP_URL` | `unsubscribe-reminders` (singura origine permisă) | da, pentru emailuri |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | toate | injectate automat de Supabase |

`delete-account` cere o autentificare din ultimele 5 minute (parolă sau cod pe email,
citită din claim-ul `amr` al tokenului); aplicația cere parola în confirmarea ștergerii.

### Pagina web

`npm run build:web` exportă aplicația și adaugă Content-Security-Policy în `dist/index.html`,
`delete-account.html` și `unsubscribe.html` (`scripts/injectCsp.mjs`). Publică directorul
`dist/` rezultat, nu un export făcut direct cu `expo export`.

### Șabloane de email (Authentication → Email Templates)
Supabase trimite implicit link-uri web. Aplicația mobilă cere coduri OTP formate din cifre (`{{ .Token }}`):
- **Magic Link / Conectare cu cod**: copiază conținutul din `supabase/templates/magic_link.html`.
- **Resetare parolă**: copiază conținutul din `supabase/templates/recovery.html`.
- **Confirmare cont**: copiază conținutul din `supabase/templates/confirmation.html`.

`delete-account` este **obligatorie** înainte de orice submisie în magazine: Apple cere din
2022 o cale de ștergere a contului direct din aplicație (5.1.1v), iar Google Play cere și una
accesibilă din web. Contul păstrează alergiile declarate, deci intră sub art. 9 GDPR.
Funcția folosește `SUPABASE_SERVICE_ROLE_KEY`, pe care Supabase îl injectează singur — nu îl
pune niciodată în `.env` și nu îl trimite în client.

Apoi completează în `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Cheia `anon` este publică prin design și poate sta în client. Cheia `service_role` **nu**.

## Verificare

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/proxy-ai-swap" \
  -H "Authorization: Bearer <tokenul-unui-utilizator-abonat>" \
  -H "Content-Type: application/json" \
  -d '{"peopleCount":2,"budgetRon":200,"supermarketId":"lidl",
       "dietType":"omnivore","appliances":["hob"],"moodTags":["speedy"],
       "candidateRecipeIds":["paste_carbonara_rapide","snitele_pui_cuptor"]}'
```

Răspuns așteptat: `{"selectedRecipeId":"...","reasonRo":"...","isFallback":false}` cu un id
**din lista trimisă**. Orice refuz are `fallbackToLocal: true`, iar aplicația își face singură
alegerea deterministă, fără s-o prezinte drept AI.

Înainte de a schimba promptul sau modelul, rulează evals-urile și compară rata de trecere:

```bash
ANTHROPIC_API_KEY=... npx jest --selectProjects logic src/__tests__/evals
```

## Dacă nu e configurat

`env.isAiProxyConfigured` și `env.isCloudSyncConfigured` sunt `false`, iar aplicația:

- planifică local, fără AI (selecție deterministă, acoperită de teste)
- salvează totul în stocarea locală a dispozitivului
- afișează mesaje explicite la autentificare, în loc să eșueze în tăcere

Acest comportament e acoperit de `src/services/__tests__/cloudSyncOffline.test.ts`.
