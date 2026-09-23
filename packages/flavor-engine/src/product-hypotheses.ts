import type { IngredientRole, TextureTag } from '@flavorpilot/contracts/domain';
/** Composed product hypotheses on the same 0–10 scale as the transcribed 38.
 * They are not taste-panel measurements and stay unreviewed.
 */
export const PRODUCT_HYPOTHESIS = 'product-hypothesis-1';
export interface ProductHypothesis {
    acidity: number;
    bitterness: number;
    umami: number;
    pungency: number;
    freshness: number;
    aromaIntensity: number;
    saltiness: number;
    fat: number;
    sweetness: number;
    moisture: number;
    intensity: number;
    textureIntensity: number;
    aromas: string[];
    textures: TextureTag[];
    roles: IngredientRole[];
    preparations: string[];
    share: { min: number; ideal: number; max: number };
}
const row = (acidity: number, bitterness: number, umami: number, pungency: number, freshness: number, aromaIntensity: number, saltiness: number, fat: number, sweetness: number, moisture: number, intensity: number, textureIntensity: number, aromas: string[], textures: TextureTag[], roles: IngredientRole[], preparations: string[], share: [number, number, number]): ProductHypothesis => ({ acidity, bitterness, umami, pungency, freshness, aromaIntensity, saltiness, fat, sweetness, moisture, intensity, textureIntensity, aromas, textures, roles, preparations, share: { min: share[0], ideal: share[1], max: share[2] } });
const base = ['raw', 'seared', 'roasted', 'grilled'];
const veg = ['raw', 'boiled', 'steamed', 'roasted', 'grilled'];
const dry = ['boiled', 'steamed'];
const herb = ['raw', 'sauce'];
export const productHypotheses: Record<string, ProductHypothesis> = {
    beef: row(0.2, 0.2, 7.2, 0.1, 1.4, 5.6, 1.2, 5.4, 0.3, 6.2, 5.8, 6.4, ['meaty', 'savory'], ['firm', 'tender'], ['base', 'umami'], base, [22, 46, 74]),
    lamb: row(0.2, 0.4, 6.8, 0.2, 1.2, 6.4, 1.1, 6.2, 0.3, 5.8, 6.2, 6.2, ['meaty', 'savory'], ['firm', 'tender'], ['base', 'umami'], base, [22, 46, 74]),
    turkey: row(0.2, 0.1, 5.4, 0, 2.2, 3.8, 1, 2.4, 0.3, 6.6, 4.2, 5.2, ['meaty', 'mild'], ['firm', 'tender'], ['base'], base, [22, 46, 74]),
    egg: row(0.1, 0.1, 4.8, 0, 1.6, 3.6, 0.8, 5.2, 0.3, 7.2, 4.2, 3.4, ['savory', 'mild'], ['tender', 'creamy'], ['base', 'umami'], ['boiled', 'seared', 'raw'], [8, 18, 36]),
    tofu: row(0.1, 0.2, 2.4, 0, 2.2, 1.6, 0.2, 2.2, 0.3, 8.2, 2.2, 2.8, ['mild', 'beany'], ['silky', 'firm'], ['base'], ['raw', 'seared', 'grilled', 'steamed'], [12, 28, 50]),
    lentil: row(0.2, 0.4, 3.6, 0, 1.2, 3.2, 0.2, 0.4, 0.6, 3.2, 3.4, 3.6, ['earthy', 'beany'], ['firm'], ['base'], dry, [10, 28, 52]),
    chickpea: row(0.2, 0.3, 3.2, 0, 1.4, 3.4, 0.2, 1.4, 0.8, 3.4, 3.4, 4.2, ['earthy', 'nutty'], ['firm'], ['base'], ['boiled', 'roasted', 'pureed'], [10, 28, 52]),
    black_bean: row(0.2, 0.4, 3.8, 0, 1.2, 3.6, 0.2, 0.4, 0.6, 3.2, 3.6, 3.8, ['earthy', 'beany'], ['firm'], ['base'], dry, [10, 28, 52]),
    cod: row(0.2, 0.1, 5.2, 0, 4.2, 3.4, 0.8, 0.6, 0.3, 7.6, 3.8, 4.2, ['marine', 'mild'], ['flaky', 'tender'], ['base'], [...base, 'steamed'], [18, 42, 70]),
    shrimp: row(0.2, 0.1, 6.4, 0, 4.6, 4.8, 1.2, 0.6, 0.6, 7.4, 4.8, 4.4, ['marine', 'sweet'], ['firm', 'tender'], ['base', 'umami'], base, [12, 28, 48]),
    tuna: row(0.2, 0.2, 6.6, 0, 3.6, 5.2, 1, 1.6, 0.3, 6.8, 5.2, 5.4, ['marine', 'meaty'], ['firm', 'flaky'], ['base', 'umami'], ['raw', 'seared', 'grilled'], [16, 38, 64]),
    milk: row(0.2, 0.1, 1.8, 0, 1.4, 2.2, 0.4, 3.2, 2.4, 8.8, 2.4, 1, ['dairy', 'mild'], ['silky'], ['sauce'], ['raw', 'sauce'], [6, 16, 40]),
    yogurt: row(3.6, 0.2, 2.2, 0.2, 2.8, 3.2, 0.4, 2.2, 1.8, 8.4, 3.6, 2.2, ['dairy', 'fermented'], ['creamy'], ['acid', 'sauce'], ['raw', 'sauce'], [6, 16, 36]),
    cheddar: row(0.6, 0.4, 6.4, 0.2, 0.6, 5.4, 3.2, 6.8, 0.4, 3.8, 5.6, 4.2, ['dairy', 'savory'], ['firm'], ['fat', 'umami'], ['raw'], [4, 12, 28]),
    mozzarella: row(0.3, 0.1, 4.2, 0, 1.2, 3.2, 1.6, 4.6, 0.6, 5.4, 3.4, 2.8, ['dairy', 'mild'], ['tender', 'silky'], ['fat'], ['raw'], [6, 16, 34]),
    rice: row(0.1, 0.1, 1.2, 0, 0.8, 1.4, 0.1, 0.2, 0.6, 3.2, 1.6, 2.2, ['mild', 'grain'], ['tender'], ['base'], dry, [16, 36, 62]),
    wheat_flour: row(0.1, 0.2, 1.4, 0, 0.4, 1.6, 0.1, 0.3, 0.4, 1.2, 1.6, 1.4, ['grain', 'mild'], ['crumbly'], ['base'], ['sauce'], [8, 24, 48]),
    pasta: row(0.1, 0.1, 1.6, 0, 0.6, 1.4, 0.2, 0.3, 0.4, 2.4, 1.8, 3.2, ['grain', 'mild'], ['firm'], ['base'], dry, [16, 36, 62]),
    oat: row(0.1, 0.2, 1.4, 0, 0.8, 2.4, 0.1, 1.4, 0.8, 2.2, 2.4, 2.6, ['grain', 'nutty'], ['tender'], ['base'], dry, [12, 30, 55]),
    bread: row(0.2, 0.3, 2.2, 0, 0.8, 3.6, 1.8, 1.2, 1.4, 3.4, 3.2, 4.6, ['grain', 'toasted'], ['firm', 'crisp'], ['base'], ['raw', 'roasted'], [10, 28, 52]),
    corn: row(0.2, 0.1, 2.4, 0, 3.6, 3.8, 0.2, 0.8, 4.2, 7.2, 3.6, 4.2, ['sweet', 'grain'], ['juicy', 'firm'], ['sweetener'], ['raw', 'boiled', 'grilled', 'roasted'], [8, 22, 42]),
    onion: row(0.4, 0.6, 2.8, 4.6, 3.2, 6.4, 0.2, 0.1, 2.4, 8.6, 6.2, 3.8, ['onion', 'sulfurous'], ['crisp', 'juicy'], ['aromatic'], ['raw', 'roasted', 'caramelized', 'grilled'], [4, 12, 28]),
    tomato: row(3.8, 0.2, 4.2, 0.1, 4.8, 4.6, 0.2, 0.2, 2.6, 9.2, 4.4, 3.2, ['fruity', 'savory'], ['juicy'], ['acid', 'freshness'], ['raw', 'roasted', 'sauce'], [8, 22, 46]),
    carrot: row(0.2, 0.2, 1.6, 0.1, 3.8, 3.4, 0.2, 0.1, 4.6, 8.4, 3.4, 5.2, ['sweet', 'earthy'], ['crisp', 'firm'], ['sweetener'], veg, [6, 18, 40]),
    celery: row(0.3, 0.8, 1.8, 0.4, 5.2, 4.2, 0.4, 0.1, 0.8, 9.2, 4.2, 5.4, ['green', 'fresh'], ['crisp', 'fibrous'], ['freshness', 'aromatic'], ['raw', 'boiled'], [4, 12, 28]),
    bell_pepper: row(0.4, 0.2, 1.4, 0.2, 5.4, 4.4, 0.1, 0.1, 2.8, 9.1, 4.2, 4.6, ['green', 'sweet'], ['crisp', 'juicy'], ['freshness'], ['raw', 'roasted', 'grilled'], [6, 16, 36]),
    spinach: row(0.6, 1.4, 2.6, 0.1, 5.6, 3.6, 0.2, 0.2, 0.4, 9, 3.8, 2.4, ['green', 'earthy'], ['tender'], ['freshness'], ['raw', 'steamed', 'boiled'], [6, 16, 36]),
    broccoli: row(0.4, 1.2, 2.4, 0.2, 5.2, 3.8, 0.2, 0.2, 0.8, 8.8, 3.8, 4.4, ['green', 'cabbage'], ['firm', 'fibrous'], ['freshness'], veg, [8, 20, 42]),
    cabbage: row(0.4, 0.8, 1.8, 0.6, 4.6, 3.6, 0.2, 0.1, 1.4, 9, 3.6, 4.8, ['cabbage', 'green'], ['crisp'], ['freshness'], ['raw', 'boiled', 'fermented', 'roasted'], [8, 22, 46]),
    lettuce: row(0.2, 0.3, 0.8, 0.1, 6.4, 2.4, 0.1, 0.1, 0.6, 9.4, 2.6, 3.2, ['green', 'fresh'], ['crisp', 'juicy'], ['freshness'], ['raw'], [8, 22, 48]),
    eggplant: row(0.2, 0.8, 1.6, 0.1, 2.2, 3.2, 0.1, 0.2, 1.2, 9, 3.2, 3.6, ['earthy', 'mild'], ['tender'], ['base'], ['roasted', 'grilled', 'pureed'], [8, 22, 46]),
    zucchini: row(0.3, 0.2, 1.2, 0.1, 4.4, 2.6, 0.1, 0.2, 1.2, 9.2, 2.8, 3.4, ['green', 'mild'], ['tender', 'juicy'], ['freshness'], veg, [8, 20, 44]),
    pea: row(0.2, 0.2, 2.8, 0, 4.2, 3.4, 0.1, 0.3, 3.4, 7.6, 3.4, 3.8, ['sweet', 'green'], ['tender'], ['sweetener'], ['raw', 'boiled', 'steamed'], [6, 16, 34]),
    green_bean: row(0.2, 0.3, 1.8, 0.1, 4.8, 2.8, 0.1, 0.2, 1.2, 8.8, 3, 4.2, ['green', 'fresh'], ['crisp', 'fibrous'], ['freshness'], veg, [6, 16, 36]),
    leek: row(0.3, 0.4, 2.4, 2.8, 3.6, 5.2, 0.2, 0.2, 2.2, 8.6, 5, 3.2, ['onion', 'sweet'], ['tender', 'fibrous'], ['aromatic'], ['raw', 'boiled', 'roasted', 'caramelized'], [4, 12, 28]),
    banana: row(0.3, 0.1, 0.4, 0, 2.2, 4.2, 0.1, 0.2, 7.4, 7.4, 4.2, 2.4, ['sweet', 'fruity'], ['tender', 'creamy'], ['sweetener'], ['raw'], [6, 16, 34]),
    strawberry: row(3.4, 0.2, 0.3, 0, 4.6, 5.6, 0.1, 0.2, 5.8, 8.8, 5.2, 3.2, ['fruity', 'floral'], ['juicy'], ['acid', 'sweetener'], ['raw', 'sauce'], [6, 16, 34]),
    blueberry: row(2.8, 0.4, 0.2, 0, 3.6, 4.4, 0.1, 0.2, 5.2, 8.2, 4.4, 2.6, ['fruity', 'floral'], ['juicy'], ['sweetener'], ['raw', 'sauce'], [4, 12, 28]),
    grape: row(2.4, 0.3, 0.2, 0, 3.4, 4.2, 0.1, 0.1, 6.6, 8, 4.2, 2.8, ['fruity', 'floral'], ['juicy'], ['sweetener'], ['raw'], [6, 16, 34]),
    pineapple: row(4.6, 0.2, 0.2, 0.4, 4.8, 6.2, 0.1, 0.1, 6.8, 8.4, 5.8, 3.6, ['fruity', 'tropical'], ['juicy', 'fibrous'], ['acid', 'sweetener'], ['raw', 'grilled', 'sauce'], [6, 16, 34]),
    peach: row(2.2, 0.1, 0.2, 0, 3.2, 5.2, 0.1, 0.1, 6.4, 8.4, 4.8, 3.2, ['fruity', 'floral'], ['juicy'], ['sweetener'], ['raw', 'grilled'], [6, 16, 34]),
    pear: row(1.4, 0.2, 0.2, 0, 2.8, 3.8, 0.1, 0.1, 5.6, 8.2, 3.8, 3.4, ['fruity', 'floral'], ['juicy'], ['sweetener'], ['raw'], [6, 16, 34]),
    cumin: row(0.2, 1.2, 1.4, 2.4, 0.4, 8.4, 0.2, 1.6, 0.6, 0.8, 8.2, 2.4, ['earthy', 'warm', 'spice'], ['crumbly'], ['spice', 'aromatic'], herb, [0.05, 0.4, 1.6]),
    paprika: row(0.2, 0.4, 1.6, 2.8, 0.6, 7.2, 0.2, 1.2, 1.4, 1, 7.2, 1.6, ['sweet', 'pepper', 'warm'], ['crumbly'], ['spice'], herb, [0.1, 0.6, 2]),
    cinnamon: row(0.1, 0.6, 0.2, 0.8, 0.2, 8.6, 0.1, 0.3, 3.2, 0.8, 8.4, 1.4, ['sweet', 'warm', 'woody'], ['crumbly'], ['spice', 'aromatic'], herb, [0.05, 0.35, 1.4]),
    basil: row(0.2, 0.3, 0.6, 0.4, 6.4, 8.2, 0.1, 0.2, 0.4, 8.6, 8, 2.2, ['herbal', 'green', 'anise'], ['tender'], ['aromatic', 'freshness'], herb, [0.4, 2, 6]),
    parsley: row(0.2, 0.4, 0.8, 0.2, 6.8, 6.4, 0.1, 0.2, 0.3, 8.6, 6.2, 2.4, ['herbal', 'green', 'fresh'], ['tender'], ['aromatic', 'freshness'], herb, [0.4, 2, 6]),
    oregano: row(0.2, 1.4, 0.6, 1.2, 2.4, 8.4, 0.1, 0.4, 0.4, 1.2, 8.2, 2, ['herbal', 'woody'], ['crumbly'], ['aromatic', 'spice'], herb, [0.05, 0.4, 1.6]),
    bay: row(0.1, 1.6, 0.4, 0.6, 1.2, 7.6, 0.1, 0.4, 0.3, 1.4, 7.4, 2.6, ['herbal', 'woody'], ['fibrous'], ['aromatic'], ['sauce', 'boiled'], [0.05, 0.3, 1.2]),
    turmeric: row(0.2, 1.8, 0.6, 1.6, 0.4, 7.4, 0.1, 0.4, 0.6, 1.2, 7.2, 1.6, ['earthy', 'warm', 'bitter'], ['crumbly'], ['spice'], herb, [0.05, 0.4, 1.6]),
    nutmeg: row(0.1, 1.2, 0.3, 1.4, 0.2, 8.2, 0.1, 2.4, 1.6, 0.8, 8, 1.4, ['warm', 'woody', 'sweet'], ['crumbly'], ['spice'], herb, [0.02, 0.15, 0.6]),
    dill: row(0.2, 0.3, 0.4, 0.3, 6.6, 7.4, 0.1, 0.2, 0.3, 8.4, 7.2, 2, ['herbal', 'green', 'anise'], ['tender'], ['aromatic', 'freshness'], herb, [0.3, 1.6, 5]),
    mint: row(0.2, 0.4, 0.2, 0.8, 7.2, 8.6, 0.1, 0.1, 0.6, 8.2, 8.2, 2, ['herbal', 'fresh', 'cool'], ['tender'], ['aromatic', 'freshness'], herb, [0.2, 1.2, 4]),
    olive_oil: row(0.1, 0.3, 0.2, 0.4, 1.6, 5.4, 0.1, 9.6, 0.2, 0.2, 5.2, 1, ['fruity', 'green'], ['silky'], ['fat'], ['raw', 'sauce'], [2, 8, 18]),
    white_vinegar: row(8.6, 0.2, 0.2, 0.6, 3.2, 5.6, 0.1, 0, 0.2, 9.4, 7.4, 1, ['vinegar', 'clean'], ['silky'], ['acid', 'sauce'], ['sauce', 'pickled'], [0.4, 2, 6]),
    sugar: row(0, 0, 0, 0, 0.2, 1.2, 0, 0, 9.6, 0.2, 6.4, 1.2, ['sweet', 'clean'], ['crumbly'], ['sweetener'], ['raw', 'caramelized', 'sauce'], [0.5, 4, 14]),
    salt: row(0, 0.2, 0.4, 0.2, 0.2, 1.4, 9.6, 0, 0, 0.2, 8.4, 2.4, ['saline', 'clean'], ['crumbly'], ['spice'], ['raw'], [0.2, 1.2, 2.5]),
    mustard: row(3.2, 0.4, 1.2, 6.8, 2.2, 7.2, 2.4, 1.6, 0.8, 7.6, 7.4, 2.2, ['pungent', 'vinegar'], ['creamy'], ['spice', 'acid'], ['raw', 'sauce'], [0.4, 2, 6]),
    almond: row(0.1, 0.6, 1.2, 0, 0.6, 4.6, 0.1, 7.2, 1.4, 1.2, 4.4, 5.6, ['nutty', 'sweet'], ['crunchy', 'firm'], ['fat'], ['raw', 'roasted'], [2, 8, 18]),
    peanut: row(0.1, 0.4, 2.4, 0, 0.4, 5.2, 0.2, 7.4, 1.2, 1.2, 5, 5.2, ['nutty', 'roasted'], ['crunchy', 'firm'], ['fat', 'umami'], ['raw', 'roasted'], [2, 8, 18]),
    coffee: row(1.6, 6.4, 0.8, 0.4, 0.6, 8.8, 0.1, 0.1, 0.4, 9.6, 8.4, 1, ['bitter', 'roasted'], ['silky'], ['aromatic'], ['raw'], [4, 12, 30]),
    cocoa: row(0.4, 6.8, 1.2, 0.2, 0.2, 8.2, 0.1, 2.4, 0.6, 0.6, 8, 2.2, ['chocolate', 'bitter'], ['crumbly'], ['aromatic'], ['sauce'], [0.4, 2, 8]),
    vanilla: row(0.2, 0.3, 0.2, 0.2, 0.4, 8.8, 0.1, 0.2, 4.6, 5.4, 8.4, 1, ['sweet', 'floral', 'warm'], ['silky'], ['aromatic', 'sweetener'], ['sauce', 'raw'], [0.1, 0.6, 2]),
    coconut: row(0.2, 0.2, 0.6, 0, 2.2, 5.6, 0.2, 6.4, 3.4, 4.6, 5.2, 4.4, ['sweet', 'tropical', 'nutty'], ['firm', 'fibrous'], ['fat', 'sweetener'], ['raw', 'roasted'], [3, 10, 24]),
    olive: row(0.8, 1.2, 3.4, 0.2, 1.4, 5.8, 4.6, 6.2, 0.4, 6.4, 5.6, 3.6, ['fruity', 'briny'], ['firm'], ['fat', 'umami'], ['raw'], [2, 6, 14]),
    shallot: row(0.3, 0.4, 2.2, 3.4, 3.4, 5.8, 0.1, 0.1, 2.8, 8.4, 5.6, 3.4, ['onion', 'sweet'], ['crisp'], ['aromatic'], ['raw', 'roasted', 'caramelized'], [2, 6, 16]),
    sweet_potato: row(0.2, 0.2, 1.6, 0, 2.4, 3.6, 0.2, 0.2, 5.4, 7.4, 3.6, 4.2, ['sweet', 'earthy'], ['tender', 'firm'], ['sweetener', 'base'], ['roasted', 'boiled', 'steamed', 'pureed'], [10, 26, 48]),
    asparagus: row(0.3, 1.2, 2.6, 0.1, 5.4, 4.2, 0.1, 0.2, 1.2, 9, 4, 4.2, ['green', 'earthy'], ['fibrous', 'tender'], ['freshness'], ['steamed', 'roasted', 'grilled', 'raw'], [6, 16, 34]),
    kale: row(0.4, 2.4, 2.2, 0.2, 5.8, 4.2, 0.2, 0.4, 0.4, 8.6, 4.4, 4.6, ['green', 'bitter'], ['fibrous', 'firm'], ['freshness'], ['raw', 'steamed', 'roasted'], [6, 16, 36]),
    cranberry: row(6.4, 1.4, 0.2, 0.2, 3.8, 4.8, 0.1, 0.1, 2.4, 8.6, 5.6, 3.4, ['fruity', 'tart'], ['firm', 'juicy'], ['acid'], ['raw', 'sauce'], [3, 8, 18]),
    fig: row(0.8, 0.2, 0.6, 0, 1.6, 5.2, 0.1, 0.2, 7.6, 4.2, 5, 2.8, ['sweet', 'fruity', 'honey'], ['tender', 'sticky'], ['sweetener'], ['raw'], [4, 12, 26]),
    apricot: row(3.2, 0.2, 0.2, 0, 3.4, 4.8, 0.1, 0.1, 5.8, 8.4, 4.6, 3.2, ['fruity', 'floral'], ['juicy'], ['acid', 'sweetener'], ['raw'], [4, 12, 28]),
    clove: row(0.2, 1.6, 0.2, 3.2, 0.2, 9.2, 0.1, 0.8, 1.2, 0.8, 9, 1.6, ['warm', 'woody', 'spice'], ['crumbly'], ['spice'], herb, [0.02, 0.12, 0.5]),
    cardamom: row(0.2, 0.6, 0.2, 1.6, 1.2, 8.8, 0.1, 0.4, 1.4, 0.8, 8.6, 1.4, ['floral', 'citrus', 'warm'], ['crumbly'], ['spice', 'aromatic'], herb, [0.02, 0.2, 0.8]),
    coriander_seed: row(0.2, 0.4, 0.3, 0.8, 1.4, 7.6, 0.1, 1.2, 0.6, 0.8, 7.4, 2.2, ['citrus', 'warm', 'spice'], ['crumbly'], ['spice', 'aromatic'], herb, [0.05, 0.35, 1.4]),
    white_wine: row(4.8, 0.6, 0.4, 0.2, 2.4, 5.8, 0.2, 0, 1.2, 8.8, 5.4, 1, ['fruity', 'acid'], ['silky'], ['acid', 'sauce'], ['sauce', 'raw'], [2, 8, 20]),
    sour_cream: row(2.8, 0.2, 1.6, 0.1, 1.4, 3.2, 0.4, 6.4, 0.8, 7.2, 3.6, 1.6, ['dairy', 'fermented'], ['creamy'], ['fat', 'acid'], ['raw', 'sauce'], [4, 12, 28]),
    feta: row(1.8, 0.3, 4.6, 0.1, 1.2, 5.2, 4.8, 5.2, 0.4, 5.2, 5.4, 3.6, ['dairy', 'briny'], ['crumbly'], ['fat', 'umami'], ['raw'], [3, 10, 22]),
    anchovy: row(0.3, 0.2, 8.4, 0.4, 1.2, 7.6, 6.4, 2.4, 0.2, 5.8, 7.8, 2.8, ['marine', 'savory', 'briny'], ['firm'], ['umami', 'spice'], ['raw', 'sauce'], [0.4, 1.6, 4]),
    quinoa: row(0.1, 0.3, 1.8, 0, 0.8, 2.6, 0.1, 1.2, 0.4, 2.4, 2.6, 3.2, ['grain', 'nutty'], ['firm'], ['base'], dry, [12, 30, 55]),
    barley: row(0.1, 0.3, 1.6, 0, 0.6, 2.4, 0.1, 0.4, 0.5, 2.2, 2.4, 3.4, ['grain', 'earthy'], ['firm'], ['base'], dry, [12, 30, 55]),
    tilapia: row(0.2, 0.1, 4.6, 0, 3.4, 2.8, 0.6, 1.2, 0.3, 7.4, 3.2, 4.2, ['marine', 'mild'], ['flaky', 'tender'], ['base'], [...base, 'steamed'], [18, 42, 70]),
};
