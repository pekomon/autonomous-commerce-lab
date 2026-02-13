import { describe, expect, it } from 'vitest';

import { formatMoney } from './utils';

describe('formatMoney', () => {
  it('formats USD cents into a user-facing price string', () => {
    const price = formatMoney({ amountInCents: 2599, currency: 'USD' });

    expect(price).toBe('$25.99');
  });
});
