import { describe, expect, it } from 'vitest';

import { filterOrdersByStatus } from './orderLogic';

const orders = [
  {
    id: 'ord-1',
    userId: 'user-1',
    status: 'created' as const,
    currency: 'EUR',
    totalAmount: 1000,
    createdAt: '2026-02-20T10:00:00.000Z',
    itemCount: 1,
  },
  {
    id: 'ord-2',
    userId: 'user-2',
    status: 'fulfilled' as const,
    currency: 'EUR',
    totalAmount: 2000,
    createdAt: '2026-02-20T11:00:00.000Z',
    itemCount: 2,
  },
];

describe('filterOrdersByStatus', () => {
  it('returns all orders for all filter', () => {
    expect(filterOrdersByStatus(orders, 'all')).toEqual(orders);
  });

  it('filters by specific status', () => {
    expect(filterOrdersByStatus(orders, 'created').map((order) => order.id)).toEqual(['ord-1']);
    expect(filterOrdersByStatus(orders, 'fulfilled').map((order) => order.id)).toEqual(['ord-2']);
  });
});
