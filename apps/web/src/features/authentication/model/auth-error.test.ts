import { describe, expect, it } from 'vitest';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { getDictionary } from '@/shared/i18n';
import { authErrorMessage } from './auth-error';

describe('localized authentication failures', () => {
    it.each([
        ['invalid_credentials', 400, 'authInvalidCredentials'],
        ['email_not_confirmed', 400, 'authEmailUnconfirmed'],
        ['over_email_send_rate_limit', 429, 'authEmailRateLimit'],
        ['over_request_rate_limit', 429, 'authTooManyRequests'],
        ['email_address_not_authorized', 403, 'authEmailDeliveryUnavailable'],
        ['weak_password', 422, 'authWeakPassword'],
        ['same_password', 422, 'authSamePassword'],
        ['session_expired', 401, 'authSessionExpired'],
        ['user_already_exists', 422, 'authRegistrationFailed'],
        ['unexpected_failure', 503, 'authServiceUnavailable'],
        ['future_rate_limit', 429, 'authTooManyRequests'],
    ])('maps %s without showing provider details', (code, status, key) => {
        const messageKey = authErrorMessage(new AuthApiError('Sensitive provider detail', status as number, code as string));
        expect(messageKey).toBe(key);
        for (const locale of ['en', 'uk'] as const) {
            expect(getDictionary(locale).messages[messageKey]).not.toContain('Sensitive provider detail');
        }
    });
    it('distinguishes a network failure from an unavailable service', () => {
        expect(authErrorMessage(new AuthRetryableFetchError('fetch failed', 0))).toBe('authNetworkError');
        expect(authErrorMessage(new AuthRetryableFetchError('service unavailable', 503))).toBe('authServiceUnavailable');
    });
    it('keeps unknown failures generic without interpreting arbitrary messages or inherited keys', () => {
        expect(authErrorMessage(new Error('password=secret'))).toBe('authError');
        expect(authErrorMessage(new AuthApiError('over_email_send_rate_limit', 400, 'future_code'))).toBe('authError');
        expect(authErrorMessage(new AuthApiError('unknown', 400, 'constructor'))).toBe('authError');
        expect(authErrorMessage(null)).toBe('authError');
    });
});
