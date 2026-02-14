alter table public.products
  add constraint products_title_not_blank
  check (length(btrim(title)) > 0);
