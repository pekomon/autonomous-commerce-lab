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

## Add yourself to admin allowlist

After signing in once, find your user ID in the Supabase Dashboard (`Authentication -> Users`) and run this in the Supabase SQL Editor (privileged context) or another trusted server-side admin context:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

This allows your authenticated user to perform write operations protected by RLS.
