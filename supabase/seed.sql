insert into public.categories (id, slug, name)
values
  ('11111111-1111-1111-1111-111111111111', 'coffee-beans', 'Coffee Beans'),
  ('22222222-2222-2222-2222-222222222222', 'brewing-gear', 'Brewing Gear'),
  ('33333333-3333-3333-3333-333333333333', 'espresso', 'Espresso'),
  ('44444444-4444-4444-4444-444444444444', 'subscriptions', 'Subscriptions')
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name;

insert into public.products (
  id,
  title,
  description,
  price_amount,
  currency,
  status,
  tags
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'House Blend Beans',
    'Balanced medium roast with cocoa and caramel notes for everyday filter coffee.',
    1290,
    'EUR',
    'active',
    array['house', 'filter', 'best-seller']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Single Origin Colombia',
    'Bright and sweet whole beans with citrus acidity and panela finish.',
    1490,
    'EUR',
    'active',
    array['single-origin', 'filter']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Espresso Roast',
    'Dense chocolate-forward roast designed for espresso and milk drinks.',
    1390,
    'EUR',
    'active',
    array['espresso', 'dark-roast']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'Stainless Pour Over Kettle',
    'Gooseneck kettle with precise pour control for manual brewing.',
    5490,
    'EUR',
    'active',
    array['gear', 'pour-over']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
    'Ceramic Dripper Set',
    'Starter dripper kit with dripper, server, and filters.',
    3290,
    'EUR',
    'active',
    array['gear', 'starter-kit']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
    'Monthly Roaster Subscription',
    'Recurring monthly delivery featuring a rotating seasonal coffee.',
    1890,
    'EUR',
    'active',
    array['subscription', 'recurring']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
    'Decaf Evening Blend',
    'Swiss water decaf with nutty sweetness and a clean finish.',
    1350,
    'EUR',
    'active',
    array['decaf', 'filter']::text[]
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
    'Experimental Nano Lot',
    'Limited release fruit-forward coffee reserved as a draft example product.',
    2190,
    'EUR',
    'draft',
    array['limited', 'experimental']::text[]
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  price_amount = excluded.price_amount,
  currency = excluded.currency,
  status = excluded.status,
  tags = excluded.tags;

insert into public.product_categories (product_id, category_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '11111111-1111-1111-1111-111111111111')
on conflict (product_id, category_id) do nothing;
