import type { Ingredient, IngredientRole, SensoryDimension, SensoryProfile } from '@flavorpilot/contracts/domain';
import { ingredients } from './ingredients';
import { nutrientHypotheses } from './nutrient-hypotheses';
import { sourcedIdentities } from './sourced-identities';
/** Working-share bands for foods that have no reviewed range. Hypothesis, not a measurement. */
export const SHARE_HYPOTHESIS = 'share-band-1';
const zeroProfile = (): SensoryProfile => ({ sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0, fat: 0, pungency: 0, freshness: 0, aromaIntensity: 0, moisture: 0 });
const bands: Record<string, { min: number; ideal: number; max: number; role: IngredientRole; uk: string }> = {
    'Spices and Herbs': { min: 0.05, ideal: 0.4, max: 2, role: 'spice', uk: 'Спеції та трави' },
    'Fats and Oils': { min: 1, ideal: 6, max: 18, role: 'fat', uk: 'Жири та олії' },
    'Sweets': { min: 0.5, ideal: 4, max: 14, role: 'sweetener', uk: 'Солодощі' },
    'Fruits and Fruit Juices': { min: 4, ideal: 16, max: 40, role: 'sweetener', uk: 'Фрукти' },
    'Vegetables and Vegetable Products': { min: 5, ideal: 20, max: 50, role: 'freshness', uk: 'Овочі' },
    'Dairy and Egg Products': { min: 4, ideal: 18, max: 45, role: 'fat', uk: 'Молочні продукти та яйця' },
    'Beef Products': { min: 20, ideal: 45, max: 75, role: 'base', uk: 'Яловичина' },
    'Pork Products': { min: 20, ideal: 45, max: 75, role: 'base', uk: 'Свинина' },
    'Poultry Products': { min: 20, ideal: 45, max: 75, role: 'base', uk: 'Птиця' },
    'Lamb, Veal, and Game Products': { min: 20, ideal: 45, max: 75, role: 'base', uk: 'Баранина та дичина' },
    'Finfish and Shellfish Products': { min: 15, ideal: 40, max: 70, role: 'base', uk: 'Риба та морепродукти' },
    'Legumes and Legume Products': { min: 8, ideal: 25, max: 55, role: 'base', uk: 'Бобові' },
    'Cereal Grains and Pasta': { min: 10, ideal: 30, max: 60, role: 'base', uk: 'Крупи та паста' },
    'Baked Products': { min: 8, ideal: 25, max: 55, role: 'base', uk: 'Випічка' },
    'Nut and Seed Products': { min: 1, ideal: 6, max: 18, role: 'fat', uk: 'Горіхи та насіння' },
    'Beverages': { min: 2, ideal: 12, max: 40, role: 'sauce', uk: 'Напої' },
    'Alcoholic Beverages': { min: 1, ideal: 8, max: 25, role: 'sauce', uk: 'Алкогольні напої' },
};
const hypothesisById = new Map(nutrientHypotheses.map(row => [row.identityId, row]));
const knownIds = new Set(ingredients.map(item => item.id));
const toIngredient = (id: string, nameEn: string, nameUk: string, category: string): Ingredient => {
    const band = bands[category];
    if (!band)
        throw new Error(`No share hypothesis for USDA category ${category}`);
    const hypothesis = hypothesisById.get(id);
    if (!hypothesis)
        throw new Error(`No nutrient hypothesis for ${id}`);
    const profile = zeroProfile();
    const scoredDimensions: SensoryDimension[] = [];
    if (hypothesis.saltiness !== null) {
        profile.saltiness = hypothesis.saltiness;
        scoredDimensions.push('saltiness');
    }
    if (hypothesis.fat !== null) {
        profile.fat = hypothesis.fat;
        scoredDimensions.push('fat');
    }
    if (hypothesis.sweetness !== null) {
        profile.sweetness = hypothesis.sweetness;
        scoredDimensions.push('sweetness');
    }
    if (hypothesis.moisture !== null) {
        profile.moisture = hypothesis.moisture;
        scoredDimensions.push('moisture');
    }
    const known = scoredDimensions.map(dimension => profile[dimension]);
    return {
        id,
        name: { en: nameEn, uk: nameUk },
        category: { en: category, uk: band.uk },
        profile,
        intensity: known.length === 0 ? 1 : Math.max(1, ...known),
        textureIntensity: 0,
        aromas: [],
        textures: [],
        roles: [band.role],
        share: { min: band.min, ideal: band.ideal, max: band.max },
        preparations: ['raw'],
        scoredDimensions,
    };
};
/** USDA identities that are not already in the transcribed 38. Their four nutrient axes enter the score. */
export const hypothesisIngredients: Ingredient[] = sourcedIdentities.filter(identity => identity.catalogIngredientId === null && !knownIds.has(identity.id)).map(identity => toIngredient(identity.id, identity.nameEn, identity.nameUk, identity.fdcFoodCategory));
export const catalogueIngredients: Ingredient[] = [...ingredients, ...hypothesisIngredients];
export const catalogueById = new Map(catalogueIngredients.map(ingredient => [ingredient.id, ingredient]));
