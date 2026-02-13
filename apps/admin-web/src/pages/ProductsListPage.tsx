import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  filterAndSortProducts,
  type ProductSortOption,
  type ProductStatusFilter,
} from '../catalogLogic';
import { mockProducts } from '../mockProducts';

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

  const visibleProducts = useMemo(() => {
    return filterAndSortProducts(mockProducts, { query, status, sort });
  }, [query, status, sort]);

  return (
    <div className="app-shell">
      <header>
        <h1>Products (Admin)</h1>
        <p>Catalog search, filtering, and sorting using mock data.</p>
      </header>

      <section>
        <div className="controls">
          <label>
            Search
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, description, or tags"
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                if (isProductStatusFilter(value)) {
                  setStatus(value);
                }
              }}
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
              value={sort}
              onChange={(event) => {
                const value = event.target.value;
                if (isProductSortOption(value)) {
                  setSort(value);
                }
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="results-count">{visibleProducts.length} product(s) found</p>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Price</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 ? (
              <tr>
                <td className="empty-state" colSpan={4}>
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/products/${product.id}`}>{product.title}</Link>
                  </td>
                  <td>{product.status}</td>
                  <td>{formatMoney(product.price, product.currency)}</td>
                  <td>{new Date(product.createdAt).toLocaleDateString('en-US')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
