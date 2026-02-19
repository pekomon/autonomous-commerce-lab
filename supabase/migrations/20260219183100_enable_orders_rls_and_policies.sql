grant select, insert, update on public.orders to authenticated;
grant select, insert, update on public.order_items to authenticated;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Customers can create only their own orders.
create policy "Customer insert own orders"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid());

-- Customers can read only orders they own.
create policy "Customer read own orders"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

-- Customers can add items only into orders they own.
create policy "Customer insert order items for own orders"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- Customers can read items only from their own orders.
create policy "Customer read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- Admins can inspect and maintain all orders and order_items.
create policy "Admin read all orders"
on public.orders
for select
to authenticated
using (public.is_admin_user());

create policy "Admin update all orders"
on public.orders
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "Admin read all order items"
on public.order_items
for select
to authenticated
using (public.is_admin_user());

create policy "Admin update all order items"
on public.order_items
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
