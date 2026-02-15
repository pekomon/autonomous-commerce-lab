-- Strengthen product_images metadata constraints for storage-backed image management.
alter table public.product_images
  alter column path set not null;

alter table public.product_images
  alter column sort_order set default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_images_path_not_blank'
      and conrelid = 'public.product_images'::regclass
  ) then
    alter table public.product_images
      add constraint product_images_path_not_blank
      check (length(btrim(path)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_images_sort_order_non_negative'
      and conrelid = 'public.product_images'::regclass
  ) then
    alter table public.product_images
      add constraint product_images_sort_order_non_negative
      check (sort_order >= 0);
  end if;
end;
$$;

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

-- Public read access for image metadata rows.
alter table public.product_images enable row level security;

drop policy if exists "Public read active product images" on public.product_images;
drop policy if exists "Admin read all product images" on public.product_images;
drop policy if exists "Admin insert product images" on public.product_images;
drop policy if exists "Admin update product images" on public.product_images;
drop policy if exists "Admin delete product images" on public.product_images;

create policy "Public read product images"
on public.product_images
for select
to anon, authenticated
using (true);

create policy "Admin insert product images"
on public.product_images
for insert
to authenticated
with check (public.is_admin_user());

create policy "Admin update product images"
on public.product_images
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "Admin delete product images"
on public.product_images
for delete
to authenticated
using (public.is_admin_user());

-- Storage object policies for the "product-images" bucket.
-- Bucket creation is performed manually in Supabase Dashboard.
drop policy if exists "Public read product-images objects" on storage.objects;
drop policy if exists "Admin upload product-images objects" on storage.objects;
drop policy if exists "Admin update product-images objects" on storage.objects;
drop policy if exists "Admin delete product-images objects" on storage.objects;

create policy "Public read product-images objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy "Admin upload product-images objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_admin_user()
);

create policy "Admin update product-images objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin_user()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin_user()
);

create policy "Admin delete product-images objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin_user()
);
