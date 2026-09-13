import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './supabase-auth.guard';
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user)
        throw new UnauthorizedException();
    return user;
});
