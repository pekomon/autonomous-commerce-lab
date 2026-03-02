import { describe, expect, it } from 'vitest';

import { buildProductResultsCacheKey, paginateItems, sortProducts } from './storefrontHelpers';

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

describe('buildProductResultsCacheKey', () => {
  it('normalizes query input to a stable key', () => {
    const first = buildProductResultsCacheKey({
      query: '  Summer Hat  ',
      categoryId: 'all',
      sort: 'newest',
      page: 1,
      pageSize: 20,
    });
    const second = buildProductResultsCacheKey({
      query: 'summer hat',
      categoryId: 'all',
      sort: 'newest',
      page: 1,
      pageSize: 20,
    });

    expect(first).toBe(second);
  });

  it('changes key when page changes', () => {
    const pageOne = buildProductResultsCacheKey({
      query: 'coat',
      categoryId: 'all',
      sort: 'newest',
      page: 1,
      pageSize: 20,
    });
    const pageTwo = buildProductResultsCacheKey({
      query: 'coat',
      categoryId: 'all',
      sort: 'newest',
      page: 2,
      pageSize: 20,
    });

    expect(pageOne).not.toBe(pageTwo);
  });
});

describe('paginateItems', () => {
  it('returns page slices with hasMore metadata', () => {
    const result = paginateItems([1, 2, 3, 4, 5], 2, 2);

    expect(result.items).toEqual([3, 4]);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(5);
  });

  it('normalizes invalid pagination input', () => {
    const result = paginateItems([1, 2], 0, 0);

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.items).toEqual([1]);
  });
});
