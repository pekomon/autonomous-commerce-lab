# Feature 02: Supabase Foundation

## Goal

Establish a secure Supabase-backed foundation where schema is versioned as SQL migrations and row-level security (RLS) enforces:

- Public catalog reads
- Admin-only catalog writes via an allowlist table (`admin_users`)

Clients connect directly to Supabase; no separate backend service is introduced.

## Schema Overview

Migrations are stored in `supabase/migrations` and define:

- `products`
- `categories`
- `product_categories` (many-to-many)
- `product_images`
- `admin_users` (allowlist keyed by `auth.users.id`)

Also included:

- `pgcrypto` extension for UUID generation
- Indexes for status, created date, slugs, and image sort ordering
- Shared `set_updated_at` trigger for `products` and `categories`

## RLS Approach

RLS is enabled on:

- `products`
- `categories`
- `product_categories`
- `product_images`
- `admin_users`

Policy model:

- Public reads: `SELECT` allowed for catalog tables.
- Admin writes: `INSERT`/`UPDATE`/`DELETE` on catalog tables require user membership in `admin_users`.
- Admin table protection: `admin_users` read/insert/delete allowed only for admins.

## Developer Setup

1. Create local `.env.local` from `.env.example`.
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Optionally add local-only `SUPABASE_SERVICE_ROLE_KEY` (never commit).
4. Install and authenticate Supabase CLI.
5. Link local repo to remote project.
6. Apply migrations.

Command flow:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## How To Become Admin

After logging in once, get your user ID from Supabase Dashboard (`Authentication -> Users`) and run:

```sql
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

## Next Steps (Feature 03)

Feature 03 will implement admin product CRUD using this schema and policy foundation, including UI forms and direct Supabase mutations from `apps/admin-web`.
