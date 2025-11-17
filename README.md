## Priority Matrix Cloud

A production-ready Eisenhower matrix workspace inspired by Priority Matrix. It ships with Google SSO via Supabase Auth, quadrant-based task boards, collaborative workspaces/projects, and deployment defaults that run entirely on free tiers (Vercel + Supabase).

### Feature highlights

- **Google SSO (Supabase Auth)** – login screen wired to Google OAuth with secure callback routing and middleware guards.
- **Matrix cockpit** – quadrant dashboard groups tasks into focus/schedule/delegate/eliminate lanes with CRUD actions and live stats.
- **Workspace & collaboration** – workspace memberships, team snapshot, and projects list align with the provided Postgres schema/RLS rules.
- **Server actions + Supabase** – all task mutations run via secure Next.js server actions hitting Supabase Postgres.
- **Cloud-ready** – designed for Vercel Hobby + Supabase Free + optional Streamlit prototype path per `implementationplan.md`.

---

## Stack

| Layer          | Tech                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| Frontend       | Next.js App Router (TypeScript) + TailwindCSS, lucide-react, date-fns       |
| Auth & Data    | Supabase (Postgres, Auth, RLS, optional Storage)                            |
| Forms/validation | React Hook Form + Zod + server actions                                     |
| Deployment     | Vercel (web) + Supabase (managed DB/Auth). Streamlit prototype still viable |

---

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill the values with your Supabase project URL/Anon key and local site URL.

3. **Run dev server**

   ```bash
   npm run dev
   ```

   App is available at [http://localhost:3000](http://localhost:3000).

---

## Supabase setup

1. **Create project**
   - In the Supabase dashboard create a new project (free tier is enough).
   - Copy the `project url` and `anon key` into `.env.local`.

2. **Provision schema**
   - Run the SQL in `supabase/schema.sql` using the Supabase SQL editor or `supabase db push`.
   - This creates `workspaces`, `projects`, `tasks`, `workspace_members`, comments, audit logs, and RLS policies.

3. **Google OAuth**
   - In Supabase Auth → Providers enable Google, paste your Google Cloud OAuth client ID/secret.
   - In Google Cloud Console, create OAuth credentials:
     - Authorized origins: `http://localhost:3000`, `https://your-vercel-app.vercel.app`
     - Authorized redirect URI: `https://your-domain.com/auth/callback` (same path used locally)

4. **Environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL` – project API URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – public anon key.
   - `NEXT_PUBLIC_SITE_URL` – base URL used to craft OAuth redirect (e.g. `http://localhost:3000` locally, Vercel URL in prod).
   - Set the same variables in Vercel project settings for production.

---

## Deployment (free tier)

1. **Vercel**
   - Import this repo.
   - Set the three env vars above in Vercel.
   - Deploy (Next.js is auto-detected). Hobby tier is free.

2. **Supabase**
   - Already configured; keep project on free tier.
   - Optional: connect Vercel Environment Variables to Supabase secrets using the integration.

3. **Streamlit prototype (optional path from the implementation plan)**
   - If you still need a lightweight Python prototype, you can reuse Supabase Auth & DB by hitting the same PostgREST endpoints from Streamlit Community Cloud, but the production-ready Next.js stack above already satisfies the deployment goal.

---

## Testing & quality

- `npm run lint` – Next.js + ESLint configuration.
- Future work: integrate Playwright/Cypress flows for auth/task lifecycle, and add unit tests for server actions.

---

## Useful references

- `implementationplan.md` – original scope, milestones, and stack decisions.
- `supabase/schema.sql` – canonical data model & RLS rules.
- `src/app/dashboard/actions.ts` – single entry point for task CRUD via server actions.
