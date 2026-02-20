import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ORDER_STATUS_CONFLICT_CODE } from './orderErrors';

const { eqMock, fromMock, maybeSingleMock, selectMock, updateMock } = vi.hoisted(() => ({
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  selectMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { updateAdminOrderStatus } from './ordersApi';

describe('updateAdminOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const chain = {
      eq: eqMock,
      select: selectMock,
    };

    fromMock.mockReturnValue({ update: updateMock });
    updateMock.mockReturnValue(chain);
    eqMock.mockImplementation(() => chain);
    selectMock.mockReturnValue({ maybeSingle: maybeSingleMock });
  });

  it('updates status only when current DB status matches expected current status', async () => {
    maybeSingleMock.mockResolvedValue({
      data: { status: 'fulfilled' },
      error: null,
    });

    const result = await updateAdminOrderStatus('ord-1', 'created', 'fulfilled');

    expect(result).toBe('fulfilled');
    expect(fromMock).toHaveBeenCalledWith('orders');
    expect(eqMock).toHaveBeenCalledWith('id', 'ord-1');
    expect(eqMock).toHaveBeenCalledWith('status', 'created');
  });

  it('throws a stale-state conflict when no row matches status guard', async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(updateAdminOrderStatus('ord-1', 'created', 'fulfilled')).rejects.toMatchObject({
      code: ORDER_STATUS_CONFLICT_CODE,
      message: 'Order status changed by another admin. Refresh and try again.',
    });
  });

  it('skips DB call when transition is invalid', async () => {
    const result = await updateAdminOrderStatus('ord-1', 'fulfilled', 'cancelled');

    expect(result).toBe('fulfilled');
    expect(fromMock).not.toHaveBeenCalled();
  });
});
