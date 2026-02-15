# Feature 04: Product Images via Supabase Storage

## Goal

Enable product image management with Supabase Storage so that:

- Public users can view product images without authentication.
- Only admin allowlisted users can upload, update, or delete product images.
- Admin UI can upload, list, preview, and delete product images tied to products.

## Scope Delivered

- Added storage-aware RLS and policy migration for `public.product_images` and `storage.objects` (bucket: `product-images`).
- Added admin-web image helper module for:
  - storage path generation
  - DB row to view model mapping
  - public URL generation via Supabase client
  - user-friendly image error messaging
- Added `ProductImagesManager` component and integrated it into:
  - product edit page (`/products/:id/edit`) with upload/delete controls
  - product details page (`/products/:id`) with read-only thumbnails
- Added unit tests for pure image helpers.

## Bucket and Storage Policy Setup (Manual)

Storage bucket provisioning is a manual Supabase Dashboard step.

1. Open Supabase Dashboard.
2. Go to `Storage`.
3. Create bucket `product-images`.
4. Set bucket visibility to `Public` (or keep private if your storage object `SELECT` policy allows public read).
5. Ensure storage object policies enforce:
   - public read for bucket `product-images`
   - admin-only insert/update/delete for bucket `product-images` using `public.is_admin_user()`

The SQL migration in this feature creates storage object policies on `storage.objects` for the `product-images` bucket. If your project has existing custom storage policies, review and reconcile policy names and conditions in Supabase Dashboard.

## DB Migration Summary

Migration added:

- `supabase/migrations/20260215202500_product_images_storage_policies.sql`

Highlights:

- Strengthens `public.product_images` constraints (`path` non-empty, non-negative `sort_order`).
- Ensures image ordering index exists on `(product_id, sort_order)`.
- Reconfigures `public.product_images` RLS policies:
  - public `SELECT`
  - admin-only `INSERT`/`UPDATE`/`DELETE` via `public.is_admin_user()`
- Adds `storage.objects` policies for bucket `product-images`:
  - public `SELECT`
  - admin-only `INSERT`/`UPDATE`/`DELETE`

## Admin UI Behavior

- Product edit page:
  - upload one or many image files
  - file uploaded to `product-images` bucket under path `<productId>/<uuid>-<sanitizedFileName>`
  - DB row inserted into `public.product_images` with appended `sort_order`
  - delete removes storage object, then deletes DB row
- Product details page:
  - loads and displays image thumbnails in read-only mode
- Error handling:
  - RLS/permission denials return a clear authorization message
  - storage failures return a bucket/policy guidance message
  - loading state shown while image rows are fetched

## Files Changed

- `apps/admin-web/src/components/ProductImagesManager.tsx`
- `apps/admin-web/src/pages/ProductDetailsPage.tsx`
- `apps/admin-web/src/pages/ProductFormPage.tsx`
- `apps/admin-web/src/products/productImages.ts`
- `apps/admin-web/src/products/productImages.test.ts`
- `apps/admin-web/src/styles.css`
- `supabase/migrations/20260215202500_product_images_storage_policies.sql`
- `docs/features/04_product_images_storage.md`

## Tests Executed

- `pnpm format:check`
- `pnpm -r lint`
- `pnpm -r test`
- `pnpm -r build`

## Known Limitations and Next Steps

- Image reordering is not implemented yet.
- Upload progress is not shown per file.
- No storefront image/gallery integration yet.
- Feature 05 should add customer-facing catalog rendering that consumes image URLs and category relationships.
