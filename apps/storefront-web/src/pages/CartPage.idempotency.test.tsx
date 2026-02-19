/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const supabaseState = vi.hoisted(() => ({
  client: {} as unknown,
  configError: null as string | null,
}));

const authState = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'customer@example.com' },
}));

const cartState = vi.hoisted(() => ({
  clear: vi.fn(),
  items: [{ productId: 'prod-1', quantity: 1 }],
  itemCount: 1,
  removeItem: vi.fn(),
  setQuantity: vi.fn(),
}));

const ordersApiMocks = vi.hoisted(() => ({
  createCheckoutIdempotencyKey: vi.fn(),
  createOrderFromCart: vi.fn(),
  fetchCheckoutProducts: vi.fn(),
  toOrderErrorMessage: vi.fn(),
}));

vi.mock('../lib/SupabaseContext', () => ({
  useSupabase: () => supabaseState,
}));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.mock('../cart/CartProvider', () => ({
  useCart: () => cartState,
}));

vi.mock('../orders/ordersApi', () => ({
  createCheckoutIdempotencyKey: ordersApiMocks.createCheckoutIdempotencyKey,
  createOrderFromCart: ordersApiMocks.createOrderFromCart,
  fetchCheckoutProducts: ordersApiMocks.fetchCheckoutProducts,
  toOrderErrorMessage: ordersApiMocks.toOrderErrorMessage,
}));

import { CartPage } from './CartPage';

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

function renderCartPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <CartPage />
    </MemoryRouter>,
  );
}

describe('CartPage checkout idempotency lifecycle', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    supabaseState.client = {};
    supabaseState.configError = null;

    authState.user = { id: 'user-1', email: 'customer@example.com' };

    cartState.items = [{ productId: 'prod-1', quantity: 1 }];
    cartState.itemCount = 1;

    ordersApiMocks.fetchCheckoutProducts.mockResolvedValue([
      {
        id: 'prod-1',
        title: 'Sample Product',
        priceAmount: 1299,
        currency: 'EUR',
        status: 'active',
      },
    ]);

    ordersApiMocks.toOrderErrorMessage.mockImplementation((error: unknown) => {
      return error instanceof Error ? error.message : 'Checkout failed';
    });
  });

  it('reuses the same key when retrying checkout for unchanged cart', async () => {
    ordersApiMocks.createCheckoutIdempotencyKey.mockReturnValue('key-1');
    ordersApiMocks.createOrderFromCart.mockRejectedValue(new Error('temporary failure'));

    renderCartPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchCheckoutProducts).toHaveBeenCalled();
    });

    const checkoutButton = await screen.findByRole('button', { name: 'Checkout' });

    fireEvent.click(checkoutButton);
    await waitFor(() => {
      expect(ordersApiMocks.createOrderFromCart).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(checkoutButton);
    await waitFor(() => {
      expect(ordersApiMocks.createOrderFromCart).toHaveBeenCalledTimes(2);
    });

    expect(ordersApiMocks.createCheckoutIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(ordersApiMocks.createOrderFromCart.mock.calls[0][2]).toBe('key-1');
    expect(ordersApiMocks.createOrderFromCart.mock.calls[1][2]).toBe('key-1');
  });

  it('generates a new key after cart items change', async () => {
    ordersApiMocks.createCheckoutIdempotencyKey
      .mockReturnValueOnce('key-1')
      .mockReturnValueOnce('key-2');
    ordersApiMocks.createOrderFromCart.mockRejectedValue(new Error('temporary failure'));

    const view = renderCartPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchCheckoutProducts).toHaveBeenCalledTimes(1);
    });

    const checkoutButton = await screen.findByRole('button', { name: 'Checkout' });

    fireEvent.click(checkoutButton);
    await waitFor(() => {
      expect(ordersApiMocks.createOrderFromCart).toHaveBeenCalledTimes(1);
    });

    cartState.items = [{ productId: 'prod-1', quantity: 2 }];
    cartState.itemCount = 2;

    view.rerender(
      <MemoryRouter future={routerFuture}>
        <CartPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(ordersApiMocks.fetchCheckoutProducts).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Checkout' }));
    await waitFor(() => {
      expect(ordersApiMocks.createOrderFromCart).toHaveBeenCalledTimes(2);
    });

    expect(ordersApiMocks.createCheckoutIdempotencyKey).toHaveBeenCalledTimes(2);
    expect(ordersApiMocks.createOrderFromCart.mock.calls[0][2]).toBe('key-1');
    expect(ordersApiMocks.createOrderFromCart.mock.calls[1][2]).toBe('key-2');
  });
});
