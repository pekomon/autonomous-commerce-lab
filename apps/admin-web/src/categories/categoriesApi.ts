import type { Category } from '@autonomous-commerce-lab/shared';

import { supabase } from '../lib/supabaseClient';
import {
  isValidCategoryPayload,
  mapCategoryWriteInputToPayload,
  mapDbRowToCategory,
  type CategoryDbRow,
  type CategoryWriteInput,
} from './categoryMappers';

const CATEGORY_SELECT = 'id,slug,name,created_at';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapDbRowToCategory(row as CategoryDbRow));
}

export async function createCategory(input: CategoryWriteInput): Promise<Category> {
  const payload = mapCategoryWriteInputToPayload(input);

  if (!isValidCategoryPayload(payload)) {
    throw new Error('Category slug and name are required.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapDbRowToCategory(data as CategoryDbRow);
}

export async function updateCategory(
  categoryId: string,
  input: CategoryWriteInput,
): Promise<Category> {
  const payload = mapCategoryWriteInputToPayload(input);

  if (!isValidCategoryPayload(payload)) {
    throw new Error('Category slug and name are required.');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .select(CATEGORY_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapDbRowToCategory(data as CategoryDbRow);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);

  if (error) {
    throw error;
  }
}
