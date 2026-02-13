import type { Product } from '@autonomous-commerce-lab/shared';

export function filterProducts(query: string, products: Product[]): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return products;
  }

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.sku.toLowerCase().includes(normalizedQuery)
    );
  });
}
