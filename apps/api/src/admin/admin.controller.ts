import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { adminListQuerySchema, adminModerationRequestSchema, adminReviewRequestSchema, createTicketSchema, ticketMessageRequestSchema, ticketUpdateSchema } from '@flavorpilot/contracts';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { parseInput } from '../common/zod';
import { AdminGuard, AdminMfaGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { SupportService } from './support.service';

@Controller('admin') @UseGuards(SupabaseAuthGuard,AdminGuard)
export class AdminAccessController {
    constructor(private readonly config:ConfigService) {}
    @Get('access') @Header('Cache-Control','no-store')
    access(@CurrentUser() user:AuthenticatedUser) {return {userId:user.id,role:'owner',mfaRequired:this.config.get<boolean>('ADMIN_REQUIRE_MFA',true),mfaVerified:user.assurance==='aal2'};}
}
@Controller('admin') @UseGuards(SupabaseAuthGuard,AdminGuard,AdminMfaGuard)
export class AdminController {
    constructor(private readonly service:AdminService,private readonly support:SupportService) {}
    @Get('overview') @Header('Cache-Control','no-store')
    overview(@CurrentUser() u:AuthenticatedUser){return this.service.overview(u.id);}
    @Get('users') @Header('Cache-Control','no-store')
    users(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.service.users(u.id,parseInput(adminListQuerySchema,q));}
    @Get('users/:id') @Header('Cache-Control','no-store')
    user(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string){return this.service.user(u.id,id);}
    @Get('recipes') @Header('Cache-Control','no-store')
    recipes(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.service.recipes(u.id,parseInput(adminListQuerySchema,q));}
    @Patch('recipes/:id/moderation') @Header('Cache-Control','no-store')
    moderate(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() b:unknown){return this.service.moderate(u.id,id,parseInput(adminModerationRequestSchema,b));}
    @Get('feedback') @Header('Cache-Control','no-store')
    feedback(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.service.feedback(u.id,parseInput(adminListQuerySchema,q));}
    @Patch('feedback/:id/review') @Header('Cache-Control','no-store')
    review(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() b:unknown){return this.service.review(u.id,id,parseInput(adminReviewRequestSchema,b));}
    @Get('catalogue') @Header('Cache-Control','no-store')
    catalogue(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.service.catalogue(u.id,parseInput(adminListQuerySchema,q));}
    @Get('audit') @Header('Cache-Control','no-store')
    audit(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.service.audit(u.id,parseInput(adminListQuerySchema,q));}
    @Get('service') @Header('Cache-Control','no-store')
    health(@CurrentUser() u:AuthenticatedUser){return this.service.service(u.id);}
    @Get('support') @Header('Cache-Control','no-store')
    tickets(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.support.list(u.id,parseInput(adminListQuerySchema,q),true);}
    @Get('support/:id') @Header('Cache-Control','no-store')
    ticket(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string){return this.support.detail(u.id,id,true);}
    @Post('support/:id/messages') @Header('Cache-Control','no-store')
    reply(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() b:unknown){return this.support.message(u.id,id,parseInput(ticketMessageRequestSchema,b),true);}
    @Patch('support/:id') @Header('Cache-Control','no-store')
    update(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() b:unknown){return this.support.update(u.id,id,parseInput(ticketUpdateSchema,b));}
}
@Controller('support') @UseGuards(SupabaseAuthGuard)
export class SupportController {
    constructor(private readonly support:SupportService) {}
    @Get() @Header('Cache-Control','no-store')
    list(@CurrentUser() u:AuthenticatedUser,@Query() q:unknown){return this.support.list(u.id,parseInput(adminListQuerySchema,q));}
    @Post() @Header('Cache-Control','no-store')
    create(@CurrentUser() u:AuthenticatedUser,@Body() b:unknown){return this.support.create(u.id,parseInput(createTicketSchema,b));}
    @Get(':id') @Header('Cache-Control','no-store')
    detail(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string){return this.support.detail(u.id,id);}
    @Post(':id/messages') @Header('Cache-Control','no-store')
    reply(@CurrentUser() u:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() b:unknown){return this.support.message(u.id,id,parseInput(ticketMessageRequestSchema,b));}
}
