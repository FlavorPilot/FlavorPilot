import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { analyzeDishRequestSchema, type DishAnalysis } from "@tastecraft/contracts";
import { parseWithSchema } from "../common/zod";
import { FlavorService } from "./flavor.service";

@ApiTags("flavor")
@Controller("flavor")
export class FlavorController {
  constructor(private readonly flavorService: FlavorService) {}

  @Post("analyze")
  @ApiOperation({
    summary: "Run the deterministic Flavor Engine",
    description: "No LLM is used to calculate any score."
  })
  analyze(@Body() body: unknown): DishAnalysis {
    const input = parseWithSchema(analyzeDishRequestSchema, body);
    return this.flavorService.analyze(input);
  }
}
