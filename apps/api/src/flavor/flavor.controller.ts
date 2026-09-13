import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { analyzeDishRequestSchema } from '@flavorpilot/contracts';
import { parseInput } from '../common/zod';
import { FlavorService } from './flavor.service';
@ApiTags('flavor')
@Controller('flavor')
export class FlavorController {
    constructor(private readonly service: FlavorService) { }
    @Post('analyze')
    analyze(
    @Body()
    body: unknown) { return this.service.analyze(parseInput(analyzeDishRequestSchema, body)); }
}
