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

The seed is idempotent:

- categories and products use stable IDs and are upserted
- product-category links use `on conflict do nothing`
- sample products are mostly `active`, with one `draft` example
- product images are intentionally not seeded, so the storefront shows placeholders instead of broken storage URLs

Note: seed data does not create auth users or admin allowlist entries.

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
