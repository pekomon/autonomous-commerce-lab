# Feature 06: Customer Storefront Web (Read-only)

## Goal

Add a read-only storefront web app that consumes Supabase public catalog data directly and supports category browsing.

## What Was Added

- New app: `apps/storefront-web` (React + Vite + TypeScript).
- Routes:
  - `/` featured products
  - `/products` browse catalog with search, category filter, and sorting
  - `/products/:id` product detail page
- Centralized storefront data layer in `src/data/storefrontApi.ts`:
  - `fetchCategories()`
  - `fetchProducts({ query, categoryId, sort })`
  - `fetchProductById(id)`
  - `fetchProductImages(productId)`
  - `fetchProductCategoryIds(productId)`
- Product browse UX includes:
  - category dropdown (All + categories)
  - search input
  - sort dropdown (Newest, Price low-high, Price high-low)
  - image thumbnail, price, and category badges
- Product detail UX includes:
  - image gallery (main image + thumbnails)
  - title, price, description, tags, and categories
- Basic loading/error/empty states implemented.

## Runtime Config Strategy

This app uses a runtime config JSON approach so GitHub Pages builds do not require committed secrets.

Config files in `apps/storefront-web/public`:

- `config.example.json`: template file
- `config.json`: committed placeholder file with empty values

Expected shape:

```json
{
  "supabaseUrl": "",
  "supabaseAnonKey": ""
}
```

Config resolution order at runtime:

1. `public/config.json` values (if non-empty)
2. fallback to Vite env variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

If both sources are empty, the app shows a clear configuration message and does not crash.

## Local Development

1. Create/update local `.env.local` in repo root with:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

2. Install dependencies and run storefront dev server:

```bash
pnpm install
pnpm --filter @autonomous-commerce-lab/storefront-web dev
```

## GitHub Pages Deployment

Workflow added: `.github/workflows/storefront-pages.yml`

- Builds only `@autonomous-commerce-lab/storefront-web`
- Uploads pages artifact from `apps/storefront-web/dist`
- Deploys with `actions/deploy-pages`
- No secrets are required for the workflow itself

Notes:

- The deployed app will run with placeholder config unless runtime config values are provided.
- Until a final production key strategy is chosen, deployment is functional but may show configuration warning in production.

## Tests

- Added unit tests for pure sorting helper in `src/data/storefrontHelpers.test.ts`.

## Next Steps

- Add cart and checkout flow (Feature 07+).
- Add order creation flow after checkout is introduced.
- Improve browse performance with server-side filtering/pagination for larger catalogs.
