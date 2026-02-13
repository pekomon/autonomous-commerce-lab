import type { Money } from './types';

export function formatMoney(value: Money): string {
  const amount = value.amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: value.currency,
  }).format(amount);
}
