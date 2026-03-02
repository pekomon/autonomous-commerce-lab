import {
  matchesProductQuery,
  type Category,
  type CurrencyCode,
  type Product,
  type ProductStatus,
} from '@autonomous-commerce-lab/shared';

import type { StorefrontSupabaseClient } from '../lib/supabaseClient';
import type { Database } from './database.types';
import {
  buildProductResultsCacheKey,
  DEFAULT_PRODUCTS_PAGE_SIZE,
  paginateItems,
  sortProducts,
  type PaginationResult,
  type ProductSortOption,
} from './storefrontHelpers';

const PRODUCT_IMAGES_BUCKET = 'product-images';

const PRODUCT_SELECT =
  'id,title,description,price_amount,currency,status,tags,created_at,updated_at';
const CATEGORY_SELECT = 'id,slug,name,created_at';
const PRODUCT_CATEGORY_SELECT = 'product_id,category_id';
const PRODUCT_IMAGE_SELECT = 'id,product_id,path,sort_order,created_at';

type ProductRow = Database['public']['Tables']['products']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

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

function toPublicImageUrl(client: StorefrontSupabaseClient, path: string): string {
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
  page?: number;
  pageSize?: number;
}

export type FetchProductsResult = PaginationResult<StorefrontProductCard>;

// Simple in-memory caches for a single browser tab.
// Limitations: no TTL/invalidation and data may become stale until page reload.
let categoriesCache: Category[] | null = null;
const productResultsCache = new Map<string, FetchProductsResult>();

export async function fetchCategories(client: StorefrontSupabaseClient): Promise<Category[]> {
  if (categoriesCache) {
    return [...categoriesCache];
  }

  const { data, error } = await client.from('categories').select(CATEGORY_SELECT).order('name');

  if (error) {
    throw error;
  }

  categoriesCache = (data ?? []).map((row) => mapCategoryRowToCategory(row));
  return [...categoriesCache];
}

export async function fetchProductCategoryIds(
  client: StorefrontSupabaseClient,
  productId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from('product_categories')
    .select('category_id')
    .eq('product_id', productId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.category_id);
}

export async function fetchProductImages(
  client: StorefrontSupabaseClient,
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

  return (data ?? []).map((typedRow) => {
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
  client: StorefrontSupabaseClient,
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

  return mapProductRowToProduct(data);
}

export async function fetchProducts(
  client: StorefrontSupabaseClient,
  params: FetchProductsParams,
): Promise<FetchProductsResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PRODUCTS_PAGE_SIZE;
  const cacheKey = buildProductResultsCacheKey({
    query: params.query,
    categoryId: params.categoryId,
    sort: params.sort,
    page,
    pageSize,
  });

  const cached = productResultsCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      items: [...cached.items],
    };
  }

  const [
    categoryRows,
    { data: productRows, error: productsError },
    productCategoryRows,
    imageRows,
  ] = await Promise.all([
    fetchCategories(client),
    client.from('products').select(PRODUCT_SELECT),
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

  if (productCategoryRows.error) {
    throw productCategoryRows.error;
  }

  if (imageRows.error) {
    throw imageRows.error;
  }

  const categoryById = new Map<string, Category>();
  for (const category of categoryRows) {
    categoryById.set(category.id, category);
  }

  const productCategoryIds = new Map<string, string[]>();
  for (const row of productCategoryRows.data ?? []) {
    const current = productCategoryIds.get(row.product_id) ?? [];
    current.push(row.category_id);
    productCategoryIds.set(row.product_id, current);
  }

  const firstImagePathByProductId = new Map<string, string>();
  for (const row of imageRows.data ?? []) {
    if (!firstImagePathByProductId.has(row.product_id)) {
      firstImagePathByProductId.set(row.product_id, row.path);
    }
  }

  const query = params.query.trim();

  const cards: StorefrontProductCard[] = (productRows ?? []).map((row) => {
    const product = mapProductRowToProduct(row);
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

  const paged = paginateItems(sortProducts(filtered, params.sort), page, pageSize);
  productResultsCache.set(cacheKey, paged);

  return {
    ...paged,
    items: [...paged.items],
  };
}
