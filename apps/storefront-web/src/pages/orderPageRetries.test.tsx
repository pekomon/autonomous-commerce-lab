/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const supabaseState = vi.hoisted(() => ({
  client: {} as unknown,
  configError: null as string | null,
}));

const authState = vi.hoisted(() => ({
  loading: false,
  session: null,
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUpWithPassword: vi.fn(),
  user: { id: 'user-1', email: 'customer@example.com' },
}));

const ordersApiMocks = vi.hoisted(() => ({
  fetchMyOrders: vi.fn(),
  fetchMyOrderDetails: vi.fn(),
  toOrderErrorMessage: vi.fn(),
}));

const cartState = vi.hoisted(() => ({
  addItem: vi.fn(),
  clear: vi.fn(),
  itemCount: 0,
  items: [],
  removeItem: vi.fn(),
  setQuantity: vi.fn(),
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
  fetchMyOrders: ordersApiMocks.fetchMyOrders,
  fetchMyOrderDetails: ordersApiMocks.fetchMyOrderDetails,
  toOrderErrorMessage: ordersApiMocks.toOrderErrorMessage,
}));

import { OrderDetailsPage } from './OrderDetailsPage';
import { OrdersPage } from './OrdersPage';

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

function renderOrdersPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <OrdersPage />
    </MemoryRouter>,
  );
}

function renderOrderDetailsPage(path = '/orders/order-1') {
  return render(
    <MemoryRouter future={routerFuture} initialEntries={[path]}>
      <Routes>
        <Route element={<OrderDetailsPage />} path="/orders/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('storefront order retry actions', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseState.client = {};
    supabaseState.configError = null;
    authState.user = { id: 'user-1', email: 'customer@example.com' };

    ordersApiMocks.toOrderErrorMessage.mockReturnValue('Unable to load orders. Please try again.');
  });

  it('OrdersPage retries order list fetch when retry is clicked', async () => {
    ordersApiMocks.fetchMyOrders
      .mockRejectedValueOnce(new Error('temporary orders failure'))
      .mockResolvedValueOnce([]);

    renderOrdersPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchMyOrders).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(ordersApiMocks.fetchMyOrders).toHaveBeenCalledTimes(2);
    });
  });

  it('OrderDetailsPage retries details fetch when retry is clicked', async () => {
    ordersApiMocks.fetchMyOrderDetails
      .mockRejectedValueOnce(new Error('temporary order details failure'))
      .mockResolvedValueOnce(null);

    renderOrderDetailsPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchMyOrderDetails).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(ordersApiMocks.fetchMyOrderDetails).toHaveBeenCalledTimes(2);
    });
  });
});
