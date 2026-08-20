import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { HealthResponse } from "@tastecraft/contracts";
import { DatabaseService } from "../database/database.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: "Service and database readiness" })
  async getHealth(): Promise<HealthResponse> {
    return {
      status: "ok",
      service: "tastecraft-api",
      version: "0.2.0",
      database: await this.database.status(),
      timestamp: new Date().toISOString()
    };
  }
}
