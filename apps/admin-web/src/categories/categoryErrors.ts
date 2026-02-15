interface SupabaseErrorLike {
  code?: string | null;
  message?: string;
}

function isAuthorizationError(error: SupabaseErrorLike): boolean {
  const message = (error.message ?? '').toLowerCase();

  return (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    message.includes('not authorized')
  );
}

export function toCategoryWriteErrorMessage(error: SupabaseErrorLike): string {
  if (isAuthorizationError(error)) {
    return 'You are not authorized to modify categories.';
  }

  if (error.code === '23505') {
    return 'Category slug already exists. Use a unique slug.';
  }

  return 'Unable to save category changes. Please try again.';
}

export function toProductCategoryErrorMessage(error: SupabaseErrorLike): string {
  if (isAuthorizationError(error)) {
    return 'You are not authorized to modify product categories.';
  }

  return 'Unable to save product category assignments. Please try again.';
}
