import { describe, expect, it } from 'vitest';

import { buildProductImagePath, mapProductImageRowToViewModel } from './productImages';

describe('buildProductImagePath', () => {
  it('builds path with product id, token, and sanitized filename', () => {
    const path = buildProductImagePath('prod-1', 'Coffee Mug (Large).PNG', 'token-123');

    expect(path).toBe('prod-1/token-123-coffee-mug-large.png');
  });

  it('falls back to generic filename when sanitized name is empty', () => {
    const path = buildProductImagePath('prod-1', '!!!', 'token-xyz');

    expect(path).toBe('prod-1/token-xyz-image');
  });
});

describe('mapProductImageRowToViewModel', () => {
  it('maps db row and public URL to view model shape', () => {
    const viewModel = mapProductImageRowToViewModel(
      {
        id: 'img-1',
        product_id: 'prod-1',
        path: 'prod-1/token-123-coffee.png',
        sort_order: 2,
        created_at: '2026-02-15T12:00:00.000Z',
      },
      'https://example.com/image.png',
    );

    expect(viewModel).toEqual({
      id: 'img-1',
      productId: 'prod-1',
      path: 'prod-1/token-123-coffee.png',
      sortOrder: 2,
      createdAt: '2026-02-15T12:00:00.000Z',
      publicUrl: 'https://example.com/image.png',
    });
  });
});
