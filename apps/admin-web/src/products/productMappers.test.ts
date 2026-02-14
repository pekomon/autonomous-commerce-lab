import { describe, expect, it } from 'vitest';

import {
  isNonEmptyTitle,
  mapDbRowToProduct,
  mapWriteInputToPayload,
  parseTags,
} from './productMappers';

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

  it('falls back to EUR currency and draft status for unknown values', () => {
    const product = mapDbRowToProduct({
      id: 'prod-2',
      title: 'Unknown Values Product',
      description: null,
      price_amount: 900,
      currency: 'GBP',
      status: 'hidden',
      tags: null,
      created_at: '2026-02-14T11:00:00.000Z',
      updated_at: '2026-02-14T11:05:00.000Z',
    });

    expect(product.currency).toBe('EUR');
    expect(product.status).toBe('draft');
    expect(product.description).toBe('');
    expect(product.tags).toEqual([]);
  });
});

describe('mapWriteInputToPayload', () => {
  it('normalizes title and description by trimming whitespace', () => {
    const payload = mapWriteInputToPayload({
      title: '  Espresso Beans  ',
      description: '  Dark roast beans  ',
      priceAmount: 1599,
      currency: 'USD',
      status: 'active',
      tagsInput: 'coffee, beans',
    });

    expect(payload.title).toBe('Espresso Beans');
    expect(payload.description).toBe('Dark roast beans');
  });

  it('normalizes tags through parseTags', () => {
    const payload = mapWriteInputToPayload({
      title: 'Product',
      description: 'Desc',
      priceAmount: 100,
      currency: 'EUR',
      status: 'draft',
      tagsInput: 'a, b, a,   ,c',
    });

    expect(payload.tags).toEqual(['a', 'b', 'c']);
  });
});
