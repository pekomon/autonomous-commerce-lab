# Feature 05: Categories and Product Assignment

## Scope Delivered

- Added shared category domain type in `packages/shared`:
  - `Category { id, slug, name, createdAt }`
- Added shared category slug helpers:
  - `normalizeCategorySlug(input)`
  - `validateCategorySlug(slug)`
- Added admin category management page at `/categories`:
  - list categories
  - create category
  - edit category
  - delete category
- Added product-category assignment UI on product edit (`/products/:id/edit`):
  - fetches all categories and assigned categories for the product
  - checkbox-based select/unselect
  - persists assignments to `product_categories`
- Added a small admin data layer for category and product-category queries.

## Schema and Policy Assumptions

- Existing Supabase tables:
  - `categories`
  - `product_categories`
- Existing RLS model:
  - public read for category data
  - admin-only writes via `admin_users` allowlist

This feature does not add new migrations.

## Files Changed

- `packages/shared/src/types.ts`
- `packages/shared/src/utils.ts`
- `packages/shared/src/utils.test.ts`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/components/AdminHeader.tsx`
- `apps/admin-web/src/components/ProductCategoryAssignment.tsx`
- `apps/admin-web/src/pages/CategoriesPage.tsx`
- `apps/admin-web/src/pages/ProductFormPage.tsx`
- `apps/admin-web/src/categories/categoryAssignments.ts`
- `apps/admin-web/src/categories/categoryAssignments.test.ts`
- `apps/admin-web/src/categories/categoryErrors.ts`
- `apps/admin-web/src/categories/categoryMappers.ts`
- `apps/admin-web/src/categories/categoriesApi.ts`
- `apps/admin-web/src/categories/productCategoriesApi.ts`
- `docs/features/05_categories_assignment.md`

## Tests Executed

- `pnpm format:check`
- `pnpm -r lint`
- `pnpm -r test`
- `pnpm -r build`

## Known Follow-ups

- Add category search and pagination for larger catalogs.
- Add safer category delete UX (for example, explicit dependency warnings when products are assigned).
- Surface assigned categories on product details and list views.
- Feature 06 can use category assignments for storefront browsing and order flow entry points.
