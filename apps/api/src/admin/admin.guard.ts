import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { adminMemberships } from '../database/schema';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly database:DatabaseService) {}
    async canActivate(context:ExecutionContext) {
        const request=context.switchToHttp().getRequest<AuthenticatedRequest>();
        if(!request.user)throw new ForbiddenException({code:'ADMIN_FORBIDDEN'});
        const [member]=await this.database.requireDatabase().select({role:adminMemberships.role,active:adminMemberships.active})
            .from(adminMemberships).where(eq(adminMemberships.userId,request.user.id)).limit(1);
        if(!member?.active || member.role!=='owner')throw new ForbiddenException({code:'ADMIN_FORBIDDEN'});
        return true;
    }
}
@Injectable()
export class AdminMfaGuard implements CanActivate {
    constructor(private readonly config:ConfigService) {}
    canActivate(context:ExecutionContext) {
        const user=context.switchToHttp().getRequest<AuthenticatedRequest>().user;
        if(this.config.get<boolean>('ADMIN_REQUIRE_MFA',true) && user?.assurance!=='aal2')
            throw new ForbiddenException({code:'ADMIN_MFA_REQUIRED'});
        return true;
    }
}
