import { describe, expect, it } from 'vitest';

import { toFriendlyAuthErrorMessage } from './authErrors';

describe('toFriendlyAuthErrorMessage', () => {
  it('maps invalid credentials to a safe sign-in message', () => {
    expect(
      toFriendlyAuthErrorMessage(
        { message: 'Invalid login credentials', code: 'invalid_credentials' },
        'signIn',
      ),
    ).toBe('Incorrect email or password.');
  });

  it('maps already registered errors for sign-up', () => {
    expect(toFriendlyAuthErrorMessage({ message: 'User already registered' }, 'signUp')).toBe(
      'An account with this email already exists. Try signing in instead.',
    );
  });

  it('maps rate-limit errors', () => {
    expect(
      toFriendlyAuthErrorMessage({ status: 429, message: 'Too many requests' }, 'signIn'),
    ).toBe('Too many attempts. Please wait a moment and try again.');
  });

  it('falls back to action-specific generic messages', () => {
    expect(toFriendlyAuthErrorMessage({ message: 'Unexpected auth failure' }, 'signOut')).toBe(
      'Unable to sign out right now. Please try again.',
    );
  });
});
