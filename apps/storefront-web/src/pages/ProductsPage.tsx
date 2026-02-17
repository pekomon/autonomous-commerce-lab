import type { Category } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      if (!client) {
        setLoadingCategories(false);
        return;
      }

      setLoadingCategories(true);

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

        setError('Unable to load categories.');
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
  }, [client]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      if (!client) {
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      setError(null);

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

        setError('Unable to load products. Please try again.');
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
  }, [categoryId, client, query, sort]);

  return (
    <div className="storefront-shell">
      <StorefrontHeader
        subtitle="Filter products by category, search terms, or price sorting."
        title="Browse Products"
      />

      {configError ? <p className="error-message">{configError}</p> : null}

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

        {loadingProducts ? <p>Loading products...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {!loadingProducts && !error ? <p>{products.length} product(s) found</p> : null}

        {!loadingProducts && !error && products.length === 0 ? <p>No products found.</p> : null}

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
