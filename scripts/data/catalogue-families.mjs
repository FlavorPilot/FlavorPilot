/** AI-authored starting hypotheses, not USDA sensory measurements.
 * The compact manifest supplies food-specific axes; refinements below describe exceptions.
 * Scale 0–10 matches the existing product-hypothesis-1. No random/hash-derived values.
 */
const veg = ['raw', 'boiled', 'steamed', 'roasted', 'grilled'];
const base = ['raw', 'seared', 'roasted', 'grilled', 'steamed'];
const family = (axes, values, aromas, textures, roles, preparations, share, rationale) => ({
  axes, profile: Object.fromEntries(['sweetness','acidity','saltiness','bitterness','umami','fat','pungency','freshness','aromaIntensity','moisture'].map((key,i)=>[key,values[i]])),
  aromas, textures, roles, preparations, share: { min: share[0], ideal: share[1], max: share[2] }, rationale,
});
export const families = {
  fruit: family(['sweetness','acidity','aromaIntensity'], [5,4,0.1,0.5,0.3,0.3,0,7,5,8], ['fruity','sweet'], ['juicy','tender'], ['sweetener','freshness'], ['raw','roasted','sauce'], [4,15,40], 'Fruit sweetness/acidity and aromatic strength; a fresh counterpoint rather than a protein base.'),
  dried_fruit: family(['sweetness','acidity','aromaIntensity'], [8,3,0.1,0.5,0.6,0.4,0,1.5,6,2], ['fruity','caramelized'], ['sticky','tender'], ['sweetener'], ['raw','sauce'], [2,6,18], 'Concentrated fruit character, chewy texture and smaller working share than fresh fruit.'),
  vegetable: family(['sweetness','bitterness','freshness'], [2,0.6,0.2,1,2,0.3,0.3,6,3,8], ['green','earthy'], ['firm','juicy'], ['base','freshness'], veg, [8,25,55], 'Mild vegetable body, moisture and freshness; heat changes use the existing preparation hypotheses.'),
  root: family(['sweetness','aromaIntensity','textureIntensity'], [2,0.3,0.1,0.5,1.5,0.3,0,2,3,5.5], ['earthy','mild'], ['firm','fibrous'], ['base'], ['raw','boiled','steamed','roasted'], [12,30,65], 'Starchy root body and firm texture, used as a substantial base. Raw means source state, not advice to eat raw.'),
  leaf: family(['bitterness','pungency','freshness'], [1,0.6,0.3,2,1.5,0.3,0,7,4,9], ['green','herbal'], ['tender','fibrous'], ['freshness'], ['raw','steamed','seared','boiled'], [3,12,35], 'Leafy green freshness and bitterness, with peppery heat only where specified.'),
  sprout: family(['freshness','bitterness','aromaIntensity'], [1.5,0.4,0.2,1,2,0.4,0.5,8,3,8.5], ['green','beany'], ['crisp','tender'], ['freshness','texture'], ['raw','steamed','seared'], [3,10,25], 'Fresh green/beany character with light crisp contrast.'),
  aromatic: family(['pungency','sweetness','aromaIntensity'], [1,0.7,0.2,1,1.5,0.2,5,6,6,8], ['green','pungent'], ['crisp','fibrous'], ['aromatic','spice'], ['raw','seared','roasted','sauce'], [0.5,3,12], 'Pungent aromatic accent; working share is smaller than a mild vegetable base.'),
  mushroom: family(['umami','aromaIntensity','textureIntensity'], [0.5,0.3,0.3,0.6,6,0.4,0,2,5,8], ['earthy','savory'], ['tender','firm'], ['base','umami'], base, [6,20,45], 'Earthy umami and substantial texture; species differ in aromatic intensity.'),
  seaweed: family(['umami','saltiness','aromaIntensity'], [0.4,0.4,3,1.5,7,0.3,0,3,6,8], ['marine','savory'], ['silky','firm'], ['umami'], ['raw','boiled','sauce'], [0.5,3,12], 'Marine aroma and umami with a restrained accent share; saltiness is a sensory guess, not sodium conversion.'),
  nut: family(['fat','bitterness','aromaIntensity'], [1.5,0.2,0.2,1,2,7,0,1,5,1], ['nutty','earthy'], ['crunchy','firm'], ['fat','texture'], ['raw','roasted'], [2,8,22], 'Nut/seed richness and crunch; individual bitterness and aroma vary.'),
  nut_paste: family(['fat','sweetness','aromaIntensity'], [2,0.2,0.2,0.7,2,7,0,0.5,6,2], ['nutty','sweet'], ['creamy','sticky'], ['fat','sauce'], ['raw','sauce'], [2,8,22], 'Rich nut paste used as a creamy binder, with explicit coconut-liquid exceptions.'),
  juice: family(['sweetness','acidity','aromaIntensity'], [5,5,0.1,0.3,0.2,0.1,0,7,6,9], ['fruity','citrus'], ['juicy'], ['acid','sauce'], ['raw','sauce'], [1,6,20], 'Liquid fruit acidity and aroma, typically used in a sauce or dressing.'),
  grain: family(['sweetness','aromaIntensity','textureIntensity'], [1,0.2,0.1,0.5,1.5,0.6,0,0.7,3,1.5], ['grain','nutty'], ['firm'], ['base'], ['raw','boiled','steamed'], [10,28,60], 'Dry grain/flour source state; mild cereal body. Cooking water/yield is not inferred in the nutrient reference.'),
  legume: family(['umami','sweetness','aromaIntensity'], [1,0.2,0.1,0.5,3,0.6,0,1,4,1.5], ['beany','earthy'], ['firm'], ['base'], ['raw','boiled','steamed'], [8,25,55], 'Dry pulse body and earthy/beany umami, at the dry reference state.'),
  fresh_legume: family(['sweetness','umami','freshness'], [3,0.3,0.2,0.6,3,1,0,6,3.5,7], ['beany','green'], ['firm','tender'], ['base','freshness'], veg, [6,20,45], 'Fresh immature legume sweetness, moisture and green character.'),
  cheese: family(['saltiness','fat','aromaIntensity'], [0.5,1,4,0.5,6,7,0.1,0.6,6,4], ['dairy','savory'], ['firm'], ['fat','umami'], ['raw'], [3,10,28], 'Fermented dairy richness and umami; salt and aroma distinguish each cheese.'),
  dairy: family(['fat','acidity','sweetness'], [2,1,0.4,0.1,2,3,0,1.5,3,8.5], ['dairy','mild'], ['silky','creamy'], ['sauce'], ['raw','sauce'], [5,18,45], 'Dairy sauce body with individual fat, tang and sweetness.'),
  egg: family(['fat','umami','textureIntensity'], [0.3,0.1,0.8,0.1,5,5,0,1,3.5,7], ['savory','mild'], ['tender','creamy'], ['base','umami'], ['raw','boiled','seared'], [6,18,38], 'Egg protein/body with richer yolk and leaner white explicitly separated.'),
  fish: family(['fat','umami','aromaIntensity'], [0.3,0.2,1,0.2,5,2,0,3.5,4,7.5], ['marine','savory'], ['flaky','tender'], ['base','umami'], base, [18,42,70], 'Species-specific richness, marine aroma and savory body; no safety or raw-eating claim.'),
  shellfish: family(['sweetness','umami','textureIntensity'], [2,0.2,1.5,0.2,6,0.8,0,3.5,5,7.5], ['marine','sweet'], ['firm','tender'], ['base','umami'], base, [12,30,55], 'Shellfish sweetness/umami with species-specific firmness.'),
  meat: family(['fat','umami','aromaIntensity'], [0.3,0.2,1,0.3,6,3,0,1,6,6.5], ['meaty','savory'], ['firm','tender'], ['base','umami'], base, [22,46,74], 'Distinct species/game meat savoriness, richness and aromatic strength.'),
  offal: family(['bitterness','umami','aromaIntensity'], [0.6,0.3,1,2,8,3.5,0,0.5,8,6], ['meaty','earthy'], ['tender'], ['base','umami'], ['raw','seared','roasted','boiled'], [5,18,40], 'Concentrated organ character and potential bitterness; hearts/tongue have firmer exceptions.'),
  spice: family(['pungency','bitterness','aromaIntensity'], [0.5,0.3,0.1,3,1,1.5,2,0.5,8,1], ['spicy','herbal'], ['fibrous'], ['spice','aromatic'], ['raw','roasted','sauce'], [0.1,0.6,2.5], 'Concentrated spice aroma; heat and bitterness are separate food-specific axes.'),
  oil: family(['aromaIntensity','bitterness','sweetness'], [0,0.1,0,1,0.1,10,0,0.1,3,0], ['nutty','mild'], ['silky'], ['fat'], ['raw','sauce'], [1,5,14], 'Oil/fat richness and aromatic character, at a small dressing/cooking share.'),
  sweetener: family(['sweetness','bitterness','aromaIntensity'], [9,0.3,0.1,0.5,0.2,0,0,0,5,2], ['sweet','caramelized'], ['sticky'], ['sweetener'], ['raw','sauce'], [0.5,3,10], 'Concentrated sweetening power, with syrup-specific caramel/malt notes.'),
  chocolate: family(['sweetness','bitterness','aromaIntensity'], [5,0.5,0.2,6,2,8,0,0,8,0.5], ['roasted','sweet'], ['firm','creamy'], ['fat','sweetener'], ['raw','sauce'], [2,10,25], 'Cocoa bitterness/roast and fat body; sweetness differs by chocolate style.'),
  condiment: family(['acidity','saltiness','sweetness'], [3,4,5,0.3,4,0.5,1,1,6,7], ['savory','fermented'], ['silky'], ['sauce'], ['raw','sauce'], [0.5,4,14], 'Concentrated ready condiment; individual acidity, salt and sweetness need food-specific overrides.'),
  bread: family(['saltiness','fat','aromaIntensity'], [1.5,0.5,2,0.4,2,1,0,0.5,4,3.5], ['grain','roasted'], ['tender','crumbly'], ['base'], ['raw','roasted','grilled'], [8,25,55], 'Bread/dough cereal body, with distinct fat and crust/breadcrumb texture refinements. Unbaked dough keeps its reference state.'),
  cured_meat: family(['saltiness','fat','aromaIntensity'], [0.5,0.7,7,0.4,8,7,1,0,8,4.5], ['meaty','smoky'], ['firm'], ['umami','fat'], ['raw','seared','roasted','grilled'], [2,10,25], 'Cured/seasoned meat has concentrated salt, fat and aroma at a smaller accent share than plain meat.'),
  baking: family(['umami','aromaIntensity','saltiness'], [0,0,0.1,0,1,0,0,0,1,0.5], ['mild'], ['crumbly'], ['texture'], ['raw','sauce'], [0.1,1,3], 'Baking/setting ingredient: neutral gelatin versus aromatic yeast. No prediction of fermentation or gel strength.'),
  drink: family(['bitterness','acidity','aromaIntensity'], [0,1,0,3,0,0,0,2,4,9.5], ['herbal'], ['juicy'], ['sauce'], ['raw','sauce'], [2,10,35], 'Brewed liquid aroma/bitter/tart contribution; alcohol evaporation and cooking yield are not inferred.'),
};

