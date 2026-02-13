import type { Product } from '@autonomous-commerce-lab/shared';
import { describe, expect, it } from 'vitest';

import { filterAndSortProducts } from './catalogLogic';

const products: Product[] = [
  {
    id: '1',
    title: 'Espresso Beans',
    description: 'Dark roast coffee beans.',
    price: 16,
    currency: 'USD',
    status: 'active',
    tags: ['coffee', 'beans'],
    createdAt: '2026-02-11T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Ceramic Mug',
    description: 'Classic mug for hot drinks.',
    price: 10,
    currency: 'USD',
    status: 'draft',
    tags: ['drinkware', 'mug'],
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: '3',
    title: 'Reusable Bottle',
    description: 'Insulated stainless steel bottle.',
    price: 20,
    currency: 'USD',
    status: 'archived',
    tags: ['bottle', 'outdoor'],
    createdAt: '2026-02-09T10:00:00.000Z',
  },
];

describe('filterAndSortProducts', () => {
  it('search finds by title', () => {
    const result = filterAndSortProducts(products, {
      query: 'espresso',
      status: 'all',
      sort: 'newest',
    });

    expect(result.map((product) => product.id)).toEqual(['1']);
  });

  it('search finds by tags', () => {
    const result = filterAndSortProducts(products, {
      query: 'outdoor',
      status: 'all',
      sort: 'newest',
    });

    expect(result.map((product) => product.id)).toEqual(['3']);
  });

  it('status filter works', () => {
    const result = filterAndSortProducts(products, {
      query: '',
      status: 'draft',
      sort: 'newest',
    });

    expect(result.map((product) => product.id)).toEqual(['2']);
  });

  it('sorting by price works low to high', () => {
    const result = filterAndSortProducts(products, {
      query: '',
      status: 'all',
      sort: 'priceLowToHigh',
    });

    expect(result.map((product) => product.id)).toEqual(['2', '1', '3']);
  });

  it('sorting by price works high to low', () => {
    const result = filterAndSortProducts(products, {
      query: '',
      status: 'all',
      sort: 'priceHighToLow',
    });

    expect(result.map((product) => product.id)).toEqual(['3', '1', '2']);
  });

  it('newest sort uses createdAt descending', () => {
    const result = filterAndSortProducts(products, {
      query: '',
      status: 'all',
      sort: 'newest',
    });

    expect(result.map((product) => product.id)).toEqual(['1', '2', '3']);
  });
});
