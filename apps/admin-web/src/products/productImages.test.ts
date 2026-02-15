import { describe, expect, it } from 'vitest';

import {
  buildProductImagePath,
  getProductImagePublicUrl,
  mapProductImageRowToViewModel,
  toProductImageErrorMessage,
} from './productImages';

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

describe('getProductImagePublicUrl', () => {
  it('returns public URL from storage client result', () => {
    const client = {
      storage: {
        from: () => ({
          getPublicUrl: () => ({
            data: {
              publicUrl: 'https://example.com/public/product-image.png',
            },
          }),
        }),
      },
    };

    expect(getProductImagePublicUrl(client, 'prod-1/token-image.png')).toBe(
      'https://example.com/public/product-image.png',
    );
  });
});

describe('toProductImageErrorMessage', () => {
  it('maps authorization errors to a friendly message', () => {
    expect(
      toProductImageErrorMessage({ code: '42501', message: 'permission denied for table' }),
    ).toBe('You are not authorized to manage product images.');
  });

  it('maps storage errors to a bucket guidance message', () => {
    expect(toProductImageErrorMessage({ message: 'storage bucket not found' })).toBe(
      'Image storage operation failed. Verify bucket and storage policies.',
    );
  });

  it('returns generic fallback for unknown errors', () => {
    expect(toProductImageErrorMessage({ message: 'unexpected failure' })).toBe(
      'Unable to process product image action. Please try again.',
    );
  });
});
