/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const supabaseState = vi.hoisted(() => ({
  productsOrder: vi.fn(),
}));

const categoriesApiMocks = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const ordersApiMocks = vi.hoisted(() => ({
  fetchAdminOrders: vi.fn(),
  fetchAdminOrderDetails: vi.fn(),
  updateAdminOrderStatus: vi.fn(),
}));

vi.mock('../components/AdminHeader', () => ({
  AdminHeader: ({ title }: { title: string }) => (
    <header>
      <h1>{title}</h1>
    </header>
  ),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        order: () => {
          if (table === 'products') {
            return supabaseState.productsOrder();
          }

          throw new Error(`Unexpected table: ${table}`);
        },
      }),
    }),
  },
}));

vi.mock('../categories/categoriesApi', () => ({
  fetchCategories: categoriesApiMocks.fetchCategories,
  createCategory: categoriesApiMocks.createCategory,
  updateCategory: categoriesApiMocks.updateCategory,
  deleteCategory: categoriesApiMocks.deleteCategory,
}));

vi.mock('../orders/ordersApi', () => ({
  fetchAdminOrders: ordersApiMocks.fetchAdminOrders,
  fetchAdminOrderDetails: ordersApiMocks.fetchAdminOrderDetails,
  updateAdminOrderStatus: ordersApiMocks.updateAdminOrderStatus,
}));

import { CategoriesPage } from './CategoriesPage';
import { OrderDetailsPage } from './OrderDetailsPage';
import { OrdersListPage } from './OrdersListPage';
import { ProductsListPage } from './ProductsListPage';

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

function renderProductsListPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <ProductsListPage />
    </MemoryRouter>,
  );
}

function renderCategoriesPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <CategoriesPage />
    </MemoryRouter>,
  );
}

function renderOrdersListPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <OrdersListPage />
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

describe('admin page retry actions', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    categoriesApiMocks.createCategory.mockResolvedValue(undefined);
    categoriesApiMocks.updateCategory.mockResolvedValue(undefined);
    categoriesApiMocks.deleteCategory.mockResolvedValue(undefined);
    ordersApiMocks.updateAdminOrderStatus.mockResolvedValue('created');
  });

  it('ProductsListPage retries product fetch when retry is clicked', async () => {
    supabaseState.productsOrder
      .mockResolvedValueOnce({ data: null, error: { message: 'products failed' } })
      .mockResolvedValueOnce({ data: [], error: null });

    renderProductsListPage();

    await waitFor(() => {
      expect(supabaseState.productsOrder).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(supabaseState.productsOrder).toHaveBeenCalledTimes(2);
    });
  });

  it('CategoriesPage retries category fetch when retry is clicked', async () => {
    categoriesApiMocks.fetchCategories
      .mockRejectedValueOnce(new Error('categories failed'))
      .mockResolvedValueOnce([]);

    renderCategoriesPage();

    await waitFor(() => {
      expect(categoriesApiMocks.fetchCategories).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(categoriesApiMocks.fetchCategories).toHaveBeenCalledTimes(2);
    });
  });

  it('OrdersListPage retries order list fetch when retry is clicked', async () => {
    ordersApiMocks.fetchAdminOrders
      .mockRejectedValueOnce(new Error('orders failed'))
      .mockResolvedValueOnce([]);

    renderOrdersListPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchAdminOrders).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(ordersApiMocks.fetchAdminOrders).toHaveBeenCalledTimes(2);
    });
  });

  it('OrderDetailsPage retries detail fetch when retry is clicked', async () => {
    ordersApiMocks.fetchAdminOrderDetails
      .mockRejectedValueOnce(new Error('order details failed'))
      .mockResolvedValueOnce(null);

    renderOrderDetailsPage();

    await waitFor(() => {
      expect(ordersApiMocks.fetchAdminOrderDetails).toHaveBeenCalledTimes(1);
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(ordersApiMocks.fetchAdminOrderDetails).toHaveBeenCalledTimes(2);
    });
  });
});
