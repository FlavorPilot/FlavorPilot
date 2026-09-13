import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { HealthResponse } from '@flavorpilot/contracts';
@Controller('health')
export class HealthController {
    constructor(private readonly database: DatabaseService) { }
    @Get()
    async health(): Promise<HealthResponse> { return { status: 'ok', service: 'FlavorPilot API', version: '0.3.0', database: await this.database.status(), timestamp: new Date().toISOString() }; }
}
