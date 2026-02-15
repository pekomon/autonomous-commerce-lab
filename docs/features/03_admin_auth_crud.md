# Feature 03: Admin Authentication and Product CRUD

## Scope Delivered

- Replaced mock catalog data in `apps/admin-web` with Supabase-backed data access.
- Added Supabase client wiring in `apps/admin-web/src/lib/supabaseClient.ts`.
- Added authentication flow with email and password:
  - `/login` route for sign-in/sign-up
  - protected routing for admin pages
  - sign-out support
- Added database-backed product pages:
  - `/products` list
  - `/products/:id` detail
  - `/products/new` create form
  - `/products/:id/edit` edit form
- Added archive action that updates product status to `archived`.
- Added friendly authorization error handling for RLS-protected writes.
- Added non-empty title validation in UI and database constraint for product titles.

## Files Changed

- `.env.example`
- `README.md`
- `apps/admin-web/package.json`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/main.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/auth/AuthProvider.tsx`
- `apps/admin-web/src/auth/ProtectedRoute.tsx`
- `apps/admin-web/src/components/AdminHeader.tsx`
- `apps/admin-web/src/lib/supabaseClient.ts`
- `apps/admin-web/src/pages/LoginPage.tsx`
- `apps/admin-web/src/pages/ProductsListPage.tsx`
- `apps/admin-web/src/pages/ProductDetailsPage.tsx`
- `apps/admin-web/src/pages/ProductFormPage.tsx`
- `apps/admin-web/src/products/productErrors.ts`
- `apps/admin-web/src/products/productMappers.ts`
- `apps/admin-web/src/products/productMappers.test.ts`
- `supabase/migrations/20260214164500_enforce_non_empty_product_title.sql`
- `docs/backend.md`
- `docs/features/02_supabase_foundation.md`

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

## Tests Executed

- `pnpm format:check`
- `pnpm -r lint`
- `pnpm -r test`
- `pnpm -r build`

## Known Follow-ups

- Move product list filtering/sorting from client-side to query-level filtering where needed.
- Add product category and image editing flows.
- Add pagination and optimistic UI handling for large catalogs.
- Expand auth UX with password reset and stronger sign-up messaging.
