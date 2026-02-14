interface SupabaseErrorLike {
  code?: string | null;
  message?: string;
}

export function toProductWriteErrorMessage(error: SupabaseErrorLike): string {
  const message = (error.message ?? '').toLowerCase();

  if (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    message.includes('not authorized')
  ) {
    return 'You are not authorized to modify products.';
  }

  return 'Unable to save product changes. Please try again.';
}
