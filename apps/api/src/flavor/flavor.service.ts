import { Injectable } from "@nestjs/common";
import type { DishAnalysis, NormalizedAnalyzeDishRequest } from "@flavorpilot/contracts";
import { analyzeDish } from "@flavorpilot/flavor-engine";
import { assertValidDishItems } from "../common/catalog-validation";

@Injectable()
export class FlavorService {
  analyze(input: NormalizedAnalyzeDishRequest): DishAnalysis {
    assertValidDishItems(input.items);
    return analyzeDish(input.items, input.goal, input.includeRecommendations);
  }
}
