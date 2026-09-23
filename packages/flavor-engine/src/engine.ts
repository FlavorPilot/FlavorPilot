import { getPairAdjustment, goalDefinitions, ingredientById, ingredients, preparationById } from './ingredients';
import { sensoryDimensions, type DishAnalysis, type DishGoal, type DishIssue, type DishItem, type Ingredient, type IngredientRecommendation, type PairResult, type RecommendationReason, type SensoryProfile, type TextureTag } from '@flavorpilot/contracts/domain';
interface PreparedIngredient {
    ingredient: Ingredient;
    profile: SensoryProfile;
    intensity: number;
    aromas: string[];
    textures: TextureTag[];
}
interface WeightedItem extends PreparedIngredient {
    item: DishItem;
    impact: number;
}
const zeroProfile = (): SensoryProfile => ({ sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0, fat: 0, pungency: 0, freshness: 0, aromaIntensity: 0, moisture: 0 });
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => { const factor = 10 ** digits; return Math.round(value * factor) / factor; };
const unique = <T>(items: T[]) => Array.from(new Set(items));
const intersects = <T>(left: T[], right: T[]) => left.some(value => right.includes(value));
const jaccard = (left: string[], right: string[]) => {
    const a = new Set(left), b = new Set(right);
    const intersection = [...a].filter(value => b.has(value)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
};
const getPreparedIngredient = (ingredient: Ingredient, preparationId: string): PreparedIngredient => {
    const preparation = preparationById.get(preparationId) ?? preparationById.get('raw');
    const preparedProfile = zeroProfile();
    for (const dimension of sensoryDimensions) {
        const multiplier = preparation?.profileMultiplier[dimension] ?? 1;
        preparedProfile[dimension] = clamp(ingredient.profile[dimension] * multiplier, 0, 10);
    }
    return { ingredient, profile: preparedProfile, intensity: clamp(ingredient.intensity * (preparation?.intensityMultiplier ?? 1), 0, 10), aromas: unique([...ingredient.aromas, ...(preparation?.addAromas ?? [])]), textures: unique([...ingredient.textures, ...(preparation?.addTextures ?? [])]) };
};
const toWeightedItems = (items: DishItem[]): WeightedItem[] => items.filter(item => Number.isFinite(item.grams) && item.grams > 0).map(item => {
    const ingredient = ingredientById.get(item.ingredientId);
    if (!ingredient)
        return null;
    const prepared = getPreparedIngredient(ingredient, item.preparationId);
    const intensityFactor = .42 + prepared.intensity * .058;
    return { ...prepared, item, impact: item.grams * intensityFactor };
}).filter((item): item is WeightedItem => item !== null);
const dishProfile = (items: WeightedItem[]): SensoryProfile => {
    const result = zeroProfile(), totalImpact = items.reduce((sum, item) => sum + item.impact, 0);
    if (totalImpact === 0)
        return result;
    for (const dimension of sensoryDimensions)
        result[dimension] = round(items.reduce((sum, item) => sum + item.profile[dimension] * item.impact, 0) / totalImpact, 2);
    return result;
};
const textureContrast = (a: TextureTag[], b: TextureTag[]) => {
    const hard: TextureTag[] = ['crisp', 'crunchy', 'firm', 'fibrous'];
    const soft: TextureTag[] = ['tender', 'creamy', 'silky', 'juicy', 'flaky', 'sticky'];
    return (intersects(a, hard) && intersects(b, soft)) || (intersects(b, hard) && intersects(a, soft)) ? 1 : 0;
};
export const calculatePair = (left: PreparedIngredient, right: PreparedIngredient): PairResult => {
    const aromaOverlap = jaccard(left.aromas, right.aromas);
    const acidFat = Math.max(left.profile.acidity * right.profile.fat, right.profile.acidity * left.profile.fat);
    const freshFat = Math.max(left.profile.freshness * right.profile.fat, right.profile.freshness * left.profile.fat);
    const sweetBitter = Math.max(left.profile.sweetness * right.profile.bitterness, right.profile.sweetness * left.profile.bitterness);
    const sweetPungent = Math.max(left.profile.sweetness * right.profile.pungency, right.profile.sweetness * left.profile.pungency);
    const acidUmami = Math.max(left.profile.acidity * right.profile.umami, right.profile.acidity * left.profile.umami);
    const complementScore = (acidFat / 100) * 16 + (freshFat / 100) * 8 + (sweetBitter / 100) * 5 + (sweetPungent / 100) * 7 + (acidUmami / 100) * 5 + textureContrast(left.textures, right.textures) * 7;
    const intensityPenalty = Math.max(0, Math.abs(left.intensity - right.intensity) - 4) * 1.7;
    const explicitAdjustment = getPairAdjustment(left.ingredient.id, right.ingredient.id);
    const score = clamp(48 + aromaOverlap * 28 + complementScore + explicitAdjustment - intensityPenalty);
    return { ingredientAId: left.ingredient.id, ingredientBId: right.ingredient.id, score: round(score), aromaOverlap: round(aromaOverlap * 100), complementScore: round(complementScore, 1), explicitAdjustment };
};
const pairResults = (items: WeightedItem[]) => {
    const results: Array<PairResult & {
        weight: number;
    }> = [];
    for (let l = 0; l < items.length; l++)
        for (let r = l + 1; r < items.length; r++) {
            const left = items[l], right = items[r];
            results.push({ ...calculatePair(left, right), weight: Math.sqrt(left.impact * right.impact) });
        }
    return results;
};
const weightedPairAverage = (results: Array<PairResult & {
    weight: number;
}>) => {
    const total = results.reduce((sum, result) => sum + result.weight, 0);
    if (total === 0)
        return results.length === 0 ? 50 : results[0].score;
    return results.reduce((sum, result) => sum + result.score * result.weight, 0) / total;
};
const targetCenters: SensoryProfile = { sweetness: 3.2, acidity: 3.6, saltiness: 2.7, bitterness: 1.6, umami: 4.8, fat: 3.8, pungency: 1.5, freshness: 4.8, aromaIntensity: 5.3, moisture: 6.1 };
const targetTolerance: SensoryProfile = { sweetness: 2.5, acidity: 2.4, saltiness: 2.3, bitterness: 2, umami: 3.3, fat: 2.8, pungency: 2.6, freshness: 3.1, aromaIntensity: 3.1, moisture: 3.2 };
const dimensionWeights: SensoryProfile = { sweetness: 1.1, acidity: 1.35, saltiness: 1.25, bitterness: .85, umami: 1.1, fat: 1.2, pungency: .75, freshness: .95, aromaIntensity: .8, moisture: .55 };
const calculateBalance = (profile: SensoryProfile, goal: DishGoal) => {
    const bias = goalDefinitions[goal].targetBias;
    let penalty = 0, totalWeight = 0;
    for (const dimension of sensoryDimensions) {
        const center = clamp(targetCenters[dimension] + (bias[dimension] ?? 0), 0, 10), tolerance = targetTolerance[dimension];
        const distance = Math.abs(profile[dimension] - center), outside = Math.max(0, distance - tolerance * .45), weight = dimensionWeights[dimension];
        penalty += (outside / tolerance) ** 1.35 * 8.6 * weight;
        totalWeight += weight;
    }
    if (profile.fat > 4.5) {
        const desiredAcidity = Math.min(6.4, profile.fat * .62);
        penalty += Math.max(0, desiredAcidity - profile.acidity) * 4.2;
    }
    if (profile.sweetness > 5.4) {
        const desiredAcidity = profile.sweetness * .52;
        penalty += Math.max(0, desiredAcidity - profile.acidity) * 3.2;
    }
    if (profile.saltiness > 6.1)
        penalty += (profile.saltiness - 6.1) * 6;
    return clamp(100 - penalty * (11.2 / Math.max(totalWeight, 1)), 18, 100);
};
const calculateQuantityScore = (items: WeightedItem[], totalWeight: number) => {
    if (items.length === 0 || totalWeight === 0)
        return 0;
    let weightedScore = 0, sumWeight = 0;
    for (const item of items) {
        const share = item.item.grams / totalWeight * 100, range = item.ingredient.share;
        let score = 100;
        if (share > range.max)
            score -= Math.min(82, (share - range.max) / Math.max(range.max, .1) * 115);
        else if (share < range.min)
            score -= Math.min(28, (range.min - share) / Math.max(range.min, .1) * 22);
        else
            score -= Math.min(12, Math.abs(share - range.ideal) / (Math.max(range.max - range.min, 1) / 2) * 7);
        const weight = Math.sqrt(item.impact);
        weightedScore += clamp(score) * weight;
        sumWeight += weight;
    }
    return sumWeight === 0 ? 0 : weightedScore / sumWeight;
};
const calculateTextureScore = (items: WeightedItem[]) => {
    if (items.length === 0)
        return 0;
    if (items.length === 1)
        return 44;
    const tags = unique(items.flatMap(item => item.textures));
    let contrasts = 0;
    for (let l = 0; l < items.length; l++)
        for (let r = l + 1; r < items.length; r++)
            contrasts += textureContrast(items[l].textures, items[r].textures);
    return clamp(45 + tags.length * 6.5 + Math.min(contrasts, 4) * 7);
};
const findDominantIngredient = (items: WeightedItem[]) => {
    const totalImpact = items.reduce((sum, item) => sum + item.impact, 0);
    if (totalImpact === 0 || items.length < 2)
        return undefined;
    const top = [...items].sort((a, b) => b.impact - a.impact)[0];
    const impactShare = top.impact / totalImpact, gramShare = top.item.grams / items.reduce((sum, item) => sum + item.item.grams, 0);
    const isBase = top.ingredient.roles.includes('base'), threshold = isBase ? .84 : .56;
    return impactShare > threshold || (!isBase && gramShare > .5) ? { ingredientId: top.ingredient.id, share: impactShare } : undefined;
};
const buildIssues = (items: WeightedItem[], profile: SensoryProfile, textureScore: number, dominant?: {
    ingredientId: string;
    share: number;
}): DishIssue[] => {
    if (items.length === 0)
        return [{ code: 'emptyDish', severity: 'info' }];
    const issues: DishIssue[] = [];
    if (items.length === 1)
        issues.push({ code: 'singleIngredient', severity: 'info' });
    // A breached working range is independent of which ingredient has the highest impact.
    // It is listed before other warnings because the analysis card shows one warning.
    const totalGrams = items.reduce((sum, item) => sum + item.item.grams, 0);
    if (totalGrams > 0) {
        const overages = items.flatMap(item => {
            const share = item.item.grams / totalGrams * 100;
            const excess = share - item.ingredient.share.max;
            return excess > 0 ? [{ ingredientId: item.ingredient.id, share, excess }] : [];
        }).sort((left, right) => right.excess - left.excess);
        for (const overage of overages)
            issues.push({ code: 'outsideRecommendedRange', severity: 'warning', ingredientId: overage.ingredientId, value: round(overage.share, 1) });
    }
    if (profile.fat > 5.2 && profile.acidity < profile.fat * .55)
        issues.push({ code: 'fatNeedsAcid', severity: profile.fat > 7 ? 'critical' : 'warning', value: round(profile.fat * .62 - profile.acidity, 1) });
    if (profile.sweetness > 6.2 && profile.acidity < profile.sweetness * .48)
        issues.push({ code: 'tooSweet', severity: 'warning' });
    const effectiveIntensity = items.reduce((sum, item) => sum + item.intensity * item.impact, 0) / Math.max(1, items.reduce((sum, item) => sum + item.impact, 0));
    if (effectiveIntensity > 8.1)
        issues.push({ code: 'tooIntense', severity: 'warning', value: round(effectiveIntensity, 1) });
    if (profile.freshness < 2.1 && profile.fat > 4.8)
        issues.push({ code: 'lowFreshness', severity: 'warning' });
    if (profile.saltiness > 6.2)
        issues.push({ code: 'highSalt', severity: 'critical' });
    if (profile.umami < 1.6 && items.length >= 3)
        issues.push({ code: 'lowUmami', severity: 'info' });
    if (dominant)
        issues.push({ code: 'dominantIngredient', severity: 'warning', ingredientId: dominant.ingredientId, value: round(dominant.share * 100) });
    if (textureScore < 60 && items.length >= 3)
        issues.push({ code: 'flatTexture', severity: 'info' });
    return issues;
};
const coreAnalysis = (items: DishItem[], goal: DishGoal) => {
    const weightedItems = toWeightedItems(items), totalWeight = weightedItems.reduce((sum, item) => sum + item.item.grams, 0);
    const profile = dishProfile(weightedItems), pairs = pairResults(weightedItems), compatibilityScore = weightedPairAverage(pairs);
    const balanceScore = calculateBalance(profile, goal), quantityScore = calculateQuantityScore(weightedItems, totalWeight), textureScore = calculateTextureScore(weightedItems);
    const dominant = findDominantIngredient(weightedItems);
    const explicitCoverage = pairs.length === 0 ? 0 : pairs.filter(pair => pair.explicitAdjustment !== 0).length / pairs.length;
    const confidence = clamp(55 + explicitCoverage * 28 + Math.min(14, weightedItems.length * 3.5), 0, 96);
    const overallScore = weightedItems.length === 0 ? 0 : clamp(compatibilityScore * .38 + balanceScore * .32 + quantityScore * .16 + textureScore * .14);
    return { weightedItems, totalWeight, profile, pairs, compatibilityScore, balanceScore, quantityScore, textureScore, dominant, confidence, overallScore, issues: buildIssues(weightedItems, profile, textureScore, dominant) };
};
const recommendedGrams = (ingredient: Ingredient, totalWeight: number) => {
    const base = Math.max(totalWeight, 240) * (ingredient.share.ideal / 100);
    if (base < 3)
        return round(Math.max(.3, base), 1);
    if (base < 12)
        return round(base, 1);
    return Math.round(Math.min(base, 180));
};
const recommendationReasons = (candidate: Ingredient, currentProfile: SensoryProfile, compatibility: number, balanceDelta: number, textureScore: number, goal: DishGoal): RecommendationReason[] => {
    const reasons: RecommendationReason[] = [];
    if (compatibility >= 78)
        reasons.push('strongPairing');
    if (candidate.profile.acidity >= 6.5)
        reasons.push('addsAcidity');
    if (candidate.profile.acidity >= 6 && currentProfile.fat >= 5)
        reasons.push('balancesFat');
    if (candidate.profile.freshness >= 7.5)
        reasons.push('addsFreshness');
    if (candidate.profile.umami >= 7.5)
        reasons.push('addsUmami');
    if (candidate.profile.sweetness >= 6.5 && currentProfile.sweetness < 3.4)
        reasons.push('addsSweetness');
    if (candidate.profile.pungency >= 5.5)
        reasons.push('addsPungency');
    if (textureScore < 72 && (candidate.textures.includes('crisp') || candidate.textures.includes('crunchy')))
        reasons.push('addsCrunch');
    if (goalDefinitions[goal].preferredRoles.some(role => candidate.roles.includes(role)))
        reasons.push('supportsGoal');
    if (balanceDelta >= 1.2)
        reasons.push('improvesBalance');
    return unique(reasons).slice(0, 3);
};
const generateRecommendations = (items: DishItem[], goal: DishGoal, current: ReturnType<typeof coreAnalysis>): IngredientRecommendation[] => {
    if (current.weightedItems.length === 0)
        return [];
    const existing = new Set(items.map(item => item.ingredientId)), candidateResults: IngredientRecommendation[] = [];
    for (const candidate of ingredients) {
        if (existing.has(candidate.id))
            continue;
        const grams = recommendedGrams(candidate, current.totalWeight), preparationId = candidate.preparations.includes('raw') ? 'raw' : candidate.preparations[0];
        const preparedCandidate = getPreparedIngredient(candidate, preparationId);
        const pairScores = current.weightedItems.map(item => ({ score: calculatePair(item, preparedCandidate).score, weight: item.impact }));
        const totalImpact = pairScores.reduce((sum, pair) => sum + pair.weight, 0);
        const compatibility = totalImpact === 0 ? 50 : pairScores.reduce((sum, pair) => sum + pair.score * pair.weight, 0) / totalImpact;
        const simulated = coreAnalysis([...items, { ingredientId: candidate.id, grams, preparationId }], goal);
        const balanceDelta = simulated.balanceScore - current.balanceScore;
        const goalMatch = goalDefinitions[goal].preferredRoles.some(role => candidate.roles.includes(role));
        const balanceContribution = clamp(50 + balanceDelta * 6.5);
        const utility = clamp(compatibility * .5 + balanceContribution * .34 + (goalMatch ? 10 : 2) + (simulated.textureScore - current.textureScore > 4 ? 4 : 0));
        const reasons = recommendationReasons(candidate, current.profile, compatibility, balanceDelta, current.textureScore, goal);
        candidateResults.push({ ingredientId: candidate.id, compatibility: round(compatibility), utility: round(utility), recommendedGrams: grams, balanceDelta: round(balanceDelta, 1), reasons: reasons.length > 0 ? reasons : ['strongPairing'] });
    }
    return candidateResults.filter(candidate => candidate.compatibility >= 48 || candidate.balanceDelta >= 2).sort((a, b) => b.utility - a.utility).slice(0, 8);
};
export const analyzeDish = (items: DishItem[], goal: DishGoal = 'balanced', includeRecommendations = true): DishAnalysis => {
    const core = coreAnalysis(items, goal);
    return { overallScore: round(core.overallScore), compatibilityScore: round(core.compatibilityScore), balanceScore: round(core.balanceScore), quantityScore: round(core.quantityScore), textureScore: round(core.textureScore), confidence: round(core.confidence), profile: core.profile, totalWeight: round(core.totalWeight, 1), dominantIngredientId: core.dominant?.ingredientId, pairResults: core.pairs.map(({ weight: _weight, ...pair }) => pair), issues: core.issues, recommendations: includeRecommendations ? generateRecommendations(items, goal, core) : [] };
};
export const scoreCandidateForDish = (items: DishItem[], candidateId: string, goal: DishGoal = 'balanced') => analyzeDish(items, goal, true).recommendations.find(item => item.ingredientId === candidateId);
