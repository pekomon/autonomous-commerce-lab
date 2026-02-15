import { supabase } from '../lib/supabaseClient';
import { computeCategoryAssignmentDiff } from './categoryAssignments';

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
  const currentCategoryIds = await fetchAssignedCategoryIds(productId);

  const { toInsert, toDelete } = computeCategoryAssignmentDiff(
    currentCategoryIds,
    normalizedNextCategoryIds,
  );

  if (toInsert.length > 0) {
    const insertPayload = toInsert.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId,
    }));

    const { error: insertError } = await supabase.from('product_categories').insert(insertPayload);

    if (insertError) {
      throw insertError;
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId)
      .in('category_id', toDelete);

    if (deleteError) {
      throw deleteError;
    }
  }
}
