import { Body, Controller, Get, Post, UseGuards, Header, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { aiExplainRequestSchema, aiReviewRequestSchema } from '@flavorpilot/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { AiUsageService } from './ai-usage.service';
import { parseInput } from '../common/zod';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { FlavorService } from '../flavor/flavor.service';
import { AiService } from './ai.service';
@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly ai: AiService, private readonly flavor: FlavorService,private readonly database:DatabaseService) { }
    @Post('explain')
    @Header('Cache-Control', 'no-store')
    explain(
    @Body()
    body: unknown,@CurrentUser() user:AuthenticatedUser) {
        const input = parseInput(aiExplainRequestSchema, body);
        const analysis = this.flavor.analyze({ items: input.items, goal: input.goal, includeRecommendations: true });
        return this.ai.explain(user.id,input.requestId??randomUUID(),{ locale: input.locale, dishName: input.dishName, analysis,items:input.items });
    }
    @Post('review-recipe') @Header('Cache-Control','no-store')
    async review(@Body() body:unknown,@CurrentUser() user:AuthenticatedUser){
        const input=parseInput(aiReviewRequestSchema,body);
        if(input.dishId){const [owned]=await this.database.requireDatabase().execute(sql`select id from public.dishes where id=${input.dishId} and owner_id=${user.id} limit 1`);if(!owned)throw new NotFoundException({code:'DISH_NOT_FOUND',message:'Recipe not found'});}
        const analysis=this.flavor.analyze({items:input.recipe.items,goal:input.recipe.goal,includeRecommendations:false});
        return this.ai.review(user.id,input,analysis);
    }
}
@Controller('account') @UseGuards(SupabaseAuthGuard)
export class AccountCapabilitiesController {
 constructor(private readonly usage:AiUsageService){}
 @Get('capabilities') @Header('Cache-Control','no-store')
 capabilities(@CurrentUser() user:AuthenticatedUser){return this.usage.capabilities(user.id);}
}
