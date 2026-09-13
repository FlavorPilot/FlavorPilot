import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from './auth.types';
import { SupabaseAuthService } from './supabase-auth.service';
export type AuthenticatedRequest = FastifyRequest & {
    user?: AuthenticatedUser;
};
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    constructor(private readonly auth: SupabaseAuthService) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const match = /^Bearer\s+([^\s]+)$/i.exec(request.headers.authorization ?? '');
        if (!match || match[1].length > 8192)
            throw new UnauthorizedException({ code: 'MISSING_ACCESS_TOKEN', message: 'A valid bearer token is required' });
        request.user = await this.auth.verifyAccessToken(match[1]);
        return true;
    }
}
