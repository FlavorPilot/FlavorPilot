/** Hypothesis scale for USDA nutrient density per 100 g.
 * Saltiness uses log10 because sodium spans orders of magnitude:
 * 0 mg → 0; below 1 mg floors at 0; 40 000 mg → 10.
 * Fat, sugars and water are linear: 0 g → 0, 100 g → 10.
 * A missing published amount stays null. These scores are not taste measurements
 * and are not inputs to the scoring engine.
 */
export const NUTRIENT_HYPOTHESIS_FORMULA = 'nutrient-proxy-1' as const;
export const SODIUM_ANCHOR_MG = 40_000;
const round2 = (value: number) => Math.round(value * 100) / 100;
export const hypothesisSaltiness = (sodiumMg: number | null): number | null => {
    if (sodiumMg === null)
        return null;
    if (sodiumMg <= 0)
        return 0;
    return round2(Math.max(0, Math.min(10, Math.log10(sodiumMg) / Math.log10(SODIUM_ANCHOR_MG) * 10)));
};
export const hypothesisDensity = (grams: number | null): number | null => {
    if (grams === null)
        return null;
    if (grams <= 0)
        return 0;
    return round2(Math.min(10, grams / 10));
};
