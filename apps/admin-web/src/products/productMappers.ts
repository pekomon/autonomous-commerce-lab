import type { CurrencyCode, Product, ProductStatus } from '@autonomous-commerce-lab/shared';

const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'EUR'];
const VALID_STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

export interface ProductDbRow {
  id: string;
  title: string;
  description: string | null;
  price_amount: number;
  currency: string;
  status: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWriteInput {
  title: string;
  description: string;
  priceAmount: number;
  currency: CurrencyCode;
  status: ProductStatus;
  tagsInput: string;
}

export interface ProductWritePayload {
  title: string;
  description: string;
  price_amount: number;
  currency: CurrencyCode;
  status: ProductStatus;
  tags: string[];
}

function coerceCurrency(value: string): CurrencyCode {
  if (VALID_CURRENCIES.includes(value as CurrencyCode)) {
    return value as CurrencyCode;
  }

  return 'EUR';
}

function coerceStatus(value: string): ProductStatus {
  if (VALID_STATUSES.includes(value as ProductStatus)) {
    return value as ProductStatus;
  }

  return 'draft';
}

export function parseTags(input: string): string[] {
  const uniqueTags = new Set(
    input
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
  );

  return [...uniqueTags];
}

export function mapDbRowToProduct(row: ProductDbRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: row.price_amount / 100,
    currency: coerceCurrency(row.currency),
    status: coerceStatus(row.status),
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

export function mapWriteInputToPayload(input: ProductWriteInput): ProductWritePayload {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    price_amount: input.priceAmount,
    currency: input.currency,
    status: input.status,
    tags: parseTags(input.tagsInput),
  };
}
