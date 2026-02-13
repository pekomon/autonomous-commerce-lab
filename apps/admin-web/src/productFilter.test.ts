import type { Product } from '@autonomous-commerce-lab/shared';
import { describe, expect, it } from 'vitest';

import { filterProducts } from './productFilter';

const products: Product[] = [
  {
    id: 'p-001',
    name: 'Espresso Beans',
    sku: 'COF-ESP-001',
    active: true,
    price: { amountInCents: 1599, currency: 'USD' },
  },
  {
    id: 'p-002',
    name: 'Ceramic Mug',
    sku: 'MUG-CER-002',
    active: true,
    price: { amountInCents: 1299, currency: 'USD' },
  },
];

describe('filterProducts', () => {
  it('returns all products when query is empty', () => {
    expect(filterProducts('   ', products)).toEqual(products);
  });

  it('matches products by name or SKU (case-insensitive)', () => {
    expect(filterProducts('espresso', products)).toEqual([products[0]]);
    expect(filterProducts('mug-cer', products)).toEqual([products[1]]);
  });
});
