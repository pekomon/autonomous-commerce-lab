export type CurrencyCode = 'USD' | 'EUR';

export interface Money {
  amountInCents: number;
  currency: CurrencyCode;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: Money;
  active: boolean;
}
