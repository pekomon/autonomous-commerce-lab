/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const supabaseState = vi.hoisted(() => ({
  client: null as unknown,
  configError: 'Storefront configuration is missing.',
}));

const storefrontApiMocks = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  fetchProductById: vi.fn(),
  fetchProductCategoryIds: vi.fn(),
  fetchProductImages: vi.fn(),
  fetchProducts: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  loading: false,
  session: null,
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUpWithPassword: vi.fn(),
  user: null,
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

vi.mock('../data/storefrontApi', () => ({
  fetchCategories: storefrontApiMocks.fetchCategories,
  fetchProductById: storefrontApiMocks.fetchProductById,
  fetchProductCategoryIds: storefrontApiMocks.fetchProductCategoryIds,
  fetchProductImages: storefrontApiMocks.fetchProductImages,
  fetchProducts: storefrontApiMocks.fetchProducts,
}));

import { HomePage } from './HomePage';
import { ProductDetailPage } from './ProductDetailPage';
import { ProductsPage } from './ProductsPage';

const emptyProductsResult = {
  hasMore: false,
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
};

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

function renderProductsPage() {
  return render(
    <MemoryRouter future={routerFuture}>
      <ProductsPage />
    </MemoryRouter>,
  );
}

function renderProductDetailPage(path = '/products/prod-1') {
  return render(
    <MemoryRouter future={routerFuture} initialEntries={[path]}>
      <Routes>
        <Route element={<ProductDetailPage />} path="/products/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('storefront page states', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    supabaseState.client = null;
    supabaseState.configError = 'Storefront configuration is missing.';

    storefrontApiMocks.fetchCategories.mockResolvedValue([]);
    storefrontApiMocks.fetchProducts.mockResolvedValue(emptyProductsResult);
    storefrontApiMocks.fetchProductById.mockResolvedValue(null);
    storefrontApiMocks.fetchProductImages.mockResolvedValue([]);
    storefrontApiMocks.fetchProductCategoryIds.mockResolvedValue([]);
  });

  it('HomePage shows config guidance without empty catalog state when config is missing', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Storefront configuration is missing.')).toBeTruthy();
    expect(screen.getByText('Featured Products')).toBeTruthy();
    expect(screen.queryByText('No products available yet.')).toBeNull();
    expect(storefrontApiMocks.fetchProducts).not.toHaveBeenCalled();
  });

  it('ProductsPage shows config guidance without empty product results when config is missing', () => {
    renderProductsPage();

    expect(screen.getByText('Storefront configuration is missing.')).toBeTruthy();
    expect(screen.queryByText(/product\(s\) found/)).toBeNull();
    expect(screen.queryByText('No products found.')).toBeNull();
    expect(storefrontApiMocks.fetchCategories).not.toHaveBeenCalled();
    expect(storefrontApiMocks.fetchProducts).not.toHaveBeenCalled();
  });

  it('ProductsPage keeps category error visible even when products load successfully', async () => {
    supabaseState.client = {};
    supabaseState.configError = null;

    storefrontApiMocks.fetchCategories.mockRejectedValueOnce(new Error('category load failed'));
    storefrontApiMocks.fetchProducts.mockResolvedValueOnce(emptyProductsResult);

    renderProductsPage();

    await waitFor(() => {
      expect(storefrontApiMocks.fetchCategories).toHaveBeenCalledTimes(1);
      expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Unable to load categories.')).toBeTruthy();
    expect(await screen.findByText('0 product(s) found')).toBeTruthy();
    expect(screen.queryByText('Unable to load products. Please try again.')).toBeNull();
  });

  it('ProductsPage retries product fetch when retry button is clicked', async () => {
    supabaseState.client = {};
    supabaseState.configError = null;

    storefrontApiMocks.fetchCategories.mockResolvedValueOnce([]);
    storefrontApiMocks.fetchProducts
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(emptyProductsResult);

    renderProductsPage();

    expect(await screen.findByText('Unable to load products. Please try again.')).toBeTruthy();
    expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Retry products' }));

    await waitFor(() => {
      expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(2);
    });
  });

  it('ProductDetailPage shows config guidance without product not found state when config is missing', () => {
    renderProductDetailPage();

    expect(screen.getByText('Storefront configuration is missing.')).toBeTruthy();
    expect(screen.queryByText('Product not found.')).toBeNull();
    expect(storefrontApiMocks.fetchProductById).not.toHaveBeenCalled();
  });
});
