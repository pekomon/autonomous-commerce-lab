import { describe, expect, it } from 'vitest';

import {
  buildOrderDraft,
  calculateCartTotalAmount,
  deserializeCartItems,
  serializeCartItems,
  type CartItem,
  type CheckoutProductSnapshot,
} from './cartHelpers';

const sampleProducts: CheckoutProductSnapshot[] = [
  { id: 'prod-1', title: 'Alpha', priceAmount: 1000, currency: 'EUR', status: 'active' },
  { id: 'prod-2', title: 'Beta', priceAmount: 2500, currency: 'EUR', status: 'active' },
  { id: 'prod-3', title: 'Gamma', priceAmount: 3000, currency: 'EUR', status: 'archived' },
];

describe('serializeCartItems / deserializeCartItems', () => {
  it('round-trips items and normalizes quantity/product ids', () => {
    const items: CartItem[] = [
      { productId: ' prod-1 ', quantity: 1.8 },
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 0 },
    ];

    const serialized = serializeCartItems(items);
    const parsed = deserializeCartItems(serialized);

    expect(parsed).toEqual([{ productId: 'prod-1', quantity: 3 }]);
  });

  it('returns empty items for invalid payload', () => {
    expect(deserializeCartItems('not-json')).toEqual([]);
    expect(deserializeCartItems('{"version":2,"items":[]}')).toEqual([]);
  });
});

describe('calculateCartTotalAmount', () => {
  it('calculates total only for active products', () => {
    const items: CartItem[] = [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-3', quantity: 1 },
    ];

    const total = calculateCartTotalAmount(
      items,
      new Map(sampleProducts.map((product) => [product.id, product])),
    );

    expect(total).toBe(2000);
  });
});

describe('buildOrderDraft', () => {
  it('maps cart items to order payload with totals', () => {
    const draft = buildOrderDraft(
      [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ],
      sampleProducts,
    );

    expect(draft.currency).toBe('EUR');
    expect(draft.totalAmount).toBe(4500);
    expect(draft.items).toEqual([
      { productId: 'prod-1', quantity: 2, unitPriceAmount: 1000, lineTotalAmount: 2000 },
      { productId: 'prod-2', quantity: 1, unitPriceAmount: 2500, lineTotalAmount: 2500 },
    ]);
  });

  it('throws when a product is not active', () => {
    expect(() =>
      buildOrderDraft([{ productId: 'prod-3', quantity: 1 }], sampleProducts),
    ).toThrowError('Product prod-3 is not available.');
  });

  it('throws when cart contains mixed currencies', () => {
    const mixedCurrencyProducts: CheckoutProductSnapshot[] = [
      { id: 'prod-1', title: 'Alpha', priceAmount: 1000, currency: 'EUR', status: 'active' },
      { id: 'prod-4', title: 'Delta', priceAmount: 1500, currency: 'USD', status: 'active' },
    ];

    expect(() =>
      buildOrderDraft(
        [
          { productId: 'prod-1', quantity: 1 },
          { productId: 'prod-4', quantity: 1 },
        ],
        mixedCurrencyProducts,
      ),
    ).toThrowError('Checkout requires all cart items to use the same currency.');
  });
});
