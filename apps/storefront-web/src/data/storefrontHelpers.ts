import type { Product } from '@autonomous-commerce-lab/shared';

export type ProductSortOption = 'newest' | 'priceLowToHigh' | 'priceHighToLow';

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
