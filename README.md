## Priority Matrix Cloud

A production-ready Eisenhower matrix workspace inspired by Priority Matrix. It now supports two run modes:

- **Demo / implementation mode** – skip Google SSO, rely on a single workspace seeded in Supabase, and manage all data with a Supabase service role (what you asked for).
- **Full SSO mode** – Google login enforced via Supabase Auth + middleware (ready to re-enable once credentials and consent screens are finalized).

### Feature highlights

- **Google SSO (Supabase Auth)** – ready to enable when `AUTH_DISABLED` is `false`.
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

   Fill the values with your Supabase project URL/Anon key, site URL, `AUTH_DISABLED`, `SUPABASE_SERVICE_ROLE_KEY`, and the demo IDs (see “Temporary auth-disabled mode” below).

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

3. **(Optional) Google OAuth**
   - Leave this for later while auth is disabled.
   - When you are ready, enable Google under Supabase Auth → Providers and add your Google Cloud OAuth client info. Revert `AUTH_DISABLED` to `false`.

4. **Environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL` – project API URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – public anon key.
   - `NEXT_PUBLIC_SITE_URL` – base URL used to craft OAuth redirect (e.g. `http://localhost:3000` locally, Vercel URL in prod).
   - `AUTH_DISABLED` – set to `true` to skip SSO (current implementation phase).
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (server-only, never expose publicly); required when `AUTH_DISABLED=true` so the server can bypass RLS.
   - `DEMO_USER_ID`, `DEMO_WORKSPACE_ID` – UUIDs for the seed user + workspace you create in Supabase (see below).
   - `DEMO_USER_EMAIL`, `DEMO_USER_NAME` – purely cosmetic defaults for the UI.
   - Set **all** of the above in Vercel Project Settings → Environment Variables.

---

## Temporary auth-disabled mode (current state)

1. **Create a demo user**
   - Supabase Dashboard → Authentication → Users → “Add User”.
   - Choose `demo@mytask.app` (or any email), set a temporary password, and disable “Send email invite”.
   - Copy the generated `id` (UUID). This becomes `DEMO_USER_ID`.

2. **Create a workspace for that user**

   Run in Supabase SQL Editor (replace the UUIDs/emails with your actual values):

   ```sql
   insert into public.workspaces (id, name, owner_id)
   values ('11111111-1111-1111-1111-111111111111', 'Implementation Workspace', 'DEMO_USER_UUID')
   on conflict (id) do nothing;

   insert into public.workspace_members (workspace_id, user_id, role)
   values ('11111111-1111-1111-1111-111111111111', 'DEMO_USER_UUID', 'owner')
   on conflict do nothing;
   ```

   Use the workspace UUID for `DEMO_WORKSPACE_ID`.

3. **(Optional) Seed a few projects/tasks**
   - Use Supabase Table Editor or SQL inserts to create sample rows so the dashboard renders meaningful data immediately.

4. **Set env vars**
   - Update `.env.local` and Vercel envs with `AUTH_DISABLED=true`, the demo IDs, names, email, and `SUPABASE_SERVICE_ROLE_KEY`.

5. **Behavior**
   - Middleware automatically bypasses auth when `AUTH_DISABLED=true`.
   - Server actions use the service-role client + the demo IDs to read/write data securely.
   - When you’re ready to enforce Google SSO, set `AUTH_DISABLED=false`, remove the demo envs (or leave unused), and the original flow (middleware + login page) kicks back in.

---

## Deployment (free tier)

1. **Vercel**
   - Import the GitHub repo (already done for `https://my-task-management-five.vercel.app/`).
   - Confirm the env vars listed above exist for Production & Preview.
   - Trigger a redeploy if you changed env vars.

2. **Supabase**
   - Confirm the SQL schema has been run (Table Editor should show `workspaces`, `tasks`, etc.).
   - Under Auth → Users ensure the demo user exists while auth is disabled.
   - Store the service role key safely; never expose it to the browser.

3. **Streamlit prototype (optional path from the implementation plan)**
   - If you still need a lightweight Python prototype, you can reuse Supabase Auth & DB by hitting the same PostgREST endpoints from Streamlit Community Cloud, but the production-ready Next.js stack above already satisfies the deployment goal.

---

## Testing & quality

- `npm run lint` – Next.js + ESLint configuration.
- For cloud-only verification (no local terminal):
  - Use Vercel preview deployments to test UI after each push.
  - Use Supabase Table Editor to inspect inserts/updates triggered from the app.
  - Once auth is re-enabled, add Playwright/Cypress flows that exercise Google SSO + task CRUD end-to-end.

---

## Useful references

- `implementationplan.md` – original scope, milestones, and stack decisions.
- `supabase/schema.sql` – canonical data model & RLS rules.
- `src/app/dashboard/actions.ts` – single entry point for task CRUD via server actions.
