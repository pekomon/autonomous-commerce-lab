import { supabase } from '../lib/supabaseClient';

interface ProductCategoryRow {
  category_id: string;
}

export async function fetchAssignedCategoryIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('category_id')
    .eq('product_id', productId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => (row as ProductCategoryRow).category_id);
}

export async function syncProductCategoryAssignments(
  productId: string,
  nextCategoryIds: string[],
): Promise<void> {
  const normalizedNextCategoryIds = [...new Set(nextCategoryIds)];
  const { error } = await supabase.rpc('sync_product_categories', {
    p_product_id: productId,
    p_category_ids: normalizedNextCategoryIds,
  });

  if (error) {
    throw error;
  }
}
