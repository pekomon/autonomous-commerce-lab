grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant select on public.product_images to anon, authenticated;

grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.product_categories to authenticated;
grant insert, update, delete on public.product_images to authenticated;

grant select, insert, delete on public.admin_users to authenticated;
revoke all on public.admin_users from anon;

create or replace function public.is_admin_user(candidate_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = candidate_user_id
  );
$$;

grant execute on function public.is_admin_user(uuid) to anon, authenticated;

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;

create policy "Public read products"
on public.products
for select
to anon, authenticated
using (true);

create policy "Public read categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Public read product categories"
on public.product_categories
for select
to anon, authenticated
using (true);

create policy "Public read product images"
on public.product_images
for select
to anon, authenticated
using (true);

create policy "Admin insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin insert categories"
on public.categories
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin update categories"
on public.categories
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin delete categories"
on public.categories
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin insert product categories"
on public.product_categories
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin update product categories"
on public.product_categories
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin delete product categories"
on public.product_categories
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin insert product images"
on public.product_images
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin update product images"
on public.product_images
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin delete product images"
on public.product_images
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

create policy "Admin read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin_user(auth.uid()));

create policy "Admin insert admin users"
on public.admin_users
for insert
to authenticated
with check (public.is_admin_user(auth.uid()));

create policy "Admin delete admin users"
on public.admin_users
for delete
to authenticated
using (public.is_admin_user(auth.uid()));
