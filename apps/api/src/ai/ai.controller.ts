import { Body, Controller, Post, UseGuards, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { aiExplainRequestSchema } from '@flavorpilot/contracts';
import { parseInput } from '../common/zod';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { FlavorService } from '../flavor/flavor.service';
import { AiService } from './ai.service';
@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly ai: AiService, private readonly flavor: FlavorService) { }
    @Post('explain')
    @Header('Cache-Control', 'no-store')
    explain(
    @Body()
    body: unknown) {
        const input = parseInput(aiExplainRequestSchema, body);
        const analysis = this.flavor.analyze({ items: input.items, goal: input.goal, includeRecommendations: true });
        return this.ai.explain({ locale: input.locale, dishName: input.dishName, analysis });
    }
}
