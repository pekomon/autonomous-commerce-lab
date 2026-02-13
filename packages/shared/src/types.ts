export type CurrencyCode = 'USD' | 'EUR';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  status: ProductStatus;
  tags: string[];
  createdAt: string;
}
