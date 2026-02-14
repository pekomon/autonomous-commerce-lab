# Feature 03: Admin Authentication and Product CRUD

## What Changed

- Replaced mock catalog data in `apps/admin-web` with Supabase-backed data access.
- Added Supabase client wiring in `apps/admin-web/src/lib/supabaseClient.ts`.
- Added authentication flow with email and password:
  - `/login` route for sign-in/sign-up
  - protected routing for admin pages
  - sign out support
- Added database-backed product pages:
  - `/products` list
  - `/products/:id` detail
  - `/products/new` create form
  - `/products/:id/edit` edit form
- Added archive action that updates product status to `archived`.
- Added friendly authorization error handling for RLS-protected writes.

## Required Environment Variables

Use local `.env.local` (not committed) with:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Repository `.env.example` includes placeholders only.

## Enable Email Authentication in Supabase

1. Open Supabase Dashboard.
2. Go to `Authentication -> Providers`.
3. Enable `Email` provider.
4. Configure email confirmation settings as needed for your environment.

## Admin Allowlist Reminder

Write access depends on RLS and the `admin_users` table.

After signing in once and obtaining your auth user ID, add your user through Supabase SQL Editor (privileged context):

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

## Known Limitations

- Filtering and sorting are currently client-side after list fetch.
- Product categories and images editing are not included yet.
- No pagination is implemented yet for product listing.
- Sign-up flow is intentionally minimal and may require email confirmation depending on project settings.
