import { describe, expect, it } from 'vitest';

import {
  buildOrderItemCountMap,
  canTransitionOrderStatus,
  coerceOrderStatus,
  formatOrderAmount,
  mapOrderDbRowToSummary,
  mapOrderItemDbRow,
} from './orderMappers';

describe('coerceOrderStatus', () => {
  it('keeps valid statuses', () => {
    expect(coerceOrderStatus('created')).toBe('created');
    expect(coerceOrderStatus('fulfilled')).toBe('fulfilled');
    expect(coerceOrderStatus('cancelled')).toBe('cancelled');
  });

  it('falls back to created for unknown status', () => {
    expect(coerceOrderStatus('unknown')).toBe('created');
  });
});

describe('formatOrderAmount', () => {
  it('formats recognized currencies with Intl money format', () => {
    expect(formatOrderAmount(1250, 'EUR')).toBe('€12.50');
  });

  it('formats unknown currency with fallback format', () => {
    expect(formatOrderAmount(1250, 'SEK')).toBe('12.50 SEK');
  });
});

describe('buildOrderItemCountMap', () => {
  it('counts rows per order id', () => {
    const counts = buildOrderItemCountMap([
      { order_id: 'ord-1' },
      { order_id: 'ord-2' },
      { order_id: 'ord-1' },
    ]);

    expect(counts.get('ord-1')).toBe(2);
    expect(counts.get('ord-2')).toBe(1);
  });
});

describe('mapOrderDbRowToSummary', () => {
  it('maps DB row to summary shape', () => {
    const mapped = mapOrderDbRowToSummary(
      {
        id: 'ord-1',
        user_id: 'user-1',
        status: 'fulfilled',
        currency: 'EUR',
        total_amount: 4200,
        created_at: '2026-02-20T12:00:00.000Z',
      },
      3,
    );

    expect(mapped).toEqual({
      id: 'ord-1',
      userId: 'user-1',
      status: 'fulfilled',
      currency: 'EUR',
      totalAmount: 4200,
      createdAt: '2026-02-20T12:00:00.000Z',
      itemCount: 3,
    });
  });
});

describe('mapOrderItemDbRow', () => {
  it('uses product title map with fallback', () => {
    const row = {
      id: 'item-1',
      order_id: 'ord-1',
      product_id: 'prod-1',
      quantity: 2,
      unit_price_amount: 1500,
      line_total_amount: 3000,
      created_at: '2026-02-20T12:00:00.000Z',
    };

    const mapped = mapOrderItemDbRow(row, new Map([['prod-1', 'Coffee Beans']]));
    expect(mapped.productTitle).toBe('Coffee Beans');

    const fallback = mapOrderItemDbRow(row, new Map());
    expect(fallback.productTitle).toBe('Product prod-1');
  });
});

describe('canTransitionOrderStatus', () => {
  it('allows transitions from created to terminal states', () => {
    expect(canTransitionOrderStatus('created', 'fulfilled')).toBe(true);
    expect(canTransitionOrderStatus('created', 'cancelled')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(canTransitionOrderStatus('created', 'created')).toBe(false);
    expect(canTransitionOrderStatus('fulfilled', 'cancelled')).toBe(false);
    expect(canTransitionOrderStatus('cancelled', 'fulfilled')).toBe(false);
  });
});
