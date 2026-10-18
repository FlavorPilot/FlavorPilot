import { isAuthError } from '@supabase/supabase-js';
import type { MessageKey } from '@/shared/i18n';

const messagesByCode: Record<string, MessageKey> = {
    invalid_credentials: 'authInvalidCredentials',
    email_not_confirmed: 'authEmailUnconfirmed',
    over_email_send_rate_limit: 'authEmailRateLimit',
    over_request_rate_limit: 'authTooManyRequests',
    email_address_not_authorized: 'authEmailDeliveryUnavailable',
    email_address_invalid: 'authInvalidEmail',
    weak_password: 'authWeakPassword',
    same_password: 'authSamePassword',
    user_already_exists: 'authRegistrationFailed',
    email_exists: 'authRegistrationFailed',
    signup_disabled: 'authRegistrationUnavailable',
    session_expired: 'authSessionExpired',
    session_not_found: 'authSessionExpired',
    refresh_token_not_found: 'authSessionExpired',
    refresh_token_already_used: 'authSessionExpired',
    reauthentication_needed: 'authSessionExpired',
};

/** Only known codes become localized copy; never display raw provider details. */
export function authErrorMessage(error: unknown): MessageKey {
    if (!isAuthError(error)) return 'authError';
    if (error.code && Object.hasOwn(messagesByCode, error.code)) return messagesByCode[error.code];
    if (error.status === 429) return 'authTooManyRequests';
    if (error.name === 'AuthRetryableFetchError' && !error.status) return 'authNetworkError';
    if (error.status && error.status >= 500) return 'authServiceUnavailable';
    return 'authError';
}
