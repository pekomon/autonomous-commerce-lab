update public.products
set title = concat('Untitled Product ', substr(id::text, 1, 8))
where length(btrim(title)) = 0;

alter table public.products
  add constraint products_title_not_blank
  check (length(btrim(title)) > 0);
