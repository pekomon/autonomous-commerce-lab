import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    rpc: rpcMock,
    from: vi.fn(),
  },
}));

import { syncProductCategoryAssignments } from './productCategoriesApi';

describe('syncProductCategoryAssignments', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('calls sync_product_categories RPC with deduplicated category ids', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await syncProductCategoryAssignments('prod-1', ['cat-a', 'cat-b', 'cat-a']);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('sync_product_categories', {
      p_product_id: 'prod-1',
      p_category_ids: ['cat-a', 'cat-b'],
    });
  });

  it('throws when RPC returns an error', async () => {
    const rpcError = {
      code: '42501',
      message: 'permission denied',
    };

    rpcMock.mockResolvedValue({ error: rpcError });

    await expect(syncProductCategoryAssignments('prod-1', ['cat-a'])).rejects.toBe(rpcError);
  });
});
