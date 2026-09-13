import { Injectable } from '@nestjs/common';
import { analyzeDish } from '@flavorpilot/flavor-engine';
import type { NormalizedAnalyzeDishRequest } from '@flavorpilot/contracts';
import { assertValidDishItems } from '../common/catalog-validation';
@Injectable()
export class FlavorService {
    analyze(input: NormalizedAnalyzeDishRequest) { assertValidDishItems(input.items); return analyzeDish(input.items, input.goal, input.includeRecommendations); }
}
