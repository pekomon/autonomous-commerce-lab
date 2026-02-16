create or replace function public.sync_product_categories(
  p_product_id uuid,
  p_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_category_ids uuid[];
begin
  if p_product_id is null then
    raise exception 'Product id is required.'
      using errcode = '23502';
  end if;

  if not public.is_admin_user() then
    raise exception 'You are not authorized to modify product categories.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct category_id), '{}'::uuid[])
  into normalized_category_ids
  from unnest(coalesce(p_category_ids, '{}'::uuid[])) as category_id
  where category_id is not null;

  delete from public.product_categories pc
  where pc.product_id = p_product_id
    and not (pc.category_id = any(normalized_category_ids));

  insert into public.product_categories (product_id, category_id)
  select p_product_id, category_id
  from unnest(normalized_category_ids) as category_id
  on conflict (product_id, category_id) do nothing;
end;
$$;

revoke all on function public.sync_product_categories(uuid, uuid[]) from public;
grant execute on function public.sync_product_categories(uuid, uuid[]) to authenticated;
