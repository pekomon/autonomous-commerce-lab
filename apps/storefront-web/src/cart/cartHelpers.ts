export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CheckoutProductSnapshot {
  id: string;
  title: string;
  priceAmount: number;
  currency: string;
  status: string;
}

export interface OrderItemDraft {
  productId: string;
  quantity: number;
  unitPriceAmount: number;
  lineTotalAmount: number;
}

export interface OrderDraft {
  currency: string;
  totalAmount: number;
  items: OrderItemDraft[];
}

const CART_SCHEMA_VERSION = 1;

interface SerializedCartState {
  version: number;
  items: CartItem[];
}

function toPositiveInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const mergedByProductId = new Map<string, number>();

  for (const item of items) {
    const productId = item.productId?.trim();

    if (!productId) {
      continue;
    }

    const quantity = toPositiveInteger(item.quantity);

    if (quantity <= 0) {
      continue;
    }

    mergedByProductId.set(productId, (mergedByProductId.get(productId) ?? 0) + quantity);
  }

  return Array.from(mergedByProductId.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function serializeCartItems(items: CartItem[]): string {
  const payload: SerializedCartState = {
    version: CART_SCHEMA_VERSION,
    items: normalizeCartItems(items),
  };

  return JSON.stringify(payload);
}

export function deserializeCartItems(serialized: string | null): CartItem[] {
  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized) as SerializedCartState;

    if (parsed.version !== CART_SCHEMA_VERSION || !Array.isArray(parsed.items)) {
      return [];
    }

    return normalizeCartItems(parsed.items);
  } catch {
    return [];
  }
}

export function calculateCartTotalAmount(
  items: CartItem[],
  productsById: ReadonlyMap<string, CheckoutProductSnapshot>,
): number {
  return normalizeCartItems(items).reduce((total, item) => {
    const product = productsById.get(item.productId);

    if (!product || product.status !== 'active') {
      return total;
    }

    return total + product.priceAmount * item.quantity;
  }, 0);
}

export function buildOrderDraft(
  items: CartItem[],
  products: CheckoutProductSnapshot[],
): OrderDraft {
  const normalizedItems = normalizeCartItems(items);

  if (normalizedItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const draftItems: OrderItemDraft[] = [];

  for (const item of normalizedItems) {
    const product = productsById.get(item.productId);

    if (!product || product.status !== 'active') {
      throw new Error(`Product ${item.productId} is not available.`);
    }

    draftItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceAmount: product.priceAmount,
      lineTotalAmount: product.priceAmount * item.quantity,
    });
  }

  const currencies = new Set(
    draftItems.map((item) => productsById.get(item.productId)?.currency ?? ''),
  );

  if (currencies.size !== 1) {
    throw new Error('Checkout requires all cart items to use the same currency.');
  }

  const [currency] = Array.from(currencies);
  const totalAmount = draftItems.reduce((sum, item) => sum + item.lineTotalAmount, 0);

  return {
    currency,
    totalAmount,
    items: draftItems,
  };
}
