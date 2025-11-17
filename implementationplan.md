# Implementation Plan — Priority Matrix tipo užduočių valdymo aplikacija

**Santrauka**
Šis dokumentas aprašo įgyvendinimo planą web‑aplikacijai, kuri imituoja Priority Matrix funkcionalumą: keturių kvadratų prioritetų valdymas, projektų ir užduočių matricos, bendradarbiavimas, delegavimas ir ataskaitos.

Tikslai:
- Greitas prototipas, kuriame demonstruojami pagrindiniai darbo srautai (create/read/update/delete užduotys, matricos peržiūra, komandos prisijungimas).
- Produkcinis variantas, kurį galima hostinti nemokamuose debesų sprendimuose (Streamlit Community Cloud, Vercel / Netlify / Render free tier) ir palaikyti Google SSO.

---

## Architektūros parinktys (du keliai)

### A. Rapid prototype — Streamlit (Python)
- Greitai susikurti interaktyvų MVP per 1–2 savaites.
- Privalumai: greitas dev ciklas, vienas repo, nereikia build proceso ar atskiro frontendo.
- Apribojimai: mažiau elegantiškas UI/UX palyginti su React, ribotos sudėtingos interakcijos.
- Deployment: Streamlit Community Cloud (nemokama, paprasta GitHub integracija).
- Autentifikacija: naudoti Supabase arba Firebase Auth API backendui (SSO), arba Streamlit su išorine OAuth proxy.

### B. Full webapp — React/Next.js + Supabase (Recommended)
- Frontend: Next.js (React) — modernus SPA/SSR, gerai veikia Vercel/Netlify.
- Backend/BaaS: Supabase (Postgres, Auth, Realtime, Storage). Supabase suteikia social login (Google) ir nemokamą planą pradiniam etapui.
- Deployment: Vercel (Next.js optimizacija) arba Netlify / Render. DB & Auth per Supabase free tier.
- Privalumai: skalabilumas, geresnis UX, tiesioginė Realtime sinchronizacija (drag’n’drop, live updates).

---

## Pagrindinis tech‑stack (rekomendacija — Full webapp)
- Frontend: Next.js + TypeScript + Tailwind CSS (arba komponentų biblioteka)
- Backend: Supabase (Postgres) — Auth (Google SSO), Realtime, Storage, Functions (edge/Serverless)
- Task queue / background jobs: Supabase Functions arba serverless funkcijos ant Vercel/Render
- CI/CD: GitHub Actions (veikia nemokamai su public repo arba ribotai su private)
- Monitoring / Crash reporting: Sentry (free tier) arba Logflare (Supabase integracija)
- Dev tooling: Prisma or pg‑typed (neprivaloma), ESLint, Prettier, Storybook (UI)

---

## Funkcionalumai (MVP -> v1 -> v2)

### MVP (2–4 savaitės)
- Užduočių CRUD (title, description, due date, priority, tags)
- Matricos peržiūra: 4 kvadrantai (Critical/Urgent, Not Critical/Urgent, Critical/Not Urgent, Not Critical/Not Urgent)
- Projektai / erdvės (workspaces) ir vartotojo paskyra
- Google SSO prisijungimas (per Supabase Auth arba Firebase Auth)
- Pasidalinimas su vienu komandos nariu (bazinė permissions)
- Paprastos notifikacijos naršyklėje

### v1 (2–3 mėnesiai)
- Užduočių delegavimas ir atsakomybės priskyrimas
- Filtro, paieškos ir užduočių rūšiavimo įrankiai
- Failų prisegimas (Supabase Storage)
- Realtime atnaujinimai (kai kitas vartotojas keičia užduotį)
- Integruotos el. pašto notifikacijos (naudoti SendGrid arba Supabase Functions)

### v2 (4–6 mėn.)
- Analytics: laiko praleidimas, užduočių metrika, burndown
- Integracijos: Slack, Google Calendar
- Granular permissions (role based access)
- Mobile responsive & PWA

---

## Duomenų modelio santrauka (Postgres)
- users (id, email, name, avatar, provider_id)
- workspaces (id, name, owner_id)
- projects (id, workspace_id, name, meta)
- tasks (id, project_id, title, description, priority, urgency, status, assignee_id, due_date, created_by)
- task_tags (task_id, tag_id)
- comments (task_id, user_id, body, created_at)
- audit_logs (entity, action, user_id, timestamp)

Pastaba: Prioriteto kvadrantas gali būti skaičiavimo laukas: `(priority, urgency)` arba tiesiog boolean laukai `is_urgent`, `is_important`.