// Food-specific culinary distinctions not expressible by the three manifest axes.
export const refinements = {};
const refine = (ids, changes) => { for (const id of ids.split(' ')) refinements[id] = { ...refinements[id], ...changes }; };
refine('pomelo grapefruit grapefruit_juice', { bitterness: 4, aromas: ['citrus','bitter'] });
refine('clementine mandarin kumquat', { aromas: ['citrus','fruity'] });
refine('rhubarb quince', { textures: ['firm','fibrous'], roles: ['acid'], share: { min: 2, ideal: 10, max: 25 } });
refine('tamarind', { moisture: 3, roles: ['acid','sweetener'], textures: ['sticky'], share: { min: 0.5, ideal: 3, max: 10 } });
refine('durian', { fat: 3, freshness: 2, aromas: ['fruity','sulfurous'], textures: ['creamy'] });
refine('breadfruit', { freshness: 2, moisture: 6, aromas: ['grain','mild'], textures: ['firm'], roles: ['base'], preparations: ['raw','boiled','roasted'], share: { min: 12, ideal: 30, max: 65 } });
refine('roselle acerola blackcurrant redcurrant', { roles: ['acid','freshness'], share: { min: 1, ideal: 6, max: 20 } });
refine('tomatillo sorrel', { acidity: 6, roles: ['acid','freshness'] });
refine('bitter_melon', { roles: ['base'], aromas: ['green','bitter'] });
refine('fennel_bulb', { aromas: ['anise','green'], aromaIntensity: 7 });
refine('okra jute_leaf', { textures: ['silky','tender'] });
refine('lotus_root water_chestnut jicama', { textures: ['crisp','juicy'], roles: ['base','texture'], textureIntensity: 7 });
refine('palm_heart bamboo_shoot', { textures: ['firm','fibrous'] });
refine('grape_leaf', { acidity: 3 });
refine('epazote', { aromaIntensity: 8, roles: ['aromatic'], share: { min: 0.2, ideal: 1, max: 4 } });
refine('lemongrass', { aromas: ['citrus','herbal'], share: { min: 0.2, ideal: 1, max: 4 } });
refine('wasabi_root', { share: { min: 0.1, ideal: 0.5, max: 2 } });
refine('jalapeno serrano hungarian_pepper', { aromas: ['green','spicy'] });
refine('wood_ear', { textures: ['crisp','firm'] });
refine('snail', { aromas: ['earthy','savory'], fat: 1, freshness: 1 });
refine('oyster', { saltiness: 4, textures: ['silky','tender'] });
refine('squid octopus cuttlefish abalone', { textures: ['firm'], preparations: ['raw','seared','grilled','boiled'] });
refine('chia flaxseed', { textures: ['firm','sticky'], textureIntensity: 3 });
refine('chestnut lotus_seed', { roles: ['base','texture'], textures: ['firm'], moisture: 5, preparations: ['raw','boiled','roasted'], share: { min: 5, ideal: 18, max: 40 } });
refine('almond_paste', { roles: ['sweetener','fat'] });
refine('coconut_milk coconut_cream', { aromas: ['tropical','sweet'], textures: ['creamy','silky'], moisture: 7, share: { min: 5, ideal: 18, max: 45 } });
refine('coconut_water', { aromas: ['tropical','mild'], roles: ['sauce'], share: { min: 5, ideal: 18, max: 45 } });
refine('soybean soy_flour', { fat: 3 });
refine('soy_flour', { textures: ['crumbly'], textureIntensity: 2 });
refine('rice_flour brown_rice_flour corn_flour oat_flour rye_flour wholewheat_flour barley_flour malt_flour sorghum_flour triticale_flour semolina', { textures: ['crumbly'], textureIntensity: 2 });
refine('brie camembert neufchatel cream_cheese soft_goat_cheese ricotta cottage_cheese', { textures: ['creamy','tender'], textureIntensity: 2.5 });
refine('ricotta cottage_cheese', { umami: 3, freshness: 2, acidity: 2, moisture: 7, share: { min: 5, ideal: 20, max: 45 } });
refine('gjetost', { sweetness: 6, aromas: ['dairy','caramelized'] });
refine('roquefort limburger camembert', { aromas: ['dairy','fermented'], umami: 7 });
refine('romano cotija', { textures: ['crumbly','firm'], moisture: 2, share: { min: 1, ideal: 5, max: 15 } });
refine('soft_goat_cheese hard_goat_cheese', { acidity: 3, aromas: ['dairy','fermented'] });
refine('greek_yogurt buttermilk acid_whey', { aromas: ['dairy','fermented'], roles: ['acid','sauce'] });
refine('condensed_milk', { roles: ['sweetener','sauce'], moisture: 3, share: { min: 1, ideal: 5, max: 18 } });
refine('egg_white', { moisture: 9, textures: ['silky'], roles: ['base'] });
refine('egg_yolk', { moisture: 5, roles: ['fat','sauce'], share: { min: 2, ideal: 7, max: 18 } });
refine('chicken_heart pork_heart beef_heart lamb_tongue', { textures: ['firm','tender'], textureIntensity: 6 });
refine('duck_liver goose_liver', { fat: 5, textures: ['creamy','tender'] });
refine('caraway anise fennel_seed', { aromas: ['anise','spicy'] });
refine('sage savory marjoram tarragon chervil', { aromas: ['herbal','earthy'] });
refine('garlic_powder onion_powder', { aromas: ['pungent','savory'], umami: 3, sweetness: 2 });
refine('poppy_seed', { fat: 6, roles: ['texture','fat'], textures: ['crunchy'], share: { min: 0.5, ideal: 3, max: 10 } });
refine('curry_powder chili_powder', { aromas: ['spicy','earthy'] });
refine('saffron', { aromas: ['floral','earthy'], share: { min: 0.01, ideal: 0.05, max: 0.2 } });
refine('mustard_seed', { aromas: ['pungent','spicy'] });
refine('lard ghee', { aromas: ['savory','mild'] });
refine('ghee', { aromas: ['dairy','roasted'] });
refine('coconut_oil', { aromas: ['tropical','sweet'] });
refine('mustard_oil', { pungency: 7, aromas: ['pungent','spicy'] });
refine('cocoa_butter', { aromas: ['roasted','sweet'] });
refine('white_chocolate', { aromas: ['dairy','sweet'] });
refine('red_wine_vinegar cider_vinegar', { umami: 0.1, fat: 0, pungency: 1, roles: ['acid'], aromas: ['fruity','fermented'], share: { min: 0.5, ideal: 2, max: 7 } });
refine('dill_pickle sweet_pickle', { textures: ['crisp','juicy'], freshness: 4, share: { min: 2, ideal: 10, max: 25 } });
refine('sriracha hot_sauce', { pungency: 9, roles: ['spice','sauce'], aromas: ['spicy','fermented'], share: { min: 0.2, ideal: 1, max: 5 } });
refine('horseradish_sauce', { pungency: 9, aromas: ['pungent','spicy'], share: { min: 0.5, ideal: 2, max: 8 } });
refine('fish_sauce yeast_extract', { umami: 10, aromaIntensity: 9, share: { min: 0.2, ideal: 1, max: 4 } });
refine('fish_sauce', { aromas: ['marine','fermented'] });
refine('yeast_extract', { moisture: 3, textures: ['sticky'], aromas: ['savory','fermented'] });
refine('oyster_sauce worcestershire', { umami: 8 });
refine('pesto', { fat: 8, freshness: 6, umami: 6, aromas: ['herbal','nutty'], textures: ['creamy'] });
refine('salsa salsa_verde marinara ketchup', { umami: 5, aromas: ['green','savory'] });
refine('barbecue_sauce', { aromas: ['smoky','caramelized'], aromaIntensity: 8 });
refine('celeriac', { aromas: ['earthy','herbal'] });
refine('caper', { aromas: ['herbal','fermented'], textures: ['firm'], share: { min: 0.5, ideal: 2, max: 8 } });
refine('horseradish', { pungency: 9, aromas: ['pungent','spicy'], share: { min: 0.2, ideal: 1, max: 5 } });
refine('tomato_paste', { umami: 8, moisture: 4, textures: ['sticky'], aromas: ['savory','fruity'] });
refine('tamari', { umami: 9, aromas: ['savory','fermented'], share: { min: 0.5, ideal: 2, max: 7 } });
refine('green_olive', { fat: 5, bitterness: 4, textures: ['firm'], roles: ['fat','umami'], share: { min: 2, ideal: 7, max: 18 } });
refine('tempeh', { moisture: 6, fat: 3, aromas: ['beany','fermented'], preparations: ['raw','seared','roasted','grilled'], textureIntensity: 6, share: { min: 12, ideal: 30, max: 55 } });
refine('hummus', { acidity: 4, umami: 3, moisture: 6, aromas: ['beany','nutty'], share: { min: 4, ideal: 15, max: 35 } });
refine('peanut_flour', { aromas: ['nutty','roasted'], fat: 0.5, textures: ['crumbly'], textureIntensity: 2 });
refine('wheat_gluten', { aromas: ['grain','mild'], textures: ['crumbly'], textureIntensity: 2, share: { min: 1, ideal: 5, max: 20 } });
refine('cornstarch arrowroot_flour', { textures: ['crumbly'], textureIntensity: 1, share: { min: 0.2, ideal: 2, max: 8 } });
refine('potato_flour', { textures: ['crumbly'], textureIntensity: 2 });
refine('rye_bread', { acidity: 2, aromas: ['grain','fermented'] });
refine('breadcrumb', { moisture: 1, textures: ['crunchy','crumbly'], textureIntensity: 7, roles: ['texture'], share: { min: 1, ideal: 5, max: 18 } });
refine('puff_pastry phyllo', { aromas: ['grain','mild'], textures: ['tender'], preparations: ['raw','roasted'] });
refine('chorizo', { pungency: 5, aromas: ['meaty','spicy'] });
refine('salami', { acidity: 2, aromas: ['meaty','fermented'] });
refine('ham', { textures: ['tender'], fat: 4 });
refine('caviar', { saltiness: 8, aromas: ['marine','savory'], fat: 4, textures: ['tender'], share: { min: 0.5, ideal: 3, max: 10 } });
refine('fish_roe', { fat: 4, textures: ['tender'], share: { min: 2, ideal: 10, max: 25 } });
refine('canned_anchovy', { saltiness: 9, moisture: 4, share: { min: 0.5, ideal: 2, max: 8 }, preparations: ['raw','sauce'] });
refine('canned_sardine canned_tuna', { saltiness: 4, preparations: ['raw','sauce'] });
refine('brown_sugar powdered_sugar', { moisture: 0, textures: ['crumbly'] });
refine('apricot_jam', { acidity: 4, aromas: ['fruity','sweet'], moisture: 4 });
refine('gelatin', { aromas: ['mild'] });
refine('baker_yeast', { bitterness: 2, aromas: ['fermented','grain'], share: { min: 0.1, ideal: 0.7, max: 2 } });
refine('beer', { aromas: ['grain','fermented'], sweetness: 1 });
refine('water', { aromas: [], freshness: 0, moisture: 10, intensity: 0, textureIntensity: 0, share: { min: 1, ideal: 20, max: 90 } });
refine('tomato_juice', { umami: 5, aromas: ['green','savory'] });
refine('carrot_juice', { aromas: ['earthy','sweet'] });
refine('apple_juice grape_juice', { aromas: ['fruity','sweet'] });
refine('lemon_zest orange_zest', { aromas: ['citrus','bitter'], roles: ['aromatic'], moisture: 5, fat: 0.2, share: { min: 0.1, ideal: 0.5, max: 2 } });
