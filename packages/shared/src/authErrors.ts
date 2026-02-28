export type AuthAction = 'signIn' | 'signUp' | 'signOut';

interface SupabaseAuthErrorLike {
  message?: string | null;
  code?: string | null;
  status?: number | null;
}

function fallbackMessage(action: AuthAction): string {
  switch (action) {
    case 'signIn':
      return 'Unable to sign in right now. Please try again.';
    case 'signUp':
      return 'Unable to create your account right now. Please try again.';
    case 'signOut':
      return 'Unable to sign out right now. Please try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

function toAuthErrorLike(error: unknown): SupabaseAuthErrorLike {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const errorLike = error as { message?: unknown; code?: unknown; status?: unknown };

  return {
    message: typeof errorLike.message === 'string' ? errorLike.message : null,
    code: typeof errorLike.code === 'string' ? errorLike.code : null,
    status: typeof errorLike.status === 'number' ? errorLike.status : null,
  };
}

export function toFriendlyAuthErrorMessage(error: unknown, action: AuthAction): string {
  const normalized = toAuthErrorLike(error);
  const message = (normalized.message ?? '').toLowerCase();
  const code = (normalized.code ?? '').toLowerCase();

  if (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return 'Incorrect email or password.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (
    normalized.status === 429 ||
    message.includes('too many requests') ||
    message.includes('rate limit')
  ) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (
    code === '42501' ||
    message.includes('not authorized') ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  ) {
    return 'You are not authorized to perform this action.';
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return fallbackMessage(action);
}
