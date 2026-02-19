# Feature 07: Orders (Dummy Checkout) + Cart in Storefront

## Goal

Implement a basic customer purchase flow (without payments):

- customer authentication
- local cart management
- checkout that creates `orders` and `order_items`
- customer order history and order detail pages

## Schema Summary

New Supabase tables:

- `public.orders`
  - `id uuid primary key default extensions.gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete restrict`
  - `status text not null check (status in ('created','cancelled','fulfilled'))`
  - `currency text not null default 'EUR'`
  - `total_amount integer not null check (total_amount >= 0)`
  - `created_at timestamptz not null default now()`
- `public.order_items`
  - `id uuid primary key default extensions.gen_random_uuid()`
  - `order_id uuid not null references public.orders(id) on delete cascade`
  - `product_id uuid not null references public.products(id) on delete restrict`
  - `quantity integer not null check (quantity > 0)`
  - `unit_price_amount integer not null check (unit_price_amount >= 0)`
  - `line_total_amount integer not null check (line_total_amount >= 0)`
  - `created_at timestamptz not null default now()`

Indexes:

- `orders(user_id, created_at desc)`
- `order_items(order_id)`
- `order_items(product_id)`

## RLS Summary

RLS is enabled for `orders` and `order_items`.

Customer policies:

- customers can insert orders only when `orders.user_id = auth.uid()`
- customers can select only their own orders
- customers can insert/select order items only when parent order belongs to `auth.uid()`

Admin policies:

- admin users can select all orders and order items
- admin users can update all orders and order items

## Scope Delivered

- Supabase migrations for order schema and RLS/grants.
- Storefront auth flow with `/login` and protected order routes.
- Cart stored in `localStorage` with quantity updates and remove support.
- Checkout flow:
  - fetches latest product data at checkout
  - computes totals client-side
  - inserts `orders` then `order_items`
  - clears cart and navigates to `/orders/:id`
- Customer order pages:
  - `/orders` (my orders)
  - `/orders/:id` (order detail / confirmation)
- Product detail page supports add-to-cart.

## Files Changed

- `supabase/migrations/20260219183000_create_orders_schema.sql`
- `supabase/migrations/20260219183100_enable_orders_rls_and_policies.sql`
- `apps/storefront-web/src/App.tsx`
- `apps/storefront-web/src/main.tsx`
- `apps/storefront-web/src/styles.css`
- `apps/storefront-web/src/auth/AuthProvider.tsx`
- `apps/storefront-web/src/auth/ProtectedRoute.tsx`
- `apps/storefront-web/src/components/StorefrontHeader.tsx`
- `apps/storefront-web/src/pages/LoginPage.tsx`
- `apps/storefront-web/src/pages/CartPage.tsx`
- `apps/storefront-web/src/pages/OrdersPage.tsx`
- `apps/storefront-web/src/pages/OrderDetailsPage.tsx`
- `apps/storefront-web/src/pages/ProductDetailPage.tsx`
- `apps/storefront-web/src/orders/ordersApi.ts`
- `apps/storefront-web/src/cart/CartProvider.tsx`
- `apps/storefront-web/src/cart/cartHelpers.ts`
- `apps/storefront-web/src/cart/cartHelpers.test.ts`
- `apps/storefront-web/src/data/database.types.ts`
- `apps/storefront-web/src/pages/storefrontPageStates.test.tsx`

## How to Test End-to-End Locally

1. Apply migrations to your linked Supabase project:

```bash
supabase db push
```

2. Ensure local env exists in repo root:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Start storefront app:

```bash
pnpm --filter @autonomous-commerce-lab/storefront-web dev
```

4. Test flow in browser:

- open `/products/:id`, add product to cart
- open `/cart`, adjust quantities, continue to checkout
- if not signed in, confirm redirect to `/login` and back
- sign in with email/password
- complete checkout
- verify redirect to `/orders/:id`
- verify order appears in `/orders`

## Tests Executed

- `pnpm --filter @autonomous-commerce-lab/storefront-web lint`
- `pnpm --filter @autonomous-commerce-lab/storefront-web test`
- `pnpm --filter @autonomous-commerce-lab/storefront-web build`
- full repo validation at completion:
  - `pnpm format:check`
  - `pnpm -r lint`
  - `pnpm -r test`
  - `pnpm -r build`

## Known Limitations

- Checkout currently performs `orders` insert and `order_items` insert as two client-side calls, not a single transactional RPC.
- No payment provider integration yet.
- No customer cancellation flow yet.
- Product title fallback in order details may show product ID when the product row is not readable.

## Known Follow-ups

- Move checkout write path to a single SQL RPC for transactional integrity and server-side total verification.
- Add payment integration and post-payment status transitions.
- Add customer cancellation and admin fulfillment workflows.
