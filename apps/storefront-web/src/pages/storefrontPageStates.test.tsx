/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function buildProduct(id: string, title: string) {
  return {
    categoryIds: [],
    categoryNames: [],
    createdAt: '2026-02-15T10:00:00.000Z',
    currency: 'EUR' as const,
    description: '',
    id,
    price: 10,
    status: 'active' as const,
    tags: [],
    thumbnailUrl: null,
    title,
  };
}

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
    vi.useRealTimers();
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

  it('ProductDetailPage still shows the product when optional metadata requests fail', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    supabaseState.client = {};
    supabaseState.configError = null;

    storefrontApiMocks.fetchProductById.mockResolvedValue({
      createdAt: '2026-02-15T10:00:00.000Z',
      currency: 'EUR',
      description: 'A resilient product',
      id: 'prod-1',
      price: 10,
      status: 'active',
      tags: [],
      title: 'Alpha',
    });
    storefrontApiMocks.fetchProductImages.mockRejectedValueOnce(new Error('image load failed'));
    storefrontApiMocks.fetchProductCategoryIds.mockRejectedValueOnce(
      new Error('product category load failed'),
    );
    storefrontApiMocks.fetchCategories.mockRejectedValueOnce(new Error('category load failed'));

    renderProductDetailPage();

    expect(await screen.findByText('Alpha')).toBeTruthy();
    expect(screen.getByText('No image available')).toBeTruthy();
    expect(screen.queryByText('Unable to load product details. Please try again.')).toBeNull();

    warnSpy.mockRestore();
  });

  it('ProductsPage debounces search and sends only the latest query', async () => {
    supabaseState.client = {};
    supabaseState.configError = null;

    renderProductsPage();

    await waitFor(() => {
      expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(1);
    });

    vi.useFakeTimers();

    const input = screen.getByPlaceholderText('Search title, description, or tags');
    fireEvent.change(input, { target: { value: 'cam' } });
    fireEvent.change(input, { target: { value: 'camera' } });

    expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(storefrontApiMocks.fetchProducts).toHaveBeenCalledTimes(2);
    const latestParams = storefrontApiMocks.fetchProducts.mock.calls.at(-1)?.[1];
    expect(latestParams?.query).toBe('camera');
    expect(latestParams?.page).toBe(1);
  });

  it('ProductsPage prevents page skipping on rapid load more clicks', async () => {
    supabaseState.client = {};
    supabaseState.configError = null;

    let resolvePageTwo: ((value: typeof emptyProductsResult) => void) | null = null;
    storefrontApiMocks.fetchProducts.mockImplementation((_client, params) => {
      const currentPage = params.page ?? 1;

      if (currentPage === 1) {
        return Promise.resolve({
          hasMore: true,
          items: [buildProduct('prod-1', 'Alpha')],
          page: 1,
          pageSize: 20,
          total: 2,
        });
      }

      if (currentPage === 2) {
        return new Promise((resolve) => {
          resolvePageTwo = resolve;
        });
      }

      return Promise.resolve({
        hasMore: false,
        items: [buildProduct('prod-3', 'Gamma')],
        page: currentPage,
        pageSize: 20,
        total: 3,
      });
    });

    renderProductsPage();
    const loadMoreButton = await screen.findByRole('button', { name: 'Load more' });

    fireEvent.click(loadMoreButton);
    fireEvent.click(loadMoreButton);

    const requestedPages = storefrontApiMocks.fetchProducts.mock.calls.map(
      (call) => call[1].page ?? 1,
    );
    expect(requestedPages.filter((page) => page === 2)).toHaveLength(1);

    resolvePageTwo?.({
      hasMore: false,
      items: [buildProduct('prod-2', 'Beta')],
      page: 2,
      pageSize: 20,
      total: 2,
    });

    await waitFor(() => {
      expect(screen.getByText('2 product(s) found')).toBeTruthy();
    });
  });

  it('ProductsPage resets pagination when sort changes', async () => {
    supabaseState.client = {};
    supabaseState.configError = null;

    storefrontApiMocks.fetchProducts.mockImplementation((_client, params) => {
      const currentPage = params.page ?? 1;

      if (currentPage === 1) {
        return Promise.resolve({
          hasMore: true,
          items: [buildProduct('prod-1', 'Alpha')],
          page: 1,
          pageSize: 20,
          total: 2,
        });
      }

      return Promise.resolve({
        hasMore: false,
        items: [buildProduct('prod-2', 'Beta')],
        page: currentPage,
        pageSize: 20,
        total: 2,
      });
    });

    renderProductsPage();
    const loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      const pages = storefrontApiMocks.fetchProducts.mock.calls.map((call) => call[1].page ?? 1);
      expect(pages).toContain(2);
    });

    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'priceLowToHigh' } });

    await waitFor(() => {
      const latestParams = storefrontApiMocks.fetchProducts.mock.calls.at(-1)?.[1];
      expect(latestParams?.sort).toBe('priceLowToHigh');
      expect(latestParams?.page).toBe(1);
    });
  });
});
