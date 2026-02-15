export const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface ProductImageDbRow {
  id: string;
  product_id: string;
  path: string;
  sort_order: number;
  created_at: string;
}

export interface ProductImageViewModel {
  id: string;
  productId: string;
  path: string;
  sortOrder: number;
  createdAt: string;
  publicUrl: string;
}

interface PublicUrlStorageClient {
  storage: {
    from: (bucket: string) => {
      getPublicUrl: (path: string) => {
        data: {
          publicUrl: string;
        };
      };
    };
  };
}

interface SupabaseErrorLike {
  code?: string | null;
  message?: string;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildProductImagePath(productId: string, fileName: string, token: string): string {
  const safeName = sanitizeFileName(fileName);
  const fallbackName = safeName.length > 0 ? safeName : 'image';
  return `${productId}/${token}-${fallbackName}`;
}

export function mapProductImageRowToViewModel(
  row: ProductImageDbRow,
  publicUrl: string,
): ProductImageViewModel {
  return {
    id: row.id,
    productId: row.product_id,
    path: row.path,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    publicUrl,
  };
}

export function getProductImagePublicUrl(client: PublicUrlStorageClient, path: string): string {
  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function toProductImageErrorMessage(error: SupabaseErrorLike): string {
  const message = (error.message ?? '').toLowerCase();

  if (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    message.includes('not authorized')
  ) {
    return 'You are not authorized to manage product images.';
  }

  if (message.includes('bucket') || message.includes('storage')) {
    return 'Image storage operation failed. Verify bucket and storage policies.';
  }

  return 'Unable to process product image action. Please try again.';
}
