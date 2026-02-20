import { formatMoney, type CurrencyCode } from '@autonomous-commerce-lab/shared';
import type { Database } from '../data/database.types';

export type OrderStatus = 'created' | 'cancelled' | 'fulfilled';
export type OrderStatusFilter = 'all' | OrderStatus;

export type OrderDbRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemDbRow = Database['public']['Tables']['order_items']['Row'];

export interface AdminOrderSummary {
  id: string;
  userId: string;
  status: OrderStatus;
  currency: string;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPriceAmount: number;
  lineTotalAmount: number;
  createdAt: string;
}

export interface AdminOrderDetails extends AdminOrderSummary {
  items: AdminOrderItem[];
}

const VALID_ORDER_STATUSES: OrderStatus[] = ['created', 'cancelled', 'fulfilled'];
const VALID_CURRENCY_CODES: CurrencyCode[] = ['EUR', 'USD'];

export function coerceOrderStatus(value: string): OrderStatus {
  if (VALID_ORDER_STATUSES.includes(value as OrderStatus)) {
    return value as OrderStatus;
  }

  return 'created';
}

export function formatOrderAmount(totalAmount: number, currency: string): string {
  if (VALID_CURRENCY_CODES.includes(currency as CurrencyCode)) {
    return formatMoney(totalAmount / 100, currency as CurrencyCode);
  }

  return `${(totalAmount / 100).toFixed(2)} ${currency}`;
}

export function mapOrderDbRowToSummary(row: OrderDbRow, itemCount: number): AdminOrderSummary {
  return {
    id: row.id,
    userId: row.user_id,
    status: coerceOrderStatus(row.status),
    currency: row.currency,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    itemCount,
  };
}

export function mapOrderItemDbRow(
  row: OrderItemDbRow,
  productTitleById: ReadonlyMap<string, string>,
): AdminOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productTitle: productTitleById.get(row.product_id) ?? `Product ${row.product_id}`,
    quantity: row.quantity,
    unitPriceAmount: row.unit_price_amount,
    lineTotalAmount: row.line_total_amount,
    createdAt: row.created_at,
  };
}

export function buildOrderItemCountMap(
  rows: Array<{ order_id: string }>,
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.order_id, (counts.get(row.order_id) ?? 0) + 1);
  }

  return counts;
}

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) {
    return false;
  }

  if (current !== 'created') {
    return false;
  }

  return next === 'fulfilled' || next === 'cancelled';
}
