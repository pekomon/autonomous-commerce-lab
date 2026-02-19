import type { StorefrontSupabaseClient } from '../lib/supabaseClient';
import {
  buildOrderDraft,
  normalizeCartItems,
  type CartItem,
  type CheckoutProductSnapshot,
} from '../cart/cartHelpers';
import type { Database } from '../data/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

const CHECKOUT_PRODUCT_SELECT = 'id,title,price_amount,currency,status';
const ORDER_SELECT = 'id,user_id,status,currency,total_amount,created_at';
const ORDER_ITEM_SELECT =
  'id,order_id,product_id,quantity,unit_price_amount,line_total_amount,created_at';

export interface OrderSummary {
  id: string;
  userId: string;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderItemSummary {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPriceAmount: number;
  lineTotalAmount: number;
  createdAt: string;
}

export interface OrderDetails extends OrderSummary {
  items: OrderItemSummary[];
}

function mapProductRowToCheckoutSnapshot(
  row: Pick<ProductRow, 'id' | 'title' | 'price_amount' | 'currency' | 'status'>,
): CheckoutProductSnapshot {
  return {
    id: row.id,
    title: row.title,
    priceAmount: row.price_amount,
    currency: row.currency,
    status: row.status,
  };
}

function mapOrderRowToSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    currency: row.currency,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}

function mapOrderItemRows(
  rows: OrderItemRow[],
  productTitleById: ReadonlyMap<string, string>,
): OrderItemSummary[] {
  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productTitle: productTitleById.get(row.product_id) ?? `Product ${row.product_id}`,
    quantity: row.quantity,
    unitPriceAmount: row.unit_price_amount,
    lineTotalAmount: row.line_total_amount,
    createdAt: row.created_at,
  }));
}

export function toOrderErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unable to complete the order. Please try again.';
  }

  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'You are not authorized to complete this action.';
  }

  if (message.includes('Cart is empty')) {
    return 'Your cart is empty.';
  }

  if (message.includes('share one currency')) {
    return 'Cart items use mixed currencies. Keep one currency to checkout.';
  }

  if (message.includes('not available for checkout')) {
    return 'Some products are no longer available for checkout.';
  }

  return message || 'Unable to complete the order. Please try again.';
}

export async function fetchCheckoutProducts(
  client: StorefrontSupabaseClient,
  productIds: string[],
): Promise<CheckoutProductSnapshot[]> {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));

  if (uniqueProductIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('products')
    .select(CHECKOUT_PRODUCT_SELECT)
    .in('id', uniqueProductIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapProductRowToCheckoutSnapshot(row));
}

export async function createOrderFromCart(
  client: StorefrontSupabaseClient,
  cartItems: CartItem[],
): Promise<string> {
  const normalizedItems = normalizeCartItems(cartItems);

  if (normalizedItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const products = await fetchCheckoutProducts(
    client,
    normalizedItems.map((item) => item.productId),
  );

  // Local pre-checks keep UX fast; server RPC re-validates with transactional writes.
  buildOrderDraft(normalizedItems, products);

  const checkoutItemsPayload = normalizedItems.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const { data, error } = await client.rpc('checkout_create_order', {
    p_items: checkoutItemsPayload,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Checkout did not return an order id.');
  }

  return data;
}

export async function fetchMyOrders(
  client: StorefrontSupabaseClient,
  userId: string,
): Promise<OrderSummary[]> {
  const { data, error } = await client
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapOrderRowToSummary(row));
}

export async function fetchMyOrderDetails(
  client: StorefrontSupabaseClient,
  userId: string,
  orderId: string,
): Promise<OrderDetails | null> {
  const { data: orderRow, error: orderError } = await client
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  if (!orderRow) {
    return null;
  }

  const { data: orderItemRows, error: orderItemsError } = await client
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
    const { data: productRows, error: productError } = await client
      .from('products')
      .select('id,title')
      .in('id', productIds);

    if (productError) {
      throw productError;
    }

    for (const product of productRows ?? []) {
      productTitleById.set(product.id, product.title);
    }
  }

  return {
    ...mapOrderRowToSummary(orderRow),
    items: mapOrderItemRows(orderItemRows ?? [], productTitleById),
  };
}
