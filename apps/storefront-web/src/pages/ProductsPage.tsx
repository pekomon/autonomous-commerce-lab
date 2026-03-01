import type { Category } from '@autonomous-commerce-lab/shared';
import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { fetchCategories, fetchProducts, type StorefrontProductCard } from '../data/storefrontApi';
import { DEFAULT_PRODUCTS_PAGE_SIZE, type ProductSortOption } from '../data/storefrontHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
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
  const [queryInput, setQueryInput] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState<ProductSortOption>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoryReloadKey, setCategoryReloadKey] = useState(0);
  const [productsReloadKey, setProductsReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const previousFilterKeyRef = useRef('');
  const debouncedQuery = useDebouncedValue(queryInput, 300);
  const filterKey = `${debouncedQuery.trim().toLowerCase()}|${categoryId}|${sort}`;

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
    if (
      previousFilterKeyRef.current !== '' &&
      previousFilterKeyRef.current !== filterKey &&
      page !== 1
    ) {
      previousFilterKeyRef.current = filterKey;
      setProducts([]);
      setPage(1);
      setHasMore(false);
      setTotalResults(0);
      setProductsError(null);
      return;
    }

    previousFilterKeyRef.current = filterKey;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    let isMounted = true;

    async function loadProducts() {
      if (!client) {
        setLoadingProducts(false);
        setLoadingMore(false);
        return;
      }

      if (page === 1) {
        setLoadingProducts(true);
      } else {
        setLoadingMore(true);
      }
      setProductsError(null);

      try {
        const productResponse = await fetchProducts(client, {
          query: debouncedQuery,
          categoryId,
          sort,
          page,
          pageSize: DEFAULT_PRODUCTS_PAGE_SIZE,
        });

        if (!isMounted || requestIdRef.current !== requestId) {
          return;
        }

        setProducts((current) => {
          if (page === 1) {
            return productResponse.items;
          }

          const existingIds = new Set(current.map((product) => product.id));
          const newItems = productResponse.items.filter((product) => !existingIds.has(product.id));
          return [...current, ...newItems];
        });
        setHasMore(productResponse.hasMore);
        setTotalResults(productResponse.total);
      } catch {
        if (!isMounted || requestIdRef.current !== requestId) {
          return;
        }

        setProductsError('Unable to load products. Please try again.');
      } finally {
        if (isMounted && requestIdRef.current === requestId) {
          setLoadingProducts(false);
          setLoadingMore(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categoryId, client, debouncedQuery, filterKey, page, productsReloadKey, sort]);

  if (!client) {
    return (
      <div className="storefront-shell">
        <StorefrontHeader
          subtitle="Filter products by category, search terms, or price sorting."
          title="Browse Products"
        />

        <section>
          <ErrorState
            details="Add values to .env.local for local development, or provide public/config.json for runtime deployment config."
            message={configError ?? 'Storefront configuration is missing.'}
            title="Storefront configuration required"
          />
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
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search title, description, or tags"
              type="search"
              value={queryInput}
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

        {loadingCategories ? (
          <div aria-hidden="true" className="category-skeleton-row">
            <div className="skeleton-block skeleton-pill" />
            <div className="skeleton-block skeleton-pill" />
            <div className="skeleton-block skeleton-pill" />
          </div>
        ) : null}

        {categoryError ? (
          <ErrorState
            message={categoryError}
            onRetry={() => setCategoryReloadKey((current) => current + 1)}
            retryLabel="Retry categories"
            title="Category filters unavailable"
          />
        ) : null}

        {loadingProducts ? <ProductGridSkeleton /> : null}

        {!loadingProducts && productsError ? (
          <ErrorState
            message={productsError}
            onRetry={() => {
              setProducts([]);
              setPage(1);
              setProductsReloadKey((current) => current + 1);
            }}
            retryLabel="Retry products"
            title="Unable to load products"
          />
        ) : null}

        {!loadingProducts && !productsError ? <p>{totalResults} product(s) found</p> : null}

        {!loadingProducts && !productsError && products.length === 0 ? (
          <EmptyState
            description="Try changing your search terms, category filter, or sort order."
            title="No products found."
          />
        ) : null}

        {!loadingProducts && !productsError && products.length > 0 ? (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {loadingMore ? <ProductGridSkeleton count={3} /> : null}

            {!loadingMore && hasMore ? (
              <div className="pagination-actions">
                <button
                  className="secondary-button"
                  onClick={() => setPage((current) => current + 1)}
                  type="button"
                >
                  Load more
                </button>
              </div>
            ) : null}

            {!loadingMore && !hasMore ? (
              <p className="pagination-complete">You have reached the end of the results.</p>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
