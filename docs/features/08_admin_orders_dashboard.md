# Feature 08: Admin Orders Dashboard + Status Management

## Goal

Add order management to `apps/admin-web` so admins can:

- review all orders
- filter orders by status
- open order details and inspect items
- update order status to fulfilled or cancelled

## What Was Added

- New admin routes:
  - `/orders`
  - `/orders/:id`
- New orders data layer in admin app:
  - `fetchAdminOrders()`
  - `fetchAdminOrderDetails(orderId)`
  - `updateAdminOrderStatus(orderId, currentStatus, nextStatus)`
- New orders helpers:
  - mapping DB rows to view models
  - status transition guard
  - order amount formatting helper
  - status filter helper
- Admin navigation updated to include Orders.
- Storefront already displayed order status in `/orders` and `/orders/:id`; no additional storefront changes were required.

## RLS / Policy Notes

No new migration was required for this feature.

Current existing policies already cover required behavior:

- admins can `SELECT` all orders and order items
- admins can `UPDATE` orders
- customers can only `SELECT` their own orders and order items
- customers cannot update order status

Relevant existing migration:

- `supabase/migrations/20260219183100_enable_orders_rls_and_policies.sql`

## Files Changed

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/components/AdminHeader.tsx`
- `apps/admin-web/src/pages/OrdersListPage.tsx`
- `apps/admin-web/src/pages/OrderDetailsPage.tsx`
- `apps/admin-web/src/orders/ordersApi.ts`
- `apps/admin-web/src/orders/orderMappers.ts`
- `apps/admin-web/src/orders/orderLogic.ts`
- `apps/admin-web/src/orders/orderErrors.ts`
- `apps/admin-web/src/orders/ordersApi.test.ts`
- `apps/admin-web/src/orders/orderMappers.test.ts`
- `apps/admin-web/src/orders/orderLogic.test.ts`
- `apps/admin-web/src/data/database.types.ts`
- `apps/admin-web/src/lib/supabaseClient.ts`
- `docs/features/08_admin_orders_dashboard.md`

## Manual Test Checklist

1. Sign in to admin web as an allowlisted admin user.
2. Open `/orders` and verify orders are listed.
3. Change status filter between All/Created/Fulfilled/Cancelled.
4. Open one order detail page (`/orders/:id`).
5. Verify order header fields and item list render.
6. Click `Mark fulfilled` on a created order and verify success message + status update.
7. Click `Cancel order` on a created order and verify success message + status update.
8. Verify status action buttons are disabled after order reaches terminal state.
9. Open storefront `/orders` and `/orders/:id` as the customer and confirm latest status is visible.

## Tests Executed

- `pnpm --filter @autonomous-commerce-lab/admin-web lint`
- `pnpm --filter @autonomous-commerce-lab/admin-web test`
- `pnpm --filter @autonomous-commerce-lab/admin-web build`
- full repo validation at completion:
  - `pnpm format:check`
  - `pnpm -r lint`
  - `pnpm -r test`
  - `pnpm -r build`

## Known Follow-ups

- Add server-side pagination for `/orders` when volume grows.
- Add optional read-only admin customer/order timeline view.
- Add fulfillment metadata (fulfilled_at, fulfilled_by) in a future schema update.
