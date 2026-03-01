import type { Product } from '@autonomous-commerce-lab/shared';

export type ProductSortOption = 'newest' | 'priceLowToHigh' | 'priceHighToLow';
export const DEFAULT_PRODUCTS_PAGE_SIZE = 20;

export interface ProductCacheKeyParams {
  query: string;
  categoryId: string;
  sort: ProductSortOption;
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  items: T[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
}

export function sortProducts<T extends Product>(products: T[], sort: ProductSortOption): T[] {
  const copy = [...products];

  if (sort === 'priceLowToHigh') {
    return copy.sort((a, b) => a.price - b.price);
  }

  if (sort === 'priceHighToLow') {
    return copy.sort((a, b) => b.price - a.price);
  }

  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function buildProductResultsCacheKey(params: ProductCacheKeyParams): string {
  return JSON.stringify({
    query: params.query.trim().toLowerCase(),
    categoryId: params.categoryId,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    items: items.slice(start, end),
    hasMore: end < items.length,
    total: items.length,
    page: safePage,
    pageSize: safePageSize,
  };
}
