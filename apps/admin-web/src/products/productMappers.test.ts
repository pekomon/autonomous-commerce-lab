import { describe, expect, it } from 'vitest';

import { isNonEmptyTitle, mapDbRowToProduct, parseTags } from './productMappers';

describe('parseTags', () => {
  it('parses comma-separated tags, trimming whitespace', () => {
    expect(parseTags('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  it('removes empty values and duplicates', () => {
    expect(parseTags('coffee, , coffee,  tea  , tea')).toEqual(['coffee', 'tea']);
  });
});

describe('isNonEmptyTitle', () => {
  it('returns false for empty or whitespace-only titles', () => {
    expect(isNonEmptyTitle('')).toBe(false);
    expect(isNonEmptyTitle('   ')).toBe(false);
  });

  it('returns true for non-empty titles', () => {
    expect(isNonEmptyTitle('Espresso Beans')).toBe(true);
  });
});

describe('mapDbRowToProduct', () => {
  it('maps database row shape into shared Product model', () => {
    const product = mapDbRowToProduct({
      id: 'prod-1',
      title: 'Espresso Beans',
      description: 'Dark roast',
      price_amount: 1599,
      currency: 'USD',
      status: 'active',
      tags: ['coffee', 'beans'],
      created_at: '2026-02-14T10:00:00.000Z',
      updated_at: '2026-02-14T10:05:00.000Z',
    });

    expect(product).toEqual({
      id: 'prod-1',
      title: 'Espresso Beans',
      description: 'Dark roast',
      price: 15.99,
      currency: 'USD',
      status: 'active',
      tags: ['coffee', 'beans'],
      createdAt: '2026-02-14T10:00:00.000Z',
    });
  });
});
