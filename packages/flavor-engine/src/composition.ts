import type { CompositionAmount, DishComposition, DishItem } from '@flavorpilot/contracts/domain';
import { nutrientHypotheses } from './nutrient-hypotheses';
import { sourcedIdentities } from './sourced-identities';
const roundTo = (value: number, digits: number) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};
const hypothesisByIdentity = new Map(nutrientHypotheses.map(row => [row.identityId, row]));
const identityByIngredient = new Map(sourcedIdentities.flatMap(identity => [
    [identity.id, identity] as const,
    ...(identity.catalogIngredientId ? [[identity.catalogIngredientId, identity] as const] : []),
]));
const hypothesisByIngredient = new Map<string, typeof nutrientHypotheses[number]>();
for (const identity of sourcedIdentities) {
    const row = hypothesisByIdentity.get(identity.id);
    if (!row)
        continue;
    hypothesisByIngredient.set(identity.id, row);
    if (identity.catalogIngredientId)
        hypothesisByIngredient.set(identity.catalogIngredientId, row);
}
const specs: { nutrient: CompositionAmount['nutrient']; unit: CompositionAmount['unit']; digits: number; read: (row: typeof nutrientHypotheses[number]) => number | null }[] = [
    { nutrient: 'protein', unit: 'g', digits: 1, read: row => row.proteinG },
    { nutrient: 'fat', unit: 'g', digits: 1, read: row => row.fatG },
    { nutrient: 'carbohydrate', unit: 'g', digits: 1, read: row => row.carbohydrateG },
    { nutrient: 'sugars', unit: 'g', digits: 1, read: row => row.sugarsG },
    { nutrient: 'sodium', unit: 'mg', digits: 0, read: row => row.sodiumMg },
    { nutrient: 'energy', unit: 'kcal', digits: 0, read: row => row.energyKcal },
];
/** Scale published per-100 g amounts by the grams in the dish. A missing amount is omitted from the sum. */
export const dishComposition = (items: DishItem[]): DishComposition => {
    const present = items.filter(item => Number.isFinite(item.grams) && item.grams > 0);
    const nutrients = specs.map(spec => {
        const contributions = present.map(item => {
            const row = hypothesisByIngredient.get(item.ingredientId);
            const identity = identityByIngredient.get(item.ingredientId);
            const per100 = row ? spec.read(row) : null;
            return { ...item, per100g: per100, amount: per100 === null ? null : per100 * item.grams / 100,
                fdcId: identity?.fdcId ?? null, sourceDescription: identity?.fdcDescription ?? null };
        });
        const covered = contributions.filter(item => item.amount !== null);
        const sum = covered.reduce((sum, item) => sum + item.amount!, 0);
        return { nutrient: spec.nutrient, unit: spec.unit, amount: covered.length === 0 ? null : roundTo(sum, spec.digits), coveredItems: covered.length, totalItems: present.length, contributions };
    });
    return { totalItems: present.length, nutrients };
};
