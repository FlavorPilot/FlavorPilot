import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  aiExplainRequestSchema,
  type AiExplainResponse
} from "@tastecraft/contracts";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { parseWithSchema } from "../common/zod";
import { AiService } from "./ai.service";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("explain")
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: "Explain deterministic analysis in English or Ukrainian",
    description: "The model is not allowed to create or modify scores."
  })
  explain(@Body() body: unknown): Promise<AiExplainResponse> {
    const input = parseWithSchema(aiExplainRequestSchema, body);
    return this.aiService.explain(input);
  }
}
