import { formatMoney, type Product, type ProductStatus } from '@autonomous-commerce-lab/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminHeader } from '../components/AdminHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { filterAndSortProducts, type ProductSortOption } from '../catalogLogic';
import { supabase } from '../lib/supabaseClient';
import { mapDbRowToProduct, type ProductDbRow } from '../products/productMappers';

type ProductStatusFilter = 'all' | ProductStatus;

const PRODUCT_SELECT =
  'id,title,description,price_amount,currency,status,tags,created_at,updated_at';

const STATUS_OPTIONS: ReadonlyArray<{ value: ProductStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS: ReadonlyArray<{ value: ProductSortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'priceLowToHigh', label: 'Price low - high' },
  { value: 'priceHighToLow', label: 'Price high - low' },
];

function isProductStatusFilter(value: string): value is ProductStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function isProductSortOption(value: string): value is ProductSortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function ProductsListPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProductStatusFilter>('all');
  const [sort, setSort] = useState<ProductSortOption>('newest');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .order('created_at', { ascending: false });

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError('Failed to load products from Supabase.');
        setProducts([]);
      } else {
        const mapped = (data ?? []).map((row) => mapDbRowToProduct(row as ProductDbRow));
        setProducts(mapped);
      }

      setLoading(false);
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const visibleProducts = useMemo(() => {
    return filterAndSortProducts(products, { query, status, sort });
  }, [products, query, sort, status]);

  return (
    <div className="app-shell">
      <AdminHeader
        subtitle="Catalog search, filtering, and sorting using Supabase data."
        title="Products (Admin)"
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
            Status
            <select
              onChange={(event) => {
                const value = event.target.value;
                if (isProductStatusFilter(value)) {
                  setStatus(value);
                }
              }}
              value={status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort
            <select
              onChange={(event) => {
                const value = event.target.value;
                if (isProductSortOption(value)) {
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

        {loading ? <LoadingState label="Loading products..." /> : null}

        {!loading && error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((current) => current + 1)}
            retryLabel="Retry"
            title="Unable to load products"
          />
        ) : null}

        {!loading && !error ? (
          <p className="results-count">{visibleProducts.length} product(s) found</p>
        ) : null}

        {!loading && !error && visibleProducts.length === 0 ? (
          <EmptyState
            description="Adjust the current filters or create a new product."
            title="No products match the current filters."
          />
        ) : null}

        {!loading && !error && visibleProducts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Price</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}`}>{product.title}</Link>
                  </td>
                  <td>{product.status}</td>
                  <td>{formatMoney(product.price, product.currency)}</td>
                  <td>{new Date(product.createdAt).toLocaleDateString('en-US')}</td>
                  <td>
                    <Link to={`/products/${product.id}/edit`}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