---

## Saugumas ir autentifikacija
- Naudoti Supabase Auth arba Firebase Auth kaip SSO providerį (Google OAuth 2.0). Social login integracija yra lengvai prieinama per Supabase.
- HTTPS privaloma (platformos suteikia TLS nemokamai).
- RBAC: role‑based access kontrolė su serverio patikra prieš vykdant modifikacijas.
- RLS (Row Level Security) — jeigu naudojate Supabase/Postgres, naudokite RLS taisykles, kad duomenys būtų izoliuoti pagal workspace/user.
- Sensitive config in secrets manager (Vercel/Netlify/Render/Streamlit env vars)

---

## Deployment strategija (nemokamos parinktys)
1. **Prototype**: Streamlit Community Cloud + Supabase — greitas MVP rodymui.
2. **Production‑ready free stack**: Next.js (Vercel Hobby) + Supabase Free + Netlify functions/Render (kai reikia serverless). Šis derinys leidžia išvengti serverio išlaidų kol naudojimas mažas.

---

## CI/CD & Release planas
- GitHub repo su trunk‑based flow: `main`, `develop`, feature branches
- GitHub Actions: lint → test → build → deploy (to preview environments per PR)
- Deploy to preview on each PR; merge triggers production deployment to Vercel/Netlify

---

## Sprint planas (įvertinimai)
- Sprint 0 (1 savaitė): architektūros setup, repo scaffold, Supabase project, Google OAuth client setup
- Sprint 1 (2 savaitės): bazinė auth + užduočių CRUD + DB modeliai
- Sprint 2 (2 savaitės): matricos UI, drag’n’drop, filter funkcijos
- Sprint 3 (2 savaitės): sharing/permissions, file storage, realtime
- Sprint 4 (2 savaitės): polish, tests, deploy ir monitoring

Total MVP: ~8–10 savaitės (vienam pilno etato devui). Komanda su 2 dev per sprintą gali sutrumpinti laiką.

---

## Testavimas
- Unit tests (Jest/Testing Library) frontend
- Integration tests (Playwright / Cypress) – scenarijai: auth flow, task lifecycle, sharing
- Postgres migrations and snapshot testing

---

## Rizikos ir mitigacijos
- **Rizika:** Free tier limitai (bandwidth, DB connections) — **Mitigacija:** monitorinti, įdiegti usage alerts, planuoti migraciją prie mokamo plano anksčiau laiko.
- **Rizika:** OAuth setup ir verifikacijos (Google) — **Mitigacija:** dokumentuoti OAuth consent screen, test accounts, staging client IDs.
- **Rizika:** Realtime skalė — **Mitigacija:** riboti real‑time kanalus, naudoti presence/heartbeat, fallbacks (polling).

---

## Kostų aproksimacija
- Naudojant supabase free + Vercel/Netlify hobby/free – pradžioje $0. Kaip vartotojų skaičius auga, greičiausiai reikės Supabase Pro arba DB migracijos (nuo ~$25/mėn.).

---

## Veiksmų sąrašas (pirmieji 7 dienų žingsniai)
1. Sukurti GitHub repo ir project board (issues/tickets)
2. Susikurti Supabase projektą (free) ir įrašyti DB schema skeleton
3. Susikonfigūruoti Google Cloud OAuth client (consent screen, authorized origins)
4. Scaffold Next.js + Tailwind arba Streamlit app skeleton
5. Implementuoti Supabase Auth Google SSO ir lokalų login
6. Užduočių CRUD API + DB migracijos
7. Deploy į preview (Vercel/Streamlit) ir patikrinti pagrindinius flow

---

## Reikalingi resource'ai ir credentials
- GitHub organizacija/repo
- Supabase account + project
- Google Cloud Console project (OAuth consent & credentials)
- Vercel / Netlify / Streamlit account

---

## Dokumentacija ir tolimesni žingsniai
- API spec (OpenAPI) – aprašyti užduoties POST/GET/PUT/DELETE
- DB migrations (SQL arba migruotojas)
- Onboarding doc: kaip pridėti Google OAuth client IDs
- Security checklist: RLS rules, env var rotation, secrets handling

---

**Pabaigai**: šis planas orientuotas į greitą MVP su galimybe augti iki pilnavertės SaaS platformos. Rekomendacija: pradėti su Full webapp stack (Next.js + Supabase) dėl geresnės UX, lengvos integracijos su Google SSO ir paprastos nemokamos deploy galimybės.

*Parengė: implementationplan.me generatorius — detalizaciją galima išplėsti pagal prioritetus.*

