-- Add idempotency key support for retry-safe checkout.
alter table public.orders
  add column if not exists checkout_idempotency_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_checkout_idempotency_key_not_blank'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_checkout_idempotency_key_not_blank
      check (
        checkout_idempotency_key is null
        or length(btrim(checkout_idempotency_key)) > 0
      );
  end if;
end;
$$;

create unique index if not exists orders_user_checkout_idempotency_key_uidx
  on public.orders (user_id, checkout_idempotency_key)
  where checkout_idempotency_key is not null;

drop function if exists public.checkout_create_order(jsonb);

create or replace function public.checkout_create_order(
  p_items jsonb,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_existing_order_id uuid;
  v_idempotency_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_snapshot jsonb := '[]'::jsonb;
  v_item_count integer;
  v_missing_count integer;
  v_currency_count integer;
  v_total_amount integer;
  v_currency text;
  v_has_inactive boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  if v_idempotency_key is null then
    raise exception 'Checkout idempotency key is required.'
      using errcode = '22023';
  end if;

  select o.id
  into v_existing_order_id
  from public.orders o
  where o.user_id = v_user_id
    and o.checkout_idempotency_key = v_idempotency_key
  limit 1;

  if v_existing_order_id is not null then
    return v_existing_order_id;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Checkout items must be a JSON array.'
      using errcode = '22023';
  end if;

  with parsed as (
    select
      nullif(btrim(item->>'product_id'), '')::uuid as product_id,
      greatest(coalesce((item->>'quantity')::int, 0), 0) as quantity
    from jsonb_array_elements(p_items) as item
  ),
  normalized as (
    select product_id, sum(quantity)::int as quantity
    from parsed
    where product_id is not null
      and quantity > 0
    group by product_id
  ),
  priced as (
    select
      n.product_id,
      n.quantity,
      p.price_amount,
      p.currency,
      p.status
    from normalized n
    left join public.products p
      on p.id = n.product_id
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'product_id', product_id,
          'quantity', quantity,
          'unit_price_amount', price_amount,
          'currency', currency,
          'status', status
        )
      ) filter (where price_amount is not null),
      '[]'::jsonb
    ),
    count(*)::int,
    count(*) filter (where price_amount is null)::int,
    count(distinct currency) filter (where price_amount is not null)::int,
    coalesce(sum(quantity * price_amount), 0)::int,
    min(currency) filter (where price_amount is not null),
    coalesce(bool_or(status <> 'active') filter (where price_amount is not null), false)
  into
    v_snapshot,
    v_item_count,
    v_missing_count,
    v_currency_count,
    v_total_amount,
    v_currency,
    v_has_inactive
  from priced;

  if v_item_count = 0 then
    raise exception 'Cart is empty.'
      using errcode = '22023';
  end if;

  if v_missing_count > 0 then
    raise exception 'Some products no longer exist.'
      using errcode = '23503';
  end if;

  if v_has_inactive then
    raise exception 'Some products are not available for checkout.'
      using errcode = '22023';
  end if;

  if v_currency_count <> 1 then
    raise exception 'Cart items must share one currency.'
      using errcode = '22023';
  end if;

  begin
    insert into public.orders (user_id, status, currency, total_amount, checkout_idempotency_key)
    values (v_user_id, 'created', v_currency, v_total_amount, v_idempotency_key)
    returning id into v_order_id;
  exception
    when unique_violation then
      select o.id
      into v_existing_order_id
      from public.orders o
      where o.user_id = v_user_id
        and o.checkout_idempotency_key = v_idempotency_key
      limit 1;

      if v_existing_order_id is not null then
        return v_existing_order_id;
      end if;

      raise;
  end;

  insert into public.order_items (order_id, product_id, quantity, unit_price_amount, line_total_amount)
  select
    v_order_id,
    item.product_id,
    item.quantity,
    item.unit_price_amount,
    item.quantity * item.unit_price_amount
  from jsonb_to_recordset(v_snapshot) as item(
    product_id uuid,
    quantity integer,
    unit_price_amount integer,
    currency text,
    status text
  );

  return v_order_id;
end;
$$;

revoke all on function public.checkout_create_order(jsonb, text) from public;
grant execute on function public.checkout_create_order(jsonb, text) to authenticated;
