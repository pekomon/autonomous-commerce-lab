import type { AdminOrderSummary, OrderStatusFilter } from './orderMappers';

export function filterOrdersByStatus(
  orders: AdminOrderSummary[],
  status: OrderStatusFilter,
): AdminOrderSummary[] {
  if (status === 'all') {
    return orders;
  }

  return orders.filter((order) => order.status === status);
}
