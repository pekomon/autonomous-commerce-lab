import { matchesProductQuery, type Product, type ProductStatus } from '@autonomous-commerce-lab/shared';

export type ProductStatusFilter = 'all' | ProductStatus;

export type ProductSortOption = 'newest' | 'priceLowToHigh' | 'priceHighToLow';

export interface CatalogFilters {
  query: string;
  status: ProductStatusFilter;
  sort: ProductSortOption;
}

export function filterAndSortProducts(products: Product[], filters: CatalogFilters): Product[] {
  const filtered = products.filter((product) => {
    const matchesQuery = matchesProductQuery(product, filters.query);
    const matchesStatus = filters.status === 'all' || product.status === filters.status;

    return matchesQuery && matchesStatus;
  });

  const sorted = [...filtered];

  if (filters.sort === 'priceLowToHigh') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'priceHighToLow') {
    sorted.sort((a, b) => b.price - a.price);
  } else {
    sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  return sorted;
}
