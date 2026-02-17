import {
  matchesProductQuery,
  type Category,
  type CurrencyCode,
  type Product,
  type ProductStatus,
} from '@autonomous-commerce-lab/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

import { sortProducts, type ProductSortOption } from './storefrontHelpers';

const PRODUCT_IMAGES_BUCKET = 'product-images';

const PRODUCT_SELECT =
  'id,title,description,price_amount,currency,status,tags,created_at,updated_at';
const CATEGORY_SELECT = 'id,slug,name,created_at';
const PRODUCT_CATEGORY_SELECT = 'product_id,category_id';
const PRODUCT_IMAGE_SELECT = 'id,product_id,path,sort_order,created_at';

interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price_amount: number;
  currency: string;
  status: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

interface ProductCategoryRow {
  product_id: string;
  category_id: string;
}

interface ProductImageRow {
  id: string;
  product_id: string;
  path: string;
  sort_order: number;
  created_at: string;
}

const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'EUR'];
const VALID_STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

function coerceCurrency(value: string): CurrencyCode {
  if (VALID_CURRENCIES.includes(value as CurrencyCode)) {
    return value as CurrencyCode;
  }

  return 'EUR';
}

function coerceStatus(value: string): ProductStatus {
  if (VALID_STATUSES.includes(value as ProductStatus)) {
    return value as ProductStatus;
  }

  return 'draft';
}

function mapProductRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: row.price_amount / 100,
    currency: coerceCurrency(row.currency),
    status: coerceStatus(row.status),
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

function mapCategoryRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
  };
}

function toPublicImageUrl(client: SupabaseClient, path: string): string {
  return client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface StorefrontProductCard extends Product {
  thumbnailUrl: string | null;
  categoryIds: string[];
  categoryNames: string[];
}

export interface ProductImageItem {
  id: string;
  path: string;
  sortOrder: number;
  createdAt: string;
  publicUrl: string;
}

export interface FetchProductsParams {
  query: string;
  categoryId: string;
  sort: ProductSortOption;
}

export async function fetchCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client.from('categories').select(CATEGORY_SELECT).order('name');

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapCategoryRowToCategory(row as CategoryRow));
}

export async function fetchProductCategoryIds(
  client: SupabaseClient,
  productId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from('product_categories')
    .select('category_id')
    .eq('product_id', productId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => (row as { category_id: string }).category_id);
}

export async function fetchProductImages(
  client: SupabaseClient,
  productId: string,
): Promise<ProductImageItem[]> {
  const { data, error } = await client
    .from('product_images')
    .select(PRODUCT_IMAGE_SELECT)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const typedRow = row as ProductImageRow;

    return {
      id: typedRow.id,
      path: typedRow.path,
      sortOrder: typedRow.sort_order,
      createdAt: typedRow.created_at,
      publicUrl: toPublicImageUrl(client, typedRow.path),
    };
  });
}

export async function fetchProductById(
  client: SupabaseClient,
  id: string,
): Promise<Product | null> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProductRowToProduct(data as ProductRow);
}

export async function fetchProducts(
  client: SupabaseClient,
  params: FetchProductsParams,
): Promise<StorefrontProductCard[]> {
  const [{ data: productRows, error: productsError }, categories, productCategoryRows, imageRows] =
    await Promise.all([
      client.from('products').select(PRODUCT_SELECT),
      client.from('categories').select(CATEGORY_SELECT),
      client.from('product_categories').select(PRODUCT_CATEGORY_SELECT),
      client
        .from('product_images')
        .select(PRODUCT_IMAGE_SELECT)
        .order('product_id', { ascending: true })
        .order('sort_order', { ascending: true }),
    ]);

  if (productsError) {
    throw productsError;
  }

  if (categories.error) {
    throw categories.error;
  }

  if (productCategoryRows.error) {
    throw productCategoryRows.error;
  }

  if (imageRows.error) {
    throw imageRows.error;
  }

  const categoryById = new Map<string, Category>();
  for (const row of categories.data ?? []) {
    const category = mapCategoryRowToCategory(row as CategoryRow);
    categoryById.set(category.id, category);
  }

  const productCategoryIds = new Map<string, string[]>();
  for (const row of productCategoryRows.data ?? []) {
    const relation = row as ProductCategoryRow;
    const current = productCategoryIds.get(relation.product_id) ?? [];
    current.push(relation.category_id);
    productCategoryIds.set(relation.product_id, current);
  }

  const firstImagePathByProductId = new Map<string, string>();
  for (const row of imageRows.data ?? []) {
    const image = row as ProductImageRow;
    if (!firstImagePathByProductId.has(image.product_id)) {
      firstImagePathByProductId.set(image.product_id, image.path);
    }
  }

  const query = params.query.trim();

  const cards: StorefrontProductCard[] = (productRows ?? []).map((row) => {
    const product = mapProductRowToProduct(row as ProductRow);
    const categoryIds = productCategoryIds.get(product.id) ?? [];
    const categoryNames = categoryIds
      .map((categoryId) => categoryById.get(categoryId)?.name)
      .filter((name): name is string => Boolean(name));

    const firstImagePath = firstImagePathByProductId.get(product.id);

    return {
      ...product,
      categoryIds,
      categoryNames,
      thumbnailUrl: firstImagePath ? toPublicImageUrl(client, firstImagePath) : null,
    };
  });

  const filtered = cards.filter((product) => {
    if (params.categoryId !== 'all' && !product.categoryIds.includes(params.categoryId)) {
      return false;
    }

    if (query.length > 0 && !matchesProductQuery(product, query)) {
      return false;
    }

    return true;
  });

  return sortProducts(filtered, params.sort);
}
