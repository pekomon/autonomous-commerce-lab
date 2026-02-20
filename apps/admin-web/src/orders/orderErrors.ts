interface SupabaseErrorLike {
  code?: string | null;
  message?: string;
}

export const ORDER_STATUS_CONFLICT_CODE = 'ORDER_STATUS_CONFLICT';

export interface OrderStatusConflictError extends Error {
  code: typeof ORDER_STATUS_CONFLICT_CODE;
}

export function createOrderStatusConflictError(): OrderStatusConflictError {
  const error = new Error('Order status changed by another admin. Refresh and try again.');
  return Object.assign(error, { code: ORDER_STATUS_CONFLICT_CODE });
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

export function isOrderStatusConflictError(error: SupabaseErrorLike): boolean {
  return error.code === ORDER_STATUS_CONFLICT_CODE;
}

export function toOrderReadErrorMessage(error: SupabaseErrorLike): string {
  if (isAuthorizationError(error)) {
    return 'You are not authorized to view orders.';
  }

  return 'Unable to load orders. Please try again.';
}

export function toOrderWriteErrorMessage(error: SupabaseErrorLike): string {
  if (isOrderStatusConflictError(error)) {
    return 'Order status was changed by another admin. The page has been refreshed.';
  }

  if (isAuthorizationError(error)) {
    return 'You are not authorized to update orders.';
  }

  return 'Unable to update order status. Please try again.';
}
