import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { AuthenticatedUser } from './auth.types';
const userSchema = z.object({ id: z.string().uuid(), email: z.string().email().optional(), role: z.string().optional(), user_metadata: z.record(z.string(), z.unknown()).optional() });
@Injectable()
export class SupabaseAuthService {
    constructor(private readonly config: ConfigService) { }
    async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
        const url = this.config.get<string>('SUPABASE_URL')?.replace(/\/$/, ''), key = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
        if (!url || !key)
            throw new ServiceUnavailableException({ code: 'AUTH_NOT_CONFIGURED', message: 'Supabase authentication is not configured on the API' });
        let response: Response;
        try {
            response = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: key }, signal: AbortSignal.timeout(10000) });
        }
        catch {
            throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_UNAVAILABLE', message: 'The authentication provider could not be reached' });
        }
        if (response.status === 401 || response.status === 403)
            throw new UnauthorizedException({ code: 'INVALID_ACCESS_TOKEN', message: 'The bearer token is invalid or expired' });
        if (!response.ok)
            throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_ERROR', message: 'The authentication provider returned an unexpected response' });
        const result = userSchema.safeParse(await response.json().catch(() => null));
        if (!result.success)
            throw new ServiceUnavailableException({ code: 'AUTH_PROVIDER_INVALID_RESPONSE', message: 'The authentication provider returned an invalid user payload' });
        return { id: result.data.id, email: result.data.email, role: result.data.role, userMetadata: result.data.user_metadata ?? {} };
    }
}
