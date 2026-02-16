import { describe, expect, it } from 'vitest';

import {
  isNonEmptyCategoryName,
  isValidCategoryPayload,
  mapCategoryWriteInputToPayload,
  mapDbRowToCategory,
} from './categoryMappers';

describe('isNonEmptyCategoryName', () => {
  it('returns false for empty and whitespace-only values', () => {
    expect(isNonEmptyCategoryName('')).toBe(false);
    expect(isNonEmptyCategoryName('   ')).toBe(false);
  });

  it('returns true for non-empty names', () => {
    expect(isNonEmptyCategoryName('Coffee Beans')).toBe(true);
  });
});

describe('mapDbRowToCategory', () => {
  it('maps database row shape into shared Category model', () => {
    expect(
      mapDbRowToCategory({
        id: 'cat-1',
        slug: 'coffee-beans',
        name: 'Coffee Beans',
        created_at: '2026-02-17T12:00:00.000Z',
      }),
    ).toEqual({
      id: 'cat-1',
      slug: 'coffee-beans',
      name: 'Coffee Beans',
      createdAt: '2026-02-17T12:00:00.000Z',
    });
  });
});

describe('mapCategoryWriteInputToPayload', () => {
  it('normalizes slug and trims name', () => {
    expect(
      mapCategoryWriteInputToPayload({
        slug: '  Hot Drinks_Menu  ',
        name: '  Hot Drinks  ',
      }),
    ).toEqual({
      slug: 'hot-drinks-menu',
      name: 'Hot Drinks',
    });
  });
});

describe('isValidCategoryPayload', () => {
  it('returns true for valid slug and name', () => {
    expect(
      isValidCategoryPayload({
        slug: 'coffee-2026',
        name: 'Coffee 2026',
      }),
    ).toBe(true);
  });

  it('returns false for invalid slug', () => {
    expect(
      isValidCategoryPayload({
        slug: 'Coffee Menu',
        name: 'Coffee Menu',
      }),
    ).toBe(false);
  });

  it('returns false for empty name', () => {
    expect(
      isValidCategoryPayload({
        slug: 'coffee-menu',
        name: '   ',
      }),
    ).toBe(false);
  });
});
