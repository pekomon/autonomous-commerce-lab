import type { Product } from './types';
import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  matchesProductQuery,
  normalizeCategorySlug,
  validateCategorySlug,
} from './utils';

const sampleProduct: Product = {
  id: 'prod-001',
  title: 'Cold Brew Coffee',
  description: 'Smooth coffee concentrate for iced drinks',
  price: 12.5,
  currency: 'USD',
  status: 'active',
  tags: ['coffee', 'cold', 'beverage'],
  createdAt: '2026-02-13T10:00:00.000Z',
};

describe('formatMoney', () => {
  it('formats amount using the provided currency', () => {
    expect(formatMoney(25.99, 'USD')).toBe('$25.99');
  });
});

describe('matchesProductQuery', () => {
  it('matches title text case-insensitively', () => {
    expect(matchesProductQuery(sampleProduct, 'cold brew')).toBe(true);
  });

  it('matches description text', () => {
    expect(matchesProductQuery(sampleProduct, 'iced drinks')).toBe(true);
  });

  it('matches tags and ignores extra query whitespace', () => {
    expect(matchesProductQuery(sampleProduct, '   coffee   cold  ')).toBe(true);
  });

  it('returns false when no terms are found', () => {
    expect(matchesProductQuery(sampleProduct, 'tea')).toBe(false);
  });
});

describe('normalizeCategorySlug', () => {
  it('normalizes casing, spaces, and underscores', () => {
    expect(normalizeCategorySlug('  Hot Drinks_Menu  ')).toBe('hot-drinks-menu');
  });

  it('removes unsupported characters and duplicate hyphens', () => {
    expect(normalizeCategorySlug('Tea & Coffee --- Specials!')).toBe('tea-coffee-specials');
  });
});

describe('validateCategorySlug', () => {
  it('accepts lowercase slugs with numbers and hyphens', () => {
    expect(validateCategorySlug('coffee-2026')).toBe(true);
  });

  it('rejects uppercase, spaces, and invalid separators', () => {
    expect(validateCategorySlug('Coffee')).toBe(false);
    expect(validateCategorySlug('coffee menu')).toBe(false);
    expect(validateCategorySlug('-coffee')).toBe(false);
    expect(validateCategorySlug('coffee-')).toBe(false);
    expect(validateCategorySlug('coffee--menu')).toBe(false);
  });
});
