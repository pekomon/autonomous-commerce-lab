import { describe, expect, it } from 'vitest';

import { sortProducts } from './storefrontHelpers';

const products = [
  {
    id: 'prod-1',
    title: 'Alpha',
    description: '',
    price: 10,
    currency: 'EUR' as const,
    status: 'active' as const,
    tags: [],
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'prod-2',
    title: 'Beta',
    description: '',
    price: 30,
    currency: 'EUR' as const,
    status: 'active' as const,
    tags: [],
    createdAt: '2026-02-17T10:00:00.000Z',
  },
  {
    id: 'prod-3',
    title: 'Gamma',
    description: '',
    price: 20,
    currency: 'EUR' as const,
    status: 'active' as const,
    tags: [],
    createdAt: '2026-02-16T10:00:00.000Z',
  },
];

describe('sortProducts', () => {
  it('sorts by newest first', () => {
    const sorted = sortProducts(products, 'newest');

    expect(sorted.map((item) => item.id)).toEqual(['prod-2', 'prod-3', 'prod-1']);
  });

  it('sorts by price low to high', () => {
    const sorted = sortProducts(products, 'priceLowToHigh');

    expect(sorted.map((item) => item.id)).toEqual(['prod-1', 'prod-3', 'prod-2']);
  });

  it('sorts by price high to low', () => {
    const sorted = sortProducts(products, 'priceHighToLow');

    expect(sorted.map((item) => item.id)).toEqual(['prod-2', 'prod-3', 'prod-1']);
  });
});
