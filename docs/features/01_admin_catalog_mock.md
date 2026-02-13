# Feature 01: Admin Catalog UI with Mock Data

## Goal

Deliver a minimal admin catalog experience in `apps/admin-web` backed by local mock product data, with reusable search matching logic in `packages/shared`.

## Non-Goals

- No backend integration or persistence.
- No authentication or role management.
- No product create/update/delete forms yet.

## What Was Added

### Shared domain and query utility (`packages/shared`)

- Updated product domain model in `packages/shared/src/types.ts`:
  - `Product { id, title, description, price, currency, status, tags, createdAt }`
  - `ProductStatus = 'active' | 'draft' | 'archived'`
- Added `matchesProductQuery(product, query)` in `packages/shared/src/utils.ts`.
- Added unit tests in `packages/shared/src/utils.test.ts`.

### Admin catalog pages and routing (`apps/admin-web`)

- Added route structure in `apps/admin-web/src/App.tsx`:
  - `/products`
  - `/products/:id`
- Added mock catalog dataset (`apps/admin-web/src/mockProducts.ts`) with 12 products.
- Added list page (`apps/admin-web/src/pages/ProductsListPage.tsx`) including:
  - Search input (title/description/tags)
  - Status filter (All/Active/Draft/Archived)
  - Sort filter (Newest first, Price low-high, Price high-low)
  - Link to product details per row
- Added details page (`apps/admin-web/src/pages/ProductDetailsPage.tsx`) with title, status, price, tags, description, created date, and back link.
- Added pure filtering/sorting helper (`apps/admin-web/src/catalogLogic.ts`) reusing `matchesProductQuery` from shared.
- Added tests for list logic (`apps/admin-web/src/catalogLogic.test.ts`).

## How To Run Locally

```bash
pnpm install
pnpm --filter @autonomous-commerce-lab/admin-web dev
```

Open the app and use `/products` as the catalog list route.

## Test Coverage Notes

- Shared tests verify:
  - query match by title
  - query match by description
  - query match by tags
  - case-insensitive behavior
  - extra-whitespace tolerance in query
- Admin tests verify:
  - search finds by title
  - search finds by tags
  - status filter behavior
  - price sorting behavior

## Next Steps

Feature 02 will introduce Supabase schema, row-level security (RLS), and storage integration to replace mock data with persisted backend state.
