import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StorefrontSupabaseClient } from '../lib/supabaseClient';

interface QueryState {
  eqFilters: Record<string, unknown>;
  maybeSingle: boolean;
  orders: Array<{ ascending: boolean | undefined; column: string }>;
  selectClause: string | null;
  table: string;
}

type QueryResult = {
  data: any;
  error: unknown;
};

type QueryResolver = (state: QueryState) => QueryResult;

function createMockClient(resolvers: Record<string, QueryResolver>): StorefrontSupabaseClient {
  return {
    from(table: string) {
      const resolver = resolvers[table];

      if (!resolver) {
        throw new Error(`Missing resolver for table ${table}`);
      }

      const state: QueryState = {
        eqFilters: {},
        maybeSingle: false,
        orders: [],
        selectClause: null,
        table,
      };

      const execute = () => Promise.resolve(resolver(state));
      const query = {
        catch(onRejected: (reason: unknown) => unknown) {
          return execute().catch(onRejected);
        },
        eq(column: string, value: unknown) {
          state.eqFilters[column] = value;
          return query;
        },
        finally(onFinally: () => void) {
          return execute().finally(onFinally);
        },
        maybeSingle() {
          state.maybeSingle = true;
          return query;
        },
        order(column: string, options?: { ascending?: boolean }) {
          state.orders.push({ ascending: options?.ascending, column });
          return query;
        },
        select(selectClause: string) {
          state.selectClause = selectClause;
          return query;
        },
        then(
          onFulfilled?: (value: QueryResult) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return execute().then(onFulfilled, onRejected);
        },
      };

      return query;
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://cdn.example.test/${path}`,
              },
            };
          },
        };
      },
    },
  } as unknown as StorefrontSupabaseClient;
}

describe('fetchProducts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns products when optional metadata tables fail for the default filter', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchProducts } = await import('./storefrontApi');
    const client = createMockClient({
      categories: () => ({
        data: null,
        error: new Error('categories unavailable'),
      }),
      product_categories: () => ({
        data: null,
        error: new Error('product categories unavailable'),
      }),
      product_images: () => ({
        data: null,
        error: new Error('product images unavailable'),
      }),
      products: () => ({
        data: [
          {
            created_at: '2026-02-15T10:00:00.000Z',
            currency: 'EUR',
            description: 'A resilient product',
            id: 'prod-1',
            price_amount: 1299,
            status: 'active',
            tags: ['featured'],
            title: 'Resilient camera',
            updated_at: '2026-02-15T10:00:00.000Z',
          },
        ],
        error: null,
      }),
    });

    const result = await fetchProducts(client, {
      categoryId: 'all',
      query: '',
      sort: 'newest',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      categoryIds: [],
      categoryNames: [],
      id: 'prod-1',
      thumbnailUrl: null,
      title: 'Resilient camera',
    });
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it('fails when a category filter needs product-category mappings that are unavailable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchProducts } = await import('./storefrontApi');
    const client = createMockClient({
      categories: () => ({
        data: [
          {
            created_at: '2026-02-14T10:00:00.000Z',
            id: 'cat-1',
            name: 'Cameras',
            slug: 'cameras',
          },
        ],
        error: null,
      }),
      product_categories: () => ({
        data: null,
        error: new Error('product categories unavailable'),
      }),
      product_images: () => ({
        data: [],
        error: null,
      }),
      products: () => ({
        data: [
          {
            created_at: '2026-02-15T10:00:00.000Z',
            currency: 'EUR',
            description: 'A resilient product',
            id: 'prod-1',
            price_amount: 1299,
            status: 'active',
            tags: ['featured'],
            title: 'Resilient camera',
            updated_at: '2026-02-15T10:00:00.000Z',
          },
        ],
        error: null,
      }),
    });

    await expect(
      fetchProducts(client, {
        categoryId: 'cat-1',
        query: '',
        sort: 'newest',
      }),
    ).rejects.toThrow('Unable to load category mappings for filtered products.');
  });

  it('refetches instead of reusing a degraded cached result after optional metadata recovers', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchProducts } = await import('./storefrontApi');

    let categoriesCalls = 0;
    let productCategoriesCalls = 0;
    let productImagesCalls = 0;

    const client = createMockClient({
      categories: () => {
        categoriesCalls += 1;

        if (categoriesCalls === 1) {
          return {
            data: null,
            error: new Error('categories unavailable'),
          };
        }

        return {
          data: [
            {
              created_at: '2026-02-14T10:00:00.000Z',
              id: 'cat-1',
              name: 'Cameras',
              slug: 'cameras',
            },
          ],
          error: null,
        };
      },
      product_categories: () => {
        productCategoriesCalls += 1;

        if (productCategoriesCalls === 1) {
          return {
            data: null,
            error: new Error('product categories unavailable'),
          };
        }

        return {
          data: [
            {
              category_id: 'cat-1',
              product_id: 'prod-1',
            },
          ],
          error: null,
        };
      },
      product_images: () => {
        productImagesCalls += 1;

        if (productImagesCalls === 1) {
          return {
            data: null,
            error: new Error('product images unavailable'),
          };
        }

        return {
          data: [
            {
              created_at: '2026-02-15T10:00:00.000Z',
              id: 'img-1',
              path: 'products/prod-1/hero.jpg',
              product_id: 'prod-1',
              sort_order: 0,
            },
          ],
          error: null,
        };
      },
      products: () => ({
        data: [
          {
            created_at: '2026-02-15T10:00:00.000Z',
            currency: 'EUR',
            description: 'A resilient product',
            id: 'prod-1',
            price_amount: 1299,
            status: 'active',
            tags: ['featured'],
            title: 'Resilient camera',
            updated_at: '2026-02-15T10:00:00.000Z',
          },
        ],
        error: null,
      }),
    });

    const firstResult = await fetchProducts(client, {
      categoryId: 'all',
      query: '',
      sort: 'newest',
    });

    expect(firstResult.items[0]).toMatchObject({
      categoryIds: [],
      categoryNames: [],
      thumbnailUrl: null,
    });

    const secondResult = await fetchProducts(client, {
      categoryId: 'all',
      query: '',
      sort: 'newest',
    });

    expect(categoriesCalls).toBe(2);
    expect(productCategoriesCalls).toBe(2);
    expect(productImagesCalls).toBe(2);
    expect(secondResult.items[0]).toMatchObject({
      categoryIds: ['cat-1'],
      categoryNames: ['Cameras'],
      thumbnailUrl: 'https://cdn.example.test/products/prod-1/hero.jpg',
    });
  });
});
