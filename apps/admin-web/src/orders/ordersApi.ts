import { supabase } from '../lib/supabaseClient';
import {
  buildOrderItemCountMap,
  canTransitionOrderStatus,
  mapOrderDbRowToSummary,
  mapOrderItemDbRow,
  type AdminOrderDetails,
  type AdminOrderSummary,
  type OrderDbRow,
  type OrderItemDbRow,
  type OrderStatus,
} from './orderMappers';

const ORDER_SELECT = 'id,user_id,status,currency,total_amount,created_at';
const ORDER_ITEM_SELECT =
  'id,order_id,product_id,quantity,unit_price_amount,line_total_amount,created_at';

export async function fetchAdminOrders(): Promise<AdminOrderSummary[]> {
  const [{ data: orderRows, error: ordersError }, { data: orderItemRows, error: itemRowsError }] =
    await Promise.all([
      supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }),
      supabase.from('order_items').select('order_id'),
    ]);

  if (ordersError) {
    throw ordersError;
  }

  if (itemRowsError) {
    throw itemRowsError;
  }

  const itemCountsByOrderId = buildOrderItemCountMap(orderItemRows ?? []);

  return (orderRows ?? []).map((row) => {
    const itemCount = itemCountsByOrderId.get(row.id) ?? 0;
    return mapOrderDbRowToSummary(row as OrderDbRow, itemCount);
  });
}

export async function fetchAdminOrderDetails(orderId: string): Promise<AdminOrderDetails | null> {
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  if (!orderRow) {
    return null;
  }

  const { data: orderItemRows, error: orderItemsError } = await supabase
    .from('order_items')
    .select(ORDER_ITEM_SELECT)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (orderItemsError) {
    throw orderItemsError;
  }

  const productIds = Array.from(new Set((orderItemRows ?? []).map((item) => item.product_id)));
  const productTitleById = new Map<string, string>();

  if (productIds.length > 0) {
    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('id,title')
      .in('id', productIds);

    if (productsError) {
      throw productsError;
    }

    for (const row of productRows ?? []) {
      productTitleById.set(row.id, row.title);
    }
  }

  const mappedItems = (orderItemRows ?? []).map((row) =>
    mapOrderItemDbRow(row as OrderItemDbRow, productTitleById),
  );

  return {
    ...mapOrderDbRowToSummary(orderRow as OrderDbRow, mappedItems.length),
    items: mappedItems,
  };
}

export async function updateAdminOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): Promise<OrderStatus> {
  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    return currentStatus;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', orderId)
    .select('status')
    .single();

  if (error) {
    throw error;
  }

  return nextStatus === data.status ? nextStatus : currentStatus;
}
