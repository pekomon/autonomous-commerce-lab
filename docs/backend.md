# Backend Setup (Supabase)

This project uses Supabase directly from clients. Database schema and policies are managed through SQL migrations in `supabase/migrations`.

## Prerequisites

- Supabase account and project
- Supabase CLI installed
- Local `.env.local` with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Optional local-only `SUPABASE_SERVICE_ROLE_KEY` (never commit)

## Install Supabase CLI

macOS (Homebrew):

```bash
brew install supabase/tap/supabase
```

Cross-platform alternatives are available in official docs: https://supabase.com/docs/guides/cli

## Authenticate and link project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

## Apply migrations

Push local migrations to the linked remote project:

```bash
supabase db push
```

For local development with a local Supabase stack:

```bash
supabase start
supabase db reset
```

Because this project now includes `supabase/seed.sql`, `supabase db reset` also seeds a base demo catalog by default.

## Seed demo catalog data

Use the built-in Supabase seed flow when you want a ready-made base set of categories and products.

Seed the local Supabase stack:

```bash
supabase db reset
```

Apply the same seed data to the linked remote project:

```bash
supabase db push --include-seed
```

Warning: `supabase db push --include-seed` writes demo catalog rows into the currently linked remote project. Use it only for environments where demo data is appropriate.

The seed is safe to rerun for the demo rows it manages:

- categories reconcile by `slug`, so seeded categories can coexist with linked remotes that already contain those slugs under different UUIDs
- products use stable seed IDs and are upserted when those seed-managed rows already exist
- product-category links add missing seed-managed mappings with `on conflict do nothing`; reruns do not delete preexisting links
- sample products are mostly `active`, with one `draft` example
- SQL seed data does not include storage objects; seeded product images use a separate script

Note: seed data does not create auth users or admin allowlist entries.

## Seed demo product images

Demo product images are generated as simple SVG placeholders and uploaded to Supabase Storage separately from `supabase/seed.sql`.

Prerequisites:

- seeded demo catalog rows already applied from `supabase/seed.sql`
- `VITE_SUPABASE_URL` (or `SUPABASE_URL`) in local env
- `SUPABASE_SERVICE_ROLE_KEY` in local env

Run:

```bash
pnpm --filter @autonomous-commerce-lab/admin-web seed:images
```

What it does:

- creates the `product-images` bucket if it does not already exist
- verifies the bucket is public, because storefront/admin image URLs are public URLs
- checks that the expected seeded product rows already exist before uploading anything
- uploads one generated SVG image per seeded product
- upserts matching rows into `public.product_images`
- removes the uploaded object if metadata insertion fails after upload

This script is intentionally separate from SQL seeding so database seed data stays lightweight while storage-backed image setup remains opt-in.

## Generate TypeScript DB types (storefront)

After schema changes, regenerate storefront Supabase types:

```bash
pnpm --filter @autonomous-commerce-lab/storefront-web types:db
```

Note: this command writes output with shell redirection (`>`), so use a Unix-like shell (macOS/Linux, WSL, or Git Bash).

## Add yourself to admin allowlist

After signing in once, find your user ID in the Supabase Dashboard (`Authentication -> Users`) and run this in the Supabase SQL Editor (privileged context) or another trusted server-side admin context:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

This allows your authenticated user to perform write operations protected by RLS.
