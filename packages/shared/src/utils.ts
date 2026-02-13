import type { CurrencyCode, Product } from './types';

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function matchesProductQuery(product: Product, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const searchableText = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase();

  return terms.every((term) => searchableText.includes(term));
}
