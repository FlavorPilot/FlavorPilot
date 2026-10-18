import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { adminListQuerySchema,commentListQuerySchema, createCommentRequestSchema, feedbackPermissionSchema,modelFeedbackRequestSchema } from '@flavorpilot/contracts';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { parseInput } from '../common/zod';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
@UseGuards(SupabaseAuthGuard)
export class FeedbackController {
    constructor(private readonly service: FeedbackService) {}
    @Post() @Header('Cache-Control','no-store')
    save(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) { return this.service.saveFeedback(user.id,parseInput(modelFeedbackRequestSchema,body)); }
    @Get('mine') @Header('Cache-Control','no-store')
    mine(@CurrentUser() user:AuthenticatedUser,@Query() query:unknown){return this.service.mine(user.id,parseInput(adminListQuerySchema,query));}
    @Patch(':id/permission') @Header('Cache-Control','no-store')
    withdraw(@CurrentUser() user:AuthenticatedUser,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){parseInput(feedbackPermissionSchema,body);return this.service.withdraw(user.id,id);}
    @Get(':id') @Header('Cache-Control','no-store')
    get(@CurrentUser() user: AuthenticatedUser, @Param('id',new ParseUUIDPipe()) id: string) { return this.service.getFeedback(user.id,id); }
    @Delete(':id') @HttpCode(204) @Header('Cache-Control','no-store')
    async remove(@CurrentUser() user: AuthenticatedUser, @Param('id',new ParseUUIDPipe()) id: string) { await this.service.deleteFeedback(user.id,id); }
}
@Controller('dishes/:dishId/comments')
export class CommentsController {
    constructor(private readonly service: FeedbackService) {}
    @Get() @Header('Cache-Control','no-store')
    list(@Param('dishId',new ParseUUIDPipe()) dishId: string, @Query() query: unknown) { return this.service.listComments(dishId,parseInput(commentListQuerySchema,query)); }
    @Post() @UseGuards(SupabaseAuthGuard) @Header('Cache-Control','no-store')
    create(@CurrentUser() user: AuthenticatedUser, @Param('dishId',new ParseUUIDPipe()) dishId: string, @Body() body: unknown) { return this.service.createComment(user.id,dishId,parseInput(createCommentRequestSchema,body)); }
    @Delete(':id') @HttpCode(204) @UseGuards(SupabaseAuthGuard)
    async remove(@CurrentUser() user: AuthenticatedUser, @Param('dishId',new ParseUUIDPipe()) dishId: string, @Param('id',new ParseUUIDPipe()) id: string) { await this.service.deleteComment(user.id,dishId,id); }
}
