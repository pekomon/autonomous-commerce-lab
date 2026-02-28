# Feature 10: UX Hardening Baseline

## Summary

This feature improves baseline UX resilience in both web apps by standardizing loading, error, and empty states, plus adding root-level error boundaries.

Changes include:

- New reusable UI primitives in both apps:
  - `LoadingState`
  - `ErrorState` (with optional Retry action)
  - `EmptyState`
- Root `AppErrorBoundary` in both apps with a friendly fallback UI and a `Reload page` button.
- Friendly Supabase auth error mapping through shared helper:
  - `packages/shared/src/authErrors.ts`
- Page-level state handling updates for key routes in scope.

## Updated Pages

### Storefront (`apps/storefront-web`)

- `/products` (`ProductsPage`)
  - Added clear loading/error/empty handling
  - Added retry actions for categories and products fetch failures
- `/products/:id` (`ProductDetailPage`)
  - Added loading/error/not-found states
  - Added retry for load failures
- `/orders` (`OrdersPage`)
  - Added loading/error/empty states
  - Added retry for load failures
- `/orders/:id` (`OrderDetailsPage`)
  - Added loading/error/not-found states
  - Added retry for load failures

### Admin (`apps/admin-web`)

- `/products` (`ProductsListPage`)
  - Added loading/error/empty states
  - Added retry for fetch failures
- `/products/new` and `/products/:id/edit` (`ProductFormPage`)
  - Added loading/error/not-found states for edit flow
  - Added empty-state guidance for image management in create flow
- `/categories` (`CategoriesPage`)
  - Added loading/error/empty states for category list
  - Added retry for list load failures
- `/orders` (`OrdersListPage`)
  - Added loading/error/empty states
  - Added retry for fetch failures
- `/orders/:id` (`OrderDetailsPage`)
  - Added loading/error/not-found states
  - Added retry for load failures
  - Added empty state for order-items table when there are no items

## Manual Verification

1. Run local checks:

```bash
./scripts/ci-local.sh
```

2. Verify storefront state handling:

```bash
pnpm --filter @autonomous-commerce-lab/storefront-web dev
```

- Open `/products`, `/products/:id`, `/orders`, `/orders/:id`.
- Confirm loading text appears during fetch.
- Confirm user-friendly error state appears on failures, with Retry button.
- Confirm empty state appears when no results are returned.

3. Verify admin state handling:

```bash
pnpm --filter @autonomous-commerce-lab/admin-web dev
```

- Open `/products`, `/products/new`, `/products/:id/edit`, `/categories`, `/orders`, `/orders/:id`.
- Confirm loading/error/empty states match expectations.
- Confirm retry actions reload data where applicable.

4. Verify root error boundaries:

- Trigger an unexpected runtime error (for example, temporary throw in a page component).
- Confirm fallback UI is shown with `Reload page` action in each app.

5. Verify auth message hygiene:

- Trigger common auth failures (bad credentials, rate limits, already-registered email).
- Confirm user-facing messages are helpful and do not expose raw internal backend error text.
