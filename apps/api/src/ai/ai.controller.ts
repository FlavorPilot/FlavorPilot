import type { FastifyRequest } from 'fastify';
import { AiAccessGuard, type AiRequest } from './ai-access.guard';
import { AiAccessService } from './ai-access.service';
import { aiActorUser } from './ai-actor';
import { Body, Controller, Get, Post, UseGuards, Header, NotFoundException, Req } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { aiExplainRequestSchema, aiReviewRequestSchema, aiGenerateRequestSchema } from '@flavorpilot/contracts';
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
@UseGuards(AiAccessGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly ai: AiService, private readonly flavor: FlavorService,private readonly database:DatabaseService) { }
    @Post('explain')
    @Header('Cache-Control', 'no-store')
    explain(
    @Body()
    body: unknown,@Req() request:AiRequest) {
        const input = parseInput(aiExplainRequestSchema, body);
        const analysis = this.flavor.analyze({ items: input.items, goal: input.goal, includeRecommendations: true });
        return this.ai.explain(request.aiActor,input.requestId??randomUUID(),{ locale: input.locale, dishName: input.dishName, analysis,items:input.items });
    }
    @Post('review-recipe') @Header('Cache-Control','no-store')
    async review(@Body() body:unknown,@Req() request:AiRequest){
        const input=parseInput(aiReviewRequestSchema,body);
        if(input.dishId){const userId=aiActorUser(request.aiActor);if(!userId)throw new NotFoundException({code:'DISH_NOT_FOUND',message:'Recipe not found'});const [owned]=await this.database.requireDatabase().execute(sql`select id from public.dishes where id=${input.dishId} and owner_id=${userId} limit 1`);if(!owned)throw new NotFoundException({code:'DISH_NOT_FOUND',message:'Recipe not found'});}
        const analysis=this.flavor.analyze({items:input.recipe.items,goal:input.recipe.goal,includeRecommendations:false});
        return this.ai.review(request.aiActor,input,analysis);
    }
    @Post('generate-recipe') @Header('Cache-Control','no-store')
    async generate(@Body() body:unknown,@Req() request:AiRequest){
        const input=parseInput(aiGenerateRequestSchema,body);
        if(input.dishId){const userId=aiActorUser(request.aiActor);if(!userId)throw new NotFoundException({code:'DISH_NOT_FOUND',message:'Recipe not found'});const [owned]=await this.database.requireDatabase().execute(sql`select id from public.dishes where id=${input.dishId} and owner_id=${userId} limit 1`);if(!owned)throw new NotFoundException({code:'DISH_NOT_FOUND',message:'Recipe not found'});}
        this.flavor.analyze({items:input.recipe.items,goal:input.recipe.goal,includeRecommendations:false});
        return this.ai.generate(request.aiActor,input);
    }
}
@Controller('account') @UseGuards(SupabaseAuthGuard)
export class AccountCapabilitiesController {
 constructor(private readonly usage:AiUsageService){}
 @Get('capabilities') @Header('Cache-Control','no-store')
 capabilities(@CurrentUser() user:AuthenticatedUser){return this.usage.capabilities(user.id);}
}

// Public AI-only bootstrap; this does not grant account/cloud/CRM authorization.
@Controller('ai')
export class AiGuestController {
 constructor(private readonly access:AiAccessService,private readonly usage:AiUsageService){}
 @Post('guest-session') @Header('Cache-Control','no-store')
 async create(@Req() request:FastifyRequest){if(request.headers.authorization!==undefined)await this.access.resolve(request);return this.access.createGuest();}
 @Get('capabilities') @Header('Cache-Control','no-store')
 async capabilities(@Req() request:FastifyRequest){return this.usage.capabilities(await this.access.resolve(request,true));}
}
