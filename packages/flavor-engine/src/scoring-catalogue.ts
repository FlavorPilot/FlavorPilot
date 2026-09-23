import type { Ingredient } from '@flavorpilot/contracts/domain';
import { ingredients } from './ingredients';
import { productHypotheses } from './product-hypotheses';
import { sourcedIdentities } from './sourced-identities';
/** Earlier category bands. Per-food shares now live on each product hypothesis. */
export const SHARE_HYPOTHESIS = 'share-band-1';
const categoryUk: Record<string, string> = {
    'Spices and Herbs': 'Спеції та трави',
    'Fats and Oils': 'Жири та олії',
    'Sweets': 'Солодощі',
    'Fruits and Fruit Juices': 'Фрукти',
    'Vegetables and Vegetable Products': 'Овочі',
    'Dairy and Egg Products': 'Молочні продукти та яйця',
    'Beef Products': 'Яловичина',
    'Pork Products': 'Свинина',
    'Poultry Products': 'Птиця',
    'Lamb, Veal, and Game Products': 'Баранина та дичина',
    'Finfish and Shellfish Products': 'Риба та морепродукти',
    'Legumes and Legume Products': 'Бобові',
    'Cereal Grains and Pasta': 'Крупи та паста',
    'Baked Products': 'Випічка',
    'Nut and Seed Products': 'Горіхи та насіння',
    'Beverages': 'Напої',
    'Alcoholic Beverages': 'Алкогольні напої',
};
const knownIds = new Set(ingredients.map(item => item.id));
const toIngredient = (id: string, nameEn: string, nameUk: string, category: string): Ingredient => {
    const categoryLabel = categoryUk[category];
    if (!categoryLabel)
        throw new Error(`No category label for USDA category ${category}`);
    const composed = productHypotheses[id];
    if (!composed)
        throw new Error(`No product hypothesis for ${id}`);
    return {
        id,
        name: { en: nameEn, uk: nameUk },
        category: { en: category, uk: categoryLabel },
        profile: {
            sweetness: composed.sweetness,
            acidity: composed.acidity,
            saltiness: composed.saltiness,
            bitterness: composed.bitterness,
            umami: composed.umami,
            fat: composed.fat,
            pungency: composed.pungency,
            freshness: composed.freshness,
            aromaIntensity: composed.aromaIntensity,
            moisture: composed.moisture,
        },
        intensity: composed.intensity,
        textureIntensity: composed.textureIntensity,
        aromas: composed.aromas,
        textures: composed.textures,
        roles: composed.roles,
        share: composed.share,
        preparations: composed.preparations.includes('raw') ? composed.preparations : ['raw', ...composed.preparations],
    };
};
/** USDA identities that are not already in the transcribed 38. Profiles are composed product hypotheses on the same scale. */
export const hypothesisIngredients: Ingredient[] = sourcedIdentities.filter(identity => identity.catalogIngredientId === null && !knownIds.has(identity.id)).map(identity => toIngredient(identity.id, identity.nameEn, identity.nameUk, identity.fdcFoodCategory));
export const catalogueIngredients: Ingredient[] = [...ingredients, ...hypothesisIngredients];
export const catalogueById = new Map(catalogueIngredients.map(ingredient => [ingredient.id, ingredient]));
