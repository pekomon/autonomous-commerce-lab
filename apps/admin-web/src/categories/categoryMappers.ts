import {
  normalizeCategorySlug,
  type Category,
  validateCategorySlug,
} from '@autonomous-commerce-lab/shared';

export interface CategoryDbRow {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface CategoryWriteInput {
  slug: string;
  name: string;
}

export interface CategoryWritePayload {
  slug: string;
  name: string;
}

export function isNonEmptyCategoryName(name: string): boolean {
  return name.trim().length > 0;
}

export function mapDbRowToCategory(row: CategoryDbRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function mapCategoryWriteInputToPayload(input: CategoryWriteInput): CategoryWritePayload {
  return {
    slug: normalizeCategorySlug(input.slug),
    name: input.name.trim(),
  };
}

export function isValidCategoryPayload(payload: CategoryWritePayload): boolean {
  return validateCategorySlug(payload.slug) && isNonEmptyCategoryName(payload.name);
}
