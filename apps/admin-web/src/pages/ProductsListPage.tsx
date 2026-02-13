import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  filterAndSortProducts,
  type ProductSortOption,
  type ProductStatusFilter,
} from '../catalogLogic';
import { mockProducts } from '../mockProducts';

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
              onChange={(event) => setStatus(event.target.value as ProductStatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSortOption)}
            >
              <option value="newest">Newest first</option>
              <option value="priceLowToHigh">Price low - high</option>
              <option value="priceHighToLow">Price high - low</option>
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
            {visibleProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link to={`/products/${product.id}`}>{product.title}</Link>
                </td>
                <td>{product.status}</td>
                <td>{formatMoney(product.price, product.currency)}</td>
                <td>{new Date(product.createdAt).toLocaleDateString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
