import type { Category } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';

import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProductCard } from '../components/ProductCard';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { fetchCategories, fetchProducts, type StorefrontProductCard } from '../data/storefrontApi';
import type { ProductSortOption } from '../data/storefrontHelpers';
import { useSupabase } from '../lib/SupabaseContext';

const SORT_OPTIONS: ReadonlyArray<{ value: ProductSortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'priceLowToHigh', label: 'Price low - high' },
  { value: 'priceHighToLow', label: 'Price high - low' },
];

function isSortOption(value: string): value is ProductSortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function ProductsPage() {
  const { client, configError } = useSupabase();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<StorefrontProductCard[]>([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState<ProductSortOption>('newest');

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoryReloadKey, setCategoryReloadKey] = useState(0);
  const [productsReloadKey, setProductsReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      if (!client) {
        setLoadingCategories(false);
        return;
      }

      setLoadingCategories(true);
      setCategoryError(null);

      try {
        const categoryRows = await fetchCategories(client);

        if (!isMounted) {
          return;
        }

        setCategories(categoryRows);
      } catch {
        if (!isMounted) {
          return;
        }

        setCategoryError('Unable to load categories.');
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categoryReloadKey, client]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      if (!client) {
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      setProductsError(null);

      try {
        const productRows = await fetchProducts(client, {
          query,
          categoryId,
          sort,
        });

        if (!isMounted) {
          return;
        }

        setProducts(productRows);
      } catch {
        if (!isMounted) {
          return;
        }

        setProductsError('Unable to load products. Please try again.');
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categoryId, client, productsReloadKey, query, sort]);

  if (!client) {
    return (
      <div className="storefront-shell">
        <StorefrontHeader
          subtitle="Filter products by category, search terms, or price sorting."
          title="Browse Products"
        />

        <section>
          <p className="error-message">{configError ?? 'Storefront configuration is missing.'}</p>
          <p>
            Add values to <code>.env.local</code> for local development, or provide
            <code> public/config.json</code> for runtime deployment config.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="storefront-shell">
      <StorefrontHeader
        subtitle="Filter products by category, search terms, or price sorting."
        title="Browse Products"
      />

      <section>
        <div className="controls">
          <label>
            Search
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, description, or tags"
              type="search"
              value={query}
            />
          </label>

          <label>
            Category
            <select
              disabled={loadingCategories}
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort
            <select
              onChange={(event) => {
                const value = event.target.value;
                if (isSortOption(value)) {
                  setSort(value);
                }
              }}
              value={sort}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingCategories ? <LoadingState label="Loading category filters..." /> : null}

        {categoryError ? (
          <ErrorState
            message={categoryError}
            onRetry={() => setCategoryReloadKey((current) => current + 1)}
            retryLabel="Retry categories"
            title="Category filters unavailable"
          />
        ) : null}

        {loadingProducts ? <LoadingState label="Loading products..." /> : null}

        {!loadingProducts && productsError ? (
          <ErrorState
            message={productsError}
            onRetry={() => setProductsReloadKey((current) => current + 1)}
            retryLabel="Retry products"
            title="Unable to load products"
          />
        ) : null}

        {!loadingProducts && !productsError ? <p>{products.length} product(s) found</p> : null}

        {!loadingProducts && !productsError && products.length === 0 ? (
          <EmptyState
            description="Try changing your search terms, category filter, or sort order."
            title="No products found."
          />
        ) : null}

        {!loadingProducts && !productsError && products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
