# Supabase — cloud sync & AI proxy

Aplicația funcționează complet **fără** Supabase (mod oaspete, planificare locală,
selecție deterministă de rețete). Pașii de mai jos activează cele două funcții opționale:
sincronizarea în cloud și swap-ul de rețete asistat de AI.

## De ce trece AI-ul prin Supabase

Orice variabilă `EXPO_PUBLIC_*` este **inclusă în bundle-ul livrat clientului** de către
Expo. O cheie de API pusă acolo poate fi citită de oricine folosește aplicația.

De aceea cheia Gemini stă în secretele Supabase, iar clientul apelează funcția edge
`proxy-gemini-plan`. Nu există și nu trebuie adăugată o cale alternativă cu cheie în client.

## Activare

```bash
# 1. CLI-ul Supabase (nu e instalat implicit)
brew install supabase/tap/supabase

# 2. Autentificare și legarea proiectului
supabase login
supabase link --project-ref <project-ref>

# 3. Cheia Gemini, server-side
supabase secrets set GEMINI_API_KEY=<cheia-ta>

# 4. Originile care au voie să apeleze funcția din browser
#    Fără asta CORS rămâne '*', potrivit doar în dezvoltare: cheia anon e publică prin
#    design, așa că orice site care a copiat-o poate apela funcția din browserul unui
#    utilizator, pe cota ta de Gemini. Aplicațiile native nu trimit Origin și nu sunt afectate.
supabase secrets set ALLOWED_ORIGINS=https://domeniul-tau.ro,https://www.domeniul-tau.ro

# 5. Publicarea funcției
supabase functions deploy proxy-gemini-plan
```

Apoi completează în `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Cheia `anon` este publică prin design și poate sta în client. Cheia `service_role` **nu**.

## Verificare

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/proxy-gemini-plan" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"action":"suggest_swap","peopleCount":2,"budgetRon":200,"supermarketId":"lidl",
       "dietType":"omnivore","appliances":["hob"],"moodTags":["speedy"],
       "candidateRecipeIds":["paste_carbonara_rapide","snitele_pui_cuptor"]}'
```

Răspuns așteptat: `{"selectedRecipeId":"...","reasonRo":"..."}` cu un id **din lista trimisă**.

Funcția validează deja răspunsul modelului împotriva listei de candidați, iar clientul
validează încă o dată în `src/services/aiProxy.ts` — un id inventat este respins, iar
aplicația revine la selecția deterministă.

## Dacă nu e configurat

`env.isAiProxyConfigured` și `env.isCloudSyncConfigured` sunt `false`, iar aplicația:

- planifică local, fără AI (selecție deterministă, acoperită de teste)
- salvează totul în stocarea locală a dispozitivului
- afișează mesaje explicite la autentificare, în loc să eșueze în tăcere

Acest comportament e acoperit de `src/services/__tests__/cloudSyncOffline.test.ts`.
